# AI-7: 설명 가능성 (Explainable AI)

> AI/ML 심화 7/8 - AI 분석 결과의 근거 설명 및 시각화

---

## 1. 연구 개요

### 1.1 XAI (Explainable AI)란?

XAI는 사용자가 AI/ML 알고리즘의 결과와 출력을 이해하고 신뢰할 수 있도록
하는 프로세스와 방법의 집합이다.

### 1.2 이룸에서의 중요성

| 측면 | 설명 |
|------|------|
| **신뢰 구축** | "왜 내 피부가 복합성인가?" 설명 |
| **교육적 가치** | 사용자가 자신의 피부/체형 이해 |
| **투명성** | AI가 무엇을 봤는지 시각화 |
| **개선 유도** | 어떻게 개선할 수 있는지 안내 |

### 1.3 XAI 시장 동향 (2025)

- 시장 규모: $9.77B (2025) → $20.74B (2029 예상)
- 주요 적용 분야: 헬스케어, 금융, 자율주행

---

## 2. XAI 기법 분류

### 2.1 분류 체계

```
┌─────────────────────────────────────────────────────────────┐
│                     XAI 기법 분류                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Attribution-based (귀인 기반)                              │
│   └── Grad-CAM, SHAP, LIME                                 │
│       → 어떤 입력이 결과에 영향을 미쳤는가?                  │
│                                                             │
│   Activation-based (활성화 기반)                            │
│   └── Feature Map Visualization                            │
│       → 모델 내부에서 무엇이 활성화되었는가?                 │
│                                                             │
│   Perturbation-based (교란 기반)                            │
│   └── RISE, Occlusion                                      │
│       → 입력을 바꾸면 결과가 어떻게 달라지는가?              │
│                                                             │
│   Attention-based (어텐션 기반)                             │
│   └── Vision Transformer Attention                         │
│       → 모델이 어디에 주목했는가?                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 이룸 적용 가능 기법

| 기법 | 적용 | 설명 |
|------|------|------|
| **텍스트 근거** | ✅ 적용 | AI가 관찰한 내용 기술 |
| **영역 하이라이트** | ✅ 적용 | 분석에 사용된 이미지 영역 표시 |
| **점수 분해** | ✅ 적용 | 종합 점수의 구성 요소 설명 |
| **비교 설명** | ✅ 적용 | 다른 유형과의 비교 |

---

## 3. 텍스트 기반 설명

### 3.1 분석 근거 생성

```typescript
// lib/xai/text-explanation.ts

export interface ExplanationPrompt {
  analysisType: string;
  result: AnalysisResult;
  detailLevel: 'brief' | 'detailed' | 'educational';
}

export const EXPLANATION_TEMPLATES = {
  skin: {
    brief: `
피부 분석 결과를 한 문장으로 요약해주세요.
결과: {{result}}
`,
    detailed: `
피부 분석 결과에 대한 상세 설명을 작성해주세요.

## 설명 포함 사항
1. 피부 타입 판단 근거 (관찰한 특징)
2. 각 점수의 의미
3. 주요 피부 고민의 원인
4. 개선 방향

결과: {{result}}
`,
    educational: `
사용자가 자신의 피부에 대해 배울 수 있도록 교육적인 설명을 작성해주세요.

## 포함 사항
1. 해당 피부 타입의 특성
2. 왜 이런 점수가 나왔는지 일반적인 원인
3. 피부 과학적 배경 (간단히)
4. 생활습관과의 연관성
5. 단계별 개선 가이드

결과: {{result}}
`,
  },
};

export async function generateExplanation(
  config: ExplanationPrompt
): Promise<string> {
  const template = EXPLANATION_TEMPLATES[config.analysisType]?.[config.detailLevel];
  if (!template) {
    throw new Error(`Template not found: ${config.analysisType}/${config.detailLevel}`);
  }

  const prompt = template.replace('{{result}}', JSON.stringify(config.result, null, 2));

  const response = await callGeminiAPI({
    prompt,
    model: 'gemini-2.0-flash',
  });

  return response.text;
}
```

### 3.2 구조화된 설명 생성

```typescript
// lib/xai/structured-explanation.ts

