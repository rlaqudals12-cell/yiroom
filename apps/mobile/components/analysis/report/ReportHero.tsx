import { StyleSheet, Text, View } from 'react-native';

import { ResultVerdictText } from '@/components/analysis/ResultVerdictText';
import { spacing, typography } from '@/lib/theme';

import { REPORT_COLORS } from './tokens';

export interface ReportHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  testID?: string;
}

/** 리포트 이름은 작게, 데이터 결론은 좌정렬 세리프로 먼저 읽히게 한다. */
export function ReportHero({
  eyebrow,
  title,
  subtitle,
  testID = 'report-hero',
}: ReportHeroProps): React.JSX.Element {
  return (
    <View style={styles.container} testID={testID}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <ResultVerdictText color={REPORT_COLORS.ink} textAlign="left" testID={`${testID}-title`}>
        {title}
      </ResultVerdictText>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    gap: spacing.sm,
    width: '100%',
  },
  eyebrow: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
  subtitle: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
});
