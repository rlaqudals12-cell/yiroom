# 패션 매칭 원리 (Fashion Matching Principles)

> 이 문서는 이룸 스타일링 AI (J-1, P-2, P-3)의 기반이 되는 패션/의류 매칭 원리를 설명합니다.
> 퍼스널컬러-의류 매칭, 체형별 실루엣, 캡슐 옷장 설계의 이론적 근거를 제공합니다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 AI 스타일리스트"

- 100% 개인화: 퍼스널컬러 + 체형 + 라이프스타일 종합 스타일링
- 색상 조화 최적화: 색상환 이론 기반 완벽한 컬러 조합
- 체형 보완: 개인 체형의 장점 강조, 단점 보완 실루엣 추천
- 캡슐 옷장: 최소 아이템으로 최대 조합 생성
- 실시간 코디: 날씨, TPO 기반 당일 추천
- 쇼핑 연동: 기존 옷장 + 신규 아이템 조합 추천
- 전문가 수준: 스타일리스트 판단과 85% 이상 일치
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **주관적 취향** | 객관적 최적 ≠ 사용자 선호 |
| **트렌드 반영** | 빠르게 변화하는 패션 트렌드 추적 한계 |
| **체형 측정** | 사진 기반 체형 분석 정밀도 한계 |
| **소재/핏** | 2D 이미지로 소재감, 실제 핏 판단 어려움 |
| **문화 차이** | 국가/지역별 스타일 선호도 차이 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **색상 조화 유형** | 6가지 조화 유형 100% 적용 |
| **퍼스널컬러 연계** | 16타입 시즌별 최적 컬러 매핑 |
| **체형별 추천** | 5가지 체형별 실루엣 가이드 |
| **캡슐 옷장** | 33아이템 기준 300+ 조합 생성 |
| **제품 매칭** | 사용자 만족도 4.2/5.0 이상 |
| **스타일리스트 일치** | 전문가 판단과 85% 이상 일치 |

### 현재 목표

**55%** - MVP 패션 매칭

