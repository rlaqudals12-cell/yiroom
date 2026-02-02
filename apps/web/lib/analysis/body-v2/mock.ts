/**
 * C-2: Mock 데이터 생성
 *
 * @module lib/analysis/body-v2/mock
 * @description AI 분석 실패 시 Fallback용 Mock 데이터 생성
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Landmark33,
  PoseDetectionResult,
  BodyRatios,
  BodyShapeType,
  BodyAnalysisV2Result,
  PostureAnalysis,
  PostureIssue,
} from './types';
import { BODY_SHAPE_INFO } from './types';

// =============================================================================
// 내부 유틸리티
// =============================================================================

/**
 * 범위 내 랜덤 값 생성
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 배열에서 랜덤 선택
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 체형별 비율 범위
 */
const BODY_SHAPE_RATIO_RANGES: Record<BodyShapeType, {
  shoulderHipRatio: [number, number];
  waistToAvgRatio: [number, number];
}> = {
  rectangle: {
    shoulderHipRatio: [0.95, 1.05],
    waistToAvgRatio: [0.85, 0.95],
  },
  'inverted-triangle': {
    shoulderHipRatio: [1.1, 1.3],
    waistToAvgRatio: [0.75, 0.85],
  },
  triangle: {
    shoulderHipRatio: [0.75, 0.9],
    waistToAvgRatio: [0.8, 0.9],
  },
  oval: {
    shoulderHipRatio: [0.9, 1.1],
    waistToAvgRatio: [0.95, 1.1],
  },
  hourglass: {
    shoulderHipRatio: [0.95, 1.05],
    waistToAvgRatio: [0.65, 0.75],
  },
};

// =============================================================================
// Mock 생성 함수
// =============================================================================

/**
 * Mock 랜드마크 생성
 *
 * @description 33개 MediaPipe Pose 랜드마크의 Mock 데이터를 생성합니다.
 * @returns 33개 랜드마크 배열
 */
