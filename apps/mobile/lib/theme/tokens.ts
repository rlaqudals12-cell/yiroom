/**
 * 이룸 모바일 디자인 토큰
 *
 * 웹 globals.css (YIROOM IDENTITY v3, ADR-057)에서 추출한 값.
 * 모든 StyleSheet.create() 색상은 이 파일을 참조해야 합니다.
 */

// 브랜드 프라이머리
export const brand = {
  primary: '#F8C8DC',
  primaryForeground: '#0A0A0A',
  gradientStart: '#F8C8DC',
  gradientEnd: '#FFB6C1',
} as const;

// 라이트 모드 시맨틱 색상 (웹 :root와 동일)
export const lightColors = {
  background: '#FDFCFB',
  foreground: '#1C1C1E',
  card: '#FFFFFF',
  cardForeground: '#1C1C1E',
  popover: '#FFFFFF',
  popoverForeground: '#1C1C1E',
  secondary: '#F5F4F2',
  secondaryForeground: '#1C1C1E',
  muted: '#F5F4F2',
  mutedForeground: '#6B6B6B',
  accent: '#F5F4F2',
  accentForeground: '#1C1C1E',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  overlayForeground: '#FFFFFF',
  border: '#E8E7E5',
  input: '#E8E7E5',
  ring: '#F8C8DC',
} as const;

// 다크 모드 시맨틱 색상 (웹 .dark와 동일)
export const darkColors = {
  background: '#0F0F0F',
  foreground: '#FFFFFF',
  card: '#1A1A1A',
  cardForeground: '#FFFFFF',
  popover: '#1A1A1A',
  popoverForeground: '#FFFFFF',
  secondary: '#242424',
  secondaryForeground: '#FFFFFF',
  muted: '#242424',
  mutedForeground: '#9CA3AF',
  accent: '#242424',
  accentForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  overlayForeground: '#FFFFFF',
  border: '#2A2A2A',
  input: '#2A2A2A',
  ring: '#F8C8DC',
} as const;

// 모듈별 악센트 색상
export const moduleColors = {
  workout: { base: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
  nutrition: { base: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
  skin: { base: '#60A5FA', light: '#93C5FD', dark: '#3B82F6' },
  body: { base: '#A78BFA', light: '#C4B5FD', dark: '#8B5CF6' },
  personalColor: { base: '#F472B6', light: '#F9A8D4', dark: '#EC4899' },
  face: { base: '#E8805A', light: '#F3B8A0', dark: '#C25D38' },
  hair: { base: '#D4A24E', light: '#EED8A0', dark: '#B07E2C' },
  makeup: { base: '#D45ABF', light: '#EDA0E0', dark: '#A8388A' },
  posture: { base: '#4ABFBF', light: '#A0E0E0', dark: '#2A9090' },
  oralHealth: { base: '#4ABF7A', light: '#A0E0B8', dark: '#2A9058' },
} as const;

// 상태 색상
export const statusColors = {
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// 전문성 강조 색상
export const professionalColors = {
  primary: '#2D4A7A',
  accent: '#4A8A8A',
  highlight: '#D4C88A',
} as const;

// 스페이싱 (8px 기반, 웹 :root와 동일)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 보더 반지름 (웹 --radius: 0.625rem = 10px 기반)
export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;

// 그림자 (React Native 포맷, 웹 shadow 값과 일치)
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;

// 타이포그래피 (웹 Major Third 1.25 비율과 동일)
export const typography = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

// 시맨틱 색상 타입 (ThemeProvider에서 사용)
// 라이트/다크 양쪽 할당 가능하도록 string으로 확장
export type SemanticColors = { [K in keyof typeof lightColors]: string };
