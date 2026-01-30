# Web App (apps/web) Development Guide

> 이 파일은 웹 앱 전용 규칙입니다. 범용 규칙은 루트 [CLAUDE.md](../../CLAUDE.md) 참조

---

## 기술 스택

| 분야      | 기술                                                        |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16+ (App Router, Turbopack) + React 19 + TypeScript |
| Auth      | Clerk (clerk_user_id 기반 Supabase 네이티브 통합)           |
| Database  | Supabase (PostgreSQL 15+, RLS 필수)                         |
| AI        | Google Gemini 3 Flash (이미지 분석)                         |
| UI        | shadcn/ui + Radix UI + Tailwind CSS v4                      |
| State     | Zustand (다단계 폼), React Hook Form + Zod (폼)             |
| Testing   | Vitest + React Testing Library + Playwright                 |

## 명령어

```bash
npm run dev                               # 개발 서버 (Turbopack)
npm run build                             # 프로덕션 빌드
npm run test                              # 전체 테스트
npm run test -- path/to/file.test.ts      # 단일 파일
npm run test -- --watch                   # watch 모드
npm run test:coverage                     # 커버리지
npm run test:e2e                          # Playwright E2E
```

## Supabase 클라이언트 패턴

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

## lib/ Repository 패턴

```
lib/
├── supabase/           # DB 클라이언트 (DIP 적용)
├── api/                # Repository 패턴 (도메인별 API)
├── stores/             # Zustand 스토어
├── mock/               # 테스트/AI Fallback
├── products/           # 제품 Repository
├── affiliate/          # 어필리에이트 시스템
└── gemini.ts           # AI 분석 (3초 타임아웃 + 2회 재시도)
```

## AI 통합 패턴

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

## Dynamic Import 패턴

무거운 컴포넌트(차트, 모달)는 `next/dynamic` 사용:

```typescript
export const ChartDynamic = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => null
});
```

## Route Groups

```
app/(main)/
├── analysis/           # PC-1, S-1, C-1
├── workout/            # W-1 운동
├── nutrition/          # N-1 영양
├── products/           # 제품 추천
├── dashboard/          # 대시보드
├── friends/            # 친구
├── leaderboard/        # 리더보드
├── help/               # 도움말
├── announcements/      # 공지사항
├── feed/               # 소셜 피드
└── profile/            # 프로필
```

## 데이터베이스

> 상세 스키마: [docs/DATABASE-SCHEMA.md](../../docs/DATABASE-SCHEMA.md)

**핵심 테이블 (clerk_user_id 기반 RLS):**

- `users`, `personal_color_assessments` → 사용자/PC-1
- `workout_*`, `meal_records`, `daily_nutrition_summary` → W-1/N-1
- `cosmetic_products`, `supplement_products` → 제품 DB
- `user_levels`, `wellness_scores`, `friendships` → 소셜/게이미피케이션
- `affiliate_*` → 어필리에이트

---

**Version**: 1.0 | **Updated**: 2026-01-15
