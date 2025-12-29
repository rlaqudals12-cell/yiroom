/**
 * C-1 체형 분석 Mock 데이터
 *
 * 3타입 체형 시스템 (골격진단 기반):
 * - S (스트레이트): 상체 볼륨, 입체적, 직선적
 * - W (웨이브): 하체 볼륨, 곡선적, 부드러운
 * - N (내추럴): 골격감, 프레임 큼, 자연스러운
 *
 * 레거시 8타입 (하위 호환): X, A, V, H, O, I, Y, 8
 *
 * Hook Model 적용:
 * - Action: 전신 사진 1장 업로드
 * - Reward: 고정(체형 타입, 비율) + 가변(스타일 인사이트)
 */

// 새로운 3타입 체형 시스템
export type BodyType3 = "S" | "W" | "N";

// 레거시 8타입 (하위 호환)
export type BodyType = "X" | "A" | "V" | "H" | "O" | "I" | "Y" | "8";

export interface BodyMeasurement {
  name: string; // 부위명 (한국어)
  value: number; // 0-100
  description: string; // 설명
}

export interface StyleRecommendation {
  item: string; // 아이템명
  reason: string; // 추천 이유
}

export interface UserBodyInput {
  height: number; // cm
  weight: number; // kg
  targetWeight?: number; // kg (선택)
}

/**
 * 색상 조합 (퍼스널 컬러 기반)
 */
export interface ColorCombination {
  top: string;
  bottom: string;
}

/**
 * 코디 색상 추천 결과 (퍼스널 컬러 + 체형 기반)
 */
export interface ColorRecommendations {
  topColors: string[];
  bottomColors: string[];
  avoidColors: string[];
  bestCombinations: ColorCombination[];
  accessories: string[];
}

export interface BodyAnalysisResult {
  bodyType: BodyType; // 체형 타입
  bodyTypeLabel: string; // 한국어 라벨 (예: "X자형")
  bodyTypeDescription: string; // 체형 설명
  measurements: BodyMeasurement[]; // 어깨/허리/골반
  strengths: string[]; // 강점 리스트
  insight: string; // AI 스타일 인사이트 (가변)
  styleRecommendations: StyleRecommendation[];
  analyzedAt: Date;
  // 사용자 입력 정보
  userInput?: UserBodyInput;
  bmi?: number;
  bmiCategory?: string;
  // 퍼스널 컬러 + 체형 기반 추천 (Week 6)
  personalColorSeason?: string | null;
  colorRecommendations?: ColorRecommendations | null;
  colorTips?: string[];
}

// 체형별 정보 (8가지)
export const BODY_TYPES: Record<
  BodyType,
  {
    label: string;
    description: string;
    characteristics: string;
    emoji: string;
  }
> = {
  X: {
    label: "X자형",
    description: "균형 잡힌 실루엣",
    characteristics: "어깨와 골반이 비슷하고 허리가 잘록한 체형",
    emoji: "🎯",
  },
  A: {
    label: "A자형",
    description: "하체 볼륨형",
    characteristics: "골반이 어깨보다 넓고 하체가 발달한 체형",
    emoji: "🍐",
  },
  V: {
    label: "V자형",
    description: "상체 볼륨형",
    characteristics: "어깨가 넓고 상체가 발달한 체형",
    emoji: "💪",
  },
  H: {
    label: "H자형",
    description: "일자형 실루엣",
    characteristics: "어깨, 허리, 골반이 비슷한 직선형 체형",
    emoji: "📏",
  },
  O: {
    label: "O자형",
    description: "풍만한 실루엣",
    characteristics: "전체적으로 둥근 곡선의 체형",
    emoji: "⭕",
  },
  I: {
    label: "I자형",
    description: "슬림 직선형",
    characteristics: "전체적으로 가늘고 긴 직선형 체형",
    emoji: "📐",
  },
  Y: {
    label: "Y자형",
    description: "어깨 강조형",
    characteristics: "어깨가 넓고 하체가 가는 역삼각형 체형",
    emoji: "🔺",
  },
  "8": {
    label: "8자형",
    description: "글래머러스 곡선형",
    characteristics: "가슴과 골반이 풍만하고 허리가 매우 잘록한 체형",
    emoji: "♾️",
  },
};