export function generateMockLandmarks(): Landmark33[] {
  const landmarks: Landmark33[] = [];

  // 기본 신체 비율 기준점
  const headY = 0.1;
  const shoulderY = 0.2;
  const hipY = 0.55;
  const kneeY = 0.75;
  const ankleY = 0.95;

  // 얼굴 랜드마크 (0-10)
  // NOSE
  landmarks.push({ x: 0.5, y: headY, z: -0.05, visibility: 0.95 });
  // LEFT_EYE_INNER
  landmarks.push({ x: 0.48, y: headY - 0.02, z: -0.04, visibility: 0.9 });
  // LEFT_EYE
  landmarks.push({ x: 0.46, y: headY - 0.02, z: -0.04, visibility: 0.9 });
  // LEFT_EYE_OUTER
  landmarks.push({ x: 0.44, y: headY - 0.02, z: -0.03, visibility: 0.85 });
  // RIGHT_EYE_INNER
  landmarks.push({ x: 0.52, y: headY - 0.02, z: -0.04, visibility: 0.9 });
  // RIGHT_EYE
  landmarks.push({ x: 0.54, y: headY - 0.02, z: -0.04, visibility: 0.9 });
  // RIGHT_EYE_OUTER
  landmarks.push({ x: 0.56, y: headY - 0.02, z: -0.03, visibility: 0.85 });
  // LEFT_EAR
  landmarks.push({ x: 0.4, y: headY, z: 0.02, visibility: 0.7 });
  // RIGHT_EAR
  landmarks.push({ x: 0.6, y: headY, z: 0.02, visibility: 0.7 });
  // MOUTH_LEFT
  landmarks.push({ x: 0.47, y: headY + 0.03, z: -0.03, visibility: 0.85 });
  // MOUTH_RIGHT
  landmarks.push({ x: 0.53, y: headY + 0.03, z: -0.03, visibility: 0.85 });

  // 상체 랜드마크 (11-22)
  const shoulderWidth = randomInRange(0.12, 0.18);
  // LEFT_SHOULDER
  landmarks.push({ x: 0.5 - shoulderWidth, y: shoulderY, z: 0, visibility: 0.95 });
  // RIGHT_SHOULDER
  landmarks.push({ x: 0.5 + shoulderWidth, y: shoulderY, z: 0, visibility: 0.95 });
  // LEFT_ELBOW
  landmarks.push({ x: 0.5 - shoulderWidth - 0.02, y: shoulderY + 0.15, z: 0.02, visibility: 0.9 });
  // RIGHT_ELBOW
  landmarks.push({ x: 0.5 + shoulderWidth + 0.02, y: shoulderY + 0.15, z: 0.02, visibility: 0.9 });
  // LEFT_WRIST
  landmarks.push({ x: 0.5 - shoulderWidth - 0.04, y: shoulderY + 0.3, z: 0.02, visibility: 0.85 });
  // RIGHT_WRIST
  landmarks.push({ x: 0.5 + shoulderWidth + 0.04, y: shoulderY + 0.3, z: 0.02, visibility: 0.85 });
  // LEFT_PINKY
  landmarks.push({ x: 0.5 - shoulderWidth - 0.05, y: shoulderY + 0.33, z: 0.02, visibility: 0.7 });
  // RIGHT_PINKY
  landmarks.push({ x: 0.5 + shoulderWidth + 0.05, y: shoulderY + 0.33, z: 0.02, visibility: 0.7 });
  // LEFT_INDEX
  landmarks.push({ x: 0.5 - shoulderWidth - 0.04, y: shoulderY + 0.34, z: 0.01, visibility: 0.7 });
  // RIGHT_INDEX
  landmarks.push({ x: 0.5 + shoulderWidth + 0.04, y: shoulderY + 0.34, z: 0.01, visibility: 0.7 });
  // LEFT_THUMB
  landmarks.push({ x: 0.5 - shoulderWidth - 0.03, y: shoulderY + 0.32, z: 0, visibility: 0.65 });
  // RIGHT_THUMB
  landmarks.push({ x: 0.5 + shoulderWidth + 0.03, y: shoulderY + 0.32, z: 0, visibility: 0.65 });

  // 하체 랜드마크 (23-32)
  const hipWidth = randomInRange(0.1, 0.15);
  // LEFT_HIP
  landmarks.push({ x: 0.5 - hipWidth, y: hipY, z: 0, visibility: 0.9 });
  // RIGHT_HIP
  landmarks.push({ x: 0.5 + hipWidth, y: hipY, z: 0, visibility: 0.9 });
  // LEFT_KNEE
  landmarks.push({ x: 0.5 - hipWidth * 0.8, y: kneeY, z: 0.01, visibility: 0.85 });
  // RIGHT_KNEE
  landmarks.push({ x: 0.5 + hipWidth * 0.8, y: kneeY, z: 0.01, visibility: 0.85 });
  // LEFT_ANKLE
  landmarks.push({ x: 0.5 - hipWidth * 0.7, y: ankleY, z: 0.02, visibility: 0.8 });
  // RIGHT_ANKLE
  landmarks.push({ x: 0.5 + hipWidth * 0.7, y: ankleY, z: 0.02, visibility: 0.8 });
  // LEFT_HEEL
  landmarks.push({ x: 0.5 - hipWidth * 0.7, y: ankleY + 0.02, z: 0.04, visibility: 0.7 });
  // RIGHT_HEEL
  landmarks.push({ x: 0.5 + hipWidth * 0.7, y: ankleY + 0.02, z: 0.04, visibility: 0.7 });
  // LEFT_FOOT_INDEX
  landmarks.push({ x: 0.5 - hipWidth * 0.65, y: ankleY + 0.03, z: -0.02, visibility: 0.65 });
  // RIGHT_FOOT_INDEX
  landmarks.push({ x: 0.5 + hipWidth * 0.65, y: ankleY + 0.03, z: -0.02, visibility: 0.65 });

  return landmarks;
}

/**
 * Mock Pose 검출 결과 생성
 */
export function generateMockPoseResult(): PoseDetectionResult {
  const landmarks = generateMockLandmarks();
  const overallVisibility =
    landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;

  return {
    landmarks,
    overallVisibility,
    confidence: randomInRange(0.7, 0.9),
  };
}

/**
 * Mock 체형 비율 생성
 *
 * @param targetType - 생성할 체형 유형 (지정 시 해당 체형에 맞는 비율 생성)
 */
export function generateMockBodyRatios(targetType?: BodyShapeType): BodyRatios {
  const type = targetType || randomChoice<BodyShapeType>([
    'rectangle',
    'inverted-triangle',
    'triangle',
    'oval',
    'hourglass',
  ]);

  const ranges = BODY_SHAPE_RATIO_RANGES[type];
  const shoulderHipRatio = randomInRange(...ranges.shoulderHipRatio);
  const waistToAvgRatio = randomInRange(...ranges.waistToAvgRatio);

  // 기본 너비 설정 (정규화된 값)
  const hipWidth = randomInRange(0.2, 0.28);
  const shoulderWidth = hipWidth * shoulderHipRatio;
  const waistWidth = ((shoulderWidth + hipWidth) / 2) * waistToAvgRatio;

  // 상하체 길이
  const upperBodyLength = randomInRange(0.32, 0.38);
  const lowerBodyLength = randomInRange(0.42, 0.48);

  // 팔다리 길이
  const armLength = randomInRange(0.28, 0.35);
  const legLength = randomInRange(0.45, 0.52);

  return {
    shoulderWidth,
    waistWidth,
    hipWidth,
    shoulderToWaistRatio: shoulderWidth / waistWidth,
    waistToHipRatio: waistWidth / hipWidth,
    upperBodyLength,
    lowerBodyLength,
    upperToLowerRatio: upperBodyLength / lowerBodyLength,
    armLength,
    legLength,
    armToTorsoRatio: armLength / upperBodyLength,
  };
}

