/**
 * 제품 추천 시스템
 *
 * Week 6: 제품 추천 강화
 * - 피부 타입별 기초 제품 추천
 * - 고민별 특화 제품
 * - 스텝별 루틴 (5-7단계)
 * - 퍼스널 컬러 기반 메이크업 제품
 */

import type { SkinType } from "./ingredients";

/**
 * 제품 카테고리
 */
export type ProductCategory =
  | "cleanser" // 클렌저
  | "toner" // 토너
  | "serum" // 세럼/에센스
  | "moisturizer" // 수분크림
  | "sunscreen" // 선크림
  | "mask" // 마스크팩
  | "exfoliator" // 각질 제거
  | "eye_cream" // 아이크림
  | "foundation" // 파운데이션
  | "lipstick" // 립스틱
  | "blush"; // 블러셔

/**
 * 제품 정보
 */
export interface Product {
  name: string;
  category: ProductCategory;
  description: string;
  keyIngredients: string[];
  suitableFor: SkinType[];
  avoidFor?: SkinType[];
  priceRange: "budget" | "mid" | "premium";
}

/**
 * 스텝별 루틴 제품
 */
export interface RoutineStep {
  step: number;
  category: ProductCategory;
  categoryLabel: string;
  products: string[];
  tip: string;
}

/**
 * 스킨케어 루틴 (아침/저녁)
 */
export interface SkincareRoutine {
  morning: string;
  evening: string;
}

/**
 * 주간 케어 + 라이프스타일 팁
 */
export interface CareTips {
  weeklyCare: string[];
  lifestyleTips: string[];
}

/**
 * 제품 추천 결과
 */
export interface ProductRecommendations {
  routine: RoutineStep[];
  specialCare: Product[];
  makeupRecommendations?: MakeupRecommendation[];
  skincareRoutine: SkincareRoutine;
  careTips: CareTips;
}

/**
 * 메이크업 추천 (퍼스널 컬러 기반)
 */
export interface MakeupRecommendation {
  category: "foundation" | "lipstick" | "blush" | "eyeshadow";
  categoryLabel: string;
  recommendations: string[];
  colorTone: string;
}

/**
 * 피부 타입별 기초 제품 데이터베이스
 */
