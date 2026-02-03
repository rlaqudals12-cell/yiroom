/**
 * 분석 에러 상태 컴포넌트
 *
 * 분석 실패 시 표시하는 공통 에러 UI
 * - 재시도 버튼
 * - 홈으로 돌아가기 버튼
 */
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface AnalysisErrorStateProps {
  /** 에러 메시지 */
  message?: string;
  /** 재시도 버튼 텍스트 */
  retryText?: string;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 홈으로 이동 핸들러 */
  onGoHome?: () => void;
  /** 다크 모드 여부 */
  isDark?: boolean;
  /** 테스트 ID */
  testID?: string;
}

export function AnalysisErrorState({
  message = '분석에 실패했습니다.',
  retryText = '다시 시도하기',
  onRetry,
  onGoHome,
  isDark = false,
  testID = 'analysis-error',
}: AnalysisErrorStateProps) {
  return (
    <View
      style={[styles.container, isDark && styles.containerDark]}
      testID={testID}
      accessibilityRole="alert"
    >
      <Text
        style={[styles.errorText, isDark && styles.textLight]}
        accessibilityLabel={message}
      >
        {message}
      </Text>

      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryText}
            testID={`${testID}-retry`}
          >
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </TouchableOpacity>
        )}

        {onGoHome && (
          <TouchableOpacity
            style={[styles.homeButton, isDark && styles.homeButtonDark]}
            onPress={onGoHome}
            accessibilityRole="button"
            accessibilityLabel="홈으로 돌아가기"
            testID={`${testID}-home`}
          >
            <Text
              style={[styles.homeButtonText, isDark && styles.homeButtonTextDark]}
            >
              홈으로 돌아가기
            </Text>
          </TouchableOpacity>
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
    backgroundColor: '#f8f9fc',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  textLight: {
    color: '#ffffff',
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: '#2e5afa',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonDark: {
    borderColor: '#333',
  },
  homeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  homeButtonTextDark: {
    color: '#999',
  },
});
