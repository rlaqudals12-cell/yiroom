'use client';

/**
 * 홈 위젯 순서 관리 훅
 * - Supabase users.widget_order JSONB 동기화
 * - localStorage fallback (비로그인 또는 DB 미마이그레이션 시)
 * - Active 상태 위젯 5개의 순서를 사용자가 커스터마이징
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

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

/** 위젯 순서 배열 유효성 검사 */
function isValidOrder(parsed: unknown): parsed is WidgetId[] {
  if (!Array.isArray(parsed)) return false;
  if (parsed.length !== DEFAULT_WIDGET_ORDER.length) return false;
  return DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id));
}

/** localStorage에서 순서 읽기 */
function readLocalOrder(): WidgetId[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    return isValidOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** localStorage에 순서 저장 */
function writeLocalOrder(order: WidgetId[] | null): void {
  try {
    if (order === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    }
  } catch {
    // 저장 실패 시 무시
  }
}

export function useWidgetOrder(): UseWidgetOrderReturn {
  const [order, setOrderState] = useState<WidgetId[]>([...DEFAULT_WIDGET_ORDER]);
  const [isCustomized, setIsCustomized] = useState(false);
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  // Supabase 저장 디바운스용
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 로드: Supabase → localStorage fallback
  useEffect(() => {
    let cancelled = false;

    async function loadOrder(): Promise<void> {
      // 1. 로그인 상태면 Supabase에서 먼저 시도
      if (user?.id && supabase) {
        try {
          const { data } = await supabase
            .from('users')
            .select('widget_order')
            .eq('clerk_user_id', user.id)
            .single();

          if (!cancelled && data?.widget_order && isValidOrder(data.widget_order)) {
            setOrderState(data.widget_order);
            setIsCustomized(true);
            // localStorage도 동기화
            writeLocalOrder(data.widget_order);
            return;
          }
        } catch {
          // DB 컬럼 미존재 또는 네트워크 에러 → localStorage fallback
        }
      }

      // 2. localStorage fallback
      if (!cancelled) {
        const local = readLocalOrder();
        if (local) {
          setOrderState(local);
          setIsCustomized(true);
        }
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  // Supabase에 순서 저장 (디바운스 500ms)
  const saveToSupabase = useCallback(
    (newOrder: WidgetId[] | null) => {
      if (!user?.id || !supabase) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await supabase
            .from('users')
            .update({ widget_order: newOrder })
            .eq('clerk_user_id', user.id);
        } catch {
          // DB 저장 실패 시 무시 (localStorage에는 이미 저장됨)
        }
      }, 500);
    },
    [user?.id, supabase]
  );

  const setOrder = useCallback(
    (newOrder: WidgetId[]) => {
      setOrderState(newOrder);
      setIsCustomized(true);
      writeLocalOrder(newOrder);
      saveToSupabase(newOrder);
    },
    [saveToSupabase]
  );

  const resetOrder = useCallback(() => {
    setOrderState([...DEFAULT_WIDGET_ORDER]);
    setIsCustomized(false);
    writeLocalOrder(null);
    saveToSupabase(null);
  }, [saveToSupabase]);

  return { order, setOrder, resetOrder, isCustomized };
}
