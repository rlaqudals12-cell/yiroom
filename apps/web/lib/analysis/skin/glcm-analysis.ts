/**
 * GLCM (Gray Level Co-occurrence Matrix) Texture Analysis Module
 *
 * @module lib/analysis/skin/glcm-analysis
 * @description S-2: GLCM-based skin texture analysis and trouble score calculation
 * @see {@link docs/principles/skin-physiology.md} Section 5
 */

import type { ZoneMetrics } from './types';

// Types
export interface GLCMMatrix {
  matrix: number[][];
  levels: number;
  distance: number;
  angle: number;
  totalSamples: number;
}

export interface HaralickFeatures {
  contrast: number;
  homogeneity: number;
  energy: number;
  correlation: number;
  entropy: number;
}

export interface TextureAnalysis {
  features: HaralickFeatures;
  textureScore: number;
  textureLevel: 'smooth' | 'normal' | 'rough' | 'very_rough';
  description: string;
  parameters: { levels: number; distance: number; angle: number };
}

export interface TroubleScoreResult {
  troubleScore: number;
  troubleLevel: 'clear' | 'mild' | 'moderate' | 'severe';
  factors: {
    textureContribution: number;
    porenessContribution: number;
    oilinessContribution: number;
  };
  recommendations: string[];
}

export const GLCM_DEFAULTS = { levels: 64, distance: 1, angle: 0 } as const;

const TEXTURE_WEIGHTS = {
  homogeneity: 0.35,
  energy: 0.25,
  contrast: -0.25,
  entropy: -0.15,
} as const;

// GLCM Calculation
function extractGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const pixelIndex = i * 4;
    gray[i] = Math.round(
      0.299 * data[pixelIndex] +
      0.587 * data[pixelIndex + 1] +
      0.114 * data[pixelIndex + 2]
    );
  }
  return gray;
}

function quantizeGrayscale(gray: Uint8Array, levels: number): Uint8Array {
  const quantized = new Uint8Array(gray.length);
  const scale = levels / 256;
  for (let i = 0; i < gray.length; i++) {
    quantized[i] = Math.min(levels - 1, Math.floor(gray[i] * scale));
  }
  return quantized;
}

/**
 * Calculate GLCM (Gray Level Co-occurrence Matrix)
 * @param imageData - Input image data
 * @param distance - Pixel distance (default: 1)
 * @param angle - Analysis angle in radians (default: 0)
 * @param levels - Quantization levels (default: 64)
 */
export function calculateGLCM(
  imageData: ImageData,
  distance: number = GLCM_DEFAULTS.distance,
  angle: number = GLCM_DEFAULTS.angle,
  levels: number = GLCM_DEFAULTS.levels
): GLCMMatrix {
  const { width, height } = imageData;
  const gray = extractGrayscale(imageData);
  const quantized = quantizeGrayscale(gray, levels);
  const matrix: number[][] = Array.from({ length: levels }, () =>
    Array(levels).fill(0)
  );

  const dx = Math.round(distance * Math.cos(angle));
  const dy = Math.round(distance * Math.sin(angle));
  let totalSamples = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const currentLevel = quantized[y * width + x];
        const neighborLevel = quantized[ny * width + nx];
        matrix[currentLevel][neighborLevel]++;
        totalSamples++;
      }
    }
  }

  // Symmetrize
  for (let i = 0; i < levels; i++) {
    for (let j = i + 1; j < levels; j++) {
      const sum = matrix[i][j] + matrix[j][i];
      matrix[i][j] = sum;
      matrix[j][i] = sum;
      totalSamples += matrix[i][j];
    }
  }

  // Normalize
  if (totalSamples > 0) {
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        matrix[i][j] /= totalSamples;
      }
    }
  }

  return { matrix, levels, distance, angle, totalSamples };
}

/**
 * Extract Haralick texture features from GLCM
 * @see docs/principles/skin-physiology.md Section 5.1
 */
