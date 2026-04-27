/**
 * 옷장 아이템 존재 여부 확인 훅 (통합 큐레이션 outfit 카드 제어용)
 *
 * @module hooks/useHasClosetItems
 * @description
 *   composeCuration이 outfit 카드를 `/(closet)/recommend`로 보내는데,
 *   옷장이 비면 빈 상태를 마주치게 됨 → CTA를 "먼저 옷장 등록하기"로
 *   우회시키기 위해 세션 기반 RLS로 옷장 아이템 1개만 head 조회.
 *
 *   결과:
 *   - true: 옷장에 1개 이상 아이템 존재
 *   - false: 옷장 비어있음 (composeCuration이 우회 CTA 사용)
 *   - undefined: 아직 로딩 중이거나 조회 실패 → 기본 경로 사용
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useClerkSupabaseClient } from '@/lib/supabase';

export function useHasClosetItems(): boolean | undefined {
  const { isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [hasItems, setHasItems] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!isSignedIn) {
      setHasItems(undefined);
      return;
    }

    let cancelled = false;

    (async (): Promise<void> => {
      try {
        const { count, error } = await supabase
          .from('user_inventory')
          .select('id', { count: 'exact', head: true })
          .eq('category', 'closet');

        if (cancelled) return;

        if (error) {
          console.warn('[useHasClosetItems] query error:', error.message);
          setHasItems(undefined);
          return;
        }

        setHasItems((count ?? 0) > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn('[useHasClosetItems] unexpected error:', err);
        setHasItems(undefined);
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [isSignedIn, supabase]);

  return hasItems;
}
