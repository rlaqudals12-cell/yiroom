# SDD: 어필리에이트 통합

> **Status**: v1 Implemented / v2 Planned
> **Version**: 2.0
> **Created**: 2026-01-19
> **Updated**: 2026-02-10
> **Phase**: L (수익화)

> 멀티 파트너 어필리에이트 + 5모듈 완전 커버 (PC-1, S-1, C-1, H-1, M-1)

## 관련 문서

### 원리 문서

- [product-matching.md](../principles/product-matching.md) - 제품 매칭 원리 (2축 스코어링)
- [원리: 법적 준수](../principles/legal-compliance.md) - 전자상거래법, 광고 표시 의무

### ADR

- [ADR-029: 어필리에이트 통합](../adr/ADR-029-affiliate-integration.md) - 기본 아키텍처
- [ADR-054: 어필리에이트 우선 수익화](../adr/ADR-054-affiliate-first-monetization.md) - 비즈니스 전략
- [ADR-067: 파트너 API 전략](../adr/ADR-067-affiliate-partner-api-strategy.md) - 파트너 선정 및 모듈 확장
- [ADR-032: 스마트 매칭](../adr/ADR-032-smart-matching.md) - 매칭 알고리즘

### 리서치

- [AFFILIATE-API-COMPARISON-RESEARCH.md](../research/claude-ai-research/AFFILIATE-API-COMPARISON-RESEARCH.md) - 어필리에이트 API 비교

---

## v2 변경 사항 요약

| 항목          | v1 (구현 완료)                    | v2 (계획)                                                         |
| ------------- | --------------------------------- | ----------------------------------------------------------------- |
| 파트너        | 쿠팡, iHerb, 무신사 (시드 데이터) | 쿠팡 API, CJ Affiliate, Amazon Creators                           |
| 모듈 커버리지 | PC-1, S-1, C-1                    | + H-1, M-1 (5모듈 완전 커버)                                      |
| 이미지/URL    | 모두 null (시드)                  | 파트너 API에서 실시간 조회                                        |
| 아키텍처      | partners/ 디렉토리                | Adapter Pattern (OCP)                                             |
| 카테고리      | 화장품 7종                        | + 헤어케어 4종 (shampoo, conditioner, hair-treatment, scalp-care) |

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"5개 분석 모듈의 결과가 실시간 파트너 API와 연동되어, 개인화 제품을 이미지/가격 포함하여 추천하고 원클릭 구매로 연결되는 상태"

- **매칭 정확도**: AI 기반 개인화 매칭 95%+ 적합도
- **모듈 커버리지**: 5/5 모듈 (PC-1, S-1, C-1, H-1, M-1)
- **제품 이미지**: 100% 보유 (파트너 API 소싱)
- **파트너 다양성**: 10+ 파트너 (KR + Global)
- **전환 추적**: 클릭 → 구매 전환 100% 추적

### 물리적 한계

| 한계               | 설명                                            |
| ------------------ | ----------------------------------------------- |
| 파트너 API         | 파트너별 API 규격/제한 상이                     |
| Amazon PA-API 폐기 | 2026-04-30 폐기. Creators API 마이그레이션 필수 |
| 올리브영 API 부재  | 직접 API 없음, 중개 네트워크만 가능             |
| iHerb API 부재     | 공식 API 없음                                   |
| 커미션율           | 카테고리/파트너별 커미션율 변동                 |

### 100점 기준

| 항목          | 100점 기준 | v1 현재       | v2 목표       | 달성률  |
| ------------- | ---------- | ------------- | ------------- | ------- |
| 모듈 커버리지 | 5/5        | 3/5           | 5/5           | 60→100% |
| 파트너 수     | 10개       | 0 (시드만)    | 3개           | 0→30%   |
| 매칭 정확도   | AI 95%     | 규칙 기반 70% | 규칙 기반 80% | 74→84%  |
| 제품 이미지   | 100%       | 0%            | 80%+          | 0→80%   |
| 전환 추적     | 100%       | 코드만        | 웹훅 기반     | 0→80%   |

### 현재 목표

