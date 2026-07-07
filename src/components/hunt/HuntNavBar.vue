<script setup lang="ts">
export type NavId = 'character' | 'equipment' | 'skill' | 'reward' | 'achievement' | 'stage' | 'ranking'

defineProps<{
  active: NavId | null
  badgeCount?: number
}>()

const emit = defineEmits<{
  select: [id: NavId]
}>()

const navItems: { id: NavId; label: string; icon: string }[] = [
  { id: 'character', label: '캐릭터', icon: '🧑' },
  { id: 'equipment', label: '장비', icon: '🛡️' },
  { id: 'skill', label: '스킬', icon: '✨' },
  { id: 'reward', label: '보상', icon: '🎁' },
  { id: 'achievement', label: '업적', icon: '🏆' },
  { id: 'stage', label: '스테이지', icon: '🗺️' },
  { id: 'ranking', label: '랭킹', icon: '📊' },
]
</script>

<template>
  <nav class="nav-bar hunt-glass">
    <button
      v-for="item in navItems"
      :key="item.id"
      class="nav-bar__btn"
      :class="{ 'nav-bar__btn--active': active === item.id }"
      :data-testid="`nav-${item.id}`"
      @click="emit('select', item.id)"
    >
      <span class="nav-bar__icon">{{ item.icon }}</span>
      <span class="nav-bar__label overlay-text">{{ item.label }}</span>
      <span
        v-if="item.id === 'achievement' && badgeCount && badgeCount > 0"
        class="nav-bar__badge"
      />
    </button>
  </nav>
</template>

<style scoped>
.nav-bar {
  position: relative;
  display: flex;
  justify-content: space-around;
  flex-shrink: 0;
  padding: 0.35rem 0.25rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  z-index: 30;
}

@media (orientation: landscape) and (max-height: 520px) {
  .nav-bar__label {
    display: none;
  }

  .nav-bar__btn {
    padding: 0.25rem 0.4rem;
    min-width: 40px;
  }

  .nav-bar__icon {
    font-size: 1.05rem;
  }
}

.nav-bar__btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem 0.5rem;
  min-width: 56px;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.15s, transform 0.1s;
}

.nav-bar__btn:active {
  transform: scale(0.94);
}

.nav-bar__btn--active {
  color: #f5c542;
}

.nav-bar__icon {
  font-size: 1.25rem;
}

.nav-bar__label {
  font-size: 0.58rem;
  font-weight: 600;
}

.nav-bar__badge {
  position: absolute;
  top: 4px;
  right: 8px;
  width: 7px;
  height: 7px;
  background: #e94560;
  border-radius: 50%;
  border: 1px solid #fff;
}
</style>
