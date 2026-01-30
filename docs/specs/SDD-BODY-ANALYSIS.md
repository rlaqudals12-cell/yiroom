# SDD: 체형 분석 (Body Shape Analysis)

> **Status**: 📋 Planned
> **Version**: 1.1
> **Created**: 2026-01-21
> **Updated**: 2026-01-28

> 전신 이미지 기반 체형 분류 및 스타일 추천 시스템

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"전신 이미지 한 장으로 사용자의 체형을 정확히 분류하고, 최적의 스타일링/운동 추천을 제공하는 AI 체형 분석 시스템"

- 5가지 체형 분류 정확도 95%+
- 어깨/허리/힙 비율 측정 오차 ±3% 이내
- Size Korea 표준 기반 한국인 특화 정규화
- 체형별 스타일링/운동 추천이 사용자 만족도 90%+ 달성

### 물리적 한계

| 한계 | 이유 | 완화 전략 |
|------|------|----------|
| 카메라 각도 | 정면 아닌 촬영 시 왜곡 | 촬영 가이드 제공 |
| 의복 영향 | 타이트하지 않은 옷 착용 시 | 피팅 의류 권장 안내 |
| 조명 조건 | 그림자로 실루엣 왜곡 | CIE-4 조명 분석 연동 |
| 2D 한계 | 3D 체형을 2D로 추정 | 복수 각도 촬영 옵션 |

### 100점 기준

| 항목 | 100점 기준 | 현재 |
|------|-----------|------|
| 체형 분류 정확도 | 95% | 📋 계획 |
| 비율 측정 정확도 | ±3% | 📋 계획 |
| 스타일 추천 만족도 | 90% | 📋 계획 |
| 운동 추천 적합성 | 85% | 📋 계획 |
| 한국인 정규화 | Size Korea 통합 | 📋 계획 |

### 현재 목표: 0% (계획 단계)

**종합 달성률**: **0%** (설계 완료, 구현 대기)

| 기능 | 달성률 | 상태 |
|------|--------|------|
| 전신 실루엣 추출 | 0% | 📋 계획 |
| 비율 측정 알고리즘 | 0% | 📋 계획 |
| 5-Type 분류 | 0% | 📋 계획 |
| AI 체형 분석 | 0% | 📋 계획 |
| 스타일/운동 추천 | 0% | 📋 계획 |

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 3D 체형 스캔 | 특수 장비 필요 | 향후 기술 발전 시 |
| 체중/체지방 추정 | 정확도 보장 어려움 | 웨어러블 연동 시 |
| 실시간 체형 변화 추적 | 복잡도/비용 | Phase 3 |

---

## 1. 개요

### 1.1 목적

- **체형 자동 분류**: 전신 이미지에서 5가지 체형 유형 자동 판별
- **비율 측정**: 어깨/허리/힙 비율 및 상하체 비율 정량화
- **개인화 추천**: 체형별 맞춤 스타일링 및 운동 추천 제공
- **한국인 특화**: Size Korea 표준 기반 정규화 및 백분위 산출

### 1.2 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| 전신 실루엣 추출 | 필수 | 중간 | 📋 계획 |
| 어깨/허리/힙 비율 측정 | 필수 | 중간 | 📋 계획 |
| 5가지 체형 분류 알고리즘 | 필수 | 높음 | 📋 계획 |
| AI 기반 체형 분석 (Gemini) | 필수 | 높음 | 📋 계획 |
| 체형별 스타일 추천 | 높음 | 중간 | 📋 계획 |
| 체형별 운동 추천 | 높음 | 중간 | 📋 계획 |
| 한국인 표준 정규화 | 높음 | 낮음 | 📋 계획 |
| 3D 체형 시뮬레이션 | 낮음 | 높음 | ⏳ 향후 |

### 1.3 관련 문서

- [원리: 체형 역학](../principles/body-mechanics.md)
- [원리: 이미지 처리](../principles/image-processing.md)
- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md)
- [ADR-003: AI 모델 선택](../adr/ADR-003-ai-model-selection.md)
- *(이 문서가 C-1 체형분석 스펙입니다)*

---

## 2. 체형 분석 이론

### 2.1 체형 분류 체계

