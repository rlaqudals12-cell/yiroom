/**
 * 분석 결과 화면 공통 버튼 그룹
 *
 * 모든 분석 결과 화면(body, personal-color, skin)에서 사용하는
 * 주 액션, 홈 이동, 재분석 버튼 그룹
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface AnalysisResultButtonsProps {
  /** 주 버튼 텍스트 */
  primaryText: string;
  /** 주 버튼 클릭 핸들러 */
  onPrimaryPress: () => void;
  /** 홈 이동 핸들러 */
  onGoHome: () => void;
  /** 재분석 핸들러 */
  onRetry: () => void;
  /** 테스트 ID */
  testID?: string;
}

export function AnalysisResultButtons({
  primaryText,
  onPrimaryPress,
  onGoHome,
  onRetry,
  testID = 'analysis-result-buttons',
}: AnalysisResultButtonsProps) {
  return (
    <View style={styles.buttons} testID={testID}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onPrimaryPress}
        testID={`${testID}-primary`}
      >
        <Text style={styles.primaryButtonText}>{primaryText}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onGoHome}
        testID={`${testID}-home`}
      >
        <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.retryLink}
        onPress={onRetry}
        testID={`${testID}-retry`}
      >
        <Text style={styles.retryLinkText}>다시 분석하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retryLinkText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
