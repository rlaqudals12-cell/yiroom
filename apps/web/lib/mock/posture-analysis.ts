/**
 * A-1 자세 분석 Mock 데이터
 *
 * 자세 타입:
 * - ideal: 이상적인 자세
 * - forward_head: 거북목 (Forward Head Posture)
 * - rounded_shoulders: 굽은 어깨
 * - swayback: 스웨이백
 * - flatback: 일자 허리
 * - lordosis: 과도한 요추 전만
 *
 * C-1 체형 분석 연동:
 * - 체형별 자세 상관관계 분석
 * - 체형 맞춤 스트레칭 추천
 */

// 자세 타입 정의
export type PostureType =
  | 'ideal'
  | 'forward_head'
  | 'rounded_shoulders'
  | 'swayback'
  | 'flatback'
  | 'lordosis';

// 자세 측정 상태
export type PostureStatus = 'good' | 'warning' | 'alert';

// 자세 분석 지표
export interface PostureMeasurement {
  name: string;
  value: number; // 0-100 (50이 이상적)
  status: PostureStatus;
  description: string;
}

// 스트레칭 추천
export interface StretchingRecommendation {
  name: string;
  targetArea: string;
  duration: string;
  frequency: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// 자세 분석 결과
export interface PostureAnalysisResult {
  postureType: PostureType;
  postureTypeLabel: string;
  postureTypeDescription: string;
  overallScore: number; // 0-100
  confidence: number; // 분석 신뢰도
  // 정면 분석
  frontAnalysis: {
    shoulderSymmetry: PostureMeasurement;
    pelvisSymmetry: PostureMeasurement;
    kneeAlignment: PostureMeasurement;
    footAngle: PostureMeasurement;
  };
  // 측면 분석
  sideAnalysis: {
    headForwardAngle: PostureMeasurement; // 목 전방 경사
    thoracicKyphosis: PostureMeasurement; // 등 굽음
    lumbarLordosis: PostureMeasurement; // 허리 만곡
    pelvicTilt: PostureMeasurement; // 골반 기울기
  };
  // 문제점
  concerns: string[];
  // 스트레칭 추천
  stretchingRecommendations: StretchingRecommendation[];
  // AI 인사이트
  insight: string;
  // 분석 시간
  analyzedAt: Date;
  // C-1 연동 정보
  bodyTypeCorrelation?: {
    bodyType: string;
    correlationNote: string;
    riskFactors: string[];
  };
}

// 자세 타입별 정보
export const POSTURE_TYPES: Record<
  PostureType,
  {
    label: string;
    description: string;
    emoji: string;
    characteristics: string[];
    riskFactors: string[];
    recommendations: string[];
  }
> = {
  ideal: {
    label: '이상적인 자세',
    description: '척추 정렬이 균형 잡혀 있고 근육 긴장이 적절한 상태',
    emoji: '✨',
    characteristics: [
      '귀-어깨-골반-무릎-발목이 일직선',
      '자연스러운 척추 곡선 유지',
      '어깨와 골반이 대칭',
    ],
    riskFactors: [],
    recommendations: ['현재 자세를 유지하세요', '정기적인 스트레칭으로 관리'],
  },
  forward_head: {
    label: '거북목 (전방 두부 자세)',
    description: '머리가 어깨보다 앞으로 나온 자세',
    emoji: '🐢',
    characteristics: ['목이 앞으로 기울어짐', '턱이 앞으로 돌출', '목 뒤 근육 긴장'],
    riskFactors: ['목 통증', '두통', '어깨 결림', '디스크 위험 증가'],
    recommendations: ['턱 당기기 운동', '목 스트레칭', '모니터 높이 조절'],
  },
  rounded_shoulders: {
    label: '굽은 어깨 (라운드 숄더)',
    description: '어깨가 앞으로 말린 자세',
    emoji: '🦐',
    characteristics: ['어깨가 앞으로 말림', '가슴 근육 단축', '등 상부 근육 약화'],
    riskFactors: ['어깨 통증', '호흡 제한', '자세 불균형'],
    recommendations: ['가슴 스트레칭', '로우 운동', '어깨 외회전 강화'],
  },
  swayback: {
    label: '스웨이백',
    description: '골반이 앞으로 밀리고 등 상부가 뒤로 젖혀진 자세',
    emoji: '📐',
    characteristics: ['골반이 앞으로 밀림', '등 상부가 뒤로 젖혀짐', '무릎 과신전'],
    riskFactors: ['허리 통증', '고관절 문제', '무릎 부담 증가'],
    recommendations: ['코어 강화', '고관절 굴곡근 스트레칭', '자세 인식 훈련'],
  },
  flatback: {
    label: '일자 허리 (플랫백)',
    description: '허리의 자연스러운 곡선이 줄어든 자세',
    emoji: '📏',
    characteristics: ['요추 전만 감소', '골반 후방 경사', '허리가 평평해 보임'],
    riskFactors: ['충격 흡수력 저하', '허리 통증', '디스크 압박 증가'],
    recommendations: ['요추 전만 운동', '고관절 굴곡근 강화', '브릿지 운동'],
  },
  lordosis: {
    label: '과전만 (요추 전만증)',
    description: '허리가 과도하게 앞으로 휜 자세',
    emoji: '🔄',
    characteristics: ['허리가 과도하게 휨', '복부 돌출', '골반 전방 경사'],
    riskFactors: ['허리 통증', '근육 불균형', '척추 관절 부담'],
    recommendations: ['복근 강화', '고관절 굴곡근 스트레칭', '글루트 강화'],
  },
};

// 체형별 자세 상관관계
export const BODY_TYPE_POSTURE_CORRELATION: Record<
  string,
  {
    tendencies: PostureType[];
    note: string;
    riskFactors: string[];
  }
> = {
  S: {
    tendencies: ['forward_head', 'rounded_shoulders'],
    note: '스트레이트 체형은 상체 근육이 발달하여 어깨가 앞으로 말리기 쉬워요',
    riskFactors: ['거북목', '어깨 긴장'],
  },
  W: {
    tendencies: ['lordosis', 'swayback'],
    note: '웨이브 체형은 하체에 무게 중심이 있어 골반 전방 경사 경향이 있어요',
    riskFactors: ['요추 전만', '골반 불균형'],
  },
  N: {
    tendencies: ['flatback', 'ideal'],
    note: '내추럴 체형은 골격이 큰 편이라 자세가 비교적 안정적이에요',
    riskFactors: ['일자 허리 가능성'],
  },
  // 레거시 8타입 지원
  X: { tendencies: ['ideal'], note: '균형 잡힌 체형으로 자세 유지가 용이해요', riskFactors: [] },
  A: {
    tendencies: ['lordosis'],
    note: '하체 발달로 골반 경사 주의가 필요해요',
    riskFactors: ['골반 전방 경사'],
  },
  V: {
    tendencies: ['rounded_shoulders'],
    note: '어깨 발달로 라운드 숄더 주의가 필요해요',
    riskFactors: ['어깨 긴장'],
  },
  H: {
    tendencies: ['flatback'],
    note: '직선 체형으로 요추 곡선 유지가 중요해요',
    riskFactors: ['일자 허리'],
  },
  O: {
    tendencies: ['lordosis', 'swayback'],
    note: '복부 무게로 허리 곡선 변화에 주의가 필요해요',
    riskFactors: ['요추 전만'],
  },
};

// 스트레칭 데이터베이스
export const STRETCHING_DATABASE: Record<PostureType, StretchingRecommendation[]> = {
  ideal: [
    {
      name: '전신 스트레칭',
      targetArea: '전신',
      duration: '10분',
      frequency: '매일',
      description: '현재 좋은 자세를 유지하기 위한 일반 스트레칭',
      difficulty: 'easy',
    },
  ],
  forward_head: [
    {
      name: '턱 당기기 운동 (Chin Tuck)',
      targetArea: '목 앞쪽',
      duration: '10회 x 3세트',
      frequency: '하루 3회',
      description: '턱을 목 쪽으로 당겨 목 정렬을 바로잡아요',
      difficulty: 'easy',
    },
    {
      name: '목 스트레칭',
      targetArea: '목 옆/뒤',
      duration: '각 30초',
      frequency: '하루 2-3회',
      description: '긴장된 목 근육을 이완시켜요',
      difficulty: 'easy',
    },
    {
      name: '흉추 가동성 운동',
      targetArea: '등 상부',
      duration: '10회 x 2세트',
      frequency: '매일',
      description: '굳어진 등 상부의 움직임을 개선해요',
      difficulty: 'medium',
    },
  ],
  rounded_shoulders: [
    {
      name: '도어웨이 스트레치',
      targetArea: '가슴',
      duration: '30초 x 3회',
      frequency: '하루 2-3회',
      description: '단축된 가슴 근육을 늘려줘요',
      difficulty: 'easy',
    },
    {
      name: '밴드 풀 어파트',
      targetArea: '등 상부',
      duration: '15회 x 3세트',
      frequency: '주 3-4회',
      description: '약해진 등 근육을 강화해요',
      difficulty: 'medium',
    },
    {
      name: '어깨 외회전 운동',
      targetArea: '어깨 회전근개',
      duration: '12회 x 3세트',
      frequency: '주 3회',
      description: '어깨 안정성을 높여요',
      difficulty: 'medium',
    },
  ],
  swayback: [
    {
      name: '데드버그',
      targetArea: '코어',
      duration: '10회 x 3세트',
      frequency: '주 4-5회',
      description: '코어 안정성을 강화해요',
      difficulty: 'medium',
    },
    {
      name: '힙 플렉서 스트레칭',
      targetArea: '고관절 굴곡근',
      duration: '각 60초',
      frequency: '매일',
      description: '단축된 고관절 굴곡근을 이완해요',
      difficulty: 'easy',
    },
    {
      name: '월 슬라이드',
      targetArea: '등/어깨',
      duration: '10회 x 3세트',
      frequency: '매일',
      description: '등 상부 정렬을 개선해요',
      difficulty: 'easy',
    },
  ],
  flatback: [
    {
      name: '캣카우 스트레칭',
      targetArea: '척추',
      duration: '10회 x 3세트',
      frequency: '매일',
      description: '척추 움직임과 요추 곡선을 회복해요',
      difficulty: 'easy',
    },
    {
      name: '브릿지',
      targetArea: '둔근/허리',
      duration: '12회 x 3세트',
      frequency: '주 4회',
      description: '둔근을 강화하고 요추 전만을 만들어요',
      difficulty: 'easy',
    },
    {
      name: '스핑크스 자세',
      targetArea: '요추',
      duration: '30초 x 3회',
      frequency: '하루 2회',
      description: '요추 신전을 통해 곡선을 회복해요',
      difficulty: 'easy',
    },
  ],
  lordosis: [
    {
      name: '플랭크',
      targetArea: '코어',
      duration: '30초 x 3세트',
      frequency: '주 5회',
      description: '복근을 강화하여 골반 정렬을 개선해요',
      difficulty: 'medium',
    },
    {
      name: '런지 스트레칭',
      targetArea: '고관절 굴곡근',
      duration: '각 45초',
      frequency: '매일',
      description: '단축된 장요근을 이완해요',
      difficulty: 'easy',
    },
    {
      name: '글루트 브릿지',
      targetArea: '둔근',
      duration: '15회 x 3세트',
      frequency: '주 4회',
      description: '둔근을 강화하여 골반 후방 경사를 유도해요',
      difficulty: 'easy',
    },
  ],
};

// 로딩 팁
export const POSTURE_LOADING_TIPS = [
  '자세를 분석하고 있어요',
  '어깨와 골반 대칭을 확인 중이에요',
  '척추 정렬을 분석하고 있어요',
  '맞춤 스트레칭을 준비 중이에요',
  '거의 완료되었어요!',
];

// AI 인사이트 템플릿
const INSIGHTS: Record<PostureType, string[]> = {
  ideal: [
    '자세가 전반적으로 균형 잡혀 있어요! 현재 상태를 유지하면서 정기적인 스트레칭을 추천해요.',
    '훌륭한 자세를 가지고 계시네요. 장시간 앉아있을 때만 주의하면 완벽해요!',
  ],
  forward_head: [
    '스마트폰이나 컴퓨터 사용이 많으신가요? 목이 앞으로 나온 거북목 증상이 보여요. 턱 당기기 운동을 추천해요.',
    '목이 살짝 앞으로 나와 있어요. 모니터 높이를 눈 높이로 조절하고, 자주 목 스트레칭을 해주세요.',
  ],
  rounded_shoulders: [
    '어깨가 앞으로 말려 있어요. 가슴 스트레칭과 등 운동으로 개선할 수 있어요.',
    '상체 자세에 주의가 필요해요. 어깨를 뒤로 젖히는 습관과 스트레칭을 병행해보세요.',
  ],
  swayback: [
    '골반이 앞으로 밀려 있는 스웨이백 자세가 보여요. 코어 강화와 자세 인식이 중요해요.',
    '서있을 때 골반 위치에 신경 써주세요. 코어 운동과 고관절 스트레칭을 추천해요.',
  ],
  flatback: [
    '허리의 자연스러운 곡선이 줄어든 일자 허리예요. 요추 전만을 만들어주는 운동이 필요해요.',
    '척추의 충격 흡수력이 약해질 수 있어요. 브릿지와 캣카우 운동을 꾸준히 해주세요.',
  ],
  lordosis: [
    '허리가 과하게 휘어 있어요. 복근 강화와 고관절 스트레칭으로 교정할 수 있어요.',
    '골반이 앞으로 기울어져 허리에 부담이 갈 수 있어요. 플랭크와 런지 스트레칭을 추천해요.',
  ],
};

import { selectByCondition } from '@/lib/utils/conditional-helpers';

// 헬퍼 함수
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mock 자세 분석 결과 생성
 */
export function generateMockPostureAnalysis(bodyType?: string): PostureAnalysisResult {
  // 체형 연동 시 관련 자세 타입 우선 선택
  let postureTypes: PostureType[] = [
    'ideal',
    'forward_head',
    'rounded_shoulders',
    'swayback',
    'flatback',
    'lordosis',
  ];

  if (bodyType && BODY_TYPE_POSTURE_CORRELATION[bodyType]) {
    const correlation = BODY_TYPE_POSTURE_CORRELATION[bodyType];
    // 체형 관련 자세 타입 50% 확률로 선택
    if (Math.random() < 0.5) {
      postureTypes = correlation.tendencies;
    }
  }

  const postureType = getRandomItem(postureTypes);
  const typeInfo = POSTURE_TYPES[postureType];

  // 정면 분석 측정값
  const isIdeal = postureType === 'ideal';
  // 이상적 자세가 아닐 때 랜덤으로 경고 여부 결정
  const shoulderIsGood = isIdeal || getRandomInRange(0, 1) === 0;
  const pelvisIsGood = isIdeal || getRandomInRange(0, 1) === 0;
  const frontAnalysis = {
    shoulderSymmetry: {
      name: '어깨 대칭',
      value: isIdeal ? getRandomInRange(45, 55) : getRandomInRange(30, 70),
      status: selectByCondition(shoulderIsGood, 'good' as const, 'warning' as const)!,
      description: '좌우 어깨 높이 균형도',
    },
    pelvisSymmetry: {
      name: '골반 대칭',
      value: isIdeal ? getRandomInRange(45, 55) : getRandomInRange(35, 65),
      status: selectByCondition(pelvisIsGood, 'good' as const, 'warning' as const)!,
      description: '좌우 골반 높이 균형도',
    },
    kneeAlignment: {
      name: '무릎 정렬',
      value: isIdeal ? getRandomInRange(45, 55) : getRandomInRange(40, 60),
      status: 'good' as const,
      description: '무릎 정렬 상태',
    },
    footAngle: {
      name: '발 각도',
      value: isIdeal ? getRandomInRange(45, 55) : getRandomInRange(40, 60),
      status: 'good' as const,
      description: '발의 외/내전 각도',
    },
  };

  // 측면 분석 측정값 (자세 타입에 따라 조정)
  const getSideValue = (metric: string): number => {
    const baseValue = 50;
    switch (postureType) {
      case 'forward_head':
        return metric === 'headForwardAngle' ? getRandomInRange(25, 40) : getRandomInRange(40, 60);
      case 'rounded_shoulders':
        return metric === 'thoracicKyphosis' ? getRandomInRange(60, 75) : getRandomInRange(40, 60);
      case 'swayback':
        return metric === 'pelvicTilt' ? getRandomInRange(60, 75) : getRandomInRange(35, 50);
      case 'flatback':
        return metric === 'lumbarLordosis' ? getRandomInRange(25, 40) : getRandomInRange(40, 55);
      case 'lordosis':
        return metric === 'lumbarLordosis' ? getRandomInRange(65, 80) : getRandomInRange(40, 55);
      default:
        return getRandomInRange(baseValue - 5, baseValue + 5);
    }
  };

  const getStatus = (value: number): PostureStatus => {
    if (value >= 40 && value <= 60) return 'good';
    if (value >= 30 && value <= 70) return 'warning';
    return 'alert';
  };

  const headForwardValue = getSideValue('headForwardAngle');
  const thoracicValue = getSideValue('thoracicKyphosis');
  const lumbarValue = getSideValue('lumbarLordosis');
  const pelvicValue = getSideValue('pelvicTilt');

  const sideAnalysis = {
    headForwardAngle: {
      name: '목 전방 경사',
      value: headForwardValue,
      status: getStatus(headForwardValue),
      description: '머리가 어깨 기준선 앞으로 나온 정도',
    },
    thoracicKyphosis: {
      name: '등 굽음 (흉추 후만)',
      value: thoracicValue,
      status: getStatus(thoracicValue),
      description: '등 상부의 굽음 정도',
    },
    lumbarLordosis: {
      name: '허리 만곡 (요추 전만)',
      value: lumbarValue,
      status: getStatus(lumbarValue),
      description: '허리의 자연스러운 곡선 정도',
    },
    pelvicTilt: {
      name: '골반 기울기',
      value: pelvicValue,
      status: getStatus(pelvicValue),
      description: '골반의 전/후방 경사 정도',
    },
  };

  // 전체 점수 계산
  const measurements = [
    frontAnalysis.shoulderSymmetry.value,
    frontAnalysis.pelvisSymmetry.value,
    sideAnalysis.headForwardAngle.value,
    sideAnalysis.thoracicKyphosis.value,
    sideAnalysis.lumbarLordosis.value,
    sideAnalysis.pelvicTilt.value,
  ];

  // 50에 가까울수록 좋은 점수
  const overallScore = Math.round(
    100 - measurements.reduce((sum, v) => sum + Math.abs(v - 50), 0) / measurements.length
  );

  // 문제점 생성
  const concerns = isIdeal ? [] : typeInfo.riskFactors.slice(0, getRandomInRange(2, 3));

  // 체형 연동 정보
  let bodyTypeCorrelation;
  if (bodyType && BODY_TYPE_POSTURE_CORRELATION[bodyType]) {
    const correlation = BODY_TYPE_POSTURE_CORRELATION[bodyType];
    bodyTypeCorrelation = {
      bodyType,
      correlationNote: correlation.note,
      riskFactors: correlation.riskFactors,
    };
  }

  return {
    postureType,
    postureTypeLabel: typeInfo.label,
    postureTypeDescription: typeInfo.description,
    overallScore,
    confidence: getRandomInRange(75, 95),
    frontAnalysis,
    sideAnalysis,
    concerns,
    stretchingRecommendations: STRETCHING_DATABASE[postureType],
    insight: getRandomItem(INSIGHTS[postureType]),
    analyzedAt: new Date(),
    bodyTypeCorrelation,
  };
}

/**
 * 자세 타입별 색상 클래스
 */
export function getPostureTypeColor(type: PostureType): string {
  const colors: Record<PostureType, string> = {
    ideal: 'text-green-500',
    forward_head: 'text-orange-500',
    rounded_shoulders: 'text-amber-500',
    swayback: 'text-red-500',
    flatback: 'text-blue-500',
    lordosis: 'text-purple-500',
  };
  return colors[type];
}

/**
 * 자세 타입별 배경 색상 클래스
 */
export function getPostureTypeBgColor(type: PostureType): string {
  const colors: Record<PostureType, string> = {
    ideal: 'bg-green-500',
    forward_head: 'bg-orange-500',
    rounded_shoulders: 'bg-amber-500',
    swayback: 'bg-red-500',
    flatback: 'bg-blue-500',
    lordosis: 'bg-purple-500',
  };
  return colors[type];
}

/**
 * 점수별 상태 반환
 */
export function getScoreStatus(score: number): PostureStatus {
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'alert';
}

/**
 * 점수별 색상 클래스
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}
