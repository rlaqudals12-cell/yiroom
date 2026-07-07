/**
 * Level 3 프롬프트 — 사용자 직전 분석 컨텍스트 주입
 *
 * @module lib/analysis/prior-context
 * @description
 *   prompt-engineering.md Level 체계의 Level 3: 과거 데이터 주입 (~90%+).
 *   직전 분석 요약을 프롬프트에 앵커로 제공해 ①안정 지표(피부 타입 등)의
 *   판정 일관성(재현성) ②변화 감지의 명시성("무엇이 왜 달라졌나")을 얻는다.
 *
 *   원칙 (프롬프트에도 명시):
 *   - 앵커이지 정답이 아니다 — 현재 사진 증거가 명확히 다르면 증거 우선
 *   - 이전 점수 복사 금지 — 각 지표는 현재 이미지에서 독립 측정
 *   - PC(퍼스널컬러)는 주입하지 않는다 — V2는 Lab 결정론 엔진이라 불필요하고,
 *     판정 독립성(재분석의 의미)을 보존
 *
 *   실패는 조용히 null — prior가 없거나 조회 실패해도 분석은 Level 2로 진행.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 왜 tie-break 한정인가: 상시 앵커로 주면 경계가 아닌 판정까지 이전 값으로
// 끌려가 같은 사진 재현성이 오히려 떨어짐 (2026-07-08 실측: 3/3 → 2/3).
const SHARED_RULES = `- 판정 절차: 먼저 이전 분석을 무시하고 현재 사진만으로 독립 판정하세요.
- 그 다음, 독립 판정이 두 타입 사이 경계(박빙)일 때만 이전 판정을 tie-break로 사용하세요. 박빙이 아니면 이전 판정을 무시합니다.
- 점수는 절대 이전 값에서 복사하지 않습니다 — 모든 지표는 현재 이미지에서 독립 측정.
- 이전 대비 큰 변화(10점 이상)를 감지하면 추천 문구에 그 변화를 반영하세요.`;

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

/** 직전 피부 분석 요약 → 프롬프트 스니펫 (없으면 null) */
export async function getSkinPriorHint(clerkUserId: string): Promise<string | null> {
  try {
    const { data } = await createServiceRoleClient()
      .from('skin_analyses')
      .select('skin_type, hydration, oil_level, sensitivity, overall_score, created_at')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.skin_type) return null;

    return `## 이전 분석 참고 (${daysAgo(data.created_at as string)})
이 사용자의 직전 피부 분석: 타입 ${data.skin_type}, 수분 ${data.hydration ?? '?'}, 유분 ${data.oil_level ?? '?'}, 민감도 ${data.sensitivity ?? '?'}, 종합 ${data.overall_score ?? '?'}점.
${SHARED_RULES}`;
  } catch (e) {
    console.error('[PriorContext] skin 조회 실패 (Level 2로 진행):', e);
    return null;
  }
}

/** 직전 체형 분석 요약 → 프롬프트 스니펫 (없으면 null) */
export async function getBodyPriorHint(clerkUserId: string): Promise<string | null> {
  try {
    const { data } = await createServiceRoleClient()
      .from('body_analyses')
      .select('body_type, created_at')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.body_type) return null;

    return `## 이전 분석 참고 (${daysAgo(data.created_at as string)})
이 사용자의 직전 체형 분석: ${data.body_type} 타입.
${SHARED_RULES}
- 체형 골격 타입은 단기간에 바뀌지 않습니다 — 촬영 각도/의류 차이로 다른 타입이 보이면 신뢰도를 낮추고 근거를 명시하세요.`;
  } catch (e) {
    console.error('[PriorContext] body 조회 실패 (Level 2로 진행):', e);
    return null;
  }
}

/** 직전 헤어 분석 요약 → 프롬프트 스니펫 (없으면 null) */
export async function getHairPriorHint(clerkUserId: string): Promise<string | null> {
  try {
    const { data } = await createServiceRoleClient()
      .from('hair_analyses')
      .select('hair_type, scalp_type, damage_level, overall_score, created_at')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.hair_type && !data?.scalp_type) return null;

    return `## 이전 분석 참고 (${daysAgo(data.created_at as string)})
이 사용자의 직전 헤어 분석: 모발 ${data.hair_type ?? '?'}, 두피 ${data.scalp_type ?? '?'}, 손상도 ${data.damage_level ?? '?'}, 종합 ${data.overall_score ?? '?'}점.
${SHARED_RULES}`;
  } catch (e) {
    console.error('[PriorContext] hair 조회 실패 (Level 2로 진행):', e);
    return null;
  }
}