// 체형별 강점
const BODY_TYPE_STRENGTHS: Record<BodyType, string[]> = {
  X: [
    "상하체 균형이 좋아요",
    "허리 라인이 잘 잡혀있어요",
    "다양한 스타일이 잘 어울려요",
  ],
  A: [
    "하체가 안정적이에요",
    "여성스러운 곡선미가 있어요",
    "하이웨이스트가 잘 어울려요",
  ],
  V: [
    "어깨 라인이 멋져요",
    "상체가 탄탄해요",
    "V넥이나 보트넥이 잘 어울려요",
  ],
  H: [
    "깔끔한 실루엣이에요",
    "모던한 스타일이 잘 어울려요",
    "레이어드 스타일링이 좋아요",
  ],
  O: [
    "부드러운 인상이에요",
    "A라인 실루엣이 잘 어울려요",
    "세로 라인 강조가 효과적이에요",
  ],
  I: [
    "슬림한 실루엣이에요",
    "미니멀한 스타일이 잘 어울려요",
    "다양한 레이어링이 가능해요",
  ],
  Y: [
    "어깨 라인이 시원해요",
    "상체 존재감이 좋아요",
    "V넥과 오픈 칼라가 잘 어울려요",
  ],
  "8": [
    "풍만한 곡선미가 있어요",
    "허리 라인이 매우 돋보여요",
    "바디콘 스타일이 잘 어울려요",
  ],
};

// 체형별 추천 아이템
const BODY_TYPE_RECOMMENDATIONS: Record<BodyType, StyleRecommendation[]> = {
  X: [
    { item: "핏한 상의 + 하이웨이스트", reason: "허리 라인을 강조해요" },
    { item: "A라인 스커트", reason: "균형 잡힌 실루엣을 완성해요" },
    { item: "와이드 팬츠", reason: "세련된 느낌을 더해요" },
  ],
  A: [
    { item: "보트넥 상의", reason: "어깨 라인을 넓혀 보이게 해요" },
    { item: "A라인 원피스", reason: "전체 실루엣 균형을 맞춰요" },
    { item: "스트레이트 팬츠", reason: "하체를 날씬하게 보이게 해요" },
  ],
  V: [
    { item: "V넥 상의", reason: "시선을 세로로 모아줘요" },
    { item: "와이드 팬츠", reason: "하체에 볼륨감을 더해요" },
    { item: "플레어 스커트", reason: "균형 잡힌 실루엣을 만들어요" },
  ],
  H: [
    { item: "벨트 코디", reason: "허리 라인을 만들어줘요" },
    { item: "페플럼 상의", reason: "곡선미를 더해줘요" },
    { item: "랩 원피스", reason: "여성스러운 실루엣을 연출해요" },
  ],
  O: [
    { item: "세로 스트라이프", reason: "세로 라인을 강조해요" },
    { item: "A라인 코트", reason: "날씬해 보이는 효과가 있어요" },
    { item: "브이넥 니트", reason: "상체를 길어 보이게 해요" },
  ],
  I: [
    { item: "볼륨 있는 상의", reason: "입체감을 더해줘요" },
    { item: "레이어드 스타일", reason: "볼륨감을 연출해요" },
    { item: "러플 디테일", reason: "부드러운 곡선을 만들어요" },
  ],
  Y: [
    { item: "심플한 상의", reason: "어깨를 자연스럽게 연출해요" },
    { item: "와이드 팬츠", reason: "하체에 볼륨감을 더해요" },
    { item: "A라인 스커트", reason: "전체 균형을 맞춰요" },
  ],
  "8": [
    { item: "바디콘 원피스", reason: "곡선미를 최대한 살려요" },
    { item: "하이웨이스트 팬츠", reason: "허리 라인을 강조해요" },
    { item: "랩 스타일 상의", reason: "가슴 라인을 정돈해줘요" },
  ],
};