**종합 달성률**: v1 40% → **v2 목표 60%**

### 의도적 제외 (v2)

| 제외 항목          | 사유                 | 재검토 시점        |
| ------------------ | -------------------- | ------------------ |
| ML 기반 랭킹       | 데이터 축적 필요     | 전환 데이터 6개월+ |
| 실시간 재고 연동   | 대부분 파트너 미제공 | 파트너 협의 시     |
| 올리브영 직접 연동 | API 부재             | 공식 API 출시 시   |
| 일본/동남아 파트너 | KR+글로벌 우선       | Phase 3            |

---

## 1. 비즈니스 목표

### 핵심 가치

- 5개 분석 모듈 기반 완전한 개인화 제품 추천
- 어필리에이트 수익 창출 (초기 수익 모델)
- 실제 이미지/가격 포함 신뢰할 수 있는 제품 정보

### 파트너 (v2 — ADR-067 결정)

| 우선순위 | 파트너          | API 방식         | 커미션율 | 커버 모듈        |
| -------- | --------------- | ---------------- | -------- | ---------------- |
| P1       | 쿠팡 파트너스   | Open API (REST)  | 3-10%    | S-1, C-1, H-1    |
| P2       | CJ Affiliate    | REST API         | 5-10%    | PC-1, M-1, S-1   |
| P3       | Amazon Creators | OAuth 2.0 + REST | 1-10%    | 전 모듈 (글로벌) |

---

## 2. 기능 스펙

### 2.1 구현 현황

| 기능          | 상태    | 위치                         |
| ------------- | ------- | ---------------------------- |
| 제품 조회     | ✅ 완료 | `/api/affiliate/products/`   |
| 딥링크 생성   | ✅ 완료 | `/api/affiliate/deeplink/`   |
| 클릭 추적     | ✅ 완료 | `/api/affiliate/click/`      |
| 전환 추적     | ✅ 완료 | `/api/affiliate/conversion/` |
| 파트너별 검색 | ✅ 완료 | `/api/affiliate/*/search/`   |
| 제품 동기화   | ✅ 완료 | `/api/affiliate/*/sync/`     |

### 2.2 API 엔드포인트

| 엔드포인트                      | 메서드 | 설명                  |
| ------------------------------- | ------ | --------------------- |
| `/api/affiliate/products`       | GET    | 제품 조회 (필터/정렬) |
| `/api/affiliate/deeplink`       | POST   | 딥링크 생성           |
| `/api/affiliate/click`          | POST   | 클릭 기록             |
| `/api/affiliate/conversion`     | POST   | 전환 기록 (웹훅)      |
| `/api/affiliate/stats`          | GET    | 통계 조회             |
| `/api/affiliate/coupang/search` | GET    | 쿠팡 검색             |
| `/api/affiliate/coupang/sync`   | POST   | 쿠팡 동기화           |
| `/api/affiliate/iherb/search`   | GET    | iHerb 검색            |
| `/api/affiliate/iherb/sync`     | POST   | iHerb 동기화          |
| `/api/affiliate/musinsa/search` | GET    | 무신사 검색           |
| `/api/affiliate/musinsa/sync`   | POST   | 무신사 동기화         |

---

## 3. 제품 매칭

> 원리: [product-matching.md](../principles/product-matching.md) — 2축 스코어링 (도메인 0-50 + 대중성 0-50)

### 3.1 매칭 속성 (v2 확장)

