# 이룸 (Yiroom) 핵심 문서 통합본

> Claude Desktop용 컨텍스트 파일
> 생성일: 2026-01-14
> 총 용량: ~427KB (500KB 제한 내)

## 목차

1. [CLAUDE.md](#claudemd) - 프로젝트 핵심 가이드
2. [AGENTS.md](#agentsmd) - 기술 스택 및 에이전트
3. [PLAN.md](#planmd) - 현재 계획
4. [COMPLETED.md](#completedmd) - 완료된 작업
5. [.claude/agents/](#claude-agents) - 전문 에이전트 정의
6. [.claude/commands/](#claude-commands) - 슬래시 명령어
7. [.claude/rules/](#claude-rules) - 코딩 규칙
8. [.cursor/rules/](#cursor-rules) - Cursor 규칙
9. [DATABASE-SCHEMA.md](#database-schemamd) - DB 스키마
10. [SDD-MASTER-REFACTORING-PLAN.md](#sdd-master-refactoring-planmd) - 마스터 플랜
11. [SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md](#sdd-phase-k) - Phase K 스펙
12. [SPEC-PHASE-L-M.md](#spec-phase-l-m) - Phase L/M 스펙
13. [.beads/](#beads) - 이슈 트래킹

---


# CLAUDE.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 핵심 가치

- **앱 이름**: 이룸 (Yiroom)
- **슬로건**: "온전한 나는?" / "Know yourself, wholly."
- **핵심 철학**: 사용자의 변화를 돕는 통합 웰니스 AI 플랫폼

## 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 typecheck + lint + test 통과 필수

## 개발 명령어

```bash
# 전체 워크스페이스 (Turborepo)
npm run dev          # 모든 앱 개발 서버
npm run build        # 모든 앱 빌드
npm run typecheck    # 타입 체크
npm run test         # 전체 테스트
npm run lint         # 린트

# 웹 앱 전용
npm run dev:web      # 웹 개발 서버 (Turbopack)
npm run build:web    # 웹 빌드

# 테스트 (apps/web에서 실행)
cd apps/web
npm run test                              # 전체 테스트
npm run test -- path/to/file.test.ts      # 단일 파일 테스트
npm run test -- --watch                   # watch 모드
npm run test -- -t "test name"            # 테스트 이름 필터
npm run test:coverage                     # 커버리지 리포트
npm run test:e2e                          # Playwright E2E 테스트
npm run test:e2e:ui                       # Playwright UI 모드

# 로컬 Supabase
npx supabase start

# 모바일 앱 전용 (apps/mobile에서 실행)
cd apps/mobile
npx expo start             # Expo 개발 서버
npx expo start --clear     # 캐시 초기화 후 시작
npm run test               # Jest 테스트 (151개)
npm run lint               # ESLint
npm run typecheck          # TypeScript 체크
eas build --profile development --platform ios    # iOS 개발 빌드
eas build --profile development --platform android # Android 개발 빌드
```

## 기술 스택

### 웹 앱 (apps/web)

| 분야      | 기술                                                        |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16+ (App Router, Turbopack) + React 19 + TypeScript |
| Auth      | Clerk (clerk_user_id 기반 Supabase 네이티브 통합)           |
| Database  | Supabase (PostgreSQL 15+, RLS 필수)                         |
| AI        | Google Gemini 3 Flash (이미지 분석)                         |
| UI        | shadcn/ui + Radix UI + Tailwind CSS v4                      |
| State     | Zustand (다단계 폼), React Hook Form + Zod (폼)             |
| Testing   | Vitest + React Testing Library + Playwright                 |

### 모바일 앱 (apps/mobile)

| 분야      | 기술                                         |
| --------- | -------------------------------------------- |
| Framework | Expo SDK 54 + React Native + Expo Router     |
| Auth      | Clerk Expo (@clerk/clerk-expo)               |
| Database  | Supabase (웹과 동일 스키마)                  |
| AI        | Google Gemini 1.5 Flash                      |
| UI        | NativeWind (Tailwind for RN), RN StyleSheet  |
| State     | React Context, Custom Hooks                  |
| Testing   | Jest + React Native Testing Library          |
| Push      | Expo Notifications                           |
| Analytics | Sentry (크래시 리포트)                       |
| Build     | EAS Build (development, preview, production) |

## 아키텍처

### 모노레포 구조

```
yiroom/
├── apps/web/          # Next.js 웹 앱 (Lite PWA)
├── apps/mobile/       # Expo React Native 앱
├── packages/shared/   # 공통 타입/유틸리티
└── docs/              # 설계 문서
```

### Supabase 클라이언트 패턴

| 컨텍스트             | 함수                          | 파일                           |
| -------------------- | ----------------------------- | ------------------------------ |
| Client Component     | `useClerkSupabaseClient()`    | `lib/supabase/clerk-client.ts` |
| Server Component/API | `createClerkSupabaseClient()` | `lib/supabase/server.ts`       |
| 관리자 (RLS 우회)    | `createServiceRoleClient()`   | `lib/supabase/service-role.ts` |

```tsx
// Client Component
'use client';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
const supabase = useClerkSupabaseClient();

// Server Component/API
import { createClerkSupabaseClient } from '@/lib/supabase/server';
const supabase = createClerkSupabaseClient();
```

### lib/ Repository 패턴

새 모듈 추가 시 `lib/api/workout.ts` 패턴 따르기:

```
lib/
├── supabase/           # DB 클라이언트 (DIP 적용)
├── api/                # Repository 패턴 (도메인별 API)
├── stores/             # Zustand 스토어
├── mock/               # 테스트/AI Fallback
├── products/           # 제품 Repository
│   ├── repositories/   # 도메인별 CRUD
│   └── services/       # 비즈니스 서비스
├── affiliate/          # 어필리에이트 시스템 (Phase I)
│   ├── partners.ts     # 파트너 Repository
│   ├── products.ts     # 제품 Repository
│   └── clicks.ts       # 클릭 트래킹
└── gemini.ts           # AI 분석 (3초 타임아웃 + 2회 재시도)
```

### AI 통합 패턴

모든 AI 호출은 Mock Fallback 필수:

```typescript
try {
  const result = await analyzeWithGemini(input);
  return result;
} catch (error) {
  console.error('[Module] Gemini error, falling back to mock:', error);
  return generateMockResult(input);
}
```

### Dynamic Import 패턴

무거운 컴포넌트(차트, 모달)는 `next/dynamic` 사용:

```typescript
export const ChartDynamic = dynamic(() => import('./Chart'), { ssr: false, loading: () => null });
```

## 모듈 구성

| Phase   | 모듈           | 설명                                            | 상태    |
| ------- | -------------- | ----------------------------------------------- | ------- |
| Phase 1 | PC-1, S-1, C-1 | 퍼스널컬러, 피부, 체형 분석                     | ✅ 완료 |
| Phase 2 | W-1, N-1, R-1  | 운동, 영양, 리포트                              | ✅ 완료 |
| Phase 3 | 앱 고도화      | E2E 테스트, 크로스 모듈                         | ✅ 완료 |
| Phase A | Product DB     | 850+ 제품, 리뷰, RAG                            | ✅ 완료 |
| Phase B | React Native   | 모노레포, Expo 앱, 알림 동기화                  | ✅ 완료 |
| Phase H | 소셜           | 웰니스 스코어, 친구, 리더보드                   | ✅ 완료 |
| Phase I | 어필리에이트   | iHerb, 쿠팡, 무신사, 전환 웹훅                  | ✅ 완료 |
| Launch  | 출시 준비      | 공지사항, FAQ, 알림 DB 연동                     | ✅ 완료 |
| Phase J | AI 스타일링    | 색상 조합, 악세서리, 메이크업                   | ✅ 완료 |
| Phase K | UX 고도화      | 성별 중립화, 패션 확장, 레시피, 프로필 리디자인 | ✅ 완료 |
| Phase D | AI 피부 상담   | 피부 고민 Q&A, 제품 추천 RAG, 상담 CTA          | ✅ 완료 |
| Phase L | 온보딩 고도화  | 성별/신체 게이트, 자세 시뮬, Best 5, 가상 피팅  | ✅ 완료 |
| Phase M | 영양 고도화    | 팬트리 UI, 레시피 DB, 시맨틱 매칭, 대체 재료    | ✅ 완료 |

## Route Groups

### 웹 앱 (Next.js App Router)

메인 기능들은 `app/(main)/` 그룹 내에 위치:

```
app/(main)/
├── analysis/           # PC-1, S-1, C-1
├── workout/            # W-1 운동 (onboarding, result, exercise/[id])
├── nutrition/          # N-1 영양
├── products/           # 제품 추천
├── dashboard/          # 대시보드
├── friends/            # 친구 (requests, search)
├── leaderboard/        # 리더보드 (nutrition, workout)
├── help/               # 도움말 (faq, feedback)
├── announcements/      # 공지사항
├── feed/               # 소셜 피드
└── profile/            # 프로필 (K-5 리디자인)
```

### 모바일 앱 (Expo Router)

5탭 구조 + 기능별 라우트 그룹:

```
apps/mobile/app/
├── (tabs)/             # 하단 5탭 네비게이션
│   ├── index.tsx       # 홈 (오늘 할 일, 요약)
│   ├── workout.tsx     # 운동
│   ├── nutrition.tsx   # 영양
│   ├── records.tsx     # 기록
│   └── profile.tsx     # 프로필
├── (auth)/             # 인증 플로우
├── (analysis)/         # AI 분석 (personal-color, skin, body)
├── (workout)/          # 운동 세션, 히스토리
├── (nutrition)/        # 식단 기록, 카메라
├── products/           # 제품 추천
├── settings/           # 설정 (notifications, goals, widgets)
└── reports/            # 리포트
```

## 데이터베이스

**핵심 테이블 (clerk_user_id 기반 RLS):**

- `users` → Clerk 사용자 정보
- `personal_color_assessments` → PC-1 진단 (온보딩 필수)
- `workout_analyses`, `workout_plans`, `workout_logs` → W-1
- `meal_records`, `water_records`, `daily_nutrition_summary` → N-1
- `cosmetic_products`, `supplement_products`, `workout_equipment`, `health_foods` → 제품 DB
- `user_levels`, `user_badges`, `wellness_scores` → Phase H 게이미피케이션
- `friendships`, `leaderboard_cache` → Phase H 소셜
- `challenges`, `challenge_participations`, `challenge_teams` → 챌린지
- `affiliate_partners`, `affiliate_products`, `affiliate_clicks`, `affiliate_daily_stats` → Phase I 어필리에이트
- `announcements`, `faqs`, `feedback` → 운영 (Launch)
- `user_notification_settings`, `user_push_tokens` → 알림 설정 (Launch)

## 슬래시 명령어

| 명령어      | 용도                                                   |
| ----------- | ------------------------------------------------------ |
| `/qplan`    | 계획 분석 및 검토                                      |
| `/qcode`    | 구현 + 테스트 + 포맷팅                                 |
| `/qcheck`   | 코드 품질 검사                                         |
| `/test`     | 테스트 실행                                            |
| `/review`   | 코드 리뷰                                              |
| `/sisyphus` | 적응형 오케스트레이터 (복잡도 기반 에이전트 자동 선택) |

## 핵심 규칙

- 스펙 없이 코딩 금지 → `docs/` 확인
- RLS 정책 필수 (clerk_user_id 기반)
- 최상위 컨테이너에 `data-testid` 속성 필수
- 한국어 주석 (복잡한 로직 위에 "왜" 설명)
- UI 텍스트: 자연스럽고 정중한 한국어

## 상세 문서

- `docs/DATABASE-SCHEMA.md` - 테이블 구조, RLS, JSONB 필드
- `docs/SDD-WORKFLOW.md` - Spec-Driven Development 가이드
- `.claude/rules/` - 코딩 표준, 프로젝트 구조, AI 통합 규칙
- `.claude/rules/hybrid-data-pattern.md` - Hybrid 데이터 패턴 (DB + Mock 조합)
- `.claude/agents/` - 전문 Agent 설정
- `.claude/lib/complexity-analyzer.md` - 복잡도 분석 기준

## 전문 에이전트

| 에이전트                | 역할                        | 병렬 그룹 |
| ----------------------- | --------------------------- | --------- |
| yiroom-spec-reviewer    | 스펙 검토, 논리적 허점 발견 | A         |
| yiroom-ui-validator     | 브랜드/UX 가이드라인 검증   | A         |
| yiroom-code-quality     | 코드 품질 검사, 린트        | B         |
| yiroom-test-writer      | 테스트 작성, 커버리지       | B         |
| korean-ux-writer        | 한국어 UX 라이팅 최적화     | C         |
| korean-beauty-validator | K-뷰티 트렌드 검증          | C         |

## 시지푸스 오케스트레이터

적응형 에이전트 오케스트레이션 시스템 (4-tier 트랙):

```
복잡도 분석 → 트랙 결정 → 에이전트 실행 → 결과 통합
```

| 총점   | 트랙명       | 전략     | 에이전트                   |
| ------ | ------------ | -------- | -------------------------- |
| 0-30   | **Quick**    | direct   | 없음 (직접 실행)           |
| 31-50  | **Light**    | single   | code-quality               |
| 51-70  | **Standard** | standard | code-quality + test-writer |
| 71-100 | **Full**     | full     | 전체 에이전트 파이프라인   |

**모델**: Opus 4.5 전용 (품질 일관성 보장)
**상세 점수 기준**: `.claude/lib/complexity-analyzer.md` 참조

### 자동 트리거 가이드

시지푸스 사용 여부는 `.claude/rules/sisyphus-trigger.md` 규칙 참조:

**`/sisyphus` 사용:**

- 4개 이상 파일 수정
- DB/인증/외부API 관련 변경
- 새로운 아키텍처/패턴 도입
- 사용자가 "검토", "리뷰" 요청

**직접 실행:**

- 1-3개 파일, 단일 기능 범위
- UI/스타일, 문서, 테스트 추가
- 이전에 검증된 패턴 반복

---

**Version**: 11.2 | **Updated**: 2026-01-12 | Phase L/M 완료, 온보딩 고도화 및 팬트리/레시피 시스템

---

# AGENTS.md

# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 15.5.6** with React 19 and App Router
- **Authentication**: Clerk (with Korean localization)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 (uses `globals.css`, no config file)
- **UI Components**: shadcn/ui (based on Radix UI)
- **Icons**: lucide-react
- **Forms**: react-hook-form + Zod
- **Package Manager**: pnpm
- **Language**: TypeScript (strict typing required)

## Development Commands

```bash
# Development server with turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Project Architecture

### Clerk + Supabase Integration

이 프로젝트는 Clerk와 Supabase의 네이티브 통합 (2025년 4월 이후 권장 방식)을 사용합니다:

1. **인증 흐름**:
   - Clerk가 사용자 인증 처리
   - `SyncUserProvider`가 로그인 시 자동으로 Clerk 사용자를 Supabase `users` 테이블에 동기화
   - Supabase 클라이언트가 Clerk 토큰을 사용하여 인증 (JWT 템플릿 불필요)

2. **Supabase 클라이언트 파일들** (`lib/supabase/`):
   - `clerk-client.ts`: Client Component용 (useClerkSupabaseClient hook)
     - Clerk 세션 토큰으로 인증된 사용자의 데이터 접근
     - RLS 정책이 `auth.jwt()->>'sub'`로 Clerk user ID 확인
   - `server.ts`: Server Component/Server Action용 (createClerkSupabaseClient)
     - 서버 사이드에서 Clerk 인증 사용
   - `service-role.ts`: 관리자 권한 작업용 (SUPABASE_SERVICE_ROLE_KEY 사용)
     - RLS 우회, 서버 사이드 전용
   - `client.ts`: 인증 불필요한 공개 데이터용
     - anon key만 사용, RLS 정책이 `to anon`인 데이터만 접근

3. **사용자 동기화**:
   - `hooks/use-sync-user.ts`: Clerk → Supabase 사용자 동기화 훅
   - `components/providers/sync-user-provider.tsx`: RootLayout에서 자동 실행
   - `app/api/sync-user/route.ts`: 실제 동기화 로직 (API 라우트)

### Directory Convention

프로젝트 파일은 `app` 외부에 저장:

- `app/`: 라우팅 전용 (page.tsx, layout.tsx, route.ts 등만)
- `components/`: 재사용 가능한 컴포넌트
  - `components/ui/`: shadcn 컴포넌트 (자동 생성, 수정 금지)
  - `components/providers/`: React Context 프로바이더들
- `lib/`: 유틸리티 함수 및 클라이언트 설정
  - `lib/supabase/`: Supabase 클라이언트들 (환경별로 분리)
  - `lib/utils.ts`: 공통 유틸리티 (cn 함수 등)
- `hooks/`: 커스텀 React Hook들
- `supabase/`: 데이터베이스 마이그레이션 및 설정
  - `supabase/migrations/`: SQL 마이그레이션 파일들
  - `supabase/config.toml`: Supabase 프로젝트 설정

**예정된 디렉토리** (아직 없지만 필요 시 생성):

- `actions/`: Server Actions (API 대신 우선 사용)
- `types/`: TypeScript 타입 정의
- `constants/`: 상수 값들
- `states/`: 전역 상태 (jotai 사용, 최소화)

### Naming Conventions

- **파일명**: kebab-case (예: `use-sync-user.ts`, `sync-user-provider.tsx`)
- **컴포넌트**: PascalCase (파일명은 여전히 kebab-case)
- **함수/변수**: camelCase
- **타입/인터페이스**: PascalCase

## Database

### Supabase Migrations

마이그레이션 파일 명명 규칙: `YYYYMMDDHHmmss_description.sql`

예시:

```
supabase/migrations/20241030014800_create_users_table.sql
```

**중요**:

- 새 테이블 생성 시 반드시 Row Level Security (RLS) 활성화
- 개발 중에는 RLS를 비활성화할 수 있으나, 프로덕션에서는 활성화 필수
- RLS 정책은 세분화: select, insert, update, delete별로 각각 작성
- `anon`과 `authenticated` 역할별로 별도 정책 작성

### 현재 스키마

#### 데이터베이스 테이블

- `users`: Clerk 사용자와 동기화되는 사용자 정보
  - `id`: UUID (Primary Key)
  - `clerk_id`: TEXT (Unique, Clerk User ID)
  - `name`: TEXT
  - `created_at`: TIMESTAMP
  - RLS: 개발 중 비활성화 (프로덕션에서는 활성화 필요)

#### Storage 버킷

- `uploads`: 사용자 파일 저장소
  - 경로 구조: `{clerk_user_id}/{filename}`
  - RLS 정책:
    - INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
    - SELECT: 인증된 사용자만 자신의 파일 조회 가능
    - DELETE: 인증된 사용자만 자신의 파일 삭제 가능
    - UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
  - 정책은 `auth.jwt()->>'sub'` (Clerk user ID)로 사용자 확인

## Environment Variables

`.env.example` 참고하여 `.env` 파일 생성:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

## Development Guidelines

### Server Actions vs API Routes

**우선순위**: Server Actions > API Routes

- 가능하면 항상 Server Actions 사용 (`actions/` 디렉토리)
- API Routes는 불가피한 경우에만 사용 (웹훅, 외부 API 등)
- 현재 `/api/sync-user`는 기존 구조상 API Route로 구현됨

### UI Components

1. **shadcn/ui 설치 확인**: 사용 전 `/components/ui/` 디렉토리 체크
2. **설치 명령어**: `pnpx shadcn@latest add [component-name]`
3. **아이콘**: lucide-react 사용 (`import { Icon } from 'lucide-react'`)

### Styling

- Tailwind CSS v4 사용 (설정은 `app/globals.css`에만)
- `tailwind.config.js` 파일은 사용하지 않음
- 다크/라이트 모드 지원 고려

### TypeScript

- 모든 코드에 타입 정의 필수
- 인터페이스 우선, 타입은 필요시만
- enum 대신 const 객체 사용
- `satisfies` 연산자로 타입 검증

### React 19 & Next.js 15 Patterns

```typescript
// Async Request APIs (항상 await 사용)
const cookieStore = await cookies();
const headersList = await headers();
const params = await props.params;
const searchParams = await props.searchParams;

// Server Component 우선
// 'use client'는 필요한 경우에만
```

## Key Files

- `middleware.ts`: Clerk 미들웨어 (인증 라우트 보호)
- `app/layout.tsx`: RootLayout with ClerkProvider + SyncUserProvider
- `lib/supabase.ts`: 레거시 Supabase 클라이언트 (사용 지양, 새 파일들 사용)
- `components.json`: shadcn/ui 설정

## Additional Cursor Rules

프로젝트에는 다음 Cursor 규칙들이 있습니다:

- `.cursor/rules/web/nextjs-convention.mdc`: Next.js 컨벤션
- `.cursor/rules/web/design-rules.mdc`: UI/UX 디자인 가이드
- `.cursor/rules/web/playwright-test-guide.mdc`: 테스트 가이드
- `.cursor/rules/supabase/`: Supabase 관련 규칙들

주요 원칙은 이 CLAUDE.md에 통합되어 있으나, 세부사항은 해당 파일들 참고.

## Custom Agents

프로젝트에 특화된 커스텀 Agent들이 `.claude/agents/`에 있습니다:

### 핵심 Agent (6개)

| Agent                       | 파일                       | 역할                                |
| --------------------------- | -------------------------- | ----------------------------------- |
| **korean-beauty-validator** | korean-beauty-validator.md | K-뷰티 트렌드 검증, 제품 추천 검증  |
| **korean-ux-writer**        | korean-ux-writer.md        | 세대별 한국어 UI 문구, 마이크로카피 |
| **yiroom-spec-reviewer**    | yiroom-spec-reviewer.md    | 스펙 문서 검토                      |
| **yiroom-code-quality**     | yiroom-code-quality.md     | 코드 품질 검사                      |
| **yiroom-test-writer**      | yiroom-test-writer.md      | 테스트 코드 작성                    |
| **yiroom-ui-validator**     | yiroom-ui-validator.md     | UI/UX 검증                          |

### Agent 활용 예시

```bash
# K-뷰티 제품 추천 검증
"korean-beauty-validator agent로 이 제품들이 20대 초반에게 적합한지 검증해줘"

# UI 문구 최적화
"korean-ux-writer agent로 이 에러 메시지를 더 친근하게 바꿔줘"

# 스펙 문서 검토
"yiroom-spec-reviewer agent로 PC-1 스펙을 검토해줘"
```

## Specs 폴더 구조

SDD (Spec-Driven Development) 문서는 `specs/`에 관리합니다:

```
specs/
├── features/     # Feature 스펙 (기능 단위)
├── tasks/        # Task 분해 (세부 작업)
├── dev/          # Development 명세 (구현 상세)
└── templates/    # 스펙 템플릿
```

스펙 작성 시 `specs/templates/FEATURE-SPEC-TEMPLATE.md` 참고.

## Custom Commands (Slash Commands)

`.claude/commands/`에 정의된 슬래시 명령어들:

| 명령어            | 설명                  | 사용 예시                 |
| ----------------- | --------------------- | ------------------------- |
| `/create-feature` | SDD 기반 새 기능 생성 | `/create-feature PC-1`    |
| `/review`         | 종합 코드 리뷰        | `/review app/analysis/`   |
| `/test`           | 테스트 실행 및 분석   | `/test --coverage`        |
| `/deploy-check`   | 배포 전 체크리스트    | `/deploy-check`           |
| `/standup`        | 일일 개발 현황 요약   | `/standup`                |
| `/qplan`          | 빠른 계획 검토        | `/qplan 로그인 버튼 추가` |
| `/qcode`          | 빠른 구현 + 검증      | `/qcode`                  |
| `/qcheck`         | 빠른 품질 검사        | `/qcheck`                 |

### Quick Workflow (권장)

```bash
# 1. 계획 검토
/qplan [작업 내용]

# 2. 승인 후 구현
/qcode

# 3. 품질 검사
/qcheck

# 4. 배포 전 최종 확인
/deploy-check
```

## 계층적 CLAUDE.md

프로젝트는 디렉토리별 CLAUDE.md를 사용합니다:

| 위치                   | 역할                      |
| ---------------------- | ------------------------- |
| `CLAUDE.md` (루트)     | 프로젝트 핵심 규칙 (50줄) |
| `app/CLAUDE.md`        | Next.js App Router 규칙   |
| `components/CLAUDE.md` | 컴포넌트 작성 규칙        |
| `tests/CLAUDE.md`      | 테스트 규칙               |
| `supabase/CLAUDE.md`   | DB/Supabase 규칙          |

## 작업 관리 파일

| 파일            | 용도                                        |
| --------------- | ------------------------------------------- |
| `SCRATCHPAD.md` | 진행 중인 작업, To-Do, 메모                 |
| `COMPLETED.md`  | 완료된 작업 기록                            |
| `.mcp.json`     | 외부 도구 연동 설정 (GitHub, PostgreSQL 등) |

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

---

# PLAN.md

# Phase A-0 + A-1 구현 계획 ✅ 완료

> **목표**: 색상 토큰 적용 + Lite PWA 설정
> **작성일**: 2025-12-04
> **완료일**: 2025-12-04

---

## 현재 상태 분석

### 1. 색상 시스템 (globals.css)
- **현재**: oklch 색상 포맷 (shadcn/ui 표준)
- **Primary**: `oklch(0.205 0 0)` (검정색 계열)
- **Background**: `oklch(1 0 0)` (흰색)

### 2. 폰트 (layout.tsx)
- **현재**: Geist Sans / Geist Mono
- **Stitch**: Inter + Noto Sans

### 3. PWA
- **현재**: 설정 없음
- **manifest.ts**: 없음
- **next-pwa**: 미설치

---

## 구현 계획

### A-0: 디자인 토큰 적용

#### Step 1: 색상 변환 (Stitch hex → oklch)

| Stitch (hex) | 용도 | oklch 변환값 |
|-------------|------|-------------|
| `#2e5afa` | Primary (파란색) | `oklch(0.53 0.23 262)` |
| `#f8f9fc` | Background | `oklch(0.98 0.005 270)` |
| `#0d101c` | Text Primary | `oklch(0.15 0.02 270)` |
| `#475a9e` | Text Secondary | `oklch(0.48 0.12 270)` |
| `#e6e9f4` | Secondary | `oklch(0.93 0.02 270)` |
| `#ced4e9` | Border | `oklch(0.87 0.03 270)` |

#### Step 2: globals.css 수정

```css
:root {
  /* 기존 oklch 값을 Stitch 톤으로 변경 */
  --primary: oklch(0.53 0.23 262);           /* #2e5afa 파란색 */
  --primary-foreground: oklch(0.98 0.005 270); /* 흰색 */
  --background: oklch(0.98 0.005 270);       /* #f8f9fc */
  --foreground: oklch(0.15 0.02 270);        /* #0d101c */
  --secondary: oklch(0.93 0.02 270);         /* #e6e9f4 */
  --border: oklch(0.87 0.03 270);            /* #ced4e9 */
  --muted-foreground: oklch(0.48 0.12 270);  /* #475a9e */
}
```

#### Step 3: 폰트 결정

**권장**: Geist 유지
- 이유: 이미 잘 동작 중, Inter와 유사한 산세리프
- 변경 시 영향 범위가 큼

**대안 (선택사항)**: Inter 추가
```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

---

### A-1: Lite PWA 설정

#### Step 1: 패키지 설치

```bash
npm install @ducanh2912/next-pwa
```

#### Step 2: app/manifest.ts 생성

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '이룸 - 온전한 나는?',
    short_name: '이룸',
    description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f9fc',
    theme_color: '#2e5afa',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
```

#### Step 3: next.config.ts 수정

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // 오프라인 미지원 (Lite PWA)
  fallbacks: false,
  cacheOnFrontEndNav: false,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "img.youtube.com" },
      { hostname: "i.ytimg.com" },
      { hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withPWA(nextConfig);
```

#### Step 4: .gitignore 업데이트

```gitignore
# PWA 생성 파일
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map
```

---

## 작업 순서

```
1. globals.css 색상 토큰 수정
2. npm install @ducanh2912/next-pwa
3. app/manifest.ts 생성
4. next.config.ts PWA 래핑 추가
5. .gitignore 업데이트
6. npm run build (빌드 테스트)
7. npm run dev로 PWA 설치 테스트
```

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `app/globals.css` | 색상 변수 수정 (6개 변수) |
| `app/manifest.ts` | 새로 생성 |
| `next.config.ts` | withPWA 래핑 추가 |
| `.gitignore` | PWA 캐시 파일 추가 |
| `package.json` | @ducanh2912/next-pwa 추가 (자동) |

---

## 검증 항목

- [x] `npm run typecheck` 통과 ✅
- [x] `npm run build --webpack` 성공 ✅
- [ ] 브라우저에서 색상 변경 확인 (dev 서버에서 확인 필요)
- [ ] Chrome DevTools > Application > Manifest 확인
- [ ] 모바일에서 "홈 화면에 추가" 테스트

---

## 롤백 계획

문제 발생 시:
1. `git checkout app/globals.css` (색상 원복)
2. `npm uninstall @ducanh2912/next-pwa` (PWA 제거)
3. `git checkout next.config.ts` (설정 원복)

---

---

## 추가 수정 사항 (빌드 에러 해결)

구현 중 발견된 기존 코드 이슈 수정:

### 1. Client/Server 모듈 분리
- **문제**: Client Component에서 Server-only 모듈 import
- **해결**: Server Actions 파일 생성

| 파일 | 작업 |
|------|------|
| `app/(main)/workout/actions.ts` | getLatestWorkoutAnalysisAction, getWorkoutStreakAction |
| `app/(main)/workout/session/actions.ts` | saveWorkoutLogAction, getWorkoutStreakAction |
| `app/(main)/workout/page.tsx` | Server Actions 사용으로 변경 |
| `app/(main)/workout/session/page.tsx` | Server Actions 사용으로 변경 |

### 2. 테스트 파일 수정
- `tests/lib/product-recommendations.test.ts`: SkinType import 경로 수정

### 3. Next.js 16 Turbopack 호환
- `next.config.ts`에 `turbopack: {}` 추가 (빈 설정)

---

# COMPLETED.md

# ✅ COMPLETED.md - 완료 작업 기록

> 완료된 작업을 기록하여 진행 상황을 추적합니다.
> 가장 최근 항목이 위에 옵니다.

---

## 📅 2025-11-25

### ✅ 프로젝트 초기 설정
- [x] 보일러플레이트 설치
- [x] 환경 변수 설정
- [x] Supabase 연결 확인
- [x] Clerk 인증 설정

**소요 시간**: 약 2시간
**관련 파일**: package.json, .env.local, lib/supabase.ts

---

## 📅 [날짜]

### ✅ [작업 제목]
- [x] 세부 작업 1
- [x] 세부 작업 2

**소요 시간**: 약 X시간
**관련 파일**: [파일 목록]
**테스트**: ✅ 통과 / ⚠️ 일부 스킵

---

## 📊 Phase 1 진행 현황

### Week 0-1: 환경 설정
- [x] 프로젝트 초기화
- [x] 기본 인증 시스템
- [ ] DB 스키마 적용

### Week 2-3: PC-1 퍼스널 컬러
- [ ] 온보딩 문진 UI
- [ ] 이미지 업로드
- [ ] AI 분석 연동
- [ ] 결과 페이지

### Week 4-5: S-1 피부 분석
- [ ] 촬영 가이드 UI
- [ ] 7가지 지표 분석
- [ ] 제품 추천

### Week 6-7: C-1 체형 분석
- [ ] 체형 진단 UI
- [ ] 스타일 추천
- [ ] PC 연동 코디

### Week 8: 통합 & 베타
- [ ] 모듈 통합
- [ ] 베타 테스트
- [ ] 버그 수정

---

## 📈 통계

| 항목 | 값 |
|------|-----|
| 총 완료 작업 | X개 |
| 총 소요 시간 | X시간 |
| 현재 진행률 | X% |
| 예상 완료일 | [날짜] |

---

**Tip**: `/standup` 명령어로 일일 현황을 확인하세요.

---

# .claude/agents/

## korean-beauty-validator.md

---
name: korean-beauty-validator
description: 한국 뷰티 트렌드 검증 및 K-뷰티 전문 분석 Agent
tools: Read, Grep, WebSearch
model: opus
---

# 🇰🇷 Korean Beauty Validator Agent

## 🎯 역할 정의

당신은 한국 뷰티 시장의 트렌드와 소비자 성향을 깊이 이해하는 K-뷰티 전문가입니다.

### 핵심 전문 영역

1. **한국 뷰티 트렌드 분석**
   - 올리브영, 무신사 뷰티 랭킹 추적
   - 화해 앱 인기 제품 동향
   - 성수동/강남 뷰티 트렌드

2. **K-뷰티 특화 용어**
   - 글로우픽, 톤업, 쿨톤/웜톤
   - 7스킨법, 슬러그잉, 스킵케어
   - 클린뷰티, 비건뷰티, 더마코스메틱

3. **한국 소비자 특성**
   - 10대 후반: 첫 메이크업, 저가 로드샵, 아이돌 메이크업
   - 20대 초반: 올리브영 세일, 성분 중시, 트렌드 민감
   - 20대 후반~30대 초반: 프리미엄 케어, 안티에이징 시작
   - 30대 중반 이상: 기능성 화장품, 브랜드 충성도

## 📋 검증 체크리스트

### 제품 추천 검증

```yaml
올리브영 판매 여부:
  - 올영 세일 대상 제품인가?
  - 올영픽 선정 이력이 있는가?

화해 평점:
  - 화해 평점 4.0 이상인가?
  - 성분 안전도 EWG 그린 등급인가?

가격 적정성:
  - 10대 후반: 1-2만원대
  - 20대 초반: 2-4만원대
  - 20대 후반~30대 초반: 3-7만원대
  - 30대 중반 이상: 5만원 이상 OK

브랜드 인지도:
  - 한국에서 구매 가능한가?
  - 온라인몰 입점 여부
```

### UI/UX 문구 검증

```yaml
나이대별 톤:
  10대 후반: "~했어요!", "대박", "레알"
  20대 초반: "~했어요", "인생템", "가성비"
  20대 후반~30대 초반: "~했습니다", "투자", "관리"
  30대 중반 이상: "~합니다", "프리미엄", "안티에이징"

트렌드 키워드:
  - 글로우, 톤업, 속건조
  - 민감성, 진정, 수분
  - 결개선, 모공케어, 주름개선
```

### 퍼스널 컬러 연동

```yaml
봄 웜톤:
  - 코랄, 피치, 오렌지 계열
  - MLBB, 누드톤

여름 쿨톤:
  - 핑크, 로즈, 베리 계열
  - 청량감, 투명감

가을 웜톤:
  - 브라운, 벽돌, 버건디
  - 음영, 깊이감

겨울 쿨톤:
  - 레드, 와인, 퍼플
  - 선명함, 대비
```

## 🔍 검증 프로세스

### Step 1: 트렌드 적합성

```
1. 현재 시즌 트렌드 확인
2. 연령대별 선호도 매칭
3. SNS 버즈량 체크
```

### Step 2: 한국 시장 가용성

```
1. 국내 정식 수입 여부
2. 온라인몰 판매 여부
3. 배송 기간 확인
```

### Step 3: 가격 경쟁력

```
1. 동일 카테고리 평균가 비교
2. 올리브영 세일가 반영
3. 쿠팡/네이버 최저가 체크
```

## 📊 검증 결과 형식

```markdown
## 🇰🇷 K-뷰티 트렌드 검증 결과

### ✅ 트렌드 적합도: 92/100

- 현재 인기 키워드 매칭: 글로우, 수분
- 올리브영 카테고리 랭킹: 3위
- 화해 앱 평점: 4.5/5.0

### 🎯 타겟 적합성

- 10대 후반: ⭐⭐⭐ (가격 부담)
- 20대 초반: ⭐⭐⭐⭐⭐ (완벽 매칭)
- 20대 후반~30대 초반: ⭐⭐⭐⭐⭐ (메인 타겟)
- 30대 중반 이상: ⭐⭐⭐⭐ (프리미엄 기능)

### 💰 구매 추천

- 올영 세일: 1+1 행사 중
- 쿠팡: 로켓배송 가능
- 네이버: 리뷰 이벤트 진행

### ⚠️ 주의사항

- 민감성 피부 패치 테스트 필수
- 여름철 무거울 수 있음
```

## 🚀 활용 예시

```bash
# 제품 추천 검증
"korean-beauty-validator agent로 이 제품들이 한국 20대 초반에게 적합한지 검증해줘"

# UI 문구 검증
"korean-beauty-validator agent로 이 화면의 문구가 한국 뷰티앱 톤에 맞는지 확인해줘"

# 트렌드 분석
"korean-beauty-validator agent로 2025년 겨울 한국 스킨케어 트렌드 분석해줘"
```

## 🔄 업데이트 주기

- **주간**: 올리브영/화해 랭킹 업데이트
- **월간**: 시즌 트렌드 키워드 갱신
- **분기**: 연령별 소비 패턴 분석

---

**Note**: 이 Agent는 한국 뷰티 시장의 빠른 변화를 반영하기 위해 지속적으로 학습하고 업데이트됩니다.

## korean-ux-writer.md

---
name: korean-ux-writer
description: 한국어 UX 라이팅 및 마이크로카피 최적화 전문 Agent
tools: Read, Edit, Grep
model: opus
---

# ✍️ Korean UX Writer Agent

## 🎯 역할 정의

당신은 한국 사용자의 언어 습관과 문화적 맥락을 깊이 이해하는 UX 라이팅 전문가입니다.

### 핵심 전문 영역

1. **상황별 메시지 톤앤매너**
2. **에러 메시지 최적화**
3. **CTA 버튼 문구 최적화**
4. **마이크로카피 작성**
5. **접근성 고려 문구**

## 📝 한국어 UX 라이팅 원칙

### 1. 기본 톤앤매너

```yaml
이룸 브랜드 톤:
  - 친근하면서 전문적
  - 따뜻하지만 명확
  - 공감하며 안내

기본 문체:
  - "~해요" 체 사용 (해요체)
  - 존댓말 일관 유지
  - 짧고 명확한 문장
```

### 2. 상황별 메시지 템플릿

#### 온보딩

```yaml
첫 방문: '안녕하세요! 이룸과 함께
  온전한 나를 발견해보세요'

프로필 설정: '먼저 몇 가지만 알려주세요.
  더 정확한 분석을 도와드릴게요'

완료: '모든 준비가 끝났어요!
  이제 시작해볼까요?'
```

#### 분석 진행

```yaml
시작: 'AI가 분석을 시작했어요
  잠시만 기다려주세요'

진행중: '거의 다 됐어요!
  조금만 더 기다려주세요'

완료: '분석이 완료되었어요!
  결과를 확인해보세요'
```

#### 에러 처리

```yaml
네트워크 오류: '인터넷 연결을 확인해주세요
  다시 시도하시겠어요?'

업로드 실패: '사진을 업로드할 수 없어요
  다른 사진으로 시도해보세요'

서버 오류: '잠시 후 다시 시도해주세요
  불편을 드려 죄송해요'

일반 오류: '문제가 발생했어요
  다시 시도해주세요'
```

#### 성공/확인

```yaml
저장 완료: '저장되었어요'

분석 완료: '분석이 완료되었어요!'

업로드 완료: '업로드가 완료되었어요'
```

### 3. CTA 버튼 최적화

#### 변환율 높은 문구

```yaml
가입 유도: ❌ "회원가입"
  ✅ "시작하기"
  ✅ "무료로 시작하기"

분석 시작: ❌ "분석"
  ✅ "내 피부 알아보기"
  ✅ "진단 시작하기"

결과 확인: ❌ "보기"
  ✅ "결과 확인하기"

공유: ❌ "공유"
  ✅ "친구에게 공유하기"

다음 단계: ❌ "다음"
  ✅ "계속하기"
```

### 4. 마이크로카피 체크리스트

#### 입력 필드

```yaml
placeholder:
  이름: '이름을 입력해주세요'
  이메일: 'example@email.com'
  전화번호: '010-0000-0000'

helper text:
  성공: '사용 가능해요'
  에러: '다시 확인해주세요'
  정보: '개인정보는 안전하게 보호됩니다'
```

#### 알림/토스트

```yaml
성공:
  "저장되었어요"
  "완료되었어요"

경고:
  "정말 삭제하시겠어요?"
  "저장하지 않고 나가시겠어요?"

정보:
  "새로운 기능이 추가되었어요"
  "팁: 밝은 곳에서 촬영하면 더 정확해요"
```

### 5. 접근성 문구

```yaml
이미지 alt 텍스트:
  - 구체적인 설명 제공
  - "이미지" 단어 불필요
  - 예: "퍼스널 컬러 진단 결과 - 봄 웜톤"

버튼 레이블:
  - 동작 명확히 표현
  - 예: "메뉴 열기", "결과 저장하기"

폼 레이블:
  - 필수 항목 명시
  - 예: "이메일 (필수)"
```

## 🔍 검증 프로세스

### Step 1: 문법 및 맞춤법

```
1. 한글 맞춤법 검사
2. 띄어쓰기 검사
3. 외래어 표기법 확인
```

### Step 2: 톤앤매너 일관성

```
1. 해요체 일관성
2. 브랜드 톤 매칭
3. 문장 길이 적절성
```

### Step 3: 가독성 및 명확성

```
1. 문장 길이 (모바일 최적화)
2. 어려운 단어 사용 여부
3. 중의적 표현 체크
```

## 📊 검증 결과 형식

```markdown
## ✍️ UX 라이팅 검증 결과

### 📝 문구 분석

원문: "회원가입을 진행해주세요"
개선: "무료로 시작하기"

### 🎯 개선 포인트

- ✅ 행동 유도성 향상
- ✅ 부담감 감소
- ✅ 명확한 혜택 제시

### ⚠️ 주의사항

- 법적 필수 문구 확인
- 개인정보 관련 안내 포함
```

## 🚀 활용 예시

```bash
# 전체 UI 텍스트 검증
"korean-ux-writer agent로 이 화면의 텍스트를 검토해줘"

# 에러 메시지 개선
"korean-ux-writer agent로 이 에러 메시지를 더 친근하게 바꿔줘"

# CTA 버튼 개선
"korean-ux-writer agent로 이 버튼 문구를 개선해줘"
```

## 📚 피해야 할 표현

```yaml
권위적: "~하십시오", "~해야 합니다"
모호함: "곧", "잠시", "조금" (구체적 시간 제시)
부정적: "실패", "불가능" → "다시 시도", "확인 필요"
어려움: "구성", "설정", "구현" → "만들기", "선택", "시작"
```

## ✅ 권장 표현

```yaml
친근함: "~해보세요", "~할게요"
구체적: "30초", "3단계", "5분 이내"
긍정적: "완료", "성공", "가능해요"
쉬움: "만들기", "선택하기", "시작하기"
```

---

**Note**: 이룸 브랜드 톤은 "친근하면서 전문적"입니다. 모든 문구는 이 기준에 맞춰 작성해주세요.

## sisyphus-adaptive.md

---
name: sisyphus-adaptive
description: 복잡도 기반 적응형 오케스트레이터 - 작업 분배 및 품질 관리. 이 에이전트는 복잡한 작업에 대해 proactively 사용되어야 합니다.
tools: Task, Read, Grep, Glob, Bash
model: opus
---

# 시지푸스 어댑티브 오케스트레이터

당신은 이룸 프로젝트의 워크플로우 오케스트레이터입니다.
작업을 분석하고, 적절한 전문 에이전트에게 위임하며, 결과를 통합합니다.

## 🔥 자동 트리거 조건 (PROACTIVE)

**다음 조건 중 하나라도 만족하면 이 에이전트를 자동으로 실행해야 합니다:**

1. **파일 영향도 높음**: 4개 이상 파일 수정이 예상되는 경우
2. **아키텍처 변경**: 새로운 패턴/구조 도입, 기존 구조 리팩토링, DB 스키마 변경
3. **리스크 요소**: 인증/보안 관련 변경, 외부 API 연동, 결제/민감 데이터 처리
4. **명시적 요청**: 사용자가 "검토", "리뷰", "품질 체크" 언급

**자동 트리거 제외 (직접 실행):**

- 1-3개 파일의 단순 수정
- UI/스타일 변경, 문서 업데이트, 테스트 추가
- 이전에 검증된 동일 패턴 반복

## 핵심 원칙

1. **적응형 실행**: 복잡도에 따라 실행 전략 조정
2. **병렬 우선**: 독립적인 작업은 병렬로 실행
3. **조기 실패**: Critical 검사 실패 시 즉시 중단
4. **자동 승격**: 실패 시 상위 모델로 재시도

## 복잡도 분석

작업을 받으면 먼저 복잡도를 분석합니다:

```
[복잡도 분석]
├─ 영향 파일 수: N개
├─ 변경 유형: (버그수정/수정/추가/아키텍처)
├─ 의존성 깊이: (독립/1-2단계/3단계+)
├─ 리스크 요소: (DB/인증/외부API)
└─ 총점: XX점 → 트랙: (Quick/Light/Standard/Full)
```

## 실행 전략 (4-tier 트랙)

| 총점   | 트랙명       | 전략     | 에이전트                   |
| ------ | ------------ | -------- | -------------------------- |
| 0-30   | **Quick**    | direct   | 없음 (직접 실행)           |
| 31-50  | **Light**    | single   | code-quality               |
| 51-70  | **Standard** | standard | code-quality + test-writer |
| 71-100 | **Full**     | full     | 전체 에이전트 파이프라인   |

**모델**: Opus 4.5 전용 (품질 일관성 보장)

### Quick (0-30점)

- 오케스트레이션 없이 직접 실행
- 단순 버그 수정, 오타 수정, 주석 추가
- 1-2개 파일 수정

### Light (31-50점)

- 단일 에이전트 실행
- 새 컴포넌트 추가, 2-3개 파일 수정
- code-quality 에이전트만 활용

### Standard (51-70점)

- 표준 파이프라인 실행
- 새 기능 모듈, 4-6개 파일 수정
- code-quality + test-writer 에이전트 활용

### Full (71-100점)

- 전체 파이프라인 실행
- 에이전트: 모든 전문 에이전트 활용
- 병렬 실행: 에이전트들이 분석 → 통합 판단

## 전문 에이전트 목록

| 에이전트                | 역할               | 병렬 그룹 |
| ----------------------- | ------------------ | --------- |
| yiroom-spec-reviewer    | 스펙 검토          | A         |
| yiroom-ui-validator     | UI 가이드라인 검증 | A         |
| yiroom-code-quality     | 코드 품질 검사     | B         |
| yiroom-test-writer      | 테스트 작성        | B         |
| korean-ux-writer        | UX 텍스트 검수     | C         |
| korean-beauty-validator | 뷰티 도메인 검증   | C         |

## 실행 흐름

```
1. 작업 수신
   ↓
2. 복잡도 분석 → 전략 결정
   ↓
3. [병렬] 그룹 A: spec-reviewer + ui-validator
   ↓
4. Critical 검사 (통과 시 계속, 실패 시 중단)
   ↓
5. [병렬] 그룹 B: code-quality + test-writer
   ↓
6. [병렬] 그룹 C: korean-ux-writer + beauty-validator
   ↓
7. 결과 통합 및 보고
```

## 결과 보고 형식

```markdown
## 시지푸스 실행 결과

### 작업 요약

- 작업: [작업 설명]
- 복잡도: XX점 (전략: YYY)
- 실행 시간: N초

### 에이전트 결과

| 에이전트      | 상태 | 소요 시간 | 주요 발견      |
| ------------- | ---- | --------- | -------------- |
| spec-reviewer | ✅   | 1.2s      | 이슈 없음      |
| code-quality  | ⚠️   | 2.1s      | Minor 이슈 2건 |

### 통합 판단

- 진행 가능 여부: ✅ / ⚠️ / ❌
- 권장 조치: [조치 내용]

### 다음 단계

1. [다음 작업]
2. [다음 작업]
```

## 모델 설정

**Opus 4.5 전용 실행**

| 항목 | 설정                                |
| ---- | ----------------------------------- |
| 모델 | Opus 4.5 (claude-opus-4-5-20251101) |
| 용도 | 모든 작업 (분석, 검증, 통합)        |
| 장점 | 최고 품질, 일관된 아키텍처 결정     |

**실패 처리**: Opus 실패 시 사용자에게 수동 개입 요청

## 캐싱

- 동일 입력에 대한 결과는 5분간 캐싱
- 캐시 키: `${taskType}-${inputHash}`

## 디버그 모드

환경변수 `SISYPHUS_DEBUG=true` 설정 시:

- 모든 에이전트 입출력 로깅
- 실행 시간 상세 측정
- trace ID 포함

## yiroom-code-quality.md

---
name: yiroom-code-quality
description: 이룸 프로젝트 코드 품질을 검사하고 개선점을 제시하는 전문가
tools: Read, Grep, Bash
model: opus
---

당신은 이룸 프로젝트의 코드 품질 관리자입니다.

## 검사 기준

### TypeScript

- strict mode 활성화 확인
- any 타입 사용 금지
- 명시적 타입 선언

### Next.js 16

- App Router 패턴 준수
- Server/Client 컴포넌트 구분
- 메타데이터 최적화

### 코딩 컨벤션

- 네이밍: PascalCase, camelCase, kebab-case
- 주석: 한국어 사용
- Guard clause 패턴

### 성능

- 번들 사이즈 체크
- 이미지 최적화
- 레이지 로딩

## 자동 실행 명령

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

## 보고서 형식

```markdown
## 📊 코드 품질 검사 결과

### 🎯 종합 점수: X/100

### 발견된 이슈

#### 🔴 Critical (즉시 수정)

- [ ] 이슈 설명 및 위치

#### 🟡 Major (우선 수정)

- [ ] 이슈 설명 및 위치

#### 🔵 Minor (개선 권장)

- [ ] 이슈 설명 및 위치

### 개선 제안

1. [구체적 개선 방법]
2. [리팩토링 제안]

### 긍정적인 부분

- [잘 작성된 코드 예시]
```

## yiroom-spec-reviewer.md

---
name: yiroom-spec-reviewer
description: 이룸 프로젝트 스펙 문서를 검토하고 논리적 허점을 찾는 전문가
tools: Read, Grep, Glob
model: opus
---

당신은 이룸 프로젝트의 수석 스펙 검토관입니다.

## 주요 역할

1. Feature, Task, Development 문서 간 일관성 검증
2. 논리적 허점 및 모순 발견
3. 엣지케이스 식별
4. 구현 가능성 평가
5. 성능 영향도 분석

## 검토 체크리스트

### 요구사항 명확성

- [ ] 모든 기능이 구체적으로 정의되었는가?
- [ ] 입력/출력이 명확한가?
- [ ] 성공/실패 조건이 정의되었는가?

### 기술적 타당성

- [ ] Next.js 16 App Router와 호환되는가?
- [ ] TypeScript 타입 안정성이 보장되는가?
- [ ] Supabase 스키마와 일치하는가?

### 사용자 경험

- [ ] 10-30대 여성 타겟에 적합한가?
- [ ] 모바일 우선 설계인가?
- [ ] 브랜드 톤앤매너와 일치하는가?

### 보안 및 성능

- [ ] 개인정보 보호가 고려되었는가?
- [ ] 성능 병목이 예상되는가?
- [ ] 확장성이 고려되었는가?

## 결과 보고 형식

```markdown
## 🔍 스펙 검토 결과

### ✅ 잘된 점

- [구체적인 장점들]

### ⚠️ 개선 필요

- [우선순위 높은 이슈]
- [중간 우선순위 이슈]

### 🚨 Critical 이슈

- [즉시 수정 필요한 문제]

### 💡 제안사항

- [개선 아이디어]

### 📊 구현 복잡도

- 예상 개발 시간: X일
- 난이도: 상/중/하
- 리스크: 높음/보통/낮음
```

## yiroom-test-writer.md

---
name: yiroom-test-writer
description: 이룸 프로젝트의 테스트 코드를 작성하는 전문가
tools: Read, Write, Edit, Bash
model: opus
---

당신은 이룸 프로젝트의 테스트 엔지니어입니다.

## 테스트 작성 원칙

1. **커버리지 목표: 70% 이상**
2. **한국어로 테스트 설명 작성**
3. **유닛 테스트 우선**
4. **엣지케이스 포함**
5. **모킹 최소화**

## 테스트 구조

```typescript
describe('[기능명]', () => {
  describe('정상 케이스', () => {
    it('기대하는 동작을 설명', () => {
      // Given: 준비
      // When: 실행
      // Then: 검증
    });
  });

  describe('에러 케이스', () => {
    it('에러 상황과 처리를 설명', () => {
      // 에러 시나리오
    });
  });

  describe('엣지 케이스', () => {
    it('특수한 상황 처리를 설명', () => {
      // 경계값, 특수 입력 등
    });
  });
});
```

## 우선순위

1. 비즈니스 로직 (퍼스널컬러, 피부분석, 체형분석)
2. 사용자 인증 (Clerk 통합)
3. 데이터 처리 (Supabase 연동)
4. UI 컴포넌트 (중요 컴포넌트)
5. 유틸리티 함수

## 테스트 실행

```bash
npm test
npm run test:coverage
npm run test:watch
```

## yiroom-ui-validator.md

---
name: yiroom-ui-validator
description: 이룸 브랜드 가이드라인과 UX 기준을 검증하는 전문가
tools: Read, Grep
model: opus
---

당신은 이룸 프로젝트의 UI/UX 검증 전문가입니다.

## 브랜드 체크리스트

### 톤앤매너

- [ ] 따뜻한 전문가 느낌
- [ ] 친구 같은 조언자 톤
- [ ] 존댓말 사용
- [ ] 긍정적 표현
- [ ] 신조어 사용 금지 (GMG, HMH, 홀리몰리 등 X)

### 타겟 사용자 적합성

- [ ] 10-30대 여성 취향 반영
- [ ] 트렌디한 디자인
- [ ] 직관적인 네비게이션
- [ ] 모바일 최적화

### 컬러 & 디자인

- [ ] 브랜드 컬러 일관성
- [ ] 충분한 컨트라스트
- [ ] 일관된 spacing
- [ ] 통일된 border-radius

## 접근성 체크

### 시멘틱 HTML

- [ ] 적절한 heading 구조
- [ ] landmark 역할 사용
- [ ] 의미있는 태그 사용

### 상호작용

- [ ] 키보드 네비게이션
- [ ] 포커스 표시
- [ ] 터치 타겟 크기 (최소 44x44)

### ARIA

- [ ] 필수 ARIA 레이블
- [ ] 스크린리더 호환
- [ ] 상태 변경 알림

## 성능 체크

- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 폰트 최적화
- [ ] CSS 번들 크기
- [ ] 불필요한 re-render 방지

## 보고서 형식

```markdown
## 🎨 UI/UX 검증 결과

### 브랜드 일치도: X/10

- 톤앤매너: ⭐⭐⭐⭐⭐
- 타겟 적합성: ⭐⭐⭐⭐
- 시각적 일관성: ⭐⭐⭐⭐⭐

### 접근성 점수: X/100

- [ ] 개선 필요 항목

### 성능 지표

- LCP: X초
- CLS: X
- FID: Xms

### 우선 개선사항

1. [가장 중요한 이슈]
2. [두 번째 중요 이슈]

### 칭찬할 점

- [잘된 UI 요소]
```

---

# .claude/commands/

## create-feature.md

# /create-feature 명령어

새 기능을 SDD 프로세스에 따라 생성합니다.

## 실행 내용

$ARGUMENTS 기능에 대해:

1. **Feature Spec 생성**
   - @specs/templates/FEATURE-SPEC-TEMPLATE.md 참조
   - specs/features/$ARGUMENTS-feature.md 생성

2. **Task 분해**
   - Feature를 구현 가능한 Task로 분해
   - specs/tasks/$ARGUMENTS-tasks.md 생성

3. **폴더 구조 생성**
   - app/(main)/[경로]/ 폴더 생성
   - 필요한 page.tsx, layout.tsx 스캐폴딩

4. **SCRATCHPAD.md 업데이트**
   - 새 기능 To-Do 항목 추가
   - 체크박스 형태로 작성

5. **확인 요청**
   - 생성된 스펙 요약 제시
   - 진행 승인 요청

## 사용 예시
```
/create-feature PC-1
/create-feature S-1-skin-analysis
/create-feature C-1-body-shape
```

## deploy-check.md

# /deploy-check 명령어

배포 전 필수 체크리스트를 실행합니다.

## 실행 내용

### 1. 빌드 검증
```bash
npm run build
```
- 빌드 성공 여부
- 에러/경고 확인

### 2. 타입 체크
```bash
npm run typecheck
```
- TypeScript 에러 0개 확인

### 3. 린트 체크
```bash
npm run lint
```
- ESLint 에러 0개 확인

### 4. 테스트 실행
```bash
npm run test
```
- 모든 테스트 통과 확인
- 커버리지 70% 이상

### 5. 환경 변수 확인
- .env.local 필수 값 존재
- 프로덕션 환경 변수 설정

### 6. DB 마이그레이션
- 미적용 마이그레이션 확인
- RLS 정책 활성화

### 7. 성능 체크
- Lighthouse 점수 (90+ 목표)
- 번들 사이즈 (< 200KB)

## 출력 형식
```markdown
## 🚀 배포 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| 빌드 | ✅/❌ | |
| 타입체크 | ✅/❌ | |
| 린트 | ✅/❌ | |
| 테스트 | ✅/❌ | 커버리지 X% |
| 환경변수 | ✅/❌ | |
| DB 마이그레이션 | ✅/❌ | |
| 성능 | ✅/❌ | Lighthouse X |

### 배포 가능 여부: ✅ 가능 / ❌ 불가

### 필요 조치 (있을 경우)
- [조치 사항]
```

## 사용 예시
```
/deploy-check
/deploy-check --skip-tests
/deploy-check --verbose
```

## qcheck.md

# /qcheck 명령어

변경사항에 대한 빠른 품질 검사를 수행합니다.

## 대상
$ARGUMENTS (미지정 시 최근 변경사항 전체)

## 실행 내용

지정된 대상에 대해 SKEPTICAL senior engineer 관점으로:

### 1. 함수 체크리스트
변경/추가된 각 함수에 대해:
- [ ] 단일 책임 원칙 (하나의 기능만)
- [ ] 명확한 함수명
- [ ] 적절한 에러 처리
- [ ] 한국어 주석 존재
- [ ] 타입 정의 완전성

### 2. 테스트 체크리스트
변경/추가된 각 테스트에 대해:
- [ ] 정상 케이스 테스트
- [ ] 엣지 케이스 테스트
- [ ] 에러 케이스 테스트
- [ ] 테스트 설명 명확

### 3. UI 체크리스트 (해당 시)
- [ ] 신조어/슬랭 없음
- [ ] 자연스러운 한국어
- [ ] 접근성 고려
- [ ] 로딩/에러 상태 처리

## 출력 형식
```markdown
## 🔍 품질 검사 결과

### 함수 검사 (X개)
| 함수명 | SRP | 이름 | 에러처리 | 주석 | 타입 |
|--------|-----|------|----------|------|------|
| func1  | ✅  | ✅   | ⚠️       | ✅   | ✅   |

### 테스트 검사 (X개)
| 테스트 | 정상 | 엣지 | 에러 | 설명 |
|--------|------|------|------|------|
| test1  | ✅   | ⚠️   | ❌   | ✅   |

### 개선 필요 사항
1. [구체적 개선 사항]

### 종합 점수: X/10
```

## 사용 예시
```
/qcheck
/qcheck --functions-only
/qcheck --verbose
```

## qcode.md

# /qcode 명령어

계획된 작업을 빠르게 구현합니다.

## 실행 내용

승인된 계획에 대해:

1. **구현**
   - 계획대로 코드 작성
   - 기존 패턴 따르기

2. **자동 검증**
   ```bash
   npm run typecheck
   npm run lint
   npm run test -- --related
   npx prettier --write [변경 파일]
   ```

3. **결과 보고**
   ```markdown
   ## ✅ 구현 완료

   ### 변경된 파일
   - [파일 목록]

   ### 검증 결과
   - 타입체크: ✅/❌
   - 린트: ✅/❌
   - 테스트: ✅/❌
   - 포맷팅: ✅

   ### 다음 단계
   - [ ] 수동 테스트
   - [ ] /qcheck 실행
   - [ ] 커밋
   ```

## 자동 재시도
- 테스트 실패 시 최대 3회 자동 수정 시도
- 각 시도 후 재검증

## 사용 예시
```
/qcode
/qcode --auto-commit
/qcode --skip-tests
```

## qplan.md

# /qplan 명령어

빠른 계획 분석 및 검토를 수행합니다.

## 실행 내용

$ARGUMENTS에 대해:

1. **코드베이스 분석**
   - 유사한 기존 구현 찾기
   - 재사용 가능한 코드 확인

2. **일관성 검증**
   - 기존 패턴과 일치하는지
   - 프로젝트 컨벤션 준수 여부

3. **최소 변경 원칙**
   - 최소한의 수정으로 구현 가능한 방법
   - 영향 범위 최소화

4. **계획 출력**
   ```markdown
   ## 📋 구현 계획

   ### 재사용 가능 코드
   - [기존 코드 참조]

   ### 변경 파일
   - [파일 목록]

   ### 예상 작업량
   - 소요 시간: ~X분
   - 복잡도: 낮음/중간/높음

   ### 진행하시겠습니까? (Y/N)
   ```

## 사용 예시
```
/qplan 로그인 버튼 추가
/qplan PC-1 결과 페이지 구현
/qplan 이미지 업로드 기능
```

## review.md

# /review 명령어

지정된 대상에 대한 종합 코드 리뷰를 수행합니다.

## 대상
$ARGUMENTS (미지정 시 최근 변경사항 전체)

## 실행 내용

1. **코드 컨벤션 검사**
   - TypeScript strict mode 준수
   - ES Modules 사용 여부
   - 한국어 주석 존재 확인
   - 네이밍 규칙 (PascalCase/camelCase)

2. **에러 핸들링 검사**
   - try-catch 적절한 사용
   - 사용자 친화적 에러 메시지
   - 로딩 상태 처리

3. **접근성 검사**
   - aria-label 존재
   - 키보드 네비게이션
   - 색상 대비

4. **테스트 커버리지**
   - 새 기능 테스트 존재 확인
   - 엣지 케이스 처리

5. **보안 검사**
   - RLS 정책 적용 확인
   - 민감 데이터 노출 여부
   - SQL 인젝션 방지

6. **성능 검사**
   - 불필요한 리렌더링
   - 이미지 최적화
   - 번들 사이즈 영향

## 출력 형식
```markdown
## 🔍 코드 리뷰 결과

### ✅ 통과 항목
- [항목 목록]

### ⚠️ 개선 권장
- [개선 사항 및 제안]

### ❌ 수정 필요
- [필수 수정 사항]

### 📊 요약
- 전체 점수: X/10
- 배포 가능: Yes/No
```

## 사용 예시
```
/review
/review app/analysis/
/review components/ui/
```

## sisyphus.md

# /sisyphus 명령어

어댑티브 시지푸스 오케스트레이터를 실행합니다.

## 사용법

```
/sisyphus $ARGUMENTS
/sisyphus --analyze $ARGUMENTS  # 복잡도 분석만
/sisyphus --debug $ARGUMENTS    # 디버그 모드
```

$ARGUMENTS에 작업 설명을 입력합니다.

## 실행 단계

### 1. 복잡도 분석

작업을 분석하여 적절한 실행 전략을 결정합니다.

```
[복잡도 분석 결과]
├─ 영향 파일: 3개
├─ 변경 유형: 새 컴포넌트 추가
├─ 의존성: 1단계
├─ 리스크: 없음
├─ 총점: 45점
└─ 트랙: Light (single 전략)
```

### 2. 에이전트 실행

전략에 따라 적절한 에이전트를 실행합니다.

- **direct**: 오케스트레이션 없이 직접 실행
- **single**: 단일 에이전트 (code-quality)
- **standard**: 병렬 에이전트 (spec + code + test)
- **full**: 전체 파이프라인

### 3. 결과 통합

모든 에이전트 결과를 통합하여 보고합니다.

## 예시

### 단순 작업

```
/sisyphus Button 컴포넌트에 disabled 스타일 추가

→ 복잡도: 25점 (direct)
→ 오케스트레이션 없이 직접 실행
```

### 중간 복잡도

```
/sisyphus UserProfile 페이지 리팩토링

→ 복잡도: 55점 (standard)
→ spec-reviewer + code-quality + test-writer 병렬 실행
```

### 높은 복잡도

```
/sisyphus 인증 시스템 JWT에서 Session으로 마이그레이션

→ 복잡도: 85점 (full)
→ 전체 에이전트 파이프라인 + Opus 판단
```

## 실패 처리

Opus 4.5 전용으로 운영되며, 실패 시 수동 개입을 요청합니다.

**모델**: Opus 4.5 전용 (품질 일관성 보장)

## standup.md

# /standup 명령어

일일 개발 현황을 요약하고 다음 작업을 계획합니다.

## 실행 내용

### 1. 어제 완료 확인
- COMPLETED.md 최근 항목 확인
- git log --since="yesterday" 분석

### 2. 오늘 할 일 파악
- SCRATCHPAD.md 미완료 항목 확인
- 우선순위 정렬

### 3. 블로커 식별
- 막혀있는 작업 확인
- 외부 의존성 체크

### 4. 진행률 계산
- Phase 1 전체 진행률
- 현재 주차 목표 대비

## 출력 형식
```markdown
## 📊 Daily Standup - [날짜]

### ✅ 어제 완료
- [완료된 작업 목록]

### 📋 오늘 할 일
1. [ ] [최우선 작업]
2. [ ] [두 번째 작업]
3. [ ] [세 번째 작업]

### 🚧 블로커
- [있다면 블로커 항목]

### 📈 진행률
- Phase 1: X% (목표: Week Y 완료)
- 현재 모듈: [PC-1/S-1/C-1]
- 예상 완료: [날짜]

### 💡 오늘의 포커스
"[오늘 가장 중요한 한 가지]"
```

## 사용 예시
```
/standup
/standup --verbose
/standup --update-scratchpad
```

## test.md

# /test 명령어

테스트 실행 및 결과 분석을 수행합니다.

## 실행 내용

1. **테스트 실행**
   ```bash
   npm run test -- $ARGUMENTS
   ```

2. **실패 시 자동 분석**
   - 실패 원인 파악
   - 관련 코드 확인
   - 수정 방안 제시

3. **수정 제안** (선택적)
   - 3회까지 자동 수정 시도
   - 각 시도 후 재테스트

4. **커버리지 리포트**
   - 현재 커버리지 확인
   - 미커버 영역 표시
   - 목표 (70%) 달성 여부

## 출력 형식
```markdown
## 🧪 테스트 결과

### 실행 요약
- 총 테스트: X개
- 통과: X개 ✅
- 실패: X개 ❌
- 스킵: X개 ⏭️

### 실패 테스트 분석
[실패한 테스트별 원인 및 수정 방안]

### 커버리지
- 현재: X%
- 목표: 70%
- 상태: 달성/미달성
```

## 사용 예시
```
/test                    # 전체 테스트
/test auth               # 인증 관련 테스트
/test --coverage         # 커버리지 포함
/test components/        # 특정 폴더
```

---

# .claude/rules/

## agent-roadmap.md

# 에이전트 로드맵

> 전문 에이전트 현황 및 향후 도입 기준

## 현재 에이전트 (v2.8)

| 에이전트                | 역할                   | 병렬 그룹 |
| ----------------------- | ---------------------- | --------- |
| yiroom-spec-reviewer    | 스펙 검토, 논리적 허점 | A         |
| yiroom-ui-validator     | 브랜드/UX 가이드라인   | A         |
| yiroom-code-quality     | 코드 품질, 린트        | B         |
| yiroom-test-writer      | 테스트 작성, 커버리지  | B         |
| korean-ux-writer        | 한국어 UX 라이팅       | C         |
| korean-beauty-validator | K-뷰티 트렌드 검증     | C         |
| sisyphus-adaptive       | 오케스트레이터         | -         |

## 향후 도입 검토 에이전트

### security-auditor

**역할**: 보안 취약점 검사, OWASP Top 10 점검

**도입 검토 시점**:

- 결제 시스템 도입 시
- 민감한 건강 데이터 저장 시 (의료 정보 등)
- 외부 API 연동 확대 시 (3개 이상)
- OAuth/소셜 로그인 추가 시

### performance-optimizer

**역할**: 성능 병목 분석, 최적화 제안

**도입 검토 시점**:

- MAU 1만+ 도달 시
- AI 분석 응답 3초+ 초과 시
- 대시보드/피드 로딩 느려질 때
- Lighthouse 점수 70 미만 시
- 이미지/번들 최적화 필요 시

### db-migration-reviewer

**역할**: 스키마 변경 검토, 데이터 무결성 검증

**도입 검토 시점**:

- 대규모 스키마 변경 시 (5개+ 테이블)
- 기존 데이터 변환/마이그레이션 필요 시
- 멀티 테넌트 구조 도입 시
- 데이터베이스 분리/샤딩 검토 시

## 도입 결정 체크리스트

새 에이전트 도입 전 확인:

1. **필요성**: 해당 역할이 반복적으로 필요한가?
2. **복잡도**: 기존 에이전트로 커버 불가능한가?
3. **ROI**: 에이전트 유지보수 비용 < 수동 검토 비용인가?
4. **통합**: sisyphus 파이프라인에 어떻게 통합할 것인가?

## 변경 이력

| 버전 | 날짜       | 변경 내용              |
| ---- | ---------- | ---------------------- |
| 1.0  | 2026-01-08 | 초기 버전, 로드맵 작성 |

## ai-code-review.md

# AI 코드 리뷰 규칙

> Vibe Coding 리스크 방지 및 AI 생성 코드 품질 관리

## 배경

2026년 기준 AI 생성 코드의 45%에 보안 결함이 있으며, 40% 이상의 주니어 개발자가 이해하지 못한 AI 코드를 배포합니다. 이 규칙은 AI 도구 활용의 이점을 유지하면서 리스크를 최소화합니다.

## 필수 리뷰 체크리스트

### 1. 보안 검토 (OWASP Top 10)

AI가 생성한 코드에서 반드시 확인:

- [ ] **SQL Injection**: Supabase 쿼리에서 직접 문자열 연결 없음
- [ ] **XSS**: 사용자 입력을 `dangerouslySetInnerHTML` 없이 렌더링
- [ ] **인증 우회**: `auth.protect()` 호출 여부 확인
- [ ] **민감 데이터 노출**: `.env` 변수가 `NEXT_PUBLIC_`이 아닌지 확인
- [ ] **Rate Limiting**: 외부 API 호출에 제한 있는지 확인

### 2. 아키텍처 일관성

```
질문: 이 코드가 기존 패턴을 따르는가?

체크:
- [ ] Repository 패턴 사용 (lib/api/, lib/products/)
- [ ] Supabase 클라이언트 올바른 함수 사용
- [ ] 컴포넌트 위치가 기존 구조와 일치
- [ ] 타입 정의가 types/ 또는 해당 파일에 존재
```

### 3. 테스트 커버리지

AI 생성 코드에는 **반드시** 테스트 동반:

```typescript
// 좋은 예: AI가 새 함수 생성 시 테스트도 함께
// lib/utils/newFunction.ts
export function newFunction() { ... }

// tests/lib/utils/newFunction.test.ts
describe('newFunction', () => {
  it('should ...', () => { ... });
});
```

### 4. 에러 핸들링

AI 코드에서 누락되기 쉬운 부분:

```typescript
// 나쁜 예: 에러 핸들링 없음
const data = await supabase.from('users').select('*');

// 좋은 예: 에러 체크 포함
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('[Module] Error:', error);
  throw new Error('사용자 정보를 불러올 수 없습니다.');
}
```

## AI 생성 코드 식별

### 자동 태그

Claude Code가 생성한 코드는 커밋 메시지에 자동 포함:

```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 수동 태그 (선택)

복잡한 AI 생성 로직에 주석 추가:

```typescript
// AI-GENERATED: 이 로직은 Claude가 생성함 - 리뷰 필요
function complexAlgorithm() { ... }
```

## 금지 패턴

### 1. 블라인드 AI 코드 수락

```
❌ 금지: AI 출력을 검토 없이 그대로 커밋
✅ 필수: 모든 AI 출력은 이해하고 검증 후 커밋
```

### 2. 테스트 없는 AI 코드

```
❌ 금지: AI가 생성한 유틸리티/훅을 테스트 없이 배포
✅ 필수: 모든 새 함수에 최소 1개 테스트 케이스
```

### 3. 보안 우회

```
❌ 금지: AI가 제안한 빠른 해결책이 보안 검사를 우회
✅ 필수: 보안 관련 코드는 반드시 기존 패턴 따르기
```

## 리뷰 프로세스

### 단순 변경 (1-3 파일)

1. 코드 직접 검토
2. typecheck + lint 통과 확인
3. 관련 테스트 실행

### 복잡한 변경 (4+ 파일)

1. `/sisyphus` 명령으로 전문 에이전트 리뷰
2. 보안 체크리스트 수동 확인
3. 전체 테스트 스위트 실행
4. 필요시 동료 리뷰 요청

## 참고 자료

- [Google Cloud: Vibe Coding 가이드](https://cloud.google.com/discover/what-is-vibe-coding)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

**Version**: 1.0 | **Updated**: 2026-01-13

## ai-integration.md

# AI 통합 규칙

> Gemini AI 사용 패턴 및 Fallback 전략

## 모델 선택

### 기본 모델: Gemini 3 Flash

```typescript
// lib/gemini.ts
model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
```

### 사용처

| 모듈 | 용도             |
| ---- | ---------------- |
| PC-1 | 퍼스널 컬러 분석 |
| S-1  | 피부 분석        |
| C-1  | 체형 분석        |
| N-1  | 음식 인식        |
| RAG  | 제품 Q&A         |

## Fallback 전략

### 필수 패턴

모든 AI 호출은 Mock Fallback 필수:

```typescript
try {
  const result = await analyzeWithGemini(input);
  return result;
} catch (error) {
  console.error('[Module] Gemini error, falling back to mock:', error);
  return generateMockResult(input);
}
```

### Mock 파일 위치

```
lib/mock/
├── workout-analysis.ts   # W-1 Mock
├── skin-analysis.ts      # S-1 Mock
├── body-analysis.ts      # C-1 Mock
└── food-analysis.ts      # N-1 Mock
```

## 타임아웃 설정

```typescript
// 권장: 3초 타임아웃 + 2회 재시도
const TIMEOUT_MS = 3000;
const MAX_RETRIES = 2;
```

## 프롬프트 규칙

> **상세 가이드**: 프롬프트 작성 시 [`prompt-engineering.md`](./prompt-engineering.md) 참조
> (Step-by-Step 분석, 할루시네이션 방지, Few-shot 예시 등)

### 언어 (이룸 표준)

```
프롬프트 본문: 한국어 (도메인 전문성 + 한국 사용자 맥락)
JSON 필드명: 영어 (camelCase)
응답 텍스트: 한국어
```

**예외**: RAG 제품 Q&A는 영어 (제품 데이터 혼재)

### 구조 (이모지 + 평문)

```typescript
const prompt = `
당신은 ${role} 전문가입니다.

⚠️ 분석 전 확인:
${conditions}

📊 분석 기준:
${criteria}

다음 JSON 형식으로만 응답해주세요:
${schema}
`;
```

### 예시 (피부 분석)

```typescript
const prompt = `
당신은 전문 피부과학 기반 AI 분석가입니다.

📊 분석 기준:
- 사용자 연령: ${age}
- 피부 타입: ${skinType}
- 관심사: ${concerns.join(', ')}

다음 JSON 형식으로만 응답해주세요:
{
  "overallScore": [0-100 사이 점수],
  "concerns": ["문제1", "문제2"],
  "recommendations": ["추천1", "추천2"]
}
`;
```

## 비용 최적화

### 컨텍스트 캐싱

동일 프롬프트 반복 시 캐싱 활용:

```typescript
// Gemini 3 Flash는 컨텍스트 캐싱으로 90% 비용 절감 가능
const cachedModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
  cachedContent: cachedContext,
});
```

### 토큰 절약

- 불필요한 context 제거
- 간결한 프롬프트 작성
- JSON 응답 시 필요한 필드만 요청

## 환경변수

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# 모델 오버라이드 (선택)
GEMINI_MODEL=gemini-3-flash-preview

# Mock 강제 사용 (개발/테스트)
FORCE_MOCK_AI=true
```

## 에러 로깅

```typescript
// 모듈 식별자 포함 필수
console.error('[S-1] Gemini error:', error);
console.error('[W-1] API timeout, using mock');
console.log('[N-1] Analysis completed');
```

## coding-standards.md

# 이룸 코딩 표준

> Claude Code가 코드 작성 시 참조하는 규칙

## 핵심 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

## 코드 스타일

### 모듈 시스템

- ES Modules 전용 (CommonJS 금지)
- `import/export` 사용

### 네이밍 규칙

| 대상            | 규칙             | 예시                      |
| --------------- | ---------------- | ------------------------- |
| 컴포넌트        | PascalCase       | `UserProfile.tsx`         |
| 함수/변수       | camelCase        | `getUserById`             |
| 상수            | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`         |
| 타입/인터페이스 | PascalCase       | `UserData`, `ApiResponse` |

### 파일 구조

- 파일당 하나의 `export default`
- 관련 타입은 같은 파일 또는 `types/` 디렉토리
- 테스트는 `tests/` 디렉토리, `*.test.ts(x)` 패턴

### 주석

- 한국어 주석 필수 (복잡한 로직 위에 "왜" 설명)
- JSDoc은 공개 API에만 사용

```typescript
// 좋은 예: "왜"를 설명
// 3회 실패 시 fallback - 네트워크 불안정 대응
const MAX_RETRY = 3;

// 나쁜 예: "무엇"만 설명
// 최대 재시도 횟수
const MAX_RETRY = 3;
```

## React/Next.js 규칙

### 컴포넌트

- 함수형 컴포넌트 + Hooks 사용
- `'use client'` 지시어는 필요한 경우에만
- 최상위 컨테이너에 `data-testid` 속성 필수

```tsx
// 좋은 예
export default function UserCard({ user }: UserCardProps) {
  return <div data-testid="user-card">{/* ... */}</div>;
}
```

### 상태 관리

- 로컬 상태: `useState`, `useReducer`
- 다단계 폼: Zustand (`lib/stores/`)
- 서버 상태: React Query 또는 직접 fetch

### 커스텀 훅 사용 (hooks/)

새 기능 구현 시 기존 훅 우선 활용:

| 훅                  | 용도                         | 사용 예시          |
| ------------------- | ---------------------------- | ------------------ |
| `useUserMatching`   | 사용자 프로필 기반 제품 매칭 | 뷰티/스타일 페이지 |
| `useBeautyProducts` | 화장품 목록 조회 + 매칭률    | 카테고리 페이지    |
| `useDebounce`       | 입력 디바운싱 (300ms)        | 검색 페이지        |
| `useInfiniteScroll` | 무한 스크롤                  | 제품 목록 페이지   |

```typescript
// 좋은 예: 기존 훅 활용
const { hasAnalysis, calculateProductMatch } = useUserMatching();
const matchRate = hasAnalysis ? calculateProductMatch(product) : 75;

// 나쁜 예: 직접 분석 데이터 조회 (중복 코드)
const { data } = await supabase.from('skin_analyses').select('*')...
```

**훅 적용 기준**:

- 제품 매칭률 필요 → `useUserMatching`
- 검색/필터 입력 → `useDebounce`
- 20개 이상 목록 → `useInfiniteScroll`

### Dynamic Import

무거운 컴포넌트는 `next/dynamic`으로 지연 로딩:

```typescript
// default export
export const ChartDynamic = dynamic(() => import('./Chart'), { ssr: false, loading: () => null });

// named export
export const FiltersDynamic = dynamic(
  () => import('./Filters').then((mod) => ({ default: mod.Filters })),
  { ssr: false, loading: () => null }
);
```

## Supabase 규칙

### 클라이언트 선택

| 컨텍스트             | 함수                          | 파일              |
| -------------------- | ----------------------------- | ----------------- |
| Client Component     | `useClerkSupabaseClient()`    | `clerk-client.ts` |
| Server Component/API | `createClerkSupabaseClient()` | `server.ts`       |
| 관리자 (RLS 우회)    | `createServiceRoleClient()`   | `service-role.ts` |

### RLS 정책

- 모든 테이블에 `clerk_user_id` 기반 RLS 필수
- `auth.jwt() ->> 'sub'`로 사용자 확인

## 테스트 규칙

### 필수 사항

- 모든 변경 후 `npm run test` 통과
- 새 함수 추가 시 테스트 동반 작성
- 커버리지 유지 (현재 2,686개 테스트)

### 테스트 구조

```
tests/
├── components/     # 컴포넌트 테스트
├── lib/            # 유틸리티 테스트
├── api/            # API 라우트 테스트
├── pages/          # 페이지 테스트
└── integration/    # 통합 테스트
```

## Git 커밋 규칙

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 타입

| 타입     | 설명             |
| -------- | ---------------- |
| feat     | 새 기능          |
| fix      | 버그 수정        |
| docs     | 문서 변경        |
| chore    | 빌드/설정 변경   |
| refactor | 리팩토링         |
| test     | 테스트 추가/수정 |

### 스코프 예시

- `workout`, `nutrition`, `products`, `dashboard`
- `db`, `auth`, `ui`, `a11y`

## 금지 사항

1. **보안**
   - `.env` 파일 커밋 금지
   - 하드코딩된 API 키 금지
   - `--no-verify` 플래그 사용 금지

2. **코드 품질**
   - `any` 타입 사용 최소화
   - `console.log` 프로덕션 코드에 남기기 금지
   - 미사용 import/변수 금지

3. **UI**
   - 사용자 요청 없이 이모지 추가 금지
   - README/문서 무단 생성 금지
   - 과도한 주석 금지

## 접근성 (a11y)

- Dialog에 `DialogDescription` 필수 (VisuallyHidden 사용 가능)
- 이미지에 `alt` 속성 필수
- 버튼/링크에 명확한 라벨

```tsx
// 좋은 예
<DialogHeader>
  <DialogTitle>제목</DialogTitle>
  <VisuallyHidden asChild>
    <DialogDescription>설명</DialogDescription>
  </VisuallyHidden>
</DialogHeader>
```

## db-api-sync.md

# DB-API 동기화 규칙

> API 코드와 데이터베이스 스키마 간 불일치 방지 규칙

## 배경

2026-01-13: PC-1 API가 존재하지 않는 컬럼(`left_image_url`, `right_image_url`, `images_count`, `analysis_reliability`)에 insert 시도하여 500 에러 발생. 코드는 다각도 분석을 지원하도록 업데이트되었지만, 마이그레이션이 누락됨.

## 필수 체크리스트

### API에서 Supabase Insert/Update 시

**변경 전:**

```typescript
// ❌ 새 컬럼 추가 시 마이그레이션 확인 안 함
const { data, error } = await supabase.from('personal_color_assessments').insert({
  clerk_user_id: userId,
  left_image_url: leftImageUrl, // 새 컬럼
  images_count: imagesCount, // 새 컬럼
});
```

**변경 후:**

```typescript
// ✅ 새 컬럼 추가 전 마이그레이션 먼저 생성
// 1. supabase/migrations/ 에 ALTER TABLE 작성
// 2. npx supabase db push 또는 로컬에서 적용
// 3. 그 다음 API 코드 수정
```

### 검증 순서

1. **API 코드에서 `.insert()` 또는 `.update()` 발견 시:**

   ```
   → 삽입/수정하는 컬럼 목록 추출
   → supabase/migrations/ 에서 해당 테이블 스키마 확인
   → 컬럼 존재 여부 검증
   ```

2. **새 컬럼이 필요한 경우:**
   ```
   → 먼저 마이그레이션 SQL 작성
   → API 코드 수정은 그 다음
   ```

## 컬럼 존재 확인 방법

```bash
# 마이그레이션 파일에서 테이블 스키마 검색
grep -r "테이블명" supabase/migrations/

# 특정 컬럼 검색
grep -r "컬럼명" supabase/migrations/
```

## 주요 API-테이블 매핑

| API Route                     | 테이블                                     |
| ----------------------------- | ------------------------------------------ |
| `/api/analyze/personal-color` | `personal_color_assessments`               |
| `/api/analyze/skin`           | `skin_analyses`                            |
| `/api/analyze/body`           | `body_analyses`                            |
| `/api/products/*`             | `cosmetic_products`, `supplement_products` |
| `/api/reviews/*`              | `product_reviews`, `review_helpful`        |

## 에러 패턴 인식

다음 에러 발생 시 **스키마 불일치** 의심:

```
Database insert error: { code: '42703', message: 'column "xxx" does not exist' }
Failed to save analysis
500 Internal Server Error on POST /api/analyze/*
```

## 마이그레이션 작성 템플릿

```sql
-- Migration: [기능명]
-- Purpose: [목적 설명]
-- Date: YYYY-MM-DD
-- Issue: [관련 이슈/에러 설명]

ALTER TABLE [테이블명]
  ADD COLUMN IF NOT EXISTS [컬럼명] [타입] [제약조건];

COMMENT ON COLUMN [테이블명].[컬럼명] IS '[설명]';
```

## 예방 조치

1. **PR 리뷰 시**: API의 `.insert()`, `.update()` 변경 시 마이그레이션 동반 확인
2. **코드 작성 시**: 새 필드 추가 전 DB 스키마 먼저 확인
3. **테스트 시**: 로컬 Supabase에서 실제 insert 테스트

---

**Version**: 1.0 | **Updated**: 2026-01-13

## deferred-items-documentation.md

# 제외 항목 문서화 규칙

> 리팩토링/기능 계획에서 제외된 항목의 문서화 가이드

## 목적

의사결정 추적성(Decision Traceability) 확보를 위해, 논의되었으나 제외된 항목들을 체계적으로 기록합니다.

## 문서화 시점

다음 상황에서 제외 항목 문서화 필수:

1. **스펙 문서 작성 시**: 여러 대안 중 하나를 선택한 경우
2. **기술 스택 결정 시**: 특정 기술/라이브러리를 채택하지 않은 경우
3. **에이전트/자동화 검토 시**: 도입하지 않기로 한 도구
4. **기능 범위 결정 시**: MVP에서 제외된 기능

## 문서화 위치

| 항목 유형           | 위치                                                    |
| ------------------- | ------------------------------------------------------- |
| 전체 프로젝트 범위  | `docs/specs/SDD-MASTER-REFACTORING-PLAN.md` Part 14     |
| 특정 모듈 관련      | 해당 SDD 문서 "제외된 항목" 섹션                        |
| 에이전트/워크플로우 | `.claude/rules/agent-roadmap.md`, `workflow-roadmap.md` |

## 필수 기록 항목

제외된 항목마다 다음 정보 기록:

```markdown
| 항목명 | 역할/용도       | 제외 사유       | 재검토 트리거             |
| ------ | --------------- | --------------- | ------------------------- |
| [이름] | [무엇을 하는가] | [왜 제외했는가] | [언제 다시 검토할 것인가] |
```

### 제외 사유 유형 (표준화)

| 코드              | 사유                  | 설명                         |
| ----------------- | --------------------- | ---------------------------- |
| `NOT_NEEDED`      | 현재 필요성 낮음      | MVP/현재 로드맵에 불필요     |
| `LOW_ROI`         | ROI 불충분            | 구현 비용 대비 효과 미미     |
| `PREREQ_MISSING`  | 선행 조건 미충족      | 의존 작업 완료 후 검토 가능  |
| `ALT_SUFFICIENT`  | 대안으로 충분         | 기존 도구/방식으로 해결 가능 |
| `HIGH_COMPLEXITY` | 복잡도 대비 효과 낮음 | 설정/유지보수 비용 > 이점    |

### 재검토 트리거 유형 (표준화)

| 트리거         | 조건                                   |
| -------------- | -------------------------------------- |
| `MAU_10K`      | MAU 1만+ 도달                          |
| `MAU_50K`      | MAU 5만+ 도달                          |
| `TEAM_5`       | 팀 규모 5명+                           |
| `TEAM_10`      | 팀 규모 10명+                          |
| `PAYMENT`      | 결제 시스템 도입                       |
| `PERF_ISSUE`   | 성능 문제 발생 (Lighthouse 70 미만 등) |
| `BUG_FREQ`     | 프로덕션 버그 월 5건+                  |
| `USER_REQUEST` | 사용자 요청 증가                       |

## 자동화 트리거

### 새 SDD 문서 작성 시

문서 말미에 "제외된 항목" 섹션 템플릿 추가:

```markdown
## 제외된 항목

### 대안 기술/접근법

| 항목          | 제외 사유                      | 재검토 트리거              |
| ------------- | ------------------------------ | -------------------------- |
| [예: GraphQL] | `ALT_SUFFICIENT` - REST로 충분 | 복잡한 데이터 관계 증가 시 |

### 범위 외 기능

| 기능              | 제외 사유                   | 재검토 트리거  |
| ----------------- | --------------------------- | -------------- |
| [예: 실시간 협업] | `NOT_NEEDED` - 개인 앱 특성 | `USER_REQUEST` |
```

### 기술 스택 논의 시

논의된 모든 대안을 기록하고, 선택하지 않은 이유 명시:

```markdown
### 기술 선택: [결정 주제]

**선택**: [채택한 기술]
**이유**: [선택 이유]

**제외된 대안**:
| 대안 | 제외 사유 |
|-----|----------|
| [대안 1] | [이유] |
| [대안 2] | [이유] |
```

## 검토 주기

### 분기별 검토 (매 분기 첫 주)

```
☐ SDD-MASTER-REFACTORING-PLAN.md Part 14 검토
☐ 재검토 트리거 조건 충족 여부 확인
☐ 충족 항목은 구현 검토 또는 재연기 결정
```

### 트리거 기반 자동 알림

주요 지표 변경 시 관련 제외 항목 자동 리마인드:

- MAU 도달: performance-optimizer, A/B 테스트
- 팀 확장: PostToolUse 훅, 팀 공유 설정
- 결제 도입: security-auditor

## 예시

### 좋은 문서화

```markdown
| Redis | 세션/캐시 저장소 | `LOW_ROI` - 현재 트래픽 낮음, 인프라 복잡도 증가 | `MAU_10K` 또는 응답 지연 500ms+ |
```

### 나쁜 문서화

```markdown
| Redis | 캐시 | 안 씀 | 나중에 |
```

## 관련 문서

- `docs/specs/SDD-MASTER-REFACTORING-PLAN.md` Part 14
- `.claude/rules/agent-roadmap.md`
- `.claude/rules/workflow-roadmap.md`

---

**Version**: 1.0 | **Updated**: 2026-01-14

## hybrid-data-pattern.md

# Hybrid 데이터 패턴

> DB 핵심 데이터 + 최신 Mock 표시 데이터 조합 전략

## 개요

Hybrid 패턴은 **DB에는 핵심 데이터만 저장**하고, **표시용 데이터는 런타임에 최신 Mock에서 가져오는** 전략입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    transformDbToResult                       │
├─────────────────────────────────────────────────────────────┤
│  DB 데이터 (고정)         │  Mock 데이터 (최신)             │
│  ───────────────          │  ──────────────                 │
│  • seasonType             │  • bestColors                   │
│  • confidence             │  • worstColors                  │
│  • analyzedAt             │  • lipstickRecommendations      │
│  • AI 분석 원본           │  • styleDescription             │
│                           │  • easyInsight                  │
└─────────────────────────────────────────────────────────────┘
```

## 사용 시점

### Hybrid 패턴이 적합한 경우

1. **표시 데이터 개선 시 기존 사용자도 혜택 받아야 할 때**
   - 색상 이름 변경 (위트 → 밀색 베이지)
   - 스타일 가이드 개선
   - 초보자 친화 설명 추가

2. **핵심 분석 결과는 변하지 않지만 표현만 달라질 때**
   - 시즌 타입(spring, summer 등)은 고정
   - 해당 시즌의 추천 컬러/스타일은 개선 가능

3. **재분석 없이 UX 개선을 제공하고 싶을 때**
   - 사용자는 새로고침만 하면 됨
   - API 호출/DB 마이그레이션 불필요

### 직접 DB 저장이 적합한 경우

- AI가 사용자별로 생성한 고유 인사이트
- 측정값 (신체 치수, 피부 점수 등)
- 분석 신뢰도, 이미지 품질 정보

## 구현 예시

### PC-1 결과 페이지

```typescript
// apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx

import {
  BEST_COLORS,
  WORST_COLORS,
  LIPSTICK_RECOMMENDATIONS,
  STYLE_DESCRIPTIONS,
  EASY_INSIGHTS,
} from '@/lib/mock/personal-color';

function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용
  const mockBestColors = BEST_COLORS[seasonType] || [];
  const mockWorstColors = WORST_COLORS[seasonType] || [];
  const mockLipstick = LIPSTICK_RECOMMENDATIONS[seasonType] || [];
  const mockStyle = STYLE_DESCRIPTIONS[seasonType];
  const mockEasyInsight = EASY_INSIGHTS[seasonType]?.[0];

  return {
    // DB에서 가져오는 핵심 데이터
    seasonType,
    confidence: dbData.confidence || 85,
    analyzedAt: new Date(dbData.created_at),

    // Mock에서 가져오는 표시 데이터
    bestColors: mockBestColors,
    worstColors: mockWorstColors,
    lipstickRecommendations: mockLipstick,
    styleDescription: mockStyle,
    easyInsight: mockEasyInsight,
  };
}
```

### Mock 데이터 export

```typescript
// apps/web/lib/mock/personal-color.ts

// Hybrid 데이터용 export (결과 페이지에서 사용)
export const BEST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
export const WORST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
export const LIPSTICK_RECOMMENDATIONS: Record<SeasonType, LipstickRecommendation[]> = { ... };
export const STYLE_DESCRIPTIONS: Record<SeasonType, StyleDescription> = { ... };
export const EASY_INSIGHTS: Record<SeasonType, EasyInsight[]> = { ... };
```

## 타입 설계

### 선택적 필드로 하위 호환성 유지

```typescript
// 기존 필드는 유지, 새 필드는 선택적(optional)으로 추가
export interface StyleDescription {
  // 기존 필드 (필수)
  imageKeywords: string[];
  makeupStyle: string;
  fashionStyle: string;
  accessories: string;

  // 초보자 친화 필드 (선택적, 하위 호환)
  easyMakeup?: EasyMakeupGuide;
  easyFashion?: EasyFashionGuide;
  easyAccessory?: EasyAccessoryGuide;
}

export interface PersonalColorResult {
  // 핵심 필드 (필수)
  seasonType: SeasonType;
  confidence: number;

  // 확장 필드 (선택적)
  easyInsight?: EasyInsight;
}
```

### UI에서 Fallback 처리

```tsx
{
  easyInsight ? (
    <div>
      <p>{easyInsight.summary}</p>
      <p>{easyInsight.easyExplanation}</p>
    </div>
  ) : (
    <p>{insight}</p> // 기존 인사이트로 fallback
  );
}
```

## 적용 가능 모듈

| 모듈 | DB 핵심 데이터         | Mock 표시 데이터                         |
| ---- | ---------------------- | ---------------------------------------- |
| PC-1 | seasonType, confidence | bestColors, worstColors, lipstick, style |
| S-1  | skinType, scores       | recommendations, tips, concerns          |
| C-1  | bodyType, measurements | strengths, styleRecommendations          |
| H-1  | hairType, condition    | careRoutine, productRecommendations      |

## 장점

1. **즉시 반영**: Mock 수정 → 배포 → 모든 사용자에게 적용
2. **DB 마이그레이션 불필요**: 스키마 변경 없이 UX 개선
3. **재분석 불필요**: 사용자 액션 없이 개선 사항 적용
4. **성능**: Mock은 정적 import, 런타임 오버헤드 없음

## 주의사항

1. **Mock export 필수**: 결과 페이지에서 사용할 데이터는 반드시 export
2. **타입 일관성**: Mock과 Result 타입 동기화 유지
3. **Fallback 처리**: 새 필드는 선택적으로, UI에서 null 체크

---

**Version**: 1.0 | **Updated**: 2026-01-08 | **Applies to**: PC-1, S-1, C-1, H-1

## project-structure.md

# 이룸 프로젝트 구조

> 디렉토리 및 파일 배치 규칙

## 모노레포 구조

```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱
│   └── mobile/           # Expo React Native 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
└── turbo.json            # Turborepo 설정
```

## apps/web/ 구조

### app/ (App Router)
```
app/
├── (main)/               # 메인 레이아웃 그룹
│   ├── analysis/         # Phase 1 분석
│   │   ├── personal-color/
│   │   ├── skin/
│   │   └── body/
│   ├── workout/          # W-1 운동
│   ├── nutrition/        # N-1 영양
│   ├── products/         # 제품 추천
│   ├── dashboard/        # 대시보드
│   └── settings/         # 설정
├── api/                  # API 라우트
└── layout.tsx            # 루트 레이아웃
```

### components/
```
components/
├── ui/                   # shadcn/ui 기본 컴포넌트
├── common/               # 공통 컴포넌트
├── workout/              # 운동 모듈 전용
│   ├── common/           # 공통 (ProgressIndicator, SelectionCard)
│   ├── result/           # 결과 화면
│   ├── detail/           # 상세 화면
│   └── onboarding/       # 온보딩
├── nutrition/            # 영양 모듈 전용
├── products/             # 제품 추천
│   ├── detail/           # 상세 페이지
│   ├── reviews/          # 리뷰
│   └── interactions/     # 성분 상호작용
├── reports/              # 리포트
├── analysis/             # 분석 결과
└── checkin/              # 일일 체크인
```

### lib/ (비즈니스 로직)
```
lib/
├── supabase/             # DB 클라이언트 (DIP 적용)
├── api/                  # API 래퍼 (Repository 패턴)
├── stores/               # Zustand 스토어
├── mock/                 # Mock 데이터/Fallback
├── products/             # 제품 Repository
│   ├── repositories/     # 도메인별 CRUD
│   ├── services/         # 비즈니스 서비스
│   └── index.ts          # 통합 export
├── workout/              # 운동 유틸리티
├── nutrition/            # 영양 유틸리티
├── reports/              # 리포트 집계
├── rag/                  # RAG 시스템
└── gemini.ts             # AI 분석
```

### 기타
```
data/                     # JSON 데이터 (운동, 연예인)
hooks/                    # Custom React Hooks
types/                    # 타입 정의
tests/                    # 테스트 파일
public/                   # 정적 파일
supabase/migrations/      # DB 마이그레이션
```

## 파일 생성 규칙

### 새 컴포넌트 추가 시
1. 해당 모듈 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/components/`)
3. 모듈 `index.ts`에 export 추가

```tsx
// components/workout/result/NewCard.tsx
export function NewCard() { ... }

// components/workout/result/index.ts
export * from './NewCard';

// tests/components/workout/result/NewCard.test.tsx
describe('NewCard', () => { ... });
```

### 새 API 라우트 추가 시
1. `app/api/` 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/api/`)
3. 타입은 `types/` 또는 라우트 파일 내 정의

### 새 lib 유틸리티 추가 시
1. 관련 모듈 폴더에 생성
2. 테스트 파일 동반 생성 (`tests/lib/`)
3. 필요시 `index.ts`로 re-export

## 모듈별 색상 변수

```css
/* Tailwind CSS */
--module-workout   /* 운동 모듈 */
--module-nutrition /* 영양 모듈 */
--module-skin      /* 피부 분석 */
--module-body      /* 체형 분석 */
```

## prompt-engineering.md

# 프롬프트 엔지니어링 규칙

> Gemini AI 프롬프트 작성 시 참조하는 베스트 프랙티스
>
> 참조: Anthropic, Google, OpenAI 공식 가이드라인 + 학술 연구 (2025)

## TL;DR (빠른 참조)

| 항목       | 규칙                                             |
| ---------- | ------------------------------------------------ |
| **언어**   | 프롬프트 본문: 한국어, JSON 필드: 영어 camelCase |
| **구조**   | 이모지 섹션 구분 (⚠️📊📋) + 평문 설명            |
| **신뢰도** | 저화질/메이크업 → `analysisReliability: "low"`   |
| **일관성** | 혈관 blue → cool, green → warm (모순 금지)       |
| **출력**   | JSON만 반환, 텍스트 없이                         |

**핵심 체크리스트**:

- [ ] 역할 + 목적 명시했는가?
- [ ] 분석 순서 (Step-by-Step) 포함했는가?
- [ ] 불확실 시 행동 지정했는가?
- [ ] JSON 스키마 전체 제공했는가?

---

## 언어 정책 (이룸 프로젝트 표준)

### 기본 원칙: 한국어 프롬프트

```
프롬프트 본문: 한국어 (도메인 전문성 + 한국 사용자 맥락)
JSON 필드명: 영어 (camelCase)
응답 텍스트: 한국어
```

**근거**:

- Gemini 3 Flash는 다국어 성능 우수 (한국어 벤치마크 90%+)
- 이룸의 도메인 지식(피부타입, 체형 용어)은 한국어 표현이 더 정확
- 프롬프트-응답 언어 일치 시 할루시네이션 감소

**예외**:

- RAG 제품 Q&A: 영어 (제품 데이터가 영어 혼재)

---

## 핵심 원칙

### 1. 직접적이지만 상세하게

Gemini 3는 우회적 표현을 피하되, 도메인 지식은 상세히 제공합니다.

```
// 나쁜 예 (우회적)
"이 이미지를 보시고 가능하다면 피부 상태에 대해 분석해주시면 감사하겠습니다..."

// 좋은 예 (직접적 + 상세)
"당신은 전문 피부과학 기반 AI 분석가입니다. 업로드된 얼굴 이미지를 분석하여 피부 상태를 평가해주세요.

[수분도 hydration]
- 피부 표면의 촉촉함, 각질 상태, 건조 주름 유무
- 건성: 0-40, 중성: 41-70, 지성: 71-100"
```

### 2. 이모지 + 평문 구조 (이룸 표준)

실제 프로젝트에서 사용하는 패턴입니다.

```
당신은 [역할]입니다.

⚠️ 이미지 분석 전 조건 확인:
1. 조명 상태
2. 메이크업 여부
3. 이미지 해상도

📊 과학적 분석 기준:

[지표명 영문ID]
- 평가 기준 1
- 평가 기준 2
- 점수 범위: 0-100

다음 JSON 형식으로만 응답해주세요:
{ ... }
```

### 3. Step-by-Step 분석 요청

복잡한 분석은 "분석 순서"를 명시합니다.

```
📋 분석 순서:
1. 먼저 이미지 품질(조명, 해상도, 메이크업 여부)을 평가하세요.
2. 그 다음 각 피부 지표(수분, 유분, 모공 등)를 개별 분석하세요.
3. 마지막으로 종합 점수와 인사이트를 도출하세요.
```

**효과**: OpenAI 실험에서 4% 정확도 향상

### 4. 할루시네이션 방지

불확실한 경우의 행동을 명시합니다.

```
⚠️ 주의사항 (반드시 준수):
1. 이미지가 흐리면 analysisReliability를 "low"로 설정하세요.
2. 메이크업이 있으면 wrinkles/pores 분석을 'insufficient_data'로 표시하세요.
3. 확신이 없는 지표는 추측하지 말고 낮은 점수 + 낮은 신뢰도를 부여하세요.
```

---

## 할루시네이션 방지: 실전 패턴

### 발견된 할루시네이션 사례

| 현상                         | 원인                    | 해결                                    |
| ---------------------------- | ----------------------- | --------------------------------------- |
| 저화질에 confidence: 95%     | 과도한 자신감           | "이미지가 불명확하면 신뢰도 70% 이하로" |
| 메이크업에서 "잔주름 10개"   | 존재하지 않는 특징 생성 | "메이크업 감지 시 insufficient_data"    |
| veinColor: blue + tone: warm | 모순된 판정             | "혈관이 파란색이면 반드시 tone: cool"   |

### 방지 프롬프트 패턴

```
⚠️ 판정 일관성 규칙:
- veinColor와 tone은 반드시 일치해야 합니다:
  - blue/purple 혈관 → cool (summer/winter)
  - green/olive 혈관 → warm (spring/autumn)
- 조명이 인공광이면 피부톤 판정에 주의하세요 (혈관색 우선)
```

---

## 프롬프트 구조 템플릿

### 이미지 분석용 (S-1, C-1, PC-1)

```
당신은 [전문가 역할]입니다. [분석 목적 한 줄 설명]

⚠️ 이미지 분석 전 조건 확인:
1. [품질 조건 1] → [영향]
2. [품질 조건 2] → [영향]
3. [품질 조건 3] → [영향]

📊 [분석 기준 제목]:

[지표1 영문ID]
- 평가 기준 설명
- 점수 범위: [범위]

[지표2 영문ID]
- 평가 기준 설명
- 점수 범위: [범위]

📋 분석 순서:
1. [1단계]
2. [2단계]
3. [3단계]

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "field1": [타입],
  "field2": [타입]
}

⚠️ 주의사항:
- [제약조건 1]
- [제약조건 2]
- 확신이 없으면 analysisReliability를 "low"로 설정하세요.
```

---

## 모델별 최적화

### Gemini 3 Flash

| 설정         | 권장값       | 이유                     |
| ------------ | ------------ | ------------------------ |
| Temperature  | 1.0 (기본값) | Gemini 3 추론에 최적화됨 |
| "think" 사용 | 피하기       | "분석 순서", "평가" 대체 |
| 출력 형식    | JSON 명시    | 일관된 파싱              |

### 금지 패턴

```
피해야 할 것들:
- "가능하다면...", "혹시..." 같은 우회적 표현
- "think step by step" (대신 "분석 순서:" 사용)
- 중복되는 지시문
- 과도하게 긴 예시 (토큰 비용)
```

### 허용 패턴

```
사용해도 되는 것들:
- 이모지로 섹션 구분 (⚠️📊📋)
- 상세한 도메인 지식 설명
- 점수 범위 및 기준 명시
- JSON 스키마 전체 제공
```

---

## 도메인별 지침

### 피부 분석 (S-1)

**프롬프트 필수 포함 요소**:

- T존/U존 분리 평가
- 조명 조건별 신뢰도 조정 로직
- 메이크업 감지 시 `analysisReliability: "low"`
- 다크서클은 `pigmentation`이 아닌 혈관 관련으로 분류

**현재 프롬프트**: `lib/gemini.ts` 314-412행

### 체형 분석 (C-1)

**프롬프트 필수 포함 요소**:

- 5개 특징 중 4개 이상 일치 시 확정 판정
- 골격 기반 판단 (살이 아닌 뼈대)
- 의류 핏 영향 고려 (오버핏 → 신뢰도 낮춤)
- 신뢰도 기준: 5개 일치=95%, 4개=85%, 3개=75%

**현재 프롬프트**: `lib/gemini.ts` 418-534행

### 퍼스널 컬러 (PC-1)

**프롬프트 필수 포함 요소**:

- 손목 혈관 색상 우선 판정 (최우선 기준)
- 조명 왜곡 보정 설명 (인공광 → 노랗게 보임)
- 웜/쿨 판정 근거 반드시 명시
- 혈관색과 tone 일관성 검증

**현재 프롬프트**: `lib/gemini.ts` 537-688행

---

## 출력 일관성

### JSON 스키마 명시

```
다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "field1": [0-100 사이 점수],
  "field2": "[enum값1|enum값2|enum값3]",
  "nested": {
    "subField": "[설명]"
  }
}
```

### 점수 기준 표준화 (이룸 공통)

```
점수 기준 (0-100):
- 71-100: good (좋음)
- 41-70: normal (보통)
- 0-40: warning (주의)

신뢰도 기준:
- high: 이미지 품질 양호, 분석 조건 충족
- medium: 일부 제한 요소 있음
- low: 저화질/메이크업/부적절한 조명
```

---

## 프롬프트 테스트

### 검증 체크리스트

- [ ] 동일 이미지에 유사한 결과가 나오는가? (±5% 일관성)
- [ ] 저화질 이미지에서 `analysisReliability: "low"` 출력?
- [ ] 메이크업 이미지에서 `makeupDetected: true` 감지?
- [ ] JSON 파싱 오류 없이 출력되는가?
- [ ] 모순된 판정이 없는가? (혈관색-톤 일치 등)

### JSON 파싱 방어

```typescript
// Gemini가 JSON 외에 텍스트를 추가할 경우 대비
function parseJsonResponse<T>(text: string): T {
  // JSON 블록 추출
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');

  return JSON.parse(match[0]);
}
```

---

## 참고 자료

- [Anthropic Claude Best Practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Google Gemini Prompt Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [Chain-of-Thought Prompting Guide](https://www.promptingguide.ai/techniques/cot)
- [Multimodal VLM Prompt Guide](https://www.edge-ai-vision.com/2025/03/vision-language-model-prompt-engineering-guide-for-image-and-video-understanding/)

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                                           |
| ---- | ---------- | ------------------------------------------------------------------- |
| 1.2  | 2026-01-07 | TL;DR 섹션 추가, 변경 이력 추가                                     |
| 1.1  | 2026-01-07 | 한국어 표준 확정, 실전 할루시네이션 사례 추가, 도메인별 지침 상세화 |
| 1.0  | 2026-01-07 | 초기 버전 (웹 리서치 기반)                                          |

---

**Version**: 1.2 | **Updated**: 2026-01-07

## server-debugging.md

# 서버 디버깅 규칙

> Next.js 16 개발 서버 문제 해결 가이드

## 🚀 빠른 해결 (Quick Fix)

서버 접속 문제 발생 시 **가장 먼저** 실행:

```bash
cd apps/web
npm run dev:reset
```

이 명령은 자동으로:

1. 포트 3000 사용 중인 프로세스 종료
2. `.next` 캐시 폴더 삭제
3. 개발 서버 새로 시작

**또는** 사전 검사만 실행:

```bash
npm run preflight
```

---

## 일반적인 서버 접속 문제

### 1. 포트 충돌 (Port Conflict)

**증상**: `Port 3000 is in use by process XXXX`

**해결 순서**:

```bash
# 1. 프로세스 확인
netstat -ano | findstr ":3000"

# 2. 프로세스 종료 (Windows)
taskkill /F /PID <PID>

# 3. 전체 Node 프로세스 종료 (최후 수단)
taskkill /F /IM node.exe
```

### 2. Lock 파일 문제

**증상**: `Unable to acquire lock at .next/dev/lock`

**해결**:

```bash
rm -rf apps/web/.next
```

### 3. 무한 로딩 (Infinite Loading)

**원인 확인 순서**:

1. curl로 HTTP 응답 코드 확인: `curl -sI http://localhost:3000/home`
2. 404 → Clerk/proxy.ts 설정 확인
3. 307 → 인증 필요 (공개 라우트에 추가 필요)
4. 200인데 빈 화면 → 클라이언트 렌더링 문제

**Clerk 관련 헤더 확인**:

```
x-clerk-auth-reason: protect-rewrite, dev-browser-missing
x-clerk-auth-status: signed-out
```

→ `proxy.ts`의 `isPublicRoute`에 해당 경로 추가

### 4. proxy.ts 공개 라우트 설정

```typescript
// apps/web/proxy.ts
const isPublicRoute = createRouteMatcher([
  '/',
  '/home', // 홈 페이지
  '/sign-in(.*)', // 로그인
  '/sign-up(.*)', // 회원가입
  '/announcements', // 공지사항
  '/help(.*)', // 도움말
  '/api/webhooks(.*)', // 외부 웹훅
]);
```

## Next.js 16 특이사항

### middleware.ts → proxy.ts 마이그레이션

Next.js 16에서 middleware가 proxy로 변경됨:

- 파일명: `middleware.ts` → `proxy.ts`
- 함수명: `middleware()` → `proxy()`
- 두 파일 동시 존재 불가 (충돌 에러 발생)

**주의**: middleware.ts 파일이 존재하면 삭제 필요

### Turbopack 캐시 문제

문제 발생 시 캐시 완전 삭제:

```bash
rm -rf apps/web/.next
```

## 디버깅 체크리스트

서버 접속 문제 발생 시 순서대로 확인:

- [ ] 1. 포트 사용 중인 프로세스 확인 및 종료
- [ ] 2. `.next` 폴더 삭제
- [ ] 3. `middleware.ts` 파일 존재 여부 확인 (있으면 삭제)
- [ ] 4. curl로 HTTP 응답 확인
- [ ] 5. 응답 헤더에서 Clerk 관련 정보 확인
- [ ] 6. `proxy.ts`의 공개 라우트 목록 확인

## 유용한 디버깅 명령어

```bash
# 서버 상태 확인
curl -sI http://localhost:3000/home | head -10

# 여러 라우트 테스트
for route in / /home /beauty /sign-in; do
  echo -n "$route: "
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$route
  echo ""
done

# 서버 로그 실시간 확인
tail -f /path/to/server/output

# TypeScript 오류 확인
cd apps/web && npx tsc --noEmit
```

## Clerk 디버깅

`clerkMiddleware`에 디버그 모드 활성화:

```typescript
export const proxy = clerkMiddleware(
  async (auth, req) => {
    /* ... */
  },
  { debug: true } // 터미널에 상세 로그 출력
);
```

## 참고 자료

- [Next.js 16 Proxy 문서](https://nextjs.org/docs/app/getting-started/proxy)
- [Clerk Middleware 문서](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Next.js 16 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16)

---

**Version**: 1.1 | **Updated**: 2026-01-13 | `npm run dev:reset` 명령 추가

## sisyphus-trigger.md

# 시지푸스 자동 트리거 규칙

> 작업 복잡도에 따라 시지푸스 오케스트레이터 사용 여부를 결정

## 자동 트리거 조건

### 시지푸스 사용 (/sisyphus)

다음 중 하나라도 해당하면 `/sisyphus` 명령 사용:

1. **파일 영향도 높음**
   - 4개 이상 파일 수정 예상
   - 여러 모듈/폴더에 걸친 변경

2. **아키텍처 변경**
   - 새로운 패턴/구조 도입
   - 기존 구조 리팩토링
   - DB 스키마 변경

3. **리스크 요소 존재**
   - 인증/보안 관련 변경
   - 외부 API 연동
   - 결제/민감 데이터 처리

4. **명시적 요청**
   - 사용자가 "검토", "리뷰", "품질 체크" 요청
   - "/sisyphus" 직접 호출

### 직접 실행 (시지푸스 생략)

다음 조건을 **모두** 만족하면 직접 실행:

1. **단순 변경**
   - 1-3개 파일 수정
   - 단일 기능/컴포넌트 범위
   - 독립적 변경 (의존성 낮음)

2. **낮은 리스크**
   - UI/스타일 변경
   - 문서 업데이트
   - 테스트 추가
   - 버그 수정 (원인 명확)

3. **반복 작업**
   - 동일 패턴 반복 적용
   - 이전에 검증된 패턴

## 복잡도 빠른 판단 가이드

```
질문 1: 수정할 파일이 4개 이상인가?
  → 예: /sisyphus
  → 아니오: 질문 2로

질문 2: DB/인증/외부API 관련인가?
  → 예: /sisyphus
  → 아니오: 질문 3으로

질문 3: 새로운 패턴/구조 도입인가?
  → 예: /sisyphus
  → 아니오: 직접 실행
```

## 실행 예시

### 직접 실행 케이스

```
"Button 컴포넌트에 disabled 스타일 추가"
→ 1개 파일, UI 변경, 독립적 → 직접 실행

"README 오타 수정"
→ 1개 파일, 문서, 낮은 리스크 → 직접 실행

"기존 테스트에 엣지케이스 추가"
→ 테스트 파일만, 검증된 패턴 → 직접 실행
```

### 시지푸스 케이스

```
"새로운 결제 모듈 추가"
→ 여러 파일, 외부 API, 민감 데이터 → /sisyphus

"인증 방식 JWT에서 Session으로 변경"
→ 아키텍처 변경, 인증 관련 → /sisyphus

"5개 페이지에 다크모드 적용"
→ 4개 이상 파일 → /sisyphus
```

## 모드별 에이전트 활용 (4-tier 트랙)

| 총점   | 트랙명       | 전략     | 에이전트                   |
| ------ | ------------ | -------- | -------------------------- |
| 0-30   | **Quick**    | direct   | 없음 (직접 실행)           |
| 31-50  | **Light**    | single   | code-quality               |
| 51-70  | **Standard** | standard | code-quality + test-writer |
| 71-100 | **Full**     | full     | 전체 에이전트 파이프라인   |

**모델**: Opus 4.5 전용 (품질 일관성 보장)
**참조**: `.claude/lib/complexity-analyzer.md`에서 상세 점수 기준 확인

## 주의사항

1. **불확실하면 시지푸스 사용**: 판단이 애매하면 `/sisyphus`로 복잡도 분석
2. **점진적 접근**: 큰 작업은 작은 단위로 분할 후 각각 판단
3. **사용자 의도 우선**: 사용자가 빠른 실행을 원하면 직접 실행

## workflow-roadmap.md

# 워크플로우 로드맵

> Boris Cherny (Claude Code 제작자) 워크플로우 중 향후 도입 검토 항목

## 현재 구현 상태 (v9.6)

| 패턴           | 상태    | 구현 방식                                |
| -------------- | ------- | ---------------------------------------- |
| CLAUDE.md      | ✅ 완료 | 2.5k+ 토큰, 지속 업데이트                |
| 슬래시 명령어  | ✅ 완료 | 9개 (`/qplan`, `/qcode`, `/sisyphus` 등) |
| 서브에이전트   | ✅ 완료 | 7개 (6 전문가 + 오케스트레이터)          |
| Opus 4.5       | ✅ 완료 | 시지푸스 전용                            |
| 검증 루프      | ✅ 완료 | typecheck + lint + test                  |
| 권한 사전 허용 | ✅ 완료 | 364개 규칙 (settings.local.json)         |
| Plan Mode      | ✅ 완료 | `/qplan` 명령어                          |
| 커밋 시 포매팅 | ✅ 완료 | Husky + lint-staged                      |

---

## 향후 도입 검토 항목

### 1. PostToolUse 포매팅 훅

**역할**: 도구 실행 후 자동 코드 포매팅

**현재 대체 수단**: Husky + lint-staged (커밋 시점 포매팅)

**도입 검토 시점**:

- 팀 규모 5명+ 도달 시
- CI 포매팅 실패가 빈번할 때 (월 10건+)
- 실시간 포매팅 피드백 필요 시

**구현 가이드**:

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npx prettier --write $FILE"
      }
    ]
  }
}
```

**주의사항**:

- Husky 훅과 중복 실행 방지 필요
- 대용량 파일 편집 시 지연 발생 가능

---

### 2. /commit-push-pr 명령어

**역할**: git commit + push + PR 생성 원스톱 자동화

**현재 대체 수단**: 수동 git 명령어 실행

**도입 검토 시점**:

- 일일 PR 생성 5건+ 시
- 팀 PR 컨벤션 강제 필요 시
- 반복적인 커밋 메시지 형식 요구 시

**구현 가이드**:

```markdown
# .claude/commands/commit-push-pr.md

## /commit-push-pr 명령어

git 작업을 한 번에 처리합니다.

### 실행 순서

1. `git status`로 변경 파일 확인
2. `git diff`로 변경 내용 분석
3. 커밋 메시지 자동 생성 (컨벤션 준수)
4. `git add .` + `git commit`
5. `git push -u origin <branch>`
6. `gh pr create` (PR 템플릿 적용)

### 커밋 메시지 형식

\`\`\`
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
\`\`\`

### 사용 예시

\`\`\`
/commit-push-pr
/commit-push-pr --draft
/commit-push-pr --no-pr
\`\`\`
```

**주의사항**:

- 민감한 파일 커밋 방지 로직 필요 (.env 등)
- PR 리뷰어 자동 지정 설정 검토

---

### 3. Adversarial 에이전트

**역할**: 코드 리뷰 결과에 구멍 찾기 (5개 추가 에이전트)

**현재 대체 수단**: 7개 전문 에이전트 파이프라인

**도입 검토 시점**:

- 팀 규모 10명+ 도달 시
- 프로덕션 버그 빈도 높을 때 (월 5건+)
- 높은 SLA 요구 서비스 운영 시
- 보안/결제 등 크리티컬 모듈 추가 시

**구현 가이드**:

```markdown
# .claude/agents/adversarial-reviewer.md

# Adversarial Reviewer

원래 리뷰 결과에 구멍을 찾는 에이전트

## 역할

- 다른 에이전트 결과물에 반론 제시
- 엣지케이스 발견
- 보안 취약점 심층 분석

## 실행 방식

1. code-quality 결과 수신
2. 5개 관점에서 반박 시도:
   - 성능 병목 가능성
   - 동시성 이슈
   - 메모리 누수 가능성
   - 입력 검증 우회
   - 에러 전파 경로

## 출력 형식

- 반박 성공: 구체적 수정 제안
- 반박 실패: "검증 완료" 표시
```

**주의사항**:

- 에이전트 수 증가로 비용 상승
- 실행 시간 증가 (파이프라인 길이)
- 과도한 반박으로 생산성 저하 가능

---

### 4. 팀 공유 설정 (.claude/settings.json)

**역할**: 팀 전체 공유 권한 및 설정 관리

**현재 상태**: .claude/settings.local.json (개인용)

**도입 검토 시점**:

- 팀 협업 시작 시
- 새 팀원 온보딩 시간 단축 필요 시

**구현 가이드**:

```json
// .claude/settings.json (git 추적)
{
  "permissions": {
    "allow": ["Bash(npm run:*)", "Bash(git:*)", "Bash(npx:*)"]
  },
  "model": "opus-4.5"
}
```

**주의사항**:

- 민감한 경로는 .local.json에 유지
- 팀 리뷰 후 머지

---

## 도입 결정 체크리스트

새 워크플로우 도입 전 확인:

1. **필요성**: 현재 워크플로우로 해결 불가능한가?
2. **빈도**: 해당 작업이 반복적으로 발생하는가?
3. **ROI**: 도입 비용 < 절감 효과인가?
4. **팀 합의**: 팀원 모두 사용 가능한가?

---

## 참고 자료

- [Boris Cherny 워크플로우 (2026)](https://venturebeat.com/technology/the-creator-of-claude-code-just-revealed-his-workflow-and-developers-are)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [InfoQ - Claude Code Creator Workflow](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/)

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                  |
| ---- | ---------- | ------------------------------------------ |
| 1.0  | 2026-01-11 | 초기 버전, Boris 워크플로우 분석 기반 작성 |

---

# .claude/lib/

## complexity-analyzer.md

# 복잡도 분석기

작업의 복잡도를 분석하여 적절한 실행 전략을 결정합니다.

## 복잡도 점수 기준

### 파일 영향도 (0-40점)

- 1개 파일: 5점
- 2-3개 파일: 15점
- 4-6개 파일: 25점
- 7개 이상: 40점

### 변경 유형 (0-30점)

- 버그 수정/오타: 5점
- 기존 컴포넌트 수정: 15점
- 새 컴포넌트 추가: 20점
- 아키텍처 변경: 30점

### 의존성 깊이 (0-20점)

- 독립적 변경: 5점
- 1-2단계 의존성: 10점
- 3단계 이상 의존성: 20점

### 리스크 요소 (0-10점, 중복 가능하나 최대 10점)

- DB 스키마 변경: +5점
- 인증/보안 관련: +5점
- 외부 API 연동: +3점

> 예: DB 변경(5) + 인증(5) = 10점 (최대값 적용)

## 실행 전략 결정

| 총점   | 트랙명       | 전략     | 예상 시간 | 적용 예시                       |
| ------ | ------------ | -------- | --------- | ------------------------------- |
| 0-30   | **Quick**    | direct   | 즉시      | 오타 수정, 주석, 단일 파일 수정 |
| 31-50  | **Light**    | single   | ~2분      | 2-3 파일, 새 컴포넌트 추가      |
| 51-70  | **Standard** | standard | ~5분      | 새 기능 모듈, 4-6 파일 변경     |
| 71-100 | **Full**     | full     | ~10분     | 아키텍처 변경, DB, 7개+ 파일    |

**모델**: Opus 4.5 전용 (품질 일관성 보장)

### 트랙별 에이전트 활용

| 트랙     | 활용 에이전트                                                                              |
| -------- | ------------------------------------------------------------------------------------------ |
| Quick    | 없음 (직접 실행)                                                                           |
| Light    | code-quality                                                                               |
| Standard | code-quality + test-writer                                                                 |
| Full     | 전체 (spec-reviewer, ui-validator, code-quality, test-writer, ux-writer, beauty-validator) |

## 사용 예시

```
작업: "UserBadge 컴포넌트 추가"
분석:
- 파일: 2개 (컴포넌트 + 테스트) → 15점
- 유형: 새 컴포넌트 → 20점
- 의존성: 독립적 → 5점
- 리스크: 없음 → 0점
총점: 40점 → Light 트랙 (single 전략)
```

---

# .cursor/rules/

## yiroom.mdc

---
description: 이룸(Yiroom) 프로젝트 Cursor 전용 규칙
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
alwaysApply: true
---

# 이룸(Yiroom) Cursor 규칙

## 🔒 핵심 가치 (절대 불변)
- 앱 이름: 이룸 (Yiroom)
- 슬로건: "온전한 나는?" / "Know yourself, wholly."
- 핵심 철학: "사용자의 변화를 돕는 것", "온전한 나를 찾는 것"

## 📌 프로젝트 개요
- 이룸: 통합 웰니스 AI 플랫폼
- 타겟: 10-30대 여성 (남성도 환영)
- 현재 모듈: PC-1(퍼스널컬러), S-1(피부), C-1(체형)

## 💻 기술 스택
- Next.js 16.0.4 + TypeScript 5.3+ (strict)
- Tailwind CSS v3.4 + shadcn/ui
- Supabase + Clerk (clerk_user_id 기반)
- Google Gemini 3 Pro API

## ✍️ 코딩 규칙
- 컴포넌트: PascalCase (예: PersonalColorCard.tsx)
- 함수/변수: camelCase (예: handleSubmit)
- 상수: UPPER_SNAKE_CASE (예: MAX_FILE_SIZE)
- 주석: 한국어 필수 ("왜" 이렇게 했는지 설명)
- 에러 메시지: 한국어 (사용자용)

## 🎯 3대 핵심 원칙
1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 테스트 통과 필수

## 🌏 UI 텍스트 규칙
- 신조어 금지: GMG, HMH, 홀리몰리 등 사용 안 함
- 자연스럽고 정중한 톤 유지
- 예: "분석이 완료되었습니다" (O) / "홀리몰리 완료!" (X)

## 📚 필수 참조
- @CLAUDE.md - 상세 개발 규칙
- @docs/PROJECT-RULES.md - 프로젝트 기본 정보
- @docs/SDD-WORKFLOW.md - Spec-Driven Development
- @docs/AGENT-STRATEGY.md - Agent 활용 전략

## ⚠️ Cursor 사용 시 주의
- Claude Code 전용 명령어 (/compact, /clear, /rewind)는 Cursor에서 미지원
- Thinking Mode (think, ultrathink)는 Claude API 기능
- 상세 규칙은 CLAUDE.md 참조

---

# DATABASE-SCHEMA.md

# 🗄️ Database 스키마 v5.2 (Phase H + Launch + 정합성 검토)

**버전**: v5.2 (정합성 검토 반영)
**업데이트**: 2026년 1월 12일
**Auth**: Clerk (clerk_user_id 기반)
**Database**: Supabase (PostgreSQL 15+)
**차별화**: 퍼스널 컬러 + 성분 분석 + 제품 DB + 리뷰 시스템

> ⚠️ **주의**: 이 문서는 실제 마이그레이션 파일과 약 40% 불일치가 있습니다.
> 최신 테이블 목록은 `supabase/migrations/` 폴더의 SQL 파일을 참조하세요.
> 미문서화 테이블: workout_analyses, workout_plans, workout_logs, workout_streaks,
> user_preferences, user_agreements, user_challenges, image_consents, push_subscriptions,
> affiliate_products, skin_diary_entries, nutrition_streaks, smart_notifications,
> makeup_analyses, user_size_history, user_shopping_preferences, price_watches,
> hair_analyses, mental_health_logs, product_shelf 등

---

## 📊 테이블 구조 개요

```yaml
테이블 목록:
  Phase 1 (분석):
    1. users                        # Clerk 사용자 정보
    2. personal_color_assessments   # PC-1 퍼스널 컬러 ⭐
    3. skin_analyses                # S-1 피부 분석 (성분 분석 포함)
    4. body_analyses                # C-1 체형 분석 (PC 연동)

  Product DB v1:
    5. cosmetic_products            # 화장품 (500개)
    6. supplement_products          # 영양제 (200개)

  Product DB v2:
    7. workout_equipment            # 운동 기구 (50개)
    8. health_foods                 # 건강식품 (100개)
    9. product_price_history        # 가격 추적

  사용자 기능:
    10. user_wishlists              # 위시리스트 (2025-12-11)
    20. daily_checkins              # 일일 체크인 (2025-12-22)

  관리자:
    11. feature_flags               # 기능 플래그 (2025-12-11)
    12. admin_logs                  # 관리자 활동 로그 (2025-12-11)

  Phase 2 (영양):
    13. foods                       # 음식 DB
    14. nutrition_settings          # 영양 설정
    15. meal_records                # 식단 기록

  Phase G (리뷰/어필리에이트):
    16. product_reviews             # 제품 리뷰 (2025-12-19)
    17. review_helpful              # 리뷰 도움됨 (2025-12-19)
    18. ingredient_interactions     # 성분 상호작용 (2025-12-19)
    19. affiliate_clicks            # 어필리에이트 클릭 (2025-12-19)

  Phase H (게이미피케이션):
    21. user_levels                 # 사용자 레벨/XP (2025-12-24)
    22. user_badges                 # 사용자 뱃지 (2025-12-24)
    23. challenges                  # 챌린지 템플릿 (2025-12-24)
    24. challenge_participations    # 챌린지 참여 (2025-12-24)
    25. challenge_teams             # 팀 챌린지 (2025-12-26)
    26. team_members                # 팀 멤버 (2025-12-26)
    27. challenge_invites           # 챌린지 초대 (2025-12-26)
    28. wellness_scores             # 웰니스 점수 (2025-12-25)
    29. friendships                 # 친구 관계 (2025-12-25)
    30. leaderboard_cache           # 리더보드 캐시 (2025-12-25)

  Launch (운영):
    31. announcements               # 공지사항 (2025-12-26)
    32. announcement_reads          # 공지 읽음 표시 (2025-12-26)
    33. faqs                        # FAQ (2025-12-26)
    34. feedback                    # 사용자 피드백 (2025-12-26)

  알림 (Notifications):
    35. user_notification_settings  # 알림 설정 (2026-01-11)
    36. user_push_tokens            # 푸시 토큰 (2026-01-11)

관계도:
  users (1) ━━━━━ (N) personal_color_assessments
  users (1) ━━━━━ (N) skin_analyses
  users (1) ━━━━━ (N) body_analyses

논리적 연동:
  personal_color_assessments.season → skin_analyses
  personal_color_assessments.season → body_analyses
```

---

## 1. users 테이블

### SQL 생성문

```sql
-- Clerk 사용자 정보 저장
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk ID
  email TEXT,
  name TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트
COMMENT ON TABLE users IS 'Clerk 사용자 기본 정보';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk에서 발급한 사용자 고유 ID';
```

### 필드 설명

```yaml
id: UUID
  - Supabase 내부 ID
  - PRIMARY KEY
  - 자동 생성

clerk_user_id: TEXT
  - Clerk 사용자 ID
  - UNIQUE NOT NULL
  - 모든 연결의 기준
  - 형식: "user_2abc123..."

email: TEXT
  - 사용자 이메일
  - Clerk에서 동기화

name: TEXT
  - 사용자 이름/닉네임

profile_image_url: TEXT
  - 프로필 이미지 URL

created_at: TIMESTAMPTZ
  - 계정 생성 시간

updated_at: TIMESTAMPTZ
  - 마지막 수정 시간
  - 트리거로 자동 업데이트
```

---

## 2. personal_color_assessments 테이블 ⭐

### SQL 생성문

```sql
-- PC-1 퍼스널 컬러 진단 결과 저장
CREATE TABLE personal_color_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 문진 데이터
  questionnaire_answers JSONB NOT NULL,

  -- 이미지 정보
  face_image_url TEXT,

  -- 분석 결과
  season TEXT NOT NULL CHECK (season IN ('Spring', 'Summer', 'Autumn', 'Winter')),
  undertone TEXT CHECK (undertone IN ('Warm', 'Cool', 'Neutral')),
  confidence INT CHECK (confidence >= 0 AND confidence <= 100),

  -- 문진 점수
  season_scores JSONB,

  -- 이미지 분석 결과
  image_analysis JSONB,

  -- 추천 데이터
  best_colors JSONB,
  worst_colors JSONB,
  makeup_recommendations JSONB,
  fashion_recommendations JSONB,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_pc_assessments_clerk_user_id
  ON personal_color_assessments(clerk_user_id);
CREATE INDEX idx_pc_assessments_season
  ON personal_color_assessments(season);
CREATE INDEX idx_pc_assessments_created_at
  ON personal_color_assessments(created_at DESC);

-- 코멘트
COMMENT ON TABLE personal_color_assessments
  IS 'PC-1 퍼스널 컬러 진단 결과 (온보딩 필수, S-1/C-1 자동 활용)';
COMMENT ON COLUMN personal_color_assessments.questionnaire_answers
  IS '10개 문진 질문 답변 JSON';
COMMENT ON COLUMN personal_color_assessments.season
  IS '최종 계절 타입 (Spring/Summer/Autumn/Winter)';
COMMENT ON COLUMN personal_color_assessments.season_scores
  IS '각 계절별 점수 {spring: 85, summer: 60, ...}';
```

### JSONB 필드 구조

```yaml
questionnaire_answers: {
    'q1_vein_color': 'blue', # 손목 혈관
    'q2_jewelry': 'gold', # 금/은 장신구
    'q3_skin_tone': 'light', # 피부 톤
    'q4_hair_color': 'dark_brown', # 헤어 컬러
    'q5_eye_color': 'dark', # 눈동자 색
    'q6_flush': 'sometimes', # 홍조
    'q7_sun_reaction': 'burn', # 태양 반응
    'q8_lip_color': 'pink', # 입술 색
    'q9_preferred_colors': 'cool', # 선호 색상
    ? 'q10_gender_age' # 성별/나이
    : { 'gender': 'female', 'age_group': '20s' },
  }

season_scores: { 'spring': 65, 'summer': 88, 'autumn': 45, 'winter': 72 }

image_analysis:
  {
    'detected_undertone': 'cool',
    'skin_brightness': 75,
    'color_temperature': 'cool',
    'saturation_level': 'medium',
    'contrast_level': 'low',
  }

best_colors: ['#FFB6C1', '#E6E6FA', '#87CEEB', '#98FB98', '#FFCCE5']

worst_colors: ['#FF4500', '#FF8C00', '#FFD700', '#32CD32']

makeup_recommendations:
  {
    'foundation': '쿨톤 베이지 21호',
    'lipstick': ['로즈핑크', '라벤더핑크', '베리'],
    'eyeshadow': ['파스텔퍼플', '핑크브라운', '그레이'],
    'blush': ['로즈', '라벤더핑크'],
  }

fashion_recommendations:
  {
    'best_colors': ['파스텔블루', '라벤더', '민트', '로즈'],
    'avoid_colors': ['오렌지', '코랄', '머스타드'],
    'metals': '실버',
    'patterns': ['체크', '스트라이프'],
    'fabrics': ['실크', '시폰', '린넨'],
  }
```

---

## 3. skin_analyses 테이블

### SQL 생성문

```sql
-- S-1 피부 분석 결과 저장
CREATE TABLE skin_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT NOT NULL,

  -- 분석 결과 (7가지 지표)
  skin_type TEXT NOT NULL,
  hydration INT CHECK (hydration >= 0 AND hydration <= 100),
  oil_level INT CHECK (oil_level >= 0 AND oil_level <= 100),
  pores INT CHECK (pores >= 0 AND pores <= 100),
  pigmentation INT CHECK (pigmentation >= 0 AND pigmentation <= 100),
  wrinkles INT CHECK (wrinkles >= 0 AND wrinkles <= 100),
  sensitivity INT CHECK (sensitivity >= 0 AND sensitivity <= 100),

  -- 전체 점수
  overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 추천 사항
  recommendations JSONB,
  products JSONB,

  -- 성분 분석 (화해 스타일) ⭐
  ingredient_warnings JSONB,

  -- 퍼스널 컬러 연동 ⭐
  personal_color_season TEXT,
  foundation_recommendation TEXT,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_skin_analyses_clerk_user_id
  ON skin_analyses(clerk_user_id);
CREATE INDEX idx_skin_analyses_created_at
  ON skin_analyses(created_at DESC);
CREATE INDEX idx_skin_analyses_skin_type
  ON skin_analyses(skin_type);
CREATE INDEX idx_skin_analyses_pc_season
  ON skin_analyses(personal_color_season);

-- 코멘트
COMMENT ON TABLE skin_analyses IS 'S-1 피부 분석 결과 (성분 분석 + PC 연동)';
COMMENT ON COLUMN skin_analyses.ingredient_warnings
  IS '성분 경고 정보 (화해 스타일)';
COMMENT ON COLUMN skin_analyses.personal_color_season
  IS '퍼스널 컬러 계절 (자동 조회)';
COMMENT ON COLUMN skin_analyses.foundation_recommendation
  IS '퍼스널 컬러 기반 파운데이션 추천';
```

### JSONB 필드 구조

```yaml
recommendations:
  {
    'insight': '수분 보충이 필요해요! 히알루론산 성분을 추천드려요.',
    'ingredients':
      [
        { 'name': '히알루론산', 'reason': '수분 보충' },
        { 'name': '나이아신아마이드', 'reason': '모공 개선' },
      ],
    'morning_routine': ['세안 → 토너 → 세럼 → 수분크림 → 선크림'],
    'evening_routine': ['클렌징 → 세안 → 토너 → 세럼 → 아이크림 → 수분크림'],
    'weekly_care': ['주 1-2회 각질 케어', '주 2-3회 시트 마스크'],
    'lifestyle_tips': ['물 2L 이상 섭취', '7시간 이상 수면'],
  }

products:
  {
    'cleanser': ['순한 폼클렌저', '젤 클렌저'],
    'toner': ['무알콜 토너', '하이드레이팅 토너'],
    'serum': ['히알루론산 세럼', '나이아신아마이드'],
    'moisturizer': ['수분크림', '젤크림'],
    'sunscreen': ['무기자차 선크림'],
    'specialCare': ['히알루론산 앰플', '비타민C 세럼'],
  }

ingredient_warnings:
  [
    {
      'ingredient': '알코올',
      'ingredientEn': 'Alcohol',
      'level': 'high',
      'ewgGrade': 6,
      'reason': '민감성 피부에 자극 유발 가능',
      'alternatives': ['알코올 프리 토너', '글리세린 기반 제품'],
      'category': '용매',
    },
    {
      'ingredient': '향료',
      'ingredientEn': 'Fragrance',
      'level': 'medium',
      'ewgGrade': 8,
      'reason': '알러지 반응 가능성',
      'alternatives': ['무향 제품'],
      'category': '향료',
    },
    {
      'ingredient': '파라벤',
      'ingredientEn': 'Paraben',
      'level': 'low',
      'ewgGrade': 4,
      'reason': '일부 민감 반응 보고',
      'alternatives': ['파라벤 프리 제품', '천연 방부제 제품'],
      'category': '방부제',
    },
  ]
```

---

## 4. body_analyses 테이블

### SQL 생성문

```sql
-- C-1 체형 분석 결과 저장
CREATE TABLE body_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT NOT NULL,

  -- 기본 측정값
  height DECIMAL(5,2),
  weight DECIMAL(5,2),

  -- 분석 결과
  body_type TEXT NOT NULL,
  shoulder INT CHECK (shoulder >= 0 AND shoulder <= 100),
  waist INT CHECK (waist >= 0 AND waist <= 100),
  hip INT CHECK (hip >= 0 AND hip <= 100),
  ratio DECIMAL(3,2),

  -- 추천 사항
  strengths JSONB,
  improvements JSONB,
  style_recommendations JSONB,

  -- 퍼스널 컬러 연동 ⭐
  personal_color_season TEXT,
  color_recommendations JSONB,

  -- 목표 설정
  target_weight DECIMAL(5,2),
  target_date DATE,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_body_analyses_clerk_user_id
  ON body_analyses(clerk_user_id);
CREATE INDEX idx_body_analyses_created_at
  ON body_analyses(created_at DESC);
CREATE INDEX idx_body_analyses_body_type
  ON body_analyses(body_type);
CREATE INDEX idx_body_analyses_pc_season
  ON body_analyses(personal_color_season);

-- 코멘트
COMMENT ON TABLE body_analyses IS 'C-1 체형 분석 결과 (PC 연동)';
COMMENT ON COLUMN body_analyses.personal_color_season
  IS '퍼스널 컬러 계절 (자동 조회)';
COMMENT ON COLUMN body_analyses.color_recommendations
  IS '퍼스널 컬러 기반 코디 색상 추천';
```

### JSONB 필드 구조

```yaml
strengths: ['균형 잡힌 어깨-허리 비율', '허리 라인이 잘 드러남']

# improvements: 향후 확장 예정
#   ["하체 볼륨 보완", "어깨 라인 강조"]

style_recommendations:
  {
    'items':
      [
        { 'item': '핏한 상의 + 하이웨이스트', 'reason': '허리 라인을 강조해요' },
        { 'item': 'A라인 스커트', 'reason': '균형 잡힌 실루엣을 완성해요' },
        { 'item': '와이드 팬츠', 'reason': '세련된 느낌을 더해요' },
      ],
    'insight': '허리를 강조하는 벨트 코디가 당신의 체형을 더 돋보이게 해요',
    'colorTips': ['균형 잡힌 체형이므로 대부분의 색상 조합이 잘 어울려요'],
  }

color_recommendations:
  {
    'topColors': ['코랄', '피치', '민트', '라벤더'],
    'bottomColors': ['베이지', '화이트', '그레이'],
    'avoidColors': ['블랙 전체', '네이비 전체'],
    'bestCombinations':
      [
        { 'top': '코랄', 'bottom': '베이지' },
        { 'top': '민트', 'bottom': '화이트' },
        { 'top': '라벤더', 'bottom': '그레이' },
      ],
    'accessories': ['실버 주얼리', '파스텔 스카프'],
  }
```

---

## 🔐 Row Level Security (RLS)

> **마이그레이션**: `supabase/migrations/202512220100_phase1_rls_policies.sql`

### Phase 1 테이블 RLS 정책

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_color_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

-- users 정책 (SELECT, UPDATE, INSERT)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- personal_color_assessments 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own PC assessments"
  ON personal_color_assessments FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own PC assessments"
  ON personal_color_assessments FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own PC assessments"
  ON personal_color_assessments FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own PC assessments"
  ON personal_color_assessments FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- skin_analyses 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own skin analyses"
  ON skin_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own skin analyses"
  ON skin_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own skin analyses"
  ON skin_analyses FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own skin analyses"
  ON skin_analyses FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- body_analyses 정책 (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own body analyses"
  ON body_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own body analyses"
  ON body_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own body analyses"
  ON body_analyses FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own body analyses"
  ON body_analyses FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### 참고: current_setting 파라미터

- `current_setting('request.jwt.claims', true)`: 두 번째 파라미터 `true`는 설정이 없을 때 NULL 반환
- Clerk JWT의 `sub` 클레임에서 `clerk_user_id` 추출

---

## 📦 Storage 버킷 설정

```sql
-- Storage 버킷 생성 (Supabase Dashboard에서)
-- 1. personal-color-images (PC-1 얼굴 사진)
-- 2. skin-images (S-1 피부 사진)
-- 3. body-images (C-1 체형 사진)

-- 또는 SQL로:
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('personal-color-images', 'personal-color-images', true),
  ('skin-images', 'skin-images', true),
  ('body-images', 'body-images', true);

-- Storage RLS 정책
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('personal-color-images', 'skin-images', 'body-images')
    AND (storage.foldername(name))[1] = current_setting('request.jwt.claims')::json->>'sub'
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('personal-color-images', 'skin-images', 'body-images')
    AND (storage.foldername(name))[1] = current_setting('request.jwt.claims')::json->>'sub'
  );
```

---

## 🔗 API 구현 예제

### 1. 퍼스널 컬러 저장

```typescript
// app/api/analyze/personal-color/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePersonalColor } from '@/lib/gemini';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { questionnaireAnswers, imageBase64 } = await req.json();

  // Gemini 분석
  const pcResult = await analyzePersonalColor(questionnaireAnswers, imageBase64);

  // 이미지 업로드
  const supabase = createClient();
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage
    .from('personal-color-images')
    .upload(fileName, imageBase64);

  // 결과 저장
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .insert({
      clerk_user_id: userId,
      questionnaire_answers: questionnaireAnswers,
      face_image_url: uploadData?.path,
      season: pcResult.season,
      undertone: pcResult.undertone,
      confidence: pcResult.confidence,
      season_scores: pcResult.seasonScores,
      image_analysis: pcResult.imageAnalysis,
      best_colors: pcResult.bestColors,
      worst_colors: pcResult.worstColors,
      makeup_recommendations: pcResult.makeupRecommendations,
      fashion_recommendations: pcResult.fashionRecommendations,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

### 2. 피부 분석 저장 (PC 연동)

```typescript
// app/api/analyze/skin/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeSkinImage, analyzeIngredients } from '@/lib/gemini';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageBase64 } = await req.json();
  const supabase = createClient();

  // 퍼스널 컬러 조회 (자동 연동)
  const { data: pcData } = await supabase
    .from('personal_color_assessments')
    .select('season')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const personalColorSeason = pcData?.season;

  // Gemini 피부 분석 (PC 정보 포함)
  const skinResult = await analyzeSkinImage(imageBase64, personalColorSeason);

  // 성분 분석
  const ingredientResult = await analyzeIngredients(
    skinResult.recommendedProducts,
    skinResult.skinType,
    skinResult.sensitivity
  );

  // 이미지 업로드
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData } = await supabase.storage
    .from('skin-images')
    .upload(fileName, imageBase64);

  // 결과 저장
  const { data, error } = await supabase
    .from('skin_analyses')
    .insert({
      clerk_user_id: userId,
      image_url: uploadData?.path,
      skin_type: skinResult.skinType,
      hydration: skinResult.hydration,
      oil_level: skinResult.oilLevel,
      pores: skinResult.pores,
      pigmentation: skinResult.pigmentation,
      wrinkles: skinResult.wrinkles,
      sensitivity: skinResult.sensitivity,
      overall_score: skinResult.overallScore,
      recommendations: skinResult.recommendations,
      products: skinResult.products,
      ingredient_warnings: ingredientResult.warnings,
      personal_color_season: personalColorSeason,
      foundation_recommendation: skinResult.foundationRecommendation,
    })
    .select()
    .single();

  return Response.json(data);
}
```

### 3. 통합 데이터 조회

```typescript
// app/api/user/integrated-data/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // 병렬 조회
  const [pcResult, skinResult, bodyResult] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('skin_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('body_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return Response.json({
    personalColor: pcResult.data,
    skinAnalyses: skinResult.data,
    bodyAnalyses: bodyResult.data,
  });
}
```

---

## ✅ 체크리스트

```yaml
Database 설정: □ Supabase 프로젝트 생성
  □ users 테이블 생성
  □ personal_color_assessments 테이블 생성
  □ skin_analyses 테이블 생성
  □ body_analyses 테이블 생성
  □ 모든 인덱스 생성
  □ updated_at 트리거 생성
  □ RLS 정책 설정

Storage 설정: □ personal-color-images 버킷
  □ skin-images 버킷
  □ body-images 버킷
  □ Storage RLS 정책

Clerk 연동: □ clerk_user_id 필드 확인
  □ API Route auth 체크
  □ 데이터 저장 테스트
  □ 데이터 조회 테스트

퍼스널 컬러 통합: □ PC 진단 저장
  □ S-1에서 PC 자동 조회
  □ C-1에서 PC 자동 조회
  □ 통합 추천 작동
```

---

## 5. cosmetic_products 테이블 (Product DB v1)

### SQL 생성문

```sql
-- 화장품 제품 테이블
CREATE TABLE cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- cleanser, toner, serum, moisturizer, sunscreen, mask, makeup
  subcategory TEXT,
  price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium')),
  price_krw INTEGER,
  skin_types TEXT[], -- dry, oily, combination, sensitive, normal
  concerns TEXT[], -- acne, aging, whitening, hydration, pore, redness
  key_ingredients TEXT[],
  avoid_ingredients TEXT[],
  personal_color_seasons TEXT[], -- Spring, Summer, Autumn, Winter
  target_age_groups TEXT[] DEFAULT ARRAY['20s', '30s']::TEXT[], -- 10s, 20s, 30s, 40s, 50s
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책

- **공개 읽기**: 모든 사용자가 활성화된 제품 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 6. supplement_products 테이블 (Product DB v1)

### SQL 생성문

```sql
-- 영양제 제품 테이블
CREATE TABLE supplement_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- vitamin, mineral, protein, omega, probiotic, collagen, other
  benefits TEXT[], -- skin, hair, energy, immunity, digestion, sleep, muscle, bone
  main_ingredients JSONB, -- [{name, amount, unit}]
  target_concerns TEXT[],
  price_krw INTEGER,
  dosage TEXT,
  serving_size INTEGER,
  total_servings INTEGER,
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  warnings TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책

- **공개 읽기**: 모든 사용자가 활성화된 제품 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 7. workout_equipment 테이블 (Product DB v2)

### SQL 생성문

```sql
-- 운동 기구 제품 테이블
CREATE TABLE workout_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- dumbbell, barbell, kettlebell, resistance_band, etc.
  subcategory TEXT,

  -- 가격 정보
  price_krw INTEGER,
  price_range TEXT, -- budget, mid, premium

  -- 제품 스펙
  weight_kg DECIMAL(5,2),
  weight_range TEXT, -- 조절식 범위 (예: "2-20kg")
  material TEXT,
  size TEXT,
  color_options TEXT[],

  -- 용도
  target_muscles TEXT[], -- chest, back, shoulders, arms, legs, core, full_body
  exercise_types TEXT[], -- strength, cardio, flexibility, balance, plyometric
  skill_level TEXT, -- beginner, intermediate, advanced, all
  use_location TEXT, -- home, gym, outdoor, all

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 특징
  features TEXT[],
  pros TEXT[],
  cons TEXT[],

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
category: TEXT (CHECK)
  - dumbbell, barbell, kettlebell, resistance_band
  - pull_up_bar, yoga_mat, foam_roller, jump_rope
  - ab_roller, bench, rack, cardio, accessory, wearable, other

target_muscles: TEXT[]
  - chest, back, shoulders, arms, legs, core, full_body

exercise_types: TEXT[]
  - strength, cardio, flexibility, balance, plyometric

skill_level: TEXT
  - beginner, intermediate, advanced, all

use_location: TEXT
  - home, gym, outdoor, all
```

### RLS 정책

- **공개 읽기**: 활성화된 제품만 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 8. health_foods 테이블 (Product DB v2)

### SQL 생성문

```sql
-- 건강식품 제품 테이블
CREATE TABLE health_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- protein_powder, protein_bar, bcaa, creatine, etc.
  subcategory TEXT, -- whey, casein, plant-based

  -- 가격 정보
  price_krw INTEGER,
  price_per_serving INTEGER,

  -- 영양 정보 (1회 섭취량 기준)
  serving_size TEXT,
  servings_per_container INTEGER,
  calories_per_serving INTEGER,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  sugar_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  fiber_g DECIMAL(5,1),
  sodium_mg INTEGER,
  additional_nutrients JSONB, -- [{name, amount, unit, daily_value_percent}]

  -- 특성
  flavor_options TEXT[],
  dietary_info TEXT[], -- vegan, gluten_free, lactose_free, keto, etc.
  allergens TEXT[],

  -- 용도
  benefits TEXT[], -- muscle_gain, weight_loss, energy, recovery, etc.
  best_time TEXT, -- pre_workout, post_workout, morning, anytime
  target_users TEXT[], -- athletes, beginners, weight_loss, muscle_gain

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  features TEXT[],
  taste_rating DECIMAL(2,1),
  mixability_rating DECIMAL(2,1),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
category: TEXT (CHECK)
  - protein_powder, protein_bar, meal_replacement
  - energy_drink, sports_drink, bcaa, creatine
  - pre_workout, post_workout, diet_food
  - healthy_snack, superfood, functional_food, other

dietary_info: TEXT[]
  - vegan, gluten_free, lactose_free
  - keto, sugar_free, organic

benefits: TEXT[]
  - muscle_gain, weight_loss, energy
  - recovery, endurance

target_users: TEXT[]
  - athletes, beginners, weight_loss, muscle_gain
```

### RLS 정책

- **공개 읽기**: 활성화된 제품만 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 9. product_price_history 테이블 (가격 추적)

### SQL 생성문

```sql
-- 제품 가격 변동 히스토리
CREATE TABLE product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL, -- cosmetic, supplement, workout_equipment, health_food
  product_id UUID NOT NULL,
  price_krw INTEGER NOT NULL,
  source TEXT, -- 가격 출처 (naver, coupang, oliveyoung, mock)
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 필드 설명

```yaml
product_type: TEXT (CHECK)
  - cosmetic: 화장품
  - supplement: 영양제
  - workout_equipment: 운동 기구
  - health_food: 건강식품

source: TEXT
  - naver: 네이버 쇼핑
  - coupang: 쿠팡
  - oliveyoung: 올리브영
  - mock: 테스트용
```

### RLS 정책

- **공개 읽기**: 모든 사용자 조회 가능
- **쓰기**: Service Role만 가능 (관리자)

---

## 10. N-1 영양 모듈 테이블 (Phase 2)

### 10.1 foods 테이블 (음식 DB)

```sql
CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  serving_size TEXT DEFAULT '1인분',
  serving_grams INTEGER,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),
  fiber DECIMAL(5,1),
  sugar DECIMAL(5,1),
  sodium INTEGER,
  traffic_light TEXT CHECK (traffic_light IN ('green', 'yellow', 'red')),
  is_korean BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 nutrition_settings 테이블 (영양 설정)

```sql
CREATE TABLE nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  goal TEXT NOT NULL CHECK (goal IN ('weight_loss', 'maintain', 'muscle', 'skin', 'health')),
  bmr DECIMAL(6,1),
  tdee DECIMAL(6,1),
  daily_calorie_target INTEGER,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  meal_style TEXT,
  cooking_skill TEXT,
  budget TEXT,
  allergies TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  meal_count INTEGER DEFAULT 3,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.3 meal_records 테이블 (식단 기록)

```sql
CREATE TABLE meal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME,
  record_type TEXT NOT NULL DEFAULT 'manual',
  foods JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(5,1) DEFAULT 0,
  total_carbs DECIMAL(5,1) DEFAULT 0,
  total_fat DECIMAL(5,1) DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  total_sugar DECIMAL(5,1) DEFAULT 0,
  ai_recognized_food TEXT,
  ai_confidence TEXT,
  ai_raw_response JSONB,
  user_confirmed BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.4 water_records 테이블 (수분 섭취)

```sql
CREATE TABLE water_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_time TIME DEFAULT CURRENT_TIME,
  amount_ml INTEGER NOT NULL,
  drink_type TEXT DEFAULT 'water',
  hydration_factor DECIMAL(3,2) DEFAULT 1.0,
  effective_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.5 기타 N-1 테이블

- **favorite_foods**: 즐겨찾기 음식
- **nutrition_streaks**: 식단 연속 기록
- **daily_nutrition_summary**: 일일 영양 요약
- **fasting_records**: 간헐적 단식 기록

> 상세 스키마: `apps/web/supabase/migrations/N1_combined_migration.sql` 참조

---

## 11. user_wishlists 테이블 (위시리스트)

```sql
CREATE TABLE user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'workout_equipment', 'health_food')),
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- RLS: 본인 데이터만 접근 가능
CREATE POLICY "Users can view own wishlists" ON user_wishlists FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
CREATE POLICY "Users can insert own wishlists" ON user_wishlists FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
CREATE POLICY "Users can delete own wishlists" ON user_wishlists FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');
```

> 마이그레이션: `supabase/migrations/20251211_wishlist.sql`

---

## 12. feature_flags 테이블 (기능 플래그)

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 플래그 (12개)
-- analysis_personal_color, analysis_skin, analysis_body
-- workout_module, nutrition_module, reports_module
-- product_recommendations, product_wishlist, ai_qa
-- ingredient_warning, price_crawler, share_results

-- RLS: 모든 사용자 읽기 가능, 관리자만 수정
CREATE POLICY "Anyone can read feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Service role can manage" ON feature_flags FOR ALL USING (auth.role() = 'service_role');
```

---

## 13. admin_logs 테이블 (관리자 로그)

```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  action TEXT NOT NULL,          -- 'product.create', 'feature.toggle' 등
  target_type TEXT,              -- 'product', 'feature', 'user'
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Service Role만 접근
CREATE POLICY "Service role only" ON admin_logs FOR ALL USING (auth.role() = 'service_role');
```

> 마이그레이션: `supabase/migrations/20251211_admin_features.sql`

---

## 14. product_reviews 테이블 (Phase G - Sprint 1)

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 제품 참조 (다형성)
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 리뷰 내용
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,

  -- 메타데이터
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 제품별 1개 리뷰 제한
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- RLS: 공개 읽기, 인증된 사용자 작성, 본인만 수정/삭제
```

> 마이그레이션: `supabase/migrations/202512190300_product_reviews.sql`

---

## 15. review_helpful 테이블 (Phase G - Sprint 1)

```sql
CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 리뷰별 1번만 도움됨 표시
  UNIQUE(review_id, clerk_user_id)
);

-- RLS: 공개 읽기, 인증된 사용자 작성, 본인만 삭제
-- 트리거: helpful_count 자동 갱신
```

---

## 16. ingredient_interactions 테이블 (Phase G - Sprint 2)

```sql
CREATE TABLE ingredient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 성분 쌍
  ingredient_a TEXT NOT NULL,
  ingredient_b TEXT NOT NULL,

  -- 상호작용 유형
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'contraindication',  -- 금기 (절대 같이 복용 X)
    'caution',           -- 주의 (의사 상담 권장)
    'synergy',           -- 시너지 (같이 먹으면 좋음)
    'timing'             -- 시간 분리 필요
  )),

  -- 심각도
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),

  -- 상세 정보
  description TEXT NOT NULL,
  recommendation TEXT,
  source TEXT,           -- 출처 (논문, FDA 등)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ingredient_a, ingredient_b, interaction_type)
);

-- RLS: 공개 읽기 전용 (service_role만 수정)
-- 초기 시드: 24개 상호작용 데이터
```

> 마이그레이션: `supabase/migrations/202512190200_ingredient_interactions.sql`

---

## 17. affiliate_clicks 테이블 (Phase G - Sprint 3)

```sql
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 (비로그인도 가능)
  clerk_user_id TEXT,

  -- 제품 정보
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 트래킹 정보
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,  -- 개인정보 보호를 위해 해시

  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 모든 사용자 삽입 가능, 읽기는 service_role만
-- 뷰: affiliate_daily_stats (일별 통계)
```

> 마이그레이션: `supabase/migrations/202512190100_affiliate_system.sql`

---

## 18. daily_checkins 테이블 (일일 체크인)

일일 체크인 - "오늘의 나" 기분/에너지/피부 상태 기록

### SQL 생성문

```sql
CREATE TABLE daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 체크인 데이터
    mood TEXT NOT NULL CHECK (mood IN ('great', 'okay', 'bad')),
    energy TEXT NOT NULL CHECK (energy IN ('high', 'medium', 'low')),
    skin_condition TEXT NOT NULL CHECK (skin_condition IN ('great', 'okay', 'bad')),

    -- 추가 메모 (선택적)
    notes TEXT,

    -- 체크인 시간
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 하루에 하나의 체크인만 허용
    UNIQUE(clerk_user_id, check_date)
);
```

### 필드 설명

```yaml
mood:
  - great: 좋아요 😊
  - okay: 보통이에요 😐
  - bad: 안 좋아요 😔

energy:
  - high: 활력 넘쳐요 ⚡
  - medium: 적당해요 🔋
  - low: 피곤해요 🪫

skin_condition:
  - great: 촉촉해요 ✨
  - okay: 괜찮아요 👌
  - bad: 건조/트러블 😣
```

> 마이그레이션: `supabase/migrations/202512220200_daily_checkins.sql`

---

## 19. user_notification_settings 테이블 (알림 설정)

사용자별 알림 설정 저장

### SQL 생성문

```sql
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 전역 설정
  enabled BOOLEAN DEFAULT false,

  -- 운동 알림
  workout_reminder BOOLEAN DEFAULT true,
  workout_reminder_time TIME DEFAULT '09:00',
  streak_warning BOOLEAN DEFAULT true,

  -- 영양 알림
  nutrition_reminder BOOLEAN DEFAULT true,
  meal_reminder_breakfast TIME DEFAULT '08:30',
  meal_reminder_lunch TIME DEFAULT '12:30',
  meal_reminder_dinner TIME DEFAULT '18:30',
  water_reminder BOOLEAN DEFAULT true,
  water_reminder_interval INTEGER DEFAULT 2,  -- 시간 간격

  -- 소셜/성취 알림
  social_notifications BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notification_settings_clerk_user_id
  ON user_notification_settings(clerk_user_id);

-- 코멘트
COMMENT ON TABLE user_notification_settings IS '사용자별 알림 설정';
COMMENT ON COLUMN user_notification_settings.water_reminder_interval IS '수분 섭취 알림 간격 (시간)';
```

### 필드 설명

```yaml
enabled: BOOLEAN
  - 전역 알림 ON/OFF
  - false일 경우 모든 알림 비활성화

workout_reminder: BOOLEAN
  - 운동 리마인더 활성화 여부

workout_reminder_time: TIME
  - 운동 리마인더 시간
  - 기본값: 09:00

streak_warning: BOOLEAN
  - 연속 기록 끊김 경고 알림

nutrition_reminder: BOOLEAN
  - 식사 리마인더 활성화 여부

meal_reminder_*: TIME
  - 아침/점심/저녁 리마인더 시간

water_reminder: BOOLEAN
  - 수분 섭취 리마인더 활성화 여부

water_reminder_interval: INTEGER
  - 수분 섭취 알림 간격 (시간 단위)
  - 기본값: 2 (2시간마다)

social_notifications: BOOLEAN
  - 친구 요청, 챌린지 초대 등 소셜 알림

achievement_notifications: BOOLEAN
  - 뱃지 획득, 레벨업 등 성취 알림
```

### RLS 정책

```sql
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON user_notification_settings FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own notification settings"
  ON user_notification_settings FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own notification settings"
  ON user_notification_settings FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## 20. user_push_tokens 테이블 (푸시 토큰)

사용자 기기별 푸시 알림 토큰 저장

### SQL 생성문

```sql
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 토큰 정보
  push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자-토큰 조합 유니크
  UNIQUE (clerk_user_id, push_token)
);

-- 인덱스
CREATE INDEX idx_push_tokens_clerk_user_id
  ON user_push_tokens(clerk_user_id);
CREATE INDEX idx_push_tokens_is_active
  ON user_push_tokens(is_active) WHERE is_active = true;

-- 코멘트
COMMENT ON TABLE user_push_tokens IS '사용자 기기별 푸시 알림 토큰';
COMMENT ON COLUMN user_push_tokens.platform IS '플랫폼 (ios, android, web)';
COMMENT ON COLUMN user_push_tokens.is_active IS '토큰 활성 상태 (만료/로그아웃 시 false)';
```

### 필드 설명

```yaml
push_token: TEXT
  - Expo/FCM/APNs 푸시 토큰
  - Expo: ExponentPushToken[...]
  - FCM: 디바이스 토큰

platform: TEXT (CHECK)
  - ios: iOS 앱
  - android: Android 앱
  - web: 웹 푸시 (PWA)

device_name: TEXT
  - 기기 이름 (선택적)
  - 예: "iPhone 15 Pro", "Galaxy S24"

is_active: BOOLEAN
  - 토큰 활성 상태
  - 로그아웃/토큰 만료 시 false

last_used_at: TIMESTAMPTZ
  - 마지막 푸시 발송 시간
  - 비활성 토큰 정리에 활용
```

### RLS 정책

```sql
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens"
  ON user_push_tokens FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own push tokens"
  ON user_push_tokens FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own push tokens"
  ON user_push_tokens FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own push tokens"
  ON user_push_tokens FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

**버전**: v5.2 (정합성 검토 반영)
**최종 업데이트**: 2026년 1월 12일
**상태**: Phase 1 + Phase 2 + Admin + Phase G + Checkin + 정합성 검토 필요 ⚠️

---

# SDD-MASTER-REFACTORING-PLAN.md

# SDD: 이룸 대규모 리팩토링 마스터 플랜

> 오류 예방, UI/UX 통합, 다국어 지원, 모듈 연동을 위한 종합 가이드
> Version: 1.9 | Created: 2026-01-13 | Updated: 2026-01-14 | Author: Claude Code (Opus 4.5)

---

## Executive Summary

이 문서는 이룸 프로젝트의 **대규모 리팩토링 및 신규 기능 구현**을 위한 최종 종합 가이드입니다.

### 핵심 목표

1. **오류 예방**: DB-API 불일치, UI 깨짐 등 반복 오류 근본 해결
2. **UI/UX 통합**: 200+ 컴포넌트의 하드코딩 색상 → 디자인 토큰 마이그레이션
3. **다국어 지원**: next-intl 활성화 + 500+ 하드코딩 텍스트 이관
4. **모듈 연동**: PC-1 ↔ S-1 ↔ C-1 ↔ F-1 크로스 모듈 아키텍처 확립

### 현황 진단 요약

| 영역              | 현재 상태                              | 위험도  | 우선순위 |
| ----------------- | -------------------------------------- | ------- | -------- |
| DB-API 동기화     | 규칙 문서화됨, 부분 해결               | 🔴 높음 | P0       |
| Clerk 인증        | proxy.ts 설정됨, 보호 라우트 정의 필요 | 🔴 높음 | P0       |
| API Rate Limiting | 미구현                                 | 🟡 중간 | P1       |
| Gemini AI         | Mock Fallback 필수, 타임아웃 설정 필요 | 🟡 중간 | P1       |
| UI/UX 컴포넌트    | 200+ 하드코딩 색상 (bg-_, text-_)      | 🔴 높음 | P1       |
| 다국어 지원       | 인프라 있으나 미사용                   | 🟡 중간 | P2       |
| 모듈 연동         | Gap 4개 미구현                         | 🟡 중간 | P1       |
| 스키마 문서       | 40% 불일치                             | 🟡 중간 | P2       |
| 보안 (OWASP)      | Clerk+RLS로 대부분 보호, 점검 필요     | 🟡 중간 | P1       |
| 성능 최적화       | Lighthouse 75점, 90+ 목표              | 🟡 중간 | P2       |
| 접근성            | Lighthouse 92점, 95+ 목표              | 🟡 중간 | P2       |
| 에러 로깅         | 모바일 Sentry 적용, 웹 미적용          | 🟡 중간 | P2       |

---

## Quick Start Guide (5분 가이드)

> 이 문서가 3,400+ 라인으로 방대합니다. **전체를 읽지 마세요.** 아래 가이드를 따르세요.

### 상황별 시작점

```
🚨 "500 에러 발생!" → Part 1.1 (DB-API 불일치)
🔐 "인증 문제!" → Part 1.2 (Clerk proxy.ts)
🎨 "UI 색상 통일하고 싶다" → Part 2.1 + Part 11.1
🌍 "다국어 추가하고 싶다" → Part 3.1
🔗 "모듈간 연동하고 싶다" → Part 4
✅ "테스트 추가하고 싶다" → Part 7
🔒 "보안 점검하고 싶다" → Part 9
⚡ "성능 개선하고 싶다" → Part 10
```

### 빠른 실행 체크리스트 (완전형)

**Phase 1: 기반 안정화 (~5시간)**

```
☐ Part 1.1: DB-API 동기화 규칙 숙지
☐ Part 1.2: proxy.ts 공개 라우트 확인
☐ Part 10.6: 환경변수 검증 스크립트 적용
☐ Part 9.x: OWASP 보안 점검
☐ Part 7.1: 변경 검증 자동화
```

**Phase 2+3: UI/UX + 기능 (~30시간, 병렬 가능)**

```
☐ Part 2.x: 전체 색상 토큰화
☐ Part 11.x: 디자인 시스템 정립
☐ Part 3.x: 전체 i18n
☐ Part 4.x: 모듈 연동 완성
```

**Phase 4: 품질 보증 (~15시간)**

```
☐ Part 7.3-7.4: 테스트 (접근성 + E2E)
☐ Part 12.x: WCAG 2.1 AA 접근성
☐ Part 10.x: 성능 최적화
```

### 참조 방식

| 상황           | 추천 방식                          |
| -------------- | ---------------------------------- |
| 특정 문제 해결 | Ctrl+F로 키워드 검색               |
| 새 기능 개발   | 해당 Part만 읽기                   |
| 전체 계획 검토 | Executive Summary + 부록 빠른 참조 |
| 코드 복붙 필요 | 해당 섹션 코드 블록만 복사         |

---

## 문서 유지보수 전략

### 동기화 자동화

**PR 체크리스트 (`.github/PULL_REQUEST_TEMPLATE.md` 추가)**

```markdown
## 문서 업데이트 체크

- [ ] 새 API 엔드포인트 → Part 1.3 API 목록 업데이트
- [ ] 새 컴포넌트 → Part 11 디자인 시스템 반영 여부
- [ ] 새 테이블/컬럼 → DATABASE-SCHEMA.md 동기화
- [ ] 새 환경변수 → Part 10.6 + .env.example 추가
- [ ] 제외된 대안 → Part 14 문서화
```

**자동 검증 스크립트**

```bash
# scripts/doc-sync-check.js - PR 시 자동 실행
- API 라우트 수 vs 문서 기재 수 비교
- 환경변수 .env.example vs Part 10.6 비교
- 마이그레이션 파일 수 vs Part 13.4 비교
```

### 버전 관리 정책

| 변경 규모      | 버전 증가 | 예시           |
| -------------- | --------- | -------------- |
| 오타/링크 수정 | 없음      | 오타 수정      |
| 섹션 내용 보강 | 0.0.1     | 예시 코드 추가 |
| 새 섹션 추가   | 0.1.0     | Part 15 추가   |
| 구조 변경      | 1.0.0     | Part 재구성    |

### 정기 리뷰 일정

```
매주 금요일 (15분):
☐ 이번 주 변경사항 vs 문서 차이 확인
☐ TODO 주석 → 문서 반영 여부

매월 1일 (1시간):
☐ Part 14 제외 항목 재검토
☐ 버전 히스토리 정리
☐ 사용되지 않는 섹션 아카이브

매분기 (2시간):
☐ 전체 문서 구조 검토
☐ 중복 내용 통합
☐ 외부 링크 유효성 확인
```

---

## 구현 로드맵 (완전형)

> 완전한 앱/웹 구현을 위한 단계별 실행 계획

### Phase 1: 기반 안정화 (최우선)

| Part | 항목               | 예상 시간 | 완료 기준                   |
| ---- | ------------------ | --------- | --------------------------- |
| 1.1  | DB-API 동기화 규칙 | 1시간     | 규칙 숙지 + 체크리스트 적용 |
| 1.2  | Clerk proxy.ts     | 30분      | 모든 라우트 보호 상태 확인  |
| 10.6 | 환경변수 검증      | 30분      | check-env.js 실행 성공      |
| 9.x  | OWASP 보안 점검    | 2시간     | 전체 체크리스트 통과        |
| 7.1  | 변경 검증 자동화   | 1시간     | typecheck + lint + test     |

**Phase 1 예상 시간: 5시간**

### Phase 2: UI/UX 통합

| Part | 항목               | 예상 시간 | 완료 기준                   |
| ---- | ------------------ | --------- | --------------------------- |
| 2.x  | 전체 색상 토큰화   | 8시간     | 200+ 컴포넌트 마이그레이션  |
| 11.x | 디자인 시스템 정립 | 4시간     | 토큰 + 컴포넌트 가이드 완성 |
| 11.5 | 애니메이션 시스템  | 2시간     | 토큰 + 접근성 적용          |
| 10.5 | Sentry 웹 설정     | 1시간     | 에러 수집 시작              |

**Phase 2 예상 시간: 15시간**

### Phase 3: 기능 완성

| Part | 항목            | 예상 시간 | 완료 기준                    |
| ---- | --------------- | --------- | ---------------------------- |
| 3.x  | 전체 i18n       | 6시간     | 500+ 텍스트 다국어 지원      |
| 4.x  | 모듈 연동 완성  | 4시간     | PC-1↔S-1↔C-1↔F-1 크로스 참조 |
| 5.x  | DB 마이그레이션 | 2시간     | 스키마 동기화 완료           |
| 3.5  | packages/shared | 3시간     | 웹/모바일 공유 패키지        |

**Phase 3 예상 시간: 15시간**

### Phase 4: 품질 보증

| Part | 항목               | 예상 시간 | 완료 기준                |
| ---- | ------------------ | --------- | ------------------------ |
| 7.3  | 접근성 테스트      | 2시간     | jest-axe 통과            |
| 7.4  | E2E 테스트 전체    | 6시간     | Playwright 시나리오 완성 |
| 12.x | 접근성 WCAG 2.1 AA | 4시간     | Lighthouse 95+           |
| 10.x | 성능 최적화        | 3시간     | Lighthouse 90+           |

**Phase 4 예상 시간: 15시간**

### 전체 구현 예상 시간: ~50시간

### 실행 순서 권장

```
[즉시] Phase 1 → [병렬] Phase 2 + 3 → [마무리] Phase 4
         ↓              ↓                    ↓
      안정성 확보    기능 구현            품질 검증
```

---

## 단점 완화 전략

### 문제 1: 문서 규모 (3,400+ 라인)

**완화책**:
| 전략 | 구현 |
|------|------|
| 진입점 단순화 | Quick Start Guide 추가 (위 참조) |
| 검색 최적화 | 각 Part에 키워드 태그 추가 |
| 분리 문서화 | 독립적 기능은 별도 SDD로 분리 |

**검색용 키워드 인덱스** (부록에 추가 예정):

```
500에러 → Part 1.1
인증실패 → Part 1.2
색상통일 → Part 2, 11
다국어 → Part 3
모듈연동 → Part 4
테스트 → Part 7
보안 → Part 9
성능 → Part 10
```

### 문제 2: 실행 리소스 부담

**완화책**:
| 전략 | 구현 |
|------|------|
| MVP 티어링 | Tier 1/2/3 분류 (위 참조) |
| 시간 예측 제공 | 각 항목에 예상 시간 명시 |
| 점진적 실행 | 주간 15분 단위로 분할 |

**주간 실행 플랜 예시**:

```
Week 1: Tier 1 완료 (2.5시간)
Week 2: Tier 2 - 7.1, 10.5 (2시간)
Week 3: Tier 2 - 2.1 (2시간)
Week 4: Tier 2 - 4.3 (2시간)
Week 5+: 필요에 따라 Tier 3
```

### 문제 3: 유지보수 부담

**완화책**:
| 전략 | 구현 |
|------|------|
| PR 템플릿 | 문서 업데이트 체크리스트 강제 |
| 자동 검증 | doc-sync-check.js 스크립트 |
| 정기 리뷰 | 주/월/분기 일정 (위 참조) |

### 문제 4: 이론 vs 실제 괴리

**완화책**:
| 전략 | 구현 |
|------|------|
| MVP 범위 명시 | "범위 외" 섹션으로 명확화 |
| 트리거 조건 | "~할 때 검토" 조건 명시 |
| 현실적 목표 | 100% → 핵심 20% 집중 |

### 문제 5: 기술 부채 축적

**완화책**:
| 전략 | 구현 |
|------|------|
| 분기 리뷰 | Part 14 정기 재검토 |
| 트리거 알림 | MAU/팀규모 등 조건 자동 체크 |
| 만료 정책 | 1년 이상 미검토 항목 아카이브 |

**기술 부채 추적 대시보드** (권장):

```typescript
// lib/tech-debt-tracker.ts
interface DeferredItem {
  id: string;
  addedAt: Date;
  lastReviewedAt: Date;
  triggerConditions: string[];
  status: 'active' | 'archived' | 'implemented';
}

// 분기별 자동 리마인드
function checkDeferredItems() {
  const staleItems = items.filter((item) => daysSince(item.lastReviewedAt) > 90);
  if (staleItems.length > 0) {
    notify(`${staleItems.length}개 제외 항목 리뷰 필요`);
  }
}
```

---

## Part 1: 오류 패턴 및 예방 전략

### 1.1 Critical: DB-API 불일치 오류

**발생 패턴**:

```
API 코드 수정 → 새 컬럼 insert 시도 → DB에 컬럼 없음 → 500 에러
```

**실제 사례 (2026-01-13)**:

```typescript
// apps/web/app/api/analyze/personal-color/route.ts:402-405
const { data, error } = await supabase.from('personal_color_assessments').insert({
  left_image_url: leftImageUrl, // ❌ 컬럼 없었음
  right_image_url: rightImageUrl, // ❌ 컬럼 없었음
  images_count: imagesCount, // ❌ 컬럼 없었음
  analysis_reliability: reliability, // ❌ 컬럼 없었음
});
```

**해결 (마이그레이션 생성)**:

```sql
-- supabase/migrations/20260113_pc_multi_angle_columns.sql
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS left_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_image_url TEXT,
  ADD COLUMN IF NOT EXISTS images_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_reliability TEXT DEFAULT 'medium';
```

**예방 체크리스트** (PR 리뷰 필수):

```
☐ API에서 .insert() 또는 .update() 변경 시:
  ☐ 삽입/수정하는 컬럼 목록 추출
  ☐ supabase/migrations/ 에서 해당 테이블 스키마 확인
  ☐ 컬럼 존재 여부 검증
  ☐ 없으면 마이그레이션 먼저 생성

☐ 새 컬럼 추가 순서:
  1. 마이그레이션 SQL 작성
  2. npx supabase db push
  3. API 코드 수정
  4. 테스트 실행
```

**관련 문서**: [.claude/rules/db-api-sync.md](.claude/rules/db-api-sync.md)

---

### 1.2 Critical: Clerk 인증 문제

#### 1.2.1 proxy.ts (middleware) 설정

**Next.js 16 변경사항**: `middleware.ts` → `proxy.ts` 마이그레이션 필수

```typescript
// apps/web/proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/announcements',
  '/help(.*)',
  '/api/webhooks(.*)',
  '/terms',
  '/privacy-policy',
]);

export const proxy = clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  { debug: process.env.NODE_ENV === 'development' }
);
```

**주의**: `middleware.ts`와 `proxy.ts` 동시 존재 불가 (충돌 에러)

#### 1.2.2 Clerk-Supabase 연동

**현재 구현**:

```typescript
// lib/supabase/clerk-client.ts - Client Component용
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();
  // Clerk 토큰을 Supabase에 전달
  return createClient(url, key, {
    accessToken: async () => await getToken({ template: 'supabase' }),
  });
}

// lib/supabase/server.ts - Server Component/API용
export function createClerkSupabaseClient() {
  // 서버 측 인증 토큰 처리
}
```

**문제 패턴**:

```typescript
// ❌ 잘못된 사용: Client Component에서 서버 함수 사용
const supabase = createClerkSupabaseClient(); // Server용 함수

// ✅ 올바른 사용
('use client');
const supabase = useClerkSupabaseClient(); // Client용 훅
```

#### 1.2.3 보호 라우트 목록

| 경로              | 보호 수준 | 설명        |
| ----------------- | --------- | ----------- |
| `/home`           | 공개      | 홈 페이지   |
| `/analysis/*`     | 인증 필수 | 분석 페이지 |
| `/profile/*`      | 인증 필수 | 프로필      |
| `/settings/*`     | 인증 필수 | 설정        |
| `/workout/*`      | 인증 필수 | 운동        |
| `/nutrition/*`    | 인증 필수 | 영양        |
| `/api/analyze/*`  | 인증 필수 | 분석 API    |
| `/api/webhooks/*` | 공개      | 외부 웹훅   |

---

### 1.3 High: API 라우트 관리

#### 1.3.1 주요 API 엔드포인트 목록

```
app/api/
├── analyze/
│   ├── personal-color/route.ts   # PC-1 분석
│   ├── face/route.ts             # F-1 분석
│   ├── skin/route.ts             # S-1 분석
│   └── body/route.ts             # C-1 분석
├── products/
│   ├── route.ts                  # 제품 목록
│   ├── [id]/route.ts             # 제품 상세
│   └── reviews/route.ts          # 리뷰
├── workout/
│   ├── logs/route.ts             # 운동 기록
│   └── plans/route.ts            # 운동 계획
├── nutrition/
│   ├── meals/route.ts            # 식단 기록
│   └── water/route.ts            # 물 섭취
├── coach/route.ts                # AI 코치
├── storage/
│   └── upload/route.ts           # 이미지 업로드
└── webhooks/
    ├── clerk/route.ts            # Clerk 웹훅
    └── affiliate/route.ts        # 어필리에이트 웹훅
```

#### 1.3.2 Rate Limiting 설정

**현황**: 기본 Rate Limiting 미구현

**권장 구현**:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 분당 10회
});

// API 라우트에서 사용
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... 실제 로직
}
```

#### 1.3.3 CORS 설정

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

---

### 1.4 High: Gemini AI 분석 모듈

#### 1.4.1 현재 구현 현황

```
lib/
├── gemini.ts                    # 메인 Gemini 클라이언트
├── gemini/
│   └── prompts/
│       ├── personal-color.ts   # PC-1 프롬프트
│       ├── skin.ts             # S-1 프롬프트
│       ├── body.ts             # C-1 프롬프트
│       └── face.ts             # F-1 프롬프트
└── mock/
    ├── personal-color.ts       # PC-1 Mock
    ├── skin-analysis.ts        # S-1 Mock
    ├── body-analysis.ts        # C-1 Mock
    └── face-analysis.ts        # F-1 Mock
```

#### 1.4.2 타임아웃 및 재시도 설정

```typescript
// lib/gemini.ts
const TIMEOUT_MS = 30000; // 30초 타임아웃
const MAX_RETRIES = 2; // 최대 2회 재시도

export async function analyzeWithGemini<T>(
  input: AnalysisInput,
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = TIMEOUT_MS, retries = MAX_RETRIES } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await model.generateContent({
        contents: [
          /* ... */
        ],
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return parseResult<T>(result);
    } catch (error) {
      if (attempt === retries) {
        console.error('[Gemini] All retries failed:', error);
        throw error;
      }
      console.warn(`[Gemini] Retry ${attempt + 1}/${retries}`);
    }
  }
}
```

#### 1.4.3 Mock Fallback 패턴 (필수)

```typescript
// 모든 AI 분석 함수에 적용
export async function analyzeSkin(input: SkinInput): Promise<SkinResult> {
  try {
    return await analyzeWithGemini<SkinResult>(input);
  } catch (error) {
    console.error('[S-1] Gemini error, falling back to mock:', error);
    return generateMockSkinResult(input);
  }
}
```

---

### 1.5 Medium: 상태 관리

#### 1.5.1 Zustand 스토어 목록

```
lib/stores/
├── sessionStore.ts             # 세션 상태
├── compareStore.ts             # 제품 비교
├── recentlyViewedStore.ts      # 최근 본 항목
├── favoritesStore.ts           # 즐겨찾기
├── productFilterStore.ts       # 제품 필터
└── workoutSessionStore.ts      # 운동 세션
```

#### 1.5.2 Zustand 잠재적 문제 패턴

```typescript
// ❌ 메모리 누수 위험: 구독 해제 누락
useEffect(() => {
  const unsubscribe = useStore.subscribe(handler);
  // return unsubscribe; // 누락!
}, []);

// ✅ 올바른 패턴
useEffect(() => {
  const unsubscribe = useStore.subscribe(handler);
  return () => unsubscribe();
}, []);
```

#### 1.5.3 Zustand 리렌더링 최적화

```typescript
// ❌ 전체 스토어 구독 (불필요한 리렌더링)
const store = useStore();

// ✅ 필요한 필드만 선택
const count = useStore((state) => state.count);
const { increment, decrement } = useStore((state) => ({
  increment: state.increment,
  decrement: state.decrement,
}));
```

#### 1.5.4 폼 상태 관리 (React Hook Form + Zod)

**현재 구현 현황**:

```
다단계 폼:
├── 온보딩 (onboarding/*) - Zustand 사용
├── 분석 폼 (analysis/*) - React Hook Form + Zod
├── 설정 폼 (settings/*) - React Hook Form + Zod
└── 피드백 폼 (feedback) - React Hook Form
```

**Zod 스키마 정의 패턴**:

```typescript
// lib/schemas/analysis.ts
import { z } from 'zod';

export const skinAnalysisInputSchema = z.object({
  skinType: z.enum(['oily', 'dry', 'combination', 'normal']),
  concerns: z.array(z.string()).min(1, '최소 1개 고민을 선택하세요'),
  age: z.number().min(10).max(100),
  image: z.instanceof(File).optional(),
});

export type SkinAnalysisInput = z.infer<typeof skinAnalysisInputSchema>;
```

**React Hook Form 표준 패턴**:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { skinAnalysisInputSchema, type SkinAnalysisInput } from '@/lib/schemas/analysis';

export function SkinAnalysisForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<SkinAnalysisInput>({
    resolver: zodResolver(skinAnalysisInputSchema),
    defaultValues: {
      skinType: 'combination',
      concerns: [],
      age: 25,
    },
  });

  const onSubmit = async (data: SkinAnalysisInput) => {
    try {
      await analyzeSkin(data);
      reset();
    } catch (error) {
      console.error('[Form] Submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="skinType">피부 타입</Label>
        <Select {...register('skinType')}>
          <option value="oily">지성</option>
          <option value="dry">건성</option>
          <option value="combination">복합성</option>
          <option value="normal">중성</option>
        </Select>
        {errors.skinType && (
          <p role="alert" className="text-destructive">
            {errors.skinType.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '분석 중...' : '분석하기'}
      </Button>
    </form>
  );
}
```

**폼 검증 에러 처리**:

```typescript
// ✅ 사용자 친화적 에러 메시지
const errorMessages = {
  skinType: {
    invalid_enum_value: '유효한 피부 타입을 선택하세요',
  },
  concerns: {
    too_small: '최소 1개 고민을 선택하세요',
  },
  age: {
    too_small: '나이는 10세 이상이어야 해요',
    too_big: '나이는 100세 이하여야 해요',
  },
};

// Zod에서 커스텀 메시지 적용
const schema = z.object({
  age: z
    .number({
      invalid_type_error: '숫자를 입력하세요',
    })
    .min(10, { message: '나이는 10세 이상이어야 해요' })
    .max(100, { message: '나이는 100세 이하여야 해요' }),
});
```

**다단계 폼 (Wizard)**:

```typescript
// Zustand로 다단계 폼 상태 관리
// lib/stores/onboardingStore.ts
interface OnboardingStore {
  step: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  updateData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),
  reset: () => set({ step: 1, data: {} }),
}));
```

**폼 상태 관리 선택 기준**:
| 상황 | 권장 도구 | 이유 |
|------|----------|------|
| 단일 폼 (1페이지) | React Hook Form + Zod | 검증 + 타입 안전성 |
| 다단계 폼 (Wizard) | Zustand + RHF | 페이지 간 상태 유지 |
| 간단한 입력 (1-2 필드) | useState | 오버헤드 최소화 |
| 서버 상태 동기화 | React Query + RHF | 캐싱 + 낙관적 업데이트 |

---

### 1.6 Medium: 빌드/배포 진단

#### 1.6.1 TypeScript 빌드 에러 패턴

**흔한 에러**:

```
Type error: Cannot find module '@/components/...' or its corresponding type declarations.
```

**해결**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 1.6.2 순환 참조 감지

```bash
# 순환 참조 감지 명령
npx madge --circular --extensions ts,tsx apps/web/

# 결과 예시
Circular dependency found:
  lib/stores/sessionStore.ts → lib/api/user.ts → lib/stores/sessionStore.ts
```

**해결 전략**:

1. 의존성 방향 분석
2. 공통 타입을 별도 파일로 분리
3. 동적 import 사용

#### 1.6.3 빌드 성공 체크리스트

```
☐ npm run typecheck     # 타입 에러 없음
☐ npm run lint          # 린트 경고 해결
☐ npm run build         # 빌드 성공
☐ npm run test          # 테스트 통과
```

---

### 1.7 High: UI/UX 깨짐 패턴

#### 1.2.1 하드코딩 색상 문제

**발견된 위치 (40+ 컴포넌트)**:

```typescript
// ❌ 위험: 하드코딩 색상
// components/workout/result/WorkoutInsightCard.tsx
const INSIGHT_TYPE_STYLES = {
  balance: { bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  progress: { bgColor: 'bg-green-50', iconColor: 'text-green-500' },
  strength: { bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
};

// ✅ 수정: 모듈 색상 사용
const INSIGHT_TYPE_STYLES = {
  balance: { bgColor: 'bg-module-body-light', iconColor: 'text-module-body' },
  progress: { bgColor: 'bg-module-nutrition-light', iconColor: 'text-module-nutrition' },
  strength: { bgColor: 'bg-module-workout-light', iconColor: 'text-module-workout' },
};
```

**영향받는 컴포넌트 목록**:
| 카테고리 | 파일 | 문제 |
|---------|------|------|
| 운동 | WorkoutInsightCard.tsx | bg-blue-50, bg-green-50 |
| 영양 | SkinInsightCard.tsx | 일부 하드코딩 |
| 제품 | ProductCard.tsx | hover 색상 |
| 분석 | ScoreChangeBadge.tsx | 점수 색상 |
| 공통 | LevelBadge.tsx | 레벨 색상 |

#### 1.2.2 다크모드 대비 부족

**문제 패턴**:

```css
/* ❌ 다크모드에서 텍스트 안 보임 */
.glass-card {
  background: oklch(0.98 0.005 270 / 20%); /* 20% 투명도 */
}

/* ✅ 다크모드 대비 개선 */
.glass-card {
  background: oklch(0.98 0.005 270 / 40%);
}
.dark .glass-card {
  background: oklch(0.15 0.02 270 / 50%);
}
```

**검증 필요 컴포넌트**:

- GlassCard (components/ui/glass-card.tsx)
- 모든 Insight 카드
- 분석 결과 오버레이

#### 1.2.3 동적 클래스명 문제

**문제**:

```typescript
// ❌ Tailwind가 이 클래스를 빌드에서 제거할 수 있음
const bgClass = `bg-${colorName}-50`;

// ✅ 안전: 전체 클래스명 사용
const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
};
const bgClass = COLOR_MAP[colorName];
```

---

### 1.3 Medium: 스키마 문서 불일치

**현황**: DATABASE-SCHEMA.md가 실제 마이그레이션과 **40% 불일치**

**미문서화 테이블 (20개)**:

```
workout_analyses, workout_plans, workout_logs, workout_streaks,
user_preferences, user_agreements, user_challenges, image_consents,
push_subscriptions, affiliate_products, skin_diary_entries,
nutrition_streaks, smart_notifications, makeup_analyses,
user_size_history, user_shopping_preferences, price_watches,
hair_analyses, mental_health_logs, product_shelf
```

**해결 방안**:

```bash
# 자동 스키마 추출 스크립트 생성
npx supabase db dump --schema public > schema_dump.sql

# 또는 마이그레이션 파일에서 추출
grep -h "CREATE TABLE" supabase/migrations/*.sql | sort -u
```

---

### 1.4 Low: 미구현 UI Gap 목록

| Gap ID | 기능                           | 현재 상태              | 영향                  |
| ------ | ------------------------------ | ---------------------- | --------------------- |
| Gap-1  | DrapingSimulationTab PC-1 연결 | 컴포넌트 있음, 미연결  | 사용자 기능 미노출    |
| Gap-2  | ingredientWarnings 표시        | 데이터 있음, UI 비활성 | 성분 경고 미표시      |
| Gap-3  | PhotoOverlayMap, TrendChart    | import됨, 미렌더링     | 시각화 미제공         |
| Gap-4  | S-1, C-1 드레이핑 연동         | 미구현                 | 크로스 모듈 기능 없음 |

---

## Part 2: UI/UX 통합 전략

### 2.1 색상 마이그레이션 계획

#### Phase 1: 디자인 토큰 확립 (완료)

```css
/* globals.css - 이미 구현됨 */
:root {
  /* 모듈별 색상 */
  --module-workout: oklch(0.85 0.15 45);
  --module-nutrition: oklch(0.75 0.15 150);
  --module-skin: oklch(0.80 0.12 350);
  --module-body: oklch(0.75 0.15 250);
  --module-personal-color: oklch(0.70 0.18 300);
  --module-face: oklch(0.75 0.16 30);

  /* 전문성 색상 */
  --professional-primary: oklch(0.45 0.12 220);
  --professional-accent: oklch(0.60 0.10 180);

  /* Monk Scale 스킨톤 */
  --skin-tone-1 ~ --skin-tone-10
}
```

#### Phase 2: 컴포넌트 마이그레이션 (진행 필요)

**우선순위 1 (P0) - 영향도 높음**:

```
컴포넌트                           변경 내용
─────────────────────────────────────────────────
WorkoutInsightCard.tsx            bg-blue-50 → bg-module-body-light
                                  bg-green-50 → bg-module-nutrition-light
                                  bg-orange-50 → bg-module-workout-light

ProductCard.tsx                   hover 색상 → module 변수
ScoreChangeBadge.tsx              점수 색상 → status 변수
LevelBadge.tsx                    레벨 색상 → module 변수
```

**우선순위 2 (P1) - 영향도 중간**:

```
컴포넌트                           변경 내용
─────────────────────────────────────────────────
PartnerRevenueChart.tsx           동적 색상 → 상수 매핑
CalorieProgressRing.tsx           색상 merge → useMemo 최적화
glass-card.tsx                    투명도 조정 (다크모드)
```

#### Phase 3: 다크모드 완성 (진행 필요)

**체크리스트**:

```
☐ 모든 bg-* 클래스에 dark: variant 추가
☐ glass-card 투명도 40%로 증가
☐ 텍스트 대비 4.5:1 이상 검증
☐ 스켈레톤 로딩 색상 모듈화
```

### 2.2 레이아웃 깨짐 상세

#### 2.2.1 z-index 관리

**현재 문제**: z-index 값이 컴포넌트별로 산발적으로 정의됨

**z-index 스케일 표준화**:

```css
/* globals.css - z-index 시스템 */
:root {
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
  --z-toast: 600;
}
```

**문제 컴포넌트**:
| 컴포넌트 | 현재 z-index | 권장 z-index | 문제 |
|---------|-------------|-------------|------|
| BottomNav | 50 | 100 (sticky) | 드롭다운과 겹침 |
| Modal | 9999 | 300 | 과도한 값 |
| Toast | 1000 | 600 | 모달 위에 표시 안 됨 |

#### 2.2.2 반응형 브레이크포인트

**현재 정의** (Tailwind 기본):

```
sm: 640px   # 모바일 가로
md: 768px   # 태블릿
lg: 1024px  # 데스크탑
xl: 1280px  # 와이드 데스크탑
```

**깨짐 패턴**:

```tsx
// ❌ 브레이크포인트 누락으로 중간 크기에서 깨짐
<div className="grid grid-cols-1 lg:grid-cols-3">

// ✅ 중간 단계 추가
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**점검 대상 페이지**:

- `/analysis/*` - 결과 카드 그리드
- `/products/*` - 제품 목록 그리드
- `/dashboard` - 위젯 레이아웃
- `/profile` - 정보 카드 배치

#### 2.2.3 스크롤 및 오버플로우 문제

```tsx
// ❌ 모바일에서 가로 스크롤 발생
<div className="flex gap-4">
  {items.map(item => <Card className="w-[300px]" />)}
</div>

// ✅ 오버플로우 제어
<div className="flex gap-4 overflow-x-auto scrollbar-hide">
  {items.map(item => <Card className="w-[300px] flex-shrink-0" />)}
</div>
```

---

### 2.3 페이지별 UI 상태 현황

#### 2.3.1 분석 페이지 (analysis/)

| 페이지                   | 상태    | 이슈                           |
| ------------------------ | ------- | ------------------------------ |
| /analysis                | ✅ 완료 | 디자인 토큰 적용 완료          |
| /analysis/personal-color | ⚠️ 부분 | 결과 페이지 드레이핑 탭 미연결 |
| /analysis/skin           | ⚠️ 부분 | PhotoOverlayMap 미렌더링       |
| /analysis/body           | ⚠️ 부분 | TrendChart 미렌더링            |
| /analysis/face           | 🔴 신규 | F-1 구현 필요                  |

#### 2.3.2 운동 페이지 (workout/)

| 페이지           | 상태    | 이슈               |
| ---------------- | ------- | ------------------ |
| /workout         | ✅ 완료 | -                  |
| /workout/session | ✅ 완료 | -                  |
| /workout/history | ⚠️ 부분 | 차트 색상 하드코딩 |
| /workout/plan    | ✅ 완료 | -                  |

#### 2.3.3 영양 페이지 (nutrition/)

| 페이지                  | 상태    | 이슈                    |
| ----------------------- | ------- | ----------------------- |
| /nutrition              | ✅ 완료 | -                       |
| /nutrition/dashboard    | ⚠️ 부분 | 칼로리 링 색상 하드코딩 |
| /nutrition/food-capture | ✅ 완료 | -                       |

#### 2.3.4 제품 페이지 (products/)

| 페이지         | 상태    | 이슈                      |
| -------------- | ------- | ------------------------- |
| /products      | ⚠️ 부분 | 필터 색상 하드코딩        |
| /products/[id] | ⚠️ 부분 | ingredientWarnings 미표시 |
| /beauty/\*     | ⚠️ 부분 | 카테고리 색상 하드코딩    |

---

### 2.4 컴포넌트 통합 계획

#### 2.2.1 공통 컴포넌트 추출

**현재 중복**:

```
운동 모듈: WorkoutInsightCard
영양 모듈: SkinInsightCard, WorkoutInsightCard (중복!)
제품 모듈: ProductInsightCard
```

**통합 설계**:

```typescript
// components/common/ModuleInsightCard.tsx (신규)
interface ModuleInsightCardProps {
  module: 'workout' | 'nutrition' | 'skin' | 'body' | 'personal-color' | 'face';
  insightType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ModuleInsightCard({ module, ...props }: ModuleInsightCardProps) {
  return (
    <div className={cn(
      'rounded-xl p-4',
      `bg-module-${module}-light`,
      `border border-module-${module}/20`,
      `dark:bg-module-${module}/20`
    )}>
      {/* ... */}
    </div>
  );
}
```

#### 2.2.2 분석 결과 컴포넌트 표준화

**현재 구조**:

```
analysis/
├── skin/AnalysisResult.tsx      # 피부 전용
├── body/AnalysisResult.tsx      # 체형 전용 (다른 구조)
├── personal-color/              # 퍼스널컬러 (또 다른 구조)
└── face/                        # 신규 (구조 미정)
```

**통합 설계**:

```typescript
// components/analysis/common/AnalysisResultLayout.tsx (신규)
interface AnalysisResultLayoutProps {
  module: AnalysisModule;
  header: React.ReactNode;
  mainContent: React.ReactNode;
  recommendations: React.ReactNode;
  actions: React.ReactNode;
}

export function AnalysisResultLayout(props: AnalysisResultLayoutProps) {
  return (
    <div className="space-y-6">
      <AnalysisHeader module={props.module} />
      <AnalysisMainContent>{props.mainContent}</AnalysisMainContent>
      <AnalysisRecommendations>{props.recommendations}</AnalysisRecommendations>
      <AnalysisActions>{props.actions}</AnalysisActions>
    </div>
  );
}
```

---

## Part 3: 다국어(i18n) 지원 전략

### 3.1 현황 분석

| 플랫폼    | 라이브러리      | 상태           |
| --------- | --------------- | -------------- |
| 웹 앱     | next-intl 4.6.1 | 설치됨, 미사용 |
| 모바일 앱 | 커스텀 i18n     | 구현됨, 운영중 |

**문제점**:

- 웹: useTranslations() Hook 미사용
- 500+ UI 텍스트가 한국어로 하드코딩
- ja.json, zh.json 번역 불완전

### 3.2 하드코딩 텍스트 현황

**심각도 높음 (즉시 수정 필요)**:

```typescript
// app/(main)/home/page.tsx
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'; // ❌
  if (hour >= 12 && hour < 18) return '좋은 오후예요'; // ❌
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요'; // ❌
  return '좋은 밤이에요'; // ❌
}

const userName = user?.firstName || user?.username || '회원'; // ❌
```

**심각도 중간 (Phase 2에서 수정)**:

```typescript
// app/layout.tsx - 메타데이터
export const metadata: Metadata = {
  title: { default: '이룸 - 온전한 나는?', template: '%s | 이룸' }, // ❌
  description: 'AI 퍼스널 컬러, 피부, 체형 분석...', // ❌
};
```

### 3.3 마이그레이션 계획

#### Phase 1: 인프라 활성화 (1주)

```typescript
// 1. messages/ko.json 확장
{
  "home": {
    "greeting": {
      "morning": "좋은 아침이에요",
      "afternoon": "좋은 오후예요",
      "evening": "좋은 저녁이에요",
      "night": "좋은 밤이에요"
    },
    "defaultUserName": "회원"
  },
  "analysis": {
    "personalColor": {
      "title": "퍼스널 컬러",
      "description": "나에게 어울리는 컬러를 찾아보세요"
    },
    "face": {
      "title": "얼굴형 분석",
      "description": "얼굴형과 이목구비를 정밀 분석해요"
    }
  }
}

// 2. 컴포넌트에서 사용
'use client';
import { useTranslations } from 'next-intl';

export function HomePage() {
  const t = useTranslations('home');

  function getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting.morning');
    if (hour >= 12 && hour < 18) return t('greeting.afternoon');
    if (hour >= 18 && hour < 22) return t('greeting.evening');
    return t('greeting.night');
  }

  return <h1>{getTimeGreeting()}, {userName || t('defaultUserName')}님</h1>;
}
```

#### Phase 2: 핵심 페이지 이관 (2주)

```
우선순위:
1. 홈 페이지 (home/page.tsx)
2. 분석 허브 (analysis/page.tsx)
3. 프로필 페이지 (profile/page.tsx)
4. 설정 페이지 (settings/*)
5. 분석 결과 페이지들
```

#### Phase 3: 전체 이관 + 신규 언어 (4주)

```
1. 모든 컴포넌트 텍스트 이관
2. 영어(en) 번역 완성
3. 일본어(ja), 중국어(zh) 완성 또는 제거 결정
4. 언어 선택 UI 구현 (설정 페이지)
```

### 3.4 웹-모바일 동기화 전략

**옵션 A: 별도 관리 (현재)**

```
웹: messages/*.json (next-intl)
모바일: lib/i18n/locales/*.ts (커스텀)
장점: 플랫폼별 최적화
단점: 번역 중복, 동기화 어려움
```

**옵션 B: 공유 패키지 (권장)**

```
packages/shared/
└── i18n/
    ├── ko.json
    ├── en.json
    └── index.ts (타입 + 유틸리티)

웹: packages/shared/i18n 참조
모바일: packages/shared/i18n 참조 + 어댑터
장점: 단일 소스 관리
단점: 초기 설정 복잡
```

### 3.5 packages/shared 상세 스펙

**목적**: 웹/모바일 앱 간 코드 재사용을 위한 공유 패키지

#### 3.5.1 디렉토리 구조

```
packages/shared/
├── package.json           # 패키지 설정
├── tsconfig.json          # TypeScript 설정
├── src/
│   ├── index.ts           # 메인 export
│   │
│   ├── types/             # 공유 타입 정의
│   │   ├── index.ts
│   │   ├── user.ts        # User, UserProfile
│   │   ├── analysis.ts    # AnalysisResult, SeasonType, SkinType
│   │   ├── workout.ts     # WorkoutPlan, WorkoutLog
│   │   ├── nutrition.ts   # MealRecord, NutritionSummary
│   │   └── products.ts    # Product, Review
│   │
│   ├── constants/         # 공유 상수
│   │   ├── index.ts
│   │   ├── analysis.ts    # SEASON_TYPES, SKIN_TYPES
│   │   ├── colors.ts      # BEST_COLORS, WORST_COLORS
│   │   └── workout.ts     # EXERCISE_CATEGORIES
│   │
│   ├── utils/             # 공유 유틸리티
│   │   ├── index.ts
│   │   ├── date.ts        # formatDate, getRelativeTime
│   │   ├── number.ts      # formatNumber, calculatePercentage
│   │   ├── validation.ts  # isValidEmail, isValidPhone
│   │   └── scoring.ts     # calculateWellnessScore
│   │
│   ├── i18n/              # 다국어 리소스
│   │   ├── index.ts       # createTranslator
│   │   ├── ko.json        # 한국어
│   │   └── en.json        # 영어
│   │
│   └── schemas/           # Zod 스키마 (폼 검증)
│       ├── index.ts
│       ├── user.ts        # userProfileSchema
│       └── analysis.ts    # analysisInputSchema
│
└── __tests__/             # 단위 테스트
    ├── utils.test.ts
    └── schemas.test.ts
```

#### 3.5.2 package.json 설정

```json
{
  "name": "@yiroom/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./constants": "./src/constants/index.ts",
    "./utils": "./src/utils/index.ts",
    "./i18n": "./src/i18n/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "peerDependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

#### 3.5.3 주요 타입 정의

```typescript
// packages/shared/src/types/analysis.ts

/** 퍼스널 컬러 시즌 타입 */
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type SubSeasonType =
  | 'spring_warm'
  | 'spring_light'
  | 'spring_bright'
  | 'summer_light'
  | 'summer_muted'
  | 'summer_cool'
  | 'autumn_muted'
  | 'autumn_warm'
  | 'autumn_deep'
  | 'winter_cool'
  | 'winter_deep'
  | 'winter_bright';

/** 피부 타입 */
export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

/** 체형 타입 */
export type BodyType = 'inverted_triangle' | 'triangle' | 'rectangle' | 'hourglass' | 'oval';

/** 분석 결과 공통 인터페이스 */
export interface BaseAnalysisResult {
  id: string;
  clerkUserId: string;
  confidence: number; // 0-100
  analysisReliability: 'high' | 'medium' | 'low';
  createdAt: Date;
}

/** 퍼스널 컬러 분석 결과 */
export interface PersonalColorResult extends BaseAnalysisResult {
  type: 'personal_color';
  seasonType: SeasonType;
  subSeasonType?: SubSeasonType;
  undertone: 'warm' | 'cool' | 'neutral';
}

/** 피부 분석 결과 */
export interface SkinAnalysisResult extends BaseAnalysisResult {
  type: 'skin';
  skinType: SkinType;
  overallScore: number;
  metrics: {
    hydration: number;
    oiliness: number;
    pores: number;
    wrinkles: number;
    spots: number;
  };
}
```

#### 3.5.4 공유 유틸리티 예시

```typescript
// packages/shared/src/utils/date.ts

/**
 * 날짜를 상대적 시간으로 포맷 (방금, 1시간 전, 어제 등)
 */
export function getRelativeTime(date: Date, locale: 'ko' | 'en' = 'ko'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const messages = {
    ko: {
      justNow: '방금',
      minutesAgo: (n: number) => `${n}분 전`,
      hoursAgo: (n: number) => `${n}시간 전`,
      yesterday: '어제',
      daysAgo: (n: number) => `${n}일 전`,
    },
    en: {
      justNow: 'Just now',
      minutesAgo: (n: number) => `${n} minutes ago`,
      hoursAgo: (n: number) => `${n} hours ago`,
      yesterday: 'Yesterday',
      daysAgo: (n: number) => `${n} days ago`,
    },
  };

  const msg = messages[locale];

  if (diffSec < 60) return msg.justNow;
  if (diffMin < 60) return msg.minutesAgo(diffMin);
  if (diffHour < 24) return msg.hoursAgo(diffHour);
  if (diffDay === 1) return msg.yesterday;
  return msg.daysAgo(diffDay);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

#### 3.5.5 앱에서 사용 예시

```typescript
// apps/web/components/SomeComponent.tsx
import type { PersonalColorResult, SeasonType } from '@yiroom/shared/types';
import { getRelativeTime, formatDate } from '@yiroom/shared/utils';
import { SEASON_TYPES } from '@yiroom/shared/constants';

// apps/mobile/components/SomeComponent.tsx
import type { SkinAnalysisResult } from '@yiroom/shared/types';
import { calculateWellnessScore } from '@yiroom/shared/utils';
```

#### 3.5.6 마이그레이션 계획

```
Phase 1: 패키지 초기화 (1일)
☐ packages/shared/ 디렉토리 생성
☐ package.json, tsconfig.json 설정
☐ 빌드 테스트

Phase 2: 타입 이관 (2일)
☐ apps/web/types/*.ts → packages/shared/src/types/
☐ apps/mobile/types/*.ts 통합
☐ 중복 타입 정리

Phase 3: 유틸리티 이관 (2일)
☐ 공통 유틸리티 함수 추출
☐ 플랫폼 독립적 함수만 이관
☐ 테스트 작성

Phase 4: 앱 참조 변경 (1일)
☐ apps/web import 경로 변경
☐ apps/mobile import 경로 변경
☐ 빌드 검증
```

---

## Part 4: 모듈간 연동 아키텍처

### 4.1 현재 모듈 의존성 그래프

```
┌─────────────────────────────────────────────────────────────┐
│                     분석 모듈 의존성                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                                │
│  │  PC-1   │ ───────────────────────────────────────┐      │
│  │퍼스널컬러│                                         │      │
│  └────┬────┘                                         │      │
│       │                                              │      │
│       │ face_image_url                               │      │
│       │ season, undertone                            │      │
│       ▼                                              ▼      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐   ┌─────────┐ │
│  │  F-1    │     │  S-1    │     │  C-1    │   │ Makeup  │ │
│  │ 얼굴형  │     │  피부   │     │  체형   │   │ 메이크업│ │
│  └─────────┘     └────┬────┘     └────┬────┘   └─────────┘ │
│       │               │               │                    │
│       │               │               │                    │
│       └───────────────┴───────────────┘                    │
│                       │                                     │
│                       ▼                                     │
│               ┌─────────────┐                              │
│               │  IC-1 통합   │                              │
│               │  대시보드    │                              │
│               └─────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 이미지 재사용 흐름

```typescript
// PC-1 분석 완료 시 이미지 저장
interface PersonalColorAssessment {
  id: string;
  face_image_url: string; // 정면 이미지 (필수)
  left_image_url?: string; // 좌측 이미지 (선택)
  right_image_url?: string; // 우측 이미지 (선택)
  wrist_image_url?: string; // 손목 이미지 (선택) ← 추가 필요
}

// F-1, S-1에서 PC-1 이미지 재사용
interface FaceAnalysisRequest {
  imageUrl?: string; // 새 이미지
  reuseFromPcId?: string; // PC-1 이미지 재사용
}
```

### 4.3 크로스 모듈 데이터 조회

```typescript
// lib/analysis/cross-module.ts (신규)

/**
 * 사용자의 최신 PC-1 결과 조회 (S-1, C-1, F-1에서 사용)
 */
export async function getLatestPersonalColorResult(
  supabase: SupabaseClient,
  userId: string
): Promise<PersonalColorAssessment | null> {
  const { data } = await supabase
    .from('personal_color_assessments')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * 통합 분석 진행률 계산
 */
export async function getAnalysisProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisProgress> {
  const [pc, face, skin, body] = await Promise.all([
    supabase.from('personal_color_assessments').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('face_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('skin_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('body_analyses').select('id').eq('clerk_user_id', userId).limit(1),
  ]);

  return {
    personalColor: !!pc.data?.length,
    face: !!face.data?.length,
    skin: !!skin.data?.length,
    body: !!body.data?.length,
    completedCount: [pc, face, skin, body].filter((r) => r.data?.length).length,
    totalCount: 4,
    percentage: ([pc, face, skin, body].filter((r) => r.data?.length).length / 4) * 100,
  };
}
```

### 4.4 드레이핑 연동 구현

```typescript
// S-1, C-1 결과 페이지에서 드레이핑 탭 추가

// app/(main)/analysis/skin/result/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { DrapingSimulationTab } from '@/components/analysis/visual';
import { getLatestPersonalColorResult } from '@/lib/analysis/cross-module';

export default function SkinResultPage() {
  const [pcResult, setPcResult] = useState<PersonalColorAssessment | null>(null);

  useEffect(() => {
    async function loadPcResult() {
      const result = await getLatestPersonalColorResult(supabase, userId);
      setPcResult(result);
    }
    loadPcResult();
  }, [userId]);

  return (
    <Tabs defaultValue="result">
      <TabsList>
        <TabsTrigger value="result">분석 결과</TabsTrigger>
        <TabsTrigger value="recommendations">추천</TabsTrigger>
        {pcResult && <TabsTrigger value="draping">드레이핑</TabsTrigger>}
      </TabsList>

      {/* ... 기존 탭 콘텐츠 ... */}

      {pcResult && (
        <TabsContent value="draping">
          <DrapingSimulationTab
            seasonType={pcResult.season}
            userImageUrl={pcResult.face_image_url}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
```

---

## Part 5: 데이터베이스 마이그레이션 전략

### 5.1 마이그레이션 순서

```
현재 마이그레이션 (26개):
supabase/migrations/
├── 2025-12-* (기본 테이블들)
├── 20260108_analysis_tables.sql
├── 20260109_users_pc_columns.sql
├── 20260113_pc_multi_angle_columns.sql  ← PC-1 다각도
├── 20260113_skin_diary.sql
├── 20260113_photo_reuse_system.sql
├── 20260114_face_analyses_global.sql    ← F-1 (신규)
└── 20260114_user_ui_preferences.sql     ← 접근성 (신규)

추가 필요:
├── 20260115_wrist_image_column.sql      ← 손목 이미지 저장
├── 20260116_ingredients.sql             ← 성분 DB
└── 20260117_analysis_cross_links.sql    ← 모듈간 연결 테이블
```

### 5.2 손목 이미지 컬럼 추가 (누락분)

```sql
-- supabase/migrations/20260115_wrist_image_column.sql

-- Migration: PC-1 손목 이미지 URL 추가
-- Purpose: API에서 손목 이미지 분석하지만 저장하지 않는 문제 해결
-- Date: 2026-01-15

ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS wrist_image_url TEXT;

COMMENT ON COLUMN personal_color_assessments.wrist_image_url
  IS '손목 이미지 URL (혈관 색상 분석용, 다각도 분석 시 사용)';
```

### 5.3 모듈간 연결 테이블

```sql
-- supabase/migrations/20260117_analysis_cross_links.sql

-- Migration: 분석 모듈간 연결 테이블
-- Purpose: PC-1 ↔ S-1 ↔ C-1 ↔ F-1 크로스 참조
-- Date: 2026-01-17

CREATE TABLE IF NOT EXISTS analysis_cross_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 소스 분석
  source_type TEXT NOT NULL CHECK (source_type IN
    ('personal_color', 'face', 'skin', 'body')),
  source_id UUID NOT NULL,

  -- 타겟 분석 (이미지 재사용 대상)
  target_type TEXT NOT NULL CHECK (target_type IN
    ('personal_color', 'face', 'skin', 'body')),
  target_id UUID NOT NULL,

  -- 연결 유형
  link_type TEXT NOT NULL CHECK (link_type IN
    ('image_reuse',     -- 이미지 재사용
     'draping_source',  -- 드레이핑 소스
     'recommendation'   -- 추천 기반
    )),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT analysis_cross_links_user_fkey
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
);

-- 인덱스
CREATE INDEX idx_cross_links_user ON analysis_cross_links(clerk_user_id);
CREATE INDEX idx_cross_links_source ON analysis_cross_links(source_type, source_id);
CREATE INDEX idx_cross_links_target ON analysis_cross_links(target_type, target_id);

-- RLS
ALTER TABLE analysis_cross_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cross links"
  ON analysis_cross_links FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

---

## Part 6: 구현 체크리스트 (Phase별)

### Phase 0: 긴급 수정 (1-2일)

```
☐ P0-1: wrist_image_url 마이그레이션 생성 및 적용
  파일: supabase/migrations/20260115_wrist_image_column.sql
  명령: npx supabase db push

☐ P0-2: API에서 손목 이미지 저장 로직 추가
  파일: app/api/analyze/personal-color/route.ts
  변경: wrist_image_url 필드 insert에 추가

☐ P0-3: Gap-1 수정 (DrapingSimulationTab 연결)
  파일: app/(main)/analysis/personal-color/result/[id]/page.tsx
  변경: 탭에 DrapingSimulationTab 추가

☐ P0-4: .env.example 파일 생성
  파일: apps/web/.env.example
  내용: 필수/서버전용/선택 환경변수 분류 포함

☐ P0-5: 환경변수 검증 스크립트 추가
  파일: apps/web/scripts/check-env.js
  연동: package.json preflight 스크립트에 통합
```

### Phase 1: UI/UX 통합 (1주)

```
☐ P1-1: 하드코딩 색상 마이그레이션
  대상: WorkoutInsightCard, ProductCard, ScoreChangeBadge 등
  변경: bg-blue-50 → bg-module-body-light

☐ P1-2: 다크모드 대비 개선
  대상: glass-card.tsx, insight 카드들
  변경: 투명도 조정, dark: variant 추가

☐ P1-3: Gap-2, Gap-3, Gap-4 수정
  대상: S-1, C-1 결과 페이지
  변경: PhotoOverlayMap, TrendChart, 드레이핑 탭 연결
```

### Phase 2: 다국어 기초 (2주)

```
☐ P2-1: messages/*.json 확장
  대상: ko.json, en.json
  추가: home, analysis, profile, settings 키

☐ P2-2: 핵심 페이지 useTranslations 적용
  대상: home/page.tsx, analysis/page.tsx
  변경: 하드코딩 텍스트 → t() 함수

☐ P2-3: 메타데이터 다국어 지원
  대상: app/layout.tsx
  변경: generateMetadata 함수 사용
```

### Phase 3: 모듈 연동 (2주)

```
☐ P3-1: cross-module 유틸리티 생성
  파일: lib/analysis/cross-module.ts
  기능: getLatestPersonalColorResult, getAnalysisProgress

☐ P3-2: F-1 얼굴형 분석 페이지 구현
  파일: app/(main)/analysis/face/*
  포함: 촬영, 결과, 히스토리 페이지

☐ P3-3: IC-1 통합 대시보드 설계
  파일: app/(main)/analysis/integrated/*
  기능: 모든 분석 결과 종합 뷰
```

### Phase 4: 고도화 (3주+)

```
☐ P4-1: 성분 DB 구축 (500+ 성분)
  파일: supabase/migrations/20260116_ingredients.sql
  시딩: supabase/seed/ingredients.sql

☐ P4-2: 전체 텍스트 다국어 이관
  대상: 모든 컴포넌트
  목표: 하드코딩 텍스트 0

☐ P4-3: 공유 i18n 패키지 (선택)
  위치: packages/shared/i18n
  목표: 웹-모바일 번역 통합

☐ P4-4: DATABASE-SCHEMA.md 동기화
  목표: 실제 마이그레이션과 100% 일치
```

---

## Part 7: 테스트 전략

### 7.1 변경 검증 체크리스트

```
모든 변경 후 필수 실행:

☐ npm run typecheck
☐ npm run lint
☐ npm run test
☐ npm run build (프로덕션 빌드 성공 확인)

UI 변경 시 추가:
☐ 다크모드 시각적 확인
☐ 모바일 반응형 확인
☐ Lighthouse 접근성 점수 확인 (90+ 유지)
```

### 7.2 회귀 테스트 대상

```
색상 마이그레이션 후:
☐ 모든 Insight 카드 렌더링 확인
☐ 다크모드 전환 테스트
☐ 호버/포커스 상태 확인

다국어 적용 후:
☐ 한국어 표시 정상
☐ 영어 전환 테스트
☐ 누락된 번역 키 없음 확인

모듈 연동 후:
☐ PC-1 → F-1 이미지 재사용 테스트
☐ 드레이핑 탭 표시 조건 확인
☐ 크로스 모듈 데이터 조회 성능
```

### 7.3 접근성 테스트 (신규)

#### 7.3.1 자동화 테스트 설정

```bash
# 접근성 테스트 라이브러리 설치
npm install jest-axe @axe-core/react --save-dev
```

```typescript
// tests/setup/a11y.ts
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

#### 7.3.2 컴포넌트 접근성 테스트 패턴

```typescript
// tests/a11y/components.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('접근성 테스트', () => {
  test('분석 결과 페이지', async () => {
    const { container } = render(<AnalysisResultPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('제품 카드', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('폼 컴포넌트', async () => {
    const { container } = render(<SkinAnalysisForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### 7.3.3 접근성 테스트 체크리스트

```
신규 컴포넌트 생성 시:
☐ jest-axe 테스트 추가
☐ 키보드 네비게이션 테스트
☐ 스크린 리더 테스트 (수동)

PR 리뷰 시:
☐ aria-* 속성 올바른 사용
☐ 시맨틱 HTML 사용
☐ 색상 대비 4.5:1 이상
```

#### 7.3.4 Lighthouse CI 설정

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.92 }],
        "categories:performance": ["warn", { "minScore": 0.75 }]
      }
    }
  }
}
```

### 7.4 E2E 테스트 시나리오 (Playwright)

#### 7.4.1 테스트 환경 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 7.4.2 Critical Path 시나리오

**시나리오 1: 퍼스널 컬러 분석 플로우 (PC-1)**

```typescript
// tests/e2e/personal-color-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('퍼스널 컬러 분석', () => {
  test.beforeEach(async ({ page }) => {
    // Clerk 테스트 사용자로 로그인
    await page.goto('/sign-in');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('이미지 업로드 → 분석 → 결과 확인', async ({ page }) => {
    // Step 1: 분석 페이지 진입
    await page.goto('/analysis/personal-color');
    await expect(page.getByTestId('personal-color-page')).toBeVisible();

    // Step 2: 조명 가이드 확인
    await expect(page.getByText('자연광 아래에서')).toBeVisible();
    await page.click('button:has-text("다음")');

    // Step 3: 이미지 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-face.jpg');
    await expect(page.getByTestId('image-preview')).toBeVisible();

    // Step 4: 분석 실행
    await page.click('button:has-text("분석하기")');

    // Step 5: 로딩 상태 확인
    await expect(page.getByTestId('loading-indicator')).toBeVisible();

    // Step 6: 결과 페이지 확인 (최대 30초 대기)
    await page.waitForURL(/\/analysis\/personal-color\/result\/.+/, { timeout: 30000 });
    await expect(page.getByTestId('season-result')).toBeVisible();
    await expect(page.getByTestId('best-colors')).toBeVisible();
  });

  test('PC-1 완료 후 이미지 재사용 옵션 표시', async ({ page }) => {
    // PC-1 완료된 사용자로
    await page.goto('/analysis/skin');

    // 이미지 재사용 옵션 확인
    await expect(page.getByText('이전 분석 이미지 사용')).toBeVisible();
  });
});
```

**시나리오 2: 피부 분석 플로우 (S-1)**

```typescript
// tests/e2e/skin-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('피부 분석', () => {
  test('다각도 이미지 업로드 플로우', async ({ page }) => {
    await page.goto('/analysis/skin');

    // 정면 이미지 업로드
    await page
      .locator('[data-testid="front-upload"]')
      .setInputFiles('./tests/fixtures/face-front.jpg');

    // 좌측 이미지 업로드 (선택)
    await page
      .locator('[data-testid="left-upload"]')
      .setInputFiles('./tests/fixtures/face-left.jpg');

    // 분석 실행
    await page.click('button:has-text("분석하기")');

    // 결과 확인
    await page.waitForURL(/\/analysis\/skin\/result\/.+/, { timeout: 30000 });
    await expect(page.getByTestId('skin-score')).toBeVisible();
    await expect(page.getByTestId('skin-metrics')).toBeVisible();
  });

  test('피부 다이어리 연동', async ({ page }) => {
    // 결과 페이지에서 다이어리 저장
    await page.goto('/analysis/skin/result/test-id');
    await page.click('button:has-text("다이어리에 저장")');

    // 다이어리 페이지로 이동 확인
    await page.waitForURL('/analysis/skin-diary');
    await expect(page.getByTestId('diary-entry')).toBeVisible();
  });
});
```

**시나리오 3: 운동 세션 플로우 (W-1)**

```typescript
// tests/e2e/workout-session.spec.ts
import { test, expect } from '@playwright/test';

test.describe('운동 세션', () => {
  test('운동 계획 선택 → 세션 시작 → 완료', async ({ page }) => {
    await page.goto('/workout');

    // 오늘의 운동 계획 선택
    await page.click('[data-testid="workout-plan-card"]:first-child');

    // 세션 시작
    await page.click('button:has-text("시작하기")');
    await expect(page.getByTestId('workout-timer')).toBeVisible();

    // 운동 완료 체크
    const exercises = page.locator('[data-testid="exercise-item"]');
    const count = await exercises.count();
    for (let i = 0; i < count; i++) {
      await exercises.nth(i).locator('button:has-text("완료")').click();
    }

    // 세션 완료
    await page.click('button:has-text("세션 완료")');

    // 결과 페이지 확인
    await expect(page.getByTestId('session-summary')).toBeVisible();
    await expect(page.getByTestId('calories-burned')).toBeVisible();
  });

  test('스트릭 업데이트 확인', async ({ page }) => {
    // 운동 완료 후 스트릭 증가 확인
    await page.goto('/workout');
    const streakBefore = await page.getByTestId('workout-streak').textContent();

    // 세션 완료 후
    await page.goto('/workout');
    const streakAfter = await page.getByTestId('workout-streak').textContent();

    // 스트릭이 유지되거나 증가
    expect(parseInt(streakAfter || '0')).toBeGreaterThanOrEqual(parseInt(streakBefore || '0'));
  });
});
```

**시나리오 4: 영양 기록 플로우 (N-1)**

```typescript
// tests/e2e/nutrition.spec.ts
import { test, expect } from '@playwright/test';

test.describe('영양 관리', () => {
  test('물 섭취 기록', async ({ page }) => {
    await page.goto('/nutrition');

    // 현재 물 섭취량 확인
    const initialWater = await page.getByTestId('water-intake').textContent();

    // 물 추가 (+250ml)
    await page.click('[data-testid="add-water-btn"]');
    await expect(page.getByTestId('water-intake')).not.toHaveText(initialWater!);
  });

  test('음식 촬영 → AI 인식 → 영양 기록', async ({ page }) => {
    await page.goto('/nutrition/food-capture');

    // 음식 이미지 업로드
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/food-sample.jpg');

    // AI 인식 대기
    await expect(page.getByTestId('food-recognition-result')).toBeVisible({ timeout: 15000 });

    // 영양 정보 확인 및 저장
    await expect(page.getByTestId('calories')).toBeVisible();
    await page.click('button:has-text("기록하기")');

    // 영양 대시보드 반영 확인
    await page.goto('/nutrition');
    await expect(page.getByTestId('today-calories')).not.toHaveText('0');
  });
});
```

#### 7.4.3 크로스 모듈 시나리오

```typescript
// tests/e2e/cross-module.spec.ts
import { test, expect } from '@playwright/test';

test.describe('크로스 모듈 연동', () => {
  test('PC-1 시즌 → 제품 추천 필터링', async ({ page }) => {
    // PC-1 결과가 있는 사용자
    await page.goto('/products/recommended');

    // 시즌별 필터 자동 적용 확인
    await expect(page.getByTestId('season-filter')).toHaveValue(/spring|summer|autumn|winter/);

    // 추천 제품에 시즌 태그 표시
    await expect(page.locator('[data-testid="product-card"]').first()).toContainText(
      /봄|여름|가을|겨울/
    );
  });

  test('통합 대시보드 분석 진행률', async ({ page }) => {
    await page.goto('/dashboard');

    // 분석 진행률 위젯 확인
    const progressWidget = page.getByTestId('analysis-progress');
    await expect(progressWidget).toBeVisible();

    // 완료/미완료 모듈 표시
    await expect(progressWidget).toContainText(/퍼스널 컬러|피부|체형|얼굴형/);
  });
});
```

#### 7.4.4 에러 핸들링 시나리오

```typescript
// tests/e2e/error-handling.spec.ts
import { test, expect } from '@playwright/test';

test.describe('에러 핸들링', () => {
  test('AI 분석 실패 시 Mock Fallback', async ({ page }) => {
    // AI API 실패 시뮬레이션 (환경변수로 제어)
    await page.goto('/analysis/skin?force_mock=true');

    // 이미지 업로드 및 분석
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face.jpg');
    await page.click('button:has-text("분석하기")');

    // Mock 결과로 정상 표시 확인
    await page.waitForURL(/\/result\/.+/, { timeout: 10000 });
    await expect(page.getByTestId('skin-score')).toBeVisible();

    // Mock 사용 알림 표시 (선택적)
    // await expect(page.getByText('샘플 데이터')).toBeVisible();
  });

  test('네트워크 오류 시 재시도 UI', async ({ page }) => {
    // 오프라인 시뮬레이션
    await page.context().setOffline(true);

    await page.goto('/analysis/personal-color');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face.jpg');
    await page.click('button:has-text("분석하기")');

    // 재시도 버튼 표시
    await expect(page.getByText('다시 시도')).toBeVisible({ timeout: 10000 });

    // 온라인 복구
    await page.context().setOffline(false);
    await page.click('button:has-text("다시 시도")');

    // 정상 진행 확인
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
  });

  test('인증 만료 시 로그인 리다이렉트', async ({ page }) => {
    // 비로그인 상태로 보호 라우트 접근
    await page.context().clearCookies();
    await page.goto('/analysis/skin');

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/sign-in/);
  });
});
```

#### 7.4.5 성능 테스트 시나리오

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test('홈 페이지 LCP < 2.5초', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const lcp = Date.now() - startTime;
    expect(lcp).toBeLessThan(2500);
  });

  test('분석 결과 페이지 로딩 < 3초', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/analysis/skin/result/test-id');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('무한 스크롤 성능 (제품 목록)', async ({ page }) => {
    await page.goto('/products');

    // 5번 스크롤 후에도 60fps 유지
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(500);
    }

    // 스크롤 후에도 상호작용 가능
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });
});
```

#### 7.4.6 E2E 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 특정 시나리오만
npm run test:e2e -- tests/e2e/personal-color-analysis.spec.ts

# UI 모드 (디버깅)
npm run test:e2e:ui

# CI 환경
npm run test:e2e -- --project=chromium --reporter=github
```

---

## Part 8: 리스크 및 롤백 전략

### 8.1 식별된 리스크

| 리스크                       | 영향도 | 발생 확률 | 대응                   |
| ---------------------------- | ------ | --------- | ---------------------- |
| 색상 마이그레이션 중 UI 깨짐 | 높음   | 중간      | 컴포넌트별 점진적 적용 |
| 다국어 적용 중 누락 텍스트   | 중간   | 높음      | fallback 메시지 설정   |
| 마이그레이션 실패            | 높음   | 낮음      | 로컬 테스트 후 적용    |
| 모듈 연동 시 성능 저하       | 중간   | 중간      | 쿼리 최적화, 캐싱      |

### 8.2 롤백 절차

```bash
# Level 1: 컴포넌트 롤백
git revert [commit] -- components/specific.tsx

# Level 2: 마이그레이션 롤백
npx supabase db reset --linked  # 주의: 데이터 손실

# Level 3: 전체 롤백
git revert [commit-range]
npm run test  # 테스트 통과 확인
npm run build  # 빌드 성공 확인
```

---

## Part 9: 보안 취약점 점검 (OWASP)

### 9.1 OWASP Top 10 체크리스트

#### 9.1.1 A01: 인증 실패 (Broken Access Control)

**현재 상태**: ✅ Clerk + RLS로 대부분 보호됨

**점검 항목**:

```
☐ 모든 보호 라우트에 auth.protect() 적용 확인
☐ API 라우트에서 clerk_user_id 검증
☐ RLS 정책이 모든 테이블에 적용됨
☐ 수평적 권한 상승 불가 (다른 사용자 데이터 접근)
```

**취약점 예시 및 해결**:

```typescript
// ❌ 취약: 사용자 ID 검증 없음
const { data } = await supabase.from('skin_analyses').select('*').eq('id', params.id); // 누구나 접근 가능

// ✅ 안전: clerk_user_id 검증
const { data } = await supabase
  .from('skin_analyses')
  .select('*')
  .eq('id', params.id)
  .eq('clerk_user_id', userId); // 본인 데이터만 접근
```

#### 9.1.2 A03: 인젝션 (Injection)

**현재 상태**: ✅ Supabase 파라미터화 쿼리로 SQL Injection 방지

**점검 항목**:

```
☐ 모든 DB 쿼리가 Supabase 클라이언트 사용
☐ 동적 테이블/컬럼명 사용 금지
☐ XSS 방지를 위한 입력 검증
```

**금지 패턴**:

```typescript
// ❌ 절대 금지: 문자열 연결
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ❌ 금지: dangerouslySetInnerHTML 무분별 사용
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 안전: Supabase 사용
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('name', name);
```

#### 9.1.3 A05: 보안 설정 오류 (Security Misconfiguration)

**점검 항목**:

```
☐ .env 파일이 .gitignore에 포함됨
☐ NEXT_PUBLIC_ 접두사는 공개 가능한 값만 사용
☐ 프로덕션에서 debug 모드 비활성화
☐ 에러 메시지에 스택 트레이스 미노출
```

**환경변수 분류**:

```bash
# 공개 가능 (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# 비공개 (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=xxx     # 절대 공개 금지
CLERK_SECRET_KEY=xxx              # 절대 공개 금지
GOOGLE_GENERATIVE_AI_API_KEY=xxx  # 절대 공개 금지
```

#### 9.1.4 A07: 인증 실패 (Identification and Authentication Failures)

**현재 상태**: ✅ Clerk이 인증 전담

**추가 고려사항**:

```
☐ 비밀번호 정책 (Clerk 설정에서 관리)
☐ 세션 타임아웃 설정
☐ 로그인 시도 제한 (Rate Limiting)
```

### 9.2 민감 데이터 보호

#### 9.2.1 개인정보 분류

| 데이터 유형    | 민감도 | 저장 위치        | 암호화      |
| -------------- | ------ | ---------------- | ----------- |
| 이메일         | 높음   | Clerk            | O           |
| 분석 이미지    | 높음   | Supabase Storage | O (전송 중) |
| 신체 측정값    | 높음   | body_analyses    | O (저장 시) |
| 피부 분석 결과 | 중간   | skin_analyses    | X           |
| 운동 기록      | 낮음   | workout_logs     | X           |

#### 9.2.2 이미지 저장 보안

```typescript
// Supabase Storage 버킷 정책
{
  "public": false,  // 비공개 버킷
  "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
  "max_file_size": 5242880  // 5MB 제한
}

// 서명된 URL로만 접근 가능
const { data } = await supabase.storage
  .from('analysis-images')
  .createSignedUrl('path/to/image.jpg', 3600); // 1시간 유효
```

---

## Part 10: 성능 최적화

### 10.1 현재 성능 지표

#### 10.1.1 Lighthouse 점수 목표

| 지표           | 현재 | 목표 | 상태         |
| -------------- | ---- | ---- | ------------ |
| Performance    | 75   | 90+  | ⚠️ 개선 필요 |
| Accessibility  | 92   | 95+  | ⚠️ 개선 필요 |
| Best Practices | 88   | 95+  | ⚠️ 개선 필요 |
| SEO            | 95   | 95+  | ✅ 충족      |

#### 10.1.2 Core Web Vitals 목표

| 지표 | 현재 | 목표    | 설명               |
| ---- | ---- | ------- | ------------------ |
| LCP  | 2.8s | < 2.5s  | 최대 콘텐츠 페인트 |
| FID  | 50ms | < 100ms | 첫 입력 지연       |
| CLS  | 0.05 | < 0.1   | 누적 레이아웃 이동 |

### 10.2 이미지 최적화

#### 10.2.1 Next.js Image 컴포넌트 사용

```tsx
// ❌ 최적화 안 됨
<img src="/hero.jpg" alt="Hero" />;

// ✅ 최적화됨
import Image from 'next/image';
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority // LCP 이미지에만 사용
/>;
```

#### 10.2.2 이미지 포맷 및 압축

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

### 10.3 번들 최적화

#### 10.3.1 코드 스플리팅

```typescript
// 무거운 컴포넌트 동적 import
import dynamic from 'next/dynamic';

// 차트 컴포넌트 (recharts)
export const ChartDynamic = dynamic(
  () => import('./Chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// 모달 컴포넌트
export const ModalDynamic = dynamic(
  () => import('./Modal').then(mod => ({ default: mod.Modal })),
  { ssr: false }
);
```

#### 10.3.2 트리 쉐이킹 확인

```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer

# 큰 패키지 확인
# - recharts: 차트 컴포넌트만 import
# - lucide-react: 사용 아이콘만 import
# - date-fns: 사용 함수만 import
```

#### 10.3.3 패키지 최적화

```typescript
// ❌ 전체 import (번들 크기 증가)
import { format, parse, addDays, ... } from 'date-fns';
import * as Icons from 'lucide-react';

// ✅ 개별 import (트리 쉐이킹 가능)
import { format, parse } from 'date-fns';
import { Home, Settings, User } from 'lucide-react';
```

### 10.4 데이터 페칭 최적화

#### 10.4.1 React Query 캐싱

```typescript
// 제품 목록 캐싱 (5분)
const { data } = useQuery({
  queryKey: ['products', category],
  queryFn: () => fetchProducts(category),
  staleTime: 5 * 60 * 1000, // 5분간 fresh
  cacheTime: 30 * 60 * 1000, // 30분간 캐시 유지
});
```

#### 10.4.2 Supabase 쿼리 최적화

```typescript
// ❌ N+1 문제: 연관 데이터 개별 조회
const products = await supabase.from('products').select('*');
for (const p of products) {
  const reviews = await supabase.from('reviews').select('*').eq('product_id', p.id);
}

// ✅ JOIN으로 한 번에 조회
const { data } = await supabase
  .from('products')
  .select(
    `
    *,
    reviews (
      id,
      rating,
      content
    )
  `
  )
  .eq('category', category)
  .limit(20);
```

### 10.5 에러 로깅 및 모니터링

#### 10.5.1 Sentry 설정 (권장)

**현재 상태**: 모바일 앱에 Sentry 적용됨, 웹 앱은 미적용

```typescript
// lib/sentry.ts (신규 생성 필요)
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: ['localhost', 'yiroom.com'],
      }),
    ],
  });
}
```

#### 10.5.2 에러 경계 (Error Boundary)

```tsx
// components/ErrorBoundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### 10.5.3 API 에러 로깅 패턴

```typescript
// lib/api/error-handler.ts
export async function apiErrorHandler(
  error: unknown,
  context: { module: string; action: string; userId?: string }
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // 로컬 로깅 (항상)
  console.error(`[${context.module}] ${context.action} failed:`, errorMessage);

  // Sentry 로깅 (프로덕션)
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { module: context.module, action: context.action },
      user: context.userId ? { id: context.userId } : undefined,
    });
  }

  // 사용자 친화적 에러 반환
  return {
    error: true,
    message: '처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    code: error instanceof ApiError ? error.code : 'UNKNOWN',
  };
}
```

---

### 10.6 환경변수 관리

#### 10.6.1 환경변수 분류

**.env.example** (저장소에 포함):

```bash
# === 필수 (애플리케이션 실행에 필수) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# === 서버 전용 (절대 NEXT_PUBLIC_ 사용 금지) ===
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
CLERK_SECRET_KEY=sk_test_...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# === 선택 (없어도 동작, 기능 제한) ===
SENTRY_DSN=https://xxx@sentry.io/xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

#### 10.6.2 환경변수 검증

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // 필수 공개 변수
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // 필수 서버 변수
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().startsWith('AIza'),

  // 선택 변수
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

#### 10.6.3 환경변수 검사 스크립트

```bash
# apps/web/scripts/check-env.js
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

---

### 10.7 렌더링 최적화

#### 10.7.1 불필요한 리렌더링 방지

```typescript
// ❌ 매 렌더링마다 새 객체 생성
<Component style={{ color: 'red' }} />
<Component data={data.filter(x => x.active)} />

// ✅ useMemo로 메모이제이션
const filteredData = useMemo(() =>
  data.filter(x => x.active),
  [data]
);
const style = useMemo(() => ({ color: 'red' }), []);
```

#### 10.7.2 가상화 (긴 리스트)

```typescript
// 20개 이상 아이템 리스트에 가상화 적용
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  width="100%"
  itemCount={items.length}
  itemSize={80}
>
  {({ index, style }) => (
    <ProductCard product={items[index]} style={style} />
  )}
</FixedSizeList>
```

---

## Part 11: 디자인 시스템 정의

### 11.1 색상 팔레트

#### 11.1.1 모듈 색상 (OKLCH)

```css
:root {
  /* 운동 모듈 - 오렌지 계열 */
  --module-workout: oklch(0.85 0.15 45);
  --module-workout-light: oklch(0.95 0.08 45);
  --module-workout-dark: oklch(0.65 0.18 45);

  /* 영양 모듈 - 그린 계열 */
  --module-nutrition: oklch(0.75 0.15 150);
  --module-nutrition-light: oklch(0.92 0.08 150);
  --module-nutrition-dark: oklch(0.55 0.18 150);

  /* 피부 모듈 - 핑크 계열 */
  --module-skin: oklch(0.8 0.12 350);
  --module-skin-light: oklch(0.95 0.06 350);
  --module-skin-dark: oklch(0.6 0.15 350);

  /* 체형 모듈 - 블루 계열 */
  --module-body: oklch(0.75 0.15 250);
  --module-body-light: oklch(0.92 0.08 250);
  --module-body-dark: oklch(0.55 0.18 250);

  /* 퍼스널컬러 모듈 - 퍼플 계열 */
  --module-personal-color: oklch(0.7 0.18 300);
  --module-personal-color-light: oklch(0.9 0.09 300);
  --module-personal-color-dark: oklch(0.5 0.21 300);

  /* 얼굴형 모듈 - 코랄 계열 */
  --module-face: oklch(0.75 0.16 30);
  --module-face-light: oklch(0.92 0.08 30);
  --module-face-dark: oklch(0.55 0.19 30);

  /* 헤어 모듈 - 베이지 계열 */
  --module-hair: oklch(0.78 0.14 55);
  --module-hair-light: oklch(0.93 0.07 55);
  --module-hair-dark: oklch(0.58 0.17 55);
}
```

#### 11.1.2 시맨틱 색상

```css
:root {
  /* 상태 색상 */
  --status-success: oklch(0.75 0.18 145);
  --status-warning: oklch(0.85 0.18 85);
  --status-error: oklch(0.65 0.25 25);
  --status-info: oklch(0.7 0.15 230);

  /* 점수 색상 (0-100) */
  --score-excellent: oklch(0.75 0.18 145); /* 81-100 */
  --score-good: oklch(0.8 0.15 180); /* 61-80 */
  --score-average: oklch(0.85 0.15 90); /* 41-60 */
  --score-poor: oklch(0.7 0.2 30); /* 21-40 */
  --score-critical: oklch(0.6 0.25 25); /* 0-20 */
}
```

### 11.2 타이포그래피

#### 11.2.1 폰트 스케일

```css
:root {
  --font-xs: 0.75rem; /* 12px */
  --font-sm: 0.875rem; /* 14px */
  --font-base: 1rem; /* 16px */
  --font-lg: 1.125rem; /* 18px */
  --font-xl: 1.25rem; /* 20px */
  --font-2xl: 1.5rem; /* 24px */
  --font-3xl: 1.875rem; /* 30px */
  --font-4xl: 2.25rem; /* 36px */
}
```

#### 11.2.2 용도별 텍스트 스타일

| 용도        | 크기    | 굵기     | 행간 |
| ----------- | ------- | -------- | ---- |
| 페이지 제목 | 2xl-3xl | bold     | 1.2  |
| 섹션 제목   | xl-2xl  | semibold | 1.3  |
| 카드 제목   | lg-xl   | semibold | 1.4  |
| 본문        | base    | normal   | 1.6  |
| 캡션        | sm      | normal   | 1.5  |
| 라벨        | xs-sm   | medium   | 1.4  |

### 11.3 스페이싱 시스템

```css
:root {
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
}
```

### 11.4 컴포넌트 토큰

#### 11.4.1 카드

```css
:root {
  --card-radius: 1rem; /* 16px */
  --card-radius-sm: 0.5rem; /* 8px */
  --card-radius-lg: 1.5rem; /* 24px */
  --card-shadow: 0 1px 3px oklch(0 0 0 / 10%);
  --card-shadow-hover: 0 4px 12px oklch(0 0 0 / 15%);
  --card-padding: var(--spacing-4);
  --card-gap: var(--spacing-3);
}
```

#### 11.4.2 버튼

```css
:root {
  --button-height-sm: 2rem; /* 32px */
  --button-height-md: 2.5rem; /* 40px */
  --button-height-lg: 3rem; /* 48px */
  --button-radius: 0.5rem; /* 8px */
  --button-radius-full: 9999px;
}
```

### 11.5 애니메이션 및 마이크로인터랙션

#### 11.5.1 애니메이션 원칙

**기본 원칙**:

- 의미 있는 움직임만 사용 (장식용 애니메이션 최소화)
- `prefers-reduced-motion` 미디어 쿼리 존중
- 300ms 이하의 빠른 트랜지션 권장
- 사용자 액션에 대한 즉각적 피드백

#### 11.5.2 애니메이션 토큰

```css
/* globals.css - 애니메이션 시스템 */
:root {
  /* 트랜지션 지속 시간 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* 이징 함수 */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 접근성: 모션 감소 선호 시 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 11.5.3 컴포넌트별 애니메이션 가이드

**버튼 인터랙션**:

```tsx
// ✅ 권장: 호버/포커스 피드백
<Button className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
  분석하기
</Button>

// ❌ 지양: 과도한 애니메이션
<Button className="animate-bounce hover:animate-pulse">
  분석하기
</Button>
```

**카드 호버**:

```tsx
<Card className="transition-shadow duration-200 hover:shadow-lg">{/* 컨텐츠 */}</Card>
```

**로딩 상태**:

```tsx
// 스켈레톤
<div className="animate-pulse bg-muted rounded-lg h-32" />

// 스피너
<Loader2 className="animate-spin h-6 w-6" />
```

#### 11.5.4 마이크로인터랙션 패턴

| 상황          | 애니메이션       | 지속 시간 | 이징        |
| ------------- | ---------------- | --------- | ----------- |
| 버튼 호버     | scale(1.02)      | 150ms     | ease-out    |
| 버튼 클릭     | scale(0.98)      | 100ms     | ease-in     |
| 카드 호버     | shadow 증가      | 200ms     | ease-in-out |
| 모달 열림     | fade + scale     | 200ms     | ease-out    |
| 모달 닫힘     | fade + scale     | 150ms     | ease-in     |
| 토스트 등장   | slide-in         | 300ms     | ease-bounce |
| 탭 전환       | fade             | 150ms     | ease-in-out |
| 드롭다운 열림 | slide-down       | 200ms     | ease-out    |
| 점수 카운트업 | number increment | 500ms     | ease-out    |

#### 11.5.5 분석 결과 애니메이션

```tsx
// 점수 카운트업 애니메이션
function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}
```

#### 11.5.6 접근성 고려사항

```tsx
// 모션 감소 선호 감지
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Tailwind 클래스로 처리
<div className="hover:scale-102 motion-reduce:hover:scale-100 transition-transform">
  {children}
</div>;
```

---

## Part 12: 접근성 (Accessibility) 가이드

### 12.1 WCAG 2.1 AA 준수 목표

#### 12.1.1 현재 상태 및 목표

| 지표                     | 현재 | 목표 | 상태         |
| ------------------------ | ---- | ---- | ------------ |
| Lighthouse Accessibility | 92   | 95+  | ⚠️ 개선 필요 |
| 키보드 네비게이션        | 70%  | 100% | ⚠️ 개선 필요 |
| 스크린 리더 지원         | 60%  | 90%+ | ⚠️ 개선 필요 |
| 색상 대비                | 85%  | 100% | ⚠️ 개선 필요 |

#### 12.1.2 핵심 원칙 (POUR)

```
P - Perceivable (인지 가능)
  ☐ 모든 이미지에 alt 텍스트
  ☐ 비디오/오디오에 자막 또는 대체 텍스트
  ☐ 색상만으로 정보 전달하지 않기

O - Operable (조작 가능)
  ☐ 모든 기능 키보드로 접근 가능
  ☐ 포커스 순서 논리적
  ☐ 충분한 클릭 영역 (44x44px 최소)

U - Understandable (이해 가능)
  ☐ 명확한 레이블과 지시사항
  ☐ 에러 메시지 구체적
  ☐ 일관된 네비게이션 패턴

R - Robust (견고함)
  ☐ 시맨틱 HTML 사용
  ☐ ARIA 속성 올바르게 사용
  ☐ 다양한 보조 기술과 호환
```

### 12.2 컴포넌트별 접근성 요구사항

#### 12.2.1 Dialog/Modal

```tsx
// ✅ 올바른 패턴
<Dialog>
  <DialogHeader>
    <DialogTitle>제목</DialogTitle>
    <VisuallyHidden asChild>
      <DialogDescription>모달 설명</DialogDescription>
    </VisuallyHidden>
  </DialogHeader>
  <DialogContent>
    {/* 컨텐츠 */}
  </DialogContent>
</Dialog>

// ❌ DialogDescription 누락
<Dialog>
  <DialogHeader>
    <DialogTitle>제목</DialogTitle>
  </DialogHeader>
</Dialog>
```

**체크리스트**:

```
☐ DialogDescription 필수 (VisuallyHidden 사용 가능)
☐ 포커스 트랩 활성화
☐ ESC 키로 닫기
☐ 열릴 때 첫 포커스 가능 요소로 이동
```

#### 12.2.2 Form 요소

```tsx
// ✅ 올바른 패턴
<div>
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" role="alert">
      {errors.email.message}
    </p>
  )}
</div>

// ❌ 레이블 연결 누락
<div>
  <span>이메일</span>
  <Input type="email" />
</div>
```

**체크리스트**:

```
☐ 모든 입력에 <Label> 연결 (htmlFor/id)
☐ 필수 필드에 aria-required="true"
☐ 에러 시 aria-invalid="true" + aria-describedby
☐ 실시간 검증 메시지에 role="alert"
```

#### 12.2.3 버튼 및 링크

```tsx
// ✅ 올바른 패턴 - 아이콘만 있는 버튼
<Button aria-label="설정 열기">
  <Settings className="w-5 h-5" />
</Button>

// ✅ 올바른 패턴 - 새 탭 링크
<a href="/external" target="_blank" rel="noopener">
  외부 사이트
  <span className="sr-only">(새 탭에서 열림)</span>
</a>

// ❌ 레이블 없는 아이콘 버튼
<Button>
  <Settings />
</Button>
```

#### 12.2.4 이미지 및 아이콘

```tsx
// ✅ 정보 전달 이미지
<Image
  src="/analysis-result.jpg"
  alt="피부 분석 결과: 수분도 75점, 유분도 60점"
  width={400}
  height={300}
/>

// ✅ 장식용 이미지
<Image
  src="/decoration.svg"
  alt=""  // 빈 alt로 스크린 리더 무시
  aria-hidden="true"
  width={100}
  height={100}
/>

// ✅ 아이콘 (정보 전달용)
<CheckCircle aria-label="완료됨" className="text-green-500" />

// ✅ 아이콘 (장식용)
<Sparkles aria-hidden="true" />
```

### 12.3 색상 대비 요구사항

#### 12.3.1 텍스트 대비 (WCAG AA)

| 텍스트 크기             | 최소 대비 | 현재 상태    |
| ----------------------- | --------- | ------------ |
| 일반 텍스트 (< 18px)    | 4.5:1     | ✅           |
| 큰 텍스트 (≥ 18px bold) | 3:1       | ✅           |
| UI 컴포넌트             | 3:1       | ⚠️ 점검 필요 |

#### 12.3.2 문제 색상 조합 (수정 필요)

```css
/* ❌ 대비 부족 */
.warning-text {
  color: oklch(0.85 0.18 85); /* 노란색 - 배경과 대비 부족 */
}

/* ✅ 대비 개선 */
.warning-text {
  color: oklch(0.65 0.18 85); /* 더 진한 노란색/갈색 */
}
```

### 12.4 키보드 네비게이션

#### 12.4.1 탭 순서 관리

```tsx
// ✅ 논리적 탭 순서
<div>
  <h1>페이지 제목</h1>
  <nav>{/* 네비게이션 먼저 */}</nav>
  <main>{/* 메인 콘텐츠 */}</main>
  <aside>{/* 사이드바 */}</aside>
  <footer>{/* 푸터 */}</footer>
</div>

// 포커스 건너뛰기 링크
<a href="#main-content" className="sr-only focus:not-sr-only">
  본문으로 건너뛰기
</a>
```

#### 12.4.2 포커스 스타일

```css
/* globals.css - 포커스 표시 필수 */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 포커스 표시 제거 금지 */
/* ❌ *:focus { outline: none; } */
```

### 12.5 스크린 리더 지원

#### 12.5.1 aria-live 영역

```tsx
// 동적 콘텐츠 업데이트 알림
<div aria-live="polite" aria-atomic="true">
  {loading && '분석 중...'}
  {result && `분석 완료: ${result.score}점`}
</div>

// 중요한 에러 알림
<div role="alert" aria-live="assertive">
  {error && `오류: ${error.message}`}
</div>
```

#### 12.5.2 시맨틱 HTML 우선

```tsx
// ✅ 시맨틱 HTML
<nav aria-label="메인 네비게이션">...</nav>
<main id="main-content">...</main>
<article>...</article>
<aside aria-label="관련 제품">...</aside>

// ❌ div 남용
<div class="nav">...</div>
<div class="main">...</div>
```

### 12.6 테스트 도구

#### 12.6.1 자동화 테스트

```bash
# axe-core 접근성 검사
npm install @axe-core/react --save-dev

# Lighthouse CI (CI 파이프라인)
npm install @lhci/cli --save-dev
```

```typescript
// tests/a11y/accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('분석 결과 페이지 접근성', async () => {
  const { container } = render(<AnalysisResultPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 12.6.2 수동 테스트 체크리스트

```
☐ 키보드만으로 모든 기능 사용 가능
☐ 스크린 리더로 페이지 콘텐츠 이해 가능
☐ 200% 확대에서 레이아웃 깨지지 않음
☐ 고대비 모드에서 UI 식별 가능
☐ 애니메이션 비활성화 시 정상 작동
```

### 12.7 접근성 체크리스트 (컴포넌트 생성 시)

```
새 컴포넌트 생성 시 필수 확인:

☐ data-testid 속성 추가
☐ 시맨틱 HTML 요소 사용
☐ 키보드 접근 가능
☐ 포커스 표시 명확
☐ 색상 대비 4.5:1 이상
☐ 필요시 aria-* 속성 추가
☐ 이미지에 alt 텍스트
☐ 에러 메시지에 role="alert"
```

---

## Part 13: 산출물 문서 목록

### 13.1 문서 분류

#### 13.1.1 설계 문서 (Spec Documents)

| 문서                                       | 상태    | 용도                           |
| ------------------------------------------ | ------- | ------------------------------ |
| SDD-MASTER-REFACTORING-PLAN.md             | ✅ 완료 | 전체 리팩토링 가이드 (본 문서) |
| SDD-GLOBAL-DESIGN-SPECIFICATION.md         | ✅ 완료 | 다민족 지원 + 디자인 시스템    |
| SDD-PROFESSIONAL-ENHANCEMENT.md            | ✅ 완료 | F-1 얼굴형 분석 스펙           |
| SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md | ✅ 완료 | UI/UX 가이드 + 구현 상세       |
| SDD-GAP-FIXES.md                           | ✅ 완료 | UI Gap 수정 사항               |
| SDD-MY-INFO-SECTION.md                     | ✅ 완료 | 내 정보 섹션 스펙              |
| SDD-S1-PROFESSIONAL-ANALYSIS.md            | ✅ 완료 | S-1 전문가 분석 스펙           |

#### 13.1.2 운영 문서 (Operational Documents)

| 문서               | 상태         | 용도                        |
| ------------------ | ------------ | --------------------------- |
| CLAUDE.md          | ✅ 완료      | Claude Code 프로젝트 가이드 |
| DATABASE-SCHEMA.md | ⚠️ 갱신 필요 | DB 스키마 문서 (40% 불일치) |
| TROUBLESHOOTING.md | ✅ 완료      | 오류 해결 가이드            |
| GLOSSARY.md        | ✅ 완료      | 용어 설명집                 |

#### 13.1.3 규칙 문서 (Rule Documents)

| 문서                                 | 상태    | 용도                 |
| ------------------------------------ | ------- | -------------------- |
| .claude/rules/db-api-sync.md         | ✅ 완료 | DB-API 동기화 규칙   |
| .claude/rules/coding-standards.md    | ✅ 완료 | 코딩 표준            |
| .claude/rules/ai-integration.md      | ✅ 완료 | AI 통합 규칙         |
| .claude/rules/hybrid-data-pattern.md | ✅ 완료 | Hybrid 데이터 패턴   |
| .claude/rules/prompt-engineering.md  | ✅ 완료 | 프롬프트 작성 가이드 |
| .claude/rules/server-debugging.md    | ✅ 완료 | 서버 디버깅 가이드   |
| .claude/rules/ai-code-review.md      | ✅ 완료 | AI 코드 리뷰 규칙    |
| .claude/rules/sisyphus-trigger.md    | ✅ 완료 | 시지푸스 트리거 규칙 |

### 13.2 생성 예정 문서

#### 13.2.1 Phase 1-2 완료 시

| 문서                   | 용도                   | 생성 시점       |
| ---------------------- | ---------------------- | --------------- |
| UI-MIGRATION-REPORT.md | 색상 마이그레이션 결과 | Phase 1 완료 후 |
| I18N-IMPLEMENTATION.md | 다국어 구현 가이드     | Phase 2 완료 후 |

#### 13.2.2 Phase 3-4 완료 시

| 문서                         | 용도                   | 생성 시점       |
| ---------------------------- | ---------------------- | --------------- |
| CROSS-MODULE-ARCHITECTURE.md | 모듈간 연동 아키텍처   | Phase 3 완료 후 |
| INGREDIENT-DATABASE.md       | 성분 DB 구조 및 사용법 | Phase 4 완료 후 |

### 13.3 문서 관리 규칙

#### 13.3.1 파일명 규칙

```
설계 문서: SDD-[기능명].md (예: SDD-F1-FACE-ANALYSIS.md)
운영 문서: [이름].md (예: TROUBLESHOOTING.md)
규칙 문서: .claude/rules/[규칙명].md
```

#### 13.3.2 버전 관리

```markdown
## 변경 이력

| 버전 | 날짜       | 변경 내용                                                                                                            |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| 1.0  | 2026-01-13 | 초기 버전 - 오류 예방, UI/UX, i18n, 모듈 연동 기반                                                                   |
| 1.1  | 2026-01-13 | Phase 0 실행 계획 추가, 보안 섹션 보강                                                                               |
| 1.2  | 2026-01-14 | F-1 얼굴형 분석 스펙, 성분 DB, 다민족 지원 추가                                                                      |
| 1.3  | 2026-01-14 | Part 12 접근성, Part 13 산출물, 폼 상태관리, 에러 로깅 추가                                                          |
| 1.4  | 2026-01-14 | 접근성 우선순위 상향, 환경변수 관리, Lighthouse CI 추가                                                              |
| 1.5  | 2026-01-14 | Part 3.5 packages/shared 상세 스펙, Part 7.4 E2E 테스트 시나리오, Part 11.5 애니메이션/마이크로인터랙션 가이드 추가  |
| 1.6  | 2026-01-14 | Part 14 제외된 항목 문서화 추가, 섹션 번호 중복 수정 (10.5→10.7)                                                     |
| 1.7  | 2026-01-14 | Quick Start Guide, 문서 유지보수 전략, MVP 스코프 정의, 단점 완화 전략 추가                                          |
| 1.8  | 2026-01-14 | MVP 스코프 → 완전형 구현 로드맵으로 변경, Phase 1-4 재구성                                                           |
| 1.9  | 2026-01-14 | Part 15-20 추가: W-1/N-1 고도화, Products UI/UX 개편, Reports 콘텐츠, Fashion/Closet 모듈, 2026 UX 트렌드 체크리스트 |

---

**Document Version**: 1.9
**Created**: 2026-01-13
**Updated**: 2026-01-14
**Author**: Claude Code (Opus 4.5)
```

### 13.4 마이그레이션 파일 목록

#### 13.4.1 현재 마이그레이션 (26개)

```
supabase/migrations/
├── 2025-12-* (기본 테이블 10개)
├── 20251202_product_tables.sql
├── 20251203_workout_tables.sql
├── 20251204_user_features_tables.sql
├── 20251205_nutrition_tables.sql
├── 20251206_social_tables.sql
├── 20251207_additional_tables.sql
├── 20260108_analysis_images.sql
├── 20260108_image_consents.sql
├── 20260110100000_mental_health_logs.sql
├── 20260111_product_shelf.sql
├── 20260113_pc_multi_angle_columns.sql
├── 20260113_skin_diary.sql
├── 20260113_photo_reuse_system.sql
├── 20260113_skin_problem_areas.sql
└── 20260117_analysis_cross_links.sql
```

#### 13.4.2 추가 예정 마이그레이션

```
☐ 20260118_wrist_image_column.sql      # PC-1 손목 이미지
☐ 20260119_ingredients.sql             # 성분 DB
☐ 20260120_user_accessibility.sql      # 접근성 설정
```

---

## Part 14: 제외된 항목 및 향후 검토 목록

> 이 섹션은 리팩토링 계획 수립 시 논의되었으나 현재 범위에서 제외된 항목들을 기록합니다.
> 향후 "왜 이 방식을 선택하지 않았나?"에 대한 의사결정 추적성(Decision Traceability)을 제공합니다.

### 14.1 제외 결정 기준

| 기준                 | 설명                         | 예시                                   |
| -------------------- | ---------------------------- | -------------------------------------- |
| **현재 필요성 낮음** | MVP/현재 로드맵에 불필요     | 결제 시스템 미도입 시 security-auditor |
| **ROI 불충분**       | 구현 비용 대비 효과 미미     | 소규모 팀에서 Adversarial 에이전트     |
| **선행 조건 미충족** | 의존 작업 완료 후 검토 가능  | MAU 1만 미만 시 성능 최적화 에이전트   |
| **대안으로 충분**    | 기존 도구/방식으로 해결 가능 | Husky로 충분 시 PostToolUse 훅         |
| **복잡도 대비 효과** | 설정/유지보수 비용 > 이점    | 소규모 프로젝트에서 GraphQL            |

### 14.2 제외된 전문 에이전트

| 에이전트                  | 역할                                 | 제외 사유                                               | 재검토 트리거                                                 |
| ------------------------- | ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| **security-auditor**      | 보안 취약점 검사, OWASP Top 10 점검  | 결제/민감 건강데이터 미도입, Clerk+RLS로 기본 보안 확보 | 결제 시스템 도입 시, 의료 정보 저장 시, 외부 API 3개+ 연동 시 |
| **performance-optimizer** | 성능 병목 분석, 최적화 제안          | MAU 1만 미만, Lighthouse 75점으로 양호                  | MAU 1만+ 도달, AI 분석 응답 3초+ 초과, Lighthouse 70 미만     |
| **db-migration-reviewer** | 스키마 변경 검토, 데이터 무결성 검증 | 대규모 스키마 변경 미예정, 26개 마이그레이션으로 안정화 | 5개+ 테이블 동시 변경, 기존 데이터 대량 변환 필요 시          |

**현재 운영 중인 에이전트 (7개)**:

- yiroom-spec-reviewer, yiroom-ui-validator
- yiroom-code-quality, yiroom-test-writer
- korean-ux-writer, korean-beauty-validator
- sisyphus-adaptive (오케스트레이터)

### 14.3 제외된 워크플로우/자동화

| 워크플로우                 | 용도                           | 제외 사유                                   | 재검토 트리거                                |
| -------------------------- | ------------------------------ | ------------------------------------------- | -------------------------------------------- |
| **PostToolUse 포매팅 훅**  | 도구 실행 후 자동 코드 포매팅  | Husky + lint-staged로 커밋 시점 포매팅 충분 | 팀 5명+ 도달, CI 포매팅 실패 월 10건+        |
| **/commit-push-pr 명령어** | git commit → push → PR 원스톱  | 수동 git 명령으로 충분, PR 컨벤션 미확립    | 일일 PR 생성 5건+, 팀 PR 템플릿 강제 필요 시 |
| **Adversarial 에이전트**   | 코드 리뷰 결과에 반론 제기     | 현재 7개 에이전트 파이프라인으로 충분       | 팀 10명+ 도달, 프로덕션 버그 월 5건+         |
| **팀 공유 설정**           | .claude/settings.json git 추적 | 1인 개발 환경, 민감 경로 노출 우려          | 팀 협업 시작 시, 새 팀원 온보딩 빈번 시      |

### 14.4 제외된 기술 스택/라이브러리

| 기술                        | 용도                   | 제외 사유                                  | 현재 대안                                  |
| --------------------------- | ---------------------- | ------------------------------------------ | ------------------------------------------ |
| **Redis**                   | 세션/캐시 저장소       | 현재 트래픽으로 불필요, 인프라 복잡도 증가 | Supabase 내장 캐싱, React Query            |
| **GraphQL**                 | API 쿼리 언어          | REST API로 충분, 학습 곡선                 | Next.js API Routes + Supabase              |
| **Storybook**               | 컴포넌트 문서화/테스트 | 컴포넌트 200개 미만, 유지보수 부담         | 직접 개발 서버 확인, Part 11 디자인 시스템 |
| **Prisma**                  | ORM                    | Supabase 클라이언트로 충분, 이중 추상화    | @supabase/supabase-js                      |
| **tRPC**                    | 타입 안전 API          | Next.js API Routes + Zod로 충분            | API Routes + Zod 스키마                    |
| **Monorepo 빌드 캐시 (Nx)** | 빌드 최적화            | Turborepo로 충분, 2개 앱 규모              | Turborepo                                  |

### 14.5 제외된 테스트/품질 도구

| 도구                          | 용도                 | 제외 사유                             | 현재 대안                            |
| ----------------------------- | -------------------- | ------------------------------------- | ------------------------------------ |
| **Cypress**                   | E2E 테스트           | Playwright로 통일, 중복 도구          | Playwright (Part 7.4)                |
| **SonarQube**                 | 정적 코드 분석       | ESLint + TypeScript로 충분, 설정 복잡 | ESLint, yiroom-code-quality 에이전트 |
| **Visual Regression Testing** | 스크린샷 비교 테스트 | 빈번한 UI 변경으로 유지보수 부담      | Playwright 스크린샷 (실패 시)        |
| **Contract Testing (Pact)**   | API 계약 테스트      | 내부 API만 사용, 외부 소비자 없음     | API Route 단위 테스트                |

### 14.6 제외된 기능/모듈

| 기능                  | 설명                  | 제외 사유                            | 재검토 트리거                        |
| --------------------- | --------------------- | ------------------------------------ | ------------------------------------ |
| **실시간 협업**       | 다중 사용자 동시 편집 | 개인 사용 앱 특성, 복잡도 높음       | 팀/가족 공유 기능 요청 시            |
| **오프라인 모드**     | PWA 오프라인 지원     | 분석 기능이 서버 의존적              | 모바일 앱 오프라인 요청 증가 시      |
| **AI 모델 로컬 실행** | 온디바이스 AI         | Gemini API 성능 충분, 모델 크기 문제 | 프라이버시 요구 증가, WebGPU 성숙 시 |
| **멀티 테넌트**       | B2B SaaS 구조         | B2C 서비스 우선, 아키텍처 복잡       | 기업 고객 요청 시                    |
| **A/B 테스트 인프라** | 실험 플랫폼           | 사용자 수 부족, ROI 낮음             | MAU 5만+ 도달 시                     |

### 14.7 재검토 일정

```
분기별 검토 (매 분기 첫 주):
☐ 에이전트 필요성 재평가
☐ 기술 스택 변경 검토
☐ 성능 지표 기반 최적화 도구 검토

트리거 기반 검토:
☐ MAU 1만 도달 → performance-optimizer, A/B 테스트
☐ 팀 5명+ → PostToolUse 훅, 팀 공유 설정
☐ 결제 도입 → security-auditor
☐ 외부 API 3개+ → security-auditor, Contract Testing
```

### 14.8 참고 문서

| 문서                                                                   | 내용                      |
| ---------------------------------------------------------------------- | ------------------------- |
| [.claude/rules/agent-roadmap.md](.claude/rules/agent-roadmap.md)       | 에이전트 로드맵 상세      |
| [.claude/rules/workflow-roadmap.md](.claude/rules/workflow-roadmap.md) | 워크플로우 향후 검토 상세 |
| [.claude/rules/sisyphus-trigger.md](.claude/rules/sisyphus-trigger.md) | 시지푸스 자동 트리거 규칙 |

---

## Part 15: 웰니스 모듈 고도화 (W-1, N-1)

> 운동/영양 모듈을 완성형으로 고도화하기 위한 상세 가이드

### 15.1 W-1 운동 모듈 Enhancement

#### 15.1.1 현재 상태 분석

**구현 완료 (✅)**:

- 온보딩 플로우 (step1-3)
- 메인 대시보드 + 스트릭 카드
- 세션/히스토리 기본 구조
- 운동 타입 분석 결과 (5가지 타입)
- 빠른 액션 (세션 시작, 기록, 분석, 플랜)

**고도화 필요 (⬜)**:

```
1. 운동 세션 UX 개선
2. 운동 라이브러리 UI
3. 진행률 시각화
4. 주간 플랜 고도화
```

#### 15.1.2 운동 세션 UX 개선

**목표**: 몰입감 있는 운동 경험 제공

```tsx
// components/workout/session/ActiveWorkoutTimer.tsx
interface ActiveWorkoutTimerProps {
  currentExercise: Exercise;
  setNumber: number;
  totalSets: number;
  restTime: number; // 초
  onComplete: () => void;
}

// 구현 요소:
// 1. 원형 프로그레스 타이머 (세트 간 휴식)
// 2. 세트/반복 카운터 애니메이션
// 3. 운동 완료 시 햅틱 피드백 (모바일)
// 4. 음성 안내 옵션 (TTS)
```

**UI 레이아웃**:

```
┌─────────────────────────────┐
│    [현재 운동명]              │
│                              │
│    ┌───────────────┐         │
│    │   ⏱️ 45초      │ ← 휴식 타이머 (원형)
│    │   남은 휴식     │
│    └───────────────┘         │
│                              │
│    세트 2/4  |  반복 12회     │
│                              │
│  [이전]  [✓ 완료]  [다음]     │
└─────────────────────────────┘
```

#### 15.1.3 운동 라이브러리 UI

**목표**: 운동 동작 탐색 및 학습 지원

**컴포넌트 구조**:

```
components/workout/library/
├── ExerciseCard.tsx          # 운동 카드 (이미지, 난이도, 부위)
├── ExerciseFilter.tsx        # 필터 (부위, 기구, 난이도)
├── ExerciseDetailSheet.tsx   # 상세 바텀시트 (설명, 동영상)
├── ExerciseSearch.tsx        # 검색
└── FavoriteExerciseList.tsx  # 즐겨찾기 운동
```

**카드 디자인**:

```
┌─────────────────────────────┐
│ [운동 이미지/GIF]            │
│                              │
│ 스쿼트                       │
│ 하체 · 중급 · 기구 없음       │
│                              │
│ ⭐ 즐겨찾기    ℹ️ 상세보기   │
└─────────────────────────────┘
```

#### 15.1.4 진행률 시각화

**목표**: 운동 성과를 직관적으로 확인

```tsx
// components/workout/stats/WorkoutProgressChart.tsx
// - 주간 운동 시간 막대 차트
// - 월간 칼로리 소모 라인 차트
// - 스트릭 히트맵 달력

// components/workout/stats/GoalProgressGauge.tsx
// - 주간 목표 대비 진행률 원형 게이지
// - 목표 달성 시 축하 애니메이션
```

**시각화 예시**:

```
주간 운동 현황
───────────────
월 ████████ 45분
화 ████ 20분
수 ██████ 30분
목 (오늘)
금 -
토 -
일 -

목표: 150분 / 달성: 95분 (63%)
```

#### 15.1.5 주간 플랜 고도화

**목표**: 개인화된 플랜 편집 기능

```tsx
// components/workout/plan/WeeklyPlanEditor.tsx
// 기능:
// 1. 드래그앤드롭으로 요일 간 운동 이동
// 2. 운동 추가/제거/대체
// 3. 휴식일 설정
// 4. 완료율 시각화

// lib/workout/planGenerator.ts
// - 체형 분석 기반 자동 플랜 생성
// - 목표 (근력/유산소/유연성) 기반 비율 조정
```

### 15.2 N-1 영양 모듈 Enhancement

#### 15.2.1 현재 상태 분석

**구현 완료 (✅)** - 완성도 높음 (924줄):

- 칼로리 원형 차트
- 식사별 기록 (아침/점심/저녁/간식)
- 수분 섭취 트래킹
- 간헐적 단식 타이머
- 크로스 모듈 연동 (S-1, W-1, C-1, H-1, M-1)
- AI 식단 추천
- 온보딩 플로우

**고도화 필요 (⬜)**:

```
1. UI 시각적 개선
2. 인터랙션 최적화
3. 통계 강화
```

#### 15.2.2 UI 시각적 개선

**목표**: 시각적 일관성 및 가독성 향상

```css
/* 영양소별 프로그레스 바 개선 */
.macro-progress {
  /* 단계별 색상 그라디언트 */
  --macro-protein: oklch(0.75 0.15 145); /* 녹색 */
  --macro-carbs: oklch(0.8 0.15 85); /* 노란색 */
  --macro-fat: oklch(0.7 0.18 25); /* 빨간색 */

  /* 목표 초과 시 시각적 경고 */
  --macro-over: oklch(0.6 0.25 25);
}
```

**개선 포인트**:

```
1. 식사 카드 레이아웃
   - 기록된 음식 썸네일 표시
   - 영양소 비율 미니 차트

2. 다크모드 색상 조화
   - 그래프 색상 대비 개선
   - 카드 배경 구분 명확화

3. 칼로리 원형 차트
   - 목표 대비 시각적 피드백 (녹색/노란색/빨간색)
   - 남은 칼로리 텍스트 강조
```

#### 15.2.3 인터랙션 최적화

**목표**: 빠르고 편리한 기록 경험

```tsx
// 스와이프 제스처 지원
// components/nutrition/MealRecordCard.tsx
// - 왼쪽 스와이프: 삭제
// - 오른쪽 스와이프: 편집

// 빠른 입력 개선
// components/nutrition/QuickFoodInput.tsx
// - 최근 기록 음식 상위 5개 표시
// - 음식 검색 자동완성 (debounce 300ms)
// - 음성 입력 버튼 (Web Speech API)
```

#### 15.2.4 통계 강화

**목표**: 장기적 영양 패턴 분석

```tsx
// components/nutrition/stats/WeeklyNutrientChart.tsx
// - 주간 영양소 분포 스택 바 차트
// - 일평균 vs 권장량 비교

// components/nutrition/stats/TrendAnalysis.tsx
// - 목표 달성률 트렌드 (최근 4주)
// - 자주 먹는 음식 Top 5
// - 영양 균형 레이더 차트
```

### 15.3 예상 작업량

| 모듈     | 항목               | 예상 시간  |
| -------- | ------------------ | ---------- |
| W-1      | 세션 UX 개선       | 4시간      |
| W-1      | 운동 라이브러리 UI | 3시간      |
| W-1      | 진행률 시각화      | 3시간      |
| W-1      | 주간 플랜 고도화   | 2시간      |
| N-1      | UI 시각적 개선     | 3시간      |
| N-1      | 인터랙션 최적화    | 2시간      |
| N-1      | 통계 강화          | 3시간      |
| **합계** |                    | **20시간** |

---

## Part 16: Products UI/UX 전면 개편

> 제품 모듈의 수익화 및 사용자 경험 최적화를 위한 전면 개편 가이드

### 16.1 현재 상태 및 문제점

#### 16.1.1 현재 구현 상태 (335줄)

**구현 완료 (✅)**:

- 카테고리 탭 (all, skincare, makeup, supplements, equipment, healthfoods)
- 제품 그리드 기본 레이아웃
- 검색 + 정렬 (평점, 가격, 최신순)
- 분석 결과 기반 필터링 (skinType, season URL 파라미터)
- 최근 본 제품

**심각한 Gap (🔴)**:

```
1. 전환율 저하 예상
   - 구매 CTA가 눈에 띄지 않음
   - 매칭 정보가 카드에 없음

2. 정보 접근성 부족
   - 가격 비교 어려움
   - 성분 정보 상세 페이지 진입 필요

3. 어필리에이트 UX 미흡
   - 외부 링크 이동 안내 부재
   - 파트너별 혜택 표시 없음
```

### 16.2 제품 카드 재디자인

#### 16.2.1 현재 vs 목표

**현재 카드**:

```
┌─────────────────────┐
│ [이미지]             │
│ 브랜드               │
│ 제품명               │
│ ₩24,000             │
│ ⭐4.8               │
└─────────────────────┘
```

**목표 카드 (2026 트렌드)**:

```
┌─────────────────────────────┐
│ [이미지]                     │
│           ♥️                 │ ← 위시리스트 버튼
│                              │
│ 💜 92% 매칭  ⭐4.8 (234)     │ ← 매칭률 + 리뷰
├─────────────────────────────┤
│ 브랜드명                     │
│ 제품명 (최대 2줄)            │
│                              │
│ 💰 ₩24,000  ▼15%            │ ← 가격 + 할인율
│ [쿠팡] [iHerb] [무신사]      │ ← 구매처 탭
│                              │
│ [🔗 구매하기]                │ ← CTA 강조
└─────────────────────────────┘
```

#### 16.2.2 구현 컴포넌트

```tsx
// components/products/ProductCard.tsx 개편
interface ProductCardProps {
  product: AnyProduct;
  matchRate?: number; // PC-1/S-1 기반 매칭률
  affiliateLinks: AffiliateLink[];
  onWishlistToggle: () => void;
  onAffiliateClick: (partner: string) => void;
}

// 매칭률 배지
// components/products/MatchRateBadge.tsx
function MatchRateBadge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-gray-500';
  return <span className={`${color} font-semibold`}>💜 {rate}% 매칭</span>;
}

// 가격 비교 탭
// components/products/PriceCompareTabs.tsx
// - 파트너별 가격 표시
// - 최저가 강조
// - 배송비 포함 총액 표시
```

### 16.3 제품 상세 페이지 고도화

#### 16.3.1 현재 vs 목표 구조

**현재 상세 페이지**:

```
1. 제품 이미지
2. 기본 정보 (이름, 브랜드, 가격)
3. 성분 목록
4. 리뷰
```

**목표 상세 페이지**:

```
1. 이미지 캐러셀 + 고정 가격 바
2. 매칭 분석 섹션 ⬅️ 신규
   - "당신의 피부에 92% 적합해요"
   - 분석 기반 이유 설명
3. 성분 안전도 섹션 ⬅️ 개선
   - EWG 등급 시각화 (원형 게이지)
   - 위험 성분 경고 배너
   - 성분별 상세 (토글)
4. 가격 비교 탭 ⬅️ 신규
   - 파트너별 가격 표
   - 배송비 포함 총액
   - 프로모션/쿠폰 정보
5. 리뷰 섹션 ⬅️ 개선
   - AI 리뷰 요약 (긍정/부정)
   - 사진 리뷰 우선 표시
   - 도움돼요 투표
6. 유사 제품 추천 ⬅️ 신규
   - 가격대/성분 유사 제품
   - 매칭률 순 정렬
7. 고정 구매 바 ⬅️ 신규
   - 스크롤해도 하단 고정
   - 최저가 파트너 자동 선택
```

#### 16.3.2 매칭 분석 섹션

```tsx
// components/products/detail/MatchAnalysisSection.tsx
interface MatchAnalysisSectionProps {
  product: CosmeticProduct;
  userAnalysis: {
    skinType?: string;
    personalColor?: string;
    skinConcerns?: string[];
  };
}

// 표시 예시:
// ┌─────────────────────────────────┐
// │ 💜 나와의 매칭 분석               │
// ├─────────────────────────────────┤
// │ 종합 매칭률: 92%                 │
// │                                  │
// │ ✅ 복합성 피부에 적합            │
// │ ✅ 여름 쿨톤 컬러 포함           │
// │ ⚠️ 모공 고민에는 보통 효과        │
// │                                  │
// │ [분석 다시 받기]                  │
// └─────────────────────────────────┘
```

#### 16.3.3 가격 비교 탭

```tsx
// components/products/detail/PriceCompareSection.tsx
interface PriceCompareSectionProps {
  affiliateLinks: AffiliateLink[];
  onPartnerClick: (partner: string, url: string) => void;
}

// 표시 예시:
// ┌───────────────────────────────────────┐
// │ 💰 가격 비교                           │
// ├───────────────────────────────────────┤
// │ 쿠팡      ₩24,000  배송비 무료  [최저가] │
// │ iHerb     ₩25,500  해외배송 ₩5,000     │
// │ 무신사     ₩26,000  배송비 ₩3,000      │
// ├───────────────────────────────────────┤
// │ 💡 쿠팡에서 구매하면 3,500원 저렴해요   │
// └───────────────────────────────────────┘
```

### 16.4 제품 비교 기능 구현

#### 16.4.1 비교 UI

```tsx
// components/products/compare/ProductCompare.tsx
// - 최대 3개 제품 비교
// - 성분/가격/리뷰 비교표
// - AI 최적 선택 추천

// 비교 표 예시:
// ┌──────────┬──────────┬──────────┬──────────┐
// │          │ 제품 A    │ 제품 B    │ 제품 C    │
// ├──────────┼──────────┼──────────┼──────────┤
// │ 가격      │ ₩24,000  │ ₩28,000  │ ₩22,000  │
// │ 용량      │ 50ml     │ 100ml    │ 30ml     │
// │ ml당 가격 │ ₩480     │ ₩280 ⭐  │ ₩733     │
// │ 평점      │ 4.8      │ 4.5      │ 4.9 ⭐   │
// │ 리뷰 수   │ 234      │ 567 ⭐   │ 89       │
// │ 매칭률    │ 92% ⭐   │ 78%      │ 85%      │
// ├──────────┼──────────┼──────────┼──────────┤
// │ AI 추천   │ ✅ 최적  │          │          │
// └──────────┴──────────┴──────────┴──────────┘
```

#### 16.4.2 비교 스토어

```tsx
// lib/stores/compareStore.ts
interface CompareState {
  products: AnyProduct[];
  maxProducts: 3;
  addProduct: (product: AnyProduct) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
}
```

### 16.5 어필리에이트 UX 최적화

#### 16.5.1 외부 링크 이동 안내

```tsx
// components/products/AffiliateRedirectModal.tsx
// 외부 사이트 이동 전 안내 모달

// 표시 예시:
// ┌─────────────────────────────────┐
// │ 🔗 쿠팡으로 이동합니다            │
// ├─────────────────────────────────┤
// │ 제품: [제품명]                   │
// │ 가격: ₩24,000                   │
// │                                  │
// │ ⚠️ 외부 사이트의 가격/재고는      │
// │    변동될 수 있습니다.            │
// │                                  │
// │ [취소]        [쿠팡에서 구매하기] │
// └─────────────────────────────────┘
```

#### 16.5.2 클릭 추적 개선

```tsx
// lib/affiliate/clickTracking.ts
// - 클릭 이벤트 상세 기록
// - 전환율 분석용 세션 ID
// - 파트너별 성과 대시보드 (관리자)

interface AffiliateClickEvent {
  productId: string;
  partner: 'coupang' | 'iherb' | 'musinsa';
  userId: string;
  sessionId: string;
  sourceModule: 'products' | 'analysis' | 'recommendation';
  matchRate?: number;
  clickedPrice: number;
}
```

### 16.6 예상 작업량

| 항목     | 세부 내용          | 예상 시간  |
| -------- | ------------------ | ---------- |
| 16.2     | 제품 카드 재디자인 | 4시간      |
| 16.3     | 상세 페이지 고도화 | 6시간      |
| 16.4     | 제품 비교 기능     | 4시간      |
| 16.5     | 어필리에이트 UX    | 3시간      |
| 테스트   | 단위/통합 테스트   | 3시간      |
| **합계** |                    | **20시간** |

---

## Part 17: Reports 콘텐츠 구현

> 주간/월간 리포트의 실제 콘텐츠 및 시각화 구현 가이드

### 17.1 현재 상태 및 문제점

#### 17.1.1 현재 구현 상태 (242줄)

**구현 완료 (✅)**:

- 주간/월간 리포트 목록 네비게이션
- 빠른 액세스 (이번 주, 이번 달)
- 최근 리포트 3개 표시

**심각한 Gap (🔴)**:

```
리포트 콘텐츠 자체가 미구현!
- 주간 리포트 상세 페이지: 기본 구조만
- 월간 리포트 상세 페이지: 기본 구조만
- 시각화 차트: 없음
- AI 인사이트: 없음
```

### 17.2 주간 리포트 콘텐츠

#### 17.2.1 리포트 구조

```
주간 리포트: 1월 13일 - 19일
───────────────────────────────

📊 이번 주 요약
━━━━━━━━━━━━━━
총 운동 시간: 3시간 45분 (+15%)
소모 칼로리: 1,250kcal
평균 섭취 칼로리: 1,850kcal/일
수분 섭취: 평균 1.8L/일
영양 목표 달성률: 72%

🏋️ 운동 분석
━━━━━━━━━━━━━
[주간 운동 막대 차트]
월: ████ 45분
화: ████ 40분
...

운동 타입 분포:
- 근력 운동: 60%
- 유산소: 30%
- 스트레칭: 10%

🥗 영양 분석
━━━━━━━━━━━━━
[영양소 균형 레이더 차트]
단백질: 85% 달성
탄수화물: 110% (초과)
지방: 95% 달성
식이섬유: 60% (부족)

💧 수분 섭취
━━━━━━━━━━━━━
[일별 수분 막대 차트]
목표 달성일: 5/7일

🎯 이번 주 잘한 점
━━━━━━━━━━━━━━━━
✅ 연속 5일 운동 완료!
✅ 단백질 섭취 목표 달성
✅ 수분 섭취 개선 (전주 대비 +20%)

⚠️ 개선이 필요해요
━━━━━━━━━━━━━━━━━
- 탄수화물 섭취 조절 필요
- 식이섬유 섭취 늘리기
- 주말 운동 추가 권장

💡 AI 코칭 메시지
━━━━━━━━━━━━━━━━
"이번 주 운동 꾸준히 하셨네요! 👏
다음 주에는 주말에도 가벼운 운동을
추가해보시면 더 좋을 것 같아요."
```

#### 17.2.2 컴포넌트 구조

```
components/reports/weekly/
├── WeeklyReportPage.tsx        # 메인 페이지
├── WeeklySummaryCard.tsx       # 요약 카드
├── WeeklyWorkoutChart.tsx      # 운동 막대 차트
├── WeeklyNutrientRadar.tsx     # 영양소 레이더 차트
├── WeeklyWaterChart.tsx        # 수분 일별 차트
├── WeeklyAchievements.tsx      # 잘한 점 목록
├── WeeklyImprovements.tsx      # 개선점 목록
├── WeeklyAICoaching.tsx        # AI 코칭 메시지
└── WeeklyShareButton.tsx       # 공유 버튼
```

#### 17.2.3 데이터 집계

```tsx
// lib/reports/weeklyAggregator.ts
interface WeeklyReportData {
  period: { start: Date; end: Date };
  workout: {
    totalMinutes: number;
    totalCalories: number;
    dailyBreakdown: DailyWorkout[];
    typeDistribution: Record<string, number>;
    comparisonToPrevious: number; // %
  };
  nutrition: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    goalAchievementRate: number;
    dailyBreakdown: DailyNutrition[];
  };
  water: {
    avgMl: number;
    goalDays: number;
    totalDays: number;
    dailyBreakdown: DailyWater[];
  };
  achievements: string[];
  improvements: string[];
  aiCoaching: string;
}

async function generateWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReportData>;
```

### 17.3 월간 리포트 콘텐츠

#### 17.3.1 리포트 구조

```
월간 리포트: 2026년 1월
───────────────────────────────

📈 전월 대비 비교
━━━━━━━━━━━━━━━━
[전월 vs 이번 달 비교 차트]

운동:   12월 180분 → 1월 225분 (+25%)
칼로리: 12월 1,750 → 1월 1,820 (+4%)
수분:   12월 1.5L → 1월 1.8L (+20%)

🏆 이달의 성과
━━━━━━━━━━━━━━
- 최장 연속 운동: 7일 (신기록!)
- 베스트 주간: 1월 2주차 (목표 92% 달성)
- 총 운동 세션: 18회

📊 주간별 추이
━━━━━━━━━━━━━
[4주간 라인 차트]
1주: ████████ 72%
2주: ██████████ 92%
3주: ███████ 65%
4주: █████████ 85%

🧠 습관 형성 분석
━━━━━━━━━━━━━━━━
형성된 습관:
✅ 아침 운동 루틴 (주 5회 이상)
✅ 점심 후 물 마시기

개선 필요 습관:
⚠️ 저녁 간식 조절
⚠️ 주말 활동량 증가

🎯 다음 달 목표 제안
━━━━━━━━━━━━━━━━━
1. 주 4회 → 주 5회 운동
2. 일일 수분 2L 목표
3. 저녁 탄수화물 -20%

💡 AI 월간 총평
━━━━━━━━━━━━━━
"1월 한 달 동안 많이 성장하셨어요! 🌟
특히 운동 습관이 잘 자리잡았습니다.
2월에는 영양 균형에 조금 더 신경 쓰시면
목표 달성이 더 쉬워질 거예요."
```

#### 17.3.2 컴포넌트 구조

```
components/reports/monthly/
├── MonthlyReportPage.tsx        # 메인 페이지
├── MonthlyComparisonChart.tsx   # 전월 대비 차트
├── MonthlyAchievements.tsx      # 이달의 성과
├── WeeklyTrendChart.tsx         # 주간 추이 차트
├── HabitFormationCard.tsx       # 습관 형성 분석
├── MonthlyGoalSuggestion.tsx    # 다음 달 목표
├── MonthlyAISummary.tsx         # AI 총평
└── MonthlyShareCard.tsx         # 공유용 카드 이미지
```

### 17.4 시각화 차트 시스템

#### 17.4.1 차트 라이브러리 선택

**권장: Recharts (React 친화적)**

```bash
npm install recharts
```

**이유**:

- React 컴포넌트 기반
- 반응형 지원
- 접근성 고려
- 번들 크기 작음

#### 17.4.2 공통 차트 컴포넌트

```tsx
// components/charts/index.ts
export { BarChartResponsive } from './BarChartResponsive';
export { LineChartResponsive } from './LineChartResponsive';
export { RadarChartResponsive } from './RadarChartResponsive';
export { PieChartResponsive } from './PieChartResponsive';
export { HeatmapCalendar } from './HeatmapCalendar';

// 모듈 색상 적용
// 운동 차트: --module-workout
// 영양 차트: --module-nutrition
// 수분 차트: oklch(0.70 0.15 230)
```

#### 17.4.3 접근성 고려

```tsx
// 차트 접근성 요구사항
// 1. aria-label로 차트 설명
// 2. 데이터 테이블 대체 제공 (sr-only)
// 3. 키보드 네비게이션 지원
// 4. 고대비 색상 사용

<div role="img" aria-label="이번 주 운동 시간 차트. 월요일 45분, 화요일 40분...">
  <BarChart data={data} />
  <table className="sr-only">{/* 스크린 리더용 데이터 테이블 */}</table>
</div>
```

### 17.5 공유 기능

#### 17.5.1 SNS 공유 이미지 생성

```tsx
// lib/reports/shareImageGenerator.ts
// html2canvas를 사용한 공유용 이미지 생성

async function generateShareImage(reportData: WeeklyReportData): Promise<Blob> {
  // 1. 공유용 카드 컴포넌트 렌더링
  // 2. html2canvas로 이미지 변환
  // 3. Blob 반환
}

// components/reports/ShareCard.tsx
// SNS 공유에 최적화된 카드 디자인 (1080x1080)
```

#### 17.5.2 공유 옵션

```tsx
// components/reports/ShareButtons.tsx
interface ShareButtonsProps {
  reportType: 'weekly' | 'monthly';
  reportData: WeeklyReportData | MonthlyReportData;
}

// 공유 옵션:
// 1. 이미지 저장 (갤러리)
// 2. 인스타그램 스토리
// 3. 카카오톡 공유
// 4. 링크 복사
```

### 17.6 예상 작업량

| 항목     | 세부 내용          | 예상 시간  |
| -------- | ------------------ | ---------- |
| 17.2     | 주간 리포트 콘텐츠 | 5시간      |
| 17.3     | 월간 리포트 콘텐츠 | 5시간      |
| 17.4     | 시각화 차트 시스템 | 4시간      |
| 17.5     | 공유 기능          | 2시간      |
| 테스트   | 단위/통합 테스트   | 2시간      |
| **합계** |                    | **18시간** |

---

## Part 18: 고도화 로드맵 통합

> Part 15-17을 기존 구현 로드맵에 통합

### 18.1 전체 구현 로드맵 (갱신)

| Phase       | 기존 항목   | 추가 항목              | 총 예상 시간 |
| ----------- | ----------- | ---------------------- | ------------ |
| Phase 1     | 기반 안정화 | -                      | 5시간        |
| Phase 2     | UI/UX 통합  | -                      | 15시간       |
| Phase 3     | 기능 완성   | -                      | 15시간       |
| Phase 4     | 품질 보증   | -                      | 15시간       |
| **Phase 5** | -           | **W-1/N-1 고도화**     | **20시간**   |
| **Phase 6** | -           | **Products 전면 개편** | **20시간**   |
| **Phase 7** | -           | **Reports 콘텐츠**     | **18시간**   |

**총 예상 시간: ~108시간** (기존 50시간 + 신규 58시간)

### 18.2 우선순위 권장

```
[즉시] Phase 1 → [병렬] Phase 2+3 → [마무리] Phase 4
                        ↓
[수익화] Phase 6 (Products) → [리텐션] Phase 7 (Reports)
                        ↓
[완성도] Phase 5 (W-1/N-1)
```

**권장 순서**:

1. Phase 6 (Products) - 수익화 직결, UX 결함 심각
2. Phase 7 (Reports) - 사용자 리텐션, 콘텐츠 부재
3. Phase 5 (W-1/N-1) - 기능 완성도 향상

### 18.3 마이그레이션 추가 예정

```
☐ 20260118_workout_library.sql       # 운동 라이브러리 테이블
☐ 20260119_product_compare.sql       # 제품 비교 저장
☐ 20260120_report_cache.sql          # 리포트 캐시 테이블
☐ 20260121_outfit_recommendations.sql # 코디 추천 캐시
```

---

## Part 19: Fashion/Closet 모듈 고도화

> 패션/옷장 모듈의 완성형 구현 가이드
>
> 참조: [Baymard Institute Product Page UX 2025](https://baymard.com/blog/current-state-ecommerce-product-page-ux), [Fitness App UI Design](https://stormotion.io/blog/fitness-app-ux/)

### 19.1 현재 상태 분석

#### 19.1.1 구현 완료 (15개 페이지)

**Closet 모듈 (10개 페이지)**:

- ✅ 옷장 메인 (`closet/page.tsx`) - 그리드, 검색, 필터
- ✅ 옷 추가 (`closet/add/page.tsx`)
- ✅ 옷 상세/편집 (`closet/[id]/`, `closet/[id]/edit/`)
- ✅ 코디 목록 (`closet/outfits/`)
- ✅ 코디 상세/편집/생성 (`closet/outfits/[id]/`, `new/`)
- ✅ 코디 추천 (`closet/recommend/`)

**Style 모듈 (5개 페이지)**:

- ✅ 스타일 메인 (`style/page.tsx`)
- ✅ 날씨 기반 스타일 (`style/weather/`)
- ✅ 카테고리별 스타일 (`style/category/[slug]/`)
- ✅ 코디 상세 (`style/outfit/[id]/`)

#### 19.1.2 고도화 필요 Gap

```
1. PC-1/C-1 연동 강화
   - 퍼스널 컬러 기반 색상 추천 미흡
   - 체형 기반 실루엣 추천 미흡

2. AI 기반 코디 생성
   - 현재: 규칙 기반 추천
   - 목표: Gemini AI 기반 창의적 코디

3. 시각적 코디네이션
   - 옷 조합 시뮬레이션 부재
   - 색상 조화 시각화 부재

4. 외부 연동
   - 날씨 API 실시간 연동
   - 일정/캘린더 연동 (TPO)
```

### 19.2 PC-1 ↔ Closet 크로스 모듈 연동

#### 19.2.1 퍼스널 컬러 기반 옷 분류

```tsx
// lib/closet/colorAnalysis.ts
interface ClothingColorAnalysis {
  dominantColor: string; // 주요 색상 (hex)
  colorHarmony: 'excellent' | 'good' | 'neutral' | 'poor';
  seasonMatch: SeasonType[]; // 어울리는 시즌
  recommendedCombinations: string[]; // 추천 조합 색상
}

// 옷 추가 시 자동 색상 분석
async function analyzeClothingColor(imageUrl: string): Promise<ClothingColorAnalysis>;

// 사용자 시즌과 매칭
function getColorMatchScore(clothingColor: string, userSeason: SeasonType): number; // 0-100
```

#### 19.2.2 옷장 UI 개선

```
옷장 메인 페이지 개선:
┌─────────────────────────────────┐
│ 내 옷장          [+추가] [필터]  │
├─────────────────────────────────┤
│ 💜 여름 쿨톤 기반 추천           │
│ "오늘 이 조합 어때요?"          │
│ [추천 코디 카드 3개]             │
├─────────────────────────────────┤
│ 카테고리: [전체] [상의] [하의]... │
│                                  │
│ [옷 카드]  [옷 카드]  [옷 카드]   │
│  💜92%     ⭐즐겨찾기   🔴30%    │ ← 시즌 매칭률
│                                  │
└─────────────────────────────────┘
```

### 19.3 C-1 ↔ Style 크로스 모듈 연동

#### 19.3.1 체형 기반 실루엣 추천

```tsx
// lib/style/bodyTypeRecommendation.ts
interface StyleRecommendation {
  silhouette: 'fitted' | 'loose' | 'a-line' | 'straight';
  emphasizeAreas: string[]; // 강조할 부위
  avoidPatterns: string[]; // 피할 패턴
  recommendedLengths: Record<string, string>; // 부위별 적정 기장
}

// 체형별 스타일 가이드
const BODY_TYPE_STYLE_GUIDE: Record<BodyType, StyleRecommendation>;
```

#### 19.3.2 스타일 추천 UI

```
스타일 메인 페이지:
┌─────────────────────────────────┐
│ 오늘의 스타일 추천               │
├─────────────────────────────────┤
│ 🌤️ 서울 12°C / 맑음             │
│ 📅 화요일 오전 출근              │
├─────────────────────────────────┤
│ 당신의 체형(역삼각형)에 맞는 추천 │
│                                  │
│ [코디 이미지]                    │
│ "하체 볼륨감을 더해주는 코디"    │
│                                  │
│ 💜 컬러 매칭 95%                 │
│ 👔 체형 적합도 88%               │
│                                  │
│ [이 코디로 입기]  [다른 코디 보기]│
└─────────────────────────────────┘
```

### 19.4 AI 코디 생성 (Gemini 연동)

#### 19.4.1 코디 생성 프롬프트

```typescript
// lib/gemini/outfitPrompt.ts
const OUTFIT_GENERATION_PROMPT = `
당신은 퍼스널 스타일리스트입니다.

📊 사용자 정보:
- 퍼스널 컬러: ${userSeason}
- 체형: ${bodyType}
- 오늘 날씨: ${weather}
- TPO: ${occasion}

👕 사용자 옷장:
${closetItems.map((item) => `- ${item.name} (${item.color}, ${item.category})`).join('\n')}

다음 JSON 형식으로 코디 3가지를 추천해주세요:
{
  "outfits": [
    {
      "items": ["item_id_1", "item_id_2", "item_id_3"],
      "reason": "추천 이유",
      "colorHarmony": "색상 조화 설명",
      "stylePoint": "스타일 포인트"
    }
  ]
}
`;
```

#### 19.4.2 코디 시뮬레이션 UI

```
코디 생성 페이지:
┌─────────────────────────────────┐
│ AI 코디 생성                     │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      [상의 영역]             │ │
│ │         ↓                   │ │
│ │      [하의 영역]             │ │
│ │         ↓                   │ │
│ │      [신발 영역]             │ │
│ └─────────────────────────────┘ │
│                                  │
│ 💜 전체 컬러 조화: 92%           │
│ 👔 체형 적합도: 85%              │
│                                  │
│ [다시 생성]  [이 코디 저장]       │
└─────────────────────────────────┘
```

### 19.5 2026 UX 트렌드 적용

> 참조: [Mobile App Design Trends 2026](https://uxpilot.ai/blogs/mobile-app-design-trends), [E-commerce UX Trends 2026](https://www.optimonk.com/ecommerce-ux-trends/)

#### 19.5.1 Bento Grid 레이아웃

```tsx
// 옷장 메인을 Bento Grid로 재구성
// 기존: 균일한 2열 그리드
// 개선: 비대칭 Bento 레이아웃

<div className="grid grid-cols-4 gap-3">
  {/* 큰 추천 카드 (2x2) */}
  <div className="col-span-2 row-span-2">
    <TodayRecommendation />
  </div>

  {/* 즐겨찾기 (1x1) */}
  <div className="col-span-1">
    <FavoriteItem />
  </div>

  {/* 최근 착용 (1x1) */}
  <div className="col-span-1">
    <RecentWear />
  </div>

  {/* 일반 옷 카드들 */}
  {items.map((item) => (
    <div className="col-span-1">
      <ClothingCard item={item} />
    </div>
  ))}
</div>
```

#### 19.5.2 AR 가상 피팅 (향후 검토)

```
제외 사유: HIGH_COMPLEXITY
재검토 트리거:
- AR 라이브러리 성숙도 향상 시
- 사용자 요청 증가 시
- 경쟁 앱 도입 시

현재 대안:
- 2D 레이어 시뮬레이션
- 색상 조화 시각화
```

### 19.6 예상 작업량

| 항목     | 세부 내용        | 예상 시간  |
| -------- | ---------------- | ---------- |
| 19.2     | PC-1 연동 강화   | 4시간      |
| 19.3     | C-1 연동 강화    | 4시간      |
| 19.4     | AI 코디 생성     | 5시간      |
| 19.5     | UI 트렌드 적용   | 3시간      |
| 테스트   | 단위/통합 테스트 | 2시간      |
| **합계** |                  | **18시간** |

---

## Part 20: 2026 UX 트렌드 반영 체크리스트

> 웹 서치 결과 기반 UX 트렌드 적용 가이드
>
> 참조: [Baymard Institute](https://baymard.com/blog/current-state-ecommerce-product-page-ux), [DesignRush Health Apps](https://www.designrush.com/best-designs/apps/health-wellness), [OptiMonk E-commerce Trends](https://www.optimonk.com/ecommerce-ux-trends/)

### 20.1 E-commerce/Products 트렌드 (Part 16 보완)

| 트렌드                  | 현재 상태      | 적용 방안                    | 우선순위 |
| ----------------------- | -------------- | ---------------------------- | -------- |
| **AR 가상 시착**        | ❌ 미구현      | 메이크업 가상 시착 우선 검토 | P3       |
| **Bento Grid 레이아웃** | ❌ 기존 그리드 | 제품 카드 비대칭 배치        | P2       |
| **실시간 가격 비교**    | ⚠️ 정적 표시   | 크롤러 연동 실시간화         | P1       |
| **AI 개인화 추천**      | ✅ 매칭률 표시 | 추천 이유 상세화             | P2       |
| **접근성 WCAG 2.1 AA**  | ⚠️ 92점        | 95+ 목표 개선                | P1       |
| **Bold Typography**     | ⚠️ 보통        | 가격/CTA 강조                | P2       |

### 20.2 Dashboard/Wellness 트렌드 (Part 15 보완)

| 트렌드                 | 현재 상태   | 적용 방안                    | 우선순위 |
| ---------------------- | ----------- | ---------------------------- | -------- |
| **Adaptive Interface** | ❌ 미구현   | 시간대별 UI 변화 (아침/저녁) | P2       |
| **Wearable 연동**      | ⚠️ 모바일만 | Apple Health/Google Fit 연동 | P2       |
| **Micro-interactions** | ⚠️ 기본     | 목표 달성 시 축하 애니메이션 | P2       |
| **실시간 생체 데이터** | ❌ 미구현   | 심박수/수면 데이터 표시      | P3       |
| **소셜 챌린지**        | ✅ 구현됨   | 리더보드 강화                | P3       |
| **AI 코치 실시간**     | ⚠️ 정적     | 운동 중 실시간 피드백        | P2       |

### 20.3 Reports 트렌드 (Part 17 보완)

| 트렌드                 | 현재 상태 | 적용 방안                | 우선순위 |
| ---------------------- | --------- | ------------------------ | -------- |
| **Glassmorphism**      | ❌ 미적용 | 리포트 카드 배경 블러    | P3       |
| **Bold Numbers**       | ⚠️ 보통   | 핵심 지표 4xl 강조       | P1       |
| **Agentic UX**         | ❌ 미구현 | AI 자동 인사이트 생성    | P1       |
| **SNS 공유 최적화**    | ❌ 기본   | 1080x1080 카드 이미지    | P2       |
| **Progress Animation** | ⚠️ 기본   | 점수 카운트업 애니메이션 | P2       |
| **Bottom Navigation**  | ✅ 구현됨 | -                        | -        |

### 20.4 전체 로드맵 갱신

| Phase       | 항목                      | 예상 시간  |
| ----------- | ------------------------- | ---------- |
| Phase 1     | 기반 안정화               | 5시간      |
| Phase 2     | UI/UX 통합                | 15시간     |
| Phase 3     | 기능 완성                 | 15시간     |
| Phase 4     | 품질 보증                 | 15시간     |
| Phase 5     | W-1/N-1 고도화            | 20시간     |
| Phase 6     | Products 전면 개편        | 20시간     |
| Phase 7     | Reports 콘텐츠            | 18시간     |
| **Phase 8** | **Fashion/Closet 고도화** | **18시간** |

**총 예상 시간: ~126시간** (기존 108시간 + Phase 8 18시간)

---

## 부록: 빠른 참조

### A. 모듈 색상 매핑

| 모듈           | 라이트                           | 기본                         | 다크                            | 그라디언트                   |
| -------------- | -------------------------------- | ---------------------------- | ------------------------------- | ---------------------------- |
| workout        | `bg-module-workout-light`        | `text-module-workout`        | `bg-module-workout-dark`        | `bg-gradient-workout`        |
| nutrition      | `bg-module-nutrition-light`      | `text-module-nutrition`      | `bg-module-nutrition-dark`      | `bg-gradient-nutrition`      |
| skin           | `bg-module-skin-light`           | `text-module-skin`           | `bg-module-skin-dark`           | `bg-gradient-skin`           |
| body           | `bg-module-body-light`           | `text-module-body`           | `bg-module-body-dark`           | `bg-gradient-body`           |
| personal-color | `bg-module-personal-color-light` | `text-module-personal-color` | `bg-module-personal-color-dark` | `bg-gradient-personal-color` |
| face           | `bg-module-face-light`           | `text-module-face`           | `bg-module-face-dark`           | `bg-gradient-face`           |

### B. i18n 키 구조

```json
{
  "common": { "loading", "error", "retry", "cancel", "confirm", "save" },
  "nav": { "home", "workout", "nutrition", "analysis", "profile" },
  "home": { "greeting.morning", "greeting.afternoon", "greeting.evening" },
  "analysis": {
    "personalColor": { "title", "description" },
    "face": { "title", "description" },
    "skin": { "title", "description" },
    "body": { "title", "description" }
  }
}
```

### C. 명령어 빠른 참조

```bash
# 타입 체크
npm run typecheck

# 테스트
npm run test
npm run test -- path/to/file.test.ts

# 마이그레이션
npx supabase db push
npx supabase migration list

# 빌드
npm run build:web
```

---

## 관련 문서

| 문서                                                                                       | 용도                              |
| ------------------------------------------------------------------------------------------ | --------------------------------- |
| [SDD-GLOBAL-DESIGN-SPECIFICATION.md](./SDD-GLOBAL-DESIGN-SPECIFICATION.md)                 | 다민족 지원 + 디자인 시스템       |
| [SDD-PROFESSIONAL-ENHANCEMENT.md](./SDD-PROFESSIONAL-ENHANCEMENT.md)                       | F-1 얼굴형 분석 스펙              |
| [SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md](./SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md) | UI/UX 가이드 + 구현 상세          |
| [SDD-GAP-FIXES.md](./SDD-GAP-FIXES.md)                                                     | UI Gap 수정 사항                  |
| [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)                                                | 오류 사전 (증상별 해결 가이드)    |
| [GLOSSARY.md](../GLOSSARY.md)                                                              | 용어 설명집 (전문 용어 쉬운 설명) |
| [.claude/rules/db-api-sync.md](../../.claude/rules/db-api-sync.md)                         | DB-API 동기화 규칙                |
| [.claude/rules/hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md)         | Hybrid 데이터 패턴                |

---

## 용어 참조

이 문서에서 사용하는 전문 용어에 대한 설명은 [GLOSSARY.md](../GLOSSARY.md)를 참조하세요.

**자주 사용되는 용어**:

- **RLS (Row Level Security)**: 데이터베이스 행 단위 보안 → 자기 데이터만 접근 가능
- **마이그레이션**: 데이터베이스 구조 변경 명령 파일
- **하드코딩**: 코드에 값을 직접 작성 (변경하려면 코드 수정 필요)
- **디자인 토큰**: 색상, 크기 등을 변수로 정의 (한 곳에서 관리)
- **Fallback**: 원래 방법 실패 시 대안 방법
- **i18n**: 다국어 지원 (Internationalization 약자)

오류 발생 시 [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)에서 증상별 해결 방법을 찾을 수 있습니다.

---

**Document Version**: 1.4
**Created**: 2026-01-13
**Updated**: 2026-01-14
**Author**: Claude Code (Opus 4.5)
**Status**: Active - 구현 진행 중

### 변경 이력

| 버전 | 날짜       | 변경 내용                                                                                                                                    |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4  | 2026-01-14 | 현황 진단 테이블 업데이트 (접근성 P2, 에러 로깅 추가), Part 7.3 접근성 테스트 섹션 추가, Phase 0에 환경변수 검증 항목 추가                   |
| 1.3  | 2026-01-14 | Part 12 (접근성 가이드), Part 13 (산출물 문서 목록) 추가, 폼 상태 관리(RHF+Zod) 섹션, 에러 로깅/모니터링, 환경변수 관리 섹션 추가            |
| 1.2  | 2026-01-13 | Part 9-11 추가 (보안, 성능, 디자인 시스템), Clerk 인증, API 관리, Gemini AI, 상태 관리, 빌드/배포, 레이아웃 상세, 페이지별 UI 상태 섹션 추가 |
| 1.1  | 2026-01-13 | TROUBLESHOOTING.md, GLOSSARY.md 링크 추가, 용어 참조 섹션, 하드코딩 색상 수치 200+ 수정                                                      |
| 1.0  | 2026-01-13 | 초기 버전                                                                                                                                    |

---

# SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md

# Phase K: 종합 업그레이드 스펙

> **Status**: In Progress (AI 도메인 상담 구현 완료)
> **Created**: 2026-01-11
> **Updated**: 2026-01-12
> **Author**: Claude Code
> **Phase**: K (종합 업그레이드)
> **Complexity**: 75점 (Full 트랙) ← 기존 인프라 재사용으로 감소
> **Research**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md)

---

## 1. 개요

### 1.1 목적

이룸 앱의 종합적인 기능 확장 및 성별 중립화를 통해 남녀 모두 사용할 수 있는 통합 웰니스 플랫폼으로 발전시킨다.

### 1.2 배경

- 현재 앱이 여성 중심 UI/콘텐츠로 구성되어 있음
- 남성 사용자도 활용할 수 있도록 성별 중립화 필요
- 패션, 체형, 영양 기능의 고도화 요구

### 1.3 하위 Phase 구성

| Sub-Phase | 영역                 | 설명                                      | 우선순위 |
| --------- | -------------------- | ----------------------------------------- | -------- |
| K-1       | 성별 중립화          | UI/콘텐츠 성별 중립화                     | 🔴 높음  |
| K-2       | 패션 확장            | 스타일 카테고리, Best 10, 옷장 연동       | 🔴 높음  |
| K-3       | 체형 분석 강화       | 키/몸무게 입력, 자세 교정, BMI            | 🟠 중간  |
| K-4       | 영양/레시피 확장     | 식재료 인벤토리, 레시피 추천, 목표별 옵션 | 🟠 중간  |
| K-5       | 관리자/프로필 페이지 | 관리자 대시보드, 사용자 프로필 리디자인   | 🟡 낮음  |

---

## 2. K-1: 성별 중립화

### 2.1 현황 분석

| 영역             | 현재 상태                       | 개선 방향                    |
| ---------------- | ------------------------------- | ---------------------------- |
| PC-1 결과 페이지 | 립스틱/메이크업 중심            | 남성: 넥타이/시계 추천 추가  |
| 색상 추천        | "여성스러운", "화사한" 표현     | 성별 중립 표현으로 변경      |
| 스타일링 텍스트  | 여성 패션 용어 중심             | 남녀 공용 용어 사용          |
| 악세서리 추천    | 귀걸이, 목걸이 등 여성 악세서리 | 시계, 벨트, 선글라스 등 추가 |
| 운동복 추천      | 필라테스, 요가 중심             | 헬스, 러닝, 크로스핏 추가    |

### 2.2 구현 항목

#### 2.2.1 성별 선택 온보딩

```typescript
// 온보딩 플로우에 성별 선택 추가
interface UserGenderPreference {
  gender: 'male' | 'female' | 'neutral';
  stylePreference: 'masculine' | 'feminine' | 'unisex';
}
```

#### 2.2.2 콘텐츠 조건부 렌더링

```typescript
// lib/content/gender-adaptive.ts
export function getGenderAdaptiveContent(
  gender: UserGenderPreference,
  contentType: 'accessory' | 'makeup' | 'fashion'
): AdaptiveContent;
```

#### 2.2.3 Mock 데이터 확장

| 파일                         | 변경 내용                            |
| ---------------------------- | ------------------------------------ |
| `lib/mock/personal-color.ts` | 남성용 추천 (넥타이, 시계 색상) 추가 |
| `lib/mock/styling.ts`        | 남성 스타일 카테고리 추가            |
| `lib/mock/accessories.ts`    | 성별별 악세서리 분리                 |

### 2.3 UI 변경

```
┌─────────────────────────────────────────┐
│  퍼스널 컬러 분석 결과                    │
├─────────────────────────────────────────┤
│  봄 웜톤 (Spring Warm)                   │
│                                         │
│  [성별에 따른 추천 탭]                   │
│  ┌────────┬────────┬────────┐           │
│  │ 공용   │ 남성   │ 여성   │           │
│  └────────┴────────┴────────┘           │
│                                         │
│  🔶 남성 추천 악세서리                   │
│  • 골드 프레임 선글라스                  │
│  • 브라운 가죽 시계                      │
│  • 코랄 포인트 넥타이                    │
│                                         │
│  🔶 추천 스타일                          │
│  • 캐주얼: 베이지 치노 + 코랄 셔츠       │
│  • 포멀: 네이비 수트 + 골드 타이핀       │
└─────────────────────────────────────────┘
```

---

## 3. K-2: 패션 확장

### 3.0 기존 인프라 재사용 전략

> **핵심**: Phase I의 closetMatcher가 이미 퍼스널컬러/체형 기반 매칭 지원

#### 재사용 가능한 기존 인프라

| 기존 컴포넌트             | 위치                             | K-2 활용            |
| ------------------------- | -------------------------------- | ------------------- |
| `closetMatcher.ts`        | `lib/inventory/closetMatcher.ts` | 색상/체형 매칭 로직 |
| `COLOR_KEYWORDS`          | closetMatcher.ts:21-115          | 시즌별 색상 키워드  |
| `ClothingCategory`        | `types/inventory.ts`             | 의류 카테고리       |
| `Occasion`                | `types/inventory.ts`             | TPO 분류            |
| `OutfitRecommendResponse` | `types/inventory.ts:320-324`     | 코디 추천 응답      |

### 3.1 요구사항

| ID   | 기능                             | 설명                                  | 구현 방식                            |
| ---- | -------------------------------- | ------------------------------------- | ------------------------------------ |
| F-01 | 퍼스널 컬러 + 체형 → 사이즈 추천 | 체형별 핏 가이드 제공                 | 신규 size-recommendation             |
| F-02 | 스타일 카테고리 분류             | 캐주얼, 포멀, 힙합, 미니멀, 스트릿 등 | 신규 타입 추가                       |
| F-03 | "Best 10" 추천                   | 카테고리별 인기 조합 10개             | 신규 best10-generator                |
| F-04 | 악세서리 확장                    | 시계, 선글라스, 벨트, 가방, 모자      | **기존 accessory 서브카테고리 활용** |
| F-05 | 신발 추천                        | 스니커즈, 구두, 샌들, 부츠 등         | **기존 shoes 서브카테고리 활용**     |
| F-06 | 옷장(인벤토리) 연동 코디         | 보유 의류 기반 코디 추천              | **기존 closetMatcher 확장**          |

### 3.2 2026 패션 트렌드 반영

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 1.1

| 트렌드 키워드  | 설명                    | 앱 적용                           |
| -------------- | ----------------------- | --------------------------------- |
| **미코노미**   | 과시보다 취향 중심      | 개인 스타일 추천 강화             |
| **멀티유즈**   | 한 벌로 여러 상황 커버  | TPO별 코디 추천                   |
| **오버핏**     | 오버사이즈 핏 지속 인기 | 핏 타입별 추천 (슬림/레귤러/오버) |
| **아이스블루** | 2026년 트렌드 컬러      | 퍼스널컬러별 트렌드 컬러 매칭     |
| **탐험가카키** | 도시적 밀리터리 스타일  | 스트릿/캐주얼 카테고리 확장       |

### 3.3 스타일 카테고리

```typescript
// types/fashion.ts
export type StyleCategory =
  | 'casual' // 캐주얼
  | 'formal' // 포멀/비즈니스
  | 'street' // 스트릿
  | 'minimal' // 미니멀
  | 'hip-hop' // 힙합
  | 'sporty' // 스포티
  | 'classic' // 클래식
  | 'preppy'; // 프레피

export interface StyleBest10 {
  category: StyleCategory;
  outfits: OutfitRecommendation[];
  seasonType: SeasonType;
  bodyType?: BodyType;
}

// 스타일별 2026 트렌드 아이템 (리서치 기반)
export const STYLE_TREND_ITEMS_2026: Record<StyleCategory, string[]> = {
  casual: ['폴로 셔츠', '버뮤다 팬츠', '스웨트셔츠'],
  formal: ['니트 재킷', '기능성 슬랙스'],
  street: ['새깅 팬츠', '그래픽 티'],
  minimal: ['아이스 블루 니트', '화이트 셔츠'],
  'hip-hop': ['오버사이즈 아우터', '볼드 주얼리'],
  sporty: ['테크웨어', '윈드브레이커'],
  classic: ['옥스포드 셔츠', '카멜 코트'],
  preppy: ['니트 베스트', '플리츠 스커트'],
};
```

### 3.4 한국 의류 사이즈 표준

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 1.2

#### 성별별 사이즈 체계

| 구분      | 사이즈 표기            | 비고                  |
| --------- | ---------------------- | --------------------- |
| 여성복    | 90(여), 95(여)         | 55, 66 캐주얼은 더 큼 |
| 남성복    | 100(남), 105(남)       | 통상 기준             |
| 공용(UNI) | XS, S, M, L, XL        | 여성 전용보다 큼      |
| KS 표준   | 남성: M~XL, 여성: S~XL | 범위 표시 치수 분류표 |

#### 체형별 핏팅 가이드

| 핏 타입         | 키 범위   | 적합 체형    |
| --------------- | --------- | ------------ |
| Short Fitting   | 165-170cm | 키 작은 남성 |
| Regular Fitting | 170-180cm | 표준 체형    |
| Long Fitting    | 180-188cm | 키 큰 남성   |
| Petite (P)      | ~155cm    | 키 작은 여성 |

### 3.5 사이즈 추천 로직

```typescript
// lib/fashion/size-recommendation.ts
export type FitType = 'slim' | 'regular' | 'relaxed';
export type HeightFit = 'short' | 'regular' | 'long' | 'petite';

export interface SizeRecommendation {
  category: 'top' | 'bottom' | 'shoes';
  recommendedSize: string;
  fitType: FitType;
  heightFit: HeightFit; // 키 기반 핏 추천 추가
  tips: string[];
}

// 키 기반 핏 결정
export function determineHeightFit(height: number, gender: 'male' | 'female'): HeightFit {
  if (gender === 'female') {
    return height <= 155 ? 'petite' : 'regular';
  }
  if (height < 170) return 'short';
  if (height >= 180) return 'long';
  return 'regular';
}

export function recommendSize(
  bodyType: BodyType,
  measurements: UserMeasurements,
  category: string
): SizeRecommendation;
```

### 3.4 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    패션 추천 시스템                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   PC-1 결과 ───┐                                        │
│   (시즌타입)   │                                        │
│                ├───> 스타일 매칭 엔진                   │
│   C-1 결과 ────┤                                        │
│   (체형타입)   │                                        │
│                │                                        │
│   옷장 데이터 ─┘                                        │
│                                                         │
│                ▼                                        │
│   ┌─────────────────────────────────────┐              │
│   │         Best 10 생성기               │              │
│   │  • 캐주얼 Best 10                    │              │
│   │  • 포멀 Best 10                      │              │
│   │  • 힙합 Best 10                      │              │
│   │  • ...                               │              │
│   └─────────────────────────────────────┘              │
│                ▼                                        │
│   ┌─────────────────────────────────────┐              │
│   │       옷장 연동 코디 추천            │              │
│   │  "보유 아이템으로 이 코디 가능!"      │              │
│   └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 3.5 악세서리 & 신발 데이터

```typescript
// lib/mock/accessories.ts
export const ACCESSORIES_BY_STYLE: Record<StyleCategory, AccessoryRecommendation[]> = {
  casual: [
    { type: 'watch', name: '캔버스 스트랩 시계', color: 'navy' },
    { type: 'sunglasses', name: '라운드 선글라스', color: 'brown' },
    { type: 'cap', name: '볼캡', color: 'beige' },
  ],
  formal: [
    { type: 'watch', name: '가죽 드레스 워치', color: 'black' },
    { type: 'belt', name: '클래식 가죽 벨트', color: 'brown' },
    { type: 'tie', name: '실크 넥타이', color: 'navy' },
  ],
  // ...
};

export const SHOES_BY_STYLE: Record<StyleCategory, ShoeRecommendation[]> = {
  casual: [
    { type: 'sneakers', name: '화이트 스니커즈' },
    { type: 'loafer', name: '스웨이드 로퍼' },
  ],
  formal: [
    { type: 'oxford', name: '옥스포드 구두' },
    { type: 'derby', name: '더비 슈즈' },
  ],
  'hip-hop': [
    { type: 'high-top', name: '하이탑 스니커즈' },
    { type: 'chunky', name: '청키 스니커즈' },
  ],
  // ...
};
```

### 3.6 UI: Best 10 카드

```
┌─────────────────────────────────────────┐
│  🔥 캐주얼 Best 10                       │
├─────────────────────────────────────────┤
│                                         │
│  #1. 화이트 티 + 데님 + 스니커즈         │
│  ┌─────┬─────┬─────┐                    │
│  │ 상의 │ 하의 │ 신발 │                    │
│  └─────┴─────┴─────┘                    │
│  ✓ 내 옷장에 2/3 보유                   │
│  [코디 저장] [제품 구매]                 │
│                                         │
│  #2. 스트라이프 셔츠 + 치노 + 로퍼       │
│  ...                                    │
│                                         │
│  [더 보기]                               │
└─────────────────────────────────────────┘
```

---

## 4. K-3: 체형 분석 강화

### 4.1 요구사항

| ID   | 기능                | 필수/선택 | 설명                          |
| ---- | ------------------- | --------- | ----------------------------- |
| B-01 | 키 입력             | 필수      | 150-200cm 범위                |
| B-02 | 몸무게 입력         | 필수      | 30-150kg 범위                 |
| B-03 | BMI 계산            | 자동      | 키/몸무게 기반 자동 계산      |
| B-04 | 체지방률 입력       | 선택      | 체성분 분석기 데이터          |
| B-05 | 자세 교정 운동 추천 | 신규      | 체형별 교정 운동 가이드       |
| B-06 | 2D 시뮬레이터       | 검토      | 체형 변화 시뮬레이션 (후순위) |

### 4.2 데이터 모델

```typescript
// types/body-analysis.ts
export interface BodyMeasurements {
  height: number; // cm (필수)
  weight: number; // kg (필수)
  bodyFatPercentage?: number; // % (선택)
  muscleMass?: number; // kg (선택)
}

export interface BMIResult {
  value: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  healthyRange: { min: number; max: number };
}

export interface PostureCorrection {
  bodyType: BodyType;
  issues: PostureIssue[];
  exercises: CorrectionExercise[];
}

export interface CorrectionExercise {
  name: string;
  targetArea: string;
  duration: string;
  frequency: string;
  videoUrl?: string;
  steps: string[];
}
```

### 4.3 아시아인 BMI 기준 (대한비만학회)

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 2.1
> **중요**: 아시아인은 같은 BMI에서 더 많은 내장지방을 저장하므로 낮은 기준 적용

| 분류                 | BMI 범위    | 비고 (vs WHO)   |
| -------------------- | ----------- | --------------- |
| 저체중               | < 18.5      | 동일            |
| 정상                 | 18.5 - 22.9 | WHO: 18.5-24.9  |
| 과체중 (비만 전단계) | 23.0 - 24.9 | **아시아 기준** |
| 1단계 비만           | 25.0 - 29.9 | WHO: 과체중     |
| 2단계 비만           | 30.0 - 34.9 | WHO: 1단계 비만 |
| 3단계 비만 (고도)    | ≥ 35        | WHO: 2단계 비만 |

#### 복부비만 기준 (허리둘레)

| 성별 | 한국 기준 | WHO 아시아-태평양 |
| ---- | --------- | ----------------- |
| 남성 | ≥ 90cm    | ≥ 90cm            |
| 여성 | ≥ 85cm    | ≥ 80cm            |

### 4.4 BMI 계산 로직 (아시아 기준 적용)

```typescript
// lib/body/bmi-calculator.ts
export type BMICategory =
  | 'underweight'
  | 'normal'
  | 'overweight' // 비만 전단계 (23-24.9)
  | 'obese1' // 1단계 비만
  | 'obese2' // 2단계 비만
  | 'obese3'; // 3단계 비만 (고도)

export interface BMIResult {
  value: number;
  category: BMICategory;
  healthyRange: { min: number; max: number };
  disclaimer: string; // 의학적 면책조항 필수
}

export function calculateBMI(height: number, weight: number): BMIResult {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  // 아시아인 기준 (대한비만학회, KSSO)
  let category: BMICategory;
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 23)
    category = 'normal'; // WHO는 25
  else if (bmi < 25)
    category = 'overweight'; // 비만 전단계
  else if (bmi < 30)
    category = 'obese1'; // 1단계 비만
  else if (bmi < 35)
    category = 'obese2'; // 2단계 비만
  else category = 'obese3'; // 3단계 비만 (고도)

  return {
    value: Math.round(bmi * 10) / 10,
    category,
    healthyRange: {
      min: Math.round(18.5 * heightM * heightM),
      max: Math.round(22.9 * heightM * heightM), // 아시아 기준
    },
    disclaimer:
      '아시아인 기준 적용 (대한비만학회). 의료 조언이 아니며, 정확한 진단은 전문의와 상담하세요.',
  };
}
```

### 4.5 자세 교정 운동 데이터 (연구 기반)

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 2.3
> **근거**: 주 2회, 40분, 4주 프로그램 기반 연구 결과

```typescript
// lib/mock/posture-correction.ts
export interface PostureIssue {
  name: string;
  description: string;
  weakMuscles: string[]; // 약화된 근육
  tightMuscles: string[]; // 단축된 근육
}

// 자세 문제 유형 정의
export const POSTURE_ISSUES: Record<string, PostureIssue> = {
  anteriorPelvicTilt: {
    name: '골반 전방경사',
    description: '골반이 앞으로 기울어져 배가 나와 보이고 허리가 과도하게 휜 상태',
    weakMuscles: ['대둔근', '햄스트링', '복근'],
    tightMuscles: ['대퇴사두근', '장요근'],
  },
  forwardHeadPosture: {
    name: '거북목',
    description: '머리가 어깨보다 앞으로 나온 자세',
    weakMuscles: ['경추 심부굴곡근', '하부승모근'],
    tightMuscles: ['흉쇄유돌근', '사각근', '후두하근'],
  },
  roundedShoulders: {
    name: '라운드 숄더',
    description: '어깨가 앞으로 말려들어간 자세',
    weakMuscles: ['능형근', '하부승모근'],
    tightMuscles: ['대흉근', '소흉근'],
  },
};

export const POSTURE_CORRECTIONS: Record<BodyType, PostureCorrection> = {
  hourglass: {
    bodyType: 'hourglass',
    issues: ['anteriorPelvicTilt'],
    exercises: [
      {
        name: '다리 앞쪽 스트레칭',
        targetArea: '대퇴사두근, 장요근',
        duration: '1-3분 유지',
        frequency: '양쪽 3-5회, 매일',
        steps: [
          '한쪽 무릎을 꿇고 다른 발은 앞에 둡니다 (런지 자세)',
          '골반을 앞으로 밀며 앞 허벅지가 당기는 느낌까지',
          '1-3분 유지 후 반대쪽 반복',
        ],
      },
      {
        name: '브릿지 + 한 다리 뻗기',
        targetArea: '대둔근, 햄스트링',
        duration: '10회 x 3세트',
        frequency: '주 3회',
        steps: [
          '바닥에 등을 대고 누워 무릎을 세웁니다',
          '엉덩이를 들어 어깨-골반-무릎이 일직선이 되게 합니다',
          '한 다리를 일직선으로 뻗어 5초 유지',
          '반대 다리도 반복',
        ],
      },
    ],
  },
  rectangle: {
    bodyType: 'rectangle',
    issues: ['forwardHeadPosture', 'roundedShoulders'],
    exercises: [
      {
        name: '후두하근 마사지',
        targetArea: '후두하근 (뇌가 머리 위치 인식하는 근육)',
        duration: '5분',
        frequency: '매일',
        steps: [
          '마사지볼을 뒤통수 아래(목과 두개골 경계)에 놓습니다',
          '체중을 실어 5분간 압박합니다',
          '고개를 좌우로 천천히 움직여 근육 이완',
        ],
      },
      {
        name: '벽 엔젤 운동',
        targetArea: '어깨, 등',
        duration: '10회 x 2세트',
        frequency: '매일 2번, 1달 이상',
        steps: [
          '벽에 뒤통수-어깨-골반-발뒤꿈치를 밀착합니다',
          '팔을 90도로 들어 벽에 붙입니다 (W 모양)',
          '팔을 위로 밀어 올립니다 (Y 모양)',
          '천천히 내리며 10회 반복',
        ],
      },
      {
        name: 'Y-T-W 운동',
        targetArea: '능형근, 하부승모근',
        duration: '각 동작 10회',
        frequency: '주 3회',
        steps: [
          '엎드려서 이마를 바닥에 대거나 매트에 눕습니다',
          'Y 동작: 팔을 Y자로 뻗어 올립니다',
          'T 동작: 팔을 T자로 뻗어 올립니다',
          'W 동작: 팔꿈치를 구부려 W자로 올립니다',
        ],
      },
    ],
  },
  // ... 다른 체형도 연구 기반 운동 추가
};
```

### 4.5 UI: 체형 분석 입력

```
┌─────────────────────────────────────────┐
│  📏 신체 정보 입력                       │
├─────────────────────────────────────────┤
│                                         │
│  키 (필수)                               │
│  ┌─────────────────────────┐            │
│  │  170                cm  │            │
│  └─────────────────────────┘            │
│                                         │
│  몸무게 (필수)                           │
│  ┌─────────────────────────┐            │
│  │  65                 kg  │            │
│  └─────────────────────────┘            │
│                                         │
│  ────────── 선택 정보 ──────────         │
│                                         │
│  체지방률                                │
│  ┌─────────────────────────┐            │
│  │  18                  %  │            │
│  └─────────────────────────┘            │
│                                         │
│  📊 BMI: 22.5 (정상)                    │
│  🎯 건강 체중 범위: 53.5 ~ 72.0kg       │
│                                         │
│  [분석 시작]                             │
└─────────────────────────────────────────┘
```

---

## 5. K-4: 영양/레시피 확장

### 5.0 기존 인프라 재사용 전략

> **핵심**: Phase I에서 구축된 인벤토리 시스템을 최대한 활용

#### 재사용 가능한 기존 인프라

| 기존 컴포넌트              | 위치                               | K-4 활용                 |
| -------------------------- | ---------------------------------- | ------------------------ |
| `pantry` 카테고리          | `types/inventory.ts:12`            | 식재료 인벤토리 카테고리 |
| `PantryMetadata`           | `types/inventory.ts:150-156`       | 식재료 메타데이터        |
| `InventoryItem.expiryDate` | `types/inventory.ts:173`           | 유통기한 관리            |
| CRUD repository            | `lib/inventory/repository.ts`      | 식재료 CRUD              |
| 이미지 처리                | `lib/inventory/imageProcessing.ts` | 식재료 사진 처리         |
| `ItemUploader`             | `components/inventory/common/`     | 식재료 등록 UI           |
| `InventoryGrid`            | `components/inventory/common/`     | 식재료 목록 UI           |
| `closetMatcher.ts` 패턴    | `lib/inventory/closetMatcher.ts`   | → `recipeMatcher.ts`     |

#### 재사용 비율 분석

```
기존 코드 재사용:  ~70%
확장/신규 코드:    ~30%
예상 코드 절감:    ~800줄 (1,200줄 → 400줄)
```

### 5.1 요구사항

| ID   | 기능                  | 설명                            | 구현 방식                     |
| ---- | --------------------- | ------------------------------- | ----------------------------- |
| N-01 | 식재료 스캔           | 바코드/이미지로 식재료 인식     | **기존 ItemUploader 재사용**  |
| N-02 | 식재료 인벤토리       | 보유 식재료 관리                | **기존 repository 재사용**    |
| N-03 | 레시피 추천           | 보유 재료 기반 추천             | 신규 recipeMatcher 생성       |
| N-04 | 구하기 쉬운 재료 옵션 | 마트에서 쉽게 구할 수 있는 재료 | Mock 데이터                   |
| N-05 | 선호 재료 설정        | 사용자 선호 재료 저장           | **기존 tags/isFavorite 활용** |
| N-06 | 목표별 레시피         | 다이어트/벌크업/린매스 목표별   | 신규 goal-calculator          |

### 5.2 활용 가능한 레시피 API

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 3.1

| API                | 제공 기관                  | 특징                        | 활용 방안                |
| ------------------ | -------------------------- | --------------------------- | ------------------------ |
| 레시피 재료정보    | 농림수산식품교육문화정보원 | 우리 농산물 활용, 영양성분  | 메인 레시피 데이터소스   |
| 조리식품 레시피 DB | 식품의약품안전처           | 조리법, 영양정보            | 영양 정보 보강           |
| 만개의레시피       | 만개의레시피               | 10만개+ 레시피, 사용자 평가 | 인기 레시피, 난이도 참고 |

#### 참고 프로젝트 (알고리즘)

| 프로젝트        | 핵심 기능                              | GitHub URL                                      |
| --------------- | -------------------------------------- | ----------------------------------------------- |
| NAMORE          | 좋아하는/싫어하는 재료, "나의 냉장고"  | https://github.com/KangminP/NAMORE              |
| ReCook          | 재료 선택→추천, 취향 분석, 연관 레시피 | https://github.com/dudcheol/ReCook              |
| KoreanRecipeGPT | 음식명+식재료→레시피 생성 (GPT 기반)   | https://github.com/skku-taehwan/KoreanRecipeGPT |

### 5.3 데이터 모델 (기존 확장)

> **전략**: 새 테이블 생성 대신 기존 `PantryMetadata` 확장

```typescript
// types/inventory.ts - 기존 PantryMetadata 확장
export interface PantryMetadata {
  // 기존 필드
  unit: string; // 단위 (g, ml, 개)
  quantity: number;
  storageType: 'refrigerator' | 'freezer' | 'room';
  purchaseDate?: string;

  // K-4 확장 필드 (선택적, 하위호환)
  ingredientType?: IngredientCategory; // 재료 종류
  calories?: number; // 영양정보
  protein?: number;
  carbs?: number;
  fat?: number;
}

// types/nutrition-extended.ts - 레시피 전용 타입만 신규
export type IngredientCategory = 'vegetable' | 'meat' | 'seafood' | 'dairy' | 'grain' | 'seasoning';

// 기존 InventoryItem 활용 (category='pantry')
// → FoodIngredient 별도 정의 불필요
// → user_inventory 테이블의 pantry 레코드 그대로 사용

// 식재료 카테고리별 기본 데이터 (리서치 기반)
export const INGREDIENT_CATEGORIES: Record<
  IngredientCategory,
  {
    name: string;
    items: string[];
    avgStorageLife: number;
  }
> = {
  vegetable: {
    name: '채소',
    items: ['양배추', '당근', '양파', '브로콜리', '시금치', '토마토', '파프리카', '오이'],
    avgStorageLife: 7,
  },
  meat: {
    name: '육류',
    items: ['닭가슴살', '소고기', '돼지고기', '닭다리살', '오리고기', '양고기'],
    avgStorageLife: 3, // 냉장 기준
  },
  seafood: {
    name: '해산물',
    items: ['연어', '새우', '오징어', '고등어', '참치', '조개'],
    avgStorageLife: 2,
  },
  dairy: {
    name: '유제품',
    items: ['우유', '치즈', '요거트', '버터', '생크림', '그릭요거트'],
    avgStorageLife: 7,
  },
  grain: {
    name: '곡물',
    items: ['쌀', '파스타', '빵', '오트밀', '현미', '귀리'],
    avgStorageLife: 30,
  },
  seasoning: {
    name: '양념',
    items: ['간장', '소금', '설탕', '고추장', '된장', '올리브오일', '참기름'],
    avgStorageLife: 365,
  },
};

export interface UserIngredientInventory {
  userId: string;
  ingredients: FoodIngredient[];
  preferredIngredients: string[]; // 선호 재료 ID
  dislikedIngredients: string[]; // 비선호 재료 ID
}

export type NutritionGoal = 'diet' | 'bulk' | 'lean' | 'maintenance';

export interface RecipeRecommendation {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  matchedIngredients: string[]; // 보유 재료 중 일치
  missingIngredients: string[]; // 필요하지만 없는 재료
  easyToFind: boolean; // 구하기 쉬운 재료로만 구성
  nutritionGoal: NutritionGoal[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookTime: number; // 분
  difficulty: 'easy' | 'medium' | 'hard';
  steps: string[];
}
```

### 5.3 목표별 영양 기준

```typescript
// lib/nutrition/goal-calculator.ts
export const NUTRITION_GOALS: Record<NutritionGoal, NutritionTarget> = {
  diet: {
    calorieMultiplier: 0.8, // 유지 칼로리의 80%
    proteinPerKg: 1.6, // kg당 단백질
    carbRatio: 0.35, // 탄수화물 비율
    fatRatio: 0.25, // 지방 비율
    description: '체중 감량을 위한 칼로리 제한',
  },
  bulk: {
    calorieMultiplier: 1.15, // 유지 칼로리의 115%
    proteinPerKg: 2.0,
    carbRatio: 0.45,
    fatRatio: 0.25,
    description: '근육량 증가를 위한 칼로리 서플러스',
  },
  lean: {
    calorieMultiplier: 1.05,
    proteinPerKg: 2.2,
    carbRatio: 0.4,
    fatRatio: 0.25,
    description: '지방을 최소화하면서 근육 증가',
  },
  maintenance: {
    calorieMultiplier: 1.0,
    proteinPerKg: 1.4,
    carbRatio: 0.45,
    fatRatio: 0.3,
    description: '현재 체중 유지',
  },
};
```

### 5.4 레시피 추천 로직 (closetMatcher 패턴 재사용)

> **패턴**: `lib/inventory/closetMatcher.ts`의 스코어링 로직을 레시피에 적용

```typescript
// lib/nutrition/recipe-matcher.ts
// closetMatcher.ts 패턴 재사용

import { getItems } from '@/lib/inventory/repository';

export interface RecipeMatchResult {
  recipe: Recipe;
  matchScore: number; // 0-100 (closetMatcher와 동일)
  matchedIngredients: string[];
  missingIngredients: string[];
  matchReason: string;
}

export async function recommendRecipes(
  userId: string,
  goal: NutritionGoal,
  options?: {
    preferEasyToFind?: boolean;
    maxMissingIngredients?: number;
    maxCookTime?: number;
  }
): Promise<RecipeMatchResult[]> {
  // 1. 기존 repository로 pantry 아이템 조회
  const pantryItems = await getItems(userId, { category: 'pantry' });

  // 2. 사용자 보유 재료명 추출
  const userIngredients = pantryItems.map((item) => item.name.toLowerCase());

  // 3. 목표에 맞는 레시피 필터링
  const recipes = await getRecipesByGoal(goal);

  // 4. 매칭 스코어 계산 (closetMatcher.ts 패턴)
  const results = recipes.map((recipe) => {
    const matched = recipe.ingredients.filter((ing) =>
      userIngredients.includes(ing.name.toLowerCase())
    );
    const missing = recipe.ingredients.filter(
      (ing) => !userIngredients.includes(ing.name.toLowerCase())
    );

    const matchScore = Math.round((matched.length / recipe.ingredients.length) * 100);

    return {
      recipe,
      matchScore,
      matchedIngredients: matched.map((i) => i.name),
      missingIngredients: missing.map((i) => i.name),
      matchReason: generateMatchReason(matchScore, matched.length),
    };
  });

  // 5. 옵션 필터링 및 정렬
  return results
    .filter((r) => r.missingIngredients.length <= (options?.maxMissingIngredients ?? 3))
    .sort((a, b) => b.matchScore - a.matchScore);
}
```

### 5.5 UI: 식재료 인벤토리

```
┌─────────────────────────────────────────┐
│  🥗 내 냉장고                            │
├─────────────────────────────────────────┤
│                                         │
│  [+ 재료 추가] [📷 스캔]                 │
│                                         │
│  ── 채소 ──                              │
│  🥬 양배추        D-3                   │
│  🥕 당근          D-7                   │
│  🧅 양파          D-14                  │
│                                         │
│  ── 육류 ──                              │
│  🍗 닭가슴살      D-2 ⚠️                │
│  🥩 소고기        냉동                  │
│                                         │
│  ── 유제품 ──                            │
│  🥛 우유          D-5                   │
│  🧀 치즈          D-10                  │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│  [레시피 추천 받기]                      │
│                                         │
└─────────────────────────────────────────┘
```

### 5.6 UI: 목표별 레시피 추천

```
┌─────────────────────────────────────────┐
│  🍳 레시피 추천                          │
├─────────────────────────────────────────┤
│                                         │
│  내 목표: [다이어트 ▾]                   │
│                                         │
│  ── 보유 재료로 만들 수 있어요 ──         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  닭가슴살 샐러드                 │    │
│  │  🔥 280kcal | 💪 35g 단백질      │    │
│  │  ✅ 재료 100% 보유               │    │
│  │  ⏱️ 15분 | 난이도: 쉬움          │    │
│  │  [레시피 보기]                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ── 1~2개 재료만 더 있으면 ──            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  그릭 요거트 볼                  │    │
│  │  🔥 320kcal | 💪 28g 단백질      │    │
│  │  ⚠️ 부족: 그릭요거트             │    │
│  │  🛒 근처 마트에서 구매 가능       │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. K-5: 관리자/프로필 페이지

### 6.1 2026 UX/UI 트렌드 적용

> **참고**: [PHASE-K-RESEARCH.md](../research/PHASE-K-RESEARCH.md) 섹션 4.1

| 트렌드                   | 설명                            | 프로필 적용              | 관리자 적용            |
| ------------------------ | ------------------------------- | ------------------------ | ---------------------- |
| **주변 개인화**          | 환경/행동 패턴 기반 미묘한 조정 | 시간대별 인사말 변경     | 시간대별 주요 지표     |
| **벤토 박스**            | 정리된 그리드 기반 레이아웃     | 분석/활동/기록 섹션 분리 | 대시보드 카드 레이아웃 |
| **미니멀 데이터 시각화** | 복잡한 데이터를 간단하게        | 웰니스 스코어 링 차트    | 핵심 KPI 숫자 강조     |
| **윤리적 디자인**        | 다크 패턴 배제, 투명한 UX       | 명확한 설정/로그아웃     | 투명한 통계 표시       |

### 6.2 관리자 대시보드 요구사항

| 기능              | 설명                      | 핵심 KPI                        |
| ----------------- | ------------------------- | ------------------------------- |
| 사용자 통계       | DAU, MAU, 리텐션율        | DAU/MAU 비율, 7일 리텐션        |
| 분석 현황         | 모듈별 분석 완료 수       | 완료율, AI 성공률               |
| 어필리에이트 성과 | 클릭수, 전환율, 수익      | CTR, 전환율, 예상 월 수익       |
| 콘텐츠 관리       | FAQ, 공지사항 CRUD        | FAQ 조회수, 공지 도달률         |
| 오류 모니터링     | AI 분석 실패율, 에러 로그 | 실패율 <5%, 평균 응답 시간 <3초 |

### 6.2 사용자 프로필 페이지 개선

| 영역          | 현재        | 개선                          |
| ------------- | ----------- | ----------------------------- |
| 프로필 헤더   | 기본 정보만 | 웰니스 스코어, 레벨 뱃지 표시 |
| 분석 히스토리 | 없음        | 모든 분석 결과 타임라인       |
| 활동 요약     | 없음        | 주간/월간 활동 그래프         |
| 설정          | 산재        | 통합 설정 페이지              |
| 연동 계정     | 없음        | 소셜 로그인 연동 관리         |

### 6.3 UI: 프로필 페이지 리디자인 (벤토 박스 레이아웃)

```
┌─────────────────────────────────────────┐
│  [프로필 영역 - 상단 고정]               │
│  ┌───────────────────────────────────┐  │
│  │  [사진]  김이룸님                  │  │
│  │          🏆 Lv.12 웰니스 마스터    │  │
│  │          💎 스코어: 85점 (링 차트) │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  [벤토 박스 - 3열 그리드]                │
│  ┌─────────┬─────────┬─────────┐       │
│  │ 분석    │ 활동    │ 기록    │       │
│  │ 결과    │ 요약    │ 통계    │       │
│  │ ────    │ ────    │ ────    │       │
│  │ PC: 봄웜│ 운동 3일│ 체중 -2kg│       │
│  │ 피부:건성│ 식단 5일│ BMI 22.3│       │
│  │ 체형:역삼│ 물 2L  │ 달성 80%│       │
│  └─────────┴─────────┴─────────┘       │
│                                         │
│  ── 최근 활동 타임라인 ──                │
│  • 10:30 운동 완료 - 하체 루틴           │
│  • 08:00 식단 기록 - 아침 420kcal        │
│  • 어제 피부 분석 재시도                 │
│                                         │
│  ── 빠른 메뉴 ──                         │
│  [⚙️ 설정] [❓ 도움말] [👥 친구] [🚪 로그아웃]│
│                                         │
└─────────────────────────────────────────┘
```

> **디자인 원칙**: 벤토 박스 레이아웃으로 정보 밀도를 높이면서 시각적 정리 유지

---

## 6.5 AI 도메인 상담 확장 (Cross-cutting)

> **패턴**: Phase D (피부 상담) 패턴을 패션/영양/운동에 동일 적용
> **재사용**: 기존 AI 코치 인프라 (`lib/coach/*`) 확장

### 6.5.1 확장 대상 도메인

| 도메인         | 데이터 소스     | RAG 대상        | Phase K 연관    |
| -------------- | --------------- | --------------- | --------------- |
| **퍼스널컬러** | PC-1 분석 결과  | 색상 추천/코디  | K-1, K-2        |
| **패션**       | 옷장 인벤토리   | 의류/악세서리   | K-2             |
| **영양**       | 냉장고 인벤토리 | 레시피/식재료   | K-4             |
| **운동**       | 운동 기록       | 운동 루틴/장비  | (기존 W-1 강화) |
| 피부           | 피부 일기       | 화장품/스킨케어 | Phase D (별도)  |

### 6.5.2 공통 패턴 (Phase D 기반)

```
각 도메인별 확장 구조:
├── lib/coach/{domain}-rag.ts       # 도메인 RAG 검색
├── lib/coach/{domain}-context.ts   # 컨텍스트 강화 (선택)
├── components/{domain}/CoachCTA.tsx # 상담 진입 CTA
└── 빠른 질문 확장                   # QUICK_QUESTIONS_BY_CATEGORY
```

### 6.5.3 도메인별 구현 계획

#### 퍼스널컬러 상담 (K-1 연계)

```typescript
// lib/coach/personal-color-rag.ts
export async function searchByPersonalColor(
  userId: string,
  query: string,
  context: { seasonType: string; subSeason?: string }
): Promise<ColorSearchResult[]> {
  // 1. 시즌 타입 기반 색상 추천
  const recommendedColors = getSeasonColors(context.seasonType);

  // 2. 질문 의도 분석 (옷? 메이크업? 염색?)
  const intent = analyzeColorIntent(query);

  // 3. 의도별 맞춤 추천
  return generateColorRecommendations(recommendedColors, intent);
}
```

**빠른 질문 예시**:

- "내 퍼스널컬러에 안 어울리는 색이 뭐야?"
- "웜톤인데 쿨톤 옷 입어도 돼?"
- "내 시즌에 맞는 립 색상 추천해줘"
- "염색하려는데 어떤 색이 어울려?"
- "결혼식 하객룩 색상 추천해줘"
- "이 색 조합이 나한테 어울려?"

**컨텍스트 활용**:

- PC-1 분석 결과 (시즌 타입, 서브 시즌)
- 저장된 베스트/워스트 컬러
- 최근 저장한 코디 색상

#### 패션 상담 (K-2 연계)

```typescript
// lib/coach/fashion-rag.ts
export async function searchFashionItems(
  userId: string,
  query: string,
  context: { seasonType: string; bodyType: string }
): Promise<FashionSearchResult[]> {
  // 1. 사용자 옷장에서 검색
  const closetItems = await getItems(userId, { category: 'closet' });

  // 2. 퍼스널컬러/체형 기반 매칭
  const matched = closetItems.filter((item) => matchesPersonalColor(item, context.seasonType));

  // 3. 스타일 추천 생성
  return generateStyleRecommendations(matched, query);
}
```

**빠른 질문 예시**:

- "오늘 면접인데 뭐 입으면 좋을까요?"
- "내 옷장에서 데이트룩 추천해줘"
- "이 상의에 어울리는 하의는?"
- "내 퍼스널컬러에 맞는 코디 알려줘"

#### 영양 상담 (K-4 연계)

```typescript
// lib/coach/nutrition-rag.ts
export async function searchRecipes(
  userId: string,
  query: string,
  context: { goal: NutritionGoal; pantryItems: string[] }
): Promise<RecipeSearchResult[]> {
  // 1. 냉장고 재료 기반 레시피 검색
  const recipes = await recommendRecipes(userId, context.goal);

  // 2. 질문 의도 분석 (다이어트? 벌크업?)
  const intent = analyzeNutritionIntent(query);

  // 3. 맞춤 레시피 필터링
  return filterByIntent(recipes, intent);
}
```

**빠른 질문 예시**:

- "냉장고에 있는 재료로 뭐 해먹을까?"
- "다이어트 중인데 저녁 메뉴 추천해줘"
- "단백질 높은 레시피 알려줘"
- "남은 닭가슴살로 뭘 만들 수 있어?"

#### 운동 상담 (기존 강화)

```typescript
// lib/coach/workout-rag.ts (기존 확장)
export async function searchWorkouts(
  userId: string,
  query: string,
  context: { recentLogs: WorkoutLog[]; equipment: string[] }
): Promise<WorkoutSearchResult[]> {
  // 1. 최근 운동 기록 분석
  const muscleGroupsTrained = analyzeMuscleGroups(context.recentLogs);

  // 2. 보유 장비 기반 필터링
  const availableWorkouts = filterByEquipment(context.equipment);

  // 3. 휴식/분할 고려 추천
  return recommendWithRecovery(availableWorkouts, muscleGroupsTrained);
}
```

**빠른 질문 예시**:

- "어제 하체 했는데 오늘 뭐 해?"
- "집에서 덤벨로 할 수 있는 운동"
- "허리가 아픈데 할 수 있는 운동"
- "15분 안에 끝나는 전신 운동"

### 6.5.4 UI 진입점

```
각 결과 페이지에 AI 상담 CTA 추가:

┌─────────────────────────────────────────┐
│  [기존 결과 화면]                        │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│  💬 AI 코치에게 물어보기                 │
│  ┌─────────────────────────────────┐    │
│  │  "오늘 코디 어떻게 하면 좋을까요?" │    │
│  └─────────────────────────────────┘    │
│  [상담하기]                              │
│                                         │
└─────────────────────────────────────────┘
```

### 6.5.5 구현 우선순위

| 우선순위 | 도메인     | 이유                              | 예상 추가 작업 |
| -------- | ---------- | --------------------------------- | -------------- |
| 1        | 퍼스널컬러 | K-1 핵심, 모든 추천의 기반        | +80줄          |
| 2        | 패션       | K-2 핵심 기능, 옷장 데이터 활용   | +100줄         |
| 3        | 영양       | K-4 핵심 기능, 냉장고 데이터 활용 | +100줄         |
| 4        | 운동       | 기존 기능 강화, 선택적            | +50줄          |

**총 추가 작업**: +330줄 (기존 AI 코치 인프라 재사용)

---

## 7. 구현 계획

### 7.1 파일 생성 목록

| Sub-Phase | 신규 파일                                          |
| --------- | -------------------------------------------------- | ------------------------------ |
| K-1       | `lib/content/gender-adaptive.ts`                   |
| K-1       | `components/common/GenderToggle.tsx`               |
| K-1       | `lib/mock/accessories-male.ts`                     |
| K-2       | `lib/fashion/style-categories.ts`                  |
| K-2       | `lib/fashion/size-recommendation.ts`               |
| K-2       | `lib/fashion/best10-generator.ts`                  |
| K-2       | `components/styling/Best10Card.tsx`                |
| K-2       | `components/styling/WardrobeCoordinator.tsx`       |
| K-3       | `lib/body/bmi-calculator.ts`                       |
| K-3       | `lib/body/posture-correction.ts`                   |
| K-3       | `components/body/MeasurementsInput.tsx`            |
| K-3       | `components/body/PostureCorrectionGuide.tsx`       |
| K-4       | `lib/nutrition/recipe-matcher.ts`                  | `closetMatcher.ts` 패턴 재사용 |
| K-4       | `lib/nutrition/goal-calculator.ts`                 | 신규                           |
| K-4       | `components/nutrition/RecipeCard.tsx`              | 신규                           |
| K-4       | ~~`lib/nutrition/ingredient-inventory.ts`~~        | ❌ 기존 repository 재사용      |
| K-4       | ~~`components/nutrition/IngredientInventory.tsx`~~ | ❌ 기존 InventoryGrid 재사용   |
| K-5       | `app/admin/dashboard/page.tsx` (리디자인)          |
| K-5       | `app/(main)/profile/page.tsx` (리디자인)           |

### 7.2 기존 파일 수정

| 파일                                    | 변경 내용                |
| --------------------------------------- | ------------------------ |
| `lib/mock/personal-color.ts`            | 남성용 추천 데이터 추가  |
| `lib/mock/styling.ts`                   | 스타일 카테고리 확장     |
| `components/onboarding/*`               | 성별/키/몸무게 입력 추가 |
| `app/(main)/analysis/body/onboarding/*` | 신체 측정 입력 필드 추가 |
| `app/(main)/nutrition/*`                | 인벤토리/레시피 탭 추가  |

### 7.3 DB 스키마 변경

> **K-4 최적화**: 기존 `user_inventory` 테이블 활용으로 식재료 테이블 불필요

```sql
-- users 테이블 확장
ALTER TABLE users ADD COLUMN gender VARCHAR(10) DEFAULT 'neutral';
ALTER TABLE users ADD COLUMN height_cm INTEGER;
ALTER TABLE users ADD COLUMN weight_kg DECIMAL(5,2);
ALTER TABLE users ADD COLUMN body_fat_percentage DECIMAL(4,2);

-- 식재료 인벤토리: 기존 user_inventory 테이블 사용 (category='pantry')
-- ❌ user_ingredient_inventory (불필요 - 기존 user_inventory 재사용)
-- ❌ user_ingredient_preferences (불필요 - 기존 tags, is_favorite 활용)

-- 레시피 테이블만 신규 생성
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,       -- [{name, quantity, unit, optional}]
  steps JSONB NOT NULL,             -- [step1, step2, ...]
  nutrition_info JSONB NOT NULL,    -- {calories, protein, carbs, fat}
  cook_time INTEGER,                -- 분
  difficulty VARCHAR(20),           -- easy | medium | hard
  nutrition_goals TEXT[],           -- ['diet', 'bulk', 'lean', 'maintenance']
  source VARCHAR(50),               -- 출처 (공공API, 크롤링 등)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 레시피 인덱스
CREATE INDEX idx_recipes_goals ON recipes USING GIN (nutrition_goals);
CREATE INDEX idx_recipes_difficulty ON recipes (difficulty);
```

#### K-4 테이블 절감 효과

| 제안 테이블                   | 상태    | 절감 이유                                 |
| ----------------------------- | ------- | ----------------------------------------- |
| `user_ingredient_inventory`   | ❌ 제거 | `user_inventory` (category='pantry') 사용 |
| `user_ingredient_preferences` | ❌ 제거 | `user_inventory.tags`, `is_favorite` 활용 |
| `recipes`                     | ✅ 신규 | 레시피 데이터 저장 필요                   |

### 7.4 구현 순서

```
Phase K-1: 성별 중립화 (3일)
├── Day 1: 온보딩 성별 선택, DB 마이그레이션
├── Day 2: 콘텐츠 조건부 렌더링, Mock 확장
└── Day 3: UI 수정, 테스트

Phase K-2: 패션 확장 (5일)
├── Day 1: 스타일 카테고리 타입/Mock
├── Day 2: Best 10 생성 로직
├── Day 3: 사이즈 추천 로직
├── Day 4: UI 컴포넌트 (Best10Card, WardrobeCoordinator)
└── Day 5: 옷장 연동, 테스트

Phase K-3: 체형 분석 강화 (3일)
├── Day 1: 키/몸무게 입력, BMI 계산
├── Day 2: 자세 교정 운동 데이터/UI
└── Day 3: 통합, 테스트

Phase K-4: 영양/레시피 확장 (3일) ← 2일 단축
├── Day 1: PantryMetadata 확장, recipes 테이블, 타입 정의
├── Day 2: recipe-matcher.ts (closetMatcher 패턴), goal-calculator.ts
└── Day 3: RecipeCard UI, 기존 인벤토리 페이지에 pantry 탭 활성화, 테스트
※ 기존 인프라 재사용으로 인벤토리 CRUD 작업 생략

Phase K-5: 관리자/프로필 (2일)
├── Day 1: 프로필 리디자인
└── Day 2: 관리자 대시보드 개선
```

### 7.5 예상 작업량

| Sub-Phase | 예상 코드량  | 테스트 수  | 비고                               |
| --------- | ------------ | ---------- | ---------------------------------- |
| K-1       | ~600줄       | ~30개      |                                    |
| K-2       | ~1,500줄     | ~80개      |                                    |
| K-3       | ~800줄       | ~40개      |                                    |
| K-4       | **~400줄**   | **~25개**  | ⬇️ 800줄 절감 (기존 인프라 재사용) |
| K-5       | ~500줄       | ~20개      |                                    |
| **총합**  | **~3,800줄** | **~195개** | ⬇️ 800줄 절감                      |

#### K-4 절감 상세

| 항목        | 원래 예상 | 재사용 후 | 절감                        |
| ----------- | --------- | --------- | --------------------------- |
| 식재료 CRUD | 400줄     | 0줄       | -400줄 (기존 repository)    |
| 인벤토리 UI | 300줄     | 0줄       | -300줄 (기존 InventoryGrid) |
| 레시피 추천 | 300줄     | 250줄     | -50줄 (패턴 재사용)         |
| 목표 계산기 | 200줄     | 150줄     | -50줄                       |

---

## 8. 리스크 및 대응

| 리스크                     | 가능성 | 영향 | 대응                             |
| -------------------------- | ------ | ---- | -------------------------------- |
| 성별 중립화로 기존 UX 혼란 | 중     | 중   | A/B 테스트 후 점진적 적용        |
| 레시피 DB 부족             | 중     | 높음 | 외부 API 연동 또는 크롤링 검토   |
| BMI 계산 오해              | 중     | 중   | 의학적 면책조항 추가             |
| 옷장 연동 복잡도           | 높음   | 중   | MVP: 수동 입력 → 후속: 사진 인식 |
| 관리자 기능 과다           | 낮음   | 낮음 | 우선순위 지정 후 점진적 추가     |

---

## 9. 시지푸스 트랙 분석

### 9.1 복잡도 점수

| Sub-Phase | 파일 수 | DB 변경 | 외부 API | 총점   | 트랙     | 비고                |
| --------- | ------- | ------- | -------- | ------ | -------- | ------------------- |
| K-1       | 6       | O       | X        | 50     | Standard |                     |
| K-2       | 8       | X       | X        | 50     | Standard | ⬇️ 기존 인프라 활용 |
| K-3       | 6       | O       | X        | 50     | Standard |                     |
| K-4       | **5**   | O       | △        | **55** | Standard | ⬇️ 대폭 간소화      |
| K-5       | 4       | X       | X        | 35     | Light    |                     |
| **전체**  | **29**  | O       | △        | **75** | **Full** | ⬇️ 복잡도 감소      |

### 9.2 권장 전략

전체 Phase K는 **Full 트랙**으로, 각 Sub-Phase별로 시지푸스 오케스트레이터 사용 권장.

---

## 10. 기존 인프라 재사용 요약

> **Phase I 인벤토리 시스템을 Phase K에서 최대한 활용**

### 10.1 총 절감 효과

| 항목      | 원래 예상 | 재사용 후 | 절감률    |
| --------- | --------- | --------- | --------- |
| 코드량    | 4,600줄   | 3,800줄   | **17% ↓** |
| 테스트 수 | 230개     | 195개     | **15% ↓** |
| DB 테이블 | 5개 신규  | 2개 신규  | **60% ↓** |
| 작업 기간 | 18일      | 16일      | **11% ↓** |

### 10.2 재사용 매핑

```
Phase I 인벤토리          →    Phase K 활용
─────────────────────────────────────────────
user_inventory (pantry)   →    K-4 식재료 인벤토리
PantryMetadata            →    K-4 식재료 메타데이터
repository.ts CRUD        →    K-4 식재료 CRUD
closetMatcher.ts          →    K-2 옷장 연동, K-4 레시피 매칭
ItemUploader              →    K-4 식재료 스캔
InventoryGrid             →    K-4 식재료 목록
CLOTHING_SUB_CATEGORIES   →    K-2 악세서리/신발 확장
```

---

## 11. 구현 현황 (2026-01-12 기준)

### ✅ 완료된 기능

| 기능              | 파일                                             | 상태                   |
| ----------------- | ------------------------------------------------ | ---------------------- |
| 퍼스널컬러 RAG    | `lib/coach/personal-color-rag.ts`                | ✅ 구현 완료           |
| 패션 RAG          | `lib/coach/fashion-rag.ts`                       | ✅ 구현 완료           |
| 영양 RAG          | `lib/coach/nutrition-rag.ts`                     | ✅ 구현 완료           |
| 운동 RAG          | `lib/coach/workout-rag.ts`                       | ✅ 구현 완료           |
| 피부 RAG          | `lib/coach/skin-rag.ts`                          | ✅ 구현 완료 (Phase D) |
| 범용 CTA 컴포넌트 | `components/coach/ConsultantCTA.tsx`             | ✅ 구현 완료           |
| 피부 전용 CTA     | `components/skin/SkinConsultantCTA.tsx`          | ✅ 구현 완료           |
| 채팅 히스토리 DB  | `migrations/202601120100_coach_chat_history.sql` | ✅ 마이그레이션 생성   |
| 채팅 히스토리 API | `app/api/coach/sessions/*`                       | ✅ CRUD API 구현       |
| 스트리밍 UI       | `components/coach/ChatInterface.tsx`             | ✅ SSE 스트리밍 지원   |

### 페이지별 CTA 통합 현황

| 페이지          | CTA 카테고리  | 상태         |
| --------------- | ------------- | ------------ |
| 퍼스널컬러 결과 | personalColor | ✅ 통합 완료 |
| 피부 분석 결과  | skin          | ✅ 통합 완료 |
| 체형 분석 결과  | fashion       | ✅ 통합 완료 |
| 운동 결과       | workout       | ✅ 통합 완료 |
| 영양 페이지     | nutrition     | ✅ 통합 완료 |

### 테스트 현황

- `tests/lib/coach/*.test.ts`: RAG 모듈 테스트 (84개)
- `tests/components/coach/ConsultantCTA.test.tsx`: CTA 컴포넌트 테스트
- `tests/lib/coach/history.test.ts`: 채팅 히스토리 테스트 (13개)
- `e2e/coach/coach-cta.spec.ts`: E2E 테스트

### 📋 남은 기능

| 기능            | Sub-Phase | 우선순위                   |
| --------------- | --------- | -------------------------- |
| 성별 중립화 UI  | K-1       | 🟡 낮음 (사용자 제외 요청) |
| 패션 Best 10    | K-2       | 🟠 중간                    |
| BMI 계산기      | K-3       | ✅ 기존 구현 확인됨        |
| 레시피 추천     | K-4       | 🟠 중간                    |
| 프로필 리디자인 | K-5       | 🟡 낮음                    |

---

## 12. 변경 이력

| 버전 | 날짜       | 변경 내용                                                 |
| ---- | ---------- | --------------------------------------------------------- |
| 0.5  | 2026-01-12 | AI 도메인 상담 구현 완료 (RAG, CTA, 채팅 히스토리)        |
| 0.4  | 2026-01-12 | AI 도메인 상담 확장 섹션 추가 (퍼스널컬러/패션/영양/운동) |
| 0.3  | 2026-01-11 | 기존 인프라 재사용 전략 추가 (K-2, K-4)                   |
| 0.2  | 2026-01-11 | 리서치 결과 반영 (트렌드, BMI, API, UX)                   |
| 0.1  | 2026-01-11 | 초안 작성 - 사용자 요구사항 기반 스펙 정의                |

---

**Status**: In Progress (AI 도메인 상담 구현 완료)

---

# SPEC-PHASE-L-M.md

# Phase L/M 기술 스펙 문서

> 미구현/부분 구현 항목 종합 및 개발 계획

**작성일**: 2026-01-12
**버전**: 1.0

---

## 목차

1. [현황 요약](#1-현황-요약)
2. [Phase L: 사용자 온보딩 고도화](#2-phase-l-사용자-온보딩-고도화)
3. [Phase L-2: 자세 교정 시스템](#3-phase-l-2-자세-교정-시스템)
4. [Phase L-3: 패션 고도화](#4-phase-l-3-패션-고도화)
5. [Phase M: 영양 고도화](#5-phase-m-영양-고도화)
6. [DB 스키마 변경](#6-db-스키마-변경)
7. [구현 우선순위](#7-구현-우선순위)
8. [기술 의존성](#8-기술-의존성)

---

## 1. 현황 요약

### 1.1 미구현 항목

| 항목                     | 현재 상태      | 필요 작업                 | 우선순위  |
| ------------------------ | -------------- | ------------------------- | --------- |
| **성별 선택 온보딩**     | N-1에서만 수집 | 초기 온보딩에 성별 필수화 | 🔴 High   |
| **체지방률 입력**        | 타입만 정의됨  | 입력 필드 + DB 저장       | 🟡 Medium |
| **자세 교정 시뮬레이터** | Mock만 존재    | AI 분석 + 2D 오버레이     | 🟡 Medium |
| **베스트 운동 Top 5**    | 추천만 있음    | 목적별 랭킹 시스템        | 🟢 Low    |
| **힙합/스트릿 카테고리** | 없음           | 스타일 카테고리 확장      | 🟢 Low    |
| **냉장고 UI**            | DB만 존재      | 페이지 + 컴포넌트         | 🟡 Medium |
| **레시피 DB**            | 하드코딩 10개  | 테이블 + 100개 레시피     | 🟡 Medium |

### 1.2 부분 구현 항목

| 항목               | 현재 상태          | 필요 작업             |
| ------------------ | ------------------ | --------------------- |
| **옷 사이즈 추천** | BMI 기반 기초 로직 | 체형 + 상세 치수 연동 |
| **가상 피팅**      | 배경색 비교만      | 의류 오버레이 시뮬    |
| **자세 분석**      | Mock 데이터만      | Gemini AI 연동        |
| **레시피 매칭**    | 10개 고정          | 확장 + 세마틱 매칭    |

---

## 2. Phase L: 사용자 온보딩 고도화

### L-1: 성별 선택 온보딩 필수화

#### 2.1.1 현재 플로우

```
Clerk 회원가입 → /agreement (약관) → /dashboard → (선택) /nutrition/onboarding (성별 수집)
```

#### 2.1.2 변경 플로우

```
Clerk 회원가입 → /agreement (약관 + 성별) → /onboarding (분석 선택) → /dashboard
```

#### 2.1.3 구현 상세

**파일 수정**: `apps/web/app/agreement/page.tsx`

```typescript
// 약관 동의 페이지에 성별 선택 추가
interface AgreementFormData {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  gender: 'male' | 'female'; // 새 필드 (필수)
}
```

**UI 컴포넌트**:

```tsx
<div className="space-y-3 mb-6">
  <label className="block text-sm font-medium">
    성별 <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setGender('male')}
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        gender === 'male' ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <span className="text-2xl">👨</span>
      <p className="mt-1 font-medium">남성</p>
    </button>
    <button
      onClick={() => setGender('female')}
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        gender === 'female' ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <span className="text-2xl">👩</span>
      <p className="mt-1 font-medium">여성</p>
    </button>
  </div>
</div>
```

**API 수정**: `apps/web/app/api/agreement/route.ts`

```typescript
// POST 요청에 gender 포함
const { termsAgreed, privacyAgreed, marketingAgreed, gender } = await req.json();

// users 테이블에도 gender 저장
await supabase.from('users').update({ gender }).eq('clerk_user_id', userId);
```

**타입 통일**: `apps/web/types/user.ts`

```typescript
// 기존 3가지 타입 통일
export type Gender = 'male' | 'female';

// DB 스키마 업데이트 (other 제거)
// ALTER TABLE users DROP CONSTRAINT users_gender_check;
// ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (gender IN ('male', 'female'));
```

---

### L-1-2: 키/몸무게/체지방 필수화

#### 2.2.1 입력 필드 구성

| 필드                     | 필수 여부 | 입력 위치        | 범위      |
| ------------------------ | --------- | ---------------- | --------- |
| 키 (height)              | ✅ 필수   | 패션/운동 온보딩 | 100-250cm |
| 몸무게 (weight)          | ✅ 필수   | 패션/운동 온보딩 | 20-200kg  |
| BMI                      | 자동 계산 | -                | 자동      |
| 체지방률 (bodyFat)       | 선택      | 패션/운동 온보딩 | 3-60%     |
| 목표 체중 (targetWeight) | 선택      | 운동 온보딩      | -         |

#### 2.2.2 입력 게이트 구현

**파일**: `apps/web/app/(main)/style/page.tsx` (수정)

```typescript
// 패션 페이지 진입 시 키/몸무게 체크
const { data: measurements } = await supabase
  .from('user_body_measurements')
  .select('height, weight')
  .eq('clerk_user_id', userId)
  .single();

if (!measurements?.height || !measurements?.weight) {
  redirect('/style/onboarding'); // 신체 정보 입력 페이지로 이동
}
```

**새 페이지**: `apps/web/app/(main)/style/onboarding/page.tsx`

```tsx
export default function StyleOnboardingPage() {
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);

  const bmi = height && weight ? Math.round((weight / (height / 100) ** 2) * 10) / 10 : null;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">맞춤 스타일링을 위해 알려주세요</h1>

      {/* 키 입력 */}
      <div className="mb-4">
        <label>키 (cm) *</label>
        <Input
          type="number"
          min={100}
          max={250}
          value={height || ''}
          onChange={(e) => setHeight(Number(e.target.value))}
        />
      </div>

      {/* 몸무게 입력 */}
      <div className="mb-4">
        <label>몸무게 (kg) *</label>
        <Input
          type="number"
          min={20}
          max={200}
          value={weight || ''}
          onChange={(e) => setWeight(Number(e.target.value))}
        />
      </div>

      {/* BMI 미리보기 */}
      {bmi && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p>
            BMI: <strong>{bmi}</strong> ({getBMICategory(bmi)})
          </p>
        </div>
      )}

      {/* 체지방률 (선택) */}
      <div className="mb-4">
        <label>체지방률 (%) - 선택</label>
        <Input
          type="number"
          min={3}
          max={60}
          value={bodyFat || ''}
          onChange={(e) => setBodyFat(Number(e.target.value))}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!height || !weight}>
        저장하고 시작하기
      </Button>
    </div>
  );
}
```

---

## 3. Phase L-2: 자세 교정 시스템

### 3.1 자세 분석 AI 통합

#### 3.1.1 현재 상태

- Mock 데이터만 존재 (`lib/mock/posture-analysis.ts`)
- 6가지 자세 타입 정의됨: ideal, forward_head, rounded_shoulders, swayback, flatback, lordosis
- UI 컴포넌트 존재: `PostureResultCard.tsx`, `StretchingRecommendation.tsx`

#### 3.1.2 구현 계획

**Gemini 프롬프트 추가**: `lib/gemini.ts`

```typescript
export async function analyzePosture(imageBase64: string): Promise<PostureAnalysisResult> {
  const prompt = `
당신은 전문 물리치료사 기반 AI 자세 분석가입니다.

📷 이미지 분석:
- 정면 또는 측면 전신 사진
- 배경에 수직 기준선 필요 시 가상으로 생성

📊 분석 항목:
1. 머리 전방 각도 (Head Forward Angle)
   - 정상: 0-15도
   - 거북목: 15도 이상

2. 어깨 대칭도 (Shoulder Symmetry)
   - 좌우 높이 차이 (cm)

3. 골반 기울기 (Pelvic Tilt)
   - 전방 경사: anterior
   - 후방 경사: posterior
   - 정상: neutral

4. 척추 곡률 (Spine Curvature)
   - 과전만: lordosis
   - 일자: flatback
   - 정상: normal

다음 JSON 형식으로 응답:
{
  "postureType": "ideal|forward_head|rounded_shoulders|swayback|flatback|lordosis",
  "overallScore": [0-100],
  "confidence": [0-100],
  "measurements": {
    "headForwardAngle": [도],
    "shoulderDifference": [cm],
    "pelvicTilt": "anterior|posterior|neutral",
    "spineCurvature": "lordosis|flatback|normal"
  },
  "issues": ["문제1", "문제2"],
  "recommendedStretches": ["운동ID1", "운동ID2"]
}
`;

  // Gemini API 호출
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    { text: prompt },
  ]);

  return parsePostureResult(result);
}
```

#### 3.1.3 2D 오버레이 시뮬레이터

**새 컴포넌트**: `components/analysis/visual/PostureSimulator.tsx`

```tsx
interface PostureSimulatorProps {
  imageUrl: string;
  measurements: PostureMeasurements;
  showGuides: boolean;
}

export function PostureSimulator({ imageUrl, measurements, showGuides }: PostureSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showGuides) {
        // 수직 기준선 (녹색)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        // 머리 전방 각도 표시 (빨간색)
        if (measurements.headForwardAngle > 15) {
          ctx.strokeStyle = '#ef4444';
          ctx.setLineDash([]);
          // 각도 호 그리기...
        }

        // 어깨 수평선 (파란색)
        ctx.strokeStyle = '#3b82f6';
        // ...
      }
    };
  }, [imageUrl, measurements, showGuides]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full" />
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button size="sm" variant="outline">
          교정 전
        </Button>
        <Button size="sm" variant="default">
          교정 후 예상
        </Button>
      </div>
    </div>
  );
}
```

### 3.2 목적별 운동 Best 5

#### 3.2.1 구현 상세

**새 파일**: `lib/workout/best5-generator.ts`

```typescript
export type ExerciseGoal =
  | 'posture_correction' // 자세 교정
  | 'weight_loss' // 체중 감량
  | 'muscle_gain' // 근육 증가
  | 'flexibility' // 유연성
  | 'endurance'; // 지구력

export interface Best5Result {
  goal: ExerciseGoal;
  exercises: ExerciseRecommendation[];
  totalDuration: number;
  estimatedCalories: number;
}

// 자세 문제별 교정 운동 매핑
const POSTURE_EXERCISES: Record<PostureType, string[]> = {
  forward_head: [
    'chin-tuck',
    'neck-stretch',
    'upper-trap-stretch',
    'wall-angel',
    'thoracic-extension',
  ],
  rounded_shoulders: [
    'chest-stretch',
    'band-pull-apart',
    'face-pull',
    'external-rotation',
    'prone-y-raise',
  ],
  swayback: ['dead-bug', 'hip-flexor-stretch', 'glute-bridge', 'plank', 'bird-dog'],
  flatback: ['cat-cow', 'lumbar-extension', 'superman', 'child-pose', 'cobra'],
  lordosis: ['pelvic-tilt', 'glute-bridge', 'plank', 'dead-bug', 'hamstring-stretch'],
  ideal: ['full-body-stretch', 'light-cardio', 'yoga-flow', 'foam-rolling', 'breathing'],
};

export function generateBest5(
  goal: ExerciseGoal,
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): Best5Result {
  // 목표별 운동 선택 로직
  let exerciseIds: string[];

  if (goal === 'posture_correction' && userProfile?.postureType) {
    exerciseIds = POSTURE_EXERCISES[userProfile.postureType];
  } else {
    exerciseIds = GOAL_EXERCISES[goal];
  }

  // 운동 상세 정보 조회
  const exercises = exerciseIds.map((id) => getExerciseById(id));

  return {
    goal,
    exercises,
    totalDuration: exercises.reduce((sum, e) => sum + e.duration, 0),
    estimatedCalories: exercises.reduce((sum, e) => sum + e.calories, 0),
  };
}
```

#### 3.2.2 UI 컴포넌트

**새 컴포넌트**: `components/workout/Best5Card.tsx`

```tsx
interface Best5CardProps {
  goal: ExerciseGoal;
  postureType?: PostureType;
}

export function Best5Card({ goal, postureType }: Best5CardProps) {
  const { exercises, totalDuration, estimatedCalories } = useMemo(
    () => generateBest5(goal, { postureType }),
    [goal, postureType]
  );

  const goalLabels: Record<ExerciseGoal, { icon: string; title: string }> = {
    posture_correction: { icon: '🧘', title: '자세 교정' },
    weight_loss: { icon: '🔥', title: '체중 감량' },
    muscle_gain: { icon: '💪', title: '근육 증가' },
    flexibility: { icon: '🤸', title: '유연성' },
    endurance: { icon: '🏃', title: '지구력' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{goalLabels[goal].icon}</span>
          {goalLabels[goal].title} Best 5
        </CardTitle>
        <CardDescription>
          총 {totalDuration}분 | 약 {estimatedCalories}kcal 소모
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {exercise.duration}분 | {exercise.targetArea}
                </p>
              </div>
              <Button size="sm" variant="ghost">
                상세
              </Button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Phase L-3: 패션 고도화

### 4.1 스타일 카테고리 확장

#### 4.1.1 현재 카테고리 (7개)

- casual, formal, street, minimal, sporty, classic, preppy

#### 4.1.2 추가 카테고리 (3개)

```typescript
// lib/fashion/best10-generator.ts 수정
export type StyleCategory =
  | 'casual'
  | 'formal'
  | 'street'
  | 'minimal'
  | 'sporty'
  | 'classic'
  | 'preppy'
  | 'hiphop' // 힙합 (새로 추가)
  | 'romantic' // 로맨틱 (새로 추가)
  | 'workwear'; // 워크웨어 (새로 추가)

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  // 기존...
  hiphop: '힙합',
  romantic: '로맨틱',
  workwear: '워크웨어',
};

// 카테고리 설명
export const STYLE_CATEGORY_DESCRIPTIONS: Record<StyleCategory, string> = {
  casual: '편안하면서도 스타일리시한 일상 코디',
  formal: '비즈니스와 공식 자리를 위한 격식있는 스타일',
  street: '트렌디하고 개성있는 스트릿 패션',
  minimal: '군더더기 없는 깔끔하고 세련된 스타일',
  sporty: '활동적이고 건강한 이미지의 스포티 룩',
  classic: '시대를 초월하는 클래식한 스타일',
  preppy: '단정하고 지적인 프레피 스타일',
  hiphop: '오버사이즈와 스트릿 감성의 힙합 스타일',
  romantic: '여성스럽고 우아한 로맨틱 스타일',
  workwear: '실용적이고 튼튼한 워크웨어 스타일',
};
```

#### 4.1.3 힙합 스타일 데이터

```typescript
// 힙합 Best 10 코디
const HIPHOP_OUTFITS: OutfitRecommendation[] = [
  {
    id: 'hiphop-1',
    name: '오버사이즈 후디 레이어드',
    description: '편안하면서 트렌디한 힙합 기본 룩',
    items: [
      { type: 'top', name: '오버사이즈 후디', color: 'black', brand: 'Supreme' },
      { type: 'inner', name: '롱 티셔츠', color: 'white' },
      { type: 'bottom', name: '와이드 카고팬츠', color: 'khaki' },
      { type: 'shoes', name: '에어포스1', color: 'white', brand: 'Nike' },
      { type: 'accessory', name: '체인 목걸이', material: 'silver' },
    ],
    occasions: ['casual', 'hangout'],
    seasons: ['spring', 'autumn'],
    personalColors: ['autumn', 'winter'],
  },
  // ... 9개 더
];
```

### 4.2 옷 사이즈 추천 고도화

#### 4.2.1 체형 + 치수 연동

**파일 수정**: `lib/smart-matching/size-recommend.ts`

```typescript
export interface EnhancedSizeRecommendation {
  size: ClothingSize;
  confidence: number;
  reasoning: string;
  adjustments?: {
    reason: string;
    fromSize: ClothingSize;
    toSize: ClothingSize;
  };
}

export function recommendSizeEnhanced(
  product: Product,
  userProfile: {
    height: number;
    weight: number;
    bodyType: BodyType;
    measurements?: UserBodyMeasurements;
    preferredFit: 'tight' | 'regular' | 'loose';
  }
): EnhancedSizeRecommendation {
  // 1. 기본 BMI 기반 추론
  const bmi = userProfile.weight / (userProfile.height / 100) ** 2;
  let baseSize = bmiToSize(bmi);

  // 2. 체형별 조정
  const bodyTypeAdjustment = BODY_TYPE_SIZE_ADJUSTMENTS[userProfile.bodyType];
  if (bodyTypeAdjustment[product.category]) {
    baseSize = adjustSize(baseSize, bodyTypeAdjustment[product.category]);
  }

  // 3. 상세 치수 기반 조정 (있는 경우)
  if (userProfile.measurements) {
    const measurementSize = measurementsToSize(
      userProfile.measurements,
      product.category,
      product.sizeChart
    );
    if (measurementSize !== baseSize) {
      // 더 정확한 치수 기반 사이즈 우선
      baseSize = measurementSize;
    }
  }

  // 4. 선호 핏 반영
  if (userProfile.preferredFit === 'tight') {
    baseSize = adjustSizeDown(baseSize);
  } else if (userProfile.preferredFit === 'loose') {
    baseSize = adjustSizeUp(baseSize);
  }

  return {
    size: baseSize,
    confidence: calculateConfidence(userProfile),
    reasoning: generateReasoning(userProfile, baseSize),
  };
}

// 체형별 사이즈 조정 규칙
const BODY_TYPE_SIZE_ADJUSTMENTS: Record<BodyType, Partial<Record<ClothingCategory, number>>> = {
  // S/W/N 체형 (새 체형 시스템)
  S: { top: 0, bottom: 0 }, // 스트레이트: 표준
  W: { top: 0, bottom: 1 }, // 웨이브: 하의 한 사이즈 업
  N: { top: 1, bottom: 0 }, // 내추럴: 상의 한 사이즈 업 (어깨 넓음)

  // 레거시 체형 (8타입)
  X: { top: 0, bottom: 0 }, // 모래시계: 표준
  A: { top: -1, bottom: 1 }, // 배(하체발달): 상의 다운, 하의 업
  V: { top: 1, bottom: -1 }, // 역삼각(상체발달): 상의 업, 하의 다운
  H: { top: 0, bottom: 0 }, // 직사각: 표준
  O: { top: 1, bottom: 1 }, // 원형: 전체 업
};
```

---

## 5. Phase M: 영양 고도화

### 5.1 냉장고 UI 구현

#### 5.1.1 페이지 구조

```
apps/web/app/(main)/inventory/pantry/
├── page.tsx              # 냉장고 목록
├── add/page.tsx          # 재료 추가
└── [id]/
    └── edit/page.tsx     # 재료 수정
```

#### 5.1.2 메인 페이지

**파일**: `apps/web/app/(main)/inventory/pantry/page.tsx`

```tsx
export default async function PantryPage() {
  const supabase = createClerkSupabaseClient();
  const { userId } = await auth();

  // 냉장고 재료 조회
  const { data: items } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('category', 'pantry')
    .order('expiry_date', { ascending: true });

  // 만료 임박 재료 (3일 이내)
  const expiringItems = items?.filter((item) => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(item.expiry_date), new Date());
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">내 냉장고</h1>
        <Button asChild>
          <Link href="/inventory/pantry/add">
            <Plus className="w-4 h-4 mr-2" />
            재료 추가
          </Link>
        </Button>
      </div>

      {/* 만료 임박 경고 */}
      {expiringItems && expiringItems.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{expiringItems.length}개 재료가 곧 만료됩니다!</AlertDescription>
        </Alert>
      )}

      {/* 보관 위치별 탭 */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="refrigerator">냉장</TabsTrigger>
          <TabsTrigger value="freezer">냉동</TabsTrigger>
          <TabsTrigger value="room">상온</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PantryGrid items={items} />
        </TabsContent>
        {/* 다른 탭들... */}
      </Tabs>

      {/* 레시피 추천 CTA */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>이 재료로 뭘 만들까요?</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/nutrition/recipes">레시피 추천 받기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5.1.3 재료 추가 페이지

**파일**: `apps/web/app/(main)/inventory/pantry/add/page.tsx`

```tsx
export default function AddPantryItemPage() {
  const [formData, setFormData] = useState<PantryItemForm>({
    name: '',
    brand: '',
    quantity: 1,
    unit: 'g',
    storageType: 'refrigerator',
    expiryDate: null,
    imageUrl: null,
  });

  return (
    <div className="container max-w-md py-6">
      <h1 className="text-2xl font-bold mb-6">재료 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이미지 업로드 */}
        <ImageUpload
          value={formData.imageUrl}
          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
        />

        {/* 재료명 */}
        <div>
          <Label>재료명 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 닭가슴살"
          />
        </div>

        {/* 브랜드 (선택) */}
        <div>
          <Label>브랜드</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="예: 하림"
          />
        </div>

        {/* 수량 + 단위 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>수량 *</Label>
            <Input
              type="number"
              min={0}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>단위 *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="개">개</SelectItem>
                <SelectItem value="팩">팩</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 보관 위치 */}
        <div>
          <Label>보관 위치 *</Label>
          <RadioGroup
            value={formData.storageType}
            onValueChange={(value) =>
              setFormData({ ...formData, storageType: value as StorageType })
            }
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="refrigerator" id="refrigerator" />
              <Label htmlFor="refrigerator">🧊 냉장</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="freezer" id="freezer" />
              <Label htmlFor="freezer">❄️ 냉동</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="room" id="room" />
              <Label htmlFor="room">🏠 상온</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 유통기한 */}
        <div>
          <Label>유통기한</Label>
          <Input
            type="date"
            value={formData.expiryDate || ''}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full">
          추가하기
        </Button>
      </form>
    </div>
  );
}
```

### 5.2 레시피 DB 확장

#### 5.2.1 마이그레이션

**파일**: `supabase/migrations/202601120100_recipes.sql`

```sql
-- 레시피 테이블
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,

  -- 영양 정보
  calories INTEGER,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),

  -- 메타데이터
  cook_time INTEGER,                    -- 분 단위
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER DEFAULT 1,

  -- 목표 태그
  nutrition_goals TEXT[],               -- ['diet', 'bulk', 'lean', 'maintenance']
  tags TEXT[],                          -- 검색용 태그

  -- 조리법
  steps JSONB NOT NULL,                 -- ["1단계", "2단계", ...]
  tips TEXT[],                          -- 요리 팁

  image_url TEXT,
  source TEXT,                          -- 출처

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 레시피 재료 테이블
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                   -- 재료명
  amount DECIMAL(10,2),                 -- 양
  unit TEXT,                            -- 단위 (g, ml, 개, 큰술 등)

  is_optional BOOLEAN DEFAULT false,    -- 선택 재료 여부
  category TEXT,                        -- vegetable, meat, seafood, dairy, grain, seasoning

  notes TEXT,                           -- 추가 설명 (예: "다진 것")

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 즐겨찾기 레시피
CREATE TABLE public.user_favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (clerk_user_id, recipe_id)
);

-- 인덱스
CREATE INDEX idx_recipes_nutrition_goals ON recipes USING GIN (nutrition_goals);
CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(name);
CREATE INDEX idx_user_favorite_recipes_user ON user_favorite_recipes(clerk_user_id);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;

-- 레시피/재료는 모두 읽기 가능
CREATE POLICY "recipes_read" ON recipes FOR SELECT USING (true);
CREATE POLICY "recipe_ingredients_read" ON recipe_ingredients FOR SELECT USING (true);

-- 즐겨찾기는 본인만
CREATE POLICY "user_favorite_recipes_own" ON user_favorite_recipes
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

#### 5.2.2 시드 데이터 (100개 레시피)

```sql
-- supabase/seed/recipes.sql
INSERT INTO recipes (name, description, calories, protein, carbs, fat, cook_time, difficulty, nutrition_goals, steps) VALUES
('닭가슴살 샐러드', '단백질 가득 다이어트 샐러드', 280, 35, 10, 8, 15, 'easy', ARRAY['diet', 'lean'], '["닭가슴살 굽기", "채소 손질", "드레싱 뿌리기"]'),
('소고기 덮밥', '든든한 한 끼 벌크업 메뉴', 650, 35, 70, 20, 25, 'easy', ARRAY['bulk', 'maintenance'], '["소고기 볶기", "양념장 만들기", "밥 위에 올리기"]'),
-- ... 98개 더
```

---

## 6. DB 스키마 변경

### 6.1 users 테이블 수정

```sql
-- 성별 제약조건 수정 (other 제거)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE users ADD CONSTRAINT users_gender_check
  CHECK (gender IN ('male', 'female'));

-- 체지방률 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,1)
  CHECK (body_fat_percentage >= 3 AND body_fat_percentage <= 60);

COMMENT ON COLUMN users.body_fat_percentage IS '체지방률 (3-60%)';
```

### 6.2 자세 분석 테이블 추가

```sql
-- 자세 분석 결과
CREATE TABLE public.posture_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분석 결과
  posture_type TEXT NOT NULL CHECK (posture_type IN (
    'ideal', 'forward_head', 'rounded_shoulders',
    'swayback', 'flatback', 'lordosis'
  )),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),

  -- 측정값
  measurements JSONB NOT NULL,
  -- {
  --   "headForwardAngle": 20,
  --   "shoulderDifference": 2.5,
  --   "pelvicTilt": "anterior",
  --   "spineCurvature": "normal"
  -- }

  -- 문제점 및 추천
  issues TEXT[],
  recommended_stretches TEXT[],            -- 운동 ID 배열

  -- 이미지
  front_image_url TEXT,
  side_image_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT fk_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_posture_assessments_user ON posture_assessments(clerk_user_id);
CREATE INDEX idx_posture_assessments_created ON posture_assessments(created_at DESC);

-- RLS
ALTER TABLE posture_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posture_own" ON posture_assessments
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

---

## 7. 구현 우선순위

### 7.1 Phase L (1차)

| 순서  | 태스크                | 예상 작업량 | 의존성 |
| ----- | --------------------- | ----------- | ------ |
| L-1-1 | 성별 선택 온보딩      | 4시간       | -      |
| L-1-2 | 키/몸무게 필수 게이트 | 3시간       | L-1-1  |
| L-1-3 | 체지방률 입력 필드    | 2시간       | L-1-2  |
| L-2-1 | 자세 분석 AI 프롬프트 | 4시간       | -      |
| L-2-2 | 자세 시뮬레이터 UI    | 6시간       | L-2-1  |
| L-2-3 | 운동 Best 5 생성기    | 4시간       | L-2-1  |

### 7.2 Phase L (2차)

| 순서  | 태스크                        | 예상 작업량 | 의존성 |
| ----- | ----------------------------- | ----------- | ------ |
| L-3-1 | 힙합/로맨틱/워크웨어 카테고리 | 3시간       | -      |
| L-3-2 | 옷 사이즈 추천 고도화         | 5시간       | -      |
| L-3-3 | 가상 피팅 시뮬레이터          | 8시간       | -      |

### 7.3 Phase M

| 순서  | 태스크                     | 예상 작업량 | 의존성 |
| ----- | -------------------------- | ----------- | ------ |
| M-1-1 | 냉장고 목록 페이지         | 4시간       | -      |
| M-1-2 | 재료 추가/수정 페이지      | 4시간       | M-1-1  |
| M-1-3 | 만료 알림 기능             | 3시간       | M-1-1  |
| M-2-1 | 레시피 DB 마이그레이션     | 2시간       | -      |
| M-2-2 | 레시피 시드 데이터 (100개) | 6시간       | M-2-1  |
| M-2-3 | 레시피 매칭 고도화         | 4시간       | M-2-2  |

---

## 8. 기술 의존성

### 8.1 패키지

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0", // Gemini AI (기존)
    "date-fns": "^3.6.0" // 날짜 계산 (기존)
  }
}
```

### 8.2 환경변수

```bash
# 기존 (변경 없음)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 8.3 관련 문서

- `docs/DATABASE-SCHEMA.md` - 테이블 구조
- `docs/SDD-WORKFLOW.md` - 개발 워크플로우
- `.claude/rules/prompt-engineering.md` - AI 프롬프트 가이드

---

**Version**: 1.0
**Author**: Claude Code
**Last Updated**: 2026-01-12

---

# .beads/

## issues.jsonl
```json
{"id":"yiroom-a9d","title":"Phase B: 스킨케어 루틴 제안 - 아침/저녁 루틴, 제품 순서 추천","status":"closed","priority":2,"issue_type":"task","created_at":"2026-01-10T08:41:31.8933081+09:00","created_by":"rlaqudals12","updated_at":"2026-01-10T10:03:16.3969216+09:00","closed_at":"2026-01-10T10:03:16.3969216+09:00","close_reason":"Closed","dependencies":[{"issue_id":"yiroom-a9d","depends_on_id":"yiroom-ebh","type":"blocks","created_at":"2026-01-10T08:41:52.4696513+09:00","created_by":"unknown"}]}
{"id":"yiroom-ebh","title":"Phase A: 성분 분석 강화 - 회피 성분 경고 확대, 성분 궁합 체크, EWG 등급 표시","status":"closed","priority":2,"issue_type":"task","created_at":"2026-01-10T08:41:30.3342611+09:00","created_by":"rlaqudals12","updated_at":"2026-01-10T08:48:15.9644692+09:00","closed_at":"2026-01-10T08:48:15.9644692+09:00","close_reason":"이미 구현 완료: EWG 등급(1-10점), 20가지 주의성분, 피부타입별 주의사항, 성분 상호작용, UI 컴포넌트 10개"}
{"id":"yiroom-ncs","title":"Phase D: AI 피부 상담 - 피부 고민 Q\u0026A, 제품 추천 챗봇","status":"closed","priority":2,"issue_type":"task","created_at":"2026-01-10T08:41:34.680083+09:00","created_by":"rlaqudals12","updated_at":"2026-01-11T06:05:00.0000000+09:00","closed_at":"2026-01-11T06:05:00.0000000+09:00","close_reason":"구현 완료: skin-rag.ts(RAG검색), chat.ts(피부상담연동), SkinConsultantCTA(UI), prompts.ts(8개질문), 테스트22개","dependencies":[{"issue_id":"yiroom-ncs","depends_on_id":"yiroom-xuw","type":"blocks","created_at":"2026-01-10T08:41:55.0754266+09:00","created_by":"unknown"}]}
{"id":"yiroom-xuw","title":"Phase C: 피부 일기/추적 - 일일 컨디션 기록, 월간 리포트","status":"closed","priority":2,"issue_type":"task","created_at":"2026-01-10T08:41:33.3135027+09:00","created_by":"rlaqudals12","updated_at":"2026-01-10T18:19:58.2265429+09:00","closed_at":"2026-01-10T18:19:58.2265429+09:00","close_reason":"Closed","dependencies":[{"issue_id":"yiroom-xuw","depends_on_id":"yiroom-a9d","type":"blocks","created_at":"2026-01-10T08:41:53.7802296+09:00","created_by":"unknown"}]}
```

## config.yaml
```yaml
# Beads Configuration File
# This file configures default behavior for all bd commands in this repository
# All settings can also be set via environment variables (BD_* prefix)
# or overridden with command-line flags

# Issue prefix for this repository (used by bd init)
# If not set, bd init will auto-detect from directory name
# Example: issue-prefix: "myproject" creates issues like "myproject-1", "myproject-2", etc.
# issue-prefix: ""

# Use no-db mode: load from JSONL, no SQLite, write back after each command
# When true, bd will use .beads/issues.jsonl as the source of truth
# instead of SQLite database
# no-db: false

# Disable daemon for RPC communication (forces direct database access)
# no-daemon: false

# Disable auto-flush of database to JSONL after mutations
# no-auto-flush: false

# Disable auto-import from JSONL when it's newer than database
# no-auto-import: false

# Enable JSON output by default
# json: false

# Default actor for audit trails (overridden by BD_ACTOR or --actor)
# actor: ""

# Path to database (overridden by BEADS_DB or --db)
# db: ""

# Auto-start daemon if not running (can also use BEADS_AUTO_START_DAEMON)
# auto-start-daemon: true

# Debounce interval for auto-flush (can also use BEADS_FLUSH_DEBOUNCE)
# flush-debounce: "5s"

# Git branch for beads commits (bd sync will commit to this branch)
# IMPORTANT: Set this for team projects so all clones use the same sync branch.
# This setting persists across clones (unlike database config which is gitignored).
# Can also use BEADS_SYNC_BRANCH env var for local override.
# If not set, bd sync will require you to run 'bd config set sync.branch <branch>'.
# sync-branch: "beads-sync"

# Multi-repo configuration (experimental - bd-307)
# Allows hydrating from multiple repositories and routing writes to the correct JSONL
# repos:
#   primary: "."  # Primary repo (where this database lives)
#   additional:   # Additional repos to hydrate from (read-only)
#     - ~/beads-planning  # Personal planning repo
#     - ~/work-planning   # Work planning repo

# Integration settings (access with 'bd config get/set')
# These are stored in the database, not in this file:
# - jira.url
# - jira.project
# - linear.url
# - linear.api-key
# - github.org
# - github.repo
```

---

# 문서 끝

# docs/TODO.md

# 프로젝트 파일 구조 현황

> **마지막 업데이트**: 2026-01-11
> **상태**: Phase 1~J 완료, 런칭 준비 중

---

## 설정 파일 ✅ 완료

- [x] `.env.local` 환경 변수
- [x] `tsconfig.json` TypeScript 설정
- [x] `eslint.config.mjs` ESLint 설정
- [x] `.prettierrc` Prettier 설정
- [x] `.prettierignore` Prettier 제외
- [x] `.gitignore` Git 제외
- [x] `.husky/pre-commit` Git hooks

---

## 디렉토리 구조 ✅ 완료

```
yiroom/
├── apps/
│   ├── web/              # Next.js 웹 앱 (Lite PWA)
│   └── mobile/           # Expo React Native 앱
├── packages/
│   └── shared/           # 공통 타입/유틸리티
├── docs/                 # 설계 문서
├── turbo.json            # Turborepo 설정
└── vercel.json           # Vercel 배포 설정
```

---

## 주요 파일 현황

### app/ (웹 앱)

| 파일/디렉토리          | 상태 | 비고                          |
| ---------------------- | ---- | ----------------------------- |
| `layout.tsx`           | ✅   | 루트 레이아웃 + ThemeProvider |
| `page.tsx`             | ✅   | 홈페이지                      |
| `globals.css`          | ✅   | 다크모드 + 모듈 색상          |
| `not-found.tsx`        | ✅   | 404 페이지                    |
| `error.tsx`            | ✅   | 에러 페이지 + Sentry          |
| `robots.ts`            | ✅   | SEO 크롤링 규칙               |
| `sitemap.ts`           | ✅   | 동적 사이트맵                 |
| `manifest.webmanifest` | ✅   | PWA 매니페스트                |

### 기능 모듈 ✅ 완료

| 모듈            | 경로                              | 상태 |
| --------------- | --------------------------------- | ---- |
| PC-1 퍼스널컬러 | `(main)/analysis/personal-color/` | ✅   |
| S-1 피부 분석   | `(main)/analysis/skin/`           | ✅   |
| C-1 체형 분석   | `(main)/analysis/body/`           | ✅   |
| W-1 운동        | `(main)/workout/`                 | ✅   |
| N-1 영양        | `(main)/nutrition/`               | ✅   |
| R-1 리포트      | `(main)/reports/`                 | ✅   |
| 제품            | `(main)/products/`                | ✅   |
| 위시리스트      | `(main)/wishlist/`                | ✅   |
| 친구            | `(main)/friends/`                 | ✅   |
| 리더보드        | `(main)/leaderboard/`             | ✅   |
| 웰니스          | `(main)/wellness/`                | ✅   |
| 스타일링        | `(main)/styling/`                 | ✅   |
| 인벤토리        | `(main)/inventory/`               | ✅   |
| 관리자          | `admin/`                          | ✅   |

### public/ ✅ 완료

| 파일                   | 상태 |
| ---------------------- | ---- |
| `icons/` (192~512px)   | ✅   |
| `logo.png`             | ✅   |
| `og-image.png`         | ✅   |
| `favicon-*.png`        | ✅   |
| `manifest.webmanifest` | ✅   |

### lib/ 주요 모듈 ✅ 완료

| 모듈            | 설명                       |
| --------------- | -------------------------- |
| `supabase/`     | DB 클라이언트 (Clerk 통합) |
| `gemini.ts`     | Gemini AI 연동             |
| `products/`     | Product DB Repository      |
| `workout/`      | 운동 로직                  |
| `nutrition/`    | 영양 로직                  |
| `admin/`        | 관리자 기능                |
| `rag/`          | RAG 시스템                 |
| `share/`        | 공유 기능                  |
| `friends/`      | 친구 기능                  |
| `leaderboard/`  | 리더보드                   |
| `wellness/`     | 웰니스 스코어              |
| `gamification/` | 게이미피케이션             |
| `challenges/`   | 챌린지 시스템              |
| `affiliate/`    | 어필리에이트               |
| `inventory/`    | 내 인벤토리                |

---

## 완료된 Phase

> **상세 현황**: [NEXT-TASKS.md](phase-next/NEXT-TASKS.md) 참조 (Single Source of Truth)

| Phase   | 설명                                                   | 완료일     |
| ------- | ------------------------------------------------------ | ---------- |
| Phase 1 | 퍼스널컬러, 피부, 체형 분석                            | -          |
| Phase 2 | 운동, 영양, 리포트                                     | -          |
| Phase 3 | 앱 고도화, E2E 테스트                                  | -          |
| Phase A | Product DB (850+ 제품)                                 | -          |
| Phase B | React Native 앱                                        | -          |
| Phase H | 소셜 (웰니스, 친구, 리더보드)                          | 2025-12    |
| Phase I | 어필리에이트 (날씨 코디, 바코드, 비포애프터, 인벤토리) | 2026-01-11 |
| Phase J | AI 스타일링 (색상 조합, 악세서리, 메이크업)            | 2026-01-11 |
| Phase K | 종합 업그레이드 (성별 중립화, 패션, 체형, 레시피)      | 📋 계획    |

---

## 남은 작업

### 런칭 준비

- [ ] Vercel 환경변수 Production 설정
- [ ] Clerk Production Keys 교체 (사업자 등록 후)
- [ ] 도메인 연결 (yiroom.app)

### 브랜드 중립화

- [x] 벤치마크 리서치 완료
- [x] 심볼 후보 선정 (나선/동심원)
- [x] 브랜딩 스펙 문서 작성
- [ ] Figma 디자인 (로고 + 앱 아이콘)
- [ ] 에셋 제작 및 적용

---

## 테스트 현황

| 영역             | 테스트 수 | 상태 |
| ---------------- | --------- | ---- |
| 웹 앱 (Vitest)   | 2,700+    | ✅   |
| 모바일 앱 (Jest) | 151       | ✅   |
| E2E (Playwright) | 20+       | ✅   |

---

## 참조 문서

| 문서                                      | 설명            |
| ----------------------------------------- | --------------- |
| [NEXT-TASKS.md](phase-next/NEXT-TASKS.md) | 다음 작업 목록  |
| [CLAUDE.md](../CLAUDE.md)                 | 프로젝트 가이드 |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)      | 디자인 시스템   |

---

## 변경 이력

| 날짜       | 변경 내용                        |
| ---------- | -------------------------------- |
| 2026-01-11 | Phase I/J 완료, 문서 전면 재정리 |
| 2025-12-19 | UI/UX 개선, 브랜딩 리서치        |

---

# docs/TODO-ISSUES.md

# TODO Issues 정리

> 코드베이스에서 발견된 TODO 주석을 GitHub Issues로 전환하기 위한 문서
> 생성일: 2025-12-31
> 최종 업데이트: 2026-01-02

## 우선순위 정의

- **P0**: 런치 전 필수 (보안, 핵심 기능)
- **P1**: 런치 전 권장 (UX, 성능)
- **P2**: 런치 후 개선 (추가 기능)
- **P3**: 백로그 (Nice-to-have)

---

## 카테고리별 TODO 목록

### 1. Analytics/Stats (P2) - 7건 ✅ 완료

**파일**: `lib/analytics/stats.ts`

| 라인 | 설명                        | 우선순위 | 상태    |
| ---- | --------------------------- | -------- | ------- |
| 77   | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 97   | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 117  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 136  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 155  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |
| 170  | 실제 구현 (최근 5분 데이터) | P2       | ✅ 완료 |
| 186  | 실제 Supabase 쿼리 구현     | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Analytics] Supabase 쿼리 구현 - stats 모듈` - ✅ 완료

---

### 2. Affiliate 동기화 (P1) - 4건 ✅ 완료

**파일**: `app/api/affiliate/*/sync/route.ts`

| 파일                  | 라인 | 설명                                 | 우선순위 | 상태    |
| --------------------- | ---- | ------------------------------------ | -------- | ------- |
| iherb/sync/route.ts   | -    | Partnerize CSV 피드 다운로드 및 파싱 | P1       | ✅ 완료 |
| musinsa/sync/route.ts | -    | 무신사 큐레이터 API 연동             | P1       | ✅ 완료 |
| coupang/sync/route.ts | -    | upsert에서 구분 필요                 | P2       | ✅ 완료 |
| coupang/sync/route.ts | -    | 추가/업데이트 구분 필요              | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Affiliate] 파트너 API 동기화 구현` - ✅ 완료

**환경변수만 설정하면 동작:**

- iHerb: `IHERB_CAMPAIGN_ID`, `IHERB_PUBLISHER_ID`, `IHERB_API_KEY`
- 무신사: `MUSINSA_CURATOR_ID`, `MUSINSA_API_KEY`
- 쿠팡: 이미 구현됨 (환경변수 설정 필요)

---

### 3. Workout 모듈 (P1) - 5건 (4건 완료)

| 파일                                           | 라인     | 설명                                         | 우선순위 | 상태    |
| ---------------------------------------------- | -------- | -------------------------------------------- | -------- | ------- |
| components/workout/result/WorkoutStyleCard.tsx | 57       | 분석 이벤트 트래킹 추가 시 platform 파라미터 | P3       | ✅ 완료 |
| app/(main)/workout/result/page.tsx             | 137      | 실제 S-1 분석 데이터 연동                    | P1       | ✅ 완료 |
| app/(main)/workout/result/page.tsx             | 269, 280 | 실제 운동 시간으로 교체                      | P1       | ✅ 완료 |
| app/(main)/workout/history/page.tsx            | 147, 155 | 운동 기록 상세 페이지 구현                   | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Workout] 실제 데이터 연동 및 상세 페이지 구현`

---

### 4. Nutrition 모듈 (P1) - 3건 ✅ 완료

| 파일                                    | 라인 | 설명                        | 우선순위 | 상태    |
| --------------------------------------- | ---- | --------------------------- | -------- | ------- |
| components/nutrition/BarcodeScanner.tsx | 174  | 이미지에서 바코드 인식 구현 | P2       | ✅ 완료 |
| app/(main)/nutrition/page.tsx           | 428  | saveAsFavorite 처리 구현    | P1       | ✅ 완료 |
| tests/app/nutrition/page.test.tsx       | 434  | 무한 루프 문제 테스트 수정  | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성`

---

### 5. Style/Beauty 모듈 (P2) - 5건 ✅ 완료

| 파일                                      | 라인 | 설명                         | 우선순위 | 상태    |
| ----------------------------------------- | ---- | ---------------------------- | -------- | ------- |
| app/(main)/style/page.tsx                 | 116  | 실제 분석 결과 연동          | P2       | ✅ 완료 |
| app/(main)/style/outfit/[id]/page.tsx     | 120  | 실제 데이터 연동             | P2       | ✅ 완료 |
| app/(main)/style/category/[slug]/page.tsx | 70   | 실제 사용자 체형 데이터 연동 | P2       | ✅ 완료 |
| app/(main)/beauty/[productId]/page.tsx    | 114  | 실제 데이터 연동             | P2       | ✅ 완료 |
| app/(main)/beauty/page.tsx                | 224  | 실제 분석 결과 연동          | P2       | ✅ 완료 |

**GitHub Issue 제목**: `[Style/Beauty] 실제 분석 결과 데이터 연동` - ✅ 완료

---

### 6. 기타 기능 (P2-P3) - 6건 (5건 완료)

| 파일                                 | 라인 | 설명                                 | 우선순위 | 상태    |
| ------------------------------------ | ---- | ------------------------------------ | -------- | ------- |
| lib/chat/context.ts                  | 55   | 실제 Supabase에서 사용자 데이터 조회 | P2       | ✅ 완료 |
| lib/ingredients.ts                   | 165  | Gemini 연동 구현                     | P3       | ✅ 완료 |
| lib/smart-matching/size-recommend.ts | 372  | 제품별 실측 데이터 보정              | P3       | ✅ 완료 |
| app/api/analytics/events/route.ts    | 39   | 실제 DB 저장 구현                    | P2       | ✅ 완료 |
| app/admin/feedback/page.tsx          | 95   | 서버에서 피드백 목록 조회            | P2       | ✅ 완료 |
| app/(main)/help/faq/page.tsx         | 155  | 피드백 저장 API 호출                 | P2       | ✅ 완료 |

---

### 7. Profile/Dashboard (P1) - 2건 ✅ 완료

| 파일                                               | 라인 | 설명             | 우선순위 | 상태    |
| -------------------------------------------------- | ---- | ---------------- | -------- | ------- |
| app/(main)/profile/page.tsx                        | 155  | 실제 데이터 연동 | P1       | ✅ 완료 |
| app/(main)/dashboard/\_components/ClosetWidget.tsx | 174  | 날씨 API 연동    | P3       | ✅ 완료 |

**GitHub Issue 제목**: `[Profile] 실제 사용자 데이터 연동`

---

### 8. Products QA (P2) - 1건 ✅ 완료

| 파일                            | 라인 | 설명                | 우선순위 | 상태    |
| ------------------------------- | ---- | ------------------- | -------- | ------- |
| app/(main)/products/qa/page.tsx | 155  | getProductById 호출 | P2       | ✅ 완료 |

**참고**: loadProduct 함수가 이미 구현되어 getProductById를 호출함

---

### 9. 테스트 파일 마이그레이션 (P3) - 4건 ✅ 완료

| 파일                                          | 설명                                | 상태    |
| --------------------------------------------- | ----------------------------------- | ------- |
| tests/lib/color-recommendations.test.ts:246   | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/product-recommendations.test.ts:327 | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/mock/skin-analysis.test.ts:247      | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |
| tests/lib/mock/body-analysis.test.ts:270      | 배포 전 마이그레이션 파일 작성 필요 | ✅ 완료 |

**참고**: 마이그레이션 파일이 이미 존재함 - 테스트 파일의 TODO 주석을 완료 상태로 업데이트

---

## 요약

| 우선순위 | 건수         | 설명                                                     |
| -------- | ------------ | -------------------------------------------------------- |
| P0       | 0            | 런치 전 필수                                             |
| P1       | 8 (8 완료)   | 런치 전 권장 ✅ (Affiliate, Workout, Nutrition, Profile) |
| P2       | 19 (19 완료) | 런치 후 개선 ✅                                          |
| P3       | 9 (9 완료)   | 백로그 ✅                                                |
| **합계** | **36**       | (36건 완료 - 100%)                                       |

---

## 최근 완료 작업 (2026-01-02)

- ✅ `lib/ingredients.ts`: Gemini AI 성분 분석 연동 (DB에 없는 성분 AI 분석)
- ✅ `components/workout/result/WorkoutStyleCard.tsx`: 쇼핑 링크 클릭 이벤트 트래킹 (platform 파라미터 포함)
- ✅ `lib/analytics/tracker.ts`: `trackShoppingClick` 함수 추가
- ✅ `lib/weather/index.ts`: Open-Meteo 날씨 API 연동 (무료, 키 불필요)
- ✅ `app/(main)/dashboard/_components/ClosetWidget.tsx`: 날씨 데이터 TodayOutfitCard 연동
- ✅ `lib/analytics/stats.ts`: Analytics 7개 함수 Supabase 쿼리 구현 (마이그레이션 포함)
- ✅ `lib/chat/context.ts`: 실제 Supabase에서 사용자 데이터 조회 구현
- ✅ 온보딩 간소화 (7단계 → 3단계) - 운동/영양 온보딩 모두 완료
- ✅ 테스트 파일 업데이트 (nutrition step1, BottomNav) - 3단계 구조 반영
- ✅ `app/api/analytics/events/route.ts`: 실제 Supabase DB 저장 구현
- ✅ `app/api/faq/feedback/route.ts`: FAQ 피드백 API 신규 생성
- ✅ `app/(main)/profile/page.tsx`: 실제 Supabase 데이터 연동 (이미 구현됨)
- ✅ `app/(main)/workout/result/page.tsx`: S-1 피부 분석 데이터 연동 (이미 구현됨)
- ✅ `app/(main)/workout/history/[id]/page.tsx`: 운동 기록 상세 페이지 (이미 구현됨)
- ✅ `app/(main)/nutrition/page.tsx`: saveAsFavorite 처리 (이미 구현됨)
- ✅ `app/(main)/beauty/[productId]/page.tsx`: cosmetic_products 테이블 연동
- ✅ `app/(main)/style/outfit/[id]/page.tsx`: lookbook_posts 테이블 연동
- ✅ `app/(main)/style/category/[slug]/page.tsx`: affiliate_products/lookbook_posts 연동
- ✅ `components/nutrition/BarcodeScanner.tsx`: 갤러리 이미지에서 바코드 인식 구현
- ✅ `tests/app/nutrition/page.test.tsx`: 물 섭취 테스트 무한 루프 문제 수정
- ✅ `app/api/affiliate/iherb/sync/route.ts`: Partnerize CSV 피드 파싱 구현 (키 설정만 필요)
- ✅ `app/api/affiliate/musinsa/sync/route.ts`: 큐레이터 API 연동 구현 (키 설정만 필요)
- ✅ `app/api/affiliate/coupang/sync/route.ts`: upsert add/update 구분 로직 구현
- ✅ `lib/smart-matching/size-recommend.ts`: 제품별 실측 데이터 보정 로직 구현 (calibrateWithProductMeasurements)
- ✅ 테스트 파일 마이그레이션 TODO 주석 정리 (4개 파일) - 마이그레이션 파일이 이미 존재함 확인

---

## GitHub Issues 생성 권장 순서

> P0, P1, P2 모두 완료됨! 남은 작업은 P3 백로그만.

### ✅ 완료된 P1 항목

- ~~`[Affiliate] 파트너 API 동기화 구현` (P1)~~ ✅
- ~~`[Workout] 실제 데이터 연동 및 상세 페이지 구현` (P1)~~ ✅
- ~~`[Nutrition] 바코드 스캔 및 즐겨찾기 기능 완성` (P1)~~ ✅
- ~~`[Profile] 실제 사용자 데이터 연동` (P1)~~ ✅
- ~~`[Analytics] Supabase 쿼리 구현 - stats 모듈` (P2)~~ ✅
- ~~`[Style/Beauty] 실제 분석 결과 데이터 연동` (P2)~~ ✅

### P3 백로그 (선택적) - 모두 완료! ✅

1. ~~`[Workout] 이벤트 트래킹 platform 파라미터`~~ ✅
2. ~~`[Ingredients] Gemini 연동 구현`~~ ✅
3. ~~`[Size] 제품별 실측 데이터 보정`~~ ✅
4. ~~`[Dashboard] 날씨 API 연동`~~ ✅
5. ~~`[Test] 마이그레이션 파일 작성 (4건)`~~ ✅

---

# docs/BACKLOG.md

# 이룸 백로그 (Deferred Features & Tech Debt)

> **마지막 업데이트**: 2026-01-10
> **목적**: 비용, 복잡도, 우선순위로 보류된 기능 및 기술 부채 추적

---

## 1. 비용 이슈로 보류

### 1.1 Gemini 3 Pro 업그레이드

| 항목          | 내용                                         |
| ------------- | -------------------------------------------- |
| **현재**      | gemini-2.5-flash (무료/저가)                 |
| **목표**      | gemini-3-pro (유료, 최고 성능)               |
| **보류 사유** | Google Cloud Billing 미활성화                |
| **필요 작업** | Billing 활성화 → API 키 갱신 → 비용 모니터링 |
| **예상 비용** | 월 $50~200 (사용량 기반)                     |
| **우선순위**  | 중간 (MVP 완성 후)                           |

### 1.2 피부 나이 추정 고도화

| 항목          | 내용                                     |
| ------------- | ---------------------------------------- |
| **현재**      | "피부 활력도" (0-100 점수)               |
| **목표**      | 실제 피부 나이 추정 (의료급 정확도)      |
| **보류 사유** | NIST 연구 MAE 5~8년 오차, 의료 규제 복잡 |
| **대안**      | 활력도 점수 + 요인 분석 (현재 구현됨)    |
| **우선순위**  | 낮음                                     |

---

## 2. 복잡도 이슈로 보류

### 2.1 사진 기반 오버레이 (Phase 2) - 부분 완료

| 항목            | 내용                                                    |
| --------------- | ------------------------------------------------------- |
| **스펙**        | SDD-VISUAL-SKIN-REPORT.md §5.2                          |
| **기능**        | 사용자 얼굴 사진 위에 피부 존 오버레이                  |
| **현재 상태**   | 🟡 단순 버전 완료 (고정 SVG 좌표)                       |
| **컴포넌트**    | `PhotoOverlayMap.tsx` (224줄) - skin/result에서 사용 중 |
| **남은 작업**   | MediaPipe 얼굴 랜드마크 기반 정밀 오버레이 (Phase 2+)   |
| **테스트**      | ✅ 완료 (26개 테스트) - 2026-01-10                      |
| **예상 복잡도** | 85점 (full 전략) - MediaPipe 통합 시                    |
| **우선순위**    | 낮음 (현재 버전으로 MVP 가능)                           |

### 2.2 ~~Before/After 슬라이더~~ ✅ 완료

| 항목          | 내용                                             |
| ------------- | ------------------------------------------------ |
| **스펙**      | SDD-VISUAL-SKIN-REPORT.md §5.2                   |
| **기능**      | 이전/현재 피부 사진 비교 슬라이더                |
| **현재 상태** | ✅ 컴포넌트 + 테스트 완료                        |
| **컴포넌트**  | `BeforeAfterSlider.tsx` (415줄) + 테스트 (449줄) |
| **사용 위치** | `/analysis/{skin,body,hair,makeup}/compare`      |
| **완료일**    | 2026-01-10 (기존 구현 확인)                      |

### 2.3 ~~월별 트렌드 차트~~ ✅ 완료

| 항목          | 내용                                     |
| ------------- | ---------------------------------------- |
| **스펙**      | SDD-VISUAL-SKIN-REPORT.md §5.2           |
| **기능**      | 피부 점수 변화 월별 그래프               |
| **현재 상태** | ✅ 컴포넌트 구현 + DB 연동 완료          |
| **컴포넌트**  | `TrendChart.tsx` (244줄)                 |
| **연동 위치** | `skin/result/[id]/page.tsx:349-362, 601` |
| **완료일**    | 2026-01-10                               |

### 2.4 세부 존 확장 (Phase 3)

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **스펙**      | SDD-VISUAL-SKIN-REPORT.md §5.3                      |
| **현재**      | 6개 존 (forehead, tZone, eyes, cheeks, uZone, chin) |
| **목표**      | 12개 세부 존 (forehead_center/sides 등)             |
| **보류 사유** | Gemini 프롬프트 복잡도, 정확도 검증 필요            |
| **우선순위**  | 낮음 (장기)                                         |

### 2.5 피부 일기 (Phase 3)

| 항목          | 내용                                              |
| ------------- | ------------------------------------------------- |
| **기능**      | 일일 컨디션, 수면, 식단 기록 → 피부 상관관계 분석 |
| **보류 사유** | N-1 영양 모듈과 중복 가능성, 설계 재검토 필요     |
| **우선순위**  | 낮음 (장기)                                       |

### 2.6 미성년자 법정대리인 동의 시스템

| 항목          | 내용                                   |
| ------------- | -------------------------------------- |
| **스펙**      | SDD-VISUAL-SKIN-REPORT.md §4.2.4       |
| **현재**      | 14세 미만 기능 제한 (이미지 저장 불가) |
| **목표**      | 부모 계정 연동 → 대리 동의             |
| **보류 사유** | 법적 검토 필요, 복잡한 UX 플로우       |
| **우선순위**  | 낮음                                   |

---

## 3. 인프라/운영 보류 항목

### 3.1 Edge Function Cron 설정

| 항목          | 내용                                                      |
| ------------- | --------------------------------------------------------- |
| **기능**      | 만료된 이미지 동의 자동 삭제                              |
| **현재 상태** | Edge Function 코드 작성 완료 (`cleanup-expired-consents`) |
| **보류 사유** | Supabase pg_cron 설정 필요 (대시보드 작업)                |
| **필요 작업** | SQL 실행: `SELECT cron.schedule(...)`                     |
| **우선순위**  | 높음 (GDPR 준수)                                          |

### 3.2 ~~설정 페이지 마케팅 동의 토글~~ ✅ 완료

| 항목          | 내용                                                           |
| ------------- | -------------------------------------------------------------- |
| **기능**      | 설정 > 개인정보에서 마케팅 동의 On/Off                         |
| **현재 상태** | ✅ 구현 완료 (컴포넌트 + 테스트 43개)                          |
| **스펙**      | [SDD-MARKETING-TOGGLE-UI.md](specs/SDD-MARKETING-TOGGLE-UI.md) |
| **완료일**    | 2026-01-09                                                     |

### 3.3 TestFlight 배포

| 항목          | 내용                                    |
| ------------- | --------------------------------------- |
| **현재 상태** | EAS 빌드 설정 완료, DEPLOYMENT.md 작성  |
| **보류 사유** | Apple Developer 계정 키 연동 대기       |
| **필요 작업** | 계정 설정 → EAS 연결 → 내부 테스트 빌드 |
| **우선순위**  | 높음                                    |

### 3.4 ~~DB 마이그레이션 파일 정리~~ ✅ 완료

| 항목          | 내용                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| **현재 상태** | ✅ 누락 테이블 확인 및 생성 완료                                       |
| **생성 파일** | `202601090200_hair_analyses.sql`                                       |
| **스펙**      | [SDD-DB-MIGRATION-MANAGEMENT.md](specs/SDD-DB-MIGRATION-MANAGEMENT.md) |
| **완료일**    | 2026-01-09                                                             |

---

## 4. 기술 부채

### 4.1 Storybook 버전 충돌

| 항목          | 내용                                         |
| ------------- | -------------------------------------------- |
| **문제**      | 8.x/10.x 버전 혼재로 일부 스토리 렌더링 오류 |
| **영향**      | 컴포넌트 문서화/테스트 제한                  |
| **해결 방안** | Storybook 10.x로 통일 후 스토리 재작성       |
| **우선순위**  | 낮음                                         |

### 4.2 ~~Lint 경고~~ ✅ 대폭 개선

| 항목          | 내용                                             |
| ------------- | ------------------------------------------------ |
| **현재**      | 16개 경고 (0 에러) - 68개에서 개선               |
| **남은 유형** | `no-img-element` (blob URL 사용으로 의도적)      |
| **개선 내용** | unused imports 제거, TODO 주석 정리 (2026-01-09) |
| **우선순위**  | 낮음 (현재 수준 유지)                            |

### 4.3 ~~AI Fallback 패턴 불일치~~ ✅ 확인 완료

| 항목          | 내용                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **모범 사례** | `lib/products/services/ingredient-analysis.ts`                        |
| **현재 상태** | ✅ `lib/gemini.ts` 모든 함수 Mock Fallback 적용됨                     |
| **확인 내용** | 17개 catch 블록 중 15개 mock fallback (2개는 내부 유틸)               |
| **패턴**      | FORCE_MOCK → genAI null check → withRetry/withTimeout → mock fallback |
| **완료일**    | 2026-01-10                                                            |

### 4.4 타입 정의 일관성

| 항목          | 내용                                 |
| ------------- | ------------------------------------ |
| **문제**      | 일부 API 응답 타입 `any` 사용        |
| **영향**      | 타입 안전성 저하                     |
| **해결 방안** | strict 타입 정의 + 런타임 검증 (Zod) |
| **우선순위**  | 중간                                 |

---

## 5. Phase별 미완료 항목

### 5.1 Phase B: React Native Mobile

| 항목                    | 상태    | 보류 사유        |
| ----------------------- | ------- | ---------------- |
| Week 7: TestFlight 배포 | ⏳ 대기 | Apple 키 연동    |
| 푸시 알림 설정          | ⏳ 대기 | APNS 인증서 필요 |

### 5.2 Phase V: Visual Analysis

| 항목               | 상태    | 보류 사유    |
| ------------------ | ------- | ------------ |
| 사진 기반 오버레이 | ⏳ 보류 | 복잡도       |
| Before/After 비교  | ⏳ 보류 | Phase 2 의존 |

### 5.3 Launch 준비

| 항목               | 상태    | 보류 사유         |
| ------------------ | ------- | ----------------- |
| 브랜딩 로고 최종화 | ⏳ 대기 | Figma 디자인 필요 |
| 앱스토어 스크린샷  | ⏳ 대기 | 최종 UI 확정 후   |

---

## 6. 우선순위 요약

### 즉시 필요 (출시 전)

1. Edge Function Cron 설정 (GDPR) - SQL 준비됨, 대시보드 실행 필요
2. TestFlight 배포 설정 - Apple 키 대기
3. ~~마케팅 동의 토글 UI~~ ✅ 완료
4. ~~DB 마이그레이션 정리~~ ✅ 완료

### 출시 후 Phase 2

1. 사진 기반 오버레이 - 🟡 단순 버전 완료 (정밀 버전은 MediaPipe 필요)
2. ~~Before/After 슬라이더~~ ✅ 완료
3. Gemini 3 Pro 업그레이드

### 장기 계획

1. 세부 존 확장 (12개)
2. 피부 일기
3. 미성년자 대리 동의

---

## 7. 추가 보류 항목 (SDD 문서 기반)

### 7.1 바코드 스캔 확장

| Phase   | 기능                      | 조건        |
| ------- | ------------------------- | ----------- |
| Phase 2 | AI OCR 성분표 인식        | MAU 5,000+  |
| Phase 3 | 커뮤니티 제품 검증 시스템 | MAU 10,000+ |

**스펙**: SDD-BARCODE-SCAN.md §8

### 7.2 성분 분석 확장

| Phase   | 기능                           | 상태    |
| ------- | ------------------------------ | ------- |
| Phase 2 | 피부타입별 상세 분석           | ⏳ 보류 |
| Phase 2 | 배합목적 분류 (보습/유연/장벽) | ⏳ 보류 |
| Phase 3 | AI 성분 요약 키워드            | ⏳ 보류 |
| Phase 3 | 성분 비율 시각화 차트          | ⏳ 보류 |

**스펙**: SDD-INGREDIENT-ANALYSIS.md

### 7.3 약관동의 확장

| 항목                 | 보류 사유                 |
| -------------------- | ------------------------- |
| 모바일 앱 약관동의   | 별도 Phase (Mobile)       |
| 제3자 정보 제공 동의 | 어필리에이트 확장 시 검토 |

**스펙**: SDD-TERMS-AGREEMENT.md §3 OUT

### 7.4 뷰티 UX 추가 개선

| 항목           | 레퍼런스    | 우선순위 |
| -------------- | ----------- | -------- |
| 빠른 배송 표시 | 무신사 뷰티 | 낮음     |
| 브랜드 컬렉션  | 무신사 뷰티 | 낮음     |

**스펙**: SDD-BEAUTY-UX-IMPROVEMENTS.md §향후 과제

### 7.5 크로스 모듈 인사이트 확장

| Phase   | 기능                              | 상태    |
| ------- | --------------------------------- | ------- |
| Phase 2 | AI 코치 + 헤어/메이크업 통합 코칭 | ⏳ 보류 |
| Phase 2 | 뷰티-영양 상관관계 주간 리포트    | ⏳ 보류 |
| Phase 2 | 뷰티 보조 영양제 추천 연동        | ⏳ 보류 |

**스펙**: cross-module-insights-hair-makeup.md §8

### 7.6 ~~코드 내 TODO~~ ✅ 우선순위 정리 완료

| 위치                                  | 내용                         | 우선순위 |
| ------------------------------------- | ---------------------------- | -------- |
| `lib/analytics/stats.ts:248`          | 이탈률(bounceRate) 계산 로직 | P2       |
| `app/api/analyze/skin/route.ts:124`   | 다각도 분석 지원             | P2       |
| `app/api/analyze/skin/route.ts:133`   | 비대칭 감지 AI 분석          | P2       |
| `app/api/analyze/makeup/route.ts:179` | 메이크업 분석 배지 시스템    | P3       |
| `app/api/analyze/hair/route.ts:168`   | 헤어 분석 배지 시스템        | P3       |

> **정리 완료** (2026-01-09): TODO 주석을 P2/P3 우선순위 주석으로 변환

---

## 8. 주의사항 및 리스크

### 8.1 법적 리스크 (즉시 조치 필요)

| 리스크                    | 영향               | 현재 상태                 | 필요 조치         |
| ------------------------- | ------------------ | ------------------------- | ----------------- |
| **GDPR 자동 삭제 미설정** | 벌금 €2천만/매출4% | Edge Function 코드만 있음 | pg_cron 설정 필수 |
| **이미지 동의 만료 처리** | 데이터 보유 위반   | 수동 삭제만 가능          | Cron Job 활성화   |

### 8.2 운영 리스크

| 리스크                       | 영향             | 완화 방안                    |
| ---------------------------- | ---------------- | ---------------------------- |
| **모바일-웹 동의 불일치**    | 사용자 혼란      | 동일 API 사용, 동기화 테스트 |
| **약관 버전 변경 시 재동의** | 서비스 접근 차단 | 사전 공지, 점진적 롤아웃     |
| **DB 마이그레이션 실패**     | 배포 중단        | 스테이징 환경 검증 필수      |

### 8.3 기술 리스크

| 리스크                    | 영향         | 완화 방안              |
| ------------------------- | ------------ | ---------------------- |
| **Gemini API 중단**       | AI 분석 불가 | Mock Fallback 검증     |
| **Supabase Storage 용량** | 비용 증가    | 이미지 압축, 자동 삭제 |
| **Apple 심사 거절**       | 출시 지연    | 체크리스트 사전 검토   |

### 8.4 의존성 주의

```
Phase 2 (사진 오버레이) ─┬─► Phase 1 (이미지 동의) ✅ 완료
                        └─► MediaPipe 통합 (미시작)

TestFlight 배포 ─────────► Apple Developer 키 (대기 중)

Gemini 3 Pro ────────────► Google Billing 활성화 (미완료)
```

---

## 9. 관련 문서

| 문서                                                                   | 설명                        |
| ---------------------------------------------------------------------- | --------------------------- |
| [PROGRESS.md](PROGRESS.md)                                             | 전체 진행 상황              |
| [SDD-VISUAL-SKIN-REPORT.md](specs/SDD-VISUAL-SKIN-REPORT.md)           | 시각적 피부 리포트 스펙     |
| [SDD-TERMS-AGREEMENT.md](SDD-TERMS-AGREEMENT.md)                       | 약관동의 스펙               |
| [SDD-MARKETING-TOGGLE-UI.md](specs/SDD-MARKETING-TOGGLE-UI.md)         | 마케팅 토글 UI 스펙 ✨ NEW  |
| [SDD-DB-MIGRATION-MANAGEMENT.md](specs/SDD-DB-MIGRATION-MANAGEMENT.md) | DB 마이그레이션 관리 ✨ NEW |
| [SDD-INGREDIENT-ANALYSIS.md](SDD-INGREDIENT-ANALYSIS.md)               | 성분 분석 스펙              |
| [SDD-BARCODE-SCAN.md](SDD-BARCODE-SCAN.md)                             | 바코드 스캔 스펙            |
| [ROADMAP-LAUNCH.md](ROADMAP-LAUNCH.md)                                 | 출시 로드맵                 |

---

## 10. 변경 이력

| 버전 | 날짜       | 변경 내용                                                          |
| ---- | ---------- | ------------------------------------------------------------------ |
| 1.8  | 2026-01-10 | PhotoOverlayMap 단순 버전 완료 확인 (224줄, 테스트 미작성)         |
| 1.7  | 2026-01-10 | Before/After 슬라이더 완료 확인 (415줄 + 테스트 449줄)             |
| 1.6  | 2026-01-10 | AI Fallback 패턴 검증 완료 (17개 함수 모두 mock fallback 적용됨)   |
| 1.5  | 2026-01-10 | 월별 트렌드 차트 완료 표시 (TrendChart.tsx + DB 연동)              |
| 1.4  | 2026-01-09 | Lint 경고 68→16개 개선, TODO→P2/P3 우선순위 정리, 테스트 실패 수정 |
| 1.3  | 2026-01-08 | 마케팅 토글 UI, DB 마이그레이션 관리 스펙 추가                     |
| 1.2  | 2026-01-08 | 크로스 모듈 인사이트 확장 추가, 코드 내 TODO 5건 추가              |
| 1.1  | 2026-01-08 | SDD 문서 기반 보류 항목 추가, 주의사항/리스크 섹션 추가            |
| 1.0  | 2026-01-08 | 최초 작성                                                          |

---

**Version**: 1.8
**Created**: 2026-01-08
**Updated**: 2026-01-10

---

# 문서 끝 (Updated)
