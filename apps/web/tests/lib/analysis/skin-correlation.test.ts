/**
 * 피부 다이어리 상관관계 분석 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import {
  analyzeSkinCorrelation,
  type DiaryEntryForAnalysis,
} from '@/lib/analysis/skin-correlation';

// Supabase 클라이언트 Mock
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOrder = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

beforeEach(() => {
  vi.clearAllMocks();

  // 체이닝 설정
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ gte: mockGte });
  mockGte.mockReturnValue({ lte: mockLte });
  mockLte.mockReturnValue({ order: mockOrder });
});

describe('analyzeSkinCorrelation', () => {
  describe('데이터 부족 시', () => {
    it('5개 미만 데이터일 때 부족 결과를 반환한다', async () => {
      mockOrder.mockResolvedValue({
        data: [createMockEntry(1, 4), createMockEntry(2, 3)],
        error: null,
      });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.confidence).toBe('low');
      expect(result.confidenceReason).toContain('2개');
      expect(result.insights).toContain('상관관계 분석을 위해 최소 5일 이상의 기록이 필요합니다.');
    });

    it('빈 데이터일 때 안내 메시지를 제공한다', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.period.entriesCount).toBe(0);
      expect(result.topInfluencers).toHaveLength(0);
    });
  });

  describe('상관관계 분석', () => {
    it('충분한 데이터로 상관관계를 분석한다', async () => {
      // 수면 시간과 피부 상태가 양의 상관관계를 가진 데이터
      const entries = [
        createMockEntry(1, 2, { sleep_hours: 4 }),
        createMockEntry(2, 3, { sleep_hours: 5 }),
        createMockEntry(3, 3, { sleep_hours: 6 }),
        createMockEntry(4, 4, { sleep_hours: 7 }),
        createMockEntry(5, 5, { sleep_hours: 8 }),
        createMockEntry(6, 5, { sleep_hours: 9 }),
      ];

      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.period.entriesCount).toBe(6);
      expect(result.correlations.sleepHours.score).toBeGreaterThan(0);
      expect(result.correlations.sleepHours.direction).toBe('positive');
    });

    it('스트레스와 피부 상태의 역상관 관계를 감지한다', async () => {
      // 스트레스와 피부 상태가 역상관 관계를 가진 데이터
      const entries = [
        createMockEntry(1, 5, { stress_level: 1 }),
        createMockEntry(2, 4, { stress_level: 2 }),
        createMockEntry(3, 3, { stress_level: 3 }),
        createMockEntry(4, 2, { stress_level: 4 }),
        createMockEntry(5, 1, { stress_level: 5 }),
      ];

      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      // 스트레스는 역상관으로 표시 (부호 반전)
      expect(result.correlations.stressLevel.score).toBeLessThan(0);
    });
  });

  describe('TOP 영향 요인 추출', () => {
    it('가장 영향력 있는 요인 TOP 3을 추출한다', async () => {
      const entries = generateSampleEntries(15);
      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.topInfluencers.length).toBeLessThanOrEqual(3);
      result.topInfluencers.forEach((influencer) => {
        expect(influencer.factor).toBeDefined();
        expect(influencer.factorLabel).toBeDefined();
        expect(['positive', 'negative']).toContain(influencer.impact);
        expect(['strong', 'moderate', 'weak']).toContain(influencer.strength);
      });
    });
  });

  describe('인사이트 생성', () => {
    it('수면 관련 인사이트를 생성한다', async () => {
      const entries = [
        createMockEntry(1, 2, { sleep_hours: 4, sleep_quality: 1 }),
        createMockEntry(2, 3, { sleep_hours: 5, sleep_quality: 2 }),
        createMockEntry(3, 3, { sleep_hours: 6, sleep_quality: 3 }),
        createMockEntry(4, 4, { sleep_hours: 7, sleep_quality: 4 }),
        createMockEntry(5, 5, { sleep_hours: 8, sleep_quality: 5 }),
      ];

      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      // 인사이트가 생성되었는지 확인
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('낮은 루틴 완료율에 대한 인사이트를 제공한다', async () => {
      const entries = generateSampleEntries(10).map((e) => ({
        ...e,
        morning_routine_completed: false,
        evening_routine_completed: false,
      }));

      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      const routineInsight = result.insights.find((i) => i.includes('루틴'));
      expect(routineInsight).toBeDefined();
    });
  });

  describe('권장사항 생성', () => {
    it('데이터 기반 권장사항을 생성한다', async () => {
      const entries = generateSampleEntries(15);
      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      result.recommendations.forEach((rec) => {
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(rec.category).toBeDefined();
        expect(rec.action).toBeDefined();
        expect(rec.reason).toBeDefined();
      });
    });
  });

  describe('신뢰도 평가', () => {
    it('21일 이상이면 높은 신뢰도를 반환한다', async () => {
      const entries = generateSampleEntries(25);
      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.confidence).toBe('high');
      expect(result.confidenceReason).toContain('3주');
    });

    it('14-20일이면 중간 신뢰도를 반환한다', async () => {
      const entries = generateSampleEntries(16);
      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.confidence).toBe('medium');
    });

    it('14일 미만이면 낮은 신뢰도를 반환한다', async () => {
      const entries = generateSampleEntries(10);
      mockOrder.mockResolvedValue({ data: entries, error: null });

      const result = await analyzeSkinCorrelation(mockSupabase as any, 30);

      expect(result.confidence).toBe('low');
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 시 예외를 발생시킨다', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(analyzeSkinCorrelation(mockSupabase as any, 30)).rejects.toThrow(
        '다이어리 데이터를 불러오는데 실패했습니다.'
      );
    });
  });
});

// 헬퍼 함수
function createMockEntry(
  dayOffset: number,
  skinCondition: number,
  overrides: Partial<DiaryEntryForAnalysis> = {}
): DiaryEntryForAnalysis {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  return {
    id: `entry-${dayOffset}`,
    entry_date: date.toISOString().split('T')[0],
    skin_condition: skinCondition,
    sleep_hours: 7,
    sleep_quality: 3,
    water_intake_ml: 1500,
    stress_level: 3,
    weather: 'sunny',
    outdoor_hours: 2,
    morning_routine_completed: true,
    evening_routine_completed: true,
    special_treatments: null,
    ...overrides,
  };
}

function generateSampleEntries(count: number): DiaryEntryForAnalysis[] {
  return Array.from({ length: count }, (_, i) => {
    // 약간의 변동성 추가
    const condition = Math.max(1, Math.min(5, 3 + Math.floor(Math.random() * 3) - 1));
    return createMockEntry(i, condition, {
      sleep_hours: 5 + Math.random() * 4,
      sleep_quality: Math.floor(Math.random() * 5) + 1,
      water_intake_ml: 1000 + Math.random() * 2000,
      stress_level: Math.floor(Math.random() * 5) + 1,
      outdoor_hours: Math.random() * 8,
      morning_routine_completed: Math.random() > 0.3,
      evening_routine_completed: Math.random() > 0.3,
    });
  });
}
