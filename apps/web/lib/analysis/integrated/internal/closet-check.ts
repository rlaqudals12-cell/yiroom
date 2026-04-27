/**
 * 옷장 아이템 존재 여부 확인 (통합 큐레이션 outfit 카드 제어용)
 *
 * @module lib/analysis/integrated/internal/closet-check
 * @description
 *   큐레이션이 outfit 카드를 `/closet/recommend`로 보내는데, 옷장이 비면
 *   사용자가 빈 상태를 만남 → CTA를 "먼저 옷장 등록하기"로 우회시키기 위해
 *   세션 기반 RLS로 옷장 아이템 1개만 HEAD 조회.
 *
 * @internal — 외부 import 금지 (result page 전용)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';

/**
 * 현재 로그인 사용자의 옷장(category='closet')에 아이템이 하나라도 있는지 확인.
 * RLS로 권한 검증, 조회 실패 시 undefined 반환 (curation이 기본 경로 사용).
 */
export async function hasAnyClosetItems(): Promise<boolean | undefined> {
  try {
    const supabase = await createClerkSupabaseClient();
    const { count, error } = await supabase
      .from('user_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'closet');

    if (error) {
      console.warn('[ClosetCheck] fallback to undefined:', error.message);
      return undefined;
    }
    return (count ?? 0) > 0;
  } catch (error) {
    console.warn('[ClosetCheck] unexpected error:', error);
    return undefined;
  }
}
