/**
 * 퍼스널 컬러 기반 코디 색상 추천 시스템
 *
 * Week 6: C-1 퍼스널 컬러 통합
 * - 퍼스널 컬러 시즌별 상/하의 색상 추천
 * - 체형별 최적 색상 조합
 * - 악세서리 추천
 */

import type { BodyType, BodyType3 } from "./mock/body-analysis";

/**
 * 퍼스널 컬러 시즌 타입
 */
export type PersonalColorSeason = "Spring" | "Summer" | "Autumn" | "Winter";

/**
 * 색상 조합
 */
export interface ColorCombination {
  top: string;
  bottom: string;
}

/**
 * 코디 색상 추천 결과
 */
export interface ColorRecommendations {
  topColors: string[];
  bottomColors: string[];
  avoidColors: string[];
  bestCombinations: ColorCombination[];
  accessories: string[];
}

/**
 * 퍼스널 컬러별 색상 팔레트
 */
const COLOR_PALETTES: Record<PersonalColorSeason, {
  tops: string[];
  bottoms: string[];
  avoid: string[];
  accessories: string[];
}> = {
  Spring: {
    tops: ["코랄", "피치", "살몬핑크", "아이보리", "밝은 오렌지", "민트그린"],
    bottoms: ["베이지", "카키", "라이트 브라운", "크림", "화이트"],
    avoid: ["블랙", "다크 네이비", "버건디", "차가운 그레이"],
    accessories: ["골드 주얼리", "브라운 가죽", "코랄 스카프", "베이지 벨트"],
  },
  Summer: {
    tops: ["라벤더", "로즈핑크", "스카이블루", "민트", "라이트 그레이", "소프트 화이트"],
    bottoms: ["라이트 그레이", "소프트 네이비", "로즈 베이지", "라벤더 그레이"],
    avoid: ["오렌지", "머스타드", "테라코타", "브라운"],
    accessories: ["실버 주얼리", "파스텔 스카프", "그레이 가죽", "진주"],
  },
  Autumn: {
    tops: ["테라코타", "머스타드", "올리브", "버건디", "캐멀", "브릭레드"],
    bottoms: ["다크 브라운", "카키", "올리브그린", "버건디", "네이비"],
    avoid: ["핑크", "퓨시아", "밝은 파스텔", "네온 컬러"],
    accessories: ["골드 주얼리", "브라운 가죽", "테라코타 스카프", "거북이 등 무늬"],
  },
  Winter: {
    tops: ["퓨어 화이트", "블랙", "로얄 블루", "에메랄드", "핫핑크", "버건디"],
    bottoms: ["블랙", "다크 네이비", "차콜", "퓨어 화이트"],
    avoid: ["베이지", "머스타드", "살몬", "오렌지"],
    accessories: ["실버 주얼리", "블랙 가죽", "화이트 진주", "비비드 스카프"],
  },
};

/**
 * 체형별 권장 색상 배치 전략 (8타입 - 레거시)
 */
const BODY_TYPE_COLOR_STRATEGY: Record<BodyType, {
  topPriority: "light" | "dark" | "balanced";
  bottomPriority: "light" | "dark" | "balanced";
  tips: string[];
}> = {
  X: {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: ["균형 잡힌 체형이므로 대부분의 색상 조합이 잘 어울려요"],
  },
  A: {
    topPriority: "light",
    bottomPriority: "dark",
    tips: ["상의에 밝은 색, 하의에 어두운 색으로 시선을 위로 모아요"],
  },
  V: {
    topPriority: "dark",
    bottomPriority: "light",
    tips: ["상의에 어두운 색, 하의에 밝은 색으로 균형을 맞춰요"],
  },
  H: {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: ["대비가 있는 색상으로 허리 라인을 강조해요"],
  },
  O: {
    topPriority: "dark",
    bottomPriority: "dark",
    tips: ["어두운 톤으로 슬림해 보이는 효과를 줘요", "세로 라인 강조"],
  },
  I: {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: ["다양한 색상을 활용해 볼륨감을 더해요"],
  },
  Y: {
    topPriority: "dark",
    bottomPriority: "light",
    tips: ["상의에 차분한 색, 하의에 밝은 색으로 균형을 맞춰요"],
  },
  "8": {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: ["단색 코디로 실루엣을 강조해요", "허리 벨트로 포인트"],
  },
};

/**
 * 3타입 체형별 권장 색상 배치 전략
 */
const BODY_TYPE_3_COLOR_STRATEGY: Record<BodyType3, {
  topPriority: "light" | "dark" | "balanced";
  bottomPriority: "light" | "dark" | "balanced";
  tips: string[];
}> = {
  S: {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: [
      "I라인 실루엣을 위해 상하의 톤을 맞춰보세요",
      "단색 코디가 깔끔해요",
    ],
  },
  W: {
    topPriority: "light",
    bottomPriority: "dark",
    tips: [
      "상의는 밝게, 하의는 어둡게 해서 X라인을 강조해요",
      "허리에 포인트 컬러를 줘보세요",
    ],
  },
  N: {
    topPriority: "balanced",
    bottomPriority: "balanced",
    tips: [
      "자연스러운 어스톤 계열이 잘 어울려요",
      "레이어드로 색상을 다양하게 활용해보세요",
    ],
  },
};

