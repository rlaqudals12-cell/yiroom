# SDD: 쇼핑 연동 고도화 (Shopping Enhancement)

> **Version**: 1.0 | **Date**: 2026-03-15
> **ADR 참조**: ADR-092 (리뷰 AI), ADR-093 (VTO 브릿지), ADR-094 (쿠폰)

---

## 1. 개요

분석→추천→구매 플로우에서 누락된 6개 전환 경로를 구현하는 스펙.

| #   | 기능            | 현재 | 목표 |
| --- | --------------- | ---- | ---- |
| 1   | 바코드→구매     | 60%  | 100% |
| 2   | 가격 알림 Cron  | 90%  | 100% |
| 3   | VTO→구매        | 50%  | 85%  |
| 4   | 리뷰 AI 분석    | 40%  | 85%  |
| 5   | 올리브영 어댑터 | 20%  | 70%  |
| 6   | 쿠폰/프로모션   | 0%   | 60%  |

---

## 2. 바코드 → 구매 페이지 이동

### 인터페이스

```typescript
// lib/scan/barcode-product-bridge.ts

interface BarcodeProductResult {
  found: boolean;
  internalProduct?: {
    id: string;
    type: 'cosmetic' | 'supplement' | 'equipment' | 'health_food';
    name: string;
    brand: string;
    imageUrl?: string;
  };
  affiliateLinks: Array<{
    partner: string;
    url: string;
    price?: number;
  }>;
  detailUrl: string; // 내부 제품: /beauty/[id], 외부: Open Beauty Facts URL
  externalInfo?: {
    source: string;
    name: string;
    brand: string;
    ingredients?: string[];
  };
}

function resolveBarcode(barcode: string): Promise<BarcodeProductResult>;
```

### 플로우

```
ScanCamera → barcode 인식
  → resolveBarcode(barcode)
    → product_barcodes DB 조회
    → 내부 매핑 있음 → 제품 DB 조회 + 딥링크 생성
    → 내부 매핑 없음 → Open Beauty Facts 조회
  → ScanResult UI
    → "제품 상세 보기" → /beauty/[id]
    → "구매하기" → 어필리에이트 링크
```

---

## 3. 가격 알림 Cron

### 인터페이스

```typescript
// app/api/cron/price-check/route.ts

// GET (Cron 트리거)
// Headers: { authorization: "Bearer ${CRON_SECRET}" }
// Response: { processed: number, alerted: number, cleaned: number }
```

### 로직

```
매일 09:00 (KST)
1. price_watches WHERE is_active=true AND notified=false AND expires_at > now()
2. 각 watch → price_history 최신 가격 조회
3. 조건 충족 시:
   - target_price 이하 OR percent_drop% 이상 하락
   → createPriceDropNotification()
   → markAsNotified()
4. 만료 watch 정리: cleanupExpiredWatches()
```

---

## 4. VTO → 구매 연결

### 인터페이스

```typescript
// lib/virtual-try-on/product-matcher.ts

type MakeupType = 'lip' | 'blush' | 'eyeshadow' | 'foundation' | 'hair';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface VTOMatchedProduct {
  productId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  matchScore: number; // 0-100
  colorDeltaE: number; // 색상 유사도 (낮을수록 유사)
  price?: number;
  affiliateUrl?: string;
}

function matchProductsByColor(
  makeupType: MakeupType,
  color: RgbaColor,
  season?: string,
  limit?: number
): Promise<VTOMatchedProduct[]>;
```

### 색상 변환

```
RGBA → sRGB 감마 보정 → XYZ → Lab
Delta-E = sqrt((L1-L2)² + (a1-a2)² + (b1-b2)²)
```

---

## 5. 리뷰 AI 분석

### 인터페이스

```typescript
// lib/products/services/review-analysis.ts

interface ReviewAISummary {
  positiveKeywords: Array<{ text: string; count: number }>;
  negativeKeywords: Array<{ text: string; count: number }>;
  summary: string;
  pros: string[];
  cons: string[];
  overallSentiment: 'positive' | 'mixed' | 'negative';
  analyzedCount: number;
}

function analyzeReviews(productId: string, productType: string): Promise<ReviewAISummary>;
```

### API

```
GET /api/products/[id]/review-analysis?type=cosmetic
→ 캐시 확인 (24h TTL)
→ 미스 → Gemini 3 Flash 호출 → 캐시 저장
→ { success: true, data: ReviewAISummary }
```

### Mock 데이터 (Fallback)

```typescript
{
  positiveKeywords: [
    { text: '보습력', count: 15 },
    { text: '순한 성분', count: 12 },
    { text: '발림성', count: 10 },
  ],
  negativeKeywords: [
    { text: '향이 강함', count: 5 },
    { text: '용량 적음', count: 3 },
  ],
  summary: '보습력과 순한 성분으로 호평이 많으며, 일부 사용자는 향이 강하다고 느끼고 있어요.',
  pros: ['보습력이 뛰어나요', '민감한 피부에도 순해요', '발림성이 좋아요'],
  cons: ['향이 다소 강해요', '용량 대비 가격이 아쉬워요'],
  overallSentiment: 'positive',
  analyzedCount: 42,
}
```

---

## 6. 올리브영 어댑터

### 인터페이스

```typescript
// lib/affiliate/adapters/olive-young.ts
// PartnerAdapter 인터페이스 구현

{
  partnerId: 'oliveyoung',
  searchProducts(query): Promise<PartnerProduct[]>,
  generateDeeplink(productId, userId): string,
  parseConversionWebhook(payload): ConversionEvent | null,
  isConfigured(): boolean,
}
```

### 환경변수

```
OLIVEYOUNG_ENABLED=true     # 킬스위치
OLIVEYOUNG_AFFILIATE_ID=    # 제휴 ID (향후)
```

---

## 7. 쿠폰/프로모션

### DB 스키마

```sql
promotions (
  id UUID PK,
  title TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL,     -- 'percentage_off' | 'fixed_off' | 'free_shipping'
  discount_value NUMERIC NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  partner_name TEXT,                -- 특정 파트너 한정
  category TEXT,                    -- 특정 카테고리 한정
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)

user_coupons (
  id UUID PK,
  clerk_user_id TEXT NOT NULL,
  promotion_id UUID FK → promotions,
  coupon_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### API

```
GET  /api/coupons           → 활성 프로모션 + 내 쿠폰 목록
POST /api/coupons/apply     → 쿠폰 코드 검증 + 할인 계산
  Body: { couponCode: string, orderAmount: number, partnerName?: string, category?: string }
  Response: { valid: boolean, discount: number, message: string }
```

### UI 디자인

- **CouponCard**: 점선 테두리, 할인율/금액 크게 표시, 만료일, 적용 조건
- **CouponBanner**: 제품 상세 상단에 "사용 가능한 쿠폰이 있어요!" 배너
- **CouponList**: 마이페이지 쿠폰함 (사용 가능/사용 완료/만료 탭)

---

## 8. 테스트 계획

| Phase    | 테스트 파일                                         | 예상 수 |
| -------- | --------------------------------------------------- | ------- |
| 1        | tests/lib/scan/barcode-product-bridge.test.ts       | ~10     |
| 2        | tests/api/cron/price-check.test.ts                  | ~8      |
| 3        | tests/lib/virtual-try-on/product-matcher.test.ts    | ~10     |
| 4        | tests/lib/products/services/review-analysis.test.ts | ~12     |
| 5        | tests/lib/affiliate/adapters/olive-young.test.ts    | ~8      |
| 6        | tests/lib/products/services/coupons.test.ts         | ~15     |
| **합계** |                                                     | **~63** |
