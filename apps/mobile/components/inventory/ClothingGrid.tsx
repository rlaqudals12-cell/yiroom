/**
 * ClothingGrid — 의류 그리드
 *
 * 옷장의 의류 목록을 표시. FlatList 기반.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ClothingCard, type ClothingCardProps } from './ClothingCard';

export interface ClothingGridProps {
  items: Omit<ClothingCardProps, 'onPress' | 'style'>[];
  onItemPress?: (id: string) => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function ClothingGrid({
  items,
  onItemPress,
  emptyMessage = '등록된 의류가 없습니다',
  style,
}: ClothingGridProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  if (items.length === 0) {
    return (
      <View
        style={[styles.empty, { padding: spacing.xl }]}
        testID="clothing-grid"
        accessibilityLabel={emptyMessage}
      >
        <Text style={{ fontSize: typography.size.xl, textAlign: 'center' }}>👗</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={style} testID="clothing-grid" accessibilityLabel={`의류 ${items.length}개`}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClothingCard {...item} onPress={onItemPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {},
});