const ROUTINE_BY_SKIN_TYPE: Record<SkinType, RoutineStep[]> = {
  dry: [
    {
      step: 1,
      category: "cleanser",
      categoryLabel: "클렌저",
      products: ["밀크 클렌저", "클렌징 오일", "저자극 폼 클렌저"],
      tip: "거품을 충분히 내어 부드럽게 세안하세요",
    },
    {
      step: 2,
      category: "toner",
      categoryLabel: "토너",
      products: ["고보습 토너", "히알루론산 토너", "무알콜 토너"],
      tip: "화장솜보다 손바닥으로 가볍게 두드려 흡수시키세요",
    },
    {
      step: 3,
      category: "serum",
      categoryLabel: "세럼",
      products: ["히알루론산 세럼", "세라마이드 앰플", "스쿠알란 오일"],
      tip: "2-3방울을 얼굴 전체에 골고루 펴 발라주세요",
    },
    {
      step: 4,
      category: "moisturizer",
      categoryLabel: "수분크림",
      products: ["리치 크림", "배리어 크림", "세라마이드 크림"],
      tip: "넉넉하게 발라 피부 장벽을 보호해주세요",
    },
    {
      step: 5,
      category: "sunscreen",
      categoryLabel: "선크림",
      products: ["촉촉한 선크림", "무기자차 선크림", "선에센스"],
      tip: "외출 30분 전에 충분히 발라주세요",
    },
  ],
  oily: [
    {
      step: 1,
      category: "cleanser",
      categoryLabel: "클렌저",
      products: ["젤 클렌저", "폼 클렌저", "약산성 클렌저"],
      tip: "T존 위주로 꼼꼼하게 세안해주세요",
    },
    {
      step: 2,
      category: "toner",
      categoryLabel: "토너",
      products: ["BHA 토너", "피지 조절 토너", "모공 케어 토너"],
      tip: "화장솜에 묻혀 닦아내듯이 사용하세요",
    },
    {
      step: 3,
      category: "serum",
      categoryLabel: "세럼",
      products: ["나이아신아마이드 세럼", "비타민C 세럼", "워터 에센스"],
      tip: "가벼운 제형을 선택해 끈적임 없이 흡수시키세요",
    },
    {
      step: 4,
      category: "moisturizer",
      categoryLabel: "수분크림",
      products: ["젤 크림", "오일프리 로션", "수분 젤"],
      tip: "가볍게 발라 유수분 밸런스를 맞춰주세요",
    },
    {
      step: 5,
      category: "sunscreen",
      categoryLabel: "선크림",
      products: ["무기자차 선크림", "매트 선크림", "선 파우더"],
      tip: "매트한 제형으로 피지 조절 효과까지 챙기세요",
    },
  ],
  sensitive: [
    {
      step: 1,
      category: "cleanser",
      categoryLabel: "클렌저",
      products: ["저자극 클렌저", "센텔라 클렌저", "마일드 폼"],
      tip: "미온수로 부드럽게 세안하세요",
    },
    {
      step: 2,
      category: "toner",
      categoryLabel: "토너",
      products: ["진정 토너", "센텔라 토너", "병풀 추출물 토너"],
      tip: "알코올 프리 제품으로 자극 없이 케어하세요",
    },
    {
      step: 3,
      category: "serum",
      categoryLabel: "세럼",
      products: ["센텔라 앰플", "판테놀 세럼", "마데카소사이드 앰플"],
      tip: "진정 성분으로 피부를 달래주세요",
    },
    {
      step: 4,
      category: "moisturizer",
      categoryLabel: "수분크림",
      products: ["저자극 크림", "리페어 크림", "진정 크림"],
      tip: "향료, 색소가 없는 순한 제품을 선택하세요",
    },
    {
      step: 5,
      category: "sunscreen",
      categoryLabel: "선크림",
      products: ["물리적 선크림", "무기자차 선크림", "저자극 선크림"],
      tip: "화학 성분이 적은 물리적 자외선 차단제를 권장해요",
    },
  ],
  combination: [
    {
      step: 1,
      category: "cleanser",
      categoryLabel: "클렌저",
      products: ["밸런싱 클렌저", "젤 클렌저", "약산성 폼"],
      tip: "T존과 U존을 나눠서 세안 강도를 조절하세요",
    },
    {
      step: 2,
      category: "toner",
      categoryLabel: "토너",
      products: ["밸런싱 토너", "AHA/BHA 토너", "수분 토너"],
      tip: "T존은 닦아내고, U존은 두드려 흡수시키세요",
    },
    {
      step: 3,
      category: "serum",
      categoryLabel: "세럼",
      products: ["나이아신아마이드 세럼", "히알루론산 세럼", "멀티 에센스"],
      tip: "부위별로 다른 세럼을 사용해도 좋아요",
    },
    {
      step: 4,
      category: "moisturizer",
      categoryLabel: "수분크림",
      products: ["밸런싱 크림", "수분 젤크림", "라이트 로션"],
      tip: "T존은 가볍게, U존은 충분히 발라주세요",
    },
    {
      step: 5,
      category: "sunscreen",
      categoryLabel: "선크림",
      products: ["밸런싱 선크림", "톤업 선크림", "산뜻한 선크림"],
      tip: "끈적이지 않으면서 촉촉함을 유지하는 제품을 선택하세요",
    },
  ],
  normal: [
    {
      step: 1,
      category: "cleanser",
      categoryLabel: "클렌저",
      products: ["폼 클렌저", "젤 클렌저", "클렌징 워터"],
      tip: "취향에 맞는 제형을 자유롭게 선택하세요",
    },
    {
      step: 2,
      category: "toner",
      categoryLabel: "토너",
      products: ["수분 토너", "비타민 토너", "기초 토너"],
      tip: "기본 수분 공급으로 피부를 준비해주세요",
    },
    {
      step: 3,
      category: "serum",
      categoryLabel: "세럼",
      products: ["비타민C 세럼", "항산화 세럼", "펩타이드 에센스"],
      tip: "안티에이징이나 미백 등 목적에 맞게 선택하세요",
    },
    {
      step: 4,
      category: "moisturizer",
      categoryLabel: "수분크림",
      products: ["수분크림", "영양크림", "멀티 크림"],
      tip: "계절에 따라 제형을 조절해주세요",
    },
    {
      step: 5,
      category: "sunscreen",
      categoryLabel: "선크림",
      products: ["톤업 선크림", "데일리 선크림", "선에센스"],
      tip: "SPF50+/PA++++로 자외선을 확실히 차단하세요",
    },
  ],
};

