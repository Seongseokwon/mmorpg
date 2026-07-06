# Vue3 Idle RPG Development Rules

이 프로젝트는
“메이플 키우기 감성의 웹 방치형 RPG”
를 목표로 개발한다.

핵심 방향성:

* Vue3 기반 웹앱 구조
* PixiJS 기반 전투 렌더링
* 모바일 친화적 UI
* 장기 서비스 가능한 구조
* 빠른 반복 개발
* 유지보수 가능한 아키텍처

---

# Project Philosophy

이 프로젝트는:

“게임 엔진 위에 웹을 올리는 구조”

가 아니라,

“Vue3 웹앱 내부에 게임 렌더러(Canvas)를 삽입하는 구조”

를 따른다.

즉:

* UI = Vue3
* Rendering = PixiJS
* State = Pinia

구조를 절대적으로 유지한다.

---

# Core Tech Stack

| Category         | Stack      |
| ---------------- | ---------- |
| Frontend         | Vue3       |
| Language         | TypeScript |
| Build Tool       | Vite       |
| State Management | Pinia      |
| Rendering        | PixiJS     |
| Animation        | GSAP       |
| Audio            | Howler.js  |
| Routing          | Vue Router |
| Backend          | NestJS     |
| Database         | PostgreSQL |
| Storage          | IndexedDB  |
| CDN              | Cloudflare |

---

# Core Development Rules

## 1. Composition API Only

절대 Vue Options API를 사용하지 않는다.

항상:

```ts
<script setup lang="ts">
```

패턴을 사용한다.

---

## 2. TypeScript Strict Mode

모든 코드는 TypeScript strict mode 기준으로 작성한다.

* any 사용 금지
* 명확한 타입 정의 필수
* interface 우선 사용
* 타입 추론 남용 금지

---

## 3. Component First Strategy

모든 UI는 컴포넌트 기반으로 설계한다.

예시:

```text
/components
  /hud
  /inventory
  /battle
  /shop
  /modal
  /skill
```

컴포넌트는:

* 단일 책임 원칙
* 재사용 가능 구조
* 작은 단위 유지

를 따른다.

---

# Rendering Rules

PixiJS는 “렌더러 역할만” 수행한다.

PixiJS 내부에서 게임 상태를 직접 관리하지 않는다.

PixiJS 담당 영역:

* Character Sprite
* Monster Sprite
* Damage Text
* Effects
* Camera
* Battle Animation

UI는 반드시 Vue 컴포넌트로 구현한다.

---

# Canvas Rules

Canvas에는 최소 요소만 렌더링한다.

허용:

* Character
* Monster
* Background
* Effect
* Damage Number

금지:

* Inventory UI
* Modal
* HUD
* Shop
* Button
* Menu

이유:

* 유지보수성 향상
* 모바일 대응 단순화
* Vue 생태계 활용
* 개발 속도 향상

---

# State Management Rules

모든 게임 상태는 Pinia에서 관리한다.

예시:

```text
/stores
  player.store.ts
  battle.store.ts
  inventory.store.ts
  currency.store.ts
  stage.store.ts
```

원칙:

* Single Source of Truth
* Renderer와 상태 분리
* UI와 게임 로직 분리
* Store 직접 mutation 금지
* action 기반 상태 변경

---

# Folder Structure Rules

기본 구조:

```text
/src
  /api
  /assets
  /components
  /composables
  /engine
  /stores
  /systems
  /types
  /utils
  /views
```

---

# Naming Rules

## Vue Component

PascalCase 사용:

```text
InventoryPanel.vue
SkillButton.vue
UpgradeModal.vue
```

---

## Composable

반드시 `use` prefix 사용:

```ts
useBattle.ts
useInventory.ts
useStage.ts
```

---

## Store

```ts
usePlayerStore()
useBattleStore()
```

---

# Battle Design Philosophy

전투는:

“컨트롤 난이도”

보다

“성장 체감과 시각적 피드백”

에 집중한다.

핵심 요소:

* 빠른 반복 전투
* 큰 데미지 숫자
* 강화 성공 연출
* 성장 속도 체감
* 화려한 보상 연출

