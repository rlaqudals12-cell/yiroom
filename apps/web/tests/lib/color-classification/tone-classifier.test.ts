import { describe, it, expect } from 'vitest';
import {
  classifyTone,
  classifyToneWithConfidence,
  calculateWarmRatio,
  getToneDescription,
  getToneRecommendation,
} from '@/lib/color-classification/tone-classifier';

describe('classifyTone', () => {
  it('a > 0, b > 0이면 warm을 반환한다', () => {
    expect(classifyTone({ L: 60, a: 10, b: 15 })).toBe('warm');
  });

  it('a < 0이면 cool을 반환한다', () => {
    expect(classifyTone({ L: 60, a: -10, b: 5 })).toBe('cool');
  });

  it('b < 0이면 cool을 반환한다', () => {
    expect(classifyTone({ L: 60, a: 5, b: -10 })).toBe('cool');
  });

  it('a, b 모두 임계값 이내면 neutral을 반환한다', () => {
    expect(classifyTone({ L: 60, a: 1, b: 1 })).toBe('neutral');
  });

  it('a = 0, b = 0이면 neutral이다', () => {
    expect(classifyTone({ L: 50, a: 0, b: 0 })).toBe('neutral');
  });
});

describe('classifyToneWithConfidence', () => {
  it('중립 영역이면 neutral과 높은 신뢰도를 반환한다', () => {
    const result = classifyToneWithConfidence({ L: 50, a: 0, b: 0 });
    expect(result.tone).toBe('neutral');
    expect(result.confidence).toBe(100);
  });

  it('강한 웜톤이면 높은 신뢰도를 반환한다', () => {
    const result = classifyToneWithConfidence({ L: 60, a: 30, b: 30 });
    expect(result.tone).toBe('warm');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it('강한 쿨톤이면 높은 신뢰도를 반환한다', () => {
    const result = classifyToneWithConfidence({ L: 60, a: -20, b: -20 });
    expect(result.tone).toBe('cool');
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it('신뢰도는 0-100 범위이다', () => {
    const cases = [
      { L: 50, a: 0, b: 0 },
      { L: 50, a: 50, b: 50 },
      { L: 50, a: -50, b: -50 },
      { L: 50, a: 5, b: 5 },
    ];
    for (const lab of cases) {
      const { confidence } = classifyToneWithConfidence(lab);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    }
  });
});

describe('calculateWarmRatio', () => {
  it('a = 0, b = 0이면 50(중립)을 반환한다', () => {
    expect(calculateWarmRatio({ L: 50, a: 0, b: 0 })).toBe(50);
  });

  it('a > 0, b > 0이면 50보다 크다', () => {
    expect(calculateWarmRatio({ L: 50, a: 20, b: 20 })).toBeGreaterThan(50);
  });

  it('a < 0, b < 0이면 50보다 작다', () => {
    expect(calculateWarmRatio({ L: 50, a: -20, b: -20 })).toBeLessThan(50);
  });

  it('결과는 0-100 범위이다', () => {
    const extremes = [
      { L: 50, a: 100, b: 100 },
      { L: 50, a: -100, b: -100 },
    ];
    for (const lab of extremes) {
      const ratio = calculateWarmRatio(lab);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(100);
    }
  });
});

describe('getToneDescription', () => {
  it('warm 설명을 반환한다', () => {
    expect(getToneDescription('warm')).toContain('따뜻한');
  });

  it('cool 설명을 반환한다', () => {
    expect(getToneDescription('cool')).toContain('차가운');
  });

  it('neutral 설명을 반환한다', () => {
    expect(getToneDescription('neutral')).toContain('중립');
  });
});

describe('getToneRecommendation', () => {
  it('neutral이면 무난한 추천을 반환한다', () => {
    expect(getToneRecommendation('neutral', 'spring')).toContain('무난');
  });

  it('웜톤 제품 + spring 유저면 잘 어울린다', () => {
    expect(getToneRecommendation('warm', 'spring')).toContain('잘 어울리는');
  });

  it('웜톤 제품 + autumn 유저면 잘 어울린다', () => {
    expect(getToneRecommendation('warm', 'autumn')).toContain('잘 어울리는');
  });

  it('쿨톤 제품 + summer 유저면 잘 어울린다', () => {
    expect(getToneRecommendation('cool', 'summer')).toContain('잘 어울리는');
  });

  it('웜톤 제품 + summer 유저면 다른 톤 안내를 반환한다', () => {
    expect(getToneRecommendation('warm', 'summer')).toContain('다른 톤');
  });
});
