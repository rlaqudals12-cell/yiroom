# SDD: 통합 사용자 선호/기피 시스템 (User Preferences)

> **Version**: 1.1
> **Status**: Draft
> **Created**: 2026-01-05
> **Updated**: 2026-01-05
> **Author**: Claude Code

## 1. 개요

### 1.1 목적

사용자의 **선호(Favorites)**와 **기피(Avoids)** 항목을 도메인별로 통합 관리하여 개인화된 추천의 정확도를 높이는 시스템.

### 1.2 설계 원칙

1. **다국어 친화적**: 의료 용어 대신 일상 표현 사용 (i18n 지원)
2. **문화 중립적**: 영미권/아시아권 모두 이해 가능한 개념
3. **도메인 통합**: 영양/운동/뷰티/컬러 모든 도메인에서 재사용

### 1.3 현재 상태 분석

| 도메인               | 선호(좋아함)   | 기피(싫어함)                      | 현재 구현 상태 |
| -------------------- | -------------- | --------------------------------- | -------------- |
| **Beauty (성분)**    | `FavoriteItem` | `FavoriteItem (isFavorite=false)` | ✅ 완료        |
| **Style (소재)**     | `FavoriteItem` | `FavoriteItem (isFavorite=false)` | ✅ 완료        |
| **Nutrition (음식)** | `FavoriteFood` | `allergies[]`, `dislikedFoods[]`  | ⚠️ 분리됨      |
| **Workout (운동)**   | ❌ 없음        | `injuries[]` (신체 제약)          | ⚠️ 부분 구현   |
| **Personal Color**   | ❌ 없음        | ❌ 없음                           | ❌ 미구현      |

### 1.3 참고 자료

