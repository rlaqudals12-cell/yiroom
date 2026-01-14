'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

// 성별 타입
export type GenderType = 'male' | 'female' | 'neutral';

// 사용자 프로필 정보
export interface UserProfileData {
  gender: GenderType | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string[];
}

interface UseUserProfileResult {
  // 상태
  profile: UserProfileData;
  isLoading: boolean;
  error: Error | null;

  // 업데이트 함수
  updateGender: (gender: GenderType) => Promise<boolean>;
  updateHeight: (heightCm: number) => Promise<boolean>;
  updateWeight: (weightKg: number) => Promise<boolean>;
  updatePhysicalInfo: (heightCm: number, weightKg: number) => Promise<boolean>;
  updateAllergies: (allergies: string[]) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfileData>) => Promise<boolean>;

  // 유틸리티
  refetch: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfileData = {
  gender: null,
  heightCm: null,
  weightKg: null,
  allergies: [],
};

/**
 * 사용자 프로필 정보 관리 훅
 * - 성별, 키, 몸무게, 알러지 정보 관리
 * - user_preferences 테이블과 연동
 */
export function useUserProfile(): UseUserProfileResult {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 프로필 정보 조회
  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('gender, height_cm, weight_kg, allergies')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch profile: ${fetchError.message}`);
      }

      if (data) {
        setProfile({
          gender: data.gender as GenderType | null,
          heightCm: data.height_cm,
          weightKg: data.weight_kg ? parseFloat(data.weight_kg) : null,
          allergies: data.allergies || [],
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useUserProfile] Fetch error:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user, supabase]);

  // 초기 로드
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 프로필 업데이트 공통 함수
  const updateProfileData = useCallback(
    async (updates: Record<string, unknown>): Promise<boolean> => {
      if (!user) return false;

      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('user_preferences')
          .update(updates)
          .eq('clerk_user_id', user.id);

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        // 로컬 상태 업데이트
        await fetchProfile();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserProfile] Update error:', error);
        setError(error);
        return false;
      }
    },
    [user, supabase, fetchProfile]
  );

  // 성별 업데이트
  const updateGender = useCallback(
    async (gender: GenderType): Promise<boolean> => {
      const success = await updateProfileData({ gender });
      if (success) {
        setProfile((prev) => ({ ...prev, gender }));
      }
      return success;
    },
    [updateProfileData]
  );

  // 키 업데이트
  const updateHeight = useCallback(
    async (heightCm: number): Promise<boolean> => {
      const success = await updateProfileData({ height_cm: heightCm });
      if (success) {
        setProfile((prev) => ({ ...prev, heightCm }));
      }
      return success;
    },
    [updateProfileData]
  );

  // 몸무게 업데이트
  const updateWeight = useCallback(
    async (weightKg: number): Promise<boolean> => {
      const success = await updateProfileData({ weight_kg: weightKg });
      if (success) {
        setProfile((prev) => ({ ...prev, weightKg }));
      }
      return success;
    },
    [updateProfileData]
  );

  // 키와 몸무게 동시 업데이트
  const updatePhysicalInfo = useCallback(
    async (heightCm: number, weightKg: number): Promise<boolean> => {
      const success = await updateProfileData({ height_cm: heightCm, weight_kg: weightKg });
      if (success) {
        setProfile((prev) => ({ ...prev, heightCm, weightKg }));
      }
      return success;
    },
    [updateProfileData]
  );

  // 알러지 업데이트
  const updateAllergies = useCallback(
    async (allergies: string[]): Promise<boolean> => {
      const success = await updateProfileData({ allergies });
      if (success) {
        setProfile((prev) => ({ ...prev, allergies }));
      }
      return success;
    },
    [updateProfileData]
  );

  // 전체 프로필 업데이트
  const updateProfile = useCallback(
    async (updates: Partial<UserProfileData>): Promise<boolean> => {
      const dbUpdates: Record<string, unknown> = {};

      if (updates.gender !== undefined) {
        dbUpdates.gender = updates.gender;
      }
      if (updates.heightCm !== undefined) {
        dbUpdates.height_cm = updates.heightCm;
      }
      if (updates.weightKg !== undefined) {
        dbUpdates.weight_kg = updates.weightKg;
      }
      if (updates.allergies !== undefined) {
        dbUpdates.allergies = updates.allergies;
      }

      if (Object.keys(dbUpdates).length === 0) return true;

      return updateProfileData(dbUpdates);
    },
    [updateProfileData]
  );

  return {
    profile,
    isLoading,
    error,
    updateGender,
    updateHeight,
    updateWeight,
    updatePhysicalInfo,
    updateAllergies,
    updateProfile,
    refetch: fetchProfile,
  };
}
