# 3D 얼굴 형태 분석 원리 (3D Face Shape Analysis)

> 이 문서는 체형 분석(C-1, C-2) 및 퍼스널컬러 분석(PC-1, PC-2)의 얼굴 형태 분류 기반이 되는 기본 원리를 설명한다.

---

## P1: 궁극의 형태

### 이상적 최종 상태

- 468개 얼굴 랜드마크 기반 정밀 3D 얼굴 형태 분석
- 7가지 기본 얼굴형 + 복합형 자동 분류
- 얼굴 비율 기반 맞춤형 스타일링 추천
- 조명/각도 변화에 강건한 측정

### 물리적 한계

- 2D 이미지에서 3D 형태 추정의 기하학적 한계
- 카메라 왜곡(특히 셀카)에 의한 측정 오차
- 헤어스타일/안경 등 가림막에 의한 랜드마크 검출 오류
- 표정 변화에 따른 얼굴 형태 왜곡

### 100점 기준

| 항목 | 100점 | 80점 | 60점 |
|------|-------|------|------|
| 얼굴형 분류 정확도 | 95%+ | 85%+ | 75%+ |
| 랜드마크 검출 성공률 | 99%+ | 95%+ | 90%+ |
| 비율 측정 오차 | < 2% | < 5% | < 10% |
| 스타일 추천 만족도 | 90%+ | 80%+ | 70%+ |

### 현재 구현 목표

- **목표**: 80% (MediaPipe Face Mesh 기반 기본 분류)
- **의도적 제외**: 3D 스캐닝 기반 정밀 측정, 시계열 추적

---

## 1. 핵심 개념

### 1.1 얼굴 형태 분류 체계

인류학적 연구와 뷰티 산업에서 사용되는 7가지 기본 얼굴형:

| 얼굴형 | 영문명 | 특징 |
|--------|--------|------|
| **타원형** | Oval | 이마-광대-턱 비율 균형, 이상적 비율 |
| **둥근형** | Round | 가로-세로 비율 유사, 볼살 풍성 |
| **사각형** | Square | 이마-광대-턱 폭 유사, 각진 턱선 |
| **긴형** | Oblong/Long | 세로가 가로보다 현저히 김 |
| **하트형** | Heart | 이마 넓고 턱이 뾰족함 |
| **역삼각형** | Inverted Triangle | 이마 가장 넓고 아래로 좁아짐 |
| **다이아몬드형** | Diamond | 광대가 가장 넓고 이마/턱 좁음 |

### 1.2 MediaPipe Face Mesh 랜드마크

MediaPipe Face Mesh는 468개의 3D 얼굴 랜드마크를 제공:

```
주요 랜드마크 인덱스:
- 이마 상단: 10
- 이마 좌우: 54, 284
- 광대 좌우: 234, 454
- 턱 끝: 152
- 턱선 좌우: 172, 397
- 눈 중심: 133, 362
- 코 끝: 4
- 입술 중심: 13
```

### 1.3 얼굴 비율 지표

Leonardo da Vinci의 황금 비율과 현대 미용학 연구 기반:

| 비율 지표 | 계산 방법 | 이상적 값 |
|-----------|-----------|-----------|
| **얼굴 종횡비** | 얼굴 높이 / 얼굴 너비 | 1.3 ~ 1.5 |
| **이마 비율** | 이마 너비 / 광대 너비 | 0.7 ~ 0.9 |
| **턱 비율** | 턱 너비 / 광대 너비 | 0.6 ~ 0.8 |
| **삼등분 비율** | 상안부:중안부:하안부 | 1:1:1 |
| **턱 각도** | 턱선과 수평선 각도 | 90° ~ 120° |

---

## 2. 수학적/물리학적 기반

### 2.1 랜드마크 기반 거리 계산

유클리드 거리를 사용한 2D 평면 거리 측정:

```
d = √[(x₂ - x₁)² + (y₂ - y₁)²]
```

정규화된 거리 (이미지 크기 독립적):

```
d_normalized = d / face_height
```

