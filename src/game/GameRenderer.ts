import gsap from 'gsap'
import { Application, Assets, Container, Sprite, Text, TextStyle } from 'pixi.js'
import {
  BACKGROUND_SPRITE,
  CHARACTER_SPRITES,
  getMonsterSpriteUrl,
  getMonsterWalkSpriteUrl,
} from '@/game/assets'
import type { BattleEvent, DamageEvent, Monster } from '@/types/game'
import { BOSS_SCALE_MULTIPLIER, GROUND_Y_RATIO, MONSTER_HEIGHT_RATIO } from '@/game/layoutConstants'

interface DamageTextObject {
  text: Text
  active: boolean
}

interface MonsterPoolSlot {
  /** 배회 위치(월드 좌표)를 담당 - battle.store의 상태만 반영한다 */
  container: Container
  /** 흔들림/걷기 모션/피격 연출 등 로컬(연출용) 변형을 담당 - container 위치와는 독립적 */
  sprite: Sprite
  monsterId: string | null
}

// 넓은 사냥터에 동시에 배치할 몬스터 스프라이트 풀 크기. battle.store.ts의 MAX_MONSTERS와 같아야 한다.
const MONSTER_POOL_SIZE = 4
const PLAYER_X_RATIO = 0.14

// 캐릭터/몬스터 스프라이트 원본 크기(px). 스테이지 박스 높이 대비 비율로 스케일을 역산하는 데 쓴다.
const CHARACTER_SPRITE_SIZE = 128
const MONSTER_SPRITE_SIZE = 64
// 스프라이트 높이를 스테이지 박스 높이의 이 비율만큼만 차지하도록 제한한다.
// 16:9 박스는 세로 공간이 좁으므로, 고정 배율(px) 대신 비율 기반으로 계산해야 캐릭터가 화면을 뚫고 나가지 않는다.
const PLAYER_HEIGHT_RATIO = 0.48

// 몬스터 걷기 프레임 전환 주기(ms). battle.store의 tick 주기와 무관하게 실제 시간 기준으로 토글한다.
const WALK_FRAME_INTERVAL_MS = 260

// 보스 전용 아트가 없으므로, 같은 스프라이트를 붉게 물들여 일반 몬스터와 구분한다 (크기 배율은 layoutConstants 참고)
const BOSS_TINT = 0xff9a9a

// 스킬 발동 시 캐릭터에 입히는 색(tint). skillId별로 다른 색을 줘 어떤 스킬인지 시각적으로 구분한다.
const SKILL_TINTS: Record<string, number> = {
  fire_ball: 0xff6633,
  meteor_storm: 0x8866ff,
}
const DEFAULT_SKILL_TINT = 0xffcc00

// 데미지 텍스트 풀 크기. MAX_MONSTERS(4, battle.store.ts) × meteor_storm의 hitsPerTarget(3) = 12가
// 한 번에 동시 표시될 수 있는 최대치이고, 여기에 애니메이션이 채 끝나지 않은 이전 히트분 여유를 더한다.
const DAMAGE_POOL_SIZE = 20

// 다단 히트 스킬의 데미지 숫자가 같은 몬스터 위치에 완전히 겹쳐 보이지 않도록 흩뿌리는 랜덤 오프셋 범위(px)
const SKILL_DAMAGE_JITTER_PX = 16

// 다단 히트 스킬의 각 히트를 동시에 띄우지 않고 이 간격(ms)만큼 순차적으로 지연시켜 "연속 타격" 느낌을 준다
const SKILL_HIT_STAGGER_MS = 35

export class GameRenderer {
  private app: Application | null = null
  private root: Container | null = null
  private background: Sprite | null = null
  private playerContainer: Container | null = null
  private playerSprite: Sprite | null = null
  private monsterPool: MonsterPoolSlot[] = []
  private damagePool: DamageTextObject[] = []
  private readonly damagePoolSize = DAMAGE_POOL_SIZE
  private playerScale = 1
  private monsterScale = 1
  private mounted = false
  // gsap.delayedCall은 특정 객체를 target으로 걸지 않아 destroy()의 killTweensOf(obj) 정리 대상에
  // 잡히지 않는다. 스태거 연출을 위해 예약한 콜백을 직접 추적해 언마운트 시 확실히 kill한다.
  private pendingSkillHits: gsap.core.Tween[] = []

