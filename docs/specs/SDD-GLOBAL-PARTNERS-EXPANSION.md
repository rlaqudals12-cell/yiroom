# SDD: 글로벌 파트너 확장 시스템 (Global Partners Expansion)

> **Version**: 1.0
> **Status**: `draft`
> **Created**: 2026-01-20
> **ADR 참조**: [ADR-029](../adr/ADR-029-affiliate-integration.md), [ADR-035](../adr/ADR-035-smart-link-routing.md)

---

## 1. 개요

### 1.1 목적

이룸의 어필리에이트 파트너십을 **글로벌 시장으로 확장**하고, 다양한 파트너사 API 통합 및 **지역별 법규 준수**를 구현하는 시스템.

### 1.2 확장 로드맵

```
Phase 1: 한국 (현재)
├── 쿠팡 파트너스
├── 무신사
├── 올리브영
└── iHerb

Phase 2: 일본 (2026 Q3)
├── Rakuten
├── Amazon Japan
└── @cosme

Phase 3: 미국 (2027 Q1)
├── Amazon Associates
├── Impact.com 네트워크
├── Sephora
└── Ulta Beauty
```

### 1.3 성공 기준

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 파트너 수 | 10+ | 연동 완료 파트너 |
| 글로벌 커버리지 | 3개국+ | 지원 국가 수 |
| 전환율 | 3%+ | 클릭 → 구매 비율 |
| 법규 준수 | 100% | 광고 표시 적합성 |

---

## P1: 궁극의 형태

### 이상적 최종 상태

- **글로벌 20+ 파트너** 통합으로 전 세계 뷰티/웰니스 시장 커버
- **자동 파트너 선택**: 사용자 위치, 선호도 기반 최적 파트너 자동 매칭
- **실시간 가격 비교**: 동일 상품 다중 파트너 가격/재고 실시간 표시
- **통합 대시보드**: 모든 파트너 수익/성과 단일 뷰

### 물리적 한계

- 각 파트너 API 속도/제한
- 국가별 법규 차이 (GDPR, FTC, 경품법 등)
- 환율 변동

### 100점 기준

| 항목 | 100점 기준 |
|------|-----------|
| 파트너 수 | 20+ 글로벌 파트너 |
| 응답 시간 | 파트너 API 호출 < 500ms |
| 커버리지 | 5개국+ |
| 전환율 | 5%+ |

### 현재 목표

**45%** - Phase 1 한국 시장 4개 파트너 완료

### 의도적 제외

- 중국 시장 (규제 복잡성)
- 소규모 지역 파트너 (ROI 낮음)

---

## 2. 파트너 통합 아키텍처

### 2.1 추상화 레이어

```
┌─────────────────────────────────────────────────────────────┐
│                    파트너 추상화 아키텍처                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   이룸 앱                                                    │
│       │                                                      │
│       ▼                                                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Affiliate Service Layer                 │   │
│   │  - 파트너 추상화 인터페이스                           │   │
│   │  - 통합 상품 검색 API                                │   │
│   │  - 통합 링크 생성                                    │   │
│   │  - 통합 수익 추적                                    │   │
│   └────────────────────────┬────────────────────────────┘   │
│                            │                                 │
│       ┌────────────────────┼────────────────────┐           │
│       │                    │                    │           │
│       ▼                    ▼                    ▼           │
│   ┌────────┐          ┌────────┐          ┌────────┐       │
│   │ 쿠팡   │          │ Rakuten│          │ Amazon │       │
│   │Adapter │          │Adapter │          │Adapter │       │
│   └────┬───┘          └────┬───┘          └────┬───┘       │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│   쿠팡 API            Rakuten API         Amazon API       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 파트너 인터페이스

```typescript
// lib/affiliate/types.ts

/**
 * 파트너 어댑터 인터페이스
 * 모든 파트너는 이 인터페이스를 구현해야 함
 */