### 2.2 얼굴 형태 분류 알고리즘

다차원 특징 벡터 기반 분류:

```
Feature Vector F = [
  aspect_ratio,      // 종횡비
  forehead_ratio,    // 이마 비율
  cheekbone_ratio,   // 광대 비율 (기준)
  jaw_ratio,         // 턱 비율
  jaw_angle,         // 턱 각도
  face_contour_curve // 윤곽 곡률
]
```

### 2.3 분류 결정 경계

각 얼굴형별 특징 벡터 범위:

```
Oval:
  - 1.3 ≤ aspect_ratio ≤ 1.5
  - 0.75 ≤ forehead_ratio ≤ 0.85
  - 0.65 ≤ jaw_ratio ≤ 0.75

Round:
  - aspect_ratio < 1.3
  - forehead_ratio ≈ jaw_ratio
  - high face_contour_curve

Square:
  - 1.0 ≤ aspect_ratio ≤ 1.3
  - forehead_ratio ≈ 1.0
  - jaw_ratio ≈ 1.0
  - jaw_angle > 100°

Long:
  - aspect_ratio > 1.5
  - moderate proportions

Heart:
  - forehead_ratio > 0.9
  - jaw_ratio < 0.65
  - pointed chin

Diamond:
  - cheekbone is widest
  - forehead_ratio < 0.8
  - jaw_ratio < 0.7
```

### 2.4 곡률 분석

얼굴 윤곽선의 곡률 계산 (이산 근사):

```
κ = (x'y'' - y'x'') / (x'² + y'²)^(3/2)

여기서:
- x', y': 1차 미분 (인접 점 차이)
- x'', y'': 2차 미분 (곡률 변화)
```

평균 곡률이 높으면 둥근 얼굴, 낮으면 각진 얼굴.

---

## 3. 구현 도출

### 3.1 타입 정의

```typescript
// types/face-shape.ts

/**
 * 7가지 기본 얼굴형
 */
export type FaceShapeType =
  | 'oval'      // 타원형
  | 'round'     // 둥근형
  | 'square'    // 사각형
  | 'oblong'    // 긴형
  | 'heart'     // 하트형
  | 'inverted_triangle'  // 역삼각형
  | 'diamond';  // 다이아몬드형

/**
 * 얼굴 랜드마크 좌표
 */
export interface FaceLandmark {
  x: number;  // 정규화된 x (0-1)
  y: number;  // 정규화된 y (0-1)
  z: number;  // 깊이 (optional)
}

/**
 * 얼굴 측정값
 */
export interface FaceMeasurements {
  // 기본 치수 (정규화)
  faceHeight: number;
  faceWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
  jawWidth: number;
  chinLength: number;

  // 계산된 비율
  aspectRatio: number;
  foreheadRatio: number;
  jawRatio: number;

  // 각도 및 곡률
  jawAngle: number;
  contourCurvature: number;
}

/**
 * 얼굴형 분석 결과
 */
export interface FaceShapeAnalysis {
  primaryShape: FaceShapeType;
  secondaryShape?: FaceShapeType;  // 복합형인 경우
  confidence: number;
  measurements: FaceMeasurements;
  stylingRecommendations: StylingRecommendation[];
}

/**
 * 스타일링 추천
 */
export interface StylingRecommendation {
  category: 'hairstyle' | 'glasses' | 'earrings' | 'neckline' | 'makeup';
  recommended: string[];
  avoid: string[];
  reason: string;
}
```

### 3.2 MediaPipe 랜드마크 인덱스

```typescript
// lib/analysis/face-shape/landmarks.ts

/**
 * MediaPipe Face Mesh 주요 랜드마크 인덱스
 * 총 468개 중 얼굴 형태 분석에 필요한 핵심 인덱스
 */
export const FACE_LANDMARKS = {
  // 얼굴 윤곽 (얼굴형 판단 핵심)
  FACE_OVAL: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ],

  // 이마 경계
  FOREHEAD_TOP: 10,
  FOREHEAD_LEFT: 54,
  FOREHEAD_RIGHT: 284,

  // 광대
  CHEEKBONE_LEFT: 234,
  CHEEKBONE_RIGHT: 454,

  // 턱
  JAW_LEFT: 172,
  JAW_RIGHT: 397,
  CHIN: 152,

  // 눈 (비율 기준점)
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,

  // 코
  NOSE_TIP: 4,
  NOSE_BRIDGE: 6,

  // 입
  UPPER_LIP: 13,
  LOWER_LIP: 14,
} as const;
```

