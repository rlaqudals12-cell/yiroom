# 다음 진행 작업 목록

> **작성일**: 2025-12-11
> **현재 상태**: F-1~F-4 완료, F-5 배포 대기, **4단계 완료 (Dynamic Import 적용)**

---

## 완료된 작업

- [x] F-2 UI 폴리싱 (2.1~2.7) 완료
- [x] DESIGN-SYSTEM.md v2.0 업데이트
- [x] ROADMAP-PHASE-NEXT.md v1.2 업데이트
- [x] 네이티브 앱 출시 계획 검토
- [x] **1단계 완료 (2025-12-12)**
  - [x] 1.3 notification-icon.png 생성
  - [x] 1.2 페이지별 loading.tsx (7개)
  - [x] 2.3 Skip-to-main 링크
  - [x] F-2 테스트 수정 (BottomNav, SelectionCard, step1)
  - [x] GridSkeleton 동적 클래스 → 정적 매핑 수정
- [x] **2단계 완료 (2025-12-12)**
  - [x] 1.1 다크모드 토글 (ThemeProvider, ThemeToggle, layout.tsx)
  - [x] 4.2 다크모드 모듈 색상 (globals.css)
  - [x] 3.2 EmptyStateCard 다크모드
  - [x] SelectionCard 다크모드
- [x] **2.5단계 완료 (2025-12-12)**
  - [x] 다크모드 primary 색상 이룸 블루 통일 (globals.css)
  - [x] BottomNav 다크모드 (gray → CSS 변수)
  - [x] AnalysisLoadingBase 다크모드
  - [x] StreakCard 다크모드
  - [x] WorkoutHistoryCard 다크모드
  - [x] ExerciseSessionCard 다크모드
- [x] **3단계 완료 (2025-12-12)**
  - [x] 2.1 네비게이션 접근성 (Navbar, BottomNav - ARIA 속성 추가)
  - [x] 2.2 에러 페이지 스타일 통일 (error.tsx, not-found.tsx - CSS 변수 마이그레이션)
  - [x] 4.1 Toast 스타일링 개선 (Toaster 다크모드 + 상태별 색상)

---

## 다음 진행 작업

### Tier 1: 필수 (앱 출시 전)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 1.1 | **다크모드 토글** | 3시간 | `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx` | ✅ 완료 |
| 1.2 | **페이지별 loading.tsx** | 2시간 | `app/(main)/*/loading.tsx` | ✅ 완료 |
| 1.3 | **notification-icon.png 생성** | 10분 | `apps/mobile/assets/notification-icon.png` | ✅ 완료 |

### Tier 2: 권장 (UX 향상)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 2.1 | Navbar/BottomNav 접근성 | 2시간 | `components/Navbar.tsx`, `components/BottomNav.tsx` | ✅ 완료 |
| 2.2 | 에러 페이지 스타일 통일 | 1시간 | `app/error.tsx`, `app/not-found.tsx` | ✅ 완료 |
| 2.3 | Skip-to-main 링크 | 30분 | `app/layout.tsx` | ✅ 완료 |

### Tier 3: 선택 (성능/폴리싱)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 3.1 | 동적 import (코드 분할) | 2시간 | 대형 컴포넌트들 | ✅ 완료 |
| 3.2 | EmptyState 다크모드 | 1.5시간 | `components/common/EmptyStateCard.tsx` | ✅ 완료 |
| 3.3 | 브레드크럼 컴포넌트 | 1.5시간 | `components/ui/Breadcrumb.tsx` | ✅ 완료 |

### Tier 4: 추가 개선 (선택)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 4.1 | Toast 스타일링 개선 | 1시간 | `app/layout.tsx` (Toaster 설정) | ✅ 완료 |
| 4.2 | 다크모드 모듈 색상 | 1시간 | `globals.css` | ✅ 완료 |
| 4.3 | 나머지 gray 색상 마이그레이션 | 2시간 | ~15개 컴포넌트 | ✅ 완료 |

