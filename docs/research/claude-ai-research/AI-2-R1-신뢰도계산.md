# AI-2: 분석 결과 신뢰도 계산

> AI/ML 심화 2/8 - AI 분석 결과의 신뢰도 및 불확실성 추정

---

## 1. 연구 개요

### 1.1 신뢰도(Confidence)란?

신뢰도 점수는 모델이 특정 예측에 대해 얼마나 확신하는지를 정량화하는 지표이다.
일반적으로 0~100%(또는 0~1) 범위로 표현되며, 모델의 마지막 레이어에서
Softmax(다중 클래스) 또는 Sigmoid(이진) 활성화 함수를 통해 도출된다.

### 1.2 이룸에서의 중요성

| 상황 | 신뢰도 활용 |
|------|------------|
| 저신뢰도 결과 | 사용자에게 재촬영 권고 |
| 중간 신뢰도 | 결과에 불확실성 표시 |
| 고신뢰도 | 확정적 결과 제공 |
| 의료 관련 | 전문가 상담 권고 |

---

## 2. 불확실성 유형

### 2.1 Aleatoric vs Epistemic

```typescript
// types/uncertainty.ts

export interface UncertaintyEstimate {
  // Aleatoric: 데이터 자체의 불확실성 (줄일 수 없음)
  aleatoric: number;

  // Epistemic: 모델 지식의 불확실성 (더 많은 학습으로 줄일 수 있음)
  epistemic: number;

  // 전체 불확실성
  total: number;
}

export interface ConfidenceResult {
  score: number;           // 0-100
  level: 'high' | 'medium' | 'low';
  uncertainty: UncertaintyEstimate;
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}
```

### 2.2 불확실성 원인

| 원인 | 유형 | 예시 |
|------|------|------|
| 이미지 품질 | Aleatoric | 흐린 사진, 부적절한 조명 |
| 비전형적 케이스 | Epistemic | 학습 데이터에 없는 패턴 |
| 모호한 경계 | Aleatoric | 복합성/지성 경계 피부 |
| 모델 한계 | Epistemic | 특정 피부색 학습 부족 |

---

## 3. 신뢰도 계산 방법

### 3.1 기본 신뢰도 (AI 응답 기반)

```typescript
// lib/analysis/confidence.ts

export interface AIResponse {
  prediction: string;
  rawConfidence?: number;  // AI가 직접 제공하는 경우
  reasoning?: string;
}

// 방법 1: AI가 직접 신뢰도 제공
export function extractAIConfidence(response: AIResponse): number {
  if (response.rawConfidence !== undefined) {
    return Math.min(100, Math.max(0, response.rawConfidence));
  }

  // AI가 명시적 신뢰도를 제공하지 않으면 추정
  return estimateConfidenceFromReasoning(response.reasoning || '');
}

// 방법 2: 응답 분석 기반 추정
function estimateConfidenceFromReasoning(reasoning: string): number {
  const hedgingWords = [
    '아마', '추정', '불확실', '어려운', '모호',
    'might', 'possibly', 'uncertain', 'unclear'
  ];

  const confidentWords = [
    '확실', '명확', '뚜렷', '분명',
    'clearly', 'definitely', 'certainly'
  ];

  let score = 70; // 기본값

  hedgingWords.forEach(word => {
    if (reasoning.toLowerCase().includes(word)) {
      score -= 5;
    }
  });

  confidentWords.forEach(word => {
    if (reasoning.toLowerCase().includes(word)) {
      score += 5;
    }
  });

  return Math.min(100, Math.max(30, score));
}
```

### 3.2 이미지 품질 기반 조정

