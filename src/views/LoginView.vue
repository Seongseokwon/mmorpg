<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  const ok = await auth.login(email.value.trim(), password.value)
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
        <p class="auth-brand__subtitle">로그인하고 클라우드 세이브를 이어가세요</p>
      </div>

      <form class="auth-card panel" @submit.prevent="submit">
        <div v-if="auth.error" class="auth-error" data-testid="login-error">{{ auth.error }}</div>

        <div class="auth-field">
          <label for="login-email">이메일</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            data-testid="login-email"
          />
        </div>

        <div class="auth-field">
          <label for="login-password">비밀번호</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            data-testid="login-password"
          />
        </div>

        <div class="auth-actions">
          <button class="btn btn--gold" type="submit" :disabled="submitting" data-testid="login-submit">
            {{ submitting ? '로그인 중...' : '로그인' }}
          </button>
        </div>

        <p class="auth-links">
          계정이 없으신가요?
          <button type="button" class="auth-link-button" @click="router.push('/register')">회원가입</button>
        </p>
        <p class="auth-links">
          <button type="button" class="auth-link-button" @click="router.push('/')">← 처음으로</button>
        </p>
      </form>
    </div>
  </div>
</template>
