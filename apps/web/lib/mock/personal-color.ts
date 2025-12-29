// PC-1 퍼스널 컬러 진단 Mock 데이터 및 타입 정의

// 4계절 타입
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

// 톤 분류
export type ToneType = 'warm' | 'cool';
export type DepthType = 'light' | 'deep';

// 12톤 서브타입 (세분화된 퍼스널 컬러)
export type PersonalColorSubtype =
  // 봄 웜
  | 'spring-light' | 'spring-bright' | 'spring-true'
  // 여름 쿨
  | 'summer-light' | 'summer-mute' | 'summer-true'
  // 가을 웜
  | 'autumn-mute' | 'autumn-deep' | 'autumn-true'
  // 겨울 쿨
  | 'winter-deep' | 'winter-bright' | 'winter-true';

// 서브타입 정보
export interface PersonalColorSubtypeInfo {
  id: PersonalColorSubtype;
  season: SeasonType;
  label: string;
  shortLabel: string; // 라이트, 브라이트 등
  description: string;
  tone: ToneType;
  depth: DepthType;
}

// 12톤 서브타입 상세 정보
export const PERSONAL_COLOR_SUBTYPES: PersonalColorSubtypeInfo[] = [
  // 봄 웜톤
  {
    id: 'spring-light',
    season: 'spring',
    label: '봄 웜 라이트',
    shortLabel: '라이트',
    description: '밝고 맑은 파스텔 톤이 잘 어울려요',
    tone: 'warm',
    depth: 'light',
  },
  {
    id: 'spring-bright',
    season: 'spring',
    label: '봄 웜 브라이트',
    shortLabel: '브라이트',
    description: '선명하고 생기있는 컬러가 잘 어울려요',
    tone: 'warm',
    depth: 'light',
  },
  {
    id: 'spring-true',
    season: 'spring',
    label: '봄 웜 트루',
    shortLabel: '트루',
    description: '따뜻하고 화사한 웜톤의 정석이에요',
    tone: 'warm',
    depth: 'light',
  },
  // 여름 쿨톤
  {
    id: 'summer-light',
    season: 'summer',
    label: '여름 쿨 라이트',
    shortLabel: '라이트',
    description: '밝고 부드러운 파스텔 톤이 잘 어울려요',
    tone: 'cool',
    depth: 'light',
  },
  {
    id: 'summer-mute',
    season: 'summer',
    label: '여름 쿨 뮤트',
    shortLabel: '뮤트',
    description: '차분하고 뮤트한 컬러가 잘 어울려요',
    tone: 'cool',
    depth: 'light',
  },
  {
    id: 'summer-true',
    season: 'summer',
    label: '여름 쿨 트루',
    shortLabel: '트루',
    description: '시원하고 우아한 쿨톤의 정석이에요',
    tone: 'cool',
    depth: 'light',
  },
  // 가을 웜톤
  {
    id: 'autumn-mute',
    season: 'autumn',
    label: '가을 웜 뮤트',
    shortLabel: '뮤트',
    description: '차분하고 뮤트한 어스톤이 잘 어울려요',
    tone: 'warm',
    depth: 'deep',
  },
  {
    id: 'autumn-deep',
    season: 'autumn',
    label: '가을 웜 딥',
    shortLabel: '딥',
    description: '깊고 풍부한 컬러가 잘 어울려요',
    tone: 'warm',
    depth: 'deep',
  },
  {
    id: 'autumn-true',
    season: 'autumn',
    label: '가을 웜 트루',
    shortLabel: '트루',
    description: '따뜻하고 깊은 웜톤의 정석이에요',
    tone: 'warm',
    depth: 'deep',
  },
  // 겨울 쿨톤
  {
    id: 'winter-deep',
    season: 'winter',
    label: '겨울 쿨 딥',
    shortLabel: '딥',
    description: '깊고 강렬한 컬러가 잘 어울려요',
    tone: 'cool',
    depth: 'deep',
  },
  {
    id: 'winter-bright',
    season: 'winter',
    label: '겨울 쿨 브라이트',
    shortLabel: '브라이트',
    description: '선명하고 비비드한 컬러가 잘 어울려요',
    tone: 'cool',
    depth: 'deep',
  },
  {
    id: 'winter-true',
    season: 'winter',
    label: '겨울 쿨 트루',
    shortLabel: '트루',
    description: '시크하고 강렬한 쿨톤의 정석이에요',
    tone: 'cool',
    depth: 'deep',
  },
];