// 가변 보상을 위한 랜덤 인사이트 목록 (체형별)
const STYLE_INSIGHTS: Record<BodyType, string[]> = {
  X: [
    "허리를 강조하는 벨트 코디가 당신의 체형을 더 돋보이게 해요",
    "핏한 니트와 하이웨이스트 팬츠 조합을 추천해요",
    "어떤 스타일도 잘 소화하는 체형이에요. 과감한 시도를 해보세요!",
    "몸에 붙는 원피스가 특히 잘 어울려요",
  ],
  A: [
    "상의에 포인트를 주어 시선을 위로 모아보세요",
    "밝은 색 상의 + 어두운 색 하의 조합이 균형감을 줘요",
    "보트넥이나 오프숄더로 어깨 라인을 강조해보세요",
    "A라인 스커트가 당신의 체형에 가장 잘 어울려요",
  ],
  V: [
    "V넥 상의로 시선을 위로 모아보세요",
    "하체에 볼륨감을 주는 와이드 팬츠를 추천해요",
    "어깨 라인을 살린 재킷이 잘 어울려요",
    "플레어 스커트로 하체에 볼륨감을 더해보세요",
  ],
  H: [
    "레이어드 스타일링으로 입체감을 더해보세요",
    "벨트로 허리 라인을 만들어 여성스러움을 더해요",
    "페플럼 디테일이 있는 아이템을 시도해보세요",
    "랩 스타일 상의가 곡선미를 만들어줘요",
  ],
  O: [
    "세로 라인을 강조하는 스타일링이 효과적이에요",
    "단색 코디로 깔끔한 실루엣을 연출해보세요",
    "V넥 상의가 상체를 길어 보이게 해줘요",
    "A라인 실루엣으로 날씬해 보이는 효과를 내보세요",
  ],
  I: [
    "레이어드 스타일로 볼륨감을 더해보세요",
    "러플이나 프릴 디테일이 부드러움을 더해요",
    "크롭 재킷으로 비율을 조절해보세요",
    "벨트로 허리 라인을 만들어 곡선미를 연출해요",
  ],
  Y: [
    "심플한 상의로 어깨를 자연스럽게 연출해보세요",
    "와이드 팬츠로 하체에 볼륨감을 더해요",
    "A라인 스커트가 전체 균형을 잡아줘요",
    "다크 컬러 상의 + 밝은 하의 조합을 시도해보세요",
  ],
  "8": [
    "허리를 강조하는 스타일이 당신의 체형을 빛나게 해요",
    "바디콘 스타일로 아름다운 곡선을 뽐내보세요",
    "하이웨이스트 아이템이 비율을 더 좋게 만들어요",
    "랩 스타일로 세련된 곡선미를 연출해보세요",
  ],
};

// 로딩 팁 순환 (스펙: 3초 간격)
export const LOADING_TIPS = [
  "체형 비율을 분석합니다",
  "어깨, 허리, 골반 라인을 측정 중",
  "AI가 맞춤 스타일을 준비하고 있어요",
  "거의 완료되었어요!",
];

/**
 * 체형별 컬러 클래스
 */
export function getBodyTypeColor(type: BodyType): string {
  const colors: Record<BodyType, string> = {
    X: "text-purple-500",
    A: "text-pink-500",
    V: "text-blue-500",
    H: "text-green-500",
    O: "text-orange-500",
    I: "text-cyan-500",
    Y: "text-indigo-500",
    "8": "text-rose-500",
  };
  return colors[type];
}

/**
 * 체형별 배경 컬러 클래스
 */
export function getBodyTypeBgColor(type: BodyType): string {
  const colors: Record<BodyType, string> = {
    X: "bg-purple-500",
    A: "bg-pink-500",
    V: "bg-blue-500",
    H: "bg-green-500",
    O: "bg-orange-500",
    I: "bg-cyan-500",
    Y: "bg-indigo-500",
    "8": "bg-rose-500",
  };
  return colors[type];
}

/**
 * 랜덤 요소 선택 헬퍼
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 랜덤 범위 값 생성
 */
function getRandomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * BMI 카테고리 계산
 */
function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "저체중";
  if (bmi < 23) return "정상";
  if (bmi < 25) return "과체중";
  return "비만";
}

/**
 * Mock 체형 분석 결과 생성
 * 가변 보상: 매번 다른 인사이트와 약간 다른 측정값 제공
 *
 * @param userInput - 사용자 입력 (키, 몸무게, 목표 몸무게)
 */
