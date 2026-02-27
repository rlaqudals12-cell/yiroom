/**
 * 분석 에러 상태 컴포넌트
 *
 * 분석 실패 시 표시하는 공통 에러 UI
 * - 재시도 버튼
 * - 홈으로 돌아가기 버튼
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useTheme, typography, spacing } from '@/lib/theme';

export interface AnalysisErrorStateProps {
  /** 에러 메시지 */
  message?: string;
  /** 재시도 버튼 텍스트 */
  retryText?: string;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 홈으로 이동 핸들러 */
  onGoHome?: () => void;
  /** 테스트 ID */
  testID?: string;
}

export function AnalysisErrorState({
  message = '분석에 실패했습니다.',
  retryText = '다시 시도하기',
  onRetry,
  onGoHome,
  testID = 'analysis-error',
}: AnalysisErrorStateProps) {
  const { colors, brand, typography } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID}
      accessibilityRole="alert"
    >
      <Text
        style={[styles.errorText, { color: colors.mutedForeground }]}
        accessibilityLabel={message}
      >
        {message}
      </Text>

      <View style={styles.buttonContainer}>
        {onRetry && (
          <Pressable
            style={[styles.retryButton, { backgroundColor: brand.primary }]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryText}
            testID={`${testID}-retry`}
          >
            <Text style={[styles.retryButtonText, { color: brand.primaryForeground }]}>
              {retryText}
            </Text>
          </Pressable>
        )}

        {onGoHome && (
          <Pressable
            style={[styles.homeButton, { borderColor: colors.border }]}
            onPress={onGoHome}
            accessibilityRole="button"
            accessibilityLabel="홈으로 돌아가기"
            testID={`${testID}-home`}
          >
            <Text style={[styles.homeButtonText, { color: colors.mutedForeground }]}>
              홈으로 돌아가기
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: typography.weight.semibold,
  },
  homeButton: {
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
  },
});