// 시즌별 서브타입 그룹화
export const SUBTYPES_BY_SEASON: Record<SeasonType, PersonalColorSubtypeInfo[]> = {
  spring: PERSONAL_COLOR_SUBTYPES.filter(s => s.season === 'spring'),
  summer: PERSONAL_COLOR_SUBTYPES.filter(s => s.season === 'summer'),
  autumn: PERSONAL_COLOR_SUBTYPES.filter(s => s.season === 'autumn'),
  winter: PERSONAL_COLOR_SUBTYPES.filter(s => s.season === 'winter'),
};

// 문진 질문 옵션
export interface QuestionOption {
  id: string;
  text: string;
  tone?: ToneType; // warm 또는 cool 점수에 기여
  depth?: DepthType; // light 또는 deep 점수에 기여
  skip?: boolean; // "잘 모르겠어요" 옵션
}

// 문진 질문
export interface OnboardingQuestion {
  id: string;
  number: number;
  question: string;
  options: QuestionOption[];
  weight: number; // 가중치 (기본 1, 중요 질문 2)
}

// 사용자 문진 응답
export interface QuestionnaireAnswer {
  questionId: string;
  optionId: string;
}

// 컬러 정보
export interface ColorInfo {
  hex: string;
  name: string;
}

// 립스틱 추천
export interface LipstickRecommendation {
  colorName: string;
  hex: string;
  brandExample?: string;
}

// 의류 추천
export interface ClothingRecommendation {
  item: string;
  colorSuggestion: string;
  reason: string;
}

// 스타일 설명 (연예인 매칭 대체 - 법적 리스크 회피)
export interface StyleDescription {
  imageKeywords: string[]; // 이미지 키워드 (예: "청순한", "시크한")
  makeupStyle: string; // 메이크업 스타일 설명
  fashionStyle: string; // 패션 스타일 설명
  accessories: string; // 어울리는 액세서리
}

// 퍼스널 컬러 결과
export interface PersonalColorResult {
  seasonType: SeasonType;
  seasonLabel: string;
  seasonDescription: string;
  tone: ToneType;
  depth: DepthType;
  confidence: number; // 신뢰도 (85~95%)
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  lipstickRecommendations: LipstickRecommendation[];
  clothingRecommendations: ClothingRecommendation[];
  styleDescription: StyleDescription; // 연예인 매칭 대체
  insight: string;
  analyzedAt: Date;
}

// 계절별 정보
export const SEASON_INFO: Record<
  SeasonType,
  {
    label: string;
    emoji: string;
    description: string;
    characteristics: string;
    percentage: number; // 통계적 비율
  }
> = {
  spring: {
    label: '봄 웜톤',
    emoji: '🌸',
    description: '밝고 화사한 웜톤',
    characteristics: '피부에 황금빛 광채가 있고, 밝고 맑은 컬러가 잘 어울려요',
    percentage: 25,
  },
  summer: {
    label: '여름 쿨톤',
    emoji: '🌊',
    description: '부드럽고 우아한 쿨톤',
    characteristics: '피부에 핑크빛이 감돌고, 뮤트하고 소프트한 컬러가 잘 어울려요',
    percentage: 18,
  },
  autumn: {
    label: '가을 웜톤',
    emoji: '🍂',
    description: '깊고 풍부한 웜톤',
    characteristics: '피부에 따뜻한 베이지톤이 있고, 차분하고 깊은 컬러가 잘 어울려요',
    percentage: 30,
  },
  winter: {
    label: '겨울 쿨톤',
    emoji: '❄️',
    description: '선명하고 시크한 쿨톤',
    characteristics: '피부에 차가운 느낌이 있고, 비비드하고 강렬한 컬러가 잘 어울려요',
    percentage: 27,
  },
};

