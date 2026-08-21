import { StyleSheet } from 'react-native';

import { REPORT_COLORS } from '@/components/analysis';
import { radii, spacing, typography } from '@/lib/theme';

export const personaShareSectionStyles = StyleSheet.create({
  wrap: {
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  heading: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  subtitle: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  toggle: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: REPORT_COLORS.ink,
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryLabel: {
    color: REPORT_COLORS.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  dim: {
    opacity: 0.6,
  },
  message: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
