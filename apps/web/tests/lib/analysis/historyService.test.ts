import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateTrend,
  calculatePeriod,
  generateCompareInsights,
  getAnalysisHistory,
  compareAnalyses,
  getTimelineData,
} from '@/lib/analysis/historyService';
import type { AnalysisHistoryItem } from '@/types/analysis-history';

// Supabase 클라이언트 모킹
const mockSupabase = {
  from: vi.fn(),
};

describe('historyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTrend', () => {
    it('returns stable when less than 2 analyses', () => {
      const analyses: AnalysisHistoryItem[] = [
        { id: '1', date: '2024-01-01', overallScore: 75, type: 'skin' },
      ];
      expect(calculateTrend(analyses)).toBe('stable');
    });

    it('returns stable when empty array', () => {
      expect(calculateTrend([])).toBe('stable');
    });

    it('returns improving when score increased by more than 2', () => {
      const analyses: AnalysisHistoryItem[] = [
        { id: '1', date: '2024-01-02', overallScore: 80, type: 'skin' },
        { id: '2', date: '2024-01-01', overallScore: 75, type: 'skin' },
      ];
      expect(calculateTrend(analyses)).toBe('improving');
    });

    it('returns declining when score decreased by more than 2', () => {
      const analyses: AnalysisHistoryItem[] = [
        { id: '1', date: '2024-01-02', overallScore: 70, type: 'skin' },
        { id: '2', date: '2024-01-01', overallScore: 75, type: 'skin' },
      ];
      expect(calculateTrend(analyses)).toBe('declining');
    });

    it('returns stable when score change is within 2 points', () => {
      const analyses: AnalysisHistoryItem[] = [
        { id: '1', date: '2024-01-02', overallScore: 76, type: 'skin' },
        { id: '2', date: '2024-01-01', overallScore: 75, type: 'skin' },
      ];
      expect(calculateTrend(analyses)).toBe('stable');
    });
  });

  describe('calculatePeriod', () => {
    it('returns days for less than 7 days', () => {
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-04T00:00:00Z';
      expect(calculatePeriod(from, to)).toBe('3일');
    });

    it('returns weeks for 7-30 days', () => {
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-15T00:00:00Z';
      expect(calculatePeriod(from, to)).toBe('2주');
    });

    it('returns months for 30-365 days', () => {
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-04-01T00:00:00Z';
      expect(calculatePeriod(from, to)).toBe('3개월');
    });

    it('returns years for more than 365 days', () => {
      const from = '2023-01-01T00:00:00Z';
      const to = '2025-01-01T00:00:00Z';
      expect(calculatePeriod(from, to)).toBe('2년');
    });
  });

  describe('generateCompareInsights', () => {
    describe('skin type', () => {
      const baseBefore: AnalysisHistoryItem = {
        id: '1',
        date: '2024-01-01',
        overallScore: 70,
        type: 'skin',
      };
      const baseAfter: AnalysisHistoryItem = {
        id: '2',
        date: '2024-01-15',
        overallScore: 80,
        type: 'skin',
      };

      it('generates insight for big improvement', () => {
        const insights = generateCompareInsights('skin', baseBefore, baseAfter, {});
        expect(insights).toContain('전반적인 피부 상태가 크게 개선되었어요!');
      });

      it('generates insight for slight improvement', () => {
        const after = { ...baseAfter, overallScore: 73 };
        const insights = generateCompareInsights('skin', baseBefore, after, {});
        expect(insights).toContain('피부 상태가 조금씩 좋아지고 있어요.');
      });

      it('generates insight for decline', () => {
        const after = { ...baseAfter, overallScore: 60 };
        const insights = generateCompareInsights('skin', baseBefore, after, {});
        expect(insights).toContain('피부 상태가 다소 악화되었어요. 관리가 필요해요.');
      });

      it('generates hydration insight', () => {
        const insights = generateCompareInsights('skin', baseBefore, baseAfter, {
          hydration: 10,
        });
        expect(insights).toContain('수분감이 크게 향상되었어요!');
      });

      it('generates pores insight', () => {
        const insights = generateCompareInsights('skin', baseBefore, baseAfter, {
          pores: 8,
        });
        expect(insights).toContain('모공 상태가 개선되고 있어요.');
      });

      it('generates wrinkles insight', () => {
        const insights = generateCompareInsights('skin', baseBefore, baseAfter, {
          wrinkles: 6,
        });
        expect(insights).toContain('주름이 눈에 띄게 줄었어요!');
      });

      it('generates oil level insight', () => {
        const insights = generateCompareInsights('skin', baseBefore, baseAfter, {
          oilLevel: -8,
        });
        expect(insights).toContain('유분 밸런스가 좋아지고 있어요.');
      });
    });

    describe('body type', () => {
      const baseBefore: AnalysisHistoryItem = {
        id: '1',
        date: '2024-01-01',
        overallScore: 70,
        type: 'body',
      };
      const baseAfter: AnalysisHistoryItem = {
        id: '2',
        date: '2024-01-15',
        overallScore: 80,
        type: 'body',
      };

      it('generates insight for big improvement', () => {
        const insights = generateCompareInsights('body', baseBefore, baseAfter, {});
        expect(insights).toContain('체형 밸런스가 크게 개선되었어요!');
      });

      it('generates shoulder insight', () => {
        const insights = generateCompareInsights('body', baseBefore, baseAfter, {
          shoulder: 8,
        });
        expect(insights).toContain('어깨 라인이 좋아지고 있어요.');
      });

      it('generates waist insight', () => {
        const insights = generateCompareInsights('body', baseBefore, baseAfter, {
          waist: 7,
        });
        expect(insights).toContain('허리 라인이 개선되고 있어요.');
      });

      it('generates hip insight', () => {
        const insights = generateCompareInsights('body', baseBefore, baseAfter, {
          hip: 6,
        });
        expect(insights).toContain('힙 라인이 더 균형잡혔어요.');
      });
    });

    describe('hair type', () => {
      const baseBefore: AnalysisHistoryItem = {
        id: '1',
        date: '2024-01-01',
        overallScore: 70,
        type: 'hair',
      };
      const baseAfter: AnalysisHistoryItem = {
        id: '2',
        date: '2024-01-15',
        overallScore: 80,
        type: 'hair',
      };

      it('generates insight for big improvement', () => {
        const insights = generateCompareInsights('hair', baseBefore, baseAfter, {});
        expect(insights).toContain('전반적인 모발 상태가 크게 개선되었어요!');
      });

      it('generates scalp health insight', () => {
        const insights = generateCompareInsights('hair', baseBefore, baseAfter, {
          scalpHealth: 8,
        });
        expect(insights).toContain('두피 건강이 눈에 띄게 개선되었어요!');
      });

      it('generates damage level insight', () => {
        const insights = generateCompareInsights('hair', baseBefore, baseAfter, {
          damageLevel: -8,
        });
        expect(insights).toContain('모발 손상도가 줄었어요!');
      });
    });

    describe('makeup type', () => {
      it('generates makeup insight', () => {
        const before: AnalysisHistoryItem = {
          id: '1',
          date: '2024-01-01',
          overallScore: 75,
          type: 'makeup',
        };
        const after: AnalysisHistoryItem = {
          id: '2',
          date: '2024-01-15',
          overallScore: 80,
          type: 'makeup',
        };
        const insights = generateCompareInsights('makeup', before, after, {});
        expect(insights).toContain('메이크업 스타일 변화를 확인해보세요!');
      });
    });

    it('returns default insight when no specific insights', () => {
      const before: AnalysisHistoryItem = {
        id: '1',
        date: '2024-01-01',
        overallScore: 75,
        type: 'skin',
      };
      const after: AnalysisHistoryItem = {
        id: '2',
        date: '2024-01-15',
        overallScore: 75,
        type: 'skin',
      };
      const insights = generateCompareInsights('skin', before, after, {});
      expect(insights).toContain('꾸준한 관리가 중요해요. 계속 화이팅!');
    });
  });

  describe('getAnalysisHistory', () => {
    it('throws error on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        getAnalysisHistory(mockSupabase as unknown as Parameters<typeof getAnalysisHistory>[0], {
          type: 'skin',
          userId: 'user123',
        })
      ).rejects.toThrow('Database error');
    });

    it('returns empty analyses array when no data', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getAnalysisHistory(
        mockSupabase as unknown as Parameters<typeof getAnalysisHistory>[0],
        {
          type: 'skin',
          userId: 'user123',
        }
      );

      expect(result.analyses).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('transforms skin analysis data correctly', async () => {
      const mockData = [
        {
          id: 'uuid1',
          created_at: '2024-01-15T00:00:00Z',
          overall_score: 80,
          image_url: 'https://example.com/img.jpg',
          skin_type: 'combination',
          hydration: 70,
          oil_level: 50,
          pores: 60,
          pigmentation: 40,
          wrinkles: 30,
          sensitivity: 45,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getAnalysisHistory(
        mockSupabase as unknown as Parameters<typeof getAnalysisHistory>[0],
        {
          type: 'skin',
          userId: 'user123',
        }
      );

      expect(result.analyses.length).toBe(1);
      expect(result.analyses[0]).toMatchObject({
        id: 'uuid1',
        type: 'skin',
        overallScore: 80,
        imageUrl: 'https://example.com/img.jpg',
      });
    });

    it('applies period filter correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await getAnalysisHistory(
        mockSupabase as unknown as Parameters<typeof getAnalysisHistory>[0],
        {
          type: 'skin',
          userId: 'user123',
          period: '1m',
        }
      );

      // gte가 호출되었는지 확인 (기간 필터 적용)
      expect(mockQuery.gte).toHaveBeenCalled();
    });

    it('respects limit parameter with max 50', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await getAnalysisHistory(
        mockSupabase as unknown as Parameters<typeof getAnalysisHistory>[0],
        {
          type: 'skin',
          userId: 'user123',
          limit: 100, // 100을 요청해도 50으로 제한됨
        }
      );

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('compareAnalyses', () => {
    it('throws error for personal-color type', async () => {
      await expect(
        compareAnalyses(mockSupabase as unknown as Parameters<typeof compareAnalyses>[0], {
          type: 'personal-color',
          fromId: 'id1',
          toId: 'id2',
          userId: 'user123',
        })
      ).rejects.toThrow('Personal color comparison not supported');
    });

    it('throws error when from analysis not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle,
      });

      await expect(
        compareAnalyses(mockSupabase as unknown as Parameters<typeof compareAnalyses>[0], {
          type: 'skin',
          fromId: 'id1',
          toId: 'id2',
          userId: 'user123',
        })
      ).rejects.toThrow('From analysis not found or unauthorized');
    });

    it('returns compare response with correct structure', async () => {
      const fromData = {
        id: 'id1',
        created_at: '2024-01-01T00:00:00Z',
        overall_score: 70,
        skin_type: 'oily',
        hydration: 60,
        oil_level: 70,
        pores: 50,
        pigmentation: 40,
        wrinkles: 30,
        sensitivity: 45,
      };

      const toData = {
        id: 'id2',
        created_at: '2024-01-15T00:00:00Z',
        overall_score: 80,
        skin_type: 'combination',
        hydration: 75,
        oil_level: 55,
        pores: 60,
        pigmentation: 35,
        wrinkles: 25,
        sensitivity: 40,
      };

      let callCount = 0;
      const mockSingle = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: callCount === 1 ? fromData : toData,
          error: null,
        });
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle,
      });

      const result = await compareAnalyses(
        mockSupabase as unknown as Parameters<typeof compareAnalyses>[0],
        {
          type: 'skin',
          fromId: 'id1',
          toId: 'id2',
          userId: 'user123',
        }
      );

      expect(result.before).toBeDefined();
      expect(result.after).toBeDefined();
      expect(result.changes.overall).toBe(10);
      expect(result.changes.period).toBe('2주');
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('getTimelineData', () => {
    it('returns timeline data in chronological order', async () => {
      const mockData = [
        { id: '2', created_at: '2024-01-15', overall_score: 80, skin_type: 'dry' },
        { id: '1', created_at: '2024-01-01', overall_score: 70, skin_type: 'dry' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getTimelineData(
        mockSupabase as unknown as Parameters<typeof getTimelineData>[0],
        {
          type: 'skin',
          userId: 'user123',
        }
      );

      // 결과가 오래된 것부터 (날짜 오름차순)
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-15');
    });
  });
});
