/**
 * CIE-1 이미지 품질 검증 모듈
 *
 * Laplacian variance 기반 선명도 측정, 해상도 검증, 밝기 분석을 통해
 * AI 분석 입력 이미지의 품질을 종합 평가한다.
 *
 * @see docs/principles/image-processing.md - Laplacian sharpness 원리
 */

// Laplacian 커널 (3x3): 2차 미분 연산자로 에지 감지
const LAPLACIAN_KERNEL = [
  [0, 1, 0],
  [1, -4, 1],
  [0, 1, 0],
];

// 기본 최소 해상도 (px)
const DEFAULT_MIN_SIZE = 200;

// 선명도 임계값
const SHARPNESS_BLUR = 20; // 미만이면 흐림
const SHARPNESS_MODERATE = 40; // 미만이면 보통, 이상이면 선명

// 밝기 임계값 (0-255)
const BRIGHTNESS_TOO_DARK = 60;
const BRIGHTNESS_TOO_BRIGHT = 220;

// 종합 점수 가중치
const WEIGHT_SHARPNESS = 0.5;
const WEIGHT_BRIGHTNESS = 0.25;
const WEIGHT_RESOLUTION = 0.25;

// 합격 기준 점수
const ACCEPTABLE_THRESHOLD = 40;

/** 밝기 수준 */
export type BrightnessLevel = 'too_dark' | 'ok' | 'too_bright';

/** 밝기 분석 결과 */
export interface BrightnessResult {
  level: BrightnessLevel;
  average: number;
}

/** 해상도 검증 결과 */
export interface ResolutionResult {
  valid: boolean;
  message: string;
}

/** 이미지 품질 종합 평가 결과 */
export interface ImageQualityResult {
  /** 종합 점수 (0-100) */
  overallScore: number;
  /** 선명도 점수 (0-100) */
  sharpness: number;
  /** 밝기 분석 결과 */
  brightness: BrightnessResult;
  /** 해상도 검증 결과 */
  resolution: ResolutionResult;
  /** 종합 합격 여부 (overallScore >= 40) */
  isAcceptable: boolean;
  /** 개선 제안 (한국어) */
  suggestions: string[];
}

/**
 * Laplacian variance로 이미지 선명도 측정
 *
 * 원리: Laplacian 연산자로 2차 미분 계산 → 분산(variance)이 클수록 에지 풍부 → 선명
 * - 흐린 이미지: 에지 적음 → variance 낮음
 * - 선명한 이미지: 에지 풍부 → variance 높음
 *
 * @param imageData - Canvas ImageData 객체
 * @returns 선명도 점수 (0-100)
 */
export function calculateSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;

  // 1. 그레이스케일 변환 (luminosity 방식: 0.299R + 0.587G + 0.114B)
  const gray = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    gray[i] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }

  // 2. Laplacian 컨볼루션 (경계 1px 제외)
  const laplacian = new Float64Array(width * height);
  let sum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let value = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          value += gray[idx] * LAPLACIAN_KERNEL[ky + 1][kx + 1];
        }
      }
      const idx = y * width + x;
      laplacian[idx] = value;
      sum += value;
      count++;
    }
  }

  // 3. Variance 계산 (분산 = E[X^2] - E[X]^2)
  if (count === 0) return 0;
  const mean = sum / count;
  let varianceSum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const diff = laplacian[idx] - mean;
      varianceSum += diff * diff;
    }
  }
  const variance = varianceSum / count;

  // 4. 점수 변환 (variance → 0-100)
  // 경험적 매핑: variance 0 → 0점, 500+ → 100점 (시그모이드 유사)
  const score = Math.min(100, (variance / 500) * 100);
  return Math.round(score * 10) / 10;
}

/**
 * 이미지 해상도 검증
 *
 * @param width - 이미지 너비 (px)
 * @param height - 이미지 높이 (px)
 * @param minSize - 최소 허용 크기 (기본: 200px)
 * @returns 검증 결과
 */
