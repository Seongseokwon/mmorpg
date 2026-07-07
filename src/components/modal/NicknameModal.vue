<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player.store'

const emit = defineEmits<{ close: [] }>()

const player = usePlayerStore()
const input = ref(player.nickname)
const errorText = ref<string | null>(null)

function save(): void {
  const error = player.setNickname(input.value)
  if (error) {
    errorText.value = error
    return
  }
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal panel">
      <h3 class="modal__title">닉네임 변경</h3>

      <div class="modal__field">
        <input
          v-model="input"
          type="text"
          data-testid="nickname-input"
          @keyup.enter="save"
        />
        <span v-if="errorText" class="modal__error" data-testid="nickname-error">{{ errorText }}</span>
      </div>

      <div class="modal__actions">
        <button class="btn btn--gold modal__btn" data-testid="nickname-save" @click="save">저장</button>
        <button class="btn btn--secondary modal__btn" data-testid="nickname-close" @click="emit('close')">
          닫기
        </button>
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

.modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}

.modal__field input {
  height: 44px;
  padding: 0 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: inherit;
}

.modal__field input:focus {
  outline: none;
  border-color: var(--color-accent-gold);
}

.modal__error {
  font-size: 0.75rem;
  color: #ff9a9a;
}

.modal__actions {
  display: flex;
  gap: 0.5rem;
}

.modal__btn {
  flex: 1;
}
</style>
