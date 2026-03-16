/**
 * 스트레스 시각화 서비스 로직 테스트
 */
import {
  getStressGrade,
  getSkinImpacts,
  getStressRecommendations,
  buildStressVisualization,
  analyzeStressTrend,
} from '../../../lib/wellness/stress-visualization';
import type { StressTrendPoint } from '../../../lib/wellness/stress-visualization';

// ============================================
// getStressGrade
// ============================================

describe('getStressGrade', () => {
  it('low: 레벨 1-3', () => {
    expect(getStressGrade(1)).toBe('low');
    expect(getStressGrade(2)).toBe('low');
    expect(getStressGrade(3)).toBe('low');
  });

  it('moderate: 레벨 4-6', () => {
    expect(getStressGrade(4)).toBe('moderate');
    expect(getStressGrade(5)).toBe('moderate');
    expect(getStressGrade(6)).toBe('moderate');
  });

  it('high: 레벨 7-8', () => {
    expect(getStressGrade(7)).toBe('high');
    expect(getStressGrade(8)).toBe('high');
  });

  it('critical: 레벨 9-10', () => {
    expect(getStressGrade(9)).toBe('critical');
    expect(getStressGrade(10)).toBe('critical');
  });
});

// ============================================
// getSkinImpacts
// ============================================

describe('getSkinImpacts', () => {
  it('낮은 스트레스(1-3)는 피부 영향 없음', () => {
    expect(getSkinImpacts(1)).toHaveLength(0);
    expect(getSkinImpacts(3)).toHaveLength(0);
  });

  it('레벨 4에서 피지 분비 영향 시작', () => {
    const impacts = getSkinImpacts(4);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].area).toBe('피지 분비');
  });

  it('레벨 7에서 노화 영향 추가', () => {
    const impacts = getSkinImpacts(7);
    const areas = impacts.map((i) => i.area);
    expect(areas).toContain('노화');
  });

  it('레벨 8에서 탈모 영향 추가 (5개 항목)', () => {
    const impacts = getSkinImpacts(8);
    expect(impacts).toHaveLength(5);
    expect(impacts[impacts.length - 1].area).toBe('탈모');
  });

  it('높은 스트레스에서 severity 3 포함', () => {
    const impacts = getSkinImpacts(9);
    const maxSeverity = Math.max(...impacts.map((i) => i.severity));
    expect(maxSeverity).toBe(3);
  });
});

// ============================================
// getStressRecommendations
// ============================================

describe('getStressRecommendations', () => {
  it('각 등급별로 권장사항 반환', () => {
    expect(getStressRecommendations('low').length).toBeGreaterThan(0);
    expect(getStressRecommendations('moderate').length).toBeGreaterThan(0);
    expect(getStressRecommendations('high').length).toBeGreaterThan(0);
    expect(getStressRecommendations('critical').length).toBeGreaterThan(0);
  });

  it('critical이 가장 많은 권장사항', () => {
    const critical = getStressRecommendations('critical');
    const low = getStressRecommendations('low');
    expect(critical.length).toBeGreaterThanOrEqual(low.length);
  });
});

// ============================================
// buildStressVisualization
// ============================================

describe('buildStressVisualization', () => {
  it('정상 범위 입력 시 시각화 데이터 반환', () => {
    const result = buildStressVisualization(5, 15);
    expect(result.stressLevel).toBe(5);
    expect(result.stressScore).toBe(15);
    expect(result.grade).toBe('moderate');
    expect(result.gradeLabel).toBe('보통');
    expect(result.color).toBe('#f59e0b');
    expect(result.gaugePercent).toBeGreaterThan(0);
    expect(result.gaugePercent).toBeLessThanOrEqual(100);
    expect(result.skinImpacts.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('레벨 1에서 gaugePercent가 100', () => {
    const result = buildStressVisualization(1, 25);
    expect(result.gaugePercent).toBe(100);
  });

  it('레벨 10에서 gaugePercent가 0', () => {
    const result = buildStressVisualization(10, 0);
    expect(result.gaugePercent).toBe(0);
  });

  it('범위 초과 시 클램핑', () => {
    const low = buildStressVisualization(-5, 25);
    expect(low.stressLevel).toBe(1);

    const high = buildStressVisualization(99, 0);
    expect(high.stressLevel).toBe(10);
  });
});

// ============================================
// analyzeStressTrend
// ============================================

describe('analyzeStressTrend', () => {
  it('빈 배열 시 stable 반환', () => {
    const result = analyzeStressTrend([]);
    expect(result.trend).toBe('stable');
    expect(result.averageLevel).toBe(0);
    expect(result.points).toHaveLength(0);
  });

  it('데이터 1-2개일 때 stable', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-15', stressLevel: 5, grade: 'moderate' },
    ];
    const result = analyzeStressTrend(points);
    expect(result.trend).toBe('stable');
    expect(result.averageLevel).toBe(5);
  });

  it('스트레스 감소 시 improving', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-10', stressLevel: 8, grade: 'high' },
      { date: '2026-03-11', stressLevel: 8, grade: 'high' },
      { date: '2026-03-12', stressLevel: 5, grade: 'moderate' },
      { date: '2026-03-13', stressLevel: 4, grade: 'moderate' },
    ];
    const result = analyzeStressTrend(points);
    expect(result.trend).toBe('improving');
  });

  it('스트레스 증가 시 worsening', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-10', stressLevel: 3, grade: 'low' },
      { date: '2026-03-11', stressLevel: 3, grade: 'low' },
      { date: '2026-03-12', stressLevel: 7, grade: 'high' },
      { date: '2026-03-13', stressLevel: 8, grade: 'high' },
    ];
    const result = analyzeStressTrend(points);
    expect(result.trend).toBe('worsening');
  });

  it('날짜순 정렬됨', () => {
    const points: StressTrendPoint[] = [
      { date: '2026-03-13', stressLevel: 4, grade: 'moderate' },
      { date: '2026-03-10', stressLevel: 6, grade: 'moderate' },
      { date: '2026-03-11', stressLevel: 5, grade: 'moderate' },
    ];
    const result = analyzeStressTrend(points);
    expect(result.points[0].date).toBe('2026-03-10');
    expect(result.points[2].date).toBe('2026-03-13');
  });
});