/**
 * 피부 고민별 특화 제품
 */
interface ConcernProduct {
  concern: string;
  concernLabel: string;
  products: Product[];
}

const CONCERN_PRODUCTS: ConcernProduct[] = [
  {
    concern: "hydration",
    concernLabel: "수분 부족",
    products: [
      {
        name: "히알루론산 앰플",
        category: "serum",
        description: "강력한 수분 충전으로 촉촉한 피부",
        keyIngredients: ["히알루론산", "판테놀", "베타글루칸"],
        suitableFor: ["dry", "normal", "combination"],
        priceRange: "mid",
      },
      {
        name: "수분 폭탄 마스크팩",
        category: "mask",
        description: "집중 수분 케어 시트 마스크",
        keyIngredients: ["히알루론산", "알로에"],
        suitableFor: ["dry", "normal", "sensitive", "combination"],
        priceRange: "budget",
      },
    ],
  },
  {
    concern: "oil",
    concernLabel: "과다 유분",
    products: [
      {
        name: "피지 컨트롤 세럼",
        category: "serum",
        description: "피지 조절 및 모공 케어",
        keyIngredients: ["나이아신아마이드", "아연"],
        suitableFor: ["oily", "combination"],
        avoidFor: ["dry"],
        priceRange: "mid",
      },
      {
        name: "클레이 마스크",
        category: "mask",
        description: "모공 속 노폐물 제거",
        keyIngredients: ["카올린", "벤토나이트"],
        suitableFor: ["oily", "combination", "normal"],
        avoidFor: ["dry", "sensitive"],
        priceRange: "budget",
      },
    ],
  },
  {
    concern: "pigmentation",
    concernLabel: "색소침착",
    products: [
      {
        name: "비타민C 세럼",
        category: "serum",
        description: "기미, 잡티 개선 및 피부 톤 정돈",
        keyIngredients: ["비타민C", "나이아신아마이드"],
        suitableFor: ["dry", "oily", "normal", "combination"],
        avoidFor: ["sensitive"],
        priceRange: "mid",
      },
      {
        name: "알부틴 크림",
        category: "moisturizer",
        description: "멜라닌 생성 억제",
        keyIngredients: ["알부틴", "트라넥삼산"],
        suitableFor: ["dry", "normal", "combination", "sensitive"],
        priceRange: "premium",
      },
    ],
  },
  {
    concern: "wrinkles",
    concernLabel: "주름/탄력",
    products: [
      {
        name: "레티놀 세럼",
        category: "serum",
        description: "주름 개선 및 피부 재생",
        keyIngredients: ["레티놀", "펩타이드"],
        suitableFor: ["dry", "normal", "oily", "combination"],
        avoidFor: ["sensitive"],
        priceRange: "premium",
      },
      {
        name: "펩타이드 아이크림",
        category: "eye_cream",
        description: "눈가 주름 및 탄력 케어",
        keyIngredients: ["펩타이드", "콜라겐"],
        suitableFor: ["dry", "normal", "oily", "combination", "sensitive"],
        priceRange: "mid",
      },
    ],
  },
  {
    concern: "pores",
    concernLabel: "모공",
    products: [
      {
        name: "BHA 토너",
        category: "toner",
        description: "모공 속 노폐물 제거",
        keyIngredients: ["살리실산", "티트리"],
        suitableFor: ["oily", "combination", "normal"],
        avoidFor: ["dry", "sensitive"],
        priceRange: "mid",
      },
      {
        name: "모공 축소 세럼",
        category: "serum",
        description: "모공 타이트닝 효과",
        keyIngredients: ["나이아신아마이드", "아하/비에이치에이"],
        suitableFor: ["oily", "combination", "normal"],
        priceRange: "mid",
      },
    ],
  },
  {
    concern: "trouble",
    concernLabel: "트러블",
    products: [
      {
        name: "트러블 스팟",
        category: "serum",
        description: "국소 트러블 진정",
        keyIngredients: ["티트리", "살리실산", "유황"],
        suitableFor: ["oily", "combination", "normal"],
        priceRange: "budget",
      },
      {
        name: "진정 앰플",
        category: "serum",
        description: "전체적인 피부 진정",
        keyIngredients: ["센텔라", "판테놀", "알로에"],
        suitableFor: ["sensitive", "oily", "combination", "normal", "dry"],
        priceRange: "mid",
      },
    ],
  },
];

