# SPEC-MY-INVENTORY.md

> 내 아이템 통합 인벤토리 시스템
>
> **상태**: ✅ 구현 완료 (2026-01-11)
> **테스트**: 106개 통과
> **커밋**: 7b374bd

## 개요

| 항목      | 내용                                              |
| --------- | ------------------------------------------------- |
| 모듈      | Inventory (신규)                                  |
| 우선순위  | 높음 (Phase I-2)                                  |
| 예상 기간 | 5-7일                                             |
| 의존성    | C-1 체형, PC-1 퍼스널컬러, 날씨 코디, 바코드 스캔 |

## 목표

사용자가 보유한 아이템(의류, 화장품, 식재료 등)을 등록하고,
기존 분석 결과와 연동하여 맞춤형 조합/레시피를 추천하는 통합 시스템.

## 구현 범위

### Phase I-2-1: 코어 + 내 옷장 (우선 구현)

| 기능               | 설명                                   | 우선순위 |
| ------------------ | -------------------------------------- | -------- |
| 통합 인벤토리 코어 | DB 스키마, 공통 타입, 공통 컴포넌트    | 필수     |
| 내 옷장            | 의류 등록, 2D 코디 미리보기, 날씨 연동 | 필수     |

### Phase I-2-2: 확장 (추후)

| 기능         | 연동 모듈                 |
| ------------ | ------------------------- |
| 내 뷰티 선반 | S-1 피부분석, 바코드 스캔 |
| 내 냉장고    | N-1 영양, 바코드 스캔     |
| 내 운동장비  | W-1 운동                  |
| 내 영양제    | N-1 영양, 상호작용 체크   |

---

## 기능 요구사항

### 1. 통합 인벤토리 코어

#### 1.1 아이템 등록

- 사진 촬영/갤러리 업로드
- 자동 배경 제거 (AI)
- 카테고리 자동 분류 (선택적 수정)
- 메타데이터 입력 (색상, 브랜드, 사이즈 등)
- 바코드 스캔 (화장품, 식품)

#### 1.2 아이템 관리

- 카테고리별 필터링
- 검색 (이름, 태그, 색상)
- 정렬 (최근 등록, 자주 사용, 색상별)
- 수정/삭제
- 즐겨찾기

#### 1.3 AI 자동 분석

- **배경 제거**: @imgly/background-removal (브라우저, 무료)
- **색상 추출**: 이미지에서 주요 색상 자동 추출
- **카테고리 추천**: Gemini Vision으로 의류 종류 자동 분류
- **중복 감지**: 유사 이미지 등록 시 경고

#### 1.4 이미지 저장소

- **Supabase Storage** 사용 (기존 인프라 활용)
- 버킷: `inventory-images`
- 경로: `{userId}/{category}/{itemId}.png`
- 원본/배경제거 이미지 모두 저장

#### 1.5 공통 UI 컴포넌트

- `InventoryGrid`: 아이템 그리드 뷰
- `ItemCard`: 개별 아이템 카드
- `ItemUploader`: 사진 업로드 + 배경 제거
- `CategoryFilter`: 카테고리 필터 칩
- `ItemDetailSheet`: 아이템 상세 바텀시트

---

### 2. 내 옷장 (Closet)

#### 2.1 의류 등록

**카테고리:**

```
아우터: 코트, 자켓, 패딩, 가디건, 점퍼
상의: 티셔츠, 셔츠, 블라우스, 니트, 맨투맨, 후드
하의: 청바지, 슬랙스, 스커트, 반바지, 레깅스
원피스: 원피스, 점프수트
신발: 스니커즈, 로퍼, 부츠, 샌들, 힐
가방: 백팩, 토트백, 크로스백, 클러치
액세서리: 모자, 선글라스, 스카프, 벨트, 주얼리
```

**메타데이터:**

