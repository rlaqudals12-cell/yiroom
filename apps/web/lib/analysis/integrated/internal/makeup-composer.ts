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
import { generateTonePalette } from '@/lib/analysis/personal-color-v2/classify';
import { TWELVE_TONE_REFERENCE_LAB, type TwelveTone } from '@/lib/analysis/personal-color-v2';
import { getKoreanColorName } from '@/lib/utils/color-names';
import { DeadlineExceededError, withDeadline, type ExecutionDeadline } from '@/lib/utils/timeout';
import { skinTypeKo, finishKo, coverageKo } from '../labels';
import type {
  AxisResult,
  HairAxisData,
  MakeupAxisData,
  PersonalColorAxisData,
  SkinAxisData,
} from '../types';

/**
 * makeup_analyses NOT NULL + CHECK 제약을 만족시키기 위한 스키마 유효 placeholder.
 *
 * 왜 필요한가: eye_shape/lip_shape/face_shape는 NOT NULL CHECK 컬럼(202601070400)이라
 * "미측정"을 null로 표현할 수 없다. 그래서 값은 넣되, **무엇이 실측인지**를
 * recommendations.measured에 함께 남겨 결과 페이지가 미측정 항목을 아예 표시하지 않게 한다.
 * (과거엔 placeholder를 그대로 개인 판정처럼 렌더 — "지어낸 진단"의 원인)
 */
const EYE_SHAPE_PLACEHOLDER = 'almond';
const LIP_SHAPE_PLACEHOLDER = 'full';
const FACE_SHAPE_PLACEHOLDER = 'oval';

/** makeup_analyses.face_shape CHECK 허용값 — H-1 FaceShapeType과 동일 taxonomy */
const VALID_FACE_SHAPES: readonly string[] = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
];

/**
 * H-1(헤어) 축이 판정한 얼굴형을 승계한다.
 *
 * 통합 플로우에서 얼굴형을 실제로 판정하는 곳은 H-1(Gemini)뿐이다.
 * 헤어가 실패했거나 폴백(Mock)이면 실측이 아니므로 measured=false로 표시하고
 * 스키마 유효 placeholder만 저장한다 — 판정으로 렌더되지 않는다.
 */
function inheritFaceShape(hairResult?: AxisResult<HairAxisData>): {
  value: string;
  measured: boolean;
} {
  if (hairResult?.success && !hairResult.usedFallback && hairResult.fallbackState !== 'unknown') {
    const shape = String(hairResult.data.faceShape ?? '').toLowerCase();
    if (VALID_FACE_SHAPES.includes(shape)) {
      return { value: shape, measured: true };
    }
  }
  return { value: FACE_SHAPE_PLACEHOLDER, measured: false };
}

function combinedFallbackState(
  pcResult: Extract<AxisResult<PersonalColorAxisData>, { success: true }>,
  skinResult: Extract<AxisResult<SkinAxisData>, { success: true }>
): 'used' | 'not_used' | 'unknown' {
  if (pcResult.usedFallback || skinResult.usedFallback) return 'used';
  if (pcResult.fallbackState === 'unknown' || skinResult.fallbackState === 'unknown') {
    return 'unknown';
  }
  return 'not_used';
}

/**
 * PC 12톤 판정에서 메이크업 전용 팔레트를 읽는다.
 *
 * 왜: `pc.palette`는 의류용 mainColors다. 이를 잘라 립으로 쓰면 뮤티드 서머의
 * 딤그레이 같은 의류 색이 입술 추천으로 섞인다. 12톤 정본이 이미 구분한
 * lip/eyeshadow/blush 색만 소비하고, 구형 데이터처럼 12톤이 없으면 지어내지 않는다.
 */
function deriveMakeupPalettes(pc: PersonalColorAxisData): {
  lipPalette: string[];
  eyeshadowPalette: string[];
  blushPalette: string[];
} {
  if (!(pc.tone in TWELVE_TONE_REFERENCE_LAB)) {
    return { lipPalette: [], eyeshadowPalette: [], blushPalette: [] };
  }

  const palette = generateTonePalette(pc.tone as TwelveTone);
  return {
    lipPalette: palette.lipColors.slice(),
    eyeshadowPalette: palette.eyeshadowColors.slice(),
    blushPalette: palette.blushColors.slice(),
  };
}

