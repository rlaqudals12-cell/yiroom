# 어필리에이트 연동 시스템 설계

> 버전: 1.2 | 작성일: 2025-12-29 | 상태: Phase 1 완료

## 1. 개요

### 1.1 목적
- 제품 이미지/데이터를 어필리에이트 파트너사로부터 자동 수집
- 사용자 구매 시 수수료 수익 창출
- 법적 리스크 없는 공식 데이터 확보
- **다중 채널 지원**: 사용자가 선호하는 쇼핑몰에서 구매 가능

### 1.2 타겟 파트너사

| 파트너사 | 카테고리 | 수수료율 | 우선순위 | 타겟 사용자 |
|---------|---------|---------|---------|------------|
| 쿠팡 파트너스 | 영양제, 화장품, 생활용품 | 1~3% | P0 | 한국 (빠른배송) |
| iHerb | 영양제, 건강식품 | 5~20% | P0 | 글로벌/가격민감 |
| 무신사 큐레이터 | 패션, 의류 | ~10% | P1 | 패션 관심층 |
| 네이버 쇼핑 | 전체 | 1~2% | P2 | 포인트 적립 선호 |

### 1.3 한국 소비자 구매 패턴 고려

```
┌─────────────────────────────────────────────────────────────┐
│  비타민 D 3000IU 추천                                        │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  어디서 구매하시겠어요?                                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   🚀 쿠팡   │  │  💰 iHerb  │  │  🎁 네이버  │        │
│  │  ₩15,900   │  │  ₩12,500   │  │  ₩16,200   │        │
│  │  내일 도착  │  │  7일 배송   │  │  포인트 5%  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**전략**: 동일 제품을 여러 파트너에서 검색하여 사용자에게 선택권 제공
- 빠른 배송 원하면 → 쿠팡
- 저렴한 가격 원하면 → iHerb
- 포인트 적립 원하면 → 네이버

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        이룸 어필리에이트 시스템                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │   iHerb     │    │    쿠팡     │    │   무신사    │            │
│  │  Partners   │    │  Partners   │    │  Curator    │            │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│         │                  │                  │                    │
│         ▼                  ▼                  ▼                    │
│  ┌─────────────────────────────────────────────────────┐          │
│  │              Affiliate Feed Importer                │          │
│  │  - CSV/JSON 파싱                                    │          │
│  │  - 이미지 URL 추출                                  │          │
│  │  - 가격/재고 동기화                                 │          │
│  └──────────────────────┬──────────────────────────────┘          │
│                         │                                          │
│                         ▼                                          │
│  ┌─────────────────────────────────────────────────────┐          │
│  │                 Supabase Database                   │          │
│  │  - affiliate_products (어필리에이트 제품)           │          │
│  │  - affiliate_clicks (클릭 추적)                     │          │
│  │  - affiliate_partners (파트너 설정)                 │          │
│  └──────────────────────┬──────────────────────────────┘          │
│                         │                                          │
│                         ▼                                          │
│  ┌─────────────────────────────────────────────────────┐          │
│  │                   이룸 앱 UI                         │          │
│  │  - ProductCard (어필리에이트 링크 포함)              │          │
│  │  - 클릭 트래킹                                       │          │
│  │  - 수익 대시보드                                     │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 데이터베이스 설계

### 3.1 affiliate_partners (파트너 설정)

```sql
CREATE TABLE affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 파트너 정보
  name TEXT NOT NULL UNIQUE,           -- 'iherb', 'coupang', 'musinsa'
  display_name TEXT NOT NULL,          -- '아이허브', '쿠팡', '무신사'
  logo_url TEXT,

  -- API 설정
  api_type TEXT NOT NULL,              -- 'csv_feed', 'rest_api', 'manual'
  api_endpoint TEXT,
  api_key_encrypted TEXT,              -- 암호화된 API 키

  -- 수수료 정보
  commission_rate_min DECIMAL(5,2),    -- 최소 수수료율 (%)
  commission_rate_max DECIMAL(5,2),    -- 최대 수수료율 (%)
  cookie_duration_days INTEGER,        -- 쿠키 유효 기간

  -- 동기화 설정
  sync_frequency_hours INTEGER DEFAULT 24,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',  -- 'pending', 'syncing', 'success', 'error'
  sync_error_message TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 affiliate_products (어필리에이트 제품)

