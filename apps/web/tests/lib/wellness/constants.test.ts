import { describe, it, expect } from 'vitest';
import {
  MAX_AREA_SCORE,
  MAX_TOTAL_SCORE,
  SCORE_WEIGHTS,
  STREAK_BONUS_TABLE,
  FREQUENCY_SCORE_TABLE,
  ANALYSIS_AGE_SCORE_TABLE,
  GRADE_THRESHOLDS,
  INSIGHT_THRESHOLDS,
  getScoreFromTable,
  percentToScore,
  scoreToPercent,
} from '@/lib/wellness/constants';

describe('웰니스 상수', () => {
  it('MAX_AREA_SCORE는 25이다', () => {
    expect(MAX_AREA_SCORE).toBe(25);
  });

  it('MAX_TOTAL_SCORE는 100이다', () => {
    expect(MAX_TOTAL_SCORE).toBe(100);
  });

  it('4개 영역의 가중치 합이 각각 MAX_AREA_SCORE와 같다', () => {
    for (const area of ['workout', 'nutrition', 'skin', 'body'] as const) {
      const weights = SCORE_WEIGHTS[area];
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBe(MAX_AREA_SCORE);
    }
  });
});

describe('SCORE_WEIGHTS', () => {
  it('운동 영역에 streak, frequency, goal 가중치가 있다', () => {
    expect(SCORE_WEIGHTS.workout.streak).toBe(10);
    expect(SCORE_WEIGHTS.workout.frequency).toBe(10);
    expect(SCORE_WEIGHTS.workout.goal).toBe(5);
  });

  it('영양 영역에 calorie, balance, water 가중치가 있다', () => {
    expect(SCORE_WEIGHTS.nutrition.calorie).toBe(10);
    expect(SCORE_WEIGHTS.nutrition.balance).toBe(10);
    expect(SCORE_WEIGHTS.nutrition.water).toBe(5);
  });
});

describe('STREAK_BONUS_TABLE', () => {
  it('0일 스트릭은 2점이다', () => {
    expect(STREAK_BONUS_TABLE[0].min).toBe(0);
    expect(STREAK_BONUS_TABLE[0].score).toBe(2);
  });

  it('30일 이상 스트릭은 최대 10점이다', () => {
    const lastEntry = STREAK_BONUS_TABLE[STREAK_BONUS_TABLE.length - 1];
    expect(lastEntry.min).toBe(30);
    expect(lastEntry.max).toBe(Infinity);
    expect(lastEntry.score).toBe(10);
  });

  it('점수가 단조 증가한다', () => {
    for (let i = 1; i < STREAK_BONUS_TABLE.length; i++) {
      expect(STREAK_BONUS_TABLE[i].score).toBeGreaterThanOrEqual(STREAK_BONUS_TABLE[i - 1].score);
    }
  });
});

describe('FREQUENCY_SCORE_TABLE', () => {
  it('운동 0회면 0점이다', () => {
    expect(FREQUENCY_SCORE_TABLE[0].score).toBe(0);
  });

  it('5회 이상이면 최대 10점이다', () => {
    const lastEntry = FREQUENCY_SCORE_TABLE[FREQUENCY_SCORE_TABLE.length - 1];
    expect(lastEntry.score).toBe(10);
  });
});

describe('ANALYSIS_AGE_SCORE_TABLE', () => {
  it('1주 이내 분석은 10점이다', () => {
    expect(ANALYSIS_AGE_SCORE_TABLE[0].max).toBe(7);
    expect(ANALYSIS_AGE_SCORE_TABLE[0].score).toBe(10);
  });

  it('3달 초과 분석은 0점이다', () => {
    const lastEntry = ANALYSIS_AGE_SCORE_TABLE[ANALYSIS_AGE_SCORE_TABLE.length - 1];
    expect(lastEntry.min).toBe(91);
    expect(lastEntry.score).toBe(0);
  });
});

describe('GRADE_THRESHOLDS', () => {
  it('S등급은 90점 이상이다', () => {
    expect(GRADE_THRESHOLDS.S).toBe(90);
  });

  it('F등급은 0점부터이다', () => {
    expect(GRADE_THRESHOLDS.F).toBe(0);
  });

  it('등급 기준이 내림차순이다', () => {
    expect(GRADE_THRESHOLDS.S).toBeGreaterThan(GRADE_THRESHOLDS.A);
    expect(GRADE_THRESHOLDS.A).toBeGreaterThan(GRADE_THRESHOLDS.B);
    expect(GRADE_THRESHOLDS.B).toBeGreaterThan(GRADE_THRESHOLDS.C);
    expect(GRADE_THRESHOLDS.C).toBeGreaterThan(GRADE_THRESHOLDS.D);
    expect(GRADE_THRESHOLDS.D).toBeGreaterThan(GRADE_THRESHOLDS.F);
  });
});

