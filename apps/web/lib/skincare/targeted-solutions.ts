/**
 * 맞춤 솔루션 시스템
 * @description 피부 고민별 타겟 솔루션 (여드름 패치, 스팟 트리트먼트 등)
 * @version 1.0
 * @date 2026-01-11
 */

import type { SkinConcernId } from '@/lib/mock/skin-analysis';

// ================================================
// 타입 정의
// ================================================

export type SolutionType =
  | 'acne_patch'
  | 'spot_treatment'
  | 'soothing_gel'
  | 'intensive_serum'
  | 'eye_patch'
  | 'lip_treatment'
  | 'calming_mist';

export interface TargetedSolution {
  type: SolutionType;
  name: string;
  description: string;
  targetConcerns: SkinConcernId[];
  keyIngredients: string[];
  usage: string;
  frequency: string;
  effectiveness: string;
  limitations: string[];
  timing: 'anytime' | 'morning' | 'evening' | 'overnight';
}

export interface SolutionRecommendation {
  solutions: TargetedSolution[];
  prioritySolution: TargetedSolution | null;
  personalizationNote: string;
}

// ================================================
// 솔루션 데이터베이스
// ================================================

export const TARGETED_SOLUTIONS: Record<SolutionType, TargetedSolution> = {
  acne_patch: {
    type: 'acne_patch',
    name: '여드름 패치',
    description: '하이드로콜로이드 패치로 여드름 흡수 및 보호',
    targetConcerns: ['acne'],
    keyIngredients: ['하이드로콜로이드', '살리실산', '티트리'],
    usage: '깨끗한 피부에 부착, 6-8시간 유지 후 교체',
    frequency: '필요시 (하루 1-2회 교체)',
    effectiveness: '14일 내 크기, 붉음, 질감 유의미한 개선 (임상시험 결과)',
    limitations: [
      '낭포성(깊은) 여드름에는 효과 제한적',
      '블랙헤드, 화이트헤드에는 효과 없음',
      '접착제 알레르기 주의',
    ],
    timing: 'overnight',
  },
  spot_treatment: {
    type: 'spot_treatment',
    name: '스팟 트리트먼트',
    description: '여드름 부위에 직접 도포하는 집중 케어',
    targetConcerns: ['acne'],
    keyIngredients: ['벤조일퍼옥사이드', '살리실산', '황', '티트리오일'],
    usage: '여드름 부위에만 소량 도포',
    frequency: '하루 1-2회',
    effectiveness: '초기 여드름 진정 및 빠른 회복 도움',
    limitations: ['피부 건조 유발 가능', '넓은 부위 사용 금지', '레티놀과 동시 사용 주의'],
    timing: 'evening',
  },
  soothing_gel: {
    type: 'soothing_gel',
    name: '진정 젤',
    description: '홍조, 자극 피부 즉각 진정',
    targetConcerns: ['redness', 'sensitivity'],
    keyIngredients: ['알로에', '센텔라', '판테놀', '아줄렌', '마데카소사이드'],
    usage: '자극 부위에 충분히 도포',
    frequency: '필요시 수시로',
    effectiveness: '즉각적인 쿨링 및 진정 효과',
    limitations: ['근본적인 홍조 치료는 아님'],
    timing: 'anytime',
  },
  intensive_serum: {
    type: 'intensive_serum',
    name: '집중 세럼',
    description: '고농축 활성 성분으로 특정 고민 집중 케어',
    targetConcerns: ['wrinkles', 'pigmentation', 'fine_lines'],
    keyIngredients: ['레티놀', '비타민C', '나이아신아마이드', '펩타이드', '아르부틴'],
    usage: '세안 후 토너 다음, 소량씩 흡수',
    frequency: '하루 1-2회 (레티놀은 저녁만)',
    effectiveness: '4-8주 꾸준한 사용 시 효과 체감',
    limitations: ['레티놀: 초반 자극 가능, 자외선 민감', '비타민C: 산화 주의, 서늘한 곳 보관'],
    timing: 'evening',
  },
  eye_patch: {
    type: 'eye_patch',
    name: '아이 패치',
    description: '눈가 집중 케어 (붓기, 다크서클, 주름)',
    targetConcerns: ['fine_lines', 'dehydration'],
    keyIngredients: ['카페인', '펩타이드', '히알루론산', '레티놀', '비타민K'],
    usage: '눈 아래 부착 15-20분',
    frequency: '주 2-3회 또는 필요시',
    effectiveness: '일시적 붓기 완화, 수분 공급',
    limitations: ['영구적 다크서클 해결은 어려움'],
    timing: 'morning',
  },
  lip_treatment: {
    type: 'lip_treatment',
    name: '립 트리트먼트',
    description: '건조하고 갈라진 입술 집중 케어',
    targetConcerns: ['dehydration'],
    keyIngredients: ['라놀린', '시어버터', '비타민E', '세라마이드', '꿀'],
    usage: '입술에 두껍게 도포',
    frequency: '수시로, 특히 취침 전',
    effectiveness: '즉각적 보습 및 장벽 보호',
    limitations: [],
    timing: 'anytime',
  },
  calming_mist: {
    type: 'calming_mist',
    name: '진정 미스트',
    description: '수시로 사용하는 진정 수분 미스트',
    targetConcerns: ['redness', 'sensitivity', 'dehydration'],
    keyIngredients: ['센텔라', '녹차', '알로에', '히알루론산', '카모마일'],
    usage: '얼굴에서 20cm 떨어져 분사',
    frequency: '수시로 (메이크업 위에도 가능)',
    effectiveness: '즉각적 수분 공급 및 진정',
    limitations: ['지속력 짧음, 자주 사용 필요'],
    timing: 'anytime',
  },
};