```
┌─────────────────────────────────────────────────────────────┐
│                    5가지 체형 분류 체계                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼           ◆           ▭           ⌛           ●        │
│ 삼각형     역삼각형     직사각형    모래시계형     원형        │
│ (Pear)   (Inverted   (Rectangle) (Hourglass)   (Apple)     │
│           Triangle)                                          │
│                                                              │
│  힙>어깨    어깨>힙    어깨≈허리≈힙   어깨≈힙     허리≥어깨    │
│                                   허리 잘록    허리≥힙       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 체형별 특성

| 체형 | 한글명 | 어깨:허리:힙 비율 | 특징 |
|------|--------|------------------|------|
| **Pear** | 삼각형/배형 | 1 : 0.7 : 1.2+ | 하체가 상체보다 넓음 |
| **Inverted Triangle** | 역삼각형 | 1.2+ : 0.9 : 1 | 어깨가 힙보다 넓음 |
| **Rectangle** | 직사각형 | 1 : 0.9+ : 1 | 전체적으로 비슷한 너비 |
| **Hourglass** | 모래시계형 | 1 : 0.7 : 1 | 어깨≈힙, 허리 잘록 |
| **Apple** | 사과형/원형 | 1 : 1+ : 0.9 | 허리가 가장 넓음 |

### 2.3 실루엣 분석 지점

```
┌─────────────────────────────────────────────────────────────┐
│                    측정 기준점 (Landmarks)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        ○ 머리                                │
│                        │                                     │
│               ┌────────┼────────┐                            │
│               │        │        │  ← 어깨선 (Shoulder)       │
│               │        │        │    [11, 12] MediaPipe      │
│               │        │        │                            │
│               └────────┼────────┘                            │
│                    ┌───┼───┐      ← 허리선 (Waist)           │
│                    │   │   │        어깨-힙 중간 60% 지점     │
│                    └───┼───┘                                 │
│               ┌────────┼────────┐                            │
│               │        │        │  ← 힙선 (Hip)              │
│               │        │        │    [23, 24] MediaPipe      │
│               └────────┼────────┘                            │
│                   │         │                                │
│                   │         │      ← 다리 (Legs)             │
│                   │         │        [25-28] MediaPipe       │
│                   ▼         ▼                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 상/하체 비율 측정

```
상체 길이 = 어깨 중점 → 힙 중점
하체 길이 = 힙 중점 → 발목 중점

상하체 비율 = 하체 길이 / 상체 길이

한국인 평균:
- 남성: 1.05 ~ 1.15
- 여성: 1.00 ~ 1.10

서양인 평균:
- 남성: 1.10 ~ 1.20
- 여성: 1.05 ~ 1.15
```

---

## 3. 알고리즘 상세

### 3.1 핵심 비율 계산

```typescript
/**
 * 체형 분석 핵심 비율 계산
 *
 * 원리: 어깨, 허리, 힙 너비의 상대적 비율로 체형 분류
 * MediaPipe Pose 랜드마크 기반
 */
interface BodyMeasurements {
  shoulderWidth: number;  // 어깨 너비 (11-12 거리)
  waistWidth: number;     // 허리 너비 (추정값)
  hipWidth: number;       // 힙 너비 (23-24 거리)
  upperBodyLength: number; // 상체 길이
  lowerBodyLength: number; // 하체 길이
  totalHeight: number;     // 전체 높이
}

interface BodyRatios {
  shr: number;            // Shoulder-to-Hip Ratio
  whr: number;            // Waist-to-Hip Ratio
  whtr: number;           // Waist-to-Height Ratio
  upperLowerRatio: number; // 상하체 비율
}

function calculateBodyMeasurements(
  landmarks: MediaPipeLandmark[]
): BodyMeasurements {
  // 어깨 너비: 좌우 어깨 랜드마크 거리
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const shoulderWidth = euclideanDistance(leftShoulder, rightShoulder);

  // 힙 너비: 좌우 힙 랜드마크 거리
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const hipWidth = euclideanDistance(leftHip, rightHip);

  // 허리 너비: 힙 너비의 80% 추정 (MediaPipe에 허리 랜드마크 없음)
  const waistWidth = hipWidth * 0.8;

  // 어깨 중점
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };

  // 힙 중점
  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };

  // 상체 길이
  const upperBodyLength = euclideanDistance(shoulderMidpoint, hipMidpoint);

  // 하체 길이: 힙 → 무릎 → 발목
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const hipToKnee = euclideanDistance(leftHip, leftKnee);
  const kneeToAnkle = euclideanDistance(leftKnee, leftAnkle);
  const lowerBodyLength = hipToKnee + kneeToAnkle;

  // 전체 높이 (코에서 발목까지 + 머리 보정)
  const nose = landmarks[0];
  const totalHeight = euclideanDistance(nose, leftAnkle) * 1.1; // 머리 10% 보정

  return {
    shoulderWidth,
    waistWidth,
    hipWidth,
    upperBodyLength,
    lowerBodyLength,
    totalHeight,
  };
}

function calculateBodyRatios(measurements: BodyMeasurements): BodyRatios {
  return {
    shr: measurements.shoulderWidth / measurements.hipWidth,
    whr: measurements.waistWidth / measurements.hipWidth,
    whtr: measurements.waistWidth / measurements.totalHeight,
    upperLowerRatio: measurements.lowerBodyLength / measurements.upperBodyLength,
  };
}

function euclideanDistance(a: Point3D, b: Point3D): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}
```

