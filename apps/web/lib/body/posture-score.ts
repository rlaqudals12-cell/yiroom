/**
 * 자세 점수 계산 모듈 (C-2)
 *
 * @description P2 준수: docs/principles/body-mechanics.md 섹션 4 기반
 * @module lib/body
 *
 * CVA, Cobb 각도, 흉추 후만각, 골반 기울기를 기반으로 종합 자세 점수를 계산한다.
 *
 * 주요 기준값:
 * - CVA (두개척추각): 정상 > 50°, 경도 40-50°, 중등도 30-40°, 심각 < 30°
 * - Cobb 각도 (척추측만증): 정상 < 10°, 경도 10-25°, 중등도 25-40°, 심각 > 40°
 * - 흉추 후만각: 정상 20-40°, 과다후만 > 40°
 * - 골반 기울기: 정상 남 4-10°, 여 7-15°, 과전방경사 > 15°
 */

import type {
  PostureMetrics,
  PostureScoreResult,
  PostureLevel,
  CVASeverity,
  CobbSeverity,
} from './types';

// ============================================
// 상수 정의
// ============================================

/**
 * 가중치 (원리 문서 섹션 4.3)
 * CVA가 가장 중요한 지표이므로 0.30, 나머지는 유사한 중요도
 */
const WEIGHTS = {
  cva: 0.30,
  thoracicKyphosis: 0.25,
  pelvicTilt: 0.25,
  spineSymmetry: 0.20,
} as const;

/**
 * CVA 기준값 (원리 문서 섹션 4.2)
 *
 * 정상: > 50° (건강한 경추 전만)
 * 경도: 40-50° (경미한 전방두부자세)
 * 중등도: 30-40° (중등도 거북목)
 * 심각: < 30° (심각한 거북목, 의료 상담 권장)
 */
const CVA_THRESHOLDS = {
  normal: 50,      // 정상 기준
  mild: 40,        // 경도 기준
  moderate: 30,    // 중등도 기준
  optimal: 55,     // 최적값 (100점 기준)
  maxNormal: 65,   // 정상 범위 상한
} as const;

/**
 * Cobb 각도 기준값 (원리 문서 섹션 4.2)
 *
 * 정상: < 10° (척추 대칭)
 * 경도: 10-25° (경미한 측만)
 * 중등도: 25-40° (중등도 측만, 추적 관찰)
 * 심각: > 40° (심각한 측만, 전문의 상담)
 */
const COBB_THRESHOLDS = {
  normal: 10,
  mild: 25,
  moderate: 40,
} as const;

/**
 * 흉추 후만각 기준값 (원리 문서 섹션 4.1)
 *
 * 정상 범위: 20-40°
 * 최적값: 30°
 */
const KYPHOSIS_THRESHOLDS = {
  minNormal: 20,
  maxNormal: 40,
  optimal: 30,
} as const;

/**
 * 골반 기울기 기준값 (원리 문서 섹션 4.1)
 *
 * 정상 범위: 4-15° (성별 차이 있으나 통합 적용)
 * 최적값: 10°
 * 과전방경사: > 15°
 */
const PELVIC_THRESHOLDS = {
  minNormal: 4,
  maxNormal: 15,
  optimal: 10,
} as const;

/**
 * 자세 등급 기준 (종합 점수 기반)
 */
const LEVEL_THRESHOLDS = {
  excellent: 90,  // A (우수)
  good: 80,       // B (양호)
  fair: 70,       // C (보통)
  poor: 0,        // D 이하 (주의/위험)
} as const;

// ============================================
// CVA 점수 계산
// ============================================

/**
 * CVA 심각도 분류
 *
 * @description 원리 문서 섹션 4.2 기준
 *
 * @param cvaAngle - CVA 각도 (도)
 * @returns CVA 심각도 등급
 */
export function classifyCVASeverity(cvaAngle: number): CVASeverity {
  if (cvaAngle >= CVA_THRESHOLDS.normal) {
    return 'normal';
  }
  if (cvaAngle >= CVA_THRESHOLDS.mild) {
    return 'mild';
  }
  if (cvaAngle >= CVA_THRESHOLDS.moderate) {
    return 'moderate';
  }
  return 'severe';
}

/**
 * CVA 점수 계산 (0-100)
 *
 * @description
 * - 정상 범위 (48-65°): 최적값(55°)에서 멀어질수록 감점
 * - 정상 미만 (< 48°): 70점 기준에서 차이만큼 대폭 감점
 * - 정상 초과 (> 65°): 과신전으로 감점 (드문 케이스)
 *
 * 원리 문서 섹션 4.3의 알고리즘을 그대로 구현
 *
 * @param cvaAngle - CVA 각도 (도)
 * @returns CVA 점수 (0-100)
 */
