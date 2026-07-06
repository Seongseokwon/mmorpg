import {
  ARMOR_NAMES,
  EQUIPMENT_TEMPLATES,
  STAT_GRADE_COLORS,
  STAT_GRADE_LABELS,
  WEAPON_NAMES,
  type EquipmentTemplate,
} from '@/data/gameData'
import type { Equipment, EquipmentRarity, StatGrade } from '@/types/game'

const RARITY_WEIGHTS: { rarity: EquipmentRarity; weight: number }[] = [
  { rarity: 'common', weight: 55 },
  { rarity: 'uncommon', weight: 28 },
  { rarity: 'rare', weight: 13 },
  { rarity: 'epic', weight: 4 },
]

const ENHANCE_BONUS_PER_LEVEL = 0.1
export const MAX_ENHANCE_LEVEL = 20

interface RolledStat {
  value: number
  min: number
  max: number
  grade: StatGrade
}

export function getEnhanceBonus(level: number): number {
  return 1 + level * ENHANCE_BONUS_PER_LEVEL
}

export function getEquipmentAttack(equipment: Equipment): number {
  return Math.floor(equipment.baseAttack * getEnhanceBonus(equipment.enhanceLevel))
}

export function getEquipmentHp(equipment: Equipment): number {
  return Math.floor(equipment.baseHp * getEnhanceBonus(equipment.enhanceLevel))
}

export function getStatGradeLabel(grade: StatGrade): string {
  return STAT_GRADE_LABELS[grade]
}

export function getStatGradeColor(grade: StatGrade): string {
  return STAT_GRADE_COLORS[grade]
}

/** 드롭 시 옵션 범위 (강화 전 기준) */
export function getEquipmentStatRange(
  equipment: Equipment,
  template?: EquipmentTemplate,
): { min: number; max: number; current: number; label: string } {
  const tpl =
    template ??
    EQUIPMENT_TEMPLATES.find((t) => t.rarity === equipment.rarity && t.slot === equipment.slot)

  const spread = tpl?.statSpread ?? 0.2
  const isWeapon = equipment.slot === 'weapon'
  const center = isWeapon ? (tpl?.baseAttack ?? equipment.baseAttack) : (tpl?.baseHp ?? equipment.baseHp)
  const min = Math.max(1, Math.floor(center * (1 - spread)))
  const max = Math.max(min, Math.floor(center * (1 + spread)))
  const current = isWeapon ? equipment.baseAttack : equipment.baseHp
  const label = isWeapon ? 'ATK' : 'HP'

  return { min, max, current, label }
}

export function formatEquipmentPrimaryStat(equipment: Equipment): string {
  const stat = equipment.slot === 'weapon'
    ? `ATK +${getEquipmentAttack(equipment)}`
    : `HP +${getEquipmentHp(equipment)}`
  return `${stat} [${getStatGradeLabel(equipment.statGrade)}]`
}

function rollStat(center: number, spread: number): RolledStat {
  const min = Math.max(1, Math.floor(center * (1 - spread)))
  const max = Math.max(min, Math.floor(center * (1 + spread)))
  const value = min + Math.floor(Math.random() * (max - min + 1))
  const ratio = max === min ? 1 : (value - min) / (max - min)

  let grade: StatGrade = 'normal'
  if (ratio < 0.25) grade = 'low'
  else if (ratio < 0.6) grade = 'normal'
  else if (ratio < 0.9) grade = 'high'
  else grade = 'perfect'

  return { value, min, max, grade }
}

function normalizeEquipment(item: Equipment): Equipment {
  return {
    ...item,
    statGrade: item.statGrade ?? 'normal',
  }
}

export function normalizeEquipmentList(items: Equipment[]): Equipment[] {
  return items.map(normalizeEquipment)
}

export function getEnhanceCost(equipment: Equipment): number {
  const rarityMultiplier: Record<EquipmentRarity, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2.5,
    epic: 4,
  };
  const base = 100 * rarityMultiplier[equipment.rarity];
  return Math.floor(base * Math.pow(1.4, equipment.enhanceLevel));
}