export function extractHaralickFeatures(glcm: GLCMMatrix): HaralickFeatures {
  const { matrix, levels } = glcm;

  let muI = 0;
  let muJ = 0;
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      muI += i * matrix[i][j];
      muJ += j * matrix[i][j];
    }
  }

  let sigmaISq = 0;
  let sigmaJSq = 0;
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      sigmaISq += Math.pow(i - muI, 2) * matrix[i][j];
      sigmaJSq += Math.pow(j - muJ, 2) * matrix[i][j];
    }
  }
  const sigmaI = Math.sqrt(sigmaISq);
  const sigmaJ = Math.sqrt(sigmaJSq);

  let contrast = 0;
  let homogeneity = 0;
  let energy = 0;
  let entropy = 0;
  let correlation = 0;

  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      const p = matrix[i][j];
      // Contrast: Sum (i-j)^2 * P(i,j)
      contrast += Math.pow(i - j, 2) * p;
      // Homogeneity: Sum P(i,j) / (1 + |i-j|)
      homogeneity += p / (1 + Math.abs(i - j));
      // Energy: Sum P(i,j)^2
      energy += p * p;
      // Entropy: -Sum P(i,j) * log2(P(i,j))
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
      // Correlation
      if (sigmaI > 0 && sigmaJ > 0) {
        correlation += ((i - muI) * (j - muJ) * p) / (sigmaI * sigmaJ);
      }
    }
  }

  return { contrast, homogeneity, energy, correlation, entropy };
}

// Texture Analysis
function normalizeFeatures(
  features: HaralickFeatures,
  levels: number
): HaralickFeatures {
  const maxContrast = Math.pow(levels - 1, 2);
  const maxEntropy = Math.log2(levels * levels);
  return {
    contrast: Math.min(100, Math.max(0, (features.contrast / maxContrast) * 100)),
    homogeneity: Math.min(100, Math.max(0, features.homogeneity * 100)),
    energy: Math.min(100, Math.max(0, features.energy * 100)),
    correlation: Math.min(100, Math.max(0, (features.correlation + 1) * 50)),
    entropy: Math.min(100, Math.max(0, (features.entropy / maxEntropy) * 100)),
  };
}

