# AI-8: AI 편향 감지 및 공정성 (Bias Detection & Fairness)

> AI/ML 심화 8/8 - 피부색/인종/성별 편향 테스트 및 완화

---

## 1. 연구 개요

### 1.1 AI 편향의 심각성

뷰티/헬스케어 AI에서 편향은 특히 심각한 문제다:
- **피부색 편향**: 어두운 피부톤에서 정확도 저하
- **성별 편향**: 특정 성별에 최적화된 분석
- **연령 편향**: 특정 연령대 학습 데이터 편중

### 1.2 2025년 연구 동향

| 연구 | 발견 |
|------|------|
| FHIBE 벤치마크 | 어두운 피부톤, 아프리카계, 고령층에서 성능 저하 |
| AI-Face (CVPR 2025) | AI 생성 얼굴 탐지에서 인종별 편향 존재 |
| TrueSkin | LMM들이 중간 피부톤을 밝은 톤으로 오분류 경향 |
| HAM10000 피부암 | 어두운 피부에서 정밀도, F1 점수 유의미하게 낮음 |

### 1.3 이룸에서의 중요성

| 분석 모듈 | 편향 위험 | 영향 |
|----------|----------|------|
| 피부 분석 (S-1) | 높음 | 피부색에 따른 정확도 차이 |
| 퍼스널컬러 (PC-1) | 중간 | 언더톤 감지 정확도 |
| 체형 분석 (C-1) | 중간 | 체형 분류 편향 |
| 제품 추천 | 중간 | 특정 피부 타입 학습 편중 |

---

## 2. 편향 유형 및 원인

### 2.1 편향 유형

```typescript
// types/bias.ts

export type BiasType =
  | 'skin_tone'      // 피부색 편향
  | 'gender'         // 성별 편향
  | 'age'            // 연령 편향
  | 'ethnicity'      // 민족 편향
  | 'body_type';     // 체형 편향

export interface BiasMetrics {
  type: BiasType;
  groups: BiasGroup[];
  overallDisparity: number;  // 전체 불균형 정도
  worstCase: {
    group: string;
    metric: string;
    value: number;
  };
}

export interface BiasGroup {
  name: string;
  sampleSize: number;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    confidenceAvg?: number;
  };
}
```

### 2.2 원인 분석

```
┌─────────────────────────────────────────────────────────────┐
│                     편향 발생 원인                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. 학습 데이터 편향                                        │
│      └── 밝은 피부톤 데이터 과다                            │
│      └── 특정 연령대 편중                                   │
│      └── 지역적 데이터 불균형                               │
│                                                             │
│   2. 레이블링 편향                                          │
│      └── 주관적 피부 타입 분류                              │
│      └── 문화적 미의 기준 반영                              │
│      └── 라벨러 배경의 영향                                 │
│                                                             │
│   3. 모델 편향                                              │
│      └── 다수 그룹에 최적화                                 │
│      └── 특정 특성에 과적합                                 │
│                                                             │
│   4. 측정 편향                                              │
│      └── 피부톤 측정 스케일 선택                            │
│      └── 밝기→어둡기 순서의 영향                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 피부톤 분류 시스템

### 3.1 피부톤 스케일

```typescript
// lib/bias/skin-tone-scale.ts

// Fitzpatrick Skin Type (FST) - 가장 널리 사용
export const FITZPATRICK_SCALE = {
  I: { name: 'Very Light', description: '항상 화상, 태닝 안됨' },
  II: { name: 'Light', description: '쉽게 화상, 약간 태닝' },
  III: { name: 'Medium Light', description: '때때로 화상, 중간 태닝' },
  IV: { name: 'Medium', description: '거의 화상 없음, 쉽게 태닝' },
  V: { name: 'Medium Dark', description: '화상 거의 없음, 진한 태닝' },
  VI: { name: 'Dark', description: '화상 없음, 매우 진한 피부' },
};

// Monk Skin Tone (MST) - Google 개발, 더 포괄적
export const MONK_SKIN_TONE_SCALE = [
  { id: 1, hex: '#F6EDE4', name: 'MST-01' },
  { id: 2, hex: '#F3E7DB', name: 'MST-02' },
  { id: 3, hex: '#F7E2C7', name: 'MST-03' },
  { id: 4, hex: '#EECEB3', name: 'MST-04' },
  { id: 5, hex: '#E5C19E', name: 'MST-05' },
  { id: 6, hex: '#D5A77F', name: 'MST-06' },
  { id: 7, hex: '#C68862', name: 'MST-07' },
  { id: 8, hex: '#A56B46', name: 'MST-08' },
  { id: 9, hex: '#6D4B37', name: 'MST-09' },
  { id: 10, hex: '#3A2319', name: 'MST-10' },
];