export interface AffiliatePartnerAdapter {
  // 파트너 ID
  readonly partnerId: string;

  // 지원 국가
  readonly supportedRegions: Region[];

  // 상품 검색
  searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult>;

  // 상품 상세 조회
  getProduct(productId: string): Promise<Product | null>;

  // 어필리에이트 링크 생성
  generateAffiliateLink(product: Product, options?: LinkOptions): Promise<AffiliateLink>;

  // 수익 조회 (선택적)
  getEarnings?(period: DateRange): Promise<EarningsReport>;

  // 상품 카테고리 매핑
  mapCategory(internalCategory: string): string;

  // 건강 체크
  healthCheck(): Promise<HealthCheckResult>;
}

export interface ProductSearchQuery {
  keyword: string;
  category?: string;
  priceRange?: { min?: number; max?: number };
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
}

export interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

export interface Product {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  // 색상 분류 (자동 추출)
  colorClassification?: ColorClassificationResult;
}

export interface AffiliateLink {
  url: string;
  shortUrl?: string;  // Branch.io 단축 URL
  trackingId: string;
  expiresAt?: Date;
  deepLinkData?: DeepLinkData;
}
```

### 2.3 어댑터 구현 예시

```typescript
// lib/affiliate/adapters/coupang-adapter.ts

export class CoupangAdapter implements AffiliatePartnerAdapter {
  readonly partnerId = 'coupang';
  readonly supportedRegions: Region[] = ['KR'];

  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly subId: string;

  constructor(config: CoupangConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.subId = config.subId;
  }

  async searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult> {
    const params = {
      keyword: query.keyword,
      limit: query.pageSize || 20,
      subId: this.subId,
    };

    const response = await this.callApi('/v2/providers/affiliate_open_api/apis/openapi/v1/products/search', params);

    return {
      products: response.data.productData.map(this.mapProduct),
      totalCount: response.data.totalCount,
      page: query.page || 1,
      hasMore: response.data.totalCount > (query.page || 1) * (query.pageSize || 20),
    };
  }

  async getProduct(productId: string): Promise<Product | null> {
    const response = await this.callApi(`/v2/providers/affiliate_open_api/apis/openapi/v1/products/${productId}`);

    if (!response.data) return null;
    return this.mapProduct(response.data);
  }

  async generateAffiliateLink(product: Product, options?: LinkOptions): Promise<AffiliateLink> {
    const response = await this.callApi('/v2/providers/affiliate_open_api/apis/openapi/deeplink', {
      coupangUrls: [product.productUrl],
      subId: options?.subId || this.subId,
    });

    return {
      url: response.data[0].affiliateUrl,
      trackingId: response.data[0].trackingId,
    };
  }

