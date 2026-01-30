# 피부×제품추천 조합 분석

> **ID**: COMBO-5
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 AI 스킨케어 추천 시장

```
시장 규모 (2025):
- AI in Beauty & Cosmetics: $13.3B
- CAGR: 23.3%

주요 기술:
- 피부 이미지 분석 (150+ 바이오마커)
- 성분 매칭 알고리즘
- 개인화 포뮬레이션
```

### 1.2 추천 시스템 접근법

| 접근법 | 설명 | 정확도 |
|--------|------|--------|
| **Content-Based** | 제품 성분/속성 기반 | 80% |
| **Collaborative** | 유사 사용자 기반 | 75% |
| **Hybrid** | 복합 접근 | 87%+ |
| **AI Deep Learning** | CNN + 이미지 분석 | 98% |

---

## 2. 피부 분석 → 제품 매칭

### 2.1 피부 타입별 성분 매핑

```typescript
// lib/analysis/skin-ingredient-mapping.ts
export interface SkinTypeIngredients {
  skinType: SkinType;
  recommended: IngredientCategory[];
  avoid: IngredientCategory[];
  keyIngredients: KeyIngredient[];
}

export interface KeyIngredient {
  name: string;
  koreanName: string;
  inci: string;
  benefit: string;
  concentration: string; // 권장 농도
  caution?: string;
}

export const SKIN_TYPE_INGREDIENTS: Record<SkinType, SkinTypeIngredients> = {
  dry: {
    skinType: 'dry',
    recommended: [
      { category: '보습제', ingredients: ['hyaluronic acid', 'glycerin', 'ceramides'] },
      { category: '에몰리언트', ingredients: ['squalane', 'shea butter', 'jojoba oil'] },
      { category: '장벽 강화', ingredients: ['ceramides', 'cholesterol', 'fatty acids'] },
    ],
    avoid: [
      { category: '수렴제', ingredients: ['alcohol denat', 'witch hazel'] },
      { category: '강한 산', ingredients: ['glycolic acid > 10%', 'salicylic acid > 2%'] },
    ],
    keyIngredients: [
      {
        name: 'Hyaluronic Acid',
        koreanName: '히알루론산',
        inci: 'Sodium Hyaluronate',
        benefit: '수분 결합, 피부 탄력',
        concentration: '0.1-2%',
      },
      {
        name: 'Ceramides',
        koreanName: '세라마이드',
        inci: 'Ceramide NP/AP/EOP',
        benefit: '피부 장벽 강화',
        concentration: '0.5-2%',
      },
      {
        name: 'Squalane',
        koreanName: '스쿠알란',
        inci: 'Squalane',
        benefit: '보습, 피지막 보호',
        concentration: '5-100%',
      },
    ],
  },

  oily: {
    skinType: 'oily',
    recommended: [
      { category: '피지 조절', ingredients: ['niacinamide', 'zinc', 'salicylic acid'] },
      { category: '가벼운 보습', ingredients: ['hyaluronic acid', 'aloe vera'] },
      { category: '모공 케어', ingredients: ['BHA', 'retinol', 'AHA'] },
    ],
    avoid: [
      { category: '무거운 오일', ingredients: ['mineral oil', 'coconut oil'] },
      { category: '코메도제닉', ingredients: ['isopropyl myristate', 'wheat germ oil'] },
    ],
    keyIngredients: [
      {
        name: 'Niacinamide',
        koreanName: '나이아신아마이드',
        inci: 'Niacinamide',
        benefit: '피지 조절, 모공 축소',
        concentration: '2-10%',
      },
      {
        name: 'Salicylic Acid',
        koreanName: '살리실산',
        inci: 'Salicylic Acid',
        benefit: '각질 제거, 여드름',
        concentration: '0.5-2%',
      },
      {
        name: 'Zinc PCA',
        koreanName: '징크피씨에이',
        inci: 'Zinc PCA',
        benefit: '피지 조절, 항균',
        concentration: '0.5-1%',
      },
    ],
  },

  combination: {
    skinType: 'combination',
    recommended: [
      { category: '균형 보습', ingredients: ['hyaluronic acid', 'niacinamide'] },
      { category: '가벼운 텍스처', ingredients: ['gel', 'essence', 'serum'] },
      { category: '부위별 케어', ingredients: ['multi-masking'] },
    ],
    avoid: [
      { category: '극단적 제품', ingredients: ['heavy creams', 'harsh astringents'] },
    ],
    keyIngredients: [
      {
        name: 'Niacinamide',
        koreanName: '나이아신아마이드',
        inci: 'Niacinamide',
        benefit: 'T존 피지 조절, U존 보습',
        concentration: '2-5%',
      },
      {
        name: 'Hyaluronic Acid',
        koreanName: '히알루론산',
        inci: 'Sodium Hyaluronate',
        benefit: '전체 수분 공급',
        concentration: '0.1-1%',
      },
    ],
  },

  sensitive: {
    skinType: 'sensitive',
    recommended: [
      { category: '진정', ingredients: ['centella asiatica', 'aloe vera', 'allantoin'] },
      { category: '장벽 보호', ingredients: ['ceramides', 'panthenol'] },
      { category: '항염', ingredients: ['bisabolol', 'chamomile', 'oat extract'] },
    ],
    avoid: [
      { category: '자극성', ingredients: ['fragrance', 'essential oils', 'alcohol'] },
      { category: '활성 성분', ingredients: ['retinol', 'vitamin c > 10%', 'AHA > 5%'] },
    ],
    keyIngredients: [
      {
        name: 'Centella Asiatica',
        koreanName: '병풀추출물',
        inci: 'Centella Asiatica Extract',
        benefit: '진정, 재생',
        concentration: '0.1-5%',
      },
      {
        name: 'Panthenol',
        koreanName: '판테놀',
        inci: 'Panthenol',
        benefit: '보습, 진정, 재생',
        concentration: '1-5%',
      },
    ],
  },

  normal: {
    skinType: 'normal',
    recommended: [
      { category: '유지', ingredients: ['antioxidants', 'hyaluronic acid'] },
      { category: '예방', ingredients: ['sunscreen', 'vitamin c', 'retinol'] },
    ],
    avoid: [],
    keyIngredients: [
      {
        name: 'Vitamin C',
        koreanName: '비타민C',
        inci: 'Ascorbic Acid',
        benefit: '항산화, 미백',
        concentration: '10-20%',
      },
    ],
  },
};
```

