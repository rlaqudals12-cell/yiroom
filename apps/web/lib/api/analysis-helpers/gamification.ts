/**
 * 게이미피케이션 연동 헬퍼 (XP + 뱃지)
 *
 * @see ADR-085
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { awardAnalysisBadge, checkAndAwardAllAnalysisBadge, addXp } from '@/lib/gamification';
import type { GamificationResult } from './types';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

/**
 * 분석 완료 후 XP 지급 + 분석 뱃지 + 전체 분석 뱃지 체크
 *
 * @param supabase - Supabase 클라이언트 (Service Role)
 * @param userId - Clerk user ID
 * @param badgeType - 분석 뱃지 타입 (e.g., 'skin', 'personal_color')
 * @returns 뱃지 수여 결과 + XP 지급량
 *
 * @example
 * const gamification = await withGamification(supabase, userId, 'skin');
 */
export async function withGamification(
  supabase: SupabaseClient,
  userId: string,
  badgeType: 'personal-color' | 'skin' | 'body' | 'posture'
): Promise<GamificationResult> {
  const result: GamificationResult = {
    badgeResults: [],
    xpAwarded: 0,
  };

  try {
    await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
    result.xpAwarded = XP_ANALYSIS_COMPLETE;

    const badge = await awardAnalysisBadge(supabase, userId, badgeType);
    if (badge) {
      result.badgeResults.push(badge);
    }

    const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
    if (allBadge) {
      result.badgeResults.push(allBadge);
    }
  } catch (error) {
    // 게이미피케이션 실패는 분석 결과에 영향 안 줌
    console.warn('[Gamification] XP/뱃지 처리 실패:', error);
  }

  return result;
}
