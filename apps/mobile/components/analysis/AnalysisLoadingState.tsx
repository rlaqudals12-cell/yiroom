/**
 * 분석 로딩 상태 컴포넌트
 *
 * 분석 진행 중일 때 표시하는 공통 로딩 UI.
 * ScanLineOverlay 통합 — 웹의 scan-line 효과 대응.
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { ScanLineOverlay } from '@/components/ui';
import { useTheme , spacing } from '@/lib/theme';

export interface AnalysisLoadingStateProps {
  /** 로딩 메시지 */
  message?: string;
  /** 테스트 ID */
  testID?: string;
}

export function AnalysisLoadingState({
  message = '분석 중이에요...',
  testID = 'analysis-loading',
}: AnalysisLoadingStateProps) {
  const { colors, brand } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID}
      accessibilityLabel={message}
      accessibilityRole="progressbar"
    >
      {/* 스캔 라인 애니메이션 (웹 scan-line 대응) */}
      <ScanLineOverlay active height={200} color={brand.primary} />
      <ActivityIndicator size="large" color={brand.primary} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>{message}</Text>
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
  text: {
    marginTop: spacing.md,
    fontSize: 16,
    textAlign: 'center',
  },
});