// 계절별 베스트 컬러 팔레트 (10색)
export const BEST_COLORS: Record<SeasonType, ColorInfo[]> = {
  spring: [
    { hex: '#FFB6C1', name: '라이트 핑크' },
    { hex: '#FFDAB9', name: '피치' },
    { hex: '#FFA07A', name: '라이트 살몬' },
    { hex: '#FFD700', name: '골드' },
    { hex: '#98FB98', name: '페일 그린' },
    { hex: '#AFEEEE', name: '페일 터콰이즈' },
    { hex: '#DDA0DD', name: '플럼' },
    { hex: '#FFFACD', name: '레몬 쉬폰' },
    { hex: '#F0E68C', name: '카키' },
    { hex: '#E9967A', name: '다크 살몬' },
  ],
  summer: [
    { hex: '#E6E6FA', name: '라벤더' },
    { hex: '#B0C4DE', name: '라이트 스틸 블루' },
    { hex: '#D8BFD8', name: '시슬' },
    { hex: '#FFB6C1', name: '라이트 핑크' },
    { hex: '#87CEEB', name: '스카이 블루' },
    { hex: '#DDA0DD', name: '플럼' },
    { hex: '#C0C0C0', name: '실버' },
    { hex: '#F5F5DC', name: '베이지' },
    { hex: '#98D8C8', name: '민트' },
    { hex: '#E0B0FF', name: '모브' },
  ],
  autumn: [
    { hex: '#D2691E', name: '초콜릿' },
    { hex: '#CD853F', name: '페루' },
    { hex: '#DAA520', name: '골든로드' },
    { hex: '#808000', name: '올리브' },
    { hex: '#A0522D', name: '시에나' },
    { hex: '#D2B48C', name: '탄' },
    { hex: '#BC8F8F', name: '로지 브라운' },
    { hex: '#8B4513', name: '새들 브라운' },
    { hex: '#B8860B', name: '다크 골든로드' },
    { hex: '#556B2F', name: '다크 올리브 그린' },
  ],
  winter: [
    { hex: '#000000', name: '블랙' },
    { hex: '#FFFFFF', name: '화이트' },
    { hex: '#FF0000', name: '레드' },
    { hex: '#0000FF', name: '로얄 블루' },
    { hex: '#FF00FF', name: '매젠타' },
    { hex: '#00FFFF', name: '시안' },
    { hex: '#800080', name: '퍼플' },
    { hex: '#008000', name: '그린' },
    { hex: '#C0C0C0', name: '실버' },
    { hex: '#4B0082', name: '인디고' },
  ],
};

// 계절별 워스트 컬러 (5색)
export const WORST_COLORS: Record<SeasonType, ColorInfo[]> = {
  spring: [
    { hex: '#000000', name: '블랙' },
    { hex: '#808080', name: '그레이' },
    { hex: '#800000', name: '마룬' },
    { hex: '#4B0082', name: '인디고' },
    { hex: '#2F4F4F', name: '다크 슬레이트' },
  ],
  summer: [
    { hex: '#FF4500', name: '오렌지 레드' },
    { hex: '#FFD700', name: '골드' },
    { hex: '#000000', name: '블랙' },
    { hex: '#8B4513', name: '새들 브라운' },
    { hex: '#FF8C00', name: '다크 오렌지' },
  ],
  autumn: [
    { hex: '#FF00FF', name: '매젠타' },
    { hex: '#00FFFF', name: '시안' },
    { hex: '#FF69B4', name: '핫 핑크' },
    { hex: '#E6E6FA', name: '라벤더' },
    { hex: '#87CEEB', name: '스카이 블루' },
  ],
  winter: [
    { hex: '#FFDAB9', name: '피치' },
    { hex: '#F5DEB3', name: '위트' },
    { hex: '#D2B48C', name: '탄' },
    { hex: '#DEB887', name: '벌리우드' },
    { hex: '#F0E68C', name: '카키' },
  ],
};

// 계절별 립스틱 추천
export const LIPSTICK_RECOMMENDATIONS: Record<SeasonType, LipstickRecommendation[]> = {
  spring: [
    { colorName: '코랄 핑크', hex: '#F88379', brandExample: 'MAC 샤이걸' },
    { colorName: '피치 베이지', hex: '#FFDAB9', brandExample: 'NARS 도서' },
    { colorName: '살몬', hex: '#FA8072', brandExample: '샤넬 코코밤' },
  ],
  summer: [
    { colorName: '로즈 핑크', hex: '#FF66B2', brandExample: 'MAC 플래밍고' },
    { colorName: '베리', hex: '#8E4585', brandExample: 'NARS 돌체비타' },
    { colorName: '모브 핑크', hex: '#E0B0FF', brandExample: '샤넬 보이' },
  ],
  autumn: [
    { colorName: '브릭 레드', hex: '#CB4154', brandExample: 'MAC 칠리' },
    { colorName: '테라코타', hex: '#E2725B', brandExample: 'NARS 탄' },
    { colorName: '브라운 레드', hex: '#A52A2A', brandExample: '샤넬 누아르' },
  ],
  winter: [
    { colorName: '버건디', hex: '#800020', brandExample: 'MAC 다크사이드' },
    { colorName: '트루 레드', hex: '#FF0000', brandExample: 'NARS 드래곤걸' },
    { colorName: '푸시아', hex: '#FF00FF', brandExample: '샤넬 피에르' },
  ],
};

