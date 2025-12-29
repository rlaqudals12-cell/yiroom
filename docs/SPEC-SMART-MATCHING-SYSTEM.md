# Phase J: 스마트 매칭 시스템 스펙

> **Version**: 1.2
> **Created**: 2025-12-29
> **Updated**: 2025-12-29
> **Status**: Draft
> **Dependencies**: Phase I (어필리에이트), Phase A (제품 DB), Phase 1 (분석 모듈), **Phase I-2 (인벤토리)**

---

## 1. 개요

### 1.1 목적

사용자의 분석 결과(피부, 체형, 퍼스널컬러)와 보유 인벤토리를 기반으로 최적의 제품을 **제안**하고, 다양한 구매 옵션을 비교할 수 있는 통합 매칭 시스템.

### 1.2 기존 구현 참조 (Phase I-2)

> ⚠️ **중요**: Phase J는 기존 인벤토리 시스템을 **확장**합니다. 새로 생성하지 않습니다.

**이미 구현된 것**:
- `user_inventory` 테이블 (5개 카테고리: closet, beauty, equipment, supplement, pantry)
- `saved_outfits` 테이블 (코디 저장)
- 옷장 페이지 (`/closet`) CRUD
- 인벤토리 타입 (`types/inventory.ts`)
- 이미지 저장소 (`inventory-images` Supabase Storage 버킷)

**Phase J에서 추가하는 것**:
- 제품 DB 연동 (`product_id` 컬럼 추가)
- 바코드 스캔 연동
- 사이즈 매칭 시스템
- 가격 비교 시스템
- 스마트 추천 엔진
- 사용자 설정/피드백/알림

### 1.3 핵심 원칙

#### UX 원칙: "제안" ≠ "강요"

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 사용자 선택권 존중                                        │
├─────────────────────────────────────────────────────────────┤
│  1. 추천은 정보 제공일 뿐, 최종 결정은 사용자                   │
│  2. 맞지 않는 제품도 선택 가능 + 스타일링 팁 제공               │
│  3. "이 제품은 당신과 맞지 않습니다" ❌                        │
│     "다른 옵션도 있어요" ✅                                   │
│  4. 거부감 없는 부드러운 안내                                  │
└─────────────────────────────────────────────────────────────┘
```

**예시 시나리오**:
```
사용자가 맞지 않는 립스틱 색상 선택 시:

❌ 잘못된 접근:
"이 색상은 웜톤인 당신과 어울리지 않습니다."

✅ 올바른 접근:
"이 색상도 예뻐요! 😊
 참고로 이렇게 활용하면 더 잘 어울릴 수 있어요:
 • 립라이너로 톤 보정
 • 블러셔와 함께 사용

 비슷한 느낌의 웜톤 컬러도 준비했어요 [보기]"
```

### 1.4 적용 범위

| 모듈 | 연동 분석 | 제품 카테고리 |
|------|----------|--------------|
| PC-1 | 퍼스널컬러 | 화장품, 의류 |
| S-1 | 피부 분석 | 스킨케어, 영양제 |
| C-1 | 체형 분석 | 의류, 운동기구 |
| N-1 | 영양 분석 | 영양제, 건강식품 |
| W-1 | 운동 분석 | 운동기구, 보조제 |

---

## 2. 모듈 구성

### J-1: 통합 인벤토리 (기존 확장)

> 기존 Phase I-2 인벤토리 시스템을 **확장**하여 제품 DB 연동 및 스마트 기능 추가

#### 2.1.1 기존 인벤토리 구조 (참조)

> ⚠️ 이미 구현됨: `user_inventory` 테이블, `types/inventory.ts`

```typescript
// 기존 카테고리 (types/inventory.ts)
type InventoryCategory =
  | 'closet'      // 내 옷장
  | 'beauty'      // 내 화장대
  | 'equipment'   // 내 운동장비
  | 'supplement'  // 내 영양제
  | 'pantry';     // 내 냉장고
```

#### 2.1.2 확장 필드 (Phase J 추가)

기존 `user_inventory` 테이블에 추가할 컬럼:

```sql
-- 제품 DB 연동
ALTER TABLE user_inventory
  ADD COLUMN product_id UUID REFERENCES affiliate_products(id),
  ADD COLUMN barcode TEXT;

CREATE INDEX idx_inventory_product ON user_inventory(product_id);
CREATE INDEX idx_inventory_barcode ON user_inventory(barcode);
```

#### 2.1.3 확장된 데이터 구조

```typescript
interface InventoryItem {
  id: string;
  clerkUserId: string;
  category: InventoryCategory;

  // 제품 정보 (수동 입력 or 제품 DB 연동)
  productId?: string;           // 연동된 제품 ID
  customName?: string;          // 직접 입력 이름
  brand?: string;
  color?: string;
  size?: string;

  // 상태
  purchaseDate?: Date;
  expiryDate?: Date;            // 화장품/영양제용
  usageStatus: 'new' | 'in_use' | 'almost_empty' | 'finished';

