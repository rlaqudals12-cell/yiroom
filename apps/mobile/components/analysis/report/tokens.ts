import { brand, lightColors } from '@/lib/theme/tokens';

/**
 * ADR-120 결과 지면 전용 색상.
 * 앱 테마는 그대로 두고, 캡처 가능한 진단지만 인쇄물처럼 크림 라이트로 고정한다.
 */
export const REPORT_COLORS = {
  ground: lightColors.background,
  paper: lightColors.card,
  ink: lightColors.foreground,
  mutedInk: lightColors.mutedForeground,
  rule: '#EAD9D4',
  wash: '#F8EFEC',
  accent: brand.primary,
  warningInk: '#8A5A21',
  warningWash: '#FFF8E8',
} as const;
