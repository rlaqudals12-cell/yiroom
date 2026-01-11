# 이룸 Phase Next 로드맵

> **작성일**: 2025-12-04 | **최종 업데이트**: 2026-01-11
> **목표**: Lite PWA → Product DB v1 → React Native → RAG + Product DB v2
> **현재 상태**: Phase I/J 완료, 런칭 준비 단계

---

## 전체 타임라인 개요

| Phase | 내용                       | 주요 작업                   |
| ----- | -------------------------- | --------------------------- |
| **A** | Lite PWA + Product DB v1   | 설치 가능 앱 + 기본 제품 DB |
| **B** | React Native (iOS/Android) | Expo 기반 네이티브 앱       |
| **C** | RAG + Product DB v2        | 논문 기반 AI + 확장 제품 DB |

---

## Phase A: Lite PWA + Product DB v1

### A-0: 디자인 토큰 적용 ✅ 완료

**완료일**: 2025-12-04

| 항목                  | 상태                                     |
| --------------------- | ---------------------------------------- |
| globals.css 색상 토큰 | ✅ Stitch #2e5afa → oklch(0.53 0.23 262) |
| 폰트                  | ✅ Geist 유지 (Inter 호환)               |
| 빌드 테스트           | ✅ 통과                                  |

### A-1: Lite PWA 구현 ✅ 완료

**완료일**: 2025-12-04
**목표**: 앱 설치 가능 (오프라인 미지원)

#### 구현 항목

| 항목                    | 파일                   | 상태                |
| ----------------------- | ---------------------- | ------------------- |
| manifest.ts             | `app/manifest.ts`      | ✅                  |
| next.config.ts PWA 설정 | `next.config.ts`       | ✅                  |
| PWA 아이콘              | `public/icons/`        | ✅ 이룸 브랜딩 적용 |
| 로고 교체               | `public/logo.png`      | ✅                  |
| OG 이미지 교체          | `public/og-image.png`  | ✅                  |
| 파비콘                  | `public/favicon-*.png` | ✅                  |
| PWA 매니페스트          | `public/manifest.json` | ✅                  |

#### manifest.ts 예시

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';

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
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

#### next.config.ts PWA 설정

```typescript
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // Lite PWA: 오프라인 캐싱 비활성화
  cacheOnFrontEndNav: false,
});

const nextConfig = {
  // Turbopack 설정 (Next.js 16 필수)
  turbopack: {},
  // 기존 설정 유지
};

export default withPWA(nextConfig);
```

---

### A-2: Product DB v1 구축 ✅ 완료

**완료일**: 2025-12-04
**목표**: 화장품 + 영양제 기본 DB

#### 구현 항목

| 항목            | 파일                                              | 상태 |
| --------------- | ------------------------------------------------- | ---- |
| DB 마이그레이션 | `supabase/migrations/20251204_product_tables.sql` | ✅   |
| TypeScript 타입 | `types/product.ts`                                | ✅   |
| API 유틸리티    | `lib/products.ts`                                 | ✅   |
| RLS 정책        | 공개 읽기 + Service Role 쓰기                     | ✅   |

#### 데이터베이스 스키마

```sql
-- 화장품 테이블
CREATE TABLE cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- cleanser, toner, serum, moisturizer, sunscreen, mask, makeup
  subcategory TEXT, -- 세부 카테고리
  price_range TEXT, -- budget, mid, premium
  price_krw INTEGER, -- 실제 가격 (원)

  -- 피부 타입 적합도
  skin_types TEXT[], -- dry, oily, combination, sensitive, normal
  concerns TEXT[], -- acne, aging, whitening, hydration, pore, redness

  -- 성분 정보
  key_ingredients TEXT[],
  avoid_ingredients TEXT[], -- 피해야 할 성분

  -- 퍼스널 컬러 (메이크업용)
  personal_color_seasons TEXT[], -- Spring, Summer, Autumn, Winter

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 영양제 테이블
CREATE TABLE supplement_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- vitamin, mineral, protein, omega, probiotic, collagen

  -- 효능
  benefits TEXT[], -- skin, hair, energy, immunity, digestion, sleep

  -- 성분 정보
  main_ingredients JSONB, -- {name: string, amount: string, unit: string}[]

  -- 권장 대상
  target_concerns TEXT[], -- 피부건조, 탈모, 피로, 소화불량

  -- 메타데이터
  price_krw INTEGER,
  dosage TEXT, -- 1일 1정
  image_url TEXT,
  purchase_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 (공개 읽기)
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cosmetic_products FOR SELECT USING (true);

ALTER TABLE supplement_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON supplement_products FOR SELECT USING (true);
```

