# RFC: 장비 시스템 확장 (등급 추가 · 강화 상한 확대 · 판매 · 합성)

- 상태: **제안 (구현 전 — 검토/확정 요청)**
- 작성일: 2026-07-07
- 관련 코드: `types/game.ts`, `data/gameData.ts`, `data/rewardData.ts`, `services/equipmentService.ts`,
  `services/rewardService.ts`, `stores/equipment.store.ts`, `stores/inventory.store.ts`,
  `stores/gacha.store.ts`, `components/inventory/InventoryPanel.vue`, `components/equipment/EquipmentPanel.vue`,
  `components/modal/EnhanceModal.vue`
- 테스트: (구현 시 신규 작성 예정, 8절 참고)

---

## 1. 배경 / 목표

네 가지 요청을 하나의 RFC로 묶는다 — 전부 "장비" 도메인이고, 서로 데이터/UI를 공유하는 지점이 많다
(3절 참고: 판매가 계산이 합성 실패 보상에 재사용되고, 다중선택 UI가 일괄판매·합성 재료선택에
공유된다).

| # | 요청 (원문) |
|---|---|
| 1 | 장비 등급 개선: `common\|uncommon\|rare\|epic` → `...\|unique\|legendary`, 드랍 확률도 함께 개선 |
| 2 | 장비 강화 개선: MAX강화 20 → 50강, 확률 조정 |
| 3 | 장비 판매 기능: 일괄 판매 + 개별 판매 |
| 4 | 장비 합성 기능: 동일 등급 장비를 합성해 낮은 확률로 다음 등급 장비 획득 |

**목표**
- 스테이지가 오를수록 장비 등급 상한이 계속 의미 있게 느껴지도록(현재 4단계는 중후반부터 체감
  성장이 정체됨), 강화 상한도 함께 늘려 "성장의 끝"을 훨씬 뒤로 미룬다.
- 장비 인벤토리가 계속 쌓이기만 하고 정리 수단이 없는 문제(판매)와, 안 쓰는 저등급 장비를
  버리는 대신 다음 등급에 투자하는 재화 싱크(합성)를 동시에 해결한다.

**비목표 (이번 RFC 범위 밖)**
- 장비 세트 효과, 소켓/각인 같은 신규 장비 하위 시스템
- 합성 실패 시 "합성 천장(pity)" 카운터 — 8절 미해결 질문에서 옵션으로만 제시, 이번 범위는 아님
- 강화/합성 애니메이션·연출 강화 (기존 `EnhanceModal`의 결과 연출 재사용)

---

## 2. 현재 구조 요약

```
types/game.ts
  export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic'

data/gameData.ts
  RARITY_LABELS / RARITY_COLORS       Record<EquipmentRarity, string>  ← 등급 4종 하드코딩
  EQUIPMENT_TEMPLATES                  등급×슬롯(weapon/armor) 조합별 baseAttack/baseHp/statSpread

data/rewardData.ts
  GACHA_RATES                          Record<'common'|'uncommon'|'rare'|'epic', number>  (뽑기 확률)
  GACHA_PITY_THRESHOLD = 20             20회 무과금 뽑기 시 rare 이상 확정

services/equipmentService.ts
  RARITY_WEIGHTS                       필드 드랍 확률 가중치 (스테이지업 시 가중치 보너스)
  MAX_ENHANCE_LEVEL = 20
  getEnhanceCost()                      100 * rarityMultiplier * 1.4^enhanceLevel
  getEnhanceSuccessRate()                0~20강 사이 7단계 계단식 확률(100%→0%)
  compareEquipment()                    ATK+HP+enhanceLevel*5 점수 비교 (등급 직접 참조 없음)

services/rewardService.ts
  rollRarity() / RARITY_ORDER           가챠 등급 추첨 (RARITY_WEIGHTS와 별개 테이블: GACHA_RATES)

stores/inventory.store.ts               장비 획득/장착 해제 시 가방에 보관. 판매 기능 없음
stores/equipment.store.ts               장착/강화만 있음. 합성 없음
```

**중요한 기존 안전장치**: `RARITY_LABELS`, `RARITY_COLORS`, `getEnhanceCost()`의 `rarityMultiplier`는
전부 `Record<EquipmentRarity, ...>` 형태다. `EquipmentRarity`에 `'unique' | 'legendary'`를 추가하는
순간 이 세 곳은 **TypeScript 컴파일 에러**로 즉시 드러난다 — 빠뜨릴 위험이 낮다는 뜻이라 안심해도 된다.

