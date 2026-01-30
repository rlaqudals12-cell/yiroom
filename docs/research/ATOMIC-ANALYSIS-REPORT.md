# 이룸 프로젝트 원자 단위 종합 분석 보고서

> **분석일**: 2026-01-18
> **분석 범위**: 앱/웹을 구성하는 12개 핵심 영역
> **목적**: 궁극의 앱 달성을 위한 현황 파악 및 개선 로드맵

---

## Executive Summary

### 전체 완성도: 67.3% (평균)

| 등급 | 영역 수 | 영역 |
|------|---------|------|
| **A (80%+)** | 1개 | 아이콘/이미지 |
| **B (70-79%)** | 5개 | 접근성, 컴포넌트, 성능, 레이아웃, 상태관리 |
| **C (60-69%)** | 4개 | 애니메이션, 데이터 페칭, 디자인 토큰, 폼 |
| **D (50-59%)** | 1개 | SEO |
| **F (<50%)** | 1개 | 보안 (Rate Limiting) |

### 즉시 조치 필요 항목 (Critical)

1. **robots.txt / sitemap.xml 없음** → SEO 치명적
2. **Rate Limiting 인메모리** → 프로덕션에서 무의미
3. **react-hook-form 미사용** → 폼 검증 불일치

---

## 1. 디자인 토큰 시스템

### 현황: 65% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| 색상 토큰 | 95% | OKLCh 121개, 다크모드 완벽 |
| 간격 토큰 | 40% | Tailwind 기본값만 사용 |
| 타이포그래피 | 35% | 시스템 폰트, 커스텀 정의 없음 |
| 테두리/반경 | 50% | 부분 커스텀 |
| 그림자 | 60% | 4단계 정의 |
| 애니메이션 | 80% | 14개 keyframes |
| z-index | 30% | 시스템 미정의 |
| breakpoint | 50% | md만 사용 |

### 누락 항목

```css
/* 필요한 간격 토큰 */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */

/* 필요한 타이포그래피 토큰 */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* 필요한 z-index 시스템 */
--z-dropdown: 100;
--z-sticky: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-popover: 500;
--z-toast: 600;
--z-tooltip: 700;
```

---

## 2. 컴포넌트 상태 시스템

### 현황: 75% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| Button Loading | 0% | 없음 |
| Input Error | 80% | 스타일만, 접근성 부족 |
| Card Hover | 0% | 없음 |
| Card Selected | 90% | SelectionCard 우수 |
| Modal Open/Close | 95% | Radix Dialog 완벽 |
| Loading Skeleton | 70% | 일부 컴포넌트만 |
| Empty State | 60% | 패턴 불일치 |
| Error Boundary | 40% | 기본만 존재 |

### 누락 항목

```tsx
// 1. Button Loading 상태
interface ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

<Button loading={isSubmitting} loadingText="저장 중...">
  저장
</Button>

// 2. Card Hover 상태
<Card className="hover:shadow-lg hover:scale-[1.02] transition-all">
  {children}
</Card>

// 3. Input Error with ARIA
<Input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
{error && (
  <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
    {error}
  </p>
)}
```

---

## 3. 레이아웃 구조

### 현황: 70% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| 그리드 시스템 | 60% | CSS Grid 사용, 커스텀 부족 |
| 컨테이너 | 70% | max-w만 사용, padding 불일치 |
| 반응형 (sm) | 30% | 거의 미사용 |
| 반응형 (md) | 90% | 주력 breakpoint |
| 반응형 (lg) | 40% | 부분 사용 |
| 반응형 (xl) | 10% | 거의 미사용 |
| 헤더/네비게이션 | 80% | 양호 |
| 모바일 메뉴 | 75% | Sheet 기반 |

### 누락 항목