### 2.2 피부 고민별 성분 매칭

```typescript
// lib/analysis/concern-ingredient-mapping.ts
export interface ConcernIngredients {
  concern: SkinConcern;
  primaryIngredients: IngredientRecommendation[];
  supportingIngredients: string[];
  avoidIngredients: string[];
  routineOrder: string[];
}

export const CONCERN_INGREDIENTS: Record<SkinConcern, ConcernIngredients> = {
  acne: {
    concern: 'acne',
    primaryIngredients: [
      { name: 'Salicylic Acid', concentration: '0.5-2%', frequency: 'daily', note: 'BHA, 모공 속 피지 제거' },
      { name: 'Benzoyl Peroxide', concentration: '2.5-5%', frequency: 'daily', note: '항균, 염증성 여드름' },
      { name: 'Niacinamide', concentration: '4-5%', frequency: 'daily', note: '피지 조절, 염증 완화' },
      { name: 'Retinoid', concentration: '0.025-0.1%', frequency: 'nightly', note: '세포 회전율 증가' },
    ],
    supportingIngredients: ['zinc', 'tea tree', 'sulfur', 'azelaic acid'],
    avoidIngredients: ['comedogenic oils', 'heavy silicones', 'irritating fragrances'],
    routineOrder: ['클렌저(BHA)', '토너', '나이아신아마이드', '보습제', '선크림'],
  },

  hyperpigmentation: {
    concern: 'hyperpigmentation',
    primaryIngredients: [
      { name: 'Vitamin C', concentration: '10-20%', frequency: 'morning', note: '티로시나제 억제' },
      { name: 'Niacinamide', concentration: '4-5%', frequency: 'daily', note: '멜라닌 전달 억제' },
      { name: 'Alpha Arbutin', concentration: '2%', frequency: 'daily', note: '순한 미백' },
      { name: 'Azelaic Acid', concentration: '10-20%', frequency: 'daily', note: '멜라닌 억제 + 항염' },
      { name: 'Retinoid', concentration: '0.025-0.1%', frequency: 'nightly', note: '세포 회전율' },
    ],
    supportingIngredients: ['licorice root', 'tranexamic acid', 'kojic acid'],
    avoidIngredients: ['photosensitizing without SPF'],
    routineOrder: ['클렌저', '비타민C', '나이아신아마이드', '보습제', '선크림 SPF50+'],
  },

  wrinkles: {
    concern: 'wrinkles',
    primaryIngredients: [
      { name: 'Retinoid', concentration: '0.025-1%', frequency: 'nightly', note: '콜라겐 합성 촉진' },
      { name: 'Vitamin C', concentration: '10-20%', frequency: 'morning', note: '항산화, 콜라겐 보호' },
      { name: 'Peptides', concentration: '1-10%', frequency: 'daily', note: '피부 재생 신호' },
      { name: 'Hyaluronic Acid', concentration: '0.1-2%', frequency: 'daily', note: '볼륨, 탄력' },
    ],
    supportingIngredients: ['niacinamide', 'coenzyme Q10', 'resveratrol'],
    avoidIngredients: ['drying alcohols', 'harsh exfoliants'],
    routineOrder: ['클렌저', '토너', '비타민C(AM)/레티놀(PM)', '펩타이드', '보습제', '선크림'],
  },

  dryness: {
    concern: 'dryness',
    primaryIngredients: [
      { name: 'Hyaluronic Acid', concentration: '0.1-2%', frequency: 'daily', note: '수분 결합' },
      { name: 'Ceramides', concentration: '0.5-2%', frequency: 'daily', note: '장벽 복구' },
      { name: 'Glycerin', concentration: '5-20%', frequency: 'daily', note: '휴멕턴트' },
      { name: 'Squalane', concentration: '5-100%', frequency: 'daily', note: '에몰리언트' },
    ],
    supportingIngredients: ['shea butter', 'jojoba oil', 'urea', 'lactic acid'],
    avoidIngredients: ['alcohol denat', 'sulfates', 'strong astringents'],
    routineOrder: ['순한 클렌저', '히알루론산', '세라마이드 크림', '페이셜 오일'],
  },

  redness: {
    concern: 'redness',
    primaryIngredients: [
      { name: 'Centella Asiatica', concentration: '0.1-5%', frequency: 'daily', note: '진정, 재생' },
      { name: 'Niacinamide', concentration: '2-5%', frequency: 'daily', note: '항염' },
      { name: 'Azelaic Acid', concentration: '10-15%', frequency: 'daily', note: '항염, 혈관 축소' },
      { name: 'Green Tea', concentration: '1-5%', frequency: 'daily', note: '항산화, 진정' },
    ],
    supportingIngredients: ['aloe vera', 'chamomile', 'allantoin', 'licorice root'],
    avoidIngredients: ['fragrance', 'essential oils', 'alcohol', 'menthol'],
    routineOrder: ['순한 클렌저', '진정 토너', '센텔라 세럼', '장벽 크림', '미네랄 선크림'],
  },
};
```

