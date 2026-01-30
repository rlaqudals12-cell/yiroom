# 퍼스널컬러×패션 조합 분석

> **ID**: COMBO-4
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 퍼스널컬러 패션의 원리

```
색상 조화 원리:
┌─────────────────────────────────────────────────┐
│                                                 │
│  피부 + 머리카락 + 눈 = 고유 컬러 톤             │
│           ↓                                     │
│  이와 조화되는 의류 색상 = 화사해 보임           │
│           ↓                                     │
│  부조화 색상 = 칙칙해 보임, 피곤해 보임          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 1.2 패션 컬러 적용 영역

| 영역 | 중요도 | 이유 |
|------|--------|------|
| **얼굴 근처** | 매우 높음 | 피부 톤에 직접 영향 |
| **상의** | 높음 | 얼굴과 가까움 |
| **하의** | 중간 | 전체 조화에 기여 |
| **액세서리** | 높음 | 메탈 톤 영향 |
| **아우터** | 높음 | 착용 빈도 높음 |

---

## 2. 계절별 패션 컬러 가이드

### 2.1 상세 매핑 데이터

```typescript
// lib/analysis/personal-color-fashion.ts
export interface SeasonFashion {
  season: PersonalColorSeason;
  undertone: 'warm' | 'cool';
  bestColors: ColorCategory[];
  neutralColors: string[];
  accentColors: string[];
  metalColors: string[];
  patternsAndPrints: string[];
  fabricRecommendations: string[];
  avoid: string[];
}