- ✅ 색상환 기반 6가지 조화 유형 정의
- ✅ 퍼스널컬러-의류 매칭 테이블
- ✅ 체형별 실루엣 가이드
- ✅ 캡슐 옷장 설계 원리
- ⏳ AI 스타일링 추천 구현 (40%)
- ⏳ 제품 DB 연동 (50%)
- ⏳ 캡슐 조합 알고리즘 (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| AR 가상 피팅 | GPU 비용, 복잡도 | Phase 4 |
| 실시간 트렌드 분석 | 크롤링/API 비용 | Phase 3 |
| 옷장 사진 인식 | 이미지 AI 개발 필요 | Phase 4 |
| 쇼핑몰 직접 연동 | B2B 파트너십 필요 | Phase 5 |

---

## 1. 개요

### 1.1 문서 목적

```
패션 매칭 = 퍼스널컬러(PC-1) + 체형(C-1) + 스타일 선호도

이 문서는 AI 스타일링 추천의 과학적 기초를 제공합니다:
1. 색상 조화 이론 (Color Harmony Theory)
2. 체형별 실루엣 원리 (Body Shape Silhouette)
3. 캡슐 옷장 설계 원리 (Capsule Wardrobe Design)
4. 상품-사용자 매칭 알고리즘 (Product-User Matching)
```

### 1.2 관련 모듈

| 모듈 | 역할 | 의존 원리 |
|------|------|----------|
| **PC-1** | 퍼스널컬러 분석 | color-science.md |
| **C-1** | 체형 분석 | body-mechanics.md |
| **J-1** | AI 스타일링 | 이 문서 |
| **P-2** | 액세서리/메이크업 | 이 문서 + color-science.md |
| **P-3** | 전신 코디 | 이 문서 |

---

## 2. 색상 조화 이론 (Color Harmony Theory)

### 2.1 색상환 기반 조화 유형

```
┌─────────────────────────────────────────────────────────────┐
│                    색상환 조화 유형                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│           Yellow (60°)                                       │
│               ●                                              │
│              / \                                             │
│             /   \                                            │
│    Orange ●     ● Yellow-Green                              │
│    (30°)   \   /   (90°)                                    │
│             \ /                                              │
│              X                                               │
│             / \                                              │
│    Red    ●     ● Green                                     │
│    (0°)    \   /   (120°)                                   │
│             \ /                                              │
│              ●                                               │
│           Blue (240°)                                        │
│                                                              │
│   조화 유형:                                                 │
│   ─────────                                                  │
│   ● 보색 (Complementary): 180° 반대                         │
│   ● 유사 (Analogous): ±30° 인접                             │
│   ● 삼색 (Triadic): 120° 간격                               │
│   ● 분할보색 (Split-Comp): 150°/210°                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 조화 유형별 특성

| 조화 유형 | 각도 관계 | 효과 | 사용 상황 |
|----------|----------|------|----------|
| **보색 (Complementary)** | 180° | 강한 대비, 역동적 | 포인트 아이템, 악세사리 |
| **유사색 (Analogous)** | ±30° | 조화로움, 안정감 | 전체 코디, 데일리룩 |
| **삼색 (Triadic)** | 120° | 균형, 활기 | 다채로운 스타일 |
| **분할보색 (Split-Comp)** | 150°/210° | 부드러운 대비 | 세련된 캐주얼 |
| **단색 (Monochromatic)** | 0° (명도/채도 변화) | 세련됨, 고급스러움 | 포멀, 미니멀 |

### 2.3 퍼스널컬러별 추천 조화

```typescript
// lib/styling/color-harmony.ts

interface ColorHarmonyRecommendation {
  primaryColor: string;      // 메인 컬러 (퍼스널컬러 기반)
  harmonyType: HarmonyType;  // 조화 유형
  accentColors: string[];    // 포인트 컬러
  neutralColors: string[];   // 중립색
  avoidColors: string[];     // 피해야 할 색상
}

const SEASON_HARMONY_MAP: Record<Season, ColorHarmonyRecommendation> = {
  spring: {
    primaryColor: '#FFD700',  // 골드 계열
    harmonyType: 'analogous',
    accentColors: ['#FF6B6B', '#4ECDC4', '#FF8C42'],
    neutralColors: ['#FFF8DC', '#F5DEB3', '#FFFACD'],
    avoidColors: ['#000000', '#0000FF', '#800080'],  // 순흑, 차가운 블루, 딥퍼플
  },
  summer: {
    primaryColor: '#B0C4DE',  // 라이트 블루 계열
    harmonyType: 'analogous',
    accentColors: ['#DDA0DD', '#98D8C8', '#F0E68C'],
    neutralColors: ['#F5F5F5', '#E6E6FA', '#FFF0F5'],
    avoidColors: ['#FF4500', '#FFD700', '#8B4513'],  // 오렌지레드, 브라이트골드, 카키
  },
  autumn: {
    primaryColor: '#D2691E',  // 초콜릿/테라코타
    harmonyType: 'triadic',
    accentColors: ['#8B4513', '#556B2F', '#B8860B'],
    neutralColors: ['#F5DEB3', '#DEB887', '#D2B48C'],
    avoidColors: ['#FF69B4', '#00FFFF', '#C0C0C0'],  // 핫핑크, 사이안, 실버
  },
  winter: {
    primaryColor: '#4169E1',  // 로열 블루
    harmonyType: 'complementary',
    accentColors: ['#DC143C', '#FFFFFF', '#000000'],
    neutralColors: ['#F5F5F5', '#C0C0C0', '#A9A9A9'],
    avoidColors: ['#FFD700', '#FFA500', '#8B4513'],  // 골드, 오렌지, 브라운
  },
};
```

### 2.4 색상 조화 점수 계산

```typescript
/**
 * 색상 조화 점수 계산 (0-100)
 *
 * @param userSeason - 사용자 퍼스널컬러 계절
 * @param productColor - 상품 색상 (Lab)
 * @returns 조화 점수
 */
function calculateColorHarmonyScore(
  userSeason: Season,
  productColor: LabColor
): number {
  const seasonPalette = SEASON_HARMONY_MAP[userSeason];

  // 1. 기본 톤 매칭 (40%)
  const toneScore = matchTone(userSeason, productColor);

  // 2. 채도 적합성 (30%)
  const saturationScore = matchSaturation(userSeason, productColor.c);

  // 3. 명도 적합성 (20%)
  const lightnessScore = matchLightness(userSeason, productColor.L);

  // 4. 피해야 할 색상 패널티 (-10% ~ 0%)
  const avoidPenalty = checkAvoidColors(seasonPalette.avoidColors, productColor);

  return Math.max(0, Math.min(100,
    toneScore * 0.4 +
    saturationScore * 0.3 +
    lightnessScore * 0.2 +
    avoidPenalty
  ));
}

function matchTone(season: Season, color: LabColor): number {
  // 웜톤 (Spring, Autumn): a* > 0, b* > 0
  // 쿨톤 (Summer, Winter): a* < 0 또는 b* < 0
  const isWarm = color.a > 0 && color.b > 0;
  const seasonWarm = season === 'spring' || season === 'autumn';

  if (isWarm === seasonWarm) {
    return 100;  // 톤 일치
  }

  // 톤 불일치 시 정도에 따라 감점
  const distance = Math.abs(color.a) + Math.abs(color.b);
  return Math.max(0, 100 - distance * 2);
}
```

---

## 3. 체형별 실루엣 원리 (Body Shape Silhouette)

### 3.1 5대 체형 분류

```
┌─────────────────────────────────────────────────────────────┐
│                    5대 체형 시각화                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   역삼각형        직사각형        모래시계      삼각형         │
│   (Inverted)     (Rectangle)   (Hourglass)   (Triangle)     │
│                                                              │
│      ████            ██            ██            ██          │
│     ██████          ████          ████          ████         │
│      ████           ████          ██████        ██████       │
│       ██            ████          ████          ████████     │
│       ██            ████           ██            ████        │
│                                                              │
│   어깨>허리>엉덩이  어깨≈허리≈엉덩이  어깨≈엉덩이>허리  어깨<엉덩이     │
│                                                              │
│   타원형 (Oval/Apple)                                        │
│                                                              │
│        ██                                                    │
│      ██████                                                  │
│     ████████                                                 │
│      ██████                                                  │
│        ██                                                    │
│                                                              │
│   허리가 가장 넓음                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 체형별 추천 실루엣

| 체형 | 추천 실루엣 | 피해야 할 스타일 | 목표 |
|------|-----------|----------------|------|
| **역삼각형** | A라인 스커트, 와이드팬츠, 힙포켓 | 패드숄더, 보트넥 | 하체 볼륨 추가 |
| **직사각형** | 벨트 강조, 페플럼, 프릴 | 박시핏, 스트레이트 | 곡선 연출 |
| **모래시계** | 핏한 실루엣, 허리 강조 | 오버사이즈 | 곡선 유지 |
| **삼각형** | V넥, 패드숄더, 밝은 상의 | 타이트 하의 | 상체 볼륨 추가 |
| **타원형** | 세로라인, A라인, 엠파이어 | 타이트핏, 벨트 | 세로선 강조 |

### 3.3 체형별 의류 매칭 점수

```typescript
// lib/styling/body-shape-matching.ts

interface BodyShapeMatchResult {
  overallScore: number;        // 전체 점수 (0-100)
  silhouetteScore: number;     // 실루엣 적합도
  balanceScore: number;        // 균형감
  proportionScore: number;     // 비율 보정
  recommendations: string[];   // 스타일링 팁
}

const SILHOUETTE_COMPATIBILITY: Record<BodyShape, Record<ClothingCategory, number>> = {
  inverted_triangle: {
    a_line_skirt: 95,
    wide_pants: 90,
    fitted_top: 60,      // 어깨 강조 피함
    boat_neck: 40,       // 어깨 강조 피함
    v_neck: 85,
    peplum_top: 80,
  },
  rectangle: {
    belted_dress: 95,
    peplum_top: 90,
    wrap_dress: 90,
    straight_cut: 50,    // 곡선 없음
    boxy_fit: 45,        // 곡선 없음
  },
  hourglass: {
    fitted_dress: 95,
    wrap_top: 95,
    high_waist: 90,
    oversized: 55,       // 곡선 숨김
  },
  triangle: {
    shoulder_pad: 90,
    v_neck: 90,
    boat_neck: 85,
    tight_pants: 45,     // 하체 강조 피함
    dark_bottom: 80,
  },
  oval: {
    empire_waist: 90,
    a_line: 90,
    vertical_stripe: 85,
    tight_fit: 30,       // 복부 강조 피함
    horizontal_stripe: 35,
  },
};

function calculateBodyShapeMatchScore(
  userBodyShape: BodyShape,
  clothingItem: ClothingItem
): BodyShapeMatchResult {
  const compatibility = SILHOUETTE_COMPATIBILITY[userBodyShape];
  const categories = extractCategories(clothingItem);

  // 각 카테고리별 점수 평균
  let silhouetteScore = 0;
  let matchedCategories = 0;

  for (const category of categories) {
    if (compatibility[category] !== undefined) {
      silhouetteScore += compatibility[category];
      matchedCategories++;
    }
  }

  silhouetteScore = matchedCategories > 0
    ? silhouetteScore / matchedCategories
    : 70;  // 기본값

  // 균형감 점수 (색상 배치)
  const balanceScore = calculateColorBalance(userBodyShape, clothingItem);

  // 비율 보정 점수
  const proportionScore = calculateProportionCorrection(userBodyShape, clothingItem);

  const overallScore = Math.round(
    silhouetteScore * 0.5 +
    balanceScore * 0.3 +
    proportionScore * 0.2
  );

  return {
    overallScore,
    silhouetteScore: Math.round(silhouetteScore),
    balanceScore: Math.round(balanceScore),
    proportionScore: Math.round(proportionScore),
    recommendations: generateRecommendations(userBodyShape, clothingItem),
  };
}
```

---

## 4. 캡슐 옷장 설계 원리 (Capsule Wardrobe Design)

### 4.1 캡슐 옷장 개념

```
캡슐 옷장 = 최소한의 아이템으로 최대한의 코디 조합

핵심 원리:
1. 33개 아이템 (Project 333 기반)
2. 70% 기본 아이템 + 30% 포인트 아이템
3. 모든 아이템이 상호 호환 가능
4. 퍼스널컬러 기반 색상 팔레트
```

### 4.2 카테고리별 구성

```
┌─────────────────────────────────────────────────────────────┐
│                캡슐 옷장 구성 (33 아이템)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   상의 (Tops): 12개                                          │
│   ├── 기본 티셔츠: 4개 (흰색, 검정, 중립색 2)                │
│   ├── 셔츠/블라우스: 3개                                     │
│   ├── 니트/스웨터: 3개                                       │
│   └── 아우터: 2개                                            │
│                                                              │
│   하의 (Bottoms): 6개                                        │
│   ├── 데님: 2개                                              │
│   ├── 슬랙스: 2개                                            │
│   └── 스커트/반바지: 2개                                     │
│                                                              │
│   원피스/점프수트: 3개                                       │
│                                                              │
│   신발: 4개                                                  │
│   ├── 스니커즈: 1개                                          │
│   ├── 로퍼/플랫: 1개                                         │
│   ├── 부츠/앵클: 1개                                         │
│   └── 힐/포멀: 1개                                           │
│                                                              │
│   가방: 3개                                                  │
│   ├── 데일리백: 1개                                          │
│   ├── 미니백: 1개                                            │
│   └── 토트/숄더: 1개                                         │
│                                                              │
│   액세서리: 5개                                              │
│   ├── 벨트: 1개                                              │
│   ├── 스카프: 1개                                            │
│   ├── 주얼리: 2개                                            │
│   └── 선글라스: 1개                                          │
│                                                              │
│   코디 가능 조합: 12 × 6 × 4 × 3 = 864+ 조합                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 색상 팔레트 설계

```typescript
// lib/styling/capsule-wardrobe.ts

interface CapsulePalette {
  baseColors: string[];      // 기본색 (70%)
  accentColors: string[];    // 포인트색 (20%)
  neutralColors: string[];   // 중립색 (10%)
}

function generateCapsulePalette(season: Season): CapsulePalette {
  const harmony = SEASON_HARMONY_MAP[season];

  return {
    // 기본색: 자주 입을 수 있는 무난한 색상
    baseColors: [
      harmony.neutralColors[0],  // 밝은 중립색
      harmony.neutralColors[1],  // 중간 중립색
      '#FFFFFF',                 // 흰색 (공통)
      '#000000',                 // 검정 (공통, 계절별 톤 조절)
    ],
    // 포인트색: 계절 대표 색상
    accentColors: [
      harmony.primaryColor,
      harmony.accentColors[0],
      harmony.accentColors[1],
    ],
    // 중립색: 어디에나 매치 가능
    neutralColors: harmony.neutralColors,
  };
}

/**
 * 캡슐 옷장 호환성 검사
 * 새 아이템이 기존 옷장과 얼마나 잘 어울리는지 계산
 */
function calculateCapsuleCompatibility(
  existingWardrobe: ClothingItem[],
  newItem: ClothingItem,
  userSeason: Season
): {
  compatibilityScore: number;
  matchableItems: ClothingItem[];
  suggestedOutfits: Outfit[];
} {
  const palette = generateCapsulePalette(userSeason);
  const newItemColor = extractDominantColor(newItem);

  // 팔레트 적합성
  const paletteScore = checkPaletteMatch(newItemColor, palette);

  // 기존 아이템과의 매칭 가능성
  const matchableItems = existingWardrobe.filter(item =>
    canMatch(item, newItem, palette)
  );

  const matchRate = matchableItems.length / existingWardrobe.length;

  // 조합 가능 코디 생성
  const suggestedOutfits = generateOutfits(matchableItems, newItem);

  return {
    compatibilityScore: Math.round(paletteScore * 0.4 + matchRate * 100 * 0.6),
    matchableItems,
    suggestedOutfits,
  };
}
```

### 4.4 코디 조합 알고리즘

```typescript
interface Outfit {
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem;
  accessories: ClothingItem[];
  harmonyScore: number;
  occasion: OccasionType;
}

type OccasionType = 'casual' | 'work' | 'formal' | 'date' | 'weekend';

function generateDailyOutfits(
  wardrobe: ClothingItem[],
  userProfile: UserStyleProfile,
  occasion: OccasionType,
  weather: WeatherCondition
): Outfit[] {
  const candidates: Outfit[] = [];

  // 상의 × 하의 × 신발 조합 생성
  const tops = wardrobe.filter(i => i.category === 'top');
  const bottoms = wardrobe.filter(i => i.category === 'bottom');
  const shoes = wardrobe.filter(i => i.category === 'shoes');
  const accessories = wardrobe.filter(i => i.category === 'accessory');

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        // 기본 필터: 날씨, TPO 적합성
        if (!matchesWeather([top, bottom, shoe], weather)) continue;
        if (!matchesOccasion([top, bottom, shoe], occasion)) continue;

        // 색상 조화 점수
        const colorScore = calculateOutfitColorHarmony(
          [top, bottom, shoe],
          userProfile.season
        );

        // 체형 적합성 점수
        const bodyScore = calculateOutfitBodyMatch(
          [top, bottom],
          userProfile.bodyShape
        );

        // 스타일 선호도 점수
        const styleScore = matchStylePreference(
          [top, bottom, shoe],
          userProfile.stylePreferences
        );

        const harmonyScore = Math.round(
          colorScore * 0.4 + bodyScore * 0.35 + styleScore * 0.25
        );

        if (harmonyScore >= 70) {
          candidates.push({
            top,
            bottom,
            shoes: shoe,
            accessories: selectAccessories(
              accessories,
              [top, bottom, shoe],
              userProfile
            ),
            harmonyScore,
            occasion,
          });
        }
      }
    }
  }

  // 점수순 정렬 후 상위 5개 반환
  return candidates
    .sort((a, b) => b.harmonyScore - a.harmonyScore)
    .slice(0, 5);
}
```

---

## 5. 상품-사용자 매칭 알고리즘 (Product Matching)

### 5.1 종합 매칭 점수

```typescript
interface ProductMatchResult {
  overallScore: number;        // 종합 점수 (0-100)
  colorScore: number;          // 색상 매칭
  bodyShapeScore: number;      // 체형 매칭
  styleScore: number;          // 스타일 선호도
  capsuleScore: number;        // 캡슐 옷장 호환성
  priceScore: number;          // 가격 적합성
  breakdown: {
    colorDetail: string;
    bodyDetail: string;
    styleDetail: string;
  };
}

