/**
 * WCAG AA 대비율 검증 유틸리티
 *
 * @module lib/theme/contrast
 * @description hex 색상 간 대비율 계산 및 WCAG AA 준수 여부 검증
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
 * @returns 1 ~ 21 범위의 대비율
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(hex1: string, hex2: string): number {
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
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  level: 'normal' | 'large' | 'ui' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = level === 'normal' ? 4.5 : 3;
  return ratio >= threshold;
}

/**
 * hex 색상 문자열을 RGB 배열로 변환
 *
 * @param hex - '#RRGGBB' 또는 '#RGB' 형식
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');

  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}