// 계절별 스타일 설명 (연예인 매칭 대체)
export const STYLE_DESCRIPTIONS: Record<SeasonType, StyleDescription> = {
  spring: {
    imageKeywords: ['청순한', '화사한', '생기있는', '밝은', '사랑스러운'],
    makeupStyle: '코랄, 피치 계열의 자연스러운 메이크업이 잘 어울려요. 블러셔는 복숭아빛으로, 립은 촉촉한 코랄 틴트가 찰떡이에요.',
    fashionStyle: '밝고 화사한 파스텔 톤, 아이보리, 베이지 계열의 부드러운 스타일이 잘 어울려요. 플라워 패턴이나 러블리한 디테일도 좋아요.',
    accessories: '로즈골드, 옐로우골드 액세서리가 피부를 더욱 화사하게 만들어줘요. 진주 액세서리도 잘 어울려요.',
  },
  summer: {
    imageKeywords: ['우아한', '청량한', '부드러운', '세련된', '시원한'],
    makeupStyle: '로즈 핑크, 라벤더 계열의 소프트한 메이크업이 잘 어울려요. 뮤트한 톤으로 은은하게 연출하면 우아해 보여요.',
    fashionStyle: '파스텔 블루, 라벤더, 민트 등 시원하고 부드러운 색상이 잘 어울려요. 쉬폰이나 린넨 같은 가벼운 소재도 좋아요.',
    accessories: '실버, 화이트골드 액세서리가 쿨한 피부톤과 조화를 이뤄요. 블루 계열 보석도 추천해요.',
  },
  autumn: {
    imageKeywords: ['시크한', '성숙한', '따뜻한', '고급스러운', '깊이있는'],
    makeupStyle: '테라코타, 브릭 레드 계열의 깊이있는 메이크업이 잘 어울려요. 브론저로 건강한 윤기를 더하면 더욱 좋아요.',
    fashionStyle: '카멜, 브라운, 올리브, 머스타드 같은 어스톤이 잘 어울려요. 가죽, 스웨이드 같은 텍스처감 있는 소재가 좋아요.',
    accessories: '골드, 앤틱골드 액세서리가 따뜻한 피부톤을 돋보이게 해요. 호피나 터틀쉘 패턴도 잘 어울려요.',
  },
  winter: {
    imageKeywords: ['도회적인', '시크한', '선명한', '강렬한', '모던한'],
    makeupStyle: '버건디, 와인, 트루레드 같은 선명한 컬러가 잘 어울려요. 깔끔한 아이라인과 볼드한 립으로 강렬함을 연출해보세요.',
    fashionStyle: '블랙, 화이트, 네이비 같은 모노톤이 잘 어울려요. 샤프한 실루엣과 미니멀한 디자인으로 시크하게 연출해보세요.',
    accessories: '실버, 플래티넘 액세서리가 쿨한 피부톤과 잘 맞아요. 다이아몬드나 크리스탈처럼 빛나는 소재도 추천해요.',
  },
};