function calculateProductMatch(
  product: Product,
  userProfile: UserProfile
): ProductMatchResult {
  // 1. 색상 매칭 (35%)
  const colorScore = calculateColorHarmonyScore(
    userProfile.personalColor.season,
    extractProductColor(product)
  );

  // 2. 체형 매칭 (30%)
  const bodyShapeScore = calculateBodyShapeMatchScore(
    userProfile.bodyShape.type,
    product
  ).overallScore;

  // 3. 스타일 선호도 (20%)
  const styleScore = matchStylePreference(
    product,
    userProfile.stylePreferences
  );

  // 4. 캡슐 옷장 호환성 (10%)
  const capsuleScore = userProfile.wardrobe
    ? calculateCapsuleCompatibility(
        userProfile.wardrobe,
        productToClothing(product),
        userProfile.personalColor.season
      ).compatibilityScore
    : 70;  // 옷장 미등록 시 기본값

  // 5. 가격 적합성 (5%)
  const priceScore = calculatePriceScore(product.price, userProfile.priceRange);

  const overallScore = Math.round(
    colorScore * 0.35 +
    bodyShapeScore * 0.30 +
    styleScore * 0.20 +
    capsuleScore * 0.10 +
    priceScore * 0.05
  );

  return {
    overallScore,
    colorScore,
    bodyShapeScore,
    styleScore,
    capsuleScore,
    priceScore,
    breakdown: {
      colorDetail: generateColorFeedback(colorScore, userProfile.personalColor),
      bodyDetail: generateBodyFeedback(bodyShapeScore, userProfile.bodyShape),
      styleDetail: generateStyleFeedback(styleScore),
    },
  };
}
```

### 5.2 매칭 점수 해석

| 점수 범위 | 등급 | 표시 | 설명 |
|----------|------|------|------|
| 90-100 | S | Perfect Match | 모든 조건 최상 |
| 80-89 | A | Great Match | 대부분 적합 |
| 70-79 | B | Good Match | 일부 조건 미충족 |
| 60-69 | C | Fair Match | 고려 필요 |
| 0-59 | D | Not Recommended | 추천하지 않음 |

### 5.3 피드백 생성

```typescript
function generateMatchFeedback(
  result: ProductMatchResult,
  userProfile: UserProfile,
  product: Product
): string[] {
  const feedback: string[] = [];

  // 색상 피드백
  if (result.colorScore >= 80) {
    feedback.push(`✓ ${userProfile.personalColor.season}톤에 잘 어울리는 색상이에요`);
  } else if (result.colorScore < 60) {
    feedback.push(`⚠️ ${userProfile.personalColor.season}톤과 색상이 맞지 않을 수 있어요`);
  }

  // 체형 피드백
  if (result.bodyShapeScore >= 80) {
    feedback.push(`✓ ${userProfile.bodyShape.type} 체형에 잘 맞는 핏이에요`);
  } else if (result.bodyShapeScore < 60) {
    feedback.push(`⚠️ 체형에 따라 다른 실루엣을 추천해요`);
  }

  // 캡슐 옷장 피드백
  if (result.capsuleScore >= 80) {
    feedback.push(`✓ 기존 옷장 아이템과 ${Math.round(result.capsuleScore)}% 호환돼요`);
  }

  return feedback;
}
```

---

## 6. 트렌드 및 시즌 보정

### 6.1 시즌별 가중치

```typescript
interface SeasonalWeight {
  spring: number;  // 3-5월
  summer: number;  // 6-8월
  fall: number;    // 9-11월
  winter: number;  // 12-2월
}