- [FDA Major Food Allergens](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies) - 9대 주요 알레르겐
- [Common Dietary Restrictions](https://www.healthline.com/nutrition/most-common-dietary-restrictions) - 식이 제한 유형
- [Exercise Restrictions for Injuries](https://www.campbellclinic.com/active-knee-injury/) - 부상별 운동 제한

---

## 2. 설계

### 2.1 통합 타입 정의

```typescript
// types/preferences.ts

/**
 * 선호/기피 도메인
 */
export type PreferenceDomain =
  | 'beauty' // 화장품 성분
  | 'style' // 패션 소재/스타일
  | 'nutrition' // 음식/영양
  | 'workout' // 운동/장비
  | 'color'; // 퍼스널 컬러

/**
 * 도메인별 아이템 타입
 */
export type PreferenceItemType =
  // Beauty (기존)
  | 'ingredient' // 화장품 성분
  // Style (기존)
  | 'material' // 소재 (면, 린넨, 실크)
  | 'fashion_style' // 스타일 (캐주얼, 미니멀)
  | 'fit' // 핏 (오버핏, 슬림핏)
  // Nutrition (신규)
  | 'food' // 음식/재료
  | 'food_category' // 음식 카테고리 (해산물, 육류)
  | 'allergen' // 알레르겐 (FDA 9대)
  | 'diet_restriction' // 식이 제한 (채식, 할랄)
  | 'nutrient' // 영양소 (단백질, 탄수화물)
  // Workout (신규)
  | 'exercise' // 개별 운동
  | 'exercise_style' // 운동 스타일 (웨이트, 유산소)
  | 'equipment' // 운동 장비
  | 'body_part' // 운동 부위 (하체, 상체)
  // Color (신규)
  | 'color' // 개별 색상
  | 'color_tone' // 색조 (웜톤, 쿨톤)
  | 'pattern'; // 패턴 (체크, 스트라이프)

/**
 * 기피 수준 (문화권 중립적 - i18n 친화적)
 * 의료 용어(mild/moderate/severe) 대신 일상 표현 사용
 */
export type AvoidLevel =
  | 'dislike' // 비선호: 먹을 수/할 수 있지만 싫어함
  | 'avoid' // 회피: 가능하면 피하고 싶음 (경미한 반응)
  | 'cannot' // 불가: 하면 안 됨 (불내증/알레르기)
  | 'danger'; // 위험: 생명 위협 (아나필락시스/심각한 부상)

/**
 * 기피 이유 카테고리
 */
export type AvoidReason =
  // cannot, danger 레벨
  | 'allergy' // 알레르기 (면역 반응)
  | 'intolerance' // 불내증 (소화 문제)
  | 'medical' // 의료적 제한
  | 'injury' // 부상/통증
  // avoid 레벨
  | 'religious' // 종교적 이유 (할랄, 코셔)
  | 'ethical' // 윤리적 이유 (비건)
  | 'health' // 건강 관리 (저염, 저당)
  | 'physical_limitation' // 신체적 제약
  | 'skin_reaction' // 피부 반응
  // dislike 레벨
  | 'taste' // 맛/식감
  | 'smell' // 냄새
  | 'uncomfortable'; // 불편함

/**
 * 통합 사용자 선호/기피 항목
 */
export interface UserPreference {
  id: string;
  clerkUserId: string;

  // 분류
  domain: PreferenceDomain;
  itemType: PreferenceItemType;

  // 항목 정보
  itemId?: string; // DB 참조 ID (옵션)
  itemName: string; // 한글명
  itemNameEn?: string; // 영문명

  // 선호/기피
  isFavorite: boolean; // true=좋아함, false=기피

  // 기피 상세 (isFavorite=false인 경우)
  avoidLevel?: AvoidLevel; // 기피 수준 (일상어 기반)
  avoidReason?: AvoidReason; // 기피 이유
  avoidNote?: string; // 추가 메모

  // 메타
  priority?: number; // 우선순위 (1-5)
  source?: 'user' | 'analysis' | 'recommendation'; // 출처
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 도메인별 상세 타입

#### 2.2.1 Nutrition (영양)

```typescript
// FDA 9대 주요 알레르겐 (FALCPA + FASTER Act 2023)
export type FDAMajorAllergen =
  | 'milk' // 우유 (모든 포유류 포함)
  | 'eggs' // 달걀 (모든 조류 포함)
  | 'fish' // 생선
  | 'shellfish' // 갑각류 (새우, 게, 랍스터)
  | 'tree_nuts' // 견과류 (12종: 아몬드, 호두, 캐슈 등)
  | 'peanuts' // 땅콩
  | 'wheat' // 밀
  | 'soybeans' // 대두
  | 'sesame'; // 참깨 (2023년 추가)

// 식이 제한 유형
export type DietaryRestriction =
  | 'vegetarian' // 채식 (유제품/달걀 허용)
  | 'vegan' // 완전 채식
  | 'pescatarian' // 페스코 (생선 허용)
  | 'halal' // 할랄
  | 'kosher' // 코셔
  | 'lactose_free' // 유당불내증
  | 'gluten_free' // 글루텐프리
  | 'low_sodium' // 저염식
  | 'low_sugar' // 저당식
  | 'keto' // 키토/저탄수화물
  | 'fodmap'; // 저포드맵

// 음식 카테고리 (기피용)
export type FoodCategory =
  | 'seafood' // 해산물
  | 'meat' // 육류
  | 'pork' // 돼지고기 (할랄/코셔)
  | 'beef' // 소고기
  | 'poultry' // 가금류
  | 'dairy' // 유제품
  | 'raw' // 날음식
  | 'spicy' // 매운 음식
  | 'fermented' // 발효 음식
  | 'processed'; // 가공식품
```

#### 2.2.2 Workout (운동)

```typescript
// 신체 부위 (부상/기피)
export type InjuryArea =
  | 'knee' // 무릎
  | 'back' // 허리/등
  | 'shoulder' // 어깨
  | 'wrist' // 손목
  | 'ankle' // 발목
  | 'neck' // 목
  | 'hip' // 엉덩이/골반
  | 'elbow'; // 팔꿈치

// 운동 스타일 선호도
export type ExerciseStylePreference =
  | 'weight_training' // 웨이트
  | 'calisthenics' // 맨몸운동
  | 'cardio' // 유산소
  | 'hiit' // 고강도 인터벌
  | 'yoga' // 요가
  | 'pilates' // 필라테스
  | 'stretching' // 스트레칭
  | 'swimming' // 수영
  | 'cycling' // 사이클링
  | 'running'; // 러닝

// 금기 조건
export type ExerciseContraindication =
  | 'pregnancy' // 임신
  | 'high_blood_pressure' // 고혈압
  | 'heart_condition' // 심장 질환
  | 'osteoporosis' // 골다공증
  | 'arthritis'; // 관절염
```

#### 2.2.3 Personal Color (퍼스널 컬러)

```typescript
// 색상 톤
export type ColorTone =
  | 'warm_light' // 웜톤 밝은색
  | 'warm_dark' // 웜톤 어두운색
  | 'cool_light' // 쿨톤 밝은색
  | 'cool_dark' // 쿨톤 어두운색
  | 'neutral'; // 뉴트럴

// 패턴 선호도
export type PatternPreference =
  | 'solid' // 무지
  | 'stripe' // 스트라이프
  | 'check' // 체크
  | 'floral' // 꽃무늬
  | 'animal' // 애니멀 프린트
  | 'geometric' // 기하학
  | 'abstract'; // 추상
```

#### 2.2.4 다국어 레이블 (i18n)

```typescript
// lib/preferences/labels.ts

/**
 * 기피 수준 레이블 - 문화권별 자연스러운 표현
 */
export const AVOID_LEVEL_LABELS = {
  // 한국어 (Korean)
  ko: {
    dislike: '안 좋아해요',
    avoid: '피하고 싶어요',
    cannot: '못 먹어요', // 영양: 못 먹어요 / 운동: 못 해요
    danger: '절대 안 돼요',
  },
  // 영어 (English)
  en: {
    dislike: "I don't like it",
    avoid: 'I prefer to avoid',
    cannot: "I can't have this",
    danger: 'Life-threatening',
  },
  // 일본어 (Japanese)
  ja: {
    dislike: '好きじゃない',
    avoid: '避けたい',
    cannot: '食べられない', // 영양: 食べられない / 운동: できない
    danger: '絶対ダメ',
  },
  // 중국어 간체 (Chinese Simplified)
  zh_CN: {
    dislike: '不太喜欢',
    avoid: '尽量避免',
    cannot: '不能吃',
    danger: '绝对不行',
  },
  // 중국어 번체 (Chinese Traditional - Taiwan)
  zh_TW: {
    dislike: '不太喜歡',
    avoid: '盡量避免',
    cannot: '不能吃',
    danger: '絕對不行',
  },
} as const;

/**
 * 기피 이유 레이블
 */
export const AVOID_REASON_LABELS = {
  ko: {
    allergy: '알레르기',
    intolerance: '불내증',
    medical: '의료적 제한',
    injury: '부상/통증',
    religious: '종교적 이유',
    ethical: '윤리적 이유',
    health: '건강 관리',
    physical_limitation: '신체적 제약',
    skin_reaction: '피부 반응',
    taste: '맛/식감',
    smell: '냄새',
    uncomfortable: '불편함',
  },
  en: {
    allergy: 'Allergy',
    intolerance: 'Intolerance',
    medical: 'Medical condition',
    injury: 'Injury/Pain',
    religious: 'Religious reason',
    ethical: 'Ethical reason',
    health: 'Health management',
    physical_limitation: 'Physical limitation',
    skin_reaction: 'Skin reaction',
    taste: 'Taste/Texture',
    smell: 'Smell',
    uncomfortable: 'Uncomfortable',
  },
  // ja, zh_CN, zh_TW도 동일하게 추가
} as const;

/**
 * 도메인별 "못 X" 동사 변형
 */
export const CANNOT_VERB_LABELS = {
  ko: {
    nutrition: '못 먹어요',
    workout: '못 해요',
    beauty: '못 써요',
    color: '안 어울려요',
    style: '못 입어요',
  },
  en: {
    nutrition: "I can't eat",
    workout: "I can't do",
    beauty: "I can't use",
    color: "Doesn't suit me",
    style: "I can't wear",
  },
  ja: {
    nutrition: '食べられない',
    workout: 'できない',
    beauty: '使えない',
    color: '似合わない',
    style: '着られない',
  },
} as const;

/**
 * UI 색상 코드 (시각적 구분)
 */
export const AVOID_LEVEL_COLORS = {
  dislike: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    icon: '⚪',
  },
  avoid: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: '🟡',
  },
  cannot: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    icon: '🟠',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    icon: '🔴',
  },
} as const;
```

### 2.3 DB 스키마

```sql
-- 통합 사용자 선호/기피 테이블
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분류
  domain TEXT NOT NULL,           -- beauty, style, nutrition, workout, color
  item_type TEXT NOT NULL,        -- ingredient, food, exercise, etc.

  -- 항목 정보
  item_id UUID,                   -- FK (옵션: 각 도메인 테이블 참조)
  item_name TEXT NOT NULL,
  item_name_en TEXT,

  -- 선호/기피
  is_favorite BOOLEAN NOT NULL DEFAULT true,

  -- 기피 상세 (i18n 친화적)
  avoid_level TEXT,               -- dislike, avoid, cannot, danger (일상어 기반)
  avoid_reason TEXT,              -- allergy, injury, religious, taste, etc.
  avoid_note TEXT,

  -- 메타
  priority INTEGER DEFAULT 3,     -- 1-5
  source TEXT DEFAULT 'user',     -- user, analysis, recommendation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건
  CONSTRAINT user_preferences_unique
    UNIQUE (clerk_user_id, domain, item_type, item_name),
  CONSTRAINT user_preferences_avoid_level_check
    CHECK (avoid_level IS NULL OR avoid_level IN ('dislike', 'avoid', 'cannot', 'danger'))
);

