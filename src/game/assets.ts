const ASSET_BASE = '/assets/Sprites'

export const CHARACTER_SPRITES = {
  idle: `${ASSET_BASE}/Characters/Default/character_beige_idle.png`,
  attack: `${ASSET_BASE}/Characters/Default/character_beige_front.png`,
  hit: `${ASSET_BASE}/Characters/Default/character_beige_hit.png`,
} as const

export const MONSTER_SPRITES: Record<string, string> = {
  slime_normal_rest: `${ASSET_BASE}/Enemies/Default/slime_normal_rest.png`,
  slime_normal_walk_a: `${ASSET_BASE}/Enemies/Default/slime_normal_walk_a.png`,
  slime_normal_walk_b: `${ASSET_BASE}/Enemies/Default/slime_normal_walk_b.png`,
  slime_fire_rest: `${ASSET_BASE}/Enemies/Default/slime_fire_rest.png`,
  slime_fire_walk_a: `${ASSET_BASE}/Enemies/Default/slime_fire_walk_a.png`,
  slime_fire_walk_b: `${ASSET_BASE}/Enemies/Default/slime_fire_walk_b.png`,
  slime_spike_rest: `${ASSET_BASE}/Enemies/Default/slime_spike_rest.png`,
  slime_spike_walk_a: `${ASSET_BASE}/Enemies/Default/slime_spike_walk_a.png`,
  slime_spike_walk_b: `${ASSET_BASE}/Enemies/Default/slime_spike_walk_b.png`,
  slime_block_rest: `${ASSET_BASE}/Enemies/Default/slime_block_rest.png`,
  slime_block_walk_a: `${ASSET_BASE}/Enemies/Default/slime_block_walk_a.png`,
  slime_block_walk_b: `${ASSET_BASE}/Enemies/Default/slime_block_walk_b.png`,
  frog_rest: `${ASSET_BASE}/Enemies/Default/frog_rest.png`,
  frog_idle: `${ASSET_BASE}/Enemies/Default/frog_idle.png`,
  frog_jump: `${ASSET_BASE}/Enemies/Default/frog_jump.png`,
}

// 각 몬스터의 rest(정지) 스프라이트 키 -> 배회 이동 중 번갈아 보여줄 2프레임 키.
// 개구리는 walk 프레임이 없어 idle/jump로 폴짝거리는 느낌을 대신 낸다.
const MONSTER_WALK_FRAMES: Record<string, [string, string]> = {
  slime_normal_rest: ['slime_normal_walk_a', 'slime_normal_walk_b'],
  slime_fire_rest: ['slime_fire_walk_a', 'slime_fire_walk_b'],
  slime_spike_rest: ['slime_spike_walk_a', 'slime_spike_walk_b'],
  slime_block_rest: ['slime_block_walk_a', 'slime_block_walk_b'],
  frog_rest: ['frog_idle', 'frog_jump'],
}

export const BACKGROUND_SPRITE = `${ASSET_BASE}/Backgrounds/Default/background_color_hills.png`

export function getMonsterSpriteUrl(key: string): string {
  return MONSTER_SPRITES[key] ?? MONSTER_SPRITES.slime_normal_rest
}

/** 이동 중인 몬스터에게 보여줄 2프레임 걷기(뜀) 애니메이션 중 하나를 반환한다 */
export function getMonsterWalkSpriteUrl(restKey: string, frameA: boolean): string {
  const frames = MONSTER_WALK_FRAMES[restKey]
  if (!frames) return getMonsterSpriteUrl(restKey)
  return getMonsterSpriteUrl(frameA ? frames[0] : frames[1])
}
