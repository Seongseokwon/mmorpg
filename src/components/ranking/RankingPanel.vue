<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchRanking, type RankingEntry } from '@/api/ranking'

const entries = ref<RankingEntry[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

onMounted(async () => {
  try {
    entries.value = await fetchRanking()
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <section class="ranking panel">
    <p class="ranking__hint">최고 클리어 사냥터 기준 상위 100명 · 로그인 후 진행상황을 저장해야 순위에 등록됩니다</p>

    <p v-if="status === 'loading'" class="ranking__status" data-testid="ranking-loading">불러오는 중...</p>
    <p v-else-if="status === 'error'" class="ranking__status" data-testid="ranking-error">
      랭킹을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
    </p>
    <p v-else-if="entries.length === 0" class="ranking__status" data-testid="ranking-empty">
      아직 랭킹에 등록된 모험가가 없습니다.
    </p>
    <ul v-else class="ranking__list" data-testid="ranking-list">
      <li
        v-for="entry in entries"
        :key="entry.rank"
        class="ranking__item"
        :data-testid="`ranking-row-${entry.rank}`"
      >
        <span
          class="ranking__rank"
          :class="{
            'ranking__rank--gold': entry.rank === 1,
            'ranking__rank--silver': entry.rank === 2,
            'ranking__rank--bronze': entry.rank === 3,
          }"
        >
          {{ entry.rank }}
        </span>
        <span class="ranking__nickname">{{ entry.nickname }}</span>
        <span class="ranking__stage">사냥터 {{ entry.maxClearedStage }}</span>
        <span class="ranking__level">Lv.{{ entry.level }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ranking {
  padding: 0.75rem 1rem;
}

.ranking__hint {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  margin-bottom: 0.6rem;
  line-height: 1.4;
}

.ranking__status {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 1.5rem 0;
}

.ranking__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ranking__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.ranking__rank {
  flex-shrink: 0;
  width: 1.6rem;
  text-align: center;
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.ranking__rank--gold {
  color: #f5c542;
}

.ranking__rank--silver {
  color: #c9d3e0;
}

.ranking__rank--bronze {
  color: #d08a52;
}

.ranking__nickname {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking__stage {
  flex-shrink: 0;
  font-size: 0.68rem;
  color: var(--color-accent-gold);
  font-weight: 600;
}

.ranking__level {
  flex-shrink: 0;
  font-size: 0.68rem;
  color: var(--color-text-muted);
  min-width: 2.6rem;
  text-align: right;
}
</style>
