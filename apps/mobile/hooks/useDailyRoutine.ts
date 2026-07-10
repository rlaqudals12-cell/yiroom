/**
 * 오늘의 맞춤 루틴 로드 훅 (ADR-118)
 *
 * 웹 /api/routine/daily를 호출해 루틴 페이로드를 로드한다. 서버가 고민 파생·케어 단계·
 * shelf-우선 배치·스킨 사이클링을 조립하므로 이 훅은 fetch·상태 관리만 담당(렌더는 화면).
 * 오프라인이면 마지막 루틴을 stale로 노출한다(fetchDailyRoutine 내부 캐시 폴백).
 */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { fetchDailyRoutine, type DailyRoutineData } from '../lib/api/routine';

export interface UseDailyRoutineResult {
  data: DailyRoutineData | null;
  /** 오프라인 캐시(마지막 루틴)인지 */
  stale: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDailyRoutine(): UseDailyRoutineResult {
  const { getToken } = useAuth();
  const [data, setData] = useState<DailyRoutineData | null>(null);
  const [stale, setStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setData(null);
            setIsLoading(false);
          }
          return;
        }
        const result = await fetchDailyRoutine(token);
        if (!cancelled) {
          setData(result.data);
          setStale(result.stale);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : '루틴을 불러올 수 없어요.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getToken, reloadKey]);

  return { data, stale, isLoading, error, refetch };
}