### 3.2 체형 분류 알고리즘

```typescript
/**
 * 5가지 체형 분류 알고리즘
 *
 * 기반 연구: 과일형 체형 분류 (Fruit-based Body Shape Classification)
 * 한국인 특화: Size Korea 8차 조사 데이터 반영
 */
type BodyShapeType =
  | 'pear'             // 삼각형/배형
  | 'invertedTriangle' // 역삼각형
  | 'rectangle'        // 직사각형
  | 'hourglass'        // 모래시계형
  | 'apple';           // 사과형/원형

interface BodyShapeResult {
  type: BodyShapeType;
  koreanName: string;
  confidence: number;    // 0-1
  ratios: BodyRatios;
  measurements: BodyMeasurements;
  alternativeTypes: Array<{ type: BodyShapeType; confidence: number }>;
}

function classifyBodyShape(
  ratios: BodyRatios,
  gender: 'male' | 'female'
): BodyShapeResult {
  const { shr, whr } = ratios;
  const scores: Record<BodyShapeType, number> = {
    pear: 0,
    invertedTriangle: 0,
    rectangle: 0,
    hourglass: 0,
    apple: 0,
  };

  if (gender === 'female') {
    // 여성 체형 분류 기준
    scores.hourglass = calculateHourglassScore(shr, whr);
    scores.pear = calculatePearScore(shr, whr);
    scores.invertedTriangle = calculateInvertedTriangleScore(shr, whr);
    scores.apple = calculateAppleScore(shr, whr);
    scores.rectangle = calculateRectangleScore(shr, whr);
  } else {
    // 남성 체형 분류 기준
    scores.invertedTriangle = shr > 1.2 ? 90 : shr > 1.1 ? 70 : 40;
    scores.rectangle = Math.abs(shr - 1.0) < 0.1 ? 80 : 50;
    scores.pear = shr < 0.9 ? 85 : 30;
    scores.apple = whr > 0.9 ? 85 : 40;
    scores.hourglass = 20; // 남성에게는 드문 체형
  }

  // 최고 점수 체형 선택
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([type, score]) => ({
      type: type as BodyShapeType,
      confidence: score / 100,
    }));

  const primary = sortedTypes[0];

  return {
    type: primary.type,
    koreanName: getKoreanBodyShapeName(primary.type),
    confidence: primary.confidence,
    ratios,
    measurements: {} as BodyMeasurements, // 호출 시 채워짐
    alternativeTypes: sortedTypes.slice(1, 3),
  };
}

function calculateHourglassScore(shr: number, whr: number): number {
  // 모래시계: 어깨≈힙 (shr≈1.0), 허리 잘록 (whr<0.75)
  const shrScore = shr >= 0.95 && shr <= 1.05 ? 40 : 20;
  const whrScore = whr <= 0.75 ? 50 : whr <= 0.8 ? 35 : 15;
  return shrScore + whrScore;
}

function calculatePearScore(shr: number, whr: number): number {
  // 배형: 힙>어깨 (shr<0.9)
  if (shr < 0.85) return 90;
  if (shr < 0.9) return 75;
  if (shr < 0.95) return 50;
  return 20;
}

function calculateInvertedTriangleScore(shr: number, whr: number): number {
  // 역삼각형: 어깨>힙 (shr>1.1)
  if (shr > 1.2) return 90;
  if (shr > 1.1) return 75;
  if (shr > 1.05) return 50;
  return 20;
}

function calculateAppleScore(shr: number, whr: number): number {
  // 사과형: 허리≥어깨 또는 허리≥힙 (whr≥0.9)
  if (whr >= 0.95) return 90;
  if (whr >= 0.9) return 75;
  if (whr >= 0.85) return 50;
  return 20;
}

function calculateRectangleScore(shr: number, whr: number): number {
  // 직사각형: 전체 비슷 (shr≈1.0, whr>0.8)
  const shrScore = Math.abs(shr - 1.0) < 0.1 ? 45 : 25;
  const whrScore = whr > 0.8 ? 45 : 25;
  return shrScore + whrScore;
}

function getKoreanBodyShapeName(type: BodyShapeType): string {
  const names: Record<BodyShapeType, string> = {
    pear: '삼각형(배형)',
    invertedTriangle: '역삼각형',
    rectangle: '직사각형',
    hourglass: '모래시계형',
    apple: '사과형(원형)',
  };
  return names[type];
}
```

