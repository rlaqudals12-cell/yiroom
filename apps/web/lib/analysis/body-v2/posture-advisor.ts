/**
 * C-2: 자세 교정 추천
 *
 * @module lib/analysis/body-v2/posture-advisor
 * @description MediaPipe Pose 랜드마크 기반 자세 분석 및 교정 운동 추천
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 */

import type {
  Landmark33,
  PoseDetectionResult,
  PostureAnalysis,
  PostureIssue,
} from './types';
import {
  POSE_LANDMARK_INDEX,
  POSTURE_EXERCISES,
  POSTURE_ISSUE_LABELS,
} from './types';
import { calculateMidpoint } from './pose-detector';

// =============================================================================
// 상수
// =============================================================================

/**
 * 자세 문제 감지 임계값
 */
const POSTURE_THRESHOLDS = {
  /** 어깨 기울기 허용 범위 (도) */
  shoulderTiltMax: 3,
  /** 골반 기울기 허용 범위 (도) */
  hipTiltMax: 3,
  /** 거북목 임계값 (코-귀 x좌표 차이) */
  forwardHeadThreshold: 0.02,
  /** 굽은 어깨 임계값 (어깨 y좌표 대비 귀 y좌표) */
  roundedShoulderThreshold: 0.02,
  /** 척추 정렬 허용 오차 */
  spineAlignmentTolerance: 0.03,
} as const;

/**
 * 심각도 기준
 */
const SEVERITY_LEVELS = {
  mild: 1,
  moderate: 2,
  severe: 3,
  critical: 4,
  extreme: 5,
} as const;

// =============================================================================
// 내부 유틸리티
// =============================================================================

/**
 * 라디안을 도(degree)로 변환
 */
function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 두 점 사이의 기울기(각도) 계산
 */
function calculateTilt(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  return radiansToDegrees(Math.atan2(dy, dx));
}

/**
 * 수평선 대비 기울기 (0도가 수평)
 */
function calculateHorizontalTilt(
  left: { x: number; y: number },
  right: { x: number; y: number }
): number {
  const rawTilt = calculateTilt(left, right);
  // 수평선(0도) 대비 기울기
  return rawTilt;
}

/**
 * 심각도 계산 (값이 클수록 심각)
 */
function calculateSeverity(deviation: number, thresholds: number[]): number {
  // thresholds: [mild, moderate, severe, critical]
  if (deviation < thresholds[0]) return SEVERITY_LEVELS.mild;
  if (deviation < thresholds[1]) return SEVERITY_LEVELS.moderate;
  if (deviation < thresholds[2]) return SEVERITY_LEVELS.severe;
  if (deviation < thresholds[3]) return SEVERITY_LEVELS.critical;
  return SEVERITY_LEVELS.extreme;
}

// =============================================================================
// 자세 문제 감지 함수
// =============================================================================

/**
 * 어깨 불균형 감지
 */
function detectShoulderImbalance(landmarks: Landmark33[]): PostureIssue | null {
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];

  if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
    return null;
  }

  const tilt = Math.abs(calculateHorizontalTilt(leftShoulder, rightShoulder));

  if (tilt <= POSTURE_THRESHOLDS.shoulderTiltMax) {
    return null;
  }

  const severity = calculateSeverity(tilt, [3, 5, 8, 12]);
  const higherSide = leftShoulder.y < rightShoulder.y ? '왼쪽' : '오른쪽';

  return {
    type: 'shoulder-imbalance',
    severity,
    description: `${higherSide} 어깨가 ${tilt.toFixed(1)}도 높습니다`,
    exercises: POSTURE_EXERCISES['shoulder-imbalance'],
  };
}

/**
 * 골반 불균형 감지
 */
function detectHipImbalance(landmarks: Landmark33[]): PostureIssue | null {
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];

  if (leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
    return null;
  }

  const tilt = Math.abs(calculateHorizontalTilt(leftHip, rightHip));

  if (tilt <= POSTURE_THRESHOLDS.hipTiltMax) {
    return null;
  }

  const severity = calculateSeverity(tilt, [3, 5, 8, 12]);
  const higherSide = leftHip.y < rightHip.y ? '왼쪽' : '오른쪽';

  return {
    type: 'hip-imbalance',
    severity,
    description: `${higherSide} 골반이 ${tilt.toFixed(1)}도 높습니다`,
    exercises: POSTURE_EXERCISES['hip-imbalance'],
  };
}

