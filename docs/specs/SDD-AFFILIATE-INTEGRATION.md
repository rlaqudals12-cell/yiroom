# SDD: 어필리에이트 통합

> **Status**: ✅ Implemented
> **Version**: 1.0
> **Created**: 2026-01-19
> **Updated**: 2026-01-19
> **Phase**: L (수익화)

> 쿠팡 파트너스 및 어필리에이트 제품 링크 통합

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 전자상거래법, 광고 표시 의무
- [원리: RAG 검색](../principles/rag-retrieval.md) - 제품 검색 최적화

### ADR
- [ADR-029: 어필리에이트 통합](../adr/ADR-029-affiliate-integration.md) - 어필리에이트 아키텍처
- [ADR-011: Cross-Module Data Flow](../adr/ADR-011-cross-module-data-flow.md) - 분석 → 제품 매칭

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"분석 결과 기반 완벽한 제품 추천 및 수익화"

- **매칭 정확도**: AI 기반 개인화 매칭 95%+ 적합도
- **파트너 다양성**: 10+ 파트너 (뷰티, 패션, 건강식품, 운동기구)
- **실시간 재고**: API 연동 실시간 재고/가격 확인
- **전환 추적**: 클릭 → 구매 전환 100% 추적
- **제품 리뷰**: 사용자 리뷰 연동

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 파트너 API | 파트너별 API 규격/제한 상이 |
| 커미션율 | 카테고리/파트너별 커미션율 변동 |
| 재고 동기화 | 실시간 동기화 API 지원 제한 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 파트너 수 | 10개 | 3개 (쿠팡, iHerb, 무신사) | 30% |
| 매칭 정확도 | AI 95% | 규칙 기반 70% | 74% |
| 전환 추적 | 100% | 웹훅 기반 | 80% |
| 재고 연동 | 실시간 | 없음 | 0% |
| 리뷰 연동 | 있음 | 없음 | 0% |

### 현재 목표

**종합 달성률**: **70%** (MVP 어필리에이트)

### 의도적 제외 (이번 버전)

- AI 기반 제품 매칭 (규칙 기반 우선)
- 실시간 재고 연동 (Phase 2)
- 제품 리뷰 통합 (Phase 2)
- 10개+ 파트너 확장 (3개로 시작)

---

## 1. 비즈니스 목표

### 핵심 가치
- 분석 결과 기반 개인화 제품 추천
- 어필리에이트 수익 창출
- 사용자 구매 편의성 제공

### 파트너

| 파트너 | 카테고리 | 커미션율 |
|--------|----------|---------|
| 쿠팡 | 화장품, 패션 | 3-5% |
| iHerb | 영양제, 건강식품 | 5-10% |
| 무신사 | 패션, 뷰티 | 3-7% |

---

## 2. 기능 스펙

### 2.1 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| 제품 조회 | ✅ 완료 | `/api/affiliate/products/` |
| 딥링크 생성 | ✅ 완료 | `/api/affiliate/deeplink/` |
| 클릭 추적 | ✅ 완료 | `/api/affiliate/click/` |
| 전환 추적 | ✅ 완료 | `/api/affiliate/conversion/` |
| 파트너별 검색 | ✅ 완료 | `/api/affiliate/*/search/` |
| 제품 동기화 | ✅ 완료 | `/api/affiliate/*/sync/` |

### 2.2 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/affiliate/products` | GET | 제품 조회 (필터/정렬) |
| `/api/affiliate/deeplink` | POST | 딥링크 생성 |
| `/api/affiliate/click` | POST | 클릭 기록 |
| `/api/affiliate/conversion` | POST | 전환 기록 (웹훅) |
| `/api/affiliate/stats` | GET | 통계 조회 |
| `/api/affiliate/coupang/search` | GET | 쿠팡 검색 |
| `/api/affiliate/coupang/sync` | POST | 쿠팡 동기화 |
| `/api/affiliate/iherb/search` | GET | iHerb 검색 |
| `/api/affiliate/iherb/sync` | POST | iHerb 동기화 |
| `/api/affiliate/musinsa/search` | GET | 무신사 검색 |
| `/api/affiliate/musinsa/sync` | POST | 무신사 동기화 |

---

## 3. 제품 매칭

### 3.1 매칭 속성