### 3.3 AI 기반 체형 분석 (Gemini 연동)

```typescript
/**
 * Gemini VLM 기반 체형 분석
 *
 * MediaPipe 결과와 교차 검증하여 신뢰도 향상
 */
interface AIBodyAnalysisInput {
  imageBase64: string;
  mediaPipeResult: BodyShapeResult;
  gender: 'male' | 'female';
  ageGroup: '20s' | '30s' | '40s' | '50s';
}

interface AIBodyAnalysisOutput {
  bodyShape: BodyShapeType;
  confidence: number;
  silhouetteDescription: string;
  proportionAnalysis: {
    upperBody: string;
    lowerBody: string;
    waistline: string;
  };
  recommendations: {
    styling: string[];
    exercise: string[];
  };
}

async function analyzeBodyWithAI(
  input: AIBodyAnalysisInput
): Promise<AIBodyAnalysisOutput> {
  const prompt = `
당신은 체형 분석 전문가입니다. 이미지를 분석하여 체형을 분류해주세요.

## 분석 대상
- 성별: ${input.gender === 'male' ? '남성' : '여성'}
- 연령대: ${input.ageGroup}

## 체형 분류 기준
1. 삼각형(배형): 힙이 어깨보다 넓음
2. 역삼각형: 어깨가 힙보다 넓음
3. 직사각형: 어깨, 허리, 힙이 비슷함
4. 모래시계형: 어깨와 힙이 비슷하고 허리가 잘록함
5. 사과형(원형): 허리가 가장 넓음

## MediaPipe 분석 결과 (참고)
- 예측 체형: ${input.mediaPipeResult.koreanName}
- 신뢰도: ${(input.mediaPipeResult.confidence * 100).toFixed(1)}%
- SHR (어깨/힙): ${input.mediaPipeResult.ratios.shr.toFixed(2)}
- WHR (허리/힙): ${input.mediaPipeResult.ratios.whr.toFixed(2)}

## 응답 형식 (JSON)
{
  "bodyShape": "pear|invertedTriangle|rectangle|hourglass|apple",
  "confidence": 0.0-1.0,
  "silhouetteDescription": "전체 실루엣 설명",
  "proportionAnalysis": {
    "upperBody": "상체 비율 분석",
    "lowerBody": "하체 비율 분석",
    "waistline": "허리라인 분석"
  },
  "recommendations": {
    "styling": ["스타일 추천 1", "스타일 추천 2"],
    "exercise": ["운동 추천 1", "운동 추천 2"]
  }
}
`;

  const response = await generateWithGemini(prompt, input.imageBase64);
  return JSON.parse(response);
}
```

---

## 4. 입력/출력 스펙

### 4.1 입력 인터페이스

```typescript
export interface BodyAnalysisInput {
  // 필수
  imageBase64: string;              // Base64 인코딩된 전신 이미지

  // 선택
  gender?: 'male' | 'female';       // 성별 (자동 감지 가능)
  ageGroup?: '20s' | '30s' | '40s' | '50s'; // 연령대
  heightCm?: number;                // 실제 신장 (정확도 향상)
  weightKg?: number;                // 실제 체중 (BMI 계산)

  // 옵션
  options?: {
    includeRecommendations?: boolean; // 추천 포함 여부 (기본: true)
    useAIAnalysis?: boolean;          // AI 분석 사용 여부 (기본: true)
    normalizeToKorean?: boolean;      // 한국인 표준 정규화 (기본: true)
  };
}
```

### 4.2 출력 인터페이스