```sql
CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 파트너 연결
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id),
  external_product_id TEXT NOT NULL,   -- 파트너사 제품 ID

  -- 제품 정보
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,                       -- 'supplement', 'cosmetic', 'fashion'
  subcategory TEXT,
  description TEXT,

  -- 이미지
  image_url TEXT,                      -- 메인 이미지
  image_urls TEXT[],                   -- 추가 이미지들
  thumbnail_url TEXT,                  -- 썸네일

  -- 가격
  price_krw INTEGER,
  price_original_krw INTEGER,          -- 정가 (할인 전)
  currency TEXT DEFAULT 'KRW',

  -- 어필리에이트 링크
  affiliate_url TEXT NOT NULL,         -- 트래킹 링크
  direct_url TEXT,                     -- 직접 링크 (참고용)

  -- 평점/리뷰
  rating DECIMAL(2,1),
  review_count INTEGER,

  -- 매칭 정보 (이룸 분석 연동)
  skin_types TEXT[],                   -- 피부 타입 매칭
  skin_concerns TEXT[],                -- 피부 고민 매칭
  personal_colors TEXT[],              -- 퍼스널 컬러 매칭
  body_types TEXT[],                   -- 체형 매칭

  -- 키워드/태그
  keywords TEXT[],
  tags TEXT[],

  -- 재고/상태
  is_in_stock BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- 동기화 정보
  last_synced_at TIMESTAMPTZ,
  sync_hash TEXT,                      -- 변경 감지용 해시

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크
  UNIQUE(partner_id, external_product_id)
);

-- 인덱스
CREATE INDEX idx_affiliate_products_partner ON affiliate_products(partner_id);
CREATE INDEX idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX idx_affiliate_products_skin_types ON affiliate_products USING GIN(skin_types);
CREATE INDEX idx_affiliate_products_personal_colors ON affiliate_products USING GIN(personal_colors);
CREATE INDEX idx_affiliate_products_active ON affiliate_products(is_active) WHERE is_active = true;
```

### 3.3 affiliate_clicks (클릭 추적)

```sql
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  product_id UUID NOT NULL REFERENCES affiliate_products(id),
  clerk_user_id TEXT,                  -- 로그인 사용자 (옵션)

  -- 컨텍스트
  source_page TEXT,                    -- 클릭 발생 페이지
  source_component TEXT,               -- 클릭 발생 컴포넌트
  recommendation_type TEXT,            -- 'skin_match', 'color_match', 'popular'

  -- 디바이스 정보
  user_agent TEXT,
  ip_hash TEXT,                        -- IP 해시 (익명화)

  -- 세션 정보
  session_id TEXT,

  -- 시간
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 전환 추적 (웹훅으로 업데이트)
  converted_at TIMESTAMPTZ,
  conversion_value_krw INTEGER,
  commission_krw INTEGER
);

-- 인덱스
CREATE INDEX idx_affiliate_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_user ON affiliate_clicks(clerk_user_id);
CREATE INDEX idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);
```

### 3.4 affiliate_daily_stats (일별 통계)

```sql
CREATE TABLE affiliate_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  partner_id UUID NOT NULL REFERENCES affiliate_partners(id),
  date DATE NOT NULL,

  -- 클릭 통계
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,

  -- 전환 통계
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),        -- %

  -- 수익 통계
  total_sales_krw INTEGER DEFAULT 0,
  total_commission_krw INTEGER DEFAULT 0,

  -- 상위 제품
  top_products JSONB,                  -- [{product_id, clicks, conversions}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(partner_id, date)
);
```

---

## 4. API 설계

### 4.1 제품 조회 API

```typescript
// GET /api/affiliate/products
interface AffiliateProductsRequest {
  partner?: string;           // 'iherb' | 'coupang' | 'musinsa'
  category?: string;
  skinTypes?: string[];       // 피부 타입 필터
  personalColors?: string[];  // 퍼스널 컬러 필터
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'rating' | 'price' | 'popular';
  limit?: number;
  offset?: number;
}

interface AffiliateProductsResponse {
  products: AffiliateProduct[];
  total: number;
  hasMore: boolean;
}
```

