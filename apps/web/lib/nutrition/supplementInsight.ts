/**
 * N-1 영양제/보충제 추천 모듈
 *
 * 목표별 + 피부/체형 연동 영양제 추천
 * - 체중 감량: 식욕 조절, 대사 촉진
 * - 근육 증가: 단백질, BCAA
 * - 피부 개선: 콜라겐, 비타민C
 * - 건강 관리: 종합 비타민, 오메가3
 */

import type { NutritionGoal } from '@/types/nutrition';

// 영양제 추천 타입
export interface SupplementRecommendation {
  name: string;
  category: 'vitamin' | 'mineral' | 'protein' | 'omega' | 'probiotic' | 'herbal' | 'other';
  reason: string;
  timing: string; // 복용 시기
  priority: 'high' | 'medium' | 'low';
  caution?: string; // 주의사항
}

// 피부 고민 타입 (S-1 연동)
export type SkinConcern =
  | 'hydration' // 수분 부족
  | 'oil' // 유분 과다
  | 'wrinkles' // 주름
  | 'elasticity' // 탄력 저하
  | 'pigmentation' // 색소침착
  | 'trouble'; // 트러블

// 목표별 영양제 추천
const GOAL_SUPPLEMENTS: Record<NutritionGoal, SupplementRecommendation[]> = {
  weight_loss: [
    {
      name: '가르시니아',
      category: 'herbal',
      reason: '체중 관리 식품에 자주 쓰이는 성분',
      timing: '식전 30분',
      priority: 'medium',
      caution: '간 건강 문제가 있는 경우 주의',
    },
    {
      name: '녹차 추출물 (EGCG)',
      category: 'herbal',
      reason: '녹차에서 얻는 카테킨 성분',
      timing: '아침 식후',
      priority: 'medium',
    },
    {
      name: '식이섬유 (차전자피)',
      category: 'other',
      reason: '식사와 함께 섭취하는 식이섬유 성분',
      timing: '식전 물과 함께',
      priority: 'high',
    },
  ],
  maintain: [
    {
      name: '종합 비타민',
      category: 'vitamin',
      reason: '균형 잡힌 영양 보충',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '오메가3',
      category: 'omega',
      reason: '등푸른 생선에 풍부한 EPA·DHA 성분',
      timing: '식후',
      priority: 'medium',
    },
  ],
  muscle: [
    {
      name: '단백질 보충제 (웨이/식물성)',
      category: 'protein',
      reason: '단백질을 간편하게 보충할 수 있는 식품',
      timing: '운동 후 30분 이내',
      priority: 'high',
    },
    {
      name: 'BCAA',
      category: 'protein',
      reason: '류신·이소류신·발린으로 구성된 필수아미노산 성분',
      timing: '운동 중 또는 운동 후',
      priority: 'high',
    },
    {
      name: '크레아틴',
      category: 'other',
      reason: '운동인들이 널리 사용하는 성분',
      timing: '매일 3-5g, 시간 상관없음',
      priority: 'medium',
      caution: '충분한 수분 섭취 필요',
    },
    {
      name: '아연',
      category: 'mineral',
      reason: '체내 여러 대사에 관여하는 필수 미네랄',
      timing: '저녁 식후',
      priority: 'medium',
    },
  ],
  skin: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '뷰티 식품에 널리 쓰이는 단백질 성분',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '비타민C',
      category: 'vitamin',
      reason: '신선한 과일·채소에 풍부한 비타민',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '히알루론산',
      category: 'other',
      reason: '뷰티 식품에 자주 사용되는 성분',
      timing: '공복',
      priority: 'medium',
    },
    {
      name: '비오틴 (비타민B7)',
      category: 'vitamin',
      reason: '비타민 B군의 하나',
      timing: '아침 식후',
      priority: 'medium',
    },
  ],
  health: [
    {
      name: '종합 비타민',
      category: 'vitamin',
      reason: '기본 영양소 균형 보충',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '오메가3',
      category: 'omega',
      reason: '등푸른 생선에서 얻는 지방산 성분',
      timing: '식후',
      priority: 'high',
    },
    {
      name: '프로바이오틱스',
      category: 'probiotic',
      reason: '발효식품에 들어 있는 유익균',
      timing: '아침 공복 또는 취침 전',
      priority: 'medium',
    },
    {
      name: '비타민D',
      category: 'vitamin',
      reason: '햇빛을 통해 합성되는 비타민',
      timing: '아침 식후 (지방과 함께)',
      priority: 'medium',
      caution: '과다 복용 주의',
    },
  ],
};