```typescript
export interface BodyAnalysisOutput {
  success: boolean;

  // 체형 분류 결과
  bodyShape: {
    type: BodyShapeType;
    koreanName: string;
    confidence: number;             // 0-1
    description: string;            // 체형 설명
    alternativeTypes: Array<{
      type: BodyShapeType;
      confidence: number;
    }>;
  };

  // 측정 결과
  measurements: {
    shoulderWidth: number;          // 정규화된 어깨 너비
    waistWidth: number;             // 정규화된 허리 너비
    hipWidth: number;               // 정규화된 힙 너비
    upperBodyLength: number;
    lowerBodyLength: number;
  };

  // 비율 결과
  ratios: {
    shr: number;                    // Shoulder-to-Hip Ratio
    whr: number;                    // Waist-to-Hip Ratio
    whtr: number;                   // Waist-to-Height Ratio
    upperLowerRatio: number;        // 상하체 비율
  };

  // 한국인 기준 백분위 (옵션)
  koreanPercentile?: {
    shoulderWidth: number;          // 0-100
    waistWidth: number;
    hipWidth: number;
    overallBalance: number;
  };

  // 추천 (옵션)
  recommendations?: {
    styling: StylingRecommendation[];
    exercise: ExerciseRecommendation[];
  };

  // 메타데이터
  metadata: {
    analysisMethod: 'mediapipe' | 'ai' | 'hybrid';
    processingTime: number;         // ms
    landmarkConfidence: number;     // MediaPipe 랜드마크 신뢰도
  };
}

interface StylingRecommendation {
  category: 'top' | 'bottom' | 'dress' | 'accessory';
  recommendation: string;
  reason: string;
  avoidItems: string[];
}

interface ExerciseRecommendation {
  category: 'strength' | 'cardio' | 'flexibility';
  exercise: string;
  targetArea: string;
  reason: string;
}
```

---

## 5. 체형별 스타일 추천

### 5.1 추천 매핑 테이블

| 체형 | 권장 스타일 | 피해야 할 스타일 | 핵심 포인트 |
|------|------------|-----------------|------------|
| **삼각형** | 러플/장식 상의, 밝은 상의, 다크 하의 | 타이트 스키니진, 힙 강조 패턴 | 상체 볼륨 강조 |
| **역삼각형** | V넥, 와이드팬츠, 밝은 하의 | 어깨패드, 보트넥, 퍼프소매 | 하체 볼륨 강조 |
| **직사각형** | 페플럼, 벨트 드레스, 레이어링 | 박시 원피스, 직선 실루엣 | 허리라인 강조 |
| **모래시계** | 바디콘, 랩 드레스, 벨트 강조 | 박시 실루엣, 오버사이즈 | 곡선 살리기 |
| **사과형** | V넥, 하이웨이스트, A라인 | 타이트 상의, 벨트 강조 | 허리 커버 |

### 5.2 추천 생성 함수

```typescript
function generateStylingRecommendations(
  bodyShape: BodyShapeType,
  gender: 'male' | 'female'
): StylingRecommendation[] {
  const STYLE_DB: Record<BodyShapeType, Record<'male' | 'female', StylingRecommendation[]>> = {
    pear: {
      female: [
        {
          category: 'top',
          recommendation: '러플 블라우스, 보트넥 상의',
          reason: '상체에 볼륨을 더해 균형 잡힌 실루엣 연출',
          avoidItems: ['민소매', '타이트 상의'],
        },
        {
          category: 'bottom',
          recommendation: '다크 컬러 와이드팬츠, A라인 스커트',
          reason: '하체 라인을 자연스럽게 커버',
          avoidItems: ['스키니진', '밝은 색 하의', '패턴 하의'],
        },
      ],
      male: [
        {
          category: 'top',
          recommendation: '스트럭처드 재킷, 어깨 강조 아우터',
          reason: '어깨 라인을 강조하여 역삼각형 실루엣 연출',
          avoidItems: ['드롭숄더', '오버핏 상의'],
        },
        {
          category: 'bottom',
          recommendation: '스트레이트 팬츠, 다크 데님',
          reason: '하체 볼륨 완화',
          avoidItems: ['카고팬츠', '와이드팬츠'],
        },
      ],
    },
    // ... 다른 체형에 대한 추천
    invertedTriangle: { /* ... */ },
    rectangle: { /* ... */ },
    hourglass: { /* ... */ },
    apple: { /* ... */ },
  };

  return STYLE_DB[bodyShape][gender] || [];
}
```

---

## 6. 에러 케이스 및 대응

### 6.1 에러 분류

| 에러 코드 | 상황 | 대응 |
|----------|------|------|
| `BODY_INVALID_IMAGE` | 이미지 형식 오류 | 지원 형식 안내 |
| `BODY_NO_PERSON` | 사람 감지 실패 | 전신 촬영 가이드 제공 |
| `BODY_PARTIAL_BODY` | 전신 미포함 | 전신 프레이밍 요청 |
| `BODY_LOW_LANDMARK_CONF` | 랜드마크 신뢰도 낮음 | 재촬영 또는 Mock 결과 |
| `BODY_AI_TIMEOUT` | AI 분석 타임아웃 | MediaPipe 결과만 반환 |
| `BODY_CLASSIFICATION_FAIL` | 체형 분류 실패 | 직사각형(기본값) 반환 |

