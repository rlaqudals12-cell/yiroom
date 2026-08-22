import { StyleSheet } from 'react-native';

import { coloredShadow, moduleColors, radii, spacing, typography } from '@/lib/theme';

export const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: spacing.smx,
  },
  weatherCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.smx,
  },
  weatherFallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.smx,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: typography.size.sm,
  },
  weatherIcon: {
    fontSize: typography.size.sm,
  },
  weatherSourceBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  weatherSourceBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  weatherTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.smx,
    paddingVertical: 6,
    borderRadius: radii.xl,
  },
  tagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  analyzeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: 6,
  },
  analyzeCtaText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  outfitSection: {
    marginBottom: spacing.md,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  outfitTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smx,
  },
  outfitItem: {
    width: '48%',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  outfitImageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  outfitItemInfo: {
    padding: spacing.smd,
  },
  outfitItemLabel: {
    fontSize: 11,
    marginBottom: spacing.xxs,
  },
  outfitItemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: 6,
  },
  scoreContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 2,
  },
  tipsCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningsCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  noOutfitContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noOutfitText: {
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  noOutfitSubtext: {
    fontSize: 13,
  },
  saveOutfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.xl,
  },
  saveOutfitButtonDisabled: {
    opacity: 0.6,
  },
  saveOutfitButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  summaryCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  summaryTotal: {
    fontSize: typography.size.xs,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  summaryBasis: {
    fontSize: 11,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.smx,
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  suggestionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
    borderRadius: radii.xl,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...coloredShadow(moduleColors.body.base, 'lg'),
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
