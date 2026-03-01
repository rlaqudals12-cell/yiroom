/**
 * WCAG AA/AAA 대비율 검증 유틸리티
 *
 * @module lib/theme/contrast
 * @description hex 색상 간 대비율 계산 및 WCAG 준수 여부 검증
 */

/**
 * hex 색상을 sRGB 상대 휘도(Relative Luminance)로 변환
 *
 * WCAG 2.1 공식:
 * - sRGB를 선형화 후 L = 0.2126R + 0.7152G + 0.0722B
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [rLinear, gLinear, bLinear] = rgb.map((c) => {
    const srgb = c / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * 두 색상 간 대비율 (WCAG 2.1)
 *
 * @returns 1 ~ 21 범위의 대비율. 유효하지 않은 hex면 0 반환
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  if (!hexToRgb(hex1) || !hexToRgb(hex2)) return 0;

  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA 대비율 충족 여부
 *
 * - 일반 텍스트: 4.5:1 이상
 * - 대형 텍스트(18px bold 또는 24px 이상): 3:1 이상
 * - UI 컴포넌트/그래픽: 3:1 이상
 *
 * @param level - 'normal' | 'large' | 'ui' (기본 'normal')
 * @param isLargeText - 호환용, true이면 level='large'로 처리
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  levelOrLargeText: 'normal' | 'large' | 'ui' | boolean = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  // 하위호환: boolean 인자 지원 (기존 a11y 모듈)
  const isLarge =
    typeof levelOrLargeText === 'boolean'
      ? levelOrLargeText
      : levelOrLargeText !== 'normal';
  const threshold = isLarge ? 3 : 4.5;
  return ratio >= threshold;
}

/**
 * WCAG AAA 대비율 충족 여부
 *
 * - 일반 텍스트: 7:1 이상
 * - 대형 텍스트: 4.5:1 이상
 */
export function meetsWcagAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * hex 색상 문자열을 RGB 배열로 변환
 *
 * @param hex - '#RRGGBB' 또는 '#RGB' 형식
 * @returns RGB 배열 또는 null (유효하지 않은 hex)
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }

  // 3자리 hex (#RGB)
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (short) {
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ];
  }

  return null;
}