```typescript
interface AffiliateProductFilter {
  // 파트너
  partnerId?: string;

  // 카테고리 (v2: 헤어케어 추가)
  category?: 'supplement' | 'cosmetic' | 'fashion' | 'haircare' | 'equipment';

  // 피부 분석 매칭 (S-1)
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];

  // 퍼스널컬러 매칭 (PC-1)
  personalColors?: AffiliatePersonalColor[];

  // 체형 매칭 (C-1)
  bodyTypes?: AffiliateBodyType[];

  // 헤어 매칭 (H-1, v2 추가)
  hairTypes?: AffiliateHairType[];
  scalpTypes?: AffiliateScalpType[];

  // 메이크업 세분화 (M-1, v2 추가)
  faceShapes?: string[];
  undertones?: AffiliateUndertone[];
  makeupSubcategory?: AffiliateMakeupSubcategory;

  // 가격/평점
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;

  // 재고
  inStockOnly?: boolean;
}

type AffiliateSkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
type AffiliateSkinConcern = 'acne' | 'wrinkle' | 'pigmentation' | 'redness' | 'pore';
type AffiliatePersonalColor = 'spring' | 'summer' | 'autumn' | 'winter';
type AffiliateBodyType = 'hourglass' | 'apple' | 'pear' | 'rectangle' | 'inverted';

// v2 추가 타입
type AffiliateHairType = 'straight' | 'wavy' | 'curly' | 'coily';
type AffiliateScalpType = 'dry' | 'oily' | 'sensitive' | 'normal';
type AffiliateUndertone = 'warm' | 'cool' | 'neutral';
type AffiliateMakeupSubcategory = 'foundation' | 'lip' | 'eye' | 'blush' | 'brow' | 'contour';
```

### 3.2 모듈별 매칭 로직 (v2)

```typescript
// 분석 결과 → 제품 필터 변환 (5모듈)
function analysisToFilter(
  analysis: UserAnalysis,
  module: 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup'
): AffiliateProductFilter {
  const base: AffiliateProductFilter = {};

  switch (module) {
    case 'personal-color': // PC-1
      base.personalColors = analysis.personalColor ? [analysis.personalColor.season] : undefined;
      base.category = 'cosmetic';
      base.makeupSubcategory = undefined; // 전체 메이크업
      break;

    case 'skin': // S-1
      base.skinTypes = analysis.skinType ? [analysis.skinType] : undefined;
      base.skinConcerns = analysis.concerns;
      base.category = 'cosmetic';
      break;

    case 'body': // C-1
      base.bodyTypes = analysis.bodyType ? [analysis.bodyType] : undefined;
      base.category = 'equipment';
      break;

    case 'hair': // H-1 (v2 추가)
      base.hairTypes = analysis.hairType ? [analysis.hairType] : undefined;
      base.scalpTypes = analysis.scalpType ? [analysis.scalpType] : undefined;
      base.category = 'haircare';
      break;

    case 'makeup': // M-1 (v2 추가)
      base.personalColors = analysis.personalColor ? [analysis.personalColor.season] : undefined;
      base.undertones = analysis.undertone ? [analysis.undertone] : undefined;
      base.faceShapes = analysis.faceShape ? [analysis.faceShape] : undefined;
      base.category = 'cosmetic';
      break;
  }

  return base;
}
```

---

## 4. 딥링크 생성

### 4.1 파트너별 형식 (v2)

```typescript
const DEEPLINK_TEMPLATES = {
  coupang: {
    template: 'https://link.coupang.com/re/AFFILIATE?itemId={productId}&subId={trackingId}',
    requiresAuth: true,
    // 쿠팡 Open API로 딥링크 자동 생성
  },
  cj: {
    template:
      'https://www.anrdoezrs.net/click-{publisherId}-{advertiserId}?url={encodedProductUrl}&sid={trackingId}',
    requiresAuth: true,
    // CJ Affiliate REST API로 딥링크 생성
  },
  amazon: {
    template:
      'https://www.amazon.com/dp/{asin}?tag={associateTag}&linkCode=ogi&th=1&psc=1&camp={trackingId}',
    requiresAuth: true,
    // Amazon Creators API (PA-API 후속)
  },
};
```

### 4.2 추적 ID 생성

```typescript
// 추적 ID: userId_productId_timestamp
function generateTrackingId(userId: string, productId: string): string {
  const timestamp = Date.now().toString(36);
  return `${userId.slice(-8)}_${productId}_${timestamp}`;
}
```

---

## 5. 법적 준수

### 5.1 광고 표시 의무

```typescript
// 모든 어필리에이트 제품에 필수 표시
const AD_DISCLOSURE = {
  badge: 'AD',
  tooltip: '이 제품은 제휴 마케팅을 통해 수수료를 받을 수 있습니다.',
  position: 'top-right',
};
```

