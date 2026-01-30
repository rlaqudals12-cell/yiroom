/**
 * 어필리에이트 클릭 트래킹
 * @description 모바일 앱에서 클릭 기록 (Clerk 통합 Supabase)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { AffiliateClickInput } from './types';
import { affiliateLogger } from '../utils/logger';

/**
 * 클릭 기록 생성
 * @param supabase - Clerk 통합 Supabase 클라이언트
 * @param input - 클릭 입력 데이터
 */
export async function createAffiliateClick(
  supabase: SupabaseClient,
  input: AffiliateClickInput
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('affiliate_clicks')
      .insert({
        product_id: input.productId,
        clerk_user_id: input.clerkUserId ?? null,
        source_page: input.sourcePage,
        source_component: input.sourceComponent ?? null,
        recommendation_type: input.recommendationType ?? null,
        user_agent: 'yiroom-mobile-app',
      })
      .select('id')
      .single();

    if (error) {
      affiliateLogger.error(' 클릭 기록 실패:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    affiliateLogger.error(' 클릭 기록 오류:', error);
    return null;
  }
}

/**
 * 사용자 클릭 히스토리 조회
 * @param supabase - Clerk 통합 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 * @param limit - 조회 개수
 */
export async function getUserClickHistory(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit = 20
): Promise<{ productId: string; clickedAt: Date }[]> {
  try {
    const { data, error } = await supabase
      .from('affiliate_clicks')
      .select('product_id, clicked_at')
      .eq('clerk_user_id', clerkUserId)
      .order('clicked_at', { ascending: false })
      .limit(limit);

    if (error) {
      affiliateLogger.error(' 히스토리 조회 실패:', error);
      return [];
    }

    return data.map((row) => ({
      productId: row.product_id,
      clickedAt: new Date(row.clicked_at),
    }));
  } catch (error) {
    affiliateLogger.error(' 히스토리 조회 오류:', error);
    return [];
  }
}