---

## 권장 진행 순서 (최적화)

> **기준**: 기술적 의존성 → 안전성 → 효율성

```
1단계: 독립적 + 위험 낮음 ✅ 완료 (2025-12-12)
├── 1.3 notification-icon.png ✅
├── 1.2 페이지별 loading.tsx (7개) ✅
└── 2.3 Skip-to-main 링크 ✅

2단계: 다크모드 묶음 (핵심) ✅ 완료 (2025-12-12)
├── 1.1 다크모드 토글 ✅
├── 4.2 다크모드 모듈 색상 ✅
├── 3.2 EmptyStateCard 다크모드 ✅
└── SelectionCard 다크모드 ✅

2.5단계: 핵심 컴포넌트 gray 마이그레이션 ✅ 완료 (2025-12-12)
├── 다크모드 --primary 이룸 블루 통일 ✅
├── BottomNav 다크모드 ✅
├── AnalysisLoadingBase 다크모드 ✅
├── StreakCard 다크모드 ✅
├── WorkoutHistoryCard 다크모드 ✅
└── ExerciseSessionCard 다크모드 ✅

3단계: 접근성 + 스타일 ✅ 완료 (2025-12-12)
├── 2.1 네비게이션 접근성 ✅
├── 2.2 에러 페이지 통일 ✅
└── 4.1 Toast 스타일링 ✅

4단계: 성능/추가 (선택)
├── 3.3 브레드크럼 ✅ 완료 (2025-12-12)
│   - components/ui/Breadcrumb.tsx 생성
│   - 15개 테스트 통과
├── 3.1 동적 import ✅ 완료 (2025-12-19)
│   - nutrition/dynamic.tsx: Sheet + 인사이트 카드 6개
│   - products/dynamic.tsx: ProductFilters, ProductDetailTabs
│   - products/detail/dynamic.tsx: PriceHistoryChart
│   - 예상 번들 감소: ~300KB
└── 4.3 나머지 gray 마이그레이션 ✅ 완료 (2025-12-12)
    - gray-[0-9] 패턴 전체 마이그레이션 완료
    - bg-white → bg-card 마이그레이션 (16개 파일)
```

### 의존성 다이어그램

```
1.1 다크모드 토글
    ├── 4.2 다크모드 모듈 색상 (의존)
    └── 3.2 EmptyState 다크모드 (의존)

나머지: 독립적 (병렬 가능)
```

---

## 구현 가이드

### 1.1 다크모드 토글

```tsx
// components/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// components/ThemeToggle.tsx
'use client';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // 토글 UI 구현
}
```

### 1.2 loading.tsx 예시

```tsx
// app/(main)/dashboard/loading.tsx
import { GridSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4">
      <GridSkeleton count={6} />
    </div>
  );
}
```

### 2.3 Skip-to-main 링크

```tsx
// app/layout.tsx 상단에 추가
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             bg-primary text-white px-4 py-2 rounded-lg z-50"
>
  본문으로 건너뛰기
</a>

// main 태그에 id 추가
<main id="main-content" className="pb-16 md:pb-0">
```

### 4.1 Toast 스타일링 개선

```tsx
// components/ui/toast.tsx
// 기본 스타일에 브랜드 색상 적용

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        success: 'border-status-success/20 bg-status-success/10 text-status-success',
        error: 'border-status-error/20 bg-status-error/10 text-status-error',
        warning: 'border-status-warning/20 bg-status-warning/10 text-status-warning',
      },
    },
  }
);
```

### 4.2 다크모드 모듈 색상

