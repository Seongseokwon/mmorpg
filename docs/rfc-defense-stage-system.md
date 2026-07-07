# RFC: 스테이지 디펜스화 (웨이브 → 보스 도전 시스템)

- 상태: **구현 완료** (2026-07-07) — 아래 설계대로 구현됨. 5.5/8절의 수치·연출은 후속 조정 대상.
- 작성일: 2026-07-07
- 관련 코드: `battle.store.ts`, `stage.store.ts`, `StagePanel.vue`, `HuntQuestBox.vue`, `HuntTopBar.vue`,
  `GameRenderer.ts`, `MonsterHpBars.vue`, `layoutConstants.ts`, `types/game.ts`
- 테스트: `tests/e2e/combat/wave-boss-challenge.spec.ts` (승리/패배 시나리오), `monster-spawn.spec.ts` 갱신

---

## 1. 배경 / 문제 정의

현재 스테이지 진행 방식(`battle.store.ts`):

- 사냥터에 몬스터를 항상 4마리(`MAX_MONSTERS`) 유지하며 무한 리스폰
- `killCount % 3 === 0`이 될 때마다 **자동으로** 다음 스테이지로 진행 (`onMonsterKilled()` 안에서 호출)
- 플레이어 HP가 0이 되면 `player.syncHpToMax()`로 **즉시 풀피 회복** — 사실상 죽음도, 실패도 없음
- 스테이지는 그냥 시간이 지나면 계속 오르는 컨베이어 벨트 구조

이 구조에는 "도전"과 "실패"가 없어서, 강화/스탯 투자가 성장의 실감으로 이어지긴 하지만 **명확한 목표(보스)와 명확한 위기(패배)**가 없다. 요청받은 방향은:

> 스테이지마다 몬스터가 몰려오고(디펜스 형태), 마지막에 보스를 잡아야 다음 스테이지로 진행. 보스전 실패 시 이전 상태(현재 스테이지)에 머물고, 강해진 뒤 "도전" 버튼으로 재도전.

## 2. 결정된 핵심 사항 (논의 완료)

| 질문 | 결정 |
|---|---|
| 보스전 실패 조건 | **플레이어 HP가 0이 되면 즉시 실패.** 기존의 "HP 0 → 자동 풀피 회복" 로직은 보스전 중에는 제거하고, 진짜 죽음/실패로 취급한다. |
| 몬스터가 "몰려오는" 구조 | **명시적 웨이브(예: 3웨이브)** 를 순차적으로 클리어해야 보스가 등장한다. (누적 처치 수 기반이 아니라, 웨이브 단위로 화면이 비워지고 다음 웨이브가 등장하는 형태) |
| 실패 후 흐름 | **페널티 없이 즉시 파밍 화면으로 복귀.** 재화/아이템 손실이나 쿨다운 없음. 이후 아무 때나 "도전" 버튼을 눌러 웨이브 1부터 재도전할 수 있다. |

## 3. 목표 / 비목표

**목표**

- 스테이지별로 "파밍(안전)" 상태와 "도전(웨이브+보스)" 상태를 명확히 분리
- 보스를 잡아야만 다음 스테이지로 진행 (`killCount` 기반 자동 진행 제거)
- 보스전 패배 시 안전하게 파밍 상태로 복귀, 성장 후 재도전 유도 → 기존 강화/스탯 성장 루프에 뚜렷한 목적성 부여
- 세이브 스키마 변경 없이 구현 (아래 5.4 참고)

**비목표 (이번 RFC 범위 밖)**

- 보스 전용 아트/신규 스프라이트 확보 (MVP는 기존 스프라이트 재활용)
- 보스별 고유 패턴/기믹(광역기, 즉사 공격 등)
- 웨이브 난이도의 스테이지별 차등 설계(웨이브 수, 몬스터 강도 곡선) — 구조만 만들고 수치는 별도 밸런스 패스
- 멀티플레이/랭킹 등 백엔드 연동

## 4. 현재 구조 요약 (변경 대상)

```
battle.store.ts
  - monsters: Monster[]              // 항상 최대 4마리 유지
  - onMonsterKilled()
      → spawnMonsters()              // 죽은 만큼 즉시 리필
      → if (killCount % 3 === 0) stage.nextStage()   // ← 제거 대상
  - monsterAttack()
      → if (player.hp <= 0) player.syncHpToMax()      // ← "보스전 중" 예외 필요

stage.store.ts
  - currentStage / maxClearedStage
  - createMonsterForStage(stage, x, speed)

StagePanel.vue
  - "3마리 처치마다 자동으로 다음 스테이지" 안내문구      // ← 교체 대상
  - ◀/▶ 로 이미 클리어한 스테이지 사이만 자유 이동 가능 (유지)
```

## 5. 제안 설계

### 5.1 상태 머신 (battle.store.ts)

