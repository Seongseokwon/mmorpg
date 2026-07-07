# 개발 가이드 (신규/주니어 개발자용)

이 문서는 "메이플 키우기 감성의 웹 방치형 RPG"를 만드는 이 프로젝트에 처음 합류한 개발자가
**혼자 힘으로 기능을 하나 추가할 수 있을 때까지** 필요한 최소한의 지식을 담는다.

프로젝트의 규칙 자체(금지 사항, 네이밍, 커밋 컨벤션 등)는 [CLAUDE.md](../CLAUDE.md)가 원본이다.
이 문서는 그 규칙들이 **실제 코드에서 어떻게 구현되어 있는지**를 초보자 눈높이에서 풀어 설명한다.
읽는 순서: 이 문서 → [TODO.md](../TODO.md)(지금 뭐가 되어있고 뭐가 남았는지) →
[MEMORY.md](../MEMORY.md)(과거에 뭘 발견/수정했는지) → 필요하면 `docs/rfc-*.md`(굵직한 설계 결정 배경).

---

## 1. 이 게임을 한 문장으로

**"자동전투 → 골드/장비 획득 → 강화·스탯 투자 → 더 강해져서 다음 스테이지 도전"** 이 루프를
계속 돌리는 게임이다. 새 기능을 만들 때는 항상 "이게 이 루프를 더 재미있게/명확하게 만드는가?"를
먼저 따진다 (CLAUDE.md의 "Claude Behavior Rules" 참고).

---

## 2. 아키텍처: 세 개의 레이어만 기억하면 된다

```
┌─────────────┐     읽기/액션 호출      ┌──────────────┐
│  Vue 컴포넌트 │ ───────────────────▶ │ Pinia Store   │
│ (components/, │ ◀─────────────────── │ (stores/)     │
│  views/)      │   반응형 상태 구독     │  "게임 상태"    │
└─────────────┘                       └──────┬───────┘
                                              │ 계산 위임
                                              ▼
                                       ┌──────────────┐
                                       │  Service      │
                                       │ (services/)   │
                                       │ 순수 계산 함수  │
                                       └──────────────┘

┌─────────────┐   battleEventBus (이벤트)  ┌──────────────┐
│ battle.store │ ─────────────────────▶  │ GameRenderer  │
│  (게임 상태)   │                          │ (game/, PixiJS)│
└─────────────┘                          └──────────────┘
```

- **컴포넌트(Vue)는 "무엇을 보여줄지"만 안다.** 상태를 직접 계산하지 않고 store의 값을 그대로
  읽거나(computed 등) store의 액션 함수를 호출만 한다.
