# Product DB UI 기능 스펙

> **작성일**: 2025-12-09
> **모듈명**: P-1 (Product UI)
> **목표**: Product DB 850개 제품을 사용자가 탐색하고 개인화 추천을 받는 UI 구현

---

## 1. 개요

### 1.1 배경

현재 이룸 프로젝트에는 다음 인프라가 구축되어 있지만 사용자 UI가 없음:

| 인프라 | 상태 | 데이터 수 |
|--------|------|----------|
| `cosmetic_products` 테이블 | ✅ 구축 | 500개 |
| `supplement_products` 테이블 | ✅ 구축 | 200개 |
| `workout_equipment` 테이블 | ✅ 구축 | 50개 |
| `health_foods` 테이블 | ✅ 구축 | 100개 |
| `lib/products.ts` API | ✅ 구축 | - |
| 사용자 탐색 UI | ❌ 없음 | - |

### 1.2 목표

- 사용자가 850개 제품을 카테고리/필터로 탐색
- PC-1/S-1/C-1 분석 결과 기반 개인화 추천
- 제품 상세 정보 및 구매 링크 제공

### 1.3 사용자 가치

| 가치 | 설명 |
|------|------|
| 원스톱 쇼핑 | 분석 → 추천 → 구매까지 한 곳에서 |
| 개인화 | 내 피부/체형/목표에 맞는 제품만 |
| 신뢰성 | 전문가 큐레이션 제품 |

---

## 2. 기능 상세

### 2.1 제품 탐색 페이지 (`/products`)

#### 2.1.1 카테고리 탭

```yaml
메인 카테고리:
  - 전체
  - 스킨케어 (cleanser, toner, serum, moisturizer, sunscreen, mask)
  - 메이크업 (foundation, lipstick, eyeshadow, blush)
  - 영양제 (vitamin, mineral, protein, omega, probiotic, collagen)
  - 운동기구 (dumbbell, resistance_band, mat, foam_roller, kettlebell)
  - 건강식품 (protein_powder, meal_replacement, energy_bar, nuts, dried_fruit)
```

#### 2.1.2 필터링 옵션

| 필터 | 화장품 | 영양제 | 운동기구 | 건강식품 |
|------|--------|--------|----------|----------|
| 피부 타입 | ✅ | - | - | - |
| 피부 고민 | ✅ | - | - | - |
| 퍼스널 컬러 | ✅ (메이크업) | - | - | - |
| 효능/목표 | - | ✅ | ✅ | ✅ |
| 가격대 | ✅ | ✅ | ✅ | ✅ |
| 브랜드 | ✅ | ✅ | ✅ | ✅ |
| 난이도 | - | - | ✅ | - |
| 칼로리 | - | - | - | ✅ |
| 단백질 함량 | - | - | - | ✅ |

#### 2.1.3 정렬 옵션

- 추천순 (개인화 점수)
- 인기순 (리뷰 수)
- 가격 낮은순/높은순
- 평점순
- 최신순

#### 2.1.4 검색

- 제품명/브랜드명/성분명 통합 검색
- 자동완성 (debounce 300ms)
- 검색 히스토리 (최근 5개)

### 2.2 제품 상세 페이지 (`/products/[type]/[id]`)

#### 2.2.1 기본 정보

```yaml
표시 항목:
  - 제품 이미지 (대표 1장)
  - 브랜드명
  - 제품명
  - 가격 (₩)
  - 평점 (⭐ 4.5)
  - 리뷰 수
  - 카테고리 배지
```

#### 2.2.2 상세 정보 (탭)

| 탭 | 내용 |
|---|------|
| 상세 | 성분, 용량, 사용법 |
| 매칭 | 내 분석 결과와 매칭도 (%) |
| 구매 | 구매 링크 (어필리에이트) |

#### 2.2.3 개인화 매칭 카드

```yaml
매칭 표시:
  퍼스널 컬러: "Summer 타입에 어울려요" ✅
  피부 타입: "건성 피부에 적합해요" ✅
  피부 고민: "모공 케어에 효과적" ✅

  종합 매칭도: 92%
```

### 2.3 개인화 추천 페이지 (`/products/recommended`)

#### 2.3.1 추천 섹션

```yaml
섹션 구성:
  1. "내 피부에 맞는 스킨케어" (S-1 연동)
     - skin_types, concerns 기반 필터링

  2. "내 퍼스널 컬러에 맞는 메이크업" (PC-1 연동)
     - personal_color_seasons 기반 필터링

  3. "운동 목표에 맞는 영양제" (W-1/N-1 연동)
     - benefits, target_concerns 기반 필터링

  4. "운동 루틴에 필요한 기구" (W-1 연동)
     - exercise_types 기반 필터링

  5. "식단 목표에 맞는 건강식품" (N-1 연동)
     - 칼로리/단백질 목표 기반 필터링
```

