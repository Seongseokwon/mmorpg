# RFC: 저장 시점 이상치 검증 (Save Anomaly Detection)

- 상태: **제안 (구현 전 — 검토 요청)**
- 작성일: 2026-07-07
- 배경: 랭킹 시스템 도입 후 "재화 조작 방지를 서버에서 어떻게 하나"를 논의 — 이 프로젝트 규모(솔로
  방치형, PvP·실거래 없음)에서는 전투를 서버로 옮기는 완전한 서버 권위 구조는 과설계이고, 업계에서도
  이 장르(인크리멘탈/방치형)는 "저장 시점 이상치 탐지" 정도로 처리한다는 결론에서 이어짐
- 관련 코드: `server/src/save/save.controller.ts`, `save.service.ts`, `dto/upsert-save.dto.ts`,
  `prisma/schema.prisma`

---

## 1. 목표 / 비목표

**목표**: `PUT /save` 시점에 "물리적으로 불가능한 진행"을 걸러낸다. 두 종류로 나눈다.
- **하드 검증**: 이전 세이브와 무관하게 항상 참이어야 하는 구조적 불변식 위반 → **즉시 400 거부**
- **소프트 검증**: 이전 세이브 대비 변화량이 경과 시간에 비해 비현실적 → **거부하지 않고 로그만
  남김** (아래 3절에서 이렇게 나눈 이유 설명)

**비목표**
- 전투 시뮬레이션을 서버로 이전하는 것 — 지난 논의에서 이미 배제, 이 RFC는 그 대안
- 이상치 탐지 시 자동 계정 정지/롤백 — 이번 범위는 **탐지·기록까지만**, 조치는 사람이 로그 보고
  판단(8절 참고)

## 2. 현재 상태

`UpsertSaveDto`는 `version`(정수)과 `data`(객체)라는 **최상위 형태만** 검증하고, 내부 필드는
전혀 재검증하지 않는다(의도적 결정, `docs/backend-guide.md`에 이미 문서화됨). `Save.updatedAt`은
Prisma `@updatedAt`으로 자동 관리되므로 "마지막 저장 이후 경과 시간"은 이미 공짜로 얻을 수 있다.

## 3. 왜 두 단계로 나누는가

| | 하드 검증 | 소프트 검증 |
|---|---|---|
| 예시 | `currentStage > maxClearedStage`, 음수 골드 | "5초 만에 골드 100만 증가" |
| 오탐 가능성 | 거의 없음 — 정상 클라이언트는 절대 이런 값을 못 만듦 | 있음 — 오프라인 보상(최대 8시간치 몰아주기), 가챠 대박 등 정상적으로도 큰 점프가 생김 |
| 조치 | 즉시 거부(400) | 저장은 허용, 로그만 남김 |

오탐 가능성이 있는 규칙을 하드 거부로 걸면, 실제 유저의 정상 플레이(오프라인 보상 등)가 막히는
피해가 발생한다. 이 프로젝트는 반칙으로 인한 피해자가 없는 솔로 게임이라(지난 논의 참고),
"확실한 것만 막고 애매한 것은 기록해서 나중에 본다"가 위험 대비 이득이 맞다.

## 4. 설계

### 4.1 하드 검증 — `save.service.ts`의 `upsert()` 진입 시점

```ts
function assertStructurallyValid(data: Record<string, unknown>): void {
  const d = data as Partial<SaveDataShape>  // 서버는 타입을 몰라 unknown 취급, 필드 존재만 확인

  if (typeof d.currentStage === 'number' && typeof d.maxClearedStage === 'number') {
    if (d.currentStage > d.maxClearedStage + 1) throw new BadRequestException('invalid stage progression')
  }
  for (const key of ['gold', 'exp', 'level', 'statPoints', 'currentStage', 'maxClearedStage']) {
    const v = d[key]
    if (typeof v === 'number' && (v < 0 || !Number.isFinite(v))) {
      throw new BadRequestException(`invalid ${key}`)
    }
  }
  if (Array.isArray(d.equipmentBag) && d.equipmentBag.length > 500) {
    throw new BadRequestException('equipmentBag too large')
  }
}
```

이전 세이브 조회가 필요 없어 구현이 가볍다 — DTO 레벨(`class-validator` 커스텀 데코레이터)로
빼도 되고, 서비스 진입부 함수 하나로 둬도 된다(이 프로젝트 규모엔 후자가 더 간단).

### 4.2 소프트 검증 — 이전 세이브 대비 변화율