### 6.2 폴백 전략

```typescript
/**
 * 3단계 폴백 전략
 *
 * Level 1: AI + MediaPipe 하이브리드 (최고 정확도)
 * Level 2: MediaPipe 단독 (AI 실패 시)
 * Level 3: Mock 데이터 (전체 실패 시)
 */
async function analyzeBodyWithFallback(
  input: BodyAnalysisInput
): Promise<BodyAnalysisOutput> {
  const startTime = Date.now();

  try {
    // Level 1: 하이브리드 분석
    const mediaPipeResult = await analyzeWithMediaPipe(input.imageBase64);

    if (mediaPipeResult.confidence < 0.5) {
      throw new Error('BODY_LOW_LANDMARK_CONF');
    }

    if (input.options?.useAIAnalysis !== false) {
      try {
        const aiResult = await analyzeBodyWithAI({
          imageBase64: input.imageBase64,
          mediaPipeResult,
          gender: input.gender || 'female',
          ageGroup: input.ageGroup || '30s',
        });

        return mergeResults(mediaPipeResult, aiResult, startTime);
      } catch (aiError) {
        console.warn('[BODY] AI 분석 실패, MediaPipe 결과 사용:', aiError);
      }
    }

    // Level 2: MediaPipe 단독
    return formatMediaPipeResult(mediaPipeResult, startTime);

  } catch (error) {
    console.error('[BODY] 분석 실패, Mock 데이터 반환:', error);

    // Level 3: Mock 데이터
    return generateMockBodyAnalysis(input.gender || 'female', startTime);
  }
}
```

### 6.3 유효성 검증

```typescript
function validateBodyImage(imageData: ImageData): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 1. 해상도 검증
  if (imageData.width < 480 || imageData.height < 640) {
    issues.push('최소 480x640 해상도 필요');
  }

  // 2. 세로 방향 검증 (전신 촬영 권장)
  if (imageData.width > imageData.height) {
    issues.push('세로 방향 촬영 권장');
  }

  // 3. 사람 감지 (MediaPipe 선행 확인)
  // 별도 함수에서 처리

  return {
    valid: issues.length === 0,
    issues,
  };
}
```

---

## 7. P3 원자 분해

| ID | 원자명 | 소요시간 | 입력 | 출력 | 의존성 |
|----|--------|----------|------|------|--------|
| **BODY-1** | 이미지 전처리 및 검증 | 2h | imageBase64 | ValidatedImage | - |
| **BODY-2** | MediaPipe Pose 랜드마크 추출 | 3h | ValidatedImage | Landmarks[] | BODY-1 |
| **BODY-3** | 체형 측정값 계산 | 2h | Landmarks[] | BodyMeasurements | BODY-2 |
| **BODY-4** | 체형 비율 계산 | 1h | BodyMeasurements | BodyRatios | BODY-3 |
| **BODY-5** | 체형 분류 알고리즘 | 3h | BodyRatios, gender | BodyShapeType | BODY-4 |
| **BODY-6** | AI 체형 분석 (Gemini) | 4h | imageBase64, MediaPipeResult | AIAnalysisResult | BODY-5 |
| **BODY-7** | 한국인 표준 정규화 | 2h | Measurements, gender, age | KoreanPercentile | BODY-3 |
| **BODY-8** | 체형별 추천 생성 | 2h | BodyShapeType, gender | Recommendations | BODY-5 |

### 7.1 의존성 그래프

```
BODY-1 (이미지 검증)
   ↓
BODY-2 (랜드마크 추출)
   ↓
BODY-3 (측정값 계산) ──────────────→ BODY-7 (한국인 정규화)
   ↓
BODY-4 (비율 계산)
   ↓
BODY-5 (체형 분류) ──────────────────→ BODY-8 (추천 생성)
   ↓
BODY-6 (AI 분석)
```

### 7.2 각 원자 상세

#### BODY-1: 이미지 전처리 및 검증

```typescript
// 입력
interface BODY1Input {
  imageBase64: string;
}

// 출력
interface BODY1Output {
  imageData: ImageData;
  isValid: boolean;
  issues: string[];
  dimensions: { width: number; height: number };
}

// 성공 기준
// - 이미지 디코딩 성공
// - 최소 해상도 충족 (480x640)
// - 세로 방향 또는 정사각형
```

