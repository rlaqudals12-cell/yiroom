/**
 * 크로스 모듈 분석 테스트
 *
 * @module tests/lib/analysis/cross-module
 * @description PC-1 ↔ S-1 ↔ C-1 ↔ F-1 간 데이터 공유 및 연동 함수 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getLatestPersonalColorResult,
  canReusePersonalColorImage,
  getRecommendedAnalysisOrder,
  generateCrossInsights,
  ANALYSIS_TABLES,
  ANALYSIS_ROUTES,
  ANALYSIS_LABELS,
  type AnalysisProgress,
  type PersonalColorAssessment,
} from '@/lib/analysis/cross-module';

// =============================================================================
// Mocks
// =============================================================================

function createMockSupabase(responses: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const response = responses[table] || { data: null, error: null };
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(response),
              }),
            }),
            limit: vi.fn().mockResolvedValue(response),
          }),
        }),
      };
    }),
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/cross-module', () => {
  describe('getLatestPersonalColorResult', () => {
    it('should return PC result when data exists', async () => {
      const mockPcResult: PersonalColorAssessment = {
        id: 'pc_123',
        clerk_user_id: 'user_123',
        season: '봄 웜톤',
        undertone: 'warm',
        confidence: 85,
        face_image_url: 'https://example.com/face.jpg',
        created_at: new Date().toISOString(),
      };

      const supabase = createMockSupabase({
        personal_color_assessments: { data: mockPcResult, error: null },
      });

      const result = await getLatestPersonalColorResult(supabase as any, 'user_123');

      expect(result).toEqual(mockPcResult);
      expect(supabase.from).toHaveBeenCalledWith('personal_color_assessments');
    });

    it('should return null when PGRST116 error (no results)', async () => {
      const supabase = createMockSupabase({
        personal_color_assessments: {
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        },
      });

      const result = await getLatestPersonalColorResult(supabase as any, 'user_123');

      expect(result).toBeNull();
    });

    it('should return null on other errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const supabase = createMockSupabase({
        personal_color_assessments: {
          data: null,
          error: { code: 'SOME_ERROR', message: 'Database error' },
        },
      });

      const result = await getLatestPersonalColorResult(supabase as any, 'user_123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('canReusePersonalColorImage', () => {
    it('should return canReuse: true for recent analysis', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3일 전

      const mockPcResult: PersonalColorAssessment = {
        id: 'pc_123',
        clerk_user_id: 'user_123',
        season: '봄 웜톤',
        undertone: 'warm',
        confidence: 85,
        face_image_url: 'https://example.com/face.jpg',
        created_at: recentDate.toISOString(),
      };

      const supabase = createMockSupabase({
        personal_color_assessments: { data: mockPcResult, error: null },
      });

      const result = await canReusePersonalColorImage(supabase as any, 'user_123');

      expect(result.canReuse).toBe(true);
      expect(result.imageUrl).toBe('https://example.com/face.jpg');
      expect(result.pcId).toBe('pc_123');
    });

    it('should return canReuse: false for old analysis (> 7 days)', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10일 전

      const mockPcResult: PersonalColorAssessment = {
        id: 'pc_123',
        clerk_user_id: 'user_123',
        season: '봄 웜톤',
        undertone: 'warm',
        confidence: 85,
        face_image_url: 'https://example.com/face.jpg',
        created_at: oldDate.toISOString(),
      };

      const supabase = createMockSupabase({
        personal_color_assessments: { data: mockPcResult, error: null },
      });

      const result = await canReusePersonalColorImage(supabase as any, 'user_123');

      expect(result.canReuse).toBe(false);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should return canReuse: false when no PC result', async () => {
      const supabase = createMockSupabase({
        personal_color_assessments: {
          data: null,
          error: { code: 'PGRST116', message: 'No rows' },
        },
      });

      const result = await canReusePersonalColorImage(supabase as any, 'user_123');

      expect(result.canReuse).toBe(false);
    });

    it('should return canReuse: false when no face_image_url', async () => {
      const mockPcResult: PersonalColorAssessment = {
        id: 'pc_123',
        clerk_user_id: 'user_123',
        season: '봄 웜톤',
        undertone: 'warm',
        confidence: 85,
        face_image_url: '', // 빈 URL
        created_at: new Date().toISOString(),
      };

      const supabase = createMockSupabase({
        personal_color_assessments: { data: mockPcResult, error: null },
      });

      const result = await canReusePersonalColorImage(supabase as any, 'user_123');

      expect(result.canReuse).toBe(false);
    });
  });

  describe('getRecommendedAnalysisOrder', () => {
    it('should recommend all modules when none completed', () => {
      const progress: AnalysisProgress = {
        personalColor: false,
        face: false,
        skin: false,
        body: false,
        completedCount: 0,
        totalCount: 4,
        percentage: 0,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order.length).toBe(4);
      expect(order[0].module).toBe('personal_color');
      expect(order[0].reason).toContain('퍼스널컬러를 먼저');
    });

    it('should skip completed modules', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: false,
        skin: true,
        body: false,
        completedCount: 2,
        totalCount: 4,
        percentage: 50,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order.length).toBe(2);
      expect(order.map((o) => o.module)).toEqual(['face', 'body']);
    });

    it('should provide context-aware reasons when PC is done', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: false,
        skin: false,
        body: false,
        completedCount: 1,
        totalCount: 4,
        percentage: 25,
      };

      const order = getRecommendedAnalysisOrder(progress);

      // F-1, S-1은 PC 사진 재사용 가능 메시지
      const faceOrder = order.find((o) => o.module === 'face');
      expect(faceOrder?.reason).toContain('퍼스널컬러 사진');

      const skinOrder = order.find((o) => o.module === 'skin');
      expect(skinOrder?.reason).toContain('퍼스널컬러 사진');
    });

    it('should return empty array when all completed', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: true,
        skin: true,
        body: true,
        completedCount: 4,
        totalCount: 4,
        percentage: 100,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order.length).toBe(0);
    });
  });

  describe('generateCrossInsights', () => {
    const mockPcResult: PersonalColorAssessment = {
      id: 'pc_123',
      clerk_user_id: 'user_123',
      season: '봄 웜톤',
      undertone: 'warm',
      confidence: 85,
      face_image_url: 'https://example.com/face.jpg',
      created_at: new Date().toISOString(),
    };

    it('should generate PC + Skin insight', () => {
      const skinResult = { skinType: '복합성' };

      const insights = generateCrossInsights(mockPcResult, skinResult, null);

      expect(insights.length).toBe(1);
      expect(insights[0].type).toBe('color_match');
      expect(insights[0].description).toContain('봄 웜톤');
      expect(insights[0].description).toContain('복합성');
      expect(insights[0].modules).toContain('personal_color');
      expect(insights[0].modules).toContain('skin');
      expect(insights[0].priority).toBe('high');
    });

    it('should generate PC + Body insight', () => {
      const bodyResult = { bodyType: '직사각형' };

      const insights = generateCrossInsights(mockPcResult, null, bodyResult);

      expect(insights.length).toBe(1);
      expect(insights[0].type).toBe('style_tip');
      expect(insights[0].description).toContain('봄 웜톤');
      expect(insights[0].description).toContain('직사각형');
      expect(insights[0].modules).toContain('personal_color');
      expect(insights[0].modules).toContain('body');
      expect(insights[0].priority).toBe('medium');
    });

    it('should generate both insights when all data available', () => {
      const skinResult = { skinType: '건성' };
      const bodyResult = { bodyType: '모래시계' };

      const insights = generateCrossInsights(mockPcResult, skinResult, bodyResult);

      expect(insights.length).toBe(2);
      expect(insights.map((i) => i.type)).toContain('color_match');
      expect(insights.map((i) => i.type)).toContain('style_tip');
    });

    it('should return empty array when PC result is missing', () => {
      const skinResult = { skinType: '건성' };

      const insights = generateCrossInsights(null, skinResult, null);

      expect(insights.length).toBe(0);
    });

    it('should use default values for missing fields', () => {
      const skinResult = {}; // skinType 없음

      const insights = generateCrossInsights(mockPcResult, skinResult, null);

      expect(insights[0].description).toContain('복합성'); // 기본값
    });
  });

  describe('Constants', () => {
    it('should have all analysis modules in ANALYSIS_TABLES', () => {
      expect(ANALYSIS_TABLES).toHaveProperty('personal_color');
      expect(ANALYSIS_TABLES).toHaveProperty('face');
      expect(ANALYSIS_TABLES).toHaveProperty('skin');
      expect(ANALYSIS_TABLES).toHaveProperty('body');

      expect(ANALYSIS_TABLES.personal_color).toBe('personal_color_assessments');
      expect(ANALYSIS_TABLES.face).toBe('face_analyses');
      expect(ANALYSIS_TABLES.skin).toBe('skin_analyses');
      expect(ANALYSIS_TABLES.body).toBe('body_analyses');
    });

    it('should have all analysis modules in ANALYSIS_ROUTES', () => {
      expect(ANALYSIS_ROUTES).toHaveProperty('personal_color');
      expect(ANALYSIS_ROUTES).toHaveProperty('face');
      expect(ANALYSIS_ROUTES).toHaveProperty('skin');
      expect(ANALYSIS_ROUTES).toHaveProperty('body');

      expect(ANALYSIS_ROUTES.personal_color).toBe('/analysis/personal-color');
    });

    it('should have all analysis modules in ANALYSIS_LABELS with ko/en', () => {
      expect(ANALYSIS_LABELS.personal_color.ko).toBe('퍼스널 컬러');
      expect(ANALYSIS_LABELS.personal_color.en).toBe('Personal Color');
      expect(ANALYSIS_LABELS.face.ko).toBe('얼굴형');
      expect(ANALYSIS_LABELS.skin.ko).toBe('피부');
      expect(ANALYSIS_LABELS.body.ko).toBe('체형');
    });
  });
});