/**
 * 체형 + 퍼스널 컬러 조합별 코디 예시
 */
export interface OutfitExample {
  title: string; // 코디 이름
  items: string[]; // 아이템 목록
  occasion: string; // 상황 (출근룩, 데일리룩 등)
}

export const OUTFIT_EXAMPLES: Record<BodyType3, Record<PersonalColorSeason, OutfitExample[]>> = {
  S: {
    Spring: [
      {
        title: "깔끔한 오피스룩",
        items: ["아이보리 V넥 니트", "베이지 스트레이트 슬랙스", "코랄 포인트 스카프"],
        occasion: "출근룩",
      },
      {
        title: "세련된 데일리룩",
        items: ["피치 셔츠", "크림 와이드 팬츠", "골드 체인 목걸이"],
        occasion: "일상",
      },
    ],
    Summer: [
      {
        title: "시원한 오피스룩",
        items: ["라벤더 블라우스", "라이트 그레이 슬랙스", "실버 이어링"],
        occasion: "출근룩",
      },
      {
        title: "로맨틱 데일리룩",
        items: ["로즈핑크 니트", "소프트 네이비 팬츠", "진주 귀걸이"],
        occasion: "일상",
      },
    ],
    Autumn: [
      {
        title: "클래식 오피스룩",
        items: ["캐멀 테일러드 재킷", "다크 브라운 팬츠", "골드 버클 벨트"],
        occasion: "출근룩",
      },
      {
        title: "따뜻한 가을룩",
        items: ["버건디 터틀넥", "올리브 치노 팬츠", "브라운 가죽 시계"],
        occasion: "일상",
      },
    ],
    Winter: [
      {
        title: "시크한 오피스룩",
        items: ["블랙 테일러드 재킷", "차콜 슬랙스", "실버 커프스"],
        occasion: "출근룩",
      },
      {
        title: "모던 데일리룩",
        items: ["퓨어 화이트 셔츠", "다크 네이비 팬츠", "블랙 가죽 벨트"],
        occasion: "일상",
      },
    ],
  },
  W: {
    Spring: [
      {
        title: "여성스러운 오피스룩",
        items: ["코랄 페플럼 블라우스", "크림 하이웨이스트 팬츠", "골드 팔찌"],
        occasion: "출근룩",
      },
      {
        title: "화사한 데이트룩",
        items: ["피치 프릴 블라우스", "베이지 A라인 스커트", "코랄 립스틱"],
        occasion: "데이트",
      },
    ],
    Summer: [
      {
        title: "로맨틱 오피스룩",
        items: ["라벤더 셔링 블라우스", "로즈베이지 플레어 스커트", "진주 목걸이"],
        occasion: "출근룩",
      },
      {
        title: "상큼한 데일리룩",
        items: ["민트 크롭 가디건", "라이트 그레이 하이웨이스트 팬츠", "실버 귀걸이"],
        occasion: "일상",
      },
    ],
    Autumn: [
      {
        title: "우아한 오피스룩",
        items: ["테라코타 랩 블라우스", "버건디 플레어 스커트", "골드 귀걸이"],
        occasion: "출근룩",
      },
      {
        title: "가을 데이트룩",
        items: ["머스타드 카디건", "다크 브라운 하이웨이스트 팬츠", "브라운 벨트"],
        occasion: "데이트",
      },
    ],
    Winter: [
      {
        title: "세련된 오피스룩",
        items: ["로얄 블루 랩 블라우스", "블랙 하이웨이스트 스커트", "실버 브로치"],
        occasion: "출근룩",
      },
      {
        title: "시크한 데이트룩",
        items: ["핫핑크 니트", "다크 네이비 A라인 스커트", "화이트 진주 귀걸이"],
        occasion: "데이트",
      },
    ],
  },
  N: {
    Spring: [
      {
        title: "캐주얼 오피스룩",
        items: ["아이보리 오버사이즈 셔츠", "카키 와이드 팬츠", "베이지 토트백"],
        occasion: "출근룩",
      },
      {
        title: "편안한 주말룩",
        items: ["코랄 맨투맨", "라이트 브라운 조거 팬츠", "골드 링 귀걸이"],
        occasion: "주말",
      },
    ],
    Summer: [
      {
        title: "시원한 캐주얼룩",
        items: ["스카이블루 오버핏 셔츠", "라이트 그레이 린넨 팬츠", "실버 뱅글"],
        occasion: "출근룩",
      },
      {
        title: "레이어드 데일리룩",
        items: ["민트 카디건", "소프트 화이트 티", "라벤더 와이드 팬츠"],
        occasion: "일상",
      },
    ],
    Autumn: [
      {
        title: "내추럴 오피스룩",
        items: ["올리브 오버사이즈 재킷", "다크 브라운 와이드 팬츠", "거북이 무늬 선글라스"],
        occasion: "출근룩",
      },
      {
        title: "따뜻한 레이어드룩",
        items: ["캐멀 롱 코트", "테라코타 니트", "카키 조거 팬츠"],
        occasion: "일상",
      },
    ],
    Winter: [
      {
        title: "모던 캐주얼룩",
        items: ["블랙 오버사이즈 코트", "차콜 와이드 팬츠", "퓨어 화이트 터틀넥"],
        occasion: "출근룩",
      },
      {
        title: "시크한 주말룩",
        items: ["다크 네이비 롱 패딩", "에메랄드 니트", "블랙 스트레이트 진"],
        occasion: "주말",
      },
    ],
  },
};