```
FARMING ──[도전 버튼 클릭]──▶ WAVE(1)
FARMING                       WAVE(1) ──[웨이브 클리어]──▶ WAVE(2) ──▶ ... ──▶ WAVE(N)
                               WAVE(N) ──[웨이브 클리어]──▶ BOSS
                               (WAVE 또는 BOSS 중 언제든) HP 0 ──▶ DEFEAT
                               BOSS ──[보스 처치]──▶ VICTORY

DEFEAT  ──(즉시, 페널티 없음)──▶ FARMING (같은 스테이지)
VICTORY ──(즉시)──▶ stage.nextStage() 후 FARMING (다음 스테이지)
```

- **FARMING**: 지금과 동일하게 몬스터가 무한 리스폰되는 안전한 파밍 상태. 스탯/장비 강화, 가챠 등 성장 활동을 하는 기본 상태. 스테이지가 바뀌지 않는 한 계속 유지된다.
- **WAVE(n)**: "도전" 버튼을 누르면 진입. 몬스터가 무한 리스폰되지 않고, 그 웨이브의 몬스터를 모두 처치해야 다음 웨이브로 넘어간다.
- **BOSS**: 마지막 웨이브를 클리어하면 보스 1마리가 등장. 처치하면 VICTORY, 그 전에 플레이어 HP가 0이 되면 DEFEAT.
- **DEFEAT/VICTORY**는 순간적인 전이 상태(토스트/연출용)이며, 즉시 FARMING으로 떨어진다.

### 5.2 데이터 모델 변경

**`battle.store.ts`에 추가**

```ts
type StagePhase = 'farming' | 'wave' | 'boss'

const stagePhase = ref<StagePhase>('farming')
const waveIndex = ref(0)          // 1 ~ WAVES_PER_STAGE (0 = 도전 전)
const isChallengeActive = computed(() => stagePhase.value !== 'farming')

function startChallenge(): void { ... }   // "도전" 버튼에서 호출
```

- `onMonsterKilled()`의 분기가 `stagePhase`에 따라 달라진다:
  - `farming`: 지금처럼 무조건 리스폰(`spawnMonsters()`), **`killCount` 기반 `nextStage()` 호출 제거**
  - `wave`: 남은 몬스터가 0이면 → 마지막 웨이브였는지 확인 → 아니면 다음 웨이브 스폰, 맞으면 보스 스폰
  - `boss`: 보스 처치 = 승리 처리 (`resolveVictory()`)
- `monsterAttack()`의 "HP 0 → 자동 회복" 분기는 `stagePhase === 'farming'`일 때만 유지. `wave`/`boss` 중에는 HP 0 → `resolveDefeat()` 호출.

**새 상수** (매직넘버 금지 규칙 준수)

```ts
// battle.store.ts
const WAVES_PER_STAGE = 3
const WAVE_MONSTER_COUNT = MAX_MONSTERS   // 기존 4마리 재사용

// stage.store.ts — createMonsterForStage()와 나란히 두는 게 자연스러워 이 파일로 옮김
const BOSS_HP_MULTIPLIER = 8
const BOSS_ATTACK_MULTIPLIER = 1.5
const BOSS_GOLD_MULTIPLIER = 10
```
> 실제 배율은 플레이테스트로 조정 (5.5 참고). 구조 확정이 이번 RFC의 목적.

**`types/game.ts`의 `Monster`에 추가**

```ts
export interface Monster {
  // ...기존 필드
  isBoss: boolean   // 렌더러/HP바가 보스를 구분해서 그리는 데 사용
}
```

**`stage.store.ts`에 추가**

```ts
function createBossForStage(stage: number): Monster {
  // createMonsterForStage()를 기반으로 HP/공격력/골드에 배율 적용, isBoss: true, 이름에 "보스" 접두어
  // speed: 0으로 스폰해 배회하지 않고 고정 위치(BOSS_X)에 버티고 선다
}
```

### 5.3 UI 변경

| 컴포넌트 | 변경 |
|---|---|
| `StagePanel.vue` | "3마리 처치마다 자동으로 다음 스테이지" 문구 제거. `stagePhase === 'farming'`일 때만 "도전" 버튼 노출(비활성 조건 없음 — 페널티 없이 언제든 재도전 가능하므로). 도전 중에는 버튼 대신 진행 상태 표시. |
| `HuntQuestBox.vue` | 현재 "몬스터 처치 X/3"(킬카운트 mod 3) 문구를 상태별로 교체: farming → 도전 유도 문구, wave → "웨이브 2/3", boss → "보스전!" |
| `MonsterHpBars.vue` | `monster.isBoss`면 바 크기/색을 다르게(예: 금색 테두리 + 왕관 아이콘) 표시해 일반 몹과 구분 |
| `GameRenderer.ts` | 보스는 기존 스프라이트를 더 큰 스케일로 렌더링(전용 아트 없이 MVP 대응). 등장 시 화면 흔들림 등 간단한 연출 고려 |
| 신규: 승리/패배 토스트 | 기존 `hunt-toast` 패턴 재사용 — "🏆 보스 처치! 스테이지 N 클리어" / "💀 보스전 실패... 다시 강해져서 도전하세요" |

