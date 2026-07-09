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
 * 정본 테이블 (2026-07-10 유령 컬럼 수리):
 * - 성별   → users.gender
 * - 키/몸무게 → user_body_measurements(height, weight), 없으면 body_analyses 최신 행 폴백
 * - 알레르기 → nutrition_settings.allergies
 *
 * 과거엔 users에서 존재하지 않는 height_cm/weight_kg/allergies를 함께 select 해
 * 쿼리 전체가 실패 → 성별 포함 프로필 읽기가 전멸했다(성별을 매번 다시 물음).
 */
const USERS_TABLE = 'users';
const MEASUREMENTS_TABLE = 'user_body_measurements';
const BODY_ANALYSES_TABLE = 'body_analyses';
const NUTRITION_SETTINGS_TABLE = 'nutrition_settings';

// NUMERIC/텍스트 혼재 방어 — 숫자로 정규화
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/**
 * 사용자 프로필 정보 관리 훅
 * - 성별, 키, 몸무게, 알러지 정보 관리 (각 정본 테이블 연동)
 * - 반환 shape은 유지하고 내부 데이터 소스만 정본으로 교체
 */
export function useUserProfile(): UseUserProfileResult {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 프로필 정보 조회 — 정본 테이블 3곳을 병렬 조회 (한 곳 실패가 전체를 막지 않음)
  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [genderRes, measureRes, allergyRes] = await Promise.all([
        // 성별: users에서 gender만 (유령 컬럼 제거)
        supabase.from(USERS_TABLE).select('gender').eq('clerk_user_id', user.id).maybeSingle(),
        // 키/몸무게: 정본 = user_body_measurements
        supabase
          .from(MEASUREMENTS_TABLE)
          .select('height, weight')
          .eq('clerk_user_id', user.id)
          .maybeSingle(),
        // 알레르기: nutrition_settings
        supabase
          .from(NUTRITION_SETTINGS_TABLE)
          .select('allergies')
          .eq('clerk_user_id', user.id)
          .maybeSingle(),
      ]);

      let heightCm = toNumberOrNull(measureRes.data?.height);
      let weightKg = toNumberOrNull(measureRes.data?.weight);

      // 폴백: 측정값이 없으면 body_analyses 최신 행 사용 (중복 입력 요구 방지 — One Canon)
      if (heightCm === null || weightKg === null) {
        const { data: bodyData } = await supabase
          .from(BODY_ANALYSES_TABLE)
          .select('height, weight')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (heightCm === null) heightCm = toNumberOrNull(bodyData?.height);
        if (weightKg === null) weightKg = toNumberOrNull(bodyData?.weight);
      }

      setProfile({
        gender: (genderRes.data?.gender as GenderType | null) ?? null,
        heightCm,
        weightKg,
        allergies: Array.isArray(allergyRes.data?.allergies) ? allergyRes.data.allergies : [],
      });
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

  // 성별 업데이트 → users.gender
  const updateGender = useCallback(
    async (gender: GenderType): Promise<boolean> => {
      if (!user) return false;
      try {
        setError(null);
        const { error: updateError } = await supabase
          .from(USERS_TABLE)
          .update({ gender })
          .eq('clerk_user_id', user.id);

        if (updateError) {
          throw new Error(`Failed to update gender: ${updateError.message}`);
        }

        setProfile((prev) => ({ ...prev, gender }));
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserProfile] updateGender error:', error);
        setError(error);
        return false;
      }
    },
    [user, supabase]
  );

  // 키/몸무게 upsert → user_body_measurements (부분 갱신, 기존 값 보존)
  const upsertMeasurements = useCallback(
    async (fields: { height?: number; weight?: number }): Promise<boolean> => {
      if (!user) return false;
      try {
        setError(null);
        const { error: upsertError } = await supabase.from(MEASUREMENTS_TABLE).upsert(
          {
            clerk_user_id: user.id,
            ...(fields.height !== undefined && { height: fields.height }),
            ...(fields.weight !== undefined && { weight: fields.weight }),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clerk_user_id' }
        );

        if (upsertError) {
          throw new Error(`Failed to update measurements: ${upsertError.message}`);
        }
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserProfile] upsertMeasurements error:', error);
        setError(error);
        return false;
      }
    },
    [user, supabase]
  );

  // 키 업데이트
  const updateHeight = useCallback(
    async (heightCm: number): Promise<boolean> => {
      const success = await upsertMeasurements({ height: heightCm });
      if (success) {
        setProfile((prev) => ({ ...prev, heightCm }));
      }
      return success;
    },
    [upsertMeasurements]
  );

  // 몸무게 업데이트
  const updateWeight = useCallback(
    async (weightKg: number): Promise<boolean> => {
      const success = await upsertMeasurements({ weight: weightKg });
      if (success) {
        setProfile((prev) => ({ ...prev, weightKg }));
      }
      return success;
    },
    [upsertMeasurements]
  );

  // 키와 몸무게 동시 업데이트
  const updatePhysicalInfo = useCallback(
    async (heightCm: number, weightKg: number): Promise<boolean> => {
      const success = await upsertMeasurements({ height: heightCm, weight: weightKg });
      if (success) {
        setProfile((prev) => ({ ...prev, heightCm, weightKg }));
      }
      return success;
    },
    [upsertMeasurements]
  );

  // 알레르기 업데이트 → nutrition_settings.allergies
  // nutrition_settings.goal은 NOT NULL이라 단순 upsert(부분)가 신규 행 INSERT에서 실패한다.
  // 따라서 UPDATE 우선 → 행이 없으면 중립 목표('health')로 최소 INSERT.
  // (N-1 UI는 숨김 상태라 이 행 생성이 사용자에게 노출되지 않음.)
  const updateAllergies = useCallback(
    async (allergies: string[]): Promise<boolean> => {
      if (!user) return false;
      try {
        setError(null);

        const { data: updated, error: updateError } = await supabase
          .from(NUTRITION_SETTINGS_TABLE)
          .update({ allergies })
          .eq('clerk_user_id', user.id)
          .select('clerk_user_id');

        if (updateError) {
          throw new Error(`Failed to update allergies: ${updateError.message}`);
        }

        // 기존 nutrition_settings 행이 없으면 최소 필드로 생성
        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase.from(NUTRITION_SETTINGS_TABLE).insert({
            clerk_user_id: user.id,
            goal: 'health',
            allergies,
          });

          if (insertError) {
            throw new Error(`Failed to create nutrition settings: ${insertError.message}`);
          }
        }

        setProfile((prev) => ({ ...prev, allergies }));
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserProfile] updateAllergies error:', error);
        setError(error);
        return false;
      }
    },
    [user, supabase]
  );

  // 전체 프로필 업데이트 — 각 필드를 정본 테이블로 라우팅
  const updateProfile = useCallback(
    async (updates: Partial<UserProfileData>): Promise<boolean> => {
      const results: boolean[] = [];

      if (updates.gender !== undefined && updates.gender !== null) {
        results.push(await updateGender(updates.gender));
      }

      if (updates.heightCm !== undefined && updates.weightKg !== undefined) {
        if (updates.heightCm !== null && updates.weightKg !== null) {
          results.push(await updatePhysicalInfo(updates.heightCm, updates.weightKg));
        }
      } else if (updates.heightCm !== undefined && updates.heightCm !== null) {
        results.push(await updateHeight(updates.heightCm));
      } else if (updates.weightKg !== undefined && updates.weightKg !== null) {
        results.push(await updateWeight(updates.weightKg));
      }

      if (updates.allergies !== undefined) {
        results.push(await updateAllergies(updates.allergies));
      }

      if (results.length === 0) return true;
      return results.every(Boolean);
    },
    [updateGender, updateHeight, updateWeight, updatePhysicalInfo, updateAllergies]
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
