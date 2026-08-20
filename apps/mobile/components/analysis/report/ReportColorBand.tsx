import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@/lib/theme';

import { REPORT_COLORS } from './tokens';

export interface ReportColorBandProps {
  colors: string[];
  title?: string;
  testID?: string;
}

/** 추천색을 장식 그라데이션이 아닌, 순서가 보존된 개별 색면으로 보여준다. */
export function ReportColorBand({
  colors,
  title,
  testID = 'report-color-band',
}: ReportColorBandProps): React.JSX.Element | null {
  if (colors.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View accessibilityRole="summary" style={styles.band}>
        {colors.map((color, index) => (
          <View
            key={`${color}-${index}`}
            accessible
            accessibilityLabel={`추천 색 ${index + 1}, ${color}`}
            style={[styles.swatch, { backgroundColor: color }]}
            testID={`${testID}-swatch-${index}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  band: {
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 40,
    overflow: 'hidden',
  },
  swatch: {
    flex: 1,
    minWidth: 24,
  },
});