### 3.3 측정값 계산

```typescript
// lib/analysis/face-shape/measurements.ts

import { FaceLandmark, FaceMeasurements } from '@/types/face-shape';
import { FACE_LANDMARKS } from './landmarks';

/**
 * 두 랜드마크 간 유클리드 거리 계산
 */
function distance(p1: FaceLandmark, p2: FaceLandmark): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2)
  );
}

/**
 * 세 점으로 각도 계산 (라디안)
 */
function calculateAngle(
  p1: FaceLandmark,
  vertex: FaceLandmark,
  p2: FaceLandmark
): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;

  return Math.atan2(cross, dot);
}

/**
 * 얼굴 윤곽 곡률 계산
 */
function calculateContourCurvature(contourPoints: FaceLandmark[]): number {
  if (contourPoints.length < 3) return 0;

  let totalCurvature = 0;

  for (let i = 1; i < contourPoints.length - 1; i++) {
    const prev = contourPoints[i - 1];
    const curr = contourPoints[i];
    const next = contourPoints[i + 1];

    // 1차 미분 (속도)
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // 2차 미분 (가속도)
    const ddx = dx2 - dx1;
    const ddy = dy2 - dy1;

    // 곡률 공식
    const denominator = Math.pow(dx1 * dx1 + dy1 * dy1, 1.5);
    if (denominator > 0.0001) {
      const curvature = Math.abs(dx1 * ddy - dy1 * ddx) / denominator;
      totalCurvature += curvature;
    }
  }

  return totalCurvature / (contourPoints.length - 2);
}

/**
 * MediaPipe 랜드마크에서 얼굴 측정값 추출
 */
export function extractFaceMeasurements(
  landmarks: FaceLandmark[]
): FaceMeasurements {
  // 주요 랜드마크 추출
  const foreheadTop = landmarks[FACE_LANDMARKS.FOREHEAD_TOP];
  const foreheadLeft = landmarks[FACE_LANDMARKS.FOREHEAD_LEFT];
  const foreheadRight = landmarks[FACE_LANDMARKS.FOREHEAD_RIGHT];
  const cheekboneLeft = landmarks[FACE_LANDMARKS.CHEEKBONE_LEFT];
  const cheekboneRight = landmarks[FACE_LANDMARKS.CHEEKBONE_RIGHT];
  const jawLeft = landmarks[FACE_LANDMARKS.JAW_LEFT];
  const jawRight = landmarks[FACE_LANDMARKS.JAW_RIGHT];
  const chin = landmarks[FACE_LANDMARKS.CHIN];

  // 기본 치수 계산
  const faceHeight = distance(foreheadTop, chin);
  const foreheadWidth = distance(foreheadLeft, foreheadRight);
  const cheekboneWidth = distance(cheekboneLeft, cheekboneRight);
  const jawWidth = distance(jawLeft, jawRight);
  const faceWidth = cheekboneWidth; // 광대 너비를 기준

  // 턱 길이 (광대에서 턱까지)
  const chinLength = distance(
    { x: (cheekboneLeft.x + cheekboneRight.x) / 2, y: cheekboneLeft.y, z: 0 },
    chin
  );

  // 비율 계산
  const aspectRatio = faceHeight / faceWidth;
  const foreheadRatio = foreheadWidth / cheekboneWidth;
  const jawRatio = jawWidth / cheekboneWidth;

  // 턱 각도 계산
  const jawAngle = calculateAngle(jawLeft, chin, jawRight) * (180 / Math.PI);

  // 윤곽 곡률 계산
  const contourPoints = FACE_LANDMARKS.FACE_OVAL.map(i => landmarks[i]);
  const contourCurvature = calculateContourCurvature(contourPoints);

  return {
    faceHeight,
    faceWidth,
    foreheadWidth,
    cheekboneWidth,
    jawWidth,
    chinLength,
    aspectRatio,
    foreheadRatio,
    jawRatio,
    jawAngle,
    contourCurvature,
  };
}
```

