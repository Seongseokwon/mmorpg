<script setup lang="ts">
import type { NavId } from './HuntNavBar.vue'

defineProps<{
  open: boolean
  title: string
  navId: NavId | null
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-overlay" @click.self="emit('close')">
        <div class="sheet hunt-glass">
          <header class="sheet__header">
            <h2 class="sheet__title overlay-text">{{ title }}</h2>
            <button class="sheet__close" @click="emit('close')">✕</button>
          </header>
          <div class="sheet__body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-width: 480px;
  max-height: 72vh;
  border-radius: 16px 16px 0 0;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sheet__title {
  font-size: 1rem;
  font-weight: 700;
  color: #f5c542;
}

.sheet__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet__body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
