/**
 * InventoryGrid — 인벤토리 그리드
 *
 * 보유 제품 목록을 그리드로 표시. FlatList 기반.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ItemCard, type ItemCardProps } from './ItemCard';

export interface InventoryGridProps {
  items: Omit<ItemCardProps, 'onPress' | 'style'>[];
  onItemPress?: (id: string) => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function InventoryGrid({
  items,
  onItemPress,
  emptyMessage = '등록된 제품이 없습니다',
  style,
}: InventoryGridProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  if (items.length === 0) {
    return (
      <View
        style={[styles.empty, { padding: spacing.xl }]}
        testID="inventory-grid"
        accessibilityLabel={emptyMessage}
      >
        <Text style={{ fontSize: typography.size.xl, textAlign: 'center' }}>📦</Text>
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
    <View style={style} testID="inventory-grid" accessibilityLabel={`보유 제품 ${items.length}개`}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard {...item} onPress={onItemPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {},
});