### 4.2 클릭 추적 API

```typescript
// POST /api/affiliate/click
interface AffiliateClickRequest {
  productId: string;
  sourcePage: string;
  sourceComponent: string;
  recommendationType?: string;
}

interface AffiliateClickResponse {
  success: boolean;
  redirectUrl: string;        // 어필리에이트 링크
}
```

### 4.3 피드 동기화 API (Admin)

```typescript
// POST /api/admin/affiliate/sync
interface AffiliateSyncRequest {
  partnerId: string;
  force?: boolean;            // 강제 동기화
}

interface AffiliateSyncResponse {
  success: boolean;
  productsAdded: number;
  productsUpdated: number;
  productsRemoved: number;
  duration: number;           // ms
}
```

---

## 5. 파트너별 연동 상세

### 5.1 iHerb 연동

```typescript
// iHerb Partnerize API 연동
interface IHerbConfig {
  network: 'partnerize';
  publisherId: string;
  apiKey: string;
  feedUrl: string;            // CSV 피드 URL
  imageBaseUrl: 'https://cloudinary.images-iherb.com';
}

// CSV 필드 매핑
const iherbFieldMapping = {
  'Product ID': 'external_product_id',
  'Product Name': 'name',
  'Brand': 'brand',
  'Category': 'category',
  'Price': 'price_krw',
  'Image URL': 'image_url',
  'Deep Link': 'affiliate_url',
  'Rating': 'rating',
  'Reviews': 'review_count',
};
```

### 5.2 쿠팡 파트너스 연동

```typescript
// 쿠팡 OPEN API 연동
interface CoupangConfig {
  accessKey: string;
  secretKey: string;
  baseUrl: 'https://api-gateway.coupang.com';
  vendorId: string;
}

// API 엔드포인트
const coupangEndpoints = {
  search: '/v2/providers/affiliate_open_api/apis/openapi/products/search',
  deeplink: '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink',
};
```

### 5.3 무신사 큐레이터 연동

```typescript
// 무신사 큐레이터 연동 (수동 + 딥링크)
interface MusinsaConfig {
  curatorId: string;
  baseDeeplink: 'https://www.musinsa.com/app/goods/{productId}?utm_source=curator&utm_medium={curatorId}';
}

// 초기: 수동 제품 등록 + 딥링크 생성
// 추후: API 파트너십 요청
```

---

## 6. 동기화 프로세스

### 6.1 자동 동기화 플로우

```
┌─────────────────────────────────────────────────────────────┐
│                    동기화 스케줄러 (Cron)                     │
│                     매일 04:00 KST 실행                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 활성 파트너 목록 조회                                    │
│     SELECT * FROM affiliate_partners WHERE is_active = true  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 파트너별 피드 다운로드                                   │
│     - iHerb: CSV 피드 다운로드                               │
│     - 쿠팡: API 호출 (카테고리별)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 데이터 변환 및 매핑                                      │
│     - 필드 매핑                                              │
│     - 가격 환율 변환 (iHerb)                                 │
│     - 이미지 URL 정규화                                      │
│     - 매칭 키워드 추출                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. DB 업서트                                                │
│     - 신규 제품 INSERT                                       │
│     - 기존 제품 UPDATE (가격, 재고)                          │
│     - 삭제된 제품 is_active = false                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. 통계 업데이트                                            │
│     - 동기화 결과 로깅                                       │
│     - 알림 발송 (에러 시)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 이미지 처리 전략

```typescript
// 이미지 URL 전략
const imageStrategy = {
  // 1순위: 파트너사 CDN 직접 링크 (핫링크 허용 시)
  directCdn: true,

  // 2순위: Supabase Storage 캐싱 (핫링크 불가 시)
  supabaseCache: {
    bucket: 'affiliate-images',
    maxSize: 500, // KB
    format: 'webp',
  },

  // 3순위: 플레이스홀더 (이미지 없을 시)
  placeholder: 'https://placehold.co/400x400/f0f0f0/888?text=No+Image',
};
```

---

## 7. UI 컴포넌트

### 7.1 AffiliateProductCard

```tsx
interface AffiliateProductCardProps {
  product: AffiliateProduct;
  matchScore?: number;        // 사용자 매칭 점수
  onProductClick?: () => void;
}

