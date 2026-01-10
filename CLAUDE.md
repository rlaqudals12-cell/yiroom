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

| Phase   | 모듈           | 설명                           | 상태       |
| ------- | -------------- | ------------------------------ | ---------- |
| Phase 1 | PC-1, S-1, C-1 | 퍼스널컬러, 피부, 체형 분석    | ✅ 완료    |
| Phase 2 | W-1, N-1, R-1  | 운동, 영양, 리포트             | ✅ 완료    |
| Phase 3 | 앱 고도화      | E2E 테스트, 크로스 모듈        | ✅ 완료    |
| Phase A | Product DB     | 850+ 제품, 리뷰, RAG           | ✅ 완료    |
| Phase B | React Native   | 모노레포, Expo 앱, 알림 동기화 | ✅ 완료    |
| Phase H | 소셜           | 웰니스 스코어, 친구, 리더보드  | ✅ 완료    |
| Phase I | 어필리에이트   | iHerb, 쿠팡, 무신사 연동       | 🔄 진행 중 |
| Launch  | 출시 준비      | 공지사항, FAQ, 알림 DB 연동    | ✅ 완료    |

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
└── feed/               # 소셜 피드
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

**Version**: 9.4 | **Updated**: 2026-01-11
