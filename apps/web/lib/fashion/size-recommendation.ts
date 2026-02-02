/**
 * 패션 사이즈 추천 로직
 *
 * @module lib/fashion/size-recommendation
 * @description K-2 패션 확장 - 체형/키 기반 사이즈 추천
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.5
 */

import type { BodyType3 } from '@/lib/inventory/closetMatcher';

// 핏 타입
export type FitType = 'slim' | 'regular' | 'relaxed';

// 키 기반 핏
export type HeightFit = 'short' | 'regular' | 'long' | 'petite';

// 성별
export type Gender = 'male' | 'female';

// 의류 카테고리
export type SizeCategory = 'top' | 'bottom' | 'shoes' | 'outer' | 'dress';

// 사용자 신체 측정치
export interface UserMeasurements {
  height: number; // cm
  weight: number; // kg
  chest?: number; // cm (가슴둘레)
  waist?: number; // cm (허리둘레)
  hip?: number; // cm (엉덩이둘레)
  footLength?: number; // mm (발길이)
  shoulderWidth?: number; // cm (어깨너비)
}

// 사이즈 추천 결과
export interface SizeRecommendation {
  category: SizeCategory;
  recommendedSize: string;
  fitType: FitType;
  heightFit: HeightFit;
  alternativeSizes: string[];
  tips: string[];
  confidence: number; // 0-100
}

// 전체 사이즈 프로필
export interface SizeProfile {
  gender: Gender;
  measurements: UserMeasurements;
  bodyType?: BodyType3;
  recommendations: {
    top: SizeRecommendation;
    bottom: SizeRecommendation;
    outer: SizeRecommendation;
    shoes: SizeRecommendation | null;
    dress: SizeRecommendation | null;
  };
  generalTips: string[];
}

// 한국 남성 사이즈 차트 (상의)
const MALE_TOP_SIZES: Record<string, { chest: [number, number]; weight: [number, number] }> = {
  '95': { chest: [88, 94], weight: [55, 65] },
  '100': { chest: [94, 100], weight: [65, 75] },
  '105': { chest: [100, 106], weight: [75, 85] },
  '110': { chest: [106, 112], weight: [85, 95] },
  '115': { chest: [112, 118], weight: [95, 105] },
};

// 한국 여성 사이즈 차트 (상의)
const FEMALE_TOP_SIZES: Record<string, { chest: [number, number]; weight: [number, number] }> = {
  '85': { chest: [78, 84], weight: [42, 50] },
  '90': { chest: [84, 90], weight: [50, 57] },
  '95': { chest: [90, 96], weight: [57, 64] },
  '100': { chest: [96, 102], weight: [64, 72] },
  '105': { chest: [102, 108], weight: [72, 80] },
};

// 유니섹스 사이즈 매핑
const UNISEX_SIZES: Record<string, { male: string; female: string }> = {
  XS: { male: '95', female: '85' },
  S: { male: '100', female: '90' },
  M: { male: '105', female: '95' },
  L: { male: '110', female: '100' },
  XL: { male: '115', female: '105' },
};

// 한국 신발 사이즈 (mm)
const SHOE_SIZES: Record<Gender, Record<string, [number, number]>> = {
  male: {
    '250': [245, 254],
    '255': [250, 259],
    '260': [255, 264],
    '265': [260, 269],
    '270': [265, 274],
    '275': [270, 279],
    '280': [275, 284],
    '285': [280, 289],
  },
  female: {
    '220': [215, 224],
    '225': [220, 229],
    '230': [225, 234],
    '235': [230, 239],
    '240': [235, 244],
    '245': [240, 249],
    '250': [245, 254],
  },
};

/**
 * 키 기반 핏 타입 결정
 *
 * @param height - 키 (cm)
 * @param gender - 성별
 * @returns HeightFit - 핏 타입
 */
