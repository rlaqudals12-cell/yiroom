'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

/**
 * 오프라인/온라인 상태 배너
 * - 오프라인 상태 시 화면 상단에 경고 표시
 * - 온라인 복구 시 성공 메시지 표시
 */
export function OfflineBanner() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // 온라인 복구 시 알림 표시
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        resetWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline, resetWasOffline]);

  // 온라인 상태이고 복구 알림도 없으면 표시 안함
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-orange-500 text-white'
      )}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>인터넷에 연결되었습니다</span>
          <button
            onClick={() => {
              setShowReconnected(false);
              resetWasOffline();
            }}
            className="ml-2 p-1 hover:bg-white/20 rounded"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>오프라인 상태입니다. 일부 기능이 제한될 수 있어요.</span>
        </>
      )}
    </div>
  );
}

export default OfflineBanner;