// 피부 고민별 추가 영양제
const SKIN_CONCERN_SUPPLEMENTS: Record<SkinConcern, SupplementRecommendation[]> = {
  hydration: [
    {
      name: '히알루론산',
      category: 'other',
      reason: '뷰티 식품에 널리 사용되는 성분',
      timing: '공복',
      priority: 'high',
    },
    {
      name: '세라마이드',
      category: 'other',
      reason: '피부에도 존재하는 지질 성분',
      timing: '식후',
      priority: 'medium',
    },
  ],
  oil: [
    {
      name: '비타민A (레티놀)',
      category: 'vitamin',
      reason: '지용성 비타민의 하나',
      timing: '저녁 식후',
      priority: 'medium',
      caution: '임산부 복용 금지',
    },
    {
      name: '아연',
      category: 'mineral',
      reason: '식품에 널리 들어 있는 필수 미네랄',
      timing: '저녁 식후',
      priority: 'medium',
    },
  ],
  wrinkles: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '뷰티 식품에 널리 쓰이는 단백질 성분',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '코엔자임Q10',
      category: 'other',
      reason: '건강식품에 널리 사용되는 성분',
      timing: '아침 식후',
      priority: 'medium',
    },
  ],
  elasticity: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '뷰티 식품에 널리 쓰이는 단백질 성분',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '엘라스틴',
      category: 'protein',
      reason: '피부·결합조직에 존재하는 단백질 성분',
      timing: '식후',
      priority: 'medium',
    },
  ],
  pigmentation: [
    {
      name: '비타민C',
      category: 'vitamin',
      reason: '신선한 과일·채소에 풍부한 비타민',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '글루타치온',
      category: 'other',
      reason: '체내에 존재하는 성분으로 뷰티 식품에 사용',
      timing: '공복',
      priority: 'high',
    },
  ],
  trouble: [
    {
      name: '아연',
      category: 'mineral',
      reason: '식품에 널리 들어 있는 필수 미네랄',
      timing: '저녁 식후',
      priority: 'high',
    },
    {
      name: '프로바이오틱스',
      category: 'probiotic',
      reason: '발효식품에 들어 있는 유익균',
      timing: '아침 공복',
      priority: 'medium',
    },
    {
      name: '오메가3',
      category: 'omega',
      reason: '등푸른 생선에서 얻는 지방산 성분',
      timing: '식후',
      priority: 'medium',
    },
  ],
};

// 체형별 영양제 추천 (C-1 연동)
export type BodyTypeCategory =
  | 'upper_dominant' // V, Y — 상체 우세 (하체 보강 필요)
  | 'lower_dominant' // A — 하체 우세 (상체 보강 필요)
  | 'fat_dominant' // O — 체지방 높음 (대사 촉진)
  | 'lean' // I — 근육량 적음 (근육 합성)
  | 'balanced'; // X, H, 8 — 균형 (유지)

const BODY_TYPE_TO_CATEGORY: Record<string, BodyTypeCategory> = {
  V: 'upper_dominant',
  Y: 'upper_dominant',
  A: 'lower_dominant',
  O: 'fat_dominant',
  I: 'lean',
  X: 'balanced',
  H: 'balanced',
  '8': 'balanced',
};

