# 퍼스널컬러×메이크업 조합 분석

> **ID**: COMBO-3
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 퍼스널컬러와 메이크업의 관계

```
퍼스널컬러 시스템:
┌─────────────────────────────────────────────────┐
│                                                 │
│  4계절 → 12계절 시스템                          │
│                                                 │
│  Spring (봄)    Summer (여름)                   │
│  ├── Light     ├── Light                       │
│  ├── True      ├── True                        │
│  └── Bright    └── Soft                        │
│                                                 │
│  Autumn (가을)   Winter (겨울)                  │
│  ├── Soft      ├── True                        │
│  ├── True      ├── Bright                      │
│  └── Deep      └── Deep                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 1.2 메이크업 매칭 원리

```
3가지 주요 특성:
1. 언더톤 (Undertone): 웜 vs 쿨
2. 명도 (Value): 라이트 vs 딥
3. 채도 (Chroma): 뮤트 vs 브라이트

이 3가지가 피부, 머리카락, 눈 색과 조화를 이루면 '화사해 보임'
```

---

## 2. 계절별 메이크업 컬러 매핑

### 2.1 상세 매핑 데이터

```typescript
// lib/analysis/personal-color-makeup.ts
export interface SeasonMakeup {
  season: PersonalColorSeason;
  undertone: 'warm' | 'cool';
  characteristics: string[];
  lip: ColorPalette;
  blush: ColorPalette;
  eyeshadow: ColorPalette;
  eyeliner: ColorPalette;
  foundation: FoundationGuide;
  avoid: string[];
}

