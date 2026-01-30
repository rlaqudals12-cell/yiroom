# 이룸 UI/UX 통합 스펙 번들 (Gemini용)

> **Version**: 2.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-21
> **Purpose**: Gemini AI UI/UX 디자인 구현을 위한 통합 스펙 문서
> **Tech Stack**: Next.js 16, React 19, shadcn/ui, Tailwind CSS, Supabase
> **확정 디자인**: "YIROOM IDENTITY ✨" (100/100점)

---

## 목차

1. [브랜드 아이덴티티](#1-브랜드-아이덴티티)
2. [Information Architecture (IA)](#2-information-architecture-ia)
3. [디자인 시스템](#3-디자인-시스템)
4. [핵심 모듈별 스펙](#4-핵심-모듈별-스펙)
5. [컴포넌트 우선순위](#5-컴포넌트-우선순위)
6. [기술적 제약사항](#6-기술적-제약사항)
7. [성공 기준](#7-성공-기준)

---

## 1. 브랜드 아이덴티티

### 1.1 핵심 정보

| 항목 | 값 |
|------|-----|
| **앱 이름** | 이룸 (Yiroom) |
| **헤더 타이틀** | "YIROOM IDENTITY ✨" |
| **서브 타이틀** | "YIROOM INTELLIGENCE" |
| **슬로건** | "Absolute Singularity - 당신만의 아름다움을 발견하세요" |
| **핵심 철학** | 사용자의 변화를 돕는 통합 웰니스 AI 플랫폼 |
| **디자인 콘셉트** | Absolute Singularity - THE FABRIC OF IDENTITY |
| **기본 테마** | **Dark Mode (기본)** |

### 1.2 로고 시스템 (3-Mode)

| 모드 | 용도 | 컬러 |
|------|------|------|
| **CLASSIC** | 기술/공식 | White + Black (Monochrome) |
| **BEAUTY** | 마케팅/브랜딩 | Rose-Pink Gradient |
| **SOFT** | 앱 UX/일상 | Soft-Pink (부드러운 톤) |

### 1.3 브랜드 컬러 (확정 - Dark Mode 기본)

```css
/* ========================================
   🎨 확정 디자인 토큰 (YIROOM IDENTITY ✨)
   ======================================== */

/* Primary Gradient (핑크 그라디언트 CTA) */
--brand-primary: #F8C8DC;
--brand-primary-end: #FFB6C1;
--brand-gradient: linear-gradient(135deg, #F8C8DC 0%, #FFB6C1 100%);

/* Accent Colors (모듈별) */
--accent-blue: #60A5FA;      /* 피부 분석 (S-1) */
--accent-purple: #A78BFA;    /* 체형 분석 (C-1) */
--accent-pink: #F472B6;      /* 퍼스널컬러 (PC-1) */
--accent-green: #4ADE80;     /* 웰니스 (N-1, W-1) */

/* Dark Mode Background (기본) */
--background: #0F0F0F;
--card-background: #1A1A1A;
--card-border: #2A2A2A;

/* Text Colors */
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--text-muted: #6B7280;

/* Semantic Colors */
--success: #22C55E;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Trust Badge Colors */
--badge-bg: rgba(255, 255, 255, 0.1);
--badge-text: #E5E7EB;
```

### 1.4 확정 UI 패턴

#### Progress Bar 패턴
```
"1/3 완료 (33%)" + 단계 표시
⬡ ◯ ◯  (완료/미완료 아이콘)
```

#### Sub-card 패턴
```
┌─────────────────────────────┐
│ 🔵 (컬러 아이콘)             │
│ 6존 AI 스캐닝               │  ← 한글 설명 필수
│ 피부 분석                    │
└─────────────────────────────┘
```

#### Trust Badge 패턴
```
상단 우측: "10만+ 사용자 신뢰" | "AI 정확도 92%"
```

#### CTA Button 패턴
```tsx
<button className="bg-gradient-to-r from-[#F8C8DC] to-[#FFB6C1]
  text-black font-semibold py-4 px-8 rounded-full">
  무료로 시작하기
</button>
```

---

## 2. Information Architecture (IA)

### 2.1 메뉴 구조

```
이룸 앱 구조
├── 📊 홈 (Dashboard)
│   ├── 오늘의 인사이트
│   ├── 분석 완료율 요약
│   ├── 최근 분석 결과
│   └── 추천 제품/콘텐츠
│
├── 🔬 분석 (Analysis Hub)
│   ├── PC-1: 퍼스널컬러 분석
│   │   ├── 촬영/업로드
│   │   ├── 분석 결과
│   │   └── 컬러 팔레트
│   ├── S-1: 피부 분석
│   │   ├── 촬영/업로드
│   │   ├── FaceZoneMap (6존)
│   │   ├── 피부 활력도
│   │   └── 스킨케어 솔루션
│   ├── C-1: 체형 분석
│   │   ├── 촬영/업로드
│   │   ├── 5-Type 체형
│   │   └── 패션 추천
│   ├── F-1: 얼굴형 분석 (계획)
│   │   ├── 6종 얼굴형
│   │   ├── 이목구비 분석
│   │   └── 스타일 퍼스널리티
│   └── IC-1: 통합 컨설팅 (계획)
│       └── 크로스 모듈 인사이트
│
├── 👗 스타일링 (AI Styling)
│   ├── J-1: 의류 추천
│   │   ├── 시즌별 팔레트
│   │   ├── 체형별 핏
│   │   └── TPO 가이드
│   ├── J-2: 악세서리/메이크업
│   └── J-3: 풀 코디네이션 (계획)
│
├── 👕 옷장 (Capsule Wardrobe)
│   ├── 내 옷장
│   │   ├── 아이템 등록
│   │   ├── 카테고리 관리
│   │   └── 컬러 태깅
│   ├── 코디 생성
│   ├── 착용 기록
│   └── 캡슐 최적화
│
├── 🥗 웰니스 (Wellness)
│   ├── N-1: 영양 분석
│   │   ├── BMR/TDEE 계산
│   │   ├── 바코드 스캔
│   │   └── 영양제 추천
│   └── W-1: 운동 추천
│       ├── 5-Type 운동
│       ├── MET 칼로리
│       └── 주간 플랜
│
├── 📦 제품 (Products)
│   ├── 분석 기반 추천
│   ├── 성분 분석
│   └── 어필리에이트 링크
│
├── 📷 스캔 (Scan)
│   ├── 제품 바코드
│   └── 성분표 OCR
│
└── 👤 마이페이지 (Profile)
    ├── 내 정보
    ├── 분석 히스토리
    ├── 설정
    └── 법적 동의
```

### 2.2 네비게이션 구조

| 위치 | 항목 | 아이콘 |
|------|------|--------|
| 하단 탭 | 홈 | Home |
| 하단 탭 | 분석 | Scan |
| 하단 탭 | 옷장 | Shirt |
| 하단 탭 | 웰니스 | Heart |
| 하단 탭 | 마이페이지 | User |

---

## 3. 디자인 시스템

### 3.1 타이포그래피

```css
/* Font Family */
--font-sans: "Pretendard", -apple-system, system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;

/* Font Sizes (Mobile First) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 3.2 간격 시스템

```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### 3.3 Border Radius

```css
/* Radius Scale */
--radius-sm: 0.25rem;    /* 4px - 작은 요소 */
--radius-md: 0.5rem;     /* 8px - 버튼, 인풋 */
--radius-lg: 0.75rem;    /* 12px - 카드 */
--radius-xl: 1rem;       /* 16px - 모달, 큰 카드 */
--radius-2xl: 1.5rem;    /* 24px - 이미지, 특수 카드 */
--radius-full: 9999px;   /* 완전 원형 */
```

### 3.4 그림자

```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);

/* Card Shadow (브랜드 특화) */
--shadow-card: 0 2px 8px rgba(248, 200, 220, 0.15);
```

### 3.5 다중 인종 지원 (Monk Scale)

```typescript
// 10단계 Monk Skin Tone Scale
const MONK_SKIN_TONES = {
  1: { hex: '#F6EBE0', name: 'Very Light' },
  2: { hex: '#F3E7DB', name: 'Light' },
  3: { hex: '#EFE0CF', name: 'Light-Medium' },
  4: { hex: '#EADBC9', name: 'Medium-Light' },
  5: { hex: '#D7BD96', name: 'Medium' },
  6: { hex: '#A07E56', name: 'Medium-Tan' },
  7: { hex: '#825C43', name: 'Tan' },
  8: { hex: '#604134', name: 'Dark-Tan' },
  9: { hex: '#3A312A', name: 'Dark' },
  10: { hex: '#292420', name: 'Very Dark' },
};
```

---

## 4. 핵심 모듈별 스펙

### 4.1 S-1 피부 분석 UX

#### 핵심 컴포넌트

| 컴포넌트 | 상태 | 설명 |
|----------|------|------|
| `FaceZoneMap` | ✅ 구현됨 | 6존 얼굴 맵 (터치 44px+) |
| `ZoneDetailCard` | ✅ 구현됨 | 존 상세 슬라이드업 |
| `SkinVitalityScore` | ✅ 구현됨 | 피부 활력도 게이지 |
| `FixedBottomActions` | ✅ 구현됨 | 고정 하단 버튼 |
| `PhotoReuseSelector` | 🚧 Phase 2 | 사진 재사용 선택 |
| `BeforeAfterSlider` | ✅ 구현됨 | 전후 비교 슬라이더 |

#### 결과 페이지 레이아웃

```
┌─────────────────────────────────────┐
│           피부 분석 결과             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │      FaceZoneMap           │   │
│  │  (6존 터치 가능, 색상 코딩)  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  피부 활력도: 72점                  │
│  ████████████░░░░░░░░              │
├─────────────────────────────────────┤
│  💧 T존 분석  |  💧 U존 분석        │
│  유분도: 65   |  수분도: 58        │
├─────────────────────────────────────┤
│  📋 스킨케어 솔루션 탭              │
│  [클렌징] [토너] [세럼] [크림]       │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │ [다시 분석하기] [공유하기]     │ │ ← 고정
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.2 J-1 AI 스타일링

#### 핵심 기능

| 기능 | 설명 |
|------|------|
| 시즌별 팔레트 | 4계절 16타입 컬러 조합 |
| 체형별 핏 | 5-Type 체형 맞춤 스타일 |
| TPO 가이드 | 5가지 상황별 스타일링 |
| 컬러 조합 | 유사색/보색/분리보색 |

#### 스타일링 결과 UI

```
┌─────────────────────────────────────┐
│       🎨 AI 스타일링 추천           │
├─────────────────────────────────────┤
│  당신의 퍼스널컬러: 봄웜라이트       │
│  체형: 웨이브                       │
├─────────────────────────────────────┤
│  💡 오늘의 추천 코디                │
│  ┌─────────────────────────────┐   │
│  │  [코디 이미지 갤러리]         │   │
│  │  ← 스와이프 →                │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  🏷️ 추천 아이템                    │
│  [상의] [하의] [아우터] [악세서리]   │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 제품1 │ │ 제품2 │ │ 제품3 │      │
│  │ AD   │ │ AD   │ │ AD   │      │
│  └──────┘ └──────┘ └──────┘      │
└─────────────────────────────────────┘
```

### 4.3 캡슐 옷장

#### 핵심 기능

| 기능 | 설명 |
|------|------|
| 아이템 등록 | 사진 촬영 + AI 자동 분류 |
| 퍼스널컬러 태깅 | 자동 색상 추출 및 매칭 |
| 코디 생성 | AI 기반 조합 추천 |
| 착용 기록 | 날씨/기분/사진 기록 |
| 캡슐 최적화 | 33개 핵심 아이템 제안 |

#### 옷장 UI

```
┌─────────────────────────────────────┐
│             내 옷장                 │
├─────────────────────────────────────┤
│  [전체] [상의] [하의] [아우터] [+]   │
├─────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │    │ │    │ │    │ │    │     │
│  │ 🔴 │ │ 🟡 │ │ 🔵 │ │ ⚫ │     │
│  └────┘ └────┘ └────┘ └────┘     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │    │ │    │ │    │ │ +  │     │
│  │ 🟢 │ │ 🟣 │ │ ⚪ │ │추가│     │
│  └────┘ └────┘ └────┘ └────┘     │
├─────────────────────────────────────┤
│  총 32개 아이템 | 864개 코디 가능    │
│                                     │
│  [오늘의 코디 추천 받기]             │
└─────────────────────────────────────┘
```

### 4.4 어필리에이트 통합

#### AD 뱃지 필수 표시

```tsx
// 모든 어필리에이트 제품에 필수
<div className="relative">
  <Badge className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs">
    AD
  </Badge>
  <ProductCard product={product} />
</div>
```

#### 파트너별 제품 표시

| 파트너 | 카테고리 | 뱃지 색상 |
|--------|----------|----------|
| 쿠팡 | 화장품, 패션 | Gray |
| iHerb | 영양제 | Green |
| 무신사 | 패션 | Black |

### 4.5 전문 컨설팅 고도화

#### Progressive Disclosure 패턴

```
Level 1 (기본): "당신은 하트형 얼굴입니다"

Level 2 (중급): "이마(13.2cm)가 광대(13.8cm)와 비슷하고,
                턱선(11.5cm)이 좁아 하트형으로 분류됩니다"

Level 3 (전문가): "길이/너비 비율: 1.42 (하트형 기준: 1.3-1.5)
                  이마/턱선 비율: 1.15 (하트형 기준: >1.1)"
```

#### 통합 분석 허브 UI

```
┌─────────────────────────────────────┐
│         나의 분석 현황               │
│    ┌───────────────────┐           │
│    │   [원형 진행률]    │   3/4     │
│    │      75%          │   완료    │
│    └───────────────────┘           │
├─────────────────────────────────────┤
│ 🎨 퍼스널컬러  ✅ 봄웜라이트         │
│ 👤 얼굴형     ❌ 분석하기 →         │
│ 💧 피부      ✅ 복합성              │
│ 👗 체형      ✅ 웨이브              │
├─────────────────────────────────────┤
│       🔮 크로스 인사이트             │
│  "봄웜라이트 + 웨이브 조합으로        │
│   소프트하고 여성스러운 이미지가       │
│   어울려요"                         │
│                                     │
│   [통합 리포트 보기 →]               │
└─────────────────────────────────────┘
```

---

## 5. 컴포넌트 우선순위

### 5.1 Priority 1 (Core - 즉시 필요)

| 컴포넌트 | 용도 | 상태 |
|----------|------|------|
| `Button` | 기본 버튼 | ✅ shadcn |
| `Card` | 컨텐츠 카드 | ✅ shadcn |
| `Input` | 텍스트 입력 | ✅ shadcn |
| `Badge` | 레이블/태그 | ✅ shadcn |
| `Tabs` | 탭 네비게이션 | ✅ shadcn |
| `Progress` | 진행률 표시 | ✅ shadcn |
| `FixedBottomActions` | 고정 하단 버튼 | ✅ 구현됨 |

### 5.2 Priority 2 (Analysis - 분석 기능)

| 컴포넌트 | 용도 | 상태 |
|----------|------|------|
| `FaceZoneMap` | 피부 존 맵 | ✅ 구현됨 |
| `ColorPalette` | 컬러 팔레트 표시 | ✅ 구현됨 |
| `ScoreGauge` | 점수 게이지 | ✅ 구현됨 |
| `AnalysisProgress` | 분석 진행률 | 🚧 개발중 |
| `BeforeAfterSlider` | 전후 비교 | ✅ 구현됨 |

### 5.3 Priority 3 (Styling - 스타일링)

| 컴포넌트 | 용도 | 상태 |
|----------|------|------|
| `OutfitCard` | 코디 카드 | ✅ 구현됨 |
| `ProductCard` | 제품 카드 | ✅ 구현됨 |
| `ColorMatcher` | 컬러 매칭 | ✅ 구현됨 |
| `WardrobeGrid` | 옷장 그리드 | 🚧 개발중 |

### 5.4 Priority 4 (Advanced - 고급 기능)

| 컴포넌트 | 용도 | 상태 |
|----------|------|------|
| `ProgressiveDisclosure` | 단계별 정보 공개 | 📋 계획됨 |
| `FaceOverlay` | 얼굴 오버레이 | 📋 계획됨 |
| `ScientificEvidence` | 과학 근거 표시 | 📋 계획됨 |
| `MeasurementChart` | 측정 데이터 차트 | 📋 계획됨 |

---

## 6. 기술적 제약사항

### 6.1 필수 준수 사항

| 항목 | 제약 | 이유 |
|------|------|------|
| **CSS Framework** | Tailwind CSS 전용 | 기존 코드베이스 일관성 |
| **UI Library** | shadcn/ui 확장 | 커스터마이징 용이 |
| **색상 시스템** | CSS Variables | 테마 전환 지원 |
| **터치 영역** | 최소 44px | 접근성 (WCAG) |
| **반응형** | Mobile First | 주 사용자 모바일 |

### 6.2 금지 사항

| 항목 | 이유 |
|------|------|
| Glassmorphism 과다 사용 | 모바일 성능 저하 |
| 복잡한 CSS 애니메이션 | 배터리 소모 |
| 외부 CSS 프레임워크 | Tailwind와 충돌 |
| !important 남용 | 유지보수 어려움 |

### 6.3 성능 기준

| 지표 | 목표 |
|------|------|
| LCP | < 2.5초 |
| FID | < 100ms |
| CLS | < 0.1 |
| 초기 번들 | < 500KB (gzip) |

### 6.4 접근성 요구사항

- `data-testid` 속성 필수 (최상위 컨테이너)
- 색상 대비 4.5:1 이상
- 키보드 네비게이션 지원
- 스크린 리더 호환 (aria-label)

---

## 7. 성공 기준

### 7.1 UX 지표

| 지표 | 목표 |
|------|------|
| 분석 완료율 | 4개 모듈 모두 완료 60%+ |
| 통합 리포트 조회율 | 분석 완료자의 80%+ |
| 제품 클릭률 | 추천 제품 20%+ |
| 재방문율 | 7일 내 40%+ |

### 7.2 디자인 일관성

| 항목 | 기준 |
|------|------|
| 컬러 사용 | 브랜드 팔레트 95%+ |
| 컴포넌트 재사용 | shadcn/ui 기반 90%+ |
| 간격 시스템 | 4px 그리드 준수 |
| 타이포그래피 | 스케일 준수 100% |

---

## 부록: 파일 구조

```
apps/web/
├── app/
│   ├── (main)/
│   │   ├── analysis/          # 분석 모듈
│   │   │   ├── skin/          # S-1 피부
│   │   │   ├── personal-color/ # PC-1 퍼스널컬러
│   │   │   ├── body/          # C-1 체형
│   │   │   └── integrated/    # IC-1 통합 (계획)
│   │   ├── styling/           # J-1~J-3 스타일링
│   │   ├── wardrobe/          # 캡슐 옷장
│   │   └── dashboard/         # 홈
│   └── api/
│       ├── analyze/           # 분석 API
│       ├── affiliate/         # 어필리에이트 API
│       └── products/          # 제품 API
├── components/
│   ├── analysis/              # 분석 컴포넌트
│   │   ├── FaceZoneMap.tsx
│   │   ├── ZoneDetailCard.tsx
│   │   └── SkinVitalityScore.tsx
│   ├── styling/               # 스타일링 컴포넌트
│   ├── products/              # 제품 컴포넌트
│   │   ├── ProductCard.tsx
│   │   └── AdBadge.tsx
│   └── ui/                    # shadcn/ui 기본
└── lib/
    ├── analysis/              # 분석 로직
    ├── affiliate/             # 어필리에이트 로직
    └── styling/               # 스타일링 로직
```

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| [SDD-GLOBAL-DESIGN-SPECIFICATION](./SDD-GLOBAL-DESIGN-SPECIFICATION.md) | 전체 디자인 시스템 |
| [SDD-S1-UX-IMPROVEMENT](./SDD-S1-UX-IMPROVEMENT.md) | 피부 분석 UX |
| [SDD-PHASE-J-AI-STYLING](./SDD-PHASE-J-AI-STYLING.md) | AI 스타일링 |
| [SDD-CAPSULE-WARDROBE](./SDD-CAPSULE-WARDROBE.md) | 캡슐 옷장 |
| [SDD-AFFILIATE-INTEGRATION](./SDD-AFFILIATE-INTEGRATION.md) | 어필리에이트 |
| [SDD-PROFESSIONAL-ENHANCEMENT](./SDD-PROFESSIONAL-ENHANCEMENT.md) | 전문 컨설팅 |

---

**Document Version**: 1.0
**Created**: 2026-01-21
**Author**: Claude Code (Opus 4.5)
**Purpose**: Gemini UI/UX Design Implementation
