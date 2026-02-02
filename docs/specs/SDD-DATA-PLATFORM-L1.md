# SDD-DATA-PLATFORM-L1: 데이터 플랫폼 Phase L1 스펙

> **작성일**: 2026-02-01
> **P7 단계**: 스펙 (Specification)
> **의존성**: L-R1, L-R2, L-P1, ADR-061

---

## 1. 개요

### 1.1 목적

이룸 데이터 플랫폼 Phase L1은 다음 기능을 구현한다:
1. **Product Master DB**: 제품 ID 통합
2. **Click-Analysis Attribution**: 분석-클릭 연계
3. **User Preferences**: 선호도 학습 기반

### 1.2 범위

| 포함 | 제외 |
|------|------|
| Product Master 스키마 | 브랜드 대시보드 UI |
| Analytics 이벤트 확장 | 실시간 스트리밍 |
| 선호도 학습 로직 | A/B 테스트 프레임워크 |
| API 엔드포인트 | 모바일 SDK |

### 1.3 성공 기준

| 지표 | 기준 |
|------|------|
| Product Master 등록률 | 기존 제품 80% 매핑 |
| Attribution 커버리지 | 클릭 이벤트 90% |
| 선호도 업데이트 정확도 | 테스트 케이스 95% 통과 |

---

## 2. 데이터 모델

### 2.1 Product Master 테이블

```sql
-- 테이블 정의
CREATE TABLE product_master (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Internal SKU (형식: YR-{CATEGORY}-{SEQUENCE})
  internal_sku TEXT UNIQUE NOT NULL,

  -- 기본 정보
  name TEXT NOT NULL,
  name_en TEXT,                    -- 영문 이름 (옵션)
  brand TEXT NOT NULL,
  brand_normalized TEXT,           -- 정규화된 브랜드명

  -- 카테고리
  category product_category NOT NULL,
  subcategory TEXT,

  -- 외부 ID 매핑
  external_ids JSONB NOT NULL DEFAULT '{}',
  -- 예: { "coupang": "123", "iherb": "ABC", "musinsa": "M456" }

  -- 이룸 분석 연계 속성
  skin_types TEXT[] DEFAULT '{}',
  -- 예: ['dry', 'oily', 'combination', 'normal', 'sensitive']

  skin_concerns TEXT[] DEFAULT '{}',
  -- 예: ['acne', 'wrinkle', 'pigmentation', 'pore', 'redness']

  personal_colors TEXT[] DEFAULT '{}',
  -- 예: ['spring_warm_light', 'summer_cool_light', ...]

  body_types TEXT[] DEFAULT '{}',
  -- 예: ['rectangle', 'hourglass', 'triangle', 'inverted_triangle']

  age_groups TEXT[] DEFAULT '{}',
  -- 예: ['20s', '30s', '40s', '50s+']

  gender_targets TEXT[] DEFAULT ARRAY['all'],
  -- 예: ['all', 'female', 'male']

  -- 성분 (화장품/영양제)
  ingredients TEXT[] DEFAULT '{}',
  ingredient_concerns TEXT[] DEFAULT '{}',  -- 주의 성분

  -- 가격 정보 (파트너별)
  prices JSONB DEFAULT '{}',
  -- 예: { "coupang": 15900, "iherb": 12.99 }

  -- 이미지
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',

  -- 통계 (집계)
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_match_score DECIMAL DEFAULT 0,

  -- RLS 제외 (public 테이블)
  is_active BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_product_master_category ON product_master(category);
CREATE INDEX idx_product_master_brand ON product_master(brand_normalized);
CREATE INDEX idx_product_master_sku ON product_master(internal_sku);
CREATE INDEX idx_product_master_external_ids ON product_master USING GIN(external_ids);
CREATE INDEX idx_product_master_skin_types ON product_master USING GIN(skin_types);
CREATE INDEX idx_product_master_personal_colors ON product_master USING GIN(personal_colors);

-- 업데이트 트리거
CREATE TRIGGER update_product_master_timestamp
  BEFORE UPDATE ON product_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Analytics Events 확장

```sql
-- 기존 테이블 확장
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS source_analysis_id UUID,
  ADD COLUMN IF NOT EXISTS source_analysis_type TEXT,
  ADD COLUMN IF NOT EXISTS product_master_id UUID,
  ADD COLUMN IF NOT EXISTS match_score INTEGER,
  ADD COLUMN IF NOT EXISTS recommendation_position INTEGER,
  ADD COLUMN IF NOT EXISTS recommendation_context TEXT;