export const SEASON_MAKEUP_MAP: Record<PersonalColorSeason, SeasonMakeup> = {
  spring_light: {
    season: 'spring_light',
    undertone: 'warm',
    characteristics: ['밝고 투명한 피부', '옅은 머리색', '맑은 눈동자'],
    lip: {
      recommended: ['피치 핑크', '코랄', '살몬', '라이트 오렌지'],
      hexCodes: ['#FFB6A3', '#FF8B6A', '#FFA07A', '#FFB347'],
      intensity: 'light',
    },
    blush: {
      recommended: ['피치', '라이트 코랄', '살구색'],
      hexCodes: ['#FFCBA4', '#FF8C69', '#FBCEB1'],
      intensity: 'light',
    },
    eyeshadow: {
      recommended: ['샴페인', '피치', '라이트 브라운', '옅은 오렌지'],
      hexCodes: ['#F7E7CE', '#FFDAB9', '#C4A484', '#FFD59A'],
      intensity: 'light',
    },
    eyeliner: {
      recommended: ['브라운', '소프트 블랙'],
      hexCodes: ['#8B4513', '#3D3D3D'],
      intensity: 'medium',
    },
    foundation: {
      undertone: 'yellow',
      coverage: 'light',
      finish: 'dewy',
      tips: '노란 언더톤, 너무 핑크 피하기',
    },
    avoid: ['진한 버건디', '블랙', '쿨톤 핑크', '회색 계열'],
  },

  summer_light: {
    season: 'summer_light',
    undertone: 'cool',
    characteristics: ['연한 피부', '애쉬 머리색', '부드러운 눈동자'],
    lip: {
      recommended: ['로즈 핑크', '말린 장미', '라벤더 핑크'],
      hexCodes: ['#E8909B', '#C08081', '#D8A9D4'],
      intensity: 'light',
    },
    blush: {
      recommended: ['소프트 핑크', '로즈', '라벤더'],
      hexCodes: ['#FFB7C5', '#E8909B', '#E6E6FA'],
      intensity: 'light',
    },
    eyeshadow: {
      recommended: ['라벤더', '소프트 그레이', '모브', '로즈'],
      hexCodes: ['#E6E6FA', '#C0C0C0', '#A67B9E', '#FFB7C5'],
      intensity: 'light',
    },
    eyeliner: {
      recommended: ['그레이', '소프트 블랙', '플럼'],
      hexCodes: ['#808080', '#3D3D3D', '#8E4585'],
      intensity: 'medium',
    },
    foundation: {
      undertone: 'pink',
      coverage: 'light',
      finish: 'satin',
      tips: '핑크/뉴트럴 언더톤, 너무 옐로우 피하기',
    },
    avoid: ['오렌지', '강한 레드', '금색', '황토색'],
  },

  autumn_deep: {
    season: 'autumn_deep',
    undertone: 'warm',
    characteristics: ['깊고 따뜻한 피부', '진한 머리색', '깊은 눈동자'],
    lip: {
      recommended: ['버건디', '브릭 레드', '초콜릿 브라운', '딥 테라코타'],
      hexCodes: ['#722F37', '#CB4154', '#7B3F00', '#CC4E3B'],
      intensity: 'deep',
    },
    blush: {
      recommended: ['브릭', '브론즈', '딥 피치'],
      hexCodes: ['#CB4154', '#CD7F32', '#FF9966'],
      intensity: 'medium-deep',
    },
    eyeshadow: {
      recommended: ['골드', '브론즈', '올리브', '번트 오렌지'],
      hexCodes: ['#FFD700', '#CD7F32', '#808000', '#CC5500'],
      intensity: 'deep',
    },
    eyeliner: {
      recommended: ['다크 브라운', '블랙', '올리브'],
      hexCodes: ['#3D2B1F', '#000000', '#556B2F'],
      intensity: 'deep',
    },
    foundation: {
      undertone: 'golden',
      coverage: 'medium',
      finish: 'natural',
      tips: '골든/올리브 언더톤, 핑크 피하기',
    },
    avoid: ['쿨 핑크', '실버', '파스텔', '네온'],
  },

  winter_true: {
    season: 'winter_true',
    undertone: 'cool',
    characteristics: ['선명한 피부', '진한 검정/회색 머리', '명확한 대비'],
    lip: {
      recommended: ['트루 레드', '핫 핑크', '푸시아', '체리'],
      hexCodes: ['#FF0000', '#FF69B4', '#FF00FF', '#DE3163'],
      intensity: 'bright',
    },
    blush: {
      recommended: ['핫 핑크', '베리', '푸시아'],
      hexCodes: ['#FF69B4', '#8E4585', '#FF00FF'],
      intensity: 'bright',
    },
    eyeshadow: {
      recommended: ['실버', '차콜', '네이비', '보라'],
      hexCodes: ['#C0C0C0', '#36454F', '#000080', '#800080'],
      intensity: 'bright',
    },
    eyeliner: {
      recommended: ['블랙', '네이비', '딥 플럼'],
      hexCodes: ['#000000', '#000080', '#673147'],
      intensity: 'deep',
    },
    foundation: {
      undertone: 'neutral-cool',
      coverage: 'medium',
      finish: 'semi-matte',
      tips: '뉴트럴~쿨 언더톤, 옐로우 피하기',
    },
    avoid: ['오렌지', '황금색', '파스텔', '머스타드'],
  },

  // ... 나머지 8개 계절 (생략, 동일 패턴)
};
```

### 2.2 제품 타입별 추천

```typescript
// lib/analysis/makeup-product-matcher.ts
export interface MakeupProductMatch {
  productType: 'lipstick' | 'blush' | 'eyeshadow' | 'foundation';
  seasonMatch: PersonalColorSeason[];
  brand: string;
  productName: string;
  shade: string;
  hexCode: string;
  matchScore: number;
}

export async function matchMakeupProducts(
  season: PersonalColorSeason,
  productType: string
): Promise<MakeupProductMatch[]> {
  const seasonData = SEASON_MAKEUP_MAP[season];
  const colorPalette = seasonData[productType as keyof SeasonMakeup];

  // DB에서 매칭 제품 검색
  const products = await searchProductsByColor(
    productType,
    (colorPalette as ColorPalette).hexCodes,
    seasonData.undertone
  );

  return products.map(product => ({
    ...product,
    matchScore: calculateColorMatch(
      product.hexCode,
      (colorPalette as ColorPalette).hexCodes
    ),
  }));
}

function calculateColorMatch(productHex: string, paletteHexes: string[]): number {
  // CIE Lab 색공간에서 Delta E 계산
  const productLab = hexToLab(productHex);
  const distances = paletteHexes.map(hex => {
    const paletteLab = hexToLab(hex);
    return deltaE2000(productLab, paletteLab);
  });

  const minDistance = Math.min(...distances);
  // Delta E < 2.3은 구분 불가 수준
  // 점수 변환: 0 → 100, 10 → 70, 20 → 50
  return Math.max(0, 100 - minDistance * 3);
}
```

---

## 3. 2025 트렌드 컬러 매칭

### 3.1 트렌드 컬러 시즌 매핑

```typescript
// lib/analysis/trend-color-matching.ts
export interface TrendColor {
  name: string;
  hexCode: string;
  description: string;
  bestSeasons: PersonalColorSeason[];
  adaptations: Record<string, string>; // 계절별 변형
}