export function getEnhanceSuccessRate(
  equipment: Equipment,
  useScroll: boolean
): number {
  if (equipment.enhanceLevel >= MAX_ENHANCE_LEVEL) return 0;
  let rate = 100;
  if (equipment.enhanceLevel >= 3) rate = 80;
  if (equipment.enhanceLevel >= 6) rate = 60;
  if (equipment.enhanceLevel >= 9) rate = 40;
  if (equipment.enhanceLevel >= 12) rate = 25;
  if (equipment.enhanceLevel >= 15) rate = 15;
  if (equipment.enhanceLevel >= 18) rate = 10;
  if (useScroll) rate = Math.min(100, rate + 15);
  return rate;
}

export function rollEnhanceSuccess(
  equipment: Equipment,
  useScroll: boolean
): boolean {
  if (equipment.enhanceLevel >= MAX_ENHANCE_LEVEL) return false;
  const rate = getEnhanceSuccessRate(equipment, useScroll);
  return Math.random() * 100 < rate;
}

export function getDropChance(stage: number, dropBonus = 0): number {
  return Math.min(0.6, 0.12 + stage * 0.02 + dropBonus)
}

export function rollEquipmentDrop(stage: number, dropBonus = 0): Equipment | null {
  if (Math.random() > getDropChance(stage, dropBonus)) return null
  return createRandomEquipment(stage)
}

function pickRarity(stage: number): EquipmentRarity {
  const weights = RARITY_WEIGHTS.map((entry) => {
    let weight = entry.weight;
    if (stage >= 5 && entry.rarity === "uncommon") weight += 5;
    if (stage >= 8 && entry.rarity === "rare") weight += 4;
    if (stage >= 12 && entry.rarity === "epic") weight += 3;
    return { ...entry, weight };
  });

  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;

  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) return entry.rarity;
  }
  return "common";
}

function pickTemplate(stage: number): EquipmentTemplate {
  const rarity = pickRarity(stage);
  const slot = Math.random() < 0.55 ? "weapon" : "armor";
  const candidates = EQUIPMENT_TEMPLATES.filter(
    (template) => template.rarity === rarity && template.slot === slot
  );
  if (candidates.length === 0) {
    return (
      EQUIPMENT_TEMPLATES.find((t) => t.slot === slot) ?? EQUIPMENT_TEMPLATES[0]
    );
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createRandomEquipment(stage: number): Equipment {
  const template = pickTemplate(stage)
  const names = template.slot === 'weapon' ? WEAPON_NAMES : ARMOR_NAMES
  const stageBonus = Math.floor(stage * 0.5)

  if (template.slot === 'weapon') {
    const center = template.baseAttack + stageBonus
    const rolled = rollStat(center, template.statSpread)
    return {
      id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: names[template.nameIndex] ?? names[0],
      slot: template.slot,
      rarity: template.rarity,
      enhanceLevel: 0,
      baseAttack: rolled.value,
      baseHp: 0,
      statGrade: rolled.grade,
    }
  }

  const center = template.baseHp + stageBonus * 2
  const rolled = rollStat(center, template.statSpread)
  return {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: names[template.nameIndex] ?? names[0],
    slot: template.slot,
    rarity: template.rarity,
    enhanceLevel: 0,
    baseAttack: 0,
    baseHp: rolled.value,
    statGrade: rolled.grade,
  }
}

export function getSkillDamageMultiplier(
  baseMultiplier: number,
  perLevel: number,
  level: number
): number {
  return baseMultiplier + perLevel * (level - 1);
}

export function getSkillUpgradeCost(level: number): number {
  return Math.floor(200 * Math.pow(1.3, level));
}

export function compareEquipment(a: Equipment, b: Equipment): number {
  const scoreA = getEquipmentAttack(a) + getEquipmentHp(a) + a.enhanceLevel * 5;
  const scoreB = getEquipmentAttack(b) + getEquipmentHp(b) + b.enhanceLevel * 5;
  return scoreA - scoreB;
}