const BODY_TYPE_SUPPLEMENTS: Record<BodyTypeCategory, SupplementRecommendation[]> = {
  upper_dominant: [
    {
      name: '단백질 보충제',
      category: 'protein',
      reason: '단백질을 간편하게 보충할 수 있는 식품 (상체 우세 체형 보완)',
      timing: '운동 후 30분 이내',
      priority: 'medium',
    },
  ],
  lower_dominant: [
    {
      name: 'BCAA',
      category: 'protein',
      reason: '필수아미노산으로 구성된 성분 (하체 우세 체형 보완)',
      timing: '운동 중 또는 운동 후',
      priority: 'medium',
    },
  ],
  fat_dominant: [
    {
      name: 'L-카르니틴',
      category: 'other',
      reason: '운동·다이어트 식품에 자주 쓰이는 성분',
      timing: '운동 30분 전',
      priority: 'medium',
    },
    {
      name: '녹차 추출물 (EGCG)',
      category: 'herbal',
      reason: '녹차에서 얻는 카테킨 성분',
      timing: '아침 식후',
      priority: 'medium',
    },
  ],
  lean: [
    {
      name: '크레아틴',
      category: 'other',
      reason: '운동인들이 널리 사용하는 성분',
      timing: '매일 3-5g',
      priority: 'medium',
      caution: '충분한 수분 섭취 필요',
    },
    {
      name: '웨이트 게이너',
      category: 'protein',
      reason: '칼로리와 단백질을 함께 보충하는 식품',
      timing: '식간 또는 운동 후',
      priority: 'low',
    },
  ],
  balanced: [],
};

// 영양제 추천 결과
export interface SupplementInsightResult {
  goalSupplements: SupplementRecommendation[];
  skinSupplements: SupplementRecommendation[];
  bodyTypeSupplements: SupplementRecommendation[];
  allSupplements: SupplementRecommendation[];
  summary: string;
}

/**
 * 목표 + 피부 상태 + 체형 기반 영양제 추천
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
export function getSupplementRecommendations(
  goal: NutritionGoal,
  skinConcerns?: SkinConcern[],
  bodyType?: string
): SupplementInsightResult {
  // 1. 목표별 영양제
  const goalSupplements = GOAL_SUPPLEMENTS[goal] || [];

  // 2. 피부 고민별 영양제
  const skinSupplements: SupplementRecommendation[] = [];
  if (skinConcerns && skinConcerns.length > 0) {
    const seen = new Set<string>();
    for (const concern of skinConcerns) {
      const supplements = SKIN_CONCERN_SUPPLEMENTS[concern] || [];
      for (const supp of supplements) {
        if (!seen.has(supp.name)) {
          seen.add(supp.name);
          skinSupplements.push(supp);
        }
      }
    }
  }

  // 3. 체형별 영양제 (C-1 연동)
  const bodyTypeSupplements: SupplementRecommendation[] = [];
  if (bodyType) {
    const category = BODY_TYPE_TO_CATEGORY[bodyType];
    if (category) {
      bodyTypeSupplements.push(...(BODY_TYPE_SUPPLEMENTS[category] || []));
    }
  }

  // 4. 통합 및 중복 제거
  const allMap = new Map<string, SupplementRecommendation>();
  for (const s of goalSupplements) {
    allMap.set(s.name, s);
  }
  for (const s of skinSupplements) {
    if (!allMap.has(s.name)) {
      allMap.set(s.name, s);
    }
  }
  for (const s of bodyTypeSupplements) {
    if (!allMap.has(s.name)) {
      allMap.set(s.name, s);
    }
  }

  const allSupplements = Array.from(allMap.values()).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 5. 요약 메시지 생성
  const goalLabels: Record<NutritionGoal, string> = {
    weight_loss: '체중 감량',
    maintain: '체중 유지',
    muscle: '근육 증가',
    skin: '피부 개선',
    health: '건강 관리',
  };

  let summary = `${goalLabels[goal]} 목표에 맞는 ${goalSupplements.length}개 영양제를 추천해요.`;
  if (skinConcerns && skinConcerns.length > 0) {
    summary += ` 피부 고민 해결을 위한 ${skinSupplements.length}개도 함께 확인해보세요.`;
  }
  if (bodyTypeSupplements.length > 0) {
    summary += ` 체형에 맞는 ${bodyTypeSupplements.length}개 영양제도 추천해요.`;
  }

  return {
    goalSupplements,
    skinSupplements,
    bodyTypeSupplements,
    allSupplements,
    summary,
  };
}

/**
 * 우선순위 높은 영양제만 추출 (상위 N개)
 */
export function getTopSupplements(
  result: SupplementInsightResult,
  limit: number = 3
): SupplementRecommendation[] {
  return result.allSupplements.slice(0, limit);
}

// 상수 내보내기 (테스트용)
export { GOAL_SUPPLEMENTS, SKIN_CONCERN_SUPPLEMENTS, BODY_TYPE_SUPPLEMENTS, BODY_TYPE_TO_CATEGORY };