---

## 3. 제품 추천 알고리즘

### 3.1 하이브리드 추천 시스템

```typescript
// lib/analysis/product-recommender.ts
export interface ProductRecommendation {
  product: Product;
  matchScore: number;
  matchReasons: MatchReason[];
  warnings: string[];
  routinePosition: string;
}

export interface MatchReason {
  type: 'skin_type' | 'concern' | 'ingredient' | 'user_similar';
  description: string;
  weight: number;
}

export async function recommendProducts(
  skinAnalysis: SkinAnalysisResult,
  preferences?: UserPreferences
): Promise<ProductRecommendation[]> {
  const { skinType, concerns, sensitivities } = skinAnalysis;

  // 1. Content-Based: 성분 매칭
  const ingredientScores = await calculateIngredientMatch(
    skinType,
    concerns,
    sensitivities
  );

  // 2. Collaborative: 유사 사용자 선호
  const userSimilarityScores = await calculateUserSimilarity(
    skinAnalysis,
    preferences
  );

  // 3. 하이브리드 점수 계산
  const hybridScores = combineScores(ingredientScores, userSimilarityScores, {
    ingredientWeight: 0.6,
    userSimilarityWeight: 0.3,
    trendWeight: 0.1,
  });

  // 4. 필터링 (피해야 할 성분)
  const filtered = filterDangerousIngredients(hybridScores, sensitivities);

  // 5. 정렬 및 반환
  return filtered
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20)
    .map(score => formatRecommendation(score));
}

async function calculateIngredientMatch(
  skinType: SkinType,
  concerns: SkinConcern[],
  sensitivities: string[]
): Promise<ProductScore[]> {
  const typeIngredients = SKIN_TYPE_INGREDIENTS[skinType];
  const concernIngredients = concerns.flatMap(c => CONCERN_INGREDIENTS[c].primaryIngredients);

  // 모든 제품에 대해 성분 매칭 점수 계산
  const products = await fetchAllProducts();

  return products.map(product => {
    let score = 0;
    const reasons: MatchReason[] = [];

    // 피부 타입 성분 매칭
    for (const rec of typeIngredients.recommended) {
      const hasIngredient = rec.ingredients.some(ing =>
        product.ingredients.toLowerCase().includes(ing.toLowerCase())
      );
      if (hasIngredient) {
        score += 20;
        reasons.push({
          type: 'skin_type',
          description: `${skinType} 피부에 좋은 ${rec.category} 포함`,
          weight: 20,
        });
      }
    }

    // 피부 고민 성분 매칭
    for (const concern of concerns) {
      for (const ing of concernIngredients) {
        if (product.ingredients.toLowerCase().includes(ing.name.toLowerCase())) {
          score += 15;
          reasons.push({
            type: 'concern',
            description: `${concern} 개선에 도움되는 ${ing.name} 포함`,
            weight: 15,
          });
        }
      }
    }

    // 피해야 할 성분 체크
    const warnings: string[] = [];
    for (const avoid of typeIngredients.avoid) {
      const hasAvoid = avoid.ingredients.some(ing =>
        product.ingredients.toLowerCase().includes(ing.toLowerCase())
      );
      if (hasAvoid) {
        score -= 30;
        warnings.push(`${skinType} 피부에 자극적일 수 있는 성분 포함`);
      }
    }

    return { product, score, reasons, warnings };
  });
}
```

