<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { useStageStore } from '@/stores/stage.store'
import { useBattleStore } from '@/stores/battle.store'
import { useEquipmentStore } from '@/stores/equipment.store'

const player = usePlayerStore()
const currency = useCurrencyStore()
const stage = useStageStore()
const battle = useBattleStore()
const equipment = useEquipmentStore()

const stageProgress = computed(() => {
  if (battle.stagePhase === 'boss') return '보스전'
  if (battle.stagePhase === 'wave') return `웨이브 ${battle.waveIndex}/${battle.wavesPerStage}`
  return '파밍'
})

const combatPower = computed(
  () => player.attack + equipment.totalAttackBonus + equipment.totalHpBonus,
)
</script>

<template>
  <header class="top-bar hunt-glass">
    <div class="top-bar__profile">
      <div class="top-bar__avatar">🧑‍🚀</div>
      <div class="top-bar__profile-text">
        <span class="top-bar__name overlay-text">모험가</span>
        <span class="top-bar__power overlay-text">⚔ {{ combatPower.toLocaleString() }}</span>
      </div>
    </div>

    <div class="top-bar__stage">
      <span class="top-bar__stage-map overlay-text" data-testid="stage-current">사냥터 {{ stage.currentStage }}</span>
      <span class="top-bar__stage-progress overlay-text" data-testid="stage-phase-badge">{{ stageProgress }}</span>
    </div>

    <div class="top-bar__currency">
      <span class="top-bar__currency-icon">🌙</span>
      <span class="top-bar__currency-value overlay-text" data-testid="currency-gold">{{ currency.formattedGold }}</span>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  flex-shrink: 0;
  z-index: 20;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

@media (orientation: landscape) and (max-height: 520px) {
  .top-bar {
    padding: 0.2rem 0.5rem;
  }

  .top-bar__avatar {
    width: 26px;
    height: 26px;
  }
}

.top-bar__profile {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.top-bar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.top-bar__profile-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar__name {
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar__power {
  font-size: 0.6rem;
  color: #f5c542;
}

.top-bar__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding: 0 0.4rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.top-bar__stage-map {
  font-size: 0.58rem;
  color: #a8d4ff;
  font-weight: 600;
  white-space: nowrap;
}

.top-bar__stage-progress {
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  white-space: nowrap;
}

.top-bar__currency {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

.top-bar__currency-icon {
  font-size: 0.8rem;
}

.top-bar__currency-value {
  font-size: 0.72rem;
  font-weight: 700;
  color: #f5c542;
  white-space: nowrap;
}
</style>
