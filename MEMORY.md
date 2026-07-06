# MEMORY

프로젝트 진행 중 발견된 이슈, 결정 사항, QA 기록을 남기는 문서. "앞으로 할 일"은 [TODO.md](TODO.md)에서 관리하고,
여기서는 "왜 그렇게 됐는지 / 뭐가 발견됐는지"를 기록한다. 새 항목은 날짜 역순(최신이 위)으로 추가한다.

---

## 2026-07-06 (4) — 강화 +15 캡 UI 미반영 수정 + 최대 강화 레벨 +20으로 상향

`equipmentService.ts`의 `MAX_ENHANCE_LEVEL`을 15 → 20으로 상향(요청: "최대강화도 +20까지 될 수 있도록").
기존엔 `rollEnhanceSuccess()`만 캡을 알고 `getEnhanceSuccessRate()`는 몰라서, 캡 도달 후에도 UI에
25%(스크롤 사용 시 40%) 성공률이 표시되고 강화 버튼이 활성 상태로 남아 유저가 재화를 계속 태울 수
있었다. 수정 내용:

- `getEnhanceSuccessRate()`: `enhanceLevel >= MAX_ENHANCE_LEVEL`이면 0% 반환하도록 최상단에 캡 체크 추가.
  캡을 15 → 20으로 늘리며 15/18 구간 확률 티어(15%, 10%)도 새로 추가(기존엔 12구간 25%가 마지막이었음).
- `MAX_ENHANCE_LEVEL`을 모듈 밖으로 export.
- `EnhanceModal.vue`: `isMaxed` computed 추가, 확인 버튼을 캡 도달 시 비활성화 + 라벨을 "최대 레벨"로
  변경(스킬 패널의 `s.level >= s.maxLevel` 패턴과 동일하게 맞춤 — `SkillPanel.vue:61` 참고).
- `EquipmentPanel.vue`: 캡 도달 시 강화 버튼 라벨을 비용 대신 "최대 강화 (+20)"로 표시(버튼 자체는
  계속 클릭 가능 — 모달을 열어 0%/비활성화 상태를 직접 확인할 수 있게 둠).

`tests/e2e/regression/enhance-max-level.spec.ts`를 새 캡(+20) 기준으로 재작성 — 기존 `test.fail()`
마킹 및 "현재 버그 동작 문서화" 테스트 제거, "+20 캡 도달 시 비활성화" + "+19는 정상 강화 가능(캡
상향 확인)" 두 케이스로 교체. `growth/*`, `regression/*` 전체 재실행 + `vue-tsc --noEmit` 통과 확인 —
회귀 없음. 남은 실패는 `daily-reward-timezone`(별개의 미수정 버그, 의도된 `test.fail()`)뿐.

---

## 2026-07-06 (3) — `compareEquipment()` 반전 버그 수정

`equipmentService.ts:222-226`의 `compareEquipment(a, b)`가 `scoreB - scoreA`를 반환하던 것을
`scoreA - scoreB`로 수정. 호출부(`equipment.store.ts:65`의 `autoEquipIfBetter`)는 코드 변경 없이
"양수면 a(신규 드롭)가 더 좋다"는 표준 컨벤션에 맞춰짐. 호출부가 한 곳뿐이라 함수 자체를 고치는 쪽을
택함(호출부를 고쳤다면 나중에 또 헷갈릴 여지가 있었음).

`tests/e2e/regression/auto-equip-inverted.spec.ts`의 `test.fail()` 마킹 제거, 통과 확인.
`tests/e2e/growth/*`, `tests/e2e/regression/*` 전체 재실행 결과 회귀 없음 — 나머지 실패 2건
(`daily-reward-timezone`, `enhance-max-level`)은 별개의 미수정 버그로 의도된 `test.fail()`.

남은 Critical 1건(강화 +15 캡 UI 미반영)은 TODO.md 참고.

---

## 2026-07-06 (2) — Playwright E2E 풀 테스트 구축 (`.claude/agents/e2e-agent.md` 페르소나 기준)

`tests/e2e/`에 Playwright 스펙 34개(desktop-chromium + mobile-chromium(Pixel 7))를 새로 만들었다.
`npm run test:e2e`로 실행. 실행 방식: `npm run dev`(포트 6868)를 자동 기동해 실제 IndexedDB/PixiJS 캔버스까지
붙는 진짜 브라우저 테스트 — mock 없이 게임 로직을 그대로 태운다. 안정성을 위해 워커 수를 4개로 제한했다
(`playwright.config.ts`) — 이 스펙들은 실제 `setInterval` 기반 자동전투 루프와 실시간으로 경쟁하기 때문에,
워커를 8개까지 늘리면 CPU 경합으로 오탐성 flaky가 발생함을 직접 확인했다.

구조: `tests/e2e/{combat,growth,save,offline,mobile,regression,performance}` +
`tests/fixtures/save-data.ts`(SaveData 스키마를 계약으로 복제한 픽스처, 앱 소스 미참조) +
`tests/helpers/db.ts`(IndexedDB 직접 시딩/새로고침으로 가챠·강화 등 확률에 의존하지 않고 원하는 게임 상태를
결정적으로 재현) + `tests/helpers/format.ts`(K/M 축약 표시 골드 텍스트 역파싱). 주요 상호작용 요소에
`data-testid`를 추가해 class selector 대신 안정적으로 골랐다.

