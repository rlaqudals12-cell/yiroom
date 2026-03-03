/**
 * ErrorState — 에러 상태 UI 컴포넌트
 *
 * 네트워크 오류, API 실패 등 복구 가능한 에러 상태를 표시.
 * ErrorBoundary(크래시)와 달리, 데이터 로드 실패 시 사용.
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme , spacing } from '../../lib/theme';

import { useAppPreferencesStore } from '@/lib/stores';

interface ErrorStateProps {
  /** 사용자에게 표시할 메시지 */
  message?: string;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 재시도 버튼 라벨 */
  retryLabel?: string;
  /** 테스트 ID */
  testID?: string;
}

export function ErrorState({
  message = '데이터를 불러오지 못했어요',
  onRetry,
  retryLabel = '다시 시도',
  testID = 'error-state',
}: ErrorStateProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, status } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  return (
    <View testID={testID} style={styles.container} accessibilityRole="alert">
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: status.error + '15',
            width: 64,
            height: 64,
            borderRadius: 32,
          },
        ]}
      >
        <Text style={styles.emoji}>😥</Text>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: colors.foreground,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        문제가 발생했어요
      </Text>

      <Text
        style={[
          styles.message,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
          },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <Pressable
          onPress={() => {
            if (hapticEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onRetry();
          }}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.xl,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text
            style={[
              styles.retryText,
              {
                color: brand.primaryForeground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {retryLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: spacing.mlg,
  },
  retryText: {
    textAlign: 'center',
  },
});
