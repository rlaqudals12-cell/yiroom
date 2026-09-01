/**
 * 아침 브리핑 로드 훅 (ADR-118)
 *
 * 웹 /api/briefing를 호출해 브리핑 페이로드를 로드한다. 서버가 문장·배색을 조립하므로
 * 이 훅은 fetch·상태 관리만 담당(렌더는 HomeBriefing). 오프라인이면 마지막 브리핑을
 * stale로 노출한다(fetchBriefing 내부 캐시 폴백).
 */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { clearBriefingCache, fetchBriefing, type BriefingData } from '../lib/api/briefing';
import { useNetworkStatus } from '../lib/offline';

export interface UseBriefingResult {
  data: BriefingData | null;
  /** 오프라인 캐시(마지막 브리핑)인지 */
  stale: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBriefing(): UseBriefingResult {
  const { getToken, userId } = useAuth();
  const { status: networkStatus } = useNetworkStatus();
  const [briefingResult, setBriefingResult] = useState<{
    ownerId: string;
    data: BriefingData;
    stale: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // getToken 참조가 불안정하면 로드 이펙트가 매 렌더 재실행돼 무한 refetch가 된다.
  // 최신 getToken을 ref로 잡아 이펙트 deps에서 제외한다(lib/capsule/hooks 관례와 정렬).
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const previousNetworkStatusRef = useRef(networkStatus);
  const previousUserIdRef = useRef(userId);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const previousStatus = previousNetworkStatusRef.current;
    previousNetworkStatusRef.current = networkStatus;
    if (previousStatus === 'offline' && networkStatus === 'online') {
      refetch();
    }
  }, [networkStatus, refetch]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;
    if (previousUserId && previousUserId !== userId) {
      // 왜: 로그아웃·계정 전환 뒤 이전 사용자의 비공개 옷 사진 서명 URL을 남기지 않는다.
      void clearBriefingCache(previousUserId);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        if (!token || !userId) {
          if (!cancelled) {
            setBriefingResult(null);
            setIsLoading(false);
          }
          return;
        }
        const result = await fetchBriefing(token, userId);
        if (!cancelled) {
          setBriefingResult({ ownerId: userId, data: result.data, stale: result.stale });
        }
      } catch (e) {
        if (!cancelled) {
          setBriefingResult(null);
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
  }, [reloadKey, userId]);

  const currentResult = briefingResult && briefingResult.ownerId === userId ? briefingResult : null;
  return {
    data: currentResult?.data ?? null,
    stale: currentResult?.stale ?? false,
    isLoading,
    error,
    refetch,
  };
}
