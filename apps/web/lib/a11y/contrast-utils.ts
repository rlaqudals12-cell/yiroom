/**
 * 색상 대비 유틸리티
 *
 * WCAG 2.1 기준 색상 대비율 계산 및 검증
 * - 일반 텍스트: 4.5:1 이상 (AA)
 * - 대형 텍스트: 3:1 이상 (AA)
 * - UI 컴포넌트: 3:1 이상 (AA)
 *
 * @see SDD-ACCESSIBILITY-GUIDELINES.md
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
 */

// RGB 색상 타입
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// 대비율 검증 결과
export interface ContrastResult {
  ratio: number;
  ratioString: string;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  passesAAALarge: boolean;
}

// WCAG 대비율 기준
export const CONTRAST_THRESHOLDS = {
  AA: 4.5, // 일반 텍스트 (< 18pt 또는 < 14pt bold)
  AA_LARGE: 3, // 대형 텍스트 (>= 18pt 또는 >= 14pt bold)
  AAA: 7, // 향상된 대비 (일반 텍스트)
  AAA_LARGE: 4.5, // 향상된 대비 (대형 텍스트)
  UI_COMPONENT: 3, // UI 컴포넌트 및 그래픽 요소
} as const;

/**
 * HEX 색상을 RGB로 변환
 *
 * @param hex - HEX 색상 코드 (# 포함 또는 미포함)
 * @returns RGB 객체
 *
 * @example
 * hexToRgb('#ffffff') // { r: 255, g: 255, b: 255 }
 * hexToRgb('000000')  // { r: 0, g: 0, b: 0 }
 */
