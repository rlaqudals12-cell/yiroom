import { StyleSheet, View } from 'react-native';

import { REPORT_COLORS } from './tokens';

export interface ReportDividerProps {
  inset?: number;
  testID?: string;
}

/** 진단지의 섹션과 행만 나누는 웜 헤어라인. */
export function ReportDivider({
  inset = 0,
  testID = 'report-divider',
}: ReportDividerProps): React.JSX.Element {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={[styles.rule, { marginHorizontal: inset }]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  rule: {
    backgroundColor: REPORT_COLORS.rule,
    height: StyleSheet.hairlineWidth,
  },
});