#### 초기 데이터 수집 계획

| 카테고리    | 목표 수량  | 소스                    |
| ----------- | ---------- | ----------------------- |
| 클렌저      | 20개       | 올리브영, 화해          |
| 토너        | 20개       | 올리브영, 화해          |
| 세럼/에센스 | 30개       | 올리브영, 화해          |
| 수분크림    | 20개       | 올리브영, 화해          |
| 선크림      | 15개       | 올리브영, 화해          |
| 메이크업    | 30개       | 올리브영                |
| 영양제      | 30개       | 아이허브, 필라이즈 참고 |
| **총계**    | **~165개** | -                       |

---

## Phase B: React Native (iOS + Android)

### B-1: 프로젝트 구조

**Monorepo 구조** (Turborepo 사용)

```
yiroom/
├── apps/
│   ├── web/           # 기존 Next.js (Lite PWA)
│   └── mobile/        # React Native (Expo)
├── packages/
│   ├── shared/        # 공통 타입, 유틸리티
│   ├── ui/            # 공통 UI 컴포넌트
│   └── api-client/    # Supabase 클라이언트
├── package.json
└── turbo.json
```

### B-2: 기술 스택

| 항목         | 선택               | 이유                         |
| ------------ | ------------------ | ---------------------------- |
| Framework    | Expo (SDK 52+)     | React Native 표준, 빠른 개발 |
| Auth         | Clerk React Native | 공식 SDK 지원                |
| Database     | Supabase           | 기존 스키마 재사용           |
| State        | Zustand            | 웹과 동일                    |
| Navigation   | Expo Router        | 파일 기반 라우팅             |
| Camera       | expo-camera        | 네이티브 카메라              |
| Image Picker | expo-image-picker  | 갤러리 접근                  |

### B-3: 코드 공유 전략

| 레이어         | 공유 가능 | 비고                       |
| -------------- | --------- | -------------------------- |
| 타입 정의      | ✅ 100%   | `packages/shared/types/`   |
| API 클라이언트 | ✅ 100%   | `packages/api-client/`     |
| 비즈니스 로직  | ✅ 90%    | Zustand stores             |
| UI 컴포넌트    | ❌ 30%    | 플랫폼별 구현 필요         |
| 스타일         | ❌ 별도   | NativeWind 또는 StyleSheet |

### B-4: 주요 구현 항목

```yaml
Phase B-1 (모노레포 설정): ✅ 완료
  [x] Turborepo 설정
  [x] Expo 프로젝트 생성 (apps/mobile)
  [x] packages/shared 공통 타입
  [x] 기본 네비게이션 구조 (5개 탭)

Phase B-2 (인증 & 데이터): ✅ 완료
  [x] Clerk React Native 연동
  [x] Supabase 클라이언트 공유
  [x] Zustand 스토어 재사용
  [x] 로그인/회원가입 화면

Phase B-3 (Phase 1 포팅): ✅ 완료
  [x] 대시보드
  [x] PC-1 퍼스널 컬러 (문진 + 카메라)
  [x] S-1 피부 분석 (카메라)
  [x] C-1 체형 분석 (갤러리)
  [x] Gemini AI 모듈

Phase B-4 (Phase 2 포팅): ✅ 완료
  [x] W-1 운동 온보딩/결과/세션
  [x] N-1 영양 대시보드/기록
  [x] R-1 리포트 화면

Phase B-5 (배포 준비): ✅ 완료
  [x] EAS Build 설정 (eas.json)
  [x] Development Build 설정 (expo-dev-client)
  [x] Android APK 빌드 스크립트
  [x] 앱 스토어 메타데이터 (store-metadata.json)
  [x] 프라이버시 정책/이용약관 페이지
  [x] 푸시 알림 설정 (expo-notifications)

Phase B-6 (정식 배포): 🔒 2026/01/17 이후
  # 사업자 등록 완료 후 진행
  [ ] Apple Developer Program 가입
  [ ] Google Play Developer 등록
  [ ] iOS TestFlight 베타 배포
  [ ] Android 내부 테스트 배포
  [ ] App Store / Google Play 심사
```

---

## Phase C: RAG + Product DB v2 🔄 진행 중

### C-1: RAG 시스템 구축 ✅ 완료

**목표**: 논문/연구 기반 신뢰성 있는 추천
**완료일**: 2025-12-04

#### 아키텍처

```
사용자 질문
    ↓
[임베딩 생성] (OpenAI ada-002 또는 Gemini)
    ↓
[벡터 검색] (Supabase pgvector)
    ↓
[관련 문서 추출]
    ↓
[LLM 답변 생성] (Gemini 3 Pro)
    ↓
출처 포함 응답
```

