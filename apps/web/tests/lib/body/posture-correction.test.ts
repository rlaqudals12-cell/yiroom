/**
 * 자세 교정 운동 추천 모듈 테스트
 *
 * @module tests/lib/body/posture-correction
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4.1 B-05
 */

import { describe, it, expect } from 'vitest';
import {
  POSTURE_ISSUES,
  CORRECTION_EXERCISES,
  getExercisesForIssue,
  getPostureCorrectionGuide,
  getPostureIssueDetail,
  getExerciseById,
  filterExercisesByDifficulty,
  getAllPostureIssues,
  getAllExercises,
  type PostureIssue,
  type CorrectionExercise,
} from '@/lib/body/posture-correction';
import type { BodyShape7 } from '@/lib/body/types';

// ============================================================================
// POSTURE_ISSUES 상수
// ============================================================================

describe('POSTURE_ISSUES', () => {
  it('should have all 10 posture issue types', () => {
    const issues: PostureIssue[] = [
      'forward_head',
      'rounded_shoulders',
      'kyphosis',
      'lordosis',
      'anterior_pelvic_tilt',
      'posterior_pelvic_tilt',
      'scoliosis',
      'flat_back',
      'uneven_shoulders',
      'leg_length_discrepancy',
    ];

    issues.forEach((issue) => {
      expect(POSTURE_ISSUES[issue]).toBeDefined();
    });
  });

  it('should have Korean names for all issues', () => {
    Object.values(POSTURE_ISSUES).forEach((issue) => {
      expect(issue.name).toBeDefined();
      expect(issue.name.length).toBeGreaterThan(0);
    });
  });

  it('should have valid exercise references', () => {
    Object.values(POSTURE_ISSUES).forEach((issue) => {
      issue.recommendedExerciseIds.forEach((id) => {
        expect(CORRECTION_EXERCISES[id]).toBeDefined();
      });
    });
  });

  it('should have causes and symptoms for each issue', () => {
    Object.values(POSTURE_ISSUES).forEach((issue) => {
      expect(issue.causes.length).toBeGreaterThan(0);
      expect(issue.symptoms.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CORRECTION_EXERCISES 상수
// ============================================================================

describe('CORRECTION_EXERCISES', () => {
  it('should have at least 20 exercises', () => {
    const exerciseCount = Object.keys(CORRECTION_EXERCISES).length;
    expect(exerciseCount).toBeGreaterThanOrEqual(20);
  });

  it('should have complete exercise information', () => {
    Object.values(CORRECTION_EXERCISES).forEach((exercise) => {
      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBeDefined();
      expect(exercise.description).toBeDefined();
      expect(exercise.targetArea).toBeDefined();
      expect(exercise.duration).toBeDefined();
      expect(exercise.frequency).toBeDefined();
      expect(exercise.steps.length).toBeGreaterThan(0);
      expect(exercise.cautions.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(exercise.difficulty);
    });
  });

  it('should have valid difficulty levels', () => {
    const difficulties = Object.values(CORRECTION_EXERCISES).map((e) => e.difficulty);
    expect(difficulties).toContain(1);
    expect(difficulties).toContain(2);
    // 난이도 3 운동은 선택적
  });

  describe('특정 운동 검증', () => {
    it('should have chin_tuck exercise for forward head', () => {
      const exercise = CORRECTION_EXERCISES['chin_tuck'];
      expect(exercise).toBeDefined();
      expect(exercise.name).toContain('턱');
      expect(exercise.targetArea).toContain('목');
    });

    it('should have wall_angel for shoulder correction', () => {
      const exercise = CORRECTION_EXERCISES['wall_angel'];
      expect(exercise).toBeDefined();
      expect(exercise.targetArea).toContain('어깨');
    });

    it('should have glute_bridge for pelvic correction', () => {
      const exercise = CORRECTION_EXERCISES['glute_bridge'];
      expect(exercise).toBeDefined();
      expect(exercise.targetArea).toContain('둔근');
    });
  });
});

// ============================================================================
// getExercisesForIssue
// ============================================================================

describe('getExercisesForIssue', () => {
  it('should return exercises for forward_head', () => {
    const exercises = getExercisesForIssue('forward_head');
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.some((e) => e.id === 'chin_tuck')).toBe(true);
  });

  it('should return exercises for rounded_shoulders', () => {
    const exercises = getExercisesForIssue('rounded_shoulders');
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.some((e) => e.id === 'chest_stretch')).toBe(true);
  });

  it('should return exercises for anterior_pelvic_tilt', () => {
    const exercises = getExercisesForIssue('anterior_pelvic_tilt');
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.some((e) => e.id === 'pelvic_tilt')).toBe(true);
  });

  it('should return exercises for all issue types', () => {
    const issues: PostureIssue[] = [
      'forward_head',
      'rounded_shoulders',
      'kyphosis',
      'lordosis',
      'anterior_pelvic_tilt',
      'posterior_pelvic_tilt',
      'scoliosis',
      'flat_back',
      'uneven_shoulders',
      'leg_length_discrepancy',
    ];

    issues.forEach((issue) => {
      const exercises = getExercisesForIssue(issue);
      expect(exercises.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// getPostureCorrectionGuide
// ============================================================================

describe('getPostureCorrectionGuide', () => {
  const bodyTypes: BodyShape7[] = [
    'pear',
    'invertedTriangle',
    'rectangle',
    'hourglass',
    'oval',
    'apple',
    'trapezoid',
  ];

  it('should generate guide for all body types', () => {
    bodyTypes.forEach((bodyType) => {
      const guide = getPostureCorrectionGuide(bodyType);
      expect(guide.bodyType).toBe(bodyType);
      expect(guide.commonIssues.length).toBeGreaterThan(0);
      expect(guide.exercises.length).toBeGreaterThan(0);
      expect(guide.dailyTips.length).toBeGreaterThan(0);
      expect(guide.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('체형별 맞춤 가이드', () => {
    it('pear should have upper body focus', () => {
      const guide = getPostureCorrectionGuide('pear');
      expect(guide.commonIssues).toContain('rounded_shoulders');
    });

    it('invertedTriangle should have core focus', () => {
      const guide = getPostureCorrectionGuide('invertedTriangle');
      expect(guide.commonIssues).toContain('lordosis');
    });

    it('rectangle should address flat back', () => {
      const guide = getPostureCorrectionGuide('rectangle');
      expect(guide.commonIssues).toContain('flat_back');
    });

    it('hourglass should address pelvic issues', () => {
      const guide = getPostureCorrectionGuide('hourglass');
      expect(guide.commonIssues).toContain('anterior_pelvic_tilt');
    });

    it('oval should address multiple issues', () => {
      const guide = getPostureCorrectionGuide('oval');
      expect(guide.commonIssues.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should not have duplicate exercises', () => {
    const guide = getPostureCorrectionGuide('oval');
    const exerciseIds = guide.exercises.map((e) => e.id);
    const uniqueIds = new Set(exerciseIds);
    expect(exerciseIds.length).toBe(uniqueIds.size);
  });

  it('should include safety warnings', () => {
    const guide = getPostureCorrectionGuide('pear');
    expect(guide.warnings.some((w) => w.includes('통증'))).toBe(true);
  });
});

// ============================================================================
// getPostureIssueDetail
// ============================================================================

describe('getPostureIssueDetail', () => {
  it('should return complete detail for forward_head', () => {
    const detail = getPostureIssueDetail('forward_head');
    expect(detail.type).toBe('forward_head');
    expect(detail.name).toContain('거북목');
    expect(detail.description.length).toBeGreaterThan(0);
    expect(detail.causes.length).toBeGreaterThan(0);
    expect(detail.symptoms.length).toBeGreaterThan(0);
    expect(detail.recommendedExerciseIds.length).toBeGreaterThan(0);
  });

  it('should return details for scoliosis with medical advice', () => {
    const detail = getPostureIssueDetail('scoliosis');
    expect(detail.name).toContain('측만');
    expect(detail.description).toContain('전문');
  });
});

// ============================================================================
// getExerciseById
// ============================================================================

describe('getExerciseById', () => {
  it('should return exercise for valid ID', () => {
    const exercise = getExerciseById('chin_tuck');
    expect(exercise).toBeDefined();
    expect(exercise?.name).toContain('턱');
  });

  it('should return undefined for invalid ID', () => {
    const exercise = getExerciseById('nonexistent_exercise');
    expect(exercise).toBeUndefined();
  });

  it('should return exercise with all required fields', () => {
    const exercise = getExerciseById('cat_cow');
    expect(exercise?.id).toBe('cat_cow');
    expect(exercise?.steps.length).toBeGreaterThan(0);
    expect(exercise?.cautions.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// filterExercisesByDifficulty
// ============================================================================

describe('filterExercisesByDifficulty', () => {
  it('should filter to only beginner exercises (difficulty 1)', () => {
    const allExercises = getAllExercises();
    const filtered = filterExercisesByDifficulty(allExercises, 1);

    filtered.forEach((exercise) => {
      expect(exercise.difficulty).toBe(1);
    });
  });

  it('should include difficulty 1 and 2 when max is 2', () => {
    const allExercises = getAllExercises();
    const filtered = filterExercisesByDifficulty(allExercises, 2);

    filtered.forEach((exercise) => {
      expect(exercise.difficulty).toBeLessThanOrEqual(2);
    });
  });

  it('should include all exercises when max is 3', () => {
    const allExercises = getAllExercises();
    const filtered = filterExercisesByDifficulty(allExercises, 3);

    expect(filtered.length).toBe(allExercises.length);
  });

  it('should return fewer exercises for lower difficulty', () => {
    const allExercises = getAllExercises();
    const level1 = filterExercisesByDifficulty(allExercises, 1);
    const level2 = filterExercisesByDifficulty(allExercises, 2);

    expect(level1.length).toBeLessThanOrEqual(level2.length);
  });
});

// ============================================================================
// getAllPostureIssues
// ============================================================================

describe('getAllPostureIssues', () => {
  it('should return all 10 posture issues', () => {
    const issues = getAllPostureIssues();
    expect(issues.length).toBe(10);
  });

  it('should return complete issue objects', () => {
    const issues = getAllPostureIssues();
    issues.forEach((issue) => {
      expect(issue.type).toBeDefined();
      expect(issue.name).toBeDefined();
      expect(issue.description).toBeDefined();
    });
  });
});

// ============================================================================
// getAllExercises
// ============================================================================

describe('getAllExercises', () => {
  it('should return at least 20 exercises', () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBeGreaterThanOrEqual(20);
  });

  it('should return complete exercise objects', () => {
    const exercises = getAllExercises();
    exercises.forEach((exercise) => {
      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBeDefined();
      expect(exercise.steps.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// 통합 시나리오
// ============================================================================

describe('통합 시나리오', () => {
  it('should provide complete workflow for user with forward head posture', () => {
    // 1. 문제 상세 조회
    const issueDetail = getPostureIssueDetail('forward_head');
    expect(issueDetail.name).toContain('거북목');

    // 2. 해당 문제에 대한 운동 조회
    const exercises = getExercisesForIssue('forward_head');
    expect(exercises.length).toBeGreaterThan(0);

    // 3. 초보자용 필터링
    const beginnerExercises = filterExercisesByDifficulty(exercises, 1);
    expect(beginnerExercises.length).toBeGreaterThan(0);

    // 4. 운동 상세 확인
    const firstExercise = getExerciseById(beginnerExercises[0].id);
    expect(firstExercise?.steps.length).toBeGreaterThan(0);
  });

  it('should provide complete guide for body type assessment', () => {
    // 체형 분석 결과가 oval인 사용자
    const guide = getPostureCorrectionGuide('oval');

    // 일반적인 문제 확인
    expect(guide.commonIssues.length).toBeGreaterThan(0);

    // 권장 운동 확인
    expect(guide.exercises.length).toBeGreaterThan(0);

    // 일상 팁 확인
    expect(guide.dailyTips.length).toBeGreaterThan(0);

    // 초보자 운동 필터링
    const beginnerOnly = filterExercisesByDifficulty(guide.exercises, 1);
    expect(beginnerOnly.length).toBeGreaterThan(0);
  });

  it('should handle multiple issues for comprehensive correction', () => {
    const issues: PostureIssue[] = ['forward_head', 'rounded_shoulders'];
    const allExercises: CorrectionExercise[] = [];

    issues.forEach((issue) => {
      const exercises = getExercisesForIssue(issue);
      allExercises.push(...exercises);
    });

    // 중복 제거
    const uniqueExercises = allExercises.filter(
      (exercise, index, self) => self.findIndex((e) => e.id === exercise.id) === index
    );

    expect(uniqueExercises.length).toBeGreaterThan(0);
    // 두 문제에 공통된 운동이 있을 수 있음 (chest_stretch)
    expect(uniqueExercises.length).toBeLessThanOrEqual(allExercises.length);
  });
});

// ============================================================================
// 데이터 품질 검증
// ============================================================================

describe('데이터 품질 검증', () => {
  it('should have Korean descriptions for all exercises', () => {
    const exercises = getAllExercises();
    exercises.forEach((exercise) => {
      // 한글이 포함되어 있는지 확인
      expect(exercise.description).toMatch(/[가-힣]/);
    });
  });

  it('should have valid step instructions', () => {
    const exercises = getAllExercises();
    exercises.forEach((exercise) => {
      exercise.steps.forEach((step) => {
        expect(step.length).toBeGreaterThan(5);
        expect(step).toMatch(/[가-힣]/); // 한글 포함
      });
    });
  });

  it('should have valid duration formats', () => {
    const exercises = getAllExercises();
    exercises.forEach((exercise) => {
      expect(exercise.duration.length).toBeGreaterThan(0);
      // 횟수 또는 시간 형식
      expect(exercise.duration).toMatch(/회|초|분|세트/);
    });
  });

  it('should have valid frequency formats', () => {
    const exercises = getAllExercises();
    exercises.forEach((exercise) => {
      expect(exercise.frequency.length).toBeGreaterThan(0);
      // 빈도 형식
      expect(exercise.frequency).toMatch(/하루|주|일/);
    });
  });
});