```typescript
// lib/analysis/image-quality-confidence.ts

export interface ImageQualityMetrics {
  sharpness: number;      // 0-100
  brightness: number;     // 0-100
  contrast: number;       // 0-100
  faceDetected: boolean;
  faceRatio: number;      // 얼굴이 차지하는 비율
}

export function calculateQualityConfidenceAdjustment(
  metrics: ImageQualityMetrics
): number {
  // 각 요소별 가중치
  const weights = {
    sharpness: 0.3,
    brightness: 0.2,
    contrast: 0.15,
    faceDetected: 0.2,
    faceRatio: 0.15,
  };

  let adjustment = 0;

  // Sharpness 점수
  if (metrics.sharpness < 40) {
    adjustment -= (40 - metrics.sharpness) * weights.sharpness;
  }

  // Brightness (중간 범위가 최적)
  const optimalBrightness = 50;
  const brightnessDiff = Math.abs(metrics.brightness - optimalBrightness);
  if (brightnessDiff > 20) {
    adjustment -= (brightnessDiff - 20) * weights.brightness;
  }

  // Contrast
  if (metrics.contrast < 30) {
    adjustment -= (30 - metrics.contrast) * weights.contrast;
  }

  // Face detection
  if (!metrics.faceDetected) {
    adjustment -= 30;
  }

  // Face ratio (얼굴이 너무 작거나 너무 큰 경우)
  const optimalFaceRatio = 0.3; // 30%
  const ratioDiff = Math.abs(metrics.faceRatio - optimalFaceRatio);
  if (ratioDiff > 0.2) {
    adjustment -= ratioDiff * 100 * weights.faceRatio;
  }

  return Math.max(-30, Math.min(10, adjustment));
}
```

### 3.3 다중 요소 통합 신뢰도

```typescript
// lib/analysis/composite-confidence.ts

export interface ConfidenceFactors {
  aiConfidence: number;
  imageQuality: ImageQualityMetrics;
  consistencyScore?: number;  // 이전 분석과의 일관성
  responseCompleteness: number;
}

export function calculateCompositeConfidence(
  factors: ConfidenceFactors
): ConfidenceResult {
  // 1. 기본 AI 신뢰도
  let score = factors.aiConfidence;

  // 2. 이미지 품질 조정
  const qualityAdjustment = calculateQualityConfidenceAdjustment(
    factors.imageQuality
  );
  score += qualityAdjustment;

  // 3. 응답 완전성 조정
  if (factors.responseCompleteness < 0.8) {
    score -= (1 - factors.responseCompleteness) * 20;
  }

  // 4. 이전 분석과의 일관성 (있는 경우)
  if (factors.consistencyScore !== undefined) {
    if (factors.consistencyScore > 0.8) {
      score += 5;
    } else if (factors.consistencyScore < 0.5) {
      score -= 10;
    }
  }

  // 점수 범위 제한
  score = Math.min(100, Math.max(10, score));

  // 레벨 결정
  const level: 'high' | 'medium' | 'low' =
    score >= 80 ? 'high' :
    score >= 60 ? 'medium' : 'low';

  // 영향 요인 분석
  const confidenceFactors = analyzeFactors(factors, qualityAdjustment);

  return {
    score: Math.round(score),
    level,
    uncertainty: {
      aleatoric: estimateAleatoric(factors.imageQuality),
      epistemic: estimateEpistemic(factors.aiConfidence),
      total: 100 - score,
    },
    factors: confidenceFactors,
  };
}

function analyzeFactors(
  factors: ConfidenceFactors,
  qualityAdjustment: number
): ConfidenceFactor[] {
  const result: ConfidenceFactor[] = [];

  if (factors.imageQuality.sharpness < 40) {
    result.push({
      name: '이미지 선명도',
      impact: 'negative',
      weight: 0.3,
      description: '이미지가 흐릿합니다. 더 선명한 사진으로 재촬영을 권장합니다.',
    });
  }

  if (!factors.imageQuality.faceDetected) {
    result.push({
      name: '얼굴 감지',
      impact: 'negative',
      weight: 0.3,
      description: '얼굴이 제대로 감지되지 않았습니다.',
    });
  }

  if (factors.aiConfidence > 80) {
    result.push({
      name: 'AI 분석 확신도',
      impact: 'positive',
      weight: 0.4,
      description: 'AI가 분석 결과에 높은 확신을 가지고 있습니다.',
    });
  }

  return result;
}
```

