# 스킨케어 기능 고도화 기술 스펙

> **Version**: 1.0
> **Created**: 2026-01-11
> **Status**: Ready for Implementation

## 1. 개요

### 1.1 목표

피부 관리 기능을 고도화하여 사용자에게 맞춤형 스킨케어 솔루션을 제공합니다.

### 1.2 범위

| Phase           | 기능                                 | 복잡도          |
| --------------- | ------------------------------------ | --------------- |
| Phase D         | AI 피부 상담                         | 55점 (Standard) |
| 스킨케어 고도화 | 루틴 조건부 로직 + 마스크팩 + 솔루션 | 45점 (Light)    |
| Phase F 확장    | 성분 충돌 + 제품함 연동              | 50점 (Standard) |

---

## 2. 조사 결과 요약

### 2.1 성분 충돌 데이터 (피부과학 기반)

#### 절대 피해야 할 조합

| 성분 A      | 성분 B           | 이유                                  | 해결책                        |
| ----------- | ---------------- | ------------------------------------- | ----------------------------- |
| Retinol     | Vitamin C        | pH 불일치 (산성 vs 중성), 상호 무력화 | 아침 비타민C, 저녁 레티놀     |
| Retinol     | Benzoyl Peroxide | BP가 레티놀 분자 비활성화             | 아침 BP, 저녁 레티놀          |
| Retinol     | AHA/BHA          | 과도한 각질 제거, 피부 장벽 손상      | 다른 날 번갈아 사용           |
| Niacinamide | AHA/BHA          | 화학 반응으로 홍조/발적 유발          | 30분 간격 또는 아침/저녁 분리 |
| Vitamin C   | Benzoyl Peroxide | BP가 비타민C 산화시켜 무력화          | 다른 날 번갈아 사용           |

