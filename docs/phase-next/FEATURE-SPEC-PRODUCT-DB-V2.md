# Feature Spec: Product DB v2 확장

> **작성일**: 2025-12-19
> **목표**: 사용자 리뷰 + 성분 충돌 경고 + 어필리에이트 연동
> **우선순위**: 6차 작업

---

## 1. 개요

### 1.1 현재 상태

```yaml
Product DB v1 (완료):
  - cosmetic_products: 500개
  - supplement_products: 200개
  - workout_equipment: 50개
  - health_foods: 100개
  - product_price_history: 가격 추적

기능:
  - 제품 목록/상세
  - 매칭도 계산
  - 위시리스트
  - 가격 히스토리
```

### 1.2 v2 확장 목표

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 사용자 리뷰 | 별점 + 후기 작성/조회 | 높음 |
| 성분 충돌 경고 | 영양제 간 상호작용 경고 | 높음 |
| 어필리에이트 | 제휴 링크 + 클릭 트래킹 | 중간 |

---

## 2. 사용자 리뷰 시스템

### 2.1 데이터베이스 스키마

```sql
-- 제품 리뷰 테이블
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 제품 참조 (다형성)
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 리뷰 내용
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,

  -- 메타데이터
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reviews_product ON product_reviews(product_type, product_id);
CREATE INDEX idx_reviews_user ON product_reviews(clerk_user_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);

-- RLS 정책
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "Public read reviews" ON product_reviews
  FOR SELECT USING (true);

-- 본인만 작성/수정/삭제
CREATE POLICY "Users can manage own reviews" ON product_reviews
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 리뷰 도움됨 테이블
CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, clerk_user_id)
);
```

### 2.2 타입 정의

```typescript
// types/review.ts
export interface ProductReview {
  id: string;
  clerkUserId: string;
  productType: 'cosmetic' | 'supplement' | 'equipment' | 'healthfood';
  productId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  content?: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;

  // 조인 데이터
  user?: {
    name: string;
    profileImageUrl?: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

### 2.3 API 함수

```typescript
// lib/products/reviews.ts
export async function getProductReviews(
  productType: string,
  productId: string,
  options?: { limit?: number; offset?: number; sort?: 'recent' | 'helpful' | 'rating' }
): Promise<ProductReview[]>

export async function getReviewSummary(
  productType: string,
  productId: string
): Promise<ReviewSummary>

export async function createReview(
  review: Omit<ProductReview, 'id' | 'helpfulCount' | 'createdAt' | 'updatedAt'>
): Promise<ProductReview>

export async function updateReview(
  reviewId: string,
  updates: Partial<Pick<ProductReview, 'rating' | 'title' | 'content'>>
): Promise<ProductReview>

export async function deleteReview(reviewId: string): Promise<void>

export async function markReviewHelpful(reviewId: string): Promise<void>
```

### 2.4 UI 컴포넌트

```yaml
components/products/reviews/:
  - ReviewList.tsx       # 리뷰 목록
  - ReviewCard.tsx       # 개별 리뷰 카드
  - ReviewForm.tsx       # 리뷰 작성 폼
  - ReviewSummary.tsx    # 별점 요약 (평균, 분포)
  - StarRating.tsx       # 별점 입력/표시
```

---

## 3. 성분 충돌 경고

### 3.1 데이터베이스 스키마

```sql
-- 성분 상호작용 테이블
CREATE TABLE ingredient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 성분 A
  ingredient_a TEXT NOT NULL,

  -- 성분 B
  ingredient_b TEXT NOT NULL,

  -- 상호작용 유형
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'contraindication',  -- 금기 (절대 같이 복용 X)
    'caution',           -- 주의 (의사 상담 권장)
    'synergy',           -- 시너지 (같이 먹으면 좋음)
    'timing'             -- 시간 분리 필요
  )),

  -- 상세 정보
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),
  description TEXT NOT NULL,
  recommendation TEXT,
  source TEXT,           -- 출처 (논문, FDA 등)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (양방향 검색)
CREATE INDEX idx_interactions_a ON ingredient_interactions(ingredient_a);
CREATE INDEX idx_interactions_b ON ingredient_interactions(ingredient_b);