/**
 * 피부 타입별 스킨케어 루틴 (아침/저녁)
 */
const SKINCARE_ROUTINE_BY_TYPE: Record<SkinType, SkincareRoutine> = {
  dry: {
    morning: "세안 → 토너 → 세럼 → 수분크림 → 선크림",
    evening: "클렌징 오일 → 세안 → 토너 → 세럼 → 아이크림 → 리치 크림",
  },
  oily: {
    morning: "세안 → 토너 → 가벼운 세럼 → 젤크림 → 선크림",
    evening: "클렌징 → 세안 → 토너 → 세럼 → 오일프리 로션",
  },
  sensitive: {
    morning: "저자극 세안 → 진정 토너 → 진정 세럼 → 순한 크림 → 물리 선크림",
    evening: "저자극 클렌징 → 미온수 세안 → 진정 토너 → 진정 앰플 → 리페어 크림",
  },
  combination: {
    morning: "세안 → 밸런싱 토너 → 세럼 → 젤크림(T존) + 수분크림(U존) → 선크림",
    evening: "클렌징 → 세안 → 토너 → 세럼 → 아이크림 → 부위별 크림",
  },
  normal: {
    morning: "세안 → 토너 → 세럼 → 수분크림 → 선크림",
    evening: "클렌징 → 세안 → 토너 → 세럼 → 아이크림 → 수분크림",
  },
};

/**
 * 피부 타입별 주간 케어 + 라이프스타일 팁
 */
const CARE_TIPS_BY_TYPE: Record<SkinType, CareTips> = {
  dry: {
    weeklyCare: [
      "주 1회 순한 각질 케어 (효소 각질제거제)",
      "주 2-3회 수분 시트 마스크",
      "주 1회 오일 마사지",
    ],
    lifestyleTips: [
      "물 2L 이상 섭취",
      "가습기 사용으로 습도 유지",
      "뜨거운 물 세안 피하기",
      "7시간 이상 수면",
    ],
  },
  oily: {
    weeklyCare: [
      "주 1-2회 클레이 마스크",
      "주 2회 BHA 각질 케어",
      "주 1회 모공 팩",
    ],
    lifestyleTips: [
      "기름진 음식 줄이기",
      "충분한 수분 섭취",
      "세안 후 즉시 보습",
      "스트레스 관리",
    ],
  },
  sensitive: {
    weeklyCare: [
      "주 1회 진정 마스크팩",
      "자극 성분 패치 테스트 필수",
      "새 제품은 소량부터 테스트",
    ],
    lifestyleTips: [
      "자극적인 음식 피하기",
      "온도 변화 최소화",
      "손으로 얼굴 만지지 않기",
      "충분한 수면",
    ],
  },
  combination: {
    weeklyCare: [
      "주 1회 T존 클레이 마스크",
      "주 1-2회 U존 수분 마스크",
      "주 1회 가벼운 각질 케어",
    ],
    lifestyleTips: [
      "부위별 맞춤 케어",
      "균형 잡힌 식단",
      "물 충분히 섭취",
      "규칙적인 수면",
    ],
  },
  normal: {
    weeklyCare: [
      "주 1-2회 각질 케어",
      "주 2-3회 시트 마스크",
      "주 1회 영양 마스크",
    ],
    lifestyleTips: [
      "물 2L 이상 섭취",
      "7시간 이상 수면",
      "자외선 차단 철저히",
      "현재 루틴 유지",
    ],
  },
};

/**
 * 퍼스널 컬러별 메이크업 추천
 */
