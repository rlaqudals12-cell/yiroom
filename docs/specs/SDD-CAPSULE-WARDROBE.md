# SDD: 캡슐 옷장 시스템 (Capsule Wardrobe)

> **Version**: 1.0
> **Status**: `draft`
> **Created**: 2026-01-20
> **원리 참조**: [fashion-matching.md](../principles/fashion-matching.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"AI 스타일리스트 수준의 캡슐 옷장 최적화"

- **옷장 분석**: AI 기반 아이템 자동 인식 및 분류
- **코디 조합**: 33개 아이템으로 864+ 코디 자동 생성
- **퍼스널컬러 연동**: 색상 조화 기반 완벽 매칭
- **체형 최적화**: 체형별 실루엣 추천
- **누락 아이템**: AI가 캡슐 완성에 필요한 아이템 제안

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 이미지 인식 | 의류 자동 분류 정확도 한계 |
| 스타일 주관성 | 개인 취향 반영 어려움 |
| 계절/TPO 복잡도 | 다양한 상황 조합 폭발적 증가 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 자동 분류 정확도 | 95% | 80% (수동 보정) | 84% |
| 코디 조합 수 | 864+ | 계획 | 0% |
| PC 연동 | 12톤 | 4시즌 | 33% |
| 체형 연동 | 완전 | 기본 | 50% |
| 누락 아이템 추천 | AI | 규칙 기반 | 40% |

### 현재 목표

**종합 달성률**: **50%** (Draft 캡슐 옷장)

### 의도적 제외 (이번 버전)

- AI 자동 의류 인식 (수동 등록 우선)
- 864+ 코디 자동 생성 (기본 추천 우선)
- 날씨 API 연동 (Phase 2)
- 쇼핑 연동 구매 추천 (Phase 2)

---

## 1. 개요

### 1.1 목적

사용자의 **개인 옷장을 등록/관리**하고, **AI 기반 코디 추천** 및 **캡슐 옷장 최적화**를 제공하는 시스템.

### 1.2 핵심 가치

```
캡슐 옷장 = 최소한의 아이템으로 최대한의 코디 조합

목표:
1. 33개 아이템으로 864+ 코디 조합
2. 퍼스널컬러 기반 색상 팔레트
3. 체형 맞춤 실루엣 추천
4. 누락 아이템 식별 및 구매 추천
```

### 1.3 성공 기준

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 옷장 등록 완료율 | 60%+ | 등록 시작 → 완료 비율 |
| 코디 추천 만족도 | 4.2+/5 | 사용자 피드백 |
| 재방문율 | 30%+ | 주간 코디 확인 비율 |
| 구매 전환율 | 5%+ | 추천 → 어필리에이트 클릭 |

---

## 2. 기능 요구사항

### 2.1 핵심 기능

#### F1: 옷장 등록

```
사용자가 보유한 의류를 등록:
- 사진 촬영/업로드
- 카테고리 선택 (상의/하의/원피스/신발/액세서리)
- 색상 자동 추출 (ACC-* 연동)
- 브랜드/구매일/가격 (선택)
```

#### F2: 코디 추천

```
등록된 아이템으로 코디 조합 생성:
- 오늘의 추천 코디 (날씨/일정 반영)
- 색상 조화 기반 매칭
- 체형 적합성 검증
- TPO별 추천 (출근/데이트/캐주얼)
```

#### F3: 캡슐 최적화

```
옷장 분석 및 개선 제안:
- 현재 옷장 진단 (색상 분포, 카테고리 균형)
- 누락 아이템 식별
- 구매 추천 (어필리에이트 연동)
- 불필요 아이템 식별 (정리 추천)
```

#### F4: 착용 기록

```
착용 이력 추적:
- 코디 착용 기록
- 아이템별 착용 빈도
- 계절별 활용도
- 비용 대비 착용 분석
```

### 2.2 부가 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 옷장 공유 | 친구와 옷장/코디 공유 | P2 |
| 가상 피팅 | AI 가상 착용 | P3 |
| 세탁 관리 | 세탁 주기 알림 | P3 |
| 시즌 아카이브 | 계절별 보관 | P2 |

---

## 3. 데이터 모델

### 3.1 DB 스키마

```sql
-- 옷장 아이템 테이블
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 기본 정보
  name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'
  subcategory TEXT,        -- 'tshirt', 'blouse', 'jeans', etc.

  -- 색상 정보 (자동 추출)
  dominant_color_hex TEXT,
  dominant_color_lab JSONB,  -- { L, a, b }
  tone TEXT,                 -- 'warm', 'cool', 'neutral'
  season_match JSONB,        -- { spring, summer, autumn, winter }

  -- 이미지
  image_url TEXT,
  thumbnail_url TEXT,

  -- 메타데이터
  brand TEXT,
  purchase_date DATE,
  purchase_price INTEGER,
  size TEXT,
  material TEXT,

  -- 상태
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,  -- 시즌 보관

  -- 통계
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_wardrobe" ON wardrobe_items
  FOR ALL USING (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_wardrobe_user ON wardrobe_items(clerk_user_id);
CREATE INDEX idx_wardrobe_category ON wardrobe_items(clerk_user_id, category);


-- 코디 테이블
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  name TEXT,
  description TEXT,

  -- 구성 아이템 (ID 배열)
  item_ids UUID[] NOT NULL,

  -- 점수
  color_harmony_score INTEGER,  -- 0-100
  body_match_score INTEGER,     -- 0-100
  overall_score INTEGER,        -- 0-100

  -- 분류
  occasion TEXT,  -- 'casual', 'work', 'formal', 'date'
  season TEXT,    -- 'spring', 'summer', 'fall', 'winter', 'all'

  -- 상태
  is_favorite BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT true,

  -- 통계
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_outfits" ON outfits
  FOR ALL USING (clerk_user_id = auth.get_user_id());


-- 착용 기록 테이블
CREATE TABLE wear_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  outfit_id UUID REFERENCES outfits(id),
  item_ids UUID[],  -- 개별 아이템 착용 시

  worn_at DATE NOT NULL DEFAULT CURRENT_DATE,
  occasion TEXT,
  weather TEXT,  -- 'sunny', 'cloudy', 'rainy', 'snowy'
  temperature_range TEXT,  -- 'cold', 'cool', 'warm', 'hot'

  notes TEXT,
  photo_url TEXT,  -- 착용샷 (선택)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE wear_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_wear_logs" ON wear_logs
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

### 3.2 타입 정의

```typescript
// types/wardrobe.ts

export type ItemCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export type ItemSubcategory =
  // Tops
  | 'tshirt' | 'blouse' | 'shirt' | 'knit' | 'sweater' | 'hoodie'
  // Bottoms
  | 'jeans' | 'slacks' | 'skirt' | 'shorts'
  // Dress
  | 'mini_dress' | 'midi_dress' | 'maxi_dress' | 'jumpsuit'
  // Outerwear
  | 'jacket' | 'coat' | 'blazer' | 'cardigan'
  // Shoes
  | 'sneakers' | 'loafers' | 'heels' | 'boots' | 'sandals'
  // Accessories
  | 'bag' | 'belt' | 'scarf' | 'jewelry' | 'hat' | 'glasses';

export interface WardrobeItem {
  id: string;
  clerkUserId: string;

  name: string;
  category: ItemCategory;
  subcategory?: ItemSubcategory;

  dominantColorHex: string;
  dominantColorLab: LabColor;
  tone: ToneType;
  seasonMatch: Record<SeasonType, number>;

  imageUrl: string;
  thumbnailUrl?: string;

  brand?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  size?: string;
  material?: string;

  isFavorite: boolean;
  isArchived: boolean;

  wearCount: number;
  lastWornAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface Outfit {
  id: string;
  clerkUserId: string;

  name?: string;
  description?: string;

  items: WardrobeItem[];

  colorHarmonyScore: number;
  bodyMatchScore: number;
  overallScore: number;

  occasion: OccasionType;
  season: SeasonType | 'all';

  isFavorite: boolean;
  isAiGenerated: boolean;

  wearCount: number;
  lastWornAt?: Date;

  createdAt: Date;
}
```

---

## 4. 핵심 알고리즘

### 4.1 코디 생성

```typescript
// lib/wardrobe/outfit-generator.ts

interface OutfitGeneratorOptions {
  occasion?: OccasionType;
  weather?: WeatherCondition;
  excludeItems?: string[];  // 최근 착용한 아이템 제외
  colorPreference?: string;
}

async function generateOutfits(
  wardrobe: WardrobeItem[],
  userProfile: UserProfile,
  options: OutfitGeneratorOptions = {}
): Promise<Outfit[]> {
  const { occasion, weather, excludeItems = [] } = options;

  // 사용 가능한 아이템 필터링
  const availableItems = wardrobe.filter(item =>
    !item.isArchived &&
    !excludeItems.includes(item.id) &&
    matchesWeather(item, weather)
  );

  // 카테고리별 분류
  const tops = availableItems.filter(i => i.category === 'top');
  const bottoms = availableItems.filter(i => i.category === 'bottom');
  const dresses = availableItems.filter(i => i.category === 'dress');
  const shoes = availableItems.filter(i => i.category === 'shoes');
  const outerwear = availableItems.filter(i => i.category === 'outerwear');
  const accessories = availableItems.filter(i => i.category === 'accessory');

  const candidates: Outfit[] = [];

  // 상의 + 하의 조합
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const outfit = evaluateOutfit(
          [top, bottom, shoe],
          userProfile,
          occasion
        );

        if (outfit.overallScore >= 65) {
          // 아우터 추가 (날씨에 따라)
          if (weather && needsOuterwear(weather)) {
            const bestOuterwear = findBestOuterwear(outerwear, [top, bottom], userProfile);
            if (bestOuterwear) outfit.items.push(bestOuterwear);
          }

          // 액세서리 추가
          const selectedAccessories = selectAccessories(accessories, outfit.items, userProfile);
          outfit.items.push(...selectedAccessories);

          candidates.push(outfit);
        }
      }
    }
  }

  // 원피스 조합
  for (const dress of dresses) {
    for (const shoe of shoes) {
      const outfit = evaluateOutfit([dress, shoe], userProfile, occasion);

      if (outfit.overallScore >= 65) {
        if (weather && needsOuterwear(weather)) {
          const bestOuterwear = findBestOuterwear(outerwear, [dress], userProfile);
          if (bestOuterwear) outfit.items.push(bestOuterwear);
        }

        const selectedAccessories = selectAccessories(accessories, outfit.items, userProfile);
        outfit.items.push(...selectedAccessories);

        candidates.push(outfit);
      }
    }
  }

  // 점수순 정렬 후 상위 10개
  return candidates
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);
}

