/**
 * 신체 치수 Repository 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  smartMatchingLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import {
  getMeasurements,
  upsertMeasurements,
  updateBasicInfo,
  updateDetailedMeasurements,
  updatePreferredFit,
  syncFromBodyAnalysis,
} from '@/lib/smart-matching/measurements';

const NOW_ISO = '2026-01-15T10:00:00Z';

function createMockMeasurementsDB(overrides = {}) {
  return {
    clerk_user_id: 'user-1',
    height: 175,
    weight: 70,
    body_type: 'mesomorph',
    chest: 95,
    waist: 80,
    hip: 95,
    shoulder: 45,
    arm_length: 60,
    inseam: 80,
    foot_length: 265,
    preferred_fit: 'regular',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...overrides,
  };
}

describe('신체 치수 Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeasurements', () => {
    it('사용자의 신체 치수를 반환한다', async () => {
      const mockRow = createMockMeasurementsDB();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      } as never);

      const result = await getMeasurements('user-1');

      expect(result).not.toBeNull();
      expect(result!.height).toBe(175);
      expect(result!.weight).toBe(70);
      expect(result!.bodyType).toBe('mesomorph');
      expect(result!.preferredFit).toBe('regular');
      expect(result!.chest).toBe(95);
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as never);

      const result = await getMeasurements('user-1');

      expect(result).toBeNull();
    });

    it('null 필드는 undefined로 매핑된다', async () => {
      const mockRow = createMockMeasurementsDB({
        chest: null,
        waist: null,
        hip: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      } as never);

      const result = await getMeasurements('user-1');

      expect(result).not.toBeNull();
      expect(result!.chest).toBeUndefined();
      expect(result!.waist).toBeUndefined();
      expect(result!.hip).toBeUndefined();
    });
  });

  describe('upsertMeasurements', () => {
    it('신체 치수를 upsert하고 결과를 반환한다', async () => {
      const mockRow = createMockMeasurementsDB();
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as never);

      const result = await upsertMeasurements('user-1', {
        height: 175,
        weight: 70,
      });

      expect(result).not.toBeNull();
      expect(result!.height).toBe(175);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: 'user-1',
          height: 175,
          weight: 70,
        })
      );
    });

    it('누락된 필드는 null로 설정된다', async () => {
      const mockRow = createMockMeasurementsDB({ chest: null });
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as never);

      await upsertMeasurements('user-1', {});

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          height: null,
          weight: null,
          chest: null,
          preferred_fit: 'regular',
        })
      );
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Upsert failed') }),
          }),
        }),
      } as never);

      const result = await upsertMeasurements('user-1', { height: 175 });

      expect(result).toBeNull();
    });
  });

  describe('updateBasicInfo', () => {
    it('기본 신체 정보를 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updateBasicInfo('user-1', {
        height: 180,
        weight: 75,
        bodyType: 'ectomorph',
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        height: 180,
        weight: 75,
        body_type: 'ectomorph',
      });
    });

    it('일부 필드만 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await updateBasicInfo('user-1', { height: 180 });

      expect(mockUpdate).toHaveBeenCalledWith({ height: 180 });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateBasicInfo('user-1', { height: 180 });

      expect(result).toBe(false);
    });
  });

  describe('updateDetailedMeasurements', () => {
    it('상세 치수를 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updateDetailedMeasurements('user-1', {
        chest: 100,
        waist: 85,
        hip: 98,
        shoulder: 47,
        armLength: 62,
        inseam: 82,
        footLength: 270,
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        chest: 100,
        waist: 85,
        hip: 98,
        shoulder: 47,
        arm_length: 62,
        inseam: 82,
        foot_length: 270,
      });
    });

    it('camelCase를 snake_case로 변환한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await updateDetailedMeasurements('user-1', {
        armLength: 62,
        footLength: 270,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        arm_length: 62,
        foot_length: 270,
      });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateDetailedMeasurements('user-1', { chest: 100 });

      expect(result).toBe(false);
    });
  });

  describe('updatePreferredFit', () => {
    it('선호 핏을 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updatePreferredFit('user-1', 'loose');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ preferred_fit: 'loose' });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updatePreferredFit('user-1', 'tight');

      expect(result).toBe(false);
    });
  });

  describe('syncFromBodyAnalysis', () => {
    it('체형 분석 결과를 동기화한다', async () => {
      // getMeasurements mock (첫 번째 호출)
      const mockExisting = createMockMeasurementsDB();
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockMeasurementsDB({ height: 180, weight: 75 }),
            error: null,
          }),
        }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // getMeasurements 호출
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockExisting, error: null }),
              }),
            }),
          } as never;
        }
        // upsertMeasurements 호출
        return {
          upsert: mockUpsert,
        } as never;
      });

      const result = await syncFromBodyAnalysis('user-1', {
        height: 180,
        weight: 75,
        bodyType: 'mesomorph',
      });

      expect(result).toBe(true);
    });

    it('기존 데이터가 없을 때 분석 결과만으로 동기화한다', async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockMeasurementsDB({ height: 170, weight: 65 }),
            error: null,
          }),
        }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          } as never;
        }
        return {
          upsert: mockUpsert,
        } as never;
      });

      const result = await syncFromBodyAnalysis('user-1', {
        height: 170,
        weight: 65,
      });

      expect(result).toBe(true);
    });

    it('upsert 실패 시 false를 반환한다', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          } as never;
        }
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Upsert failed') }),
            }),
          }),
        } as never;
      });

      const result = await syncFromBodyAnalysis('user-1', { height: 170 });

      expect(result).toBe(false);
    });
  });
});