-- RLS (공개 읽기)
ALTER TABLE ingredient_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON ingredient_interactions FOR SELECT USING (true);
```

### 3.2 초기 데이터 (주요 상호작용)

```yaml
금기 (contraindication):
  - 철분 + 칼슘: 흡수 방해
  - 아연 + 구리: 흡수 경쟁
  - 비타민E + 혈액응고제: 출혈 위험

주의 (caution):
  - 오메가3 + 아스피린: 혈액 묽어짐
  - 비타민K + 혈액응고제: 효과 감소
  - 마그네슘 + 항생제: 흡수 방해

시간 분리 (timing):
  - 철분 + 칼슘: 2시간 간격 권장
  - 갑상선약 + 칼슘: 4시간 간격 권장
  - 프로바이오틱스 + 항생제: 2시간 간격 권장

시너지 (synergy):
  - 비타민D + 칼슘: 흡수 증가
  - 비타민C + 철분: 흡수 증가
  - 오메가3 + 비타민E: 산화 방지
```

### 3.3 타입 정의

```typescript
// types/interaction.ts
export type InteractionType = 'contraindication' | 'caution' | 'synergy' | 'timing';
export type Severity = 'high' | 'medium' | 'low';

export interface IngredientInteraction {
  id: string;
  ingredientA: string;
  ingredientB: string;
  interactionType: InteractionType;
  severity?: Severity;
  description: string;
  recommendation?: string;
  source?: string;
}

export interface InteractionWarning {
  products: [string, string];  // 제품명 쌍
  interactions: IngredientInteraction[];
}
```

### 3.4 API 함수

```typescript
// lib/products/interactions.ts
export async function checkInteractions(
  productIds: string[]
): Promise<InteractionWarning[]>

export async function getIngredientInteractions(
  ingredient: string
): Promise<IngredientInteraction[]>
```

### 3.5 UI 컴포넌트

```yaml
components/products/interactions/:
  - InteractionWarning.tsx   # 경고 배너
  - InteractionDetail.tsx    # 상세 정보 모달
  - WishlistWarnings.tsx     # 위시리스트 내 경고 표시
```

---

## 4. 어필리에이트 연동

### 4.1 데이터베이스 변경

```sql
-- 기존 제품 테이블에 affiliate 필드 추가
ALTER TABLE cosmetic_products ADD COLUMN affiliate_url TEXT;
ALTER TABLE cosmetic_products ADD COLUMN affiliate_commission DECIMAL(5,2);

ALTER TABLE supplement_products ADD COLUMN affiliate_url TEXT;
ALTER TABLE supplement_products ADD COLUMN affiliate_commission DECIMAL(5,2);

ALTER TABLE workout_equipment ADD COLUMN affiliate_url TEXT;
ALTER TABLE workout_equipment ADD COLUMN affiliate_commission DECIMAL(5,2);

ALTER TABLE health_foods ADD COLUMN affiliate_url TEXT;
ALTER TABLE health_foods ADD COLUMN affiliate_commission DECIMAL(5,2);

-- 클릭 트래킹 테이블
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,  -- 비로그인 가능
  product_type TEXT NOT NULL,
  product_id UUID NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 트래킹 정보
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT  -- 개인정보 보호를 위해 해시
);

-- 인덱스
CREATE INDEX idx_clicks_product ON affiliate_clicks(product_type, product_id);
CREATE INDEX idx_clicks_date ON affiliate_clicks(clicked_at);
```

### 4.2 API 함수

```typescript
// lib/products/affiliate.ts
export async function trackAffiliateClick(
  productType: string,
  productId: string
): Promise<void>

export async function getAffiliateStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalClicks: number;
  byProduct: { productId: string; clicks: number }[];
  byDate: { date: string; clicks: number }[];
}>
```

### 4.3 구현 전략

```yaml
Phase 1 (즉시):
  - affiliate_url 필드 추가
  - 구매 버튼 클릭 시 리다이렉트
  - 클릭 수 트래킹

Phase 2 (추후):
  - 어필리에이트 프로그램 가입 (쿠팡 파트너스, 네이버 스마트스토어 등)
  - 수익 대시보드 (관리자)