/**
 * Mock 자세 분석 결과 생성
 *
 * @param includeIssues - 자세 문제 포함 여부 (기본 true)
 */
export function generateMockPostureAnalysis(includeIssues = true): PostureAnalysis {
  const shoulderTilt = randomInRange(-5, 5);
  const hipTilt = randomInRange(-4, 4);
  const spineAlignment = randomInRange(70, 95);

  const headPositions: ('forward' | 'neutral' | 'backward')[] = ['forward', 'neutral', 'backward'];
  const headPosition = randomChoice(headPositions);

  const issues: PostureIssue[] = [];

  if (includeIssues && Math.random() > 0.3) {
    // 30% 확률로 자세 문제 추가
    const possibleIssues: PostureIssue[] = [
      {
        type: 'shoulder-imbalance',
        severity: Math.ceil(randomInRange(1, 3)),
        description: '왼쪽 어깨가 2.5도 높습니다',
        exercises: ['사이드 플랭크', '덤벨 숄더 프레스', '스트레칭'],
      },
      {
        type: 'forward-head',
        severity: Math.ceil(randomInRange(1, 4)),
        description: '머리가 앞으로 나와 있습니다 (거북목 의심)',
        exercises: ['턱 당기기', '목 스트레칭', '흉추 신전'],
      },
      {
        type: 'rounded-shoulders',
        severity: Math.ceil(randomInRange(1, 3)),
        description: '어깨가 앞으로 굽어 있습니다',
        exercises: ['가슴 스트레칭', '로우 운동', '페이스 풀'],
      },
    ];

    // 1-2개 문제 선택
    const numIssues = Math.ceil(Math.random() * 2);
    const shuffled = possibleIssues.sort(() => Math.random() - 0.5);
    issues.push(...shuffled.slice(0, numIssues));
  }

  return {
    shoulderTilt: Math.round(shoulderTilt * 10) / 10,
    hipTilt: Math.round(hipTilt * 10) / 10,
    spineAlignment: Math.round(spineAlignment),
    headPosition,
    issues,
  };
}

/**
 * Mock 체형 분석 전체 결과 생성
 *
 * @description AI 분석 실패 시 Fallback으로 사용할 Mock 결과를 생성합니다.
 *
 * @param options - 생성 옵션
 * @returns 체형 분석 결과
 *
 * @example
 * const mockResult = generateMockBodyAnalysisResult();
 * console.log('체형:', mockResult.bodyShape); // 'hourglass'
 */
export function generateMockBodyAnalysisResult(options?: {
  targetBodyType?: BodyShapeType;
  includePosture?: boolean;
  includeStyling?: boolean;
}): BodyAnalysisV2Result {
  const {
    targetBodyType,
    includePosture = true,
    includeStyling = true,
  } = options || {};

  // 체형 유형 결정
  const bodyShape: BodyShapeType = targetBodyType || randomChoice<BodyShapeType>([
    'rectangle',
    'inverted-triangle',
    'triangle',
    'oval',
    'hourglass',
  ]);

  // 각 항목 생성
  const poseDetection = generateMockPoseResult();
  const bodyRatios = generateMockBodyRatios(bodyShape);
  const bodyShapeInfo = {
    type: bodyShape,
    ...BODY_SHAPE_INFO[bodyShape],
  };

  // 선택적 항목
  const postureAnalysis = includePosture ? generateMockPostureAnalysis() : undefined;

  const stylingRecommendations = includeStyling
    ? {
        tops: bodyShapeInfo.stylingTips.slice(0, 2),
        bottoms: ['하이웨이스트 팬츠', 'A라인 스커트'],
        outerwear: ['롱 카디건', '테일러드 재킷'],
        silhouettes: ['핏앤플레어', 'X라인 실루엣'],
        avoid: ['박시한 스타일', '일자핏'],
      }
    : undefined;

  return {
    id: uuidv4(),
    poseDetection,
    bodyRatios,
    bodyShape,
    bodyShapeInfo,
    postureAnalysis,
    stylingRecommendations,
    measurementConfidence: randomInRange(65, 85),
    analyzedAt: new Date().toISOString(),
    usedFallback: true,
  };
}

/**
 * 특정 체형 Mock 생성 함수들
 */
export const mockGenerators = {
  rectangle: () => generateMockBodyAnalysisResult({ targetBodyType: 'rectangle' }),
  invertedTriangle: () => generateMockBodyAnalysisResult({ targetBodyType: 'inverted-triangle' }),
  triangle: () => generateMockBodyAnalysisResult({ targetBodyType: 'triangle' }),
  oval: () => generateMockBodyAnalysisResult({ targetBodyType: 'oval' }),
  hourglass: () => generateMockBodyAnalysisResult({ targetBodyType: 'hourglass' }),
};