```css
/* globals.css - .dark 블록에 추가 */
.dark {
  /* 기존 색상 ... */

  /* 모듈별 색상 (다크모드) */
  --module-workout: oklch(0.75 0.12 45);
  --module-workout-light: oklch(0.25 0.05 45);
  --module-workout-dark: oklch(0.85 0.15 45);

  --module-nutrition: oklch(0.65 0.12 150);
  --module-nutrition-light: oklch(0.20 0.05 150);
  --module-nutrition-dark: oklch(0.75 0.15 150);

  /* ... 나머지 모듈 색상 */
}
```

### 1.3 notification-icon.png

```bash
# 기존 아이콘 복사하여 생성
cp apps/mobile/assets/icon.png apps/mobile/assets/notification-icon.png

# 또는 48x48 크기로 리사이즈 필요 시
# 알림 아이콘은 일반적으로 48x48 또는 96x96 권장
```

### 2.1 네비게이션 접근성

```tsx
// components/Navbar.tsx
<nav role="navigation" aria-label="메인 네비게이션">
  <ul role="menubar">
    <li role="none">
      <Link role="menuitem" aria-current={isActive ? 'page' : undefined}>
        홈
      </Link>
    </li>
  </ul>
</nav>

// components/BottomNav.tsx
<nav role="navigation" aria-label="하단 네비게이션">
  <button
    role="menuitem"
    aria-label={`${label}${isActive ? ', 현재 페이지' : ''}`}
    aria-current={isActive ? 'page' : undefined}
  >
    <Icon aria-hidden="true" />
    <span>{label}</span>
  </button>
</nav>
```

### 2.2 에러 페이지 통일

```tsx
// app/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-status-error" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">문제가 발생했습니다</h1>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={reset} className="bg-primary">다시 시도</Button>
      </div>
    </div>
  );
}

// app/not-found.tsx - 동일한 스타일 적용
```

### 3.1 동적 import (코드 분할)

```tsx
// 대형 컴포넌트 동적 로딩
import dynamic from 'next/dynamic';

// 차트 컴포넌트
const NutritionChart = dynamic(
  () => import('@/components/nutrition/NutritionChart'),
  {
    loading: () => <CardSkeleton />,
    ssr: false  // 클라이언트 전용
  }
);

// 에디터 컴포넌트
const RichEditor = dynamic(
  () => import('@/components/common/RichEditor'),
  { loading: () => <TextSkeleton lines={5} /> }
);

// 모달 컴포넌트
const ShareModal = dynamic(
  () => import('@/components/share/ShareModal'),
  { ssr: false }
);
```

**롤백 가이드**:
```bash
# 동적 import 문제 발생 시
git diff HEAD~1 -- "*.tsx" | grep -A5 "dynamic("
# 문제 컴포넌트 원복
git checkout HEAD~1 -- path/to/component.tsx
```

### 3.2 EmptyState 다크모드

```tsx
// components/common/EmptyState.tsx
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted dark:bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
```

### 3.3 브레드크럼 컴포넌트

```tsx
// components/ui/Breadcrumb.tsx
'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="브레드크럼" className="flex items-center gap-2 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        <Home className="w-4 h-4" aria-label="홈" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

---

## 테스트 계획

각 단계 완료 후 반드시 테스트를 실행합니다.

### 단계별 테스트

```bash
# 모든 단계 후 필수 실행
npm run typecheck && npm run test

# 1단계 완료 후
npm run build  # 빌드 확인

# 2단계 (다크모드) 완료 후
npm run dev    # 수동 테스트: 다크모드 토글 확인

# 3단계 완료 후
npm run test -- --coverage  # 커버리지 확인

# 4단계 (동적 import) 완료 후
npm run build && npm run start  # 프로덕션 빌드 테스트
```

### 롤백 가이드

```bash
# 문제 발생 시 롤백
git stash                    # 현재 변경 임시 저장
git checkout HEAD~1 -- .     # 이전 커밋으로 복원