// 피부톤 자동 감지 (이미지에서)
export async function detectSkinTone(imageBase64: string): Promise<{
  fitzpatrick: string;
  monk: number;
  confidence: number;
}> {
  // 얼굴 영역 추출 후 평균 색상 분석
  const avgColor = await extractFaceSkinColor(imageBase64);
  const { l, a, b } = rgbToLab(avgColor);

  // L* 값 기반 분류 (밝기)
  let fitzpatrick: string;
  let monk: number;

  if (l > 80) {
    fitzpatrick = 'I';
    monk = 1;
  } else if (l > 70) {
    fitzpatrick = 'II';
    monk = 2;
  } else if (l > 60) {
    fitzpatrick = 'III';
    monk = 4;
  } else if (l > 50) {
    fitzpatrick = 'IV';
    monk = 6;
  } else if (l > 40) {
    fitzpatrick = 'V';
    monk = 8;
  } else {
    fitzpatrick = 'VI';
    monk = 10;
  }

  return { fitzpatrick, monk, confidence: 0.8 };
}
```

---

## 4. 편향 테스트

### 4.1 테스트 프레임워크

```typescript
// lib/bias/testing-framework.ts

export interface BiasTestConfig {
  analysisType: string;
  testGroups: TestGroup[];
  metrics: string[];
  minSamplesPerGroup: number;
  significanceLevel: number;  // 0.05
}

export interface TestGroup {
  id: string;
  name: string;
  criteria: Record<string, any>;  // 그룹 필터 조건
}

export interface BiasTestResult {
  passed: boolean;
  metrics: Record<string, GroupMetrics[]>;
  disparityScores: DisparityScore[];
  recommendations: string[];
}

export interface DisparityScore {
  metric: string;
  groups: [string, string];
  disparity: number;  // 두 그룹 간 차이
  significant: boolean;
}

// 편향 테스트 실행
export async function runBiasTest(
  config: BiasTestConfig,
  testData: TestDataset
): Promise<BiasTestResult> {
  const results: BiasTestResult = {
    passed: true,
    metrics: {},
    disparityScores: [],
    recommendations: [],
  };

  // 각 그룹별 메트릭 계산
  for (const metric of config.metrics) {
    results.metrics[metric] = [];

    for (const group of config.testGroups) {
      const groupData = filterByGroup(testData, group.criteria);

      if (groupData.length < config.minSamplesPerGroup) {
        console.warn(`[Bias Test] Insufficient samples for ${group.name}`);
        continue;
      }

      const metricValue = calculateMetric(metric, groupData);
      results.metrics[metric].push({
        group: group.name,
        value: metricValue,
        sampleSize: groupData.length,
      });
    }
  }

  // 그룹 간 불균형 계산
  for (const metric of config.metrics) {
    const groupMetrics = results.metrics[metric];

    for (let i = 0; i < groupMetrics.length; i++) {
      for (let j = i + 1; j < groupMetrics.length; j++) {
        const disparity = Math.abs(groupMetrics[i].value - groupMetrics[j].value);
        const significant = isSignificant(disparity, config.significanceLevel);

        results.disparityScores.push({
          metric,
          groups: [groupMetrics[i].group, groupMetrics[j].group],
          disparity,
          significant,
        });

        if (significant) {
          results.passed = false;
        }
      }
    }
  }

  // 권고사항 생성
  results.recommendations = generateRecommendations(results);

  return results;
}
```

### 4.2 피부 분석 편향 테스트

```typescript
// tests/bias/skin-analysis-bias.test.ts

import { runBiasTest, BiasTestConfig } from '@/lib/bias/testing-framework';

describe('Skin Analysis Bias Test', () => {
  const config: BiasTestConfig = {
    analysisType: 'skin',
    testGroups: [
      { id: 'fst-1-2', name: 'Light Skin (FST I-II)', criteria: { fitzpatrick: ['I', 'II'] } },
      { id: 'fst-3-4', name: 'Medium Skin (FST III-IV)', criteria: { fitzpatrick: ['III', 'IV'] } },
      { id: 'fst-5-6', name: 'Dark Skin (FST V-VI)', criteria: { fitzpatrick: ['V', 'VI'] } },
    ],
    metrics: ['accuracy', 'confidence_avg', 'type_precision'],
    minSamplesPerGroup: 30,
    significanceLevel: 0.05,
  };

  it('should have similar accuracy across skin tones', async () => {
    const result = await runBiasTest(config, testDataset);

    const accuracyDisparity = result.disparityScores
      .filter(d => d.metric === 'accuracy')
      .map(d => d.disparity);

    // 정확도 차이가 10% 이내여야 함
    expect(Math.max(...accuracyDisparity)).toBeLessThan(0.1);
  });

  it('should not have significantly lower confidence for darker skin', async () => {
    const result = await runBiasTest(config, testDataset);

    const darkSkinConfidence = result.metrics.confidence_avg
      .find(m => m.group === 'Dark Skin (FST V-VI)')?.value || 0;

    const lightSkinConfidence = result.metrics.confidence_avg
      .find(m => m.group === 'Light Skin (FST I-II)')?.value || 0;

    // 어두운 피부의 신뢰도가 20% 이상 낮지 않아야 함
    expect(darkSkinConfidence).toBeGreaterThan(lightSkinConfidence * 0.8);
  });
});
```

### 4.3 성별 편향 테스트

```typescript
// tests/bias/gender-bias.test.ts