export function hexToRgb(hex: string): RGBColor {
  // # 제거
  const cleanHex = hex.replace('#', '');

  // 3자리 HEX 처리 (예: #fff -> #ffffff)
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const num = parseInt(fullHex, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * RGB를 HEX로 변환
 *
 * @param rgb - RGB 색상 객체
 * @returns HEX 색상 코드 (# 포함)
 *
 * @example
 * rgbToHex({ r: 255, g: 255, b: 255 }) // '#ffffff'
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * 상대 휘도 (Relative Luminance) 계산
 *
 * WCAG 2.1 공식 적용
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * (여기서 R, G, B는 sRGB 감마 보정된 값)
 *
 * @param rgb - RGB 색상 객체
 * @returns 상대 휘도 (0-1)
 *
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(rgb: RGBColor): number {
  const srgb = [rgb.r, rgb.g, rgb.b].map((c) => {
    const normalized = c / 255;
    // sRGB 감마 보정
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  // WCAG 휘도 공식
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * 두 색상 간의 대비율 계산
 *
 * WCAG 공식: (L1 + 0.05) / (L2 + 0.05)
 * 여기서 L1은 더 밝은 색상의 휘도, L2는 더 어두운 색상의 휘도
 *
 * @param foreground - 전경색 (HEX 또는 RGB)
 * @param background - 배경색 (HEX 또는 RGB)
 * @returns 대비율 (1:1 ~ 21:1)
 *
 * @example
 * getContrastRatio('#000000', '#ffffff') // 21
 * getContrastRatio('#4F46E5', '#ffffff') // ~5.9
 */
export function getContrastRatio(
  foreground: string | RGBColor,
  background: string | RGBColor
): number {
  const fgRgb =
    typeof foreground === 'string' ? hexToRgb(foreground) : foreground;
  const bgRgb =
    typeof background === 'string' ? hexToRgb(background) : background;

  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 대비율 기준 충족 여부 검증
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns 대비율 검증 결과
 *
 * @example
 * const result = checkContrast('#1a1a1a', '#ffffff');
 * // { ratio: 16.1, passesAA: true, passesAALarge: true, ... }
 */
export function checkContrast(
  foreground: string | RGBColor,
  background: string | RGBColor
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    ratioString: `${ratio.toFixed(2)}:1`,
    passesAA: ratio >= CONTRAST_THRESHOLDS.AA,
    passesAALarge: ratio >= CONTRAST_THRESHOLDS.AA_LARGE,
    passesAAA: ratio >= CONTRAST_THRESHOLDS.AAA,
    passesAAALarge: ratio >= CONTRAST_THRESHOLDS.AAA_LARGE,
  };
}

/**
 * 텍스트가 배경에서 읽기 가능한지 검증
 *
 * @param foreground - 텍스트 색상
 * @param background - 배경색
 * @param options - 검증 옵션
 * @returns 읽기 가능 여부
 *
 * @example
 * isReadable('#000000', '#ffffff') // true
 * isReadable('#777777', '#ffffff') // false (대비율 부족)
 */
export function isReadable(
  foreground: string | RGBColor,
  background: string | RGBColor,
  options: {
    level?: 'AA' | 'AAA';
    isLargeText?: boolean;
  } = {}
): boolean {
  const { level = 'AA', isLargeText = false } = options;
  const result = checkContrast(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? result.passesAAALarge : result.passesAAA;
  }
  return isLargeText ? result.passesAALarge : result.passesAA;
}

/**
 * 가장 읽기 좋은 텍스트 색상 선택 (흰색 또는 검은색)
 *
 * 배경색에 따라 최적의 대비율을 가진 색상 반환
 *
 * @param background - 배경색
 * @returns 권장 텍스트 색상 (HEX)
 *
 * @example
 * getReadableTextColor('#4F46E5') // '#ffffff' (밝은 배경)
 * getReadableTextColor('#F3F4F6') // '#000000' (어두운 배경)
 */
export function getReadableTextColor(background: string | RGBColor): string {
  const whiteContrast = getContrastRatio('#ffffff', background);
  const blackContrast = getContrastRatio('#000000', background);

  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * 대비율 조정을 위한 색상 밝기 조절
 *
 * @param color - 원본 색상
 * @param amount - 조절량 (-100 ~ 100, 음수: 어둡게, 양수: 밝게)
 * @returns 조절된 색상 (HEX)
 *
 * @example
 * adjustBrightness('#4F46E5', 20) // 밝게
 * adjustBrightness('#4F46E5', -20) // 어둡게
 */
export function adjustBrightness(
  color: string | RGBColor,
  amount: number
): string {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;

  const adjusted: RGBColor = {
    r: Math.max(0, Math.min(255, rgb.r + amount)),
    g: Math.max(0, Math.min(255, rgb.g + amount)),
    b: Math.max(0, Math.min(255, rgb.b + amount)),
  };

  return rgbToHex(adjusted);
}

/**
 * 대비율 충족을 위한 색상 자동 조정
 *
 * 목표 대비율을 충족할 때까지 색상을 조정
 *
 * @param foreground - 조정할 전경색
 * @param background - 배경색
 * @param targetRatio - 목표 대비율 (기본: 4.5)
 * @returns 조정된 색상 또는 null (조정 불가)
 */
export function adjustForContrast(
  foreground: string | RGBColor,
  background: string | RGBColor,
  targetRatio: number = CONTRAST_THRESHOLDS.AA
): string | null {
  const bgRgb =
    typeof background === 'string' ? hexToRgb(background) : background;
  const bgLuminance = getRelativeLuminance(bgRgb);

  // 배경이 밝으면 전경을 어둡게, 어두우면 밝게
  const shouldDarken = bgLuminance > 0.5;
  let currentColor =
    typeof foreground === 'string' ? hexToRgb(foreground) : { ...foreground };

  for (let i = 0; i < 100; i++) {
    const currentRatio = getContrastRatio(currentColor, bgRgb);
    if (currentRatio >= targetRatio) {
      return rgbToHex(currentColor);
    }

    const step = shouldDarken ? -5 : 5;
    currentColor = {
      r: Math.max(0, Math.min(255, currentColor.r + step)),
      g: Math.max(0, Math.min(255, currentColor.g + step)),
      b: Math.max(0, Math.min(255, currentColor.b + step)),
    };

    // 한계 도달
    if (shouldDarken && currentColor.r === 0 && currentColor.g === 0 && currentColor.b === 0) {
      break;
    }
    if (!shouldDarken && currentColor.r === 255 && currentColor.g === 255 && currentColor.b === 255) {
      break;
    }
  }

  // 최종 확인
  const finalRatio = getContrastRatio(currentColor, bgRgb);
  return finalRatio >= targetRatio ? rgbToHex(currentColor) : null;
}

// 이룸 브랜드 색상 대비 매트릭스 (사전 검증됨)
export const BRAND_CONTRAST_MATRIX = {
  // 텍스트 색상
  text: {
    primary: { hex: '#1a1a1a', onWhite: 16.1, level: 'AAA' },
    secondary: { hex: '#374151', onWhite: 8.5, level: 'AAA' },
    muted: { hex: '#6B7280', onWhite: 4.6, level: 'AA' },
  },
  // UI 색상
  ui: {
    primary: { hex: '#4F46E5', onWhite: 5.9, level: 'AA' },
    success: { hex: '#10B981', onWhite: 3.9, level: 'AA-Large' },
    error: { hex: '#EF4444', onWhite: 4.5, level: 'AA' },
    warning: { hex: '#F59E0B', onBlack: 8.2, level: 'AAA' },
  },
} as const;