```

---

## 5. 파일 구조

```
apps/web/
├── lib/products/
│   ├── repositories/
│   │   └── (기존 유지)
│   ├── services/
│   │   ├── search.ts (기존)
│   │   ├── reviews.ts (신규)
│   │   └── interactions.ts (신규)
│   └── affiliate.ts (신규)
│
├── components/products/
│   ├── reviews/
│   │   ├── index.ts
│   │   ├── ReviewList.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewSummary.tsx
│   │   └── StarRating.tsx
│   └── interactions/
│       ├── index.ts
│       ├── InteractionWarning.tsx
│       └── InteractionDetail.tsx
│
├── types/
│   ├── review.ts (신규)
│   └── interaction.ts (신규)
│
└── supabase/migrations/
    └── 20251219_product_v2_extensions.sql (신규)
```

---

## 6. 작업 순서

### 6.1 Sprint 1: 리뷰 시스템 ✅ 완료 (2025-12-19)

```yaml
Day 1: ✅
  [x] DB 마이그레이션 (product_reviews, review_helpful)
  [x] types/review.ts 작성
  [x] lib/products/services/reviews.ts 작성

Day 2: ✅
  [x] ReviewSummary, StarRating 컴포넌트
  [x] ReviewCard, ReviewList 컴포넌트
  [x] ReviewForm, ReviewSection 컴포넌트

Day 3: ✅
  [x] 제품 상세 페이지에 리뷰 섹션 추가
  [ ] 테스트 작성 및 검증 (추후 진행)
```

### 6.2 Sprint 2: 성분 충돌 경고 ✅ 완료 (2025-12-19)

```yaml
Day 1: ✅
  [x] DB 마이그레이션 (ingredient_interactions)
  [x] 초기 데이터 시드 (24개 주요 상호작용)
  [x] types/interaction.ts 작성

Day 2: ✅
  [x] lib/products/services/interactions.ts 작성
  [x] InteractionWarning, InteractionDetail 컴포넌트
  [x] 위시리스트에 경고 표시 연동
  [ ] 테스트 작성 (추후 진행)
```

### 6.3 Sprint 3: 어필리에이트 ✅ 완료 (2025-12-19)

```yaml
Day 1: ✅
  [x] DB 마이그레이션 (affiliate_url/commission 필드 + affiliate_clicks 테이블)
  [x] types/affiliate.ts 타입 정의
  [x] lib/products/affiliate.ts 서비스 작성
  [x] 제품 타입 affiliateUrl/Commission 필드 추가
  [x] PurchaseButton 컴포넌트 (클릭 트래킹 연동)
  [x] 제품 상세 페이지 연동
```

---

## 7. 테스트 계획

```yaml
리뷰 시스템:
  - 리뷰 CRUD 테스트
  - 별점 집계 테스트
  - RLS 권한 테스트
  - 도움됨 기능 테스트

성분 충돌:
  - 상호작용 검색 테스트
  - 다중 제품 경고 테스트
  - 양방향 검색 테스트

어필리에이트:
  - 클릭 트래킹 테스트
  - 통계 집계 테스트
```

---

## 8. 의존성

```yaml
기술적 의존성:
  - Supabase RLS 정책
  - Clerk 인증
  - 기존 Product Repository 패턴

데이터 의존성:
  - 성분 상호작용 데이터 (수동 수집 필요)
  - 어필리에이트 프로그램 가입 (추후)

UI 의존성:
  - 제품 상세 페이지 레이아웃
  - 위시리스트 페이지
```

---

## 9. 알려진 제한사항 (Sprint 1)

```yaml
사용자 정보 미조회:
  현재 상태: 리뷰에 user.name, user.profileImageUrl 미표시
  원인: Clerk 사용자 정보 조회 API 미연동
  해결책:
    - Option A: Clerk API로 사용자 정보 조회 (추가 API 호출)
    - Option B: users 테이블 조인 (clerk_id 기반)
  우선순위: 낮음 (리뷰 작성자 익명 처리로 대체)

테스트 미작성:
  현재 상태: 리뷰 시스템 테스트 코드 미작성
  계획: Sprint 완료 후 테스트 추가
```

---

**Version**: 1.1
**Created**: 2025-12-19
**Updated**: 2025-12-19 (Sprint 1 완료, 제한사항 추가)