---

## 3. 제안 설계

### 3.1 장비 등급 추가 (`unique`, `legendary`)

**등급 순서 및 표시** — 메이플 캐시 아이템 잠재능력 등급 네이밍과 유사한 흐름으로 통일:

| 등급 | 라벨 | 색상(안) |
|---|---|---|
| common | 일반 | `#b0b0b0` (기존) |
| uncommon | 고급 | `#4ecca3` (기존) |
| rare | 희귀 | `#5b9bd5` (기존) |
| epic | 영웅 | `#c77dff` (기존) |
| **unique** | **유니크** | `#f0a020` (신규 — 앰버) |
| **legendary** | **전설** | `#ff4d4d` (신규 — 크림슨. 기존 골드 강조색 `#f5c542`과 겹치지 않게 선택) |

**`EQUIPMENT_TEMPLATES` 신규 항목** — 기존 배율(공용 대략 2~2.4배씩 증가)을 그대로 연장:

| slot | rarity | baseAttack/baseHp | statSpread |
|---|---|---|---|
| weapon | unique | 90 | 0.12 |
| weapon | legendary | 160 | 0.10 |
| armor | unique | 320 | 0.12 |
| armor | legendary | 550 | 0.10 |

**드랍 확률 (`RARITY_WEIGHTS`, 필드 드랍)** — 기존 가중치 합 100에 초저확률로 추가하고, 기존
"스테이지업 시 가중치 보너스" 패턴을 그대로 연장한다(하드 게이트 없음 — 초반에도 이론상 나올 수
있으나 극히 희박):

```ts
const RARITY_WEIGHTS = [
  { rarity: 'common',    weight: 55 },
  { rarity: 'uncommon',  weight: 28 },
  { rarity: 'rare',      weight: 13 },
  { rarity: 'epic',      weight: 3.5 },   // 4 → 3.5로 소폭 하향(신규 등급에 확률 배분)
  { rarity: 'unique',    weight: 0.4 },   // 신규
  { rarity: 'legendary', weight: 0.1 },   // 신규
]
```
```ts
// pickRarity()의 스테이지 보너스 — 기존 패턴 연장
if (stage >= 5)  weight('uncommon') += 5    // 기존
if (stage >= 8)  weight('rare')     += 4    // 기존
if (stage >= 12) weight('epic')     += 3    // 기존
if (stage >= 18) weight('unique')    += 1.5  // 신규
if (stage >= 25) weight('legendary') += 0.4  // 신규
```

**가챠 확률 (`GACHA_RATES`)** — 필드 드랍과 별개 테이블이라 따로 조정 필요:

```ts
export const GACHA_RATES = {
  common: 55, uncommon: 28, rare: 13.5, epic: 3, unique: 0.4, legendary: 0.1,
} as const  // 합 100
```

`rollRarity()`의 `RARITY_ORDER`도 6개로 확장. 기존 천장(`GACHA_PITY_THRESHOLD=20`)의
"rare 이상 확정" 판정(`isRarePlus`)은 **그대로 유지** — unique/legendary는 그 위에 얹히는
보너스로 취급하고 별도 천장은 이번 범위에서 만들지 않는다(8절 참고).

**`compareEquipment()`**: 변경 불필요. ATK/HP 절대값 기반 비교라 등급이 높으면 자연히 점수도
높아지는 구조가 그대로 성립한다.

---

### 3.2 강화 상한 확대 (20 → 50강)

**문제**: 현재 비용 공식 `100 * rarityMultiplier * 1.4^enhanceLevel`을 그대로 50강까지 밀면
`1.4^50 ≈ 2×10^7` — 영웅 장비 기준 코스트가 80억 루나에 도달한다. **성장 곡선이 아니라 사실상
"넘을 수 없는 벽"이 되므로, 상한만 올리고 지수 밑값은 그대로 두면 안 된다.**

**제안**: 지수 밑값을 `1.4` → `1.15`로 낮춘다(공식 구조는 그대로 유지 — 코드 변경 최소화).
비교:

| 강화 레벨 | 기존(1.4, ~20강이 사실상 만렙) | 신규(1.15, 50강이 만렙) |
|---|---|---|
| +10 | 100 × mult × 28.9 | 100 × mult × 4.0 |
| +20 (기존 만렙) | 100 × mult × 836 | 100 × mult × 16.4 |
| +30 | - | 100 × mult × 66.2 |
| +40 | - | 100 × mult × 267.9 |
| **+50 (신규 만렙)** | - | **100 × mult × 1083.7** |

영웅(mult=4) 기준 기존 만렙(+19) 비용이 약 24만 루나였는데, 신규 만렙(+50) 비용은 약 43만
루나로 **기존 "체감 최종 비용"의 약 1.8배** 선에서 끝난다 — "훨씬 길지만 결국 도달 가능한" 곡선.
`ENHANCE_COST_GROWTH_BASE = 1.15`로 이름 붙은 상수로 뺀다(기존엔 `1.4`가 인라인 매직넘버였음 —
겸사겸사 CLAUDE.md 매직넘버 금지 규칙에 맞춘다).

**성공률 곡선**: 기존 0~20강 구간(100→80→60→40→25→15→10→0%)은 **그대로 유지**(이미 그 구간을
강화해본 유저의 체감을 바꾸지 않기 위함). 21강부터는 20강의 10%에서 단조 감소하도록 연장:

| 구간 | 성공률 | 구간 | 성공률 |
|---|---|---|---|
| 0~2강 | 100% | 27~29강 | 5% |
| 3~5강 | 80% | 30~32강 | 4% |
| 6~8강 | 60% | 33~35강 | 3% |
| 9~11강 | 40% | 36~38강 | 2% |
| 12~14강 | 25% | 39~44강 | 1% |
| 15~17강 | 15% | 45~49강 | 0.5% |
| 18~20강 | 10% | **50강(만렙)** | 0% (더 이상 강화 불가) |
| 21~23강 | 8% | | |
| 24~26강 | 6% | | |

**주문서 보너스(+15%)는 그대로 유지**하되, 상한 근처(1~2%대)에서는 주문서를 껴도 여전히 극악
확률이 되도록 `Math.min(100, rate + 15)` 캡은 유지한다.

> 🟡 위 수치는 전부 **placeholder — 플레이테스트로 조정 필요**. 이 RFC의 목적은 "1.4배 지수를
> 그대로 두면 안 된다"는 구조적 문제를 짚고 방향을 맞추는 것이지, 최종 확률표 확정이 아니다.

---

### 3.3 장비 판매 기능

**판매가 공식** (신규 `getSellPrice()`):

```ts
const BASE_SELL_PRICE: Record<EquipmentRarity, number> = {
  common: 10, uncommon: 25, rare: 60, epic: 150, unique: 400, legendary: 1000,
}
const SELL_ENHANCE_BONUS = 0.1  // 강화 1강당 판매가 +10%

function getSellPrice(item: Equipment): number {
  return Math.floor(BASE_SELL_PRICE[item.rarity] * (1 + item.enhanceLevel * SELL_ENHANCE_BONUS))
}
```

**범위**: 장착 중인 장비는 판매 대상에서 제외 — 실수로 착용 장비를 파는 사고를 막기 위해
`InventoryPanel`(가방)에서만 판매 가능, `EquipmentPanel`(장착 슬롯)에는 판매 버튼을 두지 않는다
(장착 해제 → 가방에서 판매하는 기존 동선 그대로).

**UI**:
- 개별 판매: 가방 아이템 행에 "판매" 버튼 추가(장착 버튼 옆). 확인 없이 즉시 판매(되돌릴 수
  없지만 개별 아이템이라 리스크가 낮음 — `EnhanceModal`처럼 모달까지는 과함).
- 일괄 판매: 가방 상단에 "선택 모드" 토글 → 아이템마다 체크박스 → 하단에 "선택 판매(N개, 총
  🌙 XXX)" 버튼. 다중 선택 후 판매는 되돌릴 수 없는 규모가 크므로 **확인 모달**(신규
  `SellConfirmModal.vue`, `EnhanceModal`과 동일한 모달 셸 재사용)을 거친다.

**Store**: `inventory.store.ts`에 추가
```ts
function sellEquipment(id: string): number | null       // 성공 시 획득 골드, 실패 시 null
function sellEquipmentBulk(ids: string[]): number        // 총 획득 골드
```
내부에서 `useCurrencyStore().addGold(...)` 호출(기존 `achievement.store.ts`의 `applyReward()`가
이미 쓰는 패턴과 동일).

---

