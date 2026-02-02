'use client';

/**
 * GenderProvider - K-1 성별 중립화
 * @description 앱 전체에서 사용자 성별 선호도를 관리하는 Context
 *
 * 저장 위치:
 * - 로그인 사용자: Supabase user_profiles 테이블
 * - 비로그인 사용자: localStorage
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
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

  const [genderProfile, setGenderProfile] = useState<UserGenderProfile>(
    createDefaultGenderProfile()
  );
  const [isLoading, setIsLoading] = useState(true);

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

  // Supabase에서 로드
  const loadFromSupabase = useCallback(async (): Promise<UserGenderProfile | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gender_preference, style_preference')
        .single();

      if (error) {
        // PGRST116 = no rows returned, 이 경우 null 반환
        if (error.code !== 'PGRST116') {
          console.error('[GenderProvider] Supabase load error:', error);
        }
        return null;
      }

      if (data?.gender_preference) {
        return {
          gender: data.gender_preference as GenderPreference,
          stylePreference: (data.style_preference as StylePreference) || 'unisex',
        };
      }
    } catch (error) {
      console.error('[GenderProvider] Failed to load from Supabase:', error);
    }

    return null;
  }, [supabase, user?.id]);

  // Supabase에 저장
  const saveToSupabase = useCallback(
    async (profile: UserGenderProfile) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase.from('user_profiles').upsert(
          {
            gender_preference: profile.gender,
            style_preference: profile.stylePreference,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clerk_user_id' }
        );

        if (error) {
          console.error('[GenderProvider] Supabase save error:', error);
        }
      } catch (error) {
        console.error('[GenderProvider] Failed to save to Supabase:', error);
      }
    },
    [supabase, user?.id]
  );

  // 초기 로드
  useEffect(() => {
    async function initProfile() {
      setIsLoading(true);

      // 1. 로그인 사용자: Supabase에서 먼저 시도
      if (user?.id) {
        const supabaseProfile = await loadFromSupabase();
        if (supabaseProfile) {
          setGenderProfile(supabaseProfile);
          saveToStorage(supabaseProfile); // 로컬에도 캐시
          setIsLoading(false);
          return;
        }
      }

      // 2. 로컬 스토리지 확인
      const localProfile = loadFromStorage();
      if (localProfile) {
        setGenderProfile(localProfile);

        // 로그인 사용자면 Supabase에도 저장
        if (user?.id) {
          await saveToSupabase(localProfile);
        }

        setIsLoading(false);
        return;
      }

      // 3. 기본값 사용
      setGenderProfile(createDefaultGenderProfile());
      setIsLoading(false);
    }

    if (isUserLoaded) {
      initProfile();
    }
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
