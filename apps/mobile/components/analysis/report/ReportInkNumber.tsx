import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/lib/theme';

import { REPORT_COLORS } from './tokens';

export interface ReportInkNumberProps {
  value: number | string;
  unit?: string;
  status?: string;
  accessibilityLabel: string;
  testID?: string;
}

/**
 * 숫자를 등급·게이지·신호등으로 번역하지 않고 잉크 활자로만 보여준다.
 * score/grade/colorByValue 같은 prop을 두지 않아 채점표 회귀를 API 단계에서 막는다.
 */
export function ReportInkNumber({
  value,
  unit,
  status,
  accessibilityLabel,
  testID = 'report-ink-number',
}: ReportInkNumberProps): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
      testID={testID}
    >
      <Text style={styles.value}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  value: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.xl,
    fontVariant: ['tabular-nums'],
    fontWeight: typography.weight.semibold,
    lineHeight: 28,
  },
  unit: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.normal,
  },
  status: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 28,
  },
});
