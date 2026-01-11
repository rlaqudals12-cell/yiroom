# SDD-PRODUCT-SCAN: 제품 스캔 맞춤 분석

> **Version**: 1.0
> **Status**: Draft
> **Created**: 2026-01-11
> **Phase**: Phase F

---

## 1. 개요 및 목적

### 1.1 배경

- 사용자가 이미 보유한 제품이 자신의 피부/퍼스널 컬러에 맞는지 알기 어려움
- 화장품 성분 분석 앱(화해)은 일반적인 정보만 제공, **개인화 부재**
- 이룸의 기존 분석 데이터(S-1, PC-1, C-1)를 활용한 차별화 기회

### 1.2 목적

1. **바코드/성분표 스캔** → 제품 정보 인식
2. **사용자 분석 데이터 연동** → 맞춤 호환성 분석
3. **성분 주의사항/시너지 안내** → 안전한 사용 가이드
4. **글로벌 제품 지원** → 다국어 성분 인식

### 1.3 핵심 가치

```
"내가 가진 제품, 나한테 맞을까?"
→ 스캔 한 번으로 나만의 맞춤 분석
```

---

## 2. 사용자 플로우

### 2.1 메인 플로우

```
┌──────────────────────────────────────────────────────────────┐
│                    제품 스캔 플로우                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] 진입점                                                  │
│      ├── 하단 탭 "스캔" 버튼                                 │
│      ├── 제품 상세 페이지 "내 제품 스캔"                      │
│      └── 홈 퀵 액션 "제품 확인"                              │
│                                                              │
│  [2] 스캔 방식 선택                                          │
│      ┌─────────────────────────────────────────────────┐    │
│      │  ┌─────────┐    ┌─────────┐    ┌─────────┐     │    │
│      │  │ 바코드  │    │ 성분표  │    │  검색   │     │    │
│      │  │  스캔   │    │  촬영   │    │        │     │    │
│      │  └─────────┘    └─────────┘    └─────────┘     │    │
│      └─────────────────────────────────────────────────┘    │
│                                                              │
│  [3] 제품 인식                                               │
│      ├── 바코드 → DB 조회 → 제품 정보                        │
│      ├── 성분표 OCR → Gemini 분석 → 성분 목록                │
│      └── 검색 → 제품 DB 검색 → 선택                          │
│                                                              │
│  [4] 맞춤 분석 결과                                          │
│      ├── 피부 호환성 (S-1 연동)                              │
│      ├── 컬러 매칭 (PC-1 연동, 색조만)                       │
│      ├── 성분 주의사항                                       │
│      └── 추천 사용법                                         │
│                                                              │
│  [5] 후속 액션                                               │
│      ├── "내 제품함에 추가"                                  │
│      ├── "비슷한 제품 추천"                                  │
│      └── "공유하기"                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 에러 플로우

| 상황             | 처리                                     |
| ---------------- | ---------------------------------------- |
| 바코드 인식 실패 | "성분표 촬영" 또는 "직접 검색" 안내      |
| 제품 DB에 없음   | 성분표 촬영으로 전환, 커뮤니티 등록 유도 |
| 분석 데이터 없음 | "피부 분석 먼저 진행" CTA                |
| OCR 실패         | 재촬영 안내, 수동 입력 옵션              |

---

## 3. 바코드/OCR 인식 방법

### 3.1 바코드 인식

#### 기술 옵션 비교

| 방법                     | 장점            | 단점          | 권장             |
| ------------------------ | --------------- | ------------- | ---------------- |
| **BarcodeDetector API**  | 네이티브, 빠름  | Safari 미지원 | ⚠️ Fallback 필요 |
| **zxing-js**             | 크로스 브라우저 | 번들 크기     | ✅ 웹 권장       |
| **expo-barcode-scanner** | RN 네이티브     | 웹 미지원     | ✅ 모바일 권장   |
| **Gemini Vision**        | OCR 통합        | API 비용      | ⚠️ Fallback용    |

#### 구현 코드

```typescript
// lib/scan/barcode.ts
import { BrowserMultiFormatReader } from '@zxing/library';

