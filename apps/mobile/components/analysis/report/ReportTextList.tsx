import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/lib/theme';

import { REPORT_COLORS } from './tokens';

export interface ReportTextListProps {
  items: string[];
  heading?: string;
  testID?: string;
}

/** 서버·정적 정본이 준 문자열만 담는 무장식 진단지 목록. */
export function ReportTextList({
  items,
  heading,
  testID = 'report-text-list',
}: ReportTextListProps): React.JSX.Element | null {
  const visible = items.filter((item) => item.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      <View style={styles.list}>
        {visible.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.row}>
            <Text accessibilityElementsHidden style={styles.bullet}>
              •
            </Text>
            <Text style={styles.body}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heading: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  list: {
    gap: spacing.smd,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
  body: {
    color: REPORT_COLORS.ink,
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
});
