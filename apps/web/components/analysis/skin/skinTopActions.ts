/**
 * S-1 결과 "그래서, 이렇게 하세요" 조립 (ADR-111 표현 원칙 1: 결론 먼저)
 *
 * @description
 *   이미 존재하는 피부 분석 결과 데이터에서 규칙 기반으로 행동 1~3개를 조립한다.
 *   새 AI 호출·새 fetch 없음 (정직성 원칙). page.tsx와 테스트가 공유하는 정본 로직.
 */
import type { TopAction } from '@/components/analysis/TopActionsCard';
import { generateRoutine } from '@/lib/skincare';
import type { SkinAnalysisResult, SkinTypeId } from '@/lib/mock/skin-analysis';

const VALID_SKIN_TYPES: SkinTypeId[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

/**
 * 피부 결과에서 상단 행동 카드 데이터를 조립한다.
 *
 * @param result - 피부 분석 결과 (없으면 빈 배열)
 * @param skinType - 피부 타입 문자열 (대소문자 무관, 미지정 시 'normal')
 * @returns 최대 3개의 행동 (TopActionsCard가 3개까지만 렌더)
 */
export function buildSkinTopActions(
  result: SkinAnalysisResult | null,
  skinType: string | null
): TopAction[] {
  if (!result) return [];

  const actions: TopAction[] = [];

  // ① 오늘 루틴 첫 행동 — 정본 generateRoutine(아침)의 첫 스텝
  const normalized = (skinType?.toLowerCase() ?? '') as SkinTypeId;
  const resolvedSkinType: SkinTypeId = VALID_SKIN_TYPES.includes(normalized)
    ? normalized
    : 'normal';
  const morning = generateRoutine({
    skinType: resolvedSkinType,
    concerns: [],
    timeOfDay: 'morning',
    includeOptional: false,
  });
  const firstStep = morning.routine[0];
  if (firstStep) {
    actions.push({
      title: `아침엔 '${firstStep.name}'부터 시작하세요`,
      detail: firstStep.purpose,
      href: '/analysis/skin/routine',
      hrefLabel: '전체 루틴 보기',
    });
  }

  // ② 추천 성분 1 — recommendedIngredients[0]
  const topIngredient = result.recommendedIngredients?.[0];
  if (topIngredient) {
    actions.push({
      title: `'${topIngredient.name}' 성분이 든 제품을 골라보세요`,
      detail: topIngredient.reason,
    });
  }

  // ③ 주의 1 — 성분 경고 우선, 없으면 초보자 팁의 '피해야 할 것'
  const topWarning = result.ingredientWarnings?.[0];
  if (topWarning) {
    actions.push({
      title: `'${topWarning.ingredient}' 성분은 피하세요`,
      detail: topWarning.reason,
    });
  } else if (result.easySkinTip?.avoidTip) {
    actions.push({
      title: '이것만은 주의하세요',
      detail: result.easySkinTip.avoidTip,
    });
  }

  return actions;
}