export const TREND_COLORS_2025: TrendColor[] = [
  {
    name: 'Cherry Red (체리 레드)',
    hexCode: '#DE3163',
    description: '2025 메가 트렌드, 진하고 풍부한 레드',
    bestSeasons: ['summer_true', 'summer_soft', 'winter_true', 'winter_deep'],
    adaptations: {
      spring_light: '#FF6961', // 라이트 코랄 레드
      spring_true: '#FF4040', // 브라이트 레드
      autumn_soft: '#B22222', // 파이어브릭
      autumn_deep: '#722F37', // 와인
    },
  },
  {
    name: 'Butter Yellow (버터 옐로우)',
    hexCode: '#FFFACD',
    description: '부드럽고 따뜻한 옐로우',
    bestSeasons: ['spring_light', 'spring_true', 'autumn_soft'],
    adaptations: {
      summer_light: '#F0E68C', // 카키 (살짝 회색 추가)
      winter_true: '#FFD700', // 골드 (채도 높임)
    },
  },
  {
    name: 'Mocha Mousse (모카 무스)',
    hexCode: '#A47148',
    description: '2025 팬톤 올해의 색',
    bestSeasons: ['autumn_soft', 'autumn_true', 'autumn_deep'],
    adaptations: {
      spring_light: '#D2B48C', // 탠 (밝게)
      summer_soft: '#8B7355', // 쿨 브라운 (회색기 추가)
      winter_deep: '#5C4033', // 다크 초콜릿
    },
  },
  {
    name: 'Powder Pink (파우더 핑크)',
    hexCode: '#FFB6C1',
    description: '2025 S/S 런웨이 컬러',
    bestSeasons: ['summer_light', 'summer_soft', 'spring_light'],
    adaptations: {
      winter_true: '#FF69B4', // 핫 핑크 (채도 높임)
      autumn_soft: '#E8909B', // 더스티 로즈
    },
  },
];

export function findTrendAdaptation(
  trendColor: TrendColor,
  userSeason: PersonalColorSeason
): { hex: string; isExact: boolean; note: string } {
  if (trendColor.bestSeasons.includes(userSeason)) {
    return {
      hex: trendColor.hexCode,
      isExact: true,
      note: '이 트렌드 컬러가 당신의 퍼스널컬러와 잘 어울립니다!',
    };
  }

  const adaptation = trendColor.adaptations[userSeason];
  if (adaptation) {
    return {
      hex: adaptation,
      isExact: false,
      note: `당신의 톤에 맞게 조정된 ${trendColor.name} 버전입니다.`,
    };
  }

  // 가장 가까운 계절의 적응 찾기
  return {
    hex: findClosestAdaptation(trendColor, userSeason),
    isExact: false,
    note: '이 컬러는 당신의 톤과 다소 맞지 않을 수 있습니다.',
  };
}
```

---

## 4. 메이크업 룩 생성

### 4.1 완성 룩 추천

```typescript
// lib/analysis/makeup-look-generator.ts
export interface MakeupLook {
  name: string;
  occasion: 'daily' | 'office' | 'date' | 'event';
  intensity: 'natural' | 'moderate' | 'bold';
  steps: MakeupStep[];
  tips: string[];
  totalProducts: number;
}

export interface MakeupStep {
  order: number;
  category: string;
  product: string;
  shade: string;
  hexCode: string;
  technique: string;
}