function evaluateOutfit(
  items: WardrobeItem[],
  userProfile: UserProfile,
  occasion?: OccasionType
): Outfit {
  // 색상 조화 점수
  const colorHarmonyScore = calculateColorHarmony(items, userProfile.personalColor.season);

  // 체형 매칭 점수
  const bodyMatchScore = calculateBodyMatch(items, userProfile.bodyShape);

  // TPO 적합성
  const occasionScore = occasion ? calculateOccasionMatch(items, occasion) : 100;

  // 종합 점수
  const overallScore = Math.round(
    colorHarmonyScore * 0.4 +
    bodyMatchScore * 0.35 +
    occasionScore * 0.25
  );

  return {
    id: generateId(),
    clerkUserId: userProfile.clerkUserId,
    items,
    colorHarmonyScore,
    bodyMatchScore,
    overallScore,
    occasion: occasion || 'casual',
    season: 'all',
    isFavorite: false,
    isAiGenerated: true,
    wearCount: 0,
    createdAt: new Date(),
  };
}
```

### 4.2 캡슐 최적화

```typescript
// lib/wardrobe/capsule-optimizer.ts

interface CapsuleAnalysis {
  // 현재 상태
  totalItems: number;
  categoryBreakdown: Record<ItemCategory, number>;
  colorDistribution: Record<ToneType, number>;