  // 메타
  imageUrl?: string;
  notes?: string;
  tags: string[];               // 예: ['여름용', '데일리', '출근룩']

  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.1.3 기능

| 기능 | 설명 |
|------|------|
| 아이템 등록 | 바코드 스캔 / 사진 인식 / 수동 입력 |
| 중복 체크 | 구매 시 보유 여부 알림 |
| 코디 연동 | 보유 아이템 기반 스타일링 제안 |
| 소진 알림 | 화장품/영양제 교체 시기 알림 |
| 통계 | 카테고리별 소비 패턴, 자주 쓰는 아이템 |

#### 2.1.4 제품 등록 방식 (Multi-Modal)

> 제품 유형별 최적의 등록 경로 제공

**카테고리별 권장 등록 방식**

| 카테고리 | 바코드 | 이미지 인식 | 수동 입력 | 권장 방식 |
|----------|--------|------------|----------|----------|
| 영양제 | ✅ 대부분 있음 | ⚠️ 보조 | ⚠️ 폴백 | 바코드 우선 |
| 화장품 | ✅ 있음 | ✅ 유용 | ⚠️ 폴백 | 바코드 + 이미지 |
| 의류 | ❌ 태그 제거됨 | ✅ 라벨 인식 | ✅ 필요 | 이미지 + 수동 |
| 운동기구 | ❌ 거의 없음 | ⚠️ 제한적 | ✅ 필수 | 수동 + 검색 |

**3가지 등록 경로**

```
┌─────────────────────────────────────────────────────────────┐
│  📦 제품 등록                                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  📷 스캔    │  │  🔍 검색    │  │  ✏️ 직접   │         │
│  │  (권장)     │  │             │  │    입력    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  바코드/제품 사진    브랜드+제품명     모든 정보            │
│  → 자동 인식         → DB 매칭        수동 입력             │
└─────────────────────────────────────────────────────────────┘
```

**1) 스캔 등록 (N-1 바코드 기능 확장)**

```typescript
type ScanMode = 'barcode' | 'product_image' | 'label_image';

interface ScanResult {
  // 바코드 스캔 결과
  barcode?: string;

  // 이미지 인식 결과 (Gemini Vision)
  detectedBrand?: string;
  detectedProductName?: string;
  detectedSize?: string;
  detectedColor?: string;
  detectedCategory?: string;

  // DB 매칭 결과
  matchedProduct?: AffiliateProduct;
  confidence: number;

  // 사용자 확인 필요 여부
  needsConfirmation: boolean;
}
```

- **영양제/화장품**: 바코드 스캔 → DB 즉시 매칭
- **의류**: 라벨 사진 → 브랜드/사이즈 추출 → 검색 제안

**2) 검색 등록**

```typescript
interface ProductSearchParams {
  brand?: string;
  productName?: string;
  category?: InventoryCategory;
  subcategory?: string;
}

// 검색 결과에서 선택 → 자동 정보 채움
```

**3) 직접 입력 (폴백)**

DB에 없는 제품, 라벨 없는 제품용

#### 2.1.5 라벨 없는 제품 등록

> 바코드/라벨 없는 제품도 등록 가능 (의류 핵심 기능)

**대상 시나리오**

| 상황 | 예시 | 해결 방법 |
|------|------|----------|
| 태그 제거됨 | 오래된 옷 | 사진 + 수동 입력 |
| 선물 받은 옷 | 브랜드 모름 | "브랜드 모름" 옵션 |
| 빈티지/중고 | 정보 없음 | 사진만으로 등록 |
| 수제/맞춤복 | 바코드 없음 | 완전 수동 입력 |
| 해외 직구 | DB에 없음 | 직접 입력 |

**최소 필수 정보 (2개만)**

```typescript
interface MinimalInventoryItem {
  // 필수 (코디 추천에 필요한 최소 정보)
  category: ClothingCategory;  // 상의, 하의, 아우터 등
  color: string;               // 색상

  // 선택 (나머지 전부)
  imageUrl?: string;           // 사진만 있어도 충분
  brand?: string;              // "unknown" 허용
  customName?: string;         // 사용자가 부르는 이름
  size?: string;
  purchaseDate?: Date;
  tags?: string[];             // "선물", "빈티지" 등
}
```

**사진 기반 AI 보완 (Gemini Vision)**

```
사용자: [검정 니트 사진 업로드]
        ↓
AI 자동 추출 (제안):
┌────────────────────────────┐
│ 📷 분석 결과               │
├────────────────────────────┤
│ 카테고리: 상의 > 니트      │
│ 색상: 블랙                 │
│ 스타일: 캐주얼             │
│ 핏: 레귤러                 │
│                            │
│ [확인] [수정하기]          │
└────────────────────────────┘
```

**등록 UI 흐름**

```
┌─────────────────────────────────────────────────────────────┐
│  👕 옷장에 추가                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  사진 (선택)                                                │
│  ┌─────────────┐                                           │
│  │     📷      │  ← 제품 사진만 찍어도 OK                   │
│  │   사진 추가  │     AI가 카테고리/색상 자동 추출           │
│  └─────────────┘                                           │
│                                                             │
│  카테고리 *                                                 │
│  [ 상의 ▼ ]  [ 니트/스웨터 ▼ ]                             │
│                                                             │
│  브랜드                                                     │
│  [                    ] [☑️ 브랜드 모름]                    │
│                                                             │
│  제품명/설명                                                │
│  [ 검정 니트                ]  ← 자유롭게 입력              │
│                                                             │
│  색상 *                                                     │
│  ⚫검정 ⚪흰색 🔘회색 🔘네이비 🔘기타: [    ]              │
│                                                             │
│  사이즈                                                     │
│  [ M ▼ ]  [☐ 모름]                                        │
│                                                             │
│  ─────────────────────────────────────────                 │
│  * 필수: 카테고리, 색상 (2개만!)                            │
│                                                             │
│              [옷장에 추가하기]                               │
└─────────────────────────────────────────────────────────────┘
```

**코디 추천 활용**

라벨 없는 옷도 색상 + 카테고리만 있으면 코디에 활용:

```
"오늘의 코디 추천"

┌─────────┐  ┌─────────┐  ┌─────────┐
│ [사진]  │  │ [사진]  │  │ 👟 추천 │
│ 내 니트 │ +│ 내 청바지│ +│ 흰 스니커즈│
│ (검정)  │  │ (진청)  │  │ ₩89,000 │
└─────────┘  └─────────┘  └─────────┘
  보유 아이템    보유 아이템    구매 제안
```

**구현 우선순위**

| 순서 | 기능 | 구현 시점 |
|------|------|----------|
| 1 | 검색 + 직접 입력 | J-1 Phase 1 |
| 2 | 바코드 스캔 (N-1 확장) | J-1 Phase 2 |
| 3 | 이미지 인식 (Gemini Vision) | J-1 Phase 3 |

