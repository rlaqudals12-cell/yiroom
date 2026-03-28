/**
 * 조건부 루틴 시스템
 * @description 오늘 피부 상태에 따라 루틴을 동적으로 조정
 * @version 1.0
 * @date 2026-01-11
 */

import type { RoutineStep, ProductCategory } from '@/types/skincare-routine';
import type { SkinTypeId } from '@/lib/mock/skin-analysis';

// ================================================
// 타입 정의
// ================================================

export type HydrationLevel = 'very_dry' | 'dry' | 'normal' | 'oily' | 'very_oily';
export type TodayConcern = 'acne' | 'redness' | 'dullness' | 'tightness' | 'oiliness';

export interface TodaySkinCondition {
  hydration: HydrationLevel;
  concerns: TodayConcern[];
  // 선택적 세부 정보
  sensitivityLevel?: 'none' | 'mild' | 'moderate' | 'severe';
  sleepQuality?: 'good' | 'average' | 'poor';
}

export interface ConditionalModification {
  stepCategory: ProductCategory;
  condition: string;
  modification: {
    repeatCount?: number; // 토너 2회
    skipStep?: boolean; // 건너뛰기
    extendDuration?: string; // 시간 연장
    addTip?: string; // 추가 팁
    substituteWith?: ProductCategory; // 대체 제품
  };
}

export interface ConditionalRoutineResult {
  adjustedRoutine: RoutineStep[];
  modifications: ConditionalModification[];
  hygienePrepSteps: HygieneStep[];
  additionalTips: string[];
}

export interface HygieneStep {
  order: number;
  name: string;
  description: string;
  duration: string;
  isRequired: boolean;
}

// ================================================
// 기초 위생 단계
// ================================================

export const HYGIENE_PREP_STEPS: HygieneStep[] = [
  {
    order: 1,
    name: '손 씻기',
    description: '비누로 20초 이상 깨끗이 손을 씻어주세요',
    duration: '30초',
    isRequired: true,
  },
  {
    order: 2,
    name: '머리카락 정리',
    description: '헤어밴드로 이마와 얼굴 주변 머리카락을 정리해주세요',
    duration: '10초',
    isRequired: false,
  },
];

// ================================================
// 조건부 수정 규칙
// ================================================

const HYDRATION_RULES: Record<HydrationLevel, ConditionalModification[]> = {
  very_dry: [
    {
      stepCategory: 'toner',
      condition: '피부가 매우 건조할 때',
      modification: {
        repeatCount: 2,
        addTip: '토너를 2회 덧발라 수분을 충분히 공급해주세요',
      },
    },
    {
      stepCategory: 'cream',
      condition: '피부가 매우 건조할 때',
      modification: {
        extendDuration: '1분',
        addTip: '크림을 조금 더 두껍게 발라 수분 증발을 막아주세요',
      },
    },
  ],
  dry: [
    {
      stepCategory: 'toner',
      condition: '피부가 건조할 때',
      modification: {
        repeatCount: 2,
        addTip: '토너를 가볍게 2회 덧발라주세요',
      },
    },
  ],
  normal: [],
  oily: [
    {
      stepCategory: 'toner',
      condition: '피부가 유분기가 많을 때',
      modification: {
        addTip: '수분 토너 위주로 가볍게 사용해주세요',
      },
    },
    {
      stepCategory: 'cream',
      condition: '피부가 유분기가 많을 때',
      modification: {
        addTip: '가벼운 젤 타입 보습제를 얇게 발라주세요',
        substituteWith: 'serum',
      },
    },
  ],
  very_oily: [
    {
      stepCategory: 'cream',
      condition: '피부 유분이 매우 많을 때',
      modification: {
        skipStep: true,
        addTip: '크림 대신 가벼운 수분 세럼만 사용해도 괜찮아요',
        substituteWith: 'serum',
      },
    },
  ],
};

const CONCERN_RULES: Record<TodayConcern, ConditionalModification[]> = {
  acne: [
    {
      stepCategory: 'spot_treatment',
      condition: '여드름이 있을 때',
      modification: {
        addTip: '여드름 부위에 스팟 트리트먼트를 점 도포해주세요',
      },
    },
  ],
  redness: [
    {
      stepCategory: 'serum',
      condition: '홍조가 있을 때',
      modification: {
        addTip: '진정 세럼(센텔라, 알로에)을 우선 사용해주세요',
      },
    },
  ],
  dullness: [
    {
      stepCategory: 'essence',
      condition: '피부가 칙칙할 때',
      modification: {
        addTip: '비타민C 에센스로 활력을 더해주세요',
      },
    },
  ],
  tightness: [
    {
      stepCategory: 'toner',
      condition: '피부가 당길 때',
      modification: {
        repeatCount: 2,
        addTip: '히알루론산 토너를 충분히 발라주세요',
      },
    },
  ],
  oiliness: [
    {
      stepCategory: 'cleanser',
      condition: '유분이 많을 때',
      modification: {
        addTip: '폼 클렌저로 T존을 꼼꼼히 세안해주세요',
      },
    },
  ],
};

// ================================================
// 조건부 루틴 생성 함수
// ================================================

/**
 * 오늘 피부 상태에 맞게 루틴 조정
 */