---

## 4. 불확실성 정량화

### 4.1 Monte Carlo Dropout

```typescript
// 여러 번의 추론으로 불확실성 추정
// (서버 사이드에서 직접 모델 접근 시 사용)

export async function estimateUncertaintyMC(
  analyzeFunc: () => Promise<number[]>,
  numSamples: number = 10
): Promise<{
  mean: number[];
  variance: number[];
  confidence: number;
}> {
  const samples: number[][] = [];

  for (let i = 0; i < numSamples; i++) {
    const result = await analyzeFunc();
    samples.push(result);
  }

  const mean = calculateMean(samples);
  const variance = calculateVariance(samples, mean);

  // 분산이 낮을수록 신뢰도 높음
  const avgVariance = variance.reduce((a, b) => a + b) / variance.length;
  const confidence = Math.max(0, 100 - avgVariance * 100);

  return { mean, variance, confidence };
}
```

### 4.2 앙상블 기반 불확실성

```typescript
// 여러 분석 결과의 불일치로 불확실성 추정

export interface EnsembleResult {
  individual: AnalysisResult[];
  consensus: AnalysisResult;
  disagreement: number;
  confidence: number;
}

export function calculateEnsembleConfidence(
  results: AnalysisResult[]
): EnsembleResult {
  if (results.length < 2) {
    return {
      individual: results,
      consensus: results[0],
      disagreement: 0,
      confidence: results[0]?.confidence || 50,
    };
  }

  // 결과 간 불일치 계산
  const skinTypes = results.map(r => r.skinType);
  const uniqueTypes = [...new Set(skinTypes)];
  const disagreement = (uniqueTypes.length - 1) / (results.length - 1);

  // 합의 결과 (다수결)
  const typeCounts = skinTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const consensusType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  // 불일치가 높을수록 신뢰도 낮음
  const confidence = Math.max(30, 100 - disagreement * 50);

  return {
    individual: results,
    consensus: {
      ...results[0],
      skinType: consensusType,
      confidence,
    },
    disagreement,
    confidence,
  };
}
```

---

## 5. 사용자 커뮤니케이션

### 5.1 신뢰도 표시 UI

