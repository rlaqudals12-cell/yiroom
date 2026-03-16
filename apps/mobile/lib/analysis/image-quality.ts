/**
 * 이미지 품질 사전 검증 (모바일)
 *
 * 분석 전 이미지 해상도/밝기 체크 → 경고 표시
 * Canvas 기반 선명도(Laplacian)는 웹 전용, 모바일은 해상도+밝기만 검증
 */

const DEFAULT_MIN_SIZE = 200;
const BRIGHTNESS_TOO_DARK = 60;
const BRIGHTNESS_TOO_BRIGHT = 220;
const ACCEPTABLE_THRESHOLD = 40;

/** 밝기 수준 */
export type BrightnessLevel = 'too_dark' | 'ok' | 'too_bright';

/** 이미지 품질 결과 */
export interface ImageQualityResult {
  overallScore: number;
  isAcceptable: boolean;
  resolution: { valid: boolean; message: string };
  brightness: { level: BrightnessLevel; average: number };
  suggestions: string[];
}

/**
 * 이미지 해상도 검증
 */
export function validateResolution(
  width: number,
  height: number,
  minSize: number = DEFAULT_MIN_SIZE
): { valid: boolean; message: string } {
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
 * 밝기 수준 판단 (평균 밝기 기반)
 */
export function assessBrightness(averageBrightness: number): {
  level: BrightnessLevel;
  average: number;
} {
  if (averageBrightness < BRIGHTNESS_TOO_DARK) {
    return { level: 'too_dark', average: averageBrightness };
  }
  if (averageBrightness > BRIGHTNESS_TOO_BRIGHT) {
    return { level: 'too_bright', average: averageBrightness };
  }
  return { level: 'ok', average: averageBrightness };
}

/**
 * 이미지 품질 종합 평가 (모바일 경량 버전)
 * Canvas 선명도 분석 없이 해상도+밝기만 체크
 */
export function assessImageQuality(
  width: number,
  height: number,
  averageBrightness: number = 128
): ImageQualityResult {
  const resolution = validateResolution(width, height);
  const brightness = assessBrightness(averageBrightness);
  const suggestions: string[] = [];

  // 해상도 점수 (0-50)
  let resolutionScore = 0;
  if (resolution.valid) {
    const megapixels = (width * height) / 1_000_000;
    resolutionScore = Math.min(50, megapixels * 25);
  } else {
    suggestions.push('더 높은 해상도의 사진을 사용해주세요.');
  }

  // 밝기 점수 (0-50)
  let brightnessScore = 50;
  if (brightness.level === 'too_dark') {
    brightnessScore = 15;
    suggestions.push('밝은 곳에서 다시 촬영해주세요.');
  } else if (brightness.level === 'too_bright') {
    brightnessScore = 20;
    suggestions.push('직사광선을 피해 촬영해주세요.');
  }

  const overallScore = Math.round(resolutionScore + brightnessScore);

  return {
    overallScore,
    isAcceptable: overallScore >= ACCEPTABLE_THRESHOLD,
    resolution,
    brightness,
    suggestions,
  };
}