const CATEGORY_SEASONAL_WEIGHTS: Record<ClothingCategory, SeasonalWeight> = {
  t_shirt: { spring: 1.0, summer: 1.2, fall: 0.8, winter: 0.5 },
  knit: { spring: 0.8, summer: 0.3, fall: 1.0, winter: 1.2 },
  coat: { spring: 0.7, summer: 0.1, fall: 1.0, winter: 1.3 },
  shorts: { spring: 0.8, summer: 1.3, fall: 0.4, winter: 0.1 },
  // ...
};

function applySeasonalWeight(
  baseScore: number,
  product: Product,
  currentMonth: number
): number {
  const currentSeason = getSeasonFromMonth(currentMonth);
  const weight = CATEGORY_SEASONAL_WEIGHTS[product.category]?.[currentSeason] ?? 1.0;

  return Math.min(100, Math.round(baseScore * weight));
}
```

### 6.2 트렌드 반영

```typescript
interface TrendBonus {
  trendKeywords: string[];     // 트렌드 키워드
  bonusMultiplier: number;     // 보너스 배수 (1.0-1.2)
  validUntil: Date;            // 유효 기간
}

const CURRENT_TRENDS: TrendBonus[] = [
  {
    trendKeywords: ['오버사이즈', '레이어드'],
    bonusMultiplier: 1.1,
    validUntil: new Date('2026-03-31'),
  },
  {
    trendKeywords: ['미니멀', '클린핏'],
    bonusMultiplier: 1.15,
    validUntil: new Date('2026-06-30'),
  },
];

