/**
 * 크로스 모듈 인사이트 통합 테스트
 *
 * @module tests/lib/insights/cross-module-insights
 * @description fetchAnalysisDataBundle, getAnalysisProgress, generateUserInsights 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import {
  fetchAnalysisDataBundle,
  getAnalysisProgress,
  generateUserInsights,
  generateModuleInsights,
  getRecommendedAnalysisOrder,
  canReusePersonalColorImage,
  type AnalysisProgress,
} from '@/lib/insights/cross-module-insights';

// =============================================================================
// Mock 설정
// =============================================================================

// Supabase 클라이언트 Mock
const createMockSupabase = (responses: Record<string, unknown>) => {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(responses[table] || { data: null, error: null }),
    })),
  };
};

// Mock 데이터
const mockPersonalColorData = {
  data: {
    season: '봄 웜톤',
    undertone: 'warm',
    confidence: 85,
    sub_type: 'bright',
    color_palette: ['#FF6B6B', '#4ECDC4'],
  },
  error: null,
};

const mockSkinData = {
  data: {
    skin_type: '복합성',
    concerns: ['모공', '피지'],
    hydration_level: 65,
    oil_level: 70,
    sensitivity_level: 30,
  },
  error: null,
};

const mockBodyData = {
  data: {
    body_type: '직사각형',
    shoulder_type: '보통',
    proportions: { shoulder: 40, waist: 30, hip: 38 },
  },
  error: null,
};

const mockFaceData = {
  data: {
    face_shape: '계란형',
    facial_features: { eyeShape: '쌍꺼풀', noseShape: '보통' },
  },
  error: null,
};

const mockHairData = {
  data: {
    hair_type: '직모',
    hair_condition: '건강',
    scalp_condition: '정상',
  },
  error: null,
};

const mockOralHealthData = {
  data: {
    gum_health_status: '양호',
    tooth_shade: 'A2',
    inflammation_score: 10,
  },
  error: null,
};

// =============================================================================
// 테스트
// =============================================================================

describe('lib/insights/cross-module-insights', () => {
  const userId = 'test_user_123';

  // ---------------------------------------------------------------------------
  // fetchAnalysisDataBundle
  // ---------------------------------------------------------------------------

  describe('fetchAnalysisDataBundle', () => {
    it('should fetch all analysis data when no modules specified', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: mockBodyData,
        face_analyses: mockFaceData,
        hair_analyses: mockHairData,
        oral_health_assessments: mockOralHealthData,
      });

      const result = await fetchAnalysisDataBundle(mockSupabase as any, userId);

      expect(result.personalColor).not.toBeNull();
      expect(result.skin).not.toBeNull();
      expect(result.body).not.toBeNull();
      expect(result.face).not.toBeNull();
      expect(result.hair).not.toBeNull();
      expect(result.oralHealth).not.toBeNull();
    });

    it('should fetch only specified modules', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
      });

      const result = await fetchAnalysisDataBundle(mockSupabase as any, userId, [
        'personal_color',
        'skin',
      ]);

      expect(result.personalColor).not.toBeNull();
      expect(result.skin).not.toBeNull();
      // 요청하지 않은 모듈은 null
      expect(result.body).toBeNull();
      expect(result.face).toBeNull();
    });

    it('should return null for modules with DB errors', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: { data: null, error: { message: 'DB error' } },
        skin_analyses: mockSkinData,
      });

      const result = await fetchAnalysisDataBundle(mockSupabase as any, userId);

      expect(result.personalColor).toBeNull();
      expect(result.skin).not.toBeNull();
    });

    it('should transform DB fields to camelCase', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
      });

      const result = await fetchAnalysisDataBundle(mockSupabase as any, userId, ['personal_color']);

      expect(result.personalColor).toEqual({
        season: '봄 웜톤',
        undertone: 'warm',
        confidence: 85,
        subType: 'bright',
        colorPalette: ['#FF6B6B', '#4ECDC4'],
      });
    });

    it('should use default confidence when not provided', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: {
          data: { ...mockPersonalColorData.data, confidence: null },
          error: null,
        },
      });

      const result = await fetchAnalysisDataBundle(mockSupabase as any, userId, ['personal_color']);

      expect(result.personalColor?.confidence).toBe(70);
    });
  });

  // ---------------------------------------------------------------------------
  // getAnalysisProgress
  // ---------------------------------------------------------------------------

  describe('getAnalysisProgress', () => {
    it('should return 100% when all analyses are complete', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: mockBodyData,
        face_analyses: mockFaceData,
        hair_analyses: mockHairData,
        oral_health_assessments: mockOralHealthData,
      });

      const progress = await getAnalysisProgress(mockSupabase as any, userId);

      expect(progress.completedCount).toBe(6);
      expect(progress.totalCount).toBe(6);
      expect(progress.percentage).toBe(100);
      expect(progress.personalColor).toBe(true);
      expect(progress.skin).toBe(true);
      expect(progress.body).toBe(true);
    });

    it('should return 0% when no analyses are complete', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: { data: null, error: null },
        skin_analyses: { data: null, error: null },
        body_analyses: { data: null, error: null },
        face_analyses: { data: null, error: null },
        hair_analyses: { data: null, error: null },
        oral_health_assessments: { data: null, error: null },
      });

      const progress = await getAnalysisProgress(mockSupabase as any, userId);

      expect(progress.completedCount).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.personalColor).toBe(false);
    });

    it('should calculate partial progress correctly', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: { data: null, error: null },
        face_analyses: { data: null, error: null },
        hair_analyses: { data: null, error: null },
        oral_health_assessments: { data: null, error: null },
      });

      const progress = await getAnalysisProgress(mockSupabase as any, userId);

      expect(progress.completedCount).toBe(2);
      expect(progress.percentage).toBe(33); // 2/6 = 33%
      expect(progress.personalColor).toBe(true);
      expect(progress.skin).toBe(true);
      expect(progress.body).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedAnalysisOrder
  // ---------------------------------------------------------------------------

  describe('getRecommendedAnalysisOrder', () => {
    it('should recommend PC-1 first when not completed', () => {
      const progress: AnalysisProgress = {
        personalColor: false,
        face: false,
        skin: false,
        body: false,
        hair: false,
        oralHealth: false,
        completedCount: 0,
        totalCount: 6,
        percentage: 0,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order[0].module).toBe('personal_color');
      expect(order[0].reason).toContain('퍼스널컬러');
    });

    it('should recommend F-1 second when PC-1 is completed', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: false,
        skin: false,
        body: false,
        hair: false,
        oralHealth: false,
        completedCount: 1,
        totalCount: 6,
        percentage: 17,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order[0].module).toBe('face');
      expect(order[0].reason).toContain('퍼스널컬러 사진으로');
    });

    it('should return empty array when all analyses are complete', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: true,
        skin: true,
        body: true,
        hair: true,
        oralHealth: true,
        completedCount: 6,
        totalCount: 6,
        percentage: 100,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order).toHaveLength(0);
    });

    it('should mention image reuse for related analyses', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: false,
        skin: false,
        body: false,
        hair: false,
        oralHealth: false,
        completedCount: 1,
        totalCount: 6,
        percentage: 17,
      };

      const order = getRecommendedAnalysisOrder(progress);
      const skinRec = order.find((o) => o.module === 'skin');

      expect(skinRec?.reason).toContain('퍼스널컬러 사진으로');
    });

    it('should mention full body photo needed for C-1', () => {
      const progress: AnalysisProgress = {
        personalColor: true,
        face: true,
        skin: true,
        body: false,
        hair: true,
        oralHealth: true,
        completedCount: 5,
        totalCount: 6,
        percentage: 83,
      };

      const order = getRecommendedAnalysisOrder(progress);

      expect(order[0].module).toBe('body');
      expect(order[0].reason).toContain('전신 사진');
    });
  });

  // ---------------------------------------------------------------------------
  // canReusePersonalColorImage
  // ---------------------------------------------------------------------------

  describe('canReusePersonalColorImage', () => {
    it('should allow reuse for recent analysis (within 7 days)', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);

      const mockSupabase = createMockSupabase({
        personal_color_assessments: {
          data: {
            id: 'pc_123',
            face_image_url: 'https://example.com/image.jpg',
            created_at: recentDate.toISOString(),
          },
          error: null,
        },
      });

      const result = await canReusePersonalColorImage(mockSupabase as any, userId);

      expect(result.canReuse).toBe(true);
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
      expect(result.pcId).toBe('pc_123');
    });

    it('should not allow reuse for old analysis (over 7 days)', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const mockSupabase = createMockSupabase({
        personal_color_assessments: {
          data: {
            id: 'pc_123',
            face_image_url: 'https://example.com/image.jpg',
            created_at: oldDate.toISOString(),
          },
          error: null,
        },
      });

      const result = await canReusePersonalColorImage(mockSupabase as any, userId);

      expect(result.canReuse).toBe(false);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should not allow reuse when no image URL exists', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: {
          data: {
            id: 'pc_123',
            face_image_url: null,
            created_at: new Date().toISOString(),
          },
          error: null,
        },
      });

      const result = await canReusePersonalColorImage(mockSupabase as any, userId);

      expect(result.canReuse).toBe(false);
    });

    it('should not allow reuse when no analysis exists', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: { data: null, error: null },
      });

      const result = await canReusePersonalColorImage(mockSupabase as any, userId);

      expect(result.canReuse).toBe(false);
    });

    it('should handle DB errors gracefully', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: { data: null, error: { message: 'DB error' } },
      });

      const result = await canReusePersonalColorImage(mockSupabase as any, userId);

      expect(result.canReuse).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // generateUserInsights (integration with generator)
  // ---------------------------------------------------------------------------

  describe('generateUserInsights', () => {
    it('should generate insights from fetched data', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: mockBodyData,
        face_analyses: mockFaceData,
        hair_analyses: mockHairData,
        oral_health_assessments: mockOralHealthData,
      });

      const result = await generateUserInsights(mockSupabase as any, userId);

      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('totalGenerated');
      expect(result).toHaveProperty('returnedCount');
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should respect maxInsights option', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: mockBodyData,
        face_analyses: mockFaceData,
        hair_analyses: mockHairData,
        oral_health_assessments: mockOralHealthData,
      });

      const result = await generateUserInsights(mockSupabase as any, userId, {
        maxInsights: 3,
      });

      expect(result.returnedCount).toBeLessThanOrEqual(3);
    });

    it('should return empty insights when no data exists', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: { data: null, error: null },
        skin_analyses: { data: null, error: null },
        body_analyses: { data: null, error: null },
        face_analyses: { data: null, error: null },
        hair_analyses: { data: null, error: null },
        oral_health_assessments: { data: null, error: null },
      });

      const result = await generateUserInsights(mockSupabase as any, userId);

      expect(result.totalGenerated).toBe(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // generateModuleInsights
  // ---------------------------------------------------------------------------

  describe('generateModuleInsights', () => {
    it('should filter insights by specified module', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
        body_analyses: mockBodyData,
        face_analyses: mockFaceData,
        hair_analyses: mockHairData,
        oral_health_assessments: mockOralHealthData,
      });

      const result = await generateModuleInsights(mockSupabase as any, userId, 'skin');

      // 모든 인사이트가 skin 모듈을 포함해야 함
      result.insights.forEach((insight) => {
        expect(insight.relatedModules).toContain('skin');
      });
    });

    it('should fetch related modules for cross-module insights', async () => {
      const mockSupabase = createMockSupabase({
        personal_color_assessments: mockPersonalColorData,
        skin_analyses: mockSkinData,
      });

      // skin 모듈 요청 시 personal_color도 조회됨 (관련 모듈)
      const result = await generateModuleInsights(mockSupabase as any, userId, 'skin');

      expect(result).toHaveProperty('insights');
    });
  });
});