#### BODY-2: MediaPipe Pose 랜드마크 추출

```typescript
// 입력
interface BODY2Input {
  imageData: ImageData;
}

// 출력
interface BODY2Output {
  landmarks: MediaPipeLandmark[];
  confidence: number;
  poseDetected: boolean;
}

// 성공 기준
// - 33개 랜드마크 추출
// - 평균 visibility > 0.5
// - 어깨/힙/무릎/발목 랜드마크 유효
```

#### BODY-3: 체형 측정값 계산

```typescript
// 입력
interface BODY3Input {
  landmarks: MediaPipeLandmark[];
}

// 출력
interface BODY3Output {
  measurements: BodyMeasurements;
}

// 성공 기준
// - 어깨 너비 > 0
// - 힙 너비 > 0
// - 상하체 길이 > 0
```

#### BODY-4: 체형 비율 계산

```typescript
// 입력
interface BODY4Input {
  measurements: BodyMeasurements;
}

// 출력
interface BODY4Output {
  ratios: BodyRatios;
}

// 성공 기준
// - SHR 범위: 0.7 ~ 1.5
// - WHR 범위: 0.6 ~ 1.1
// - 상하체 비율: 0.8 ~ 1.4
```

#### BODY-5: 체형 분류 알고리즘

```typescript
// 입력
interface BODY5Input {
  ratios: BodyRatios;
  gender: 'male' | 'female';
}

// 출력
interface BODY5Output {
  bodyShape: BodyShapeType;
  confidence: number;
  alternativeTypes: Array<{ type: BodyShapeType; confidence: number }>;
}

// 성공 기준
// - 체형 분류 완료
// - confidence > 0.5
// - 대안 체형 2개 이상 제공
```

#### BODY-6: AI 체형 분석 (Gemini)

```typescript
// 입력
interface BODY6Input {
  imageBase64: string;
  mediaPipeResult: BodyShapeResult;
  gender: 'male' | 'female';
  ageGroup: string;
}

// 출력
interface BODY6Output {
  aiBodyShape: BodyShapeType;
  aiConfidence: number;
  description: string;
  recommendations: { styling: string[]; exercise: string[] };
}

// 성공 기준
// - 3초 이내 응답
// - JSON 파싱 성공
// - 유효한 체형 타입 반환
```

#### BODY-7: 한국인 표준 정규화

```typescript
// 입력
interface BODY7Input {
  measurements: BodyMeasurements;
  gender: 'male' | 'female';
  ageGroup: '20s' | '30s' | '40s' | '50s';
}

// 출력
interface BODY7Output {
  zScores: Record<string, number>;
  percentiles: Record<string, number>;
}

// 성공 기준
// - Size Korea 기준 적용
// - 백분위 0-100 범위
```

#### BODY-8: 체형별 추천 생성

```typescript
// 입력
interface BODY8Input {
  bodyShape: BodyShapeType;
  gender: 'male' | 'female';
}

// 출력
interface BODY8Output {
  stylingRecommendations: StylingRecommendation[];
  exerciseRecommendations: ExerciseRecommendation[];
}

// 성공 기준
// - 스타일 추천 2개 이상
// - 운동 추천 2개 이상
// - 피해야 할 항목 포함
```

**총 예상 시간**: 19시간

---

## 8. 파일 구조

```
lib/body-analysis/
├── index.ts                    # 통합 export
├── types.ts                    # 공통 타입
├── body-analyzer.ts            # 메인 분석 함수
├── internal/
│   ├── landmark-extractor.ts   # BODY-2: MediaPipe 연동
│   ├── measurement-calculator.ts # BODY-3: 측정값 계산
│   ├── ratio-calculator.ts     # BODY-4: 비율 계산
│   ├── shape-classifier.ts     # BODY-5: 체형 분류
│   ├── ai-analyzer.ts          # BODY-6: Gemini 연동
│   ├── korean-normalizer.ts    # BODY-7: 한국인 정규화
│   └── recommendation-generator.ts # BODY-8: 추천 생성
└── data/
    ├── korean-standards.ts     # Size Korea 표준 데이터
    └── style-database.ts       # 체형별 스타일 DB
```

---

## 9. 테스트 케이스

### 9.1 단위 테스트

