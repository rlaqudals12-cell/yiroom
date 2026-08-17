'use client';

import { useSyncUser } from '@/hooks/use-sync-user';

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 프로바이더
 *
 * RootLayout에 추가하여 로그인한 모든 사용자를 자동으로 Supabase에 동기화합니다.
 *
 * 실패를 왜 노출하나: 이 동기화가 만드는 `users` 행은 생체분석 라우트의 선행조건이다
 * (연령 게이트가 fail-closed라 행이 없으면 성인도 403). 침묵하면 사용자는 "분석이
 * 안 되는 앱"만 보게 되므로, 유한 재시도까지 모두 실패했을 때만 복구 수단을 준다.
 */
export function SyncUserProvider({ children }: { children: React.ReactNode }) {
  const { hasFailed, retry } = useSyncUser();

  return (
    <>
      {children}
      {hasFailed && (
        <div
          role="alert"
          data-testid="sync-user-failed-banner"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-destructive/30 bg-card px-4 py-3 shadow-lg"
        >
          <p className="min-w-0 flex-1 text-xs text-foreground">
            계정 정보를 불러오지 못했어요. 이대로는 분석이 막힐 수 있어요.
          </p>
          <button
            type="button"
            onClick={retry}
            data-testid="sync-user-retry"
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}