export function generateMockBodyAnalysis(
  userInput?: UserBodyInput
): BodyAnalysisResult {
  // 랜덤 체형 선택 (8가지)
  const bodyTypes: BodyType[] = ["X", "A", "V", "H", "O", "I", "Y", "8"];
  const bodyType = getRandomItem(bodyTypes);
  const typeInfo = BODY_TYPES[bodyType];

  // 체형별 측정값 범위 설정
  const measurementRanges: Record<
    BodyType,
    { shoulder: [number, number]; waist: [number, number]; hip: [number, number] }
  > = {
    X: { shoulder: [78, 88], waist: [60, 70], hip: [78, 88] },
    A: { shoulder: [65, 75], waist: [65, 75], hip: [82, 92] },
    V: { shoulder: [82, 92], waist: [68, 78], hip: [65, 75] },
    H: { shoulder: [73, 83], waist: [73, 83], hip: [73, 83] },
    O: { shoulder: [70, 80], waist: [78, 88], hip: [75, 85] },
    I: { shoulder: [60, 70], waist: [58, 68], hip: [60, 70] },
    Y: { shoulder: [85, 95], waist: [65, 75], hip: [60, 70] },
    "8": { shoulder: [75, 85], waist: [55, 65], hip: [80, 90] },
  };

  const ranges = measurementRanges[bodyType];

  // 측정값 생성
  const measurements: BodyMeasurement[] = [
    {
      name: "어깨",
      value: getRandomInRange(...ranges.shoulder),
      description: "상체 넓이 지수",
    },
    {
      name: "허리",
      value: getRandomInRange(...ranges.waist),
      description: "허리 라인 지수",
    },
    {
      name: "골반",
      value: getRandomInRange(...ranges.hip),
      description: "하체 넓이 지수",
    },
  ];

  // 가변 보상: 랜덤 인사이트 선택
  const insight = getRandomItem(STYLE_INSIGHTS[bodyType]);

  // BMI 계산 (사용자 입력이 있는 경우)
  let bmi: number | undefined;
  let bmiCategory: string | undefined;

  if (userInput) {
    bmi = userInput.weight / ((userInput.height / 100) ** 2);
    bmiCategory = getBmiCategory(bmi);
  }

  return {
    bodyType,
    bodyTypeLabel: typeInfo.label,
    bodyTypeDescription: typeInfo.description,
    measurements,
    strengths: BODY_TYPE_STRENGTHS[bodyType],
    insight,
    styleRecommendations: BODY_TYPE_RECOMMENDATIONS[bodyType],
    analyzedAt: new Date(),
    userInput,
    bmi,
    bmiCategory,
  };
}

// ============================================================
// 3타입 체형 시스템 (골격진단 기반)
// ============================================================

/**
 * 3타입 체형 상세 정보
 */
export interface BodyType3Info {
  id: BodyType3;
  label: string;
  labelEn: string;
  emoji: string;
  description: string;
  characteristics: string;
  keywords: string[];
  strengths: string[];
  avoidStyles: string[];
  recommendations: StyleRecommendation[];
  insights: string[];
  // 초보자를 위한 추가 정보
  celebrities: string[]; // 대표 연예인 예시
  simpleExplanation: string; // 한 줄 쉬운 설명
  selfCheckTip: string; // 자가 진단 팁
}

/**
 * 3타입 체형 정보 (골격진단 기반)
 */