/** 사용자 문장에는 원시 HEX 대신 사람이 읽는 색 이름을 쓴다. */
function describeColors(colors: string[], emptyMessage: string): string {
  if (colors.length === 0) return emptyMessage;
  return colors
    .slice(0, 2)
    .map((color) => getKoreanColorName(color))
    .join(' / ');
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
  const { lipPalette, eyeshadowPalette, blushPalette } = deriveMakeupPalettes(pc);
  const base = deriveBaseRecommendation(skin);
  const lipDescription = describeColors(lipPalette, '추천 색 정보가 없어요');
  const eyeDescription = describeColors(eyeshadowPalette, '추천 색 정보가 없어요');
  const blushDescription = describeColors(blushPalette, '추천 색 정보가 없어요');

  return {
    baseRecommendation: base.description,
    lipPalette,
    eyeshadowPalette,
    blushPalette,
    tutorialSteps: [
      `1. ${finishKo(base.finishType)} 피니시의 베이스 제품으로 시작 (커버 ${coverageKo(base.coverageLevel)})`,
      `2. 립 컬러: ${lipDescription}`,
      `3. 아이섀도: ${eyeDescription} · 블러셔: ${blushDescription}`,
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
  skinResult: AxisResult<SkinAxisData>,
  hairResult?: AxisResult<HairAxisData>,
  deadline?: ExecutionDeadline
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

    // 얼굴형만 실측 승계 가능 (H-1 Gemini). 눈·입술·피부 세부 지표는 통합 플로우에 측정이 없다.
    const faceShape = inheritFaceShape(hairResult);

    /**
     * M-1은 독립 AI 호출이 없는 조합 레이어다. 따라서 "폴백 여부"는 입력 축에서 승계한다.
     * 과거엔 usedFallback:false로 하드코딩돼, PC/S가 Mock이어도 결과 페이지가
     * 아무 고지 없이 개인 판정처럼 보였다 (정직성 계약 위반).
     */
    const fallbackState = combinedFallbackState(pcResult, skinResult);
    const usedFallback = fallbackState === 'used';

    const supabase = createServiceRoleClient();
    const savePromise = supabase
      .from('makeup_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: `integrated://face/${sessionId}`,
        undertone: normalizedUndertone,
        // NOT NULL 컬럼 — placeholder 저장 + measured 플래그로 표시 차단 (위 상수 주석 참조)
        eye_shape: EYE_SHAPE_PLACEHOLDER,
        lip_shape: LIP_SHAPE_PLACEHOLDER,
        face_shape: faceShape.value,
        // 피부 세부 지표는 통합 경로에 측정값이 없다 → null(미측정). 상수(70/50)를 넣으면
        // 결과 페이지가 "수분감 70점" 같은 없는 진단을 만들어낸다.
        skin_texture: null,
        skin_tone_uniformity: null,
        hydration: null,
        pore_visibility: null,
        oil_balance: null,
        // 실측값: S축 종합 점수(vitalityScore)
        overall_score: skinResult.data.overallScore ?? null,
        concerns: [],
        recommendations: {
          ...composed,
          source: 'integrated',
          /** 신규 정본. true는 확인된 Mock에만 쓰고 unknown은 별도 상태로 보존한다. */
          usedFallback,
          /** 단독 결과 화면의 레거시 reader가 남아 있어 제거 전까지 호환 미러를 유지한다. */
          usedMock: usedFallback,
          fallbackState,
          /** 무엇이 실측인지 (미표기 = 단독 M-1 경로 → 전부 실측으로 간주, 하위호환) */
          measured: {
            faceShape: faceShape.measured,
            eyeShape: false,
            lipShape: false,
          },
        },
        // 폴백 승계 시 신뢰도도 낮춰 표기 (ADR-007 "낮은 신뢰도 + 정직한 노출")
        analysis_reliability: fallbackState === 'not_used' ? 'medium' : 'low',
      })
      .select('id')
      .single();
    const { data, error } = deadline
      ? await withDeadline(savePromise, deadline, '[Integrated makeup] save timeout')
      : await savePromise;

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
      // 조합 레이어 — 입력(PC·S)이 폴백이면 결과도 폴백이다 (세션 used_fallback 집계에 반영)
      usedFallback,
      fallbackState,
      data: {
        id: data?.id as string | undefined,
        ...composed,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error instanceof DeadlineExceededError ? 'AI_TIMEOUT' : 'UNKNOWN',
        message: error instanceof Error ? error.message : String(error),
        userMessage: '메이크업 추천 생성 중 오류가 발생했어요.',
        retryable: true,
      },
    };
  }
}