  // 진단
  strengths: string[];
  weaknesses: string[];

  // 권장 아이템
  missingItems: MissingItemRecommendation[];

  // 정리 추천
  underutilizedItems: WardrobeItem[];  // 착용 빈도 낮은 아이템

  // 점수
  capsuleScore: number;  // 0-100
  versatilityScore: number;  // 코디 다양성
}

interface MissingItemRecommendation {
  category: ItemCategory;
  subcategory?: ItemSubcategory;
  suggestedColor: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  affiliateProducts?: Product[];  // 추천 상품
}

async function analyzeCapsule(
  wardrobe: WardrobeItem[],
  userProfile: UserProfile
): Promise<CapsuleAnalysis> {
  // 카테고리별 분석
  const categoryBreakdown = countByCategory(wardrobe);

  // 색상 분포 분석
  const colorDistribution = analyzeColorDistribution(wardrobe);

  // 코디 가능 조합 수 계산
  const possibleOutfits = countPossibleOutfits(wardrobe);

  // 이상적인 캡슐 구성과 비교
  const idealCapsule = getIdealCapsuleForSeason(userProfile.personalColor.season);

  // 누락 아이템 식별
  const missingItems = identifyMissingItems(wardrobe, idealCapsule, userProfile);

  // 활용도 낮은 아이템
  const underutilizedItems = wardrobe.filter(item =>
    item.wearCount < 3 &&
    daysSinceCreated(item) > 30
  );

  // 강점/약점 분석
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(
    categoryBreakdown,
    colorDistribution,
    possibleOutfits
  );

  // 점수 계산
  const capsuleScore = calculateCapsuleScore(wardrobe, idealCapsule);
  const versatilityScore = Math.min(100, Math.round(possibleOutfits / 10));

  return {
    totalItems: wardrobe.length,
    categoryBreakdown,
    colorDistribution,
    strengths,
    weaknesses,
    missingItems,
    underutilizedItems,
    capsuleScore,
    versatilityScore,
  };
}

