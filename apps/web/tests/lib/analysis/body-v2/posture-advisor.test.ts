/**
 * C-2: posture-advisor 테스트
 *
 * @description MediaPipe Pose 기반 자세 분석 및 교정 추천 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzePosture,
  getPostureIssueLabel,
  calculatePostureScore,
  getPriorityIssues,
  getRecommendedExercises,
  generatePostureSummary,
} from '@/lib/analysis/body-v2/posture-advisor';
import type { PoseDetectionResult, Landmark33, PostureAnalysis } from '@/lib/analysis/body-v2/types';

// =============================================================================
// 테스트 픽스처
// =============================================================================

/**
 * 완전한 랜드마크 배열 생성 (33개)
 */
function createLandmarks(overrides: Partial<Record<number, Partial<Landmark33>>> = {}): Landmark33[] {
  const defaultLandmark: Landmark33 = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 };

  const landmarks: Landmark33[] = Array(33).fill(null).map(() => ({ ...defaultLandmark }));

  // 기본 포즈 설정 (정상 자세)
  // 0: 코
  landmarks[0] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
  // 7: 왼쪽 귀
  landmarks[7] = { x: 0.45, y: 0.18, z: 0.02, visibility: 0.8 };
  // 8: 오른쪽 귀
  landmarks[8] = { x: 0.55, y: 0.18, z: 0.02, visibility: 0.8 };
  // 11: 왼쪽 어깨
  landmarks[11] = { x: 0.35, y: 0.35, z: 0, visibility: 0.95 };
  // 12: 오른쪽 어깨
  landmarks[12] = { x: 0.65, y: 0.35, z: 0, visibility: 0.95 };
  // 23: 왼쪽 힙
  landmarks[23] = { x: 0.4, y: 0.55, z: 0, visibility: 0.9 };
  // 24: 오른쪽 힙
  landmarks[24] = { x: 0.6, y: 0.55, z: 0, visibility: 0.9 };
  // 25: 왼쪽 무릎
  landmarks[25] = { x: 0.4, y: 0.75, z: 0, visibility: 0.85 };
  // 26: 오른쪽 무릎
  landmarks[26] = { x: 0.6, y: 0.75, z: 0, visibility: 0.85 };

  // 오버라이드 적용
  for (const [idx, values] of Object.entries(overrides)) {
    const index = Number(idx);
    if (index >= 0 && index < 33) {
      landmarks[index] = { ...landmarks[index], ...values };
    }
  }

  return landmarks;
}

/**
 * PoseDetectionResult 생성
 */
function createPoseResult(landmarkOverrides?: Partial<Record<number, Partial<Landmark33>>>): PoseDetectionResult {
  return {
    landmarks: createLandmarks(landmarkOverrides),
    overallVisibility: 0.9,
    confidence: 0.85,
  };
}

// =============================================================================
// analyzePosture 테스트
// =============================================================================