export function applyConditionalModifications(
  baseRoutine: RoutineStep[],
  condition: TodaySkinCondition,
  skinType: SkinTypeId
): ConditionalRoutineResult {
  const adjustedRoutine = [...baseRoutine];
  const modifications: ConditionalModification[] = [];
  const additionalTips: string[] = [];

  // 1. 수분 레벨 기반 수정
  const hydrationMods = HYDRATION_RULES[condition.hydration] || [];
  hydrationMods.forEach((mod) => {
    const applied = applyModification(adjustedRoutine, mod);
    if (applied) {
      modifications.push(mod);
      if (mod.modification.addTip) {
        additionalTips.push(mod.modification.addTip);
      }
    }
  });

  // 2. 오늘 고민 기반 수정
  condition.concerns.forEach((concern) => {
    const concernMods = CONCERN_RULES[concern] || [];
    concernMods.forEach((mod) => {
      const applied = applyModification(adjustedRoutine, mod);
      if (applied) {
        modifications.push(mod);
        if (mod.modification.addTip) {
          additionalTips.push(mod.modification.addTip);
        }
      }
    });
  });

  // 3. 민감도 기반 추가 팁
  if (condition.sensitivityLevel === 'severe') {
    additionalTips.push('오늘은 순한 제품만 사용하고, 새로운 제품은 피해주세요.');
  } else if (condition.sensitivityLevel === 'moderate') {
    additionalTips.push('자극적인 성분(레티놀, 산)은 오늘 쉬어가는 것을 권장해요.');
  }

  // 4. 수면 품질 기반 추가 팁
  if (condition.sleepQuality === 'poor') {
    additionalTips.push('수면 부족 시 아이크림을 더 신경 써주세요.');
  }

  // 5. 기초 위생 단계 추가
  const hygienePrepSteps = getHygieneSteps(skinType);

  return {
    adjustedRoutine,
    modifications,
    hygienePrepSteps,
    additionalTips,
  };
}

/**
 * 단일 수정 적용
 */
function applyModification(routine: RoutineStep[], mod: ConditionalModification): boolean {
  const stepIndex = routine.findIndex((step) => step.category === mod.stepCategory);

  if (stepIndex === -1) {
    // 해당 카테고리가 없으면 건너뛰기
    return false;
  }

  const step = routine[stepIndex];

  // 건너뛰기
  if (mod.modification.skipStep) {
    routine.splice(stepIndex, 1);
    return true;
  }

  // 반복 횟수 추가
  if (mod.modification.repeatCount && mod.modification.repeatCount > 1) {
    routine[stepIndex] = {
      ...step,
      name: `${step.name} (${mod.modification.repeatCount}회)`,
      tips: [...step.tips, mod.modification.addTip || ''].filter(Boolean),
      conditionalBadge: `${mod.condition} ${mod.modification.repeatCount}회`,
    };
    return true;
  }

  // 시간 연장
  if (mod.modification.extendDuration) {
    routine[stepIndex] = {
      ...step,
      duration: mod.modification.extendDuration,
      tips: [...step.tips, mod.modification.addTip || ''].filter(Boolean),
    };
    return true;
  }

  // 팁만 추가
  if (mod.modification.addTip) {
    routine[stepIndex] = {
      ...step,
      tips: [mod.modification.addTip, ...step.tips],
    };
    return true;
  }

  return false;
}

/**
 * 피부 타입별 위생 단계 가져오기
 */
function getHygieneSteps(skinType: SkinTypeId): HygieneStep[] {
  const steps = [...HYGIENE_PREP_STEPS];

  // 민감성 피부: 미온수 사용 추가
  if (skinType === 'sensitive') {
    steps.push({
      order: 3,
      name: '미온수 준비',
      description: '차갑거나 뜨거운 물 대신 미온수로 세안하세요',
      duration: '10초',
      isRequired: false,
    });
  }

  return steps;
}

/**
 * 수분 레벨 라벨 변환
 */
export function getHydrationLabel(level: HydrationLevel): string {
  const labels: Record<HydrationLevel, string> = {
    very_dry: '매우 건조',
    dry: '건조',
    normal: '보통',
    oily: '유분기 있음',
    very_oily: '매우 유분기 많음',
  };
  return labels[level];
}

/**
 * 오늘 고민 라벨 변환
 */
export function getTodayConcernLabel(concern: TodayConcern): string {
  const labels: Record<TodayConcern, string> = {
    acne: '여드름',
    redness: '홍조',
    dullness: '칙칙함',
    tightness: '당김',
    oiliness: '유분',
  };
  return labels[concern];
}

/**
 * 간단 피부 상태 체크 (UI용)
 */
export function createQuickConditionCheck(): {
  hydrationOptions: { value: HydrationLevel; label: string; emoji: string }[];
  concernOptions: { value: TodayConcern; label: string; emoji: string }[];
} {
  return {
    hydrationOptions: [
      { value: 'very_dry', label: '매우 건조해요', emoji: '' },
      { value: 'dry', label: '좀 건조해요', emoji: '' },
      { value: 'normal', label: '적당해요', emoji: '' },
      { value: 'oily', label: '유분기 있어요', emoji: '' },
      { value: 'very_oily', label: '많이 번들거려요', emoji: '' },
    ],
    concernOptions: [
      { value: 'acne', label: '여드름', emoji: '' },
      { value: 'redness', label: '홍조', emoji: '' },
      { value: 'dullness', label: '칙칙함', emoji: '' },
      { value: 'tightness', label: '당김', emoji: '' },
      { value: 'oiliness', label: '유분', emoji: '' },
    ],
  };
}