#### 2.3.2 추천 로직

```typescript
// 개인화 점수 계산 (0-100)
calculateMatchScore(product, userProfile): number {
  // 피부 타입 매칭 (0-30점)
  // 피부 고민 매칭 (0-30점)
  // 퍼스널 컬러 매칭 (0-20점)
  // 목표 매칭 (0-20점)
}
```

---

## 3. 화면 설계

### 3.1 제품 목록 (`/products`)

```
┌─────────────────────────────────────────┐
│ [검색창]                    [필터 버튼] │
├─────────────────────────────────────────┤
│ [전체] [스킨케어] [메이크업] [영양제]...│
├─────────────────────────────────────────┤
│ 정렬: [추천순 ▼]    xxx개 제품          │
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ [이미지] │ │ [이미지] │ │ [이미지] │    │
│ │ 브랜드   │ │ 브랜드   │ │ 브랜드   │    │
│ │ 제품명   │ │ 제품명   │ │ 제품명   │    │
│ │ ⭐4.5    │ │ ⭐4.2    │ │ ⭐4.8    │    │
│ │ ₩45,000 │ │ ₩32,000 │ │ ₩28,000 │    │
│ │ [92% 매칭]│ │ [85% 매칭]│ │ [78% 매칭]│    │
│ └─────────┘ └─────────┘ └─────────┘    │
│ ...                                     │
├─────────────────────────────────────────┤
│ [더 보기] (무한 스크롤 또는 페이지네이션)│
└─────────────────────────────────────────┘
```

### 3.2 필터 시트 (모바일)

```
┌─────────────────────────────────────────┐
│ 필터                              [닫기]│
├─────────────────────────────────────────┤
│ 피부 타입                               │
│ [건성] [지성] [복합성] [민감성] [정상]  │
├─────────────────────────────────────────┤
│ 피부 고민                               │
│ [모공] [주름] [트러블] [색소침착] ...   │
├─────────────────────────────────────────┤
│ 가격대                                  │
│ [~2만원] [2-5만원] [5만원~]             │
├─────────────────────────────────────────┤
│         [초기화]  [xxx개 제품 보기]     │
└─────────────────────────────────────────┘
```

### 3.3 제품 상세 (`/products/[type]/[id]`)

```
┌─────────────────────────────────────────┐
│ ← 뒤로                                  │
├─────────────────────────────────────────┤
│           [제품 이미지]                 │
│                                         │
├─────────────────────────────────────────┤
│ 브랜드명                                │
│ 제품명                                  │
│ ⭐4.5 (123개 리뷰)                      │
│ ₩45,000                                │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🎨 Summer 타입에 어울려요     92%  │ │
│ │ 💧 건성 피부에 적합해요            │ │
│ │ ✨ 모공 케어에 효과적              │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [상세] [성분] [구매]                    │
├─────────────────────────────────────────┤
│ 주요 성분:                              │
│ - 히알루론산 (보습)                     │
│ - 나이아신아마이드 (모공 케어)          │
│ - 세라마이드 (장벽 강화)                │
│                                         │
│ 사용법:                                 │
│ 세안 후 적당량을 얼굴에 도포...         │
├─────────────────────────────────────────┤
│         [구매하러 가기 →]               │
└─────────────────────────────────────────┘
```

---

## 4. 데이터 모델

### 4.1 기존 테이블 활용

```typescript
// types/product.ts (기존 - camelCase 사용)
interface CosmeticProduct {
  id: string;
  name: string;
  brand: string;
  category: CosmeticCategory;
  subcategory?: MakeupSubcategory | string;
  priceRange?: PriceRange;
  priceKrw?: number;
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  keyIngredients?: string[];
  avoidIngredients?: string[];
  personalColorSeasons?: PersonalColorSeason[];
  imageUrl?: string;
  purchaseUrl?: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 기존 필터 타입 (이미 구현됨)
interface CosmeticProductFilter {
  category?: CosmeticCategory;
  subcategory?: string;
  brand?: string;
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  personalColorSeasons?: PersonalColorSeason[];
  priceRange?: PriceRange;
  minRating?: number;
}
```

### 4.2 새로운 타입 (개인화 - 신규 추가 필요)

