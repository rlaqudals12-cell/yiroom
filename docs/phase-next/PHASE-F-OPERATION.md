# Phase F: 운영 준비 계획

> **작성일**: 2025-12-11
> **목표**: 관리자 페이지 + UI/UX 개선 + 모니터링 + 배포
> **예상 기간**: 5-7일

---

## 전체 로드맵

| Step | 내용 | 예상 기간 | 우선순위 |
|------|------|----------|----------|
| F-1 | 관리자 페이지 | 3-4일 | 필수 |
| F-2 | UI/UX 개선 | 2-3일 | 필수 |
| F-3 | E2E 테스트 확장 | 1일 | 권장 |
| F-4 | Analytics/모니터링 | 0.5일 | 필수 |
| F-5 | 배포 + 피드백 | 지속 | 필수 |

---

## F-1: 관리자 페이지 (3-4일)

### 목표
관리자 전용 대시보드 및 CRUD 기능 구현

### 파일 구조

```
app/
└── admin/
    ├── layout.tsx              # 관리자 레이아웃 + 권한 체크
    ├── page.tsx                # 대시보드 (통계)
    ├── products/
    │   ├── page.tsx            # 제품 목록
    │   ├── [id]/page.tsx       # 제품 수정
    │   └── new/page.tsx        # 제품 추가
    ├── users/
    │   └── page.tsx            # 사용자 목록/통계
    ├── content/
    │   ├── exercises/page.tsx  # 운동 DB 관리
    │   ├── foods/page.tsx      # 음식 DB 관리
    │   └── research/page.tsx   # 연구 문서 관리
    ├── system/
    │   ├── page.tsx            # 시스템 상태
    │   ├── crawler/page.tsx    # 크롤러 관리
    │   └── features/page.tsx   # Feature Flags
    └── _components/
        ├── AdminSidebar.tsx    # 사이드바 네비게이션
        ├── AdminHeader.tsx     # 헤더
        ├── StatCard.tsx        # 통계 카드
        └── DataTable.tsx       # 데이터 테이블 (공통)

lib/
└── admin/
    ├── index.ts                # 통합 export
    ├── auth.ts                 # 관리자 권한 체크
    ├── stats.ts                # 통계 조회
    └── feature-flags.ts        # Feature Flags 관리

components/
└── admin/
    ├── index.ts
    ├── ProductForm.tsx         # 제품 CRUD 폼
    ├── UserTable.tsx           # 사용자 테이블
    ├── FeatureFlagToggle.tsx   # 기능 토글
    └── CrawlerControl.tsx      # 크롤러 실행 버튼
```

### 작업 목록

| # | Task | 파일 | 설명 | 상태 |
|---|------|------|------|------|
| 1.1 | 관리자 권한 체크 | `lib/admin/auth.ts` | Clerk 메타데이터 기반 권한 | ✅ 완료 |
| 1.2 | Feature Flags 테이블 | `migrations/20251211_admin_features.sql` | DB 스키마 | ✅ 완료 |
| 1.3 | Feature Flags API | `lib/admin/feature-flags.ts` | CRUD 함수 | ✅ 완료 |
| 1.4 | 관리자 레이아웃 | `app/admin/layout.tsx` | 사이드바 + 권한체크 | ✅ 완료 |
| 1.5 | 대시보드 | `app/admin/page.tsx` | 통계 카드들 | ✅ 완료 |
| 1.6 | 제품 관리 | `app/admin/products/*` | 목록 + 추가 UI | ✅ 완료 |
| 1.7 | 사용자 관리 | `app/admin/users/page.tsx` | 목록 + 통계 | ✅ 완료 |
| 1.8 | 시스템 관리 | `app/admin/system/*` | 크롤러 + Features | ✅ 완료 |

### 데이터베이스 스키마

```sql
-- Feature Flags 테이블
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,           -- 'workout_module', 'nutrition_module' 등
  name TEXT NOT NULL,                 -- '운동 모듈'
  description TEXT,                   -- '운동 온보딩 및 기록 기능'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 활동 로그
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  action TEXT NOT NULL,               -- 'product.create', 'feature.toggle' 등
  target_type TEXT,                   -- 'product', 'feature', 'user'
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Feature Flags 목록 (초기)

| Key | Name | 설명 |
|-----|------|------|
| `analysis_personal_color` | 퍼스널 컬러 분석 | PC-1 모듈 |
| `analysis_skin` | 피부 분석 | S-1 모듈 |
| `analysis_body` | 체형 분석 | C-1 모듈 |
| `workout_module` | 운동 모듈 | W-1 전체 |
| `nutrition_module` | 영양 모듈 | N-1 전체 |
| `product_recommendations` | 제품 추천 | 추천 기능 |
| `ai_qa` | AI Q&A | 제품 Q&A 기능 |
| `price_crawler` | 가격 크롤러 | 자동 가격 업데이트 |

### 관리자 권한 체크 방식

```typescript
// Clerk 사용자 메타데이터에 role: 'admin' 설정
// lib/admin/auth.ts