export async function scanBarcode(videoElement: HTMLVideoElement): Promise<string | null> {
  const codeReader = new BrowserMultiFormatReader();

  try {
    const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoElement);
    return result.getText();
  } catch (error) {
    console.error('[Scan] Barcode recognition failed:', error);
    return null;
  }
}

// 바코드 타입 지원
// - EAN-13 (국제 표준)
// - EAN-8
// - UPC-A (미국)
// - CODE-128
```

### 3.2 성분표 OCR

#### Gemini Vision 프롬프트

```typescript
// lib/scan/ingredient-ocr.ts
const INGREDIENT_OCR_PROMPT = `
이 화장품 성분표/전성분 이미지를 분석해주세요.

📋 추출할 정보:
1. 제품명 (있는 경우)
2. 브랜드명 (있는 경우)
3. 전성분 목록 (순서대로)

⚠️ 주의사항:
- 성분명은 가능한 INCI 명칭으로 변환
- 한글 성분명도 함께 제공
- 농도/함량이 표기되어 있으면 포함
- 읽기 어려운 부분은 "불명확"으로 표시

다음 JSON 형식으로만 응답:
{
  "productName": "[제품명 또는 null]",
  "brandName": "[브랜드명 또는 null]",
  "ingredients": [
    {
      "order": 1,
      "nameKo": "[한글명]",
      "nameInci": "[INCI명]",
      "concentration": "[높음|중간|낮음|불명]",
      "note": "[특이사항 또는 null]"
    }
  ],
  "confidence": "[high|medium|low]",
  "language": "[ko|en|ja|zh|other]"
}
`;
```

### 3.3 제품 DB 조회

```typescript
// lib/scan/product-lookup.ts
interface ProductLookupResult {
  found: boolean;
  source: 'internal_db' | 'open_beauty_facts' | 'ocr_analysis';
  product?: Product;
  confidence: number;
}

export async function lookupProduct(barcode: string): Promise<ProductLookupResult> {
  // 1. 내부 DB 조회
  const internalResult = await supabase
    .from('global_products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (internalResult.data) {
    return {
      found: true,
      source: 'internal_db',
      product: internalResult.data,
      confidence: 1.0,
    };
  }

  // 2. Open Beauty Facts API (무료 글로벌 DB)
  const obfResult = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
  const obfData = await obfResult.json();

  if (obfData.status === 1) {
    return {
      found: true,
      source: 'open_beauty_facts',
      product: transformObfProduct(obfData.product),
      confidence: 0.9,
    };
  }

  // 3. 미발견
  return { found: false, source: 'ocr_analysis', confidence: 0 };
}
```

---

## 4. 사용자 분석 데이터 연동

### 4.1 연동 데이터 매핑

| 분석 모듈           | 연동 데이터                     | 활용           |
| ------------------- | ------------------------------- | -------------- |
| **S-1 피부**        | skinType, concerns, sensitivity | 성분 호환성    |
| **PC-1 퍼스널컬러** | seasonType, tone                | 색조 제품 매칭 |
| **C-1 체형**        | -                               | 현재 미사용    |
| **N-1 영양**        | allergies, restrictions         | 섭취 제품 주의 |

### 4.2 호환성 분석 로직

```typescript
// lib/scan/compatibility.ts
interface CompatibilityResult {
  overallScore: number; // 0-100
  skinCompatibility: {
    score: number;
    goodPoints: CompatibilityPoint[];
    warnings: CompatibilityPoint[];
  };
  colorMatch?: {
    isRecommended: boolean;
    matchScore: number;
    reason: string;
    alternatives?: string[];
  };
  ingredientAnalysis: {
    beneficial: IngredientNote[];
    caution: IngredientNote[];
    avoid: IngredientNote[];
    interactions: InteractionWarning[];
  };
}