export function determineHeightFit(height: number, gender: Gender): HeightFit {
  if (gender === 'female') {
    if (height <= 155) return 'petite';
    if (height >= 170) return 'long';
    return 'regular';
  }

  // 남성
  if (height < 170) return 'short';
  if (height >= 180) return 'long';
  return 'regular';
}

/**
 * BMI 계산
 */
function calculateBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

/**
 * BMI 기반 핏 추천
 */
function determineFitFromBMI(bmi: number): FitType {
  if (bmi < 20) return 'slim';
  if (bmi > 25) return 'relaxed';
  return 'regular';
}

/**
 * 체형 기반 핏 조정
 */
function adjustFitForBodyType(baseFit: FitType, bodyType?: BodyType3): FitType {
  if (!bodyType) return baseFit;

  switch (bodyType) {
    case 'S': // Straight - I라인 선호
      return baseFit === 'relaxed' ? 'regular' : baseFit;
    case 'W': // Wave - 핏티드 선호
      return 'slim';
    case 'N': // Natural - 루즈핏 선호
      return 'relaxed';
    default:
      return baseFit;
  }
}

/**
 * 상의 사이즈 추천
 */
function recommendTopSize(
  measurements: UserMeasurements,
  gender: Gender,
  bodyType?: BodyType3
): SizeRecommendation {
  const { height, weight, chest } = measurements;
  const sizeChart = gender === 'male' ? MALE_TOP_SIZES : FEMALE_TOP_SIZES;

  let recommendedSize = gender === 'male' ? '100' : '90'; // 기본값
  let confidence = 70;

  // 가슴둘레 기반 추천 (가장 정확)
  if (chest) {
    for (const [size, ranges] of Object.entries(sizeChart)) {
      if (chest >= ranges.chest[0] && chest <= ranges.chest[1]) {
        recommendedSize = size;
        confidence = 95;
        break;
      }
    }
  } else {
    // 체중 기반 추정
    for (const [size, ranges] of Object.entries(sizeChart)) {
      if (weight >= ranges.weight[0] && weight <= ranges.weight[1]) {
        recommendedSize = size;
        confidence = 75;
        break;
      }
    }
  }

  const heightFit = determineHeightFit(height, gender);
  const bmi = calculateBMI(height, weight);
  const baseFit = determineFitFromBMI(bmi);
  const fitType = adjustFitForBodyType(baseFit, bodyType);

  // 대안 사이즈
  const sizeIndex = Object.keys(sizeChart).indexOf(recommendedSize);
  const alternativeSizes: string[] = [];
  if (sizeIndex > 0) {
    alternativeSizes.push(Object.keys(sizeChart)[sizeIndex - 1]);
  }
  if (sizeIndex < Object.keys(sizeChart).length - 1) {
    alternativeSizes.push(Object.keys(sizeChart)[sizeIndex + 1]);
  }

  // 팁 생성
  const tips: string[] = [];
  if (heightFit === 'long') {
    tips.push('키가 크신 편이라 롱핏 상의를 추천드려요');
  } else if (heightFit === 'short' || heightFit === 'petite') {
    tips.push('크롭기장이나 숏핏 상의가 잘 어울려요');
  }

  if (fitType === 'relaxed') {
    tips.push('편안한 오버핏 스타일 추천');
  } else if (fitType === 'slim') {
    tips.push('몸에 맞는 슬림핏이 더 예뻐요');
  }

  if (!chest) {
    tips.push('더 정확한 추천을 위해 가슴둘레 측정을 추천해요');
  }

  return {
    category: 'top',
    recommendedSize,
    fitType,
    heightFit,
    alternativeSizes,
    tips,
    confidence,
  };
}

/**
 * BMI 기반 하의 사이즈 추정
 */
function getBottomSizeByBMI(bmi: number, gender: Gender): string {
  if (gender === 'male') {
    if (bmi < 20) return '28';
    if (bmi < 23) return '30';
    if (bmi < 25) return '32';
    if (bmi < 28) return '34';
    return '36';
  } else {
    if (bmi < 19) return '24';
    if (bmi < 22) return '26';
    if (bmi < 25) return '28';
    if (bmi < 28) return '30';
    return '32';
  }
}

