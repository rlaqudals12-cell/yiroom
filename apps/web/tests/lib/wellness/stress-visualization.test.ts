import { describe, it, expect } from 'vitest';
import {
  getStressGrade,
  getSkinImpacts,
  getStressRecommendations,
  buildStressVisualization,
  analyzeStressTrend,
} from '@/lib/wellness/stress-visualization';
import type { StressTrendPoint } from '@/lib/wellness/stress-visualization';

describe('getStressGrade', () => {
  it('낮은 스트레스(1-3)는 low를 반환해야 한다', () => {
    expect(getStressGrade(1)).toBe('low');
    expect(getStressGrade(3)).toBe('low');
  });

  it('보통 스트레스(4-6)는 moderate를 반환해야 한다', () => {
    expect(getStressGrade(4)).toBe('moderate');
    expect(getStressGrade(6)).toBe('moderate');
  });

  it('높은 스트레스(7-8)는 high를 반환해야 한다', () => {
    expect(getStressGrade(7)).toBe('high');
    expect(getStressGrade(8)).toBe('high');
  });

  it('매우 높은 스트레스(9-10)는 critical을 반환해야 한다', () => {
    expect(getStressGrade(9)).toBe('critical');
    expect(getStressGrade(10)).toBe('critical');
  });
});

describe('getSkinImpacts', () => {
  it('낮은 스트레스(1-3)에서는 영향 항목이 없어야 한다', () => {
    expect(getSkinImpacts(1)).toHaveLength(0);
    expect(getSkinImpacts(3)).toHaveLength(0);
  });

  it('스트레스 4 이상에서 피지 분비 항목이 포함되어야 한다', () => {
    const impacts = getSkinImpacts(4);
    expect(impacts.some((i) => i.area === '피지 분비')).toBe(true);
  });

  it('스트레스 8 이상에서 탈모 항목이 포함되어야 한다', () => {
    const impacts = getSkinImpacts(8);
    expect(impacts.some((i) => i.area === '탈모')).toBe(true);
  });

  it('스트레스가 높을수록 더 많은 영향 항목이 반환되어야 한다', () => {
    const low = getSkinImpacts(4);
    const high = getSkinImpacts(9);
    expect(high.length).toBeGreaterThan(low.length);
  });

  it('severity는 1, 2, 3 중 하나여야 한다', () => {
    const impacts = getSkinImpacts(10);
    impacts.forEach((impact) => {
      expect([1, 2, 3]).toContain(impact.severity);
    });
  });
});

describe('getStressRecommendations', () => {
  it('low 등급에 대한 권장 사항을 반환해야 한다', () => {
    const recs = getStressRecommendations('low');
    expect(recs.length).toBeGreaterThan(0);
  });

  it('critical 등급에 가장 많은 권장 사항을 반환해야 한다', () => {
    const low = getStressRecommendations('low');
    const critical = getStressRecommendations('critical');
    expect(critical.length).toBeGreaterThanOrEqual(low.length);
  });

  it('모든 등급에 대해 빈 배열이 아닌 결과를 반환해야 한다', () => {
    const grades = ['low', 'moderate', 'high', 'critical'] as const;
    grades.forEach((grade) => {
      const recs = getStressRecommendations(grade);
      expect(recs.length).toBeGreaterThan(0);
      recs.forEach((rec) => expect(typeof rec).toBe('string'));
    });
  });
});

describe('buildStressVisualization', () => {
  it('유효한 시각화 데이터를 반환해야 한다', () => {
    const viz = buildStressVisualization(5, 15);
    expect(viz.stressLevel).toBe(5);
    expect(viz.stressScore).toBe(15);
    expect(viz.grade).toBe('moderate');
    expect(viz.gradeLabel).toBe('보통');
    expect(viz.color).toBeTruthy();
    expect(viz.skinImpacts.length).toBeGreaterThan(0);
    expect(viz.recommendations.length).toBeGreaterThan(0);
    expect(viz.gaugePercent).toBeGreaterThanOrEqual(0);
    expect(viz.gaugePercent).toBeLessThanOrEqual(100);
  });

  it('스트레스 레벨을 1-10으로 클램핑해야 한다', () => {
    const low = buildStressVisualization(0, 25);
    expect(low.stressLevel).toBe(1);

    const high = buildStressVisualization(15, 0);
    expect(high.stressLevel).toBe(10);
  });

  it('게이지 퍼센트가 스트레스와 반비례해야 한다', () => {
    const lowStress = buildStressVisualization(1, 25);
    const highStress = buildStressVisualization(10, 0);
    expect(lowStress.gaugePercent).toBeGreaterThan(highStress.gaugePercent);
  });
});

describe('analyzeStressTrend', () => {
  it('빈 데이터에서 stable과 안내 메시지를 반환해야 한다', () => {
    const trend = analyzeStressTrend([]);
    expect(trend.trend).toBe('stable');
    expect(trend.averageLevel).toBe(0);
    expect(trend.points).toHaveLength(0);
    expect(trend.trendMessage).toContain('데이터가 없어요');
  });

  it('포인트가 날짜순으로 정렬되어야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-03', stressLevel: 5, grade: 'moderate' },
      { date: '2026-03-01', stressLevel: 3, grade: 'low' },
      { date: '2026-03-02', stressLevel: 7, grade: 'high' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.points[0].date).toBe('2026-03-01');
    expect(trend.points[2].date).toBe('2026-03-03');
  });

  it('평균 레벨을 올바르게 계산해야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-01', stressLevel: 4, grade: 'moderate' },
      { date: '2026-03-02', stressLevel: 6, grade: 'moderate' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.averageLevel).toBe(5);
  });

  it('스트레스가 줄어들면 improving을 반환해야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-01', stressLevel: 8, grade: 'high' },
      { date: '2026-03-02', stressLevel: 8, grade: 'high' },
      { date: '2026-03-03', stressLevel: 3, grade: 'low' },
      { date: '2026-03-04', stressLevel: 2, grade: 'low' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.trend).toBe('improving');
  });

  it('스트레스가 늘어나면 worsening을 반환해야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-01', stressLevel: 2, grade: 'low' },
      { date: '2026-03-02', stressLevel: 3, grade: 'low' },
      { date: '2026-03-03', stressLevel: 8, grade: 'high' },
      { date: '2026-03-04', stressLevel: 9, grade: 'critical' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.trend).toBe('worsening');
  });

  it('변화가 적으면 stable을 반환해야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-01', stressLevel: 5, grade: 'moderate' },
      { date: '2026-03-02', stressLevel: 5, grade: 'moderate' },
      { date: '2026-03-03', stressLevel: 5, grade: 'moderate' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.trend).toBe('stable');
  });

  it('3개 미만 포인트에서는 stable을 반환해야 한다', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-01', stressLevel: 2, grade: 'low' },
      { date: '2026-03-02', stressLevel: 9, grade: 'critical' },
    ];
    const trend = analyzeStressTrend(points);
    expect(trend.trend).toBe('stable');
  });
});