interface CompatibilityPoint {
  title: string;
  description: string;
  basedOn: 'skin_type' | 'sensitivity' | 'concerns' | 'personal_color';
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeCompatibility(
  product: Product,
  userAnalysis: UserAnalysisData
): Promise<CompatibilityResult> {
  const { skinAnalysis, personalColor } = userAnalysis;

  // 피부 호환성 계산
  const skinCompat = calculateSkinCompatibility(product.ingredients, skinAnalysis);

  // 색조 제품인 경우 컬러 매칭
  const colorMatch =
    product.category === 'makeup' ? calculateColorMatch(product, personalColor) : undefined;

  // 성분 분석
  const ingredientAnalysis = await analyzeIngredients(product.ingredients, skinAnalysis);

  // 종합 점수
  const overallScore = calculateOverallScore(skinCompat, colorMatch, ingredientAnalysis);

  return {
    overallScore,
    skinCompatibility: skinCompat,
    colorMatch,
    ingredientAnalysis,
  };
}
```

### 4.3 피부 타입별 성분 매칭

```typescript
// lib/scan/skin-ingredient-match.ts
const SKIN_TYPE_INGREDIENTS: Record<SkinType, IngredientRecommendation> = {
  dry: {
    beneficial: ['Hyaluronic Acid', 'Ceramide', 'Squalane', 'Shea Butter'],
    caution: ['Alcohol Denat.', 'Salicylic Acid'],
    avoid: ['Benzoyl Peroxide (고농도)'],
  },
  oily: {
    beneficial: ['Niacinamide', 'Salicylic Acid', 'Tea Tree', 'Zinc'],
    caution: ['Heavy Oils', 'Petroleum'],
    avoid: ['Coconut Oil', 'Isopropyl Myristate'],
  },
  sensitive: {
    beneficial: ['Centella Asiatica', 'Allantoin', 'Panthenol', 'Aloe Vera'],
    caution: ['Fragrance', 'Essential Oils', 'AHA/BHA'],
    avoid: ['Alcohol', 'Sulfates', 'Parabens'],
  },
  combination: {
    beneficial: ['Niacinamide', 'Hyaluronic Acid', 'Green Tea'],
    caution: ['Heavy Creams'],
    avoid: [],
  },
  normal: {
    beneficial: ['Vitamin C', 'Peptides', 'Antioxidants'],
    caution: [],
    avoid: [],
  },
};
```

### 4.4 성분 상호작용 경고

```typescript
// lib/scan/ingredient-interactions.ts
const INGREDIENT_INTERACTIONS: InteractionRule[] = [
  {
    ingredient1: 'Retinol',
    ingredient2: 'AHA',
    type: 'avoid_together',
    reason: '함께 사용 시 피부 자극 가능',
    recommendation: '아침/저녁 분리 사용',
  },
  {
    ingredient1: 'Retinol',
    ingredient2: 'BHA',
    type: 'avoid_together',
    reason: '과도한 각질 제거로 자극 유발',
    recommendation: '격일 사용 권장',
  },
  {
    ingredient1: 'Vitamin C',
    ingredient2: 'Niacinamide',
    type: 'synergy',
    reason: '미백 효과 시너지 (과거 우려와 달리 안전)',
    recommendation: '함께 사용 가능',
  },
  {
    ingredient1: 'Vitamin C',
    ingredient2: 'AHA/BHA',
    type: 'caution',
    reason: 'pH 차이로 효과 감소 가능',
    recommendation: '시간차 적용 (20분 이상)',
  },
  {
    ingredient1: 'Benzoyl Peroxide',
    ingredient2: 'Retinol',
    type: 'avoid_together',
    reason: '벤조일퍼옥사이드가 레티놀 비활성화',
    recommendation: '아침 BP, 저녁 레티놀',
  },
];
```

---

## 5. 성분 DB 구조

### 5.1 테이블 설계

```sql
-- 전역 제품 테이블
CREATE TABLE global_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  brand VARCHAR(100),
  category product_category NOT NULL,
  subcategory VARCHAR(50),

  -- 성분 정보
  ingredients JSONB NOT NULL DEFAULT '[]',
  key_ingredients TEXT[], -- 주요 성분 (검색용)

  -- 지역 정보
  origin_country VARCHAR(2), -- ISO 3166-1
  available_regions TEXT[] DEFAULT '{}',

  -- 메타데이터
  image_url TEXT,
  volume VARCHAR(20),
  price_range price_range_enum,

