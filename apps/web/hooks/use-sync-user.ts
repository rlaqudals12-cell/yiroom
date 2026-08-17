'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 *
 * 왜 재시도가 필요한가 (2026-08 외부 리뷰):
 *   이 동기화는 `users` 행을 만드는 **선행조건**이다. 생체분석 라우트의 연령 게이트는
 *   fail-closed라 `users` 행(생년월일)이 없으면 403으로 막는다. 그래서 가입 직후
 *   네트워크가 한 번 튀어 동기화가 실패하면, 성인 사용자도 분석 전체가 403으로 막히고
 *   훅은 1회 시도 후 영구히 포기했다(새로고침 전까지 회복 불가).
 *   → 유한 재시도(3회, 지수 백오프)로 경합·순간 장애를 흡수하고, 그래도 실패하면
 *     실패 사실을 호출부에 노출해 사용자가 복구(재시도/프로필 완료)할 수 있게 한다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */

/** 최대 시도 횟수 (최초 1회 + 재시도 2회) */
const MAX_SYNC_ATTEMPTS = 3;
/** 첫 재시도 대기 (지수 백오프: 400ms → 800ms) */
const SYNC_RETRY_BASE_DELAY_MS = 400;

export interface UseSyncUserResult {
  /** 동기화 성공 여부 (성공 전엔 false) */
  isSynced: boolean;
  /** 유한 재시도를 모두 소진하고 실패 — 호출부가 복구 CTA를 띄울 근거 */
  hasFailed: boolean;
  /** 수동 재시도 (실패 CTA용) */
  retry: () => void;
}

/** 재시도해도 소용없는 응답인가 (4xx = 요청/인증 문제 — 반복해도 같은 결과) */
function isPermanentFailure(status: number): boolean {
  return status >= 400 && status < 500;
}

export function useSyncUser(): UseSyncUserResult {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);
  const [isSynced, setIsSynced] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  // 수동 재시도 트리거 — 마운트된 컴포넌트에서 실제 재조회가 일어나게 한다
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    syncedRef.current = false;
    setHasFailed(false);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current || !isLoaded || !userId) {
      return;
    }

    let cancelled = false;

    const syncUser = async (): Promise<void> => {
      for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt++) {
        if (cancelled) return;

        let permanent = false;
        try {
          const response = await fetch('/api/sync-user', {
            method: 'POST',
          });

          if (response.ok) {
            if (cancelled) return;
            syncedRef.current = true;
            setIsSynced(true);
            setHasFailed(false);
            return;
          }

          console.error('Failed to sync user:', await response.text());
          permanent = isPermanentFailure(response.status);
        } catch (error) {
          console.error('Error syncing user:', error);
        }

        // 4xx는 반복해도 같은 결과 — 즉시 실패로 확정
        if (permanent) break;
        if (attempt < MAX_SYNC_ATTEMPTS) {
          const delay = SYNC_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (!cancelled) {
        // 실패를 침묵시키지 않는다 — 이 상태에서 분석을 시도하면 연령 게이트가 403으로 막는다
        setHasFailed(true);
      }
    };

    void syncUser();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, retryKey]);

  return { isSynced, hasFailed, retry };
}