-- RLS 정책
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_user_preferences_user ON user_preferences(clerk_user_id);
CREATE INDEX idx_user_preferences_domain ON user_preferences(domain, item_type);
CREATE INDEX idx_user_preferences_favorite ON user_preferences(clerk_user_id, is_favorite);
CREATE INDEX idx_user_preferences_danger ON user_preferences(clerk_user_id, avoid_level)
  WHERE avoid_level IN ('cannot', 'danger');  -- 위험/불가 항목 빠른 조회
```

---

## 3. API 설계

### 3.1 Endpoints

```typescript
// GET /api/preferences?domain=nutrition&isFavorite=false
// 도메인별 선호/기피 목록 조회

// POST /api/preferences
// 선호/기피 항목 추가
{
  domain: 'nutrition',
  itemType: 'allergen',
  itemName: '땅콩',
  itemNameEn: 'Peanuts',
  isFavorite: false,
  avoidLevel: 'danger',      // 일상어: '절대 안 돼요'
  avoidReason: 'allergy'     // 이유: 알레르기
}

// DELETE /api/preferences/:id
// 선호/기피 항목 삭제

// GET /api/preferences/summary
// 전체 도메인 요약 (각 도메인별 선호/기피 개수)
```

### 3.2 Repository 패턴

```typescript
// lib/preferences/repository.ts

