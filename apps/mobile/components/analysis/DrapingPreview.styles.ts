import { StyleSheet } from 'react-native';

import { REPORT_COLORS } from './report/tokens';
import { radii, spacing, typography } from '../../lib/theme';

export const drapingPreviewStyles = StyleSheet.create({
  seasonInfo: {
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  seasonName: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  seasonDesc: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  observeHint: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
    marginBottom: spacing.smd,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.smd,
  },
  figure: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  image: {
    borderRadius: radii.xl,
  },
  bandWrap: {
    bottom: 0,
    height: '13%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  band: {
    flex: 1,
  },
  caption: {
    fontSize: typography.size.xs,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    width: 26,
  },
  honestNote: {
    color: REPORT_COLORS.mutedInk,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.smd,
  },
});