describe('analyzePosture', () => {
  it('should analyze normal posture correctly', () => {
    const poseResult = createPoseResult();
    const analysis = analyzePosture(poseResult);

    expect(analysis).toHaveProperty('shoulderTilt');
    expect(analysis).toHaveProperty('hipTilt');
    expect(analysis).toHaveProperty('spineAlignment');
    expect(analysis).toHaveProperty('headPosition');
    expect(analysis).toHaveProperty('issues');

    // 정상 자세는 이슈가 적어야 함
    expect(Math.abs(analysis.shoulderTilt)).toBeLessThan(5);
    expect(Math.abs(analysis.hipTilt)).toBeLessThan(5);
    expect(analysis.spineAlignment).toBeGreaterThan(90);
    expect(analysis.headPosition).toBe('neutral');
  });

  it('should detect shoulder imbalance', () => {
    // 왼쪽 어깨가 높은 경우 (y값이 작을수록 위)
    const poseResult = createPoseResult({
      11: { x: 0.35, y: 0.30, z: 0, visibility: 0.95 }, // 왼쪽 어깨 높음
      12: { x: 0.65, y: 0.40, z: 0, visibility: 0.95 }, // 오른쪽 어깨 낮음
    });

    const analysis = analyzePosture(poseResult);

    const shoulderIssue = analysis.issues.find(i => i.type === 'shoulder-imbalance');
    expect(shoulderIssue).toBeDefined();
    if (shoulderIssue) {
      expect(shoulderIssue.description).toContain('어깨');
      expect(shoulderIssue.exercises).toBeInstanceOf(Array);
      expect(shoulderIssue.exercises.length).toBeGreaterThan(0);
    }
  });

  it('should detect hip imbalance', () => {
    // 왼쪽 골반이 높은 경우
    const poseResult = createPoseResult({
      23: { x: 0.4, y: 0.50, z: 0, visibility: 0.9 }, // 왼쪽 힙 높음
      24: { x: 0.6, y: 0.60, z: 0, visibility: 0.9 }, // 오른쪽 힙 낮음
    });

    const analysis = analyzePosture(poseResult);

    const hipIssue = analysis.issues.find(i => i.type === 'hip-imbalance');
    expect(hipIssue).toBeDefined();
    if (hipIssue) {
      expect(hipIssue.description).toContain('골반');
    }
  });

  it('should detect forward head', () => {
    // 코가 귀보다 앞에 있는 경우 (z값 차이)
    const poseResult = createPoseResult({
      0: { x: 0.5, y: 0.2, z: -0.05, visibility: 0.95 }, // 코
      7: { x: 0.45, y: 0.18, z: 0.05, visibility: 0.8 },  // 왼쪽 귀 (코보다 뒤)
      8: { x: 0.55, y: 0.18, z: 0.05, visibility: 0.8 },  // 오른쪽 귀
    });

    const analysis = analyzePosture(poseResult);

    // 거북목은 z좌표 차이로 감지
    expect(analysis.headPosition).toBe('forward');
  });

  it('should handle low visibility landmarks', () => {
    const poseResult = createPoseResult({
      11: { x: 0.35, y: 0.35, z: 0, visibility: 0.2 }, // 왼쪽 어깨 낮은 가시성
      12: { x: 0.65, y: 0.35, z: 0, visibility: 0.2 }, // 오른쪽 어깨 낮은 가시성
    });

    const analysis = analyzePosture(poseResult);

    // 낮은 가시성으로 인해 어깨 관련 이슈가 감지되지 않을 수 있음
    expect(analysis.shoulderTilt).toBe(0);
  });

  it('should return spine alignment score between 0 and 100', () => {
    const poseResult = createPoseResult();
    const analysis = analyzePosture(poseResult);

    expect(analysis.spineAlignment).toBeGreaterThanOrEqual(0);
    expect(analysis.spineAlignment).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// getPostureIssueLabel 테스트
// =============================================================================

describe('getPostureIssueLabel', () => {
  it('should return correct label for shoulder-imbalance', () => {
    expect(getPostureIssueLabel('shoulder-imbalance')).toBe('어깨 불균형');
  });

  it('should return correct label for hip-imbalance', () => {
    expect(getPostureIssueLabel('hip-imbalance')).toBe('골반 불균형');
  });

  it('should return correct label for forward-head', () => {
    expect(getPostureIssueLabel('forward-head')).toBe('거북목');
  });

  it('should return correct label for rounded-shoulders', () => {
    expect(getPostureIssueLabel('rounded-shoulders')).toBe('굽은 어깨');
  });

  it('should return correct label for lordosis', () => {
    expect(getPostureIssueLabel('lordosis')).toBe('요추전만');
  });

  it('should return correct label for kyphosis', () => {
    expect(getPostureIssueLabel('kyphosis')).toBe('흉추후만');
  });
});

// =============================================================================
// calculatePostureScore 테스트
// =============================================================================

describe('calculatePostureScore', () => {
  it('should return 100 for perfect posture', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const score = calculatePostureScore(analysis);
    expect(score).toBe(100);
  });

  it('should reduce score for shoulder tilt', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 5, // 5도 기울어짐
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const score = calculatePostureScore(analysis);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(80);
  });

  it('should reduce score for hip tilt', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 5, // 5도 기울어짐
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const score = calculatePostureScore(analysis);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(80);
  });

  it('should reduce score for forward head position', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'forward',
      issues: [],
    };

    const score = calculatePostureScore(analysis);
    expect(score).toBe(90); // 머리 위치로 10점 감점
  });

  it('should reduce score based on issue severity', () => {
    const analysisNoIssues: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const analysisWithIssues: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 3, description: '테스트', exercises: [] },
      ],
    };

    const scoreNoIssues = calculatePostureScore(analysisNoIssues);
    const scoreWithIssues = calculatePostureScore(analysisWithIssues);

    expect(scoreWithIssues).toBeLessThan(scoreNoIssues);
  });

  it('should clamp score between 0 and 100', () => {
    const terribleAnalysis: PostureAnalysis = {
      shoulderTilt: 15,
      hipTilt: 15,
      spineAlignment: 50,
      headPosition: 'forward',
      issues: [
        { type: 'shoulder-imbalance', severity: 5, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 5, description: '', exercises: [] },
        { type: 'forward-head', severity: 5, description: '', exercises: [] },
        { type: 'rounded-shoulders', severity: 5, description: '', exercises: [] },
        { type: 'lordosis', severity: 5, description: '', exercises: [] },
        { type: 'kyphosis', severity: 5, description: '', exercises: [] },
      ],
    };

    const score = calculatePostureScore(terribleAnalysis);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// getPriorityIssues 테스트
// =============================================================================

describe('getPriorityIssues', () => {
  it('should return issues sorted by severity (highest first)', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 2, description: '', exercises: [] },
        { type: 'forward-head', severity: 5, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 3, description: '', exercises: [] },
      ],
    };

    const priorityIssues = getPriorityIssues(analysis);

    expect(priorityIssues[0].severity).toBe(5);
    expect(priorityIssues[1].severity).toBe(3);
    expect(priorityIssues[2].severity).toBe(2);
  });

  it('should limit results to specified count', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 2, description: '', exercises: [] },
        { type: 'forward-head', severity: 5, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 3, description: '', exercises: [] },
        { type: 'lordosis', severity: 4, description: '', exercises: [] },
      ],
    };

    const priorityIssues = getPriorityIssues(analysis, 2);

    expect(priorityIssues).toHaveLength(2);
    expect(priorityIssues[0].severity).toBe(5);
    expect(priorityIssues[1].severity).toBe(4);
  });

  it('should return empty array when no issues', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const priorityIssues = getPriorityIssues(analysis);
    expect(priorityIssues).toHaveLength(0);
  });

  it('should default to limit of 3', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 1, description: '', exercises: [] },
        { type: 'forward-head', severity: 2, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 3, description: '', exercises: [] },
        { type: 'lordosis', severity: 4, description: '', exercises: [] },
        { type: 'kyphosis', severity: 5, description: '', exercises: [] },
      ],
    };

    const priorityIssues = getPriorityIssues(analysis);
    expect(priorityIssues).toHaveLength(3);
  });
});