/**
 * 하의 사이즈 추천
 */
function recommendBottomSize(
  measurements: UserMeasurements,
  gender: Gender,
  bodyType?: BodyType3
): SizeRecommendation {
  const { height, weight, waist, hip } = measurements;

  // 허리둘레 기반 인치 계산 또는 BMI 기반 추정
  let recommendedSize: string;
  let confidence: number;

  if (waist) {
    // 허리둘레를 인치로 변환
    const waistInch = Math.round(waist / 2.54);
    recommendedSize = waistInch.toString();
    confidence = 90;
  } else {
    // BMI 기반 추정
    const bmi = calculateBMI(height, weight);
    recommendedSize = getBottomSizeByBMI(bmi, gender);
    confidence = 65;
  }

  const heightFit = determineHeightFit(height, gender);
  const baseFit = determineFitFromBMI(calculateBMI(height, weight));
  const fitType = adjustFitForBodyType(baseFit, bodyType);

  // 대안 사이즈
  const sizeNum = parseInt(recommendedSize);
  const alternativeSizes = [(sizeNum - 2).toString(), (sizeNum + 2).toString()];

  // 팁 생성
  const tips: string[] = [];

  if (heightFit === 'long') {
    tips.push('롱 기장 팬츠를 선택하세요');
  } else if (heightFit === 'short' || heightFit === 'petite') {
    tips.push('숏 기장이나 9부 팬츠 추천');
  }

  if (hip && waist) {
    const hipWaistRatio = hip / waist;
    if (hipWaistRatio > 1.3) {
      tips.push('엉덩이가 넉넉한 핏을 고르세요');
    }
  }

  if (!waist) {
    tips.push('허리둘레 측정으로 더 정확한 추천을 받을 수 있어요');
  }

  return {
    category: 'bottom',
    recommendedSize,
    fitType,
    heightFit,
    alternativeSizes,
    tips,
    confidence,
  };
}

/**
 * 아우터 사이즈 추천
 */
function recommendOuterSize(
  measurements: UserMeasurements,
  gender: Gender,
  bodyType?: BodyType3
): SizeRecommendation {
  // 상의보다 한 사이즈 업 추천
  const topRec = recommendTopSize(measurements, gender, bodyType);
  const sizeChart = gender === 'male' ? MALE_TOP_SIZES : FEMALE_TOP_SIZES;
  const sizes = Object.keys(sizeChart);
  const currentIndex = sizes.indexOf(topRec.recommendedSize);
  const outerSize = currentIndex < sizes.length - 1 ? sizes[currentIndex + 1] : topRec.recommendedSize;

  const tips = [
    '레이어드를 고려해 상의보다 한 사이즈 업 추천',
    ...topRec.tips.filter((t) => t.includes('핏')),
  ];

  return {
    category: 'outer',
    recommendedSize: outerSize,
    fitType: topRec.fitType === 'slim' ? 'regular' : topRec.fitType,
    heightFit: topRec.heightFit,
    alternativeSizes: [topRec.recommendedSize],
    tips,
    confidence: topRec.confidence - 5,
  };
}

/**
 * 신발 사이즈 추천
 */
