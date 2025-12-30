# SDD: 바코드 스캔 기능

> **작성일**: 2025-12-30
> **우선순위**: P0 (런칭 후 즉시)
> **예상 작업량**: 2-3일

---

## 1. 개요

### 1.1 목적
음식 및 제품 바코드를 스캔하여 영양 정보를 자동으로 입력하는 기능 제공

### 1.2 사용자 가치
- **편의성**: 수동 입력 대비 90% 시간 절약
- **정확성**: 영양 정보 입력 오류 감소
- **참여율**: 식단 기록 지속률 향상 (경쟁 앱 대비 +15%)

### 1.3 경쟁 분석
| 앱 | 바코드 스캔 | 음식 DB 규모 |
|----|------------|-------------|
| MyFitnessPal | O | 14M+ |
| Lose It! | O | 7M+ |
| **이룸** | X (현재) → O | 확장 예정 |

---

## 2. 기능 요구사항

### 2.1 핵심 기능

#### 2.1.1 바코드 스캔
```yaml
지원 포맷:
  - EAN-13 (한국 표준)
  - EAN-8
  - UPC-A (미국)
  - UPC-E
  - QR Code (제품 URL 연결)

스캔 방식:
  - 카메라 실시간 스캔
  - 갤러리 이미지 선택

인식 성공률 목표: 95%+
스캔 시간: 2초 이내
```

#### 2.1.2 영양 정보 조회
```yaml
데이터 소스 (우선순위):
  1. 로컬 DB (캐싱된 제품)
  2. Open Food Facts API (무료, 글로벌)
  3. 식품안전나라 API (한국 공공데이터)
  4. 사용자 입력 (DB 없을 시)

반환 데이터:
  - 제품명
  - 브랜드
  - 1회 제공량
  - 칼로리
  - 탄수화물/단백질/지방
  - 나트륨
  - 이미지 URL
```

#### 2.1.3 식단 기록 연동
```yaml
흐름:
  1. 바코드 스캔
  2. 영양 정보 조회/표시
  3. 섭취량 조정 (0.5x, 1x, 1.5x, 2x 또는 직접 입력)
  4. 식사 시간 선택 (아침/점심/저녁/간식)
  5. meal_records 테이블에 저장
```

### 2.2 사용자 흐름

```
[영양 페이지] → [바코드 아이콘 클릭]
       ↓
[카메라 권한 요청]
       ↓
[실시간 스캔 화면]
       ↓
[바코드 인식] → [API 조회]
       ↓
[제품 정보 표시] ← [DB 없음] → [수동 입력 유도]
       ↓
[섭취량 선택]
       ↓
[식단 기록 완료]
       ↓
[스트릭 업데이트]
```

---

## 3. 기술 설계

### 3.1 라이브러리 선택

#### 옵션 비교
| 라이브러리 | 크기 | 인식률 | 라이선스 | 오프라인 |
|-----------|------|-------|---------|---------|
| **@nicklasw/barcode-reader** | 15KB | 95% | MIT | O |
| **html5-qrcode** (이미 사용) | 120KB | 98% | MIT | O |
| **Scandit** | 2MB | 99% | 유료 | O |
| **ZXing-js** | 400KB | 93% | Apache | O |

**결정**: `html5-qrcode` 활용 (이미 프로젝트에 포함됨)

### 3.2 파일 구조

```
apps/web/
├── app/(main)/nutrition/
│   └── scan/
│       └── page.tsx              # 스캔 페이지
├── components/nutrition/
│   ├── barcode/
│   │   ├── BarcodeScanner.tsx    # 스캐너 컴포넌트
│   │   ├── ProductResult.tsx     # 결과 표시
│   │   ├── ManualInput.tsx       # 수동 입력 폼
│   │   └── QuantitySelector.tsx  # 섭취량 선택
│   └── index.ts
├── lib/nutrition/
│   └── barcode/
│       ├── scanner.ts            # 스캐너 로직
│       ├── api.ts                # 외부 API 연동
│       └── types.ts              # 타입 정의
└── tests/
    └── components/nutrition/
        └── barcode/
            └── BarcodeScanner.test.tsx
```

### 3.3 데이터 스키마

