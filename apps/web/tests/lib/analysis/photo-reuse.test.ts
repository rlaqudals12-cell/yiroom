/**
 * 사진 재사용 로직 테스트
 *
 * @module tests/lib/analysis/photo-reuse
 * @description checkPhotoReuseEligibility, REUSE_CONDITIONS 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  REUSE_CONDITIONS,
  checkPhotoReuseEligibility,
  saveAnalysisImage,
  reuseAnalysisImage,
  revokeImageConsent,
} from '@/lib/analysis/photo-reuse';

// =============================================================================
// Mocks
// =============================================================================

function createMockSupabase(options: {
  selectResult?: { data: unknown; error: unknown };
  insertResult?: { data: unknown; error: unknown };
  deleteResult?: { error: unknown };
  signedUrlResult?: { data: { signedUrl: string } | null; error: unknown };
  removeResult?: { error: unknown };
}) {
  const {
    selectResult = { data: null, error: null },
    insertResult = { data: { id: 'new_id' }, error: null },
    deleteResult = { error: null },
    signedUrlResult = { data: { signedUrl: 'https://example.com/signed-url' }, error: null },
    removeResult = { error: null },
  } = options;

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(selectResult),
                  }),
                }),
              }),
            }),
          }),
          single: vi.fn().mockResolvedValue(selectResult),
        }),
        single: vi.fn().mockResolvedValue(selectResult),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(insertResult),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(deleteResult),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue(signedUrlResult),
        remove: vi.fn().mockResolvedValue(removeResult),
      }),
    },
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/photo-reuse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.error 무시
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // ---------------------------------------------------------------------------
  // REUSE_CONDITIONS
  // ---------------------------------------------------------------------------

  describe('REUSE_CONDITIONS', () => {
    it('should have maxAgeDays', () => {
      expect(REUSE_CONDITIONS).toHaveProperty('maxAgeDays');
      expect(typeof REUSE_CONDITIONS.maxAgeDays).toBe('number');
      expect(REUSE_CONDITIONS.maxAgeDays).toBeGreaterThan(0);
    });

    it('should have minQualityScore', () => {
      expect(REUSE_CONDITIONS).toHaveProperty('minQualityScore');
      expect(typeof REUSE_CONDITIONS.minQualityScore).toBe('number');
      expect(REUSE_CONDITIONS.minQualityScore).toBeGreaterThan(0);
      expect(REUSE_CONDITIONS.minQualityScore).toBeLessThanOrEqual(100);
    });

    it('should have minLightingScore', () => {
      expect(REUSE_CONDITIONS).toHaveProperty('minLightingScore');
      expect(typeof REUSE_CONDITIONS.minLightingScore).toBe('number');
      expect(REUSE_CONDITIONS.minLightingScore).toBeGreaterThan(0);
      expect(REUSE_CONDITIONS.minLightingScore).toBeLessThanOrEqual(100);
    });

    it('should have requiredAngle', () => {
      expect(REUSE_CONDITIONS).toHaveProperty('requiredAngle');
      expect(REUSE_CONDITIONS.requiredAngle).toBe('front');
    });

    it('should have reasonable maxAgeDays (7 days)', () => {
      expect(REUSE_CONDITIONS.maxAgeDays).toBe(7);
    });
  });

  // ---------------------------------------------------------------------------
  // checkPhotoReuseEligibility
  // ---------------------------------------------------------------------------

  describe('checkPhotoReuseEligibility', () => {
    it('should return not eligible when no images found', async () => {
      const supabase = createMockSupabase({
        selectResult: { data: [], error: null },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('no_image');
    });

    it('should return not eligible when DB error occurs (non-42P01)', async () => {
      const supabase = createMockSupabase({
        selectResult: { data: null, error: { code: 'PGRST116', message: 'Some error' } },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('no_image');
    });

    it('should handle table not found error (42P01) gracefully', async () => {
      const supabase = createMockSupabase({
        selectResult: { data: null, error: { code: '42P01', message: 'Table not found' } },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('no_image');
    });

    it('should return not eligible when image is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // 어제 만료

      const supabase = createMockSupabase({
        selectResult: {
          data: [
            {
              id: 'img_123',
              storage_path: 'bucket/path/image.jpg',
              quality_score: 80,
              lighting_score: 70,
              retention_until: expiredDate.toISOString(),
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should return not eligible when lighting score is too low', async () => {
      const supabase = createMockSupabase({
        selectResult: {
          data: [
            {
              id: 'img_123',
              storage_path: 'bucket/path/image.jpg',
              quality_score: 80,
              lighting_score: 40, // minLightingScore (60) 미만
              retention_until: null,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('low_quality');
    });

    it('should return eligible for valid image', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const supabase = createMockSupabase({
        selectResult: {
          data: [
            {
              id: 'img_123',
              storage_path: 'bucket/path/image.jpg',
              thumbnail_path: 'bucket/path/thumb.jpg',
              quality_score: 85,
              lighting_score: 75,
              retention_until: futureDate.toISOString(),
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        },
        signedUrlResult: {
          data: { signedUrl: 'https://example.com/signed' },
          error: null,
        },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(true);
      expect(result.sourceImage).toBeDefined();
      expect(result.sourceImage?.id).toBe('img_123');
      expect(result.sourceImage?.analysisType).toBe('personal-color');
    });

    it('should return sourceImage with correct fields when eligible', async () => {
      const createdAt = new Date().toISOString();

      const supabase = createMockSupabase({
        selectResult: {
          data: [
            {
              id: 'img_456',
              storage_path: 'bucket/path/image.jpg',
              thumbnail_path: null,
              quality_score: 90,
              lighting_score: 80,
              retention_until: null,
              created_at: createdAt,
            },
          ],
          error: null,
        },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'body');

      expect(result.eligible).toBe(true);
      expect(result.sourceImage?.qualityScore).toBe(90);
      expect(result.sourceImage?.imageUrl).toBeDefined();
    });

    it('should handle null quality_score with default value', async () => {
      const supabase = createMockSupabase({
        selectResult: {
          data: [
            {
              id: 'img_789',
              storage_path: 'bucket/path/image.jpg',
              quality_score: null,
              lighting_score: null,
              retention_until: null,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        },
      });

      const result = await checkPhotoReuseEligibility(supabase as any, 'skin');

      expect(result.eligible).toBe(true);
      expect(result.sourceImage?.qualityScore).toBe(75); // 기본값
    });
  });

  // ---------------------------------------------------------------------------
  // saveAnalysisImage
  // ---------------------------------------------------------------------------

  describe('saveAnalysisImage', () => {
    it('should return id on successful save', async () => {
      const supabase = createMockSupabase({
        insertResult: { data: { id: 'new_image_id' }, error: null },
      });

      const result = await saveAnalysisImage(supabase as any, {
        analysisType: 'personal-color',
        storagePath: 'bucket/path/image.jpg',
        qualityScore: 85,
        consentGiven: true,
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('new_image_id');
    });

    it('should return null on insert error', async () => {
      const supabase = createMockSupabase({
        insertResult: { data: null, error: { message: 'Insert failed' } },
      });

      const result = await saveAnalysisImage(supabase as any, {
        analysisType: 'skin',
        storagePath: 'bucket/path/image.jpg',
        consentGiven: false,
      });

      expect(result).toBeNull();
    });

    it('should set retention_until when consent given', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test_id' }, error: null }),
        }),
      });

      const supabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      await saveAnalysisImage(supabase as any, {
        analysisType: 'personal-color',
        storagePath: 'bucket/path/image.jpg',
        consentGiven: true,
        retentionDays: 30,
      });

      expect(mockInsert).toHaveBeenCalled();
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.consent_given).toBe(true);
      expect(insertArg.retention_until).not.toBeNull();
    });

    it('should set retention_until to null when consent not given', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test_id' }, error: null }),
        }),
      });

      const supabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      await saveAnalysisImage(supabase as any, {
        analysisType: 'skin',
        storagePath: 'bucket/path/image.jpg',
        consentGiven: false,
      });

      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.retention_until).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // reuseAnalysisImage
  // ---------------------------------------------------------------------------

  describe('reuseAnalysisImage', () => {
    it('should return true on successful reuse', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'source_id',
              storage_path: 'bucket/path/image.jpg',
              thumbnail_path: null,
              quality_score: 80,
              lighting_score: 70,
              angle: 'front',
              consent_given: true,
              retention_until: null,
            },
            error: null,
          }),
        }),
      });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockFrom.mockReturnValueOnce({ insert: mockInsert });

      const supabase = { from: mockFrom };

      const result = await reuseAnalysisImage(supabase as any, {
        sourceImageId: 'source_id',
        targetAnalysisType: 'skin',
        targetAnalysisId: 'target_id',
      });

      expect(result).toBe(true);
    });

    it('should return false when source image not found', async () => {
      const supabase = createMockSupabase({
        selectResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      });

      const result = await reuseAnalysisImage(supabase as any, {
        sourceImageId: 'not_exist',
        targetAnalysisType: 'body',
        targetAnalysisId: 'target_id',
      });

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // revokeImageConsent
  // ---------------------------------------------------------------------------

  describe('revokeImageConsent', () => {
    it('should return false when image not found', async () => {
      const supabase = createMockSupabase({
        selectResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      });

      const result = await revokeImageConsent(supabase as any, 'not_exist');

      expect(result).toBe(false);
    });

    it('should return false when delete fails', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { storage_path: 'bucket/path/image.jpg', thumbnail_path: null },
            error: null,
          }),
        }),
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });

      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockFrom.mockReturnValueOnce({ delete: mockDelete });

      const mockStorage = {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const supabase = { from: mockFrom, storage: mockStorage };

      const result = await revokeImageConsent(supabase as any, 'img_123');

      expect(result).toBe(false);
    });
  });
});
