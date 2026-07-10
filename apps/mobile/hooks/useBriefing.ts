/**
 * 아침 브리핑 로드 훅 (ADR-118)
 *
 * 웹 /api/briefing를 호출해 브리핑 페이로드를 로드한다. 서버가 문장·배색을 조립하므로
 * 이 훅은 fetch·상태 관리만 담당(렌더는 HomeBriefing). 오프라인이면 마지막 브리핑을
 * stale로 노출한다(fetchBriefing 내부 캐시 폴백).
 */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { fetchBriefing, type BriefingData } from '../lib/api/briefing';

export interface UseBriefingResult {
  data: BriefingData | null;
  /** 오프라인 캐시(마지막 브리핑)인지 */
  stale: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBriefing(): UseBriefingResult {
  const { getToken } = useAuth();
  const [data, setData] = useState<BriefingData | null>(null);
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
        const result = await fetchBriefing(token);
        if (!cancelled) {
          setData(result.data);
          setStale(result.stale);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : '브리핑을 불러올 수 없어요.');
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