#### 2.1.6 중복 구매 방지 UX

```
┌──────────────────────────────────────────┐
│  💡 이미 가지고 계신 제품이에요!            │
├──────────────────────────────────────────┤
│  [제품 이미지]                            │
│  나이키 에어맥스 270                       │
│  구매일: 2024-06-15                       │
│                                          │
│  [계속 구매하기]  [내 옷장 보기]            │
└──────────────────────────────────────────┘
```

---

### J-2: 사이즈 매칭 시스템

> 브랜드별 사이즈 차이 해결 + 정확한 추천

#### 2.2.1 3단계 데이터 구조

```
Level 1: 브랜드 기본 정보
├── 브랜드명, 국가, 핏 스타일 (오버핏/레귤러/슬림)
│
Level 2: 카테고리별 사이즈 차트
├── 상의/하의/아우터/신발 등
├── 사이즈 라벨 (S/M/L, 28/30/32 등)
├── 표준 치수 (가슴둘레, 허리 등)
│
Level 3: 개별 제품 실측
└── 제품별 실제 치수 (총장, 어깨너비 등)
```

#### 2.2.2 사용자 신체 데이터

```typescript
interface UserBodyMeasurements {
  clerkUserId: string;

  // 기본 (C-1 연동)
  height: number;          // cm
  weight: number;          // kg
  bodyType: BodyType;      // 체형 분석 결과

  // 상세 치수 (선택)
  chest?: number;          // 가슴둘레
  waist?: number;          // 허리둘레
  hip?: number;            // 엉덩이둘레
  shoulder?: number;       // 어깨너비
  armLength?: number;      // 팔 길이
  inseam?: number;         // 다리 안쪽 길이
  footLength?: number;     // 발 길이

  // 선호 핏
  preferredFit: 'tight' | 'regular' | 'loose';

  // 브랜드별 실착 사이즈 기록
  sizeHistory: BrandSizeRecord[];

  updatedAt: Date;
}

interface BrandSizeRecord {
  brandId: string;
  category: string;        // 상의, 하의 등
  size: string;            // M, 30 등
  fit: 'small' | 'perfect' | 'large';
  productId?: string;      // 구매한 제품
  purchaseDate?: Date;
}
```

#### 2.2.3 브랜드 사이즈 DB

```typescript
interface BrandSizeChart {
  id: string;
  brandId: string;
  brandName: string;
  country: string;         // KR, US, EU 등

  category: ClothingCategory;
  fitStyle: 'slim' | 'regular' | 'oversized';

  // 사이즈 매핑
  sizeMap: SizeMapping[];

  // 메타
  source: string;          // 데이터 출처
  lastVerified: Date;
}

interface SizeMapping {
  label: string;           // S, M, L 또는 28, 30, 32

  // 권장 체형 범위
  minHeight?: number;
  maxHeight?: number;
  minWeight?: number;
  maxWeight?: number;

  // 상세 치수 (cm)
  measurements: {
    chest?: { min: number; max: number };
    waist?: { min: number; max: number };
    shoulder?: { min: number; max: number };
    length?: { min: number; max: number };
  };
}
```

#### 2.2.4 제품별 실측 데이터

```typescript
interface ProductMeasurements {
  productId: string;

  // 제품 사이즈별 실측
  sizeMeasurements: {
    size: string;
    actualMeasurements: {
      totalLength?: number;    // 총장
      shoulderWidth?: number;  // 어깨너비
      chestWidth?: number;     // 가슴단면
      sleeveLength?: number;   // 소매길이
      waistWidth?: number;     // 허리단면
      hipWidth?: number;       // 엉덩이단면
      thighWidth?: number;     // 허벅지단면
      rise?: number;           // 밑위
      hemWidth?: number;       // 밑단
    };
  }[];

  // 데이터 출처
  source: 'official' | 'musinsa' | 'user_report' | 'ai_extracted';
  reliability: number;     // 0-1 신뢰도
  lastUpdated: Date;
}
```

#### 2.2.5 사이즈 추천 로직

```typescript
function recommendSize(
  userId: string,
  productId: string
): SizeRecommendation {
  // 1. 사용자 데이터 조회
  const userMeasurements = getUserMeasurements(userId);
  const sizeHistory = getUserSizeHistory(userId);

  // 2. 제품 데이터 조회
  const product = getProduct(productId);
  const brandChart = getBrandSizeChart(product.brandId, product.category);
  const productMeasurements = getProductMeasurements(productId);

  // 3. 추천 우선순위
  // a) 동일 브랜드 구매 이력 → 가장 정확
  const sameBrandHistory = sizeHistory.find(h => h.brandId === product.brandId);
  if (sameBrandHistory) {
    return inferFromHistory(sameBrandHistory, productMeasurements);
  }

  // b) 제품 실측 데이터 → 정확도 높음
  if (productMeasurements) {
    return matchByMeasurements(userMeasurements, productMeasurements);
  }

  // c) 브랜드 사이즈 차트 → 일반적 추천
  if (brandChart) {
    return matchByBrandChart(userMeasurements, brandChart);
  }

  // d) 일반 가이드라인 → 폴백
  return generalSizeGuide(userMeasurements, product.category);
}
```

#### 2.2.6 데이터 수집 전략

| 소스 | 방법 | 우선순위 |
|------|------|---------|
| 무신사 | 제품 페이지 실측 크롤링 | P0 |
| 브랜드 공식몰 | 사이즈 차트 수집 | P0 |
| 사용자 피드백 | "이 사이즈 맞았어요" 데이터 | P1 |
| AI 추출 | 제품 이미지에서 태그 인식 | P2 |

---

### J-3: 스마트 추천 엔진

> 크로스 모듈 통합 추천 + 가격 비교

#### 2.3.1 추천 소스 통합