#### 3.3.1 barcode_products 테이블 (신규)
```sql
CREATE TABLE barcode_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  serving_size VARCHAR(50),
  serving_unit VARCHAR(20),

  -- 영양 정보 (100g 기준)
  calories_per_100g DECIMAL(10,2),
  carbs_per_100g DECIMAL(10,2),
  protein_per_100g DECIMAL(10,2),
  fat_per_100g DECIMAL(10,2),
  sodium_per_100g DECIMAL(10,2),
  sugar_per_100g DECIMAL(10,2),
  fiber_per_100g DECIMAL(10,2),

  -- 1회 제공량 기준
  calories_per_serving DECIMAL(10,2),
  carbs_per_serving DECIMAL(10,2),
  protein_per_serving DECIMAL(10,2),
  fat_per_serving DECIMAL(10,2),

  image_url TEXT,
  source VARCHAR(50), -- 'openfoodfacts', 'foodsafetykorea', 'user'
  verified BOOLEAN DEFAULT FALSE,
  scan_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_barcode_products_barcode ON barcode_products(barcode);
CREATE INDEX idx_barcode_products_name ON barcode_products USING gin(to_tsvector('korean', product_name));

-- RLS 정책 (공개 읽기, 관리자만 쓰기)
ALTER TABLE barcode_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON barcode_products
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON barcode_products
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

#### 3.3.2 meal_records 테이블 확장
```sql
ALTER TABLE meal_records ADD COLUMN IF NOT EXISTS
  barcode_product_id UUID REFERENCES barcode_products(id);
```

### 3.4 API 설계

#### 3.4.1 바코드 조회 API
```typescript
// POST /api/nutrition/barcode/lookup
interface BarcodeLookupRequest {
  barcode: string;
}

interface BarcodeLookupResponse {
  found: boolean;
  product?: BarcodeProduct;
  source?: 'local' | 'openfoodfacts' | 'foodsafetykorea';
}
```

#### 3.4.2 제품 등록 API
```typescript
// POST /api/nutrition/barcode/products
interface CreateProductRequest {
  barcode: string;
  productName: string;
  brand?: string;
  servingSize?: string;
  caloriesPerServing: number;
  carbsPerServing?: number;
  proteinPerServing?: number;
  fatPerServing?: number;
}
```

### 3.5 외부 API 연동

#### Open Food Facts API
```typescript
// https://world.openfoodfacts.org/api/v2/product/{barcode}.json
interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name: string;
    brands: string;
    serving_size: string;
    nutriments: {
      'energy-kcal_100g': number;
      carbohydrates_100g: number;
      proteins_100g: number;
      fat_100g: number;
      sodium_100g: number;
    };
    image_url: string;
  };
}
```

#### 식품안전나라 API (공공데이터)
```typescript
// https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1
// 인증키 필요
```

---

## 4. 구현 체크리스트

### 4.1 Phase 1: 기본 스캐너 (1일)
- [ ] `BarcodeScanner.tsx` 컴포넌트 생성
- [ ] `html5-qrcode` 설정 (EAN-13, EAN-8 지원)
- [ ] 카메라 권한 처리
- [ ] 스캔 결과 콜백
- [ ] `/nutrition/scan` 페이지 생성

### 4.2 Phase 2: API 연동 (1일)
- [ ] `barcode_products` 테이블 마이그레이션
- [ ] Open Food Facts API 연동
- [ ] 로컬 DB 캐싱 로직
- [ ] Fallback 처리 (API 실패 시)
- [ ] 수동 입력 폼

### 4.3 Phase 3: 식단 연동 (0.5일)
- [ ] 섭취량 선택 UI
- [ ] `meal_records` 저장 연동
- [ ] 스트릭 업데이트 트리거
- [ ] 성공 피드백 (토스트)

### 4.4 Phase 4: 테스트 및 완성 (0.5일)
- [ ] 컴포넌트 테스트 작성
- [ ] E2E 테스트 (mock 카메라)
- [ ] 접근성 확인 (aria-label)
- [ ] 오류 상태 UI

---

## 5. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|----------|
| 카메라 권한 거부 | 갤러리에서 이미지 선택 옵션 제공 |
| 바코드 인식 실패 | 재시도 버튼 + 수동 입력 유도 |
| API 조회 실패 | 로컬 캐시 확인 → 수동 입력 |
| 제품 정보 없음 | 수동 입력 후 DB 등록 유도 |
| 오프라인 상태 | 로컬 캐시만 사용 + 나중에 동기화 |
| 저사양 기기 | 해상도 조정 (720p) |

---

## 6. 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 스캔 성공률 | 95%+ | 스캔 시도 vs 인식 성공 |
| API 조회 성공률 | 80%+ | 바코드 vs 제품 발견 |
| 기록 완료율 | 70%+ | 스캔 vs meal_records 저장 |
| 사용자 만족도 | 4.5+/5 | 피드백 설문 |

---

## 7. 보안 고려사항

- [ ] 카메라 스트림은 로컬에서만 처리 (서버 전송 X)
- [ ] API 키는 서버 사이드에서만 사용
- [ ] 사용자 제출 제품은 검증 후 공개

---

## 8. 향후 확장

### 8.1 Phase 2 (MAU 5,000+)
- 한국 편의점 제품 DB 확대 (GS25, CU, 세븐일레븐)
- AI 영수증 인식 (멀티 제품)

### 8.2 Phase 3 (MAU 10,000+)
- 커뮤니티 제품 등록/검증 시스템
- 영양성분표 OCR 자동 인식

---

**Version**: 1.0 | **Created**: 2025-12-30
