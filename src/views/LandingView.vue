<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const checkingSession = ref(true)

onMounted(async () => {
  await auth.restoreSession()
  checkingSession.value = false
})

function enterGame(): void {
  router.push('/game')
}

async function logout(): Promise<void> {
  await auth.logout()
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-view__frame">
      <div class="auth-brand">
        <div class="auth-brand__title">⚔️ 방치록</div>
        <p class="auth-brand__subtitle">자동전투로 성장하는 웹 방치형 RPG</p>
      </div>

      <div class="auth-card panel">
        <template v-if="checkingSession">
          <p class="auth-card__welcome">세션 확인 중...</p>
        </template>

        <template v-else-if="auth.isLoggedIn">
          <p class="auth-card__welcome">
            <strong>{{ auth.user?.email }}</strong>님, 다시 오신 것을 환영합니다
          </p>
          <div class="auth-actions">
            <button class="btn btn--gold" data-testid="landing-continue" @click="enterGame">
              이어하기
            </button>
            <button class="btn btn--secondary" data-testid="landing-logout" @click="logout">
              로그아웃
            </button>
          </div>
        </template>

        <template v-else>
          <p class="auth-card__welcome">지금 바로 사냥을 시작해보세요</p>
          <div class="auth-actions">
            <button class="btn btn--gold" data-testid="landing-guest" @click="enterGame">
              게스트로 시작하기
            </button>
            <button class="btn btn--primary" data-testid="landing-login" @click="router.push('/login')">
              로그인
            </button>
            <button class="btn btn--secondary" data-testid="landing-register" @click="router.push('/register')">
              회원가입
            </button>
          </div>
          <p class="auth-footnote">
            게스트로 시작하면 이 브라우저에만 진행 상황이 저장됩니다.<br />
            로그인하면 클라우드에 저장되어 다른 기기에서도 이어할 수 있어요.
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