`upsert()`가 새 값을 쓰기 **전에** 기존 `findByUserId()`로 이전 세이브를 먼저 조회(이미 upsert
내부에서 조회 없이 바로 쓰고 있어 한 번의 추가 조회가 필요 — 5절 성능 영향 참고).

```ts
const prev = await this.prisma.save.findUnique({ where: { userId } })
if (prev) {
  const elapsedSec = (Date.now() - prev.updatedAt.getTime()) / 1000
  checkGoldGain(prev.data, newData, elapsedSec)
  checkExpGain(prev.data, newData, elapsedSec)
  checkStageJump(prev.data, newData)
}
```

`checkGoldGain` 등은 "골드가 **줄어든 경우**(강화/가챠 소비)는 무시하고, **늘어난 경우**만"
이론상 최대 획득 속도 × 경과 시간(+오프라인 보상 상한만큼 여유)과 비교한다. 오프라인 보상은
`rewardService.ts`의 `calculateOfflineReward()`가 이미 최대 8시간으로 캡을 걸어두고 있으므로,
허용 상한 계산에 "경과 시간을 최대 8시간으로 클램프한 값 기준 보상"을 더해주면 정상적인 오프라인
복귀도 오탐 없이 통과한다.

초과 시:
```ts
this.logger.warn(`[anomaly] user=${userId} type=gold elapsed=${elapsedSec}s gained=${gained} limit=${limit}`)
```
저장은 그대로 진행 — **막지 않는다.**

## 5. 데이터 모델 / 성능 영향

- **스키마 변경 없이 시작 가능** — 로그만으로 충분하면 `Save` 테이블 변경 불필요.
- (선택, 나중에) `Save`에 `lastAnomalyAt DateTime?`, `lastAnomalyReason String?` 컬럼을 추가해
  로그 대신/추가로 DB에서 바로 조회 가능하게 할 수 있다 — 이 경우 마이그레이션 1개 필요.
- `upsert()`마다 이전 세이브를 한 번 더 조회하게 되는데, 이미 같은 요청 안에서 `userId` 단일
  로우 조회라 비용은 무시할 수준(인덱스: `userId`가 이미 `@unique`).

## 6. 테스트 계획

`server/test/save.e2e-spec.ts`에 추가:
- `currentStage`가 `maxClearedStage + 2`인 저장 → 400
- 음수 골드 저장 → 400
- 정상 범위 내 골드 증가(예: 몇 초 만에 소량 증가) → 200, 로그 없음
- (로그 검증은 e2e에서 직접 assert하기보다, `Logger`를 모킹해 `warn`이 호출됐는지 확인하는 별도
  단위 테스트가 더 적합 — 이번 RFC 범위에서 방식만 제안, 세부는 구현 시 결정)

## 7. 미해결 질문 (Open Questions)

- [ ] **초당 최대 골드/exp 획득량 상수**를 얼마로 잡을지 — 실제 밸런스 수치(몬스터 처치 속도,
  스테이지별 골드 보상)를 근거로 계산해야 하는데 이번 RFC에서는 도출하지 않았다. 자칫 너무
  타이트하게 잡으면 정상 유저(방치 오래 하다 복귀 등)가 계속 로그에 잡혀 노이즈만 커진다.
- [ ] 소프트 로그를 **어디서 확인**할지 — Render 대시보드 로그 탭을 수시로 볼 것인지, 아니면
  이번 범위 밖이지만 나중에 Slack/이메일 알림 연동을 고려할지.
- [ ] 같은 유저가 **반복적으로 플래그**되면 그때부터 하드 차단/계정 조사로 승격할 기준선 — 이번
  RFC는 "일단 기록만" 까지고, 승격 정책은 별도 논의.
- [ ] 하드 검증의 `equipmentBag` 500개 같은 상한값이 실제 정상 플레이 범위를 침범하지 않는지
  (판매 기능 도입 전이라 지금은 계속 쌓이기만 하는 구조 — `docs/rfc-equipment-expansion.md` 3.3
  판매 기능이 들어오면 이 상한의 의미가 달라짐).

## 8. 영향 받는 파일 목록

```
server/src/save/save.service.ts        assertStructurallyValid, checkGoldGain 등 소프트 체크 추가
server/src/save/dto/upsert-save.dto.ts (하드 검증을 DTO 레벨로 뺄 경우)
server/prisma/schema.prisma            (선택) Save.lastAnomalyAt/lastAnomalyReason
server/test/save.e2e-spec.ts           하드 검증 케이스 추가
```