**Source**: [Women's Health](https://www.womenshealthmag.com/beauty/a69000578/skincare-ingredients-you-should-never-combine/), [Curology](https://curology.com/blog/what-skincare-products-not-to-mix-according-to-dermatology-experts/)

#### 좋은 조합

| 성분 A      | 성분 B          | 효과                                  |
| ----------- | --------------- | ------------------------------------- |
| Vitamin C   | Ferulic Acid    | 페룰산이 비타민C 안정화 + 항산화 증폭 |
| Vitamin C   | Vitamin E       | 환경 스트레스 방어 + 자외선 차단 보조 |
| Retinol     | Hyaluronic Acid | 히알루론산이 레티놀 건조함 완화       |
| Niacinamide | Hyaluronic Acid | 진정 + 보습 시너지                    |

### 2.2 K-뷰티 레이어링 순서

```
수분 기반 (가벼운 것) → 유분 기반 (무거운 것)
```

**10단계 기본 순서**:

1. 오일 클렌저
2. 수분 클렌저
3. 각질 제거제
4. 토너
5. 에센스
6. 앰플/세럼
7. 시트 마스크
8. 아이크림
9. 모이스처라이저
10. 선크림 (AM) / 슬리핑 마스크 (PM)

**Source**: [Soko Glam](https://sokoglam.com/pages/10-step-korean-skincare-routine), [Harper's Bazaar](https://www.harpersbazaar.com/beauty/skin-care/a68113096/10-step-korean-skincare-routine/)

### 2.3 마스크팩 타입별 피부 매칭

| 마스크 타입       | 추천 피부 타입          | 주요 성분                      | 사용 빈도 |
| ----------------- | ----------------------- | ------------------------------ | --------- |
| **클레이 마스크** | 지성, 복합성, 여드름성  | 카올린, 벤토나이트, 숯, 티트리 | 주 1-2회  |
| **시트 마스크**   | 건성, 민감성, 모든 피부 | 히알루론산, 세라마이드, 알로에 | 주 2-3회  |
| **슬리핑 마스크** | 건성, 민감성            | 세라마이드, 판테놀, 스쿠알렌   | 주 2-3회  |

**복합성 피부**: 멀티 마스킹 권장 (T존 클레이, 볼 시트)

**Source**: [Trophyskin](https://trophyskin.com/blogs/blog/best-face-masks-for-every-skin-type-expert-guide-2026), [Patchology](https://www.patchology.com/blogs/the-blog/different-types-of-face-masks-for-the-skin)

### 2.4 여드름 패치 효과

| 항목            | 내용                                             |
| --------------- | ------------------------------------------------ |
| **작용 원리**   | 하이드로콜로이드가 수분 환경 생성, 피지/농 흡수  |
| **효과**        | 14일 임상시험에서 크기, 붉음, 질감 유의미한 개선 |
| **적합 대상**   | 열린 여드름, 농이 있는 여드름                    |
| **부적합 대상** | 낭포성 여드름, 블랙헤드, 화이트헤드              |
| **최신 기술**   | 2025년 마이크로어레이 패치 - 3일 내 81% 감소     |

**Source**: [Cleveland Clinic](https://health.clevelandclinic.org/how-do-pimple-patches-work), [JAAD](<https://www.jaad.org/article/S0190-9622(24)02377-6/fulltext>)

### 2.5 건조 피부 토너 적용

| 항목               | 권장 사항                                |
| ------------------ | ---------------------------------------- |
| **적용 빈도**      | 아침/저녁 2회 가능                       |
| **추천 성분**      | 히알루론산, 글리세린, 세라마이드, 판테놀 |
| **피해야 할 성분** | 고농도 알코올, 강한 향료                 |
| **적용 방법**      | 화장솜 또는 손으로 패팅                  |

**Source**: [Curology](https://curology.com/blog/how-to-choose-the-best-toner-for-dry-skin-plus-a-few-of-our-favorites/)

---

## 3. 구현 명세

### 3.1 성분 충돌 감지 시스템

**파일**: `lib/scan/ingredient-conflict.ts`

```typescript
export interface IngredientConflict {
  ingredientA: string;
  ingredientB: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  solution: string;
}

export const INGREDIENT_CONFLICTS: IngredientConflict[] = [
  {
    ingredientA: 'RETINOL',
    ingredientB: 'VITAMIN C',
    severity: 'high',
    reason: 'pH 불일치로 상호 무력화',
    solution: '아침 비타민C, 저녁 레티놀 분리 사용',
  },
  {
    ingredientA: 'RETINOL',
    ingredientB: 'BENZOYL PEROXIDE',
    severity: 'high',
    reason: '벤조일퍼옥사이드가 레티놀 비활성화',
    solution: '아침 BP, 저녁 레티놀 분리 사용',
  },
  // ... 추가 충돌 데이터
];

export function detectConflicts(ingredients: string[]): IngredientConflict[];
```

### 3.2 조건부 루틴 로직

**파일**: `lib/skincare/conditional-routine.ts`

```typescript
export interface SkinCondition {
  hydration: 'dry' | 'normal' | 'oily';
  concerns: ('acne' | 'redness' | 'dullness')[];
}

export interface ConditionalStep {
  baseStep: RoutineStep;
  condition: string; // 예: "피부가 건조할 때"
  modification: {
    repeatCount?: number; // 토너 2회
    additionalProduct?: string;
    skipStep?: boolean;
  };
}

export function generateConditionalRoutine(
  baseRoutine: SkincareRoutine,
  condition: SkinCondition
): SkincareRoutine;
```

### 3.3 마스크팩 추천 시스템

**파일**: `lib/skincare/mask-recommendation.ts`

```typescript
export type MaskType = 'sheet' | 'clay' | 'sleeping' | 'peel';

export interface MaskRecommendation {
  type: MaskType;
  frequency: string; // "주 2-3회"
  timing: 'morning' | 'evening' | 'both';
  ingredients: string[];
  skinTypes: SkinType[];
  concerns: string[];
}

export function recommendMask(
  skinType: SkinType,
  concerns: string[],
  currentCondition: SkinCondition
): MaskRecommendation;
```

### 3.4 맞춤 솔루션 시스템

**파일**: `lib/skincare/targeted-solutions.ts`

```typescript
export type SolutionType = 'acne_patch' | 'spot_treatment' | 'soothing_cream' | 'intensive_serum';

export interface TargetedSolution {
  type: SolutionType;
  concern: string;
  usage: string;
  ingredients: string[];
  effectiveness: string;
  limitations: string[];
}

export const TARGETED_SOLUTIONS: Record<string, TargetedSolution> = {
  acne_patch: {
    type: 'acne_patch',
    concern: 'acne',
    usage: '열린 여드름에 부착, 6-8시간 유지',
    ingredients: ['hydrocolloid'],
    effectiveness: '14일 내 크기/붉음 유의미한 감소',
    limitations: ['낭포성 여드름에는 효과 제한적'],
  },
  // ...
};
```

### 3.5 제품함-루틴 연동

**파일**: `lib/skincare/shelf-routine-sync.ts`

```typescript
export interface ShelfRoutineSync {
  shelfItems: ShelfItem[];
  generatedRoutine: SkincareRoutine;
  conflicts: IngredientConflict[];
  missingSteps: RoutineStep[];
}

export function generateRoutineFromShelf(
  shelfItems: ShelfItem[],
  skinType: SkinType,
  timeOfDay: 'morning' | 'evening'
): ShelfRoutineSync;

export function sortByLayeringOrder(products: ShelfItem[]): ShelfItem[];
```

---

## 4. UI 컴포넌트

### 4.1 피부 상태 입력

**파일**: `components/skin/routine/SkinConditionInput.tsx`

```tsx
interface SkinConditionInputProps {
  onConditionChange: (condition: SkinCondition) => void;
}

// 슬라이더 또는 버튼으로 오늘 피부 상태 입력
// - 수분감: 건조 / 보통 / 촉촉
// - 유분감: 건조 / 보통 / 번들거림
// - 특별 고민: 여드름 / 홍조 / 칙칙함 (다중 선택)
```

### 4.2 성분 충돌 경고

**파일**: `components/scan/IngredientConflictAlert.tsx`

```tsx
interface IngredientConflictAlertProps {
  conflicts: IngredientConflict[];
  onDismiss: () => void;
}

// 충돌 발견 시 경고 표시
// - 심각도별 색상 (high: 빨강, medium: 노랑)
// - 해결책 제안
```

### 4.3 조건부 루틴 뱃지

**파일**: `components/skin/routine/ConditionalBadge.tsx`

```tsx
// 조건부 단계에 뱃지 표시
// 예: "건조할 때 2회" 뱃지
```

---

## 5. 데이터베이스

### 5.1 신규 테이블 불필요

기존 테이블 활용:

- `user_product_shelf` - 제품함
- `skin_analyses` - 피부 분석 결과
- `skincare_routines` - 루틴 (필요시 추가)

### 5.2 JSONB 필드 확장

```sql
-- user_product_shelf.analysis_result 확장
{
  "conflicts": [
    {
      "ingredientA": "RETINOL",
      "ingredientB": "VITAMIN C",
      "severity": "high"
    }
  ]
}
```

---

## 6. 구현 순서

### Phase 1: 성분 충돌 감지 (1일)

1. `lib/scan/ingredient-conflict.ts` 생성
2. 충돌 데이터 구축 (5개 high, 5개 medium)
3. `IngredientConflictAlert` 컴포넌트
4. 제품함 상세 페이지에 경고 표시

### Phase 2: 조건부 루틴 (1일)

1. `lib/skincare/conditional-routine.ts` 생성
2. `SkinConditionInput` 컴포넌트
3. `ConditionalBadge` 컴포넌트
4. 루틴 페이지 UI 수정

### Phase 3: 마스크팩 + 솔루션 (1일)

1. `lib/skincare/mask-recommendation.ts` 생성
2. `lib/skincare/targeted-solutions.ts` 생성
3. 루틴 페이지에 추천 섹션 추가

### Phase 4: 제품함-루틴 연동 (1일)

1. `lib/skincare/shelf-routine-sync.ts` 생성
2. 보유 제품 기반 루틴 자동 생성
3. 레이어링 순서 정렬

### Phase 5: Phase D AI 상담 (1일)

1. 기존 플랜 파일 기반 구현
2. skin-rag.ts, SkinConsultantCTA.tsx

---

## 7. 시지푸스/병렬 작업 검토

### 7.1 복잡도 분석

| 작업            | 파일 수 | DB 변경 | 외부 API | 총점 | 트랙     |
| --------------- | ------- | ------- | -------- | ---- | -------- |
| 성분 충돌       | 3       | X       | X        | 30   | Quick    |
| 조건부 루틴     | 4       | X       | X        | 35   | Light    |
| 마스크팩/솔루션 | 3       | X       | X        | 25   | Quick    |
| 제품함 연동     | 3       | X       | X        | 35   | Light    |
| Phase D AI      | 6       | X       | X        | 55   | Standard |

### 7.2 권장 전략

| 작업            | 시지푸스 | 이유                           |
| --------------- | -------- | ------------------------------ |
| 성분 충돌       | X        | 단순 데이터 + UI (Quick)       |
| 조건부 루틴     | X        | 로직 간단 (Light)              |
| 마스크팩/솔루션 | X        | 데이터 중심 (Quick)            |
| 제품함 연동     | X        | 기존 패턴 반복 (Light)         |
| **Phase D AI**  | **O**    | RAG + 컨텍스트 확장 (Standard) |

### 7.3 병렬 작업 가능 여부

```
병렬 그룹 A (독립적):
├── 성분 충돌 감지
└── 마스크팩/솔루션 추천

병렬 그룹 B (A 완료 후):
├── 조건부 루틴
└── 제품함-루틴 연동

순차 실행:
└── Phase D AI 상담 (기존 코치 확장)
```

---

## 8. 테스트 계획

### 8.1 단위 테스트

```bash
# 각 모듈별 테스트
npm run test -- ingredient-conflict
npm run test -- conditional-routine
npm run test -- mask-recommendation
npm run test -- targeted-solutions
npm run test -- shelf-routine-sync
```

### 8.2 통합 테스트

- 제품 스캔 → 성분 분석 → 충돌 경고 → 루틴 반영
- 피부 상태 입력 → 조건부 루틴 생성 → UI 표시

---

## 9. 참고 자료

- [Women's Health - Skincare Ingredient Combos to Avoid](https://www.womenshealthmag.com/beauty/a69000578/skincare-ingredients-you-should-never-combine/)
- [Curology - What Skincare Products Not to Mix](https://curology.com/blog/what-skincare-products-not-to-mix-according-to-dermatology-experts/)
- [Soko Glam - 10-Step Korean Skincare](https://sokoglam.com/pages/10-step-korean-skincare-routine)
- [Cleveland Clinic - How Do Pimple Patches Work](https://health.clevelandclinic.org/how-do-pimple-patches-work)
- [Trophyskin - Best Face Masks Guide](https://trophyskin.com/blogs/blog/best-face-masks-for-every-skin-type-expert-guide-2026)

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                            |
| ---- | ---------- | ------------------------------------ |
| 1.0  | 2026-01-11 | 초기 버전 - 조사 결과 기반 스펙 작성 |