#### 데이터베이스 확장

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 논문/연구 데이터
CREATE TABLE research_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- journal name, website
  source_url TEXT,
  published_date DATE,

  -- 카테고리
  category TEXT, -- skincare, nutrition, fitness, personal_color
  tags TEXT[],

  -- 컨텐츠
  content TEXT NOT NULL,
  summary TEXT,

  -- 벡터 임베딩
  embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 인덱스
CREATE INDEX ON research_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 데이터 소스

| 소스             | 카테고리 | 예상 문서 수 |
| ---------------- | -------- | ------------ |
| PubMed           | 피부과학 | 100+         |
| 대한피부과학회지 | 피부     | 50+          |
| 영양학 저널      | 영양     | 50+          |
| 운동생리학 논문  | 운동     | 50+          |
| **총계**         | -        | **250+**     |

### C-2: Product DB v2 확장

#### 데이터 확장

| 카테고리  | v1    | v2 목표 |
| --------- | ----- | ------- |
| 화장품    | 135개 | 500개+  |
| 영양제    | 30개  | 200개+  |
| 운동 기구 | 0     | 50개+   |
| 건강식품  | 0     | 100개+  |

#### 기능 확장

```yaml
v2 새 기능:
  [ ] 가격 실시간 업데이트 (크롤링)
  [ ] 사용자 리뷰 통합
  [ ] 구매 링크 어필리에이트
  [ ] 개인화 추천 알고리즘
  [ ] 성분 충돌 경고 (영양제)
```

---

## 디자인 에셋 현황

### Stitch 디자인 익스포트 (확보됨)

**위치**: `stitch_total_wellness_ai_homepage/`

| 화면 카테고리    | 파일 수              | 상태    |
| ---------------- | -------------------- | ------- |
| 홈페이지         | 4개 (desktop/mobile) | ✅ 확보 |
| 대시보드         | 20개                 | ✅ 확보 |
| 피부 분석 리포트 | 4개                  | ✅ 확보 |
| 코디 AI 리포트   | 8개                  | ✅ 확보 |
| 식단 AI 리포트   | 2개                  | ✅ 확보 |
| 운동 AI 리포트   | 2개                  | ✅ 확보 |
| 온보딩 플로우    | 20개+                | ✅ 확보 |
| 설정/프로필      | 20개+                | ✅ 확보 |

### 디자인 토큰 (추출됨)

```css
/* 배경 */
--background: #f8f9fc;

/* 텍스트 */
--text-primary: #0d101c;
--text-secondary: #475a9e;

/* 버튼 */
--primary: #2e5afa;
--secondary: #e6e9f4;

/* 보더 */
--border: #ced4e9;
```

### 폰트

- **Primary**: Inter
- **Fallback**: Noto Sans
- **Weights**: 400, 500, 700, 900

### 브랜딩 교체 필요

| 현재 (Stitch)                | 변경 (이룸)             |
| ---------------------------- | ----------------------- |
| "Total Wellness AI Platform" | "이룸"                  |
| "Total Wellness AI"          | "이룸 - 온전한 나는?"   |
| 영문 설명                    | 한국어 설명             |
| 반원 로고 아이콘             | 이룸 로고 (필요시 제작) |

### 아이콘/에셋 상태 ✅ 완료

| 항목                  | 상태    | 파일                                        |
| --------------------- | ------- | ------------------------------------------- |
| 앱 아이콘 (192-512px) | ✅ 완료 | public/icons/ (4종)                         |
| 로고                  | ✅ 완료 | public/logo.png                             |
| OG 이미지             | ✅ 완료 | public/og-image.png                         |
| 파비콘                | ✅ 완료 | public/favicon-16x16.png, favicon-32x32.png |
| PWA 매니페스트        | ✅ 완료 | public/manifest.json                        |

### 참조 문서

- **디자인 시스템**: [docs/DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)

---

## 우선순위 체크리스트

### 1차 진행: A-0 + A-1 (색상 토큰 + PWA) ✅ 완료 (2025-12-11)

```yaml
# A-0: 디자인 토큰 적용 ✅
[x] globals.css에 Stitch 색상 변수 추가 (oklch 형식)
[x] oklch 색상 변환 (#2e5afa → oklch(0.53 0.23 262))
[x] 폰트: Geist 유지 (Inter와 호환)
[x] 빌드 테스트 통과

# A-1: Lite PWA 설정 ✅
[x] @ducanh2912/next-pwa 설치
[x] app/manifest.ts 생성 (이룸 브랜딩)
[x] next.config.ts PWA 래핑 추가
[x] .gitignore PWA 캐시 파일 추가
[x] 빌드 + webpack 모드 성공
[x] PWA 아이콘 (public/icons/) - 이룸 브랜딩 적용
[x] 로고/OG 이미지 적용
[x] 파비콘 생성 (16x16, 32x32)
[x] public/manifest.json 생성
```

