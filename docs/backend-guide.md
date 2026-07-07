# 백엔드 가이드 (Phase 4 · 1단계: 인증 + 클라우드 세이브)

이 문서는 `server/` 아래에 새로 만든 NestJS 백엔드를 처음 보는 개발자가 로컬에서 바로 띄우고,
API가 어떻게 동작하는지, 왜 이렇게 설계했는지 이해할 수 있도록 쓴다. 프론트엔드 가이드는
[docs/dev-guide.md](dev-guide.md)를 참고 — 이 문서는 그 문서의 "Phase 4" 확장판이다.

## 이번 범위

지금까지 세이브는 브라우저 IndexedDB에만 있어서 기기를 바꾸면 진행 상황이 사라졌다. 이번
1단계는 그 문제를 푸는 데 필요한 최소 API만 만든다:

- **인증**: 이메일+비밀번호 회원가입/로그인, JWT 액세스+리프레시 토큰
- **클라우드 세이브**: 로그인한 유저의 세이브 데이터를 서버 DB에 저장/조회

**이번에 안 하는 것** (의도적으로 범위 밖): 프론트(Vue) 로그인 화면, IndexedDB↔서버 동기화 로직,
소셜 로그인, 비밀번호 재설정, 리프레시 토큰 강제 폐기(다른 기기 강제 로그아웃), 랭킹, 배포.
이 API는 지금 프론트와 아직 연결되어 있지 않다 — 독립적으로 동작하는 것부터 검증했다.

## 로컬 실행

```bash
cd server
npm install
cp .env.example .env        # 처음 한 번만 — 값은 로컬 개발용 기본값 그대로 써도 됨
docker compose up -d        # 로컬 Postgres 컨테이너
npx prisma migrate dev      # 스키마 적용 (최초 1회, 이후 스키마 변경 시에도)
npm run start:dev           # http://localhost:3000
```

- `docker-compose.yml`은 Postgres를 **5433** 포트로 매핑한다 (5432 아님). 개발 기기에 WSL이나
  다른 로컬 Postgres가 이미 5432를 쓰고 있으면 `localhost:5432`가 그쪽으로 새서 인증 실패가 나는
  걸 겪었기 때문 — `netstat`으로 확인해보니 `wslrelay.exe`가 `127.0.0.1:5432`를 이미 점유하고
  있었다. 포트 충돌이 없는 게 확실하면 `docker-compose.yml`과 `.env`의 포트를 5432로 되돌려도 된다.
- `npm run test:e2e`도 실제 Postgres(같은 docker-compose)가 떠 있어야 통과한다 — 목/스텁 없이
  실제 DB에 대고 회원가입→로그인→저장 플로우를 검증한다.

## 폴더 구조

```
server/
  src/
    main.ts            부트스트랩 — cookie-parser, 글로벌 ValidationPipe, CORS(credentials 허용)
    app.module.ts       ConfigModule + Prisma/Users/Auth/Save 모듈 조립
    prisma/
      prisma.service.ts   PrismaClient 래핑 (OnModuleInit에서 연결, OnModuleDestroy에서 해제)
    users/
      users.service.ts    이메일/id로 User 조회·생성 (Prisma 직접 호출은 여기로만 모은다)
    auth/
      auth.service.ts     회원가입/로그인/리프레시 — 해싱·토큰 발급 담당
      auth.controller.ts  얇은 라우팅 계층. 쿠키 설정/해제만 컨트롤러가 직접 함
      strategies/         jwt-access(Authorization 헤더) / jwt-refresh(쿠키) 두 Passport 전략
      guards/             각 전략에 대응하는 AuthGuard
      decorators/current-user.decorator.ts   @CurrentUser()로 req.user 꺼내기
    save/
      save.service.ts     Save 테이블 upsert/조회
      save.controller.ts  GET/PUT /save (JwtAccessGuard로 보호)
  prisma/schema.prisma  User, Save 모델
  test/*.e2e-spec.ts    Jest+Supertest e2e (프론트의 Playwright와는 별개 — REST API 자체 검증)
  docker-compose.yml    로컬 Postgres
  .env.example
```

프론트(`src/`, 루트 `package.json`)와 완전히 분리된 하위 프로젝트다. Vite/Playwright 툴체인과
Nest/Jest 툴체인이 섞이지 않게, `npm install`도 `server/` 안에서 따로 한다.

## API

```
POST /auth/register  { email, password }           → 201 { user, accessToken } + Set-Cookie: refreshToken
POST /auth/login     { email, password }           → 200 { user, accessToken } + Set-Cookie: refreshToken
POST /auth/refresh   (refreshToken 쿠키 필요)        → 200 { accessToken } + Set-Cookie: refreshToken(갱신)
POST /auth/logout    (Authorization 헤더 필요)       → 204, refreshToken 쿠키 제거
GET  /save           (Authorization 헤더 필요)       → 200 { version, data, updatedAt } 또는 빈 바디(저장 없음)
PUT  /save           (Authorization 헤더 필요) { version, data }  → 200 { version, data, updatedAt }
```