export function calculateCVAScore(cvaAngle: number): number {
  // 입력값 검증: CVA는 일반적으로 0-90° 범위
  if (cvaAngle < 0) {
    return 0;
  }

  const normalMin = 48;   // 정상 범위 하한 (원리 문서)
  const normalMax = CVA_THRESHOLDS.maxNormal;
  const optimal = CVA_THRESHOLDS.optimal;

  // 정상 범위 미만: 거북목 - 심각도에 따라 감점
  if (cvaAngle < normalMin) {
    // 70점 기준에서 차이만큼 5점씩 감점
    const score = Math.max(0, 70 - (normalMin - cvaAngle) * 5);
    return Math.round(score);
  }

  // 정상 범위 초과: 과신전 - 드물지만 처리
  if (cvaAngle > normalMax) {
    const score = Math.max(0, 70 - (cvaAngle - normalMax) * 5);
    return Math.round(score);
  }

  // 정상 범위 내: 최적값에서 멀어질수록 감점
  // 최적값(55°)에서 1° 차이당 2점 감점
  const score = 100 - Math.abs(cvaAngle - optimal) * 2;
  return Math.round(Math.max(0, score));
}

// ============================================
// 척추 대칭성 (Cobb 각도) 점수 계산
// ============================================

/**
 * Cobb 각도 심각도 분류
 *
 * @description 원리 문서 섹션 4.2 기준
 *
 * @param cobbAngle - Cobb 각도 (도)
 * @returns Cobb 심각도 등급
 */
export function classifyCobbSeverity(cobbAngle: number): CobbSeverity {
  if (cobbAngle < COBB_THRESHOLDS.normal) {
    return 'normal';
  }
  if (cobbAngle < COBB_THRESHOLDS.mild) {
    return 'mild';
  }
  if (cobbAngle < COBB_THRESHOLDS.moderate) {
    return 'moderate';
  }
  return 'severe';
}

/**
 * 척추 대칭성 점수 계산 (0-100)
 *
 * @description
 * spineSymmetry는 0-1 범위의 대칭성 지표
 * 1.0 = 완전 대칭 (Cobb 0°), 0.0 = 심각한 비대칭
 *
 * Cobb 각도에서 대칭성으로 변환하는 공식:
 * symmetry = 1 - (cobbAngle / 90)  (90°가 최대 비대칭이라 가정)
 *
 * @param cobbAngle - Cobb 각도 (도)
 * @returns 척추 대칭성 점수 (0-100)
 */
export function calculateSpineSymmetryScore(cobbAngle: number): number {
  // 입력값 검증
  if (cobbAngle < 0) {
    return 100;  // 음수 각도는 정상으로 처리
  }

  // Cobb 각도를 대칭성 점수로 변환
  // 정상 (< 10°): 높은 점수
  // 경도 (10-25°): 중간 점수
  // 중등도 (25-40°): 낮은 점수
  // 심각 (> 40°): 매우 낮은 점수

  if (cobbAngle < COBB_THRESHOLDS.normal) {
    // 정상: 90-100점
    return Math.round(100 - cobbAngle);
  }

  if (cobbAngle < COBB_THRESHOLDS.mild) {
    // 경도: 65-90점 (10-25° 범위)
    const range = COBB_THRESHOLDS.mild - COBB_THRESHOLDS.normal;
    const offset = cobbAngle - COBB_THRESHOLDS.normal;
    return Math.round(90 - (offset / range) * 25);
  }

  if (cobbAngle < COBB_THRESHOLDS.moderate) {
    // 중등도: 40-65점 (25-40° 범위)
    const range = COBB_THRESHOLDS.moderate - COBB_THRESHOLDS.mild;
    const offset = cobbAngle - COBB_THRESHOLDS.mild;
    return Math.round(65 - (offset / range) * 25);
  }

  // 심각: 0-40점 (40° 이상)
  // 60°에서 0점에 도달
  const score = Math.max(0, 40 - (cobbAngle - COBB_THRESHOLDS.moderate) * 2);
  return Math.round(score);
}

// ============================================
// 흉추 후만각 점수 계산
// ============================================

/**
 * 흉추 후만각 점수 계산 (0-100)
 *
 * @description
 * - 정상 범위 (20-40°): 최적값(30°)에서 멀어질수록 감점
 * - 과다 후만 (> 40°): 70점 기준에서 차이만큼 대폭 감점 (굽은등)
 * - 과소 후만 (< 20°): 70점 기준에서 감점 (일자등)
 *
 * 원리 문서 섹션 4.3의 알고리즘 구현
 *
 * @param kyphosisAngle - 흉추 후만각 (도)
 * @returns 흉추 후만 점수 (0-100)
 */
