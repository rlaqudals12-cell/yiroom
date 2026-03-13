'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'yiroom-expert-mode';

/** 전문가 모드 토글 훅 — localStorage에 상태 저장 */
export function useExpertMode(): {
  isExpert: boolean;
  toggleExpert: () => void;
} {
  const [isExpert, setIsExpert] = useState(false);

  // localStorage에서 초기값 복원
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setIsExpert(true);
      }
    } catch {
      /* SSR 또는 접근 불가 */
    }
  }, []);

  const toggleExpert = useCallback(() => {
    setIsExpert((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* 저장 실패 무시 */
      }
      return next;
    });
  }, []);

  return { isExpert, toggleExpert };
}