### 3.4 장비 합성 기능

**재료 조건**: 동일 등급 + 동일 슬롯(무기/무기, 방어구/방어구) 장비 **3개**를 소모해 다음 등급
장비 1개 획득을 시도한다. 슬롯을 맞추는 이유: "무기 3개 합쳤는데 방어구가 나왔다"는 혼란을 피하고,
결과물의 슬롯을 예측 가능하게 하기 위함. `legendary`는 다음 등급이 없으므로 합성 재료로 쓸 수
없다(합성 UI에서 legendary 아이템은 선택 불가로 비활성화).

**성공 확률** (등급이 높을수록 더 어려움 — "낮은 확률로"라는 요청 반영):

| 재료 등급 → 결과 등급 | 성공률 |
|---|---|
| common → uncommon | 60% |
| uncommon → rare | 40% |
| rare → epic | 25% |
| epic → unique | 12% |
| unique → legendary | 5% |

**결과물**: 성공 시 `createRandomEquipment()`을 재사용하되 등급을 강제 지정하는 오버로드
(`createRandomEquipment(stage, forcedRarity?)`)로 재료와 같은 슬롯 + 다음 등급 아이템 1개 생성.
스탯은 현재 스테이지 기준으로 새로 굴린다(합성 시점 스테이지가 기준 — 저스테이지에서 고등급
재료를 미리 합성해둬도 결과물 스탯이 그 시점 스테이지에 묶이는 게 자연스러움).

**실패 시**: 재료 3개는 **소모된다**(합성이 진짜 도박이 되도록 — 대부분의 합성/강화 시스템의
표준 패턴). 대신 위로 보상으로 **재료 3개의 판매가 합산의 30%를 골드로 환급**한다(3.3의
`getSellPrice()` 재사용 — 두 기능이 자연스럽게 맞물리는 지점).

**UI**: `EquipmentPanel` 또는 `InventoryPanel`에 "합성" 탭 신규 추가. 3.3의 "선택 모드"와 동일한
다중 선택 UI를 재사용하되, 합성 탭에서는 **같은 등급+슬롯인 아이템만 선택 가능**하도록 필터링하고
정확히 3개가 선택됐을 때만 "합성하기" 버튼이 활성화된다. 결과는 `EnhanceModal`과 유사한 성공/실패
연출 모달로 표시.

**Store**: 신규 `equipment.store.ts`(또는 별도 `fusion.store.ts`) 액션
```ts
function fuseEquipment(materialIds: string[]): { success: boolean; result: Equipment | null; refundGold: number } | null
// null = 조건 불충족(3개 아님/등급·슬롯 불일치/legendary 포함)
```

---

## 4. 공통 인프라 — 다중 선택 UI 재사용

3.3(일괄 판매)과 3.4(합성 재료 선택)는 둘 다 "가방에서 여러 아이템을 체크박스로 고른다"는 동일한
상호작용이다. `useEquipmentSelection()` 같은 composable로 뽑아서 두 기능이 공유하게 하면
중복 구현을 피할 수 있다 — 선택 상태(`Set<string>`), 필터 조건(판매=제한 없음, 합성=등급+슬롯
일치), 선택 개수 검증만 프로퍼티로 다르게 준다.

---

## 5. 세이브 데이터 영향

- `Equipment`/`SaveData` 타입 자체는 **변경 없음** — 판매는 제거, 합성은 결과물 생성이라 기존
  `equipmentBag: Equipment[]` 구조를 그대로 쓴다.
- (선택) `MetaStats`에 `totalFusions: number` 추가해 "합성 장인" 계열 업적을 만들 수 있는 여지를
  남긴다. 기존 `migrateSaveData()`가 이미 `meta: { ...defaults.meta, ...raw.meta }` 스프레드
  병합을 쓰고 있어서, **버전을 올리지 않고도** 안전하게 새 meta 필드를 추가할 수 있다(기존
  세이브는 그냥 0으로 채워짐).
- `EquipmentRarity` 유니언 확장 자체는 스키마 변경이 아니라 타입 확장이라 마이그레이션 불필요.
  기존 세이브에 저장된 `common/uncommon/rare/epic` 장비는 그대로 유효한 값이다.

---

## 6. 테스트 계획 (구현 시)