### 3.4 얼굴형 분류기

```typescript
// lib/analysis/face-shape/classifier.ts

import { FaceShapeType, FaceMeasurements, FaceShapeAnalysis } from '@/types/face-shape';

/**
 * 얼굴형별 특징 범위 정의
 */
const SHAPE_CRITERIA: Record<FaceShapeType, {
  aspectRatio: [number, number];
  foreheadRatio: [number, number];
  jawRatio: [number, number];
  jawAngle?: [number, number];
  curvature?: [number, number];
}> = {
  oval: {
    aspectRatio: [1.3, 1.5],
    foreheadRatio: [0.75, 0.85],
    jawRatio: [0.65, 0.75],
  },
  round: {
    aspectRatio: [0.9, 1.3],
    foreheadRatio: [0.8, 1.0],
    jawRatio: [0.8, 1.0],
    curvature: [0.5, 1.0],  // 높은 곡률
  },
  square: {
    aspectRatio: [1.0, 1.3],
    foreheadRatio: [0.9, 1.1],
    jawRatio: [0.9, 1.1],
    jawAngle: [100, 150],  // 넓은 각도 = 각진 턱
  },
  oblong: {
    aspectRatio: [1.5, 2.0],
    foreheadRatio: [0.7, 0.9],
    jawRatio: [0.6, 0.8],
  },
  heart: {
    aspectRatio: [1.2, 1.6],
    foreheadRatio: [0.9, 1.1],
    jawRatio: [0.5, 0.7],
  },
  inverted_triangle: {
    aspectRatio: [1.2, 1.5],
    foreheadRatio: [0.95, 1.2],
    jawRatio: [0.55, 0.75],
  },
  diamond: {
    aspectRatio: [1.2, 1.6],
    foreheadRatio: [0.65, 0.8],
    jawRatio: [0.55, 0.75],
  },
};

/**
 * 값이 범위 내에 있는지 확인하고 점수 반환
 */
function scoreInRange(value: number, range: [number, number]): number {
  const [min, max] = range;
  const mid = (min + max) / 2;
  const halfRange = (max - min) / 2;

  if (value >= min && value <= max) {
    // 범위 내: 중앙에 가까울수록 높은 점수
    const distFromMid = Math.abs(value - mid);
    return 1 - (distFromMid / halfRange) * 0.3;
  } else {
    // 범위 외: 거리에 따라 점수 감소
    const distFromRange = value < min ? min - value : value - max;
    return Math.max(0, 0.7 - distFromRange * 2);
  }
}

/**
 * 얼굴형 분류
 */
export function classifyFaceShape(
  measurements: FaceMeasurements
): FaceShapeAnalysis {
  const scores: Record<FaceShapeType, number> = {
    oval: 0,
    round: 0,
    square: 0,
    oblong: 0,
    heart: 0,
    inverted_triangle: 0,
    diamond: 0,
  };

  // 각 얼굴형에 대해 점수 계산
  for (const [shape, criteria] of Object.entries(SHAPE_CRITERIA)) {
    const shapeType = shape as FaceShapeType;
    let totalScore = 0;
    let weightSum = 0;

    // 종횡비 점수 (가중치 0.3)
    totalScore += scoreInRange(measurements.aspectRatio, criteria.aspectRatio) * 0.3;
    weightSum += 0.3;

    // 이마 비율 점수 (가중치 0.25)
    totalScore += scoreInRange(measurements.foreheadRatio, criteria.foreheadRatio) * 0.25;
    weightSum += 0.25;

    // 턱 비율 점수 (가중치 0.25)
    totalScore += scoreInRange(measurements.jawRatio, criteria.jawRatio) * 0.25;
    weightSum += 0.25;

    // 턱 각도 점수 (해당되는 경우, 가중치 0.1)
    if (criteria.jawAngle) {
      totalScore += scoreInRange(measurements.jawAngle, criteria.jawAngle) * 0.1;
      weightSum += 0.1;
    }

    // 곡률 점수 (해당되는 경우, 가중치 0.1)
    if (criteria.curvature) {
      totalScore += scoreInRange(measurements.contourCurvature, criteria.curvature) * 0.1;
      weightSum += 0.1;
    }

    scores[shapeType] = totalScore / weightSum;
  }

  // 최고 점수 얼굴형 찾기
  const sortedShapes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const [primaryShape, primaryScore] = sortedShapes[0];
  const [secondaryShape, secondaryScore] = sortedShapes[1];

  // 복합형 판단 (2등 점수가 1등의 85% 이상이면 복합형)
  const isHybrid = secondaryScore >= primaryScore * 0.85;

  return {
    primaryShape: primaryShape as FaceShapeType,
    secondaryShape: isHybrid ? secondaryShape as FaceShapeType : undefined,
    confidence: primaryScore * 100,
    measurements,
    stylingRecommendations: generateStylingRecommendations(
      primaryShape as FaceShapeType
    ),
  };
}
```