// 10개 문진 질문
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'vein_color',
    number: 1,
    question: '손목 안쪽의 혈관 색은 어떤가요?',
    weight: 2, // 중요 질문
    options: [
      { id: 'blue', text: '파란색/보라색에 가까워요', tone: 'cool' },
      { id: 'green', text: '녹색/올리브색에 가까워요', tone: 'warm' },
      { id: 'mixed', text: '둘 다 섞여 있어요', skip: true },
      { id: 'unsure', text: '잘 모르겠어요', skip: true },
    ],
  },
  {
    id: 'jewelry',
    number: 2,
    question: '금과 은 장신구 중 어떤 것이 더 잘 어울리나요?',
    weight: 2, // 중요 질문
    options: [
      { id: 'gold', text: '금 장신구가 더 잘 어울려요', tone: 'warm' },
      { id: 'silver', text: '은 장신구가 더 잘 어울려요', tone: 'cool' },
      { id: 'both', text: '둘 다 잘 어울려요', skip: true },
      { id: 'unsure', text: '잘 모르겠어요', skip: true },
    ],
  },
  {
    id: 'skin_tone',
    number: 3,
    question: '피부톤이 어떤 느낌인가요?',
    weight: 1,
    options: [
      { id: 'ivory', text: '밝은 아이보리/우유빛', depth: 'light' },
      { id: 'beige', text: '자연스러운 베이지톤', depth: 'light', tone: 'warm' },
      { id: 'olive', text: '노란끼 있는 올리브톤', depth: 'deep', tone: 'warm' },
      { id: 'pink', text: '핑크빛이 도는 피부', depth: 'light', tone: 'cool' },
    ],
  },
  {
    id: 'hair_color',
    number: 4,
    question: '염색하지 않은 본연의 머리카락 색은?',
    weight: 1,
    options: [
      { id: 'light_brown', text: '밝은 갈색/적갈색', depth: 'light', tone: 'warm' },
      { id: 'dark_brown', text: '짙은 갈색', depth: 'deep' },
      { id: 'black', text: '새까만 흑발', depth: 'deep', tone: 'cool' },
      { id: 'soft_black', text: '부드러운 검정/짙은 브라운', depth: 'deep' },
    ],
  },
  {
    id: 'eye_color',
    number: 5,
    question: '눈동자 색은 어떤가요?',
    weight: 1,
    options: [
      { id: 'light_brown', text: '밝은 갈색/헤이즐', depth: 'light', tone: 'warm' },
      { id: 'dark_brown', text: '짙은 갈색', depth: 'deep' },
      { id: 'black', text: '거의 검정에 가까운 색', depth: 'deep', tone: 'cool' },
      { id: 'yellow_brown', text: '노란끼 있는 갈색', depth: 'light', tone: 'warm' },
    ],
  },
  {
    id: 'blush',
    number: 6,
    question: '얼굴에 홍조가 잘 생기는 편인가요?',
    weight: 1,
    options: [
      { id: 'often', text: '자주 생기는 편이에요', tone: 'cool' },
      { id: 'sometimes', text: '가끔 생기는 편이에요', skip: true },
      { id: 'rarely', text: '거의 생기지 않아요', tone: 'warm' },
      { id: 'unsure', text: '잘 모르겠어요', skip: true },
    ],
  },
  {
    id: 'sun_reaction',
    number: 7,
    question: '햇빛에 노출되면 피부가 어떻게 반응하나요?',
    weight: 1,
    options: [
      { id: 'burn', text: '빨갛게 타고 잘 벗겨져요', tone: 'cool', depth: 'light' },
      { id: 'tan_easy', text: '쉽게 그을려요', tone: 'warm', depth: 'deep' },
      { id: 'tan_slow', text: '천천히 그을리고 오래가요', tone: 'warm' },
      { id: 'no_change', text: '큰 변화가 없어요', skip: true },
    ],
  },
  {
    id: 'lip_color',
    number: 8,
    question: '입술 본연의 색은 어떤가요?',
    weight: 1,
    options: [
      { id: 'coral', text: '코랄/살구색에 가까워요', tone: 'warm' },
      { id: 'pink', text: '핑크/자주색에 가까워요', tone: 'cool' },
      { id: 'nude', text: '누드/베이지에 가까워요', depth: 'light' },
      { id: 'berry', text: '진한 베리/와인색이에요', tone: 'cool', depth: 'deep' },
    ],
  },
  {
    id: 'color_preference',
    number: 9,
    question: '주로 어떤 색상의 옷을 선호하시나요?',
    weight: 1,
    options: [
      { id: 'warm_bright', text: '밝은 오렌지, 노란색 계열', tone: 'warm', depth: 'light' },
      { id: 'cool_soft', text: '부드러운 파스텔, 라벤더', tone: 'cool', depth: 'light' },
      { id: 'warm_deep', text: '차분한 브라운, 카키 계열', tone: 'warm', depth: 'deep' },
      { id: 'cool_vivid', text: '선명한 블랙, 레드, 블루', tone: 'cool', depth: 'deep' },
    ],
  },
  {
    id: 'demographics',
    number: 10,
    question: '마지막으로 알려주세요!',
    weight: 1,
    options: [
      { id: 'female_young', text: '여성 / 10~20대', skip: true },
      { id: 'female_adult', text: '여성 / 30대 이상', skip: true },
      { id: 'male_young', text: '남성 / 10~20대', skip: true },
      { id: 'male_adult', text: '남성 / 30대 이상', skip: true },
    ],
  },
];

// AI 인사이트 목록 (가변 보상)
const INSIGHTS: Record<SeasonType, string[]> = {
  spring: [
    '봄처럼 화사하고 생기있는 컬러가 당신의 피부를 더욱 밝게 만들어줘요!',
    '밝고 맑은 컬러를 선택하면 얼굴이 환하게 빛날 거예요.',
    '코랄, 피치 계열의 컬러로 자연스러운 화사함을 연출해보세요.',
  ],
  summer: [
    '부드럽고 우아한 컬러가 당신의 피부톤을 더욱 고급스럽게 만들어줘요!',
    '뮤트하고 소프트한 파스텔 톤으로 세련된 분위기를 연출해보세요.',
    '라벤더, 로즈 계열의 컬러가 당신에게 완벽하게 어울려요.',
  ],
  autumn: [
    '따뜻하고 깊이있는 컬러가 당신의 피부를 건강하게 보이게 해요!',
    '브라운, 카키 계열의 어스톤으로 시크한 매력을 뽐내보세요.',
    '골드 액세서리와 함께 하면 더욱 빛나는 스타일링이 완성돼요.',
  ],
  winter: [
    '선명하고 강렬한 컬러가 당신의 도회적인 매력을 극대화해요!',
    '블랙, 화이트의 모노톤으로 시크함을 연출해보세요.',
    '비비드한 레드나 블루로 포인트를 주면 눈이 번쩍 뜨여요.',
  ],
};