function calculateTextureScore(normalized: HaralickFeatures): number {
  let score = 50;
  score += (normalized.homogeneity - 50) * TEXTURE_WEIGHTS.homogeneity;
  score += (normalized.energy - 50) * TEXTURE_WEIGHTS.energy;
  score += (50 - normalized.contrast) * Math.abs(TEXTURE_WEIGHTS.contrast);
  score += (50 - normalized.entropy) * Math.abs(TEXTURE_WEIGHTS.entropy);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function classifyTextureLevel(textureScore: number): TextureAnalysis['textureLevel'] {
  if (textureScore >= 75) return 'smooth';
  if (textureScore >= 50) return 'normal';
  if (textureScore >= 25) return 'rough';
  return 'very_rough';
}

function generateTextureDescription(
  level: TextureAnalysis['textureLevel'],
  normalized: HaralickFeatures
): string {
  const descriptions: Record<TextureAnalysis['textureLevel'], string> = {
    smooth: 'Skin texture is smooth and uniform. Maintain current care.',
    normal: 'Skin texture is average. Basic exfoliation recommended.',
    rough: 'Skin texture is somewhat rough. Moisturizing and exfoliation care needed.',
    very_rough: 'Skin texture is very rough. Intensive moisturizing and calming care recommended.',
  };
  let description = descriptions[level];
  if (normalized.contrast > 70) description += ' High surface variation detected.';
  if (normalized.homogeneity < 30) description += ' Low texture uniformity.';
  return description;
}

/**
 * Analyze skin texture
 * @param imageData - Image data to analyze
 * @param options - Optional GLCM parameters
 */
export function analyzeTexture(
  imageData: ImageData,
  options: { distance?: number; angle?: number; levels?: number } = {}
): TextureAnalysis {
  const {
    distance = GLCM_DEFAULTS.distance,
    angle = GLCM_DEFAULTS.angle,
    levels = GLCM_DEFAULTS.levels,
  } = options;

  const glcm = calculateGLCM(imageData, distance, angle, levels);
  const rawFeatures = extractHaralickFeatures(glcm);
  const normalizedFeatures = normalizeFeatures(rawFeatures, levels);
  const textureScore = calculateTextureScore(normalizedFeatures);
  const textureLevel = classifyTextureLevel(textureScore);
  const description = generateTextureDescription(textureLevel, normalizedFeatures);

  return {
    features: normalizedFeatures,
    textureScore,
    textureLevel,
    description,
    parameters: { levels, distance, angle },
  };
}

// Trouble Score Calculation
function poreSizeToScore(poreSize: 'small' | 'medium' | 'large'): number {
  const scores: Record<'small' | 'medium' | 'large', number> = {
    small: 20,
    medium: 50,
    large: 85,
  };
  return scores[poreSize];
}

function classifyTroubleLevel(troubleScore: number): TroubleScoreResult['troubleLevel'] {
  if (troubleScore < 25) return 'clear';
  if (troubleScore < 50) return 'mild';
  if (troubleScore < 75) return 'moderate';
  return 'severe';
}

function generateTroubleRecommendations(
  level: TroubleScoreResult['troubleLevel'],
  factors: TroubleScoreResult['factors']
): string[] {
  const recommendations: string[] = [];
  switch (level) {
    case 'clear':
      recommendations.push('Skin condition is good. Maintain current care.');
      break;
    case 'mild':
      recommendations.push('Mild trouble signs detected.');
      if (factors.textureContribution > 20) recommendations.push('Gentle exfoliation 1-2 times per week recommended.');
      if (factors.porenessContribution > 15) recommendations.push('Consider pore care products.');
      break;
    case 'moderate':
      recommendations.push('Moderate trouble observed.');
      if (factors.textureContribution > 25) recommendations.push('Skin calming and regeneration care needed.');
      if (factors.oilinessContribution > 20) recommendations.push('Oil control products recommended.');
      recommendations.push('Consider dermatologist consultation if symptoms persist.');
      break;
    case 'severe':
      recommendations.push('Severe skin trouble detected.');
      recommendations.push('Dermatologist consultation recommended.');
      recommendations.push('Avoid irritating cosmetics.');
      break;
  }
  return recommendations;
}

/**
 * Calculate trouble score
 *
 * Formula:
 * - Texture contribution (40%%): Contrast * 0.4 + (100 - Homogeneity) * 0.4 + Entropy * 0.2
 * - Pore contribution (30%%): Pore size score
 * - Oiliness contribution (30%%): |oiliness - 50| * 0.6
 *
 * @see docs/principles/skin-physiology.md Section 10.2
 */
export function calculateTroubleScore(
  zoneAnalysis: ZoneMetrics,
  texture: TextureAnalysis
): TroubleScoreResult {
  const { features } = texture;
  const { poreSize, oiliness } = zoneAnalysis;

  // 1. Texture contribution (0-40)
  const textureBase =
    features.contrast * 0.4 +
    (100 - features.homogeneity) * 0.4 +
    features.entropy * 0.2;
  const textureContribution = Math.min(40, Math.round(textureBase * 0.4));

  // 2. Pore contribution (0-30)
  const poreScore = poreSizeToScore(poreSize);
  const porenessContribution = Math.min(30, Math.round(poreScore * 0.3));

  // 3. Oiliness contribution (0-30)
  const oilinessDeviation = Math.abs(oiliness - 50);
  const oilinessContribution = Math.min(30, Math.round(oilinessDeviation * 0.6));

  const troubleScore = Math.min(
    100,
    textureContribution + porenessContribution + oilinessContribution
  );
  const troubleLevel = classifyTroubleLevel(troubleScore);
  const factors = { textureContribution, porenessContribution, oilinessContribution };
  const recommendations = generateTroubleRecommendations(troubleLevel, factors);

  return { troubleScore, troubleLevel, factors, recommendations };
}

/**
 * Multi-angle GLCM analysis (4 directions: 0, 45, 90, 135 degrees)
 * Provides direction-invariant texture analysis
 */
export function analyzeTextureMultiAngle(
  imageData: ImageData,
  distance: number = GLCM_DEFAULTS.distance,
  levels: number = GLCM_DEFAULTS.levels
): TextureAnalysis {
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

  const allFeatures: HaralickFeatures[] = angles.map((angle) => {
    const glcm = calculateGLCM(imageData, distance, angle, levels);
    return extractHaralickFeatures(glcm);
  });

  const avgFeatures: HaralickFeatures = {
    contrast: allFeatures.reduce((sum, f) => sum + f.contrast, 0) / 4,
    homogeneity: allFeatures.reduce((sum, f) => sum + f.homogeneity, 0) / 4,
    energy: allFeatures.reduce((sum, f) => sum + f.energy, 0) / 4,
    correlation: allFeatures.reduce((sum, f) => sum + f.correlation, 0) / 4,
    entropy: allFeatures.reduce((sum, f) => sum + f.entropy, 0) / 4,
  };

  const normalized = normalizeFeatures(avgFeatures, levels);
  const textureScore = calculateTextureScore(normalized);
  const textureLevel = classifyTextureLevel(textureScore);
  const description = generateTextureDescription(textureLevel, normalized);

  return {
    features: normalized,
    textureScore,
    textureLevel,
    description,
    parameters: { levels, distance, angle: -1 }, // -1 = multi-angle
  };
}
