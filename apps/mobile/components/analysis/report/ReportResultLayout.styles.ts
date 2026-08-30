import { StyleSheet } from 'react-native';

import { brand, radii, spacing, typography } from '@/lib/theme';

import { REPORT_COLORS } from './tokens';

export const reportResultStyles = StyleSheet.create({
  ground: {
    backgroundColor: REPORT_COLORS.ground,
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheet: {
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.mlg,
  },
  fallbackNotice: {
    backgroundColor: REPORT_COLORS.warningWash,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.smd,
  },
  fallbackTitle: {
    color: REPORT_COLORS.warningInk,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  fallbackText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  saveNotice: {
    backgroundColor: REPORT_COLORS.warningWash,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.smd,
  },
  saveTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveTitle: {
    color: REPORT_COLORS.ink,
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  saveText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  saveRetry: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveRetryText: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
  },
  image: {
    alignSelf: 'flex-start',
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 144,
    marginTop: spacing.mlg,
    width: 112,
  },
  attributes: {
    marginTop: spacing.mlg,
  },
  conclusion: {
    marginTop: spacing.lg,
  },
  evidenceText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
  trustFooter: {
    paddingTop: spacing.smd,
  },
  trustText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    fontVariant: ['tabular-nums'],
  },
  followups: {
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  followupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.smd,
    minHeight: 64,
    paddingVertical: spacing.smd,
  },
  followupTextArea: {
    flex: 1,
    gap: spacing.xxs,
  },
  followupTitle: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  followupDescription: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.smx,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: brand.primary,
    borderRadius: radii.xl,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: brand.primaryForeground,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.base,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  retryButtonText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
  },
  reportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  reportButtonText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    textDecorationLine: 'underline',
  },
});
