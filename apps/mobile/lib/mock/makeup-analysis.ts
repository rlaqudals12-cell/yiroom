/**
 * M-1 메이크업 분석 Mock 데이터
 * AI 분석 실패 시 Fallback으로 사용
 */

import { selectByKey } from '@/lib/utils/conditional-helpers';

export type UndertoneId = 'warm' | 'cool' | 'neutral';
export type EyeShapeId = 'monolid' | 'double' | 'hooded' | 'round' | 'almond' | 'downturned';
export type LipShapeId = 'full' | 'thin' | 'wide' | 'small' | 'heart' | 'asymmetric';
export type FaceShapeId = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
export type MakeupStyleId = 'natural' | 'glam' | 'cute' | 'chic' | 'vintage' | 'edgy';
export type MakeupConcernId =
  | 'dark-circles'
  | 'redness'
  | 'uneven-tone'
  | 'large-pores'
  | 'oily-tzone'
  | 'dry-patches'
  | 'acne-scars'
  | 'fine-lines';

export const UNDERTONES = [
  { id: 'warm' as const, label: '웜톤', emoji: '🌅', description: '노란빛, 골드가 어울림' },
  { id: 'cool' as const, label: '쿨톤', emoji: '❄️', description: '핑크빛, 실버가 어울림' },
  { id: 'neutral' as const, label: '뉴트럴', emoji: '⚖️', description: '다양한 색상이 어울림' },
] as const;

export const EYE_SHAPES = [
  { id: 'monolid' as const, label: '무쌍', emoji: '👁️', description: '쌍꺼풀 없는 눈' },
  { id: 'double' as const, label: '유쌍', emoji: '✨', description: '쌍꺼풀 있는 눈' },
  { id: 'hooded' as const, label: '속쌍', emoji: '🌙', description: '쌍꺼풀이 안으로 접힘' },
  { id: 'round' as const, label: '둥근 눈', emoji: '🔵', description: '동그란 형태의 눈' },
  { id: 'almond' as const, label: '아몬드형', emoji: '🥜', description: '아몬드 모양의 눈' },
  { id: 'downturned' as const, label: '처진 눈', emoji: '🍃', description: '눈꼬리가 내려간 눈' },
] as const;

export const LIP_SHAPES = [
  { id: 'full' as const, label: '도톰한 입술', emoji: '💋', description: '볼륨감 있는 입술' },
  { id: 'thin' as const, label: '얇은 입술', emoji: '➖', description: '가늘고 섬세한 입술' },
  { id: 'wide' as const, label: '넓은 입술', emoji: '↔️', description: '가로로 긴 입술' },
  { id: 'small' as const, label: '작은 입술', emoji: '🔸', description: '소형의 입술' },
  { id: 'heart' as const, label: '하트형', emoji: '💕', description: '윗입술이 도톰한 형태' },
  { id: 'asymmetric' as const, label: '비대칭', emoji: '🔀', description: '좌우 비대칭 입술' },
] as const;

export const FACE_SHAPES = [
  { id: 'oval' as const, label: '계란형', emoji: '🥚', description: '이상적인 얼굴 비율' },
  { id: 'round' as const, label: '둥근형', emoji: '🌕', description: '볼이 도톰한 얼굴' },
  { id: 'square' as const, label: '각진형', emoji: '⬜', description: '턱선이 각진 얼굴' },
  { id: 'heart' as const, label: '하트형', emoji: '💜', description: '이마가 넓고 턱이 좁음' },
  { id: 'oblong' as const, label: '긴 얼굴', emoji: '📏', description: '세로로 긴 얼굴' },
  { id: 'diamond' as const, label: '다이아몬드', emoji: '💎', description: '광대가 넓은 얼굴' },
] as const;

