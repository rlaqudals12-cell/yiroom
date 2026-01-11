# Phase J: AI 스타일링 스펙

> **Status**: Draft
> **Created**: 2026-01-11
> **Author**: Claude Code
> **Phase**: J (AI 스타일링)

---

## 1. 개요

### 1.1 목적

퍼스널 컬러(PC-1) 분석 결과를 기반으로 AI 스타일링/코디 추천 기능을 제공하여 사용자의 실질적인 스타일링 의사결정을 돕는다.

### 1.2 배경

- 연예인 매칭 기능 제외 (저작권/초상권 이슈)
- 경쟁사(Stylebot, 트위닛) 대비 통합 웰니스 연동 차별화 필요
- PC-1 → W-1 → 제품 추천 크로스 모듈 연동 강화

### 1.3 범위

| 우선순위 | 기능            | 적용 모듈  | Phase J 범위 |
| -------- | --------------- | ---------- | ------------ |
| P1       | 색상 조합 추천  | PC-1, 제품 | ✅ 포함      |
| P1       | 운동복 스타일링 | W-1        | ✅ 포함      |
| P2       | 악세서리 추천   | PC-1       | 🔄 확장      |
| P2       | 메이크업 조합   | PC-1, S-1  | 🔄 확장      |
| P3       | 전체 코디 생성  | 통합       | 📋 향후      |

---

## 2. 요구사항

### 2.1 기능 요구사항 (P1)

| ID   | 요구사항                          | 우선순위 |
| ---- | --------------------------------- | -------- |
| F-01 | 시즌별 색상 조합 추천 (상의+하의) | Must     |
| F-02 | 색상 팔레트 기반 코디 시각화      | Must     |
| F-03 | 운동복 색상 추천 (PC-1 연동)      | Must     |
| F-04 | 제품 추천 연동 (어필리에이트)     | Should   |
| F-05 | 코디 저장/공유 기능               | Could    |

### 2.2 비기능 요구사항

| ID    | 요구사항         | 기준                |
| ----- | ---------------- | ------------------- |
| NF-01 | 추천 응답 시간   | 1초 이내 (캐시)     |
| NF-02 | Mock Fallback    | AI 실패 시 100%     |
| NF-03 | 접근성           | data-testid 필수    |
| NF-04 | 반응형           | 모바일 우선         |
| NF-05 | 크로스 모듈 연동 | PC-1 필수, W-1 선택 |

---

## 3. 아키텍처

### 3.1 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                   AI 스타일링 시스템                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   PC-1 결과 ────┬──────────────────────────────────────>│
│   (시즌타입)    │                                       │
│                 ▼                                       │
│            ┌─────────┐                                  │
│            │  색상   │                                  │
│            │ 조합기  │                                  │
│            └────┬────┘                                  │
│                 │                                       │
│    ┌────────────┼────────────┐                          │
│    ▼            ▼            ▼                          │
│ [일상 코디] [운동복 코디] [악세서리]                      │
│                                                         │
│    │            │            │                          │
│    └────────────┴────────────┘                          │
│                 ▼                                       │
│         제품 추천 연동 (Phase I 어필리에이트)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 컴포넌트 구조

```
components/styling/
├── ColorCombination/
│   ├── index.tsx              # 메인 색상 조합 컴포넌트
│   ├── OutfitCard.tsx         # 코디 카드 (상의+하의)
│   ├── ColorPalette.tsx       # 색상 팔레트 표시
│   └── SeasonalGuide.tsx      # 시즌별 스타일 가이드
├── WorkoutStyling/
│   ├── index.tsx              # 운동복 스타일링
│   ├── GymOutfit.tsx          # 헬스장 코디
│   └── OutdoorOutfit.tsx      # 야외 운동 코디
└── common/
    ├── ColorSwatch.tsx        # 색상 스와치
    └── OutfitPreview.tsx      # 코디 미리보기
```

### 3.3 데이터 흐름

```typescript
// 1. PC-1 결과에서 시즌 타입 가져오기
const { seasonType, tone } = usePersonalColorResult();

// 2. 시즌별 색상 조합 생성
const combinations = generateColorCombinations(seasonType);

// 3. 코디 추천 렌더링
<ColorCombination
  seasonType={seasonType}
  combinations={combinations}
  onProductClick={handleAffiliateClick}
/>
```

