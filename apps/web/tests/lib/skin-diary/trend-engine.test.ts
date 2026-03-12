import { describe, it, expect } from 'vitest';
import {
  calculateMovingAverage,
  determineTrend,
  calculateChangeRate,
  analyzeCategoryTrends,
  detectAlerts,
  calculateStreak,
  analyzeTrend,
} from '@/lib/skin-diary/trend-engine';
import type { DiaryEntry } from '@/lib/skin-diary/types';

// ============================================
// 헬퍼: 테스트용 DiaryEntry 생성
// ============================================

function createEntry(overrides: Partial<DiaryEntry> & { vitalityScore: number }): DiaryEntry {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    date: '2026-03-12',
    vitalityGrade: 'B',
    scoreBreakdown: { hydration: 60, elasticity: 60, clarity: 60, tone: 60 },
    primaryConcerns: [],
    skinType: 'combination',
    ...overrides,
  };
}

function scoreToGrade(score: number): DiaryEntry['vitalityGrade'] {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function createEntries(scores: number[], startDate = '2026-03-12'): DiaryEntry[] {
  return scores.map((score, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - i * 3); // 3일 간격
    return createEntry({
      vitalityScore: score,
      date: d.toISOString().split('T')[0],
      vitalityGrade: scoreToGrade(score),
    });
  });
}

// ============================================
// calculateMovingAverage
// ============================================

describe('calculateMovingAverage', () => {
  it('빈 배열 → 0 반환', () => {
    expect(calculateMovingAverage([], 3)).toBe(0);
  });

  it('윈도우보다 적은 데이터 → 전체 평균', () => {
    expect(calculateMovingAverage([80, 60], 3)).toBe(70);
  });

  it('윈도우 크기만큼 평균', () => {
    expect(calculateMovingAverage([90, 80, 70, 60, 50], 3)).toBe(80); // (90+80+70)/3
  });

  it('윈도우 7 → 처음 7개 평균', () => {
    const values = [100, 90, 80, 70, 60, 50, 40, 30, 20];
    expect(calculateMovingAverage(values, 7)).toBeCloseTo(70, 0); // (100+90+80+70+60+50+40)/7
  });
});

// ============================================
// determineTrend
// ============================================

describe('determineTrend', () => {
  it('변화율 +5% 이상 → improving', () => {
    expect(determineTrend(84, 80)).toBe('improving'); // +5%
  });

  it('변화율 -5% 이하 → declining', () => {
    expect(determineTrend(76, 80)).toBe('declining'); // -5%
  });

  it('변화율 ±5% 이내 → stable', () => {
    expect(determineTrend(81, 80)).toBe('stable'); // +1.25%
  });

  it('longTermAvg 0 → stable', () => {
    expect(determineTrend(50, 0)).toBe('stable');
  });
});

// ============================================
// calculateChangeRate
// ============================================

describe('calculateChangeRate', () => {
  it('기본 계산', () => {
    expect(calculateChangeRate(88, 80)).toBe(10); // +10%
  });

  it('음수 변화율', () => {
    expect(calculateChangeRate(72, 80)).toBe(-10); // -10%
  });

  it('longTermAvg 0 → 0', () => {
    expect(calculateChangeRate(50, 0)).toBe(0);
  });
});

// ============================================
// detectAlerts
// ============================================

describe('detectAlerts', () => {
  it('데이터 2건 이하 → 알림 없음', () => {
    const entries = createEntries([80, 70]);
    expect(detectAlerts(entries)).toHaveLength(0);
  });

  it('연속 3회 하락 (10점+) → 악화 알림', () => {
    // 최신순: 60, 70, 80 → 80→70→60 (연속 하락, 총 20점)
    const entries = createEntries([60, 70, 80]);
    const alerts = detectAlerts(entries);
    const deterioration = alerts.filter((a) => a.type === 'deterioration');
    expect(deterioration.length).toBeGreaterThanOrEqual(1);
    expect(deterioration[0].message).toContain('하락');
  });

  it('연속 3회 하락이지만 총 5점 → 알림 없음 (임계값 미달)', () => {
    const entries = createEntries([73, 75, 78]);
    const alerts = detectAlerts(entries);
    const deterioration = alerts.filter(
      (a) => a.type === 'deterioration' && a.category === 'vitality'
    );
    expect(deterioration).toHaveLength(0);
  });

  it('등급 상승 → 마일스톤 알림', () => {
    const entries = [
      createEntry({ vitalityScore: 80, vitalityGrade: 'A', date: '2026-03-12' }),
      createEntry({ vitalityScore: 70, vitalityGrade: 'B', date: '2026-03-09' }),
      createEntry({ vitalityScore: 65, vitalityGrade: 'B', date: '2026-03-06' }),
    ];
    const alerts = detectAlerts(entries);
    const milestone = alerts.find((a) => a.type === 'milestone');
    expect(milestone).toBeDefined();
    expect(milestone!.message).toContain('B');
    expect(milestone!.message).toContain('A');
  });

  it('등급 동일 → 마일스톤 없음', () => {
    const entries = [
      createEntry({ vitalityScore: 78, vitalityGrade: 'A', date: '2026-03-12' }),
      createEntry({ vitalityScore: 76, vitalityGrade: 'A', date: '2026-03-09' }),
      createEntry({ vitalityScore: 75, vitalityGrade: 'A', date: '2026-03-06' }),
    ];
    const alerts = detectAlerts(entries);
    const milestone = alerts.find((a) => a.type === 'milestone');
    expect(milestone).toBeUndefined();
  });
});