  mapCategory(internalCategory: string): string {
    const mapping: Record<string, string> = {
      'skincare': '화장품/미용 > 스킨케어',
      'makeup': '화장품/미용 > 메이크업',
      'fashion_women': '패션의류 > 여성의류',
      'fashion_men': '패션의류 > 남성의류',
      'supplements': '건강식품',
    };
    return mapping[internalCategory] || internalCategory;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.callApi('/v2/providers/affiliate_open_api/apis/openapi/v1/products/search', { keyword: 'test', limit: 1 });
      return { healthy: true, latencyMs: 0 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  private mapProduct(raw: any): Product {
    return {
      id: raw.productId.toString(),
      partnerId: this.partnerId,
      name: raw.productName,
      description: raw.productDescription,
      price: raw.productPrice,
      currency: 'KRW',
      originalPrice: raw.originalPrice,
      discountPercent: raw.discountRate,
      imageUrl: raw.productImage,
      productUrl: raw.productUrl,
      category: raw.categoryName,
      brand: raw.brandName,
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      inStock: raw.isAvailable,
    };
  }

  private async callApi(path: string, params?: object): Promise<any> {
    // HMAC 서명 생성 및 API 호출
    // 쿠팡 파트너스 API 사양에 따른 구현
  }
}
```

---

## 3. 지역별 파트너 설정

### 3.1 한국 (KR)

| 파트너 | 카테고리 | 커미션 | API 유형 |
|--------|----------|--------|----------|
| **쿠팡** | 전체 | 3-10% | REST |
| **무신사** | 패션 | 5-8% | REST |
| **올리브영** | 뷰티 | 5-7% | REST |
| **iHerb** | 건강식품 | 5-10% | REST |

### 3.2 일본 (JP) - 계획

| 파트너 | 카테고리 | 커미션 | API 유형 |
|--------|----------|--------|----------|
| **Rakuten** | 전체 | 1-8% | REST |
| **Amazon JP** | 전체 | 2-10% | PA-API |
| **@cosme** | 뷰티 | 5-8% | REST |

### 3.3 미국 (US) - 계획

| 파트너 | 카테고리 | 커미션 | API 유형 |
|--------|----------|--------|----------|
| **Amazon** | 전체 | 1-10% | PA-API |
| **Impact.com** | 다수 브랜드 | 가변 | REST |
| **Sephora** | 뷰티 | 5% | REST |
| **Ulta** | 뷰티 | 5% | REST |

### 3.4 파트너 설정 파일

```typescript
// lib/affiliate/config/partners.ts

export const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  coupang: {
    id: 'coupang',
    name: '쿠팡',
    region: 'KR',
    categories: ['all'],
    adapter: 'CoupangAdapter',
    credentials: {
      apiKey: process.env.COUPANG_API_KEY!,
      secretKey: process.env.COUPANG_SECRET_KEY!,
      subId: process.env.COUPANG_SUB_ID!,
    },
    rateLimit: {
      requestsPerSecond: 10,
      requestsPerDay: 10000,
    },
    deepLink: {
      iosScheme: 'coupang://',
      androidPackage: 'com.coupang.mobile',
    },
  },

  rakuten: {
    id: 'rakuten',
    name: '楽天',
    region: 'JP',
    categories: ['all'],
    adapter: 'RakutenAdapter',
    credentials: {
      applicationId: process.env.RAKUTEN_APP_ID!,
      affiliateId: process.env.RAKUTEN_AFFILIATE_ID!,
    },
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
    deepLink: {
      iosScheme: 'rakuten://',
      androidPackage: 'jp.co.rakuten.android',
    },
  },

  amazon_us: {
    id: 'amazon_us',
    name: 'Amazon',
    region: 'US',
    categories: ['all'],
    adapter: 'AmazonAdapter',
    credentials: {
      accessKey: process.env.AMAZON_ACCESS_KEY!,
      secretKey: process.env.AMAZON_SECRET_KEY!,
      partnerTag: process.env.AMAZON_PARTNER_TAG!,
    },
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 8640,
    },
    deepLink: {
      iosScheme: 'amzn://',
      androidPackage: 'com.amazon.mShop.android.shopping',
    },
  },
};
```

---

## 4. 법규 준수

### 4.1 광고 표시 규정

| 국가 | 규정 | 요구사항 |
|------|------|----------|
| **한국** | 표시광고법 | "광고" 또는 "협찬" 명시 |
| **일본** | 景品表示法 | "PR" 또는 "広告" 명시 |
| **미국** | FTC Guidelines | "Affiliate Link" 또는 "#ad" 명시 |
| **EU** | GDPR + eCommerce Directive | 명확한 광고 표시 + 쿠키 동의 |

### 4.2 표시 컴포넌트

```tsx
// components/affiliate/AffiliateDisclosure.tsx

interface AffiliateDisclosureProps {
  region: Region;
  variant?: 'inline' | 'banner' | 'tooltip';
}

