/**
 * Gemini Mock Fallback 데이터
 * AI 호출 실패 시 사용되는 대체 결과
 */
import type { PersonalColorSeason, SkinType, BodyType } from '@yiroom/shared';

import type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  HairAnalysisResult,
  MakeupAnalysisResult,
  OralHealthAnalysisResult,
  PostureAnalysisResult,
  TrafficLight,
} from './types';
import { getSeasonColors } from './utils';

export function generateMockPersonalColorResult(
  answers: Record<number, string>
): PersonalColorAnalysisResult {
  const warmCount = Object.values(answers).filter((v) => v === 'warm').length;
  const coolCount = Object.values(answers).filter((v) => v === 'cool').length;

  let season: PersonalColorSeason;
  if (warmCount > coolCount) {
    season = Math.random() > 0.5 ? 'Spring' : 'Autumn';
  } else {
    season = Math.random() > 0.5 ? 'Summer' : 'Winter';
  }

  return {
    season,
    confidence: 0.75,
    colors: getSeasonColors(season),
    description: '문진 결과를 기반으로 분석되었습니다.',
  };
}

export function generateMockSkinResult(): SkinAnalysisResult {
  const types: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
  const skinType = types[Math.floor(Math.random() * types.length)];

  return {
    skinType,
    metrics: {
      moisture: Math.floor(Math.random() * 40) + 40,
      oil: Math.floor(Math.random() * 40) + 30,
      pores: Math.floor(Math.random() * 30) + 50,
      wrinkles: Math.floor(Math.random() * 30) + 60,
      pigmentation: Math.floor(Math.random() * 30) + 50,
      sensitivity: Math.floor(Math.random() * 40) + 30,
      elasticity: Math.floor(Math.random() * 30) + 55,
    },
    concerns: ['수분 부족', '유분 과다'],
    recommendations: ['보습 강화', '순한 클렌저 사용'],
  };
}

export function generateMockBodyResult(height: number, weight: number): BodyAnalysisResult {
  const bmi = weight / (height / 100) ** 2;
  const types: BodyType[] = [
    'Rectangle',
    'Triangle',
    'InvertedTriangle',
    'Hourglass',
    'Oval',
    'Athletic',
  ];
  const bodyType = types[Math.floor(Math.random() * types.length)];

  return {
    bodyType,
    bmi: Math.round(bmi * 10) / 10,
    proportions: {
      shoulderHipRatio: 0.9 + Math.random() * 0.3,
      waistHipRatio: 0.7 + Math.random() * 0.2,
    },
    recommendations: ['허리 강조', 'A라인 실루엣'],
    avoidItems: ['박시한 옷', '일자 핏'],
  };
}

// 한국 음식 Mock 데이터베이스
const MOCK_FOODS: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
}[] = [
  { name: '비빔밥', calories: 550, protein: 18, carbs: 65, fat: 12, trafficLight: 'yellow' },
  { name: '된장찌개', calories: 120, protein: 9, carbs: 8, fat: 5, trafficLight: 'green' },
  { name: '김치찌개', calories: 150, protein: 12, carbs: 10, fat: 6, trafficLight: 'green' },
  { name: '불고기', calories: 350, protein: 28, carbs: 15, fat: 20, trafficLight: 'yellow' },
  { name: '삼겹살', calories: 500, protein: 25, carbs: 2, fat: 45, trafficLight: 'red' },
  { name: '라면', calories: 500, protein: 10, carbs: 70, fat: 18, trafficLight: 'red' },
  { name: '샐러드', calories: 80, protein: 3, carbs: 10, fat: 3, trafficLight: 'green' },
  { name: '치킨', calories: 450, protein: 35, carbs: 15, fat: 28, trafficLight: 'red' },
  { name: '김밥', calories: 320, protein: 8, carbs: 45, fat: 12, trafficLight: 'yellow' },
  { name: '떡볶이', calories: 380, protein: 6, carbs: 65, fat: 10, trafficLight: 'red' },
];

export function generateMockFoodResult(): FoodAnalysisResult {
  const numFoods = Math.floor(Math.random() * 3) + 1;
  const selectedFoods: FoodAnalysisResult['foods'] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < numFoods; i++) {
    let food;
    do {
      food = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
    } while (usedNames.has(food.name));

    usedNames.add(food.name);
    selectedFoods.push({
      id: `food-${Date.now()}-${i}`,
      ...food,
      portion: 1,
      confidence: 0.7 + Math.random() * 0.25,
    });
  }

  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods: selectedFoods,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    insight: 'AI 분석이 불가하여 예시 데이터가 표시됩니다. 음식을 직접 수정해주세요.',
  };
}

// 헤어 질감별 추천 스타일
const HAIR_STYLE_MAP: Record<HairAnalysisResult['texture'], string[]> = {
  straight: ['레이어드 컷', '볼륨 펌', '시스루 뱅', 'C컬 펌'],
  wavy: ['자연 웨이브 컷', '미디엄 레이어드', '히피 펌'],
  curly: ['데피니드 컬', '쇼트 컬리 밥', '레이어드 컬'],
  coily: ['트위스트 아웃', '밀어 올리기', '프로텍티브 스타일'],
};