export const BODY_TYPES_3: Record<BodyType3, BodyType3Info> = {
  S: {
    id: "S",
    label: "스트레이트",
    labelEn: "Straight",
    emoji: "📐",
    description: "입체적이고 탄탄한 실루엣",
    characteristics: "상체에 볼륨감이 있고 근육이 잘 붙는 체형. 어깨선이 직선적이고 허리 위치가 높은 편이에요.",
    keywords: ["심플", "베이직", "I라인", "깔끔", "정장"],
    strengths: [
      "상체가 탄탄해요",
      "옷이 잘 떨어져요",
      "정장이 잘 어울려요",
      "깔끔한 스타일이 잘 받아요",
    ],
    avoidStyles: ["프릴", "오버핏", "루즈핏", "과한 레이어드"],
    recommendations: [
      { item: "테일러드 재킷", reason: "탄탄한 상체를 살려줘요" },
      { item: "스트레이트 팬츠", reason: "I라인으로 깔끔하게" },
      { item: "V넥 니트", reason: "세로 라인을 강조해요" },
      { item: "펜슬 스커트", reason: "깔끔한 실루엣을 완성해요" },
    ],
    insights: [
      "심플하고 베이직한 스타일이 가장 잘 어울려요!",
      "I라인 실루엣으로 깔끔하게 연출해보세요",
      "정장 스타일이 특히 잘 어울리는 체형이에요",
      "오버핏보다는 핏한 아이템이 더 좋아요",
    ],
    // 초보자용 정보
    celebrities: [], // 저작권 이슈로 연예인 예시 제외
    simpleExplanation: "딱 맞는 정사이즈 옷이 가장 잘 어울리는 타입이에요",
    selfCheckTip: "정장이나 셔츠를 입었을 때 '깔끔하다'는 말을 자주 듣나요? 스트레이트일 확률이 높아요!",
  },
  W: {
    id: "W",
    label: "웨이브",
    labelEn: "Wave",
    emoji: "🌊",
    description: "부드럽고 여성스러운 실루엣",
    characteristics: "하체에 볼륨감이 있고 곡선미가 돋보이는 체형. 어깨선이 둥글고 허리가 잘록한 편이에요.",
    keywords: ["페미닌", "X라인", "하이웨이스트", "프릴", "플레어"],
    strengths: [
      "여성스러운 곡선미가 있어요",
      "하이웨이스트가 잘 어울려요",
      "장신구가 잘 어울려요",
      "부드러운 소재가 잘 받아요",
    ],
    avoidStyles: ["오버핏", "박시핏", "롱기장", "직선적 실루엣"],
    recommendations: [
      { item: "페플럼 블라우스", reason: "허리 라인을 강조해요" },
      { item: "하이웨이스트 팬츠", reason: "비율을 좋게 만들어요" },
      { item: "A라인 스커트", reason: "곡선미를 살려줘요" },
      { item: "크롭 가디건", reason: "허리선을 높여줘요" },
    ],
    insights: [
      "X라인 실루엣으로 곡선미를 살려보세요!",
      "하이웨이스트 아이템이 비율을 좋게 만들어요",
      "부드러운 소재와 디테일이 잘 어울려요",
      "허리를 강조하는 스타일이 포인트예요",
    ],
    // 초보자용 정보
    celebrities: [], // 저작권 이슈로 연예인 예시 제외
    simpleExplanation: "프릴, 리본 같은 장식과 하이웨이스트가 잘 어울리는 타입이에요",
    selfCheckTip: "원피스나 하이웨이스트 스커트를 입으면 '여성스럽다'는 말을 듣나요? 웨이브일 확률이 높아요!",
  },
  N: {
    id: "N",
    label: "내추럴",
    labelEn: "Natural",
    emoji: "🌿",
    description: "자연스럽고 골격감 있는 실루엣",
    characteristics: "뼈대가 크고 관절이 두드러지는 체형. 어깨가 넓고 프레임이 큰 편이에요.",
    keywords: ["캐주얼", "오버핏", "레이어드", "자연스러움", "편안함"],
    strengths: [
      "어떤 옷이든 소화해요",
      "레이어드가 잘 어울려요",
      "캐주얼이 잘 어울려요",
      "긴 기장도 잘 받아요",
    ],
    avoidStyles: ["타이트핏", "미니기장", "과한 장식", "딱 붙는 옷"],
    recommendations: [
      { item: "오버사이즈 셔츠", reason: "자연스러운 느낌을 줘요" },
      { item: "와이드 팬츠", reason: "편안하면서 세련되게" },
      { item: "롱 코트", reason: "프레임을 살려줘요" },
      { item: "데님 재킷", reason: "캐주얼하게 연출해요" },
    ],
    insights: [
      "자연스럽고 편안한 스타일이 가장 잘 어울려요!",
      "레이어드 스타일링으로 멋을 내보세요",
      "오버핏과 긴 기장이 잘 어울리는 체형이에요",
      "무조건 핏한 것보다 여유로운 실루엣이 좋아요",
    ],
    // 초보자용 정보
    celebrities: [], // 저작권 이슈로 연예인 예시 제외
    simpleExplanation: "오버핏과 레이어드 스타일이 가장 잘 어울리는 타입이에요",
    selfCheckTip: "오버사이즈 옷이나 맨투맨을 입으면 '멋있다'는 말을 듣나요? 내추럴일 확률이 높아요!",
  },
};

/**
 * 8타입 → 3타입 매핑
 * - 스트레이트(S): X, V, Y (상체 발달, 직선적)
 * - 웨이브(W): A, 8, O (하체 발달, 곡선적)
 * - 내추럴(N): H, I (골격감, 직선형)
 */
export function mapBodyTypeTo3Type(bodyType: BodyType): BodyType3 {
  const mapping: Record<BodyType, BodyType3> = {
    X: "S",
    V: "S",
    Y: "S",
    A: "W",
    "8": "W",
    O: "W",
    H: "N",
    I: "N",
  };
  return mapping[bodyType];
}

/**
 * 3타입 결과 타입
 */