const MAKEUP_BY_SEASON: Record<string, MakeupRecommendation[]> = {
  Spring: [
    {
      category: "foundation",
      categoryLabel: "파운데이션",
      recommendations: ["피치 베이지", "골드 베이지", "아이보리"],
      colorTone: "웜톤 밝은 계열",
    },
    {
      category: "lipstick",
      categoryLabel: "립스틱",
      recommendations: ["코랄핑크", "피치코랄", "오렌지레드"],
      colorTone: "밝고 화사한 웜톤",
    },
    {
      category: "blush",
      categoryLabel: "블러셔",
      recommendations: ["피치", "코랄", "살몬"],
      colorTone: "따뜻하고 생기있는 컬러",
    },
    {
      category: "eyeshadow",
      categoryLabel: "아이섀도",
      recommendations: ["피치브라운", "코랄골드", "오렌지베이지"],
      colorTone: "따뜻한 파스텔 계열",
    },
  ],
  Summer: [
    {
      category: "foundation",
      categoryLabel: "파운데이션",
      recommendations: ["핑크 베이지", "로즈 베이지", "라이트 핑크"],
      colorTone: "쿨톤 밝은 계열",
    },
    {
      category: "lipstick",
      categoryLabel: "립스틱",
      recommendations: ["로즈핑크", "라벤더핑크", "베리"],
      colorTone: "부드럽고 우아한 쿨톤",
    },
    {
      category: "blush",
      categoryLabel: "블러셔",
      recommendations: ["로즈", "라벤더핑크", "라이트핑크"],
      colorTone: "은은하고 차분한 컬러",
    },
    {
      category: "eyeshadow",
      categoryLabel: "아이섀도",
      recommendations: ["핑크브라운", "그레이", "라벤더"],
      colorTone: "쿨톤 뮤트 계열",
    },
  ],
  Autumn: [
    {
      category: "foundation",
      categoryLabel: "파운데이션",
      recommendations: ["옐로우 베이지", "카멜 베이지", "허니"],
      colorTone: "웜톤 깊은 계열",
    },
    {
      category: "lipstick",
      categoryLabel: "립스틱",
      recommendations: ["테라코타", "머스타드레드", "브라운레드"],
      colorTone: "깊고 따뜻한 웜톤",
    },
    {
      category: "blush",
      categoryLabel: "블러셔",
      recommendations: ["브릭", "테라코타", "어스톤"],
      colorTone: "깊고 자연스러운 컬러",
    },
    {
      category: "eyeshadow",
      categoryLabel: "아이섀도",
      recommendations: ["브라운", "카키", "골드"],
      colorTone: "어스톤 웜 계열",
    },
  ],
  Winter: [
    {
      category: "foundation",
      categoryLabel: "파운데이션",
      recommendations: ["뉴트럴 베이지", "아이보리", "쿨 베이지"],
      colorTone: "쿨톤 선명한 계열",
    },
    {
      category: "lipstick",
      categoryLabel: "립스틱",
      recommendations: ["와인", "푸시아핑크", "다크체리"],
      colorTone: "선명하고 강렬한 쿨톤",
    },
    {
      category: "blush",
      categoryLabel: "블러셔",
      recommendations: ["핫핑크", "푸시아", "와인핑크"],
      colorTone: "선명하고 차가운 컬러",
    },
    {
      category: "eyeshadow",
      categoryLabel: "아이섀도",
      recommendations: ["실버", "버건디", "네이비"],
      colorTone: "비비드 쿨 계열",
    },
  ],
};

/**
 * 피부 타입 기반 기초 루틴 추천
 */
export function getRoutineForSkinType(skinType: SkinType): RoutineStep[] {
  return ROUTINE_BY_SKIN_TYPE[skinType] || ROUTINE_BY_SKIN_TYPE.normal;
}

/**
 * 피부 고민 기반 특화 제품 추천
 *
 * @param concerns - 피부 고민 목록 (예: ['hydration', 'pores'])
 * @param skinType - 피부 타입
 * @returns 추천 제품 목록
 */
export function getProductsForConcerns(
  concerns: string[],
  skinType: SkinType
): Product[] {
  const recommendedProducts: Product[] = [];

  for (const concern of concerns) {
    const concernData = CONCERN_PRODUCTS.find((c) => c.concern === concern);
    if (concernData) {
      for (const product of concernData.products) {
        // 해당 피부 타입에 적합한지 확인
        if (product.suitableFor.includes(skinType)) {
          // 피하라고 하는 피부 타입이 아닌지 확인
          if (!product.avoidFor?.includes(skinType)) {
            // 중복 방지
            if (!recommendedProducts.find((p) => p.name === product.name)) {
              recommendedProducts.push(product);
            }
          }
        }
      }
    }
  }

  return recommendedProducts;
}