```tsx
// components/analysis/ConfidenceIndicator.tsx
'use client';

import { ConfidenceResult } from '@/lib/analysis/confidence';

interface ConfidenceIndicatorProps {
  confidence: ConfidenceResult;
  showDetails?: boolean;
}

export function ConfidenceIndicator({
  confidence,
  showDetails = false
}: ConfidenceIndicatorProps) {
  const levelConfig = {
    high: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: '✓',
      label: '높은 신뢰도',
      description: '분석 결과를 신뢰할 수 있습니다.',
    },
    medium: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      icon: '~',
      label: '보통 신뢰도',
      description: '결과에 일부 불확실성이 있을 수 있습니다.',
    },
    low: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: '!',
      label: '낮은 신뢰도',
      description: '이미지를 재촬영하거나 전문가 상담을 권장합니다.',
    },
  };

  const config = levelConfig[confidence.level];

  return (
    <div
      className={`rounded-lg p-4 ${config.bg}`}
      data-testid="confidence-indicator"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl ${config.color}`}>{config.icon}</span>
        <span className={`font-medium ${config.color}`}>
          {config.label} ({confidence.score}%)
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {config.description}
      </p>

      {showDetails && confidence.factors.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">영향 요인:</p>
          <ul className="space-y-1">
            {confidence.factors.map((factor, i) => (
              <li
                key={i}
                className={`text-xs ${
                  factor.impact === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {factor.impact === 'positive' ? '+' : '-'} {factor.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 5.2 저신뢰도 대응

```tsx
// components/analysis/LowConfidenceWarning.tsx
'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, MessageCircle } from 'lucide-react';

interface LowConfidenceWarningProps {
  confidence: number;
  onRetake: () => void;
  onConsult: () => void;
}

export function LowConfidenceWarning({
  confidence,
  onRetake,
  onConsult
}: LowConfidenceWarningProps) {
  if (confidence > 60) return null;

  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-lg p-4"
      data-testid="low-confidence-warning"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 mb-1">
            분석 신뢰도가 낮습니다
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            이미지 품질이나 촬영 조건으로 인해 정확한 분석이 어려울 수 있습니다.
            더 정확한 결과를 위해 다음 중 하나를 선택해 주세요.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetake}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              다시 촬영
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onConsult}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              AI 코치 상담
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. 보정(Calibration)

### 6.1 보정 메트릭

```typescript
// lib/analysis/calibration.ts

// 보정 오차: 신뢰도와 실제 정확도 간의 차이
export function calculateCalibrationError(
  predictions: Array<{
    confidence: number;
    wasCorrect: boolean;
  }>,
  numBins: number = 10
): {
  ece: number;  // Expected Calibration Error
  mce: number;  // Maximum Calibration Error
  bins: CalibrationBin[];
} {
  const bins: CalibrationBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const lower = i / numBins;
    const upper = (i + 1) / numBins;

    const binPredictions = predictions.filter(
      p => p.confidence >= lower && p.confidence < upper
    );

    if (binPredictions.length === 0) continue;

    const avgConfidence = average(binPredictions.map(p => p.confidence));
    const accuracy = binPredictions.filter(p => p.wasCorrect).length /
                     binPredictions.length;

    bins.push({
      range: [lower, upper],
      avgConfidence,
      accuracy,
      count: binPredictions.length,
      error: Math.abs(avgConfidence - accuracy),
    });
  }

  const ece = bins.reduce((sum, bin) =>
    sum + (bin.count / predictions.length) * bin.error, 0
  );

  const mce = Math.max(...bins.map(b => b.error));

  return { ece, mce, bins };
}

interface CalibrationBin {
  range: [number, number];
  avgConfidence: number;
  accuracy: number;
  count: number;
  error: number;
}
```

### 6.2 온도 스케일링

```typescript
// 과신(over-confidence) 보정

export function applyTemperatureScaling(
  confidence: number,
  temperature: number = 1.5
): number {
  // temperature > 1: 확률 분포를 평탄화 (과신 완화)
  // temperature < 1: 확률 분포를 뾰족하게 (과소신뢰 완화)

  // logit 변환
  const logit = Math.log(confidence / (1 - confidence));

  // 온도 적용
  const scaledLogit = logit / temperature;

  // sigmoid로 복원
  const scaledConfidence = 1 / (1 + Math.exp(-scaledLogit));

  return scaledConfidence;
}
```

---

## 7. 구현 체크리스트

### P0 (Critical)

- [ ] 기본 신뢰도 점수 표시
- [ ] 이미지 품질 기반 조정
- [ ] 저신뢰도 경고 UI

### P1 (High)

- [ ] 다중 요소 통합 신뢰도
- [ ] 신뢰도 레벨 (high/medium/low)
- [ ] 영향 요인 설명

### P2 (Medium)

- [ ] 보정 메트릭 모니터링
- [ ] 온도 스케일링 적용
- [ ] 사용자 피드백 수집

---

## 8. 참고 자료

- [Ultralytics Confidence Score](https://www.ultralytics.com/glossary/confidence)
- [IBM Uncertainty Quantification](https://www.ibm.com/think/topics/uncertainty-quantification)
- [Mindee Confidence Scores Guide](https://www.mindee.com/blog/how-use-confidence-scores-ml-models)
- [iMerit Uncertainty in ML](https://imerit.net/blog/a-comprehensive-introduction-to-uncertainty-in-machine-learning-all-una/)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (2/8)