export function generateMakeupLook(
  season: PersonalColorSeason,
  occasion: string,
  preferences?: MakeupPreferences
): MakeupLook {
  const seasonData = SEASON_MAKEUP_MAP[season];

  // 상황별 강도 결정
  const intensity = getIntensityForOccasion(occasion);

  // 각 단계 제품 선택
  const steps: MakeupStep[] = [
    {
      order: 1,
      category: '베이스',
      product: 'Foundation',
      shade: `${seasonData.foundation.undertone} 언더톤`,
      hexCode: getFoundationHex(seasonData.foundation),
      technique: seasonData.foundation.tips,
    },
    {
      order: 2,
      category: '아이',
      product: 'Eyeshadow',
      shade: selectShadeByIntensity(seasonData.eyeshadow, intensity),
      hexCode: selectHexByIntensity(seasonData.eyeshadow, intensity),
      technique: getEyeshadowTechnique(intensity),
    },
    {
      order: 3,
      category: '아이라인',
      product: 'Eyeliner',
      shade: seasonData.eyeliner.recommended[0],
      hexCode: seasonData.eyeliner.hexCodes[0],
      technique: getEyelinerTechnique(intensity),
    },
    {
      order: 4,
      category: '볼',
      product: 'Blush',
      shade: selectShadeByIntensity(seasonData.blush, intensity),
      hexCode: selectHexByIntensity(seasonData.blush, intensity),
      technique: '광대뼈를 따라 자연스럽게',
    },
    {
      order: 5,
      category: '립',
      product: 'Lipstick',
      shade: selectShadeByIntensity(seasonData.lip, intensity),
      hexCode: selectHexByIntensity(seasonData.lip, intensity),
      technique: getLipTechnique(intensity),
    },
  ];

  return {
    name: `${getSeasonKoreanName(season)} ${getOccasionName(occasion)} 룩`,
    occasion: occasion as MakeupLook['occasion'],
    intensity: intensity as MakeupLook['intensity'],
    steps,
    tips: generateMakeupTips(season, intensity),
    totalProducts: steps.length,
  };
}
```

---

## 5. UI/UX 컴포넌트

### 5.1 컬러 팔레트 시각화

```tsx
// components/analysis/MakeupColorPalette.tsx
export function MakeupColorPalette({
  season,
  category,
}: {
  season: PersonalColorSeason;
  category: 'lip' | 'blush' | 'eyeshadow';
}) {
  const seasonData = SEASON_MAKEUP_MAP[season];
  const palette = seasonData[category];

  return (
    <div data-testid="makeup-color-palette" className="space-y-4">
      <h4 className="font-medium">{getCategoryLabel(category)} 추천 컬러</h4>

      <div className="flex gap-2 flex-wrap">
        {palette.hexCodes.map((hex, index) => (
          <div key={hex} className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: hex }}
            />
            <span className="text-xs text-muted-foreground">
              {palette.recommended[index]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        강도: {palette.intensity}
      </p>
    </div>
  );
}
```

### 5.2 메이크업 룩 카드

```tsx
// components/analysis/MakeupLookCard.tsx
export function MakeupLookCard({ look }: { look: MakeupLook }) {
  return (
    <Card data-testid="makeup-look-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{look.name}</CardTitle>
          <Badge variant="outline">{look.intensity}</Badge>
        </div>
        <CardDescription>
          {look.occasion === 'daily' && '데일리'}
          {look.occasion === 'office' && '오피스'}
          {look.occasion === 'date' && '데이트'}
          {look.occasion === 'event' && '특별한 날'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* 컬러 스와치 미리보기 */}
          <div className="flex gap-1">
            {look.steps.map(step => (
              <div
                key={step.order}
                className="w-8 h-8 rounded-full border"
                style={{ backgroundColor: step.hexCode }}
                title={step.shade}
              />
            ))}
          </div>

          {/* 단계별 가이드 */}
          <Accordion type="single" collapsible>
            {look.steps.map(step => (
              <AccordionItem key={step.order} value={`step-${step.order}`}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {step.order}.
                    </span>
                    {step.category}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: step.hexCode }}
                      />
                      <span>{step.shade}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.technique}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* 팁 */}
          <div className="bg-secondary/50 p-3 rounded-lg">
            <h5 className="font-medium mb-2">메이크업 팁</h5>
            <ul className="text-sm space-y-1">
              {look.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 12계절 메이크업 컬러 매핑 완성
- [ ] 기본 매칭 알고리즘
- [ ] 컬러 팔레트 UI

### 단기 적용 (P1)

- [ ] 트렌드 컬러 적응 시스템
- [ ] 메이크업 룩 생성기
- [ ] 제품 DB 연동

### 장기 적용 (P2)

- [ ] AR 가상 메이크업
- [ ] 사용자 피드백 학습
- [ ] 제품 가격/구매처 연동

---

## 7. 참고 자료

- [Color Me Beautiful Official](https://colormebeautiful.com/)
- [L'Oréal Paris Color Theory](https://www.lorealparisusa.com/beauty-magazine/makeup/makeup-trends/color-analysis-for-makeup)
- [NYX Seasonal Color Analysis](https://www.nyxcosmetics.com/blog/seasonal-color-analysis-for-makeup.html)
- [2025 Color Trends (Color Me Beautiful)](https://colormebeautiful.com/blogs/colormenow/2025-color-trends-for-your-color-season-color-me-beautiful)

---

**Version**: 1.0 | **Priority**: P1 High