```typescript
describe('Body Shape Analysis', () => {
  describe('Measurement Calculator', () => {
    it('should calculate shoulder width from landmarks', () => {
      const landmarks = createMockLandmarks({
        leftShoulder: { x: 0.3, y: 0.3, z: 0 },
        rightShoulder: { x: 0.7, y: 0.3, z: 0 },
      });

      const measurements = calculateBodyMeasurements(landmarks);
      expect(measurements.shoulderWidth).toBeCloseTo(0.4, 2);
    });

    it('should estimate waist as 80% of hip width', () => {
      const landmarks = createMockLandmarks({
        leftHip: { x: 0.35, y: 0.6, z: 0 },
        rightHip: { x: 0.65, y: 0.6, z: 0 },
      });

      const measurements = calculateBodyMeasurements(landmarks);
      expect(measurements.waistWidth).toBeCloseTo(measurements.hipWidth * 0.8, 2);
    });
  });

  describe('Shape Classifier', () => {
    it('should classify hourglass when SHR≈1 and WHR<0.75', () => {
      const ratios: BodyRatios = {
        shr: 1.0,
        whr: 0.7,
        whtr: 0.4,
        upperLowerRatio: 1.1,
      };

      const result = classifyBodyShape(ratios, 'female');
      expect(result.type).toBe('hourglass');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should classify pear when SHR<0.9', () => {
      const ratios: BodyRatios = {
        shr: 0.85,
        whr: 0.75,
        whtr: 0.42,
        upperLowerRatio: 1.05,
      };

      const result = classifyBodyShape(ratios, 'female');
      expect(result.type).toBe('pear');
    });

    it('should classify inverted triangle when SHR>1.1', () => {
      const ratios: BodyRatios = {
        shr: 1.15,
        whr: 0.8,
        whtr: 0.45,
        upperLowerRatio: 1.1,
      };

      const result = classifyBodyShape(ratios, 'female');
      expect(result.type).toBe('invertedTriangle');
    });
  });

  describe('Korean Normalizer', () => {
    it('should calculate correct percentile for average Korean female', () => {
      const result = normalizeToKorean(68.0, 'waist', 'female', '20s');

      expect(result.zScore).toBeCloseTo(0, 1);
      expect(result.percentile).toBeCloseTo(50, 5);
    });
  });
});
```

### 9.2 통합 테스트

```typescript
describe('Body Analysis Integration', () => {
  it('should complete full analysis pipeline', async () => {
    const input: BodyAnalysisInput = {
      imageBase64: loadTestImage('full-body-female.jpg'),
      gender: 'female',
      ageGroup: '30s',
    };

    const result = await analyzeBody(input);

    expect(result.success).toBe(true);
    expect(result.bodyShape.type).toBeDefined();
    expect(result.bodyShape.confidence).toBeGreaterThan(0.5);
    expect(result.measurements.shoulderWidth).toBeGreaterThan(0);
    expect(result.recommendations?.styling.length).toBeGreaterThan(0);
  });

  it('should fall back to MediaPipe when AI fails', async () => {
    vi.spyOn(geminiClient, 'generate').mockRejectedValue(new Error('Timeout'));

    const input: BodyAnalysisInput = {
      imageBase64: loadTestImage('full-body-male.jpg'),
      gender: 'male',
    };

    const result = await analyzeBody(input);

    expect(result.success).toBe(true);
    expect(result.metadata.analysisMethod).toBe('mediapipe');
  });
});
```

---

## 10. 관련 문서 링크

| 문서 | 설명 |
|------|------|
| [body-mechanics.md](../principles/body-mechanics.md) | 체형 역학 원리 |
| [image-processing.md](../principles/image-processing.md) | 이미지 전처리 원리 |
| [ADR-001](../adr/ADR-001-core-image-engine.md) | Core Image Engine 결정 |
| [ADR-003](../adr/ADR-003-ai-model-selection.md) | AI 모델 선택 결정 |
| [SDD-CIE-3](./SDD-CIE-3-AWB-CORRECTION.md) | 화이트밸런스 보정 |
| *(본 문서)* | 체형분석 스펙 (C-1 통합) |

---

## 11. 의료 면책 고지

```
⚠️ 중요 의료 면책

이 문서의 체형 분석은 웰니스 및 피트니스 참고 목적이며,
의료 진단이나 물리치료를 대체하지 않습니다.

다음 사항은 반드시 전문가 상담이 필요합니다:
- 체형 이상으로 인한 만성 통증
- 척추측만증, 골반 불균형 등 구조적 문제
- BMI 극단값 (18.5 미만 또는 30 이상)
- 급격한 체중 변화

체형 분석 결과 및 스타일/운동 추천은 참고용이며,
전문의 또는 퍼스널 트레이너와 상담 후 실행하세요.
```

---

**Author**: Claude Code
**Reviewed by**: -
