/**
 * 마스크팩 추천 시스템
 * @description 피부 타입/상태 기반 마스크팩 타입 및 빈도 추천
 * @version 1.0
 * @date 2026-01-11
 */

import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';

// ================================================
// 타입 정의
// ================================================

export type MaskType = 'sheet' | 'clay' | 'sleeping' | 'peel' | 'cream';

export interface MaskRecommendation {
  type: MaskType;
  name: string;
  description: string;
  frequency: string;
  timing: 'morning' | 'evening' | 'both';
  keyIngredients: string[];
  suitableFor: SkinTypeId[];
  targetConcerns: SkinConcernId[];
  usage: string;
  caution?: string;
}

export interface MaskSchedule {
  recommended: MaskRecommendation[];
  weeklyPlan: WeeklyMaskPlan;
  personalizationNote: string;
}

export interface WeeklyMaskPlan {
  monday?: MaskType;
  tuesday?: MaskType;
  wednesday?: MaskType;
  thursday?: MaskType;
  friday?: MaskType;
  saturday?: MaskType;
  sunday?: MaskType;
}

// ================================================
// 마스크 타입별 정보
// ================================================

export const MASK_TYPES: Record<MaskType, MaskRecommendation> = {
  sheet: {
    type: 'sheet',
    name: '시트 마스크',
    description: '집중 수분 공급 및 진정 효과',
    frequency: '주 2-3회',
    timing: 'evening',
    keyIngredients: ['히알루론산', '세라마이드', '알로에', '판테놀', '센텔라'],
    suitableFor: ['dry', 'normal', 'sensitive', 'combination'],
    targetConcerns: ['dehydration', 'dullness', 'sensitivity'],
    usage: '토너 후 15-20분 부착, 남은 에센스 흡수시키기',
    caution: '민감성 피부는 자극 성분 확인 필요',
  },
  clay: {
    type: 'clay',
    name: '클레이 마스크',
    description: '피지 흡착 및 모공 관리',
    frequency: '주 1-2회',
    timing: 'evening',
    keyIngredients: ['카올린', '벤토나이트', '숯', '티트리', '살리실산'],
    suitableFor: ['oily', 'combination'],
    targetConcerns: ['acne', 'pores', 'excess_oil'],
    usage: '세안 후 10-15분 도포, 완전히 마르기 전 세안',
    caution: '건성 피부는 T존만 사용 권장',
  },
  sleeping: {
    type: 'sleeping',
    name: '슬리핑 마스크',
    description: '밤새 집중 영양 및 수분 공급',
    frequency: '주 2-3회',
    timing: 'evening',
    keyIngredients: ['세라마이드', '스쿠알렌', '판테놀', '히알루론산', '프로폴리스'],
    suitableFor: ['dry', 'normal', 'sensitive'],
    targetConcerns: ['dehydration', 'dullness', 'fine_lines'],
    usage: '스킨케어 마지막 단계, 다음날 아침 세안',
  },
  peel: {
    type: 'peel',
    name: '필링 마스크',
    description: '각질 제거 및 피부결 개선',
    frequency: '주 1회',
    timing: 'evening',
    keyIngredients: ['AHA', 'BHA', '효소', '파파인'],
    suitableFor: ['oily', 'normal', 'combination'],
    targetConcerns: ['dullness', 'texture', 'pores'],
    usage: '세안 후 5-10분 도포, 부드럽게 세안',
    caution: '레티놀/산 성분 사용 중이면 피하기',
  },
  cream: {
    type: 'cream',
    name: '크림 마스크',
    description: '영양 공급 및 피부 장벽 강화',
    frequency: '주 1-2회',
    timing: 'evening',
    keyIngredients: ['시어버터', '세라마이드', '스쿠알렌', '마카다미아오일'],
    suitableFor: ['dry', 'sensitive', 'normal'],
    targetConcerns: ['dehydration', 'sensitivity', 'fine_lines'],
    usage: '두껍게 도포 후 10-15분 후 티슈오프 또는 흡수',
  },
};

// ================================================
// 피부 타입별 추천 마스크
// ================================================

const SKIN_TYPE_MASK_PRIORITY: Record<SkinTypeId, MaskType[]> = {
  dry: ['sheet', 'sleeping', 'cream'],
  oily: ['clay', 'peel', 'sheet'],
  combination: ['clay', 'sheet', 'sleeping'],
  normal: ['sheet', 'sleeping', 'peel'],
  sensitive: ['sheet', 'cream', 'sleeping'],
};

// ================================================
// 피부 고민별 추천 마스크
// ================================================

