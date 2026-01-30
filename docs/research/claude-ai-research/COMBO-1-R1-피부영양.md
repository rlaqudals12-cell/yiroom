# 피부×영양 조합 분석

> **ID**: COMBO-1
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 크로스도메인 분석의 필요성

```
독립 분석 vs 통합 분석:

독립 분석:
  피부 분석 → "건성 피부입니다"
  영양 분석 → "비타민 C가 부족합니다"

통합 분석:
  피부×영양 → "건성 피부 + 비타민 C 부족 → 콜라겐 합성 저하 가능성"
           → "비타민 C 섭취 증가 시 피부 수분도 개선 기대"
```

### 1.2 과학적 근거

2025년 Journal of Investigative Dermatology 연구:
- 피부 내 비타민 C 농도 = 혈중 농도와 비례
- 키위 2개/일 섭취 → 피부 비타민 C ↑ → 콜라겐 생성 ↑

---

## 2. 영양소별 피부 영향

### 2.1 핵심 영양소 매핑

| 영양소 | 피부 효과 | 결핍 시 증상 | 권장 식품 |
|--------|----------|-------------|----------|
| **비타민 A** | 세포 재생, 항산화 | 건조, 각질화 | 당근, 고구마, 시금치 |
| **비타민 C** | 콜라겐 합성, 항산화 | 탄력 저하, 상처 회복 지연 | 키위, 파프리카, 감귤류 |
| **비타민 E** | 항산화, 보습 | 건조, 주름 | 아몬드, 아보카도, 올리브오일 |
| **비타민 D** | 면역, 상처 회복 | 여드름, 건선 악화 | 연어, 계란, 햇빛 |
| **아연** | 상처 회복, 피지 조절 | 여드름, 탈모 | 굴, 소고기, 호박씨 |
| **셀레늄** | 항산화, UV 보호 | 조기 노화 | 브라질너트, 참치 |
| **오메가-3** | 보습, 항염 | 건조, 염증 | 연어, 고등어, 아마씨 |

### 2.2 피부 타입별 영양 권장

```typescript
// lib/analysis/skin-nutrition-mapping.ts
export const SKIN_TYPE_NUTRITION_MAP: Record<SkinType, NutritionRecommendation> = {
  dry: {
    priority: ['omega3', 'vitaminE', 'vitaminA'],
    foods: ['연어', '아보카도', '올리브오일', '견과류'],
    supplements: ['오메가-3', '비타민E'],
    avoid: ['카페인 과다', '알코올'],
    reason: '피부 장벽 강화 및 수분 유지에 필수 지방산 필요',
  },
  oily: {
    priority: ['zinc', 'vitaminA', 'selenium'],
    foods: ['굴', '당근', '브라질너트', '녹차'],
    supplements: ['아연', '비타민A'],
    avoid: ['고GI 식품', '유제품'],
    reason: '피지 조절과 항염 작용 필요',
  },
  combination: {
    priority: ['vitaminC', 'zinc', 'omega3'],
    foods: ['키위', '호두', '연어', '시금치'],
    supplements: ['종합비타민', '오메가-3'],
    avoid: ['가공식품'],
    reason: 'T존/U존 균형을 위한 종합적 영양 필요',
  },
  sensitive: {
    priority: ['omega3', 'vitaminD', 'probiotics'],
    foods: ['연어', '계란', '요거트', '김치'],
    supplements: ['오메가-3', '프로바이오틱스'],
    avoid: ['맵고 자극적인 음식', '알코올'],
    reason: '피부 장벽 강화와 면역 조절 필요',
  },
  normal: {
    priority: ['vitaminC', 'vitaminE', 'antioxidants'],
    foods: ['베리류', '녹황색 채소', '견과류'],
    supplements: ['종합비타민'],
    avoid: ['특별 제한 없음'],
    reason: '현재 상태 유지를 위한 항산화 섭취',
  },
};
```

---

## 3. 피부 고민별 영양 매칭

### 3.1 매칭 알고리즘