```tsx
// 1. 반응형 그리드 유틸리티
const gridVariants = {
  default: "grid gap-4",
  sm: "sm:grid-cols-2",
  md: "md:grid-cols-3",
  lg: "lg:grid-cols-4",
  xl: "xl:grid-cols-5",
};

// 2. 컨테이너 일관성
const Container = ({ size = 'default', children }) => (
  <div className={cn(
    "mx-auto px-4 sm:px-6 lg:px-8",
    size === 'sm' && "max-w-2xl",
    size === 'default' && "max-w-4xl",
    size === 'lg' && "max-w-6xl",
    size === 'full' && "max-w-7xl",
  )}>
    {children}
  </div>
);

// 3. 태블릿 최적화 필요 (sm~md 사이)
```

---

## 4. 아이콘/이미지 시스템

### 현황: 80% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| 아이콘 라이브러리 | 95% | lucide-react 전체 사용 |
| 아이콘 크기 표준 | 40% | 하드코딩 (16, 18, 20, 24) |
| 이미지 최적화 | 90% | next/image 100% |
| 로고 시스템 | 70% | SVG, 크기 변형 제한적 |
| PWA 아이콘 | 85% | 192, 512 존재 |
| OG 이미지 | 50% | 기본만 존재 |
| 일러스트레이션 | 0% | 없음 |

### 누락 항목

```tsx
// 1. 아이콘 크기 상수
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// 2. 아이콘 래퍼 컴포넌트
interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof ICON_SIZES;
  className?: string;
}

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  return <IconComponent size={ICON_SIZES[size]} className={className} />;
}

// 3. OG 이미지 동적 생성
// app/api/og/route.tsx (ImageResponse 사용)
```

---

## 5. 폼/입력 패턴

### 현황: 60% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| useState 폼 | 100% | 전체 사용 |
| react-hook-form | 5% | 설치만 됨, 미사용 |
| Zod 검증 | 30% | API만 사용, 폼 미적용 |
| Input 컴포넌트 | 80% | shadcn/ui |
| Select 컴포넌트 | 75% | Radix 기반 |
| Checkbox/Radio | 70% | 기본만 |
| DatePicker | 0% | 없음 |
| 파일 업로드 | 60% | 기본 구현 |
| 폼 에러 표시 | 50% | 패턴 불일치 |

### 누락 항목

```tsx
// 1. react-hook-form 통합
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

// 2. Form 컴포넌트 표준화
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>이메일</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>

// 3. 클라이언트-서버 검증 동기화
// shared schema in packages/shared/schemas
```

---

## 6. 애니메이션/모션

### 현황: 68% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| CSS @keyframes | 90% | 14개 정의 |
| Tailwind animate | 85% | 기본 사용 |
| prefers-reduced-motion | 100% | 완벽 지원 |
| 페이지 전환 | 0% | 없음 |
| 스크롤 애니메이션 | 20% | 기본만 |
| 마이크로 인터랙션 | 50% | 부분 적용 |
| 로딩 애니메이션 | 80% | Skeleton, Spinner |
| 성공/에러 피드백 | 60% | Confetti만 |

### 누락 항목

```tsx
// 1. 페이지 전환 (View Transitions API)
// app/template.tsx
'use client';
import { usePathname } from 'next/navigation';

export default function Template({ children }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}

// 2. 스크롤 애니메이션
const scrollVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// 3. 성공 토스트 + 진동 피드백
```

---

## 7. 접근성 (A11y)

### 현황: 76% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| ARIA 속성 | 60% | Radix 자동, 커스텀 부족 |
| 키보드 네비게이션 | 85% | Radix 완벽, 커스텀 부분 |
| 포커스 관리 | 75% | focus-visible 적용 |
| 색상 대비 | 95% | OKLCh 최적화 |
| 스크린 리더 | 70% | 주요 컴포넌트만 |
| 폼 접근성 | 50% | aria-describedby 미적용 |
| 건너뛰기 링크 | 0% | 없음 |
| 랜드마크 | 60% | 부분 적용 |

### 누락 항목