### 5.2 UI 표시

```tsx
// 제품 카드에 AD 뱃지 필수
<div className="relative">
  <Badge className="absolute top-2 right-2 bg-gray-100 text-gray-600">AD</Badge>
  <ProductCard product={product} />
</div>
```

---

## 6. 구현 상세

### 6.1 파일 구조 (v2 — Adapter Pattern)

```
apps/web/
├── app/api/affiliate/
│   ├── products/route.ts       # 제품 조회
│   ├── deeplink/route.ts       # 딥링크 생성
│   ├── click/route.ts          # 클릭 기록
│   ├── conversion/route.ts     # 전환 기록
│   ├── stats/route.ts          # 통계
│   └── sync/route.ts           # 통합 동기화 (v2: 파트너 자동 라우팅)
├── lib/affiliate/
│   ├── index.ts                # 공개 API (Barrel Export)
│   ├── types.ts                # PartnerAdapter 인터페이스, 공개 타입
│   ├── adapters/               # v2: Adapter Pattern
│   │   ├── coupang.ts          # 쿠팡 파트너스 API 어댑터
│   │   ├── cj-affiliate.ts     # CJ Affiliate (Sephora) 어댑터
│   │   └── amazon-creators.ts  # Amazon Creators API 어댑터
│   ├── product-sync.ts         # 배치 동기화 로직
│   └── internal/
│       ├── deeplink-generator.ts  # 딥링크 생성
│       └── commission-tracker.ts  # 커미션 추적
├── types/affiliate.ts          # 타입 정의
└── components/products/
    ├── ProductCard.tsx         # 제품 카드
    ├── ProductGrid.tsx         # 제품 그리드
    └── AdBadge.tsx             # AD 뱃지
```

### 6.2 PartnerAdapter 인터페이스 (v2 추가)

```typescript
// lib/affiliate/types.ts
interface PartnerAdapter {
  partnerId: string;

  /** 제품 검색 (이미지/가격 포함) */
  searchProducts(query: ProductSearchQuery): Promise<PartnerProduct[]>;

  /** 딥링크 생성 */
  generateDeeplink(productId: string, trackingParams: TrackingParams): string;

  /** 웹훅 파싱 (전환 추적) */
  parseConversionWebhook(payload: unknown): ConversionEvent | null;

  /** 제품 상세 (단일) */
  getProductDetail(productId: string): Promise<PartnerProduct | null>;
}

interface PartnerProduct {
  externalId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string; // 파트너 API에서 제공
  productUrl: string; // 딥링크 URL
  brand?: string;
  rating?: number;
  reviewCount?: number;
  category: string;
}
```

### 6.3 모듈→파트너 라우팅 (v2 추가)

```typescript
// 분석 모듈에 따라 적절한 파트너 선택
const MODULE_PARTNER_MAP: Record<string, { primary: string; fallback: string }> = {
  'personal-color': { primary: 'cj', fallback: 'coupang' },
  skin: { primary: 'coupang', fallback: 'cj' },
  body: { primary: 'coupang', fallback: 'amazon' },
  hair: { primary: 'coupang', fallback: 'amazon' },
  makeup: { primary: 'cj', fallback: 'coupang' },
};
```

---

## 7. 데이터베이스

### 7.1 스키마