export const SEASON_FASHION_MAP: Record<PersonalColorSeason, SeasonFashion> = {
  spring_light: {
    season: 'spring_light',
    undertone: 'warm',
    bestColors: [
      { category: '핑크 계열', colors: ['피치 핑크', '코랄 핑크', '살몬'], hexCodes: ['#FFB6A3', '#FF8B6A', '#FFA07A'] },
      { category: '옐로우 계열', colors: ['버터 옐로우', '크림', '라이트 골드'], hexCodes: ['#FFFACD', '#FFFDD0', '#FFD700'] },
      { category: '블루 계열', colors: ['아쿠아', '터콰이즈', '스카이 블루'], hexCodes: ['#7FFFD4', '#40E0D0', '#87CEEB'] },
      { category: '그린 계열', colors: ['민트', '라이트 그린', '피스타치오'], hexCodes: ['#98FF98', '#90EE90', '#93C572'] },
    ],
    neutralColors: ['크림', '아이보리', '웜 베이지', '라이트 카멜'],
    accentColors: ['코랄', '피치', '터콰이즈'],
    metalColors: ['골드', '로즈골드', '구리'],
    patternsAndPrints: ['플로럴', '파스텔 스트라이프', '작은 도트'],
    fabricRecommendations: ['쉬폰', '실크', '린넨', '코튼'],
    avoid: ['블랙', '다크 네이비', '차콜', '버건디', '퓨시아'],
  },

  summer_light: {
    season: 'summer_light',
    undertone: 'cool',
    bestColors: [
      { category: '핑크 계열', colors: ['로즈 핑크', '더스티 핑크', '라벤더 핑크'], hexCodes: ['#E8909B', '#D4A5A5', '#E6BBE3'] },
      { category: '블루 계열', colors: ['스카이 블루', '파우더 블루', '페리윙클'], hexCodes: ['#87CEEB', '#B0E0E6', '#CCCCFF'] },
      { category: '퍼플 계열', colors: ['라벤더', '라일락', '소프트 퍼플'], hexCodes: ['#E6E6FA', '#C8A2C8', '#B19CD9'] },
      { category: '그레이 계열', colors: ['실버 그레이', '블루 그레이', '토프'], hexCodes: ['#C0C0C0', '#6699CC', '#87B6AA'] },
    ],
    neutralColors: ['소프트 화이트', '그레이지', '쿨 베이지', '로즈 베이지'],
    accentColors: ['라벤더', '로즈', '소프트 블루'],
    metalColors: ['실버', '화이트 골드', '로즈골드'],
    patternsAndPrints: ['워터컬러 프린트', '소프트 스트라이프', '페이즐리'],
    fabricRecommendations: ['쉬폰', '실크', '캐시미어', '소프트 코튼'],
    avoid: ['오렌지', '황금색', '머스타드', '테라코타', '강한 레드'],
  },

  autumn_deep: {
    season: 'autumn_deep',
    undertone: 'warm',
    bestColors: [
      { category: '브라운 계열', colors: ['초콜릿', '에스프레소', '코냑'], hexCodes: ['#7B3F00', '#4D2600', '#964B00'] },
      { category: '오렌지 계열', colors: ['번트 오렌지', '테라코타', '러스트'], hexCodes: ['#CC5500', '#E2725B', '#B7410E'] },
      { category: '그린 계열', colors: ['올리브', '포레스트 그린', '모스'], hexCodes: ['#808000', '#228B22', '#8A9A5B'] },
      { category: '레드 계열', colors: ['버건디', '와인', '마룬'], hexCodes: ['#722F37', '#722F37', '#800000'] },
    ],
    neutralColors: ['다크 브라운', '올리브', '카멜', '크림'],
    accentColors: ['버건디', '머스타드', '터콰이즈'],
    metalColors: ['골드', '앤틱 골드', '브론즈', '구리'],
    patternsAndPrints: ['페이즐리', '체크', '아니말 프린트', '포크 패턴'],
    fabricRecommendations: ['울', '트위드', '벨벳', '스웨이드', '레더'],
    avoid: ['네온', '쿨 핑크', '블랙(단독)', '실버'],
  },

  winter_true: {
    season: 'winter_true',
    undertone: 'cool',
    bestColors: [
      { category: '블랙 & 화이트', colors: ['트루 블랙', '퓨어 화이트'], hexCodes: ['#000000', '#FFFFFF'] },
      { category: '레드 계열', colors: ['트루 레드', '체리', '버건디'], hexCodes: ['#FF0000', '#DE3163', '#722F37'] },
      { category: '블루 계열', colors: ['로열 블루', '네이비', '코발트'], hexCodes: ['#4169E1', '#000080', '#0047AB'] },
      { category: '퍼플 계열', colors: ['딥 퍼플', '플럼', '아메시스트'], hexCodes: ['#800080', '#8E4585', '#9966CC'] },
    ],
    neutralColors: ['블랙', '화이트', '네이비', '차콜 그레이'],
    accentColors: ['핫 핑크', '이머랄드', '로열 블루'],
    metalColors: ['실버', '플래티넘', '화이트 골드'],
    patternsAndPrints: ['지오메트릭', '블랙 앤 화이트', '볼드 스트라이프'],
    fabricRecommendations: ['새틴', '실크', '캐시미어', '벨벳'],
    avoid: ['파스텔', '오렌지', '옐로우', '머스타드', '베이지'],
  },

  // ... 나머지 계절 (생략, 동일 패턴)
};
```

### 2.2 2025 트렌드 컬러 통합

```typescript
// lib/analysis/fashion-trend-integration.ts
export interface TrendIntegration {
  trendColor: string;
  hexCode: string;
  season: string; // Fall 2025, Spring 2025 등
  seasonalAdaptations: Record<PersonalColorSeason, FashionAdaptation>;
}

