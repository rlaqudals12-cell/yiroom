/**
 * AnalysisShareCard — 분석 결과 공유 카드
 *
 * 분석 결과를 소셜/메시지로 공유하는 카드.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface AnalysisShareCardProps {
  analysisType: string;
  emoji?: string;
  summary: string;
  score?: number;
  onShare?: () => void;
  onCopyLink?: () => void;
  style?: ViewStyle;
}

export function AnalysisShareCard({
  analysisType,
  emoji = '📊',
  summary,
  score,
  onShare,
  onCopyLink,
  style,
}: AnalysisShareCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="analysis-share-card"
      accessibilityLabel={`${analysisType} 결과 공유`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.xl }}>{emoji}</Text>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {analysisType}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
            numberOfLines={2}
          >
            {summary}
          </Text>
        </View>
        {score !== undefined && (
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: brand.primary,
            }}
          >
            {score}점
          </Text>
        )}
      </View>

      <View style={[styles.btnRow, { marginTop: spacing.md, gap: spacing.sm }]}>
        {onShare && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onShare}
            accessibilityLabel="공유하기"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
                textAlign: 'center',
              }}
            >
              공유하기
            </Text>
          </Pressable>
        )}
        {onCopyLink && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onCopyLink}
            accessibilityLabel="링크 복사"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              링크 복사
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