```typescript
interface ClothingItem {
  id: string;
  userId: string;
  category: ClothingCategory;
  subCategory: string;
  name: string;
  imageUrl: string; // 배경 제거된 이미지
  originalImageUrl?: string; // 원본 이미지

  // 스타일 속성
  color: string[]; // 주요 색상 (복수)
  pattern?: string; // 무지, 스트라이프, 체크 등
  material?: string; // 면, 울, 폴리에스터 등
  season: Season[]; // 봄, 여름, 가을, 겨울
  occasion: Occasion[]; // 캐주얼, 포멀, 운동 등

  // 추가 정보
  brand?: string;
  size?: string;
  purchaseDate?: string;
  price?: number;

  // 시스템
  wearCount: number; // 착용 횟수
  lastWornAt?: string; // 마지막 착용일
  isFavorite: boolean;
  tags: string[];

  createdAt: string;
  updatedAt: string;
}
```

#### 2.2 2D 코디 미리보기

**플랫레이 콜라주:**

- 아우터 → 상의 → 하의 → 신발 수직 배치
- 액세서리 좌우 배치
- 드래그 앤 드롭으로 아이템 교체
- 코디 저장 (이미지 생성)

**레이아웃:**

```
┌─────────────────────────────┐
│         [아우터]             │
│        ┌───────┐            │
│        │       │            │
│        └───────┘            │
│         [상의]              │
│        ┌───────┐            │
│        │       │            │
│        └───────┘            │
│         [하의]              │
│        ┌───────┐            │
│        │       │            │
│        └───────┘            │
│         [신발]              │
│        ┌───────┐            │
│        └───────┘            │
│                             │
│  [가방]    [모자]    [악세]  │
└─────────────────────────────┘
```

#### 2.3 코디 추천 연동

**날씨 연동:**

- 현재 날씨 기반 → 내 옷장에서 적합한 아이템 필터링
- 체감온도 → 레이어링 가이드 + 내 아우터/상의 추천
- 강수 예보 → 방수 아우터, 부츠 추천

**체형(C-1) 연동:**

- S/W/N 체형별 핏 추천
- 보유 아이템 중 체형에 맞는 아이템 우선 표시
- "이 아이템은 웨이브 체형에 잘 어울려요" 태그

**퍼스널컬러(PC-1) 연동:**

- 퍼스널컬러 팔레트와 매칭되는 아이템 하이라이트
- 색상 조합 추천 (보유 아이템 기준)
- "봄 웜톤에 어울리는 조합이에요" 피드백

#### 2.4 부족 아이템 분석

**Gap Analysis:**

- 카테고리별 아이템 수 분석
- 계절별 부족 아이템 제안
- 코디 완성을 위한 추천 ("이 코디에 로퍼가 있으면 완벽해요")

**쇼핑 연동:**

- 부족 아이템 → 쇼핑몰 검색 연동
- 체형/퍼스널컬러 맞춤 제품 추천

#### 2.5 옷장 통계

**ClosetStats 대시보드:**

- 총 아이템 수 / 카테고리별 분포
- 가장 많이 입은 아이템 Top 5
- 안 입은 아이템 (3개월 이상)
- 계절별 아이템 분포
- 색상별 분포 차트
- Cost Per Wear (가격 ÷ 착용 횟수)

#### 2.6 코디 공유 (Nice to Have)

- 저장된 코디 → 이미지로 내보내기
- SNS 공유 (인스타그램 스토리 포맷)
- 친구에게 코디 추천 받기

---

## 기술 설계

### 데이터베이스 스키마

