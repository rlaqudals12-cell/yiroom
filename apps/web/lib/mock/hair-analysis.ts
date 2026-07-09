/**
 * H-1 헤어 분석 Mock 데이터
 * AI 분석 실패 시 Fallback으로 사용
 */

export type HairTypeId = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairThicknessId = 'fine' | 'medium' | 'thick';
export type ScalpTypeId = 'dry' | 'normal' | 'oily' | 'sensitive';
export type HairConcernId =
  | 'hairloss'
  | 'dandruff'
  | 'frizz'
  | 'damage'
  | 'oily-scalp'
  | 'dry-scalp'
  | 'split-ends'
  | 'lack-volume';

export const HAIR_TYPES = [
  { id: 'straight' as const, label: '직모', emoji: '➡️', description: '곧게 뻗은 모발' },
  { id: 'wavy' as const, label: '웨이브', emoji: '〰️', description: 'S자 웨이브가 있는 모발' },
  { id: 'curly' as const, label: '곱슬', emoji: '🌀', description: '뚜렷한 곱슬 패턴' },
  { id: 'coily' as const, label: '강한 곱슬', emoji: '🔄', description: '촘촘한 곱슬 패턴' },
] as const;

export const HAIR_THICKNESS = [
  { id: 'fine' as const, label: '가는 모발', description: '섬세하고 가벼운 모발' },
  { id: 'medium' as const, label: '보통', description: '일반적인 굵기의 모발' },
  { id: 'thick' as const, label: '굵은 모발', description: '두껍고 강한 모발' },
] as const;

export const SCALP_TYPES = [
  { id: 'dry' as const, label: '건성 두피', emoji: '🏜️' },
  { id: 'normal' as const, label: '중성 두피', emoji: '✨' },
  { id: 'oily' as const, label: '지성 두피', emoji: '💧' },
  { id: 'sensitive' as const, label: '민감성 두피', emoji: '🌸' },
] as const;

export const HAIR_CONCERNS = [
  { id: 'hairloss' as const, label: '탈모', emoji: '😥', description: '모발 빠짐, 숱 감소' },
  { id: 'dandruff' as const, label: '비듬', emoji: '❄️', description: '두피 각질, 가려움' },
  { id: 'frizz' as const, label: '푸석함', emoji: '💨', description: '건조하고 푸석한 모발' },
  { id: 'damage' as const, label: '손상', emoji: '💔', description: '열/화학 손상된 모발' },
  { id: 'oily-scalp' as const, label: '지성 두피', emoji: '💦', description: '기름지는 두피' },
  {
    id: 'dry-scalp' as const,
    label: '건조 두피',
    emoji: '🌵',
    description: '건조하고 당기는 두피',
  },
  { id: 'split-ends' as const, label: '끝갈라짐', emoji: '✂️', description: '모발 끝 갈라짐' },
  {
    id: 'lack-volume' as const,
    label: '볼륨 부족',
    emoji: '📉',
    description: '힘없이 처지는 모발',
  },
] as const;

export interface HairAnalysisMetric {
  id: string;
  label: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

export interface HairAnalysisResult {
  // 기본 정보
  hairType: HairTypeId;
  hairTypeLabel: string;
  hairThickness: HairThicknessId;
  hairThicknessLabel: string;
  scalpType: ScalpTypeId;
  scalpTypeLabel: string;

  // 점수
  overallScore: number;
  metrics: HairAnalysisMetric[];

  // 분석 결과
  concerns: HairConcernId[];
  insight: string;

  // 추천
  recommendedIngredients: string[];
  recommendedProducts: {
    category: string;
    name: string;
    description: string;
  }[];

  // 케어 팁
  careTips: string[];

