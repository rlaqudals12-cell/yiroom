/**
 * 내 AI 아바타(트윈) 조회 훅 (ADR-115 / ADR-118)
 *
 * 웹 GET /api/visual/twin를 호출해 내 트윈을 로드한다. 승인 게이트가 핵심 —
 * `approvedOnly`로 approved만 노출 대상으로 반환한다(pending/rejected는 어떤 카드/
 * 화면에도 내보내지 않는다, 웹 useApprovedTwin과 동일 정책). 생성·승인 로직 정본은
 * 웹 서버 — 이 훅은 fetch·상태 관리만 담당한다.
 */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchMyTwin, approvedOnly, subscribeTwinChanged, type TwinRecord } from '../lib/api/twin';

export interface UseMyTwinResult {
  /** 승인된 트윈만(pending/rejected는 null) */
  approvedTwin: TwinRecord | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMyTwin(): UseMyTwinResult {
  const { getToken } = useAuth();
  const [approvedTwin, setApprovedTwin] = useState<TwinRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // getToken 참조가 불안정하면 로드 이펙트가 매 렌더 재실행돼 무한 refetch가 된다.
  // 최신 getToken을 ref로 잡아 이펙트 deps에서 제외한다(lib/capsule/hooks 관례와 정렬).
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // 스튜디오 승인/삭제 등 외부 변경 알림 시 재조회 (리마운트 없이 최신 반영)
  useEffect(() => subscribeTwinChanged(refetch), [refetch]);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        if (!token) {
          if (!cancelled) {
            setApprovedTwin(null);
            setIsLoading(false);
          }
          return;
        }
        const record = await fetchMyTwin(token);
        // 승인 게이트: approved만 노출
        if (!cancelled) setApprovedTwin(approvedOnly(record));
      } catch (e) {
        if (!cancelled) {
          setApprovedTwin(null);
          setError(e instanceof Error ? e.message : '내 AI 아바타를 불러올 수 없어요.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { approvedTwin, isLoading, error, refetch };
}