### 3.5 스타일링 추천 생성

```typescript
// lib/analysis/face-shape/styling.ts

import { FaceShapeType, StylingRecommendation } from '@/types/face-shape';

/**
 * 얼굴형별 스타일링 추천 데이터베이스
 */
const STYLING_DATABASE: Record<FaceShapeType, {
  hairstyle: { recommended: string[]; avoid: string[] };
  glasses: { recommended: string[]; avoid: string[] };
  earrings: { recommended: string[]; avoid: string[] };
  neckline: { recommended: string[]; avoid: string[] };
  makeup: { recommended: string[]; avoid: string[] };
}> = {
  oval: {
    hairstyle: {
      recommended: ['대부분의 스타일 가능', '레이어드 컷', '뱅 스타일'],
      avoid: ['극단적으로 볼륨 있는 스타일'],
    },
    glasses: {
      recommended: ['모든 프레임', '웰링턴', '라운드'],
      avoid: ['특별히 없음'],
    },
    earrings: {
      recommended: ['대부분의 스타일', '드롭 이어링', '후프'],
      avoid: ['특별히 없음'],
    },
    neckline: {
      recommended: ['모든 넥라인', 'V넥', '보트넥'],
      avoid: ['특별히 없음'],
    },
    makeup: {
      recommended: ['자연스러운 컨투어링', '밸런스 유지'],
      avoid: ['과도한 음영'],
    },
  },
  round: {
    hairstyle: {
      recommended: ['레이어드 컷', '사이드 파트', '볼륨 있는 톱'],
      avoid: ['단발 보브', '볼륨 있는 사이드', '일자 뱅'],
    },
    glasses: {
      recommended: ['사각형 프레임', '캣아이', '웨이퍼러'],
      avoid: ['라운드 프레임', '작은 프레임'],
    },
    earrings: {
      recommended: ['긴 드롭 이어링', '앵귤러 디자인'],
      avoid: ['둥근 스터드', '버튼 이어링'],
    },
    neckline: {
      recommended: ['V넥', '딥 스쿱', '보트넥'],
      avoid: ['터틀넥', '라운드 넥'],
    },
    makeup: {
      recommended: ['세로 라인 컨투어링', '광대뼈 하이라이트'],
      avoid: ['수평 라인 강조', '블러셔 둥글게'],
    },
  },
  square: {
    hairstyle: {
      recommended: ['소프트 레이어', '웨이브', '사이드 스웹 뱅'],
      avoid: ['일자 뱅', '턱선 보브', '직선적 컷'],
    },
    glasses: {
      recommended: ['라운드 프레임', '오벌 프레임', '림리스'],
      avoid: ['사각 프레임', '각진 프레임'],
    },
    earrings: {
      recommended: ['둥근 후프', '티어드롭', '곡선 디자인'],
      avoid: ['사각형', '기하학적 각진 디자인'],
    },
    neckline: {
      recommended: ['V넥', '스쿱넥', '스윗하트'],
      avoid: ['스퀘어 넥', '보트넥'],
    },
    makeup: {
      recommended: ['턱선 소프트닝', '사이드 컨투어'],
      avoid: ['각진 아이브로우', '직선 라인'],
    },
  },
  oblong: {
    hairstyle: {
      recommended: ['사이드 볼륨', '뱅', '레이어드 미디엄'],
      avoid: ['센터 파트 롱헤어', '세로 볼륨'],
    },
    glasses: {
      recommended: ['큰 프레임', '와이드 프레임', '버터플라이'],
      avoid: ['좁은 프레임', '작은 사이즈'],
    },
    earrings: {
      recommended: ['와이드 스터드', '짧은 드롭', '버튼'],
      avoid: ['긴 드롭', '세로 긴 디자인'],
    },
    neckline: {
      recommended: ['라운드 넥', '보트넥', '터틀넥'],
      avoid: ['딥 V넥', '세로 긴 넥라인'],
    },
    makeup: {
      recommended: ['가로 라인 강조', '볼 블러셔'],
      avoid: ['세로 컨투어링'],
    },
  },
  heart: {
    hairstyle: {
      recommended: ['턱선 볼륨', '사이드 스웹', '롱 레이어'],
      avoid: ['탑 볼륨', '짧은 뱅'],
    },
    glasses: {
      recommended: ['림리스', '라이트 바텀', '오벌'],
      avoid: ['탑 헤비 프레임', '캣아이'],
    },
    earrings: {
      recommended: ['티어드롭', '트라이앵글', '샹들리에'],
      avoid: ['역삼각형', '와이드 탑'],
    },
    neckline: {
      recommended: ['V넥', '스윗하트', '스쿱'],
      avoid: ['와이드 네크라인', '보트넥'],
    },
    makeup: {
      recommended: ['이마 축소 컨투어', '턱 하이라이트'],
      avoid: ['이마 하이라이트', '광대 강조'],
    },
  },
  inverted_triangle: {
    hairstyle: {
      recommended: ['턱선 레이어', '친 렝스 보브', '볼륨 로우'],
      avoid: ['와이드 탑', '볼륨 크라운'],
    },
    glasses: {
      recommended: ['라이트 탑 프레임', '라운드 바텀', '오벌'],
      avoid: ['와이드 프레임', '캣아이'],
    },
    earrings: {
      recommended: ['와이드 바텀', '샹들리에', '후프'],
      avoid: ['스터드', '작은 이어링'],
    },
    neckline: {
      recommended: ['V넥', '스쿱넥', '카울넥'],
      avoid: ['보트넥', '오프숄더'],
    },
    makeup: {
      recommended: ['이마 컨투어', '턱 와이드닝'],
      avoid: ['광대 하이라이트'],
    },
  },
  diamond: {
    hairstyle: {
      recommended: ['뱅', '사이드 파트', '친 렝스 스타일'],
      avoid: ['센터 파트', '슬릭백'],
    },
    glasses: {
      recommended: ['오벌', '림리스', '캣아이'],
      avoid: ['내로우 프레임', '다이아몬드 쉐입'],
    },
    earrings: {
      recommended: ['스터드', '작은 후프', '버튼'],
      avoid: ['와이드 미들', '다이아몬드 쉐입'],
    },
    neckline: {
      recommended: ['스쿱넥', 'V넥', '하이넥'],
      avoid: ['와이드 네크라인'],
    },
    makeup: {
      recommended: ['이마/턱 와이드닝', '광대 소프트닝'],
      avoid: ['광대 강조'],
    },
  },
};

/**
 * 얼굴형에 맞는 스타일링 추천 생성
 */
export function generateStylingRecommendations(
  faceShape: FaceShapeType
): StylingRecommendation[] {
  const data = STYLING_DATABASE[faceShape];

  return [
    {
      category: 'hairstyle',
      recommended: data.hairstyle.recommended,
      avoid: data.hairstyle.avoid,
      reason: `${getKoreanShapeName(faceShape)}의 비율을 보완하는 헤어스타일`,
    },
    {
      category: 'glasses',
      recommended: data.glasses.recommended,
      avoid: data.glasses.avoid,
      reason: '얼굴형과 조화로운 안경 프레임',
    },
    {
      category: 'earrings',
      recommended: data.earrings.recommended,
      avoid: data.earrings.avoid,
      reason: '얼굴 라인을 보완하는 이어링',
    },
    {
      category: 'neckline',
      recommended: data.neckline.recommended,
      avoid: data.neckline.avoid,
      reason: '전체적인 실루엣 밸런스',
    },
    {
      category: 'makeup',
      recommended: data.makeup.recommended,
      avoid: data.makeup.avoid,
      reason: '컨투어링 및 하이라이트 가이드',
    },
  ];
}

/**
 * 얼굴형 한글 이름
 */
function getKoreanShapeName(shape: FaceShapeType): string {
  const names: Record<FaceShapeType, string> = {
    oval: '타원형',
    round: '둥근형',
    square: '사각형',
    oblong: '긴형',
    heart: '하트형',
    inverted_triangle: '역삼각형',
    diamond: '다이아몬드형',
  };
  return names[shape];
}
```