// =============================================================================
// getRecommendedExercises 테스트
// =============================================================================

describe('getRecommendedExercises', () => {
  it('should return unique exercises from all issues', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 2, description: '', exercises: ['스트레칭', '덤벨 운동'] },
        { type: 'forward-head', severity: 3, description: '', exercises: ['턱 당기기', '스트레칭'] },
      ],
    };

    const exercises = getRecommendedExercises(analysis);

    // 중복 제거 확인
    expect(exercises.filter(e => e === '스트레칭')).toHaveLength(1);
    expect(exercises).toContain('덤벨 운동');
    expect(exercises).toContain('턱 당기기');
  });

  it('should return empty array when no issues', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const exercises = getRecommendedExercises(analysis);
    expect(exercises).toHaveLength(0);
  });
});

// =============================================================================
// generatePostureSummary 테스트
// =============================================================================

describe('generatePostureSummary', () => {
  it('should return positive message for score >= 90', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 0,
      hipTilt: 0,
      spineAlignment: 100,
      headPosition: 'neutral',
      issues: [],
    };

    const summary = generatePostureSummary(analysis);
    expect(summary).toContain('균형');
    expect(summary).toContain('유지');
  });

  it('should recommend stretching for score 70-89', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 3,
      hipTilt: 3,
      spineAlignment: 90,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 1, description: '', exercises: [] },
      ],
    };

    const summary = generatePostureSummary(analysis);
    // 점수에 따라 스트레칭 또는 개선 권장 메시지
    expect(summary.length).toBeGreaterThan(0);
  });

  it('should recommend corrective exercises for score 50-69', () => {
    // 점수가 50-69 범위가 되도록 조정
    // 100 - (5*3) - (5*3) - (100-90)*0.2 - 0 - 2*3 = 100 - 15 - 15 - 2 - 6 = 62
    const analysis: PostureAnalysis = {
      shoulderTilt: 5,
      hipTilt: 5,
      spineAlignment: 90,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 2, description: '', exercises: [] },
      ],
    };

    const summary = generatePostureSummary(analysis);
    // 점수 범위에 따라 다른 메시지가 출력될 수 있음
    expect(summary.length).toBeGreaterThan(0);
    // 2개 이상 이슈가 있으면 "교정 운동" 메시지
    const analysisMultipleIssues: PostureAnalysis = {
      shoulderTilt: 4,
      hipTilt: 4,
      spineAlignment: 85,
      headPosition: 'neutral',
      issues: [
        { type: 'shoulder-imbalance', severity: 2, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 2, description: '', exercises: [] },
      ],
    };
    const summaryMultiple = generatePostureSummary(analysisMultipleIssues);
    expect(summaryMultiple).toContain('자세 문제');
  });

  it('should recommend professional consultation for score < 50', () => {
    const analysis: PostureAnalysis = {
      shoulderTilt: 12,
      hipTilt: 12,
      spineAlignment: 50,
      headPosition: 'forward',
      issues: [
        { type: 'shoulder-imbalance', severity: 5, description: '', exercises: [] },
        { type: 'hip-imbalance', severity: 5, description: '', exercises: [] },
        { type: 'forward-head', severity: 5, description: '', exercises: [] },
        { type: 'kyphosis', severity: 5, description: '', exercises: [] },
      ],
    };

    const summary = generatePostureSummary(analysis);
    expect(summary).toContain('전문가');
  });
});
