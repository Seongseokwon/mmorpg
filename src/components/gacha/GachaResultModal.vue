<script setup lang="ts">
import { ref, watch } from 'vue'
import gsap from 'gsap'
import { RARITY_COLORS } from '@/data/gameData'
import { formatEquipmentPrimaryStat } from '@/services/equipmentService'
import type { Equipment } from '@/types/game'

const props = defineProps<{ items: Equipment[] }>()
const emit = defineEmits<{ close: [] }>()

const listRef = ref<HTMLElement | null>(null)

watch(
  () => props.items,
  () => {
    if (listRef.value) {
      gsap.fromTo(
        listRef.value.children,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'back.out(1.5)' },
      )
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal panel">
      <h3 class="modal__title">🎰 뽑기 결과</h3>
      <ul ref="listRef" class="result-list">
        <li v-for="item in items" :key="item.id" class="result-item">
          <span class="result-item__name" :style="{ color: RARITY_COLORS[item.rarity] }">
            {{ item.name }}
          </span>
          <span class="result-item__stat">{{ formatEquipmentPrimaryStat(item) }}</span>
        </li>
      </ul>
      <button class="btn btn--gold modal__btn" @click="emit('close')">확인</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 340px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 1.25rem;
}

.modal__title {
  text-align: center;
  color: var(--color-accent-gold);
  margin-bottom: 0.75rem;
}

.result-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.result-item {
  padding: 0.45rem 0.6rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.result-item__name {
  font-size: 0.8rem;
  font-weight: 700;
}

.result-item__stat {
  font-size: 0.68rem;
  color: var(--color-success);
}

.modal__btn {
  width: 100%;
}
</style>