export const FASHION_TRENDS_2025: TrendIntegration[] = [
  {
    trendColor: 'Mocha Mousse',
    hexCode: '#A47148',
    season: '2025 Pantone Color of the Year',
    seasonalAdaptations: {
      spring_light: {
        wearAs: '액센트',
        combination: '크림, 피치와 함께',
        items: ['가방', '벨트', '슈즈'],
        tip: '전신 착용 피하고, 포인트로 활용',
      },
      autumn_deep: {
        wearAs: '메인 컬러',
        combination: '버건디, 올리브와 함께',
        items: ['코트', '니트', '팬츠'],
        tip: '톤온톤으로 시크하게 연출',
      },
      winter_true: {
        wearAs: '서브 컬러',
        combination: '블랙, 화이트와 함께',
        items: ['가디건', '백'],
        tip: '블랙 베이스에 포인트로',
      },
      // ... 더 많은 계절
    },
  },
  {
    trendColor: 'Cherry Red',
    hexCode: '#DE3163',
    season: 'Fall/Winter 2025',
    seasonalAdaptations: {
      spring_light: {
        wearAs: '립스틱만',
        combination: '코랄 레드로 대체',
        items: ['립', '네일'],
        tip: '의류보다 메이크업에 활용',
      },
      summer_light: {
        wearAs: '액센트',
        combination: '그레이, 네이비와 함께',
        items: ['스카프', '가방'],
        tip: '소프트 베리톤으로 변형',
      },
      winter_true: {
        wearAs: '메인 컬러',
        combination: '블랙, 화이트와 함께',
        items: ['코트', '드레스', '블레이저'],
        tip: '볼드하게 전신 착용 가능',
      },
    },
  },
  {
    trendColor: 'Butter Yellow',
    hexCode: '#FFFACD',
    season: 'Spring/Summer 2025',
    seasonalAdaptations: {
      spring_light: {
        wearAs: '메인 컬러',
        combination: '화이트, 피치와 함께',
        items: ['블라우스', '원피스', '팬츠'],
        tip: '봄웜에게 완벽한 컬러!',
      },
      summer_light: {
        wearAs: '액센트',
        combination: '라벤더, 소프트 그레이와 함께',
        items: ['카디건', '액세서리'],
        tip: '레몬 옐로우보다 크림 옐로우로',
      },
      winter_true: {
        wearAs: '소량만',
        combination: '블랙과 함께',
        items: ['스카프'],
        tip: '거의 사용하지 않는 것 권장',
      },
    },
  },
];
```

---

## 3. 워드로브 구성 가이드

### 3.1 캡슐 워드로브 생성

```typescript
// lib/analysis/capsule-wardrobe.ts
export interface CapsuleWardrobe {
  season: PersonalColorSeason;
  essentialItems: WardrobeItem[];
  colorRatio: ColorRatio;
  seasonalAdditions: SeasonalItem[];
  shoppingGuide: ShoppingRecommendation[];
}

export interface WardrobeItem {
  category: string;
  item: string;
  recommendedColors: string[];
  quantity: number;
  priority: 'essential' | 'nice-to-have';
}

export function generateCapsuleWardrobe(
  season: PersonalColorSeason
): CapsuleWardrobe {
  const seasonData = SEASON_FASHION_MAP[season];

  return {
    season,
    essentialItems: [
      // 탑스
      {
        category: '상의',
        item: '기본 티셔츠',
        recommendedColors: seasonData.neutralColors.slice(0, 2),
        quantity: 3,
        priority: 'essential',
      },
      {
        category: '상의',
        item: '블라우스/셔츠',
        recommendedColors: seasonData.bestColors[0].colors.slice(0, 2),
        quantity: 2,
        priority: 'essential',
      },
      {
        category: '상의',
        item: '니트/스웨터',
        recommendedColors: seasonData.accentColors.slice(0, 2),
        quantity: 2,
        priority: 'essential',
      },
      // 바텀스
      {
        category: '하의',
        item: '팬츠/슬랙스',
        recommendedColors: seasonData.neutralColors.slice(0, 2),
        quantity: 2,
        priority: 'essential',
      },
      {
        category: '하의',
        item: '청바지',
        recommendedColors: getJeanColorForSeason(season),
        quantity: 1,
        priority: 'essential',
      },
      {
        category: '하의',
        item: '스커트',
        recommendedColors: seasonData.neutralColors,
        quantity: 1,
        priority: 'nice-to-have',
      },
      // 아우터
      {
        category: '아우터',
        item: '블레이저',
        recommendedColors: seasonData.neutralColors.slice(0, 2),
        quantity: 1,
        priority: 'essential',
      },
      {
        category: '아우터',
        item: '코트',
        recommendedColors: seasonData.neutralColors,
        quantity: 1,
        priority: 'essential',
      },
      // 드레스
      {
        category: '원피스',
        item: '데일리 원피스',
        recommendedColors: seasonData.bestColors[0].colors,
        quantity: 1,
        priority: 'nice-to-have',
      },
    ],
    colorRatio: {
      neutral: 60,
      accent: 30,
      statement: 10,
      description: '60% 뉴트럴 + 30% 계절 컬러 + 10% 포인트 컬러',
    },
    seasonalAdditions: generateSeasonalAdditions(season),
    shoppingGuide: generateShoppingGuide(season),
  };
}

