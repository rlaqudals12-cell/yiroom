/**
 * ItemCard — 인벤토리 아이템 카드
 *
 * 보유 제품(스킨케어, 화장품 등) 하나를 표시하는 카드.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ItemCardProps {
  id: string;
  name: string;
  brand: string;
  category: string;
  emoji?: string;
  expiryDate?: string;
  isExpired?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export const ItemCard = memo(function ItemCard({
  id,
  name,
  brand: itemBrand,
  category,
  emoji = '🧴',
  expiryDate,
  isExpired = false,
  onPress,
  style,
}: ItemCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

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
      onPress={() => onPress?.(id)}
      disabled={!onPress}
      testID="item-card"
      accessibilityLabel={`${itemBrand} ${name}${isExpired ? ', 기한 만료' : ''}`}
    >
      <View style={[styles.emojiBox, { backgroundColor: colors.secondary, borderRadius: radii.lg }]}>
        <Text style={{ fontSize: typography.size.xl }}>{emoji}</Text>
      </View>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginTop: spacing.xxs,
          }}
        >
          {itemBrand} · {category}
        </Text>
        {expiryDate && (
          <Text
            style={{
              fontSize: typography.size.xs,
              color: isExpired ? status.error : colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            {isExpired ? '⚠️ 기한 만료' : `유통기한: ${expiryDate}`}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBox: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