export function calculateKyphosisScore(kyphosisAngle: number): number {
  // 입력값 검증
  if (kyphosisAngle < 0) {
    return 0;
  }

  const { minNormal, maxNormal, optimal } = KYPHOSIS_THRESHOLDS;

  // 과다 후만 (굽은등): > 40°
  if (kyphosisAngle > maxNormal) {
    // 70점 기준에서 차이당 3점 감점
    const score = Math.max(0, 70 - (kyphosisAngle - maxNormal) * 3);
    return Math.round(score);
  }

  // 과소 후만 (일자등): < 20°
  if (kyphosisAngle < minNormal) {
    // 70점 기준에서 차이당 3점 감점
    const score = Math.max(0, 70 - (minNormal - kyphosisAngle) * 3);
    return Math.round(score);
  }

  // 정상 범위 내: 최적값에서 멀어질수록 감점
  // 최적값(30°)에서 1° 차이당 2점 감점
  const score = 100 - Math.abs(kyphosisAngle - optimal) * 2;
  return Math.round(Math.max(0, score));
}

// ============================================
// 골반 기울기 점수 계산
// ============================================

/**
 * 골반 기울기 점수 계산 (0-100)
 *
 * @description
 * - 정상 범위 (4-15°): 최적값(10°)에서 멀어질수록 감점
 * - 과전방경사 (> 15°): 70점 기준에서 차이만큼 대폭 감점
 * - 후방경사 (< 4°): 감점 (드문 케이스)
 *
 * 원리 문서 섹션 4.3의 알고리즘 구현
 *
 * @param tiltAngle - 골반 기울기 (도)
 * @returns 골반 기울기 점수 (0-100)
 */
export function calculatePelvicTiltScore(tiltAngle: number): number {
  // 입력값 검증: 음수도 가능 (후방경사)
  const { minNormal, maxNormal, optimal } = PELVIC_THRESHOLDS;

  // 과전방경사: > 15°
  if (tiltAngle > maxNormal) {
    // 70점 기준에서 차이당 5점 감점
    const score = Math.max(0, 70 - (tiltAngle - maxNormal) * 5);
    return Math.round(score);
  }

  // 후방경사 또는 과소: < 4°
  if (tiltAngle < minNormal) {
    // 정상 범위 하한 미만: 감점하되 과전방경사보다 완화
    const score = Math.max(0, 80 - (minNormal - tiltAngle) * 3);
    return Math.round(score);
  }

  // 정상 범위 내: 최적값에서 멀어질수록 감점
  // 최적값(10°)에서 1° 차이당 3점 감점
  const score = 100 - Math.abs(tiltAngle - optimal) * 3;
  return Math.round(Math.max(0, score));
}

// ============================================
// 종합 자세 점수 계산
// ============================================

/**
 * 자세 등급 결정
 *
 * @param score - 종합 점수 (0-100)
 * @returns 자세 등급
 */
function determinePostureLevel(score: number): PostureLevel {
  if (score >= LEVEL_THRESHOLDS.excellent) {
    return 'excellent';
  }
  if (score >= LEVEL_THRESHOLDS.good) {
    return 'good';
  }
  if (score >= LEVEL_THRESHOLDS.fair) {
    return 'fair';
  }
  return 'poor';
}

/**
 * 개선 권장사항 생성
 *
 * @description 각 항목의 점수와 원인을 분석하여 권장사항 제공
 *
 * @param metrics - 자세 측정 메트릭
 * @param componentScores - 항목별 점수
 * @returns 권장사항 배열
 */
function generateRecommendations(
  metrics: PostureMetrics,
  componentScores: PostureScoreResult['componentScores']
): string[] {
  const recommendations: string[] = [];

  // CVA 기반 권장사항
  if (componentScores.cva < 70) {
    if (metrics.cva < CVA_THRESHOLDS.moderate) {
      recommendations.push('거북목이 심각합니다. 전문가 상담을 권장합니다.');
    } else if (metrics.cva < CVA_THRESHOLDS.mild) {
      recommendations.push('거북목 교정이 필요합니다. 턱당기기 운동을 추천합니다.');
    } else {
      recommendations.push('경추 자세 개선이 필요합니다. 스트레칭을 권장합니다.');
    }
  }

  // 흉추 후만각 기반 권장사항
  if (componentScores.kyphosis < 70) {
    if (metrics.thoracicKyphosis > KYPHOSIS_THRESHOLDS.maxNormal) {
      recommendations.push('굽은등(과다후만) 의심됩니다. 흉추 신전 운동을 권장합니다.');
    } else if (metrics.thoracicKyphosis < KYPHOSIS_THRESHOLDS.minNormal) {
      recommendations.push('일자등(과소후만) 의심됩니다. 전문가 상담을 권장합니다.');
    }
  }

  // 골반 기울기 기반 권장사항
  if (componentScores.pelvicTilt < 70) {
    if (metrics.pelvicTilt > PELVIC_THRESHOLDS.maxNormal) {
      recommendations.push('골반 전방경사 의심됩니다. 코어 강화 운동을 권장합니다.');
    } else if (metrics.pelvicTilt < PELVIC_THRESHOLDS.minNormal) {
      recommendations.push('골반 후방경사 의심됩니다. 장요근 스트레칭을 권장합니다.');
    }
  }

  // 척추 대칭성 기반 권장사항
  if (componentScores.spineSymmetry < 70) {
    // spineSymmetry를 Cobb 각도로 역산 (대략적)
    const estimatedCobb = (1 - metrics.spineSymmetry) * 45;
    if (estimatedCobb > COBB_THRESHOLDS.mild) {
      recommendations.push('척추측만 의심됩니다. 전문의 진단을 권장합니다.');
    } else {
      recommendations.push('척추 비대칭이 감지되었습니다. 정기적인 자세 점검을 권장합니다.');
    }
  }

  // 권장사항이 없으면 긍정적 메시지
  if (recommendations.length === 0) {
    recommendations.push('전반적으로 양호한 자세입니다. 현재 상태를 유지하세요.');
  }

  return recommendations;
}

