/**
 * 시각 효과 스타일 유틸리티
 *
 * 웹의 border-glow-pink, border-glow-purple 등을 네이티브로.
 * iOS: shadowColor + shadowRadius, Android: elevation + borderColor.
 *
 * @example
 * import { borderGlow } from '@/lib/theme/effects';
 * <View style={[styles.card, borderGlow.pink]} />
 */
import { Platform, type ViewStyle } from 'react-native';

import { brand, moduleColors } from './tokens';

// 핑크 글로우 (웹 border-glow-pink 대응)
const pinkGlow: ViewStyle = Platform.select({
  ios: {
    borderWidth: 1,
    borderColor: 'rgba(248, 200, 220, 0.3)',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  android: {
    borderWidth: 1,
    borderColor: 'rgba(248, 200, 220, 0.4)',
    elevation: 6,
  },
  default: {},
}) as ViewStyle;

// 퍼플 글로우 (웹 border-glow-purple 대응)
const purpleGlow: ViewStyle = Platform.select({
  ios: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: moduleColors.body.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  android: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    elevation: 6,
  },
  default: {},
}) as ViewStyle;

// 서브틀 글로우 (점수 높을 때 카드)
const subtleGlow: ViewStyle = Platform.select({
  ios: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  default: {},
}) as ViewStyle;

export const borderGlow = {
  pink: pinkGlow,
  purple: purpleGlow,
  subtle: subtleGlow,
} as const;

export type BorderGlowVariant = keyof typeof borderGlow;

// ─── 컬러드 쉐도우 유틸리티 (Phase 26) ───

type ShadowSize = 'sm' | 'md' | 'lg';

const SHADOW_CONFIGS: Record<ShadowSize, { offset: number; opacity: number; radius: number; elevation: number }> = {
  sm: { offset: 2, opacity: 0.12, radius: 8, elevation: 2 },
  md: { offset: 4, opacity: 0.18, radius: 12, elevation: 4 },
  lg: { offset: 6, opacity: 0.25, radius: 16, elevation: 6 },
};

/**
 * 모듈별 컬러드 쉐도우 생성
 *
 * 웹의 `shadow-sm/md/lg shadow-{color}/XX` 패턴을 네이티브로 구현.
 * iOS: shadowColor + shadowOpacity, Android: elevation.
 *
 * @example
 * import { coloredShadow } from '@/lib/theme/effects';
 * <View style={[styles.card, !isDark ? coloredShadow(moduleColors.skin.base, 'sm') : {}]} />
 */
export function coloredShadow(color: string, size: ShadowSize = 'md'): ViewStyle {
  const c = SHADOW_CONFIGS[size];
  return (Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: c.offset },
      shadowOpacity: c.opacity,
      shadowRadius: c.radius,
    },
    android: { elevation: c.elevation },
    default: {},
  }) ?? {}) as ViewStyle;
}

/**
 * 아이콘 박스 전용 컬러드 글로우 쉐도우
 *
 * 웹의 `shadow-lg shadow-{color}/30` 패턴 매칭.
 * 아이콘 박스(44~66px)에 최적화된 강한 글로우.
 *
 * @example
 * import { iconGradientShadow } from '@/lib/theme/effects';
 * <View style={[styles.iconBox, !isDark ? iconGradientShadow(moduleColors.skin.base) : {}]} />
 */
export function iconGradientShadow(color: string): ViewStyle {
  return (Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: { elevation: 4 },
    default: {},
  }) ?? {}) as ViewStyle;
}
