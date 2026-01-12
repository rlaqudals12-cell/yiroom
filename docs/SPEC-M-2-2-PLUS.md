# SPEC-M-2-2+: 레시피 변형 시스템

> **작성일**: 2026-01-12
> **상태**: ✅ 완료
> **담당**: M-2-2+ 다이어트 대체 재료 시스템

## 개요

일반 레시피를 사용자의 영양 목표(다이어트/린매스/벌크업)에 맞게 자동으로 변형하는 시스템입니다.

## 핵심 기능

### 1. 대체 재료 매핑

**파일**: `apps/web/lib/nutrition/ingredient-substitutes.ts`

한국 가정식 위주의 대체 재료 데이터베이스:

- **당류**: 설탕 → 알룰로스/스테비아/에리스리톨
- **밀가루**: 밀가루 → 아몬드가루/코코넛가루/귀리가루
- **탄수화물**: 밥 → 곤약밥/콜리플라워 라이스
- **면류**: 파스타 → 곤약면/통밀 파스타
- **유제품**: 생크림 → 그릭요거트/두유 크림
- **오일**: 식용유 → 올리브오일/아보카도오일/스프레이 오일
- **소스**: 마요네즈 → 그릭요거트
- **육류**: 돼지고기 → 닭가슴살/두부

### 2. 레시피 변형 생성

**함수**: `generateRecipeVariations(recipe, goal?)`

레시피의 재료를 분석하여 목표에 맞는 변형 생성:

- 대체 재료 매핑
- 영양 성분 변화 계산 (칼로리, 단백질, 탄수화물)
- 조리 팁 제공

### 3. API 엔드포인트

**경로**: `GET /api/recipes/[id]/variations`

```typescript
// 모든 변형 조회
GET /api/recipes/recipe-1/variations

// 특정 목표 변형만 조회
GET /api/recipes/recipe-1/variations?goal=diet
```

**응답**:

```json
{
  "success": true,
  "data": {
    "recipeId": "recipe-1",
    "recipeName": "찜닭",
    "variations": [
      {
        "type": "diet",
        "name": "다이어트 찜닭",
        "description": "칼로리를 줄인 다이어트 버전의 찜닭입니다.",
        "substitutions": [
          {
            "original": "설탕",
            "substitute": "알룰로스",
            "benefit": "칼로리 95% 감소"
          }
        ],
        "nutritionChange": {
          "caloriesReduction": 35,
          "proteinChange": 0,
          "carbsChange": 20
        },
        "tips": []
      }
    ]
  }
}
```

### 4. UI 컴포넌트

**파일**: `components/nutrition/RecipeVariationCard.tsx`

레시피 변형 정보를 표시하는 카드 컴포넌트:

- 목표 배지 (DIET/LEAN/BULK)
- 원본 vs 변형 영양 성분 비교
- 대체 재료 목록
- 조리 팁

## 실전 예시

### 찜닭 레시피 → 다이어트 변형

**원본**: 650kcal / 45g 단백질 / 55g 탄수화물

**변형**:

- 설탕 → 알룰로스 (칼로리 95% 감소)
- 물엿 → 올리고당 (혈당 지수 낮음)
- 감자 제거 (탄수화물 감소)

**결과**: 420kcal (35% 감소)

### 계란 볶음밥 → 다이어트 변형

**원본**: 450kcal

**변형**:

- 밥 → 곤약밥 (칼로리 85% 감소)
- 식용유 → 스프레이 오일 (칼로리 70% 감소)

**결과**: 180kcal (60% 감소)

## 타입 정의

```typescript
// 영양 목표
type VariationGoal = 'diet' | 'lean' | 'bulk' | 'allergen_free';

// 대체 재료 정보
interface SubstituteInfo {
  name: string;
  ratio: number; // 대체 비율 (1.0 = 동량)
  benefit: string;
  goal: VariationGoal;
  tips?: string;
}

// 레시피 변형
interface RecipeVariation {
  type: VariationGoal;
  name: string;
  description: string;
  substitutions: {
    original: string;
    substitute: string;
    benefit: string;
  }[];
  nutritionChange: {
    caloriesReduction: number; // 퍼센트
    proteinChange: number;
    carbsChange: number;
  };
  tips: string[];
}
```

## 테스트

**총 29개 테스트 (모두 통과 ✓)**

1. **ingredient-substitutes.test.ts** (15 tests)
   - 대체 재료 매핑 정의 확인
   - 레시피 변형 생성
   - 찜닭/볶음밥/파스타 변형 시나리오

2. **route.test.ts** (5 tests)
   - API 엔드포인트 테스트
   - 목표별 필터링
   - 에러 처리

3. **RecipeVariationCard.test.tsx** (9 tests)
   - 컴포넌트 렌더링
   - 대체 재료 표시
   - 영양 성분 변화 표시

## 파일 구조

```
apps/web/
├── lib/nutrition/
│   └── ingredient-substitutes.ts          # 대체 재료 매핑, 변형 생성 로직
├── app/api/recipes/[id]/variations/
│   └── route.ts                            # API 엔드포인트
├── components/nutrition/
│   └── RecipeVariationCard.tsx             # UI 컴포넌트
└── tests/
    ├── lib/nutrition/
    │   └── ingredient-substitutes.test.ts  # 로직 테스트
    ├── api/recipes/[id]/variations/
    │   └── route.test.ts                   # API 테스트
    └── components/nutrition/
        └── RecipeVariationCard.test.tsx    # 컴포넌트 테스트
```

## 향후 확장

1. **더 많은 대체 재료 추가**
   - 한식 양념 (된장, 쌈장 등)
   - 채소류 대체
   - 해산물 대체

2. **알레르기 프리 변형**
   - 유제품 프리
   - 글루텐 프리
   - 견과류 프리

3. **사용자 피드백**
   - 대체 재료 선호도 학습
   - 맛 평가 수집

4. **영양 성분 정밀 계산**
   - 실제 영양 데이터베이스 연동
   - 재료별 정확한 칼로리 계산

## 참고

- CLAUDE.md - 프로젝트 개발 원칙
- docs/DATABASE-SCHEMA.md - 데이터베이스 구조
- lib/nutrition/recipe-matcher.ts - 기존 레시피 매칭 시스템
