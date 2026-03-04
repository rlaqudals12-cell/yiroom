/**
 * SafetyProfile 저장소 테스트
 *
 * @module tests/lib/safety/repository
 * @description getSafetyProfile, upsertSafetyProfile CRUD + 암호화
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSafetyProfile, upsertSafetyProfile } from '@/lib/safety/repository';

// 테스트용 암호화 키 (32바이트 hex)
const TEST_KEY = 'a'.repeat(64);

// =============================================================================
// Supabase Mock
// =============================================================================

function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

let mockResponse: { data: unknown; error: unknown } = { data: null, error: null };

const mockSupabaseFrom = vi.fn().mockImplementation(() => {
  return createChainMock(mockResponse);
});

const mockSupabase = { from: mockSupabaseFrom };

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabase,
}));

// crypto를 실제 모듈 사용 (환경변수로 키 설정)
// 단, isEncryptionAvailable만 spy

// =============================================================================
// 테스트
// =============================================================================

describe('SafetyProfile Repository', () => {
  const userId = 'user_safety_test';
  const originalEnv = process.env.SAFETY_ENCRYPTION_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SAFETY_ENCRYPTION_KEY = TEST_KEY;
    mockResponse = { data: null, error: null };
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SAFETY_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.SAFETY_ENCRYPTION_KEY;
    }
  });

  // ===========================================================================
  // getSafetyProfile
  // ===========================================================================

  describe('getSafetyProfile', () => {
    it('should return empty profile when not found', async () => {
      mockResponse = { data: null, error: null };

      const profile = await getSafetyProfile(userId);

      expect(profile.userId).toBe(userId);
      expect(profile.allergies).toEqual([]);
      expect(profile.conditions).toEqual([]);
      expect(profile.consentGiven).toBe(false);
    });

    it('should return decrypted profile from DB', async () => {
      // 실제 암호화 모듈로 암호화된 데이터 생성
      const { encrypt } = await import('@/lib/safety/crypto');

      mockResponse = {
        data: {
          id: 'sp-1',
          clerk_user_id: userId,
          allergies_encrypted: encrypt(['walnut', 'cashew']),
          conditions_encrypted: encrypt(['pregnancy']),
          skin_conditions_encrypted: encrypt(['atopy']),
          medications_encrypted: null,
          age: 28,
          consent_given: true,
          consent_given_at: new Date().toISOString(),
          consent_version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      const profile = await getSafetyProfile(userId);

      expect(profile.userId).toBe(userId);
      expect(profile.allergies).toEqual(['walnut', 'cashew']);
      expect(profile.conditions).toEqual(['pregnancy']);
      expect(profile.skinConditions).toEqual(['atopy']);
      expect(profile.medications).toEqual([]); // null → 빈 배열
      expect(profile.age).toBe(28);
      expect(profile.consentGiven).toBe(true);
    });

    it('should throw when DB query fails', async () => {
      mockResponse = {
        data: null,
        error: { message: 'DB connection error', code: '500' },
      };

      await expect(getSafetyProfile(userId)).rejects.toThrow('안전성 프로필을 불러올 수 없습니다.');
    });

    it('should handle corrupted encrypted data gracefully', async () => {
      mockResponse = {
        data: {
          id: 'sp-2',
          clerk_user_id: userId,
          allergies_encrypted: 'corrupted_data_not_base64',
          conditions_encrypted: null,
          skin_conditions_encrypted: null,
          medications_encrypted: null,
          age: null,
          consent_given: false,
          consent_given_at: null,
          consent_version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      // 복호화 실패 시 빈 배열로 폴백 (에러 던지지 않음)
      const profile = await getSafetyProfile(userId);

      expect(profile.allergies).toEqual([]);
    });
  });

  // ===========================================================================
  // upsertSafetyProfile
  // ===========================================================================

  describe('upsertSafetyProfile', () => {
    it('should upsert and return profile', async () => {
      const { encrypt } = await import('@/lib/safety/crypto');

      mockResponse = {
        data: {
          id: 'sp-3',
          clerk_user_id: userId,
          allergies_encrypted: encrypt(['latex']),
          conditions_encrypted: encrypt([]),
          skin_conditions_encrypted: encrypt([]),
          medications_encrypted: encrypt([]),
          age: 30,
          consent_given: true,
          consent_given_at: new Date().toISOString(),
          consent_version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      const profile = await upsertSafetyProfile(userId, {
        allergies: ['latex'],
        conditions: [],
        skinConditions: [],
        medications: [],
        age: 30,
        consentGiven: true,
      });

      expect(profile.userId).toBe(userId);
      expect(profile.allergies).toEqual(['latex']);
      expect(profile.age).toBe(30);
      expect(profile.consentGiven).toBe(true);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('safety_profiles');
    });

    it('should throw when DB upsert fails', async () => {
      mockResponse = {
        data: null,
        error: { message: 'upsert failed' },
      };

      await expect(
        upsertSafetyProfile(userId, {
          allergies: ['test'],
          consentGiven: true,
        })
      ).rejects.toThrow('안전성 프로필 저장에 실패했습니다.');
    });

    it('should throw when encryption key is not set', async () => {
      delete process.env.SAFETY_ENCRYPTION_KEY;

      await expect(
        upsertSafetyProfile(userId, {
          allergies: ['test'],
          consentGiven: true,
        })
      ).rejects.toThrow('암호화 키가 설정되지 않아');
    });

    it('should encrypt all sensitive fields', async () => {
      const { encrypt } = await import('@/lib/safety/crypto');

      mockResponse = {
        data: {
          id: 'sp-4',
          clerk_user_id: userId,
          allergies_encrypted: encrypt(['walnut']),
          conditions_encrypted: encrypt(['pregnancy']),
          skin_conditions_encrypted: encrypt(['rosacea']),
          medications_encrypted: encrypt(['isotretinoin']),
          age: 25,
          consent_given: true,
          consent_given_at: new Date().toISOString(),
          consent_version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      const profile = await upsertSafetyProfile(userId, {
        allergies: ['walnut'],
        conditions: ['pregnancy'],
        skinConditions: ['rosacea'],
        medications: ['isotretinoin'],
        age: 25,
        consentGiven: true,
      });

      // 모든 민감 필드 정상 복호화 확인
      expect(profile.allergies).toEqual(['walnut']);
      expect(profile.conditions).toEqual(['pregnancy']);
      expect(profile.skinConditions).toEqual(['rosacea']);
      expect(profile.medications).toEqual(['isotretinoin']);
    });
  });
});