### 2차 진행: A-2 (Product DB) ✅ 완료 (2025-12-04)

```yaml
# A-2: Product DB v1
[x] cosmetic_products 테이블 마이그레이션 생성
[x] supplement_products 테이블 마이그레이션 생성
[x] TypeScript 타입 정의 (types/product.ts)
[x] API 유틸리티 (lib/products.ts)
[x] RLS 정책 설정 (공개 읽기)
[x] 시드 데이터 파일 (data/seeds/*.json)
    - cosmetic-products.json (30개)
    - supplement-products.json (20개)
[x] 시드 스크립트 (scripts/seed-products.ts)
[x] 데이터 입력 가이드 (docs/PRODUCT-DATA-GUIDE.md)
[ ] 추가 데이터 입력 (~115개) - 수동 작업 필요
```

### 현재 단계: Launch (런칭 준비)

> **상세 문서**: [docs/phase-next/PHASE-F-OPERATION.md](phase-next/PHASE-F-OPERATION.md)

```yaml
# Phase F: 운영 준비 ✅ 완료 (2025-12-25)
[x] F-1: 관리자 페이지 ✅ 완료
[x] F-2: UI/UX 개선 ✅ 완료
[x] F-3: E2E 테스트 확장 ✅ 완료
[x] F-4: Analytics/모니터링 ✅ 완료
[x] F-5: 배포 준비 ✅ 완료 (환경변수 체크리스트 제공)

# Phase H: 소셜 ✅ 완료 (2025-12-25)
[x] H-1: 웰니스 스코어 시스템
[x] H-2: 친구 관리 (추가/삭제/검색)
[x] H-3: 리더보드 (운동/영양/XP/레벨)
[x] H-4: 챌린지 (팀/개인)
[x] H-5: 소셜 피드

# Phase I: 어필리에이트 ✅ 완료 (2026-01-11)
[x] I-1: iHerb 파트너 연동
[x] I-2: 쿠팡 파트너스 연동
[x] I-3: 무신사/에이블리 연동
[x] I-4: 클릭 트래킹 대시보드
[x] I-5: 날씨 기반 의상 추천 (25개 테스트)
[x] I-6: 바코드 스캔 (16개 테스트)
[x] I-7: Before/After 비교 (39개 테스트)
[x] I-8: 마이 인벤토리 (373개 테스트)

# Phase J: AI 스타일링 ✅ 완료 (2026-01-11)
[x] J-P1: 색상 조합 추천 (15개 테스트)
[x] J-P2: 악세서리/메이크업 (31개 테스트)
[x] J-P3: 전체 코디/공유 (25개 테스트)
```

---

## 디자인 작업 가이드

> **상세 문서**: [docs/DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md)

기능 점검 완료 후 디자인 수정 시 Cursor Visual Editor + Gemini 3를 활용한 워크플로우를 적용합니다.

| 도구                 | 역할                                           |
| -------------------- | ---------------------------------------------- |
| Cursor Visual Editor | UI 시각적 조작 (드래그 앤 드롭, 스타일 컨트롤) |
| Gemini 3 Pro         | 디자인 AI (Point-and-Prompt)                   |
| Claude Code          | 로직 검증, 테스트, 스펙 문서                   |

---

## 의존성 및 리스크

| 항목            | 리스크                  | 대응                           | 상태      |
| --------------- | ----------------------- | ------------------------------ | --------- |
| 디자인 에셋     | 브랜딩 미정             | 임시 에셋으로 진행             | ✅ 완료   |
| 디자인 시스템   | 문서 구버전             | DESIGN-SYSTEM.md v2.0 업데이트 | ✅ 완료   |
| 제품 데이터     | 수동 입력 필요          | 크롤러 개발 완료               | ✅ 완료   |
| **사업자 등록** | **2026/01/17까지 불가** | **B-6 대기, 웹 배포 먼저**     | ⏳ 대기   |
| App Store 심사  | 리젝 가능성             | 가이드라인 사전 검토 (B-6에서) | ⏳ 대기   |
| RAG 비용        | 임베딩 API 비용         | pgvector 무료, LLM만 유료      | ✅ 구축됨 |

---

**Version**: 1.4 | **Updated**: 2026-01-11
