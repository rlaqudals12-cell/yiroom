/**
 * 퍼스널 컬러 기반 코디 색상 추천 시스템
 *
 * Week 6: C-1 퍼스널 컬러 통합
 * - 퍼스널 컬러 시즌별 상/하의 색상 추천
 * - 체형별 최적 색상 조합
 * - 악세서리 추천
 */

import type { BodyType } from "./mock/body-analysis";

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
 * 체형별 권장 색상 배치 전략
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
 * 체형별 색상 팁 조회
 */
export function getColorTipsForBodyType(bodyType: BodyType | string): string[] {
  const strategy = BODY_TYPE_COLOR_STRATEGY[bodyType as BodyType];
  return strategy?.tips || [];
}