describe('Gender Bias Test', () => {
  const config: BiasTestConfig = {
    analysisType: 'skin',
    testGroups: [
      { id: 'male', name: 'Male', criteria: { gender: 'male' } },
      { id: 'female', name: 'Female', criteria: { gender: 'female' } },
    ],
    metrics: ['accuracy', 'type_distribution'],
    minSamplesPerGroup: 50,
    significanceLevel: 0.05,
  };

  it('should have similar accuracy for all genders', async () => {
    const result = await runBiasTest(config, testDataset);

    expect(result.passed).toBe(true);
  });

  it('should not over-classify one gender as a specific skin type', async () => {
    // 특정 성별이 특정 피부 타입으로 과분류되지 않는지 확인
    const result = await runBiasTest(config, testDataset);

    const typeDistributions = result.metrics.type_distribution;
    // 각 성별의 피부 타입 분포가 비슷해야 함
  });
});
```

---

## 5. 편향 완화 전략

### 5.1 데이터 수준 완화

```typescript
// lib/bias/mitigation/data-level.ts

// 1. 데이터 증강 (Oversampling)
export function augmentUnderrepresentedGroups(
  dataset: TrainingData[],
  targetDistribution: Record<string, number>
): TrainingData[] {
  const groupCounts = countByGroup(dataset);
  const augmented = [...dataset];

  for (const [group, targetCount] of Object.entries(targetDistribution)) {
    const currentCount = groupCounts[group] || 0;
    if (currentCount < targetCount) {
      const samplesToAdd = targetCount - currentCount;
      const groupSamples = dataset.filter(d => d.group === group);

      for (let i = 0; i < samplesToAdd; i++) {
        const sample = groupSamples[i % groupSamples.length];
        augmented.push(augmentSample(sample));
      }
    }
  }

  return augmented;
}

// 2. 다양한 조명 조건 시뮬레이션
export function simulateLightingConditions(
  imageBase64: string
): string[] {
  const variations = [];

  // 따뜻한 조명
  variations.push(applyColorTemperature(imageBase64, 'warm'));
  // 차가운 조명
  variations.push(applyColorTemperature(imageBase64, 'cool'));
  // 밝은 환경
  variations.push(adjustBrightness(imageBase64, 1.2));
  // 어두운 환경
  variations.push(adjustBrightness(imageBase64, 0.8));

  return variations;
}
```

### 5.2 모델 수준 완화

```typescript
// lib/bias/mitigation/model-level.ts

// 1. 피부톤 정규화 프롬프트
export const SKIN_TONE_AWARE_PROMPT = `
## Important: Skin Tone Awareness

When analyzing skin:
1. Consider that skin concerns manifest differently across skin tones
2. Hyperpigmentation, redness, and texture appear differently on darker skin
3. Do not assume lighter skin as the baseline
4. Adjust confidence based on image quality, not skin tone

If you are less confident due to skin tone rather than image quality,
acknowledge this limitation rather than providing potentially biased results.
`;

// 2. 보정 계수 적용
export const SKIN_TONE_CORRECTION_FACTORS: Record<string, Record<string, number>> = {
  // 어두운 피부에서 과소평가되는 경향 보정
  dark: {
    hydration: 1.1,      // 수분도 약간 상향 보정
    redness: 0.85,       // 홍조 감지 하향 보정 (감지 어려움)
    sensitivity: 1.0,    // 민감도는 그대로
  },
  // 밝은 피부에서 과대평가되는 경향 보정
  light: {
    hydration: 0.95,
    redness: 1.0,
    sensitivity: 1.0,
  },
};

