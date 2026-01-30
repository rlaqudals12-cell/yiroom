/**
 * RDA (Recommended Dietary Allowances) 데이터베이스
 *
 * P2 원칙: docs/principles/nutrition-science.md의 RDA 값 정확히 구현
 *
 * 출처:
 * - 한국인 영양소 섭취기준 (2025년 개정)
 * - 한국영양학회 권장량
 */

// ============================================
// 타입 정의
// ============================================

/** 성별 타입 */
export type RDAGender = 'male' | 'female';

/** 영양소 ID (영문 camelCase) */
export type NutrientId =
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD'
  | 'vitaminE'
  | 'vitaminK'
  | 'vitaminB1'
  | 'vitaminB2'
  | 'vitaminB3'
  | 'vitaminB6'
  | 'vitaminB12'
  | 'folate'
  | 'biotin'
  | 'calcium'
  | 'magnesium'
  | 'zinc'
  | 'selenium'
  | 'iron'
  | 'omega3';

/** 개별 영양소 RDA 정보 */
export interface NutrientRDA {
  /** 권장 섭취량 (RDA) */
  rda: number;
  /** 단위 */
  unit: string;
  /** 상한 섭취량 (UL), null이면 설정 안 됨 */
  ul: number | null;
  /** 한글 이름 */
  nameKo: string;
  /** 영문 이름 */
  nameEn: string;
}

/** 성별별 RDA 데이터 */
export type GenderRDA = Record<NutrientId, NutrientRDA>;

/** 전체 RDA 데이터베이스 */
export interface RDADatabase {
  male: GenderRDA;
  female: GenderRDA;
}

// ============================================
// RDA 데이터베이스 (한국인 영양소 섭취기준 2025)
// ============================================

/**
 * 한국인 영양소 섭취기준 (2025년 개정)
 *
 * 성인 남성: 19-64세 기준
 * 성인 여성: 19-64세 기준
 *
 * 참고: docs/principles/nutrition-science.md 섹션 1.4
 */
