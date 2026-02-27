/**
 * EmptyState 공통 컴포넌트
 * @description 빈 상태 UI — 아이콘 + 제목 + 설명 + 선택적 액션 버튼
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme, spacing } from '../../lib/theme';

import { useAppPreferencesStore } from '@/lib/stores';

interface EmptyStateProps {
  /** 아이콘 (React 노드 또는 이모지 텍스트) */
  icon: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description: string;
  /** 액션 버튼 라벨 */
  actionLabel?: string;
  /** 액션 버튼 핸들러 */
  onAction?: () => void;
  /** 테스트 ID */
  testID?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  testID = 'empty-state',
}: EmptyStateProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  return (
    <View testID={testID} style={styles.container} accessibilityRole="text">
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.secondary,
            width: spacing.xl * 2,
            height: spacing.xl * 2,
            borderRadius: spacing.xl,
          },
        ]}
      >
        {icon}
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
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
          },
        ]}
      >
        {description}
      </Text>

      {onAction && actionLabel && (
        <Pressable
          onPress={() => {
            if (hapticEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onAction();
          }}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: brand.primaryForeground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {actionLabel}
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
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.md + spacing.xs,
  },
  actionText: {
    textAlign: 'center',
  },
});
