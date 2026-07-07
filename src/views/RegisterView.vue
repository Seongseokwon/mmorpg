<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const submitting = ref(false)
const localError = ref<string | null>(null)

// 서버 RegisterDto의 @MinLength(8)과 동일한 기준 — 제출 전에 미리 안내한다.
const passwordTooShort = computed(() => password.value.length > 0 && password.value.length < 8)
const passwordMismatch = computed(
  () => passwordConfirm.value.length > 0 && password.value !== passwordConfirm.value,
)

async function submit(): Promise<void> {
  if (submitting.value) return
  localError.value = null

  if (password.value.length < 8) {
    localError.value = '비밀번호는 8자 이상이어야 합니다.'
    return
  }
  if (password.value !== passwordConfirm.value) {
    localError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  submitting.value = true
  const ok = await auth.register(email.value.trim(), password.value)
  submitting.value = false
  if (ok) {
    router.push('/game')
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-view__frame">
      <div class="auth-brand">
        <div class="auth-brand__title">⚔️ 방치록</div>
        <p class="auth-brand__subtitle">회원가입하고 진행 상황을 클라우드에 저장하세요</p>
      </div>

      <form class="auth-card panel" @submit.prevent="submit">
        <div v-if="localError || auth.error" class="auth-error" data-testid="register-error">
          {{ localError ?? auth.error }}
        </div>

        <div class="auth-field">
          <label for="register-email">이메일</label>
          <input
            id="register-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            data-testid="register-email"
          />
        </div>

        <div class="auth-field">
          <label for="register-password">비밀번호 (8자 이상)</label>
          <input
            id="register-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            data-testid="register-password"
          />
          <span v-if="passwordTooShort" class="auth-error" style="margin-top: 0">
            비밀번호는 8자 이상이어야 합니다.
          </span>
        </div>

        <div class="auth-field">
          <label for="register-password-confirm">비밀번호 확인</label>
          <input
            id="register-password-confirm"
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
            data-testid="register-password-confirm"
          />
          <span v-if="passwordMismatch" class="auth-error" style="margin-top: 0">
            비밀번호가 일치하지 않습니다.
          </span>
        </div>

        <div class="auth-actions">
          <button class="btn btn--gold" type="submit" :disabled="submitting" data-testid="register-submit">
            {{ submitting ? '가입 중...' : '회원가입' }}
          </button>
        </div>

        <p class="auth-links">
          이미 계정이 있으신가요?
          <button type="button" class="auth-link-button" @click="router.push('/login')">로그인</button>
        </p>
        <p class="auth-links">
          <button type="button" class="auth-link-button" @click="router.push('/')">← 처음으로</button>
        </p>
      </form>
    </div>
  </div>
</template>
