/**
 * ClothingCard — 의류 아이템 카드
 *
 * 옷장의 개별 의류 아이템을 표시.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type ClothingCategory = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

export interface ClothingCardProps {
  id: string;
  name: string;
  category: ClothingCategory;
  color?: string;
  season?: string;
  isFavorite?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const CATEGORY_EMOJI: Record<ClothingCategory, string> = {
  top: '👕',
  bottom: '👖',
  outer: '🧥',
  shoes: '👟',
  accessory: '🎒',
};

const CATEGORY_LABEL: Record<ClothingCategory, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  accessory: '악세서리',
};

export const ClothingCard = memo(function ClothingCard({
  id,
  name,
  category,
  color,
  season,
  isFavorite = false,
  onPress,
  style,
}: ClothingCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

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
      testID="clothing-card"
      accessibilityLabel={`${name}, ${CATEGORY_LABEL[category]}${isFavorite ? ', 즐겨찾기' : ''}`}
    >
      <View style={[styles.emojiBox, { backgroundColor: colors.secondary, borderRadius: radii.xl }]}>
        <Text style={{ fontSize: typography.size.xl }}>{CATEGORY_EMOJI[category]}</Text>
      </View>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <View style={styles.nameRow}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {isFavorite && <Text style={{ fontSize: typography.size.sm }}>❤️</Text>}
        </View>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
          {CATEGORY_LABEL[category]}
          {color ? ` · ${color}` : ''}
          {season ? ` · ${season}` : ''}
        </Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