  // 메타데이터
  analyzedAt: Date;
  analysisReliability: 'high' | 'medium' | 'low';
}

// 라벨 맵 (Mock 생성/자가입력 프리셋 공용)
const HAIR_TYPE_LABELS: Record<HairTypeId, string> = {
  straight: '직모',
  wavy: '웨이브',
  curly: '곱슬',
  coily: '강한 곱슬',
};

const THICKNESS_LABELS: Record<HairThicknessId, string> = {
  fine: '가는 모발',
  medium: '보통',
  thick: '굵은 모발',
};

const SCALP_TYPE_LABELS: Record<ScalpTypeId, string> = {
  dry: '건성 두피',
  normal: '중성 두피',
  oily: '지성 두피',
  sensitive: '민감성 두피',
};

// 두피 타입별 추천 성분 (공용)
const INGREDIENTS_BY_SCALP: Record<ScalpTypeId, string[]> = {
  dry: ['히알루론산', '아르간 오일', '시어버터', '판테놀'],
  normal: ['케라틴', '실크 아미노산', '비오틴', '프로비타민 B5'],
  oily: ['티트리 오일', '살리실산', '녹차 추출물', '멘톨'],
  sensitive: ['알로에베라', '카모마일', '센텔라', '병풀 추출물'],
};

// 두피 타입별 주의 성분 (공용) — 추천 성분만으로는 초보자가 무엇을 피할지 모른다.
const CAUTION_INGREDIENTS_BY_SCALP: Record<ScalpTypeId, string[]> = {
  dry: ['강한 설페이트(SLS·SLES) 세정제', '고농도 변성 알코올', '과도한 멘톨'],
  normal: ['실리콘 과다(빌드업 유발)', '인공 향료 과다'],
  oily: ['무거운 오일(코코넛·시어버터 과다)', '실리콘 과다(빌드업 유발)'],
  sensitive: ['강한 설페이트(SLS)', '인공 향료·색소', '고농도 멘톨·에센셜 오일'],
};

/**
 * 두피 타입별 주의(피하면 좋은) 성분 — scalpType 미상이면 공통 주의 성분 반환.
 */
export function getCautionIngredients(scalpType?: ScalpTypeId): string[] {
  if (scalpType && CAUTION_INGREDIENTS_BY_SCALP[scalpType]) {
    return CAUTION_INGREDIENTS_BY_SCALP[scalpType];
  }
  return ['강한 설페이트(SLS·SLES) 세정제', '인공 향료 과다', '실리콘 과다(빌드업 유발)'];
}

/**
 * 두피 고민 안내 — 탈모·비듬 등 의료적 상담이 필요할 수 있는 증상이면 안내 문구 반환.
 *
 * 왜: 진단은 이룸의 역할이 아니다(경계 준수). "의심되면 전문의 상담" 형태로만 안내한다.
 */
export function getScalpConcernNotice(concerns: HairConcernId[]): string | null {
  const needsReferral = concerns.some((c) => c === 'hairloss' || c === 'dandruff');
  if (!needsReferral) return null;
  return '탈모·심한 비듬·지속되는 두피 각질은 지루성 두피염이나 탈모 질환이 의심될 수 있어요. 증상이 오래 지속되거나 심해지면 피부과 전문의 상담을 권해요. (이룸의 분석은 진단이 아니에요)';
}

// 공용 케어 팁 (결정론)
const COMMON_CARE_TIPS = [
  '미지근한 물로 샴푸하세요',
  '드라이기는 20cm 이상 거리에서 사용하세요',
  '자외선 노출 시 모발 보호 제품을 사용하세요',
  '일주일에 1-2회 헤어 마스크를 사용하세요',
];

// 점수 → 상태 (공용)
function getMetricStatus(value: number): 'good' | 'normal' | 'warning' {
  if (value >= 70) return 'good';
  if (value >= 40) return 'normal';
  return 'warning';
}

// 두피 타입 기반 추천 제품 (결정론)
function buildRecommendedProducts(scalpType: ScalpTypeId) {
  return [
    {
      category: '샴푸',
      name: `${SCALP_TYPE_LABELS[scalpType]}용 샴푸`,
      description: '두피 타입에 맞는 클렌징',
    },
    {
      category: '트리트먼트',
      name: '집중 영양 트리트먼트',
      description: '손상 모발 케어',
    },
    {
      category: '에센스',
      name: '헤어 에센스',
      description: '모발 보호 및 윤기',
    },
  ];
}

/**
 * Mock 분석 결과 생성
 */
export function generateMockHairAnalysisResult(): HairAnalysisResult {
  const hairTypes = ['straight', 'wavy', 'curly', 'coily'] as const;
  const thicknesses = ['fine', 'medium', 'thick'] as const;
  const scalpTypes = ['dry', 'normal', 'oily', 'sensitive'] as const;

  const randomHairType = hairTypes[Math.floor(Math.random() * hairTypes.length)];
  const randomThickness = thicknesses[Math.floor(Math.random() * thicknesses.length)];
  const randomScalpType = scalpTypes[Math.floor(Math.random() * scalpTypes.length)];

  const hairTypeLabels = HAIR_TYPE_LABELS;
  const thicknessLabels = THICKNESS_LABELS;
  const scalpTypeLabels = SCALP_TYPE_LABELS;

  const generateScore = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const getStatus = getMetricStatus;

  const hydration = generateScore(30, 90);
  const scalp = generateScore(40, 85);
  const damage = generateScore(20, 80);
  const density = generateScore(35, 85);
  const elasticity = generateScore(40, 90);
  const shine = generateScore(30, 85);

  const metrics: HairAnalysisMetric[] = [
    {
      id: 'hydration',
      label: '수분도',
      value: hydration,
      status: getStatus(hydration),
      description: '모발의 수분 함량',
    },
    {
      id: 'scalp',
      label: '두피 건강',
      value: scalp,
      status: getStatus(scalp),
      description: '두피 상태 점수',
    },
    {
      id: 'damage',
      label: '손상도',
      value: 100 - damage,
      status: getStatus(100 - damage),
      description: '모발 손상 정도 (높을수록 건강)',
    },
    {
      id: 'density',
      label: '모발 밀도',
      value: density,
      status: getStatus(density),
      description: '모발의 밀집도',
    },
    {
      id: 'elasticity',
      label: '탄력',
      value: elasticity,
      status: getStatus(elasticity),
      description: '모발의 탄력성',
    },
    {
      id: 'shine',
      label: '윤기',
      value: shine,
      status: getStatus(shine),
      description: '모발의 광택',
    },
  ];

  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

  // 점수 기반 고민 추정
  const concerns: HairConcernId[] = [];
  if (hydration < 50) concerns.push('frizz');
  if (scalp < 50 && randomScalpType === 'oily') concerns.push('oily-scalp');
  if (scalp < 50 && randomScalpType === 'dry') concerns.push('dry-scalp');
  if (damage < 50) concerns.push('damage');
  if (density < 50) concerns.push('hairloss', 'lack-volume');
  if (concerns.length === 0) concerns.push('split-ends');

  // 모발 상태별 케어 메시지
  let careMessage = '현재 상태를 유지하는 케어를 추천드려요.';
  if (concerns.includes('damage')) careMessage = '손상된 모발 회복에 집중해주세요.';
  else if (concerns.includes('frizz')) careMessage = '수분 공급에 신경써주세요.';

  const insight = `${hairTypeLabels[randomHairType]} 타입의 ${thicknessLabels[randomThickness]}이시네요. ${scalpTypeLabels[randomScalpType]} 특성에 맞는 케어가 필요해요. ${careMessage}`;

  return {
    hairType: randomHairType,
    hairTypeLabel: hairTypeLabels[randomHairType],
    hairThickness: randomThickness,
    hairThicknessLabel: thicknessLabels[randomThickness],
    scalpType: randomScalpType,
    scalpTypeLabel: scalpTypeLabels[randomScalpType],
    overallScore,
    metrics,
    concerns,
    insight,
    recommendedIngredients: INGREDIENTS_BY_SCALP[randomScalpType],
    recommendedProducts: buildRecommendedProducts(randomScalpType),
    careTips: COMMON_CARE_TIPS,
    analyzedAt: new Date(),
    analysisReliability: 'medium',
  };
}

/**
 * 자가입력(known-input) 결과 생성 — 결정론 (랜덤 없음)
 *
 * 왜: "타입을 이미 알아요" 경로는 사진 분석이 없으므로 랜덤 점수·두피타입을
 * 실측처럼 보여주면 안 된다. 선택한 모발 타입 + 고민에서 결정론적으로 파생하고
 * 신뢰도는 'low'로 표시, UI에서 "자가입력 기반 추정" 안내와 함께 사용한다.
 */
export function generateKnownHairTypeResult(
  hairType: HairTypeId,
  concerns: HairConcernId[]
): HairAnalysisResult {
  // 두피 타입: 선택한 고민에서 결정론적으로 파생 (파생 불가 시 중성)
  let scalpType: ScalpTypeId = 'normal';
  if (concerns.includes('oily-scalp')) scalpType = 'oily';
  else if (concerns.includes('dry-scalp') || concerns.includes('dandruff')) scalpType = 'dry';

  // 지표: 기준값 65(보통), 선택한 고민과 연결된 지표만 45(주의)로 낮춤
  const has = (...ids: HairConcernId[]) => ids.some((id) => concerns.includes(id));
  const hydration = has('frizz', 'dry-scalp') ? 45 : 65;
  const scalp = has('oily-scalp', 'dry-scalp', 'dandruff') ? 45 : 65;
  const damageHealth = has('damage', 'split-ends') ? 45 : 65; // 표시값 = 건강도
  const density = has('hairloss', 'lack-volume') ? 45 : 65;
  const elasticity = has('damage') ? 55 : 65;
  const shine = has('frizz') ? 55 : 65;

  const metricDefs: Array<[string, string, number, string]> = [
    ['hydration', '수분도', hydration, '모발의 수분 함량 (자가입력 기반 추정)'],
    ['scalp', '두피 건강', scalp, '두피 상태 점수 (자가입력 기반 추정)'],
    ['damage', '손상도', damageHealth, '모발 손상 정도 (높을수록 건강, 자가입력 기반 추정)'],
    ['density', '모발 밀도', density, '모발의 밀집도 (자가입력 기반 추정)'],
    ['elasticity', '탄력', elasticity, '모발의 탄력성 (자가입력 기반 추정)'],
    ['shine', '윤기', shine, '모발의 광택 (자가입력 기반 추정)'],
  ];

  const metrics: HairAnalysisMetric[] = metricDefs.map(([id, label, value, description]) => ({
    id,
    label,
    value,
    status: getMetricStatus(value),
    description,
  }));

  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

  let careMessage = '현재 상태를 유지하는 케어를 추천드려요.';
  if (concerns.includes('damage')) careMessage = '손상된 모발 회복에 집중해주세요.';
  else if (concerns.includes('frizz')) careMessage = '수분 공급에 신경써주세요.';

  const insight = `${HAIR_TYPE_LABELS[hairType]} 타입으로 선택해주셨어요. 사진 분석 없이 입력하신 내용을 바탕으로 한 추정 가이드예요. ${SCALP_TYPE_LABELS[scalpType]} 경향에 맞는 케어가 도움이 돼요. ${careMessage}`;

  return {
    hairType,
    hairTypeLabel: HAIR_TYPE_LABELS[hairType],
    // 굵기는 자가입력에 없음 — 형태는 기본값, 라벨은 비워 UI에서 미표시
    hairThickness: 'medium',
    hairThicknessLabel: '',
    scalpType,
    scalpTypeLabel: SCALP_TYPE_LABELS[scalpType],
    overallScore,
    metrics,
    concerns,
    insight,
    recommendedIngredients: INGREDIENTS_BY_SCALP[scalpType],
    recommendedProducts: buildRecommendedProducts(scalpType),
    careTips: COMMON_CARE_TIPS,
    analyzedAt: new Date(),
    analysisReliability: 'low',
  };
}
