/**
 * 분석 로딩 상태 컴포넌트
 *
 * 분석 진행 중일 때 표시하는 공통 로딩 UI
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export interface AnalysisLoadingStateProps {
  /** 로딩 메시지 */
  message?: string;
  /** 다크 모드 여부 */
  isDark?: boolean;
  /** 테스트 ID */
  testID?: string;
}

export function AnalysisLoadingState({
  message = '분석 중이에요...',
  isDark = false,
  testID = 'analysis-loading',
}: AnalysisLoadingStateProps) {
  return (
    <View
      style={[styles.container, isDark && styles.containerDark]}
      testID={testID}
      accessibilityLabel={message}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color="#2e5afa" />
      <Text style={[styles.text, isDark && styles.textLight]}>{message}</Text>
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
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  textLight: {
    color: '#ffffff',
  },
});