---

# Core Gameplay Loop

핵심 루프:

```text
자동 전투
 → 골드 획득
   → 강화
     → 전투력 증가
       → 더 높은 스테이지 도전
```

Claude는 새로운 시스템 개발 시 반드시:

* 성장 루프 강화
* 반복 보상 강화
* 플레이 지속 동기 강화

를 우선 고려한다.

---

# UI/UX Rules

UI 방향성:

* 모바일 우선
* 한 손 조작 고려
* 큰 버튼
* 짧은 동선
* 강화 연출 강조
* 숫자 증가 강조

UI는:

“웹앱스럽게”

구성하고,

전통적인 게임 엔진 UI 방식은 지양한다.

---

# Performance Rules

## 1. Reactive 최소화

불필요한 reactive 사용 금지.

computed 우선 사용.

---

## 2. Object Pooling

전투 이펙트와 데미지 텍스트는 pooling 구조 사용.

---

## 3. Texture Optimization

Sprite Atlas 사용 권장.

Texture 교체 최소화.

---

## 4. Lazy Mount

필요한 UI만 mount.

---

# Asset Rules

초기 MVP에서는:

* 무료 에셋 우선
* 저용량 우선
* 픽셀아트 우선
* 빠른 구현 우선

전략을 사용한다.

추천 사이트:

* itch.io
* Kenney
* OpenGameArt

---

# MVP Priority

## Phase 1

자동 전투 MVP:

* Auto Battle
* Monster Spawn
* Damage System
* Stage System
* Gold Reward

---

## Phase 2

성장 시스템:

* Upgrade
* Equipment
* Skill
* Inventory

---

## Phase 3

보상 루프:

* Gacha
* Reward Animation
* Daily Reward
* Achievement

---

## Phase 4

Backend Integration:

* Authentication
* Cloud Save
* Ranking
* API Sync

---

# Backend Rules

Backend는 NestJS 기반으로 개발한다.

원칙:

* REST API 우선
* DTO 기반 검증
* Service Layer 분리
* Domain 중심 구조
* Prisma 또는 TypeORM 사용 가능

---

# Code Style Rules

## 반드시 지킬 것

* 함수는 짧게 유지
* 중복 로직 composable로 분리
* magic number 금지
* 상수화 우선
* 타입 정의 우선
* 이벤트 흐름 명확히 유지

---

# Comment Rules

복잡한 로직에는 반드시 주석 작성.

특히:

* 데미지 계산
* 성장 계산
* 보상 로직
* 강화 확률
* 스폰 알고리즘

은 의도를 설명한다.

---

# Git Rules

Commit Message Convention:

```text
feat:
fix:
refactor:
style:
docs:
chore:
```

예시:

```text
feat: add auto battle system
fix: resolve monster spawn duplication
```

---

# Forbidden Rules

절대 금지:

* Vue Options API
* jQuery
* Global mutable state
* PixiJS 내부 상태관리
* 거대한 단일 컴포넌트
* Hardcoded game balance values
* Direct DOM manipulation

---

# Claude Behavior Rules

Claude는 작업 시:

* 유지보수성 우선
* 확장성 우선
* 모바일 UX 우선
* 반복 성장 재미 우선

을 고려한다.

새로운 기능 추가 시 반드시:

1. 성장 루프 강화 여부
2. 유지보수 가능 여부
3. 모바일 대응 가능 여부
4. 성능 영향
5. 장기 확장 가능성

을 검토한다.

---

# Documentation Rules

새로운 시스템 추가 시 반드시 docs 작성.

예시:

```text
/docs
  battle-system.md
  upgrade-system.md
  stage-system.md
```

---

# Final Goal

최종 목표는:

* 메이플 키우기 감성
* 모바일 친화적
* 웹 최적화
* 장기 서비스 가능
* 빠른 업데이트 가능한

Vue3 기반 웹 방치형 RPG를 구축하는 것이다.

핵심은:

“복잡한 엔진 기술”

보다

“빠른 반복 개발 + 성장 루프 설계”

에 집중하는 것이다.
