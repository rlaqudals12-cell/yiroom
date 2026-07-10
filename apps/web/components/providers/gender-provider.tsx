'use client';

/**
 * GenderProvider - K-1 성별 중립화
 * @description 앱 전체에서 사용자 성별 선호도를 관리하는 Context
 *
 * 저장 위치 (2026-07-11 유령 배선 수리):
 * - 성별 정본: users.gender (X1에서 정리 — 존재하지 않는 user_profiles 테이블을
 *   조회하던 유령 배선으로 전 사용자 gender가 'neutral' 고정이었다)
 * - 스타일 선호: localStorage (DB 컬럼 없음 — 클라이언트 취향값)
 * - 비로그인 사용자: localStorage
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  GenderPreference,
  StylePreference,
  UserGenderProfile,
  createDefaultGenderProfile,
  isValidGenderProfile,
} from '@/lib/content/gender-adaptive';

const STORAGE_KEY = 'yiroom_gender_profile';

interface GenderContextType {
  genderProfile: UserGenderProfile;
  isLoading: boolean;
  updateGenderProfile: (profile: Partial<UserGenderProfile>) => Promise<void>;
  resetToDefault: () => void;
}

const GenderContext = createContext<GenderContextType | null>(null);

interface GenderProviderProps {
  children: ReactNode;
}

export function GenderProvider({ children }: GenderProviderProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // localStorage에서 동기 로드 → LCP 블로킹 방지
  const [genderProfile, setGenderProfile] = useState<UserGenderProfile>(() => {
    if (typeof window === 'undefined') return createDefaultGenderProfile();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidGenderProfile(parsed)) return parsed;
      }
    } catch {
      /* 파싱 실패 시 기본값 */
    }
    return createDefaultGenderProfile();
  });
  const isLoading = false; // localStorage 동기 로드로 블로킹 없음

  // 로컬 스토리지에서 로드
  const loadFromStorage = useCallback((): UserGenderProfile | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidGenderProfile(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('[GenderProvider] Failed to load from storage:', error);
    }
    return null;
  }, []);

  // 로컬 스토리지에 저장
  const saveToStorage = useCallback((profile: UserGenderProfile) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('[GenderProvider] Failed to save to storage:', error);
    }
  }, []);

  // Supabase에서 로드 — 정본은 users.gender (user_profiles 테이블은 존재하지 않음)
  const loadFromSupabase = useCallback(async (): Promise<UserGenderProfile | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('gender')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[GenderProvider] Supabase load error:', error?.code, error?.message);
        return null;
      }

      const dbGender = data?.gender as string | null | undefined;
      if (!dbGender) return null;

      // DB 제약은 male/female/other/neutral — 콘텐츠 적응 관점에서
      // male/female 외 값('other' 포함)은 중립 렌더링(전체 노출)이 올바른 동작
      const gender: GenderPreference =
        dbGender === 'male' || dbGender === 'female' ? dbGender : 'neutral';

      // 스타일 선호는 localStorage 정본 — 성별이 같을 때만 로컬 값 유지, 다르면 파생 기본값
      const local = loadFromStorage();
      const stylePreference: StylePreference =
        local && local.gender === gender
          ? local.stylePreference
          : createDefaultGenderProfile(gender).stylePreference;

      return { gender, stylePreference };
    } catch (error) {
      console.error('[GenderProvider] Failed to load from Supabase:', error);
    }

    return null;
  }, [supabase, user?.id, loadFromStorage]);

  // Supabase에 저장 — users.gender만 갱신 (행 생성은 Clerk 웹훅 소관이므로 UPDATE만)
  const saveToSupabase = useCallback(
    async (profile: UserGenderProfile) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from('users')
          .update({ gender: profile.gender })
          .eq('clerk_user_id', user.id);

        if (error) {
          console.error('[GenderProvider] Supabase save error:', error);
        }
      } catch (error) {
        console.error('[GenderProvider] Failed to save to Supabase:', error);
      }
    },
    [supabase, user?.id]
  );

  // Supabase 백그라운드 동기화 (localStorage 값은 이미 초기 state에서 로드됨)
  useEffect(() => {
    if (!isUserLoaded || !user?.id) return;

    async function syncFromSupabase() {
      const supabaseProfile = await loadFromSupabase();
      if (supabaseProfile) {
        setGenderProfile(supabaseProfile);
        saveToStorage(supabaseProfile);
      } else {
        // Supabase에 없으면 현재 로컬 값을 Supabase에 저장
        const localProfile = loadFromStorage();
        if (localProfile) {
          await saveToSupabase(localProfile);
        }
      }
    }

    syncFromSupabase();
  }, [user?.id, isUserLoaded, loadFromSupabase, loadFromStorage, saveToSupabase, saveToStorage]);

  // 프로필 업데이트
  const updateGenderProfile = useCallback(
    async (partial: Partial<UserGenderProfile>) => {
      const updated: UserGenderProfile = {
        ...genderProfile,
        ...partial,
      };

      setGenderProfile(updated);
      saveToStorage(updated);

      if (user?.id) {
        await saveToSupabase(updated);
      }
    },
    [genderProfile, user?.id, saveToStorage, saveToSupabase]
  );

  // 기본값으로 리셋
  const resetToDefault = useCallback(() => {
    const defaultProfile = createDefaultGenderProfile();
    setGenderProfile(defaultProfile);
    saveToStorage(defaultProfile);
  }, [saveToStorage]);

  return (
    <GenderContext.Provider
      value={{
        genderProfile,
        isLoading,
        updateGenderProfile,
        resetToDefault,
      }}
    >
      {children}
    </GenderContext.Provider>
  );
}

export function useGenderProfile(): GenderContextType {
  const context = useContext(GenderContext);

  if (!context) {
    throw new Error('useGenderProfile must be used within a GenderProvider');
  }

  return context;
}

// 간편 훅: 성별만 반환
export function useGender(): GenderPreference {
  const { genderProfile } = useGenderProfile();
  return genderProfile.gender;
}

// 간편 훅: 스타일 선호도만 반환
export function useStylePreference(): StylePreference {
  const { genderProfile } = useGenderProfile();
  return genderProfile.stylePreference;
}