  async mount(canvas: HTMLCanvasElement): Promise<void> {
    if (this.mounted) return

    const app = new Application()
    await app.init({
      canvas,
      resizeTo: canvas.parentElement ?? canvas,
      backgroundAlpha: 0,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    })

    this.app = app
    this.root = new Container()
    app.stage.addChild(this.root)

    await this.loadAssets()
    this.createScene()
    this.createDamagePool()
    this.layout()
    window.addEventListener('resize', this.handleResize)

    this.mounted = true
  }

  private async loadAssets(): Promise<void> {
    const restKeys = [
      'slime_normal_rest',
      'slime_fire_rest',
      'slime_spike_rest',
      'slime_block_rest',
      'frog_rest',
    ]

    const urls = [
      BACKGROUND_SPRITE,
      CHARACTER_SPRITES.idle,
      CHARACTER_SPRITES.attack,
      ...restKeys.map((key) => getMonsterSpriteUrl(key)),
      // 배회 중 번갈아 보여줄 걷기(뜀) 프레임도 미리 로드해 전환 시 깜빡임이 없게 한다
      ...restKeys.map((key) => getMonsterWalkSpriteUrl(key, true)),
      ...restKeys.map((key) => getMonsterWalkSpriteUrl(key, false)),
    ]

    await Assets.load(urls)
  }

  private createScene(): void {
    if (!this.root) return

    this.background = Sprite.from(BACKGROUND_SPRITE)
    this.background.anchor.set(0.5, 1)

    this.playerContainer = new Container()
    this.playerSprite = Sprite.from(CHARACTER_SPRITES.idle)
    this.playerSprite.anchor.set(0.5, 1)
    this.playerContainer.addChild(this.playerSprite)

    this.root.addChild(this.background, this.playerContainer)

    this.monsterPool = Array.from({ length: MONSTER_POOL_SIZE }, () => {
      const container = new Container()
      const sprite = Sprite.from(getMonsterSpriteUrl('slime_normal_rest'))
      sprite.anchor.set(0.5, 1)
      container.addChild(sprite)
      container.visible = false
      this.root?.addChild(container)
      return { container, sprite, monsterId: null }
    })
  }