```typescript
interface AffiliateProductFilter {
  // 파트너
  partnerId?: string;

  // 카테고리
  category?: 'supplement' | 'cosmetic' | 'fashion';

  // 피부 분석 매칭
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];

  // 퍼스널컬러 매칭
  personalColors?: AffiliatePersonalColor[];

  // 체형 매칭
  bodyTypes?: AffiliateBodyType[];

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
```

### 3.2 매칭 로직

```typescript
// 분석 결과 → 제품 필터 변환
function analysisToFilter(analysis: UserAnalysis): AffiliateProductFilter {
  return {
    skinTypes: analysis.skinType ? [analysis.skinType] : undefined,
    skinConcerns: analysis.concerns,
    personalColors: analysis.personalColor ? [analysis.personalColor.season] : undefined,
    bodyTypes: analysis.bodyType ? [analysis.bodyType] : undefined,
  };
}
```

---

## 4. 딥링크 생성

### 4.1 파트너별 형식

```typescript
const DEEPLINK_TEMPLATES = {
  coupang: {
    template: 'https://link.coupang.com/re/AFFILIATE?itemId={productId}&subId={trackingId}',
    requiresAuth: true,
  },
  iherb: {
    template: 'https://iherb.com/{productPath}?rcode=YIROOM&utm={trackingId}',
    requiresAuth: false,
  },
  musinsa: {
    template: 'https://www.musinsa.com/app/goods/{productId}?utm_source=yiroom&utm_medium=affiliate&utm_campaign={trackingId}',
    requiresAuth: false,
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
  <Badge className="absolute top-2 right-2 bg-gray-100 text-gray-600">
    AD
  </Badge>
  <ProductCard product={product} />
</div>
```

---

## 6. 구현 상세

### 6.1 파일 구조

```
apps/web/
├── app/api/affiliate/
│   ├── products/route.ts       # 제품 조회
│   ├── deeplink/route.ts       # 딥링크 생성
│   ├── click/route.ts          # 클릭 기록
│   ├── conversion/route.ts     # 전환 기록
│   ├── stats/route.ts          # 통계
│   ├── coupang/
│   │   ├── search/route.ts
│   │   └── sync/route.ts
│   ├── iherb/
│   │   ├── search/route.ts
│   │   └── sync/route.ts
│   └── musinsa/
│       ├── search/route.ts
│       └── sync/route.ts
├── lib/affiliate/
│   ├── index.ts                # export
│   ├── products.ts             # 제품 CRUD
│   ├── deeplink.ts             # 딥링크 생성
│   ├── tracking.ts             # 클릭/전환 추적
│   └── partners/
│       ├── coupang.ts
│       ├── iherb.ts
│       └── musinsa.ts
├── types/affiliate.ts          # 타입 정의
└── components/products/
    ├── ProductCard.tsx         # 제품 카드
    ├── ProductGrid.tsx         # 제품 그리드
    └── AdBadge.tsx             # AD 뱃지
```

---

## 7. 데이터베이스

### 7.1 스키마

