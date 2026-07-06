<script setup lang="ts">
import { ref, watch } from 'vue'
import gsap from 'gsap'
import { RARITY_COLORS, RARITY_LABELS } from '@/data/gameData'
import { getEnhanceCost } from '@/services/equipmentService'
import { useEquipmentStore } from '@/stores/equipment.store'
import type { Equipment, EquipmentSlot } from '@/types/game'

const props = defineProps<{
  slotType: EquipmentSlot
  item: Equipment
  scrollCount: number
  gold: number
  successRate: number
  successRateWithScroll: number
}>()

const emit = defineEmits<{ close: [] }>()

const equipment = useEquipmentStore()
const useScroll = ref(false)
const resultText = ref<string | null>(null)
const resultSuccess = ref(false)
const isAnimating = ref(false)
const resultRef = ref<HTMLElement | null>(null)

const enhanceCost = () => getEnhanceCost(props.item)

function enhance(): void {
  if (isAnimating.value) return
  if (props.gold < enhanceCost()) return
  if (useScroll.value && props.scrollCount <= 0) return

  isAnimating.value = true
  const result = equipment.enhance(props.slotType, useScroll.value)

  if (!result) {
    isAnimating.value = false
    return
  }

  resultSuccess.value = result.success
  resultText.value = result.success
    ? `강화 성공! +${result.newLevel}`
    : '강화 실패...'

  if (resultRef.value) {
    gsap.fromTo(
      resultRef.value,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' },
    )
  }

  window.setTimeout(() => {
    resultText.value = null
    isAnimating.value = false
    if (result.success) {
      emit('close')
    }
  }, 1500)
}

watch(
  () => props.item.enhanceLevel,
  () => {
    if (resultRef.value && resultText.value) {
      gsap.to(resultRef.value, {
        scale: 1.2,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
      })
    }
  },
)
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal panel">
      <h3 class="modal__title">장비 강화</h3>

      <div class="modal__item">
        <span class="modal__name" :style="{ color: RARITY_COLORS[item.rarity] }">
          {{ item.name }}
        </span>
        <span class="modal__level">+{{ item.enhanceLevel }} · {{ RARITY_LABELS[item.rarity] }}</span>
      </div>

      <div class="modal__rates">
        <span>성공률: {{ useScroll ? successRateWithScroll : successRate }}%</span>
        <label class="modal__scroll">
          <input v-model="useScroll" type="checkbox" :disabled="scrollCount <= 0" />
          주문서 사용 ({{ scrollCount }}개, +15%)
        </label>
      </div>

      <div class="modal__cost">비용: 🌙 {{ enhanceCost().toLocaleString() }}</div>

      <div
        v-if="resultText"
        ref="resultRef"
        class="modal__result"
        :class="resultSuccess ? 'modal__result--success' : 'modal__result--fail'"
      >
        {{ resultText }}
      </div>

      <div class="modal__actions">
        <button
          class="btn btn--gold modal__btn"
          :disabled="gold < enhanceCost() || isAnimating || (useScroll && scrollCount <= 0)"
          @click="enhance"
        >
          {{ isAnimating ? '강화 중...' : '강화하기' }}
        </button>
        <button class="btn btn--secondary modal__btn" @click="emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 320px;
  padding: 1.25rem;
  animation: modal-in 0.2s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal__title {
  font-size: 1rem;
  color: var(--color-accent-gold);
  margin-bottom: 0.75rem;
  text-align: center;
}

.modal__item {
  text-align: center;
  margin-bottom: 0.75rem;
}

.modal__name {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
}

.modal__level {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.modal__rates {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.modal__scroll {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

.modal__cost {
  font-size: 0.85rem;
  color: var(--color-accent-gold);
  margin-bottom: 0.75rem;
  text-align: center;
}

.modal__result {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  margin-bottom: 0.75rem;
}

.modal__result--success {
  color: var(--color-success);
  background: rgba(78, 204, 163, 0.15);
  text-shadow: 0 0 12px rgba(78, 204, 163, 0.5);
}

.modal__result--fail {
  color: var(--color-accent);
  background: rgba(233, 69, 96, 0.15);
  text-shadow: 0 0 12px rgba(233, 69, 96, 0.5);
}

.modal__actions {
  display: flex;
  gap: 0.5rem;
}

.modal__btn {
  flex: 1;
}
</style>