---

## 4. UI 설계

### 4.1 색상 조합 추천 카드

```
┌─────────────────────────────────────────┐
│  🎨 봄 웜톤 추천 코디                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐               │
│  │ [상의]  │  │ [하의]  │               │
│  │ 코랄    │  │ 베이지  │               │
│  │ 핑크    │  │         │               │
│  └─────────┘  └─────────┘               │
│                                         │
│  색상 조합: 코랄 핑크 + 웜 베이지        │
│  스타일: 캐주얼 데일리                   │
│                                         │
│  [제품 보기]  [코디 저장]                │
└─────────────────────────────────────────┘
```

### 4.2 운동복 스타일링

```
┌─────────────────────────────────────────┐
│  🏋️ 운동복 추천                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │    [운동복 세트 미리보기]        │    │
│  │                                 │    │
│  │    상의: 피치 핑크              │    │
│  │    하의: 웜 그레이              │    │
│  │    신발: 코랄 악센트            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  💡 봄 웜톤에 어울리는 운동복 조합       │
│                                         │
│  [무신사 보기]  [쿠팡 보기]              │
└─────────────────────────────────────────┘
```

### 4.3 색상 팔레트 조합 시각화

```
┌─────────────────────────────────────────┐
│  조합 1: 코랄 + 베이지                  │
│  ┌────┬────┬────┐                       │
│  │    │    │    │  ← 그라디언트 효과    │
│  └────┴────┴────┘                       │
│  "따뜻하고 부드러운 인상"               │
├─────────────────────────────────────────┤
│  조합 2: 피치 + 아이보리                │
│  ┌────┬────┬────┐                       │
│  │    │    │    │                       │
│  └────┴────┴────┘                       │
│  "화사하고 생기있는 분위기"             │
└─────────────────────────────────────────┘
```

---

## 5. 데이터 모델

### 5.1 색상 조합 타입

```typescript
// types/styling.ts
export interface ColorCombination {
  id: string;
  name: string; // "코랄 + 베이지"
  description: string; // "따뜻하고 부드러운 인상"
  colors: {
    top: ColorInfo; // 상의 색상
    bottom: ColorInfo; // 하의 색상
    accent?: ColorInfo; // 악센트 색상 (선택)
  };
  style: 'casual' | 'formal' | 'sporty' | 'elegant';
  occasion: string[]; // ["데일리", "출근", "데이트"]
  seasonTypes: SeasonType[]; // 적용 시즌
}

export interface OutfitRecommendation {
  combination: ColorCombination;
  products?: AffiliateProduct[]; // 연동 제품 (Phase I)
  tips: string; // 스타일링 팁
}
```

### 5.2 시즌별 색상 조합 Mock 데이터

```typescript
// lib/mock/styling.ts
export const COLOR_COMBINATIONS: Record<SeasonType, ColorCombination[]> = {
  spring: [
    {
      id: 'spring-1',
      name: '코랄 + 베이지',
      description: '따뜻하고 부드러운 인상',
      colors: {
        top: { name: '코랄 핑크', hex: '#FF7F7F' },
        bottom: { name: '웜 베이지', hex: '#F5DEB3' },
      },
      style: 'casual',
      occasion: ['데일리', '쇼핑'],
      seasonTypes: ['spring'],
    },
    // ... 더 많은 조합
  ],
  summer: [...],
  autumn: [...],
  winter: [...],
};

export const WORKOUT_COMBINATIONS: Record<SeasonType, ColorCombination[]> = {
  spring: [
    {
      id: 'spring-workout-1',
      name: '피치 + 그레이',
      description: '활동적이면서 화사한 느낌',
      colors: {
        top: { name: '피치 핑크', hex: '#FFDAB9' },
        bottom: { name: '웜 그레이', hex: '#A0A0A0' },
      },
      style: 'sporty',
      occasion: ['헬스장', '필라테스'],
      seasonTypes: ['spring'],
    },
  ],
  // ...
};
```

---

## 6. 구현 계획

### 6.1 파일 생성 목록