-- source_analysis_type 체크
ALTER TABLE analytics_events
  ADD CONSTRAINT check_analysis_type
  CHECK (source_analysis_type IN (
    'skin', 'personal_color', 'body', 'hair', 'oral_health', 'makeup', NULL
  ));

-- recommendation_context 체크
ALTER TABLE analytics_events
  ADD CONSTRAINT check_recommendation_context
  CHECK (recommendation_context IN (
    'main_result', 'related', 'alternative', 'personalized', 'trending', NULL
  ));

-- 인덱스
CREATE INDEX idx_analytics_source_analysis
  ON analytics_events(source_analysis_id)
  WHERE source_analysis_id IS NOT NULL;

CREATE INDEX idx_analytics_product_master
  ON analytics_events(product_master_id)
  WHERE product_master_id IS NOT NULL;
```

### 2.3 User Preferences Learned 테이블

```sql
CREATE TABLE user_preferences_learned (
  -- Primary Key
  clerk_user_id TEXT PRIMARY KEY,

  -- 브랜드 친밀도 (0-1)
  brand_affinity JSONB DEFAULT '{}',
  -- 예: { "라운드랩": 0.85, "닥터자르트": 0.72 }

  -- 카테고리 선호도 (0-1)
  category_affinity JSONB DEFAULT '{}',
  -- 예: { "skincare": 0.92, "makeup": 0.45, "supplements": 0.68 }

  -- 가격 민감도 (0-1, 높을수록 민감)
  price_sensitivity DECIMAL DEFAULT 0.5,

  -- 성분 선호/회피
  ingredient_preferences JSONB DEFAULT '{}',
  -- 예: { "preferred": ["히알루론산"], "avoided": ["향료"] }

  -- 사용자 세그먼트
  user_segment TEXT,
  -- 'high_value', 'brand_loyalist', 'price_hunter', 'new_user', 'dormant'

  -- 탐색 비율 (0-1)
  exploration_rate DECIMAL DEFAULT 0.2,

  -- 최근 행동 가중치 (0-1)
  recency_weight DECIMAL DEFAULT 0.7,

  -- 신뢰도 (0-1, 데이터 양에 따라)
  confidence DECIMAL DEFAULT 0.0,

  -- 상호작용 카운트
  interaction_count INTEGER DEFAULT 0,

  -- 타임스탬프
  first_interaction_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE user_preferences_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_preferences_select"
  ON user_preferences_learned FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "users_own_preferences_update"
  ON user_preferences_learned FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());
```

---

## 3. TypeScript 타입 정의

### 3.1 Product Master Types

```typescript
// types/product-master.ts

import { z } from 'zod';

export const ProductCategorySchema = z.enum([
  'skincare',
  'makeup',
  'haircare',
  'bodycare',
  'supplement',
  'equipment',
  'healthfood',
  'fashion'
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductMasterSchema = z.object({
  id: z.string().uuid(),
  internalSku: z.string().regex(/^YR-[A-Z]+-\d{5}$/),

  name: z.string().min(1),
  nameEn: z.string().optional(),
  brand: z.string().min(1),
  brandNormalized: z.string().optional(),

  category: ProductCategorySchema,
  subcategory: z.string().optional(),

  externalIds: z.record(z.string()),
  // { coupang: "123", iherb: "ABC" }

  skinTypes: z.array(z.string()).default([]),
  skinConcerns: z.array(z.string()).default([]),
  personalColors: z.array(z.string()).default([]),
  bodyTypes: z.array(z.string()).default([]),
  ageGroups: z.array(z.string()).default([]),
  genderTargets: z.array(z.string()).default(['all']),

  ingredients: z.array(z.string()).default([]),
  ingredientConcerns: z.array(z.string()).default([]),

  prices: z.record(z.number()).default({}),

  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).default([]),

  totalImpressions: z.number().default(0),
  totalClicks: z.number().default(0),
  totalConversions: z.number().default(0),
  avgMatchScore: z.number().default(0),

  isActive: z.boolean().default(true),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProductMaster = z.infer<typeof ProductMasterSchema>;

// 생성용 스키마 (id, timestamps 제외)
export const ProductMasterCreateSchema = ProductMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalImpressions: true,
  totalClicks: true,
  totalConversions: true,
  avgMatchScore: true,
});

export type ProductMasterCreate = z.infer<typeof ProductMasterCreateSchema>;
```

### 3.2 Attribution Types

```typescript
// types/attribution.ts

import { z } from 'zod';

export const AnalysisTypeSchema = z.enum([
  'skin',
  'personal_color',
  'body',
  'hair',
  'oral_health',
  'makeup'
]);

export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

export const RecommendationContextSchema = z.enum([
  'main_result',
  'related',
  'alternative',
  'personalized',
  'trending'
]);

export type RecommendationContext = z.infer<typeof RecommendationContextSchema>;

export const AttributionDataSchema = z.object({
  sourceAnalysisId: z.string().uuid(),
  sourceAnalysisType: AnalysisTypeSchema,
  productMasterId: z.string().uuid(),
  matchScore: z.number().min(0).max(100),
  recommendationPosition: z.number().int().min(1),
  recommendationContext: RecommendationContextSchema,
});

export type AttributionData = z.infer<typeof AttributionDataSchema>;

// 이벤트 확장
export interface AttributedAnalyticsEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  pageUrl: string;
  // Attribution 필드
  attribution?: AttributionData;
  properties: Record<string, unknown>;
}
```

### 3.3 User Preferences Types

```typescript
// types/user-preferences.ts