export function validateResolution(
  width: number,
  height: number,
  minSize: number = DEFAULT_MIN_SIZE
): ResolutionResult {
  if (width <= 0 || height <= 0) {
    return { valid: false, message: '이미지 크기가 유효하지 않아요.' };
  }

  if (width < minSize || height < minSize) {
    return {
      valid: false,
      message: `이미지가 너무 작아요. 최소 ${minSize}x${minSize}px 이상이 필요해요.`,
    };
  }

  return { valid: true, message: '해상도가 충분해요.' };
}

/**
 * 이미지 밝기 분석
 *
 * 전체 픽셀의 평균 밝기(luminance)를 계산하여 노출 상태를 판단한다.
 *
 * @param imageData - Canvas ImageData 객체
 * @returns 밝기 수준 및 평균값
 */
export function analyzeBrightness(imageData: ImageData): BrightnessResult {
  const { data } = imageData;
  const pixelCount = data.length / 4;

  let brightnessSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // ITU-R BT.601 가중 평균
    brightnessSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const average = Math.round(brightnessSum / pixelCount);

  let level: BrightnessLevel;
  if (average < BRIGHTNESS_TOO_DARK) {
    level = 'too_dark';
  } else if (average > BRIGHTNESS_TOO_BRIGHT) {
    level = 'too_bright';
  } else {
    level = 'ok';
  }

  return { level, average };
}

/**
 * 종합 이미지 품질 평가
 *
 * 선명도, 밝기, 해상도를 종합하여 0-100 점수와 개선 제안을 반환한다.
 *
 * @param imageData - Canvas ImageData 객체
 * @param width - 원본 이미지 너비 (px)
 * @param height - 원본 이미지 높이 (px)
 * @returns 종합 품질 평가 결과
 */
export function assessImageQuality(
  imageData: ImageData,
  width: number,
  height: number
): ImageQualityResult {
  const sharpness = calculateSharpness(imageData);
  const brightness = analyzeBrightness(imageData);
  const resolution = validateResolution(width, height);

  // 각 항목 점수 (0-100)
  const sharpnessScore = sharpness;

  // 밝기 점수: 적정(60~220) 범위에서 100점, 벗어날수록 감점
  let brightnessScore: number;
  if (brightness.level === 'ok') {
    brightnessScore = 100;
  } else if (brightness.level === 'too_dark') {
    // 0→0점, 60→100점
    brightnessScore = Math.max(0, (brightness.average / BRIGHTNESS_TOO_DARK) * 100);
  } else {
    // 255→0점, 220→100점
    brightnessScore = Math.max(
      0,
      ((255 - brightness.average) / (255 - BRIGHTNESS_TOO_BRIGHT)) * 100
    );
  }

  const resolutionScore = resolution.valid ? 100 : 0;

  // 가중 종합 점수
  const overallScore = Math.round(
    sharpnessScore * WEIGHT_SHARPNESS +
      brightnessScore * WEIGHT_BRIGHTNESS +
      resolutionScore * WEIGHT_RESOLUTION
  );

  // 개선 제안 생성 (한국어)
  const suggestions: string[] = [];

  if (!resolution.valid) {
    suggestions.push(resolution.message);
  }

  if (sharpness < SHARPNESS_BLUR) {
    suggestions.push('이미지가 흐려요. 카메라를 고정하고 다시 촬영해주세요.');
  } else if (sharpness < SHARPNESS_MODERATE) {
    suggestions.push('이미지가 약간 흐려요. 더 밝은 곳에서 촬영하면 좋아요.');
  }

  if (brightness.level === 'too_dark') {
    suggestions.push('이미지가 너무 어두워요. 밝은 환경에서 다시 촬영해주세요.');
  } else if (brightness.level === 'too_bright') {
    suggestions.push('이미지가 너무 밝아요. 직사광선을 피해 촬영해주세요.');
  }

  const isAcceptable = overallScore >= ACCEPTABLE_THRESHOLD;

  if (isAcceptable && suggestions.length === 0) {
    suggestions.push('이미지 품질이 좋아요!');
  }

  return {
    overallScore,
    sharpness,
    brightness,
    resolution,
    isAcceptable,
    suggestions,
  };
}