```typescript
// lib/analysis/skin-concern-nutrition.ts
export interface SkinConcernNutrition {
  concern: string;
  nutrients: string[];
  mechanism: string;
  foods: string[];
  duration: string; // 효과 기대 기간
}

export const SKIN_CONCERN_NUTRITION_MAP: SkinConcernNutrition[] = [
  {
    concern: 'acne',
    nutrients: ['zinc', 'vitaminA', 'omega3', 'probiotics'],
    mechanism: '피지 조절 + 항염 + 장-피부 축 개선',
    foods: ['굴', '당근', '연어', '김치', '녹차'],
    duration: '4-8주',
  },
  {
    concern: 'wrinkles',
    nutrients: ['vitaminC', 'vitaminE', 'collagen', 'selenium'],
    mechanism: '콜라겐 합성 촉진 + 항산화',
    foods: ['키위', '아몬드', '뼈국', '브라질너트'],
    duration: '8-12주',
  },
  {
    concern: 'dryness',
    nutrients: ['omega3', 'vitaminE', 'hyaluronicAcid'],
    mechanism: '피부 장벽 강화 + 수분 결합',
    foods: ['연어', '아보카도', '닭발', '콩나물'],
    duration: '2-4주',
  },
  {
    concern: 'hyperpigmentation',
    nutrients: ['vitaminC', 'niacinamide', 'glutathione'],
    mechanism: '멜라닌 생성 억제 + 항산화',
    foods: ['레몬', '토마토', '브로콜리', '마늘'],
    duration: '8-16주',
  },
  {
    concern: 'redness',
    nutrients: ['omega3', 'vitaminD', 'quercetin'],
    mechanism: '항염 + 면역 조절',
    foods: ['고등어', '계란', '양파', '사과'],
    duration: '4-8주',
  },
];

export function matchSkinConcernToNutrition(
  skinAnalysis: SkinAnalysisResult
): NutritionRecommendation[] {
  const recommendations: NutritionRecommendation[] = [];

  // 주요 피부 고민 추출
  const concerns = extractConcerns(skinAnalysis);

  for (const concern of concerns) {
    const match = SKIN_CONCERN_NUTRITION_MAP.find(m => m.concern === concern);
    if (match) {
      recommendations.push({
        concern: match.concern,
        priority: calculatePriority(skinAnalysis, concern),
        nutrients: match.nutrients,
        foods: match.foods,
        mechanism: match.mechanism,
        expectedDuration: match.duration,
      });
    }
  }

  // 우선순위 정렬
  return recommendations.sort((a, b) => b.priority - a.priority);
}
```

### 3.2 식습관 분석 통합

```typescript
// lib/analysis/diet-skin-correlation.ts
export interface DietSkinCorrelation {
  dietPattern: string;
  skinImpact: 'positive' | 'negative' | 'neutral';
  affectedAreas: string[];
  explanation: string;
}

export const DIET_SKIN_CORRELATIONS: DietSkinCorrelation[] = [
  {
    dietPattern: 'high_gi',
    skinImpact: 'negative',
    affectedAreas: ['acne', 'oiliness'],
    explanation: '고GI 식품 → 인슐린 급증 → 피지 분비 증가 → 여드름 악화',
  },
  {
    dietPattern: 'dairy_heavy',
    skinImpact: 'negative',
    affectedAreas: ['acne'],
    explanation: '유제품 내 호르몬 → 피지선 자극 가능성',
  },
  {
    dietPattern: 'mediterranean',
    skinImpact: 'positive',
    affectedAreas: ['aging', 'inflammation', 'hydration'],
    explanation: '항산화 + 건강한 지방 → 전반적 피부 건강 개선',
  },
  {
    dietPattern: 'low_water',
    skinImpact: 'negative',
    affectedAreas: ['dryness', 'dullness'],
    explanation: '수분 부족 → 피부 탄력 저하, 건조',
  },
  {
    dietPattern: 'high_antioxidant',
    skinImpact: 'positive',
    affectedAreas: ['aging', 'pigmentation', 'radiance'],
    explanation: '항산화제 → 자유 라디칼 중화 → 노화 지연',
  },
];
```

