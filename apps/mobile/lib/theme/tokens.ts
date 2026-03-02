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
  // WCAG AA: #B0B7C3 on #1A1A1A(card) = ~5.3:1
  mutedForeground: '#B0B7C3',
  accent: '#242424',
  accentForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  overlayForeground: '#FFFFFF',
  // WCAG AA UI: #383838 on #1A1A1A(card) = ~1.6:1, on #0F0F0F(bg) = ~2.0:1
  // 시각적 구분 강화 (순수 장식 border, AA 3:1 비적용 대상)
  border: '#383838',
  input: '#383838',
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

// 스페이싱 (8px 기반, 웹 :root와 동일 + 중간값 보충)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  smd: 10,
  smx: 12,
  md: 16,
  mlg: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 보더 반지름 (웹 --radius: 0.625rem = 10px 기반 + 중간값 보충)
export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  smx: 12,
  xlg: 14,
  xl: 16,
  circle: 20,
  full: 9999,
} as const;

// 아이콘 배경 투명도 (hex suffix, moduleColors.X.light + ICON_BG_OPACITY)
export const ICON_BG_OPACITY = '30';

// 그림자 (React Native 포맷, 웹 shadow 값과 매칭)
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  // 웹 shadow-xl 대응 — 대시보드 히어로, 피처드 카드에 사용
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  // 기본 카드 (웹 shadow 클래스 대응) — 전역 카드 그림자
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
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

// 등급 색상 (분석 결과 등급 시각화 — 도메인 데이터)
export const gradeColors = {
  diamond: { base: '#06B6D4', light: '#67E8F9', dark: '#0891B2', text: '#06B6D4' },
  gold: { base: '#F59E0B', light: '#FCD34D', dark: '#D97706', text: '#F59E0B' },
  silver: { base: '#9CA3AF', light: '#D1D5DB', dark: '#6B7280', text: '#9CA3AF' },
  bronze: { base: '#CD7F32', light: '#E8B87A', dark: '#A0652A', text: '#CD7F32' },
} as const;

// 영양소 색상 (탄단지 비율 시각화 — 도메인 데이터)
export const nutrientColors = {
  carbs: '#60A5FA',
  protein: '#34D399',
  fat: '#FBBF24',
} as const;

// 점수 구간 색상 (피부 zone 맵 등 — 도메인 데이터)
export const scoreColors = {
  excellent: '#22C55E',
  good: '#EAB308',
  caution: '#F97316',
  poor: '#EF4444',
} as const;

// 존 건강 시각화 5단계 색상 (분석 결과 존 맵)
export const zoneColors = {
  excellent: '#22C55E',
  good: '#4ADE80',
  normal: '#F59E0B',
  warning: '#F97316',
  critical: '#EF4444',
} as const;

// AI 브랜딩 색상 (AI 투명성 컴포넌트)
export const aiColors = {
  background: { light: '#F5F3FF', dark: 'rgba(139,92,246,0.15)' },
  border: { light: '#DDD6FE', dark: 'rgba(139,92,246,0.3)' },
  iconBg: { light: '#EDE9FE', dark: 'rgba(139,92,246,0.2)' },
  text: { light: '#7C3AED', dark: '#C4B5FD' },
  title: { light: '#6D28D9', dark: '#E9D5FF' },
} as const;

// Mock 데이터 표시 색상
export const mockColors = {
  background: { light: '#FFFBEB', dark: 'rgba(245,158,11,0.1)' },
  border: { light: '#FDE68A', dark: 'rgba(245,158,11,0.25)' },
  iconBg: { light: '#FEF3C7', dark: 'rgba(245,158,11,0.2)' },
  title: { light: '#92400E', dark: '#FDE68A' },
  text: { light: '#A16207', dark: '#FBBF24' },
} as const;

// 신뢰도 배지 색상 (AI/fallback 신뢰도 표시)
export const trustColors = {
  ai: { light: '#16A34A', dark: '#4ADE80' },
  fallback: { light: '#D97706', dark: '#FBBF24' },
} as const;

// 시맨틱 색상 타입 (ThemeProvider에서 사용)
// 라이트/다크 양쪽 할당 가능하도록 string으로 확장
export type SemanticColors = { [K in keyof typeof lightColors]: string };