### 3.2 Deep C.A.R.E. 스타일 컨텍스트 인식

```typescript
// lib/analysis/context-aware-recommendation.ts
export interface ContextFactors {
  skinAnalysis: SkinAnalysisResult;
  environment: EnvironmentContext;
  routine: RoutineContext;
  history: UserHistory;
}

export interface EnvironmentContext {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  humidity: 'low' | 'normal' | 'high';
  pollution: 'low' | 'moderate' | 'high';
  uvIndex: number;
}

export interface RoutineContext {
  currentProducts: Product[];
  step: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen';
  morning: boolean;
}

export async function contextAwareRecommend(
  context: ContextFactors
): Promise<ProductRecommendation[]> {
  const { skinAnalysis, environment, routine, history } = context;

  // 1. 기본 피부 타입 매칭
  let candidates = await getBaseCandidates(skinAnalysis, routine.step);

  // 2. 환경 컨텍스트 적용
  candidates = applyEnvironmentContext(candidates, environment);

  // 3. 루틴 호환성 체크
  candidates = checkRoutineCompatibility(candidates, routine.currentProducts);

  // 4. 사용자 히스토리 반영
  candidates = applyUserHistory(candidates, history);

  // 5. 최종 점수 계산
  return candidates
    .map(c => ({
      ...c,
      matchScore: calculateFinalScore(c, context),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

function applyEnvironmentContext(
  products: ProductCandidate[],
  env: EnvironmentContext
): ProductCandidate[] {
  return products.map(p => {
    let bonus = 0;

    // 겨울 + 건조 → 보습제 가중치
    if (env.season === 'winter' && env.humidity === 'low') {
      if (p.product.category === 'moisturizer' && p.product.texture === 'cream') {
        bonus += 10;
      }
    }

    // 여름 + 자외선 → 선크림 가중치
    if (env.season === 'summer' && env.uvIndex > 6) {
      if (p.product.category === 'sunscreen' && p.product.spf >= 50) {
        bonus += 15;
      }
    }

    // 미세먼지 → 클렌징 가중치
    if (env.pollution === 'high') {
      if (p.product.category === 'cleanser' && p.product.cleansing === 'double') {
        bonus += 10;
      }
    }

    return { ...p, environmentBonus: bonus };
  });
}

function checkRoutineCompatibility(
  products: ProductCandidate[],
  currentProducts: Product[]
): ProductCandidate[] {
  return products.filter(p => {
    // 레티놀 + AHA/BHA 동시 사용 주의
    if (p.product.ingredients.includes('retinol')) {
      const hasAcid = currentProducts.some(cp =>
        cp.ingredients.includes('glycolic') || cp.ingredients.includes('salicylic')
      );
      if (hasAcid) {
        return false;
      }
    }

    // 비타민C + 나이아신아마이드 (현대 연구에서는 괜찮음)
    // 단, 민감 피부는 주의
    return true;
  });
}
```

