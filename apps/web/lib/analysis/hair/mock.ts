/**
 * H-1 헤어분석 Mock 데이터 생성
 *
 * AI 타임아웃/실패 시 Fallback용
 *
 * @description H-1 Mock 데이터
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type {
  HairAnalysisResult,
  FaceShapeType,
  FaceShapeAnalysis,
  HairColorAnalysis,
  HairstyleRecommendation,
  HairColorRecommendation,
} from './types';
import { FACE_SHAPE_LABELS } from './types';
import { recommendHairstyles, recommendHairColors, generateCareTips } from './style-recommender';

// =============================================================================
// Mock 데이터 생성
// =============================================================================

/**
 * Mock 얼굴형 생성
 */
function generateMockFaceShape(): FaceShapeType {
  const shapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle'];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

/**
 * Mock 얼굴형 분석 결과 생성
 */
export function generateMockFaceShapeAnalysis(
  faceShape?: FaceShapeType
): FaceShapeAnalysis {
  const shape = faceShape || generateMockFaceShape();

  // 얼굴형별 대표 비율
  const ratioPresets: Record<FaceShapeType, FaceShapeAnalysis['ratios']> = {
    oval: {
      faceLength: 0.35,
      faceWidth: 0.25,
      foreheadWidth: 0.22,
      cheekboneWidth: 0.25,
      jawWidth: 0.20,
      lengthToWidthRatio: 1.4,
    },
    round: {
      faceLength: 0.30,
      faceWidth: 0.28,
      foreheadWidth: 0.24,
      cheekboneWidth: 0.28,
      jawWidth: 0.23,
      lengthToWidthRatio: 1.07,
    },
    square: {
      faceLength: 0.30,
      faceWidth: 0.28,
      foreheadWidth: 0.26,
      cheekboneWidth: 0.28,
      jawWidth: 0.26,
      lengthToWidthRatio: 1.07,
    },
    heart: {
      faceLength: 0.33,
      faceWidth: 0.26,
      foreheadWidth: 0.26,
      cheekboneWidth: 0.24,
      jawWidth: 0.18,
      lengthToWidthRatio: 1.27,
    },
    oblong: {
      faceLength: 0.40,
      faceWidth: 0.24,
      foreheadWidth: 0.22,
      cheekboneWidth: 0.24,
      jawWidth: 0.20,
      lengthToWidthRatio: 1.67,
    },
    diamond: {
      faceLength: 0.34,
      faceWidth: 0.27,
      foreheadWidth: 0.20,
      cheekboneWidth: 0.27,
      jawWidth: 0.18,
      lengthToWidthRatio: 1.26,
    },
    rectangle: {
      faceLength: 0.38,
      faceWidth: 0.25,
      foreheadWidth: 0.24,
      cheekboneWidth: 0.25,
      jawWidth: 0.24,
      lengthToWidthRatio: 1.52,
    },
  };

  const baseRatios = ratioPresets[shape];
  const variance = () => (Math.random() - 0.5) * 0.02;

  return {
    faceShape: shape,
    faceShapeLabel: FACE_SHAPE_LABELS[shape],
    confidence: Math.round(65 + Math.random() * 25),
    ratios: {
      faceLength: Math.round((baseRatios.faceLength + variance()) * 1000) / 1000,
      faceWidth: Math.round((baseRatios.faceWidth + variance()) * 1000) / 1000,
      foreheadWidth: Math.round((baseRatios.foreheadWidth + variance()) * 1000) / 1000,
      cheekboneWidth: Math.round((baseRatios.cheekboneWidth + variance()) * 1000) / 1000,
      jawWidth: Math.round((baseRatios.jawWidth + variance()) * 1000) / 1000,
      lengthToWidthRatio: Math.round((baseRatios.lengthToWidthRatio + variance() * 5) * 100) / 100,
    },
  };
}

/**
 * Mock 헤어컬러 분석 결과 생성
 */
export function generateMockHairColorAnalysis(
  personalColorSeason?: string
): HairColorAnalysis {
  const season = personalColorSeason || ['spring', 'summer', 'autumn', 'winter'][Math.floor(Math.random() * 4)];

  const currentColors = [
    { name: '내추럴 블랙', hexColor: '#1C1C1C' },
    { name: '다크 브라운', hexColor: '#3D2314' },
    { name: '미디엄 브라운', hexColor: '#6B4423' },
  ];

  const currentColor = currentColors[Math.floor(Math.random() * currentColors.length)];

  return {
    currentColor: {
      ...currentColor,
      labColor: { L: 20 + Math.random() * 20, a: 5 + Math.random() * 10, b: 10 + Math.random() * 15 },
    },
    skinToneMatch: Math.round(60 + Math.random() * 30),
    recommendedColors: recommendHairColors(season, { maxResults: 4 }),
  };
}

/**
 * Mock HairAnalysisResult 전체 생성
 */
export function generateMockHairAnalysisResult(
  options?: {
    faceShape?: FaceShapeType;
    personalColorSeason?: string;
  }
): HairAnalysisResult {
  const { faceShape, personalColorSeason } = options || {};

  const faceShapeAnalysis = generateMockFaceShapeAnalysis(faceShape);
  const hairColorAnalysis = generateMockHairColorAnalysis(personalColorSeason);

  const styleRecommendations = recommendHairstyles(faceShapeAnalysis.faceShape, {
    maxResults: 5,
  });

  const careTips = generateCareTips(faceShapeAnalysis.faceShape, {
    texture: ['straight', 'wavy', 'curly'][Math.floor(Math.random() * 3)] as any,
    scalpCondition: ['dry', 'normal', 'oily'][Math.floor(Math.random() * 3)],
  });

  return {
    id: `mock-h1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    faceShapeAnalysis,
    hairColorAnalysis,
    currentHairInfo: {
      length: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as any,
      texture: ['straight', 'wavy', 'curly'][Math.floor(Math.random() * 3)] as any,
      thickness: ['fine', 'medium', 'thick'][Math.floor(Math.random() * 3)] as any,
      density: ['thin', 'normal', 'dense'][Math.floor(Math.random() * 3)] as any,
      scalpCondition: ['dry', 'normal', 'oily', 'sensitive'][Math.floor(Math.random() * 4)] as any,
    },
    styleRecommendations,
    careTips,
    analyzedAt: new Date().toISOString(),
    usedFallback: true,
  };
}