```sql
-- 통합 인벤토리 테이블
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 카테고리
  category TEXT NOT NULL CHECK (category IN ('closet', 'beauty', 'equipment', 'supplement', 'pantry')),
  sub_category TEXT,

  -- 기본 정보
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_image_url TEXT,

  -- 메타데이터 (카테고리별 상이)
  metadata JSONB DEFAULT '{}',

  -- 공통 필드
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expiry_date DATE,  -- 화장품, 식품용

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inventory"
  ON user_inventory
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_inventory_user_category
  ON user_inventory(clerk_user_id, category);
CREATE INDEX idx_inventory_tags
  ON user_inventory USING GIN(tags);

-- 저장된 코디 테이블
CREATE TABLE saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  name TEXT,
  description TEXT,

  -- 구성 아이템 ID 배열
  item_ids UUID[] NOT NULL,

  -- 생성된 콜라주 이미지
  collage_image_url TEXT,

  -- 메타데이터
  occasion TEXT,  -- casual, formal, workout, date
  season TEXT[],
  weather_condition TEXT,  -- 어떤 날씨에 적합한지

  -- 통계
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own outfits"
  ON saved_outfits
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 파일 구조

```
apps/web/
├── app/
│   ├── (main)/inventory/
│   │   ├── page.tsx                    # 인벤토리 메인 (카테고리 선택)
│   │   ├── closet/
│   │   │   ├── page.tsx                # 내 옷장 메인
│   │   │   ├── add/page.tsx            # 의류 추가
│   │   │   ├── [id]/page.tsx           # 의류 상세
│   │   │   └── outfit/
│   │   │       ├── page.tsx            # 코디 만들기
│   │   │       └── [id]/page.tsx       # 저장된 코디 상세
│   │   └── ... (beauty, pantry 등 추후)
│   └── api/
│       └── inventory/
│           ├── route.ts                # GET (목록), POST (추가)
│           ├── [id]/route.ts           # GET, PUT, DELETE
│           ├── upload/route.ts         # 이미지 업로드 + 배경 제거
│           └── outfits/
│               ├── route.ts            # 코디 CRUD
│               └── recommend/route.ts  # 코디 추천
├── components/inventory/
│   ├── common/
│   │   ├── InventoryGrid.tsx           # 아이템 그리드
│   │   ├── ItemCard.tsx                # 아이템 카드
│   │   ├── ItemUploader.tsx            # 업로드 + 배경 제거
│   │   ├── CategoryFilter.tsx          # 카테고리 필터
│   │   └── ItemDetailSheet.tsx         # 상세 바텀시트
│   └── closet/
│       ├── ClothingForm.tsx            # 의류 등록 폼
│       ├── OutfitBuilder.tsx           # 코디 빌더 (2D)
│       ├── OutfitCollage.tsx           # 코디 콜라주 뷰
│       ├── OutfitRecommendCard.tsx     # 추천 코디 카드
│       └── ClosetStats.tsx             # 옷장 통계
├── lib/inventory/
│   ├── repository.ts                   # DB CRUD
│   ├── imageProcessing.ts              # 배경 제거, 색상 추출, AI 분류
│   ├── storage.ts                      # Supabase Storage 업로드
│   ├── outfitMatcher.ts                # 코디 매칭 로직
│   └── gapAnalyzer.ts                  # 부족 아이템 분석
└── types/
    └── inventory.ts                    # 타입 정의
```

### 날씨 코디 연동 (기존 기능 활용)

```typescript
// lib/inventory/outfitMatcher.ts
import { getWeatherByRegion } from '@/lib/style/weatherService';
import { recommendOutfit } from '@/lib/style/outfitRecommender';

/**
 * 내 옷장 아이템으로 날씨 맞춤 코디 추천
 */
export async function recommendFromCloset(
  userId: string,
  region: KoreaRegion
): Promise<OutfitFromCloset[]> {
  // 1. 현재 날씨 조회 (기존 weatherService 활용)
  const weather = await getWeatherByRegion(region);

  // 2. 일반 코디 추천 가져오기 (기존 outfitRecommender 활용)
  const generalRecommendation = recommendOutfit(weather, userBodyType, userPersonalColor);

  // 3. 내 옷장 아이템 조회
  const myItems = await getInventoryItems(userId, 'closet');

  // 4. 추천된 레이어와 내 아이템 매칭
  const matchedOutfits = matchItemsToLayers(
    generalRecommendation.layers,
    myItems,
    weather.current.feelsLike
  );

  return matchedOutfits;
}

/**
 * 레이어 추천과 보유 아이템 매칭
 */
function matchItemsToLayers(
  layers: LayerItem[],
  myItems: ClothingItem[],
  feelsLike: number
): MatchedOutfit[] {
  // 각 레이어(아우터/상의/하의/신발)에 맞는 내 아이템 찾기
  // - 계절 적합성 (season 필드)
  // - 색상 조화 (퍼스널컬러 매칭)
  // - 체감온도 적합성
  // ...
}
```

### 타입 정의

```typescript
// types/inventory.ts