export interface BodyAnalysisResult3 {
  bodyType: BodyType3;
  bodyTypeLabel: string;
  bodyTypeLabelEn: string;
  bodyTypeDescription: string;
  characteristics: string;
  keywords: string[];
  measurements: BodyMeasurement[];
  strengths: string[];
  avoidStyles: string[];
  insight: string;
  styleRecommendations: StyleRecommendation[];
  analyzedAt: Date;
  userInput?: UserBodyInput;
  bmi?: number;
  bmiCategory?: string;
  personalColorSeason?: string | null;
  colorRecommendations?: ColorRecommendations | null;
  colorTips?: string[];
}

/**
 * Mock 체형 분석 결과 생성 (3타입)
 */
export function generateMockBodyAnalysis3(
  userInput?: UserBodyInput
): BodyAnalysisResult3 {
  // 랜덤 체형 선택 (3가지)
  const bodyTypes: BodyType3[] = ["S", "W", "N"];
  const bodyType = getRandomItem(bodyTypes);
  const typeInfo = BODY_TYPES_3[bodyType];

  // 체형별 측정값 범위 설정
  const measurementRanges: Record<
    BodyType3,
    { shoulder: [number, number]; waist: [number, number]; hip: [number, number] }
  > = {
    S: { shoulder: [80, 90], waist: [65, 75], hip: [70, 80] }, // 상체 볼륨
    W: { shoulder: [65, 75], waist: [60, 70], hip: [80, 90] }, // 하체 볼륨
    N: { shoulder: [75, 85], waist: [70, 80], hip: [72, 82] }, // 골격감
  };

  const ranges = measurementRanges[bodyType];

  // 측정값 생성
  const measurements: BodyMeasurement[] = [
    {
      name: "어깨",
      value: getRandomInRange(...ranges.shoulder),
      description: "상체 넓이 지수",
    },
    {
      name: "허리",
      value: getRandomInRange(...ranges.waist),
      description: "허리 라인 지수",
    },
    {
      name: "골반",
      value: getRandomInRange(...ranges.hip),
      description: "하체 넓이 지수",
    },
  ];

  // 가변 보상: 랜덤 인사이트 선택
  const insight = getRandomItem(typeInfo.insights);

  // BMI 계산 (사용자 입력이 있는 경우)
  let bmi: number | undefined;
  let bmiCategory: string | undefined;

  if (userInput) {
    bmi = userInput.weight / ((userInput.height / 100) ** 2);
    bmiCategory = getBmiCategory(bmi);
  }

  return {
    bodyType,
    bodyTypeLabel: typeInfo.label,
    bodyTypeLabelEn: typeInfo.labelEn,
    bodyTypeDescription: typeInfo.description,
    characteristics: typeInfo.characteristics,
    keywords: typeInfo.keywords,
    measurements,
    strengths: typeInfo.strengths,
    avoidStyles: typeInfo.avoidStyles,
    insight,
    styleRecommendations: typeInfo.recommendations,
    analyzedAt: new Date(),
    userInput,
    bmi,
    bmiCategory,
  };
}

/**
 * 3타입 체형별 컬러 클래스
 */
export function getBodyType3Color(type: BodyType3): string {
  const colors: Record<BodyType3, string> = {
    S: "text-blue-500",
    W: "text-pink-500",
    N: "text-green-500",
  };
  return colors[type];
}

/**
 * 3타입 체형별 배경 컬러 클래스
 */
export function getBodyType3BgColor(type: BodyType3): string {
  const colors: Record<BodyType3, string> = {
    S: "bg-blue-500",
    W: "bg-pink-500",
    N: "bg-green-500",
  };
  return colors[type];
}

// ============================================================
// 사진 촬영 가이드
// ============================================================

/**
 * 체형 분석 사진 촬영 가이드 팁
 */
export const BODY_PHOTO_GUIDE_TIPS = [
  {
    icon: "sun" as const,
    title: "밝은 조명",
    description: "전신이 잘 보이는 밝은 곳에서 촬영해주세요",
  },
  {
    icon: "shirt" as const,
    title: "몸에 붙는 옷",
    description: "체형이 잘 드러나는 옷을 입어주세요 (레깅스, 타이트 티셔츠 등)",
  },
  {
    icon: "user" as const,
    title: "바른 자세",
    description: "정면을 바라보고 팔을 살짝 벌려 자연스럽게 서주세요",
  },
  {
    icon: "ruler" as const,
    title: "전신 포함",
    description: "머리부터 발끝까지 모두 프레임에 들어오게 해주세요",
  },
];