// ============================================
// analyzeCategoryTrends
// ============================================

describe('analyzeCategoryTrends', () => {
  it('카테고리별 트렌드 4개 반환', () => {
    const entries = createEntries([80, 75, 70, 65, 60, 55, 50]);
    const result = analyzeCategoryTrends(entries);
    expect(Object.keys(result)).toEqual(['hydration', 'elasticity', 'clarity', 'tone']);
  });

  it('모든 카테고리 동일 → stable', () => {
    const entries = Array.from({ length: 7 }, (_, i) =>
      createEntry({
        vitalityScore: 70,
        scoreBreakdown: { hydration: 70, elasticity: 70, clarity: 70, tone: 70 },
        date: `2026-03-${String(12 - i).padStart(2, '0')}`,
      })
    );
    const result = analyzeCategoryTrends(entries);
    expect(result.hydration.trend).toBe('stable');
  });
});

// ============================================
// calculateStreak
// ============================================

describe('calculateStreak', () => {
  it('빈 배열 → 0', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('이번 주에만 데이터 → 1주', () => {
    const today = new Date().toISOString().split('T')[0];
    const entries = [createEntry({ vitalityScore: 80, date: today })];
    expect(calculateStreak(entries)).toBe(1);
  });

  it('2주 연속 → 2', () => {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const entries = [
      createEntry({ vitalityScore: 80, date: now.toISOString().split('T')[0] }),
      createEntry({ vitalityScore: 75, date: lastWeek.toISOString().split('T')[0] }),
    ];
    expect(calculateStreak(entries)).toBe(2);
  });
});

// ============================================
// analyzeTrend (통합)
// ============================================

describe('analyzeTrend', () => {
  it('빈 데이터 → 기본값', () => {
    const result = analyzeTrend([], '30d');
    expect(result.entryCount).toBe(0);
    expect(result.shortTermAvg).toBe(0);
    expect(result.trend).toBe('stable');
    expect(result.alerts).toHaveLength(0);
  });

  it('7개 데이터 → 완전한 분석', () => {
    const entries = createEntries([85, 82, 78, 75, 70, 68, 65]);
    const result = analyzeTrend(entries, '30d');

    expect(result.entryCount).toBe(7);
    expect(result.period).toBe('30d');
    expect(result.shortTermAvg).toBeGreaterThan(0);
    expect(result.longTermAvg).toBeGreaterThan(0);
    expect(['improving', 'stable', 'declining']).toContain(result.trend);
    expect(result.categoryTrends).toBeDefined();
    expect(result.analysisStreak).toBeGreaterThanOrEqual(0);
  });

  it('개선 중인 데이터 → improving', () => {
    // 최신순: 90, 85, 80 (단기) vs 90, 85, 80, 70, 60, 55, 50 (장기)
    const entries = createEntries([90, 85, 80, 70, 60, 55, 50]);
    const result = analyzeTrend(entries, '30d');

    expect(result.shortTermAvg).toBeGreaterThan(result.longTermAvg);
    expect(result.trend).toBe('improving');
  });

  it('하락 중인 데이터 → declining', () => {
    const entries = createEntries([50, 55, 60, 70, 80, 85, 90]);
    const result = analyzeTrend(entries, '30d');

    expect(result.shortTermAvg).toBeLessThan(result.longTermAvg);
    expect(result.trend).toBe('declining');
  });
});