- **액세스 토큰**은 응답 바디로 내려준다 — 프론트는 메모리(Pinia 등)에만 들고 있고
  `localStorage`에 두지 않는 걸 권장한다 (XSS로 탈취되면 그대로 노출되는 걸 피하기 위해).
  `Authorization: Bearer <accessToken>` 헤더로 보낸다.
- **리프레시 토큰**은 `httpOnly`+`Secure`(프로덕션만)+`SameSite=Lax` 쿠키로만 오간다. `path`를
  `/auth`로 좁혀뒀다 — `/save` 같은 다른 요청에는 안 실린다. 만료는 30일(`.env`의
  `JWT_REFRESH_EXPIRES_IN`), 서명+만료만 검증하는 스테이트리스 방식이라 **서버가 리프레시 토큰
  자체를 강제로 무효화할 방법은 아직 없다** (다른 기기 강제 로그아웃 등은 후속 과제).
- **`GET /save`가 아직 저장한 적 없는 유저에 대해선 빈 바디(200, Content-Type 없음)를 반환한다** —
  JSON `null`이 아니라 진짜 빈 문자열이다 (Nest가 컨트롤러에서 `null`을 반환하면 이렇게 직렬화한다).
  프론트에서 연동할 때 `JSON.parse`를 바로 태우지 말고 "본문이 비어 있으면 로컬 세이브를 그대로
  써라" 식으로 처리해야 한다.
- **세이브 데이터 검증**: `PUT /save`의 `data`는 프론트의 `SaveData`(src/types/game.ts) 블롭을
  그대로 신뢰한다. 서버는 `version`(정수)과 `data`(객체)라는 최상위 형태만 확인하고, 내부 필드
  하나하나를 재검증하지 않는다 — 이미 인증된 클라이언트가 보내는 자기 자신의 세이브라 이번
  범위에서는 과설계로 판단했다. (다른 유저 데이터 위변조는 애초에 `userId`가 토큰에서 나오므로
  발생하지 않는다 — 다만 "내 클라이언트가 스스로에게 조작된 세이브를 보내는" 부정행위까지 막는
  건 이번 범위 밖이다.)

## 데이터 모델

```prisma
model User {
  id, email(unique), passwordHash, createdAt, updatedAt
}

model Save {
  id, userId(unique, User 1:1), version, data(Json), updatedAt
}
```

세이브를 필드별 컬럼으로 정규화하지 않고 `Json` 컬럼 하나에 통째로 넣는다. 이유: 프론트의
`saveService.ts`가 이미 버전 마이그레이션(v2→v4)까지 다 처리해서 "안정된 버저닝 블롭"을 만들어
두고 있으므로, 서버가 그 구조를 다시 관계형으로 쪼갤 필요가 없다. 프론트에서 `SaveData`에 필드를
추가해도 서버 마이그레이션 없이 그대로 저장/조회된다 — 다만 서버가 그 필드를 이용한 별도 기능
(랭킹 등)을 만들 때는 이 얘기가 달라진다.

## 왜 이렇게 결정했는가 (선택지와 이유)

- **Prisma vs TypeORM** → Prisma. 스키마 정의+마이그레이션 CLI가 직관적이고 타입 추론이 자동이라
  "any 금지, strict TS"라는 프로젝트 관례와 잘 맞는다.
- **bcryptjs vs bcrypt/argon2** → `bcryptjs`(순수 JS). `bcrypt`/`argon2`는 네이티브 모듈이라
  Windows 개발 환경에서 빌드 도구(node-gyp) 마찰이 날 수 있어 피했다. 이 규모의 트래픽에서 성능
  차이는 무시할 만하다.
- **JWT 액세스+리프레시 분리, 리프레시는 쿠키** → 액세스 토큰을 짧게(15분) 만들어 탈취돼도
  피해 기간을 줄이고, 리프레시 토큰은 JS가 접근 못 하는 httpOnly 쿠키에 둬서 XSS로 직접 못
  훔치게 한다.
- **모노레포(레포 안 `server/`) vs 별도 레포** → 지금 단계는 배포 파이프라인이나 팀 분리가 없어서
  하나의 레포에서 관리하는 게 반복 개발에 더 빠르다.

## 다음 단계 (이번에 안 한 것)

1. 프론트 연동: 로그인/회원가입 화면, `src/api/` 클라이언트, 앱 부팅 시 "로그인 상태면 서버
   세이브, 아니면 로컬 IndexedDB" 분기, 로그아웃 시 처리
2. IndexedDB ↔ 서버 세이브 동기화/충돌 처리 (예: 여러 기기에서 오프라인으로 진행했을 때 어느 쪽을
   우선할지)
3. 리프레시 토큰 폐기 테이블 (강제 로그아웃), 비밀번호 재설정, 이메일 인증
4. 랭킹 API, 배포 환경/호스팅 결정