### 🔴 새로 발견한 버그 (E2E로만 드러남 — 코드 리뷰 때는 못 잡았던 것)

- [ ] **`compareEquipment()`의 비교 방향이 반대라 `autoEquipIfBetter()`가 좋은 장비를 나쁜 드롭으로
  교체해버림** — `equipmentService.ts:222-226`. `compareEquipment(a, b)`가 `scoreB - scoreA`를 반환하는데,
  `equipment.store.ts:65`의 `autoEquipIfBetter()`는 `compareEquipment(신규드롭, 현재장비) > 0`을
  "신규 드롭이 더 좋다"는 뜻으로 쓰고 있다. 실제로는 그 식이 "현재 장비가 더 좋을 때" 참이 되므로 로직이
  통째로 뒤집혀 있다 — **장비 스코어가 높을수록 오히려 몬스터 드롭에 더 쉽게 교체된다.** 성장 루프의 핵심인
  장비 강화/뽑기 투자를 몬스터를 잡을 때마다 조용히 무효화시킬 수 있는 심각한 버그.
  회귀 테스트: `tests/e2e/regression/auto-equip-inverted.spec.ts` (baseAttack 88888짜리 무기를 8초간
  자동전투 노출시키면 실제로 교체돼버리는 걸 재현). **최우선 수정 대상 — #1-1(강화 버그)과 동급.**

### 검증됨: 기존 MEMORY.md 항목 중 2건은 회귀 테스트로 고정해둠

- `tests/e2e/regression/enhance-max-level.spec.ts` — 위 "2026-07-06 코드베이스 QA" 섹션의 #1-1
  (강화 +15 캡 미반영) 재현. 첫 번째 테스트는 "수정 후 기대 동작"을 검증하며 `test.fail()`로 지금은
  일부러 실패 처리(고쳐지면 이 표시가 사라져야 함). 두 번째 테스트는 "현재의 버그 동작"을 그대로 문서화.
- `tests/e2e/regression/daily-reward-timezone.spec.ts` — #2-2(일일 보상 UTC 리셋) 재현.
  `page.clock.install()` + `timezoneId: 'Asia/Seoul'`로 KST 자정 근처 시각을 고정해 검증.
- `tests/e2e/offline/background-resume.spec.ts` — #2-4(백그라운드 탭 복귀 시 오프라인 보상 미재계산) 재현.
  `page.clock`로 가상 시간을 3시간 전진시키고 `visibilitychange`를 흉내내서 검증.

### 테스트를 만들며 확인된, 앱 버그는 아닌 것들 (참고용)

- **PixiJS 캔버스 내부(데미지 텍스트, 스프라이트 애니메이션)는 DOM 기반 E2E로 검증 불가.** 전투 관련
  테스트는 전부 "골드/HP/레벨 등 DOM에 반영되는 부작용"으로 간접 검증했다.
- **`page.clock.runFor()`로 2시간을 통째로 가속하면 페이지가 응답 불가 상태에 빠짐**
  (`setInterval(100ms)` 콜백을 수만 번 몰아서 실행). 원인을 더 파고들진 않았고, 장시간 스모크 테스트는
  실제 시간을 30초 정도로 나눠 기다리는 방식으로 우회했다(`performance/long-session.spec.ts`). 실제
  브라우저가 그 정도의 몰린 tick 처리량을 감당하지 못한다면(가상 시계가 아니라 실제로 CPU가 밀리는
  상황, 예: 오래 백그라운드였던 탭이 한꺼번에 밀린 처리를 해야 할 때) 문제가 될 수 있어 완전히 무시하긴
  애매하지만, 확증된 앱 버그로 보긴 어려워 별도 항목으로만 기록.
- **자동전투를 끄기 위한 클릭도 완전히 레이스 없이 즉시 반영되진 않는다** — 페이지 로드 직후 곧바로
  자동전투가 시작되기 때문에, "AUTO 버튼을 눌러 끈다"는 동작 자체가 처리되기 전까지 짧은 틈(수백ms) 동안
  틱이 몇 번 더 돈다. 골드 비교가 필요한 테스트는 이 틈을 삼킬 만큼 여유 있는 허용 범위로 검증했다.

---

## 2026-07-06 — 코드베이스 QA (`.claude/agents/qa-agent.md` 페르소나 기준)

전체 코드 경로를 정적으로 추적한 QA. 브라우저 자동화 도구가 없어 클릭 기반 E2E는 수행하지 못했고,
`vue-tsc` + `vite build` + dev 서버 스모크 테스트로만 런타임을 확인했다. 상세 리포트(파일:라인, 재현 절차,
개선 제안, 방치형 RPG 관점 피드백 전체)는 세션 아티팩트로 남겨뒀고, 여기서는 발견된 이슈만 추적용으로 정리.
해결되면 상태를 `[x] 해결`로 바꾸고 커밋/PR을 남겨둘 것.

