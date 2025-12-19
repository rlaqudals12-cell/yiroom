# 프로젝트 파일 구조 현황

> **마지막 업데이트**: 2025-12-19
> **상태**: Phase 1~F 완료, 운영 준비 중

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

| 파일/디렉토리 | 상태 | 비고 |
|--------------|------|------|
| `layout.tsx` | ✅ | 루트 레이아웃 + ThemeProvider |
| `page.tsx` | ✅ | 홈페이지 |
| `globals.css` | ✅ | 다크모드 + 모듈 색상 |
| `not-found.tsx` | ✅ | 404 페이지 |
| `error.tsx` | ✅ | 에러 페이지 + Sentry |
| `robots.ts` | ✅ | SEO 크롤링 규칙 |
| `sitemap.ts` | ✅ | 동적 사이트맵 |
| `manifest.webmanifest` | ✅ | PWA 매니페스트 |

### 기능 모듈 ✅ 완료

| 모듈 | 경로 | 상태 |
|------|------|------|
| PC-1 퍼스널컬러 | `(main)/analysis/personal-color/` | ✅ |
| S-1 피부 분석 | `(main)/analysis/skin/` | ✅ |
| C-1 체형 분석 | `(main)/analysis/body/` | ✅ |
| W-1 운동 | `(main)/workout/` | ✅ |
| N-1 영양 | `(main)/nutrition/` | ✅ |
| R-1 리포트 | `(main)/reports/` | ✅ |
| 제품 | `(main)/products/` | ✅ |
| 위시리스트 | `(main)/wishlist/` | ✅ |
| 관리자 | `admin/` | ✅ |

### public/ ✅ 완료

| 파일 | 상태 |
|------|------|
| `icons/` (192~512px) | ✅ |
| `logo.png` | ✅ |
| `og-image.png` | ✅ |
| `favicon-*.png` | ✅ |
| `manifest.webmanifest` | ✅ |

### lib/ 주요 모듈 ✅ 완료

| 모듈 | 설명 |
|------|------|
| `supabase/` | DB 클라이언트 (Clerk 통합) |
| `gemini.ts` | Gemini AI 연동 |
| `products/` | Product DB Repository |
| `workout/` | 운동 로직 |
| `nutrition/` | 영양 로직 |
| `admin/` | 관리자 기능 |
| `rag/` | RAG 시스템 |
| `share/` | 공유 기능 |

---

## 다음 작업 (docs/phase-next/NEXT-TASKS.md 참조)

- [x] 코드 품질 개선 (동적 import) ✅ 2025-12-19
- [x] Lighthouse 성능 최적화 ✅ 2025-12-19
  - Preconnect 힌트 추가
  - PWA manifest 활성화
  - (실제 점수 측정은 배포 후 진행)
- [x] UI/UX 개선 ✅ 2025-12-19
  - F-2: 2.A~2.7 완료 (PHASE-F-OPERATION.md 참조)
  - Tier 1~4 완료 (NEXT-TASKS.md 참조)
  - DESIGN-WORKFLOW.md: Cursor Visual Editor + Gemini 3 워크플로우 문서화
- [~] 브랜딩 작업 (로고 중립화) 🔄 리서치 완료, 디자인 대기
  - [x] 벤치마크 리서치 (Calm, Headspace, Nike) ✅ 2025-12-19
  - [x] 심볼 후보 선정 (나선/스파이럴, 동심원)
  - [x] 브랜딩 스펙 문서 작성 (docs/research/reviewed/branding-specification.md)
  - [ ] Figma 디자인 (로고 + 앱 아이콘)
  - [ ] 에셋 제작 및 적용
- [~] 6차: Product DB v2 확장 🔄 진행 중 (2025-12-19)
  - [x] Sprint 1: 사용자 리뷰 시스템 ✅ 2025-12-19
    - DB 마이그레이션 (product_reviews, review_helpful)
    - types/review.ts 타입 정의
    - lib/products/services/reviews.ts 서비스
    - 리뷰 컴포넌트 (StarRating, ReviewCard, ReviewList, ReviewForm, ReviewSection)
    - 제품 상세 페이지 연동
  - [x] Sprint 2: 성분 충돌 경고 ✅ 2025-12-19
    - DB 마이그레이션 (ingredient_interactions + 24개 시드 데이터)
    - types/interaction.ts 타입 정의
    - lib/products/services/interactions.ts 서비스
    - 상호작용 컴포넌트 (InteractionWarning, InteractionDetail)
    - 위시리스트 페이지 경고 연동
  - [x] Sprint 3: 어필리에이트 연동 ✅ 2025-12-19
    - DB 마이그레이션 (affiliate_url/commission 필드 + affiliate_clicks 테이블)
    - types/affiliate.ts 타입 정의
    - lib/products/affiliate.ts 서비스 (trackAffiliateClick, openAffiliateLink, getAffiliateStats)
    - 제품 타입 affiliateUrl/Commission 필드 추가 (전 제품)
    - PurchaseButton 컴포넌트 (클릭 트래킹 연동)
  - 스펙: [FEATURE-SPEC-PRODUCT-DB-V2.md](phase-next/FEATURE-SPEC-PRODUCT-DB-V2.md)

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| [PROGRESS-ALL.md](PROGRESS-ALL.md) | 전체 진행 상황 |
| [NEXT-TASKS.md](phase-next/NEXT-TASKS.md) | 다음 작업 목록 |
| [ROADMAP-PHASE-NEXT.md](ROADMAP-PHASE-NEXT.md) | 로드맵 |
