'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'yiroom-color-blind-mode';

/** 색맹 모드 토글 훅 — localStorage에 상태 저장 (useExpertMode 패턴 동일) */
export function useColorBlindMode(): {
  isColorBlind: boolean;
  toggleColorBlind: () => void;
} {
  const [isColorBlind, setIsColorBlind] = useState(false);

  // localStorage에서 초기값 복원 + data-color-blind 속성 동기화
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setIsColorBlind(true);
        document.documentElement.setAttribute('data-color-blind', 'true');
      }
    } catch {
      /* SSR 또는 접근 불가 */
    }
  }, []);

  const toggleColorBlind = useCallback(() => {
    setIsColorBlind((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
        if (next) {
          document.documentElement.setAttribute('data-color-blind', 'true');
        } else {
          document.documentElement.removeAttribute('data-color-blind');
        }
      } catch {
        /* 저장 실패 무시 */
      }
      return next;
    });
  }, []);

  return { isColorBlind, toggleColorBlind };
}