### 3.6 통합 분석 함수

```typescript
// lib/analysis/face-shape/index.ts

import { FaceLandmark, FaceShapeAnalysis } from '@/types/face-shape';
import { extractFaceMeasurements } from './measurements';
import { classifyFaceShape } from './classifier';

/**
 * 얼굴 형태 분석 메인 함수
 *
 * @param landmarks - MediaPipe Face Mesh 468개 랜드마크
 * @returns 얼굴형 분석 결과
 */
export function analyzeFaceShape(
  landmarks: FaceLandmark[]
): FaceShapeAnalysis {
  // 1. 랜드마크 유효성 검증
  if (landmarks.length < 468) {
    throw new Error(`Insufficient landmarks: ${landmarks.length}/468`);
  }

  // 2. 측정값 추출
  const measurements = extractFaceMeasurements(landmarks);

  // 3. 얼굴형 분류 및 추천 생성
  const analysis = classifyFaceShape(measurements);

  return analysis;
}

// Barrel exports
export { extractFaceMeasurements } from './measurements';
export { classifyFaceShape } from './classifier';
export { generateStylingRecommendations } from './styling';
export { FACE_LANDMARKS } from './landmarks';
export type {
  FaceShapeType,
  FaceLandmark,
  FaceMeasurements,
  FaceShapeAnalysis,
  StylingRecommendation,
} from '@/types/face-shape';
```