/**
 * 퍼스널 컬러 기반 메이크업 추천
 *
 * @param season - 퍼스널 컬러 시즌 (Spring/Summer/Autumn/Winter)
 * @returns 메이크업 추천 목록
 */
export function getMakeupRecommendations(
  season: string | null
): MakeupRecommendation[] {
  if (!season || !MAKEUP_BY_SEASON[season]) {
    return [];
  }
  return MAKEUP_BY_SEASON[season];
}

/**
 * 피부 상태 분석 결과에서 주요 고민 추출
 *
 * @param metrics - 피부 분석 지표 (0-100)
 * @returns 개선이 필요한 고민 목록
 */
export function extractConcernsFromMetrics(
  metrics: Record<string, number | null>
): string[] {
  const concerns: string[] = [];

  // 각 지표가 50 미만이면 고민으로 추가
  if (metrics.hydration !== null && metrics.hydration < 50) {
    concerns.push("hydration");
  }
  if (metrics.oil_level !== null && metrics.oil_level > 60) {
    concerns.push("oil");
  }
  if (metrics.pores !== null && metrics.pores < 50) {
    concerns.push("pores");
  }
  if (metrics.pigmentation !== null && metrics.pigmentation < 50) {
    concerns.push("pigmentation");
  }
  if (metrics.wrinkles !== null && metrics.wrinkles < 50) {
    concerns.push("wrinkles");
  }
  if (metrics.sensitivity !== null && metrics.sensitivity < 50) {
    concerns.push("trouble");
  }

  return concerns;
}

/**
 * 가격대 정렬 순서
 */
const PRICE_ORDER: Record<Product["priceRange"], number> = {
  budget: 1,
  mid: 2,
  premium: 3,
};

/**
 * 제품을 가격대별로 정렬 (저렴한 순)
 */
function sortByPriceRange(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => PRICE_ORDER[a.priceRange] - PRICE_ORDER[b.priceRange]
  );
}

/**
 * 통합 제품 추천 생성
 *
 * @param skinType - 피부 타입
 * @param metrics - 피부 분석 지표
 * @param personalColorSeason - 퍼스널 컬러 시즌 (선택)
 * @returns 통합 제품 추천 결과
 */
export function generateProductRecommendations(
  skinType: SkinType,
  metrics: Record<string, number | null>,
  personalColorSeason?: string | null
): ProductRecommendations {
  // 1. 기초 루틴 추천
  const routine = getRoutineForSkinType(skinType);

  // 2. 고민별 특화 제품 추천
  const concerns = extractConcernsFromMetrics(metrics);
  const unsortedSpecialCare = getProductsForConcerns(concerns, skinType);

  // 3. 가격대별 정렬 (스펙 3.2 #5)
  const specialCare = sortByPriceRange(unsortedSpecialCare);

  // 4. 메이크업 추천 (퍼스널 컬러 기반)
  const makeupRecommendations = personalColorSeason
    ? getMakeupRecommendations(personalColorSeason)
    : undefined;

  // 5. 스킨케어 루틴 (아침/저녁)
  const skincareRoutine =
    SKINCARE_ROUTINE_BY_TYPE[skinType] || SKINCARE_ROUTINE_BY_TYPE.normal;

  // 6. 주간 케어 + 라이프스타일 팁
  const careTips = CARE_TIPS_BY_TYPE[skinType] || CARE_TIPS_BY_TYPE.normal;

  return {
    routine,
    specialCare,
    makeupRecommendations,
    skincareRoutine,
    careTips,
  };
}

/**
 * products JSONB 형식으로 변환 (DB 저장용)
 */
export function formatProductsForDB(
  recommendations: ProductRecommendations
): Record<string, string[]> {
  const products: Record<string, string[]> = {};

  // 루틴 제품을 카테고리별로 그룹화
  for (const step of recommendations.routine) {
    products[step.category] = step.products;
  }

  // 특화 제품 추가
  if (recommendations.specialCare.length > 0) {
    products.specialCare = recommendations.specialCare.map((p) => p.name);
  }

  return products;
}
