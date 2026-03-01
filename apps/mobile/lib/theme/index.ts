/**
 * 이룸 모바일 테마 모듈 — 공개 API
 *
 * @module lib/theme
 * @description 디자인 토큰, ThemeProvider, useTheme 훅
 */

// 디자인 토큰
export {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  professionalColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
  ICON_BG_OPACITY,
} from './tokens';
export type { SemanticColors } from './tokens';

// 그라디언트
export { gradients, getModuleGradient } from './gradients';
export type { GradientConfig, GradientKey } from './gradients';

// 시각 효과
export { borderGlow } from './effects';
export type { BorderGlowVariant } from './effects';

// 대비율 검증
export { getContrastRatio, meetsWcagAA, meetsWcagAAA, getRelativeLuminance } from './contrast';

// 테마 컨텍스트
export { ThemeProvider } from './ThemeProvider';
export type { ThemeContextValue, ThemeMode } from './ThemeProvider';
export { useTheme } from './useTheme';