import { z } from 'zod';

export const UserSegmentSchema = z.enum([
  'high_value',
  'brand_loyalist',
  'price_hunter',
  'new_user',
  'dormant'
]);

export type UserSegment = z.infer<typeof UserSegmentSchema>;

export const UserPreferencesSchema = z.object({
  clerkUserId: z.string(),

  brandAffinity: z.record(z.number().min(0).max(1)).default({}),
  categoryAffinity: z.record(z.number().min(0).max(1)).default({}),
  priceSensitivity: z.number().min(0).max(1).default(0.5),

  ingredientPreferences: z.object({
    preferred: z.array(z.string()).default([]),
    avoided: z.array(z.string()).default([]),
  }).default({ preferred: [], avoided: [] }),

  userSegment: UserSegmentSchema.optional(),

  explorationRate: z.number().min(0).max(1).default(0.2),
  recencyWeight: z.number().min(0).max(1).default(0.7),
  confidence: z.number().min(0).max(1).default(0),

  interactionCount: z.number().int().min(0).default(0),

  firstInteractionAt: z.string().datetime().optional(),
  lastInteractionAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
```

---

## 4. API 엔드포인트

### 4.1 Product Master API

```typescript
// app/api/products/master/route.ts

// GET /api/products/master
// 제품 목록 조회 (페이지네이션)
interface GetProductsRequest {
  category?: ProductCategory;
  brand?: string;
  skinTypes?: string[];
  personalColors?: string[];
  page?: number;
  pageSize?: number;
}

interface GetProductsResponse {
  success: boolean;
  data: ProductMaster[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/products/master/[sku]
// 단일 제품 조회

// GET /api/products/master/external/[partner]/[externalId]
// 외부 ID로 조회
```

### 4.2 Attribution API

```typescript
// app/api/analytics/track-with-attribution/route.ts

// POST /api/analytics/track-with-attribution
interface TrackWithAttributionRequest {
  eventType: string;
  properties: Record<string, unknown>;
  attribution?: {
    sourceAnalysisId: string;
    sourceAnalysisType: AnalysisType;
    productMasterId: string;
    matchScore: number;
    recommendationPosition: number;
    recommendationContext: RecommendationContext;
  };
}

interface TrackWithAttributionResponse {
  success: boolean;
  eventId: string;
}
```

### 4.3 User Preferences API

```typescript
// app/api/users/preferences/route.ts

// GET /api/users/preferences
// 현재 사용자 선호도 조회

// POST /api/users/preferences/update
// 선호도 업데이트 (이벤트 기반)
interface UpdatePreferencesRequest {
  eventType: 'click' | 'view' | 'purchase' | 'save' | 'review';
  productMasterId: string;
  context: {
    brand: string;
    category: string;
    price: number;
    matchScore: number;
  };
}
```

---

## 5. 비즈니스 로직

### 5.1 SKU 생성 로직

```typescript
// lib/products/sku-generator.ts

const CATEGORY_CODES: Record<ProductCategory, string> = {
  skincare: 'SKIN',
  makeup: 'MKUP',
  haircare: 'HAIR',
  bodycare: 'BODY',
  supplement: 'SUPP',
  equipment: 'EQUP',
  healthfood: 'FOOD',
  fashion: 'FASH',
};

export async function generateSku(
  supabase: SupabaseClient,
  category: ProductCategory
): Promise<string> {
  const code = CATEGORY_CODES[category];

  // 현재 최대 시퀀스 조회
  const { data, error } = await supabase
    .from('product_master')
    .select('internal_sku')
    .like('internal_sku', `YR-${code}-%`)
    .order('internal_sku', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (data && data.length > 0) {
    const lastSku = data[0].internal_sku;
    const lastSequence = parseInt(lastSku.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `YR-${code}-${String(sequence).padStart(5, '0')}`;
}
```

### 5.2 선호도 업데이트 로직

```typescript
// lib/preferences/update-preferences.ts

const SIGNAL_WEIGHTS: Record<string, number> = {
  page_view: 0.5,
  click: 1.0,
  add_to_wishlist: 2.0,
  add_to_cart: 3.0,
  purchase: 5.0,
  repurchase: 10.0,
  review: 3.0,
};

const LEARNING_RATE = 0.1;  // α (EMA)

export function calculateNewAffinity(
  currentAffinity: number,
  signalType: string
): number {
  const weight = SIGNAL_WEIGHTS[signalType] || 1.0;
  const normalizedWeight = Math.min(weight / 10, 1);  // 0-1 정규화

  // EMA: P(t) = α × S(t) + (1 - α) × P(t-1)
  return LEARNING_RATE * normalizedWeight + (1 - LEARNING_RATE) * currentAffinity;
}

export function calculateConfidence(interactionCount: number): number {
  const k = 0.1;  // 학습 속도 상수
  return 1 - Math.exp(-k * interactionCount);
}

export async function updateUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  event: {
    eventType: string;
    brand: string;
    category: string;
  }
): Promise<UserPreferences> {
  // 현재 선호도 조회
  const { data: current } = await supabase
    .from('user_preferences_learned')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  // 없으면 초기화
  const preferences = current || {
    clerk_user_id: userId,
    brand_affinity: {},
    category_affinity: {},
    interaction_count: 0,
  };

  // 브랜드 친밀도 업데이트
  const currentBrandAffinity = preferences.brand_affinity[event.brand] || 0;
  preferences.brand_affinity[event.brand] = calculateNewAffinity(
    currentBrandAffinity,
    event.eventType
  );

  // 카테고리 선호도 업데이트
  const currentCategoryAffinity = preferences.category_affinity[event.category] || 0;
  preferences.category_affinity[event.category] = calculateNewAffinity(
    currentCategoryAffinity,
    event.eventType
  );

  // 상호작용 카운트 증가
  preferences.interaction_count += 1;

  // 신뢰도 재계산
  preferences.confidence = calculateConfidence(preferences.interaction_count);

  // 업데이트
  await supabase
    .from('user_preferences_learned')
    .upsert(preferences);

  return preferences;
}
```

---

## 6. 마이그레이션 계획

### 6.1 마이그레이션 파일

```sql
-- supabase/migrations/20260201_L1_product_master.sql

-- 1. product_master 테이블 생성
-- (2.1 스키마 참조)

-- 2. analytics_events 확장
-- (2.2 스키마 참조)

-- 3. user_preferences_learned 생성
-- (2.3 스키마 참조)

-- 4. 기존 제품 데이터 마이그레이션
-- 별도 스크립트로 실행
```

### 6.2 데이터 마이그레이션

```typescript
// scripts/migrate-products-to-master.ts

/**
 * 기존 파트너 제품 → Product Master 마이그레이션
 *
 * 실행: npx ts-node scripts/migrate-products-to-master.ts
 */

async function migrateProducts() {
  // 1. 쿠팡 제품 마이그레이션
  const coupangProducts = await fetchCoupangProducts();
  for (const product of coupangProducts) {
    await createOrUpdateProductMaster({
      name: product.name,
      brand: product.brand,
      category: mapCategory(product.category),
      externalIds: { coupang: product.id },
      // ... 속성 매핑
    });
  }

  // 2. iHerb 제품 마이그레이션
  // ...

  // 3. 무신사 제품 마이그레이션
  // ...
}
```

---

## 7. 테스트 계획

### 7.1 단위 테스트

```typescript
// tests/lib/products/sku-generator.test.ts
describe('SKU Generator', () => {
  it('should generate valid SKU format', async () => {
    const sku = await generateSku(supabase, 'skincare');
    expect(sku).toMatch(/^YR-SKIN-\d{5}$/);
  });

  it('should increment sequence correctly', async () => {
    const sku1 = await generateSku(supabase, 'skincare');
    const sku2 = await generateSku(supabase, 'skincare');

    const seq1 = parseInt(sku1.split('-')[2], 10);
    const seq2 = parseInt(sku2.split('-')[2], 10);

    expect(seq2).toBe(seq1 + 1);
  });
});

// tests/lib/preferences/update-preferences.test.ts
describe('Preference Update', () => {
  it('should apply EMA correctly', () => {
    const current = 0.5;
    const newAffinity = calculateNewAffinity(current, 'purchase');

    // 구매 weight = 5.0, normalized = 0.5
    // EMA: 0.1 * 0.5 + 0.9 * 0.5 = 0.5
    expect(newAffinity).toBeCloseTo(0.5);
  });

  it('should calculate confidence correctly', () => {
    expect(calculateConfidence(0)).toBeCloseTo(0);
    expect(calculateConfidence(10)).toBeCloseTo(0.63);
    expect(calculateConfidence(30)).toBeCloseTo(0.95);
  });
});
```

### 7.2 통합 테스트

```typescript
// tests/api/products/master.test.ts
describe('Product Master API', () => {
  it('should create product with valid SKU', async () => {
    const response = await POST('/api/products/master', {
      name: '테스트 제품',
      brand: '테스트 브랜드',
      category: 'skincare',
      externalIds: { coupang: 'TEST123' },
    });

    expect(response.status).toBe(201);
    expect(response.data.internalSku).toMatch(/^YR-SKIN-\d{5}$/);
  });

  it('should find product by external ID', async () => {
    const response = await GET('/api/products/master/external/coupang/TEST123');

    expect(response.status).toBe(200);
    expect(response.data.name).toBe('테스트 제품');
  });
});
```

---

## 8. 모니터링

### 8.1 주요 메트릭

| 메트릭 | 설명 | 임계값 |
|--------|------|--------|
| `product_master_count` | 등록된 제품 수 | - |
| `attribution_coverage` | Attribution 있는 이벤트 비율 | > 90% |
| `preference_update_latency` | 선호도 업데이트 지연 | < 100ms |
| `external_id_lookup_latency` | 외부 ID 조회 지연 | < 50ms |

### 8.2 알림 설정

```yaml
alerts:
  - name: low_attribution_coverage
    condition: attribution_coverage < 0.8
    severity: warning
    message: "Attribution 커버리지가 80% 미만입니다"

  - name: preference_update_slow
    condition: preference_update_latency_p95 > 200
    severity: warning
    message: "선호도 업데이트 지연이 200ms를 초과합니다"
```

---

## 9. 롤아웃 계획

### 9.1 단계별 배포

| 단계 | 기간 | 내용 |
|------|------|------|
| Alpha | Week 1 | 내부 테스트, 10% 트래픽 |
| Beta | Week 2 | 피처 플래그로 25% |
| GA | Week 3 | 전체 배포 |

### 9.2 롤백 계획

```bash
# 긴급 롤백 시
# 1. 피처 플래그 비활성화
UPDATE feature_flags SET enabled = false WHERE name = 'data_platform_l1';

# 2. 기존 analytics 로직으로 폴백
# (tracker.ts에 fallback 경로 유지)
```

---

## 10. 관련 문서

- [ADR-061: 데이터 플랫폼 아키텍처](../adr/ADR-061-data-platform-architecture.md)
- [원리: 데이터 플랫폼](../principles/data-platform.md)
- [L-R1: 전략 리서치](../research/claude-ai-research/L-R1-data-platform-strategy.md)
- [L-R2: 사례 분석](../research/claude-ai-research/L-R2-domestic-case-study.md)

---

**문서 상태**: 완료
**다음 단계**: 구현 시작
**검증자**: -
