import gsap from 'gsap'
import { Application, Assets, Container, Sprite, Text, TextStyle } from 'pixi.js'
import {
  BACKGROUND_SPRITE,
  CHARACTER_SPRITES,
  getMonsterSpriteUrl,
  getMonsterWalkSpriteUrl,
} from '@/game/assets'
import type { BattleEvent, DamageEvent, Monster } from '@/types/game'

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
const MONSTER_HEIGHT_RATIO = 0.34

// 몬스터 걷기 프레임 전환 주기(ms). battle.store의 tick 주기와 무관하게 실제 시간 기준으로 토글한다.
const WALK_FRAME_INTERVAL_MS = 260

export class GameRenderer {
  private app: Application | null = null
  private root: Container | null = null
  private background: Sprite | null = null
  private playerContainer: Container | null = null
  private playerSprite: Sprite | null = null
  private monsterPool: MonsterPoolSlot[] = []
  private damagePool: DamageTextObject[] = []
  private readonly damagePoolSize = 12
  private playerScale = 1
  private monsterScale = 1
  private mounted = false

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
    const groundY = height * 0.82

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
    const groundY = this.app.screen.height * 0.82
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
        for (const hit of event.hits) {
          const target = this.getMonsterPoolSlot(hit.monsterId)
          this.showDamage({
            value: hit.damage,
            x: target?.container.x ?? 0,
            y: (target?.container.y ?? 0) - 80,
            isSkill: true,
          })
        }
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

    const tint = skillId === 'fire_ball' ? 0xff6633 : 0xffcc00
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

    slot.active = true
    slot.text.text = String(event.value)
    slot.text.style.fill = event.isCritical ? 0xff4444 : event.isSkill ? 0xff6633 : 0xfff1a8
    slot.text.style.fontSize = event.isCritical ? 30 : event.isSkill ? 28 : 22
    slot.text.x = event.x
    slot.text.y = event.y
    slot.text.alpha = 1
    slot.text.visible = true

    gsap.to(slot.text, {
      y: event.y - 50,
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

    this.app?.destroy(true, { children: true })
    this.app = null
    this.root = null
    this.background = null
    this.playerContainer = null
    this.playerSprite = null
    this.monsterPool = []
    this.damagePool = []
    this.mounted = false
  }
}
