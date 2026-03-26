/**
 * 피부 시술 추천 프레임워크
 *
 * S-1 분석 결과에서 "일상 관리로 개선 어려운 고민"을 식별하고
 * 적합한 피부과 시술 옵션을 참고 정보로 제공
 *
 * @module lib/skincare/treatment-recommender
 * @see docs/adr/ADR-045-skin-procedure-recommendation.md
 *
 * ⚠️ 면책: 이 모듈의 모든 출력은 AI가 생성한 참고 정보이며,
 * 의학적 진단이나 처방을 대체하지 않습니다.
 * 실제 시술은 반드시 피부과 전문의와 상담 후 결정해야 합니다.
 */

// ============================================
// 면책 고지 (ADR-024, AI기본법)
// ============================================

/** 시술 추천 시 반드시 표시할 면책 고지 */
export const TREATMENT_DISCLAIMER = {
  ko: '이 정보는 AI가 생성한 참고용이며, 의학적 진단을 대체하지 않습니다. 실제 시술은 반드시 피부과 전문의와 상담 후 결정하세요.',
  en: 'This is AI-generated reference information and does not replace medical diagnosis. Always consult a dermatologist before any procedure.',
} as const;

/** 의료 행위 영구 제외 목록 (ADR-046) */
export const EXCLUDED_MEDICAL_ACTS = [
  '진단 (diagnosis)',
  '처방 (prescription)',
  '치료 계획 수립 (treatment planning)',
] as const;

// ============================================
// 시술 데이터베이스
// ============================================

export interface TreatmentOption {
  id: string;
  name: string;
  nameEn: string;
  /** 시술 카테고리 */
  category: 'laser' | 'injection' | 'peeling' | 'device' | 'other';
  /** 대상 피부 고민 */
  targetConcerns: string[];
  /** 적합한 Fitzpatrick 타입 (한국인 대부분 III-IV) */
  suitableFitzpatrick: number[];
  /** 시술 설명 */
  description: string;
  /** 예상 비용 범위 (만원) */
  costRange: { min: number; max: number };
  /** 다운타임 (일) */
  downtimeDays: { min: number; max: number };
  /** 권장 횟수 */
  recommendedSessions: string;
  /** 주의사항 */
  cautions: string[];
  /** 비추천 조건 */
  contraindications: string[];
}

/** 시술 옵션 데이터베이스 */
const TREATMENT_DATABASE: TreatmentOption[] = [
  {
    id: 'ipl',
    name: 'IPL (광선치료)',
    nameEn: 'IPL (Intense Pulsed Light)',
    category: 'laser',
    targetConcerns: ['pigmentation', 'redness', 'uneven_tone'],
    suitableFitzpatrick: [2, 3, 4],
    description: '다양한 파장의 빛으로 색소침착과 홍조를 개선하는 시술',
    costRange: { min: 10, max: 30 },
    downtimeDays: { min: 0, max: 3 },
    recommendedSessions: '3-5회 (2-4주 간격)',
    cautions: ['시술 후 2주간 자외선 차단 필수', '일시적 홍조 가능'],
    contraindications: ['임신', '활성 염증성 여드름', 'Fitzpatrick V-VI'],
  },
  {
    id: 'fractional-laser',
    name: '프락셔널 레이저',
    nameEn: 'Fractional Laser',
    category: 'laser',
    targetConcerns: ['wrinkles', 'scars', 'pores', 'elasticity'],
    suitableFitzpatrick: [2, 3, 4],
    description: '미세한 레이저 빔으로 피부 재생을 촉진하여 주름/흉터 개선',
    costRange: { min: 15, max: 50 },
    downtimeDays: { min: 3, max: 7 },
    recommendedSessions: '3-5회 (4-6주 간격)',
    cautions: ['시술 후 일주일 보습 집중', '각질 자연 탈락 기다리기'],
    contraindications: ['켈로이드 체질', '활성 피부 감염', '레티놀 사용 중 (2주 전 중단)'],
  },
  {
    id: 'chemical-peel',
    name: '케미컬 필링',
    nameEn: 'Chemical Peel',
    category: 'peeling',
    targetConcerns: ['pigmentation', 'acne', 'uneven_tone', 'texture'],
    suitableFitzpatrick: [1, 2, 3, 4],
    description: '산성 용액으로 표피를 박리하여 색소침착과 여드름 개선',
    costRange: { min: 5, max: 15 },
    downtimeDays: { min: 1, max: 5 },
    recommendedSessions: '4-6회 (2-3주 간격)',
    cautions: ['시술 후 보습+자외선 차단 필수', '초기 각질 증가 정상'],
    contraindications: ['민감 피부 (중증)', '활성 헤르페스', '최근 레이저 시술'],
  },
  {
    id: 'botox',
    name: '보톡스',
    nameEn: 'Botulinum Toxin',
    category: 'injection',
    targetConcerns: ['wrinkles', 'fine_lines'],
    suitableFitzpatrick: [1, 2, 3, 4, 5, 6],
    description: '근육 이완으로 표정 주름(이마, 미간, 눈가)을 개선',
    costRange: { min: 5, max: 20 },
    downtimeDays: { min: 0, max: 1 },
    recommendedSessions: '3-6개월마다 유지',
    cautions: ['시술 후 4시간 눕지 않기', '시술 부위 마사지 금지'],
    contraindications: ['임신/수유', '신경근 질환', '보톡스 알레르기'],
  },
  {
    id: 'skin-booster',
    name: '스킨부스터 (물광 주사)',
    nameEn: 'Skin Booster',
    category: 'injection',
    targetConcerns: ['dryness', 'elasticity', 'fine_lines'],
    suitableFitzpatrick: [1, 2, 3, 4, 5, 6],
    description: '히알루론산을 직접 주입하여 수분/탄력 개선',
    costRange: { min: 15, max: 40 },
    downtimeDays: { min: 1, max: 3 },
    recommendedSessions: '3회 (2-4주 간격) + 유지',
    cautions: ['시술 후 24시간 메이크업 피하기', '일시적 붓기 정상'],
    contraindications: ['켈로이드 체질', '히알루론산 알레르기', '임신'],
  },
  {
    id: 'led-therapy',
    name: 'LED 테라피',
    nameEn: 'LED Light Therapy',
    category: 'device',
    targetConcerns: ['acne', 'redness', 'elasticity', 'pigmentation'],
    suitableFitzpatrick: [1, 2, 3, 4, 5, 6],
    description: '특정 파장의 LED 빛으로 피부 재생/진정 촉진 (비침습)',
    costRange: { min: 3, max: 10 },
    downtimeDays: { min: 0, max: 0 },
    recommendedSessions: '주 2-3회, 8-12주',
    cautions: ['광민감성 약물 복용 시 주의', '눈 보호 필수'],
    contraindications: ['광과민증', '간질'],
  },
];

