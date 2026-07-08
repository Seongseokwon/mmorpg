export type MainStatId = 'str' | 'vit' | 'dex' | 'luk'
export type SubStatId = 'crit_rate' | 'crit_damage' | 'attack_speed' | 'meso_bonus' | 'drop_rate'

export interface MainStats {
  str: number
  vit: number
  dex: number
  luk: number
}

export interface SubStatLevels {
  crit_rate: number
  crit_damage: number
  attack_speed: number
  meso_bonus: number
  drop_rate: number
}
export type EquipmentSlot = 'weapon' | 'armor'
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type StatGrade = 'low' | 'normal' | 'high' | 'perfect'

export interface Equipment {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: EquipmentRarity
  enhanceLevel: number
  baseAttack: number
  baseHp: number
  /** 드롭 시 굴려진 주 스탯의 등급 (무기=ATK, 방어구=HP) */
  statGrade: StatGrade
}

export interface ConsumableItem {
  id: string
  type: 'potion' | 'scroll'
  name: string
  quantity: number
  description: string
}

export interface Skill {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  cooldownMs: number
  damageMultiplier: number
  unlockStage: number
  /** 대상 하나당 몇 번 타격하는지. 1이면 단일 히트(기존 스킬 동작과 동일) */
  hitsPerTarget: number
  /** true면 근접 범위(cleave) 대신 생존한 몬스터 전원을 대상으로 한다 */
  aoeAll: boolean
}

export interface PlayerStats {
  level: number
  exp: number
  statPoints: number
  mainStats: MainStats
  attack: number
  maxHp: number
  hp: number
}

export interface Monster {
  id: string
  name: string
  maxHp: number
  hp: number
  attack: number
  goldReward: number
  sprite: string
  /** 사냥터 내 배회 위치 (0~1 정규화 좌표, 작을수록 플레이어와 가깝다) */
  x: number
  /** 현재 이동 중인 목적지 (도착하면 새 목적지를 무작위로 다시 정한다) */
  targetX: number
  /** 개체별 배회 속도 (초당 이동하는 정규화 거리) */
  speed: number
  /** 목적지로 실제 이동 중인지 여부 (렌더러의 걷기 애니메이션 트리거용) */
  moving: boolean
  /** 목적지 도착 후 다음 이동 전까지 잠시 멈춰있는 남은 시간(ms) */
  pauseMs: number
  /** 스테이지 웨이브를 모두 클리어한 뒤 등장하는 보스인지 여부 (렌더러/HP바 표시 분기용) */
  isBoss: boolean
}

export interface SaveData {
  version: number
  nickname: string
  gold: number
  level: number
  exp: number
  statPoints: number
  mainStats: MainStats
  /** 선천 능력치 — 캐릭터 생성 시 10포인트 무작위 배분, 레벨업마다 +1. 플레이어가 직접 배분할 수 없다. */
  innateStats: MainStats
  subStats: SubStatLevels
  currentStage: number
  maxClearedStage: number
  equipmentBag: Equipment[]
  equippedWeapon: Equipment | null
  equippedArmor: Equipment | null
  consumables: ConsumableItem[]
  skills: { id: string; level: number }[]
  gachaPity: number
  achievements: Record<string, AchievementProgress>
  dailyReward: DailyRewardState
  meta: MetaStats
  lastActiveAt: number
  /** v2 이하 마이그레이션용 */
  attackLevel?: number
  hpLevel?: number
}

export interface DamageEvent {
  value: number
  x: number
  y: number
  isCritical?: boolean
  isSkill?: boolean
}

export type BattleEvent =
  | { type: 'player_attack'; monsterId: string; damage: number; isCritical?: boolean }
  | { type: 'skill_use'; skillId: string; hits: { monsterId: string; damage: number }[] }
  | { type: 'monster_hit'; monsterId: string }
  | { type: 'monster_killed'; monsterId: string; gold: number }
  | { type: 'player_hit'; damage: number }
  | { type: 'monster_spawned'; monsterId: string }
  | { type: 'equipment_dropped'; equipment: Equipment }

export interface EnhanceResult {
  success: boolean
  previousLevel: number
  newLevel: number
}

export interface AchievementReward {
  meso?: number
  potion?: number
  scroll?: number
  /** 캐릭터 화면에서 자유 배분 가능한 스탯 포인트. 어려운 업적일수록 이걸 얹어 성장 체감을 준다. */
  statPoints?: number
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  target: number
  icon: string
  reward: AchievementReward
  trackKey: string
}

export interface AchievementProgress {
  claimed: boolean
}

export interface DailyRewardState {
  lastClaimDate: string
  streak: number
}

export interface MetaStats {
  totalKills: number
  totalGachaPulls: number
  totalEnhances: number
  totalBossKills: number
}

export interface OfflineRewardState {
  lastActiveAt: number
  pendingShown: boolean
}