// 기존 ProductCard와 통합 또는 확장
// - 파트너 로고 표시
// - "외부 구매" 배지
// - 클릭 시 트래킹 후 리다이렉트
```

### 7.2 AffiliateDisclosure

```tsx
// 법적 고지 컴포넌트 (FTC/공정위 가이드라인)
function AffiliateDisclosure() {
  return (
    <p className="text-xs text-muted-foreground">
      이 페이지의 일부 링크는 제휴 링크입니다.
      구매 시 이룸에 소정의 수수료가 지급될 수 있습니다.
    </p>
  );
}
```

---

## 8. 구현 계획

### Phase 1: 기반 구축 (1주) ✅ 완료 (2025-12-29)
- [x] DB 마이그레이션 (affiliate_* 테이블 4개)
- [x] 타입 정의 (types/affiliate.ts)
- [x] Repository 패턴 구현 (lib/affiliate/)
- [x] 클릭 트래킹 API (POST /api/affiliate/click)
- [x] 제품 조회 API (GET /api/affiliate/products)

### Phase 2: 쿠팡 연동 (1주) ⏳ 다음
> 한국 사용자 우선 - 빠른 배송, 익숙한 플랫폼

- [ ] 쿠팡 파트너스 가입 및 승인
- [ ] OPEN API 연동 (Product Search API)
- [ ] 딥링크 생성 (트래킹 파라미터 포함)
- [ ] 제품 동기화 스크립트

### Phase 3: UI 통합 (1주)
> 다중 채널 구매 옵션 UI

- [ ] MultiChannelProductCard 컴포넌트
  - 동일 제품의 여러 파트너 가격 비교
  - 배송 속도 / 가격 / 포인트 표시
- [ ] 기존 제품 목록과 통합
- [ ] 클릭 트래킹 연동
- [ ] 법적 고지 추가 ("광고" 표시)

### Phase 4: iHerb 연동 (1주)
> 글로벌 사용자 & 가격 민감 사용자

- [ ] Partnerize 가입 및 승인
- [ ] CSV 피드 파서 구현
- [ ] 제품 동기화 스크립트
- [ ] 가격 비교 로직 (쿠팡 vs iHerb)

### Phase 5: 모니터링 & 최적화 (1주)
- [ ] 수익 대시보드 (파트너별 클릭/전환/수익)
- [ ] 일별 통계 집계
- [ ] A/B 테스트 (채널 순서 최적화)
- [ ] 알림 설정 (전환 발생 시)

---

## 9. 환경 변수

```bash
# .env.local

# iHerb / Partnerize
IHERB_PUBLISHER_ID=
IHERB_API_KEY=
IHERB_FEED_URL=

# 쿠팡 파트너스
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=
COUPANG_VENDOR_ID=

# 무신사 큐레이터
MUSINSA_CURATOR_ID=

# 암호화 키 (API 키 저장용)
AFFILIATE_ENCRYPTION_KEY=
```

---

## 10. 법적 고려사항

### 10.1 필수 고지
- 제휴 링크임을 명시 (FTC 가이드라인)
- "광고" 또는 "제휴" 라벨 표시

### 10.2 개인정보
- 클릭 데이터는 익명화 (IP 해시)
- GDPR/개인정보보호법 준수

### 10.3 파트너 정책
- 각 파트너사 이용약관 준수
- 이미지 사용 권한 확인

---

## 11. 성공 지표

| 지표 | 목표 (3개월) |
|------|-------------|
| 연동 제품 수 | 10,000+ |
| 월간 클릭 수 | 5,000+ |
| 전환율 | 2%+ |
| 월간 수익 | ₩50만+ |

---

**작성자**: Claude Code
**리뷰어**: -
**승인일**: -