// 로딩 화면 팁 목록
export const LOADING_TIPS = [
  '퍼스널 컬러를 분석하고 있어요',
  '베스트 컬러를 선정 중이에요',
  '맞춤 스타일링 팁을 준비하고 있어요',
  '거의 완료되었어요!',
];

// 의류 추천 생성
const generateClothingRecommendations = (
  seasonType: SeasonType
): ClothingRecommendation[] => {
  const recommendations: Record<SeasonType, ClothingRecommendation[]> = {
    spring: [
      { item: '블라우스', colorSuggestion: '피치 핑크', reason: '화사한 느낌을 더해줘요' },
      { item: '가디건', colorSuggestion: '아이보리', reason: '부드럽고 따뜻한 분위기' },
      { item: '원피스', colorSuggestion: '코랄', reason: '생기있는 데일리 룩' },
    ],
    summer: [
      { item: '셔츠', colorSuggestion: '라벤더', reason: '우아하고 시원한 느낌' },
      { item: '니트', colorSuggestion: '로즈 핑크', reason: '부드러운 여성스러움' },
      { item: '스커트', colorSuggestion: '스카이 블루', reason: '청량한 여름 느낌' },
    ],
    autumn: [
      { item: '재킷', colorSuggestion: '카멜', reason: '시크하고 세련된 느낌' },
      { item: '팬츠', colorSuggestion: '올리브', reason: '차분하고 멋스러운 분위기' },
      { item: '코트', colorSuggestion: '브릭', reason: '따뜻하고 고급스러운 느낌' },
    ],
    winter: [
      { item: '코트', colorSuggestion: '블랙', reason: '도회적이고 시크한 느낌' },
      { item: '블레이저', colorSuggestion: '네이비', reason: '세련되고 깔끔한 인상' },
      { item: '드레스', colorSuggestion: '버건디', reason: '강렬하고 우아한 분위기' },
    ],
  };
  return recommendations[seasonType];
};

// 문진 결과로 계절 타입 계산
export const calculateSeasonType = (
  answers: QuestionnaireAnswer[]
): { seasonType: SeasonType; tone: ToneType; depth: DepthType; confidence: number } => {
  let warmScore = 0;
  let coolScore = 0;
  let lightScore = 0;
  let deepScore = 0;

  answers.forEach((answer) => {
    const question = ONBOARDING_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) return;

    const option = question.options.find((o) => o.id === answer.optionId);
    if (!option || option.skip) return;

    const weight = question.weight;

    if (option.tone === 'warm') warmScore += weight;
    if (option.tone === 'cool') coolScore += weight;
    if (option.depth === 'light') lightScore += weight;
    if (option.depth === 'deep') deepScore += weight;
  });

  // 톤과 깊이 결정
  const tone: ToneType = warmScore >= coolScore ? 'warm' : 'cool';
  const depth: DepthType = lightScore >= deepScore ? 'light' : 'deep';

  // 계절 결정
  let seasonType: SeasonType;
  if (tone === 'warm' && depth === 'light') {
    seasonType = 'spring';
  } else if (tone === 'cool' && depth === 'light') {
    seasonType = 'summer';
  } else if (tone === 'warm' && depth === 'deep') {
    seasonType = 'autumn';
  } else {
    seasonType = 'winter';
  }

  // 신뢰도 계산 (85~95%)
  const totalScore = warmScore + coolScore + lightScore + deepScore;
  const dominance = Math.max(warmScore, coolScore) + Math.max(lightScore, deepScore);
  const confidence = Math.min(95, Math.max(85, 85 + (dominance / Math.max(1, totalScore)) * 10));

  return { seasonType, tone, depth, confidence: Math.round(confidence) };
};

