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
  timing: string;  // 복용 시기
  priority: 'high' | 'medium' | 'low';
  caution?: string; // 주의사항
}

// 피부 고민 타입 (S-1 연동)
export type SkinConcern =
  | 'hydration'     // 수분 부족
  | 'oil'           // 유분 과다
  | 'wrinkles'      // 주름
  | 'elasticity'    // 탄력 저하
  | 'pigmentation'  // 색소침착
  | 'trouble';      // 트러블

// 목표별 영양제 추천
const GOAL_SUPPLEMENTS: Record<NutritionGoal, SupplementRecommendation[]> = {
  weight_loss: [
    {
      name: '가르시니아',
      category: 'herbal',
      reason: '탄수화물 지방 전환 억제',
      timing: '식전 30분',
      priority: 'medium',
      caution: '간 건강 문제가 있는 경우 주의',
    },
    {
      name: '녹차 추출물 (EGCG)',
      category: 'herbal',
      reason: '대사 촉진 및 지방 연소 도움',
      timing: '아침 식후',
      priority: 'medium',
    },
    {
      name: '식이섬유 (차전자피)',
      category: 'other',
      reason: '포만감 증가 및 변비 예방',
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
      reason: '심혈관 건강 및 염증 감소',
      timing: '식후',
      priority: 'medium',
    },
  ],
  muscle: [
    {
      name: '단백질 보충제 (웨이/식물성)',
      category: 'protein',
      reason: '근육 합성에 필수적인 단백질 공급',
      timing: '운동 후 30분 이내',
      priority: 'high',
    },
    {
      name: 'BCAA',
      category: 'protein',
      reason: '근육 회복 촉진 및 피로 감소',
      timing: '운동 중 또는 운동 후',
      priority: 'high',
    },
    {
      name: '크레아틴',
      category: 'other',
      reason: '근력 및 운동 수행능력 향상',
      timing: '매일 3-5g, 시간 상관없음',
      priority: 'medium',
      caution: '충분한 수분 섭취 필요',
    },
    {
      name: '아연',
      category: 'mineral',
      reason: '테스토스테론 합성 및 근육 성장 지원',
      timing: '저녁 식후',
      priority: 'medium',
    },
  ],
  skin: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '피부 탄력 및 수분 유지',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '비타민C',
      category: 'vitamin',
      reason: '콜라겐 생성 촉진 및 항산화',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '히알루론산',
      category: 'other',
      reason: '피부 수분 보충',
      timing: '공복',
      priority: 'medium',
    },
    {
      name: '비오틴 (비타민B7)',
      category: 'vitamin',
      reason: '피부, 모발, 손톱 건강',
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
      reason: '심혈관 건강 및 두뇌 기능',
      timing: '식후',
      priority: 'high',
    },
    {
      name: '프로바이오틱스',
      category: 'probiotic',
      reason: '장 건강 및 면역력',
      timing: '아침 공복 또는 취침 전',
      priority: 'medium',
    },
    {
      name: '비타민D',
      category: 'vitamin',
      reason: '뼈 건강 및 면역 기능',
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
      reason: '피부 속 수분 유지',
      timing: '공복',
      priority: 'high',
    },
    {
      name: '세라마이드',
      category: 'other',
      reason: '피부 장벽 강화',
      timing: '식후',
      priority: 'medium',
    },
  ],
  oil: [
    {
      name: '비타민A (레티놀)',
      category: 'vitamin',
      reason: '피지 조절 및 피부 재생',
      timing: '저녁 식후',
      priority: 'medium',
      caution: '임산부 복용 금지',
    },
    {
      name: '아연',
      category: 'mineral',
      reason: '피지 분비 조절',
      timing: '저녁 식후',
      priority: 'medium',
    },
  ],
  wrinkles: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '주름 개선 및 피부 탄력',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '코엔자임Q10',
      category: 'other',
      reason: '항산화 및 피부 노화 방지',
      timing: '아침 식후',
      priority: 'medium',
    },
  ],
  elasticity: [
    {
      name: '콜라겐 펩타이드',
      category: 'protein',
      reason: '피부 탄력 회복',
      timing: '공복 또는 취침 전',
      priority: 'high',
    },
    {
      name: '엘라스틴',
      category: 'protein',
      reason: '피부 탄성 유지',
      timing: '식후',
      priority: 'medium',
    },
  ],
  pigmentation: [
    {
      name: '비타민C',
      category: 'vitamin',
      reason: '멜라닌 생성 억제 및 미백',
      timing: '아침 식후',
      priority: 'high',
    },
    {
      name: '글루타치온',
      category: 'other',
      reason: '항산화 및 피부 톤 개선',
      timing: '공복',
      priority: 'high',
    },
  ],
  trouble: [
    {
      name: '아연',
      category: 'mineral',
      reason: '염증 완화 및 피부 재생',
      timing: '저녁 식후',
      priority: 'high',
    },
    {
      name: '프로바이오틱스',
      category: 'probiotic',
      reason: '장-피부 연결축 개선',
      timing: '아침 공복',
      priority: 'medium',
    },
    {
      name: '오메가3',
      category: 'omega',
      reason: '염증 감소',
      timing: '식후',
      priority: 'medium',
    },
  ],
};

// 영양제 추천 결과
export interface SupplementInsightResult {
  goalSupplements: SupplementRecommendation[];
  skinSupplements: SupplementRecommendation[];
  allSupplements: SupplementRecommendation[];
  summary: string;
}

/**
 * 목표 + 피부 상태 기반 영양제 추천
 */
export function getSupplementRecommendations(
  goal: NutritionGoal,
  skinConcerns?: SkinConcern[]
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

  // 3. 통합 및 중복 제거
  const allMap = new Map<string, SupplementRecommendation>();
  for (const s of goalSupplements) {
    allMap.set(s.name, s);
  }
  for (const s of skinSupplements) {
    if (!allMap.has(s.name)) {
      allMap.set(s.name, s);
    }
  }

  const allSupplements = Array.from(allMap.values())
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // 4. 요약 메시지 생성
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

  return {
    goalSupplements,
    skinSupplements,
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
export { GOAL_SUPPLEMENTS, SKIN_CONCERN_SUPPLEMENTS };