```typescript
interface SmartRecommendation {
  // 기본 정보
  productId: string;
  product: AffiliateProduct;

  // 매칭 점수
  matchScore: number;        // 0-100
  matchReasons: MatchReason[];

  // 크로스 모듈 연동
  relatedAnalysis: {
    personalColor?: PersonalColorMatch;
    skinType?: SkinTypeMatch;
    bodyType?: BodyTypeMatch;
    nutritionNeeds?: NutritionMatch;
    workoutGoals?: WorkoutMatch;
  };

  // 사이즈 추천 (의류)
  sizeRecommendation?: SizeRecommendation;

  // 구매 옵션
  purchaseOptions: PurchaseOption[];

  // 인벤토리 체크
  alreadyOwned: boolean;
  similarOwned?: InventoryItem[];

  // 대안 제시
  alternatives: AlternativeProduct[];
}

interface MatchReason {
  type: 'color_match' | 'skin_match' | 'body_match' | 'nutrition_match' | 'price' | 'rating';
  score: number;
  description: string;     // 예: "웜톤 피부에 잘 어울리는 코랄 계열"
}
```

#### 2.3.2 가격 비교 시스템

```typescript
interface PurchaseOption {
  platform: 'coupang' | 'naver' | 'musinsa' | 'oliveyoung' | 'iherb';

  // 가격 정보
  originalPrice: number;
  salePrice: number;
  discountPercent: number;

  // 배송 정보
  deliveryType: 'rocket' | 'next_day' | 'standard' | 'international';
  deliveryDays: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;

  // 부가 혜택
  points?: number;          // 적립 포인트
  coupons?: AvailableCoupon[];

  // 재고 상태
  inStock: boolean;
  stockCount?: number;

  // 어필리에이트
  affiliateUrl: string;
  commissionRate: number;

  // 메타
  lastUpdated: Date;
  reliability: 'live' | 'cached' | 'estimated';
}

interface PriceComparison {
  productId: string;
  options: PurchaseOption[];

  // 추천 옵션
  bestPrice: PurchaseOption;
  fastestDelivery: PurchaseOption;
  bestValue: PurchaseOption;   // 가격 + 적립 + 배송 종합

  // 플랫폼별 특징
  platformNotes: {
    platform: string;
    pros: string[];
    cons: string[];
  }[];
}
```

#### 2.3.3 플랫폼 API 연동

| 플랫폼 | API 상태 | 데이터 범위 |
|--------|---------|------------|
| 쿠팡 | ✅ 파트너스 API | 가격, 배송, 재고 |
| 네이버 | ✅ 쇼핑 API | 가격, 리뷰, 카탈로그 |
| 무신사 | ⚠️ 비공식 | 제품 실측, 리뷰 |
| 올리브영 | ❌ 없음 | 수동/크롤링 |
| 아이허브 | ✅ 어필리에이트 | 가격, 재고, 리뷰 |

#### 2.3.4 코디 추천 (의류)

```typescript
interface OutfitRecommendation {
  // 기본 정보
  outfitId: string;
  occasion: string;         // 출근, 데이트, 캐주얼 등
  season: string;
  style: string;            // 미니멀, 캐주얼, 포멀 등

  // 아이템 구성
  items: {
    category: 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

    // 보유 아이템 또는 추천 제품
    source: 'inventory' | 'recommendation';
    inventoryItem?: InventoryItem;
    recommendedProduct?: SmartRecommendation;
  }[];

  // 매칭 정보
  colorHarmony: number;     // 0-100
  styleConsistency: number;
  personalColorFit: number;

  // 비용
  totalCost: number;        // 추천 제품 구매 시
  ownedItemsValue: number;  // 보유 아이템 활용 가치
}
```

#### 2.3.5 맞지 않는 제품 선택 시 대응

```typescript
interface MismatchGuidance {
  // 선택한 제품
  selectedProduct: Product;

  // 불일치 정보 (강조하지 않음)
  mismatchType: 'color' | 'size' | 'skin' | 'nutrition';
  mismatchDetails: string;  // 내부용

  // 사용자에게 보여줄 정보
  userMessage: string;      // 긍정적 톤

  // 활용 팁
  usageTips: string[];

  // 대안 (강요 아님)
  alternatives: {
    product: Product;
    reason: string;
    matchScore: number;
  }[];

  // 액션
  actions: {
    proceedAnyway: boolean;  // 항상 true
    showAlternatives: boolean;
    showTips: boolean;
  };
}
```

---

### J-4: 피드백 & 개인화

> 사용자 피드백 수집 + 추천 정확도 개선

#### 2.4.1 피드백 유형

```typescript
type FeedbackType =
  | 'purchase_review'      // 구매 후 리뷰
  | 'size_feedback'        // 사이즈 피드백
  | 'match_feedback'       // 매칭 정확도
  | 'recommendation_rating' // 추천 평가
  | 'usage_report';        // 사용 후기

interface UserFeedback {
  id: string;
  clerkUserId: string;
  type: FeedbackType;

  // 대상
  productId?: string;
  recommendationId?: string;

  // 피드백 내용
  rating?: number;         // 1-5
  sizeFit?: 'small' | 'perfect' | 'large';
  colorAccuracy?: 'different' | 'similar' | 'exact';
  wouldRecommend?: boolean;

  // 텍스트
  comment?: string;
  pros?: string[];
  cons?: string[];

  // 사진
  photos?: string[];

  createdAt: Date;
}
```

#### 2.4.2 피드백 수집 시점

| 시점 | 트리거 | 피드백 유형 |
|------|--------|------------|
| 구매 직후 | 외부 링크 클릭 추적 | 구매 확인 |
| 배송 완료 추정 | 구매 + 3-7일 | 사이즈, 색상 |
| 정기 체크 | 월 1회 | 사용 만족도 |
| 재구매 시 | 동일 제품/브랜드 | 재구매 이유 |

#### 2.4.3 개인화 설정