/**
 * 밝기에 따라 색상 필터링
 */
function filterColorsByBrightness(
  colors: string[],
  priority: "light" | "dark" | "balanced"
): string[] {
  // 밝은 색상 키워드
  const lightKeywords = ["라이트", "파스텔", "화이트", "아이보리", "크림", "밝은", "소프트"];
  // 어두운 색상 키워드
  const darkKeywords = ["다크", "블랙", "네이비", "차콜", "버건디", "딥"];

  if (priority === "balanced") {
    return colors;
  }

  const isLight = (color: string) =>
    lightKeywords.some((k) => color.includes(k));
  const isDark = (color: string) =>
    darkKeywords.some((k) => color.includes(k));

  if (priority === "light") {
    // 밝은 색상 우선, 없으면 중간톤 포함
    const lightColors = colors.filter(isLight);
    const neutralColors = colors.filter((c) => !isLight(c) && !isDark(c));
    return lightColors.length > 0 ? [...lightColors, ...neutralColors.slice(0, 2)] : colors;
  }

  // dark priority
  const darkColors = colors.filter(isDark);
  const neutralColors = colors.filter((c) => !isLight(c) && !isDark(c));
  return darkColors.length > 0 ? [...darkColors, ...neutralColors.slice(0, 2)] : colors;
}

/**
 * 최적의 색상 조합 생성
 */
function generateBestCombinations(
  topColors: string[],
  bottomColors: string[]
): ColorCombination[] {
  const combinations: ColorCombination[] = [];

  // 최대 5개 조합 생성
  const maxCombinations = Math.min(5, topColors.length, bottomColors.length);

  for (let i = 0; i < maxCombinations; i++) {
    combinations.push({
      top: topColors[i % topColors.length],
      bottom: bottomColors[i % bottomColors.length],
    });
  }

  return combinations;
}

/**
 * 퍼스널 컬러 + 체형 기반 코디 색상 추천 생성
 *
 * @param season - 퍼스널 컬러 시즌
 * @param bodyType - 체형 타입 (선택)
 * @returns 코디 색상 추천
 */
export function generateColorRecommendations(
  season: PersonalColorSeason | string | null,
  bodyType?: BodyType | string | null
): ColorRecommendations | null {
  // 퍼스널 컬러가 없으면 null 반환
  if (!season || !COLOR_PALETTES[season as PersonalColorSeason]) {
    return null;
  }

  const palette = COLOR_PALETTES[season as PersonalColorSeason];
  const strategy = bodyType
    ? BODY_TYPE_COLOR_STRATEGY[bodyType as BodyType]
    : null;

  // 체형에 맞게 색상 필터링
  const topColors = strategy
    ? filterColorsByBrightness(palette.tops, strategy.topPriority)
    : palette.tops;

  const bottomColors = strategy
    ? filterColorsByBrightness(palette.bottoms, strategy.bottomPriority)
    : palette.bottoms;

  // 최적 조합 생성
  const bestCombinations = generateBestCombinations(topColors, bottomColors);

  return {
    topColors,
    bottomColors,
    avoidColors: palette.avoid,
    bestCombinations,
    accessories: palette.accessories,
  };
}

/**
 * 체형별 색상 팁 조회 (8타입 + 3타입 지원)
 */
export function getColorTipsForBodyType(bodyType: BodyType | BodyType3 | string): string[] {
  // 3타입인지 확인
  if (bodyType === "S" || bodyType === "W" || bodyType === "N") {
    return BODY_TYPE_3_COLOR_STRATEGY[bodyType as BodyType3]?.tips || [];
  }
  const strategy = BODY_TYPE_COLOR_STRATEGY[bodyType as BodyType];
  return strategy?.tips || [];
}

/**
 * 체형 + 퍼스널 컬러 조합별 코디 예시 조회
 */
export function getOutfitExamples(
  bodyType: BodyType3 | string,
  season: PersonalColorSeason | string | null
): OutfitExample[] {
  if (!season) return [];

  // 3타입으로 변환 (8타입인 경우)
  let type3: BodyType3;
  if (bodyType === "S" || bodyType === "W" || bodyType === "N") {
    type3 = bodyType as BodyType3;
  } else {
    // 8타입 → 3타입 매핑
    const mapping: Record<string, BodyType3> = {
      X: "S", V: "S", Y: "S",
      A: "W", "8": "W", O: "W",
      H: "N", I: "N",
    };
    type3 = mapping[bodyType] || "S";
  }

  const seasonKey = season as PersonalColorSeason;
  return OUTFIT_EXAMPLES[type3]?.[seasonKey] || [];
}