---

## 4. 검증 방법

### 4.1 단위 테스트

```typescript
// tests/lib/analysis/face-shape/classifier.test.ts

describe('Face Shape Classifier', () => {
  describe('classifyFaceShape', () => {
    it('should classify oval face correctly', () => {
      const ovalMeasurements: FaceMeasurements = {
        faceHeight: 0.4,
        faceWidth: 0.3,
        foreheadWidth: 0.24,
        cheekboneWidth: 0.3,
        jawWidth: 0.21,
        chinLength: 0.12,
        aspectRatio: 1.4,
        foreheadRatio: 0.8,
        jawRatio: 0.7,
        jawAngle: 95,
        contourCurvature: 0.3,
      };

      const result = classifyFaceShape(ovalMeasurements);
      expect(result.primaryShape).toBe('oval');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should identify hybrid shapes', () => {
      const hybridMeasurements: FaceMeasurements = {
        aspectRatio: 1.35,
        foreheadRatio: 0.85,
        jawRatio: 0.75,
        jawAngle: 92,
        contourCurvature: 0.4,
        // ...
      };

      const result = classifyFaceShape(hybridMeasurements);
      expect(result.secondaryShape).toBeDefined();
    });
  });
});
```

### 4.2 시각적 검증

```typescript
// 디버그용 시각화 함수
function visualizeFaceShape(
  canvas: HTMLCanvasElement,
  landmarks: FaceLandmark[],
  analysis: FaceShapeAnalysis
): void {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;

  // 얼굴 윤곽 그리기
  ctx.strokeStyle = '#4F46E5';
  ctx.lineWidth = 2;
  ctx.beginPath();

  FACE_LANDMARKS.FACE_OVAL.forEach((idx, i) => {
    const point = landmarks[idx];
    const x = point.x * width;
    const y = point.y * height;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.closePath();
  ctx.stroke();

  // 측정 라인 그리기
  ctx.strokeStyle = '#10B981';
  ctx.setLineDash([5, 5]);

  // 이마 너비
  drawMeasurementLine(ctx, landmarks,
    FACE_LANDMARKS.FOREHEAD_LEFT,
    FACE_LANDMARKS.FOREHEAD_RIGHT
  );

  // 광대 너비
  drawMeasurementLine(ctx, landmarks,
    FACE_LANDMARKS.CHEEKBONE_LEFT,
    FACE_LANDMARKS.CHEEKBONE_RIGHT
  );

  // 턱 너비
  drawMeasurementLine(ctx, landmarks,
    FACE_LANDMARKS.JAW_LEFT,
    FACE_LANDMARKS.JAW_RIGHT
  );
}
```