export interface StructuredExplanation {
  summary: string;           // 한 줄 요약
  mainFindings: Finding[];   // 주요 발견
  scoreBreakdown: ScoreExplanation[];  // 점수 분해
  comparisonNote?: string;   // 비교 설명
  recommendations: Recommendation[];  // 추천 사항
}

export interface Finding {
  area: string;              // 분석 영역
  observation: string;       // 관찰 내용
  confidence: number;        // 확신도
}

export interface ScoreExplanation {
  metric: string;
  score: number;
  meaning: string;           // 점수 의미
  factors: string[];         // 영향 요인
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

// 피부 분석 설명 생성
export function generateSkinExplanation(
  result: SkinAnalysisResult
): StructuredExplanation {
  const scoreDescriptions: Record<string, (score: number) => string> = {
    hydration: (s) =>
      s >= 70 ? '피부 수분이 충분합니다.' :
      s >= 50 ? '수분이 약간 부족합니다.' :
      '피부가 건조한 상태입니다.',
    oiliness: (s) =>
      s >= 70 ? '유분이 많은 편입니다.' :
      s >= 40 ? '유분 밸런스가 적절합니다.' :
      '유분이 부족합니다.',
    sensitivity: (s) =>
      s >= 60 ? '민감한 피부입니다. 자극에 주의가 필요합니다.' :
      s >= 30 ? '보통 수준의 민감도입니다.' :
      '피부가 튼튼한 편입니다.',
  };

  const skinTypeDescriptions: Record<string, string> = {
    건성: 'T존과 U존 모두 유분이 적고 수분이 부족한 상태입니다.',
    지성: 'T존과 U존 모두 유분이 많이 분비되는 상태입니다.',
    복합성: 'T존은 유분이 많고 U존은 건조한 복합적인 상태입니다.',
    민감성: '외부 자극에 쉽게 반응하는 민감한 상태입니다.',
    정상: '유수분 밸런스가 잘 맞는 건강한 상태입니다.',
  };

  return {
    summary: `당신의 피부는 ${result.skinType}입니다. ${skinTypeDescriptions[result.skinType]}`,

    mainFindings: [
      {
        area: 'T존',
        observation: result.observations?.tZone || '분석 중',
        confidence: result.confidence,
      },
      {
        area: 'U존',
        observation: result.observations?.uZone || '분석 중',
        confidence: result.confidence,
      },
    ],

    scoreBreakdown: Object.entries(result.scores).map(([metric, score]) => ({
      metric,
      score,
      meaning: scoreDescriptions[metric]?.(score) || `${metric}: ${score}점`,
      factors: getScoreFactors(metric, score),
    })),

    recommendations: generateRecommendations(result),
  };
}

function getScoreFactors(metric: string, score: number): string[] {
  const factors: Record<string, string[]> = {
    hydration: ['수분 섭취량', '보습제 사용', '환경 습도', '피부 장벽 상태'],
    oiliness: ['피지선 활동', '호르몬 상태', '스트레스', '식습관'],
    sensitivity: ['피부 장벽', '알레르기', '외부 자극 노출', '제품 성분'],
  };
  return factors[metric] || [];
}

function generateRecommendations(result: SkinAnalysisResult): Recommendation[] {
  const recs: Recommendation[] = [];

  if (result.scores.hydration < 50) {
    recs.push({
      priority: 'high',
      action: '수분 크림을 충분히 사용하세요',
      reason: '수분도가 낮아 피부 장벽이 약해질 수 있습니다.',
    });
  }

  if (result.scores.oiliness > 70) {
    recs.push({
      priority: 'medium',
      action: '유분 조절 제품을 사용해 보세요',
      reason: '과도한 유분이 모공을 막을 수 있습니다.',
    });
  }

  if (result.scores.sensitivity > 60) {
    recs.push({
      priority: 'high',
      action: '순한 성분의 제품을 선택하세요',
      reason: '민감한 피부에는 자극적인 성분이 해로울 수 있습니다.',
    });
  }

  return recs;
}
```

---

## 4. 시각적 설명

### 4.1 분석 영역 하이라이트

```tsx
// components/xai/AnalysisHighlight.tsx
'use client';

import { useEffect, useRef } from 'react';

interface AnalysisRegion {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  score: number;
  observation: string;
}

interface AnalysisHighlightProps {
  imageUrl: string;
  regions: AnalysisRegion[];
  selectedRegion?: string;
  onRegionClick?: (region: AnalysisRegion) => void;
}

export function AnalysisHighlight({
  imageUrl,
  regions,
  selectedRegion,
  onRegionClick,
}: AnalysisHighlightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 영역 오버레이
      regions.forEach((region) => {
        const isSelected = region.id === selectedRegion;
        const { x, y, width, height } = region.bounds;

        // 반투명 오버레이
        ctx.fillStyle = isSelected
          ? 'rgba(99, 102, 241, 0.3)'
          : 'rgba(99, 102, 241, 0.1)';
        ctx.fillRect(x, y, width, height);

        // 테두리
        ctx.strokeStyle = isSelected ? '#6366f1' : '#6366f1aa';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(x, y, width, height);

        // 라벨
        ctx.fillStyle = '#6366f1';
        ctx.font = '14px sans-serif';
        ctx.fillText(region.name, x + 4, y + 16);
      });
    };
    img.src = imageUrl;
  }, [imageUrl, regions, selectedRegion]);

  return (
    <div className="relative" data-testid="analysis-highlight">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto rounded-lg"
        onClick={(e) => {
          if (!onRegionClick) return;

          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const scaleX = canvasRef.current!.width / rect.width;
          const scaleY = canvasRef.current!.height / rect.height;

          const clicked = regions.find((r) => {
            const { x: rx, y: ry, width, height } = r.bounds;
            return (
              x * scaleX >= rx &&
              x * scaleX <= rx + width &&
              y * scaleY >= ry &&
              y * scaleY <= ry + height
            );
          });

          if (clicked) {
            onRegionClick(clicked);
          }
        }}
      />
    </div>
  );
}
```

### 4.2 점수 시각화

```tsx
// components/xai/ScoreVisualization.tsx
'use client';

