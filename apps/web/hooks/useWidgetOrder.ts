'use client';

/**
 * 홈 위젯 순서 관리 훅
 * - localStorage 기반 (GFSA 후 Supabase 마이그레이션 예정)
 * - Active 상태 위젯 5개의 순서를 사용자가 커스터마이징
 */

import { useState, useCallback, useEffect } from 'react';

// Active 상태 위젯 ID 목록 (기본 순서)
export const DEFAULT_WIDGET_ORDER = [
  'insight',
  'capsule',
  'analysis-summary',
  'activity-bar',
  'recently-viewed',
] as const;

export type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number];

const STORAGE_KEY = 'yiroom_widget_order';

interface UseWidgetOrderReturn {
  order: WidgetId[];
  setOrder: (newOrder: WidgetId[]) => void;
  resetOrder: () => void;
  isCustomized: boolean;
}

export function useWidgetOrder(): UseWidgetOrderReturn {
  const [order, setOrderState] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);
  const [isCustomized, setIsCustomized] = useState(false);

  // localStorage에서 순서 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // 유효성 검사: 모든 기본 위젯이 포함되어야 함
        const isValid =
          parsed.length === DEFAULT_WIDGET_ORDER.length &&
          DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id));
        if (isValid) {
          setOrderState(parsed as WidgetId[]);
          setIsCustomized(true);
        }
      }
    } catch {
      // localStorage 접근 실패 시 기본 순서 유지
    }
  }, []);

  const setOrder = useCallback((newOrder: WidgetId[]) => {
    setOrderState(newOrder);
    setIsCustomized(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // 저장 실패 시 무시
    }
  }, []);

  const resetOrder = useCallback(() => {
    setOrderState([...DEFAULT_WIDGET_ORDER]);
    setIsCustomized(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 삭제 실패 시 무시
    }
  }, []);

  return { order, setOrder, resetOrder, isCustomized };
}
