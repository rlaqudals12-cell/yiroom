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
  HairTexture,
  HairLength,
  HairThickness,
  HairDensity,
  ScalpCondition,
} from './types';
import { FACE_SHAPE_LABELS } from './types';
import { recommendHairstyles, recommendHairColors, generateCareTips } from './style-recommender';
import { createSeededRandom, DEFAULT_SEED } from '@/lib/utils/seeded-random';

// =============================================================================
// Mock 데이터 생성
//
// 재현성 계약: 폴백 Mock은 시드(사용자·이미지 식별자 등)로부터 결정론적으로
// 생성한다. Math.random() 금지 — 같은 시드는 항상 같은 얼굴형·비율을 낸다.
// 시드 미지정 시 고정 기본 시드로 항상 동일한 결과.
// =============================================================================

/**
 * Mock 얼굴형 생성 (시드 기반 결정론)
 */
function generateMockFaceShape(rng: () => number): FaceShapeType {
  const shapes: FaceShapeType[] = [
    'oval',
    'round',
    'square',
    'heart',
    'oblong',
    'diamond',
    'rectangle',
  ];
  return shapes[Math.floor(rng() * shapes.length)];
}

/**
 * Mock 얼굴형 분석 결과 생성
 *
 * @param faceShape - 지정 시 해당 얼굴형 사용
 * @param seed - 결정론 시드 (미지정 시 고정 기본 시드)
 */
export function generateMockFaceShapeAnalysis(
  faceShape?: FaceShapeType,
  seed?: string
): FaceShapeAnalysis {
  const rng = createSeededRandom(seed ?? DEFAULT_SEED);
  const shape = faceShape || generateMockFaceShape(rng);

  // 얼굴형별 대표 비율
  const ratioPresets: Record<FaceShapeType, FaceShapeAnalysis['ratios']> = {
    oval: {
      faceLength: 0.35,
      faceWidth: 0.25,
      foreheadWidth: 0.22,
      cheekboneWidth: 0.25,
      jawWidth: 0.2,
      lengthToWidthRatio: 1.4,
    },
    round: {
      faceLength: 0.3,
      faceWidth: 0.28,
      foreheadWidth: 0.24,
      cheekboneWidth: 0.28,
      jawWidth: 0.23,
      lengthToWidthRatio: 1.07,
    },
    square: {
      faceLength: 0.3,
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
      faceLength: 0.4,
      faceWidth: 0.24,
      foreheadWidth: 0.22,
      cheekboneWidth: 0.24,
      jawWidth: 0.2,
      lengthToWidthRatio: 1.67,
    },
    diamond: {
      faceLength: 0.34,
      faceWidth: 0.27,
      foreheadWidth: 0.2,
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
  const variance = (): number => (rng() - 0.5) * 0.02;

  return {
    faceShape: shape,
    faceShapeLabel: FACE_SHAPE_LABELS[shape],
    confidence: Math.round(65 + rng() * 25),
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
 *
 * @param personalColorSeason - 지정 시 해당 시즌 사용
 * @param seed - 결정론 시드 (미지정 시 고정 기본 시드)
 */
export function generateMockHairColorAnalysis(
  personalColorSeason?: string,
  seed?: string
): HairColorAnalysis {
  const rng = createSeededRandom(seed ?? DEFAULT_SEED);
  const season =
    personalColorSeason || ['spring', 'summer', 'autumn', 'winter'][Math.floor(rng() * 4)];

  const currentColors = [
    { name: '내추럴 블랙', hexColor: '#1C1C1C' },
    { name: '다크 브라운', hexColor: '#3D2314' },
    { name: '미디엄 브라운', hexColor: '#6B4423' },
  ];

  const currentColor = currentColors[Math.floor(rng() * currentColors.length)];

  return {
    currentColor: {
      ...currentColor,
      labColor: {
        L: 20 + rng() * 20,
        a: 5 + rng() * 10,
        b: 10 + rng() * 15,
      },
    },
    skinToneMatch: Math.round(60 + rng() * 30),
    recommendedColors: recommendHairColors(season, { maxResults: 4 }),
  };
}

/**
 * Mock HairAnalysisResult 전체 생성
 */
export function generateMockHairAnalysisResult(options?: {
  faceShape?: FaceShapeType;
  personalColorSeason?: string;
  seed?: string;
}): HairAnalysisResult {
  const { faceShape, personalColorSeason, seed } = options || {};
  const baseSeed = seed ?? DEFAULT_SEED;

  // 하위 항목마다 파생 시드를 써서 한 시드로 전체 결과가 결정론적으로 재현되게 함
  const faceShapeAnalysis = generateMockFaceShapeAnalysis(faceShape, `${baseSeed}:face`);
  const hairColorAnalysis = generateMockHairColorAnalysis(personalColorSeason, `${baseSeed}:color`);

  const styleRecommendations = recommendHairstyles(faceShapeAnalysis.faceShape, {
    maxResults: 5,
  });

  const rng = createSeededRandom(`${baseSeed}:hair`);
  const textures: HairTexture[] = ['straight', 'wavy', 'curly'];
  const scalpConditions: ScalpCondition[] = ['dry', 'normal', 'oily'];

  const careTips = generateCareTips(faceShapeAnalysis.faceShape, {
    texture: textures[Math.floor(rng() * textures.length)],
    scalpCondition: scalpConditions[Math.floor(rng() * scalpConditions.length)],
  });

  return {
    // 레코드 ID는 재현 대상이 아니라 레코드마다 고유해야 함 (Math.random 아님)
    id: `mock-h1-${crypto.randomUUID()}`,
    faceShapeAnalysis,
    hairColorAnalysis,
    currentHairInfo: {
      length: (['short', 'medium', 'long'] as HairLength[])[Math.floor(rng() * 3)],
      texture: textures[Math.floor(rng() * textures.length)],
      thickness: (['fine', 'medium', 'thick'] as HairThickness[])[Math.floor(rng() * 3)],
      density: (['thin', 'normal', 'dense'] as HairDensity[])[Math.floor(rng() * 3)],
      scalpCondition: (['dry', 'normal', 'oily', 'sensitive'] as ScalpCondition[])[
        Math.floor(rng() * 4)
      ],
    },
    styleRecommendations,
    careTips,
    analyzedAt: new Date().toISOString(),
    usedFallback: true,
  };
}
