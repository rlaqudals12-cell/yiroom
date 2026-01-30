/**
 * 패션 핏 타입 정의
 *
 * @description K-2 패션 확장 - 핏 타입, 키 기반 핏, 가이드 정의
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */

// 의류 핏 타입
export type FitType = 'slim' | 'regular' | 'relaxed' | 'oversized';

// 키 기반 핏 타입
export type HeightFit = 'petite' | 'short' | 'regular' | 'long';

// 체형 타입 (기존 C-1과 연동)
export type BodyType =
  | 'S' // 직사각형
  | 'W' // 역삼각형
  | 'N' // 자연스러운
  | 'X' // 모래시계
  | 'A' // 삼각형
  | 'V' // 역삼각형(남성)
  | 'H' // 일자형
  | 'O' // 타원형
  | 'I' // 일자형(마른)
  | 'Y' // 역삼각형(넓은 어깨)
  | '8'; // 8자형

// 핏 가이드 인터페이스
export interface FitGuide {
  fitType: FitType;
  description: string;
  bestFor: BodyType[];
  avoidFor: BodyType[];
  heightRecommendation: HeightFit[];
  stylingTip: string;
}

// 핏 타입별 가이드
export const FIT_GUIDES: Record<FitType, FitGuide> = {
  slim: {
    fitType: 'slim',
    description: '몸에 밀착되는 핏, 라인을 강조',
    bestFor: ['X', '8', 'I'],
    avoidFor: ['O', 'A'],
    heightRecommendation: ['regular', 'long'],
    stylingTip: '슬림핏은 세로 라인을 강조해 키가 커 보이는 효과가 있어요.',
  },
  regular: {
    fitType: 'regular',
    description: '기본 핏, 대부분의 체형에 무난',
    bestFor: ['S', 'N', 'H', 'V', 'W'],
    avoidFor: [],
    heightRecommendation: ['petite', 'short', 'regular', 'long'],
    stylingTip: '레귤러핏은 어떤 체형에도 잘 어울리는 안전한 선택이에요.',
  },
  relaxed: {
    fitType: 'relaxed',
    description: '여유로운 핏, 편안한 실루엣',
    bestFor: ['A', 'O', 'Y'],
    avoidFor: ['I'],
    heightRecommendation: ['short', 'regular', 'long'],
    stylingTip: '릴렉스드 핏은 체형 단점을 커버하면서 편안해요.',
  },
  oversized: {
    fitType: 'oversized',
    description: '넉넉한 핏, 트렌디한 실루엣',
    bestFor: ['I', 'H', 'S'],
    avoidFor: ['O', 'A'],
    heightRecommendation: ['regular', 'long'],
    stylingTip: '오버사이즈는 상하의 밸런스를 맞추는 게 중요해요.',
  },
};

// 키 범위별 HeightFit 결정 (cm 기준)
export interface HeightRange {
  min: number;
  max: number;
  fit: HeightFit;
}

export const HEIGHT_FIT_RANGES: {
  male: HeightRange[];
  female: HeightRange[];
} = {
  male: [
    { min: 0, max: 165, fit: 'petite' },
    { min: 165, max: 172, fit: 'short' },
    { min: 172, max: 180, fit: 'regular' },
    { min: 180, max: 999, fit: 'long' },
  ],
  female: [
    { min: 0, max: 155, fit: 'petite' },
    { min: 155, max: 162, fit: 'short' },
    { min: 162, max: 168, fit: 'regular' },
    { min: 168, max: 999, fit: 'long' },
  ],
};

// 키에 따른 HeightFit 결정 함수
export function getHeightFit(
  heightCm: number,
  gender: 'male' | 'female' | 'neutral'
): HeightFit {
  // 중립은 여성 기준 사용 (더 세분화된 범위)
  const ranges = gender === 'male' ? HEIGHT_FIT_RANGES.male : HEIGHT_FIT_RANGES.female;

  for (const range of ranges) {
    if (heightCm >= range.min && heightCm < range.max) {
      return range.fit;
    }
  }

  return 'regular';
}

// 체형과 핏 매칭 점수 계산
export function calculateFitMatchScore(
  bodyType: BodyType,
  fitType: FitType,
  heightFit: HeightFit
): number {
  const guide = FIT_GUIDES[fitType];
  let score = 50; // 기본 점수

  // bestFor 체형이면 +30
  if (guide.bestFor.includes(bodyType)) {
    score += 30;
  }

  // avoidFor 체형이면 -30
  if (guide.avoidFor.includes(bodyType)) {
    score -= 30;
  }

  // heightRecommendation에 포함되면 +20
  if (guide.heightRecommendation.includes(heightFit)) {
    score += 20;
  }

  return Math.max(0, Math.min(100, score));
}