export async function getUserPreferences(
  supabase: SupabaseClient,
  clerkUserId: string,
  filters?: {
    domain?: PreferenceDomain;
    itemType?: PreferenceItemType;
    isFavorite?: boolean;
  }
): Promise<UserPreference[]>;

export async function addPreference(
  supabase: SupabaseClient,
  preference: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserPreference>;

export async function removePreference(supabase: SupabaseClient, id: string): Promise<void>;

export async function getAvoidedItems(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: PreferenceDomain
): Promise<string[]>;
```

---

## 4. 컴포넌트 설계

### 4.1 공통 베이스 컴포넌트

```typescript
// components/preferences/PreferenceFilterBase.tsx

interface PreferenceFilterBaseProps<T> {
  domain: PreferenceDomain;
  favorites: UserPreference[];
  avoids: UserPreference[];
  onFavoritesChange: (items: UserPreference[]) => void;
  onAvoidsChange: (items: UserPreference[]) => void;

  // 도메인별 커스터마이징
  popularItems: T[];
  searchPlaceholder: string;
  favoritesLabel: string;
  avoidsLabel: string;

  // 기피 상세 옵션
  showAvoidReason?: boolean;
  showAvoidSeverity?: boolean;
  availableReasons?: AvoidReason[];

  className?: string;
}
```

### 4.2 도메인별 컴포넌트

```
components/preferences/
├── PreferenceFilterBase.tsx    # 공통 베이스
├── IngredientFilter.tsx        # Beauty (기존 리팩토링)
├── FoodAllergyFilter.tsx       # Nutrition - 알레르기/식이제한
├── FoodPreferenceFilter.tsx    # Nutrition - 음식 선호도
├── ExercisePreferenceFilter.tsx # Workout - 운동 선호도
├── InjuryFilter.tsx            # Workout - 부상/제약 (기존 확장)
├── ColorPreferenceFilter.tsx   # Personal Color
└── index.ts
```

---

## 5. 활용 시나리오

### 5.1 영양 (N-1) 연동

```typescript
// 식단 추천 시
async function getRecommendedMeals(userId: string) {
  const avoids = await getAvoidedItems(supabase, userId, 'nutrition');

  // 위험/불가 항목 (danger, cannot) - 절대 제외
  const criticalAvoids = avoids.filter(
    (a) => a.avoidLevel === 'danger' || a.avoidLevel === 'cannot'
  );

  // 회피 항목 (avoid) - 가능하면 제외
  const preferAvoids = avoids.filter((a) => a.avoidLevel === 'avoid');

  // 비선호 항목 (dislike) - 순위 하향
  const dislikedItems = avoids.filter((a) => a.avoidLevel === 'dislike');

  return meals
    .filter((meal) => {
      // 위험/불가 성분 포함 시 완전 제외
      if (criticalAvoids.some((a) => meal.contains(a.itemName))) return false;
      return true;
    })
    .sort((a, b) => {
      // 회피/비선호 항목이 적은 순으로 정렬
      const aScore = countMatchingAvoids(a, [...preferAvoids, ...dislikedItems]);
      const bScore = countMatchingAvoids(b, [...preferAvoids, ...dislikedItems]);
      return aScore - bScore;
    });
}
```

### 5.2 운동 (W-1) 연동

```typescript
// 운동 추천 시
async function getFilteredExercises(userId: string) {
  const avoids = await getAvoidedItems(supabase, userId, 'workout');

  // 부상 기반 필터링
  const injuries = avoids.filter((a) => a.avoidReason === 'injury');

  // 운동 스타일 기피
  const dislikedStyles = avoids.filter((a) => a.itemType === 'exercise_style');

  return exercises.filter((ex) => {
    // 부상 부위 운동 제외
    if (injuries.some((i) => ex.suitableFor?.injuries?.includes(i.itemName))) {
      return false;
    }

    // 기피 스타일 제외
    if (dislikedStyles.some((s) => ex.style === s.itemName)) {
      return false;
    }

    return true;
  });
}
```

### 5.3 퍼스널 컬러 (PC-1) 연동

```typescript
// 제품 추천 시
async function getColorFilteredProducts(userId: string) {
  const prefs = await getUserPreferences(supabase, userId, { domain: 'color' });

  const favoriteColors = prefs.filter((p) => p.isFavorite);
  const avoidedColors = prefs.filter((p) => !p.isFavorite);

  return products
    .filter((p) => !avoidedColors.some((c) => p.colors.includes(c.itemName)))
    .sort((a, b) => {
      // 선호 색상 포함 제품 우선
      const aScore = favoriteColors.filter((c) => a.colors.includes(c.itemName)).length;
      const bScore = favoriteColors.filter((c) => b.colors.includes(c.itemName)).length;
      return bScore - aScore;
    });
}
```

---

## 6. 마이그레이션 계획

### Phase 1: 타입 정의 및 DB 스키마 (1일)

- [ ] `types/preferences.ts` 생성
- [ ] DB 마이그레이션 파일 생성
- [ ] 기본 Repository 함수 구현

### Phase 2: 기존 데이터 통합 (1일)

- [ ] `FavoriteItem` → `UserPreference` 마이그레이션
- [ ] `allergies[]`, `dislikedFoods[]` → `UserPreference` 변환
- [ ] `injuries[]` → `UserPreference` 변환

### Phase 3: 컴포넌트 구현 (2-3일)

- [ ] `PreferenceFilterBase` 공통 컴포넌트
- [ ] `FoodAllergyFilter` (FDA 9대 알레르겐 + 식이제한)
- [ ] `ExercisePreferenceFilter` (운동 스타일 선호도)
- [ ] `ColorPreferenceFilter` (색상/패턴 선호도)

### Phase 4: 도메인 연동 (2-3일)

- [ ] N-1 식단 추천에 알레르기 필터 적용
- [ ] W-1 운동 추천에 선호도 필터 적용
- [ ] PC-1 제품 추천에 색상 필터 적용

### Phase 5: 테스트 및 문서화 (1일)

- [ ] 단위 테스트 작성
- [ ] E2E 테스트 추가
- [ ] API 문서 업데이트

---

## 7. 예상 효과

| 영역            | Before            | After                             |
| --------------- | ----------------- | --------------------------------- |
| **식단 추천**   | 알레르기만 필터링 | 알레르기 + 식이제한 + 선호도 반영 |
| **운동 추천**   | 부상만 필터링     | 부상 + 스타일 선호도 + 장비 선호  |
| **제품 추천**   | 분석 결과 기반    | 분석 + 색상 선호 + 성분 기피      |
| **개인화 수준** | 도메인별 분리     | 통합 프로필 기반 추천             |

---

## 8. 참고 문서

- [SDD-INGREDIENT-ANALYSIS.md](./SDD-INGREDIENT-ANALYSIS.md) - 성분 분석 시스템
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - DB 스키마
- [types/hybrid.ts](../apps/web/types/hybrid.ts) - 기존 FavoriteItem 타입
- [types/nutrition.ts](../apps/web/types/nutrition.ts) - 기존 AllergyType 타입