```tsx
// 1. 건너뛰기 링크
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border focus:rounded"
>
  본문으로 건너뛰기
</a>

// 2. 랜드마크 구조
<header role="banner">...</header>
<nav role="navigation" aria-label="메인 메뉴">...</nav>
<main id="main-content" role="main">...</main>
<footer role="contentinfo">...</footer>

// 3. 폼 접근성 완성
<label htmlFor="email">이메일</label>
<input
  id="email"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : "email-hint"}
/>
<p id="email-hint" className="text-muted-foreground text-sm">
  로그인에 사용할 이메일을 입력하세요
</p>
```

---

## 8. SEO/메타데이터

### 현황: 50% 완성 (가장 심각)

| 원자 | 완성도 | 상태 |
|------|--------|------|
| Metadata API | 80% | 주요 페이지 적용 |
| 동적 OG 이미지 | 30% | 기본만 |
| JSON-LD | 20% | WebSite만 |
| robots.txt | 0% | **없음 (F)** |
| sitemap.xml | 0% | **없음 (F)** |
| Canonical URL | 40% | 부분 적용 |
| 다국어 | 0% | 없음 |

### 즉시 필요한 파일

```tsx
// 1. app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/analysis/'],
      },
    ],
    sitemap: 'https://yiroom.app/sitemap.xml',
  };
}

// 2. app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://yiroom.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yiroom.app/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // ... 동적 생성
  ];
}

// 3. JSON-LD 확장
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '이룸',
  url: 'https://yiroom.app',
  logo: 'https://yiroom.app/logo.png',
};
```

---

## 9. 데이터 페칭 패턴

### 현황: 65% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| Supabase 클라이언트 | 90% | 3가지 클라이언트 분리 |
| 서버 컴포넌트 | 80% | async/await |
| 클라이언트 페칭 | 60% | useEffect 기반 |
| React Query | 0% | 미사용 |
| 캐싱 전략 | 30% | PWA만 |
| 에러 처리 | 70% | try-catch |
| 로딩 상태 | 75% | Suspense 부분 |
| 무한 스크롤 | 40% | 기본 구현만 |

### 누락 항목

```tsx
// 1. React Query 도입
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts(category: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => fetchProducts(category),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000,   // 30분
  });
}

// 2. 서버 상태 캐싱
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1시간 ISR

// 3. 낙관적 업데이트
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newProduct) => {
    await queryClient.cancelQueries({ queryKey: ['products'] });
    const previous = queryClient.getQueryData(['products']);
    queryClient.setQueryData(['products'], (old) => [...old, newProduct]);
    return { previous };
  },
  onError: (err, newProduct, context) => {
    queryClient.setQueryData(['products'], context.previous);
  },
});
```

---

## 10. 보안 패턴

### 현황: 60% 완성 (Critical 이슈)

| 원자 | 완성도 | 상태 |
|------|--------|------|
| Clerk 인증 | 95% | 완벽 |
| Supabase RLS | 90% | 전체 적용 |
| Rate Limiting | 20% | **인메모리 (F)** |
| CSRF 보호 | 80% | Next.js 기본 |
| XSS 방지 | 85% | React 자동 |
| 환경변수 관리 | 75% | 부분 노출 위험 |
| Audit 로깅 | 60% | 기본만 |
| PII 마스킹 | 70% | redact-pii.ts |

### 즉시 필요한 수정

```typescript
// 1. Redis 기반 Rate Limiting (Upstash)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, headers: { ... } };
}

// 2. 환경변수 검증
// scripts/check-env.ts
const REQUIRED_SERVER_ONLY = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'CLERK_SECRET_KEY',
];

REQUIRED_SERVER_ONLY.forEach((key) => {
  if (process.env[`NEXT_PUBLIC_${key}`]) {
    throw new Error(`${key} must NOT have NEXT_PUBLIC_ prefix!`);
  }
});
```

---

## 11. 상태 관리 패턴

### 현황: 70% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| Zustand 스토어 | 90% | 3개 스토어 |
| persist 미들웨어 | 85% | 2개 적용 |
| React Context | 80% | 인증/테마 |
| URL 상태 | 60% | searchParams |
| 폼 상태 | 40% | useState만 |
| 서버 상태 | 50% | 캐싱 부재 |
| 동시성 제어 | 0% | 없음 |
| 롤백 메커니즘 | 0% | 없음 |

