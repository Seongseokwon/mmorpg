# RFC: 선천 능력치(영구 스탯) 도입 + 도전 시작 시 체력 완전 회복

- 상태: **구현 완료** (2026-07-07)
- 작성일: 2026-07-07
- 관련 코드: `player.store.ts`, `save.store.ts`, `saveService.ts`, `substats.store.ts`, `battle.store.ts`,
  `statCalc.ts`, `statData.ts`, `types/game.ts`
- 테스트: `tests/e2e/growth/innate-stats.spec.ts`, `tests/e2e/combat/wave-boss-challenge.spec.ts`(풀피 시작 시나리오 추가)

---

## 1. 결정된 핵심 사항 (논의 완료)

| 질문 | 결정 |
|---|---|
| 선천 능력치의 카테고리 | **기존 STR/VIT/DEX/LUK 4개에 합산.** 새 스탯 이름을 만들지 않고, 각 스탯의 "실제 값 = 수동 배분(`mainStats`) + 선천 능력치(`innateStats`)"로 계산 |
| 레벨업 성장량 | **레벨업마다 1포인트**, 4개 스탯 중 하나에 자동(무작위)으로 배분. 기존 수동 배분 포인트(레벨당 5)는 그대로 유지되는 별개 트랙 |
| UI 노출 방식 | **분리 표시 안 함.** 캐릭터 화면의 STR/VIT/DEX/LUK 숫자는 지금처럼 합계치 하나만 보여준다 |

## 2. 배경 / 목표

**요청 1 — 선천 능력치(영구 스탯)**

> 캐릭터 생성 시 랜덤으로 10의 영구능력치를 자동분배로 갖고, 레벨업마다 영구능력치도 같이 성장해야 한다.

현재 스탯 성장은 전적으로 "레벨업 → 포인트 획득 → 플레이어가 수동 배분"(`statPoints`, `allocateStat()`) 한 가지 트랙뿐이다. 이 RFC는:
- 캐릭터마다 시작 시점에 무작위성을 부여해 리롤/재시작 재미 요소를 추가하고
- 수동 배분과 무관하게 "가만히 있어도 조금씩 세지는" 배경 성장 곡선을 하나 더 깔아
플레이 감각을 보강하는 것이 목표다. 수동 배분 시스템은 손대지 않고 그 위에 얹는다.

**요청 2 — 도전 시작 시 체력 완전 회복**

지난 세션에서 도입한 웨이브/보스 도전 시스템(`battle.store.ts`)에서, "도전" 버튼을 눌러도 플레이어 HP는
파밍 중 깎인 상태 그대로 유지된다. 보스전처럼 실패 시 되돌아가는 하이스테이크 콘텐츠는 공정하게
풀피로 시작하는 게 맞다.

## 3. 제안 설계

### 3.1 선천 능력치 데이터 모델

**`types/game.ts`**

```ts
export interface SaveData {
  // ...기존 필드
  mainStats: MainStats       // 기존: 수동 배분치
  innateStats: MainStats     // 신규: 선천(자동) 능력치 — 생성 시 10포인트 무작위 배분, 레벨업마다 +1
}
```

**`player.store.ts`**

```ts
const innateStats = ref<MainStats>({ str: 0, vit: 0, dex: 0, luk: 0 })

// 공격력/HP/치명타/공속 등 "실제 효과"는 항상 이 합계치를 기준으로 계산한다
const totalMainStats = computed<MainStats>(() => ({
  str: mainStats.value.str + innateStats.value.str,
  vit: mainStats.value.vit + innateStats.value.vit,
  dex: mainStats.value.dex + innateStats.value.dex,
  luk: mainStats.value.luk + innateStats.value.luk,
}))

const baseAttack = computed(() => getAttackFromMainStats(totalMainStats.value))   // mainStats.value → totalMainStats.value
const baseMaxHp = computed(() => getHpFromMainStats(totalMainStats.value))        // 〃

function growInnateStats(points: number): void {
  for (let i = 0; i < points; i++) {
    innateStats.value[pickRandomMainStatId()] += 1
  }
}
```

`addExp()`의 레벨업 루프 안에서 기존 `statPoints.value += STAT_POINTS_PER_LEVEL` 옆에
`growInnateStats(1)`을 한 번 호출한다 (레벨 하나당 정확히 1포인트).

**새 헬퍼** (`statCalc.ts`에 추가 — 생성 시 10회, 레벨업 시 1회 호출로 재사용)

```ts
export function pickRandomMainStatId(): MainStatId {
  const ids: MainStatId[] = ['str', 'vit', 'dex', 'luk']
  return ids[Math.floor(Math.random() * ids.length)]
}

export function rollInnateStats(totalPoints: number): MainStats {
  const stats: MainStats = { str: 0, vit: 0, dex: 0, luk: 0 }
  for (let i = 0; i < totalPoints; i++) {
    stats[pickRandomMainStatId()] += 1
  }
  return stats
}
```

### 3.2 캐릭터 "생성" 시점 = `createDefaultSaveData()`

이 프로젝트엔 별도의 "캐릭터 생성" 화면/액션이 없다 — `save.store.ts`의 `load()`가
`loadSaveData()`(기존 IndexedDB 레코드)를 못 찾으면 `createDefaultSaveData()`를 쓰는 게 사실상 유일한
"신규 캐릭터" 분기다. 여기서 `innateStats: rollInnateStats(10)`를 채운다.

```ts
// saveService.ts
export function createDefaultSaveData(): SaveData {
  return {
    // ...
    innateStats: rollInnateStats(10),
  }
}
```

