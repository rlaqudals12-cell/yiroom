import { AlertTriangle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography, useTheme } from '@/lib/theme';

export interface AnalysisSaveFailureNoticeProps {
  onRetry: () => void;
  testID?: string;
}

/** 분석은 끝났지만 서버 기록 저장만 실패한 상태를 숨기지 않고 복구 경로를 제공한다. */
export function AnalysisSaveFailureNotice({
  onRetry,
  testID = 'analysis-save-failure-notice',
}: AnalysisSaveFailureNoticeProps): React.JSX.Element {
  const { colors, status } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={testID}
    >
      <View style={styles.headingRow}>
        <AlertTriangle color={status.warning} size={18} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          분석 결과를 기록에 저장하지 못했어요
        </Text>
      </View>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        결과는 지금 확인할 수 있지만, 다시 방문하면 이 결과를 불러오지 못할 수 있어요.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다시 분석하기"
        onPress={onRetry}
        style={[styles.retryButton, { borderColor: colors.border }]}
        testID={`${testID}-retry`}
      >
        <Text style={[styles.retryText, { color: colors.foreground }]}>다시 분석하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  body: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  retryText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