---

## 4. 통합 분석 시스템

### 4.1 크로스 분석 함수

```typescript
// lib/analysis/cross-analysis.ts
export interface CrossAnalysisResult {
  skinSummary: SkinAnalysisSummary;
  nutritionSummary: NutritionSummary;
  correlations: Correlation[];
  recommendations: IntegratedRecommendation[];
  synergies: Synergy[];
  warnings: Warning[];
}

export async function performCrossAnalysis(
  userId: string,
  skinAnalysis: SkinAnalysisResult,
  nutritionAnalysis: NutritionAnalysisResult
): Promise<CrossAnalysisResult> {
  // 1. 피부-영양 상관관계 분석
  const correlations = analyzeCorrelations(skinAnalysis, nutritionAnalysis);

  // 2. 시너지 효과 식별
  const synergies = identifySynergies(correlations);

  // 3. 위험 요소 감지
  const warnings = detectWarnings(skinAnalysis, nutritionAnalysis);

  // 4. 통합 추천 생성
  const recommendations = generateIntegratedRecommendations(
    skinAnalysis,
    nutritionAnalysis,
    correlations
  );

  return {
    skinSummary: summarizeSkin(skinAnalysis),
    nutritionSummary: summarizeNutrition(nutritionAnalysis),
    correlations,
    recommendations,
    synergies,
    warnings,
  };
}

function analyzeCorrelations(
  skin: SkinAnalysisResult,
  nutrition: NutritionAnalysisResult
): Correlation[] {
  const correlations: Correlation[] = [];

  // 건성 피부 + 오메가-3 부족
  if (skin.type === 'dry' && nutrition.omega3Level < 50) {
    correlations.push({
      factor1: { type: 'skin', value: 'dry' },
      factor2: { type: 'nutrition', value: 'low_omega3' },
      strength: 'strong',
      direction: 'negative',
      insight: '건성 피부와 오메가-3 부족이 동시 발견됨. 오메가-3 섭취 증가 시 피부 수분도 개선 기대',
    });
  }

  // 여드름 + 고GI 식이
  if (skin.concerns.includes('acne') && nutrition.giIndex > 70) {
    correlations.push({
      factor1: { type: 'skin', value: 'acne' },
      factor2: { type: 'nutrition', value: 'high_gi' },
      strength: 'moderate',
      direction: 'negative',
      insight: '고GI 식품 섭취와 여드름의 연관성 발견. 저GI 식이로 전환 권장',
    });
  }

  // 추가 상관관계 분석...
  return correlations;
}
```

### 4.2 통합 추천 생성

```typescript
// lib/analysis/integrated-recommendation.ts
export interface IntegratedRecommendation {
  id: string;
  category: 'food' | 'supplement' | 'lifestyle' | 'skincare';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  skinBenefit: string;
  nutritionBenefit: string;
  expectedTimeframe: string;
  actionItems: string[];
}

export function generateIntegratedRecommendations(
  skin: SkinAnalysisResult,
  nutrition: NutritionAnalysisResult,
  correlations: Correlation[]
): IntegratedRecommendation[] {
  const recommendations: IntegratedRecommendation[] = [];

  // 상관관계 기반 추천
  for (const correlation of correlations) {
    if (correlation.strength === 'strong' && correlation.direction === 'negative') {
      recommendations.push(
        createRecommendationFromCorrelation(correlation, skin, nutrition)
      );
    }
  }

  // 기본 피부 타입 기반 추천
  const skinTypeRec = SKIN_TYPE_NUTRITION_MAP[skin.type];
  recommendations.push({
    id: `skin-type-${skin.type}`,
    category: 'food',
    priority: 'medium',
    title: `${skin.type} 피부를 위한 영양 섭취`,
    description: skinTypeRec.reason,
    skinBenefit: '피부 타입에 맞는 영양 공급',
    nutritionBenefit: '부족한 영양소 보충',
    expectedTimeframe: '4-8주',
    actionItems: skinTypeRec.foods.map(f => `${f} 섭취 권장`),
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

---

## 5. UI/UX 설계

### 5.1 결과 표시 컴포넌트

```tsx
// components/analysis/SkinNutritionInsight.tsx
interface SkinNutritionInsightProps {
  crossAnalysis: CrossAnalysisResult;
}