export const KOREAN_RDA: RDADatabase = {
  // 성인 남성 (19-64세)
  male: {
    vitaminA: { rda: 800, unit: 'μg RAE', ul: 3000, nameKo: '비타민 A', nameEn: 'Vitamin A' },
    vitaminC: { rda: 100, unit: 'mg', ul: 2000, nameKo: '비타민 C', nameEn: 'Vitamin C' },
    vitaminD: { rda: 400, unit: 'IU', ul: 4000, nameKo: '비타민 D', nameEn: 'Vitamin D' },
    vitaminE: { rda: 12, unit: 'mg α-TE', ul: 540, nameKo: '비타민 E', nameEn: 'Vitamin E' },
    vitaminK: { rda: 75, unit: 'μg', ul: null, nameKo: '비타민 K', nameEn: 'Vitamin K' },
    vitaminB1: { rda: 1.2, unit: 'mg', ul: null, nameKo: '비타민 B1', nameEn: 'Thiamin' },
    vitaminB2: { rda: 1.5, unit: 'mg', ul: null, nameKo: '비타민 B2', nameEn: 'Riboflavin' },
    vitaminB3: { rda: 16, unit: 'mg NE', ul: 35, nameKo: '비타민 B3', nameEn: 'Niacin' },
    vitaminB6: { rda: 1.5, unit: 'mg', ul: 100, nameKo: '비타민 B6', nameEn: 'Vitamin B6' },
    vitaminB12: { rda: 2.4, unit: 'μg', ul: null, nameKo: '비타민 B12', nameEn: 'Vitamin B12' },
    folate: { rda: 400, unit: 'μg DFE', ul: 1000, nameKo: '엽산', nameEn: 'Folate' },
    biotin: { rda: 30, unit: 'μg', ul: null, nameKo: '비오틴', nameEn: 'Biotin' },
    calcium: { rda: 800, unit: 'mg', ul: 2500, nameKo: '칼슘', nameEn: 'Calcium' },
    magnesium: { rda: 350, unit: 'mg', ul: 350, nameKo: '마그네슘', nameEn: 'Magnesium' },
    zinc: { rda: 10, unit: 'mg', ul: 35, nameKo: '아연', nameEn: 'Zinc' },
    selenium: { rda: 60, unit: 'μg', ul: 400, nameKo: '셀레늄', nameEn: 'Selenium' },
    iron: { rda: 10, unit: 'mg', ul: 45, nameKo: '철분', nameEn: 'Iron' },
    omega3: { rda: 500, unit: 'mg EPA+DHA', ul: 3000, nameKo: '오메가-3', nameEn: 'Omega-3' },
  },
  // 성인 여성 (19-64세)
  female: {
    vitaminA: { rda: 650, unit: 'μg RAE', ul: 3000, nameKo: '비타민 A', nameEn: 'Vitamin A' },
    vitaminC: { rda: 100, unit: 'mg', ul: 2000, nameKo: '비타민 C', nameEn: 'Vitamin C' },
    vitaminD: { rda: 400, unit: 'IU', ul: 4000, nameKo: '비타민 D', nameEn: 'Vitamin D' },
    vitaminE: { rda: 12, unit: 'mg α-TE', ul: 540, nameKo: '비타민 E', nameEn: 'Vitamin E' },
    vitaminK: { rda: 65, unit: 'μg', ul: null, nameKo: '비타민 K', nameEn: 'Vitamin K' },
    vitaminB1: { rda: 1.1, unit: 'mg', ul: null, nameKo: '비타민 B1', nameEn: 'Thiamin' },
    vitaminB2: { rda: 1.2, unit: 'mg', ul: null, nameKo: '비타민 B2', nameEn: 'Riboflavin' },
    vitaminB3: { rda: 14, unit: 'mg NE', ul: 35, nameKo: '비타민 B3', nameEn: 'Niacin' },
    vitaminB6: { rda: 1.4, unit: 'mg', ul: 100, nameKo: '비타민 B6', nameEn: 'Vitamin B6' },
    vitaminB12: { rda: 2.4, unit: 'μg', ul: null, nameKo: '비타민 B12', nameEn: 'Vitamin B12' },
    folate: { rda: 400, unit: 'μg DFE', ul: 1000, nameKo: '엽산', nameEn: 'Folate' },
    biotin: { rda: 30, unit: 'μg', ul: null, nameKo: '비오틴', nameEn: 'Biotin' },
    calcium: { rda: 800, unit: 'mg', ul: 2500, nameKo: '칼슘', nameEn: 'Calcium' },
    magnesium: { rda: 280, unit: 'mg', ul: 350, nameKo: '마그네슘', nameEn: 'Magnesium' },
    zinc: { rda: 8, unit: 'mg', ul: 35, nameKo: '아연', nameEn: 'Zinc' },
    selenium: { rda: 55, unit: 'μg', ul: 400, nameKo: '셀레늄', nameEn: 'Selenium' },
    iron: { rda: 14, unit: 'mg', ul: 45, nameKo: '철분', nameEn: 'Iron' },
    omega3: { rda: 500, unit: 'mg EPA+DHA', ul: 3000, nameKo: '오메가-3', nameEn: 'Omega-3' },
  },
} as const;

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 특정 성별의 RDA 조회
 */
export function getRDA(gender: RDAGender): GenderRDA {
  return KOREAN_RDA[gender];
}

/**
 * 특정 영양소의 RDA 조회
 */
export function getNutrientRDA(gender: RDAGender, nutrientId: NutrientId): NutrientRDA {
  return KOREAN_RDA[gender][nutrientId];
}

/**
 * 상한 섭취량 맵 추출
 */
export function getUpperLimits(gender: RDAGender): Record<NutrientId, number | null> {
  const rda = KOREAN_RDA[gender];
  const result: Partial<Record<NutrientId, number | null>> = {};

  for (const [key, value] of Object.entries(rda)) {
    result[key as NutrientId] = value.ul;
  }

  return result as Record<NutrientId, number | null>;
}

/**
 * 모든 영양소 ID 목록
 */
export function getAllNutrientIds(): NutrientId[] {
  return Object.keys(KOREAN_RDA.male) as NutrientId[];
}
