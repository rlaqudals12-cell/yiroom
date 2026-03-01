/**
 * ProductRecommendation — 제품 추천 카드
 *
 * 피부 상태 기반 스킨케어 제품 추천.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ProductRecommendationProps {
  productName: string;
  brand: string;
  category: string;
  reason: string;
  matchRate?: number;
  price?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ProductRecommendation({
  productName,
  brand,
  category,
  reason,
  matchRate,
  price,
  onPress,
  style,
}: ProductRecommendationProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, score } = useTheme();

  const matchColor = matchRate !== undefined
    ? matchRate >= 80 ? score.excellent : matchRate >= 60 ? score.good : score.caution
    : colors.mutedForeground;

  return (
    <Pressable
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
      onPress={onPress}
      disabled={!onPress}
      testID="product-recommendation"
      accessibilityLabel={`${brand} ${productName} 추천${matchRate ? `, 매칭률 ${matchRate}%` : ''}`}
    >
      {/* 카테고리 태그 */}
      <View
        style={[
          styles.tag,
          {
            backgroundColor: module.skin.light,
            borderRadius: radii.full,
            paddingVertical: spacing.xxs,
            paddingHorizontal: spacing.sm,
            alignSelf: 'flex-start',
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            color: module.skin.dark,
          }}
        >
          {category}
        </Text>
      </View>

      {/* 제품 정보 */}
      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: spacing.sm,
        }}
      >
        {brand}
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginTop: spacing.xxs,
        }}
      >
        {productName}
      </Text>

      {/* 추천 이유 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
        }}
      >
        {reason}
      </Text>

      {/* 하단 */}
      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        {matchRate !== undefined && (
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: matchColor,
            }}
          >
            매칭 {matchRate}%
          </Text>
        )}
        {price && (
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            {price}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  tag: {},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
