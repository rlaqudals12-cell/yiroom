# 피부 Phase B: 스킨케어 루틴 제안

> 아침/저녁 스킨케어 루틴 및 제품 순서 추천 기능

## 1. 개요

### 1.1 목적

피부 분석 결과를 기반으로 개인화된 스킨케어 루틴을 제안하여 사용자가 "다음에 뭘 해야 하지?"를 해결

### 1.2 범위

- 아침/저녁 루틴 생성
- 제품 카테고리별 순서 안내
- 사용자 피부 타입/고민에 맞춘 추천
- 어필리에이트 제품 연동

---

## 2. 기능 요구사항

### 2.1 루틴 생성 로직

```typescript
interface SkincareRoutine {
  id: string;
  userId: string;
  timeOfDay: 'morning' | 'evening';
  steps: RoutineStep[];
  skinType: SkinType;
  concerns: SkinConcern[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoutineStep {
  order: number;
  category: ProductCategory;
  name: string; // "클렌저", "토너" 등
  purpose: string; // "노폐물 제거", "수분 공급" 등
  duration?: string; // "1분", "30초" 등
  tips: string[]; // 사용 팁
  recommendedProducts?: AffiliateProduct[];
  isOptional: boolean;
}

type ProductCategory =
  | 'cleanser' // 클렌저
  | 'toner' // 토너
  | 'essence' // 에센스
  | 'serum' // 세럼
  | 'ampoule' // 앰플
  | 'cream' // 크림
  | 'sunscreen' // 선크림 (아침)
  | 'mask' // 마스크팩 (저녁, 주 2-3회)
  | 'eye_cream' // 아이크림
  | 'oil' // 페이스 오일
  | 'spot_treatment'; // 스팟 케어
```

### 2.2 기본 루틴 템플릿

**아침 루틴 (Morning)**

1. 클렌저 (수분/젤)
2. 토너
3. 에센스/세럼
4. 아이크림
5. 크림/로션
6. 선크림 (필수)

**저녁 루틴 (Evening)**

1. 클렌징 오일/밤 (메이크업 시)
2. 클렌저 (폼/젤)
3. 토너
4. 에센스
5. 세럼/앰플
6. 아이크림
7. 크림
8. 스팟 케어 (필요시)

### 2.3 피부 타입별 커스터마이징

| 피부 타입 | 추가 권장         | 제외/주의   |
| --------- | ----------------- | ----------- |
| 건성      | 오일, 리치 크림   | 알코올 토너 |
| 지성      | 가벼운 로션, BHA  | 무거운 오일 |
| 복합성    | T존/U존 분리 케어 | -           |
| 민감성    | 진정 에센스       | 자극 성분   |

---

## 3. UI/UX 설계

### 3.1 페이지 구조

```
app/(main)/analysis/skin/routine/
├── page.tsx              # 루틴 메인 (아침/저녁 탭)
├── [timeOfDay]/
│   └── page.tsx          # 상세 루틴 (단계별)
├── customize/
│   └── page.tsx          # 루틴 커스터마이징
└── history/
    └── page.tsx          # 루틴 이력
```

### 3.2 컴포넌트

```
components/skin/routine/
├── RoutineCard.tsx           # 루틴 요약 카드
├── RoutineStepList.tsx       # 단계 목록
├── RoutineStepItem.tsx       # 개별 단계
├── RoutineTimeline.tsx       # 타임라인 뷰
├── ProductRecommendation.tsx # 추천 제품 (어필리에이트)
├── RoutineToggle.tsx         # 아침/저녁 토글
└── index.ts
```

### 3.3 와이어프레임

```
┌─────────────────────────────┐
│  오늘의 스킨케어 루틴       │
├─────────────────────────────┤
│  [아침] [저녁]  ← 토글      │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ 1. 클렌저           │    │
│  │    수분 젤 클렌저   │    │
│  │    💡 미온수로 1분  │    │
│  │    [추천 제품 보기] │    │
│  └─────────────────────┘    │
│           ↓                 │
│  ┌─────────────────────┐    │
│  │ 2. 토너             │    │
│  │    ...              │    │
│  └─────────────────────┘    │
│           ...               │
├─────────────────────────────┤
│  [루틴 커스터마이징]        │
└─────────────────────────────┘
```

---

## 4. 데이터 모델

### 4.1 DB 테이블 (선택적)

```sql
-- 사용자 루틴 저장 (커스터마이징 시)
CREATE TABLE user_skincare_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'evening')),
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_skincare_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routines"
  ON user_skincare_routines FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 4.2 Mock 데이터

```typescript
// lib/mock/skincare-routine.ts
export const MORNING_ROUTINE_STEPS: RoutineStep[] = [
  {
    order: 1,
    category: 'cleanser',
    name: '클렌저',
    purpose: '밤사이 분비된 피지와 노폐물 제거',
    duration: '1분',
    tips: ['미온수 사용', '거품 충분히 내기'],
    isOptional: false,
  },
  // ...
];

export const EVENING_ROUTINE_STEPS: RoutineStep[] = [...];

export const SKIN_TYPE_MODIFIERS: Record<SkinType, RoutineModifier> = {...};
```

---

## 5. 구현 계획

### 5.1 파일 생성 목록

| 파일                                        | 설명              |
| ------------------------------------------- | ----------------- |
| `types/skincare-routine.ts`                 | 타입 정의         |
| `lib/mock/skincare-routine.ts`              | Mock 데이터       |
| `lib/skincare/routine.ts`                   | 루틴 생성 로직    |
| `components/skin/routine/*.tsx`             | UI 컴포넌트 (6개) |
| `app/(main)/analysis/skin/routine/page.tsx` | 메인 페이지       |
| `tests/components/skin/routine/*.test.tsx`  | 테스트            |

### 5.2 예상 파일 수

- 신규 파일: 12-15개
- 수정 파일: 2-3개 (라우팅, 네비게이션)

---

## 6. 테스트 계획

- [ ] RoutineCard 렌더링 테스트
- [ ] RoutineStepList 단계 순서 테스트
- [ ] 피부 타입별 루틴 커스터마이징 테스트
- [ ] 아침/저녁 토글 테스트
- [ ] 어필리에이트 제품 연동 테스트

---

## 7. 어필리에이트 연동

각 단계에서 `getRecommendedProductsBySkin()` 호출하여 추천 제품 표시

```typescript
const products = await getRecommendedProductsBySkin(skinAnalysisId, {
  category: step.category,
  limit: 3,
});
```

---

**작성일**: 2026-01-10
**작성자**: Claude Code
