/**
 * Feature Flags 관리 테스트
 *
 * @module tests/lib/admin/feature-flags
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 K-5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted를 사용하여 mock을 먼저 정의
const { mockSupabaseClient, mockOrder, mockSingle, mockEq } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn();

  const client = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  };

  // 체인 설정
  client.from.mockReturnValue(client);
  client.select.mockReturnValue(client);
  client.insert.mockReturnValue(client);
  client.update.mockReturnValue(client);
  client.delete.mockReturnValue(client);
  client.eq.mockReturnValue(client);

  return { mockSupabaseClient: client, mockOrder, mockSingle, mockEq };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabaseClient,
}));

vi.mock('@/lib/utils/logger', () => ({
  adminLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  getAllFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  toggleFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag,
  getEnabledFeatures,
  getCachedFeatureFlags,
  invalidateFeatureFlagCache,
  type FeatureFlag,
  type FeatureFlagKey,
} from '@/lib/admin/feature-flags';

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockFeatureFlagRow = {
  id: 'flag_123',
  key: 'analysis_skin',
  name: '피부 분석',
  description: '피부 분석 기능',
  enabled: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockFeatureFlagRows = [
  mockFeatureFlagRow,
  {
    id: 'flag_456',
    key: 'workout_module',
    name: '운동 모듈',
    description: '운동 추천 기능',
    enabled: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'flag_789',
    key: 'nutrition_module',
    name: '영양 모듈',
    description: null,
    enabled: true,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-12T00:00:00Z',
  },
];

describe('Feature Flags Module', () => {
  beforeEach(() => {
    // mock 결과 초기화 (체인은 유지)
    mockOrder.mockReset();
    mockSingle.mockReset();
    mockEq.mockReset().mockReturnValue(mockSupabaseClient);
    // 캐시 초기화
    invalidateFeatureFlagCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // getAllFeatureFlags
  // ============================================================================

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags', async () => {
      mockOrder.mockResolvedValue({
        data: mockFeatureFlagRows,
        error: null,
      });

      const result = await getAllFeatureFlags();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 'flag_123',
        key: 'analysis_skin',
        name: '피부 분석',
        enabled: true,
      });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return empty array on error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const result = await getAllFeatureFlags();

      expect(result).toEqual([]);
    });

    it('should convert DB row to FeatureFlag correctly', async () => {
      mockOrder.mockResolvedValue({
        data: [mockFeatureFlagRow],
        error: null,
      });

      const result = await getAllFeatureFlags();

      expect(result[0]).toEqual({
        id: 'flag_123',
        key: 'analysis_skin',
        name: '피부 분석',
        description: '피부 분석 기능',
        enabled: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      });
    });
  });

  // ============================================================================
  // getFeatureFlag
  // ============================================================================

  describe('getFeatureFlag', () => {
    it('should return specific feature flag', async () => {
      mockSingle.mockResolvedValue({
        data: mockFeatureFlagRow,
        error: null,
      });

      const result = await getFeatureFlag('analysis_skin');

      expect(result).toMatchObject({
        key: 'analysis_skin',
        name: '피부 분석',
        enabled: true,
      });
    });

    it('should return null when flag not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await getFeatureFlag('analysis_skin');

      expect(result).toBeNull();
    });

    it('should handle null description', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockFeatureFlagRow, description: null },
        error: null,
      });

      const result = await getFeatureFlag('analysis_skin');

      expect(result?.description).toBeNull();
    });
  });

  // ============================================================================
  // isFeatureEnabled
  // ============================================================================

  describe('isFeatureEnabled', () => {
    it('should return true for enabled feature', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockFeatureFlagRow, enabled: true },
        error: null,
      });

      const result = await isFeatureEnabled('analysis_skin');

      expect(result).toBe(true);
    });

    it('should return false for disabled feature', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockFeatureFlagRow, enabled: false },
        error: null,
      });

      const result = await isFeatureEnabled('analysis_skin');

      expect(result).toBe(false);
    });

    it('should return true (default) when flag not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await isFeatureEnabled('analysis_skin');

      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // toggleFeatureFlag
  // ============================================================================

  describe('toggleFeatureFlag', () => {
    it('should toggle feature flag to enabled', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockFeatureFlagRow, enabled: true },
        error: null,
      });

      const result = await toggleFeatureFlag('analysis_skin', true);

      expect(result?.enabled).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ enabled: true });
    });

    it('should toggle feature flag to disabled', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockFeatureFlagRow, enabled: false },
        error: null,
      });

      const result = await toggleFeatureFlag('analysis_skin', false);

      expect(result?.enabled).toBe(false);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ enabled: false });
    });

    it('should return null on error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await toggleFeatureFlag('analysis_skin', true);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // createFeatureFlag
  // ============================================================================

  describe('createFeatureFlag', () => {
    it('should create new feature flag', async () => {
      mockSingle.mockResolvedValue({
        data: mockFeatureFlagRow,
        error: null,
      });

      const result = await createFeatureFlag({
        key: 'analysis_skin',
        name: '피부 분석',
        description: '피부 분석 기능',
        enabled: true,
      });

      expect(result).toMatchObject({
        key: 'analysis_skin',
        name: '피부 분석',
        enabled: true,
      });
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await createFeatureFlag({
        key: 'analysis_skin',
        name: '피부 분석',
        description: null,
        enabled: true,
      });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // deleteFeatureFlag
  // ============================================================================

  describe('deleteFeatureFlag', () => {
    it('should delete feature flag successfully', async () => {
      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteFeatureFlag('analysis_skin');

      expect(result).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockEq.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const result = await deleteFeatureFlag('analysis_skin');

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // getEnabledFeatures
  // ============================================================================

  describe('getEnabledFeatures', () => {
    it('should return enabled status for multiple features', async () => {
      mockOrder.mockResolvedValue({
        data: mockFeatureFlagRows,
        error: null,
      });

      const result = await getEnabledFeatures([
        'analysis_skin',
        'workout_module',
        'nutrition_module',
      ]);

      expect(result).toEqual({
        analysis_skin: true,
        workout_module: false,
        nutrition_module: true,
      });
    });

    it('should return true for non-existent features (default)', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getEnabledFeatures(['analysis_skin']);

      expect(result.analysis_skin).toBe(true);
    });
  });

  // ============================================================================
  // 캐시 테스트
  // ============================================================================

  describe('Feature Flag Cache', () => {
    it('should cache feature flags', async () => {
      mockOrder.mockResolvedValue({
        data: mockFeatureFlagRows,
        error: null,
      });

      // 첫 번째 호출
      const result1 = await getCachedFeatureFlags();
      // 두 번째 호출 (캐시에서)
      const result2 = await getCachedFeatureFlags();

      expect(result1).toEqual(result2);
      // 첫 번째 호출만 DB 조회
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache', async () => {
      mockOrder.mockResolvedValue({
        data: mockFeatureFlagRows,
        error: null,
      });

      // 첫 번째 호출
      await getCachedFeatureFlags();

      // 캐시 무효화
      invalidateFeatureFlagCache();

      // 두 번째 호출 (다시 DB 조회)
      await getCachedFeatureFlags();

      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // FeatureFlagKey 타입 테스트
  // ============================================================================

  describe('FeatureFlagKey Type', () => {
    it('should have valid feature flag keys', () => {
      const validKeys: FeatureFlagKey[] = [
        'analysis_personal_color',
        'analysis_skin',
        'analysis_body',
        'workout_module',
        'nutrition_module',
        'reports_module',
        'product_recommendations',
        'product_wishlist',
        'ai_qa',
        'ingredient_warning',
        'price_crawler',
        'share_results',
      ];

      expect(validKeys).toHaveLength(12);
    });
  });

  // ============================================================================
  // FeatureFlag 타입 테스트
  // ============================================================================

  describe('FeatureFlag Type', () => {
    it('should have correct FeatureFlag structure', () => {
      const flag: FeatureFlag = {
        id: 'flag_123',
        key: 'analysis_skin',
        name: '피부 분석',
        description: '피부 분석 기능',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(flag.id).toBeDefined();
      expect(flag.key).toBeDefined();
      expect(flag.name).toBeDefined();
      expect(flag.enabled).toBeDefined();
      expect(flag.createdAt).toBeInstanceOf(Date);
      expect(flag.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow null description', () => {
      const flag: FeatureFlag = {
        id: 'flag_123',
        key: 'analysis_skin',
        name: '피부 분석',
        description: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(flag.description).toBeNull();
    });
  });
});