```sql
-- 제품 (v2: 헤어케어/메이크업 필드 추가)
CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL,        -- 'coupang' | 'cj' | 'amazon'
  external_id TEXT NOT NULL,       -- 파트너 제품 ID
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,
  original_price INT,
  image_url TEXT,
  product_url TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  rating DECIMAL(2,1),
  review_count INT DEFAULT 0,
  -- 매칭 필드
  skin_types TEXT[] DEFAULT '{}',
  skin_concerns TEXT[] DEFAULT '{}',
  personal_colors TEXT[] DEFAULT '{}',
  body_types TEXT[] DEFAULT '{}',
  -- v2 추가: H-1 헤어케어
  hair_types TEXT[] DEFAULT '{}',    -- 'straight', 'wavy', 'curly', 'coily'
  scalp_types TEXT[] DEFAULT '{}',   -- 'dry', 'oily', 'sensitive', 'normal'
  -- v2 추가: M-1 메이크업 세분화
  face_shapes TEXT[] DEFAULT '{}',   -- 'round', 'oval', 'square', 'heart', 'long'
  undertones TEXT[] DEFAULT '{}',    -- 'warm', 'cool', 'neutral'
  makeup_subcategory TEXT,           -- 'foundation', 'lip', 'eye', 'blush', 'brow', 'contour'
  -- 상태
  in_stock BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, external_id)
);

-- 클릭 추적
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,              -- NULL = 비회원
  product_id UUID REFERENCES affiliate_products(id),
  tracking_id TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 전환 추적
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES affiliate_clicks(id),
  product_id UUID REFERENCES affiliate_products(id),
  tracking_id TEXT NOT NULL,
  order_amount INT,
  commission_amount INT,
  status TEXT DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. 원자 분해 (P3)

### 8.1 ATOM 테이블

| ID                        | 원자                           | 입력                     | 출력               | 시간 | 의존성       |
| ------------------------- | ------------------------------ | ------------------------ | ------------------ | ---- | ------------ |
| **Core**                  |                                |                          |                    |      |
| AF-A1                     | 제품 조회 API                  | `AffiliateProductFilter` | `Product[]`        | 1.5h | -            |
| AF-A2                     | 딥링크 생성 API                | `productId`, `userId`    | `deepLinkUrl`      | 1h   | AF-A1        |
| AF-A3                     | 클릭 추적 API                  | `trackingId`, 메타데이터 | `clickId`          | 1h   | AF-A2        |
| AF-A4                     | 전환 추적 API (웹훅)           | 파트너 콜백              | `conversionId`     | 1.5h | AF-A3        |
| AF-A5                     | 통계 조회 API                  | `dateRange`, `partnerId` | `AffiliateStats`   | 1h   | AF-A3, AF-A4 |
| **Partners (v2)**         |                                |                          |                    |      |
| AF-P1                     | 쿠팡 Adapter                   | `ProductSearchQuery`     | `PartnerProduct[]` | 2h   | -            |
| AF-P2                     | CJ Affiliate Adapter           | `ProductSearchQuery`     | `PartnerProduct[]` | 2.5h | -            |
| AF-P3                     | Amazon Creators Adapter        | `ProductSearchQuery`     | `PartnerProduct[]` | 3h   | -            |
| **Module Extension (v2)** |                                |                          |                    |      |
| AF-M1                     | CosmeticCategory 헤어케어 확장 | 타입 + DB                | 마이그레이션       | 1h   | -            |
| AF-M2                     | H-1 매칭 알고리즘              | hairType, scalpType      | matchScore         | 1.5h | AF-M1        |
| AF-M3                     | M-1 세분화 매칭                | faceShape, undertone     | matchScore         | 1.5h | -            |
| AF-M4                     | RecommendedProducts H-1/M-1    | 컴포넌트                 | UI                 | 1.5h | AF-M2, AF-M3 |
| **Lib**                   |                                |                          |                    |      |
| AF-L1                     | lib/affiliate/products.ts      | CRUD 함수                | Supabase 연동      | 1.5h | -            |
| AF-L2                     | lib/affiliate/deeplink.ts      | 딥링크 생성 로직         | URL 생성           | 1h   | AF-L1        |
| AF-L3                     | lib/affiliate/tracking.ts      | 클릭/전환 추적           | 이벤트 기록        | 1.5h | AF-L1        |
| AF-L4                     | lib/affiliate/partners/\*.ts   | 파트너별 어댑터          | 통합 인터페이스    | 1h   | -            |
| **UI**                    |                                |                          |                    |      |
| AF-U1                     | ProductCard 컴포넌트           | `product`                | React 컴포넌트     | 1.5h | -            |
| AF-U2                     | ProductGrid 컴포넌트           | `products[]`             | React 컴포넌트     | 1h   | AF-U1        |
| AF-U3                     | AdBadge 컴포넌트               | `position`               | React 컴포넌트     | 0.5h | -            |
| **Test**                  |                                |                          |                    |      |
| AF-T1                     | 단위 테스트                    | 코드                     | 테스트 파일        | 2h   | AF-A*, AF-L* |
| AF-T2                     | 통합 테스트                    | API + 파트너             | E2E 검증           | 2h   | AF-T1        |

**총 예상 시간**: 22.5시간

### 8.2 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────┐
│                       의존성 그래프                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────┐     ┌───────┐     ┌───────┐                        │
│  │AF-P1  │     │AF-P2  │     │AF-P3  │  (파트너 병렬)         │
│  │쿠팡   │     │iHerb  │     │무신사  │                        │
│  └───┬───┘     └───┬───┘     └───┬───┘                        │
│      │             │             │                             │
│      └─────────────┼─────────────┘                             │
│                    ▼                                           │
│              ┌───────────┐                                     │
│              │  AF-L1    │                                     │
│              │ products  │                                     │
│              └─────┬─────┘                                     │
│                    │                                           │
│      ┌─────────────┼─────────────┐                             │
│      ▼             ▼             ▼                             │
│  ┌───────┐     ┌───────┐     ┌───────┐                        │
│  │AF-L2  │     │AF-L3  │     │AF-L4  │                        │
│  │deeplink│    │tracking│    │partners│                       │
│  └───┬───┘     └───┬───┘     └───────┘                        │
│      │             │                                           │
│      ▼             ▼                                           │
│  ┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐         │
│  │AF-A1  │────▶│AF-A2  │────▶│AF-A3  │────▶│AF-A4  │         │
│  │제품   │     │딥링크 │     │클릭   │     │전환   │          │
│  └───┬───┘     └───────┘     └───┬───┘     └───┬───┘         │
│      │                           │             │               │
│      │                           └──────┬──────┘               │
│      │                                  ▼                      │
│      │                            ┌───────┐                    │
│      │                            │AF-A5  │                    │
│      │                            │통계   │                     │
│      │                            └───────┘                    │
│      │                                                         │
│      ▼                                                         │
│  ┌───────┐     ┌───────┐     ┌───────┐                        │
│  │AF-U2  │────▶│AF-U1  │     │AF-U3  │                        │
│  │Grid   │     │Card   │     │Badge  │                        │
│  └───────┘     └───────┘     └───────┘                        │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 병렬 실행 그룹

| 그룹               | ATOM IDs                              | 순서       |
| ------------------ | ------------------------------------- | ---------- |
| **Group 1** (병렬) | AF-P1, AF-P2, AF-P3, AF-L4            | 먼저       |
| **Group 2** (순차) | AF-L1                                 | Group 1 후 |
| **Group 3** (병렬) | AF-L2, AF-L3, AF-U3                   | Group 2 후 |
| **Group 4** (순차) | AF-A1 → AF-A2 → AF-A3 → AF-A4 → AF-A5 | Group 3 후 |
| **Group 5** (병렬) | AF-U1, AF-U2                          | Group 4 후 |
| **Group 6** (순차) | AF-T1 → AF-T2                         | 마지막     |

---

## 9. 테스트

### 9.1 테스트 위치

```
tests/api/affiliate/
├── products.test.ts       # 제품 조회
├── deeplink.test.ts       # 딥링크 생성
├── click.test.ts          # 클릭 추적
└── conversion.test.ts     # 전환 추적
```

### 9.2 테스트 케이스

```typescript
// tests/api/affiliate/products.test.ts
describe('GET /api/affiliate/products', () => {
  it('should filter by skin type', async () => {
    const response = await GET(
      createMockRequest({
        query: { skinTypes: 'dry,combination' },
      })
    );
    const data = await response.json();

    expect(
      data.products.every((p) => p.skin_types.some((t) => ['dry', 'combination'].includes(t)))
    ).toBe(true);
  });

  it('should filter by personal color', async () => {
    const response = await GET(
      createMockRequest({
        query: { personalColors: 'spring' },
      })
    );
    const data = await response.json();

    expect(data.products.every((p) => p.personal_colors.includes('spring'))).toBe(true);
  });
});