// Mock 분석 결과 생성
export const generateMockPersonalColorResult = (
  answers?: QuestionnaireAnswer[]
): PersonalColorResult => {
  // 응답이 있으면 계산, 없으면 랜덤
  let seasonType: SeasonType;
  let tone: ToneType;
  let depth: DepthType;
  let confidence: number;

  if (answers && answers.length > 0) {
    const result = calculateSeasonType(answers);
    seasonType = result.seasonType;
    tone = result.tone;
    depth = result.depth;
    confidence = result.confidence;
  } else {
    // 통계적 비율에 따른 랜덤 선택
    const rand = Math.random() * 100;
    if (rand < 25) {
      seasonType = 'spring';
      tone = 'warm';
      depth = 'light';
    } else if (rand < 43) {
      // 25 + 18
      seasonType = 'summer';
      tone = 'cool';
      depth = 'light';
    } else if (rand < 73) {
      // 43 + 30
      seasonType = 'autumn';
      tone = 'warm';
      depth = 'deep';
    } else {
      seasonType = 'winter';
      tone = 'cool';
      depth = 'deep';
    }
    confidence = Math.floor(Math.random() * 11) + 85; // 85~95%
  }

  const info = SEASON_INFO[seasonType];
  const insights = INSIGHTS[seasonType];

  return {
    seasonType,
    seasonLabel: info.label,
    seasonDescription: info.description,
    tone,
    depth,
    confidence,
    bestColors: BEST_COLORS[seasonType],
    worstColors: WORST_COLORS[seasonType],
    lipstickRecommendations: LIPSTICK_RECOMMENDATIONS[seasonType],
    clothingRecommendations: generateClothingRecommendations(seasonType),
    styleDescription: STYLE_DESCRIPTIONS[seasonType],
    insight: insights[Math.floor(Math.random() * insights.length)],
    analyzedAt: new Date(),
  };
};

// 유틸리티 함수: 계절 타입 색상
export const getSeasonColor = (seasonType: SeasonType): string => {
  const colors: Record<SeasonType, string> = {
    spring: 'text-pink-500',
    summer: 'text-blue-500',
    autumn: 'text-orange-600',
    winter: 'text-purple-600',
  };
  return colors[seasonType];
};

export const getSeasonBgColor = (seasonType: SeasonType): string => {
  const colors: Record<SeasonType, string> = {
    spring: 'bg-pink-500',
    summer: 'bg-blue-500',
    autumn: 'bg-orange-600',
    winter: 'bg-purple-600',
  };
  return colors[seasonType];
};

export const getSeasonLightBgColor = (seasonType: SeasonType): string => {
  const colors: Record<SeasonType, string> = {
    spring: 'bg-pink-50',
    summer: 'bg-blue-50',
    autumn: 'bg-orange-50',
    winter: 'bg-purple-50',
  };
  return colors[seasonType];
};

export const getSeasonBorderColor = (seasonType: SeasonType): string => {
  const colors: Record<SeasonType, string> = {
    spring: 'border-pink-200',
    summer: 'border-blue-200',
    autumn: 'border-orange-200',
    winter: 'border-purple-200',
  };
  return colors[seasonType];
};

// ============================================
// 배경색 비교 (가상 드레이핑) 관련 타입 및 상수
// ============================================

// 배경색 비교 옵션
export interface ColorComparisonOption {
  id: string;
  label: string;
  backgroundColor: string; // Tailwind 클래스 또는 hex
  hex: string; // 실제 색상 값
}

// 배경색 비교 세트
export interface ColorComparisonSet {
  id: string;
  question: string;
  description: string;
  options: [ColorComparisonOption, ColorComparisonOption]; // 항상 2개 옵션
  determinesType: 'tone' | 'saturation' | 'depth'; // 결정하는 요소
}

// 사용자 선택 결과
export interface ColorComparisonAnswer {
  setId: string;
  selectedOptionId: string;
}

// 배경색 비교 세트 정의
export const COLOR_COMPARISON_SETS: ColorComparisonSet[] = [
  {
    id: 'warm_cool',
    question: '어떤 쪽이 더 화사해 보이나요?',
    description: '피부가 더 밝고 건강해 보이는 쪽을 선택해주세요',
    determinesType: 'tone',
    options: [
      {
        id: 'warm',
        label: 'A',
        backgroundColor: 'bg-amber-200',
        hex: '#FDE68A', // 골드/웜톤 배경
      },
      {
        id: 'cool',
        label: 'B',
        backgroundColor: 'bg-slate-200',
        hex: '#E2E8F0', // 실버/쿨톤 배경
      },
    ],
  },
  {
    id: 'vivid_mute',
    question: '어떤 쪽이 더 조화로워 보이나요?',
    description: '얼굴과 배경이 자연스럽게 어울리는 쪽을 선택해주세요',
    determinesType: 'saturation',
    options: [
      {
        id: 'vivid',
        label: 'A',
        backgroundColor: 'bg-rose-400',
        hex: '#FB7185', // 선명한 색
      },
      {
        id: 'mute',
        label: 'B',
        backgroundColor: 'bg-rose-200',
        hex: '#FECDD3', // 뮤트한 색
      },
    ],
  },
  {
    id: 'light_deep',
    question: '어떤 쪽에서 피부가 더 좋아 보이나요?',
    description: '피부톤이 더 균일하고 맑아 보이는 쪽을 선택해주세요',
    determinesType: 'depth',
    options: [
      {
        id: 'light',
        label: 'A',
        backgroundColor: 'bg-sky-100',
        hex: '#E0F2FE', // 밝은 색
      },
      {
        id: 'deep',
        label: 'B',
        backgroundColor: 'bg-indigo-800',
        hex: '#3730A3', // 깊은 색
      },
    ],
  },
];