export const MAKEUP_STYLES = [
  { id: 'natural' as const, label: '내추럴', emoji: '🌿', description: '자연스러운 생얼 메이크업' },
  { id: 'glam' as const, label: '글램', emoji: '✨', description: '화려하고 세련된 메이크업' },
  { id: 'cute' as const, label: '큐트', emoji: '🎀', description: '사랑스럽고 귀여운 메이크업' },
  { id: 'chic' as const, label: '시크', emoji: '🖤', description: '도시적이고 세련된 메이크업' },
  { id: 'vintage' as const, label: '빈티지', emoji: '🌹', description: '복고풍 클래식 메이크업' },
  { id: 'edgy' as const, label: '엣지', emoji: '⚡', description: '개성 있고 강렬한 메이크업' },
] as const;

export const MAKEUP_CONCERNS = [
  {
    id: 'dark-circles' as const,
    label: '다크서클',
    emoji: '🌑',
    description: '눈 밑 어두운 그림자',
  },
  { id: 'redness' as const, label: '홍조', emoji: '🔴', description: '볼/코 주변 붉은 기' },
  {
    id: 'uneven-tone' as const,
    label: '피부톤 불균일',
    emoji: '🎨',
    description: '얼굴 부위별 톤 차이',
  },
  { id: 'large-pores' as const, label: '넓은 모공', emoji: '⭕', description: '눈에 띄는 모공' },
  { id: 'oily-tzone' as const, label: 'T존 번들거림', emoji: '💧', description: '이마/코 유분' },
  { id: 'dry-patches' as const, label: '건조 부위', emoji: '🏜️', description: '부분적 건조함' },
  { id: 'acne-scars' as const, label: '트러블 흔적', emoji: '🔘', description: '여드름 자국' },
  { id: 'fine-lines' as const, label: '잔주름', emoji: '〰️', description: '눈가/입가 주름' },
] as const;

export interface MakeupAnalysisMetric {
  id: string;
  label: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

export interface ColorRecommendation {
  category: 'foundation' | 'lip' | 'eyeshadow' | 'blush' | 'contour';
  categoryLabel: string;
  colors: {
    name: string;
    hex: string;
    description: string;
  }[];
}

export interface MakeupAnalysisResult {
  // 기본 정보
  undertone: UndertoneId;
  undertoneLabel: string;
  eyeShape: EyeShapeId;
  eyeShapeLabel: string;
  lipShape: LipShapeId;
  lipShapeLabel: string;
  faceShape: FaceShapeId;
  faceShapeLabel: string;

  // 점수
  overallScore: number;
  metrics: MakeupAnalysisMetric[];

  // 분석 결과
  concerns: MakeupConcernId[];
  insight: string;

  // 추천 스타일
  recommendedStyles: MakeupStyleId[];

  // 색상 추천
  colorRecommendations: ColorRecommendation[];

  // 메이크업 팁
  makeupTips: {
    category: string;
    tips: string[];
  }[];

  // 퍼스널 컬러 연동
  personalColorConnection?: {
    season: string;
    compatibility: 'high' | 'medium' | 'low';
    note: string;
  };

  // 메타데이터
  analyzedAt: Date;
  analysisReliability: 'high' | 'medium' | 'low';
}

/**
 * Mock 분석 결과 생성
 */
export function generateMockMakeupAnalysisResult(): MakeupAnalysisResult {
  const undertones = ['warm', 'cool', 'neutral'] as const;
  const eyeShapes = ['monolid', 'double', 'hooded', 'round', 'almond', 'downturned'] as const;
  const lipShapes = ['full', 'thin', 'wide', 'small', 'heart', 'asymmetric'] as const;
  const faceShapes = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'] as const;

  const randomUndertone = undertones[Math.floor(Math.random() * undertones.length)];
  const randomEyeShape = eyeShapes[Math.floor(Math.random() * eyeShapes.length)];
  const randomLipShape = lipShapes[Math.floor(Math.random() * lipShapes.length)];
  const randomFaceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];

  const undertoneLabels: Record<UndertoneId, string> = {
    warm: '웜톤',
    cool: '쿨톤',
    neutral: '뉴트럴',
  };

  const eyeShapeLabels: Record<EyeShapeId, string> = {
    monolid: '무쌍',
    double: '유쌍',
    hooded: '속쌍',
    round: '둥근 눈',
    almond: '아몬드형',
    downturned: '처진 눈',
  };

