// PC-1 퍼스널 컬러 진단 Mock 데이터 및 타입 정의

// 4계절 타입
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

// 톤 분류
export type ToneType = 'warm' | 'cool';
export type DepthType = 'light' | 'deep';

// 12톤 서브타입 (세분화된 퍼스널 컬러)
export type PersonalColorSubtype =
  // 봄 웜
  | 'spring-light'
  | 'spring-bright'
  | 'spring-true'
  // 여름 쿨
  | 'summer-light'
  | 'summer-mute'
  | 'summer-true'
  // 가을 웜
  | 'autumn-mute'
  | 'autumn-deep'
  | 'autumn-true'
  // 겨울 쿨
  | 'winter-deep'
  | 'winter-bright'
  | 'winter-true';

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
  spring: PERSONAL_COLOR_SUBTYPES.filter((s) => s.season === 'spring'),
  summer: PERSONAL_COLOR_SUBTYPES.filter((s) => s.season === 'summer'),
  autumn: PERSONAL_COLOR_SUBTYPES.filter((s) => s.season === 'autumn'),
  winter: PERSONAL_COLOR_SUBTYPES.filter((s) => s.season === 'winter'),
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
  // 초보자 친화 필드 (선택적, 하위 호환)
  easyDescription?: string; // "진한 와인색" 같은 쉬운 설명
  oliveyoungAlt?: string; // 올리브영 대안 제품
}

// 남성용 그루밍 추천 (립스틱 대신)
export interface GroomingRecommendation {
  itemName: string; // "립밤", "선크림", "톤업 크림" 등
  colorTone: string; // "무색", "자연스러운 베이지" 등
  hex: string;
  brandExample?: string;
  easyDescription?: string;
  oliveyoungAlt?: string;
}

// 파운데이션 추천
export interface FoundationRecommendation {
  shadeName: string; // 쉐이드 이름 (예: "21호 라이트 베이지")
  undertone: 'warm' | 'cool' | 'neutral'; // 언더톤
  brandExample: string; // 브랜드 예시
  easyDescription: string; // 쉬운 설명
  oliveyoungAlt?: string; // 올리브영 대안 제품
  tip?: string; // 선택 팁
}

// 의류 추천
export interface ClothingRecommendation {
  item: string;
  colorSuggestion: string;
  reason: string;
}

// 초보자 친화 메이크업 가이드
export interface EasyMakeupGuide {
  lip: string; // "진한 와인색이나 빨간색"
  eye: string; // "검정 아이라이너로 눈매만 살짝"
  cheek: string; // "핑크빛 블러셔를 살짝"
  tip: string; // "립이 진하면 눈 화장은 가볍게!"
}

// 남성용 그루밍 가이드 (메이크업 대신)
export interface EasyGroomingGuide {
  skin: string; // "깨끗하고 건강한 피부 유지"
  hair: string; // "깔끔하게 정돈된 헤어스타일"
  scent: string; // "톤에 맞는 향수 계열"
  tip: string; // "기본 스킨케어만 해도 충분해요"
}

// 초보자 친화 패션 가이드
export interface EasyFashionGuide {
  colors: string[]; // ["검정", "흰색", "남색"]
  avoid: string[]; // ["베이지", "카키"]
  style: string; // "깔끔하고 세련된 느낌"
  tip: string; // "무채색 위주로 입으면 실패 없어요"
}

// 초보자 친화 액세서리 가이드
export interface EasyAccessoryGuide {
  metal: string; // "은색 계열"
  examples: string[]; // ["실버 목걸이", "진주 귀걸이"]
}

// 스타일 설명 (연예인 매칭 대체 - 법적 리스크 회피)
export interface StyleDescription {
  imageKeywords: string[]; // 이미지 키워드 (예: "청순한", "시크한")
  makeupStyle: string; // 메이크업 스타일 설명
  fashionStyle: string; // 패션 스타일 설명
  accessories: string; // 어울리는 액세서리
  // 초보자 친화 필드 (선택적, 하위 호환)
  easyMakeup?: EasyMakeupGuide;
  easyFashion?: EasyFashionGuide;
  easyAccessory?: EasyAccessoryGuide;
  // 남성용 그루밍 가이드 (선택적)
  easyGrooming?: EasyGroomingGuide;
}