# 특정 파일만 롤백
git checkout HEAD~1 -- path/to/file.tsx
```

---

## 참고 문서

| 문서 | 위치 |
|------|------|
| 디자인 시스템 | [docs/DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) |
| Phase F 계획 | [docs/phase-next/PHASE-F-OPERATION.md](PHASE-F-OPERATION.md) |
| 로드맵 | [docs/ROADMAP-PHASE-NEXT.md](../ROADMAP-PHASE-NEXT.md) |

---

## F-5 배포 체크리스트

> **배포 완료일**: 2025-12-13
> **현재 단계**: ✅ 기능 점검 완료 (2025-12-19)
> **런칭 예정일**: 📅 2026-01-20 이후

---

## Part A: 테스트 단계 (현재)

### 1. Vercel 환경변수 (필수)

Vercel Dashboard → Settings → Environment Variables에서 확인:

| 변수명 | 용도 | 테스트 단계 | 확인 |
|--------|------|-------------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 | `pk_test_...` ✅ | [ ] |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 | `sk_test_...` ✅ | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 설정됨 | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | 설정됨 | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role | 설정됨 | [ ] |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI API Key | 설정됨 | [ ] |

### 2. Vercel 환경변수 (선택)

| 변수명 | 용도 | 확인 |
|--------|------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 에러 추적 | [ ] |
| `SENTRY_DSN` | Sentry 서버사이드 | [ ] |
| `SENTRY_ORG` | Sentry 조직명 | [ ] |
| `SENTRY_PROJECT` | Sentry 프로젝트명 | [ ] |
| `SENTRY_AUTH_TOKEN` | Sentry 인증 토큰 | [ ] |
| `NEXT_PUBLIC_SITE_URL` | 프로덕션 URL | [ ] |

> **참고**: `CRON_SECRET`은 Vercel에서 자동 처리 (설정 불필요)

### 3. 기능 점검 체크리스트

#### 인증 (Clerk)
- [x] 회원가입 정상 동작
- [x] 로그인 정상 동작
- [x] 로그아웃 정상 동작
- [x] 소셜 로그인 (Google 등)

#### Phase 1 분석 모듈
- [x] PC-1 퍼스널컬러 분석 플로우
- [x] S-1 피부 분석 플로우
- [x] C-1 체형 분석 플로우
- [x] 이미지 업로드 정상 동작
- [x] AI 분석 결과 표시

#### Phase 2 운동 모듈 (W-1)
- [x] 온보딩 7단계 완료
- [x] 운동 분석 결과 표시
- [x] 운동 플랜 생성
- [x] 운동 세션 기록
- [x] 스트릭 표시

#### Phase 2 영양 모듈 (N-1)
- [x] 온보딩 7단계 완료
- [x] 음식 촬영/분석
- [x] 식단 기록
- [x] 칼로리 대시보드
- [x] 수분 섭취 기록
- [x] 간헐적 단식 타이머

#### 공통 기능
- [x] 대시보드 로드
- [x] 다크모드 전환
- [x] 제품 추천 표시
- [x] 위시리스트 저장/삭제
- [x] 공유 기능

### 4. Supabase 프로덕션 확인

- [ ] 프로덕션 Supabase 프로젝트 사용 확인 (개발용 X)
- [ ] RLS 정책 활성화 확인 (모든 테이블)
- [ ] 마이그레이션 적용 완료 확인
- [ ] Storage 버킷 권한 설정 확인

```bash
# Supabase Dashboard에서 확인
# Authentication → Policies → 각 테이블 RLS 활성화 여부
# Database → Tables → clerk_user_id 기반 정책 확인
```

### 5. Cron Job 확인

```bash
# Vercel Cron 설정 확인 (vercel.json)
{
  "crons": [{
    "path": "/api/cron/update-prices",
    "schedule": "0 3 * * *"  # 매일 새벽 3시
  }]
}
```

- [ ] Vercel Dashboard → Cron Jobs 탭에서 등록 확인
- [ ] 수동 테스트 (Vercel Logs에서 결과 확인)

### 6. SEO & 도메인 확인

#### SEO
- [ ] `/robots.txt` 접근 확인 (크롤링 허용)
- [ ] `/sitemap.xml` 접근 확인 (페이지 목록)
- [ ] Open Graph 메타 태그 확인 (링크 공유 시 미리보기)

#### 커스텀 도메인 (선택)
- [ ] Vercel Dashboard → Domains에서 도메인 추가
- [ ] DNS 레코드 설정 (A/CNAME)
- [ ] SSL 인증서 자동 발급 확인
- [ ] `NEXT_PUBLIC_SITE_URL` 환경변수 업데이트

### 7. 배포 후 작업

- [ ] 프로덕션 URL 접속 확인
- [ ] HTTPS 연결 확인 (자물쇠 아이콘)
- [ ] 모바일 반응형 확인
- [ ] PWA 설치 테스트 (Add to Home Screen)
- [ ] Lighthouse 성능 점수 확인 (목표: 90+)
- [ ] 에러 로그 모니터링 (Sentry 또는 Vercel Logs)

### 8. 보안 확인 (선택)

- [ ] Vercel 보안 헤더 확인 (X-Frame-Options, CSP 등)
- [ ] API 엔드포인트 인증 확인 (Clerk 미들웨어)
- [ ] 민감 정보 노출 확인 (환경변수 클라이언트 노출 X)

### 9. 피드백 채널 설정

- [ ] 피드백 수집 방법 결정 (이메일/폼/Discord 등)
- [ ] 버그 리포트 채널 설정
- [ ] 사용자 문의 대응 프로세스

---

## Part B: 런칭 단계 (2026-01-20 이후)

> ⏳ 사업자 등록 완료 후 진행

### 1. Clerk 프로덕션 키 교체

| 항목 | 테스트용 | 프로덕션용 | 확인 |
|------|----------|------------|------|
| Clerk 공개 키 | `pk_test_...` | `pk_live_...` | [ ] |
| Clerk 비밀 키 | `sk_test_...` | `sk_live_...` | [ ] |

**교체 방법:**
1. Clerk Dashboard → API Keys → Production 키 복사
2. Vercel Dashboard → Environment Variables → 값 업데이트
3. Vercel에서 Redeploy 실행

### 2. 최종 점검

- [ ] 프로덕션 키로 로그인 테스트
- [ ] 실제 이메일 인증 동작 확인
- [ ] 테스트 데이터 정리 (필요시)
- [ ] Google AI 쿼터 확인 및 조정

### 3. 런칭

- [ ] 공식 URL 공개
- [ ] 사용자 안내 (SNS, 커뮤니티 등)
- [ ] 모니터링 강화 (첫 24시간)

---

## Part C: 기능 확장 계획 (2025-12-17 결정)

> **결정일**: 2025-12-17
> **목표**: 운동 DB 확장 + 브랜딩 중립화

---

### 1. 운동 DB 확장

#### 현재 상태 (2025-12-18 업데이트)

| 카테고리 | 운동 수 | 파일 | 상태 |
|---------|---------|------|------|
| 상체 | ~50개 | `data/exercises/upper-body.json` | ✅ 기존 |
| 하체/코어/유산소 | ~50개 | `data/exercises/lower-core-cardio.json` | ✅ 기존 |
| **필라테스** | 25개 | `data/exercises/pilates.json` | ✅ 완료 |
| **요가** | 20개 | `data/exercises/yoga.json` | ✅ 완료 |
| **스트레칭** | 25개 | `data/exercises/stretching.json` | ✅ 완료 |

**총 운동 데이터: 170개**

#### 추가 계획 (완료)

| 파일 | 운동 수 | 운동 타입 | 상태 |
|------|---------|----------|------|
| `data/exercises/pilates.json` | 25개 | toner, flexer | ✅ 완료 |
| `data/exercises/yoga.json` | 20개 | flexer | ✅ 완료 |
| `data/exercises/stretching.json` | 25개 | flexer | ✅ 완료 |

#### 운동 타입 매핑 (변경 없음)

| 타입 | 의미 | 해당 운동 |
|------|------|----------|
| toner | 토닝/탄력 | 필라테스, 저중량 |
| builder | 근육 성장 | 웨이트, 고중량 |
| burner | 지방 연소 | HIIT, 유산소 |
| mover | 활동성 | 크로스핏 |
| flexer | 유연성 | **요가, 스트레칭, 필라테스 일부** |

---

### 2. 브랜딩 중립화

#### 현재 문제점

| 항목 | 현재 상태 | 문제 |
|------|----------|------|
| 로고 심볼 | 꽃 아이콘 | 여성 타겟 연상 |
| 로고 색상 | 핑크/라벤더 그라데이션 | 여성 타겟 연상 |
| 타겟 | 모든 연령대 | 브랜딩과 불일치 |

#### 결정 사항

- **방향**: 처음부터 중립적 (리브랜딩 비용 회피)
- **제작 방식**: 직접 제작 (Figma)
- **색상 기반**: 이룸 블루 (#2e5afa) 유지
- **심볼**: 성장/균형/웰니스 상징 (꽃 대체)

#### 진행 상태

| 단계 | 설명 | 상태 |
|------|------|------|
| 1. 레퍼런스 리서치 | 성별 중립 웰니스 앱 사례 | ✅ 완료 |
| 2. 심볼 후보 선정 | 3~5개 후보 | ✅ 완료 |
| 3. Figma 제작 | 로고 + 앱 아이콘 | ⏳ 대기 |
| 4. 적용 | `public/logo.png`, `icons/` | ⏳ 대기 |

> **리서치 결과**: `docs/research/reviewed/branding-specification.md`
> **권장 심볼**: 나선/스파이럴 (성장, 진화) 또는 동심원 (완전함, 균형)

---

### 3. 리서치 자료 관리

#### 폴더 구조

```
docs/research/
├── raw/           # 원본 리서치 (검토 전)
├── reviewed/      # 사용할 자료 (검토 완료)
├── archive/       # 불필요 (삭제 대기)
└── README.md      # 사용 가이드
```

#### 리서치 주제 목록

| 주제 | 파일명 | 깊이 | 상태 |
|------|--------|------|------|
| 필라테스 운동 | `pilates-exercises.md` | 심층 | ✅ 완료 (JSON 변환됨) |
| 요가 포즈 | `yoga-poses.md` | 심층 | ✅ 완료 (JSON 변환됨) |
| 스트레칭 루틴 | `stretching-routines.md` | 표면 | ✅ 완료 (JSON 변환됨) |
| 성별 중립 브랜딩 | `branding-specification.md` | 심층 | ✅ 완료 (2025-12-19) |
| 로고 트렌드 | `branding-specification.md` | 표면 | ✅ 완료 (통합됨) |

#### 워크플로우

```
1. Claude.ai 딥 리서치 → raw/ 저장
2. Claude Code 검토 → reviewed/ 이동
3. JSON 변환 → data/exercises/*.json
4. 코드 연동 → 타입/컴포넌트 수정
```

---

### 4. 기능 점검 범위

#### 핵심 점검 (현재)

- [ ] 로그인/회원가입
- [ ] 대시보드 접근
- [ ] 분석 1개 (퍼스널컬러 또는 체형)
- [ ] 운동 온보딩 → 결과
- [ ] 영양 기본 흐름

#### 전체 점검 (기능 추가 후)

- Part A 체크리스트 전체 (3. 기능 점검 체크리스트)

---

### 5. 기술 의존성 (2차원 분류 설계)

> **결정일**: 2025-12-17
> **설계 원칙**: 기존 호환성 유지 + 미래 확장성 확보

#### 문제 정의

```
현재: ExerciseCategory = '부위 기반' (upper, lower, core, cardio)
추가: 필라테스/요가/스트레칭 = '방식 기반'

→ 분류 체계 불일치 문제
```

#### 해결책: 2차원 분류

```typescript
// 차원 1: 부위 (기존 유지)
type ExerciseCategory = 'upper' | 'lower' | 'core' | 'cardio';

// 차원 2: 방식 (신규 추가)
type ExerciseStyle =
  | 'weight'       // 웨이트 트레이닝
  | 'calisthenics' // 맨몸 운동
  | 'pilates'      // 필라테스
  | 'yoga'         // 요가
  | 'stretching'   // 스트레칭
  | 'hiit'         // 고강도 인터벌
  | 'functional';  // 기능성 운동
```

#### 데이터 예시

```json
{
  "name": "필라테스 헌드레드",
  "category": "core",
  "style": "pilates"
}
{
  "name": "요가 전사자세 I",
  "category": "lower",
  "style": "yoga"
}
```

#### 수정 필요 파일

| 파일 | 변경 내용 | 시점 |
|------|----------|------|
| `types/workout.ts` | `ExerciseStyle` 타입 추가 | JSON 변환 전 |
| `types/workout.ts` | `Exercise.style?` 필드 추가 | JSON 변환 전 |
| `types/workout.ts` | `suitableFor.contraindications?` 필드 추가 | JSON 변환 전 |
| `lib/workout/exercises.ts` | 새 JSON import 추가 | JSON 생성 후 |
| 기존 JSON 파일 | `style` 필드 추가 (선택적) | 선택 |

#### Exercise 타입 확장

```typescript
interface Exercise {
  // 기존 필드 유지
  id: string;
  name: string;
  category: ExerciseCategory;
  // ...

  // 기존 suitableFor 확장 (법적 대비)
  suitableFor: {
    bodyTypes?: string[];
    goals?: string[];
    injuries?: string[];         // 부상: 허리 통증, 무릎 부상 등 (기존)
    contraindications?: string[]; // 금기 조건: 임산부, 고혈압, 녹내장 등 (신규)
  };

  // 신규 필드 (선택적)
  style?: ExerciseStyle;        // 운동 방식
  sanskritName?: string;        // 요가 산스크리트명
  breathingGuide?: string;      // 호흡법
  variations?: {                // 변형 동작
    easier?: string;
    harder?: string;
  };
  mentalEffects?: string[];     // 정신적 효과 (요가/명상)
  physicalEffects?: string[];   // 신체적 효과 (유연성/근력 등)
}
```

#### 필터링 시나리오

| 사용자 요청 | 쿼리 |
|------------|------|
| "필라테스만" | `style === 'pilates'` |
| "상체 운동" | `category === 'upper'` |
| "코어 요가" | `category === 'core' && style === 'yoga'` |

#### 작업 순서 (2025-12-18 완료)

> **참조**: 위 "Exercise 타입 확장" 섹션의 타입 정의를 `types/workout.ts` 구현 시 참조

```
1. ✅ types/workout.ts 수정 (ExerciseStyle + contraindications 추가)
2. ✅ 리서치 자료 기반 JSON 생성 (style, contraindications 필드 포함)
   - pilates.json (25개)
   - yoga.json (20개)
   - stretching.json (25개)
3. ✅ lib/workout/exercises.ts에 import 추가
4. ⏸️ (선택) 기존 JSON에 style 추가 - 추후 진행
5. ✅ 테스트 실행 (2,571개 통과)
```

---

**테스트 단계**: Part A 체크리스트 진행
**런칭 단계**: Part B 체크리스트 진행 (2026-01-20 이후)
**기능 확장**: Part C - 운동 DB 확장 완료, 브랜딩 중립화 대기

---

## Part D: Phase H 게이미피케이션 (2025-12-24)

> **현재 상태**: Sprint 3 완료
> **참조**: `docs/phase-next/PHASE-H-ROADMAP.md`

### 완료된 작업 (Sprint 1)

- [x] DB 마이그레이션: badges, user_badges, user_levels 테이블
- [x] TypeScript 타입: `types/gamification.ts`
- [x] 라이브러리 함수: `lib/gamification/` (constants, badges, levels, streak-integration)
- [x] UI 컴포넌트: `components/gamification/` (BadgeCard, BadgeGrid, LevelProgress, LevelUpModal, BadgeNotification)
- [x] 대시보드 위젯: GamificationWidget
- [x] 프로필 배지 페이지: `/profile/badges`
- [x] 테스트: 83개 케이스 통과

### 완료된 작업 (Sprint 2)

- [x] 운동 스트릭 → 배지 시스템 연동 (`lib/api/workout.ts`)
- [x] 영양 스트릭 → 배지 시스템 연동 (`app/api/nutrition/meals/route.ts`)
- [x] XP 자동 부여 (운동 5XP, 식단 2XP, 분석 10XP)
- [x] 분석 완료 시 배지 부여 (PC-1, S-1, C-1, 전체 완료)
- [x] 운동 횟수 배지 (10회, 50회, 100회)
- [x] 첫 운동/첫 식단 배지

### 완료된 작업 (Sprint 3)

- [x] 배지 획득 알림 Toast 통합 (`components/gamification/BadgeToast.tsx`)
- [x] 레벨업 축하 모달 연동 (`components/gamification/GamificationProvider.tsx`)
- [x] 게이미피케이션 알림 Hook (`hooks/useGamificationNotification.tsx`)
- [x] 앱 레이아웃에 GamificationProvider 통합 (`app/layout.tsx`)
- [x] 챌린지 시스템 설계 문서 (`docs/phase-next/CHALLENGE-SYSTEM-DESIGN.md`)
- [x] 테스트: 15개 케이스 추가 (총 98개)

### 완료된 작업 (Sprint 4 - 챌린지 시스템)

- [x] challenges, user_challenges DB 마이그레이션
- [x] TypeScript 타입 정의 (`types/challenges.ts`)
- [x] 라이브러리 함수 (`lib/challenges/`)
- [x] UI 컴포넌트 (`components/challenges/`)
- [x] 챌린지 목록/상세 페이지
- [x] 참여/완료/포기 기능
- [x] 진행 상황 자동 업데이트 (운동/영양 연동)
- [x] 대시보드 위젯 (`ChallengeWidget`)
- [x] 프로필 페이지 (`/profile`, `/profile/badges`)
- [x] E2E 테스트 추가
- [x] 테스트: 28개 케이스 통과

---

## Phase H Sprint 2 계획

> **계획 문서**: `docs/phase-next/PHASE-H-SPRINT2-PLAN.md`
> **상태**: 계획 완료, 구현 대기

### 핵심 기능

| 우선순위 | 기능 | 설명 |
|---------|------|------|
| P0 | 통합 웰니스 스코어 | 종합 건강 점수 (0-100) |
| P1 | 친구 기능 | 친구 추가/목록/검색 |
| P2 | 리더보드 | 주간/월간 랭킹 |
| P3 | 챌린지 확장 | 템플릿 10개 추가 |

### 구현 순서

```yaml
Week 1:
  - 웰니스 스코어 DB + 타입
  - 점수 계산 로직
  - UI 컴포넌트 + 대시보드 위젯
  - 테스트 30개

Week 2:
  - 친구 기능 (DB + 라이브러리 + UI)
  - 리더보드 (DB + Cron + UI)
  - 챌린지 템플릿 10개 추가
  - E2E + 통합 테스트
```

### 추가 기능 (Sprint 3+)

- 챌린지 알림 (푸시 알림)
- AI 코칭 메시지
- 친구와 함께 챌린지 참여

---
