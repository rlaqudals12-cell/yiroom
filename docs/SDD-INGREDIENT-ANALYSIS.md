# SDD: 화장품 성분 분석 시스템 (화해 스타일)

**버전**: 1.2
**작성일**: 2026-01-05
**상태**: 🔄 95% 구현 완료 (Phase 1-3 완료, 시드 삽입 미실행)

---

## 개요

### 목표

화해 앱 수준의 화장품 성분 분석 기능 구현. EWG 등급, 주의 성분, 피부타입별 분석 등 전문적인 성분 정보 제공.

### 경쟁사 벤치마크 (화해)

| 기능               | 화해 구현         | 이룸 목표 |
| ------------------ | ----------------- | --------- |
| EWG 등급           | 1-10등급 표시     | Phase 1   |
| 20가지 주의 성분   | 별도 탭 필터      | Phase 1   |
| 알레르기 유발 성분 | 경고 표시         | Phase 1   |
| 피부타입별 성분    | 상세 분석         | Phase 2   |
| 배합목적 분류      | 보습/유연/장벽 등 | Phase 2   |
| AI 성분 요약       | 키워드 추출       | Phase 3   |
| 성분 비율 시각화   | 차트/그래프       | Phase 3   |

### 정보 출처

| 출처                                           | 정보 유형                       | 신뢰도     |
| ---------------------------------------------- | ------------------------------- | ---------- |
| [EWG Skin Deep](https://www.ewg.org/skindeep/) | 위험도 등급 (1-10)              | ⭐⭐⭐⭐⭐ |
| 식약처                                         | 알레르기 주의 성분, 기능성 성분 | ⭐⭐⭐⭐⭐ |
| 대한피부과의사회                               | 피부타입별 성분 가이드          | ⭐⭐⭐⭐   |
| 대한화장품협회 화장품성분사전                  | 성분 설명                       | ⭐⭐⭐⭐   |

---

## Phase 1: 성분 데이터베이스 구축

### 1.1 DB 스키마

#### cosmetic_ingredients 테이블

```sql
CREATE TABLE cosmetic_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name_ko TEXT NOT NULL,           -- 한글명 (나이아신아마이드)
  name_en TEXT,                    -- 영문명 (Niacinamide)
  name_inci TEXT,                  -- INCI명 (국제표준)
  aliases TEXT[],                  -- 별칭 배열

  -- EWG 등급
  ewg_score INTEGER CHECK (ewg_score BETWEEN 1 AND 10),
  ewg_data_availability TEXT CHECK (ewg_data_availability IN (
    'none', 'limited', 'fair', 'good', 'robust'
  )),

  -- 분류
  category TEXT NOT NULL,          -- 계면활성제, 방부제, 보습제, 자외선차단제 등
  functions TEXT[],                -- [보습, 미백, 항산화, 진정]

  -- 주의 사항
  is_caution_20 BOOLEAN DEFAULT FALSE,    -- 20가지 주의 성분 여부
  is_allergen BOOLEAN DEFAULT FALSE,       -- 알레르기 유발 여부
  allergen_type TEXT,                      -- EU 26종 알레르기 등

  -- 피부타입별 주의
  skin_type_caution JSONB DEFAULT '{}',   -- {"oily": "주의", "dry": "권장"}

  -- 설명
  description TEXT,                -- 성분 설명
  benefits TEXT[],                 -- 효능 리스트
  concerns TEXT[],                 -- 우려 사항

  -- 메타
  source TEXT,                     -- 정보 출처
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_ingredients_name_ko ON cosmetic_ingredients(name_ko);
CREATE INDEX idx_ingredients_name_en ON cosmetic_ingredients(name_en);
CREATE INDEX idx_ingredients_ewg ON cosmetic_ingredients(ewg_score);
CREATE INDEX idx_ingredients_category ON cosmetic_ingredients(category);
CREATE INDEX idx_ingredients_caution ON cosmetic_ingredients(is_caution_20);
CREATE INDEX idx_ingredients_allergen ON cosmetic_ingredients(is_allergen);

-- RLS (공개 읽기)
ALTER TABLE cosmetic_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON cosmetic_ingredients
  FOR SELECT USING (true);
```

#### cosmetic_product_ingredients 테이블 (제품-성분 매핑)

```sql
CREATE TABLE cosmetic_product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES cosmetic_products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES cosmetic_ingredients(id) ON DELETE CASCADE,

  order_index INTEGER,             -- 성분 순서 (함량 순)
  purpose TEXT,                    -- 배합 목적 (보습, 유화, 방부 등)
  concentration_level TEXT,        -- 농도 수준 (high, medium, low)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_id, ingredient_id)
);

-- 인덱스
CREATE INDEX idx_product_ingredients_product ON cosmetic_product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON cosmetic_product_ingredients(ingredient_id);
```

### 1.2 초기 시드 데이터 (100개 주요 성분)

#### 카테고리 분류

| 카테고리     | 성분 예시                            | 개수 |
| ------------ | ------------------------------------ | ---- |
| 보습제       | 히알루론산, 글리세린, 세라마이드     | 15   |
| 미백제       | 나이아신아마이드, 알부틴, 비타민C    | 10   |
| 항산화제     | 토코페롤, 레티놀, 녹차추출물         | 10   |
| 진정제       | 판테놀, 알로에베라, 센텔라아시아티카 | 10   |
| 계면활성제   | SLS, SLES, 코코베타인                | 10   |
| 방부제       | 파라벤류, 페녹시에탄올               | 10   |
| 자외선차단제 | 옥시벤존, 아보벤존, 징크옥사이드     | 8    |
| 각질제거제   | AHA, BHA, PHA                        | 7    |
| 유화제       | 스테아르산, 세테아릴알코올           | 10   |
| 향료/색소    | 리모넨, 리날룰, CI 번호              | 10   |

#### 20가지 주의 성분 (화해 기준)

```typescript
const CAUTION_20_INGREDIENTS = [
  'SLS (소듐라우릴설페이트)',
  'SLES (소듐라우레스설페이트)',
  '트리클로산',
  '트리에탄올아민 (TEA)',
  'BHA (부틸히드록시아니솔)',
  'BHT (부틸히드록시톨루엔)',
  '옥시벤존',
  '파라벤류 (메틸파라벤, 프로필파라벤 등)',
  '폴리에틸렌글리콜 (PEG)',
  '프탈레이트',
  '인공색소 (타르색소)',
  '인공향료',
  '이소프로필알코올',
  '미네랄오일',
  '디에탄올아민 (DEA)',
  '포름알데히드',
  'DMDM 히단토인',
  '이미다졸리디닐우레아',
  '쿼터늄-15',
  '소듐히드록사이드 (고농도)',
];
```

#### EU 26종 알레르기 유발 향료

```typescript
const EU_26_ALLERGENS = [
  '리모넨',
  '리날룰',
  '시트랄',
  '제라니올',
  '시트로넬롤',
  '유제놀',
  '이소유제놀',
  '신나밀알코올',
  '신나말',
  '쿠마린',
  '벤질알코올',
  '벤질벤조에이트',
  '벤질신나메이트',
  '벤질살리실레이트',
  '파네솔',
  '부틸페닐메틸프로피오날',
  '헥실신나말',
  '히드록시시트로넬랄',
  '히드록시이소헥실 3-사이클로헥센 카르복스알데히드',
  '아밀신나밀알코올',
  '아밀신나말',
  '아니스알코올',
  '메틸 2-옥티노에이트',
  '오크모스추출물',
  '트리모스추출물',
  '알파-이소메틸이오논',
];
```

### 1.3 TypeScript 타입 정의

```typescript
// types/ingredient.ts

/**
 * EWG 데이터 충분도
 */
export type EWGDataAvailability = 'none' | 'limited' | 'fair' | 'good' | 'robust';

/**
 * 성분 카테고리
 */
export type IngredientCategory =
  | 'moisturizer' // 보습제
  | 'whitening' // 미백제
  | 'antioxidant' // 항산화제
  | 'soothing' // 진정제
  | 'surfactant' // 계면활성제
  | 'preservative' // 방부제
  | 'sunscreen' // 자외선차단제
  | 'exfoliant' // 각질제거제
  | 'emulsifier' // 유화제
  | 'fragrance' // 향료
  | 'colorant' // 색소
  | 'other'; // 기타

/**
 * 피부타입별 주의 수준
 */
export type SkinTypeCautionLevel = 'recommended' | 'neutral' | 'caution' | 'avoid';

/**
 * 피부타입별 주의 정보
 */
export interface SkinTypeCaution {
  oily?: SkinTypeCautionLevel; // 지성
  dry?: SkinTypeCautionLevel; // 건성
  sensitive?: SkinTypeCautionLevel; // 민감성
  combination?: SkinTypeCautionLevel; // 복합성
  normal?: SkinTypeCautionLevel; // 중성
}

/**
 * 화장품 성분
 */
export interface CosmeticIngredient {
  id: string;
  nameKo: string;
  nameEn?: string;
  nameInci?: string;
  aliases?: string[];

  // EWG 등급
  ewgScore?: number; // 1-10
  ewgDataAvailability?: EWGDataAvailability;

  // 분류
  category: IngredientCategory;
  functions: string[]; // 보습, 미백, 항산화 등

  // 주의 사항
  isCaution20: boolean;
  isAllergen: boolean;
  allergenType?: string;

  // 피부타입별 주의
  skinTypeCaution?: SkinTypeCaution;

  // 설명
  description?: string;
  benefits?: string[];
  concerns?: string[];

  source?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 제품 성분 분석 결과
 */
export interface ProductIngredientAnalysis {
  productId: string;
  totalCount: number;

  // EWG 등급 분포
  ewgDistribution: {
    low: number; // 1-2등급 (안전)
    moderate: number; // 3-6등급 (보통)
    high: number; // 7-10등급 (주의)
    unknown: number; // 등급 없음
  };

  // 주의 성분
  cautionIngredients: CosmeticIngredient[];
  allergenIngredients: CosmeticIngredient[];

  // 기능별 분류
  functionBreakdown: Record<string, number>;

  // 카테고리별 분류
  categoryBreakdown: Record<IngredientCategory, number>;

  // 피부타입 적합도
  skinTypeCompatibility: Record<string, 'good' | 'neutral' | 'caution'>;
}
```

---

## Phase 2: 성분 분석 UI

### 2.1 컴포넌트 구조

```
components/products/ingredients/
├── IngredientAnalysisSection.tsx   # 메인 컨테이너
├── IngredientEWGBadge.tsx          # EWG 등급 배지
├── IngredientCautionAlert.tsx      # 주의 성분 알림
├── IngredientFilterTabs.tsx        # 전체/20가지/알레르기 탭
├── IngredientList.tsx              # 성분 목록
├── IngredientCard.tsx              # 개별 성분 카드
├── IngredientFunctionChart.tsx     # 기능별 분포 차트
├── SkinTypeAnalysis.tsx            # 피부타입별 분석
└── index.ts
```

### 2.2 IngredientAnalysisSection (메인 컴포넌트)

```typescript
interface IngredientAnalysisSectionProps {
  productId: string;
  ingredients?: CosmeticIngredient[];
  className?: string;
}

// 탭 필터
type IngredientTabFilter = 'all' | 'caution20' | 'allergen' | 'function';
```

**UI 구조:**

```
┌─────────────────────────────────────────────────────────┐
│  성분 정보                                    [?] 도움말 │
├─────────────────────────────────────────────────────────┤
│  [전체 ALL 32] [20가지 성분 3] [알레르기 2] [기능별]    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ EWG 위험등급 분포                                │   │
│  │ ■■■■■■■■■■■ 1-2등급 (18개)                      │   │
│  │ ■■■■■       3-6등급 (8개)                       │   │
│  │ ■■          7-10등급 (4개)                      │   │
│  │ ■           미확인 (2개)                        │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  주요 성분 TOP 5                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. 히알루론산        보습 ████████████ EWG 1   │    │
│  │ 2. 나이아신아마이드  미백 ██████████   EWG 1   │    │
│  │ 3. 판테놀            진정 ████████     EWG 1   │    │
│  │ 4. 글리세린          보습 ██████       EWG 1   │    │
│  │ 5. 토코페롤          항산화 ████       EWG 1   │    │
│  └────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ⚠️ 주의가 필요한 성분 (3개)                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔴 페녹시에탄올      방부제  EWG 4              │    │
│  │    민감성 피부에 자극 가능                      │    │
│  │ 🟡 향료              -       EWG 8              │    │
│  │    알레르기 유발 가능성                         │    │
│  └────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  피부타입별 적합도                                      │
│  지성 ✅ 권장  |  건성 ✅ 권장  |  민감성 ⚠️ 주의     │
└─────────────────────────────────────────────────────────┘
```

### 2.3 EWG 배지 스타일

```typescript
// EWG 등급별 색상
const EWG_COLORS = {
  low: {
    // 1-2등급
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    label: '안전',
  },
  moderate: {
    // 3-6등급
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    label: '보통',
  },
  high: {
    // 7-10등급
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    label: '주의',
  },
  unknown: {
    // 등급 없음
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
    label: '미확인',
  },
};
```

### 2.4 제품 상세 페이지 통합

```typescript
// app/(main)/beauty/[productId]/page.tsx

import { IngredientAnalysisSection } from '@/components/products/ingredients';

// 성분 분석 섹션을 독립 섹션으로 배치 (화해 스타일)
// - 스크롤 시 자연스럽게 보이도록 페이지 하단부에 배치
// - FadeInUp 애니메이션으로 순차적 노출
<FadeInUp delay={3}>
  <IngredientAnalysisSection productId={productId} />
</FadeInUp>
```

> **구현 노트**: 초기 SDD에서는 Tabs UI를 제안했으나, 실제 구현에서는 스크롤 기반
> 독립 섹션 방식을 채택함. 이유:
>
> - 화해/올리브영 등 경쟁사 UX 패턴 분석 결과 반영
> - 모바일 환경에서 탭 전환보다 스크롤이 더 자연스러움
> - 성분 분석 정보를 항상 노출하여 사용자 인식률 향상

---

## Phase 3: AI 성분 분석 및 시각화

### 3.1 AI 성분 요약

```typescript
interface AIIngredientSummary {
  // 핵심 키워드 (화해 스타일)
  keywords: {
    label: string; // 피지발란스, 보습력뛰어남 등
    score: number; // 신뢰도 점수
    relatedIngredients: string[];
  }[];

  // 한줄 요약
  summary: string; // "보습력이 뛰어나고 자극이 적은 제품입니다"

  // 추천 포인트
  recommendPoints: string[];

  // 주의 포인트
  cautionPoints: string[];

  // 피부타입별 추천도
  skinTypeRecommendation: Record<string, number>; // 0-100
}
```

### 3.2 Gemini 프롬프트

```typescript
const INGREDIENT_ANALYSIS_PROMPT = `
You are a cosmetic formulation expert and dermatologist.

Analyze the following cosmetic ingredients list and provide:

1. Key feature keywords (max 5):
   - Examples: "피지발란스", "보습력뛰어남", "저자극", "미백효과", "안티에이징"

2. One-sentence summary in Korean (under 50 characters)

3. Recommendation points (max 3) for this product

4. Caution points (max 3) if any concerning ingredients

5. Skin type recommendation scores (0-100):
   - oily, dry, sensitive, combination, normal

Ingredients: ${ingredientsList}

Return as JSON:
{
  "keywords": [{"label": "...", "score": 0.95, "relatedIngredients": [...]}],
  "summary": "...",
  "recommendPoints": [...],
  "cautionPoints": [...],
  "skinTypeRecommendation": {"oily": 85, "dry": 70, ...}
}
`;
```

### 3.3 시각화 컴포넌트

#### 기능별 분포 차트

```typescript
// components/products/ingredients/IngredientFunctionChart.tsx

interface FunctionChartProps {
  data: {
    function: string; // 보습, 미백, 진정 등
    count: number;
    percentage: number;
  }[];
}

// 수평 막대 그래프로 표시
// 색상: 보습(파랑), 미백(분홍), 진정(초록), 항산화(보라) 등
```

#### EWG 분포 도넛 차트

```typescript
// components/products/ingredients/EWGDistributionChart.tsx

interface EWGChartProps {
  distribution: {
    low: number;
    moderate: number;
    high: number;
    unknown: number;
  };
}

// 도넛 차트: 녹색(1-2), 노랑(3-6), 빨강(7+), 회색(미확인)
```

---

## API 설계

### Repository 함수

```typescript
// lib/products/repositories/ingredients.ts

/**
 * 성분 ID로 조회
 */
export async function getIngredientById(
  supabase: SupabaseClient,
  id: string
): Promise<CosmeticIngredient | null>;

/**
 * 성분명으로 검색
 */
export async function searchIngredients(
  supabase: SupabaseClient,
  query: string,
  options?: { limit?: number; category?: IngredientCategory }
): Promise<CosmeticIngredient[]>;

/**
 * 제품의 성분 목록 조회
 */
export async function getProductIngredients(
  supabase: SupabaseClient,
  productId: string
): Promise<CosmeticIngredient[]>;

/**
 * 제품 성분 분석 결과 조회
 */
export async function analyzeProductIngredients(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductIngredientAnalysis>;

/**
 * 주의 성분 목록 조회 (20가지)
 */
export async function getCaution20Ingredients(
  supabase: SupabaseClient
): Promise<CosmeticIngredient[]>;

/**
 * 알레르기 유발 성분 조회
 */
export async function getAllergenIngredients(
  supabase: SupabaseClient
): Promise<CosmeticIngredient[]>;
```

---

## 테스트 체크리스트

### Phase 1 - DB

- [ ] cosmetic_ingredients 테이블 생성
- [ ] 시드 데이터 100개 성분 입력
- [ ] RLS 정책 적용 확인
- [ ] 인덱스 성능 테스트

### Phase 2 - UI

- [ ] EWG 배지 1-10 등급별 색상 표시
- [ ] 탭 필터 (전체/20가지/알레르기) 동작
- [ ] 성분 목록 스크롤/펼치기
- [ ] 피부타입별 적합도 표시
- [ ] 반응형 레이아웃 (모바일)
- [ ] 다크모드 지원

### Phase 3 - AI

- [ ] Gemini API 연동
- [ ] 키워드 추출 정확도
- [ ] 요약 문장 품질
- [ ] 차트 렌더링
- [ ] 로딩/에러 상태 처리
- [ ] Mock Fallback 동작

---

## 파일 구조

### 신규 생성

```
apps/web/
├── types/
│   └── ingredient.ts                           # 성분 타입 정의
├── lib/products/
│   ├── repositories/
│   │   └── ingredients.ts                      # 성분 Repository
│   └── services/
│       └── ingredient-analysis.ts              # AI 분석 서비스
├── components/products/ingredients/
│   ├── IngredientAnalysisSection.tsx
│   ├── IngredientEWGBadge.tsx
│   ├── IngredientCautionAlert.tsx
│   ├── IngredientFilterTabs.tsx
│   ├── IngredientList.tsx
│   ├── IngredientCard.tsx
│   ├── IngredientFunctionChart.tsx
│   ├── EWGDistributionChart.tsx
│   ├── SkinTypeAnalysis.tsx
│   └── index.ts
├── supabase/migrations/
│   └── 202601040100_cosmetic_ingredients.sql   # DB 마이그레이션
└── data/
    └── cosmetic-ingredients-seed.json          # 시드 데이터
```

### 수정

```
apps/web/
├── app/(main)/beauty/[id]/page.tsx             # 성분 탭 추가
├── types/product.ts                            # 성분 연관 타입 확장
└── lib/products/index.ts                       # export 추가
```

---

## 일정 (예상)

| Phase       | 작업                          | 예상 규모 |
| ----------- | ----------------------------- | --------- |
| **Phase 1** | DB 스키마 + 시드 데이터 100개 | 중        |
| **Phase 2** | UI 컴포넌트 8개 + 통합        | 대        |
| **Phase 3** | AI 분석 + 시각화 차트         | 중        |

---

## 구현 현황 (2026-01-05)

| 항목                | 상태 | 비고                                           |
| ------------------- | ---- | ---------------------------------------------- |
| DB 스키마           | ✅   | `202601040100_cosmetic_ingredients.sql`        |
| Unique 인덱스       | ✅   | `202601050200_cosmetic_ingredients_unique.sql` |
| 시드 데이터 (100개) | ✅   | `data/cosmetic-ingredients-seed.json`          |
| 시드 삽입 스크립트  | ✅   | `scripts/seed-ingredients.ts`                  |
| Repository 함수     | ✅   | `lib/products/repositories/ingredients.ts`     |
| AI 분석 서비스      | ✅   | `lib/products/services/ingredient-analysis.ts` |
| 타입 정의           | ✅   | `types/ingredient.ts`                          |
| Repository 테스트   | ✅   | 50개 테스트 통과                               |
| DB 시드 실행        | ⏳   | `npm run seed:ingredients` 실행 필요           |

---

## 참고 자료

- [EWG Skin Deep Database](https://www.ewg.org/skindeep/)
- [EWG 등급 이해하기](https://www.ewg.org/skindeep/understanding_skin_deep_ratings/)
- [화해 성분 정보 활용법](https://blog.hwahae.co.kr/all/hwahae/talk/2106)
- [EU 26종 알레르기 향료](https://ec.europa.eu/growth/sectors/cosmetics/legislation_en)