// 배경색 비교 결과로 시즌 타입 계산
export const calculateSeasonFromComparison = (
  answers: ColorComparisonAnswer[]
): { seasonType: SeasonType; tone: ToneType; depth: DepthType; confidence: number } => {
  let tone: ToneType = 'warm';
  let depth: DepthType = 'light';

  answers.forEach((answer) => {
    const set = COLOR_COMPARISON_SETS.find((s) => s.id === answer.setId);
    if (!set) return;

    if (set.determinesType === 'tone') {
      tone = answer.selectedOptionId === 'warm' ? 'warm' : 'cool';
    } else if (set.determinesType === 'saturation') {
      // 비비드 선호 = winter/spring, 뮤트 선호 = summer/autumn
      // saturation은 보조 지표로 사용
    } else if (set.determinesType === 'depth') {
      depth = answer.selectedOptionId === 'light' ? 'light' : 'deep';
    }
  });

  // 계절 결정 - 룩업 테이블 사용으로 타입 안전성 보장
  const seasonMap: Record<`${ToneType}-${DepthType}`, SeasonType> = {
    'warm-light': 'spring',
    'cool-light': 'summer',
    'warm-deep': 'autumn',
    'cool-deep': 'winter',
  };
  const seasonType = seasonMap[`${tone}-${depth}`];

  // 신뢰도: 배경색 비교는 AI 분석과 결합하여 높은 신뢰도 제공
  const confidence = 88 + Math.floor(Math.random() * 7); // 88~94%

  return { seasonType, tone, depth, confidence };
};

// ============================================
// 조명 검증 관련 타입 및 상수
// ============================================

// 조명 상태 타입
export type LightingStatus = 'optimal' | 'acceptable' | 'poor';

// 조명 검증 결과
export interface LightingValidation {
  status: LightingStatus;
  isAcceptable: boolean;
  issues: string[];
  suggestion: string;
}

// 조명 검증 기준 메시지
export const LIGHTING_MESSAGES = {
  optimal: {
    title: '완벽한 조명이에요!',
    description: '밝은 실내에서 촬영되어 정확한 분석이 가능해요.',
  },
  acceptable: {
    title: '분석 가능한 조명이에요',
    description: '조금 더 밝은 곳에서 촬영하면 더 정확한 결과를 받을 수 있어요.',
  },
  poor: {
    title: '조명이 적합하지 않아요',
    description: '밝은 실내에서 다시 촬영해주시면 더 정확한 진단이 가능해요.',
  },
};

// 촬영 가이드 팁
export const PHOTO_GUIDE_TIPS = [
  {
    icon: 'sun',
    title: '밝은 실내',
    description: '조명이 얼굴을 고르게 비추는 밝은 곳에서 촬영해주세요',
  },
  {
    icon: 'face',
    title: '맨 얼굴 권장',
    description: '메이크업 없이 본연의 피부색이 보이면 더 정확해요',
  },
  {
    icon: 'shadow',
    title: '플래시 OFF',
    description: '플래시는 피부색을 왜곡시켜요. 꺼주세요',
  },
  {
    icon: 'position',
    title: '정면 촬영',
    description: '얼굴 전체가 잘 보이도록 정면을 바라봐주세요',
  },
];

// 손목 촬영 가이드 팁
export const WRIST_PHOTO_TIPS = [
  {
    icon: 'sun',
    title: '밝은 실내',
    description: '혈관 색이 잘 보이는 밝은 곳에서 촬영해주세요',
  },
  {
    icon: 'hand',
    title: '손목 안쪽',
    description: '손목 안쪽의 혈관이 잘 보이도록 촬영해주세요',
  },
  {
    icon: 'shadow',
    title: '그림자 없이',
    description: '손목에 그림자가 지지 않도록 해주세요',
  },
];