function identifyMissingItems(
  wardrobe: WardrobeItem[],
  idealCapsule: IdealCapsule,
  userProfile: UserProfile
): MissingItemRecommendation[] {
  const missing: MissingItemRecommendation[] = [];

  // 카테고리별 체크
  for (const [category, idealCount] of Object.entries(idealCapsule.categories)) {
    const currentCount = wardrobe.filter(i => i.category === category).length;

    if (currentCount < idealCount) {
      missing.push({
        category: category as ItemCategory,
        suggestedColor: getSuggestedColor(wardrobe, userProfile.personalColor.season),
        reason: `${category} 아이템이 ${idealCount - currentCount}개 부족해요`,
        priority: currentCount === 0 ? 'high' : 'medium',
      });
    }
  }

  // 색상 균형 체크
  const toneBalance = checkToneBalance(wardrobe, userProfile.personalColor.season);
  if (toneBalance.needsMore) {
    missing.push({
      category: 'top',  // 상의로 색상 추가 권장
      suggestedColor: toneBalance.suggestedColor,
      reason: `${toneBalance.suggestedColor} 계열 아이템이 부족해요`,
      priority: 'medium',
    });
  }

  return missing;
}
```

### 4.3 착용 추적

```typescript
// lib/wardrobe/wear-tracker.ts

interface WearStatistics {
  // 아이템별 통계
  itemStats: Map<string, {
    wearCount: number;
    lastWornAt: Date | null;
    costPerWear: number | null;  // 구매가격 / 착용횟수
  }>;

  // 카테고리별 통계
  categoryStats: Record<ItemCategory, {
    totalWears: number;
    mostWornItem: WardrobeItem | null;
  }>;