function getJeanColorForSeason(season: PersonalColorSeason): string[] {
  const warmSeasons = ['spring_light', 'spring_true', 'spring_bright', 'autumn_soft', 'autumn_true', 'autumn_deep'];
  if (warmSeasons.includes(season)) {
    return ['미디엄 워시', '라이트 워시'];
  }
  return ['다크 워시', '블랙 데님'];
}
```

### 3.2 컬러 조합 가이드

```typescript
// lib/analysis/color-combination.ts
export interface ColorCombination {
  name: string;
  type: 'monochromatic' | 'complementary' | 'analogous' | 'triadic';
  colors: string[];
  hexCodes: string[];
  occasion: string;
  styling: string;
}

export function generateColorCombinations(
  season: PersonalColorSeason
): ColorCombination[] {
  const seasonData = SEASON_FASHION_MAP[season];

  return [
    // 모노크로매틱 (같은 색 계열)
    {
      name: '톤온톤',
      type: 'monochromatic',
      colors: [
        seasonData.neutralColors[0],
        seasonData.neutralColors[1],
        seasonData.neutralColors[2],
      ].filter(Boolean),
      hexCodes: getHexCodesForColors(seasonData.neutralColors.slice(0, 3)),
      occasion: '오피스, 포멀',
      styling: '같은 계열의 다른 명도로 깊이감 연출',
    },
    // 악센트 조합
    {
      name: '뉴트럴 + 포인트',
      type: 'complementary',
      colors: [
        seasonData.neutralColors[0],
        seasonData.accentColors[0],
      ],
      hexCodes: [
        getHexCode(seasonData.neutralColors[0]),
        getHexCode(seasonData.accentColors[0]),
      ],
      occasion: '캐주얼, 데일리',
      styling: '뉴트럴 베이스에 포인트 컬러 하나',
    },
    // 트라이어딕 (3색 조합)
    {
      name: '3색 조화',
      type: 'triadic',
      colors: [
        seasonData.bestColors[0].colors[0],
        seasonData.bestColors[1].colors[0],
        seasonData.neutralColors[0],
      ],
      hexCodes: [
        seasonData.bestColors[0].hexCodes[0],
        seasonData.bestColors[1].hexCodes[0],
        getHexCode(seasonData.neutralColors[0]),
      ],
      occasion: '파티, 이벤트',
      styling: '60-30-10 비율로 배분',
    },
  ];
}
```

---

## 4. 쇼핑 가이드

### 4.1 브랜드 추천

```typescript
// lib/analysis/fashion-brand-matching.ts
export interface BrandRecommendation {
  brand: string;
  priceRange: 'budget' | 'mid' | 'luxury';
  bestFor: PersonalColorSeason[];
  signature: string;
  onlineStore: string;
}

