/**
 * 영양소 시너지/길항 매트릭스
 *
 * P2 원칙: docs/principles/nutrition-science.md 섹션 2.2 기반
 *
 * 시너지/길항 계수:
 * - > 1.0: 시너지 (흡수 증가)
 * - = 1.0: 독립 (영향 없음)
 * - < 1.0: 길항 (흡수 감소)
 *
 * 출처: 학술 논문 (각 계수에 참고문헌 주석)
 */

// ============================================
// 타입 정의
// ============================================

/** 시너지/길항 계수 타입 */
export type InteractionFactor = number;

/** 상호작용 타입 */
export type InteractionType = 'synergy' | 'independent' | 'antagonist';

/** 상호작용 정보 */
export interface NutrientInteraction {
  factor: InteractionFactor;
  type: InteractionType;
  reference?: string;
  description?: string;
}

// ============================================
// 영양소 시너지/길항 매트릭스
// ============================================

/**
 * 영양소 상호작용 매트릭스
 *
 * 사용법: NUTRIENT_INTERACTION_MATRIX[nutrient1][nutrient2]
 * 결과: nutrient1이 nutrient2와 함께 섭취될 때의 흡수율 변화 계수
 *
 * 참고: nutrition-science.md 섹션 2.2
 */
export const NUTRIENT_INTERACTION_MATRIX: Record<string, Record<string, InteractionFactor>> = {
  // 비타민 A 상호작용
  vitaminA: {
    vitaminC: 1.0, // 독립
    vitaminE: 1.15, // 지용성 비타민 시너지
    zinc: 1.2, // 비타민 A 수송 단백질 합성 촉진
    iron: 0.9, // 경미한 경쟁
  },

  // 비타민 C 상호작용
  vitaminC: {
    vitaminE: 1.3, // 비타민 E 재생 (Packer et al., 1979)
    iron: 1.5, // 비헴철 흡수 2-3배 증가 (Hallberg et al., 1989)
    calcium: 0.95, // 경미한 경쟁
    collagen: 1.4, // 콜라겐 합성 필수 (Peterkofsky, 1991)
  },

  // 비타민 D 상호작용
  vitaminD: {
    calcium: 1.5, // 칼슘 흡수 30-40% 증가 (Heaney et al., 2003)
    magnesium: 1.2, // 마그네슘 활성화 필요
    vitaminK: 1.3, // 칼슘 대사 시너지
  },

  // 비타민 E 상호작용
  vitaminE: {
    vitaminC: 1.3, // 항산화 재활용
    selenium: 1.25, // 글루타치온 퍼옥시다제 시너지
    omega3: 1.2, // 지질 과산화 방지
  },

  // 칼슘 상호작용
  calcium: {
    vitaminD: 1.5, // 흡수 증가
    iron: 0.6, // 강한 경쟁 (Hallberg et al., 1991)
    zinc: 0.7, // 경쟁적 억제
    magnesium: 0.85, // 고용량 시 경쟁
  },

  // 아연 상호작용
  zinc: {
    vitaminA: 1.2, // 수송 단백질 시너지
    iron: 0.6, // 강한 경쟁 (Sandstrom, 1997)
    copper: 0.5, // 구리 흡수 억제
    calcium: 0.7, // 경쟁
  },

  // 철분 상호작용
  iron: {
    vitaminC: 1.5, // 흡수 증가
    calcium: 0.6, // 경쟁
    zinc: 0.6, // 경쟁
    tea: 0.4, // 탄닌 억제 (Disler et al., 1975)
  },

  // 오메가-3 상호작용
  omega3: {
    vitaminE: 1.2, // 산화 방지
    vitaminD: 1.1, // 지용성 흡수
  },

  // 콜라겐 상호작용 (보충제용)
  collagen: {
    vitaminC: 1.4, // 히드록시화 필수
    hyaluronicAcid: 1.2, // 피부 수분 시너지
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 두 영양소 간의 상호작용 계수 조회
 *
 * @param nutrient1 - 첫 번째 영양소
 * @param nutrient2 - 두 번째 영양소
 * @returns 상호작용 계수 (기본값 1.0)
 */
export function getInteractionFactor(nutrient1: string, nutrient2: string): InteractionFactor {
  return NUTRIENT_INTERACTION_MATRIX[nutrient1]?.[nutrient2] ?? 1.0;
}

/**
 * 상호작용 타입 판정
 *
 * @param factor - 상호작용 계수
 * @returns 상호작용 타입
 */
export function getInteractionType(factor: InteractionFactor): InteractionType {
  if (factor > 1.05) return 'synergy';
  if (factor < 0.95) return 'antagonist';
  return 'independent';
}

/**
 * 상호작용 계수를 적용하여 흡수율 계산
 *
 * @param nutrient1 - 주 영양소
 * @param nutrient2 - 함께 섭취하는 영양소
 * @param baseAbsorption - 기본 흡수율 (%)
 * @returns 조정된 흡수율 (%)
 */
export function applyInteractionFactor(
  nutrient1: string,
  nutrient2: string,
  baseAbsorption: number
): number {
  const factor = getInteractionFactor(nutrient1, nutrient2);
  return baseAbsorption * factor;
}

/**
 * 특정 영양소의 모든 시너지 영양소 조회
 *
 * @param nutrient - 대상 영양소
 * @returns 시너지 관계에 있는 영양소 목록
 */
export function getSynergyNutrients(nutrient: string): string[] {
  const interactions = NUTRIENT_INTERACTION_MATRIX[nutrient];
  if (!interactions) return [];

  return Object.entries(interactions)
    .filter(([, factor]) => factor !== undefined && factor > 1.05)
    .map(([name]) => name);
}

/**
 * 특정 영양소의 모든 길항 영양소 조회
 *
 * @param nutrient - 대상 영양소
 * @returns 길항 관계에 있는 영양소 목록
 */
export function getAntagonistNutrients(nutrient: string): string[] {
  const interactions = NUTRIENT_INTERACTION_MATRIX[nutrient];
  if (!interactions) return [];

  return Object.entries(interactions)
    .filter(([, factor]) => factor !== undefined && factor < 0.95)
    .map(([name]) => name);
}

/**
 * 시너지/길항 관계 상세 정보 조회
 *
 * @param nutrient1 - 첫 번째 영양소
 * @param nutrient2 - 두 번째 영양소
 * @returns 상호작용 정보
 */
export function getInteractionInfo(nutrient1: string, nutrient2: string): NutrientInteraction {
  const factor = getInteractionFactor(nutrient1, nutrient2);
  const type = getInteractionType(factor);

  // 학술적 설명 매핑
  const descriptions: Record<string, Record<string, string>> = {
    vitaminC: {
      iron: '비타민 C가 비헴철을 환원시켜 흡수율을 2-3배 증가시킵니다.',
      vitaminE: '비타민 C가 산화된 비타민 E를 재생시킵니다.',
    },
    vitaminD: {
      calcium: '비타민 D가 장에서 칼슘 흡수를 30-40% 증가시킵니다.',
    },
    calcium: {
      iron: '칼슘이 철분과 경쟁하여 흡수를 억제합니다. 따로 섭취하세요.',
      zinc: '고용량 칼슘이 아연 흡수를 억제합니다.',
    },
    zinc: {
      copper: '아연 과다 섭취 시 구리 결핍을 유발할 수 있습니다.',
    },
  };

  return {
    factor,
    type,
    description: descriptions[nutrient1]?.[nutrient2],
  };
}
