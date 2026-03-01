/**
 * CategoryFilter — 카테고리 필터
 *
 * 인벤토리 카테고리 선택 칩 그룹.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface CategoryOption {
  id: string;
  label: string;
  emoji?: string;
  count?: number;
}

export interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  style?: ViewStyle;
}

export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
  style,
}: CategoryFilterProps): React.JSX.Element {
  const { colors, spacing, typography, radii, brand } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.row, { gap: spacing.sm }]}
      testID="category-filter"
      accessibilityLabel="카테고리 필터"
    >
      {categories.map((cat) => {
        const isActive = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? brand.primary : colors.secondary,
                borderRadius: radii.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.smx,
              },
            ]}
            onPress={() => onSelect?.(cat.id)}
            accessibilityLabel={`${cat.label}${cat.count !== undefined ? ` ${cat.count}개` : ''}${isActive ? ', 선택됨' : ''}`}
            accessibilityRole="button"
          >
            {cat.emoji && (
              <Text style={{ fontSize: typography.size.sm, marginRight: spacing.xxs }}>
                {cat.emoji}
              </Text>
            )}
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: isActive ? typography.weight.bold : typography.weight.normal,
                color: isActive ? brand.primaryForeground : colors.foreground,
              }}
            >
              {cat.label}
            </Text>
            {cat.count !== undefined && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: isActive ? brand.primaryForeground : colors.mutedForeground,
                  marginLeft: spacing.xxs,
                }}
              >
                {cat.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
