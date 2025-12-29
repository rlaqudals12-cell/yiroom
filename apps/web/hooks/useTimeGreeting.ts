'use client';

import { useState, useEffect } from 'react';

/**
 * 시간 기반 인사말 훅
 * - 05:00-11:59: 좋은 아침
 * - 12:00-17:59: 좋은 오후
 * - 18:00-21:59: 좋은 저녁
 * - 22:00-04:59: 좋은 밤
 */

export type GreetingType = '좋은 아침' | '좋은 오후' | '좋은 저녁' | '좋은 밤';

export function getTimeGreeting(hour?: number): GreetingType {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 12) return '좋은 아침';
  if (h >= 12 && h < 18) return '좋은 오후';
  if (h >= 18 && h < 22) return '좋은 저녁';
  return '좋은 밤';
}

export function useTimeGreeting() {
  const [greeting, setGreeting] = useState<GreetingType>('좋은 아침');

  useEffect(() => {
    setGreeting(getTimeGreeting());

    // 매 분마다 인사말 업데이트 (시간대 변경 감지)
    const interval = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return greeting;
}