// ============================================
// 추천 로직
// ============================================

/** 피부 고민을 시술 타겟으로 매핑 */
const CONCERN_TO_TARGET: Record<string, string[]> = {
  // S-1 analysisEvidence 값 → 시술 targetConcerns
  pigmentation: ['pigmentation', 'uneven_tone'],
  wrinkles: ['wrinkles', 'fine_lines'],
  pores: ['pores', 'texture'],
  acne: ['acne'],
  redness: ['redness'],
  dryness: ['dryness'],
  elasticity: ['elasticity'],
};

export interface TreatmentRecommendation {
  treatment: TreatmentOption;
  /** 매칭 점수 (0-100) */
  matchScore: number;
  /** 이 시술을 추천하는 이유 */
  reason: string;
  /** 면책 고지 */
  disclaimer: string;
}

/**
 * 피부 분석 결과 기반 시술 추천
 *
 * @param concerns - S-1에서 식별된 피부 고민 (점수 40 이하인 지표)
 * @param skinType - 피부 타입
 * @param sensitivity - 민감도 (high이면 비침습 우선)
 * @returns 추천 시술 목록 (매칭 점수 순)
 */
export function recommendTreatments(
  concerns: string[],
  skinType?: string,
  sensitivity?: string
): TreatmentRecommendation[] {
  if (concerns.length === 0) return [];

  // 고민을 시술 타겟으로 변환
  const targets = concerns.flatMap((c) => CONCERN_TO_TARGET[c] ?? []);
  const uniqueTargets = [...new Set(targets)];

  const recommendations: TreatmentRecommendation[] = [];

  for (const treatment of TREATMENT_DATABASE) {
    // 타겟 매칭
    const matchedTargets = treatment.targetConcerns.filter((t) => uniqueTargets.includes(t));
    if (matchedTargets.length === 0) continue;

    // 민감성 높으면 침습적 시술 페널티
    let matchScore = (matchedTargets.length / uniqueTargets.length) * 100;
    if (sensitivity === 'high') {
      if (treatment.category === 'injection') matchScore *= 0.6;
      if (treatment.category === 'peeling') matchScore *= 0.7;
      if (treatment.category === 'device') matchScore *= 1.1; // LED 등 비침습 보너스
    }

    // 건성 피부면 필링 페널티
    if (skinType === 'dry' && treatment.category === 'peeling') {
      matchScore *= 0.7;
    }

    const reason = `${matchedTargets.join(', ')} 고민에 효과적 (${treatment.recommendedSessions})`;

    recommendations.push({
      treatment,
      matchScore: Math.round(matchScore),
      reason,
      disclaimer: TREATMENT_DISCLAIMER.ko,
    });
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * S-1 분석 지표에서 시술이 필요한 고민 추출
 *
 * 점수 40 이하(warning 수준)인 지표를 시술 대상 고민으로 변환
 *
 * @param metrics - S-1 분석 지표 배열
 * @returns 시술 대상 고민 ID 배열
 */
export function extractTreatmentConcerns(metrics: { id: string; value: number }[]): string[] {
  return metrics.filter((m) => m.value <= 40).map((m) => m.id);
}