import { ScoreExplanation } from '@/lib/xai/structured-explanation';

interface ScoreVisualizationProps {
  scores: ScoreExplanation[];
}

export function ScoreVisualization({ scores }: ScoreVisualizationProps) {
  return (
    <div className="space-y-4" data-testid="score-visualization">
      {scores.map((item) => (
        <div key={item.metric} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium capitalize">
              {getMetricLabel(item.metric)}
            </span>
            <span className={getScoreColor(item.score)}>
              {item.score}점
            </span>
          </div>

          {/* 점수 바 */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${getScoreBarColor(item.score)}`}
              style={{ width: `${item.score}%` }}
            />
            {/* 평균 마커 */}
            <div
              className="absolute top-0 w-0.5 h-full bg-gray-400"
              style={{ left: '50%' }}
              title="평균"
            />
          </div>

          {/* 설명 */}
          <p className="text-sm text-gray-600">{item.meaning}</p>

          {/* 영향 요인 */}
          <div className="flex flex-wrap gap-1">
            {item.factors.map((factor, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    hydration: '수분도',
    oiliness: '유분도',
    sensitivity: '민감도',
    poreVisibility: '모공 가시성',
    wrinkleDepth: '주름 깊이',
  };
  return labels[metric] || metric;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}
```

### 4.3 비교 차트

```tsx
// components/xai/ComparisonChart.tsx
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonChartProps {
  userScores: Record<string, number>;
  averageScores: Record<string, number>;
}

export function ComparisonChart({
  userScores,
  averageScores,
}: ComparisonChartProps) {
  const data = Object.keys(userScores).map((key) => ({
    metric: getMetricLabel(key),
    user: userScores[key],
    average: averageScores[key],
  }));

  return (
    <div className="w-full h-[300px]" data-testid="comparison-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />

          <Radar
            name="내 점수"
            dataKey="user"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Radar
            name="평균"
            dataKey="average"
            stroke="#9ca3af"
            fill="#9ca3af"
            fillOpacity={0.1}
          />

          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 5. 사용자 교육

### 5.1 인터랙티브 가이드

```tsx
// components/xai/EducationalGuide.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface GuideSection {
  title: string;
  content: string;
  tips?: string[];
}

interface EducationalGuideProps {
  topic: string;
  sections: GuideSection[];
}

export function EducationalGuide({ topic, sections }: EducationalGuideProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="bg-indigo-50 rounded-xl p-4" data-testid="educational-guide">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-indigo-900">{topic} 알아보기</h3>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              <span className="font-medium text-gray-900">{section.title}</span>
              {expandedIndex === index ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-gray-600 text-sm mb-3">{section.content}</p>
                {section.tips && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs text-indigo-700 font-medium mb-2">
                      실천 팁
                    </p>
                    <ul className="space-y-1">
                      {section.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-sm text-indigo-600 flex items-start gap-2"
                        >
                          <span className="text-indigo-400">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 피부 타입별 교육 콘텐츠

```typescript
// lib/xai/educational-content.ts

export const SKIN_TYPE_EDUCATION: Record<string, GuideSection[]> = {
  건성: [
    {
      title: '건성 피부란?',
      content: '피지 분비가 적어 피부가 당기고 건조함을 느끼기 쉬운 피부 타입입니다. 피부 장벽이 약해져 외부 자극에 민감해질 수 있습니다.',
      tips: [
        '세안 후 3분 이내에 보습제 바르기',
        '오일 베이스 클렌저 사용하기',
        '실내 습도 50-60% 유지하기',
      ],
    },
    {
      title: '왜 건성이 되나요?',
      content: '유전적 요인, 나이, 환경(건조한 기후, 난방), 잦은 세안, 부적절한 스킨케어 등이 원인이 될 수 있습니다.',
    },
    {
      title: '주의할 성분',
      content: '알코올, 강한 계면활성제, 레티놀(고농도)은 건조함을 악화시킬 수 있습니다.',
      tips: [
        '히알루론산, 세라마이드, 스쿠알란 성분 찾기',
        '폼 클렌저 대신 크림/밀크 클렌저 사용',
      ],
    },
  ],
  복합성: [
    {
      title: '복합성 피부란?',
      content: 'T존(이마, 코)은 유분이 많고 U존(볼, 턱)은 건조한 피부 타입입니다. 한국인에게 가장 흔한 피부 타입입니다.',
      tips: [
        'T존과 U존에 다른 제품 사용하기',
        'T존은 가볍게, U존은 풍부하게 보습',
      ],
    },
    {
      title: '계절별 관리',
      content: '여름에는 T존 유분 조절에, 겨울에는 U존 보습에 더 신경 쓰세요.',
    },
  ],
  // ... 다른 피부 타입
};
```

---

## 6. 구현 체크리스트

### P0 (Critical)

- [ ] 텍스트 기반 설명 생성
- [ ] 점수 분해 시각화
- [ ] 기본 추천 사항

### P1 (High)

- [ ] 분석 영역 하이라이트
- [ ] 비교 차트
- [ ] 교육 콘텐츠

### P2 (Medium)

- [ ] 상세/교육 모드 설명
- [ ] 인터랙티브 가이드
- [ ] 변화 추이 설명

---

## 7. 참고 자료

- [IBM XAI](https://www.ibm.com/think/topics/explainable-ai)
- [XAI in Computer Vision](https://www.mdpi.com/1424-8220/25/13/4166)
- [InterpretML](https://interpret.ml/)
- [DARPA XAI](https://www.darpa.mil/research/programs/explainable-artificial-intelligence)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (7/8)