- `services/equipmentService.spec` 성격의 e2e (또는 순수 함수 유닛 테스트 도입 여부는 별도 판단):
  - 새 등급 드랍이 실제로 나오는지(스테이지 25+ 시딩 후 대량 드랍 시뮬레이션 — 낮은 확률이라 결정론적
    테스트가 어려우면 `Math.random` 모킹 고려)
  - +50강에서 강화 버튼 비활성화(`tests/e2e/regression/enhance-max-level.spec.ts` 확장)
  - 개별/일괄 판매 후 골드 증가 + 가방에서 제거 확인
  - 합성 성공/실패 각각 시나리오(재료 소모 확인, 실패 시 골드 환급 확인) — 확률 기반이라
    `Math.random` 모킹 필요
- 기존 `tests/e2e/regression/enhance-max-level.spec.ts`("+19는 정상 강화 가능")는 새 상한(50)
  기준으로 재작성 필요.

---

## 7. UI 영향 종합

- `InventoryPanel.vue`: 개별 판매 버튼, 선택 모드 토글, 일괄 판매 액션바, (신규) 합성 탭
- `EquipmentPanel.vue`: 변경 없음(판매/합성 대상에서 장착 슬롯 제외 결정에 따름)
- 신규 컴포넌트: `SellConfirmModal.vue`, `FusionModal.vue`(또는 기존 `EnhanceModal` 패턴 재사용)
- `data/gameData.ts`: `RARITY_LABELS`/`RARITY_COLORS`에 2개 항목 추가만으로 기존 모든 화면(인벤토리,
  장비창, 가챠 결과 모달 등)에 자동 반영됨 — 등급 표시가 이미 이 두 상수를 통해서만 이뤄지기 때문.

---

## 8. 미해결 질문 (Open Questions)

- [ ] 3.2의 21~50강 성공률 계단 폭(3구간씩)이 적정한지 — 더 세분화할지, 지금처럼 유지할지.
- [ ] 합성 실패 시 "합성 천장(pity)" 카운터를 추가할지 — 가챠처럼 N회 연속 실패 시 확정 성공.
  이번 RFC는 **미포함**으로 제안했으나, 유니크/전설처럼 성공률이 매우 낮은 구간에서 유저 좌절감이
  클 수 있어 재고려 여지가 있음.
- [ ] 합성 재료 개수(3개)가 적정한지 — 더 늘리면(예: 5개) 희소성은 높아지지만 저등급 장비가
  쌓이는 속도(드랍률)와 맞아야 한다.
- [ ] 판매 기본가(`BASE_SELL_PRICE`)가 강화 비용(3.2) 대비 상대적으로 적정한지 — 너무 낮으면
  판매가 무의미, 너무 높으면 강화 대신 판매-재구매가 더 이득이 되는 역전 현상이 생길 수 있음.
- [ ] 유니크/전설 등급의 드랍/가챠 확률(0.4%/0.1%)이 최종 밸런스로 적절한지 — 실제 플레이
  데이터 없이 잡은 추정치.

---

## 9. 영향 받는 파일 목록

```
src/types/game.ts                          EquipmentRarity 유니언 확장, (선택) MetaStats.totalFusions
src/data/gameData.ts                       RARITY_LABELS/COLORS, EQUIPMENT_TEMPLATES 확장
src/data/rewardData.ts                     GACHA_RATES 확장
src/services/equipmentService.ts           RARITY_WEIGHTS, MAX_ENHANCE_LEVEL, getEnhanceCost(성장 상수),
                                            getEnhanceSuccessRate(구간 확장), getSellPrice(신규),
                                            getNextRarity(신규), createRandomEquipment(forcedRarity 인자 추가)
src/services/rewardService.ts              rollRarity/RARITY_ORDER 확장
src/stores/inventory.store.ts              sellEquipment, sellEquipmentBulk
src/stores/equipment.store.ts              fuseEquipment (또는 신규 스토어)
src/stores/meta.store.ts                   (선택) totalFusions 트래킹
src/composables/useEquipmentSelection.ts   신규 — 판매/합성 공용 다중 선택 로직
src/components/inventory/InventoryPanel.vue  판매 버튼, 선택 모드, 합성 탭
src/components/modal/SellConfirmModal.vue    신규
src/components/modal/FusionModal.vue         신규
tests/e2e/regression/enhance-max-level.spec.ts  상한 50 기준 재작성
tests/e2e/growth/equipment-sell.spec.ts      신규
tests/e2e/growth/equipment-fusion.spec.ts    신규
```