describe('INSIGHT_THRESHOLDS', () => {
  it('lowScore와 highScore 임계값이 정의되어 있다', () => {
    expect(INSIGHT_THRESHOLDS.lowScore).toBe(50);
    expect(INSIGHT_THRESHOLDS.highScore).toBe(80);
  });

  it('스트릭 마일스톤이 오름차순이다', () => {
    const milestones = INSIGHT_THRESHOLDS.streakMilestones;
    for (let i = 1; i < milestones.length; i++) {
      expect(milestones[i]).toBeGreaterThan(milestones[i - 1]);
    }
  });
});

describe('getScoreFromTable', () => {
  describe('정상 케이스', () => {
    it('STREAK_BONUS_TABLE에서 올바른 점수를 반환한다', () => {
      expect(getScoreFromTable(0, STREAK_BONUS_TABLE)).toBe(2);
      expect(getScoreFromTable(5, STREAK_BONUS_TABLE)).toBe(4);
      expect(getScoreFromTable(10, STREAK_BONUS_TABLE)).toBe(6);
      expect(getScoreFromTable(20, STREAK_BONUS_TABLE)).toBe(8);
      expect(getScoreFromTable(100, STREAK_BONUS_TABLE)).toBe(10);
    });

    it('FREQUENCY_SCORE_TABLE에서 올바른 점수를 반환한다', () => {
      expect(getScoreFromTable(0, FREQUENCY_SCORE_TABLE)).toBe(0);
      expect(getScoreFromTable(3, FREQUENCY_SCORE_TABLE)).toBe(6);
      expect(getScoreFromTable(7, FREQUENCY_SCORE_TABLE)).toBe(10);
    });

    it('경계값에서 올바르게 동작한다', () => {
      // 정확히 경계값
      expect(getScoreFromTable(2, STREAK_BONUS_TABLE)).toBe(2);
      expect(getScoreFromTable(3, STREAK_BONUS_TABLE)).toBe(4);
      expect(getScoreFromTable(7, STREAK_BONUS_TABLE)).toBe(6);
      expect(getScoreFromTable(14, STREAK_BONUS_TABLE)).toBe(8);
      expect(getScoreFromTable(30, STREAK_BONUS_TABLE)).toBe(10);
    });
  });

  describe('엣지 케이스', () => {
    it('일치하는 항목이 없으면 0을 반환한다', () => {
      const result = getScoreFromTable(-1, STREAK_BONUS_TABLE);
      expect(result).toBe(0);
    });

    it('빈 테이블에서 0을 반환한다', () => {
      expect(getScoreFromTable(5, [])).toBe(0);
    });
  });
});

describe('percentToScore', () => {
  describe('정상 케이스', () => {
    it('100%를 최대 점수로 변환한다', () => {
      expect(percentToScore(100, 10)).toBe(10);
      expect(percentToScore(100, 25)).toBe(25);
    });

    it('50%를 절반 점수로 변환한다', () => {
      expect(percentToScore(50, 10)).toBe(5);
    });

    it('0%를 0으로 변환한다', () => {
      expect(percentToScore(0, 10)).toBe(0);
    });

    it('소수점은 반올림한다', () => {
      expect(percentToScore(33, 10)).toBe(3);
      expect(percentToScore(67, 10)).toBe(7);
    });
  });

  describe('엣지 케이스', () => {
    it('100% 초과는 100%로 제한한다', () => {
      expect(percentToScore(150, 10)).toBe(10);
    });

    it('0% 미만은 0%로 제한한다', () => {
      expect(percentToScore(-50, 10)).toBe(0);
    });
  });
});

describe('scoreToPercent', () => {
  describe('정상 케이스', () => {
    it('최대 점수를 100%로 변환한다', () => {
      expect(scoreToPercent(10, 10)).toBe(100);
      expect(scoreToPercent(25, 25)).toBe(100);
    });

    it('절반 점수를 50%로 변환한다', () => {
      expect(scoreToPercent(5, 10)).toBe(50);
    });

    it('0점을 0%로 변환한다', () => {
      expect(scoreToPercent(0, 10)).toBe(0);
    });
  });

  describe('엣지 케이스', () => {
    it('maxScore가 0일 때 0을 반환한다', () => {
      expect(scoreToPercent(5, 0)).toBe(0);
    });
  });
});