### 누락 항목

```typescript
// 1. Immer 미들웨어 (복잡한 상태 변경)
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    users: [],
    updateUser: (id, updates) =>
      set((state) => {
        const user = state.users.find((u) => u.id === id);
        if (user) Object.assign(user, updates);
      }),
  }))
);

// 2. 낙관적 업데이트 + 롤백
const updateWorkout = (id, data) => {
  const previous = get().workouts;

  // 낙관적 업데이트
  set((state) => ({
    workouts: state.workouts.map((w) =>
      w.id === id ? { ...w, ...data } : w
    ),
  }));

  try {
    await api.updateWorkout(id, data);
  } catch (error) {
    // 롤백
    set({ workouts: previous });
    throw error;
  }
};

// 3. 동시성 제어 (debounce/throttle)
import { debounce } from 'lodash-es';

const debouncedSave = debounce(saveToServer, 500);
```

---

## 12. 성능 최적화

### 현황: 75% 완성

| 원자 | 완성도 | 상태 |
|------|--------|------|
| next/font | 95% | 완벽 |
| next/image | 90% | AVIF/WebP |
| dynamic import | 80% | 주요 컴포넌트 |
| 번들 최적화 | 85% | optimizePackageImports |
| PWA 캐싱 | 80% | 3가지 전략 |
| ISR | 0% | 미사용 |
| 리스트 가상화 | 40% | 제품 목록만 |
| 메모이제이션 | 60% | 부분 적용 |

### 누락 항목

```tsx
// 1. ISR 적용
// app/products/[id]/page.tsx
export const revalidate = 3600; // 1시간

export async function generateStaticParams() {
  const products = await getTopProducts(100);
  return products.map((p) => ({ id: p.id }));
}

// 2. 리스트 가상화 확대
import { useVirtualizer } from '@tanstack/react-virtual';

// 모든 20개+ 리스트에 적용:
// - 분석 히스토리
// - 운동 기록
// - 영양 기록

// 3. 이미지 프리로딩
<link
  rel="preload"
  as="image"
  href="/hero-image.webp"
  imageSrcSet="/hero-image-480.webp 480w, /hero-image-800.webp 800w"
/>
```

---

## 우선순위별 개선 로드맵

### P0: Critical (즉시 필요)

| # | 항목 | 영역 | 예상 시간 |
|---|------|------|----------|
| 1 | robots.txt 생성 | SEO | 30분 |
| 2 | sitemap.xml 생성 | SEO | 1시간 |
| 3 | Rate Limiting → Redis | 보안 | 2시간 |
| 4 | 건너뛰기 링크 추가 | 접근성 | 30분 |

### P1: High (1주일 내)

| # | 항목 | 영역 | 예상 시간 |
|---|------|------|----------|
| 5 | react-hook-form 마이그레이션 | 폼 | 4시간 |
| 6 | Button Loading 상태 | 컴포넌트 | 1시간 |
| 7 | 폼 접근성 (aria-describedby) | 접근성 | 2시간 |
| 8 | 간격 토큰 시스템화 | 디자인 | 2시간 |
| 9 | z-index 시스템 정의 | 디자인 | 1시간 |
| 10 | 아이콘 크기 상수화 | 아이콘 | 1시간 |

### P2: Medium (2주일 내)

| # | 항목 | 영역 | 예상 시간 |
|---|------|------|----------|
| 11 | React Query 도입 | 데이터 | 4시간 |
| 12 | ISR 적용 (주요 페이지) | 성능 | 3시간 |
| 13 | 페이지 전환 애니메이션 | 애니메이션 | 2시간 |
| 14 | 타이포그래피 토큰 | 디자인 | 2시간 |
| 15 | JSON-LD 확장 | SEO | 2시간 |
| 16 | 낙관적 업데이트 패턴 | 상태관리 | 3시간 |

### P3: Low (1개월 내)