const DISCLOSURE_TEXT: Record<Region, string> = {
  KR: '이 링크를 통해 구매 시 이룸이 수수료를 받을 수 있습니다.',
  JP: 'このリンクからの購入で、Yiroomはアフィリエイト収益を得ることがあります。',
  US: 'As an affiliate, Yiroom earns from qualifying purchases.',
  EU: 'This is an affiliate link. We may earn a commission from purchases.',
};

export function AffiliateDisclosure({ region, variant = 'inline' }: AffiliateDisclosureProps) {
  const text = DISCLOSURE_TEXT[region];

  if (variant === 'inline') {
    return (
      <span className="text-xs text-muted-foreground">
        광고 · {text}
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-muted p-2 text-xs text-center">
        {region === 'KR' && '광고'}
        {region === 'JP' && 'PR'}
        {region === 'US' && 'Sponsored'}
        {' · '}
        {text}
      </div>
    );
  }

  return null;
}
```

### 4.3 지역별 가격 표시

```typescript
// lib/affiliate/utils/price-formatter.ts

interface PriceDisplayOptions {
  amount: number;
  currency: Currency;
  region: Region;
  showOriginal?: boolean;
  originalAmount?: number;
}

export function formatPrice(options: PriceDisplayOptions): string {
  const { amount, currency, region } = options;

  const formatters: Record<Region, Intl.NumberFormat> = {
    KR: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }),
    JP: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
    US: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EU: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  };

  return formatters[region].format(amount);
}

// 세금 표시 (일본)
export function formatPriceWithTax(price: number, region: Region): {
  priceWithTax: string;
  taxNote?: string;
} {
  if (region === 'JP') {
    const taxRate = 0.10;  // 10% 소비세
    const priceWithTax = price * (1 + taxRate);
    return {
      priceWithTax: formatPrice({ amount: priceWithTax, currency: 'JPY', region: 'JP' }),
      taxNote: '税込',
    };
  }

  return {
    priceWithTax: formatPrice({ amount: price, currency: getCurrency(region), region }),
  };
}
```

---

## 5. 통합 상품 검색

### 5.1 멀티 파트너 검색

```typescript
// lib/affiliate/services/product-search.ts

interface MultiPartnerSearchOptions {
  query: string;
  category?: string;
  region: Region;
  partners?: string[];  // 특정 파트너만 검색 (선택)
  limit?: number;
  sortBy?: 'relevance' | 'price' | 'rating';
}

async function searchProductsMultiPartner(
  options: MultiPartnerSearchOptions
): Promise<{
  products: Product[];
  byPartner: Record<string, Product[]>;
  totalCount: number;
}> {
  const { query, category, region, partners, limit = 20 } = options;

  // 해당 지역의 활성 파트너 조회
  const activePartners = partners
    ? partners.filter(p => PARTNER_CONFIGS[p]?.region === region)
    : Object.values(PARTNER_CONFIGS)
        .filter(p => p.region === region)
        .map(p => p.id);

  // 병렬 검색
  const results = await Promise.allSettled(
    activePartners.map(async partnerId => {
      const adapter = getAdapter(partnerId);
      const result = await adapter.searchProducts({
        keyword: query,
        category: category ? adapter.mapCategory(category) : undefined,
        pageSize: Math.ceil(limit / activePartners.length),
      });
      return { partnerId, products: result.products };
    })
  );

  // 결과 집계
  const byPartner: Record<string, Product[]> = {};
  const allProducts: Product[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      byPartner[result.value.partnerId] = result.value.products;
      allProducts.push(...result.value.products);
    }
  }

  // 정렬 및 제한
  const sortedProducts = sortProducts(allProducts, options.sortBy || 'relevance');
  const limitedProducts = sortedProducts.slice(0, limit);

  return {
    products: limitedProducts,
    byPartner,
    totalCount: allProducts.length,
  };
}
```

### 5.2 색상 매칭 통합 검색

```typescript
// lib/affiliate/services/color-matched-search.ts

interface ColorMatchedSearchOptions {
  query: string;
  userSeason: SeasonType;
  region: Region;
  minMatchRate?: number;  // 최소 매칭률 (기본 60)
}

