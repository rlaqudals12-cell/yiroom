/**
 * BeautyProfile CRUD + On-Read 마이그레이션 테스트
 *
 * @module tests/lib/capsule/profile
 * @description getBeautyProfile, upsertBeautyProfile, updateBeautyProfileField,
 *              buildProfileFromAssessments 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBeautyProfile,
  upsertBeautyProfile,
  updateBeautyProfileField,
  buildProfileFromAssessments,
} from '@/lib/capsule/profile';

// =============================================================================
// Supabase Mock
// =============================================================================

// 체이너블 쿼리 빌더를 생성하는 팩토리
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

// 테이블별 응답을 구성할 수 있는 Supabase mock
let tableResponses: Record<string, { data: unknown; error: unknown }> = {};

const mockSupabaseFrom = vi.fn().mockImplementation((table: string) => {
  const response = tableResponses[table] || { data: null, error: null };
  return createChainMock(response);
});

const mockSupabase = { from: mockSupabaseFrom };

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabase,
}));

// =============================================================================
// 테스트
// =============================================================================

describe('BeautyProfile CRUD', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
    tableResponses = {};
  });

  // ===========================================================================
  // getBeautyProfile
  // ===========================================================================

  describe('getBeautyProfile', () => {
    it('should return existing profile from DB', async () => {
      const now = new Date().toISOString();
      tableResponses['beauty_profiles'] = {
        data: {
          id: 'bp-1',
          clerk_user_id: userId,
          personal_color: { season: 'spring', subType: 'warm', palette: [] },
          skin: { type: 'oily', concerns: ['acne'], scores: {} },
          body: null,
          workout: null,
          nutrition: null,
          hair: null,
          makeup: null,
          oral: null,
          fashion: null,
          completed_modules: ['PC', 'S'],
          personalization_level: 2,
          last_full_update: now,
          created_at: now,
          updated_at: now,
        },
        error: null,
      };

      const profile = await getBeautyProfile(userId);

      expect(profile.userId).toBe(userId);
      expect(profile.personalColor?.season).toBe('spring');
      expect(profile.skin?.type).toBe('oily');
      expect(profile.completedModules).toEqual(['PC', 'S']);
      expect(profile.personalizationLevel).toBe(2);
    });

    it('should throw when DB query fails', async () => {
      tableResponses['beauty_profiles'] = {
        data: null,
        error: { message: 'DB error', code: '500' },
      };

      await expect(getBeautyProfile(userId)).rejects.toThrow('프로필을 불러올 수 없습니다.');
    });

    it('should trigger On-Read migration when profile not found', async () => {
      // beauty_profiles: 없음
      tableResponses['beauty_profiles'] = { data: null, error: null };
      // 모든 분석 테이블도 데이터 없음 (신규 사용자)
      tableResponses['personal_color_assessments'] = { data: null, error: null };
      tableResponses['skin_assessments'] = { data: null, error: null };
      tableResponses['body_assessments'] = { data: null, error: null };
      tableResponses['posture_analyses'] = { data: null, error: null };
      tableResponses['nutrition_settings'] = { data: null, error: null };
      tableResponses['hair_assessments'] = { data: null, error: null };
      tableResponses['makeup_analyses'] = { data: null, error: null };
      tableResponses['oral_health_assessments'] = { data: null, error: null };

      const profile = await getBeautyProfile(userId);

      // 신규 사용자 — 빈 프로필 반환
      expect(profile.userId).toBe(userId);
      expect(profile.completedModules).toEqual([]);
      expect(profile.personalizationLevel).toBe(1);
    });
  });

  // ===========================================================================
  // upsertBeautyProfile
  // ===========================================================================

  describe('upsertBeautyProfile', () => {
    it('should upsert and return profile', async () => {
      const now = new Date().toISOString();
      tableResponses['beauty_profiles'] = {
        data: {
          id: 'bp-2',
          clerk_user_id: userId,
          personal_color: { season: 'winter', subType: 'cool', palette: [] },
          skin: null,
          body: null,
          workout: null,
          nutrition: null,
          hair: null,
          makeup: null,
          oral: null,
          fashion: null,
          completed_modules: ['PC'],
          personalization_level: 1,
          last_full_update: now,
          created_at: now,
          updated_at: now,
        },
        error: null,
      };

      const profile = await upsertBeautyProfile(userId, {
        personalColor: { season: 'winter', subType: 'cool', palette: [] },
        completedModules: ['PC'],
        personalizationLevel: 1,
      });

      expect(profile.userId).toBe(userId);
      expect(profile.personalColor?.season).toBe('winter');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('beauty_profiles');
    });

    it('should throw when upsert fails', async () => {
      tableResponses['beauty_profiles'] = {
        data: null,
        error: { message: 'unique violation' },
      };

      await expect(upsertBeautyProfile(userId, {})).rejects.toThrow('프로필 저장에 실패했습니다.');
    });
  });

  // ===========================================================================
  // updateBeautyProfileField
  // ===========================================================================

  describe('updateBeautyProfileField', () => {
    it('should warn and return for unknown module code', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await updateBeautyProfileField(userId, 'UNKNOWN', {});

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('알 수 없는 모듈 코드'));
      warnSpy.mockRestore();
    });

    it('should create new profile if not exists', async () => {
      // 1차 select — 없음
      tableResponses['beauty_profiles'] = { data: null, error: null };

      await updateBeautyProfileField(userId, 'S', {
        type: 'oily',
        concerns: [],
        scores: {},
      });

      // from('beauty_profiles') 호출 확인
      expect(mockSupabaseFrom).toHaveBeenCalledWith('beauty_profiles');
    });

    it('should update existing profile and add module to completedModules', async () => {
      tableResponses['beauty_profiles'] = {
        data: {
          id: 'bp-3',
          completed_modules: ['PC'],
        },
        error: null,
      };

      await updateBeautyProfileField(userId, 'S', {
        type: 'dry',
        concerns: [],
        scores: {},
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('beauty_profiles');
    });
  });

  // ===========================================================================
  // buildProfileFromAssessments
  // ===========================================================================

  describe('buildProfileFromAssessments', () => {
    it('should build profile from multiple assessment tables', async () => {
      // 각 분석 테이블에 데이터 설정
      tableResponses['personal_color_assessments'] = {
        data: { season: 'summer', undertone: 'cool', best_colors: ['#AAA'] },
        error: null,
      };
      tableResponses['skin_assessments'] = {
        data: {
          skin_type: 'dry',
          concerns: ['건조'],
          scores: { scoreBreakdown: { hydration: 30 } },
        },
        error: null,
      };
      tableResponses['body_assessments'] = {
        data: { body_shape: 'triangle', analysis_data: { ratios: { shoulderToWaistRatio: 1.1 } } },
        error: null,
      };
      tableResponses['posture_analyses'] = { data: null, error: null };
      tableResponses['nutrition_settings'] = { data: null, error: null };
      tableResponses['hair_assessments'] = { data: null, error: null };
      tableResponses['makeup_analyses'] = { data: null, error: null };
      tableResponses['oral_health_assessments'] = { data: null, error: null };
      // upsert 시 반환
      tableResponses['beauty_profiles'] = {
        data: null,
        error: null,
      };

      const profile = await buildProfileFromAssessments(userId);

      // 3개 모듈 완료 + Fashion (body에서 파생)
      expect(profile.personalColor?.season).toBe('summer');
      expect(profile.skin?.type).toBe('dry');
      expect(profile.body?.shape).toBe('triangle');
      expect(profile.completedModules).toContain('PC');
      expect(profile.completedModules).toContain('S');
      expect(profile.completedModules).toContain('C');
      expect(profile.completedModules).toContain('Fashion');
      // 4개 모듈 → personalizationLevel 3
      expect(profile.personalizationLevel).toBe(3);
    });

    it('should return empty profile when no assessments exist', async () => {
      tableResponses['personal_color_assessments'] = { data: null, error: null };
      tableResponses['skin_assessments'] = { data: null, error: null };
      tableResponses['body_assessments'] = { data: null, error: null };
      tableResponses['posture_analyses'] = { data: null, error: null };
      tableResponses['nutrition_settings'] = { data: null, error: null };
      tableResponses['hair_assessments'] = { data: null, error: null };
      tableResponses['makeup_analyses'] = { data: null, error: null };
      tableResponses['oral_health_assessments'] = { data: null, error: null };
      tableResponses['beauty_profiles'] = { data: null, error: null };

      const profile = await buildProfileFromAssessments(userId);

      expect(profile.completedModules).toEqual([]);
      expect(profile.personalizationLevel).toBe(1);
      expect(profile.personalColor).toBeUndefined();
      expect(profile.skin).toBeUndefined();
    });

    it('should continue even if some assessment queries fail', async () => {
      // PC 성공, 나머지는 에러
      tableResponses['personal_color_assessments'] = {
        data: { season: 'autumn', undertone: 'warm', best_colors: [] },
        error: null,
      };
      // skin 에러
      tableResponses['skin_assessments'] = {
        data: null,
        error: { message: 'timeout' },
      };
      tableResponses['body_assessments'] = { data: null, error: null };
      tableResponses['posture_analyses'] = { data: null, error: null };
      tableResponses['nutrition_settings'] = { data: null, error: null };
      tableResponses['hair_assessments'] = { data: null, error: null };
      tableResponses['makeup_analyses'] = { data: null, error: null };
      tableResponses['oral_health_assessments'] = { data: null, error: null };
      tableResponses['beauty_profiles'] = { data: null, error: null };

      const profile = await buildProfileFromAssessments(userId);

      // PC만 성공
      expect(profile.personalColor?.season).toBe('autumn');
      expect(profile.skin).toBeUndefined();
      expect(profile.completedModules).toContain('PC');
      expect(profile.completedModules).not.toContain('S');
    });

    it('should add Fashion module when body data exists', async () => {
      tableResponses['personal_color_assessments'] = { data: null, error: null };
      tableResponses['skin_assessments'] = { data: null, error: null };
      tableResponses['body_assessments'] = {
        data: { body_shape: 'oval', styling_recommendations: { silhouettes: ['A라인'] } },
        error: null,
      };
      tableResponses['posture_analyses'] = { data: null, error: null };
      tableResponses['nutrition_settings'] = { data: null, error: null };
      tableResponses['hair_assessments'] = { data: null, error: null };
      tableResponses['makeup_analyses'] = { data: null, error: null };
      tableResponses['oral_health_assessments'] = { data: null, error: null };
      tableResponses['beauty_profiles'] = { data: null, error: null };

      const profile = await buildProfileFromAssessments(userId);

      expect(profile.completedModules).toContain('C');
      expect(profile.completedModules).toContain('Fashion');
      expect(profile.fashion?.style).toBe('A라인');
    });
  });
});