export function SkinNutritionInsight({ crossAnalysis }: SkinNutritionInsightProps) {
  return (
    <div data-testid="skin-nutrition-insight">
      {/* 핵심 인사이트 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>피부×영양 통합 분석</CardTitle>
          <CardDescription>
            피부 상태와 영양 분석을 종합한 맞춤 인사이트
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 상관관계 시각화 */}
          <CorrelationDiagram correlations={crossAnalysis.correlations} />

          {/* 시너지 효과 */}
          {crossAnalysis.synergies.length > 0 && (
            <SynergySection synergies={crossAnalysis.synergies} />
          )}

          {/* 경고 */}
          {crossAnalysis.warnings.length > 0 && (
            <WarningSection warnings={crossAnalysis.warnings} />
          )}
        </CardContent>
      </Card>

      {/* 통합 추천 리스트 */}
      <RecommendationList recommendations={crossAnalysis.recommendations} />
    </div>
  );
}
```

### 5.2 상호 참조 네비게이션

```tsx
// components/analysis/CrossReferenceNav.tsx
export function CrossReferenceNav({
  currentModule,
  relatedModules,
}: CrossReferenceNavProps) {
  return (
    <nav className="flex gap-2 flex-wrap" data-testid="cross-reference-nav">
      {relatedModules.map(module => (
        <Link
          key={module.id}
          href={module.href}
          className="px-3 py-1 rounded-full bg-secondary text-sm hover:bg-primary hover:text-primary-foreground transition"
        >
          {module.icon} {module.label}
        </Link>
      ))}
    </nav>
  );
}

// 사용 예시
<CrossReferenceNav
  currentModule="skin"
  relatedModules={[
    { id: 'nutrition', label: '영양 분석', href: '/analysis/nutrition', icon: '🥗' },
    { id: 'products', label: '제품 추천', href: '/analysis/products', icon: '💄' },
  ]}
/>
```

---

## 6. 데이터 스키마

### 6.1 크로스 분석 결과 테이블

```sql
-- 크로스 분석 결과 저장
CREATE TABLE cross_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'skin_nutrition', 'body_exercise', etc.
  source_analyses JSONB NOT NULL, -- 원본 분석 ID 참조
  correlations JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE cross_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_cross_analysis" ON cross_analysis_results
  FOR ALL USING (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_cross_analysis_user ON cross_analysis_results(clerk_user_id);
CREATE INDEX idx_cross_analysis_type ON cross_analysis_results(analysis_type);
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 피부 타입별 영양 매핑 데이터 구현
- [ ] 기본 상관관계 분석 함수
- [ ] 통합 추천 생성 로직

### 단기 적용 (P1)

- [ ] UI 컴포넌트 구현
- [ ] 상호 참조 네비게이션
- [ ] DB 스키마 마이그레이션

### 장기 적용 (P2)

- [ ] AI 기반 상관관계 발견
- [ ] 시계열 추적 (식이 변화 → 피부 변화)
- [ ] A/B 테스트 (추천 효과 검증)

---

## 8. 참고 자료

- [Nutritional Dermatology: Optimizing Dietary Choices (MDPI 2025)](https://www.mdpi.com/2072-6643/17/1/60)
- [Personalized Skin Health Management (Frontiers 2025)](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2025.1624960/full)
- [Vitamin C Skin Research (ScienceDaily 2025)](https://www.sciencedaily.com/releases/2025/12/251226045343.htm)
- [Dietary Influences on Skin Health (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10982215/)

---

**Version**: 1.0 | **Priority**: P1 High