/**
 * 거북목 감지
 *
 * @description
 * 정면 사진에서 거북목을 정확히 판단하기 어렵지만,
 * 코와 귀의 상대적 위치로 추정 가능
 */
function detectForwardHead(landmarks: Landmark33[]): PostureIssue | null {
  const nose = landmarks[POSE_LANDMARK_INDEX.NOSE];
  const leftEar = landmarks[POSE_LANDMARK_INDEX.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDEX.RIGHT_EAR];

  // 가시성 체크
  if (nose.visibility < 0.5) return null;
  if (leftEar.visibility < 0.3 && rightEar.visibility < 0.3) return null;

  // 더 잘 보이는 귀 사용
  const ear = leftEar.visibility > rightEar.visibility ? leftEar : rightEar;

  // 정면 사진에서 코가 귀보다 앞에 있으면 거북목 의심
  // z좌표 활용 (코의 z가 귀보다 작으면 앞에 있음)
  const zDiff = ear.z - nose.z;

  // 임계값 확인 (z 차이가 클수록 앞으로 나와있음)
  if (zDiff < POSTURE_THRESHOLDS.forwardHeadThreshold) {
    return null;
  }

  const severity = calculateSeverity(zDiff, [0.02, 0.04, 0.06, 0.08]);

  return {
    type: 'forward-head',
    severity,
    description: '머리가 앞으로 나와 있습니다 (거북목 의심)',
    exercises: POSTURE_EXERCISES['forward-head'],
  };
}

/**
 * 굽은 어깨 감지
 */
function detectRoundedShoulders(landmarks: Landmark33[]): PostureIssue | null {
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftEar = landmarks[POSE_LANDMARK_INDEX.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDEX.RIGHT_EAR];

  // 가시성 체크
  const shoulderVisible = leftShoulder.visibility > 0.5 || rightShoulder.visibility > 0.5;
  const earVisible = leftEar.visibility > 0.3 || rightEar.visibility > 0.3;

  if (!shoulderVisible || !earVisible) return null;

  // 어깨 중심
  const shoulderMid = calculateMidpoint(leftShoulder, rightShoulder);

  // 귀 중심 (더 잘 보이는 쪽)
  const ear = leftEar.visibility > rightEar.visibility ? leftEar : rightEar;

  // 정면에서 어깨의 z좌표가 귀보다 앞에 있으면 굽은 어깨
  const zDiff = ear.z - shoulderMid.z;

  if (zDiff < POSTURE_THRESHOLDS.roundedShoulderThreshold) {
    return null;
  }

  const severity = calculateSeverity(zDiff, [0.02, 0.04, 0.06, 0.08]);

  return {
    type: 'rounded-shoulders',
    severity,
    description: '어깨가 앞으로 굽어 있습니다',
    exercises: POSTURE_EXERCISES['rounded-shoulders'],
  };
}

/**
 * 요추전만 (과도한 허리 곡선) 감지
 *
 * @description
 * 측면 사진이 아니면 정확한 판단이 어려움
 * 정면 사진에서는 골반 기울기로 간접 추정
 */
function detectLordosis(landmarks: Landmark33[]): PostureIssue | null {
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARK_INDEX.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARK_INDEX.RIGHT_KNEE];

  // 가시성 체크
  const hipVisible = leftHip.visibility > 0.5 && rightHip.visibility > 0.5;
  const kneeVisible = leftKnee.visibility > 0.5 && rightKnee.visibility > 0.5;

  if (!hipVisible || !kneeVisible) return null;

  const hipMid = calculateMidpoint(leftHip, rightHip);
  const kneeMid = calculateMidpoint(leftKnee, rightKnee);

  // 골반이 무릎보다 과도하게 앞에 있으면 요추전만 의심
  const zDiff = kneeMid.z - hipMid.z;

  if (zDiff < 0.03) {
    return null;
  }

  const severity = calculateSeverity(zDiff, [0.03, 0.05, 0.07, 0.1]);

  return {
    type: 'lordosis',
    severity,
    description: '허리가 과도하게 젖혀져 있습니다 (요추전만 의심)',
    exercises: POSTURE_EXERCISES.lordosis,
  };
}

