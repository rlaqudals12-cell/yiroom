'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { type UserPreference, type PreferenceDomain } from '@/types/preferences';

interface UseUserPreferencesOptions {
  domain?: PreferenceDomain;
  autoRefetch?: boolean;
  refetchInterval?: number;
}

interface UseUserPreferencesResult {
  // 상태
  preferences: UserPreference[];
  isLoading: boolean;
  error: Error | null;

  // CRUD 함수
  addPreference: (
    preference: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt' | 'clerkUserId'>
  ) => Promise<UserPreference | null>;
  updatePreference: (
    id: string,
    updates: Partial<Pick<UserPreference, 'avoidLevel' | 'avoidReason' | 'avoidNote' | 'priority'>>
  ) => Promise<UserPreference | null>;
  removePreference: (id: string) => Promise<boolean>;

  // 유틸리티
  refetch: () => Promise<void>;
  clear: () => void;
  getPreferencesByDomain: (domain: PreferenceDomain) => UserPreference[];
  getFavorites: () => UserPreference[];
  getAvoids: () => UserPreference[];
}

/**
 * 사용자 선호/기피 항목 관리 훅
 * - 통합 사용자 선호/기피 시스템
 * - CRUD 자동 sync
 * - 로컬 상태 + 서버 상태 동기화
 */
export function useUserPreferences(
  options: UseUserPreferencesOptions = {}
): UseUserPreferencesResult {
  const { domain, autoRefetch = false, refetchInterval = 60000 } = options;

  const { user, isLoaded } = useUser();

  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 선호/기피 항목 조회
  const fetchPreferences = useCallback(async () => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (domain) {
        params.append('domain', domain);
      }

      const response = await fetch(`/api/preferences?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      // API 응답 형식: { success, data: UserPreference[], count } — 과거엔 data.preferences를
      // 읽어(존재하지 않는 키) 항상 빈 배열이 됐다. data.data를 방어적으로 파싱한다.
      const json = await response.json();
      setPreferences(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useUserPreferences] Fetch error:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user, domain]);

  // 초기 로드
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // 자동 refetch 설정
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(fetchPreferences, refetchInterval);
    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchPreferences]);

  // 선호/기피 항목 추가
  const addPreference = useCallback(
    async (
      preference: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt' | 'clerkUserId'>
    ): Promise<UserPreference | null> => {
      if (!user) return null;

      try {
        const response = await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...preference,
            clerkUserId: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add preference: ${response.statusText}`);
        }

        // POST 라우트는 { success, data } 래퍼를 반환 — data만 항목으로 사용한다
        // (과거엔 래퍼 전체를 상태에 넣어 id/domain 없는 유령 객체가 들어갔다).
        const json = await response.json();
        const newPreference = (json?.data ?? null) as UserPreference | null;

        // 로컬 상태 업데이트
        if (newPreference) {
          setPreferences((prev) => [newPreference, ...prev]);
        }

        return newPreference;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserPreferences] Add error:', error);
        setError(error);
        return null;
      }
    },
    [user]
  );

  // 선호/기피 항목 수정
  const updatePreference = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<UserPreference, 'avoidLevel' | 'avoidReason' | 'avoidNote' | 'priority'>
      >
    ): Promise<UserPreference | null> => {
      try {
        const response = await fetch(`/api/preferences/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update preference: ${response.statusText}`);
        }

        // PATCH 라우트도 { success, data } 래퍼를 반환 — data만 항목으로 사용한다.
        const json = await response.json();
        const updatedPreference = (json?.data ?? null) as UserPreference | null;

        // 로컬 상태 업데이트
        if (updatedPreference) {
          setPreferences((prev) => prev.map((p) => (p.id === id ? updatedPreference : p)));
        }

        return updatedPreference;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[useUserPreferences] Update error:', error);
        setError(error);
        return null;
      }
    },
    []
  );

  // 선호/기피 항목 삭제
  const removePreference = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/preferences/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove preference: ${response.statusText}`);
      }

      // 로컬 상태 업데이트
      setPreferences((prev) => prev.filter((p) => p.id !== id));

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useUserPreferences] Remove error:', error);
      setError(error);
      return false;
    }
  }, []);

  // 로컬 상태 초기화
  const clear = useCallback(() => {
    setPreferences([]);
    setError(null);
  }, []);

  // 도메인별 조회
  const getPreferencesByDomain = useCallback(
    (d: PreferenceDomain): UserPreference[] => {
      return preferences.filter((p) => p.domain === d);
    },
    [preferences]
  );

  // 좋아하는 항목 조회
  const getFavorites = useCallback((): UserPreference[] => {
    return preferences.filter((p) => p.isFavorite);
  }, [preferences]);

  // 기피 항목 조회
  const getAvoids = useCallback((): UserPreference[] => {
    return preferences.filter((p) => !p.isFavorite);
  }, [preferences]);

  return {
    preferences,
    isLoading,
    error,
    addPreference,
    updatePreference,
    removePreference,
    refetch: fetchPreferences,
    clear,
    getPreferencesByDomain,
    getFavorites,
    getAvoids,
  };
}