| 파일                                                 | 유형 | 설명            |
| ---------------------------------------------------- | ---- | --------------- |
| `components/styling/ColorCombination/index.tsx`      | 신규 | 메인 컴포넌트   |
| `components/styling/ColorCombination/OutfitCard.tsx` | 신규 | 코디 카드       |
| `components/styling/WorkoutStyling/index.tsx`        | 신규 | 운동복 스타일링 |
| `lib/mock/styling.ts`                                | 신규 | Mock 데이터     |
| `types/styling.ts`                                   | 신규 | 타입 정의       |
| `app/(main)/styling/page.tsx`                        | 신규 | 스타일링 페이지 |
| `tests/components/styling/*.test.tsx`                | 신규 | 테스트          |

### 6.2 기존 파일 수정

| 파일                                  | 변경 내용                 |
| ------------------------------------- | ------------------------- |
| `result/[id]/page.tsx` (PC-1)         | 스타일링 페이지 링크 추가 |
| `components/workout/result/index.tsx` | 운동복 추천 섹션 추가     |

### 6.3 구현 순서

```
Step 1: 타입 및 Mock 데이터 정의
Step 2: ColorCombination 컴포넌트 구현
Step 3: OutfitCard, ColorPalette 서브 컴포넌트
Step 4: 스타일링 페이지 생성
Step 5: PC-1 결과 페이지에서 연동
Step 6: 운동복 스타일링 컴포넌트
Step 7: 제품 추천 연동 (어필리에이트)
Step 8: 테스트 작성
```

### 6.4 예상 작업량

| 항목                      | 예상 코드량 |
| ------------------------- | ----------- |
| 타입 정의                 | ~50줄       |
| Mock 데이터               | ~150줄      |
| ColorCombination 컴포넌트 | ~200줄      |
| WorkoutStyling 컴포넌트   | ~150줄      |
| 스타일링 페이지           | ~100줄      |
| 테스트                    | ~150줄      |
| **총합**                  | ~800줄      |

---

## 7. 테스트 계획

### 7.1 단위 테스트

```typescript
describe('ColorCombination', () => {
  it('renders combinations for spring season', () => {});
  it('renders combinations for summer season', () => {});
  it('shows correct color swatches', () => {});
  it('displays style description', () => {});
});

describe('OutfitCard', () => {
  it('renders top and bottom colors', () => {});
  it('shows product link when available', () => {});
  it('handles save action', () => {});
});

describe('WorkoutStyling', () => {
  it('shows gym outfit recommendations', () => {});
  it('links to affiliate products', () => {});
});
```

### 7.2 통합 테스트

```typescript
describe('Styling Page', () => {
  it('loads combinations based on PC-1 result', () => {});
  it('navigates to product page on click', () => {});
  it('saves outfit to user collection', () => {});
});
```

---

## 8. 리스크 및 대응

| 리스크             | 가능성 | 영향 | 대응                      |
| ------------------ | ------ | ---- | ------------------------- |
| PC-1 결과 없음     | 중     | 중   | 시즌 선택 UI 제공         |
| 색상 조합 부족     | 저     | 중   | Mock 데이터 확장          |
| 제품 연동 실패     | 중     | 저   | 제품 없이 조합만 표시     |
| 성능 이슈 (이미지) | 저     | 저   | 색상 스와치만 사용 (경량) |

---

## 9. 경쟁사 대비 차별화

| 기능                   | Stylebot | 트위닛 | 이룸 Phase J |
| ---------------------- | -------- | ------ | ------------ |
| 색상 조합 추천         | ✅       | △      | ✅           |
| PC 기반 추천           | ✗        | ✅     | ✅           |
| 운동복 스타일링        | ✗        | ✗      | ✅ **유일**  |
| 제품 어필리에이트 연동 | △        | ✗      | ✅           |
| 크로스 모듈 연동       | ✗        | ✗      | ✅ **유일**  |
| 통합 웰니스            | ✗        | ✗      | ✅ **유일**  |

---

## 10. 변경 이력

| 버전 | 날짜       | 변경 내용 |
| ---- | ---------- | --------- |
| 0.1  | 2026-01-11 | 초안 작성 |

---

**Status**: Ready for Review