  -- 등급/평점
  ewg_grade SMALLINT CHECK (ewg_grade BETWEEN 1 AND 10),
  cosdna_acne_score SMALLINT,
  cosdna_irritant_score SMALLINT,
  user_rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 추적
  data_source VARCHAR(50), -- 'manual', 'open_beauty_facts', 'user_submitted'
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 성분 마스터 테이블
CREATE TABLE ingredients_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_name VARCHAR(255) UNIQUE NOT NULL,
  name_ko VARCHAR(255),
  name_en VARCHAR(255),
  name_ja VARCHAR(255),
  name_zh VARCHAR(255),

  -- 분류
  category ingredient_category,
  functions TEXT[], -- 'moisturizing', 'exfoliating', 'antioxidant', etc.

  -- 안전성
  ewg_grade SMALLINT,
  ewg_data_availability VARCHAR(20), -- 'good', 'fair', 'limited', 'none'

  -- 피부 타입별 권장
  recommended_for_skin_types TEXT[],
  caution_for_skin_types TEXT[],
  avoid_for_skin_types TEXT[],

  -- 상호작용
  synergy_with TEXT[], -- INCI names
  avoid_with TEXT[], -- INCI names

  -- 설명
  description_ko TEXT,
  benefits_ko TEXT[],
  side_effects_ko TEXT[],

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 제품함 (스캔 히스토리)
CREATE TABLE user_product_shelf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_id UUID REFERENCES global_products(id),

  -- 스캔 정보
  scanned_at TIMESTAMPTZ DEFAULT now(),
  scan_method VARCHAR(20), -- 'barcode', 'ocr', 'search'

  -- 분석 결과 캐시
  compatibility_score INTEGER,
  analysis_result JSONB,