/**
 * 종합 자세 점수 계산
 *
 * @description
 * 4가지 자세 메트릭을 가중치 기반으로 종합하여 0-100 점수 산출
 *
 * 가중치 (원리 문서 섹션 4.3):
 * - CVA: 30% (목 자세가 전체에 큰 영향)
 * - 흉추 후만각: 25%
 * - 골반 기울기: 25%
 * - 척추 대칭성: 20%
 *
 * @param metrics - 자세 측정 메트릭
 * @returns 종합 자세 점수 결과
 *
 * @example
 * const result = calculatePostureScore({
 *   cva: 45,              // 약간 거북목
 *   thoracicKyphosis: 35, // 정상 범위
 *   pelvicTilt: 12,       // 정상 범위
 *   spineSymmetry: 0.95,  // 대칭
 * });
 * // result.totalScore: 약 80점
 * // result.level: 'good'
 */
export function calculatePostureScore(metrics: PostureMetrics): PostureScoreResult {
  // 입력값 검증
  if (metrics.spineSymmetry < 0 || metrics.spineSymmetry > 1) {
    throw new Error('spineSymmetry는 0-1 범위여야 합니다.');
  }

  // 각 항목별 점수 계산
  const cvaScore = calculateCVAScore(metrics.cva);
  const kyphosisScore = calculateKyphosisScore(metrics.thoracicKyphosis);
  const pelvicTiltScore = calculatePelvicTiltScore(metrics.pelvicTilt);

  // spineSymmetry(0-1)를 Cobb 각도로 근사 변환하여 점수 계산
  // symmetry 1.0 = Cobb 0°, symmetry 0.0 = Cobb 45° (대략)
  const estimatedCobbAngle = (1 - metrics.spineSymmetry) * 45;
  const spineSymmetryScore = calculateSpineSymmetryScore(estimatedCobbAngle);

  // 가중 평균으로 종합 점수 계산
  const totalScore = Math.round(
    cvaScore * WEIGHTS.cva +
    kyphosisScore * WEIGHTS.thoracicKyphosis +
    pelvicTiltScore * WEIGHTS.pelvicTilt +
    spineSymmetryScore * WEIGHTS.spineSymmetry
  );

  const componentScores = {
    cva: cvaScore,
    kyphosis: kyphosisScore,
    pelvicTilt: pelvicTiltScore,
    spineSymmetry: spineSymmetryScore,
  };

  const level = determinePostureLevel(totalScore);
  const recommendations = generateRecommendations(metrics, componentScores);

  return {
    totalScore,
    componentScores,
    level,
    recommendations,
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * Cobb 각도를 척추 대칭성(0-1)으로 변환
 *
 * @description spineSymmetry 입력이 필요한 경우 Cobb 각도에서 변환
 *
 * @param cobbAngle - Cobb 각도 (도)
 * @returns 척추 대칭성 (0-1)
 */
export function cobbAngleToSymmetry(cobbAngle: number): number {
  // 45°를 최대 비대칭으로 간주
  const maxCobb = 45;
  const symmetry = 1 - Math.min(cobbAngle, maxCobb) / maxCobb;
  return Math.round(symmetry * 100) / 100;
}

/**
 * 척추 대칭성(0-1)을 Cobb 각도로 변환
 *
 * @param symmetry - 척추 대칭성 (0-1)
 * @returns Cobb 각도 (도)
 */
export function symmetryToCobbAngle(symmetry: number): number {
  const maxCobb = 45;
  return Math.round((1 - symmetry) * maxCobb * 10) / 10;
}
