# 개발 로드맵 (2026-07-06 기준)

이전 버전의 이 문서는 "세로 UI 레이아웃 진단"이었고 해당 항목(캔버스 비율, 상단 HUD, 스킬바, PC 대응 등)은
모두 반영 완료됨. 이번 정리는 CLAUDE.md의 MVP Phase 기준으로 다시 잡은 로드맵.

> "왜/뭐가 발견됐는지"에 대한 기록(QA 결과 등)은 [MEMORY.md](MEMORY.md)에 별도로 남긴다.

---

## 🔥 Critical 버그 (최우선 수정 대상)

- [x] **강화 +15(`MAX_ENHANCE_LEVEL`) 캡이 UI에 반영 안 됨** — `equipmentService.ts:112-131`
  (`getEnhanceSuccessRate`, `rollEnhanceSuccess`), `EquipmentPanel.vue:79`, `EnhanceModal.vue:113`.
  최대 강화 레벨에서도 버튼이 활성 상태고 성공률이 25%로 표시되지만 실제로는 100% 실패 —
  유저가 확률을 믿고 재화를 계속 태움. **2026-07-06 수정 완료** — `MAX_ENHANCE_LEVEL`을 15 → 20으로
  상향하면서 `getEnhanceSuccessRate()`가 캡 이상에서 0%를 반환하도록, `EnhanceModal`의 강화 버튼이
  캡 도달 시 비활성화("최대 레벨" 표시)되도록 수정. 회귀 테스트:
  `tests/e2e/regression/enhance-max-level.spec.ts` (통과 확인).
- [x] **`compareEquipment()` 비교 방향이 반대라 `autoEquipIfBetter()`가 좋은 장비를 나쁜 드롭으로
  교체함** — `equipmentService.ts:222-226`, `equipment.store.ts:65`. 장비 스코어가 높을수록 오히려
  몬스터 드롭에 더 쉽게 교체됨 — 성장 루프 핵심 투자를 조용히 무효화. **2026-07-06 수정 완료**
  (`compareEquipment`가 `scoreA - scoreB`를 반환하도록 부호 수정). 회귀 테스트:
  `tests/e2e/regression/auto-equip-inverted.spec.ts` (통과 확인).

## 🟠 Major 버그

- [ ] IndexedDB 접근 실패 시 예외 처리 전무 — `saveService.ts`, `save.store.ts:26-34`.
  Safari 프라이빗 모드/쿼터 초과 시 `save.load()`가 catch 없이 던져 빈 화면에서 멈춤.
- [ ] 일일 보상 리셋이 UTC 기준 — `rewardService.ts:90-98`. KST에서는 자정이 아니라 오전 9시에
  리셋되어 스트릭 판정이 최대 9시간 어긋남.
- [ ] `GameRenderer.destroy()`가 무한반복 gsap 트윈(`applyIdleBob()`)을 안 죽임 — `GameRenderer.ts:396-407`.
  현재는 단일 마운트라 안전하지만 라우팅 도입 시 메모리 누수로 전환.
- [ ] 탭을 백그라운드에 오래 둬도 오프라인 보상 재계산 안 됨 — `reward.store.ts:59-70`,
  `useGameSession.ts`. `visibilitychange` 훅 없이 `save.load()` 성공 시 한 번만 계산됨.
- [ ] `await` 이후 생성된 `watch()`가 unmount 시 정리 안 됨 — `useGameRenderer.ts:12-32`,
  `useGameSession.ts:22-64`. 현재 단일 뷰라 안 터지지만 조건부 mount/unmount 도입 시 누수.

---

## ✅ 완료된 것 (Phase 1~3 대부분)

- **전투**: 자동전투, 넓은 사냥터에 몬스터 최대 4마리 동시 배치, 개체별 배회 이동(AI),
  일반공격(최근접 단일 타겟) + 스킬 광역(겹친 몬스터 함께 타격), 걷기/아이들 애니메이션