import { auth, currentUser } from '@clerk/nextjs/server';

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user?.publicMetadata?.role === 'admin';
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}
```

---

## F-2: UI/UX 개선 (2-3일)

### 목표
전체적인 디자인 개선 및 사용성 향상

### 완료된 작업 (2025-12-11)

| # | Task | 대상 | 설명 | 상태 |
|---|------|------|------|------|
| 2.A | 공유 기능 | `lib/share/`, `components/share/`, `hooks/useShare.ts` | 결과 이미지 공유/다운로드 | ✅ 완료 |
| 2.B | 애니메이션 컴포넌트 | `components/animations/` | FadeInUp, ScaleIn, Confetti, CountUp | ✅ 완료 |
| 2.C | 온보딩 UX 개선 | `components/workout/common/` | ProgressIndicator 색상 테마, SelectionCard 터치 피드백 | ✅ 완료 |
| 2.D | 커스텀 keyframes | `globals.css` | fade-in-up, scale-in, count-pulse 애니메이션 + 접근성 | ✅ 완료 |
| 2.E | ShareButton 테스트 | `tests/components/share/ShareButton.test.tsx` | 16개 테스트 케이스 | ✅ 완료 |
| 2.F | imageGenerator 테스트 | `tests/lib/share/imageGenerator.test.ts` | 5개 테스트 케이스 | ✅ 완료 |

### 추후 작업 (UI 폴리싱) - ✅ 완료 (2025-12-11)

| # | Task | 대상 | 설명 | 상태 |
|---|------|------|------|------|
| 2.1 | 색상/테마 리뉴얼 | `globals.css` | 모듈별 CSS 변수, 그라디언트 표준화 | ✅ 완료 |
| 2.2 | 홈 페이지 개선 | `app/page.tsx` | Next/Image, 모듈 태그 색상, CTA 애니메이션 | ✅ 완료 |
| 2.3 | 대시보드 개선 | `app/(main)/dashboard/` | 위젯 색상 통일 | ✅ 완료 |
| 2.4 | 네비게이션 개선 | `components/` | BottomNav/Navbar CSS 변수화 | ✅ 완료 |
| 2.5 | 폼 UX 개선 | `components/workout/common/` | SelectionCard 접근성, StepNavigation 로딩 | ✅ 완료 |
| 2.6 | 로딩 상태 개선 | `components/ui/` | ContentSkeleton 컴포넌트 생성 | ✅ 완료 |
| 2.7 | 반응형 개선 | 전체 | 패딩 통일, BottomNav 간격 처리 | ✅ 완료 |

### 디자인 가이드라인

```yaml
색상 팔레트:
  primary: oklch(0.53 0.23 262)    # 이룸 블루
  secondary: oklch(0.65 0.20 330)  # 이룸 핑크
  accent: oklch(0.75 0.15 85)      # 이룸 골드

폰트:
  heading: "Inter", "Noto Sans KR", sans-serif
  body: "Inter", "Noto Sans KR", sans-serif

간격:
  mobile: 16px padding
  desktop: 24px padding

그림자:
  card: 0 2px 8px rgba(0,0,0,0.08)
  modal: 0 8px 32px rgba(0,0,0,0.12)
```

---

## F-3: E2E 테스트 확장 (1일)

### 목표
주요 사용자 시나리오 커버리지 확대

### 작업 목록

| # | 시나리오 | 파일 | 상태 |
|---|----------|------|------|
| 3.1 | 제품 탐색 플로우 | `e2e/products/products.spec.ts` | ✅ 완료 |
| 3.2 | 위시리스트 플로우 | `e2e/wishlist.spec.ts` | ✅ 완료 |
| 3.3 | 관리자 플로우 | `e2e/admin/admin.spec.ts` | ✅ 완료 |
| 3.4 | 모바일 반응형 | `e2e/mobile.spec.ts` | ✅ 완료 |

---

## F-4: Analytics/모니터링 (0.5일)

### 목표
트래픽 분석 + 에러 트래킹 설정

### 작업 목록

| # | Task | 도구 | 상태 |
|---|------|------|------|
| 4.1 | Vercel Analytics 설치 | `@vercel/analytics`, `@vercel/speed-insights` | ✅ 완료 |
| 4.2 | Sentry 설치 | `@sentry/nextjs` | ✅ 완료 |
| 4.3 | 에러 바운더리 연동 | `app/error.tsx`, `app/global-error.tsx` | ✅ 완료 |

### 설정 파일

```
apps/web/
├── sentry.client.config.ts   # 클라이언트 Sentry 설정
├── sentry.server.config.ts   # 서버 Sentry 설정
├── sentry.edge.config.ts     # Edge Runtime 설정
└── app/
    ├── error.tsx             # Sentry 에러 리포팅 연동
    └── global-error.tsx      # 치명적 에러 리포팅 연동
```

### 필요한 환경변수 (배포 시)

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=yiroom-web
SENTRY_AUTH_TOKEN=sntrys_xxx

# Vercel Analytics는 Vercel 배포 시 자동 활성화
```

---

## F-5: 배포 + 피드백 (지속)

### 목표
프로덕션 배포 및 사용자 피드백 수집

### 작업 목록

| # | Task | 설명 | 상태 |
|---|------|------|------|
| 5.1 | Vercel 프로젝트 설정 | 환경변수, 도메인 | ⏳ |
| 5.2 | 프로덕션 배포 | `vercel --prod` | ⏳ |
| 5.3 | 시크릿 교체 | 보안 취약점 대응 | ⏳ |
| 5.4 | 피드백 수집 채널 | 설문/인터뷰 | ⏳ |
| 5.5 | 버그 수정 사이클 | 피드백 반영 | 지속 |

---

## 성공 지표

| Phase | 지표 | 목표 |
|-------|------|------|
| F-1 | 관리자 기능 완성도 | 100% CRUD |
| F-2 | Lighthouse 점수 | 90+ |
| F-3 | E2E 커버리지 | 주요 플로우 100% |
| F-4 | 에러 알림 설정 | Sentry 연동 완료 |
| F-5 | 배포 성공 | 프로덕션 런칭 |

---

## 의존성 관계

```
F-1 (관리자) ──┐
              ├──> F-2 (UI/UX) ──> F-3 (E2E)
F-4 (Analytics)┘
                                      │
                                      v
                               F-5 (배포)
```

---

**버전**: v1.0
**작성일**: 2025-12-11