  // 기간별 통계
  periodStats: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };

  // 인사이트
  insights: string[];
}

async function getWearStatistics(
  userId: string,
  wardrobe: WardrobeItem[]
): Promise<WearStatistics> {
  // 착용 기록 조회
  const wearLogs = await supabase
    .from('wear_logs')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('worn_at', { ascending: false });

  // 아이템별 집계
  const itemStats = new Map();
  for (const item of wardrobe) {
    const wears = wearLogs.data.filter(log =>
      log.item_ids?.includes(item.id) ||
      log.outfit_id && getOutfitItems(log.outfit_id).includes(item.id)
    );

    itemStats.set(item.id, {
      wearCount: wears.length,
      lastWornAt: wears[0]?.worn_at || null,
      costPerWear: item.purchasePrice
        ? Math.round(item.purchasePrice / Math.max(1, wears.length))
        : null,
    });
  }

  // 인사이트 생성
  const insights = generateWearInsights(wardrobe, itemStats);

  return {
    itemStats,
    categoryStats: calculateCategoryStats(wardrobe, itemStats),
    periodStats: calculatePeriodStats(wearLogs.data),
    insights,
  };
}

function generateWearInsights(
  wardrobe: WardrobeItem[],
  itemStats: Map<string, any>
): string[] {
  const insights: string[] = [];

  // 가장 많이 입은 아이템
  const mostWorn = [...itemStats.entries()]
    .sort((a, b) => b[1].wearCount - a[1].wearCount)[0];
  if (mostWorn && mostWorn[1].wearCount > 0) {
    const item = wardrobe.find(i => i.id === mostWorn[0]);
    insights.push(`가장 많이 입은 아이템: ${item?.name} (${mostWorn[1].wearCount}회)`);
  }

  // 가성비 좋은 아이템
  const bestValue = [...itemStats.entries()]
    .filter(([_, stats]) => stats.costPerWear !== null && stats.wearCount >= 3)
    .sort((a, b) => a[1].costPerWear - b[1].costPerWear)[0];
  if (bestValue) {
    const item = wardrobe.find(i => i.id === bestValue[0]);
    insights.push(`가성비 최고: ${item?.name} (착용당 ${bestValue[1].costPerWear.toLocaleString()}원)`);
  }

  // 오래 안 입은 아이템
  const unused = wardrobe.filter(item => {
    const stats = itemStats.get(item.id);
    return stats?.wearCount === 0 && daysSinceCreated(item) > 30;
  });
  if (unused.length > 0) {
    insights.push(`30일 이상 미착용 아이템: ${unused.length}개`);
  }

  return insights;
}
```

---

## 5. API 설계

### 5.1 옷장 API

```typescript
// app/api/wardrobe/route.ts

// GET: 옷장 조회
export async function GET(request: Request) {
  const { userId } = await auth();

  const { data } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  return NextResponse.json({ success: true, data });
}

// POST: 아이템 등록
export async function POST(request: Request) {
  const { userId } = await auth();
  const body = await request.json();

  // 이미지에서 색상 추출
  const colorResult = await classifyProductColor(body.imageUrl);

  const newItem = {
    clerk_user_id: userId,
    name: body.name,
    category: body.category,
    subcategory: body.subcategory,
    dominant_color_hex: colorResult.dominantColor.hex,
    dominant_color_lab: colorResult.dominantColor.lab,
    tone: colorResult.tone,
    season_match: colorResult.seasonMatch,
    image_url: body.imageUrl,
    brand: body.brand,
    purchase_date: body.purchaseDate,
    purchase_price: body.purchasePrice,
  };

  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert(newItem)
    .select()
    .single();

  return NextResponse.json({ success: true, data });
}
```

### 5.2 코디 API

```typescript
// app/api/wardrobe/outfits/generate/route.ts

