/**
 * M-1 Makeup Composer (PC + S 조합)
 *
 * @module lib/analysis/integrated/internal/makeup-composer
 * @description
 *   ADR-098 "M-1은 실행 레이어, 독립 분석 아님" 원칙에 따라
 *   PC(퍼스널컬러) + S(피부) 결과를 조합하여 메이크업 추천을 생성.
 *
 *   독립 AI 호출 없음 — 두 축 결과의 순수 조합.
 *
 * @see docs/adr/ADR-098-identity-redefinition-5axis-model.md §2.2 (M-1 실행 레이어)
 * @see docs/adr/ADR-099-integrated-analysis-flow.md §2.6
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 5
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { skinTypeKo, finishKo, coverageKo } from '../labels';
import type { AxisResult, MakeupAxisData, PersonalColorAxisData, SkinAxisData } from '../types';

/** PC 결과에서 립 팔레트 도출 */
function deriveLipPalette(pc: PersonalColorAxisData): string[] {
  // PC 메인 팔레트에서 립으로 쓸만한 warm/cool 톤 추출 (상위 4개)
  // 실제로는 PC mock의 palette.lipColors를 활용하고 싶지만,
  // PersonalColorAxisData가 단순화된 형태이므로 palette를 그대로 활용
  return (pc.palette ?? []).slice(0, 4);
}

/** PC 결과에서 아이섀도 팔레트 도출 */
function deriveEyeshadowPalette(pc: PersonalColorAxisData): string[] {
  // PC 팔레트 중간 범위에서 아이섀도 톤 선택
  const palette = pc.palette ?? [];
  return palette.slice(Math.floor(palette.length / 2), palette.length);
}

/** 피부 상태 기반 베이스 타입 결정 */
function deriveBaseRecommendation(skin: SkinAxisData): {
  finishType: 'dewy' | 'satin' | 'matte' | 'semi-matte';
  coverageLevel: 'light' | 'medium' | 'full';
  description: string;
} {
  const type = skin.skinType?.toLowerCase() ?? 'normal';
  const score = skin.overallScore ?? 70;

  // 왜: 지성→매트, 건성→듀이, 복합성→사틴. 점수 낮을수록 커버력↑
  const finishType = pickFinishType(type);
  const coverageLevel = pickCoverageLevel(score);

  // 원시 영문값(combination/semi-matte/medium) 노출 금지 — 소비자 눈높이 한국어로 (모바일도 서버 저장값을 그대로 렌더)
  const description = `${skinTypeKo(type)} 피부에는 ${finishKo(finishType)} 피니시 + ${coverageKo(coverageLevel)} 커버가 어울려요.`;

  return { finishType, coverageLevel, description };
}

function pickFinishType(type: string): 'dewy' | 'satin' | 'matte' | 'semi-matte' {
  if (type.includes('oil') || type === 'oily') return 'matte';
  if (type.includes('dry') || type === 'dry') return 'dewy';
  if (type.includes('combination')) return 'semi-matte';
  return 'satin';
}

function pickCoverageLevel(score: number): 'light' | 'medium' | 'full' {
  if (score >= 80) return 'light';
  if (score >= 55) return 'medium';
  return 'full';
}

/**
 * PC + S 결과로부터 M-1 추천을 생성하는 순수 함수.
 * 테스트 가능하도록 DB 저장과 분리.
 */
export function composeMakeupData(pc: PersonalColorAxisData, skin: SkinAxisData): MakeupAxisData {
  const lipPalette = deriveLipPalette(pc);
  const eyeshadowPalette = deriveEyeshadowPalette(pc);
  const base = deriveBaseRecommendation(skin);

  return {
    baseRecommendation: base.description,
    lipPalette,
    eyeshadowPalette,
    tutorialSteps: [
      `1. ${finishKo(base.finishType)} 피니시의 베이스 제품으로 시작 (커버 ${coverageKo(base.coverageLevel)})`,
      `2. 립 컬러: ${lipPalette[0] ?? '#000'} (메인) / ${lipPalette[1] ?? '#000'} (보조)`,
      `3. 아이섀도: ${eyeshadowPalette[0] ?? '#000'} 기본 + ${eyeshadowPalette[1] ?? '#000'} 포인트`,
    ],
  };
}

/**
 * M-1 composer를 실행하고 DB에 저장.
 * PC + S 둘 다 성공한 경우에만 호출됨 (orchestrator가 가드).
 */
export async function runMakeupComposer(
  sessionId: string,
  clerkUserId: string,
  pcResult: AxisResult<PersonalColorAxisData>,
  skinResult: AxisResult<SkinAxisData>
): Promise<AxisResult<MakeupAxisData>> {
  // 가드: PC 또는 S가 실패했으면 M-1 실행 불가
  if (!pcResult.success || !skinResult.success) {
    return {
      success: false,
      error: {
        code: 'REQUIRES_PC_AND_S',
        message: 'M-1 composer requires both PC and S success',
        userMessage: '메이크업 추천은 퍼스널컬러와 피부 분석이 필요해요.',
        retryable: false,
      },
    };
  }

  try {
    const composed = composeMakeupData(pcResult.data, skinResult.data);

    // PC 결과의 undertone을 makeup_analyses.undertone 컬럼에 저장
    const undertone = pcResult.data.undertone?.toLowerCase() ?? 'neutral';
    const normalizedUndertone: 'warm' | 'cool' | 'neutral' =
      undertone === 'warm' || undertone === 'cool' ? undertone : 'neutral';

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('makeup_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: `integrated://face/${sessionId}`,
        undertone: normalizedUndertone,
        // 기본값: 통합 플로우에서는 얼굴 상세 측정 생략
        eye_shape: 'almond',
        lip_shape: 'full',
        face_shape: 'oval',
        skin_texture: skinResult.data.overallScore ?? 70,
        skin_tone_uniformity: skinResult.data.overallScore ?? 70,
        hydration: 70,
        pore_visibility: 50,
        oil_balance: 50,
        overall_score: skinResult.data.overallScore ?? 70,
        concerns: [],
        recommendations: composed,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'DB_SAVE_FAILED',
          message: error.message,
          userMessage: '메이크업 추천 저장에 실패했어요.',
          retryable: true,
        },
      };
    }

    return {
      success: true,
      usedFallback: false, // composer는 AI 호출 없이 순수 조합이므로 fallback 개념 없음
      data: {
        id: data?.id as string | undefined,
        ...composed,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : String(error),
        userMessage: '메이크업 추천 생성 중 오류가 발생했어요.',
        retryable: true,
      },
    };
  }
}
