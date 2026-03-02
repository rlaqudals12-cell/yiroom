/**
 * SkinConsultantCTA — AI 피부 상담 CTA
 *
 * AI 피부 상담을 유도하는 호출 카드. 분석 결과 → 상담 전환.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface SkinConsultantCTAProps {
  title?: string;
  description?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SkinConsultantCTA({
  title = 'AI 피부 상담',
  description = '분석 결과를 바탕으로 맞춤 솔루션을 제안해드려요',
  onPress,
  style,
}: SkinConsultantCTAProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, brand } = useTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: module.skin.base,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID="skin-consultant-cta"
      accessibilityLabel={`${title} 시작하기`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={{ fontSize: typography.size.xl, marginBottom: spacing.xs }}>
          💬
        </Text>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.overlayForeground,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: 'rgba(255,255,255,0.85)',
            marginTop: spacing.xs,
          }}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.btn,
          {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: radii.lg,
            paddingVertical: spacing.sm,
            marginTop: spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.overlayForeground,
            textAlign: 'center',
          }}
        >
          상담 시작하기
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  content: {},
  btn: {},
});