  -- 사용자 메모
  status VARCHAR(20) DEFAULT 'owned', -- 'owned', 'wishlist', 'used_up'
  user_note TEXT,
  rating SMALLINT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_global_products_barcode ON global_products(barcode);
CREATE INDEX idx_global_products_brand ON global_products(brand);
CREATE INDEX idx_global_products_category ON global_products(category);
CREATE INDEX idx_global_products_key_ingredients ON global_products USING GIN(key_ingredients);
CREATE INDEX idx_global_products_available_regions ON global_products USING GIN(available_regions);
CREATE INDEX idx_ingredients_master_inci ON ingredients_master(inci_name);
CREATE INDEX idx_user_product_shelf_user ON user_product_shelf(clerk_user_id);
```

### 5.2 성분 JSON 구조

```typescript
// 제품 성분 JSONB 구조
interface ProductIngredient {
  order: number;
  inciName: string;
  nameKo?: string;
  concentration?: 'high' | 'medium' | 'low';
  purpose?: string[];
  ewgGrade?: number;
}

// 예시
const productIngredients: ProductIngredient[] = [
  {
    order: 1,
    inciName: 'Water',
    nameKo: '정제수',
    concentration: 'high',
    purpose: ['solvent'],
  },
  {
    order: 2,
    inciName: 'Niacinamide',
    nameKo: '나이아신아마이드',
    concentration: 'medium',
    purpose: ['brightening', 'pore_care'],
    ewgGrade: 1,
  },
];
```

---

## 6. UI/UX 설계

### 6.1 화면 구성

#### 6.1.1 스캔 화면

```
┌──────────────────────────────────────┐
│  ←  제품 스캔                    [?] │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                                │  │
│  │      [카메라 뷰파인더]         │  │
│  │                                │  │
│  │     ┌──────────────────┐      │  │
│  │     │  바코드 영역     │      │  │
│  │     └──────────────────┘      │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  바코드를 사각형 안에 맞춰주세요      │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ 성분표   │  │  검색    │         │
│  │  촬영    │  │         │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  ────────────────────────────────    │
│  최근 스캔                           │
│  [제품1] [제품2] [제품3] →           │
│                                      │
└──────────────────────────────────────┘
```

#### 6.1.2 결과 화면

```
┌──────────────────────────────────────┐
│  ←  분석 결과                        │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [제품 이미지]                 │  │
│  │                                │  │
│  │  코스알엑스 AHA/BHA 토너       │  │
│  │  COSRX                         │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🎯 김이룸님 맞춤 점수          │  │
│  │                                │  │
│  │      ████████░░  82점          │  │
│  │                                │  │
│  │  지성 피부에 적합한 제품이에요  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ✅ 좋은 점                          │
│  ┌────────────────────────────────┐  │
│  │ • BHA 함유 - 모공 케어에 효과적 │  │
│  │   (S-1 분석: 모공 점수 45점)   │  │
│  │ • 나이아신아마이드 - 피지 조절  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ⚠️ 주의할 점                        │
│  ┌────────────────────────────────┐  │
│  │ • 민감 피부 - 패치 테스트 권장  │  │
│  │ • 레티놀과 함께 사용 금지      │  │
│  └────────────────────────────────┘  │
│                                      │
│  📊 EWG 등급: 2 (낮은 위험)          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [내 제품함 추가]  [공유하기]  │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### 6.2 컴포넌트 구조

```
components/scan/
├── ScanCamera.tsx           # 카메라 뷰 + 바코드 인식
├── IngredientCapture.tsx    # 성분표 촬영 모드
├── ProductSearchModal.tsx   # 제품 검색 모달
├── ScanResult/
│   ├── ProductHeader.tsx    # 제품 이미지 + 기본 정보
│   ├── CompatibilityScore.tsx # 맞춤 점수
│   ├── GoodPoints.tsx       # 좋은 점 목록
│   ├── Warnings.tsx         # 주의사항 목록
│   ├── IngredientList.tsx   # 전성분 분석
│   └── ActionButtons.tsx    # 제품함 추가, 공유
├── RecentScans.tsx          # 최근 스캔 히스토리
└── ProductShelf/
    ├── ShelfList.tsx        # 내 제품함 목록
    ├── ShelfItem.tsx        # 개별 제품 카드
    └── ShelfFilters.tsx     # 필터 (카테고리, 점수)
```

### 6.3 접근성

```typescript
// 접근성 요구사항
const a11yRequirements = {
  camera: {
    // 카메라 권한 요청 시 명확한 안내
    permissionPrompt: '바코드 스캔을 위해 카메라 접근이 필요합니다',
    // 시각 장애인을 위한 음성 피드백
    voiceOver: {
      scanning: '바코드를 스캔하고 있습니다',
      success: '제품을 인식했습니다. {productName}',
      failed: '바코드를 인식하지 못했습니다. 다시 시도해주세요',
    },
  },
  results: {
    // 스크린 리더용 구조화
    landmarks: ['제품 정보', '맞춤 점수', '좋은 점', '주의사항'],
    // 점수 음성 안내
    scoreAnnouncement: '맞춤 점수 {score}점. {summary}',
  },
};
```

---

## 7. 글로벌 제품 DB 전략

### 7.1 데이터 소스

| 소스                  | 용도             | 비용      | 커버리지   |
| --------------------- | ---------------- | --------- | ---------- |
| **Open Beauty Facts** | 글로벌 화장품 DB | 무료      | 100K+ 제품 |
| **Open Food Facts**   | 건강식품/보충제  | 무료      | 2M+ 제품   |
| **자체 DB**           | 한국 제품 우선   | 수동 입력 | 지속 확대  |
| **사용자 기여**       | 미등록 제품      | 무료      | 커뮤니티   |

### 7.2 지역별 우선순위

```
Phase 1 (한국 집중)
├── 올리브영 인기 제품 1,000개
├── 쿠팡 뷰티 베스트 500개
└── iHerb 한국 인기 200개

Phase 2 (아시아 확장)
├── 일본: @cosme 랭킹 500개
├── 중국: 小红书 인기 300개
└── 동남아: 왓슨스 인기 200개

Phase 3 (글로벌)
├── 미국: Sephora, Ulta 인기
├── EU: 드러그스토어 인기
└── Open Beauty Facts 연동
```

### 7.3 제품 데이터 갱신

```typescript
// lib/scan/product-sync.ts
export async function syncProductFromOpenBeautyFacts(barcode: string) {
  const response = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
  const data = await response.json();

  if (data.status !== 1) return null;

  const product = data.product;

  return {
    barcode,
    name: product.product_name || product.product_name_ko,
    brand: product.brands,
    ingredients: parseIngredientsList(product.ingredients_text),
    imageUrl: product.image_url,
    category: mapCategory(product.categories_tags),
    originCountry: product.countries_tags?.[0],
    dataSource: 'open_beauty_facts',
  };
}
```

---

## 8. 기술 스택

### 8.1 프론트엔드

| 영역        | 기술                       | 이유            |
| ----------- | -------------------------- | --------------- |
| 바코드 스캔 | zxing-js + BarcodeDetector | 크로스 브라우저 |
| 카메라      | react-webcam               | 안정적          |
| OCR         | Gemini Vision API          | 다국어 지원     |
| 이미지 처리 | sharp (서버)               | 최적화          |

### 8.2 백엔드

| 영역     | 기술                   | 이유      |
| -------- | ---------------------- | --------- |
| API      | Next.js API Routes     | 기존 스택 |
| DB       | Supabase PostgreSQL    | 기존 스택 |
| 외부 API | Open Beauty Facts      | 무료      |
| 캐싱     | Supabase + React Query | 성능      |

### 8.3 모바일 (Expo)

| 영역   | 기술                 |
| ------ | -------------------- |
| 바코드 | expo-barcode-scanner |
| 카메라 | expo-camera          |
| 이미지 | expo-image-picker    |

---

## 9. API 설계

### 9.1 엔드포인트

```typescript
// POST /api/scan/barcode
// 바코드로 제품 조회
interface BarcodeRequest {
  barcode: string;
}

// POST /api/scan/ocr
// 성분표 이미지 OCR
interface OcrRequest {
  imageBase64: string;
}

// POST /api/scan/analyze
// 제품-사용자 호환성 분석
interface AnalyzeRequest {
  productId?: string;
  ingredients?: ProductIngredient[];
}

// GET /api/scan/history
// 스캔 히스토리 조회

// POST /api/scan/shelf
// 내 제품함에 추가
interface AddToShelfRequest {
  productId: string;
  status: 'owned' | 'wishlist';
  note?: string;
}
```

### 9.2 응답 구조

```typescript
interface ScanAnalysisResponse {
  success: boolean;
  product: {
    id: string;
    name: string;
    brand: string;
    imageUrl?: string;
    ingredients: ProductIngredient[];
    ewgGrade?: number;
  };
  compatibility: CompatibilityResult;
  userAnalysisUsed: {
    skinAnalysis: boolean;
    personalColor: boolean;
  };
}
```

---

## 10. 테스트 계획

### 10.1 단위 테스트

| 영역        | 테스트 항목             |
| ----------- | ----------------------- |
| 바코드 파싱 | EAN-13, UPC-A 형식 검증 |
| 성분 매칭   | 피부 타입별 호환성 계산 |
| 상호작용    | 성분 조합 경고 감지     |
| OCR 파싱    | Gemini 응답 JSON 파싱   |

### 10.2 통합 테스트

| 시나리오              | 예상 결과           |
| --------------------- | ------------------- |
| 한국 제품 스캔        | DB 조회 → 분석 결과 |
| 미등록 제품           | OCR 전환 안내       |
| 분석 데이터 없음      | 분석 먼저 CTA       |
| 민감 피부 + 자극 성분 | 경고 표시           |

### 10.3 E2E 테스트

```typescript
// tests/e2e/scan.spec.ts
test('바코드 스캔 후 맞춤 분석 결과 표시', async ({ page }) => {
  // 1. 스캔 페이지 이동
  await page.goto('/scan');

  // 2. 바코드 입력 (테스트용)
  await page.fill('[data-testid="barcode-input"]', '8809598453234');
  await page.click('[data-testid="scan-submit"]');

  // 3. 결과 확인
  await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="compatibility-score"]')).toBeVisible();
});
```

---

## 11. 구현 계획

### 11.1 Phase 구분

| Phase   | 범위                  | 예상 파일 수 |
| ------- | --------------------- | ------------ |
| **F-1** | 바코드 스캔 + DB 조회 | 8-10         |
| **F-2** | 성분 OCR + 분석       | 6-8          |
| **F-3** | 사용자 연동 분석      | 8-10         |
| **F-4** | 내 제품함 + 히스토리  | 6-8          |
| **F-5** | 글로벌 DB 확장        | 4-6          |

### 11.2 시지푸스 적용 분석

```
┌──────────────────────────────────────────────────────────────┐
│              복잡도 분석 (전체 Phase F)                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  파일 영향도: 30+ 파일               → 25점                  │
│  아키텍처: 새 모듈 + DB 스키마       → 20점                  │
│  외부 연동: Gemini + Open Beauty Facts → 15점                │
│  기존 연동: S-1, PC-1 데이터         → 10점                  │
│  테스트: 단위 + 통합 + E2E           → 10점                  │
│  ─────────────────────────────────────────────              │
│  총점: 80점 → Full 트랙                                     │
│                                                              │
│  ✅ /sisyphus 사용 권장                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 11.3 병렬 작업 가능 여부

```
┌──────────────────────────────────────────────────────────────┐
│                    병렬 작업 계획                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  그룹 A (독립 작업) ─────────────────────────────────        │
│  │                                                           │
│  ├── [A1] DB 마이그레이션 (global_products, ingredients)     │
│  ├── [A2] 타입 정의 (types/scan.ts)                          │
│  └── [A3] Mock 데이터 (lib/mock/scan-products.ts)            │
│                                                              │
│  그룹 B (A 완료 후) ─────────────────────────────────        │
│  │                                                           │
│  ├── [B1] 바코드 스캔 유틸 (lib/scan/barcode.ts)             │
│  │         ↓                                                 │
│  ├── [B2] 제품 조회 API (api/scan/barcode/route.ts)          │
│  │                                                           │
│  └── [B3] OCR 유틸 (lib/scan/ingredient-ocr.ts) ← 병렬 가능  │
│           ↓                                                  │
│       [B4] OCR API (api/scan/ocr/route.ts)                   │
│                                                              │
│  그룹 C (A 완료 후, B와 병렬) ────────────────────────       │
│  │                                                           │
│  ├── [C1] 호환성 분석 로직 (lib/scan/compatibility.ts)       │
│  ├── [C2] 성분 상호작용 (lib/scan/interactions.ts)           │
│  └── [C3] 분석 API (api/scan/analyze/route.ts)               │
│                                                              │
│  그룹 D (B, C 완료 후) ──────────────────────────────        │
│  │                                                           │
│  ├── [D1] ScanCamera 컴포넌트                                │
│  ├── [D2] ScanResult 컴포넌트 그룹                           │
│  └── [D3] 페이지 통합 (app/(main)/scan/page.tsx)             │
│                                                              │
│  그룹 E (D 완료 후) ─────────────────────────────────        │
│  │                                                           │
│  ├── [E1] 제품함 기능                                        │
│  ├── [E2] 히스토리 기능                                      │
│  └── [E3] 테스트 작성                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

병렬 가능 조합:
- A1 + A2 + A3 (모두 병렬)
- B1 || B3 (바코드와 OCR 병렬)
- B2 || C1 + C2 (API와 로직 병렬)
- D1 + D2 (컴포넌트 병렬)
- E1 + E2 + E3 (모두 병렬)
```

---

## 12. 위험 요소 및 대응

| 위험                          | 영향             | 대응                                |
| ----------------------------- | ---------------- | ----------------------------------- |
| OCR 정확도 낮음               | 잘못된 성분 분석 | Gemini 프롬프트 튜닝 + 수동 보정 UI |
| Open Beauty Facts 데이터 부족 | 한국 제품 미지원 | 자체 DB 우선 + 사용자 기여          |
| 바코드 인식 실패              | UX 저하          | 다중 인식 방법 제공                 |
| API 비용                      | 예산 초과        | OCR 캐싱 + 요청 제한                |

---

## 13. 성공 지표

| 지표             | 목표 | 측정             |
| ---------------- | ---- | ---------------- |
| 바코드 인식률    | 95%+ | 성공/시도        |
| OCR 정확도       | 85%+ | 사용자 피드백    |
| 분석 완료율      | 80%+ | 스캔 → 결과 도달 |
| 제품함 추가율    | 30%+ | 결과 → 추가      |
| DAU 중 스캔 사용 | 20%+ | 사용자 비율      |

---

**Version History**

| 버전 | 날짜       | 변경 내용 |
| ---- | ---------- | --------- |
| 1.0  | 2026-01-11 | 초안 작성 |