---

## 4. UI/UX 컴포넌트

### 4.1 제품 추천 카드

```tsx
// components/analysis/ProductRecommendationCard.tsx
export function ProductRecommendationCard({
  recommendation,
}: {
  recommendation: ProductRecommendation;
}) {
  const { product, matchScore, matchReasons, warnings } = recommendation;

  return (
    <Card data-testid="product-recommendation-card">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 제품 이미지 */}
          <div className="w-20 h-20 rounded-lg overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={80}
              height={80}
              className="object-cover"
            />
          </div>

          {/* 제품 정보 */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <h4 className="font-medium">{product.name}</h4>
              </div>
              <Badge
                variant={matchScore >= 80 ? 'default' : 'secondary'}
              >
                {matchScore}% 매칭
              </Badge>
            </div>

            {/* 매칭 이유 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {matchReasons.slice(0, 3).map((reason, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {reason.description}
                </Badge>
              ))}
            </div>

            {/* 경고 */}
            {warnings.length > 0 && (
              <p className="text-xs text-destructive mt-2">
                ⚠️ {warnings[0]}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4.2 루틴 빌더

```tsx
// components/analysis/RoutineBuilder.tsx
export function RoutineBuilder({
  skinAnalysis,
  recommendations,
}: {
  skinAnalysis: SkinAnalysisResult;
  recommendations: ProductRecommendation[];
}) {
  const routineSteps = ['클렌저', '토너', '세럼', '보습제', '선크림'];

  const groupedByStep = groupBy(recommendations, r => r.routinePosition);

  return (
    <div data-testid="routine-builder" className="space-y-6">
      <h3 className="text-lg font-bold">나만의 스킨케어 루틴</h3>

      <div className="space-y-4">
        {routineSteps.map((step, index) => (
          <div key={step} className="flex items-start gap-4">
            {/* 단계 번호 */}
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>

            {/* 단계 내용 */}
            <div className="flex-1">
              <h4 className="font-medium">{step}</h4>
              {groupedByStep[step]?.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {groupedByStep[step].slice(0, 2).map(rec => (
                    <ProductRecommendationCard
                      key={rec.product.id}
                      recommendation={rec}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  추천 제품이 없습니다
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 피부 타입별 성분 매핑 데이터
- [ ] 피부 고민별 성분 매칭
- [ ] 기본 추천 알고리즘

### 단기 적용 (P1)

- [ ] 하이브리드 추천 시스템
- [ ] 컨텍스트 인식 추천
- [ ] 루틴 빌더 UI

### 장기 적용 (P2)

- [ ] 딥러닝 기반 이미지 분석
- [ ] 제품 DB 확장 (K-Beauty)
- [ ] 구매 링크 연동

---

## 6. 참고 자료

- [Haut.AI Deep C.A.R.E.](https://haut.ai/blogs/introducing-deepcare-ai-recommendation-system-for-context-aware-skincare-matching)
- [AI in Beauty Market (XJ Beauty)](https://www.xj-beauty.com/blog/beauty-tech-in-2025-ai-ar-and-personalized-beauty-experiences)
- [Skincare Recommendation GitHub](https://github.com/MahmoudNamNam/Skincare-Product-Recommendation)
- [AI Personalized Skincare (ChemCopilot)](https://www.chemcopilot.com/blog/the-science-of-ai-generated-skincare-personalized-formulations-for-every-skin-type)

---

**Version**: 1.0 | **Priority**: P1 High
