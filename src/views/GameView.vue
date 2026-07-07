<script setup lang="ts">
import { computed, ref } from 'vue'
import GameCanvas from '@/components/battle/GameCanvas.vue'
import HuntTopBar from '@/components/hunt/HuntTopBar.vue'
import HuntQuestBox from '@/components/hunt/HuntQuestBox.vue'
import HuntMonsterBar from '@/components/hunt/HuntMonsterBar.vue'
import HuntPlayerBar from '@/components/hunt/HuntPlayerBar.vue'
import HuntSkillBar from '@/components/hunt/HuntSkillBar.vue'
import HuntNavBar, { type NavId } from '@/components/hunt/HuntNavBar.vue'
import GameSheet from '@/components/hunt/GameSheet.vue'
import MainStatPanel from '@/components/stats/MainStatPanel.vue'
import SubStatPanel from '@/components/stats/SubStatPanel.vue'
import StagePanel from '@/components/stage/StagePanel.vue'
import InventoryPanel from '@/components/inventory/InventoryPanel.vue'
import EquipmentPanel from '@/components/equipment/EquipmentPanel.vue'
import SkillPanel from '@/components/skill/SkillPanel.vue'
import GachaPanel from '@/components/gacha/GachaPanel.vue'
import AchievementPanel from '@/components/reward/AchievementPanel.vue'
import DailyRewardPanel from '@/components/reward/DailyRewardPanel.vue'
import OfflineRewardModal from '@/components/reward/OfflineRewardModal.vue'
import { useGameSession } from '@/composables/useGameSession'
import { useBattleStore } from '@/stores/battle.store'
import { useAchievementStore } from '@/stores/achievement.store'
import { useSaveStore } from '@/stores/save.store'
import { STAT_POINTS_PER_LEVEL } from '@/data/statData'

useGameSession()
const battle = useBattleStore()
const achievement = useAchievementStore()
const save = useSaveStore()

const activeNav = ref<NavId | null>(null)

const navTitles: Record<NavId, string> = {
  character: '캐릭터',
  equipment: '장비',
  skill: '스킬',
  reward: '보상',
  stage: '스테이지',
}

const sheetTitle = computed(() => (activeNav.value ? navTitles[activeNav.value] : ''))

function selectNav(id: NavId): void {
  activeNav.value = activeNav.value === id ? null : id
}

function closeSheet(): void {
  activeNav.value = null
}
</script>

<template>
  <div class="hunt-view">
    <div class="hunt-view__frame">
      <HuntTopBar />

      <div class="hunt-view__stage">
        <div class="hunt-view__stage-box">
          <GameCanvas />
          <HuntQuestBox />
          <HuntMonsterBar />
        </div>
      </div>

      <div class="hunt-view__bottom-hud">
        <HuntPlayerBar />
        <HuntSkillBar />
      </div>

      <HuntNavBar
        :active="activeNav"
        :badge-count="achievement.claimableCount"
        @select="selectNav"
      />

      <Transition name="toast">
        <div v-if="battle.lastDropName" class="hunt-toast hunt-toast--drop">
          🎁 {{ battle.lastDropName }} 획득!
        </div>
      </Transition>

      <Transition name="toast">
        <div v-if="battle.lastLevelUp > 0" class="hunt-toast hunt-toast--level">
          ⬆️ 레벨 업! +{{ battle.lastLevelUp * STAT_POINTS_PER_LEVEL }} 스탯 포인트
        </div>
      </Transition>

      <div v-if="save.isLoaded && !save.isSaveAvailable" class="hunt-toast hunt-toast--warning">
        ⚠️ 저장 불가 - 진행 상황이 저장되지 않습니다
      </div>

      <OfflineRewardModal />
    </div>

    <GameSheet :open="activeNav !== null" :title="sheetTitle" :nav-id="activeNav" @close="closeSheet">
      <template v-if="activeNav === 'character'">
        <MainStatPanel />
        <SubStatPanel />
      </template>
      <template v-else-if="activeNav === 'equipment'">
        <EquipmentPanel />
        <InventoryPanel />
      </template>
      <template v-else-if="activeNav === 'skill'">
        <SkillPanel />
      </template>
      <template v-else-if="activeNav === 'reward'">
        <DailyRewardPanel />
        <GachaPanel />
        <AchievementPanel />
      </template>
      <template v-else-if="activeNav === 'stage'">
        <StagePanel />
      </template>
    </GameSheet>
  </div>
</template>

<style scoped>
.hunt-view {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #22243a 0%, #0d0e1a 100%);
}

.hunt-view__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: #1a1a2e;
  overflow: hidden;
}

@media (min-width: 700px) {
  .hunt-view__frame {
    max-width: 860px;
  }
}

.hunt-view__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.hunt-view__stage-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100%;
  overflow: hidden;
}

.hunt-view__bottom-hud {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  flex-shrink: 0;
  z-index: 25;
}

.hunt-toast {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  z-index: 50;
  white-space: nowrap;
  pointer-events: none;
}

.hunt-toast--drop {
  top: 42%;
  background: rgba(10, 14, 28, 0.9);
  border: 1px solid #f5c542;
  color: #f5c542;
}

.hunt-toast--level {
  top: 36%;
  background: rgba(10, 14, 28, 0.9);
  border: 1px solid #7ec8ff;
  color: #7ec8ff;
}

.hunt-toast--warning {
  top: 8%;
  background: rgba(56, 16, 16, 0.92);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>

<style>
/* 시트 안 패널 스타일 조정 */
.sheet__body .panel {
  background: rgba(15, 22, 40, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