function applyTrendBonus(
  baseScore: number,
  product: Product
): number {
  const now = new Date();
  let maxBonus = 1.0;

  for (const trend of CURRENT_TRENDS) {
    if (now > trend.validUntil) continue;

    const hasKeyword = trend.trendKeywords.some(keyword =>
      product.name.includes(keyword) ||
      product.description.includes(keyword) ||
      product.tags?.includes(keyword)
    );

    if (hasKeyword && trend.bonusMultiplier > maxBonus) {
      maxBonus = trend.bonusMultiplier;
    }
  }

  return Math.min(100, Math.round(baseScore * maxBonus));
}
```

---

## 7. 구현 체크리스트

### 7.1 색상 매칭

- [ ] Lab 색상 추출 파이프라인 (CIE-1 연동)
- [ ] 4계절 12톤 색상 매핑 테이블
- [ ] 색상 조화 점수 계산 함수
- [ ] 피해야 할 색상 경고 시스템

### 7.2 체형 매칭

- [ ] 체형-실루엣 호환성 매트릭스
- [ ] 카테고리별 적합도 점수
- [ ] 체형 기반 스타일링 팁 DB

### 7.3 캡슐 옷장

- [ ] 옷장 DB 스키마 설계
- [ ] 아이템 등록/관리 UI
- [ ] 코디 조합 생성 알고리즘
- [ ] 호환성 점수 계산

### 7.4 상품 매칭

- [ ] 종합 매칭 점수 API
- [ ] 피드백 문구 생성
- [ ] 시즌/트렌드 가중치 적용

---

## 8. 관련 문서

| 문서 | 설명 |
|------|------|
| [color-science.md](./color-science.md) | Lab 색공간, 퍼스널컬러 |
| [body-mechanics.md](./body-mechanics.md) | 체형 분류 기준 |
| [ADR-034](../adr/ADR-034-product-color-classification.md) | 상품 색상 자동 분류 |
| [SDD-CAPSULE-WARDROBE](../specs/SDD-CAPSULE-WARDROBE.md) | 캡슐 옷장 스펙 |
| [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) | AI 스타일링 스펙 |

---

## 9. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-034](../adr/ADR-034-product-color-classification.md) | 상품 색상 자동 분류 | 색상 조화 이론 |
| [ADR-029](../adr/ADR-029-affiliate-integration.md) | 어필리에이트 통합 | 상품 매칭 |

---

**Version**: 1.0 | **Created**: 2026-01-20 | **Updated**: 2026-01-20
**소스 리서치**: Fashion Theory, Color Psychology, Capsule Wardrobe (Project 333)
**관련 모듈**: J-1, P-2, P-3, PC-1, C-1