---

## 5. 한계 및 주의사항

### 5.1 기술적 한계

| 한계 | 영향 | 완화 방법 |
|------|------|-----------|
| 2D→3D 추정 | 깊이 정보 손실 | 다중 각도 촬영 권장 |
| 셀카 왜곡 | 가장자리 왜곡 | 중앙 배치, 적절 거리 안내 |
| 표정 변화 | 측정 오차 | 무표정 안내 |
| 헤어/안경 가림 | 랜드마크 누락 | 가림막 제거 안내 |

### 5.2 윤리적 고려

```
⚠️ 면책 조항

1. 얼굴형 분류는 스타일링 참고용으로만 제공됩니다.
2. 모든 얼굴형은 고유한 아름다움을 가집니다.
3. 추천은 일반적 가이드라인이며 개인 취향을 우선합니다.
4. 의료적 판단(성형 등)의 근거로 사용할 수 없습니다.
```

### 5.3 결과 신뢰도 가이드

| 신뢰도 | 해석 | 권장 조치 |
|--------|------|-----------|
| 80%+ | 높은 신뢰도 | 결과 신뢰 가능 |
| 60-80% | 중간 신뢰도 | 복합형 가능성 고려 |
| 60% 미만 | 낮은 신뢰도 | 재촬영 권장 |

---

## 6. 참고 자료

### 학술 자료
- Farkas, L.G. (1994). Anthropometry of the Head and Face
- Vegter, F. (2008). Facial Proportion: Art and Anatomy

### 기술 문서
- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [468 Face Landmarks](https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png)

### 뷰티 산업 참조
- The Beauty Department - Face Shape Guide
- Allure - Find Your Face Shape

---

## 7. 관련 문서

### 원리 문서
- [body-mechanics.md](./body-mechanics.md) - 체형 분석 연계
- [color-matching-theory.md](./color-matching-theory.md) - 스타일링 연계

### 스펙 문서
- [SDD-BODY-ANALYSIS.md](../specs/SDD-BODY-ANALYSIS.md) - C-1 스펙
- [SDD-BODY-ANALYSIS-v2.md](../specs/SDD-BODY-ANALYSIS-v2.md) - C-2 스펙

### ADR
- [ADR-001](../adr/ADR-001-core-image-engine.md) - 이미지 엔진 (MediaPipe)

---

**Version**: 1.0 | **Created**: 2026-01-29
**Domain**: 체형 분석 (C-1, C-2), 퍼스널컬러 (PC-1, PC-2)
**Implementation**: lib/analysis/face-shape/