- **성장**: 메인/서브 스탯 포인트 분배, 장비 강화(주문서 성공률 보정 포함), 스킬 레벨업
- **보상 루프**: 가챠(천장 카운터 포함), 업적(진행도 추적 + 보상 수령), 일일 보상, 오프라인 보상 모달
- **저장**: IndexedDB(`idb`) 기반, v2~v4 마이그레이션 체계 갖춤
- **UI**: 반응형 레이아웃(모바일 세로/가로, PC 확대), 하단 HUD 통합(HP/EXP + 스킬바)
- **E2E 테스트**: Playwright 34개 스펙 (`tests/e2e/`) — `npm run test:e2e`로 실행. 전투/성장/저장/오프라인/
  모바일/성능 + 알려진 버그 3건에 대한 회귀 테스트 포함. 상세는 MEMORY.md의 "Playwright E2E 풀 테스트 구축" 참고.

---

## 🔴 정리 필요 (기술 부채)

| # | 항목 | 내용 |
|---|------|------|
| 1 | `src/components/upgrade/` 빈 폴더 | 아무 파일도 없고 어디서도 참조 안 함 — 삭제 대상 |
| 2 | 사운드 전무 | CLAUDE.md 스택엔 Howler.js가 있지만 `package.json`엔 미설치. 타격음/레벨업/가챠/강화 성공-실패 SFX, BGM 전혀 없음 |
| 3 | 빌드 청크 경고 | `vite build` 시 500KB+ 단일 청크 경고 — pixi.js 관련 코드 스플리팅 검토 필요 |
| 4 | 몬스터 HP 미니바 | 현재 "가장 가까운 몬스터 1마리"만 화면 중앙에 표시. 4마리 동시 사냥 구조와 안 맞을 수 있음(개별 HP 바는 이후 UI 작업으로 보류 중) |
| 5 | Vue Router 미설치 | 현재 단일 뷰(GameView)라 당장은 불필요하지만, 스택 문서와 실제 코드가 다름 — 추후 랭킹/로그인 화면 생기면 필요 |
| 6 | `save.store.ts:21`의 `saveTimer`가 모듈 전역 변수 | CLAUDE.md 자체 규칙("Global mutable state 금지") 위반 |
| 7 | 탭 종료/새로고침 시 최근 최대 1초 상태 유실 가능 | `scheduleSave` 1초 디바운스, `beforeunload` 대응 없음 |
| 8 | 다중 몬스터(최대 4) + 스킬 광역 도입 이후 스테이지 속도 재검토 | 몬스터 HP/EXP 곡선이 1:1 전투 기준으로 설계되어 밸런스 재검토 필요 |

---

## 🟡 다음 우선순위 후보 (Phase 2~3 마무리)

- **몬스터 구성 다양화**: 같은 스테이지에서도 여러 종을 섞어 스폰 (지금은 스테이지당 단일 종류만 4마리 클론)
- **사운드 도입**: Howler.js 설치 + 타격/레벨업/드롭/가챠/강화 SFX, 배경음 On/Off
- **몬스터 처치 시 시각 피드백 강화**: 골드/드롭 팝업이 몬스터 위치에서 뜨도록 (현재는 전역 토스트)
- **스킬 다양화**: 현재 `power_strike`, `fire_ball` 2종뿐 — 스킬 수/타입 확장 여부 검토

---

## ⚪ 미착수 (Phase 4: 백엔드 연동)

CLAUDE.md 기준 Phase 4 전체가 아직 시작 전:

- NestJS 백엔드 프로젝트 자체가 없음
- 회원가입/로그인(Authentication)
- 클라우드 세이브 (현재는 로컬 IndexedDB만 존재, 기기 변경 시 진행 상황 소실)
- 랭킹 시스템
- API 동기화

로컬 저장 스키마(`SaveData`, 버전 마이그레이션)는 이미 잘 분리되어 있어 백엔드 붙일 때 그대로 전송 포맷으로 쓰기 좋은 상태.

---

## 참고: 이번 세션에서 다룬 것

1. `HuntSkillBar` 미연결 버그 수정 + 반응형 레이아웃 전면 개편 (캔버스 16:9, PC 확대, 가로모드)
2. 단일 몬스터 → 넓은 사냥터 다중 몬스터(최대 4) 구조로 전투 시스템 재설계
3. 캐릭터/몬스터 크기가 16:9 박스에 비해 너무 크던 버그 수정 (박스 높이 비율 기반 스케일로 전환)
4. 몬스터 배회 이동 AI 도입 + 걷기 애니메이션 + 아이들 바운스 + 공격 lunge 연출