  const lipShapeLabels: Record<LipShapeId, string> = {
    full: '도톰한 입술',
    thin: '얇은 입술',
    wide: '넓은 입술',
    small: '작은 입술',
    heart: '하트형',
    asymmetric: '비대칭',
  };

  const faceShapeLabels: Record<FaceShapeId, string> = {
    oval: '계란형',
    round: '둥근형',
    square: '각진형',
    heart: '하트형',
    oblong: '긴 얼굴',
    diamond: '다이아몬드',
  };

  const generateScore = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const getStatus = (value: number): 'good' | 'normal' | 'warning' => {
    if (value >= 70) return 'good';
    if (value >= 40) return 'normal';
    return 'warning';
  };

  const skinTexture = generateScore(40, 90);
  const skinTone = generateScore(45, 85);
  const hydration = generateScore(35, 88);
  const poreVisibility = generateScore(30, 80);
  const oilBalance = generateScore(40, 85);

  const metrics: MakeupAnalysisMetric[] = [
    {
      id: 'skinTexture',
      label: '피부 결',
      value: skinTexture,
      status: getStatus(skinTexture),
      description: '피부 표면의 매끄러움',
    },
    {
      id: 'skinTone',
      label: '피부톤 균일도',
      value: skinTone,
      status: getStatus(skinTone),
      description: '전체적인 피부톤 일관성',
    },
    {
      id: 'hydration',
      label: '수분감',
      value: hydration,
      status: getStatus(hydration),
      description: '피부의 촉촉함',
    },
    {
      id: 'poreVisibility',
      label: '모공 상태',
      value: poreVisibility,
      status: getStatus(poreVisibility),
      description: '모공의 눈에 띄는 정도 (높을수록 덜 보임)',
    },
    {
      id: 'oilBalance',
      label: '유수분 밸런스',
      value: oilBalance,
      status: getStatus(oilBalance),
      description: '피부의 유분/수분 균형',
    },
  ];

  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

  // 점수 기반 고민 추정
  const concerns: MakeupConcernId[] = [];
  if (skinTone < 55) concerns.push('uneven-tone');
  if (hydration < 50) concerns.push('dry-patches');
  if (poreVisibility < 50) concerns.push('large-pores');
  if (oilBalance < 50) concerns.push('oily-tzone');
  if (Math.random() > 0.5) concerns.push('dark-circles');
  if (concerns.length === 0) concerns.push('redness');