### Critical

- [ ] **강화 +15(`MAX_ENHANCE_LEVEL`) 캡이 UI에 반영 안 됨** — `equipmentService.ts:112-131`(`getEnhanceSuccessRate`,
  `rollEnhanceSuccess`), `EquipmentPanel.vue:79`, `EnhanceModal.vue:113`. 최대 강화 레벨에서도 "강화" 버튼이
  활성 상태고 성공률이 25%로 표시되지만, `rollEnhanceSuccess`는 그 레벨에서 무조건 `false`를 반환한다. 유저는
  확률을 믿고 골드/주문서를 계속 태우는데 100% 실패만 함. **최우선 수정 대상.**
- [ ] **`await` 이후 생성된 `watch()`가 컴포넌트 unmount 시 정리 안 됨** — `useGameRenderer.ts:12-32`,
  `useGameSession.ts:22-64`. `onMounted(async () => { await ...; watch(...) })` 패턴이라 Vue가 컴포넌트
  effect scope에 자동 귀속 못 시킴(`vue/no-watch-after-await`). 지금은 단일 뷰라 안 터지지만, 로그인/랭킹
  화면이 생겨 `GameView`가 조건부 mount/unmount되는 순간 실제 메모리 누수로 전환됨.

### Major

- [ ] **IndexedDB 접근 실패 시 예외 처리 전무** — `saveService.ts`, `save.store.ts:26-34`. Safari 프라이빗
  모드/쿼터 초과 등으로 `openDB`/`db.get`/`db.put`이 reject되면 `save.load()`가 catch 없이 던져서 게임이
  빈 화면에서 멈춤. 유저 안내도 전혀 없음.
- [ ] **일일 보상 리셋이 UTC 기준** — `rewardService.ts:90-98`(`getTodayDateString`, `isYesterday`).
  `toISOString()` 기반이라 KST(UTC+9)에서는 로컬 자정이 아니라 오전 9시에 리셋됨. 스트릭 판정이 최대
  9시간 어긋날 수 있음.
- [ ] **`GameRenderer.destroy()`가 무한반복 gsap 트윈을 안 죽임** — `GameRenderer.ts:396-407` vs
  `applyIdleBob()`. `repeat: -1` 아이들 바운스 트윈이 destroy 이후에도 죽은 스프라이트를 계속 참조하며 영원히
  tick. #1-2와 같은 리스크 축(현재 단일 마운트라 안전, 향후 라우팅 도입 시 위험).
- [ ] **탭을 백그라운드에 오래 둬도 오프라인 보상 재계산 안 됨** — `reward.store.ts:59-70`,
  `useGameSession.ts`. `checkOfflineReward()`가 `save.load()` 성공 시 딱 한 번만 호출됨
  (`visibilitychange` 훅 없음). 탭을 안 닫고 몇 시간 방치했다 돌아오면 보상 없이 그냥 느리게 진행된 상태.

### Minor / Suggestion

- [ ] `save.store.ts:21`의 `saveTimer`가 모듈 전역 변수 — CLAUDE.md 자체 규칙("Global mutable state 금지") 위반.
- [ ] 탭 종료/새로고침 시 최근 최대 1초 상태 유실 가능 (`scheduleSave` 1초 디바운스, `beforeunload` 대응 없음).
- [ ] 빈 디렉터리 `src/components/upgrade/` — 참조 없음, 삭제 대상 (TODO.md에도 기록됨).
- [ ] `GameLoop`이 고정 100ms를 deltaMs로 씀(`gameLoop.ts:13-15`) — 폭주 버그는 구조적으로 없지만 프레임 지연 시
  시뮬레이션이 실시간보다 느려짐. 지금 수준에선 유지해도 무방.
- [ ] 다중 몬스터(최대 4) + 스킬 광역 도입 이후 스테이지 진행 속도가 빨라졌을 가능성 — 몬스터 HP/EXP 곡선
  재검토 필요 (1:1 전투 기준으로 설계된 값이라).

### 방치형 RPG 관점 (요약)

강화 버그가 "돈을 써도 배신당한다"는 인상을 줄 수 있어 가챠/업적/일일보상 등 다른 보상 루프에 대한 신뢰도까지
같이 깎일 위험이 있음 — 신뢰 회복 관점에서도 강화 버그가 최우선. 오프라인 보상이 탭을 완전히 닫아야만
작동하는 것도 "자리를 비워도 보상받는다"는 방치형 장르의 핵심 기대와 어긋남.

---

## 관련 문서

- [TODO.md](TODO.md) — 개발 로드맵 (Phase별 완료/미착수 현황)
- `.claude/agents/qa-agent.md` — 코드베이스 정적 QA를 수행할 때 사용한 페르소나/체크리스트 정의
- `.claude/agents/e2e-agent.md` — Playwright E2E 테스트를 만들 때 사용한 페르소나/체크리스트 정의
- `tests/e2e/`, `playwright.config.ts` — 실제 E2E 스펙과 설정. `npm run test:e2e` / `test:e2e:ui` / `test:e2e:report`