function recommendShoeSize(
  measurements: UserMeasurements,
  gender: Gender
): SizeRecommendation | null {
  const { footLength } = measurements;

  if (!footLength) {
    return null;
  }

  const sizeChart = SHOE_SIZES[gender];
  let recommendedSize = gender === 'male' ? '265' : '235';
  let confidence = 70;

  for (const [size, range] of Object.entries(sizeChart)) {
    if (footLength >= range[0] && footLength <= range[1]) {
      recommendedSize = size;
      confidence = 95;
      break;
    }
  }

  // 대안 사이즈
  const sizes = Object.keys(sizeChart);
  const currentIndex = sizes.indexOf(recommendedSize);
  const alternativeSizes: string[] = [];
  if (currentIndex > 0) alternativeSizes.push(sizes[currentIndex - 1]);
  if (currentIndex < sizes.length - 1) alternativeSizes.push(sizes[currentIndex + 1]);

  const tips: string[] = ['신발은 오후에 신어보는 것이 좋아요 (발이 약간 부어있음)'];

  if (gender === 'male' && parseInt(recommendedSize) >= 280) {
    tips.push('대형 사이즈라 일부 브랜드에서 품절이 잦을 수 있어요');
  }

  return {
    category: 'shoes',
    recommendedSize,
    fitType: 'regular',
    heightFit: 'regular',
    alternativeSizes,
    tips,
    confidence,
  };
}

/**
 * 원피스 사이즈 추천 (여성 전용)
 */
function recommendDressSize(
  measurements: UserMeasurements,
  bodyType?: BodyType3
): SizeRecommendation | null {
  const topRec = recommendTopSize(measurements, 'female', bodyType);

  const tips = [
    ...topRec.tips,
    '원피스는 가장 큰 부위에 맞춰 선택하세요',
  ];

  if (bodyType === 'W') {
    tips.push('허리 라인이 있는 핏앤플레어 스타일 추천');
  } else if (bodyType === 'N') {
    tips.push('H라인이나 시프트 드레스가 잘 어울려요');
  }

  return {
    category: 'dress',
    recommendedSize: topRec.recommendedSize,
    fitType: topRec.fitType,
    heightFit: topRec.heightFit,
    alternativeSizes: topRec.alternativeSizes,
    tips,
    confidence: topRec.confidence - 5,
  };
}

/**
 * 종합 사이즈 추천
 *
 * @param measurements - 신체 측정치
 * @param gender - 성별
 * @param bodyType - 체형 (선택)
 * @returns SizeProfile - 전체 사이즈 프로필
 */
export function recommendSize(
  measurements: UserMeasurements,
  gender: Gender,
  bodyType?: BodyType3
): SizeProfile {
  const top = recommendTopSize(measurements, gender, bodyType);
  const bottom = recommendBottomSize(measurements, gender, bodyType);
  const outer = recommendOuterSize(measurements, gender, bodyType);
  const shoes = recommendShoeSize(measurements, gender);
  const dress = gender === 'female' ? recommendDressSize(measurements, bodyType) : null;

  // 일반 팁
  const generalTips: string[] = [];

  const bmi = calculateBMI(measurements.height, measurements.weight);
  if (bmi < 18.5) {
    generalTips.push('마른 체형이시네요. 레이어드 스타일링으로 볼륨감을 더해보세요');
  } else if (bmi > 25) {
    generalTips.push('여유있는 핏으로 편안함과 스타일을 동시에!');
  }

  if (bodyType) {
    const bodyTypeTips: Record<BodyType3, string> = {
      S: '직선적인 라인의 옷이 잘 어울려요',
      W: '허리 강조와 곡선 라인을 살리세요',
      N: '자연스러운 오버핏이 매력적이에요',
    };
    generalTips.push(bodyTypeTips[bodyType]);
  }

  return {
    gender,
    measurements,
    bodyType,
    recommendations: {
      top,
      bottom,
      outer,
      shoes,
      dress,
    },
    generalTips,
  };
}

/**
 * 유니섹스 사이즈 변환
 */
export function convertToUnisexSize(
  koreanSize: string,
  gender: Gender
): string {
  for (const [unisex, mapping] of Object.entries(UNISEX_SIZES)) {
    if (mapping[gender] === koreanSize) {
      return unisex;
    }
  }
  return 'M'; // 기본값
}

/**
 * 유니섹스 → 한국 사이즈 변환
 */
export function convertFromUnisexSize(
  unisexSize: string,
  gender: Gender
): string {
  return UNISEX_SIZES[unisexSize]?.[gender] || (gender === 'male' ? '100' : '90');
}