export const BRAND_RECOMMENDATIONS: BrandRecommendation[] = [
  {
    brand: '자라 (Zara)',
    priceRange: 'mid',
    bestFor: ['winter_true', 'autumn_deep'],
    signature: '블랙, 뉴트럴 기반의 모던 스타일',
    onlineStore: 'https://www.zara.com/kr/',
  },
  {
    brand: '유니클로 (Uniqlo)',
    priceRange: 'budget',
    bestFor: ['summer_light', 'summer_soft', 'spring_light'],
    signature: '소프트한 기본템, 파스텔',
    onlineStore: 'https://www.uniqlo.com/kr/',
  },
  {
    brand: '8seconds',
    priceRange: 'budget',
    bestFor: ['spring_bright', 'autumn_soft'],
    signature: '트렌디한 컬러감, K-패션',
    onlineStore: 'https://www.ssfshop.com/8Seconds/',
  },
  {
    brand: 'COS',
    priceRange: 'mid',
    bestFor: ['summer_soft', 'winter_true'],
    signature: '미니멀, 뮤트 톤',
    onlineStore: 'https://www.cos.com/kr/',
  },
];
```

---

## 5. UI/UX 컴포넌트

### 5.1 패션 컬러 팔레트

```tsx
// components/analysis/FashionColorPalette.tsx
export function FashionColorPalette({
  season,
}: {
  season: PersonalColorSeason;
}) {
  const seasonData = SEASON_FASHION_MAP[season];

  return (
    <div data-testid="fashion-color-palette" className="space-y-6">
      <h3 className="text-lg font-bold">
        {getSeasonKoreanName(season)} 패션 컬러
      </h3>

      {/* 베스트 컬러 */}
      <div>
        <h4 className="font-medium mb-3">추천 컬러</h4>
        <div className="space-y-4">
          {seasonData.bestColors.map((category) => (
            <div key={category.category}>
              <p className="text-sm text-muted-foreground mb-2">
                {category.category}
              </p>
              <div className="flex gap-2">
                {category.hexCodes.map((hex, i) => (
                  <div key={hex} className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs mt-1">
                      {category.colors[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 뉴트럴 컬러 */}
      <div>
        <h4 className="font-medium mb-3">뉴트럴 컬러</h4>
        <div className="flex gap-2">
          {seasonData.neutralColors.map((color) => (
            <div key={color} className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-lg shadow-md border"
                style={{ backgroundColor: getHexCode(color) }}
              />
              <span className="text-xs mt-1">{color}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 피해야 할 컬러 */}
      <div className="bg-destructive/10 p-4 rounded-lg">
        <h4 className="font-medium mb-2">피해야 할 컬러</h4>
        <p className="text-sm text-muted-foreground">
          {seasonData.avoid.join(', ')}
        </p>
      </div>
    </div>
  );
}
```

### 5.2 캡슐 워드로브 체크리스트

```tsx
// components/analysis/WardrobeChecklist.tsx
export function WardrobeChecklist({
  wardrobe,
}: {
  wardrobe: CapsuleWardrobe;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <div data-testid="wardrobe-checklist" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">나의 캡슐 워드로브</h3>
        <Badge>
          {Object.values(checked).filter(Boolean).length}/
          {wardrobe.essentialItems.length}
        </Badge>
      </div>

      {/* 컬러 비율 가이드 */}
      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="text-sm font-medium">{wardrobe.colorRatio.description}</p>
        <div className="flex gap-1 mt-2">
          <div className="h-2 bg-neutral-400 rounded" style={{ width: '60%' }} />
          <div className="h-2 bg-primary rounded" style={{ width: '30%' }} />
          <div className="h-2 bg-accent rounded" style={{ width: '10%' }} />
        </div>
      </div>

      {/* 아이템 체크리스트 */}
      <div className="space-y-4">
        {Object.entries(
          groupBy(wardrobe.essentialItems, 'category')
        ).map(([category, items]) => (
          <div key={category}>
            <h4 className="font-medium mb-2">{category}</h4>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={checked[`${category}-${i}`]}
                    onCheckedChange={(v) =>
                      setChecked({ ...checked, [`${category}-${i}`]: !!v })
                    }
                  />
                  <div className="flex-1">
                    <span>{item.item}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {item.recommendedColors.slice(0, 3).map((color) => (
                      <div
                        key={color}
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: getHexCode(color) }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 12계절 패션 컬러 매핑
- [ ] 기본 컬러 팔레트 UI
- [ ] 피해야 할 컬러 가이드

### 단기 적용 (P1)

- [ ] 캡슐 워드로브 생성기
- [ ] 트렌드 컬러 통합
- [ ] 컬러 조합 가이드

### 장기 적용 (P2)

- [ ] 쇼핑 링크 연동
- [ ] AI 스타일링 추천
- [ ] 가상 피팅

---

## 7. 참고 자료

- [2025 Fashion Color Trends (Refinery29)](https://www.refinery29.com/en-us/fashion-color-trends-2025)
- [Fall 2025 Color Combinations (ELLE)](https://www.elle.com/fashion/shopping/a69443151/fall-2025-color-combinations-trends/)
- [Winter 2025 Colour Trends (Who What Wear)](https://www.whowhatwear.com/fashion/runway/winter-fashion-colour-trends-2025)
- [2025 Color Trends Guide for Stylists](https://www.styleacademyintl.com/post/spring-summer-2025-fashion-color-trends-guide-for-personal-stylists)

---

**Version**: 1.0 | **Priority**: P1 High
