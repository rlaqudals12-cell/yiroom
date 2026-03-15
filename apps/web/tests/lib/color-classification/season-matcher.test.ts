import { describe, it, expect } from 'vitest';
import {
  calculateSeasonMatch,
  getBestSeasonMatch,
  calculateUserSeasonMatch,
  getMatchGrade,
  getSeasonDescription,
  getSeasonCompatibility,
  SEASON_COMPATIBILITY,
} from '@/lib/color-classification/season-matcher';

describe('calculateSeasonMatch', () => {
  it('4계절 점수를 모두 반환한다', () => {
    const scores = calculateSeasonMatch({ L: 70, a: 10, b: 20 });
    expect(scores).toHaveProperty('spring');
    expect(scores).toHaveProperty('summer');
    expect(scores).toHaveProperty('autumn');
    expect(scores).toHaveProperty('winter');
  });

  it('모든 점수는 0-100 범위이다', () => {
    const scores = calculateSeasonMatch({ L: 50, a: 0, b: 0 });
    for (const score of Object.values(scores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('밝고 따뜻한 색상은 spring 점수가 높다', () => {
    const scores = calculateSeasonMatch({ L: 75, a: 15, b: 25 });
    expect(scores.spring).toBeGreaterThanOrEqual(scores.winter);
  });
});

describe('getBestSeasonMatch', () => {
  it('가장 높은 점수의 시즌을 반환한다', () => {
    const scores = { spring: 80, summer: 60, autumn: 50, winter: 40 };
    const result = getBestSeasonMatch(scores);
    expect(result.season).toBe('spring');
    expect(result.score).toBe(80);
  });

  it('모든 점수가 0이면 spring을 반환한다', () => {
    const scores = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    const result = getBestSeasonMatch(scores);
    expect(result.season).toBe('spring');
    expect(result.score).toBe(0);
  });

  it('winter가 최고 점수면 winter를 반환한다', () => {
    const scores = { spring: 30, summer: 40, autumn: 50, winter: 90 };
    const result = getBestSeasonMatch(scores);
    expect(result.season).toBe('winter');
    expect(result.score).toBe(90);
  });
});

describe('calculateUserSeasonMatch', () => {
  it('사용자 시즌에 해당하는 점수를 반환한다', () => {
    const score = calculateUserSeasonMatch({ L: 70, a: 10, b: 20 }, 'spring');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getMatchGrade', () => {
  it('80 이상이면 excellent이다', () => {
    expect(getMatchGrade(80).grade).toBe('excellent');
    expect(getMatchGrade(100).grade).toBe('excellent');
  });

  it('60-79이면 good이다', () => {
    expect(getMatchGrade(60).grade).toBe('good');
    expect(getMatchGrade(79).grade).toBe('good');
  });

  it('40-59이면 fair이다', () => {
    expect(getMatchGrade(40).grade).toBe('fair');
    expect(getMatchGrade(59).grade).toBe('fair');
  });

  it('40 미만이면 poor이다', () => {
    expect(getMatchGrade(39).grade).toBe('poor');
    expect(getMatchGrade(0).grade).toBe('poor');
  });

  it('label은 한국어이다', () => {
    expect(getMatchGrade(90).label).toContain('어울려요');
  });
});

describe('getSeasonDescription', () => {
  it('각 시즌별 설명을 반환한다', () => {
    expect(getSeasonDescription('spring')).toContain('봄');
    expect(getSeasonDescription('summer')).toContain('여름');
    expect(getSeasonDescription('autumn')).toContain('가을');
    expect(getSeasonDescription('winter')).toContain('겨울');
  });
});

describe('getSeasonCompatibility', () => {
  it('같은 시즌이면 100이다', () => {
    expect(getSeasonCompatibility('spring', 'spring')).toBe(100);
    expect(getSeasonCompatibility('winter', 'winter')).toBe(100);
  });

  it('같은 톤이면 70이다', () => {
    expect(getSeasonCompatibility('autumn', 'spring')).toBe(70);
    expect(getSeasonCompatibility('winter', 'summer')).toBe(70);
  });

  it('반대 톤이면 30이다', () => {
    expect(getSeasonCompatibility('winter', 'spring')).toBe(30);
    expect(getSeasonCompatibility('autumn', 'summer')).toBe(30);
  });
});

describe('SEASON_COMPATIBILITY', () => {
  it('대칭 구조이다', () => {
    expect(SEASON_COMPATIBILITY.spring.autumn).toBe(SEASON_COMPATIBILITY.autumn.spring);
    expect(SEASON_COMPATIBILITY.summer.winter).toBe(SEASON_COMPATIBILITY.winter.summer);
  });
});