  // 언더톤별 색상 추천
  const colorsByUndertone: Record<UndertoneId, ColorRecommendation[]> = {
    warm: [
      {
        category: 'foundation',
        categoryLabel: '파운데이션',
        colors: [
          { name: '골든 베이지', hex: '#E8C39E', description: '웜톤에 어울리는 황금빛 베이지' },
          { name: '피치 베이지', hex: '#EFCEB1', description: '복숭아빛이 도는 베이지' },
        ],
      },
      {
        category: 'lip',
        categoryLabel: '립',
        colors: [
          { name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' },
          { name: '브릭 레드', hex: '#B84A3A', description: '따뜻한 브릭 레드' },
          { name: '누드 피치', hex: '#E8A490', description: '자연스러운 누드' },
        ],
      },
      {
        category: 'eyeshadow',
        categoryLabel: '아이섀도',
        colors: [
          { name: '골드 브론즈', hex: '#C9A86A', description: '화려한 골드' },
          { name: '테라코타', hex: '#A66858', description: '따뜻한 브라운' },
          { name: '오렌지 브라운', hex: '#B87333', description: '오렌지빛 브라운' },
        ],
      },
      {
        category: 'blush',
        categoryLabel: '블러셔',
        colors: [
          { name: '피치 핑크', hex: '#FFAB91', description: '복숭아빛 핑크' },
          { name: '아프리코트', hex: '#FFCC80', description: '살구빛 블러셔' },
        ],
      },
      {
        category: 'contour',
        categoryLabel: '컨투어',
        colors: [{ name: '웜 브라운', hex: '#8B6914', description: '따뜻한 브라운 쉐딩' }],
      },
    ],
    cool: [
      {
        category: 'foundation',
        categoryLabel: '파운데이션',
        colors: [
          { name: '핑크 베이지', hex: '#E8D0C4', description: '핑크빛이 도는 베이지' },
          { name: '포슬린', hex: '#F5E6E0', description: '밝은 쿨톤 베이지' },
        ],
      },
      {
        category: 'lip',
        categoryLabel: '립',
        colors: [
          { name: '로즈 핑크', hex: '#E8818C', description: '사랑스러운 로즈' },
          { name: '버건디', hex: '#8E2043', description: '깊이있는 버건디' },
          { name: 'MLBB 핑크', hex: '#C48B9F', description: '내 입술 같은 핑크' },
        ],
      },
      {
        category: 'eyeshadow',
        categoryLabel: '아이섀도',
        colors: [
          { name: '로즈 골드', hex: '#B76E79', description: '핑크빛 골드' },
          { name: '그레이 브라운', hex: '#8B8589', description: '차가운 브라운' },
          { name: '플럼', hex: '#8E4585', description: '보랏빛 플럼' },
        ],
      },
      {
        category: 'blush',
        categoryLabel: '블러셔',
        colors: [
          { name: '로즈 핑크', hex: '#F7CAC9', description: '로즈빛 핑크' },
          { name: '라벤더 핑크', hex: '#E6A8D7', description: '라벤더빛 블러셔' },
        ],
      },
      {
        category: 'contour',
        categoryLabel: '컨투어',
        colors: [{ name: '쿨 그레이', hex: '#6B5E5E', description: '차가운 그레이 쉐딩' }],
      },
    ],
    neutral: [
      {
        category: 'foundation',
        categoryLabel: '파운데이션',
        colors: [
          { name: '내추럴 베이지', hex: '#E0C8A8', description: '중간 톤의 베이지' },
          { name: '샌드', hex: '#D2B48C', description: '자연스러운 샌드 톤' },
        ],
      },
      {
        category: 'lip',
        categoryLabel: '립',
        colors: [
          { name: '모브 핑크', hex: '#C4A4A4', description: '세련된 모브 핑크' },
          { name: '로지 브라운', hex: '#A67B5B', description: '로즈빛 브라운' },
          { name: '베리 레드', hex: '#B03060', description: '밸런스 잡힌 베리' },
        ],
      },
      {
        category: 'eyeshadow',
        categoryLabel: '아이섀도',
        colors: [
          { name: '토프', hex: '#8B7355', description: '뉴트럴 브라운' },
          { name: '모브', hex: '#8B668B', description: '모브 퍼플' },
          { name: '샴페인', hex: '#F7E7CE', description: '샴페인 골드' },
        ],
      },
      {
        category: 'blush',
        categoryLabel: '블러셔',
        colors: [
          { name: '더스티 로즈', hex: '#C9A0A0', description: '먼지빛 로즈' },
          { name: '소프트 코랄', hex: '#F08080', description: '부드러운 코랄' },
        ],
      },
      {
        category: 'contour',
        categoryLabel: '컨투어',
        colors: [{ name: '토프 브라운', hex: '#7A6A5F', description: '뉴트럴 브라운 쉐딩' }],
      },
    ],
  };

  // 추천 스타일 (언더톤 + 얼굴형 기반)
  const stylesByType: Record<FaceShapeId, MakeupStyleId[]> = {
    oval: ['natural', 'glam', 'chic'],
    round: ['chic', 'glam', 'edgy'],
    square: ['natural', 'glam', 'vintage'],
    heart: ['cute', 'natural', 'vintage'],
    oblong: ['natural', 'cute', 'glam'],
    diamond: ['chic', 'edgy', 'glam'],
  };

  const colorSuggestion = selectByKey(randomUndertone, { warm: '따뜻한 코랄, 브라운 계열', cool: '로즈, 핑크 계열' }, '다양한 컬러')!;
  const insight = `${undertoneLabels[randomUndertone]}에 ${faceShapeLabels[randomFaceShape]} 얼굴형이시네요. ${eyeShapeLabels[randomEyeShape]}과 ${lipShapeLabels[randomLipShape]}의 특성을 살려 ${colorSuggestion}의 메이크업을 추천드려요.`;

  // 메이크업 팁
  const makeupTips = [
    {
      category: '베이스',
      tips: [
        concerns.includes('large-pores')
          ? '프라이머로 모공을 먼저 메워주세요'
          : '피부결에 맞게 파운데이션을 발라주세요',
        concerns.includes('oily-tzone')
          ? 'T존은 파우더로 유분기를 잡아주세요'
          : '전체적으로 촉촉하게 마무리하세요',
        concerns.includes('dark-circles')
          ? '컨실러를 삼각형으로 발라 다크서클을 커버하세요'
          : '얇게 베이스를 발라 피부결을 살리세요',
      ],
    },
    {
      category: '아이 메이크업',
      tips: selectByKey(randomEyeShape, {
        monolid: ['눈 앞머리에서 눈꼬리 방향으로 그라데이션하세요', '펄 섀도로 중앙을 포인트 주세요'],
        hooded: ['눈을 떴을 때 보이는 부분까지 섀도를 발라주세요', '아이라인은 눈꼬리를 살짝 올려서 그리세요'],
      }, ['눈의 자연스러운 곡선을 따라 그리세요', '눈꼬리 쪽에 음영을 넣어 깊이감을 주세요'])!,
    },
    {
      category: '립 메이크업',
      tips: selectByKey(randomLipShape, {
        thin: ['립 라인 바깥으로 살짝 오버립을 해주세요', '글로시한 텍스처로 볼륨감을 더해주세요'],
        full: ['매트 텍스처로 깔끔하게 발라주세요', '입술 라인을 정교하게 그려주세요'],
      }, ['입술 중앙에 밝은 컬러로 하이라이트 효과를 주세요', '자연스러운 그라데이션 립을 추천해요'])!,
    },
    {
      category: '컨투어링',
      tips: selectByKey(randomFaceShape, {
        round: ['광대 아래와 턱 라인에 쉐딩을 넣어주세요', '코 옆라인도 슬림하게 음영을 넣어주세요'],
        square: ['턱 양 옆에 부드럽게 쉐딩하세요', '이마 양 끝도 살짝 음영을 넣어주세요'],
      }, ['T존과 광대 위에 하이라이트를 주세요', '자연스럽게 음영을 넣어 입체감을 살리세요'])!,
    },
  ];

  // 퍼스널 컬러 연동 (기본값)
  const seasonByUndertone: Record<UndertoneId, string> = {
    warm: '봄 웜 또는 가을 웜',
    cool: '여름 쿨 또는 겨울 쿨',
    neutral: '뉴트럴 (봄/가을 웜 or 여름/겨울 쿨)',
  };

  return {
    undertone: randomUndertone,
    undertoneLabel: undertoneLabels[randomUndertone],
    eyeShape: randomEyeShape,
    eyeShapeLabel: eyeShapeLabels[randomEyeShape],
    lipShape: randomLipShape,
    lipShapeLabel: lipShapeLabels[randomLipShape],
    faceShape: randomFaceShape,
    faceShapeLabel: faceShapeLabels[randomFaceShape],
    overallScore,
    metrics,
    concerns,
    insight,
    recommendedStyles: stylesByType[randomFaceShape],
    colorRecommendations: colorsByUndertone[randomUndertone],
    makeupTips,
    personalColorConnection: {
      season: seasonByUndertone[randomUndertone],
      compatibility: randomUndertone === 'neutral' ? 'high' : 'medium',
      note: `퍼스널 컬러 진단 결과와 함께 보시면 더 정확한 컬러 추천을 받으실 수 있어요.`,
    },
    analyzedAt: new Date(),
    analysisReliability: 'medium',
  };
}