  private createDamagePool(): void {
    if (!this.root) return

    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xfff1a8,
      stroke: { color: 0x3b1f00, width: 4 },
    })

    for (let i = 0; i < this.damagePoolSize; i++) {
      const text = new Text({ text: '', style })
      text.anchor.set(0.5)
      text.visible = false
      this.root.addChild(text)
      this.damagePool.push({ text, active: false })
    }
  }

  private readonly handleResize = (): void => {
    this.layout()
  }

  /** sprite에 걸린 로컬 idle 모션(y 방향 통통 튐)을 다시 건다. 화면 크기가 바뀌어 스케일이 변할 때마다 진폭을 재계산한다. */
  private applyIdleBob(sprite: Sprite, amplitude: number): void {
    gsap.killTweensOf(sprite, 'y')
    sprite.y = 0
    gsap.to(sprite, {
      y: -amplitude,
      duration: 0.55 + Math.random() * 0.15,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
  }

  private layout(): void {
    if (!this.app || !this.background || !this.playerContainer || !this.playerSprite) return

    const width = this.app.screen.width
    const height = this.app.screen.height
    const groundY = height * GROUND_Y_RATIO

    // 고정 px 배율 대신 "스테이지 박스 높이 대비 비율"로 스케일을 역산한다.
    // 16:9 박스는 세로 폭이 좁아서, 화면 너비 기준 배율을 쓰면 캐릭터 키가 박스 높이를 넘어 위아래로 잘려나간다.
    this.playerScale = (PLAYER_HEIGHT_RATIO * height) / CHARACTER_SPRITE_SIZE
    this.monsterScale = (MONSTER_HEIGHT_RATIO * height) / MONSTER_SPRITE_SIZE

    this.background.x = width * 0.5
    this.background.y = groundY
    this.background.width = width
    this.background.height = height

    this.playerContainer.x = width * PLAYER_X_RATIO
    this.playerContainer.y = groundY
    this.playerSprite.scale.set(this.playerScale)
    this.applyIdleBob(this.playerSprite, this.playerScale * CHARACTER_SPRITE_SIZE * 0.05)

    for (const poolSlot of this.monsterPool) {
      poolSlot.sprite.scale.set(this.monsterScale)
      this.applyIdleBob(poolSlot.sprite, this.monsterScale * MONSTER_SPRITE_SIZE * 0.06)
    }
    // 몬스터 container의 x/y(실제 배회 위치)는 store 상태 변화에 맞춰 syncMonsters가 매 틱 갱신한다.
  }

  private getMonsterPoolSlot(monsterId: string): MonsterPoolSlot | null {
    return this.monsterPool.find((s) => s.monsterId === monsterId) ?? null
  }

  /** battle.store의 monsters 배열(배회 위치 포함)과 렌더러의 스프라이트 풀을 동기화한다 */
  syncMonsters(monsters: Monster[]): void {
    if (!this.app) return

    const width = this.app.screen.width
    const groundY = this.app.screen.height * GROUND_Y_RATIO
    const aliveIds = new Set(monsters.map((m) => m.id))

    // 사라진(사망) 몬스터가 쓰던 슬롯을 반납
    for (const poolSlot of this.monsterPool) {
      if (poolSlot.monsterId && !aliveIds.has(poolSlot.monsterId)) {
        gsap.killTweensOf(poolSlot.sprite, 'x,alpha')
        poolSlot.sprite.x = 0
        poolSlot.sprite.alpha = 1
        poolSlot.container.visible = false
        poolSlot.monsterId = null
      }
    }

    // 새로 스폰된 몬스터에게 빈 슬롯을 배정
    const assignedIds = new Set(
      this.monsterPool
        .map((s) => s.monsterId)
        .filter((id): id is string => id !== null),
    )
    for (const monster of monsters) {
      if (assignedIds.has(monster.id)) continue
      const freeSlot = this.monsterPool.find((s) => s.monsterId === null)
      if (!freeSlot) continue

      gsap.killTweensOf(freeSlot.sprite, 'x,alpha')
      freeSlot.sprite.x = 0
      freeSlot.sprite.alpha = 1
      freeSlot.sprite.tint = 0xffffff
      freeSlot.container.visible = true
      freeSlot.monsterId = monster.id
      assignedIds.add(monster.id)
    }

    // 위치(배회 이동) + 걷기 프레임 갱신 -- 살아있는 모든 몬스터에 대해 매번 반영
    const walkFrameA = Math.floor(Date.now() / WALK_FRAME_INTERVAL_MS) % 2 === 0
    for (const monster of monsters) {
      const poolSlot = this.getMonsterPoolSlot(monster.id)
      if (!poolSlot) continue

      poolSlot.container.x = width * monster.x
      poolSlot.container.y = groundY
      // 보스는 전용 아트 없이도 한눈에 구분되도록 더 크게, 붉은 톤으로 렌더링한다.
      poolSlot.sprite.scale.set(monster.isBoss ? this.monsterScale * BOSS_SCALE_MULTIPLIER : this.monsterScale)
      poolSlot.sprite.tint = monster.isBoss ? BOSS_TINT : 0xffffff

      const desiredUrl = monster.moving
        ? getMonsterWalkSpriteUrl(monster.sprite, walkFrameA)
        : getMonsterSpriteUrl(monster.sprite)
      const desiredTexture = Assets.get(desiredUrl)
      if (poolSlot.sprite.texture !== desiredTexture) {
        poolSlot.sprite.texture = desiredTexture
      }
    }
  }

  handleBattleEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'player_attack': {
        const target = this.getMonsterPoolSlot(event.monsterId)
        this.flashAttack()
        this.showDamage({
          value: event.damage,
          x: target?.container.x ?? 0,
          y: (target?.container.y ?? 0) - 60,
          isCritical: event.isCritical,
        })
        break
      }
      case 'skill_use': {
        this.flashSkill(event.skillId)
        event.hits.forEach((hit, index) => {
          const tween = gsap.delayedCall(index * (SKILL_HIT_STAGGER_MS / 1000), () => {
            const target = this.getMonsterPoolSlot(hit.monsterId)
            this.showDamage({
              value: hit.damage,
              x: target?.container.x ?? 0,
              y: (target?.container.y ?? 0) - 80,
              isSkill: true,
            })
            this.pendingSkillHits = this.pendingSkillHits.filter((t) => t !== tween)
          })
          this.pendingSkillHits.push(tween)
        })
        break
      }
      case 'monster_hit':
        this.shakeMonster(event.monsterId)
        break
      case 'monster_spawned':
        break
      case 'monster_killed':
        this.flashMonsterDeath(event.monsterId)
        break
      case 'player_hit':
        this.flashPlayerHit()
        break
    }
  }

  private flashSkill(skillId: string): void {
    if (!this.playerSprite) return

    const tint = SKILL_TINTS[skillId] ?? DEFAULT_SKILL_TINT
    this.playerSprite.tint = tint
    gsap.to(this.playerSprite.scale, {
      x: this.playerScale * 1.2,
      y: this.playerScale * 1.2,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (this.playerSprite) {
          this.playerSprite.tint = 0xffffff
          this.playerSprite.scale.set(this.playerScale)
        }
      },
    })
  }

  private flashAttack(): void {
    if (!this.playerSprite) return
    this.playerSprite.texture = Assets.get(CHARACTER_SPRITES.attack)

    // 제자리에 서 있는 느낌을 덜기 위해 공격할 때 살짝 앞으로 내딛는 연출을 더한다.
    gsap.killTweensOf(this.playerSprite, 'x')
    const lunge = this.playerScale * CHARACTER_SPRITE_SIZE * 0.12
    gsap.to(this.playerSprite, {
      x: lunge,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: 'power1.out',
    })

    gsap.delayedCall(0.15, () => {
      if (this.playerSprite) {
        this.playerSprite.texture = Assets.get(CHARACTER_SPRITES.idle)
      }
    })
  }

  private flashPlayerHit(): void {
    if (!this.playerSprite) return
    gsap.to(this.playerSprite, {
      alpha: 0.4,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
    })
  }

  private shakeMonster(monsterId: string): void {
    const slot = this.getMonsterPoolSlot(monsterId)
    if (!slot) return
    gsap.killTweensOf(slot.sprite, 'x')
    gsap.to(slot.sprite, {
      x: 6,
      duration: 0.05,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        slot.sprite.x = 0
      },
    })
  }

  private flashMonsterDeath(monsterId: string): void {
    const slot = this.getMonsterPoolSlot(monsterId)
    if (!slot) return
    gsap.killTweensOf(slot.sprite, 'alpha')
    gsap.to(slot.sprite, {
      alpha: 0,
      duration: 0.2,
    })
  }

  private showDamage(event: DamageEvent): void {
    const slot = this.damagePool.find((item) => !item.active)
    if (!slot) return

    // 스킬 다단 히트는 같은 몬스터 좌표에 여러 번 꽂히므로, 완전히 겹쳐 안 보이지 않도록 살짝 흩뿌린다
    const jitterX = event.isSkill ? (Math.random() - 0.5) * SKILL_DAMAGE_JITTER_PX : 0
    const jitterY = event.isSkill ? (Math.random() - 0.5) * SKILL_DAMAGE_JITTER_PX : 0

    slot.active = true
    slot.text.text = String(event.value)
    slot.text.style.fill = event.isCritical ? 0xff4444 : event.isSkill ? 0xff6633 : 0xfff1a8
    slot.text.style.fontSize = event.isCritical ? 30 : event.isSkill ? 28 : 22
    slot.text.x = event.x + jitterX
    slot.text.y = event.y + jitterY
    slot.text.alpha = 1
    slot.text.visible = true

    gsap.to(slot.text, {
      y: event.y + jitterY - 50,
      alpha: 0,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => {
        slot.text.visible = false
        slot.text.style.fill = 0xfff1a8
        slot.text.style.fontSize = 22
        slot.active = false
      },
    })
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize)

    // applyIdleBob()이 건 repeat: -1 트윈은 무한 반복이라, app.destroy()로 스프라이트가
    // 파괴돼도 gsap 자체가 멈추지 않고 죽은 객체를 계속 참조하며 tick한다. 명시적으로 kill한다.
    if (this.playerSprite) gsap.killTweensOf(this.playerSprite)
    for (const slot of this.monsterPool) {
      gsap.killTweensOf(slot.sprite)
    }
    for (const item of this.damagePool) {
      gsap.killTweensOf(item.text)
    }
    for (const tween of this.pendingSkillHits) {
      tween.kill()
    }

    this.app?.destroy(true, { children: true })
    this.app = null
    this.root = null
    this.background = null
    this.playerContainer = null
    this.playerSprite = null
    this.monsterPool = []
    this.damagePool = []
    this.pendingSkillHits = []
    this.mounted = false
  }
}