// tests/api/affiliate/deeplink.test.ts
describe('POST /api/affiliate/deeplink', () => {
  it('should generate coupang deeplink with tracking', async () => {
    const response = await POST(
      createMockRequest({
        body: { productId: 'prod_123', partnerId: 'coupang' },
      })
    );
    const data = await response.json();

    expect(data.url).toContain('link.coupang.com');
    expect(data.url).toContain('subId=');
    expect(data.trackingId).toBeDefined();
  });

  it('should generate iherb deeplink with rcode', async () => {
    const response = await POST(
      createMockRequest({
        body: { productId: 'prod_456', partnerId: 'iherb' },
      })
    );
    const data = await response.json();

    expect(data.url).toContain('iherb.com');
    expect(data.url).toContain('rcode=YIROOM');
  });
});

// tests/api/affiliate/click.test.ts
describe('POST /api/affiliate/click', () => {
  it('should record click with metadata', async () => {
    const response = await POST(
      createMockRequest({
        body: {
          trackingId: 'user123_prod456_abc123',
          productId: 'prod_456',
          referrer: 'https://yiroom.app/products',
        },
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.clickId).toBeDefined();
  });
});
```

### 9.3 성공 기준 체크리스트 (v2)

- [ ] 피부타입 필터 매칭
- [ ] 퍼스널컬러 필터 매칭
- [ ] 헤어타입/두피타입 필터 매칭 (v2)
- [ ] 얼굴형/언더톤 메이크업 매칭 (v2)
- [ ] 딥링크 생성 및 형식 확인 (쿠팡, CJ, Amazon)
- [ ] 클릭 기록 저장 및 메타데이터 포함
- [ ] 전환 웹훅 처리 및 커미션 계산
- [ ] 파트너 API에서 이미지/가격 조회 성공 (v2)
- [ ] AD 뱃지 표시율 100%
- [ ] 매칭 정확도 85%+
- [ ] RecommendedProducts가 5개 모듈 모두 지원 (v2)

---

## 10. 성공 기준

| 지표               | v1 목표 | v2 목표                             |
| ------------------ | ------- | ----------------------------------- |
| 제품 조회 응답     | < 500ms | < 500ms (캐시 hit), < 2s (API 조회) |
| 매칭 정확도        | 85%+    | 85%+                                |
| 클릭 추적 완료율   | 99%+    | 99%+                                |
| AD 뱃지 표시율     | 100%    | 100%                                |
| 모듈 커버리지      | 3/5     | **5/5**                             |
| 제품 이미지 보유율 | 0%      | **80%+**                            |
| 파트너 API 연동    | 0       | **2+ 파트너**                       |

---

## 11. v2 실행 순서 (Phase별)

### Phase 1: 쿠팡 + H-1 확장

1. 쿠팡 파트너스 API 키 발급
2. `CoupangAdapter` 구현 (searchProducts, generateDeeplink, parseConversionWebhook)
3. `CosmeticCategory` 헤어케어 확장 (shampoo, conditioner, hair-treatment, scalp-care)
4. DB 마이그레이션 (hair_types, scalp_types 컬럼 추가)
5. H-1 매칭 알고리즘 추가 (`calculateHaircareScore`)
6. `RecommendedProducts`에 `hair` 타입 지원
7. 기존 시드 데이터에 쿠팡 이미지/URL 매핑

### Phase 2: CJ Affiliate + M-1 세분화

1. CJ Affiliate 가입 및 API 키 발급
2. `CJAffiliateAdapter` 구현
3. M-1 매칭 알고리즘 확장 (얼굴형, 언더톤, 메이크업 서브카테고리)
4. `RecommendedProducts`에 `makeup` 타입 지원

### Phase 3: Amazon Creators + 글로벌

1. Amazon Creators 프로그램 가입 (PA-API 아닌 Creators API)
2. `AmazonCreatorsAdapter` 구현
3. locale 기반 파트너 라우팅 구현
4. 글로벌 제품 데이터 소싱

---

**Version**: 2.0 | **Updated**: 2026-02-10