async function searchWithColorMatch(
  options: ColorMatchedSearchOptions
): Promise<ColorMatchedProduct[]> {
  const { query, userSeason, region, minMatchRate = 60 } = options;

  // 기본 검색
  const searchResult = await searchProductsMultiPartner({
    query,
    region,
    limit: 50,  // 더 많이 검색 후 필터링
  });

  // 색상 분류 및 매칭 (병렬)
  const productsWithColor = await Promise.all(
    searchResult.products.map(async product => {
      try {
        const colorResult = await classifyProductColor(product.imageUrl);
        const matchRate = colorResult.seasonMatch[userSeason];

        return {
          ...product,
          colorClassification: colorResult,
          matchRate,
        };
      } catch {
        return {
          ...product,
          matchRate: 50,  // 분류 실패 시 기본값
        };
      }
    })
  );

  // 매칭률 필터링 및 정렬
  return productsWithColor
    .filter(p => p.matchRate >= minMatchRate)
    .sort((a, b) => b.matchRate - a.matchRate);
}
```

---

## 6. 수익 추적

### 6.1 통합 대시보드 데이터

```typescript
// lib/affiliate/services/earnings-tracker.ts

interface EarningsSummary {
  period: DateRange;
  totalEarnings: number;
  currency: Currency;

  byPartner: Record<string, {
    earnings: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;

  byCategory: Record<string, number>;

  trend: {
    date: string;
    earnings: number;
  }[];
}

async function getEarningsSummary(
  userId: string,
  period: DateRange
): Promise<EarningsSummary> {
  // 각 파트너별 수익 조회 (API 지원 시)
  const partnerEarnings = await Promise.all(
    Object.keys(PARTNER_CONFIGS).map(async partnerId => {
      const adapter = getAdapter(partnerId);
      if (adapter.getEarnings) {
        const earnings = await adapter.getEarnings(period);
        return { partnerId, earnings };
      }
      return { partnerId, earnings: null };
    })
  );

  // 내부 클릭 로그 집계
  const clickLogs = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('clerk_user_id', userId)
    .gte('clicked_at', period.start)
    .lte('clicked_at', period.end);

  // 집계 로직
  // ...

  return summary;
}
```

---

## 7. 원자 분해 (P3)

| ID | 원자 | 입력 | 출력 | 시간 |
|----|------|------|------|------|
| GP-1 | 파트너 인터페이스 | 설계 | 타입 정의 | 2h |
| GP-2 | 쿠팡 어댑터 | API 스펙 | 어댑터 | 4h |
| GP-3 | 무신사 어댑터 | API 스펙 | 어댑터 | 3h |
| GP-4 | Rakuten 어댑터 | API 스펙 | 어댑터 | 4h |
| GP-5 | Amazon 어댑터 | PA-API 스펙 | 어댑터 | 5h |
| GP-6 | 멀티 파트너 검색 | 어댑터 | 통합 검색 | 3h |
| GP-7 | 법규 준수 컴포넌트 | 지역 | 표시 UI | 2h |
| GP-8 | 수익 추적 | 로그 | 대시보드 | 3h |
| GP-9 | 테스트 | 코드 | 테스트 | 3h |

**총 예상 시간**: 29시간

---

## 8. 관련 문서

| 문서 | 관계 |
|------|------|
| [ADR-029](../adr/ADR-029-affiliate-integration.md) | 어필리에이트 통합 결정 |
| [ADR-035](../adr/ADR-035-smart-link-routing.md) | 스마트 링크 |
| [SDD-AUTO-COLOR-CLASSIFICATION](./SDD-AUTO-COLOR-CLASSIFICATION.md) | 색상 매칭 |
| [fashion-matching.md](../principles/fashion-matching.md) | 매칭 원리 |

---

**Author**: Claude Code
**Reviewed by**: -