export function generateMockHairResult(): HairAnalysisResult {
  const textures: HairAnalysisResult['texture'][] = ['straight', 'wavy', 'curly', 'coily'];
  const thicknesses: HairAnalysisResult['thickness'][] = ['fine', 'medium', 'thick'];
  const scalps: HairAnalysisResult['scalpCondition'][] = ['dry', 'oily', 'normal', 'sensitive'];

  const texture = textures[Math.floor(Math.random() * textures.length)];

  return {
    texture,
    thickness: thicknesses[Math.floor(Math.random() * thicknesses.length)],
    scalpCondition: scalps[Math.floor(Math.random() * scalps.length)],
    damageLevel: Math.floor(Math.random() * 40) + 20,
    scores: {
      shine: Math.floor(Math.random() * 30) + 50,
      elasticity: Math.floor(Math.random() * 30) + 50,
      density: Math.floor(Math.random() * 30) + 50,
      scalpHealth: Math.floor(Math.random() * 30) + 55,
    },
    mainConcerns: ['모발 건조', '끝 갈라짐'],
    careRoutine: ['주 1회 딥 컨디셔닝', '두피 스케일링', '열 보호제 사용'],
    recommendedStyles: HAIR_STYLE_MAP[texture],
  };
}

export function generateMockMakeupResult(): MakeupAnalysisResult {
  const faceShapes: MakeupAnalysisResult['faceShape'][] = [
    'oval',
    'round',
    'square',
    'heart',
    'oblong',
    'diamond',
  ];
  const undertones: MakeupAnalysisResult['undertone'][] = ['warm', 'cool', 'neutral'];
  const eyeShapes: MakeupAnalysisResult['eyeShape'][] = [
    'monolid',
    'double',
    'hooded',
    'round',
    'almond',
  ];
  const lipShapes: MakeupAnalysisResult['lipShape'][] = ['full', 'thin', 'wide', 'bow'];

  return {
    faceShape: faceShapes[Math.floor(Math.random() * faceShapes.length)],
    undertone: undertones[Math.floor(Math.random() * undertones.length)],
    eyeShape: eyeShapes[Math.floor(Math.random() * eyeShapes.length)],
    lipShape: lipShapes[Math.floor(Math.random() * lipShapes.length)],
    scores: {
      skinTone: Math.floor(Math.random() * 20) + 70,
      eyeBalance: Math.floor(Math.random() * 20) + 65,
      lipBalance: Math.floor(Math.random() * 20) + 70,
      overall: Math.floor(Math.random() * 15) + 75,
    },
    recommendations: {
      base: '촉촉한 글로우 베이스 추천',
      eye: '브라운 계열 그라데이션으로 자연스럽게',
      lip: '코랄 핑크 틴트로 생기있게',
      blush: '피치 톤 블러셔를 광대 위에 가볍게',
      contour: '코 옆라인 쉐딩으로 입체감 부여',
    },
    bestColors: ['#E8A090', '#C97B6B', '#D4A19A', '#B56B5F', '#F0C4B8'],
  };
}

export function generateMockOralHealthResult(): OralHealthAnalysisResult {
  const gumHealthOptions: OralHealthAnalysisResult['gumHealth'][] = [
    'healthy',
    'mild_inflammation',
    'moderate_inflammation',
  ];
  const whiteningOptions: OralHealthAnalysisResult['whiteningPotential'][] = [
    'high',
    'medium',
    'low',
  ];

  return {
    toothShade: 'A2',
    gumHealth: gumHealthOptions[Math.floor(Math.random() * gumHealthOptions.length)],
    overallScore: Math.floor(Math.random() * 20) + 70,
    scores: {
      whiteness: Math.floor(Math.random() * 25) + 60,
      alignment: Math.floor(Math.random() * 20) + 65,
      gumCondition: Math.floor(Math.random() * 25) + 60,
      hygiene: Math.floor(Math.random() * 20) + 65,
    },
    concerns: ['치석 축적', '잇몸 약간 붓기'],
    recommendations: ['정기적인 스케일링', '칫솔 각도 45도 유지', '치간 칫솔 사용'],
    whiteningPotential: whiteningOptions[Math.floor(Math.random() * whiteningOptions.length)],
  };
}

export function generateMockPostureResult(): PostureAnalysisResult {
  const postureTypes: PostureAnalysisResult['postureType'][] = [
    'normal',
    'forward_head',
    'rounded_shoulders',
    'swayback',
    'flat_back',
    'kyphosis',
  ];
  const postureType = postureTypes[Math.floor(Math.random() * postureTypes.length)];

  // 자세 유형별 문제점
  const issueMap: Record<PostureAnalysisResult['postureType'], string[]> = {
    normal: ['가벼운 어깨 긴장'],
    forward_head: ['거북목', '목 뒤 근육 긴장', '두통 가능성'],
    rounded_shoulders: ['어깨 말림', '가슴 근육 단축', '등 상부 통증'],
    swayback: ['골반 전방 이동', '허리 과신전', '복부 돌출'],
    flat_back: ['요추 만곡 감소', '허리 유연성 저하'],
    kyphosis: ['등 상부 과도한 만곡', '어깨 처짐', '호흡 제한'],
  };

  return {
    postureType,
    overallScore: Math.floor(Math.random() * 25) + 60,
    scores: {
      headAlignment: Math.floor(Math.random() * 30) + 55,
      shoulderBalance: Math.floor(Math.random() * 30) + 55,
      spineAlignment: Math.floor(Math.random() * 25) + 60,
      hipAlignment: Math.floor(Math.random() * 25) + 65,
    },
    issues: issueMap[postureType],
    exercises: [
      { name: '턱 당기기', description: '턱을 뒤로 당겨 10초 유지', duration: '10회 × 3세트' },
      {
        name: '가슴 스트레칭',
        description: '문틀에 팔 짚고 가슴 열기',
        duration: '30초 × 3세트',
      },
      { name: '고양이-소 스트레칭', description: '네 발로 엎드려 등 굽히고 펴기', duration: '10회' },
    ],
    dailyTips: ['1시간마다 스트레칭', '모니터 눈높이 맞추기', '의자 등받이 활용'],
  };
}
