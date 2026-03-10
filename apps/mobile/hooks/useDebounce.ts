import { useState, useEffect } from 'react';

/**
 * 디바운스 훅
 * 값이 변경된 후 지정된 시간이 지날 때까지 기다린 후 값을 반환
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