/**
 * 흉추후만 (등이 굽은) 감지
 */
function detectKyphosis(landmarks: Landmark33[]): PostureIssue | null {
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  const nose = landmarks[POSE_LANDMARK_INDEX.NOSE];

  // 가시성 체크
  if (
    leftShoulder.visibility < 0.5 ||
    rightShoulder.visibility < 0.5 ||
    leftHip.visibility < 0.5 ||
    rightHip.visibility < 0.5 ||
    nose.visibility < 0.5
  ) {
    return null;
  }

  const shoulderMid = calculateMidpoint(leftShoulder, rightShoulder);
  const hipMid = calculateMidpoint(leftHip, rightHip);

  // 어깨가 코와 힙을 잇는 선보다 뒤에 있으면 흉추후만
  // 정면 사진에서는 z좌표 비교
  const expectedZ = (nose.z + hipMid.z) / 2;
  const zDiff = shoulderMid.z - expectedZ;

  if (zDiff < 0.02) {
    return null;
  }

  const severity = calculateSeverity(zDiff, [0.02, 0.04, 0.06, 0.08]);

  return {
    type: 'kyphosis',
    severity,
    description: '등이 굽어 있습니다 (흉추후만 의심)',
    exercises: POSTURE_EXERCISES.kyphosis,
  };
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 자세 분석
 *
 * @description
 * MediaPipe Pose 랜드마크에서 자세 문제를 감지하고 분석 결과를 반환합니다.
 *
 * 분석 항목:
 * - 어깨 기울기
 * - 골반 기울기
 * - 척추 정렬 점수
 * - 머리 위치
 * - 자세 문제점 목록
 *
 * @param poseResult - Pose 검출 결과
 * @returns 자세 분석 결과
 *
 * @example
 * const posture = analyzePosture(poseResult);
 * if (posture.issues.length > 0) {
 *   console.log('자세 문제:', posture.issues);
 * }
 */
export function analyzePosture(poseResult: PoseDetectionResult): PostureAnalysis {
  const { landmarks } = poseResult;

  // 기본 랜드마크 추출
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  const nose = landmarks[POSE_LANDMARK_INDEX.NOSE];
  const leftEar = landmarks[POSE_LANDMARK_INDEX.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDEX.RIGHT_EAR];

  // 어깨 기울기 계산
  let shoulderTilt = 0;
  if (leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
    shoulderTilt = calculateHorizontalTilt(leftShoulder, rightShoulder);
  }

  // 골반 기울기 계산
  let hipTilt = 0;
  if (leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
    hipTilt = calculateHorizontalTilt(leftHip, rightHip);
  }

  // 척추 정렬 점수 계산 (0-100)
  const shoulderMid = calculateMidpoint(leftShoulder, rightShoulder);
  const hipMid = calculateMidpoint(leftHip, rightHip);

  // 어깨 중심과 힙 중심의 x좌표 차이로 정렬 점수 계산
  const xAlignment = Math.abs(shoulderMid.x - hipMid.x);
  const spineAlignment = Math.max(0, Math.min(100, 100 - xAlignment * 500));

  // 머리 위치 판단
  let headPosition: 'forward' | 'neutral' | 'backward' = 'neutral';
  if (nose.visibility > 0.5 && (leftEar.visibility > 0.3 || rightEar.visibility > 0.3)) {
    const ear = leftEar.visibility > rightEar.visibility ? leftEar : rightEar;
    const zDiff = ear.z - nose.z;

    if (zDiff > 0.02) {
      headPosition = 'forward';
    } else if (zDiff < -0.02) {
      headPosition = 'backward';
    }
  }

  // 자세 문제 감지
  const issues: PostureIssue[] = [];

  const shoulderIssue = detectShoulderImbalance(landmarks);
  if (shoulderIssue) issues.push(shoulderIssue);

  const hipIssue = detectHipImbalance(landmarks);
  if (hipIssue) issues.push(hipIssue);

  const forwardHeadIssue = detectForwardHead(landmarks);
  if (forwardHeadIssue) issues.push(forwardHeadIssue);

  const roundedShoulderIssue = detectRoundedShoulders(landmarks);
  if (roundedShoulderIssue) issues.push(roundedShoulderIssue);

  const lordosisIssue = detectLordosis(landmarks);
  if (lordosisIssue) issues.push(lordosisIssue);

  const kyphosisIssue = detectKyphosis(landmarks);
  if (kyphosisIssue) issues.push(kyphosisIssue);

  return {
    shoulderTilt: Math.round(shoulderTilt * 10) / 10,
    hipTilt: Math.round(hipTilt * 10) / 10,
    spineAlignment: Math.round(spineAlignment),
    headPosition,
    issues,
  };
}

/**
 * 자세 문제 라벨 조회
 *
 * @param issueType - 자세 문제 유형
 * @returns 한국어 라벨
 */
export function getPostureIssueLabel(issueType: PostureIssue['type']): string {
  return POSTURE_ISSUE_LABELS[issueType];
}

/**
 * 자세 점수 계산
 *
 * @description 전체 자세 상태를 0-100 점수로 반환합니다.
 *
 * @param analysis - 자세 분석 결과
 * @returns 자세 점수 (0-100, 높을수록 좋음)
 */
export function calculatePostureScore(analysis: PostureAnalysis): number {
  let score = 100;

  // 어깨 기울기 감점 (최대 15점)
  score -= Math.min(15, Math.abs(analysis.shoulderTilt) * 3);

  // 골반 기울기 감점 (최대 15점)
  score -= Math.min(15, Math.abs(analysis.hipTilt) * 3);

  // 척추 정렬 반영 (20점)
  score -= (100 - analysis.spineAlignment) * 0.2;

  // 머리 위치 감점
  if (analysis.headPosition !== 'neutral') {
    score -= 10;
  }

  // 자세 문제별 감점
  for (const issue of analysis.issues) {
    score -= issue.severity * 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 우선 교정 필요 문제 추출
 *
 * @description 심각도가 높은 순으로 정렬된 자세 문제 목록을 반환합니다.
 *
 * @param analysis - 자세 분석 결과
 * @param limit - 최대 개수 (기본 3)
 * @returns 우선순위가 높은 자세 문제 목록
 */
export function getPriorityIssues(
  analysis: PostureAnalysis,
  limit = 3
): PostureIssue[] {
  return [...analysis.issues]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);
}

/**
 * 종합 교정 운동 추천
 *
 * @description 감지된 모든 자세 문제에 대한 교정 운동을 통합하여 반환합니다.
 *
 * @param analysis - 자세 분석 결과
 * @returns 중복 제거된 추천 운동 목록
 */
export function getRecommendedExercises(analysis: PostureAnalysis): string[] {
  const allExercises = analysis.issues.flatMap((issue) => issue.exercises);

  // 중복 제거
  return [...new Set(allExercises)];
}

/**
 * 자세 요약 텍스트 생성
 *
 * @description 자세 분석 결과를 사람이 읽기 쉬운 요약 문구로 반환합니다.
 *
 * @param analysis - 자세 분석 결과
 * @returns 요약 텍스트
 */
export function generatePostureSummary(analysis: PostureAnalysis): string {
  const score = calculatePostureScore(analysis);

  if (score >= 90) {
    return '전반적으로 균형 잡힌 자세입니다. 현재 상태를 유지하세요!';
  }

  if (score >= 70) {
    const mainIssue = analysis.issues[0];
    if (mainIssue) {
      return `${getPostureIssueLabel(mainIssue.type)}이(가) 감지되었습니다. 가벼운 스트레칭을 권장합니다.`;
    }
    return '약간의 자세 개선이 필요합니다.';
  }

  if (score >= 50) {
    return `${analysis.issues.length}가지 자세 문제가 감지되었습니다. 교정 운동을 권장합니다.`;
  }

  return '자세 교정이 필요합니다. 전문가 상담을 권장합니다.';
}