```sql
-- 제품
CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL,        -- 'coupang' | 'iherb' | 'musinsa'
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
  skin_types TEXT[] DEFAULT '{}',
  skin_concerns TEXT[] DEFAULT '{}',
  personal_colors TEXT[] DEFAULT '{}',
  body_types TEXT[] DEFAULT '{}',
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

| ID | 원자 | 입력 | 출력 | 시간 | 의존성 |
|----|------|------|------|------|--------|
| **Core** |||||
| AF-A1 | 제품 조회 API | `AffiliateProductFilter` | `Product[]` | 1.5h | - |
| AF-A2 | 딥링크 생성 API | `productId`, `userId` | `deepLinkUrl` | 1h | AF-A1 |
| AF-A3 | 클릭 추적 API | `trackingId`, 메타데이터 | `clickId` | 1h | AF-A2 |
| AF-A4 | 전환 추적 API (웹훅) | 파트너 콜백 | `conversionId` | 1.5h | AF-A3 |
| AF-A5 | 통계 조회 API | `dateRange`, `partnerId` | `AffiliateStats` | 1h | AF-A3, AF-A4 |
| **Partners** |||||
| AF-P1 | 쿠팡 검색/동기화 | `query` / `productIds` | `Product[]` | 2h | - |
| AF-P2 | iHerb 검색/동기화 | `query` / `productIds` | `Product[]` | 2h | - |
| AF-P3 | 무신사 검색/동기화 | `query` / `productIds` | `Product[]` | 2h | - |
| **Lib** |||||
| AF-L1 | lib/affiliate/products.ts | CRUD 함수 | Supabase 연동 | 1.5h | - |
| AF-L2 | lib/affiliate/deeplink.ts | 딥링크 생성 로직 | URL 생성 | 1h | AF-L1 |
| AF-L3 | lib/affiliate/tracking.ts | 클릭/전환 추적 | 이벤트 기록 | 1.5h | AF-L1 |
| AF-L4 | lib/affiliate/partners/*.ts | 파트너별 어댑터 | 통합 인터페이스 | 1h | - |
| **UI** |||||
| AF-U1 | ProductCard 컴포넌트 | `product` | React 컴포넌트 | 1.5h | - |
| AF-U2 | ProductGrid 컴포넌트 | `products[]` | React 컴포넌트 | 1h | AF-U1 |
| AF-U3 | AdBadge 컴포넌트 | `position` | React 컴포넌트 | 0.5h | - |
| **Test** |||||
| AF-T1 | 단위 테스트 | 코드 | 테스트 파일 | 2h | AF-A*, AF-L* |
| AF-T2 | 통합 테스트 | API + 파트너 | E2E 검증 | 2h | AF-T1 |

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

| 그룹 | ATOM IDs | 순서 |
|------|----------|------|
| **Group 1** (병렬) | AF-P1, AF-P2, AF-P3, AF-L4 | 먼저 |
| **Group 2** (순차) | AF-L1 | Group 1 후 |
| **Group 3** (병렬) | AF-L2, AF-L3, AF-U3 | Group 2 후 |
| **Group 4** (순차) | AF-A1 → AF-A2 → AF-A3 → AF-A4 → AF-A5 | Group 3 후 |
| **Group 5** (병렬) | AF-U1, AF-U2 | Group 4 후 |
| **Group 6** (순차) | AF-T1 → AF-T2 | 마지막 |

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
    const response = await GET(createMockRequest({
      query: { skinTypes: 'dry,combination' }
    }));
    const data = await response.json();

    expect(data.products.every(p =>
      p.skin_types.some(t => ['dry', 'combination'].includes(t))
    )).toBe(true);
  });

  it('should filter by personal color', async () => {
    const response = await GET(createMockRequest({
      query: { personalColors: 'spring' }
    }));
    const data = await response.json();

    expect(data.products.every(p =>
      p.personal_colors.includes('spring')
    )).toBe(true);
  });
});

// tests/api/affiliate/deeplink.test.ts
describe('POST /api/affiliate/deeplink', () => {
  it('should generate coupang deeplink with tracking', async () => {
    const response = await POST(createMockRequest({
      body: { productId: 'prod_123', partnerId: 'coupang' }
    }));
    const data = await response.json();

    expect(data.url).toContain('link.coupang.com');
    expect(data.url).toContain('subId=');
    expect(data.trackingId).toBeDefined();
  });

  it('should generate iherb deeplink with rcode', async () => {
    const response = await POST(createMockRequest({
      body: { productId: 'prod_456', partnerId: 'iherb' }
    }));
    const data = await response.json();

    expect(data.url).toContain('iherb.com');
    expect(data.url).toContain('rcode=YIROOM');
  });
});

// tests/api/affiliate/click.test.ts
describe('POST /api/affiliate/click', () => {
  it('should record click with metadata', async () => {
    const response = await POST(createMockRequest({
      body: {
        trackingId: 'user123_prod456_abc123',
        productId: 'prod_456',
        referrer: 'https://yiroom.app/products',
      }
    }));

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.clickId).toBeDefined();
  });
});
```

### 9.3 성공 기준 체크리스트

- [ ] 피부타입 필터 매칭
- [ ] 퍼스널컬러 필터 매칭
- [ ] 딥링크 생성 및 형식 확인 (쿠팡, iHerb, 무신사)
- [ ] 클릭 기록 저장 및 메타데이터 포함
- [ ] 전환 웹훅 처리 및 커미션 계산
- [ ] AD 뱃지 표시율 100%
- [ ] 매칭 정확도 85%+

---

## 10. 성공 기준

| 지표 | 목표 |
|------|------|
| 제품 조회 응답 | < 500ms |
| 매칭 정확도 | 85%+ |
| 클릭 추적 완료율 | 99%+ |
| AD 뱃지 표시율 | 100% |

---

**Version**: 1.0 | **Updated**: 2026-01-19