const CONCERN_MASK_PRIORITY: Record<SkinConcernId, MaskType[]> = {
  acne: ['clay', 'peel'],
  wrinkles: ['sheet', 'sleeping', 'cream'],
  pigmentation: ['sheet', 'peel'],
  pores: ['clay', 'peel'],
  dryness: ['sheet', 'sleeping', 'cream'], // 건성 피부
  redness: ['sheet', 'cream'],
  dullness: ['peel', 'sheet'],
  dehydration: ['sheet', 'sleeping', 'cream'], // 수분 부족
  sensitivity: ['sheet', 'cream'],
  fine_lines: ['sleeping', 'cream', 'sheet'],
  texture: ['peel', 'clay'],
  excess_oil: ['clay', 'peel'],
};

// ================================================
// 주간 마스크 플랜 생성
// ================================================

/**
 * 피부 타입과 고민을 기반으로 마스크팩 추천
 */
export function recommendMasks(skinType: SkinTypeId, concerns: SkinConcernId[]): MaskSchedule {
  // 1. 피부 타입 기반 우선순위 마스크
  const typePriority = SKIN_TYPE_MASK_PRIORITY[skinType] || ['sheet'];

  // 2. 고민 기반 추가 마스크
  const concernMasks = concerns.flatMap((concern) => CONCERN_MASK_PRIORITY[concern] || []);

  // 3. 중복 제거 및 우선순위 정렬
  const allMasks = [...new Set([...typePriority, ...concernMasks])];
  const recommended = allMasks.slice(0, 3).map((type) => MASK_TYPES[type]);

  // 4. 주간 플랜 생성
  const weeklyPlan = generateWeeklyPlan(skinType, allMasks);

  // 5. 개인화 노트 생성
  const personalizationNote = generateMaskNote(skinType, concerns, recommended);

  return {
    recommended,
    weeklyPlan,
    personalizationNote,
  };
}

/**
 * 주간 마스크 플랜 생성
 */
function generateWeeklyPlan(skinType: SkinTypeId, _masks: MaskType[]): WeeklyMaskPlan {
  const plan: WeeklyMaskPlan = {};

  // 지성/복합성: 클레이 2회 + 시트 1회
  if (skinType === 'oily' || skinType === 'combination') {
    plan.tuesday = 'clay';
    plan.friday = 'clay';
    plan.sunday = 'sheet';
  }
  // 건성/민감성: 시트 2회 + 슬리핑 1회
  else if (skinType === 'dry' || skinType === 'sensitive') {
    plan.tuesday = 'sheet';
    plan.thursday = 'sleeping';
    plan.saturday = 'sheet';
  }
  // 중성: 시트 2회 + 필링 1회
  else {
    plan.wednesday = 'sheet';
    plan.friday = 'peel';
    plan.sunday = 'sheet';
  }

  return plan;
}

/**
 * 마스크 추천 노트 생성
 */
function generateMaskNote(
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  recommended: MaskRecommendation[]
): string {
  const skinTypeLabels: Record<SkinTypeId, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };

  let note = `${skinTypeLabels[skinType]} 피부에는 `;

  if (recommended.length > 0) {
    const names = recommended.map((m) => m.name).join(', ');
    note += `${names}을 추천해요. `;
  }

  // 특별 주의사항
  if (skinType === 'sensitive') {
    note += '민감한 피부는 새 제품 사용 전 패치 테스트를 권장해요.';
  } else if (skinType === 'oily' && concerns.includes('acne')) {
    note += '여드름 피부는 클레이 마스크 후 충분히 보습해주세요.';
  } else if (skinType === 'dry') {
    note += '건조한 피부는 시트 마스크 후 크림으로 수분을 잠가주세요.';
  }

  return note;
}

/**
 * 오늘 피부 상태에 맞는 마스크 추천
 */
export function recommendMaskForToday(
  skinType: SkinTypeId,
  todayCondition: {
    hydration: 'dry' | 'normal' | 'oily';
    concerns: ('acne' | 'redness' | 'dullness')[];
  }
): MaskRecommendation | null {
  // 오늘 피부 상태 기반 추천
  if (todayCondition.hydration === 'dry') {
    return MASK_TYPES.sheet;
  }

  if (todayCondition.concerns.includes('acne')) {
    return skinType === 'sensitive' ? MASK_TYPES.sheet : MASK_TYPES.clay;
  }

  if (todayCondition.concerns.includes('dullness')) {
    return skinType === 'sensitive' ? MASK_TYPES.sheet : MASK_TYPES.peel;
  }

  if (todayCondition.concerns.includes('redness')) {
    return MASK_TYPES.sheet;
  }

  if (todayCondition.hydration === 'oily') {
    return MASK_TYPES.clay;
  }

  // 기본: 시트 마스크
  return MASK_TYPES.sheet;
}

/**
 * 복합성 피부용 멀티 마스킹 추천
 */
export function recommendMultiMasking(): {
  tZone: MaskRecommendation;
  uZone: MaskRecommendation;
  usage: string;
} {
  return {
    tZone: MASK_TYPES.clay,
    uZone: MASK_TYPES.sheet,
    usage: 'T존(이마, 코)에 클레이 마스크, 볼과 턱에 시트 마스크를 동시에 사용하세요.',
  };
}