```typescript
// types/product.ts (추가할 타입)

/** 개인화 매칭 결과를 포함한 제품 */
interface ProductWithMatch<T> {
  product: T;
  matchScore: number;  // 0-100
  matchReasons: MatchReason[];
}

/** 매칭 사유 */
interface MatchReason {
  type: 'skinType' | 'concern' | 'personalColor' | 'goal';
  label: string;
  matched: boolean;
}

/** 통합 검색/정렬 옵션 (기존 Filter 타입 확장) */
interface ProductSearchOptions {
  search?: string;
  sortBy?: 'recommended' | 'popular' | 'priceAsc' | 'priceDesc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

// 참고: 제품별 필터 타입은 이미 구현되어 있음
// - CosmeticProductFilter (types/product.ts:91)
// - SupplementProductFilter (types/product.ts:175)
// - WorkoutEquipmentFilter (types/product.ts:383)
// - HealthFoodFilter (types/product.ts:573)
```

---

## 5. API 엔드포인트

### 5.1 기존 API (`lib/products/` - Repository 패턴)

> **v3.0 리팩토링 완료** (2025-12-09): 1,214줄 → 도메인별 분리

| 파일 | 용도 | 함수 |
|------|------|------|
| `repositories/cosmetic.ts` | 화장품 CRUD | getCosmeticProducts, getRecommendedCosmetics |
| `repositories/supplement.ts` | 영양제 CRUD | getSupplementProducts, getRecommendedSupplements |
| `repositories/equipment.ts` | 운동기구 CRUD | getWorkoutEquipment, getRecommendedEquipment |
| `repositories/healthfood.ts` | 건강식품 CRUD | getHealthFoods, getHighProteinFoods |
| `repositories/price-history.ts` | 가격 추적 | recordPriceHistory, getPriceHistory |
| `services/search.ts` | 통합 검색 | searchProducts, getProductsByCategory |
| `matching.ts` | 매칭 로직 | calculateMatchScore, addMatchInfo |

### 5.2 새로운 API (추가)

```typescript
// lib/products.ts (추가)

// 통합 검색
searchProducts(query: string, category?: string): Promise<Product[]>

// 개인화 추천
getRecommendedProducts(
  userProfile: UserProfile,
  category?: string,
  limit?: number
): Promise<ProductWithMatch[]>

// 개인화 점수 계산
calculateMatchScore(
  product: Product,
  userProfile: UserProfile
): number
```

---

## 6. 연동 모듈

### 6.1 PC-1 연동

```yaml
사용 데이터:
  - personal_color_assessments.season (Spring/Summer/Autumn/Winter)

적용:
  - 메이크업 제품 필터링 (personal_color_seasons)
  - 매칭도 계산 (+20점)
```

### 6.2 S-1 연동

```yaml
사용 데이터:
  - skin_analyses.skin_type (dry/oily/combination/sensitive/normal)
  - skin_analyses.top_concerns (배열)

적용:
  - 스킨케어 제품 필터링 (skin_types, concerns)
  - 매칭도 계산 (+30점 피부타입, +30점 고민)
```

### 6.3 C-1 연동

```yaml
사용 데이터:
  - body_analyses.body_type
  - body_analyses.height, weight

적용:
  - BMR 기반 영양제 추천
  - 체형별 운동기구 추천
```

### 6.4 W-1/N-1 연동

```yaml
사용 데이터:
  - workout_analyses.workout_type
  - nutrition_settings.goal

적용:
  - 운동 목표 기반 영양제/건강식품 추천
  - 식단 목표 기반 건강식품 추천
```

---

## 7. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 상태 관리 | URL Params + React Query | 필터 상태 공유, 캐싱 |
| 무한 스크롤 | @tanstack/react-virtual | 성능 최적화 |
| 필터 UI | Sheet (모바일) / Sidebar (데스크탑) | 반응형 |
| 이미지 | next/image | 최적화 |

---

## 8. 성공 지표

| 지표 | 목표 |
|------|------|
| 제품 페이지 진입률 | 분석 완료 사용자 40%+ |
| 평균 체류 시간 | 3분+ |
| 구매 링크 클릭률 (CTR) | 5%+ |
| 필터 사용률 | 60%+ |

---

## 9. 향후 확장

### 9.1 Phase 2

- 사용자 리뷰 통합
- 가격 히스토리 차트
- 가격 알림 설정
- 위시리스트

### 9.2 Phase 3

- RAG 기반 제품 Q&A
- 성분 충돌 경고 (영양제)
- 루틴 빌더 (스킨케어 조합)

---

**버전**: v1.1 (Repository 패턴 반영)
**최종 수정일**: 2025-12-09