| # | 항목 | 영역 | 예상 시간 |
|---|------|------|----------|
| 17 | 다국어 지원 (i18n) | SEO | 8시간 |
| 18 | 스크롤 애니메이션 | 애니메이션 | 4시간 |
| 19 | 리스트 가상화 확대 | 성능 | 4시간 |
| 20 | 일러스트레이션 시스템 | 아이콘 | 8시간 |

---

## 원자 단위 완성도 매트릭스

```
                     0%    25%    50%    75%   100%
                     |------|------|------|------|
색상 토큰            ████████████████████████████░░ 95%
아이콘 라이브러리    ████████████████████████████░░ 95%
Clerk 인증           ████████████████████████████░░ 95%
Supabase RLS         ████████████████████████████░░ 90%
next/image           ████████████████████████████░░ 90%
CSS @keyframes       ████████████████████████████░░ 90%
Zustand              ████████████████████████████░░ 90%
PWA 아이콘           ██████████████████████████░░░░ 85%
키보드 네비게이션    ██████████████████████████░░░░ 85%
번들 최적화          ██████████████████████████░░░░ 85%
Metadata API         ████████████████████████░░░░░░ 80%
dynamic import       ████████████████████████░░░░░░ 80%
PWA 캐싱             ████████████████████████░░░░░░ 80%
Input 컴포넌트       ████████████████████████░░░░░░ 80%
에러 처리            ██████████████████████░░░░░░░░ 70%
스크린 리더          ██████████████████████░░░░░░░░ 70%
PII 마스킹           ██████████████████████░░░░░░░░ 70%
컨테이너             ██████████████████████░░░░░░░░ 70%
Empty State          ████████████████████░░░░░░░░░░ 60%
그리드 시스템        ████████████████████░░░░░░░░░░ 60%
Audit 로깅           ████████████████████░░░░░░░░░░ 60%
마이크로 인터랙션    ██████████████████░░░░░░░░░░░░ 50%
간격 토큰            ████████████████░░░░░░░░░░░░░░ 40%
Error Boundary       ████████████████░░░░░░░░░░░░░░ 40%
아이콘 크기 표준     ████████████████░░░░░░░░░░░░░░ 40%
무한 스크롤          ████████████████░░░░░░░░░░░░░░ 40%
리스트 가상화        ████████████████░░░░░░░░░░░░░░ 40%
타이포그래피         ██████████████░░░░░░░░░░░░░░░░ 35%
z-index              ████████████░░░░░░░░░░░░░░░░░░ 30%
동적 OG 이미지       ████████████░░░░░░░░░░░░░░░░░░ 30%
캐싱 전략            ████████████░░░░░░░░░░░░░░░░░░ 30%
스크롤 애니메이션    ████████░░░░░░░░░░░░░░░░░░░░░░ 20%
Rate Limiting        ████████░░░░░░░░░░░░░░░░░░░░░░ 20%
JSON-LD              ████████░░░░░░░░░░░░░░░░░░░░░░ 20%
react-hook-form      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 5%
Button Loading       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
Card Hover           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
페이지 전환          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
건너뛰기 링크        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
robots.txt           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
sitemap.xml          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
ISR                  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
React Query          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
동시성 제어          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
일러스트레이션       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
```

---

## 다음 단계

### 즉시 실행 (P0)

```bash
# 1. robots.txt 생성
# 2. sitemap.xml 생성
# 3. Rate Limiting Redis 마이그레이션
# 4. 건너뛰기 링크 추가
```

### 스펙 문서 필요

| 항목 | 스펙 문서 |
|------|----------|
| react-hook-form 마이그레이션 | SDD-FORM-SYSTEM.md |
| 디자인 토큰 시스템화 | SDD-DESIGN-TOKENS.md |
| React Query 도입 | SDD-DATA-FETCHING.md |

---

**Version**: 1.0 | **Created**: 2026-01-18
**분석 수행**: Claude Code (12 parallel agents)
**다음 검토**: P0 항목 완료 후