// ================================================
// 피부 고민별 솔루션 매핑
// ================================================

const CONCERN_SOLUTIONS: Record<SkinConcernId, SolutionType[]> = {
  acne: ['acne_patch', 'spot_treatment'],
  wrinkles: ['intensive_serum', 'eye_patch'],
  pigmentation: ['intensive_serum'],
  pores: ['spot_treatment'],
  dryness: ['calming_mist', 'lip_treatment'], // 건성 피부
  redness: ['soothing_gel', 'calming_mist'],
  dullness: ['intensive_serum'],
  dehydration: ['calming_mist', 'lip_treatment', 'eye_patch'], // 수분 부족
  sensitivity: ['soothing_gel', 'calming_mist'],
  fine_lines: ['intensive_serum', 'eye_patch'],
  texture: ['spot_treatment'],
  excess_oil: [],
};

// ================================================
// 솔루션 추천 함수
// ================================================

/**
 * 피부 고민에 맞는 솔루션 추천
 */
export function recommendSolutions(concerns: SkinConcernId[]): SolutionRecommendation {
  // 1. 모든 관련 솔루션 수집
  const solutionTypes = new Set<SolutionType>();
  concerns.forEach((concern) => {
    const solutions = CONCERN_SOLUTIONS[concern] || [];
    solutions.forEach((s) => solutionTypes.add(s));
  });

  // 2. 솔루션 객체로 변환
  const solutions = Array.from(solutionTypes).map((type) => TARGETED_SOLUTIONS[type]);

  // 3. 우선순위 솔루션 결정 (첫 번째 고민 기반)
  let prioritySolution: TargetedSolution | null = null;
  if (concerns.length > 0) {
    const primaryConcern = concerns[0];
    const primarySolutions = CONCERN_SOLUTIONS[primaryConcern];
    if (primarySolutions && primarySolutions.length > 0) {
      prioritySolution = TARGETED_SOLUTIONS[primarySolutions[0]];
    }
  }

  // 4. 개인화 노트 생성
  const personalizationNote = generateSolutionNote(concerns, prioritySolution);

  return {
    solutions,
    prioritySolution,
    personalizationNote,
  };
}

/**
 * 솔루션 추천 노트 생성
 */
function generateSolutionNote(
  concerns: SkinConcernId[],
  prioritySolution: TargetedSolution | null
): string {
  if (!prioritySolution) {
    return '현재 특별한 맞춤 솔루션이 필요하지 않아요. 기본 루틴을 꾸준히 유지하세요.';
  }

  const concernLabels: Record<SkinConcernId, string> = {
    acne: '여드름',
    wrinkles: '주름',
    pigmentation: '색소침착',
    pores: '모공',
    dryness: '건조함', // 건성 피부 타입
    redness: '홍조',
    dullness: '칙칙함',
    dehydration: '수분 부족', // 일시적 수분 부족
    sensitivity: '민감함',
    fine_lines: '잔주름',
    texture: '피부결',
    excess_oil: '과잉 피지',
  };

  const mainConcern = concerns[0] ? concernLabels[concerns[0]] : '';
  let note = `${mainConcern} 고민에는 ${prioritySolution.name}을 추천해요. `;
  note += prioritySolution.usage;

  return note;
}

/**
 * 여드름 상태에 따른 패치 타입 추천
 */
export function recommendAcnePatchType(acneState: {
  isOpen: boolean;
  hasHead: boolean;
  isDeep: boolean;
}): {
  recommended: boolean;
  reason: string;
  alternative?: string;
} {
  // 열린 여드름 + 농이 있음: 하이드로콜로이드 패치 추천
  if (acneState.isOpen && acneState.hasHead) {
    return {
      recommended: true,
      reason: '하이드로콜로이드 패치가 농을 흡수하고 회복을 도와줄 거예요.',
    };
  }

  // 깊은 낭포성 여드름: 패치 효과 제한
  if (acneState.isDeep) {
    return {
      recommended: false,
      reason: '깊은 낭포성 여드름에는 패치 효과가 제한적이에요.',
      alternative: '피부과 상담을 권장해요. 스팟 트리트먼트로 진정 효과는 얻을 수 있어요.',
    };
  }

  // 닫힌 여드름: 마이크로니들 패치 권장
  if (!acneState.isOpen) {
    return {
      recommended: true,
      reason: '마이크로니들 패치가 닫힌 여드름에 성분을 전달해줄 거예요.',
    };
  }

  return {
    recommended: true,
    reason: '여드름 패치로 보호하면서 회복을 도울 수 있어요.',
  };
}

/**
 * 솔루션 사용 시 주의사항 체크
 */
export function checkSolutionCompatibility(
  solutions: SolutionType[],
  currentRoutine: { hasRetinol: boolean; hasAcid: boolean }
): {
  compatible: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 레티놀 사용 중일 때
  if (currentRoutine.hasRetinol) {
    if (solutions.includes('spot_treatment')) {
      warnings.push('레티놀 사용 중에는 벤조일퍼옥사이드 스팟 트리트먼트를 피하세요.');
    }
  }

  // 산 성분 사용 중일 때
  if (currentRoutine.hasAcid) {
    if (solutions.includes('intensive_serum')) {
      warnings.push('산 성분과 레티놀 세럼은 다른 날 번갈아 사용하세요.');
    }
  }

  return {
    compatible: warnings.length === 0,
    warnings,
  };
}
