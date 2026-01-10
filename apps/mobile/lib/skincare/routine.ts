/**
 * 스킨케어 루틴 생성 로직 (모바일)
 * @description 피부 타입 및 고민을 기반으로 개인화된 스킨케어 루틴 생성
 * @version 1.0
 * @date 2026-01-11
 */

import {
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  SKIN_CONCERN_TIPS,
  calculateEstimatedTime,
} from './mock';
import type {
  RoutineStep,
  RoutineGenerationInput,
  RoutineGenerationResult,
  ProductCategory,
  TimeOfDay,
  SkinTypeId,
  SkinConcernId,
} from './types';

// ================================================
// 루틴 생성 함수
// ================================================

/**
 * 피부 타입과 고민을 기반으로 개인화된 루틴 생성
 */
export function generateRoutine(
  input: RoutineGenerationInput
): RoutineGenerationResult {
  const { skinType, concerns, timeOfDay, includeOptional = true } = input;

  // 기본 템플릿 선택
  const baseSteps =
    timeOfDay === 'morning'
      ? [...MORNING_ROUTINE_STEPS]
      : [...EVENING_ROUTINE_STEPS];

  // 피부 타입별 수정자 적용
  const modifier = SKIN_TYPE_MODIFIERS[skinType];

  // 1. 필요한 카테고리 추가
  let adjustedSteps = baseSteps;

  if (modifier.addCategories.length > 0) {
    modifier.addCategories.forEach((category) => {
      // 이미 존재하지 않는 경우에만 추가
      if (!adjustedSteps.find((step) => step.category === category)) {
        const newStep = createStepForCategory(category, timeOfDay);
        if (newStep) {
          adjustedSteps.push(newStep);
        }
      }
    });
  }

  // 2. 제외할 카테고리 제거
  if (modifier.removeCategories.length > 0) {
    adjustedSteps = adjustedSteps.filter(
      (step) => !modifier.removeCategories.includes(step.category)
    );
  }

  // 3. 팁 조정
  adjustedSteps = adjustedSteps.map((step) => {
    const categoryTips = modifier.adjustTips[step.category];
    if (categoryTips && categoryTips.length > 0) {
      return {
        ...step,
        tips: [...categoryTips, ...step.tips.slice(0, 1)],
      };
    }
    return step;
  });

  // 4. 선택적 단계 필터링
  if (!includeOptional) {
    adjustedSteps = adjustedSteps.filter((step) => !step.isOptional);
  }

  // 5. 순서 재정렬
  adjustedSteps = adjustedSteps
    .sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))
    .map((step, index) => ({ ...step, order: index + 1 }));

  // 6. 소요 시간 계산
  const estimatedTime = calculateEstimatedTime(adjustedSteps);

  // 7. 개인화 노트 생성
  const personalizationNote = generatePersonalizationNote(
    skinType,
    concerns,
    modifier.warnings
  );

  return {
    routine: adjustedSteps,
    estimatedTime: Math.round(estimatedTime),
    personalizationNote,
  };
}

/**
 * 카테고리별 새 단계 생성
 */
function createStepForCategory(
  category: ProductCategory,
  timeOfDay: TimeOfDay
): RoutineStep | null {
  switch (category) {
    case 'oil':
      return {
        order: 0,
        category: 'oil',
        name: '페이스 오일',
        purpose: '수분 잠금 및 영양 공급',
        duration: '30초',
        tips: ['크림 후 마지막 단계로', '소량씩 손에 덜어 체온으로 데우기'],
        isOptional: true,
      };
    case 'mask':
      return timeOfDay === 'evening'
        ? {
            order: 0,
            category: 'mask',
            name: '마스크팩',
            purpose: '집중 영양 및 수분 공급',
            duration: '15분',
            tips: ['토너 후 사용', '주 2-3회 권장', '15-20분 후 제거'],
            isOptional: true,
          }
        : null;
    default:
      return null;
  }
}

/**
 * 카테고리 순서 정의 (스킨케어 순서대로)
 */
function getCategoryOrder(category: ProductCategory): number {
  const order: Record<ProductCategory, number> = {
    cleanser: 1,
    toner: 2,
    essence: 3,
    serum: 4,
    ampoule: 5,
    mask: 6,
    eye_cream: 7,
    cream: 8,
    oil: 9,
    sunscreen: 10,
    spot_treatment: 11,
  };
  return order[category] ?? 99;
}

/**
 * 개인화 노트 생성
 */
function generatePersonalizationNote(
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  warnings: string[]
): string {
  const skinTypeLabels: Record<SkinTypeId, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };

  let note = `${skinTypeLabels[skinType]} 피부에 맞춘 루틴이에요.`;

  // 고민별 추가 노트
  if (concerns.length > 0) {
    const concernNotes = concerns
      .map((concern) => {
        const tips = SKIN_CONCERN_TIPS[concern];
        if (tips && tips.ingredients.length > 0) {
          return `${tips.ingredients[0]} 성분`;
        }
        return null;
      })
      .filter(Boolean);

    if (concernNotes.length > 0) {
      note += ` ${concernNotes.join(', ')}이 도움이 될 거예요.`;
    }
  }

  // 주의사항 추가
  if (warnings.length > 0) {
    note += ` 주의: ${warnings[0]}`;
  }

  return note;
}

export { calculateEstimatedTime };