// POST: 코디 생성
export async function POST(request: Request) {
  const { userId } = await auth();
  const { occasion, weather } = await request.json();

  // 사용자 프로필 조회
  const userProfile = await getUserProfile(userId);

  // 옷장 조회
  const wardrobe = await getWardrobe(userId);

  // 코디 생성
  const outfits = await generateOutfits(wardrobe, userProfile, {
    occasion,
    weather,
  });

  return NextResponse.json({
    success: true,
    data: outfits,
  });
}
```

---

## 6. UI/UX 설계

### 6.1 주요 화면

| 화면 | 설명 | 경로 |
|------|------|------|
| 옷장 메인 | 등록된 아이템 그리드 | `/wardrobe` |
| 아이템 등록 | 사진 업로드 + 정보 입력 | `/wardrobe/add` |
| 아이템 상세 | 개별 아이템 정보 + 통계 | `/wardrobe/item/[id]` |
| 코디 추천 | AI 생성 코디 목록 | `/wardrobe/outfits` |
| 캡슐 분석 | 옷장 진단 + 추천 | `/wardrobe/capsule` |
| 착용 기록 | 캘린더 형태 기록 | `/wardrobe/history` |

### 6.2 컴포넌트

```tsx
// components/wardrobe/ItemGrid.tsx
export function ItemGrid({ items, onItemClick }: ItemGridProps);

// components/wardrobe/OutfitCard.tsx
export function OutfitCard({ outfit, onWear, onFavorite }: OutfitCardProps);

// components/wardrobe/CapsuleAnalysis.tsx
export function CapsuleAnalysis({ analysis }: CapsuleAnalysisProps);

// components/wardrobe/WearCalendar.tsx
export function WearCalendar({ logs, onDateClick }: WearCalendarProps);
```

---

## 7. 원자 분해 (P3)

| ID | 원자 | 입력 | 출력 | 시간 |
|----|------|------|------|------|
| CW-1 | DB 스키마 | 설계 | Migration | 2h |
| CW-2 | 아이템 CRUD API | Request | Response | 3h |
| CW-3 | 색상 추출 연동 | 이미지 | 색상 정보 | 1h |
| CW-4 | 코디 생성 알고리즘 | 옷장, 프로필 | 코디 배열 | 4h |
| CW-5 | 캡슐 분석 알고리즘 | 옷장 | 분석 결과 | 3h |
| CW-6 | 착용 추적 | 기록 | 통계 | 2h |
| CW-7 | 옷장 UI | 데이터 | React 컴포넌트 | 4h |
| CW-8 | 코디 추천 UI | 데이터 | React 컴포넌트 | 3h |
| CW-9 | 테스트 | 코드 | 테스트 | 3h |

**총 예상 시간**: 25시간

---

## 8. 테스트 케이스

### 8.1 아이템 관리 테스트

```typescript
// tests/lib/wardrobe/item.test.ts
import { describe, it, expect } from 'vitest';
import {
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  WardrobeItem,
} from '@/lib/wardrobe';

describe('WardrobeItem CRUD', () => {
  it('should add item with required fields', async () => {
    const item: Partial<WardrobeItem> = {
      name: '화이트 셔츠',
      category: 'top',
      colorHex: '#FFFFFF',
    };

    const result = await addWardrobeItem(item);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('화이트 셔츠');
    expect(result.category).toBe('top');
  });

  it('should extract color from image', async () => {
    const item: Partial<WardrobeItem> = {
      name: '네이비 팬츠',
      category: 'bottom',
      imageUrl: 'https://example.com/navy-pants.jpg',
    };

    const result = await addWardrobeItem(item);

    expect(result.colorHex).toBeDefined();
    expect(result.colorCategory).toBe('navy'); // 자동 분류
  });

  it('should categorize by clothing type', async () => {
    const item = await addWardrobeItem({
      name: '트렌치 코트',
      category: 'outer',
    });

    expect(item.warmthLevel).toBeDefined();
    expect(item.formalityLevel).toBeDefined();
  });
});
```

### 8.2 코디 생성 테스트

```typescript
// tests/lib/wardrobe/outfit.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateOutfit,
  OutfitGenerationRequest,
  PersonalColorProfile,
} from '@/lib/wardrobe';