### 5.4 세이브 데이터 영향 — **변경 없음**

`SaveData`(saveService.ts)에는 애초에 `monsters`, `killCount`, 전투 진행 상태가 저장되지 않는다 (장비/스탯/골드/스킬 등 "성장" 상태만 저장). 새로 추가하는 `stagePhase`/`waveIndex`도 같은 원칙으로 **세션 한정(비영속)** 상태로 둔다.

- 새로고침/재접속 시 항상 `farming`으로 시작 (도전 중이었어도 진행 상태는 초기화됨)
- 세이브 스키마 버전업/마이그레이션 불필요

### 5.5 밸런스 (후속 작업, 이번 RFC에서 수치 확정 안 함)

- 보스 배율(HP x8, 공격 x1.5, 골드 x10)은 임시값. 실제 플레이 후 조정.
- 웨이브 수(3)와 웨이브당 몬스터 수(4)도 스테이지 진행에 따라 고정할지, 스테이지가 오를수록 늘릴지는 별도 논의.

## 6. 마이그레이션 / 테스트 영향

- **`battle.store.ts`의 `killCount % 3 === 0 → nextStage()` 제거**로 인해, 이 로직에 암묵적으로 의존하던 흐름이 있는지 재확인 필요. 확인 결과 대부분의 E2E는 `seedSaveAndReload`로 `currentStage`를 직접 시딩하므로 영향 적음.
- `tests/e2e/combat/monster-spawn.spec.ts` (직전에 `quest-kill-progress` testid 기반으로 재작성함) — `HuntQuestBox`가 상태별 문구로 바뀌면 이 테스트도 다시 손봐야 함.
- 신규 E2E 시나리오 필요:
  - 도전 → 웨이브 1~3 클리어 → 보스 등장 → 보스 처치 → 다음 스테이지 진입 확인
  - 도전 → 보스전 중 HP 0 → 파밍 복귀 확인 (스테이지 안 바뀜, 페널티 없음, "도전" 버튼 재노출)
  - 파밍 중에는 몬스터가 계속 리스폰되지만 웨이브/보스 중에는 리스폰 안 되는 것 확인

## 7. 단계별 구현 계획

1. **Phase A (상태 머신 + 데이터 모델)**: `battle.store.ts`/`stage.store.ts`/`types/game.ts` 변경, UI는 최소한(텍스트 기반)으로만 확인
2. **Phase B (UI/연출)**: 도전 버튼, 웨이브/보스 인디케이터, 보스 HP바 차별화, 승리/패배 토스트
3. **Phase C (밸런스)**: 보스 배율/웨이브 수 조정, 스테이지별 차등 검토
4. **Phase D (사운드/이펙트)**: 기존 TODO.md 기술부채 "사운드 전무" 항목과 연계해 보스 등장/승리/패배 SFX 추가

## 8. 미해결 질문 (Open Questions) — 구현 시 결정된 사항

- [x] 웨이브 단계 몬스터 이동: 기존 배회(wander) 로직 그대로 재사용. 전용 "돌진" 패턴은 도입하지 않음 (후속 과제로 남김)
- [x] 보스 등장 연출: MVP는 스케일 확대(x1.8) + 붉은 틴트 + 왕관 아이콘만 적용. 화면 흔들림 등 추가 연출은 Phase D(사운드/이펙트)로 이월
- [x] 스킬 광역(cleave) 판정: 별도 분기 없이 기존 로직 그대로 유지 (보스는 1마리라 자연히 무관)
- [x] `StagePanel.vue` ◀/▶ 이동: `resetMonsters()`가 `stagePhase`를 `'farming'`으로 강제 리셋하도록 수정해, 도전 중 다른 스테이지로 이동하면 도전이 자동 취소됨

## 9. 영향 받는 파일 목록

```
src/stores/battle.store.ts       (상태 머신, 웨이브/보스 로직, killCount 자동진행 제거)
src/stores/stage.store.ts        (createBossForStage 추가)
src/types/game.ts                (Monster.isBoss)
src/components/stage/StagePanel.vue   (도전 버튼, 안내문구 교체)
src/components/hunt/HuntQuestBox.vue  (상태별 문구)
src/components/hunt/MonsterHpBars.vue (보스 바 스타일 분기)
src/game/GameRenderer.ts         (보스 스케일 렌더링)
tests/e2e/combat/*               (신규/수정 시나리오)
```