```typescript
interface UserPreferences {
  clerkUserId: string;

  // 예산 설정
  budget: {
    clothing?: { min?: number; max?: number; preferred?: number };
    skincare?: { min?: number; max?: number; preferred?: number };
    supplements?: { min?: number; max?: number; preferred?: number };
  };

  // 브랜드 선호
  brands: {
    favorites: string[];
    blocked: string[];
  };

  // 쇼핑 선호
  shopping: {
    preferredPlatforms: string[];
    prioritizeFreeDelivery: boolean;
    prioritizeFastDelivery: boolean;
    prioritizePoints: boolean;
  };

  // 추천 설정
  recommendations: {
    showAlternatives: boolean;      // 대안 표시
    showPriceComparison: boolean;   // 가격 비교
    notifyPriceDrop: boolean;       // 가격 하락 알림
    notifyRestock: boolean;         // 재입고 알림
  };

  // 알림 설정
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
}
```

---

### J-5: 리마인더 & 알림

> 소진 알림, 가격 변동, 추천 업데이트

#### 2.5.1 알림 유형

```typescript
type NotificationType =
  | 'product_running_low'   // 제품 소진 예정
  | 'expiry_approaching'    // 유통기한 임박
  | 'price_drop'            // 가격 하락
  | 'back_in_stock'         // 재입고
  | 'new_recommendation'    // 새 추천
  | 'size_available'        // 원하는 사이즈 입고
  | 'similar_product'       // 유사 제품 발견
  | 'reorder_reminder';     // 재주문 시기

interface Notification {
  id: string;
  clerkUserId: string;
  type: NotificationType;

  // 내용
  title: string;
  message: string;
  imageUrl?: string;

  // 연결
  productId?: string;
  inventoryItemId?: string;
  actionUrl?: string;

  // 상태
  read: boolean;
  readAt?: Date;

  // 예약
  scheduledFor?: Date;
  sentAt?: Date;

  createdAt: Date;
}
```

#### 2.5.2 소진 예측

```typescript
interface ConsumptionPrediction {
  inventoryItemId: string;

  // 예측 기반 데이터
  purchaseDate: Date;
  averageUsageDays: number;    // 평균 사용 기간
  usagePattern: 'daily' | 'weekly' | 'occasional';

  // 예측 결과
  estimatedEmptyDate: Date;
  confidenceLevel: number;      // 0-1

  // 알림 설정
  reminderDays: number;         // 며칠 전 알림
  autoReorderEnabled: boolean;
}
```

#### 2.5.3 가격 모니터링

```typescript
interface PriceWatch {
  id: string;
  clerkUserId: string;
  productId: string;

  // 조건
  targetPrice?: number;        // 목표 가격
  percentDrop?: number;        // % 하락 시
  platforms: string[];         // 모니터링 플랫폼

  // 현재 상태
  currentLowestPrice: number;
  lowestPlatform: string;
  priceHistory: { date: Date; price: number; platform: string }[];

  // 알림
  notified: boolean;
  notifiedAt?: Date;

  createdAt: Date;
  expiresAt?: Date;
}
```

---

### J-6: 운동기구 매칭 (W-1 연동)

> 운동 목표 기반 기구/장비 추천

#### 2.6.1 운동기구 카테고리

```typescript
type WorkoutEquipmentCategory =
  | 'cardio'           // 유산소 (러닝머신, 자전거)
  | 'strength'         // 근력 (덤벨, 바벨, 케틀벨)
  | 'resistance'       // 저항 (밴드, 튜빙)
  | 'flexibility'      // 유연성 (요가매트, 폼롤러)
  | 'wearable'         // 웨어러블 (워치, 밴드)
  | 'apparel'          // 운동복 (의류, 신발)
  | 'accessory'        // 액세서리 (장갑, 벨트)
  | 'supplement';      // 보조제 (프로틴, BCAA)
```

#### 2.6.2 운동 목표 매칭

```typescript
interface WorkoutEquipmentMatch {
  // 사용자 운동 프로필 (W-1 연동)
  workoutGoal: WorkoutGoal;
  fitnessLevel: FitnessLevel;
  preferredWorkouts: WorkoutType[];
  homeGym: boolean;

  // 추천 기구
  recommendations: {
    category: WorkoutEquipmentCategory;
    priority: 'essential' | 'recommended' | 'optional';
    products: SmartRecommendation[];
    reason: string;
  }[];

  // 운동 플랜 연동
  linkedPlan?: {
    planId: string;
    requiredEquipment: string[];
    optionalEquipment: string[];
  };
}
```

#### 2.6.3 홈짐 구성 추천

```typescript
interface HomeGymSetup {
  budget: 'basic' | 'intermediate' | 'advanced';
  spaceSize: 'small' | 'medium' | 'large';
  goals: WorkoutGoal[];

  // 추천 세트
  essentialSet: {
    items: SmartRecommendation[];
    totalCost: number;
    description: string;
  };

  expandedSet?: {
    items: SmartRecommendation[];
    totalCost: number;
    description: string;
  };

  // 단계별 구매 가이드
  purchasePlan: {
    phase: number;
    items: SmartRecommendation[];
    cost: number;
    description: string;
  }[];
}
```

---

## 3. 데이터베이스 스키마

### 3.1 인벤토리 확장 (기존 테이블)

> ⚠️ `user_inventory` 테이블은 Phase I-2에서 이미 생성됨. 아래는 **ALTER**만 수행.

```sql
-- 기존 user_inventory 테이블에 컬럼 추가
ALTER TABLE user_inventory
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES affiliate_products(id),
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 새 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_product ON user_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON user_inventory(barcode);
```

### 3.2 바코드 DB (NEW)

```sql
-- 제품 바코드 매핑 (스캔 기능용)
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  barcode TEXT UNIQUE NOT NULL,
  barcode_type TEXT DEFAULT 'EAN13',  -- EAN13, UPC, QR

  -- 제품 연결
  product_id UUID REFERENCES affiliate_products(id),

  -- 제품 정보 (DB에 없는 제품용)
  product_name TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,

  -- 메타
  source TEXT,  -- 'user_report', 'api', 'crawl'
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_barcode_lookup ON product_barcodes(barcode);
CREATE INDEX idx_barcode_product ON product_barcodes(product_id);
```