- **Store(Pinia)는 "게임 상태 그 자체"다.** `ref`/`computed`로 상태를 들고, 외부에는 액션 함수만
  노출한다. 컴포넌트가 store의 `ref`를 직접 mutate하는 코드는 없어야 한다 (CLAUDE.md: "Store 직접
  mutation 금지, action 기반 상태 변경").
- **Service는 "input → output" 순수 함수 모음이다.** 랜덤 굴림, 데미지 계산, 강화 확률 계산처럼
  store 상태에 의존하지 않는 로직은 전부 여기 있다. 테스트하기 쉽고, store가 비대해지는 걸 막는다.
- **PixiJS 렌더러(`src/game/GameRenderer.ts`)는 그림만 그린다.** 게임 상태를 갖고 있지 않다.
  `battle.store.ts`가 몬스터를 죽이거나 스킬을 쓰면 `battleEventBus.emit(...)`으로 이벤트만 흘려주고,
  렌더러는 그 이벤트를 구독해서 애니메이션/데미지 텍스트를 그린다. 이 분리 덕분에 "전투 로직"과
  "전투 연출"이 서로 몰라도 된다 — CLAUDE.md의 "PixiJS는 렌더러 역할만 수행" 규칙이 실제로 이렇게
  구현돼 있다.

**틀리기 쉬운 부분**: PixiJS 캔버스 안에는 인벤토리/모달/HUD 같은 UI를 절대 그리지 않는다. 그런 건
전부 `components/` 아래 Vue 컴포넌트다. 캔버스에는 캐릭터, 몬스터, 배경, 이펙트, 데미지 숫자만 그린다.

---

## 3. 폴더 구조와 각 폴더의 책임

```
src/
  api/            (아직 비어있음 — Phase 4 백엔드 연동 시 사용)
  components/     Vue 컴포넌트. 기능별 하위 폴더 (hunt/, equipment/, inventory/, skill/, gacha/, reward/, stage/, stats/, modal/, battle/)
  composables/    Vue 3 컴포지션 함수. use* 접두사. store 여러 개를 조합하는 "접착제" 역할
  data/           게임 밸런스/텍스트 상수 (gameData.ts, rewardData.ts, statData.ts) — "매직넘버 금지" 규칙의 실체
  engine/         (아직 비어있음)
  game/           PixiJS 렌더러 (GameRenderer.ts, assets.ts, layoutConstants.ts). Vue/Pinia를 몰라야 한다
  services/       순수 계산 함수 (damageCalc, equipmentService, gameLoop, rewardService, saveService, statCalc)
  stores/         Pinia 스토어 = 게임 상태 (achievement, battle, currency, equipment, gacha, inventory, meta, player, reward, save, skill, stage, substats)
  systems/        (아직 비어있음)
  types/          공용 TypeScript 타입 (game.ts)
  utils/          (아직 비어있음)
  views/          라우트 단위 화면. 지금은 GameView.vue 하나뿐 (Vue Router 미설치, TODO.md 기술부채 #5)
```

폴더가 비어있어도 지우지 않는 이유는 CLAUDE.md가 정의한 목표 구조라서다 — 정말 안 쓸 것 같으면
지우기 전에 먼저 상의한다.

### 핵심 파일 지도 (처음 볼 때 이 순서로 읽으면 이해가 빠름)

1. `src/main.ts` → `src/App.vue` → `src/views/GameView.vue` : 앱 진입점. `GameView.vue`가
   `useGameSession()`을 호출하는 곳이자, 하단 네비게이션(`HuntNavBar`)이 어떤 `NavId`를 눌렀을 때
   어떤 패널을 시트(`GameSheet`)에 띄우는지 여기서 결정한다.
2. `src/composables/useGameSession.ts` : 게임의 "부팅 시퀀스"다. 세이브 로드 → 전투 시작 →
   게임 루프 시작 → 자동저장 watch 등록, 이 순서를 여기서 확인할 수 있다.
3. `src/services/gameLoop.ts` : `setInterval(100ms)`로 매 틱마다 `battle.store.ts`의 `tick()`을
   부른다. `battleEventBus`도 여기 있다 (store → renderer 이벤트 통로).
4. `src/stores/battle.store.ts` : 전투의 심장부. 몬스터 스폰, 공격 타이머, 웨이브/보스 상태 머신
   (`stagePhase`)이 다 여기 있다. 새 전투 기능을 추가한다면 대부분 여기부터 손대게 된다.
5. `src/stores/save.store.ts` + `src/services/saveService.ts` : 저장/로드/마이그레이션. 새 필드를
   `SaveData`에 추가할 때 반드시 같이 봐야 하는 두 파일.

---

## 4. 저장 시스템 이해하기 (여기서 가장 많은 버그가 났다)

- 저장소는 **IndexedDB** (브라우저 로컬, `idb` 라이브러리로 감쌈). 서버가 없으므로 기기를 바꾸면
  진행 상황이 사라진다 (Phase 4 전까지는 의도된 제약).
- `save.store.ts`의 `collectSaveData()` / `applySaveData()`가 "모든 store의 상태 ↔ SaveData 객체"를
  변환하는 유일한 통로다. **새 상태를 저장하고 싶다면 반드시 이 두 함수와 `SaveData` 타입, 그리고
  `saveService.ts`의 `createDefaultSaveData()` / `migrateSaveData()`를 함께 수정해야 한다.** 하나만
  고치면 "새로고침하면 사라지는" 버그가 난다.
- **저장은 즉시 일어나지 않는다.** `useGameSession.ts`에서 주요 상태를 `watch()`하다가 변화가
  생기면 `save.scheduleSave()`를 호출하는데, 이건 **1초 디바운스**를 건다 (같은 틱에 여러 값이
  바뀌어도 IndexedDB에 한 번만 쓰기 위함). 즉, 상태를 바꾼 직후 1초 안에 탭이 완전히 닫히면 그
  변경이 저장 안 될 수 있다.
  - 이 문제로 실제 버그가 있었다: 장비를 장착한 직후 곧바로 탭을 닫으면 장착이 풀린 채로
    재접속되는 버그. `visibilitychange`(숨김)/`pagehide` 이벤트에서 `save.saveNow()`를 강제 호출하고,
    장비 착용처럼 "되돌릴 수 없는 손실"인 상태는 디바운스 없이 즉시 저장하도록 고쳤다
    (`useGameSession.ts`, 회귀 테스트: `tests/e2e/regression/equip-lost-on-early-close.spec.ts`).
  - **교훈**: 자주 바뀌는 값(골드, 경험치)은 디바운스로 묶어도 되지만, 드물고 되돌릴 수 없는
    사용자 액션(장비 교체, 가챠 결과 등)은 `scheduleSave()` 대신 `saveNow()`를 직접 부르는 걸
    고려한다.
- **마이그레이션**: `SaveData.version`이 있다. 예전 버전 세이브를 읽으면 `migrateSaveData()`가
  최신 버전(v4) 포맷으로 변환한다. 세이브 스키마에 필드를 추가/변경할 때는 버전을 올리고
  마이그레이션 분기를 추가해야, 이미 게임을 하던 유저의 저장 데이터가 깨지지 않는다.
  `tests/e2e/save/migration.spec.ts`에서 이 로직을 검증한다.

---

## 5. 주요 게임 시스템별 안내

### 전투 (battle.store.ts)
- 사냥터에는 항상 몬스터 최대 4마리가 배회하며 자동 리스폰된다 (`farming` 상태).
- "도전" 버튼을 누르면 `wave` 상태로 전환 — 웨이브 1~3을 순서대로 클리어해야 `boss` 상태가 되고,
  보스를 잡으면 다음 스테이지로 진행한다. 도전 중 죽으면 페널티 없이 `farming`으로 복귀한다.
  설계 배경은 [rfc-defense-stage-system.md](rfc-defense-stage-system.md) 참고.
- 이 세 상태(`stagePhase: 'farming' | 'wave' | 'boss'`)는 **저장되지 않는다** — 새로고침하면 항상
  `farming`부터 시작한다 (의도된 설계, 5.4절 참고).

### 장비 (equipment.store.ts + equipmentService.ts)
- 드롭/강화/장착 관련 "계산"(확률, 데미지 배율, 등급 판정)은 `equipmentService.ts`의 순수 함수에
  있고, "상태 변경"(장착/해제/강화 실행)은 `equipment.store.ts`에 있다. 새 장비 로직을 추가할 때
  계산 로직이면 service, 상태 변화가 필요하면 store를 고친다.
- `autoEquipIfBetter()`가 몬스터 드롭 시 "지금 장착한 것보다 좋으면 자동 장착"을 판단한다.
  비교 함수(`compareEquipment`)의 부호를 실수로 뒤집으면 좋은 장비가 나쁜 드롭으로 바뀌는 대형
  버그가 난다 — 실제로 났던 회귀 버그다 (`tests/e2e/regression/auto-equip-inverted.spec.ts`).

### 스탯 (player.store.ts, substats.store.ts)
- 메인 스탯(STR/VIT/DEX/LUK)은 유저가 직접 분배, 선천 능력치(`innateStats`)는 캐릭터 생성 시
  무작위 배분되고 레벨업마다 자동으로 오른다. 둘 다 같은 스탯 타입에 합산된다.
  ([rfc-innate-stats-and-challenge-heal.md](rfc-innate-stats-and-challenge-heal.md) 참고)

### 보상 루프 (reward.store.ts, gacha.store.ts, achievement.store.ts)
- 오프라인 보상: 탭이 보이게 될 때마다(`visibilitychange`) 마지막 활동 시각과 현재 시각을 비교해
  재계산한다 (`rewardService.calculateOfflineReward`). 최대 누적 시간 상한이 있다.
- 가챠: 천장(pity) 카운터가 있어 일정 횟수 이상 뽑으면 확정 등급이 나온다.
- 업적: `AchievementDef`(정의) + `AchievementProgress`(진행/수령 여부)로 분리되어 있다. 새 업적을
  추가하려면 `data/`에 정의를 추가하고 `achievement.store.ts`의 트래킹 키를 연결한다.

---

## 6. 새 기능을 추가할 때 따라야 할 패턴

예를 들어 "새로운 소모품(부활 주문서)"을 추가한다고 하면:

1. **타입부터**: `src/types/game.ts`의 `ConsumableItem`이 이미 있으니 재사용 가능한지 먼저 확인한다.
   완전히 새로운 개념이면 타입을 추가한다.
2. **밸런스/텍스트는 data/로**: 아이템 이름, 효과 수치, 아이콘 같은 건 컴포넌트나 store에 하드코딩하지
   않고 `src/data/gameData.ts` 같은 곳에 상수로 둔다 (CLAUDE.md "Hardcoded game balance values" 금지).
3. **계산은 service에, 상태 변경은 store에**: "얼마나 회복되는가" 같은 순수 계산은
   `services/`에 함수로 추가하고, "인벤토리에서 소모품을 하나 쓴다"처럼 상태를 바꾸는 부분은
   해당 store(`inventory.store.ts`)의 액션 함수로 추가한다.
4. **UI는 컴포넌트로**: `components/inventory/InventoryPanel.vue`처럼 이미 있는 패널에 버튼을
   추가하거나, 필요하면 새 컴포넌트를 만든다. 항상 `<script setup lang="ts">` + Composition API.
5. **저장이 필요하면 SaveData까지 챙긴다**: 새 상태가 새로고침 후에도 유지돼야 한다면 4절의
   저장 시스템 체크리스트(`SaveData` 타입 → `createDefaultSaveData` → `collectSaveData`/
   `applySaveData` → 필요시 버전/마이그레이션)를 반드시 따라간다.
6. **e2e 테스트로 검증**: 아래 7절 참고. 최소한 "정상 동작 확인 1개"는 추가한다.
7. **문서화**: 시스템 하나를 통째로 새로 만드는 규모라면 `docs/`에 그 시스템 설명을 남긴다
   (CLAUDE.md "Documentation Rules"). 기존 시스템에 기능을 얹는 정도라면 이 문서나 TODO.md 갱신으로
   충분하다.

---

## 7. 테스트 (Playwright E2E)

이 프로젝트는 유닛 테스트보다 **E2E 테스트를 훨씬 신뢰한다** — 상태가 여러 store에 걸쳐
있어서(스탯 계산, 세이브 마이그레이션, 렌더러 동기화 등) 실제 화면에서 확인하는 게 더 확실하기
때문이다.

```bash
npm run test:e2e         # 전체 실행 (desktop + mobile 프로젝트)
npm run test:e2e:ui      # Playwright UI 모드로 디버깅
npx playwright test tests/e2e/save   # 특정 폴더만
```

- `tests/e2e/` 아래 폴더는 기능별로 나뉜다: `combat/`, `growth/`, `offline/`, `reward/`, `save/`,
  `mobile/`, `performance/`, 그리고 **`regression/`** — 한 번 실제로 발생했던 버그를 다시 안 나게
  막는 전용 폴더. 버그를 고치면 여기에 재현 테스트를 추가하는 게 이 프로젝트의 관례다.
- **결정론적으로 상태를 만드는 법**: 가챠 확률이나 자동전투 타이밍에 기대지 말고,
  `tests/helpers/db.ts`의 `seedSaveAndReload(page, buildSaveData({...}))`로 IndexedDB에 원하는
  상태를 직접 심고 새로고침한다. `tests/fixtures/save-data.ts`의 `buildSaveData()`/`buildEquipment()`가
  픽스처 빌더다.
  - 이 픽스처는 **앱 소스를 import하지 않고 SaveData 스키마를 독립적으로 복제**해 둔 것이다.
    `SaveData` 타입을 바꾸면 `tests/fixtures/save-data.ts`의 `FixtureSaveData`도 같이 맞춰줘야 한다.
- **시간에 의존하는 테스트**: `page.clock.install()` + `page.clock.fastForward()`로 실제 대기 없이
  "3시간 방치" 같은 상황을 재현한다 (`tests/e2e/offline/background-resume.spec.ts` 참고).
- **testid 관례**: 컴포넌트에 `data-testid="equip-enhance-weapon"`처럼 정적이거나,
  `:data-testid="`nav-${item.id}`"`처럼 동적인 testid를 붙인다. 텍스트나 CSS 클래스명이 아니라
  testid로 셀렉트하는 게 관례다 (텍스트/스타일이 바뀌어도 테스트가 안 깨지도록).

---

## 8. 코딩 컨벤션 빠른 요약

전체 규칙은 [CLAUDE.md](../CLAUDE.md)가 원본이지만, 실무에서 가장 자주 걸리는 것만 추리면:

- `<script setup lang="ts">` + Composition API만. Options API/전역 mutable state/직접 DOM 조작 금지.
- TypeScript strict — `any` 금지, 타입은 `interface` 우선.
- 매직 넘버 금지 — 밸런스 수치는 `data/`의 상수나 store 상단의 명명된 `const`로 뺀다
  (`battle.store.ts` 상단의 `WAVES_PER_STAGE`, `MAX_ENHANCE_LEVEL` 같은 식).
- Store 상태는 액션 함수로만 바꾼다 (컴포넌트에서 `store.someRef.value = x` 직접 대입 금지).
- `watch()`를 `onMounted`의 `await` 이후(비동기 콜백 안)에서 만들면 Vue가 자동으로 정리해주지
  않는다 — stop 핸들을 변수에 담아 `onUnmounted`에서 직접 호출한다
  (`useGameSession.ts`, `useGameRenderer.ts`에 이미 이 패턴이 있으니 그대로 따라 하면 된다).
- 커밋 메시지: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:` 접두사.

---

## 9. 자주 헷갈리는 함정 (Gotchas)

- **PixiJS 캔버스에 UI를 그리고 싶어질 때**: 참지 말고 Vue 컴포넌트로 만든다. 캔버스는 캐릭터/몬스터/
  이펙트/데미지 숫자 전용이다.
- **"새로고침하면 사라지는" 상태**: 대부분 `SaveData`/`collectSaveData`/`applySaveData` 중 하나를
  빠뜨린 것이다. 4절 체크리스트를 확인한다.
- **"방금 바꿨는데 저장이 안 된 것 같다"**: `scheduleSave()`는 1초 디바운스가 있다. 급하게 확인하려면
  `save.saveNow()`를 직접 호출하거나 1초 이상 기다린다.
- **게임 루프 틱은 항상 100ms 고정**이다 (`GameLoop` 생성자 기본값). 실제 경과 시간이 아니라
  `tickRate` 값을 그대로 delta로 넘기므로, 브라우저가 타이머를 스로틀링해도 한 틱의 "게임 내 시간"은
  변하지 않는다 (다만 틱이 덜 자주 불릴 뿐).
- **Store 간 순환 참조**: `equipment.store.ts`가 `inventory.store.ts`를 함수 안에서
  `useInventoryStore()`로 지연 호출하는 식으로 서로 참조한다. 모듈 최상단에서 즉시 호출하지 않고
  함수 내부에서 호출하면 순환 import 문제가 안 생긴다 — 기존 store들이 이 패턴을 쓰고 있으니 따라
  하면 된다.

---

## 10. 로컬 개발 명령어

```bash
npm run dev              # Vite 개발 서버
npm run build             # vue-tsc 타입체크 + 프로덕션 빌드
npm run preview           # 빌드 결과 미리보기
npm run test:e2e          # Playwright E2E 전체 실행
npm run test:e2e:ui       # Playwright UI 모드
npm run test:e2e:report   # 마지막 실행 리포트 열기
```

기능을 완성했다고 판단하기 전에 최소한 `npm run build`(타입 에러 확인)와 관련 폴더의
`npx playwright test tests/e2e/<폴더>`는 통과시킨다.
