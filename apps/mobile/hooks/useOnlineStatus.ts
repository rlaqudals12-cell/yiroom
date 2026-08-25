'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseOnlineStatusReturn {
  /** 현재 온라인 상태 */
  isOnline: boolean;
  /** 오프라인에서 온라인으로 전환됨 */
  wasOffline: boolean;
  /** wasOffline 상태 리셋 */
  resetWasOffline: () => void;
}

/**
 * 온라인/오프라인 상태 감지 훅
 * - navigator.onLine 기반
 * - online/offline 이벤트 리스닝
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // SSR에서는 기본값 true 사용
    // RN에는 window 이벤트·navigator.onLine이 없다(웹 사포크) — 미지원 환경은 온라인 가정 유지
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    setIsOnline(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return { isOnline, wasOffline, resetWasOffline };
}

export default useOnlineStatus;