### 3.3 사용자 설정 (NEW)

```sql
-- 사용자 개인화 설정
CREATE TABLE user_preferences (
  clerk_user_id TEXT PRIMARY KEY,

  -- 예산 설정 (JSONB)
  budget JSONB DEFAULT '{}'::jsonb,
  -- { "clothing": {"min": 0, "max": 100000}, "skincare": {...}, "supplements": {...} }

  -- 브랜드 선호
  favorite_brands TEXT[] DEFAULT '{}',
  blocked_brands TEXT[] DEFAULT '{}',

  -- 쇼핑 선호
  preferred_platforms TEXT[] DEFAULT '{}',
  prioritize_free_delivery BOOLEAN DEFAULT TRUE,
  prioritize_fast_delivery BOOLEAN DEFAULT FALSE,
  prioritize_points BOOLEAN DEFAULT FALSE,

  -- 추천 설정
  show_alternatives BOOLEAN DEFAULT TRUE,
  show_price_comparison BOOLEAN DEFAULT TRUE,
  notify_price_drop BOOLEAN DEFAULT TRUE,
  notify_restock BOOLEAN DEFAULT TRUE,

  -- 알림 설정
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'daily',  -- realtime, daily, weekly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 3.4 신체 치수

```sql
-- 사용자 신체 치수
CREATE TABLE user_body_measurements (
  clerk_user_id TEXT PRIMARY KEY,

  -- 기본
  height NUMERIC,
  weight NUMERIC,
  body_type TEXT,

  -- 상세 (cm)
  chest NUMERIC,
  waist NUMERIC,
  hip NUMERIC,
  shoulder NUMERIC,
  arm_length NUMERIC,
  inseam NUMERIC,
  foot_length NUMERIC,

  -- 선호
  preferred_fit TEXT DEFAULT 'regular',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 브랜드별 사이즈 기록
CREATE TABLE user_size_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,

  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  fit TEXT,  -- small, perfect, large

  product_id UUID REFERENCES affiliate_products(id),
  purchase_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_size_history_user ON user_size_history(clerk_user_id);
CREATE INDEX idx_size_history_brand ON user_size_history(brand_id);
```

### 3.5 브랜드 사이즈 차트

```sql
-- 브랜드 사이즈 차트
CREATE TABLE brand_size_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  country TEXT,  -- KR, US, EU

  category TEXT NOT NULL,  -- top, bottom, shoes 등
  fit_style TEXT,  -- slim, regular, oversized

  -- 사이즈 매핑 (JSONB)
  size_mappings JSONB NOT NULL,

  -- 메타
  source TEXT,
  last_verified DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_brand_size_unique
  ON brand_size_charts(brand_id, category);

-- 제품별 실측
CREATE TABLE product_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,

  -- 사이즈별 실측 (JSONB)
  size_measurements JSONB NOT NULL,

  -- 데이터 품질
  source TEXT,  -- official, musinsa, user_report, ai_extracted
  reliability NUMERIC DEFAULT 0.5,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_measurements_product
  ON product_measurements(product_id);
```

### 3.6 가격 모니터링

```sql
-- 가격 모니터링
CREATE TABLE price_watches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  product_id UUID NOT NULL,

  -- 조건
  target_price NUMERIC,
  percent_drop NUMERIC,
  platforms TEXT[],

  -- 현재 상태
  current_lowest_price NUMERIC,
  lowest_platform TEXT,

  -- 알림
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_price_watch_user ON price_watches(clerk_user_id);
CREATE INDEX idx_price_watch_product ON price_watches(product_id);

-- 가격 히스토리
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  platform TEXT NOT NULL,

  price NUMERIC NOT NULL,
  original_price NUMERIC,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product
  ON price_history(product_id, recorded_at DESC);
```

### 3.7 사용자 피드백

```sql
-- 사용자 피드백
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,

  feedback_type TEXT NOT NULL,
  product_id UUID,
  recommendation_id UUID,

  -- 피드백 내용
  rating INTEGER,
  size_fit TEXT,
  color_accuracy TEXT,
  would_recommend BOOLEAN,

  comment TEXT,
  pros TEXT[],
  cons TEXT[],
  photos TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON user_feedback(clerk_user_id);
CREATE INDEX idx_feedback_product ON user_feedback(product_id);
```

### 3.8 알림

```sql
-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,

  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,

  product_id UUID,
  inventory_item_id UUID,
  action_url TEXT,

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(clerk_user_id);
CREATE INDEX idx_notifications_unread
  ON notifications(clerk_user_id) WHERE read = FALSE;
```

### 3.9 RLS 정책

```sql
-- 인벤토리 RLS
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inventory"
  ON user_inventory
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 신체 치수 RLS
ALTER TABLE user_body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own measurements"
  ON user_body_measurements
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 사이즈 기록 RLS
ALTER TABLE user_size_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own size history"
  ON user_size_history
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 피드백 RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON user_feedback
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 알림 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 가격 모니터링 RLS
ALTER TABLE price_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price watches"
  ON price_watches
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

---

## 4. API 설계

### 4.1 인벤토리 API

```typescript
// GET /api/inventory
// 인벤토리 목록 조회
interface GetInventoryParams {
  category?: InventoryCategory;
  status?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// POST /api/inventory
// 아이템 추가
interface AddInventoryItemBody {
  category: InventoryCategory;
  productId?: string;
  customName?: string;
  brand?: string;
  color?: string;
  size?: string;
  purchaseDate?: string;
  expiryDate?: string;
  imageUrl?: string;
  notes?: string;
  tags?: string[];
}

// PUT /api/inventory/:id
// 아이템 수정

// DELETE /api/inventory/:id
// 아이템 삭제

// GET /api/inventory/check/:productId
// 중복 체크
interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingItem?: InventoryItem;
  similarItems?: InventoryItem[];
}
```

### 4.2 사이즈 API

```typescript
// GET /api/size/measurements
// 내 신체 치수 조회

// PUT /api/size/measurements
// 신체 치수 업데이트
interface UpdateMeasurementsBody {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armLength?: number;
  inseam?: number;
  footLength?: number;
  preferredFit?: string;
}

// GET /api/size/recommend/:productId
// 제품 사이즈 추천
interface SizeRecommendationResponse {
  recommendedSize: string;
  confidence: number;
  basis: 'history' | 'measurements' | 'brand_chart' | 'general';
  alternatives: {
    size: string;
    note: string;
  }[];
  brandInfo?: {
    fitStyle: string;
    sizeNote: string;
  };
}

// POST /api/size/feedback
// 사이즈 피드백
interface SizeFeedbackBody {
  productId: string;
  brandId: string;
  category: string;
  size: string;
  fit: 'small' | 'perfect' | 'large';
}
```

### 4.3 추천 API

```typescript
// GET /api/recommendations
// 스마트 추천 목록
interface GetRecommendationsParams {
  category?: string;
  analysisType?: string;  // skin, color, body, nutrition, workout
  includeOwned?: boolean;
  maxPrice?: number;
  limit?: number;
}

// GET /api/recommendations/:productId
// 단일 제품 상세 추천 정보
interface ProductRecommendationResponse {
  product: AffiliateProduct;
  matchScore: number;
  matchReasons: MatchReason[];
  sizeRecommendation?: SizeRecommendation;
  purchaseOptions: PurchaseOption[];
  alreadyOwned: boolean;
  alternatives: AlternativeProduct[];
}

// GET /api/recommendations/outfit
// 코디 추천
interface OutfitRecommendationParams {
  occasion?: string;
  season?: string;
  style?: string;
  useInventory?: boolean;
}

// POST /api/recommendations/feedback
// 추천 피드백
interface RecommendationFeedbackBody {
  recommendationId: string;
  productId: string;
  action: 'clicked' | 'purchased' | 'saved' | 'dismissed';
  rating?: number;
  comment?: string;
}
```

### 4.4 가격 비교 API

```typescript
// GET /api/price/compare/:productId
// 가격 비교
interface PriceComparisonResponse {
  productId: string;
  options: PurchaseOption[];
  bestPrice: PurchaseOption;
  fastestDelivery: PurchaseOption;
  bestValue: PurchaseOption;
  lastUpdated: string;
}

// POST /api/price/watch
// 가격 알림 등록
interface PriceWatchBody {
  productId: string;
  targetPrice?: number;
  percentDrop?: number;
  platforms?: string[];
}

// GET /api/price/watches
// 내 가격 알림 목록

// DELETE /api/price/watch/:id
// 가격 알림 삭제
```

### 4.5 알림 API

```typescript
// GET /api/notifications
// 알림 목록
interface GetNotificationsParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

// PUT /api/notifications/:id/read
// 읽음 처리

// PUT /api/notifications/read-all
// 전체 읽음 처리

// DELETE /api/notifications/:id
// 알림 삭제

// GET /api/notifications/preferences
// 알림 설정 조회

// PUT /api/notifications/preferences
// 알림 설정 업데이트
```

---

## 5. 기술 구현

### 5.1 데이터 동기화

```typescript
// 가격 동기화 Job (Vercel Cron)
// cron: 0 */6 * * *  (6시간마다)

async function syncProductPrices() {
  const products = await getActiveProducts();

  for (const product of products) {
    // 플랫폼별 가격 조회
    const prices = await Promise.allSettled([
      fetchCoupangPrice(product),
      fetchNaverPrice(product),
      fetchMusinsaPrice(product),
      // ...
    ]);

    // 가격 저장
    await savePriceHistory(product.id, prices);

    // 가격 하락 체크 → 알림
    await checkPriceDropAlerts(product.id, prices);
  }
}
```

### 5.2 제품 매칭 알고리즘

```typescript
interface ProductMatchingConfig {
  // 가중치
  weights: {
    personalColor: number;   // 0.3
    skinType: number;        // 0.25
    bodyType: number;        // 0.2
    userPreference: number;  // 0.15
    rating: number;          // 0.1
  };

  // 필터
  filters: {
    minRating: number;
    maxPrice?: number;
    excludeOwned: boolean;
    inStockOnly: boolean;
  };
}

function calculateMatchScore(
  product: AffiliateProduct,
  userProfile: UserProfile,
  config: ProductMatchingConfig
): number {
  let score = 0;

  // 퍼스널컬러 매칭
  if (product.personalColors?.includes(userProfile.personalColor)) {
    score += config.weights.personalColor * 100;
  }

  // 피부 타입 매칭
  if (product.skinTypes?.includes(userProfile.skinType)) {
    score += config.weights.skinType * 100;
  }

  // ... 기타 매칭 로직

  return Math.min(100, score);
}
```

### 5.3 캐싱 전략

```typescript
// Redis 캐시 키 구조
const CACHE_KEYS = {
  priceComparison: (productId: string) => `price:${productId}`,
  sizeRecommendation: (userId: string, productId: string) =>
    `size:${userId}:${productId}`,
  recommendations: (userId: string, category: string) =>
    `reco:${userId}:${category}`,
};

// TTL 설정
const CACHE_TTL = {
  priceComparison: 60 * 60 * 6,      // 6시간
  sizeRecommendation: 60 * 60 * 24,  // 24시간
  recommendations: 60 * 30,           // 30분
};
```

### 5.4 이미지 인식 (바코드/제품)

```typescript
// lib/vision/product-recognition.ts

async function recognizeProduct(imageUrl: string): Promise<{
  productId?: string;
  barcode?: string;
  brand?: string;
  productName?: string;
  confidence: number;
}> {
  // Gemini Vision API 활용
  const result = await analyzeProductImage(imageUrl);

  // 바코드가 있으면 DB 조회
  if (result.barcode) {
    const product = await findProductByBarcode(result.barcode);
    if (product) {
      return { productId: product.id, ...result };
    }
  }

  // 텍스트 기반 검색
  if (result.brand && result.productName) {
    const product = await searchProduct(result.brand, result.productName);
    if (product) {
      return { productId: product.id, ...result };
    }
  }

  return result;
}
```

---

## 6. 보안 & 개인정보

### 6.1 데이터 보호

| 데이터 | 보호 수준 | 조치 |
|--------|----------|------|
| 신체 치수 | 민감 | RLS + 암호화 |
| 구매 내역 | 개인 | RLS |
| 인벤토리 | 개인 | RLS |
| 가격 비교 | 공개 | 캐싱 |
| 제품 정보 | 공개 | - |

### 6.2 개인정보 처리

```typescript
// 개인정보 수집 동의 항목
interface PrivacyConsent {
  // 필수
  termsOfService: boolean;
  privacyPolicy: boolean;

  // 선택 (마케팅)
  marketingEmail?: boolean;
  marketingPush?: boolean;
  thirdPartySharing?: boolean;

  // 민감 정보
  bodyMeasurements?: boolean;
  healthData?: boolean;

  consentedAt: Date;
  version: string;
}
```

### 6.3 데이터 삭제

```typescript
// 계정 삭제 시 처리
async function deleteUserData(clerkUserId: string) {
  // 1. 인벤토리 삭제
  await supabase
    .from('user_inventory')
    .delete()
    .eq('clerk_user_id', clerkUserId);

  // 2. 신체 데이터 삭제
  await supabase
    .from('user_body_measurements')
    .delete()
    .eq('clerk_user_id', clerkUserId);

  // 3. 사이즈 기록 삭제
  await supabase
    .from('user_size_history')
    .delete()
    .eq('clerk_user_id', clerkUserId);

  // 4. 피드백 익명화 (통계용 유지)
  await supabase
    .from('user_feedback')
    .update({ clerk_user_id: 'anonymous' })
    .eq('clerk_user_id', clerkUserId);

  // 5. 가격 알림 삭제
  await supabase
    .from('price_watches')
    .delete()
    .eq('clerk_user_id', clerkUserId);

  // 6. 알림 삭제
  await supabase
    .from('notifications')
    .delete()
    .eq('clerk_user_id', clerkUserId);
}
```

---

## 7. 구현 로드맵

### Phase J-1: 통합 인벤토리 (Week 1-2)

- [ ] DB 마이그레이션 (user_inventory)
- [ ] 인벤토리 타입 정의
- [ ] 인벤토리 Repository
- [ ] 인벤토리 API (CRUD)
- [ ] 인벤토리 UI (등록, 목록, 상세)
- [ ] 중복 체크 기능
- [ ] 테스트

### Phase J-2: 사이즈 매칭 (Week 3-4)

- [ ] DB 마이그레이션 (measurements, brand_charts)
- [ ] 사이즈 타입 정의
- [ ] 신체 치수 입력 UI
- [ ] 브랜드 사이즈 데이터 수집 (무신사 10개 브랜드)
- [ ] 사이즈 추천 알고리즘
- [ ] 사이즈 API
- [ ] 테스트

### Phase J-3: 스마트 추천 (Week 5-6)

- [ ] 추천 엔진 구현
- [ ] 크로스 모듈 통합 (PC-1, S-1, C-1, N-1, W-1)
- [ ] 가격 비교 API 연동
- [ ] 추천 UI
- [ ] 코디 추천 (의류)
- [ ] 테스트

### Phase J-4: 피드백 & 알림 (Week 7-8)

- [ ] DB 마이그레이션 (feedback, notifications)
- [ ] 피드백 수집 시스템
- [ ] 알림 시스템
- [ ] 가격 모니터링 Job
- [ ] 소진 예측 알고리즘
- [ ] 테스트

### 마일스톤

| 마일스톤 | 목표일 | 검증 기준 |
|---------|--------|----------|
| J-1 완료 | +2주 | 인벤토리 CRUD + 중복 체크 |
| J-2 완료 | +4주 | 10개 브랜드 사이즈 매칭 |
| J-3 완료 | +6주 | 크로스 모듈 추천 동작 |
| J-4 완료 | +8주 | 알림 시스템 + 피드백 |

---

## 8. 성공 지표

### 8.1 비즈니스 KPI

| 지표 | 목표 |
|------|------|
| 어필리에이트 전환율 | 3% → 5% |
| 평균 주문 금액 | +15% |
| 재구매율 | +20% |
| 인벤토리 사용자 | 30% MAU |

### 8.2 사용자 경험 KPI

| 지표 | 목표 |
|------|------|
| 사이즈 정확도 | 85% "perfect" fit |
| 추천 만족도 | 4.2/5.0 |
| 중복 구매 방지 | -30% |
| 알림 클릭률 | 15% |

---

## 9. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 브랜드 사이즈 데이터 부족 | 추천 정확도 저하 | 사용자 피드백 기반 학습 |
| 가격 API 제한 | 비교 기능 불가 | 캐싱 + 수동 업데이트 |
| 무신사 크롤링 차단 | 실측 데이터 불가 | 공식 사이즈 차트 활용 |
| 사용자 데이터 입력 부족 | 개인화 불가 | 점진적 수집 + 인센티브 |

---

**Version History**

| 버전 | 날짜 | 변경 사항 |
|------|------|----------|
| 1.0 | 2025-12-29 | 초안 작성 |
| 1.1 | 2025-12-29 | 제품 등록 방식 추가 (Multi-Modal, 라벨 없는 제품) |
| 1.2 | 2025-12-29 | 기존 Phase I-2 인벤토리 연동, 바코드 DB, user_preferences 테이블 추가 |