// 초보자 친화 인사이트
export interface EasyInsight {
  summary: string; // 기존 인사이트 문구
  easyExplanation: string; // 쉬운 말로 풀어쓴 설명
  actionTip: string; // 바로 실천할 수 있는 팁
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
  foundationRecommendations?: FoundationRecommendation[]; // 파운데이션 추천 (선택적)
  clothingRecommendations: ClothingRecommendation[];
  styleDescription: StyleDescription; // 연예인 매칭 대체
  insight: string;
  analyzedAt: Date;
  // 초보자 친화 필드 (선택적, 하위 호환)
  easyInsight?: EasyInsight;
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

// 워스트 컬러 (초보자 친화 이름)
export const WORST_COLORS: Record<SeasonType, ColorInfo[]> = {
  spring: [
    { hex: '#000000', name: '검정' },
    { hex: '#808080', name: '회색' },
    { hex: '#800000', name: '진한 와인' },
    { hex: '#4B0082', name: '남보라' },
    { hex: '#2F4F4F', name: '진한 청회색' },
  ],
  summer: [
    { hex: '#FF4500', name: '주황빨강' },
    { hex: '#FFD700', name: '금색' },
    { hex: '#000000', name: '검정' },
    { hex: '#8B4513', name: '진갈색' },
    { hex: '#FF8C00', name: '진한 주황' },
  ],
  autumn: [
    { hex: '#FF00FF', name: '핫핑크' },
    { hex: '#00FFFF', name: '하늘색' },
    { hex: '#FF69B4', name: '형광 분홍' },
    { hex: '#E6E6FA', name: '연보라' },
    { hex: '#87CEEB', name: '밝은 하늘색' },
  ],
  winter: [
    { hex: '#FFDAB9', name: '살구색' },
    { hex: '#F5DEB3', name: '밀색 베이지' },
    { hex: '#D2B48C', name: '황갈색' },
    { hex: '#DEB887', name: '누런 베이지' },
    { hex: '#BDB76B', name: '국방색 카키' },
  ],
};

// 계절별 립스틱 추천
export const LIPSTICK_RECOMMENDATIONS: Record<SeasonType, LipstickRecommendation[]> = {
  spring: [
    {
      colorName: '코랄 핑크',
      hex: '#F88379',
      brandExample: 'MAC 샤이걸',
      easyDescription: '살구색 + 분홍색 (복숭아 느낌)',
      oliveyoungAlt: '롬앤 쥬시래스팅틴트 피치블러쉬',
    },
    {
      colorName: '피치 베이지',
      hex: '#FFDAB9',
      brandExample: 'NARS 도서',
      easyDescription: '살구색 (자연스러운 내 입술색)',
      oliveyoungAlt: '컬러그램 누디블러틴트 코랄베일',
    },
    {
      colorName: '살몬',
      hex: '#FA8072',
      brandExample: '샤넬 코코밤',
      easyDescription: '연어색 (오렌지+핑크)',
      oliveyoungAlt: '페리페라 잉크벨벳 살몬코랄',
    },
  ],
  summer: [
    {
      colorName: '로즈 핑크',
      hex: '#FF66B2',
      brandExample: 'MAC 플래밍고',
      easyDescription: '장미빛 분홍색 (여리여리한 느낌)',
      oliveyoungAlt: '에스쁘아 노웨어샤인 티클드핑크',
    },
    {
      colorName: '베리',
      hex: '#8E4585',
      brandExample: 'NARS 돌체비타',
      easyDescription: '자두색 (블루베리 느낌)',
      oliveyoungAlt: '3CE CHILL MOVE',
    },
    {
      colorName: '모브 핑크',
      hex: '#E0B0FF',
      brandExample: '샤넬 보이',
      easyDescription: '연보라 핑크 (라벤더 느낌)',
      oliveyoungAlt: '롬앤 듀이풀워터틴트 라벤더로즈',
    },
  ],
  autumn: [
    {
      colorName: '브릭 레드',
      hex: '#CB4154',
      brandExample: 'MAC 칠리',
      easyDescription: '벽돌색 빨간색 (가을 낙엽 느낌)',
      oliveyoungAlt: '페리페라 잉크벨벳 브릭브라운',
    },
    {
      colorName: '테라코타',
      hex: '#E2725B',
      brandExample: 'NARS 탄',
      easyDescription: '흙빛 오렌지 (화분 색깔)',
      oliveyoungAlt: '롬앤 제로매트립스틱 스모크드베이지',
    },
    {
      colorName: '브라운 레드',
      hex: '#A52A2A',
      brandExample: '샤넬 누아르',
      easyDescription: '갈색+빨간색 (초콜릿 느낌)',
      oliveyoungAlt: '클리오 매드매트립 치즈레드',
    },
  ],
  winter: [
    {
      colorName: '버건디',
      hex: '#800020',
      brandExample: 'MAC 다크사이드',
      easyDescription: '진한 와인색 (레드와인 색깔)',
      oliveyoungAlt: '무지개맨션 오브제리퀴드 009퍼셉션',
    },
    {
      colorName: '트루 레드',
      hex: '#FF0000',
      brandExample: 'NARS 드래곤걸',
      easyDescription: '찐 빨간색 (빨간 사과 색)',
      oliveyoungAlt: '페리페라 잉크벨벳 016하트백만개',
    },
    {
      colorName: '푸시아',
      hex: '#FF00FF',
      brandExample: '샤넬 피에르',
      easyDescription: '핫핑크 (진한 분홍색)',
      oliveyoungAlt: '클리오 매드매트립 핫핑크',
    },
  ],
};

// 계절별 의류 추천 (Hybrid 데이터용 export)
export const CLOTHING_RECOMMENDATIONS: Record<SeasonType, ClothingRecommendation[]> = {
  spring: [
    { item: '블라우스', colorSuggestion: '피치 핑크', reason: '화사한 느낌을 더해줘요' },
    { item: '가디건', colorSuggestion: '아이보리', reason: '부드럽고 따뜻한 분위기' },
    { item: '원피스', colorSuggestion: '코랄', reason: '생기있는 데일리 룩' },
    { item: '티셔츠', colorSuggestion: '레몬 옐로우', reason: '밝고 활기찬 느낌' },
    { item: '스커트', colorSuggestion: '민트', reason: '상쾌하고 청순한 분위기' },
  ],
  summer: [
    { item: '셔츠', colorSuggestion: '라벤더', reason: '우아하고 시원한 느낌' },
    { item: '니트', colorSuggestion: '로즈 핑크', reason: '부드러운 여성스러움' },
    { item: '스커트', colorSuggestion: '스카이 블루', reason: '청량한 여름 느낌' },
    { item: '원피스', colorSuggestion: '페일 그레이', reason: '세련되고 시크한 분위기' },
    { item: '가디건', colorSuggestion: '더스티 핑크', reason: '차분하고 우아한 느낌' },
  ],
  autumn: [
    { item: '재킷', colorSuggestion: '카멜', reason: '시크하고 세련된 느낌' },
    { item: '팬츠', colorSuggestion: '올리브', reason: '차분하고 멋스러운 분위기' },
    { item: '코트', colorSuggestion: '브릭', reason: '따뜻하고 고급스러운 느낌' },
    { item: '니트', colorSuggestion: '머스타드', reason: '깊이있는 가을 분위기' },
    { item: '스커트', colorSuggestion: '테라코타', reason: '세련되고 차분한 느낌' },
  ],
  winter: [
    { item: '코트', colorSuggestion: '블랙', reason: '도회적이고 시크한 느낌' },
    { item: '블레이저', colorSuggestion: '네이비', reason: '세련되고 깔끔한 인상' },
    { item: '드레스', colorSuggestion: '버건디', reason: '강렬하고 우아한 분위기' },
    { item: '셔츠', colorSuggestion: '퓨어 화이트', reason: '깨끗하고 선명한 느낌' },
    { item: '팬츠', colorSuggestion: '차콜 그레이', reason: '모던하고 세련된 분위기' },
  ],
};

// 남성용 의류 추천
export const MALE_CLOTHING_RECOMMENDATIONS: Record<SeasonType, ClothingRecommendation[]> = {
  spring: [
    { item: '셔츠', colorSuggestion: '아이보리', reason: '밝고 깔끔한 인상' },
    { item: '치노 팬츠', colorSuggestion: '베이지', reason: '따뜻하고 편안한 분위기' },
    { item: '가디건', colorSuggestion: '라이트 그린', reason: '생기있는 캐주얼 룩' },
    { item: '면 재킷', colorSuggestion: '연한 카키', reason: '봄철 스마트 캐주얼' },
    { item: '폴로 셔츠', colorSuggestion: '살몬 핑크', reason: '활기차고 화사한 느낌' },
  ],
  summer: [
    { item: '린넨 셔츠', colorSuggestion: '라벤더', reason: '시원하고 세련된 느낌' },
    { item: '슬랙스', colorSuggestion: '라이트 그레이', reason: '깔끔하고 모던한 인상' },
    { item: '니트 폴로', colorSuggestion: '스카이 블루', reason: '청량한 여름 느낌' },
    { item: '반팔 셔츠', colorSuggestion: '민트', reason: '상쾌하고 시원한 분위기' },
    { item: '면 팬츠', colorSuggestion: '더스티 블루', reason: '차분하고 우아한 느낌' },
  ],
  autumn: [
    { item: '트위드 재킷', colorSuggestion: '카멜', reason: '고급스럽고 세련된 느낌' },
    { item: '울 팬츠', colorSuggestion: '올리브', reason: '차분하고 멋스러운 분위기' },
    { item: '니트', colorSuggestion: '버건디', reason: '깊이있는 가을 분위기' },
    { item: '코트', colorSuggestion: '브라운', reason: '따뜻하고 클래식한 느낌' },
    { item: '터틀넥', colorSuggestion: '머스타드', reason: '포인트 있는 스타일링' },
  ],
  winter: [
    { item: '코트', colorSuggestion: '블랙', reason: '도회적이고 시크한 느낌' },
    { item: '블레이저', colorSuggestion: '네이비', reason: '세련되고 깔끔한 인상' },
    { item: '정장 팬츠', colorSuggestion: '차콜 그레이', reason: '모던하고 세련된 분위기' },
    { item: '셔츠', colorSuggestion: '퓨어 화이트', reason: '깨끗하고 선명한 느낌' },
    { item: '터틀넥', colorSuggestion: '딥 퍼플', reason: '강렬하고 세련된 분위기' },
  ],
};

// 남성용 그루밍 추천 (립스틱 대신)
export const GROOMING_RECOMMENDATIONS: Record<SeasonType, GroomingRecommendation[]> = {
  spring: [
    {
      itemName: '컬러 립밤',
      colorTone: '내추럴 피치',
      hex: '#FFDAB9',
      brandExample: '버츠비 틴티드 립밤',
      easyDescription: '자연스러운 혈색 (건조함 방지)',
      oliveyoungAlt: '바닐라코 립 에센셜',
    },
    {
      itemName: '톤업 선크림',
      colorTone: '웜 베이지',
      hex: '#F5DEB3',
      brandExample: '닥터지 톤업 선',
      easyDescription: '피부톤 보정 + 자외선 차단',
      oliveyoungAlt: '라운드랩 자작나무 선크림',
    },
    {
      itemName: '컨실러',
      colorTone: '라이트 베이지',
      hex: '#FFE4B5',
      brandExample: '더샘 컨실러',
      easyDescription: '다크서클/잡티 커버용',
      oliveyoungAlt: '더샘 팁 컨실러 01호',
    },
  ],
  summer: [
    {
      itemName: '무색 립밤',
      colorTone: '투명',
      hex: '#F0F0F0',
      brandExample: '니베아 립케어',
      easyDescription: '촉촉한 입술 유지',
      oliveyoungAlt: '바세린 립 테라피',
    },
    {
      itemName: '톤업 선크림',
      colorTone: '쿨 핑크',
      hex: '#FFE4E1',
      brandExample: '이니스프리 톤업 선',
      easyDescription: '맑은 피부톤 연출',
      oliveyoungAlt: '아이소이 선크림',
    },
    {
      itemName: '컨실러',
      colorTone: '쿨 베이지',
      hex: '#F5F5DC',
      brandExample: 'NARS 컨실러',
      easyDescription: '칙칙함 커버용',
      oliveyoungAlt: '클리오 킬커버 컨실러',
    },
  ],
  autumn: [
    {
      itemName: '틴티드 립밤',
      colorTone: '웜 브라운',
      hex: '#D2B48C',
      brandExample: '키엘 립밤',
      easyDescription: '자연스러운 갈색빛 혈색',
      oliveyoungAlt: '바닐라코 립 에센셜 브라운',
    },
    {
      itemName: 'BB크림',
      colorTone: '내추럴 베이지',
      hex: '#D2691E',
      brandExample: '랩시리즈 BB',
      easyDescription: '건강한 피부톤 연출',
      oliveyoungAlt: '아이오페 맨 BB크림',
    },
    {
      itemName: '컨실러',
      colorTone: '웜 샌드',
      hex: '#C4A484',
      brandExample: '맥 컨실러',
      easyDescription: '깊이있는 피부톤 커버',
      oliveyoungAlt: '더샘 팁 컨실러 02호',
    },
  ],
  winter: [
    {
      itemName: '무색 립밤',
      colorTone: '투명',
      hex: '#F8F8FF',
      brandExample: '라로슈포제 립밤',
      easyDescription: '깨끗하고 건강한 입술',
      oliveyoungAlt: '바세린 오리지널',
    },
    {
      itemName: '톤업 선크림',
      colorTone: '쿨 화이트',
      hex: '#FFFAFA',
      brandExample: '설화수 자외선차단',
      easyDescription: '맑고 깨끗한 피부 연출',
      oliveyoungAlt: '비오템 옴므 선크림',
    },
    {
      itemName: '컨실러',
      colorTone: '아이시 베이지',
      hex: '#FAEBD7',
      brandExample: '조르지오아르마니 컨실러',
      easyDescription: '선명한 피부톤 커버',
      oliveyoungAlt: '클리오 킬커버 컨실러 쿨톤',
    },
  ],
};

// 남성용 스타일 설명
export const MALE_STYLE_DESCRIPTIONS: Record<SeasonType, StyleDescription> = {
  spring: {
    imageKeywords: ['밝은', '활기찬', '친근한', '건강한', '부드러운'],
    makeupStyle:
      '자연스러운 톤업과 깔끔한 피부 관리가 핵심이에요. 립밤으로 촉촉한 입술을 유지하세요.',
    fashionStyle:
      '밝고 따뜻한 톤의 캐주얼 스타일이 잘 어울려요. 베이지, 아이보리, 연한 카키 컬러 추천.',
    accessories: '로즈골드, 옐로우골드 시계나 안경테가 피부를 더욱 화사하게 만들어줘요.',
    easyGrooming: {
      skin: '톤업 선크림으로 건강한 피부톤 유지',
      hair: '밝은 갈색 계열 염색도 잘 어울려요',
      scent: '시트러스, 그린 계열 상쾌한 향수',
      tip: '깔끔한 피부 관리만 해도 화사해 보여요',
    },
    easyFashion: {
      colors: ['아이보리', '베이지', '연한 카키', '라이트 그린'],
      avoid: ['검정', '진회색', '진한 남색'],
      style: '밝고 편안한 느낌의 스마트 캐주얼',
      tip: '밝은 색 셔츠 하나로 인상이 확 달라져요',
    },
    easyAccessory: {
      metal: '금색 계열 (로즈골드, 옐로우골드)',
      examples: ['골드 시계', '갈색 가죽 벨트', '브라운 안경테'],
    },
  },
  summer: {
    imageKeywords: ['세련된', '차분한', '지적인', '우아한', '시원한'],
    makeupStyle: '깔끔하고 맑은 피부가 포인트예요. 쿨톤 선크림으로 칙칙함을 방지하세요.',
    fashionStyle: '시원하고 세련된 색상이 잘 어울려요. 라벤더, 스카이블루, 그레이 컬러 추천.',
    accessories: '실버, 화이트골드 시계나 안경테가 쿨한 피부톤과 조화를 이뤄요.',
    easyGrooming: {
      skin: '쿨톤 톤업으로 맑은 피부 연출',
      hair: '애쉬 브라운, 블랙 계열이 잘 어울려요',
      scent: '아쿠아, 우디 계열 차분한 향수',
      tip: '피부가 맑아 보이면 세련돼 보여요',
    },
    easyFashion: {
      colors: ['라벤더', '스카이블루', '라이트그레이', '민트'],
      avoid: ['주황색', '카키', '진한 갈색'],
      style: '시원하고 깔끔한 느낌의 미니멀 룩',
      tip: '파스텔 셔츠가 피부를 맑아 보이게 해요',
    },
    easyAccessory: {
      metal: '은색 계열 (실버, 화이트골드)',
      examples: ['실버 시계', '검정 가죽 벨트', '실버 안경테'],
    },
  },
  autumn: {
    imageKeywords: ['시크한', '성숙한', '고급스러운', '남성적인', '깊이있는'],
    makeupStyle: '건강하고 따뜻한 피부톤이 매력이에요. BB크림으로 자연스러운 커버를 하세요.',
    fashionStyle: '깊고 따뜻한 어스톤이 잘 어울려요. 카멜, 브라운, 올리브, 버건디 컬러 추천.',
    accessories: '골드, 앤틱골드 시계나 가죽 소품이 따뜻한 피부톤을 돋보이게 해요.',
    easyGrooming: {
      skin: 'BB크림으로 건강한 피부 연출',
      hair: '웜브라운, 다크브라운 염색 추천',
      scent: '우디, 스파이시 계열 깊이있는 향수',
      tip: '깔끔하게 정돈된 수염도 잘 어울려요',
    },
    easyFashion: {
      colors: ['카멜', '브라운', '올리브', '버건디'],
      avoid: ['핑크', '하늘색', '연보라'],
      style: '클래식하고 고급스러운 느낌',
      tip: '갈색 계열 재킷이 남성미를 살려줘요',
    },
    easyAccessory: {
      metal: '금색 계열 (골드, 앤틱골드)',
      examples: ['골드 시계', '브라운 가죽 가방', '호피 스카프'],
    },
  },
  winter: {
    imageKeywords: ['도회적인', '시크한', '선명한', '강렬한', '모던한'],
    makeupStyle: '깔끔하고 선명한 인상이 매력이에요. 맑은 피부톤을 유지하는 것이 핵심.',
    fashionStyle: '모노톤과 선명한 색상이 잘 어울려요. 블랙, 네이비, 화이트, 레드 포인트 추천.',
    accessories: '실버, 플래티넘 시계나 메탈 소품이 쿨한 피부톤과 잘 맞아요.',
    easyGrooming: {
      skin: '깨끗한 피부 유지가 핵심',
      hair: '블랙, 애쉬 블랙 계열이 잘 어울려요',
      scent: '머스크, 우디 계열 세련된 향수',
      tip: '피부 관리만 잘 해도 시크해 보여요',
    },
    easyFashion: {
      colors: ['블랙', '네이비', '화이트', '차콜'],
      avoid: ['베이지', '카키', '살구색'],
      style: '깔끔하고 세련된 모던 룩',
      tip: '검정 코트 하나면 스타일 완성!',
    },
    easyAccessory: {
      metal: '은색 계열 (실버, 플래티넘)',
      examples: ['실버 시계', '메탈 팔찌', '블랙 가죽 벨트'],
    },
  },
};

// 계절별 파운데이션 추천
export const FOUNDATION_RECOMMENDATIONS: Record<SeasonType, FoundationRecommendation[]> = {
  spring: [
    {
      shadeName: '21호 웜 베이지',
      undertone: 'warm',
      brandExample: '에스티로더 더블웨어 2W1',
      easyDescription: '노란 기가 도는 밝은 베이지 (피치빛)',
      oliveyoungAlt: '클리오 킬커버 파운웨어 03 린넨',
      tip: '옐로 베이스를 선택하면 피부가 화사해 보여요',
    },
    {
      shadeName: '23호 웜 샌드',
      undertone: 'warm',
      brandExample: 'MAC 스튜디오픽스 NC25',
      easyDescription: '따뜻한 모래색 (자연스러운 누드)',
      oliveyoungAlt: '이니스프리 노세범 파운데이션 N23',
      tip: '피부톤이 조금 어두우면 이 쉐이드가 더 자연스러워요',
    },
    {
      shadeName: '21호 피치 베이지',
      undertone: 'warm',
      brandExample: '랑콤 땡뜨 이돌 210',
      easyDescription: '복숭아빛이 도는 밝은 베이지',
      oliveyoungAlt: '페리페라 잉크래스팅 커버 파운데이션 02',
    },
  ],
  summer: [
    {
      shadeName: '21호 쿨 핑크',
      undertone: 'cool',
      brandExample: '에스티로더 더블웨어 1C1',
      easyDescription: '핑크 기가 도는 밝은 베이지 (로즈빛)',
      oliveyoungAlt: '클리오 킬커버 파운웨어 02 랑제리',
      tip: '핑크 베이스를 선택하면 피부가 맑아 보여요',
    },
    {
      shadeName: '21호 뉴트럴 로즈',
      undertone: 'cool',
      brandExample: 'MAC 스튜디오픽스 NW20',
      easyDescription: '차분한 로즈빛 베이지',
      oliveyoungAlt: '라네즈 네오 쿠션 21C',
      tip: '쿨톤은 옐로 베이스를 피하면 칙칙해 보이지 않아요',
    },
    {
      shadeName: '23호 소프트 핑크',
      undertone: 'cool',
      brandExample: '디올 포에버 스킨 글로우 2CR',
      easyDescription: '부드러운 핑크빛 베이지',
      oliveyoungAlt: '에뛰드 더블래스팅 쿠션 글로우 23C1',
    },
  ],
  autumn: [
    {
      shadeName: '23호 딥 웜',
      undertone: 'warm',
      brandExample: '에스티로더 더블웨어 3W1',
      easyDescription: '깊은 황금빛 베이지 (꿀색)',
      oliveyoungAlt: '클리오 킬커버 파운웨어 04 진저',
      tip: '옐로우 골드 베이스가 건강한 피부를 연출해요',
    },
    {
      shadeName: '25호 앰버',
      undertone: 'warm',
      brandExample: 'MAC 스튜디오픽스 NC30',
      easyDescription: '따뜻한 호박색 베이지',
      oliveyoungAlt: '이니스프리 노세범 파운데이션 N27',
      tip: '브론저 없이도 건강한 피부톤 연출 가능해요',
    },
    {
      shadeName: '23호 캐러멜',
      undertone: 'warm',
      brandExample: '나스 쉬어 글로우 바르셀로나',
      easyDescription: '카라멜빛이 도는 따뜻한 베이지',
      oliveyoungAlt: '토니모리 비씨데이션 커버핏 04',
    },
  ],
  winter: [
    {
      shadeName: '21호 아이시 핑크',
      undertone: 'cool',
      brandExample: '에스티로더 더블웨어 1C0',
      easyDescription: '차가운 핑크빛 아이보리 (새하얀)',
      oliveyoungAlt: '클리오 킬커버 파운웨어 01 리넨',
      tip: '선명한 쿨톤은 회색 기가 살짝 도는 것도 OK',
    },
    {
      shadeName: '21호 포슬린',
      undertone: 'cool',
      brandExample: 'MAC 스튜디오픽스 NW15',
      easyDescription: '도자기 같은 맑은 아이보리',
      oliveyoungAlt: '라네즈 네오 쿠션 17C',
      tip: '너무 노란 쉐이드는 피하세요, 칙칙해 보일 수 있어요',
    },
    {
      shadeName: '23호 쿨 뉴트럴',
      undertone: 'neutral',
      brandExample: '디올 포에버 스킨 글로우 2N',
      easyDescription: '차분한 뉴트럴 베이지 (중간)',
      oliveyoungAlt: '에뛰드 더블래스팅 쿠션 글로우 21N',
    },
  ],
};

// 계절별 스타일 설명 (연예인 매칭 대체)
export const STYLE_DESCRIPTIONS: Record<SeasonType, StyleDescription> = {
  spring: {
    imageKeywords: ['청순한', '화사한', '생기있는', '밝은', '사랑스러운'],
    makeupStyle:
      '코랄, 피치 계열의 자연스러운 메이크업이 잘 어울려요. 블러셔는 복숭아빛으로, 립은 촉촉한 코랄 틴트가 찰떡이에요.',
    fashionStyle:
      '밝고 화사한 파스텔 톤, 아이보리, 베이지 계열의 부드러운 스타일이 잘 어울려요. 플라워 패턴이나 러블리한 디테일도 좋아요.',
    accessories:
      '로즈골드, 옐로우골드 액세서리가 피부를 더욱 화사하게 만들어줘요. 진주 액세서리도 잘 어울려요.',
    easyMakeup: {
      lip: '복숭아색이나 살구색 립 (오렌지+핑크 느낌)',
      eye: '갈색 아이라이너로 부드럽게, 아이섀도는 연한 핑크나 골드',
      cheek: '복숭아빛 블러셔를 광대뼈에 살짝',
      tip: '자연스럽고 화사하게! 너무 진한 색은 피하세요',
    },
    easyFashion: {
      colors: ['흰색', '아이보리', '연분홍', '살구색', '연노랑'],
      avoid: ['검정', '진회색', '진한 남색'],
      style: '밝고 부드러운 느낌, 꽃무늬나 귀여운 디테일',
      tip: '밝은 색 위주로 입으면 얼굴이 환해 보여요',
    },
    easyAccessory: {
      metal: '금색 계열 (로즈골드, 옐로우골드)',
      examples: ['진주 귀걸이', '골드 목걸이', '로즈골드 팔찌'],
    },
  },
  summer: {
    imageKeywords: ['우아한', '청량한', '부드러운', '세련된', '시원한'],
    makeupStyle:
      '로즈 핑크, 라벤더 계열의 소프트한 메이크업이 잘 어울려요. 뮤트한 톤으로 은은하게 연출하면 우아해 보여요.',
    fashionStyle:
      '파스텔 블루, 라벤더, 민트 등 시원하고 부드러운 색상이 잘 어울려요. 쉬폰이나 린넨 같은 가벼운 소재도 좋아요.',
    accessories:
      '실버, 화이트골드 액세서리가 쿨한 피부톤과 조화를 이뤄요. 블루 계열 보석도 추천해요.',
    easyMakeup: {
      lip: '장미색이나 자두색 립 (핑크+보라 느낌)',
      eye: '회색이나 연보라 아이섀도, 아이라이너는 진회색',
      cheek: '연분홍 블러셔를 은은하게',
      tip: '차분하고 우아하게! 오렌지색은 피하세요',
    },
    easyFashion: {
      colors: ['하늘색', '연보라', '민트', '연분홍', '흰색'],
      avoid: ['주황색', '카키', '진한 갈색'],
      style: '시원하고 부드러운 느낌, 가벼운 소재',
      tip: '파스텔 톤으로 입으면 피부가 맑아 보여요',
    },
    easyAccessory: {
      metal: '은색 계열 (실버, 화이트골드)',
      examples: ['실버 반지', '화이트골드 목걸이', '파란 보석 귀걸이'],
    },
  },
  autumn: {
    imageKeywords: ['시크한', '성숙한', '따뜻한', '고급스러운', '깊이있는'],
    makeupStyle:
      '테라코타, 브릭 레드 계열의 깊이있는 메이크업이 잘 어울려요. 브론저로 건강한 윤기를 더하면 더욱 좋아요.',
    fashionStyle:
      '카멜, 브라운, 올리브, 머스타드 같은 어스톤이 잘 어울려요. 가죽, 스웨이드 같은 텍스처감 있는 소재가 좋아요.',
    accessories:
      '골드, 앤틱골드 액세서리가 따뜻한 피부톤을 돋보이게 해요. 호피나 터틀쉘 패턴도 잘 어울려요.',
    easyMakeup: {
      lip: '벽돌색이나 갈색빨간색 립 (가을 낙엽 느낌)',
      eye: '갈색이나 카키색 아이섀도, 아이라이너는 진갈색',
      cheek: '브라운 계열 블러셔로 음영 효과',
      tip: '깊고 따뜻하게! 핑크색은 피하세요',
    },
    easyFashion: {
      colors: ['갈색', '카키', '겨자색', '오렌지', '와인색'],
      avoid: ['핑크', '하늘색', '연보라'],
      style: '차분하고 고급스러운 느낌, 가죽이나 니트 소재',
      tip: '갈색 계열 옷이 얼굴을 건강하게 보여줘요',
    },
    easyAccessory: {
      metal: '금색 계열 (골드, 앤틱골드)',
      examples: ['골드 귀걸이', '가죽 팔찌', '호피 무늬 스카프'],
    },
  },
  winter: {
    imageKeywords: ['도회적인', '시크한', '선명한', '강렬한', '모던한'],
    makeupStyle:
      '버건디, 와인, 트루레드 같은 선명한 컬러가 잘 어울려요. 깔끔한 아이라인과 볼드한 립으로 강렬함을 연출해보세요.',
    fashionStyle:
      '블랙, 화이트, 네이비 같은 모노톤이 잘 어울려요. 샤프한 실루엣과 미니멀한 디자인으로 시크하게 연출해보세요.',
    accessories:
      '실버, 플래티넘 액세서리가 쿨한 피부톤과 잘 맞아요. 다이아몬드나 크리스탈처럼 빛나는 소재도 추천해요.',
    easyMakeup: {
      lip: '진한 와인색이나 빨간색 립 (레드와인, 체리 느낌)',
      eye: '검정 아이라이너로 눈매를 또렷하게',
      cheek: '분홍 블러셔를 살짝만 (립이 포인트니까)',
      tip: '립이 진하면 눈은 가볍게! 둘 다 진하면 촌스러워요',
    },
    easyFashion: {
      colors: ['검정', '흰색', '남색', '빨간색', '진분홍'],
      avoid: ['베이지', '카키', '살구색'],
      style: '깔끔하고 세련된 느낌, 무채색 위주',
      tip: '검정 옷에 빨간 립 하나면 완벽한 스타일!',
    },
    easyAccessory: {
      metal: '은색 계열 (실버, 플래티넘)',
      examples: ['실버 목걸이', '큐빅 귀걸이', '메탈 시계'],
    },
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

// AI 인사이트 목록 (초보자 친화 버전)
const INSIGHTS: Record<SeasonType, string[]> = {
  spring: [
    '복숭아색, 살구색처럼 따뜻하고 밝은 색이 당신 피부를 환하게 만들어줘요!',
    '밝은 색 옷을 입으면 얼굴이 화사해 보여요. 분홍이나 연노랑 추천!',
    '살구색 립 하나면 건강하고 생기있어 보여요.',
  ],
  summer: [
    '하늘색, 연보라색처럼 시원한 파스텔 톤이 당신을 우아하게 만들어줘요!',
    '부드러운 분홍이나 라벤더색 옷이 피부를 맑아 보이게 해요.',
    '장미색 립이 당신에게 딱 어울려요!',
  ],
  autumn: [
    '갈색, 카키색처럼 차분한 색이 당신 피부를 건강하게 보이게 해요!',
    '니트나 가죽 재질의 갈색 옷이 세련되어 보여요.',
    '금색 액세서리와 함께 하면 더욱 빛나요!',
  ],
  winter: [
    '검정, 흰색, 빨간색처럼 선명한 색이 당신의 세련된 매력을 살려줘요!',
    '검정 옷에 빨간 립 하나면 완벽한 스타일이에요!',
    '은색 액세서리가 잘 어울려요. 실버 귀걸이 추천!',
  ],
};

// 초보자 친화 인사이트 목록 (Hybrid 데이터용 export)
export const EASY_INSIGHTS: Record<SeasonType, EasyInsight[]> = {
  spring: [
    {
      summary: '봄처럼 화사하고 생기있는 컬러가 당신의 피부를 더욱 밝게 만들어줘요!',
      easyExplanation:
        '복숭아색, 살구색처럼 따뜻하고 밝은 색이 잘 어울려요. 이런 색을 입거나 바르면 얼굴이 환해 보여요.',
      actionTip: '오늘 살구색 립 하나 발라보세요!',
    },
  ],
  summer: [
    {
      summary: '부드럽고 우아한 컬러가 당신의 피부톤을 더욱 고급스럽게 만들어줘요!',
      easyExplanation:
        '하늘색, 연보라색처럼 시원하고 부드러운 색이 잘 어울려요. 파스텔 톤이 피부를 맑아 보이게 해요.',
      actionTip: '연분홍 립이나 라벤더 옷을 입어보세요!',
    },
  ],
  autumn: [
    {
      summary: '따뜻하고 깊이있는 컬러가 당신의 피부를 건강하게 보이게 해요!',
      easyExplanation:
        '갈색, 카키색처럼 차분하고 깊은 색이 잘 어울려요. 가을 느낌의 색이 얼굴을 건강해 보이게 해요.',
      actionTip: '갈색 계열 옷이나 브릭 레드 립을 시도해보세요!',
    },
  ],
  winter: [
    {
      summary: '선명하고 강렬한 컬러가 당신의 도회적인 매력을 극대화해요!',
      easyExplanation:
        '검정, 흰색, 빨간색처럼 확 튀는 색이 잘 어울려요. 파스텔보다 진한 색이 얼굴을 살려줘요.',
      actionTip: '검정 옷에 빨간 립 하나면 완벽한 스타일!',
    },
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
const generateClothingRecommendations = (seasonType: SeasonType): ClothingRecommendation[] => {
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
  const easyInsights = EASY_INSIGHTS[seasonType];

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
    foundationRecommendations: FOUNDATION_RECOMMENDATIONS[seasonType],
    clothingRecommendations: generateClothingRecommendations(seasonType),
    styleDescription: STYLE_DESCRIPTIONS[seasonType],
    insight: insights[Math.floor(Math.random() * insights.length)],
    easyInsight: easyInsights[Math.floor(Math.random() * easyInsights.length)],
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
