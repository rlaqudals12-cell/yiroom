/**
 * 분석 결과 화면 공통 버튼 그룹
 *
 * 모든 분석 결과 화면에서 사용하는
 * 주 액션, 홈 이동, 재분석 버튼 그룹
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/lib/theme';

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
  const { colors, brand } = useTheme();

  return (
    <View style={styles.buttons} testID={testID}>
      <Pressable
        style={[styles.primaryButton, { backgroundColor: brand.primary }]}
        onPress={onPrimaryPress}
        testID={`${testID}-primary`}
      >
        <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
          {primaryText}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={onGoHome}
        testID={`${testID}-home`}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>
          홈으로 돌아가기
        </Text>
      </Pressable>
      <Pressable style={styles.retryLink} onPress={onRetry} testID={`${testID}-retry`}>
        <Text style={[styles.retryLinkText, { color: colors.mutedForeground }]}>
          다시 분석하기
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retryLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
