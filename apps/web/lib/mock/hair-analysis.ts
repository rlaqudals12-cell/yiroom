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

  const hairTypeLabels: Record<HairTypeId, string> = {
    straight: '직모',
    wavy: '웨이브',
    curly: '곱슬',
    coily: '강한 곱슬',
  };

  const thicknessLabels: Record<HairThicknessId, string> = {
    fine: '가는 모발',
    medium: '보통',
    thick: '굵은 모발',
  };

  const scalpTypeLabels: Record<ScalpTypeId, string> = {
    dry: '건성 두피',
    normal: '중성 두피',
    oily: '지성 두피',
    sensitive: '민감성 두피',
  };

  const generateScore = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const getStatus = (value: number): 'good' | 'normal' | 'warning' => {
    if (value >= 70) return 'good';
    if (value >= 40) return 'normal';
    return 'warning';
  };

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

  // 두피 타입별 추천 성분
  const ingredientsByScalp: Record<ScalpTypeId, string[]> = {
    dry: ['히알루론산', '아르간 오일', '시어버터', '판테놀'],
    normal: ['케라틴', '실크 아미노산', '비오틴', '프로비타민 B5'],
    oily: ['티트리 오일', '살리실산', '녹차 추출물', '멘톨'],
    sensitive: ['알로에베라', '카모마일', '센텔라', '병풀 추출물'],
  };

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
    recommendedIngredients: ingredientsByScalp[randomScalpType],
    recommendedProducts: [
      {
        category: '샴푸',
        name: `${scalpTypeLabels[randomScalpType]}용 샴푸`,
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
    ],
    careTips: [
      '미지근한 물로 샴푸하세요',
      '드라이기는 20cm 이상 거리에서 사용하세요',
      '자외선 노출 시 모발 보호 제품을 사용하세요',
      '일주일에 1-2회 헤어 마스크를 사용하세요',
    ],
    analyzedAt: new Date(),
    analysisReliability: 'medium',
  };
}
