/**
 * Phase J P3-B: 저장된 코디 Repository 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SavedOutfitRecord, SaveOutfitRequest } from '@/lib/api/outfits';

// Mock 데이터
const mockSavedOutfitRecord: SavedOutfitRecord = {
  id: 'test-saved-id',
  clerk_user_id: 'user_123',
  outfit_id: 'spring-daily-outfit-1',
  season_type: 'spring',
  occasion: 'daily',
  outfit_snapshot: {
    id: 'spring-daily-outfit-1',
    seasonType: 'spring',
    occasion: 'daily',
    clothing: {
      id: 'test-clothing',
      name: '코랄 + 베이지',
      description: '따뜻하고 부드러운 인상',
      colors: {
        top: { name: '코랄 핑크', hex: '#FF7F7F' },
        bottom: { name: '웜 베이지', hex: '#F5DEB3' },
      },
      style: 'casual',
      occasions: ['daily'],
      seasonTypes: ['spring'],
    },
    accessory: {
      metalTone: 'gold',
      items: [],
    },
    makeup: {
      lipstick: { name: '코랄', hex: '#FF7F7F' },
      eyeshadow: [{ name: '베이지', hex: '#F5F5DC' }],
      blusher: { name: '피치', hex: '#FFDAB9' },
    },
    tip: '코랄 톤으로 통일감 있게',
  },
  note: null,
  created_at: '2026-01-11T10:00:00Z',
  updated_at: '2026-01-11T10:00:00Z',
};

// Supabase Mock 생성 함수
function createMockSupabase(
  options: {
    data?: any;
    error?: any;
    count?: number;
  } = {}
) {
  const result = {
    data: options.data ?? null,
    error: options.error ?? null,
    count: options.count ?? 0,
  };

  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    range: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };

  // Thenable - await 지원
  mock.then = (resolve: any) => resolve(result);

  return mock;
}

describe('outfits repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getSavedOutfitById', () => {
    it('returns outfit by id', async () => {
      const mockSupabase = createMockSupabase({
        data: mockSavedOutfitRecord,
      });

      const { getSavedOutfitById } = await import('@/lib/api/outfits');
      const result = await getSavedOutfitById(mockSupabase, 'test-saved-id');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-saved-id');
      expect(result?.outfitId).toBe('spring-daily-outfit-1');
    });

    it('returns null when not found', async () => {
      const mockSupabase = createMockSupabase({
        data: null,
        error: { code: 'PGRST116' },
      });

      const { getSavedOutfitById } = await import('@/lib/api/outfits');
      const result = await getSavedOutfitById(mockSupabase, 'not-exist');

      expect(result).toBeNull();
    });
  });

  describe('isOutfitSaved', () => {
    it('returns true when outfit is saved', async () => {
      const mockSupabase = createMockSupabase({
        data: { id: 'test-id' },
      });

      const { isOutfitSaved } = await import('@/lib/api/outfits');
      const result = await isOutfitSaved(mockSupabase, 'spring-daily-outfit-1');

      expect(result).toBe(true);
    });

    it('returns false when outfit is not saved', async () => {
      const mockSupabase = createMockSupabase({
        data: null,
      });

      const { isOutfitSaved } = await import('@/lib/api/outfits');
      const result = await isOutfitSaved(mockSupabase, 'not-saved');

      expect(result).toBe(false);
    });
  });

  describe('saveOutfit', () => {
    it('saves outfit and returns saved record', async () => {
      const mockSupabase = createMockSupabase({
        data: mockSavedOutfitRecord,
      });

      const request: SaveOutfitRequest = {
        outfitId: 'spring-daily-outfit-1',
        seasonType: 'spring',
        occasion: 'daily',
        outfit: mockSavedOutfitRecord.outfit_snapshot,
      };

      const { saveOutfit } = await import('@/lib/api/outfits');
      const result = await saveOutfit(mockSupabase, 'user_123', request);

      expect(result.outfitId).toBe('spring-daily-outfit-1');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('throws ALREADY_SAVED on duplicate', async () => {
      const mockSupabase = createMockSupabase({
        data: null,
        error: { code: '23505' },
      });

      const request: SaveOutfitRequest = {
        outfitId: 'spring-daily-outfit-1',
        seasonType: 'spring',
        occasion: 'daily',
        outfit: mockSavedOutfitRecord.outfit_snapshot,
      };

      const { saveOutfit } = await import('@/lib/api/outfits');

      await expect(saveOutfit(mockSupabase, 'user_123', request)).rejects.toThrow('ALREADY_SAVED');
    });
  });

  describe('deleteSavedOutfit', () => {
    it('deletes outfit by id', async () => {
      const mockSupabase = createMockSupabase({});

      const { deleteSavedOutfit } = await import('@/lib/api/outfits');
      const result = await deleteSavedOutfit(mockSupabase, 'test-saved-id');

      expect(result).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe('getSavedOutfitsCount', () => {
    it('returns count of saved outfits', async () => {
      const mockSupabase = createMockSupabase({
        count: 5,
      });

      const { getSavedOutfitsCount } = await import('@/lib/api/outfits');
      const result = await getSavedOutfitsCount(mockSupabase);

      expect(result).toBe(5);
    });
  });
});