export function applyBiasCorrection(
  result: SkinAnalysisResult,
  skinTone: 'light' | 'medium' | 'dark'
): SkinAnalysisResult {
  const factors = SKIN_TONE_CORRECTION_FACTORS[skinTone];
  if (!factors) return result;

  const correctedScores = { ...result.scores };

  for (const [key, factor] of Object.entries(factors)) {
    if (correctedScores[key] !== undefined) {
      correctedScores[key] = Math.min(100, Math.round(correctedScores[key] * factor));
    }
  }

  return {
    ...result,
    scores: correctedScores,
    _biasCorrection: {
      applied: true,
      skinTone,
      factors,
    },
  };
}
```

### 5.3 출력 수준 완화

```typescript
// lib/bias/mitigation/output-level.ts

// 1. 불확실성 명시
export function addUncertaintyDisclosure(
  result: AnalysisResult,
  skinTone: string
): AnalysisResult {
  const knownLimitations: Record<string, string> = {
    V: '어두운 피부톤에서는 일부 피부 상태(홍조, 색소침착)의 정확한 감지가 어려울 수 있습니다.',
    VI: '매우 어두운 피부톤에서는 AI 분석의 정확도가 낮아질 수 있습니다. 전문가 상담을 권장합니다.',
  };

  const disclosure = knownLimitations[skinTone];

  if (disclosure) {
    return {
      ...result,
      disclaimer: result.disclaimer
        ? `${result.disclaimer} ${disclosure}`
        : disclosure,
    };
  }

  return result;
}

// 2. 전문가 상담 권고
export function shouldRecommendExpertConsultation(
  result: AnalysisResult,
  skinTone: string,
  confidence: number
): boolean {
  // 어두운 피부 + 낮은 신뢰도 → 전문가 상담 권고
  if (['V', 'VI'].includes(skinTone) && confidence < 70) {
    return true;
  }

  // 매우 낮은 신뢰도
  if (confidence < 50) {
    return true;
  }

  return false;
}
```

---

## 6. 모니터링 및 보고

### 6.1 편향 대시보드

```typescript
// lib/bias/monitoring.ts

export interface BiasMonitoringReport {
  period: { start: Date; end: Date };
  totalAnalyses: number;
  byGroup: GroupReport[];
  alerts: BiasAlert[];
}

export interface GroupReport {
  group: string;
  sampleSize: number;
  avgConfidence: number;
  typeDistribution: Record<string, number>;
  satisfactionScore?: number;
}

export interface BiasAlert {
  type: 'disparity' | 'sample_size' | 'confidence_gap';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export async function generateBiasReport(
  period: { start: Date; end: Date }
): Promise<BiasMonitoringReport> {
  // 분석 결과 조회
  const analyses = await getAnalysesForPeriod(period);

  // 그룹별 집계
  const byGroup = aggregateByGroup(analyses);

  // 알림 생성
  const alerts: BiasAlert[] = [];

  // 샘플 크기 불균형 확인
  const sampleSizes = byGroup.map(g => g.sampleSize);
  const maxSize = Math.max(...sampleSizes);
  const minSize = Math.min(...sampleSizes);

  if (maxSize > minSize * 5) {
    alerts.push({
      type: 'sample_size',
      severity: 'medium',
      description: '그룹 간 분석 건수 불균형이 심합니다.',
      recommendation: '소수 그룹의 데이터 수집을 강화하세요.',
    });
  }

  // 신뢰도 차이 확인
  const confidences = byGroup.map(g => g.avgConfidence);
  const confGap = Math.max(...confidences) - Math.min(...confidences);

  if (confGap > 15) {
    alerts.push({
      type: 'confidence_gap',
      severity: 'high',
      description: '그룹 간 신뢰도 차이가 15% 이상입니다.',
      recommendation: '낮은 신뢰도 그룹에 대한 모델 개선이 필요합니다.',
    });
  }

  return {
    period,
    totalAnalyses: analyses.length,
    byGroup,
    alerts,
  };
}
```

---

## 7. 구현 체크리스트

### P0 (Critical)

- [ ] 피부톤 감지 기능
- [ ] 기본 편향 테스트 스위트
- [ ] 불확실성 공개 메시지

### P1 (High)

- [ ] 피부톤별 보정 계수
- [ ] 편향 모니터링 대시보드
- [ ] 성별 편향 테스트

### P2 (Medium)

- [ ] 데이터 증강 파이프라인
- [ ] 정기 편향 보고서
- [ ] 사용자 피드백 수집

---

## 8. 참고 자료

- [FHIBE Dataset (Nature 2025)](https://www.nature.com/articles/s41586-025-09716-2)
- [AI-Face CVPR 2025](https://arxiv.org/html/2406.00783v3)
- [TrueSkin Dataset](https://arxiv.org/html/2509.10980v1)
- [Skin Color Bias in DL](https://www.sciencedirect.com/science/article/pii/S0169260724000403)
- [Monk Skin Tone Scale](https://skintone.google/)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (8/8)
