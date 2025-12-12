# 다음 진행 작업 목록

> **작성일**: 2025-12-11
> **현재 상태**: F-1~F-4 완료, F-5 배포 대기, **2.5단계 완료**

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
| 2.1 | Navbar/BottomNav 접근성 | 2시간 | `components/Navbar.tsx`, `components/BottomNav.tsx` | ⏳ |
| 2.2 | 에러 페이지 스타일 통일 | 1시간 | `app/error.tsx`, `app/not-found.tsx` | ⏳ |
| 2.3 | Skip-to-main 링크 | 30분 | `app/layout.tsx` | ✅ 완료 |

### Tier 3: 선택 (성능/폴리싱)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 3.1 | 동적 import (코드 분할) | 2시간 | 대형 컴포넌트들 | ⏳ |
| 3.2 | EmptyState 다크모드 | 1.5시간 | `components/common/EmptyStateCard.tsx` | ✅ 완료 |
| 3.3 | 브레드크럼 컴포넌트 | 1.5시간 | `components/ui/Breadcrumb.tsx` | ⏳ |

### Tier 4: 추가 개선 (선택)

| # | 작업 | 예상 시간 | 파일 | 상태 |
|---|------|----------|------|------|
| 4.1 | Toast 스타일링 개선 | 1시간 | `components/ui/toast.tsx` | ⏳ |
| 4.2 | 다크모드 모듈 색상 | 1시간 | `globals.css` | ✅ 완료 |
| 4.3 | 나머지 gray 색상 마이그레이션 | 2시간 | 15개 컴포넌트 | ⏳ |

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

3단계: 접근성 + 스타일 ⭐ ← 다음
├── 2.1 네비게이션 접근성 (2시간)
├── 2.2 에러 페이지 통일 (1시간)
└── 4.1 Toast 스타일링 (1시간)

4단계: 성능/추가 (마지막)
├── 3.3 브레드크럼 (1.5시간) - 새 컴포넌트
├── 3.1 동적 import (2시간) - 가장 위험
└── 4.3 나머지 gray 마이그레이션 (2시간) - 15개 컴포넌트
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

## F-5 배포 체크리스트 (사용자 진행)

- [ ] Vercel 프로젝트 설정
- [ ] 환경변수 설정 (Sentry DSN 등)
- [ ] 프로덕션 배포
- [ ] 시크릿 교체 (보안)
- [ ] 피드백 수집 채널 설정

---

**다음 세션 시작 시**: 이 문서를 읽고 Tier 1부터 순차 진행
