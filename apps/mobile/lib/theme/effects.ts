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
