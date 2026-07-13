/**
 * 캡슐 에코시스템 React Hooks
 *
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import { useAuth } from '@clerk/clerk-expo';
import { useState, useCallback, useEffect, useRef } from 'react';

import type { DailyCapsule, BeautyProfile, ApiError } from './api';
import {
  generateDailyCapsule as apiGenerateDaily,
  getTodayDailyCapsule as apiGetTodayDaily,
  checkDailyItem as apiCheckItem,
  getBeautyProfile as apiGetProfile,
} from './api';

// =============================================================================
// useDailyCapsule — Daily Capsule 생성/조회/체크
// =============================================================================

interface UseDailyCapsuleReturn {
  capsule: DailyCapsule | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: ApiError | null;
  /** 오늘의 캡슐 조회 (캐시) */
  fetchToday: () => Promise<void>;
  /** 새 캡슐 생성 */
  generate: () => Promise<void>;
  /** 아이템 체크/언체크 */
  checkItem: (itemId: string, isChecked: boolean) => Promise<void>;
  /** 완료율 (0-100) */
  completionRate: number;
}

export function useDailyCapsule(): UseDailyCapsuleReturn {
  const { getToken } = useAuth();
  const [capsule, setCapsule] = useState<DailyCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  // clerk-expo useAuth().getToken은 렌더마다 새 참조 → getAuthToken/fetchToday deps에 들어가면
  // 소비 effect가 매 렌더 재발화해 /api/capsule/daily를 초당 수 회 두들긴다(29K 스톰 = 공인 IP DDoS 플래그).
  // ref로 고정해 getAuthToken을 안정화 → fetchToday/generate/checkItem이 안정 참조가 되어 스톰 근절.
  // (useBriefing/useDailyRoutine/useMyTwin·useBeautyProfile과 동일 정본 패턴.)
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getAuthToken = useCallback(async (): Promise<string> => {
    const token = await getTokenRef.current({ template: 'supabase' });
    return token ?? '';
  }, []);

  const fetchToday = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const result = await apiGetTodayDaily(token);
      if (!mountedRef.current) return;
      if (result.error) {
        setError(result.error);
      } else {
        setCapsule(result.data);
      }
    } catch {
      if (mountedRef.current) {
        setError({ code: 'UNKNOWN_ERROR', message: '캡슐을 불러올 수 없습니다.' });
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [getAuthToken]);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const result = await apiGenerateDaily(token);
      if (!mountedRef.current) return;
      if (result.error) {
        setError(result.error);
      } else {
        setCapsule(result.data);
      }
    } catch {
      if (mountedRef.current) {
        setError({ code: 'UNKNOWN_ERROR', message: '캡슐 생성에 실패했습니다.' });
      }
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [getAuthToken]);

  const checkItem = useCallback(
    async (itemId: string, isChecked: boolean) => {
      if (!capsule) return;
      setError(null);

      // 낙관적 업데이트
      const prevCapsule = capsule;
      setCapsule({
        ...capsule,
        items: capsule.items.map((item) => (item.id === itemId ? { ...item, isChecked } : item)),
      });

      try {
        const token = await getAuthToken();
        const result = await apiCheckItem(capsule.id, itemId, isChecked, token);
        if (!mountedRef.current) return;
        if (result.error) {
          // 롤백
          setCapsule(prevCapsule);
          setError(result.error);
        } else if (result.data) {
          setCapsule(result.data);
        }
      } catch {
        if (mountedRef.current) {
          setCapsule(prevCapsule);
          setError({ code: 'UNKNOWN_ERROR', message: '체크 업데이트에 실패했습니다.' });
        }
      }
    },
    [capsule, getAuthToken]
  );

  const completionRate =
    capsule && capsule.items.length > 0
      ? Math.round((capsule.items.filter((i) => i.isChecked).length / capsule.items.length) * 100)
      : 0;

  return {
    capsule,
    isLoading,
    isGenerating,
    error,
    fetchToday,
    generate,
    checkItem,
    completionRate,
  };
}

// =============================================================================
// useBeautyProfile — BeautyProfile 조회
// =============================================================================

interface UseBeautyProfileReturn {
  profile: BeautyProfile | null;
  isLoading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
}

export function useBeautyProfile(): UseBeautyProfileReturn {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<BeautyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  // clerk-expo getToken은 렌더마다 참조가 바뀐다. ref로 최신값을 고정해 deps에서 제외하지 않으면
  // refresh가 매 렌더 새 참조가 되고 아래 로드 effect가 무한 재발화한다(프로필 API 스톰 → 429/DDoS 차단).
  // 관례: hooks/useBriefing.ts, lib/capsule/hooks 정렬.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current({ template: 'supabase' });
      const result = await apiGetProfile(token ?? '');
      if (!mountedRef.current) return;
      if (result.error) {
        setError(result.error);
      } else {
        setProfile(result.data);
      }
    } catch {
      if (mountedRef.current) {
        setError({ code: 'UNKNOWN_ERROR', message: '프로필을 불러올 수 없습니다.' });
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, isLoading, error, refresh };
}