// 카테고리
export type InventoryCategory = 'closet' | 'beauty' | 'equipment' | 'supplement' | 'pantry';

// 의류 카테고리
export type ClothingCategory = 'outer' | 'top' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'accessory';

// 계절
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 상황
export type Occasion = 'casual' | 'formal' | 'workout' | 'date' | 'travel';

// 기본 인벤토리 아이템
export interface InventoryItem {
  id: string;
  userId: string;
  category: InventoryCategory;
  subCategory: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string;
  brand?: string;
  tags: string[];
  isFavorite: boolean;
  useCount: number;
  lastUsedAt?: string;
  expiryDate?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// 의류 메타데이터
export interface ClothingMetadata {
  color: string[];
  pattern?: string;
  material?: string;
  season: Season[];
  occasion: Occasion[];
  size?: string;
  purchaseDate?: string;
  price?: number;
}

// 의류 아이템 (확장)
export interface ClothingItem extends InventoryItem {
  category: 'closet';
  metadata: ClothingMetadata;
}

// 저장된 코디
export interface SavedOutfit {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  itemIds: string[];
  items?: ClothingItem[]; // 조인된 아이템
  collageImageUrl?: string;
  occasion?: Occasion;
  season: Season[];
  weatherCondition?: string;
  wearCount: number;
  lastWornAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 코디 추천 요청
export interface OutfitRecommendRequest {
  occasion?: Occasion;
  weather?: {
    temp: number;
    precipitation: number;
    uvi: number;
  };
  excludeItemIds?: string[];
}

// 코디 추천 응답
export interface OutfitRecommendResponse {
  outfits: {
    items: ClothingItem[];
    reason: string;
    matchScore: number; // 0-100
  }[];
  missingItems: {
    category: ClothingCategory;
    suggestion: string;
    reason: string;
  }[];
}
```

### 이미지 처리 서비스

```typescript
// lib/inventory/imageProcessing.ts

// 1. 배경 제거 (@imgly/background-removal, 브라우저, 무료)
import { removeBackground } from '@imgly/background-removal';

export async function removeBackgroundClient(imageBlob: Blob): Promise<Blob> {
  const result = await removeBackground(imageBlob, {
    model: 'medium', // small, medium, large
    output: {
      format: 'image/png',
      quality: 0.8,
    },
  });
  return result;
}

// 2. 색상 추출 (Canvas API, 무료)
export async function extractDominantColors(imageBlob: Blob, count: number = 3): Promise<string[]> {
  // Canvas로 이미지 로드 후 픽셀 분석
  // Color Thief 알고리즘 또는 K-means 클러스터링
  const img = await createImageBitmap(imageBlob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  // ... 색상 추출 로직
  return ['#BEIGE', '#NAVY', '#WHITE']; // 예시
}

// 3. AI 카테고리 분류 (Gemini Vision)
export async function classifyClothing(imageUrl: string): Promise<{
  category: ClothingCategory;
  subCategory: string;
  suggestedName: string;
  colors: string[];
  pattern?: string;
}> {
  const prompt = `
    Analyze this clothing item image and return JSON:
    {
      "category": "outer|top|bottom|dress|shoes|bag|accessory",
      "subCategory": "specific type (e.g., trench coat, t-shirt)",
      "suggestedName": "Korean name for this item",
      "colors": ["primary color", "secondary color"],
      "pattern": "solid|stripe|check|floral|etc"
    }
  `;

  const result = await analyzeWithGemini(imageUrl, prompt);
  return JSON.parse(result);
}
```

### 이미지 저장 (Supabase Storage)

```typescript
// lib/inventory/storage.ts
import { createClerkSupabaseClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'inventory-images';

export async function uploadInventoryImage(
  userId: string,
  category: string,
  itemId: string,
  imageBlob: Blob,
  type: 'original' | 'processed' = 'processed'
): Promise<string> {
  const supabase = createClerkSupabaseClient();
  const path = `${userId}/${category}/${itemId}_${type}.png`;

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, imageBlob, {
    contentType: 'image/png',
    upsert: true,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return urlData.publicUrl;
}
```

### API 설계

#### POST /api/inventory

아이템 등록

**Request:**

```json
{
  "category": "closet",
  "subCategory": "outer",
  "name": "베이지 트렌치코트",
  "imageUrl": "https://...",
  "metadata": {
    "color": ["beige"],
    "material": "cotton",
    "season": ["spring", "autumn"],
    "occasion": ["casual", "formal"]
  },
  "brand": "ZARA",
  "tags": ["트렌치", "봄코트"]
}
```

**Response:**

```json
{
  "id": "item-123",
  "category": "closet",
  "name": "베이지 트렌치코트",
  "imageUrl": "https://...",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

#### GET /api/inventory?category=closet

아이템 목록 조회

**Query Params:**

- `category`: closet, beauty, etc.
- `subCategory`: outer, top, etc.
- `season`: spring, summer, etc.
- `color`: beige, black, etc.
- `favorite`: true
- `limit`: 20
- `offset`: 0

#### POST /api/inventory/outfits/recommend

코디 추천

**Request:**

```json
{
  "occasion": "casual",
  "weather": {
    "temp": 12,
    "precipitation": 10,
    "uvi": 4
  }
}
```

**Response:**

```json
{
  "outfits": [
    {
      "items": [
        { "id": "item-1", "name": "트렌치코트", "category": "outer" },
        { "id": "item-5", "name": "스트라이프 셔츠", "category": "top" },
        { "id": "item-12", "name": "네이비 슬랙스", "category": "bottom" },
        { "id": "item-20", "name": "브라운 로퍼", "category": "shoes" }
      ],
      "reason": "12°C 쌀쌀한 날씨에 적합한 레이어드 코디",
      "matchScore": 92
    }
  ],
  "missingItems": [
    {
      "category": "accessory",
      "suggestion": "베이지 스카프",
      "reason": "트렌치코트와 잘 어울리는 액세서리"
    }
  ]
}
```

---

## UI/UX 설계

### 화면 흐름

```
인벤토리 메인 (/inventory)
    │
    ├─→ 내 옷장 (/inventory/closet)
    │       ├─→ 의류 추가 (/inventory/closet/add)
    │       ├─→ 의류 상세 (/inventory/closet/[id])
    │       └─→ 코디 만들기 (/inventory/closet/outfit)
    │               └─→ 저장된 코디 (/inventory/closet/outfit/[id])
    │
    ├─→ 내 뷰티 (/inventory/beauty) [추후]
    ├─→ 내 냉장고 (/inventory/pantry) [추후]
    └─→ 내 장비 (/inventory/equipment) [추후]
```

### 주요 화면

#### 1. 내 옷장 메인

```
┌─────────────────────────────────────────┐
│  ← 내 옷장                    [+] [📊]  │
├─────────────────────────────────────────┤
│  [전체] [아우터] [상의] [하의] [신발]... │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │     │ │     │ │     │ │     │       │
│  │ 👕  │ │ 👖  │ │ 🧥  │ │ 👟  │       │
│  │     │ │     │ │     │ │     │       │
│  ├─────┤ ├─────┤ ├─────┤ ├─────┤       │
│  │니트 │ │슬랙스│ │코트 │ │스니커│       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │     │ │     │ │     │ │     │       │
│  │ ... │ │ ... │ │ ... │ │ ... │       │
│                                         │
├─────────────────────────────────────────┤
│     [오늘의 코디 추천 보기 →]            │
└─────────────────────────────────────────┘
```

#### 2. 코디 빌더

```
┌─────────────────────────────────────────┐
│  ← 코디 만들기                  [저장]   │
├─────────────────────────────────────────┤
│                                         │
│           ┌───────────┐                 │
│  🌤️ 12°C  │   아우터   │  ← 탭해서 선택  │
│           │  (비어있음) │                 │
│           └───────────┘                 │
│           ┌───────────┐                 │
│           │   상 의    │                 │
│           │  (비어있음) │                 │
│           └───────────┘                 │
│           ┌───────────┐                 │
│           │   하 의    │                 │
│           │  (비어있음) │                 │
│           └───────────┘                 │
│           ┌───────────┐                 │
│           │   신 발    │                 │
│           │  (비어있음) │                 │
│           └───────────┘                 │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │악세1│ │악세2│ │ +  │                │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
├─────────────────────────────────────────┤
│ 💡 "12°C에는 가벼운 아우터를 추천해요"   │
└─────────────────────────────────────────┘
```

#### 3. 아이템 선택 시트

```
┌─────────────────────────────────────────┐
│  아우터 선택                      [닫기] │
├─────────────────────────────────────────┤
│  🔍 검색                                │
├─────────────────────────────────────────┤
│  ⭐ 추천 (오늘 날씨에 적합)              │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │트렌치│ │가디건│ │자켓 │               │
│  │ ✓   │ │     │ │     │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  전체 아우터                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │     │ │     │ │     │ │     │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────────────┘
```

---

## 테스트 계획

### 단위 테스트

1. **repository.ts**
   - CRUD 동작
   - 카테고리 필터링
   - 검색 기능

2. **backgroundRemoval.ts**
   - 이미지 처리
   - 에러 핸들링

3. **outfitMatcher.ts**
   - 날씨 기반 필터링
   - 체형/퍼스널컬러 매칭
   - 색상 조합 점수

4. **gapAnalyzer.ts**
   - 부족 카테고리 분석
   - 계절별 분석

### 통합 테스트

1. **API 테스트**
   - 아이템 CRUD
   - 코디 추천
   - 이미지 업로드

2. **컴포넌트 테스트**
   - InventoryGrid 렌더링
   - OutfitBuilder 인터랙션
   - ItemUploader 업로드 플로우

---

## 성공 지표

| 지표             | 목표            |
| ---------------- | --------------- |
| 옷장 등록률      | DAU의 40%       |
| 평균 등록 아이템 | 20개+           |
| 코디 생성률      | 등록 유저의 60% |
| 코디 저장률      | 생성의 50%      |
| 추천 클릭률      | 30%             |

---

## 일정

| 단계  | 작업                                 | 기간 |
| ----- | ------------------------------------ | ---- |
| Day 1 | DB 스키마, 타입 정의, 코어 API       | 1일  |
| Day 2 | 배경 제거, 이미지 업로드             | 1일  |
| Day 3 | 공통 컴포넌트 (Grid, Card, Uploader) | 1일  |
| Day 4 | 내 옷장 페이지, 의류 등록            | 1일  |
| Day 5 | 코디 빌더, 콜라주 뷰                 | 1일  |
| Day 6 | 날씨/체형/퍼스널컬러 연동            | 1일  |
| Day 7 | 테스트, 버그 수정                    | 1일  |

---

## 확장 계획

### Phase I-2-2: 내 뷰티 선반

- 화장품 등록 (바코드 스캔)
- 루틴 순서 자동 정렬
- 유통기한 알림
- S-1 피부타입 연동

### Phase I-2-3: 내 냉장고

- 식재료 등록 (바코드/직접입력)
- 가능한 레시피 추천
- 유통기한 관리
- N-1 영양 연동

### Phase I-2-4: 크로스 모듈 통합

- 오늘의 통합 추천 (코디 + 메이크업 + 식단)
- 부족 아이템 통합 쇼핑 리스트

---

## 환경변수

```bash
# .env.local (선택적 - 서버사이드 배경 제거 시)
REMOVE_BG_API_KEY=your_api_key_here  # 50장/월 무료

# Supabase Storage (기존 설정 사용)
# NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

---

## 마이그레이션

```sql
-- supabase/migrations/202512290001_inventory.sql

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true);

-- Storage 정책
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inventory-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inventory-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view inventory images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inventory-images');
```

---

## 의존성 패키지

```bash
# 배경 제거 (브라우저, ~2MB)
npm install @imgly/background-removal

# 색상 추출 (선택적)
npm install colorthief
```

---

**문서 버전**: 1.1
**작성일**: 2025-12-29
**작성자**: Claude Code
**검토 완료**: 누락 항목 추가 (AI 분석, 이미지 저장, 통계, 공유, 환경변수)