describe('generateOutfit', () => {
  const mockWardrobe: WardrobeItem[] = [
    { id: '1', category: 'top', colorHex: '#FFFFFF', colorCategory: 'white' },
    { id: '2', category: 'bottom', colorHex: '#000080', colorCategory: 'navy' },
    { id: '3', category: 'outer', colorHex: '#D2691E', colorCategory: 'brown' },
  ];

  const mockProfile: PersonalColorProfile = {
    season: 'autumn',
    subType: 'deep',
    bestColors: ['#D2691E', '#8B4513', '#556B2F'],
  };

  it('should generate outfit matching personal color', async () => {
    const request: OutfitGenerationRequest = {
      wardrobe: mockWardrobe,
      personalColor: mockProfile,
      occasion: 'casual',
    };

    const outfit = await generateOutfit(request);

    expect(outfit.items.length).toBeGreaterThanOrEqual(2);
    expect(outfit.matchScore).toBeGreaterThan(0.7);
  });

  it('should respect occasion formality', async () => {
    const formalRequest: OutfitGenerationRequest = {
      wardrobe: mockWardrobe,
      personalColor: mockProfile,
      occasion: 'business',
    };

    const outfit = await generateOutfit(formalRequest);

    outfit.items.forEach((item) => {
      expect(item.formalityLevel).toBeGreaterThanOrEqual(3);
    });
  });

  it('should consider weather conditions', async () => {
    const coldRequest: OutfitGenerationRequest = {
      wardrobe: mockWardrobe,
      personalColor: mockProfile,
      occasion: 'casual',
      weather: { temperature: 5, condition: 'clear' },
    };

    const outfit = await generateOutfit(coldRequest);

    const hasOuter = outfit.items.some((item) => item.category === 'outer');
    expect(hasOuter).toBe(true);
  });
});
```

### 8.3 캡슐 분석 테스트

```typescript
// tests/lib/wardrobe/capsule.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeCapsuleWardrobe, CapsuleAnalysis } from '@/lib/wardrobe';

describe('analyzeCapsuleWardrobe', () => {
  it('should identify missing categories', async () => {
    const wardrobeWithoutOuter = [
      { id: '1', category: 'top', colorCategory: 'white' },
      { id: '2', category: 'bottom', colorCategory: 'navy' },
    ];

    const analysis = await analyzeCapsuleWardrobe(wardrobeWithoutOuter);

    expect(analysis.missingCategories).toContain('outer');
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it('should calculate color balance score', async () => {
    const colorfulWardrobe = [
      { id: '1', category: 'top', colorCategory: 'white' },
      { id: '2', category: 'top', colorCategory: 'black' },
      { id: '3', category: 'bottom', colorCategory: 'navy' },
      { id: '4', category: 'outer', colorCategory: 'beige' },
    ];

    const analysis = await analyzeCapsuleWardrobe(colorfulWardrobe);

    expect(analysis.colorBalanceScore).toBeGreaterThan(0.6);
  });

  it('should suggest seasonal additions', async () => {
    const summerWardrobe = [
      { id: '1', category: 'top', warmthLevel: 1 },
      { id: '2', category: 'bottom', warmthLevel: 1 },
    ];

    const analysis = await analyzeCapsuleWardrobe(summerWardrobe, {
      targetSeason: 'winter',
    });

    expect(analysis.seasonalGaps).toContain('winter');
  });
});
```

---

## 9. 관련 문서

| 문서 | 관계 |
|------|------|
| [fashion-matching.md](../principles/fashion-matching.md) | 원리 |
| [SDD-AUTO-COLOR-CLASSIFICATION](./SDD-AUTO-COLOR-CLASSIFICATION.md) | 색상 추출 |
| [ADR-034](../adr/ADR-034-product-color-classification.md) | 색상 분류 ADR |

---

**Author**: Claude Code
**Reviewed by**: -
