/**
 * 수면-피부/운동 상관 분석 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateSleepQuality,
  analyzeSleepTrend,
  predictSkinImpact,
  getSkinImpactDetails,
  recommendWorkoutAdjustment,
  analyzeSleepCorrelation,
} from '@/lib/health-device/sleep-analysis';
import type { SleepRecord } from '@/lib/health-device/types';

function mockSleepRecord(overrides: Partial<SleepRecord> = {}): SleepRecord {
  return {
    date: '2026-03-14',
    bedTime: '2026-03-13T23:00:00Z',
    wakeTime: '2026-03-14T07:00:00Z',
    totalMinutes: 480, // 8시간
    stages: { awake: 20, light: 220, deep: 120, rem: 120 },
    qualityScore: 85,
    source: 'apple_health',
    ...overrides,
  };
}

describe('sleep-analysis', () => {
  // ============================================
  // calculateSleepQuality
  // ============================================
  describe('calculateSleepQuality', () => {
    it('이상적 수면 → 90+ 점수', () => {
      const record = mockSleepRecord({
        totalMinutes: 480,
        stages: { awake: 10, light: 200, deep: 130, rem: 140 },
      });
      const score = calculateSleepQuality(record);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('짧은 수면 (5시간) → 낮은 점수', () => {
      const record = mockSleepRecord({
        totalMinutes: 300,
        stages: { awake: 30, light: 150, deep: 60, rem: 60 },
      });
      const score = calculateSleepQuality(record);
      // 비율이 양호해도 시간 부족으로 만점 불가
      expect(score).toBeLessThan(80);
    });

    it('깊은잠 부족 → 낮은 점수', () => {
      const record = mockSleepRecord({
        totalMinutes: 480,
        stages: { awake: 20, light: 350, deep: 30, rem: 80 },
      });
      const score = calculateSleepQuality(record);
      expect(score).toBeLessThan(80);
    });

    it('자주 깨는 수면 → 페널티', () => {
      const record = mockSleepRecord({
        totalMinutes: 480,
        stages: { awake: 80, light: 200, deep: 100, rem: 100 },
      });
      const score = calculateSleepQuality(record);
      const ideal = calculateSleepQuality(
        mockSleepRecord({
          totalMinutes: 480,
          stages: { awake: 10, light: 200, deep: 130, rem: 140 },
        })
      );
      expect(score).toBeLessThan(ideal);
    });

    it('0분 수면 → 0점', () => {
      const record = mockSleepRecord({
        totalMinutes: 0,
        stages: { awake: 0, light: 0, deep: 0, rem: 0 },
      });
      expect(calculateSleepQuality(record)).toBe(0);
    });

    it('100 초과하지 않음', () => {
      const record = mockSleepRecord({
        totalMinutes: 480,
        stages: { awake: 0, light: 150, deep: 180, rem: 150 },
      });
      expect(calculateSleepQuality(record)).toBeLessThanOrEqual(100);
    });
  });

  // ============================================
  // analyzeSleepTrend
  // ============================================
  describe('analyzeSleepTrend', () => {
    it('데이터 3개 미만 → stable', () => {
      expect(analyzeSleepTrend([mockSleepRecord()])).toBe('stable');
    });

    it('개선 추세 → improving', () => {
      const records = [
        mockSleepRecord({ date: '2026-03-10', qualityScore: 50 }),
        mockSleepRecord({ date: '2026-03-11', qualityScore: 55 }),
        mockSleepRecord({ date: '2026-03-12', qualityScore: 60 }),
        mockSleepRecord({ date: '2026-03-13', qualityScore: 80 }),
        mockSleepRecord({ date: '2026-03-14', qualityScore: 85 }),
      ];
      expect(analyzeSleepTrend(records)).toBe('improving');
    });

    it('악화 추세 → declining', () => {
      const records = [
        mockSleepRecord({ date: '2026-03-10', qualityScore: 85 }),
        mockSleepRecord({ date: '2026-03-11', qualityScore: 80 }),
        mockSleepRecord({ date: '2026-03-12', qualityScore: 55 }),
        mockSleepRecord({ date: '2026-03-13', qualityScore: 50 }),
        mockSleepRecord({ date: '2026-03-14', qualityScore: 45 }),
      ];
      expect(analyzeSleepTrend(records)).toBe('declining');
    });

    it('변화 없음 → stable', () => {
      const records = [
        mockSleepRecord({ date: '2026-03-10', qualityScore: 70 }),
        mockSleepRecord({ date: '2026-03-11', qualityScore: 72 }),
        mockSleepRecord({ date: '2026-03-12', qualityScore: 71 }),
        mockSleepRecord({ date: '2026-03-13', qualityScore: 73 }),
        mockSleepRecord({ date: '2026-03-14', qualityScore: 72 }),
      ];
      expect(analyzeSleepTrend(records)).toBe('stable');
    });
  });

  // ============================================
  // predictSkinImpact
  // ============================================
  describe('predictSkinImpact', () => {
    it('70+ → positive', () => {
      expect(predictSkinImpact(80)).toBe('positive');
    });

    it('40 이하 → negative', () => {
      expect(predictSkinImpact(35)).toBe('negative');
    });

    it('41-69 → neutral', () => {
      expect(predictSkinImpact(55)).toBe('neutral');
    });
  });

  // ============================================
  // getSkinImpactDetails
  // ============================================
  describe('getSkinImpactDetails', () => {
    it('positive → 피부 재생 언급', () => {
      const details = getSkinImpactDetails('positive', 80, 480);
      expect(details.some((d) => d.includes('재생'))).toBe(true);
    });

    it('negative + 짧은 수면 → 다크서클 언급', () => {
      const details = getSkinImpactDetails('negative', 30, 300);
      expect(details.some((d) => d.includes('다크서클'))).toBe(true);
    });

    it('neutral → 개선 권장', () => {
      const details = getSkinImpactDetails('neutral', 55, 420);
      expect(details.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // recommendWorkoutAdjustment
  // ============================================
  describe('recommendWorkoutAdjustment', () => {
    it('수면 부족 → decrease', () => {
      expect(recommendWorkoutAdjustment(30, 300)).toBe('decrease');
    });

    it('충분한 수면 → increase', () => {
      expect(recommendWorkoutAdjustment(80, 480)).toBe('increase');
    });

    it('보통 수면 → maintain', () => {
      expect(recommendWorkoutAdjustment(60, 420)).toBe('maintain');
    });
  });

  // ============================================
  // analyzeSleepCorrelation (통합)
  // ============================================
  describe('analyzeSleepCorrelation', () => {
    it('빈 배열 → 기본 결과', () => {
      const result = analyzeSleepCorrelation([]);
      expect(result.periodDays).toBe(0);
      expect(result.skinImpact).toBe('neutral');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('양호한 수면 데이터 → positive 결과', () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        mockSleepRecord({
          date: `2026-03-${8 + i}`,
          qualityScore: 80 + i,
        })
      );
      const result = analyzeSleepCorrelation(records);
      expect(result.periodDays).toBe(7);
      expect(result.avgSleepScore).toBeGreaterThan(70);
      expect(result.skinImpact).toBe('positive');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('부족한 수면 데이터 → negative 결과', () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        mockSleepRecord({
          date: `2026-03-${10 + i}`,
          qualityScore: 25 + i,
          totalMinutes: 300,
        })
      );
      const result = analyzeSleepCorrelation(records);
      expect(result.skinImpact).toBe('negative');
      expect(result.workoutAdjustment).toBe('decrease');
    });

    it('권장사항에 수면 부족 언급', () => {
      const records = [mockSleepRecord({ qualityScore: 60, totalMinutes: 350 })];
      const result = analyzeSleepCorrelation(records);
      expect(result.recommendations.some((r) => r.includes('7시간'))).toBe(true);
    });
  });
});