**기존(마이그레이션 이전) 세이브 처리**: `migrateSaveData()`의 각 분기는 이미 `const defaults =
createDefaultSaveData()`를 fallback 소스로 쓰고 있으므로, `innateStats: raw.innateStats ?? defaults.innateStats`
패턴만 추가하면 된다. 기존 유저는 최초 마이그레이션 시점에 딱 한 번 굴려진 값을 그대로 이어받고,
그 값이 세이브에 기록된 이후로는 다시 굴리지 않는다 — "생성 시 1회, 이후 영구 고정"이라는 의미의
자연스러운 연장.

### 3.3 다른 스토어에서의 참조 교체

`mainStats`를 직접 읽어 전투 수치를 계산하던 곳은 모두 `totalMainStats`를 보도록 바꿔야 새 선천치가
실제로 반영된다. 확인된 지점:

```
player.store.ts        baseAttack / baseMaxHp 계산
substats.store.ts       critRate (getTotalCritRate), attackIntervalMs (getAttackIntervalMs)
```

(장비 보너스는 `equipment.store.ts`에서 별도로 더해지는 구조라 영향 없음.)

### 3.4 세이브 데이터 영향

- `SaveData.innateStats` 필드 추가. 스키마 버전(v4)은 그대로 유지 — 기존에도 `gachaPity`, `meta` 같은
  필드를 `?? 기본값`으로 방어하며 버전을 안 올린 전례를 따른다.
- `save.store.ts`의 `applySaveData()`/`collectSaveData()`에 `innateStats` 반영 추가.
- `tests/fixtures/save-data.ts`(e2e 픽스처 계약)에도 `innateStats` 필드 추가.

### 3.5 도전 시작 시 체력 완전 회복

`battle.store.ts`의 `startChallenge()` 맨 앞에 한 줄 추가:

```ts
function startChallenge(): void {
  if (stagePhase.value !== 'farming') return

  usePlayerStore().syncHpToMax()   // 추가: 도전은 항상 풀피로 시작
  stagePhase.value = 'wave'
  waveIndex.value = 1
  // ...
}
```

## 4. UI 영향

- **없음(의도적).** `MainStatPanel.vue`의 STR/VIT/DEX/LUK 표시는 `player.mainStats[stat.id]` 대신
  `player.totalMainStats[stat.id]`를 보여주도록만 바뀐다 — 숫자가 더 커질 뿐, 선천치와 수동치를 구분해
  보여주는 UI는 만들지 않는다 (2절 결정 참고).
- 스탯 배분 버튼(`allocateStat`)은 여전히 `mainStats`(수동치)만 수정한다 — 선천치는 플레이어가 직접
  건드릴 수 없다.

## 5. 마이그레이션 / 테스트 영향

- 기존 `tests/e2e/growth/stat-allocation.spec.ts` 등 STR 값 등을 직접 assert하는 테스트는, 시딩 데이터에
  `innateStats: { str: 0, vit: 0, dex: 0, luk: 0 }`처럼 0으로 고정해두면 기존 assertion(예: "STR 값이
  정확히 N이어야 한다")이 그대로 유지된다. 픽스처 기본값을 0으로 두는 이유이기도 하다.
- 신규 시나리오 제안:
  - 저장 없이 첫 진입 시 `innateStats` 4개 합이 정확히 10인지 (분포는 랜덤이라 합계만 검증)
  - 레벨업 1회 후 `innateStats` 합이 11이 되는지
  - 새로고침 후에도 `innateStats`가 유지되는지 (재롤 안 됨)
  - "도전" 버튼 클릭 시 HP가 100%로 즉시 회복되는지 (파밍 중 일부러 HP를 깎아둔 뒤 확인)

## 6. 미해결 질문 (Open Questions)

- [ ] 선천 능력치도 강화 주문서처럼 "재분배권" 같은 후속 재화/소모품으로 나중에 리롤 가능하게 열어둘지 —
  이번 RFC 범위에서는 **불가(고정)**로 가정. 필요하면 별도 RFC.
- [ ] 레벨업 시 선천 능력치가 무작위 배분이라, 장기적으로 4개 스탯에 고르게 분산되긴 하지만 특정 캐릭터가
  운 나쁘게 한쪽으로 쏠릴 수 있음 — 밸런스상 허용 범위인지 (개인적으로는 "선천"이라는 컨셉상 편차가 있는
  게 자연스럽다고 봄).
- [ ] 캐릭터 화면에 "선천 능력치 포함" 같은 작은 안내 문구/툴팁을 넣을지, 아니면 정말 아무 표시도 안 할지.

## 7. 영향 받는 파일 목록

```
src/types/game.ts             (SaveData.innateStats)
src/services/statCalc.ts      (pickRandomMainStatId, rollInnateStats)
src/stores/player.store.ts    (innateStats, totalMainStats, growInnateStats, baseAttack/baseMaxHp 참조 교체)
src/stores/substats.store.ts  (critRate/attackIntervalMs가 totalMainStats 참조하도록 교체)
src/stores/save.store.ts      (applySaveData/collectSaveData에 innateStats 추가)
src/services/saveService.ts   (createDefaultSaveData, migrateSaveData)
src/stores/battle.store.ts    (startChallenge에서 syncHpToMax 호출)
src/composables/useGameSession.ts   (autosave watch 배열에 innateStats 추가 — mainStats 옆에 나란히)
src/components/stats/MainStatPanel.vue   (표시를 mainStats → totalMainStats로 교체)
tests/fixtures/save-data.ts   (innateStats 필드 추가)
tests/e2e/**                  (신규 시나리오 + 기존 스탯 관련 테스트 시딩값 점검)
```
