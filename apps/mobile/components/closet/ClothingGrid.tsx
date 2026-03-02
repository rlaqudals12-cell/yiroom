/**
 * ClothingGrid — 옷장 아이템 그리드 (2열)
 *
 * FlatList 기반 2열 그리드 레이아웃으로 옷장 아이템을 표시.
 * 카테고리 필터를 지원하여 특정 유형의 의류만 표시 가능.
 */
import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, type ViewStyle } from 'react-native';

import { useTheme, spacing } from '../../lib/theme';
import {
  ClosetClothingCard,
  type ClosetClothingCardProps,
  type ClosetCategory,
} from './ClothingCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ClothingGridItem = Omit<ClosetClothingCardProps, 'onPress' | 'style'>;

export interface ClothingGridProps {
  items: ClothingGridItem[];
  onItemPress?: (id: string) => void;
  /** 카테고리 필터 (예: 'top', 'bottom'). undefined이면 전체 표시 */
  filter?: ClosetCategory;
  emptyMessage?: string;
  style?: ViewStyle;
}

const NUM_COLUMNS = 2;

export function ClothingGrid({
  items,
  onItemPress,
  filter,
  emptyMessage = '등록된 의류가 없어요',
  style,
}: ClothingGridProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  // 필터 적용
  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  // 카드 너비 계산 (화면 너비 - 양쪽 패딩 - 카드 간 갭)
  const cardWidth = (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / NUM_COLUMNS;

  if (filteredItems.length === 0) {
    return (
      <View
        testID="closet-clothing-grid"
        accessibilityLabel={emptyMessage}
        style={[styles.emptyContainer, { padding: spacing.xl }, style]}
      >
        <Text style={{ fontSize: 32, textAlign: 'center' }}>👗</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.sm,
            lineHeight: typography.size.sm * 1.5,
          }}
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View
      testID="closet-clothing-grid"
      accessibilityLabel={`옷장 의류 ${filteredItems.length}개${filter ? ` (${filter})` : ''}`}
      style={style}
    >
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={[styles.row, { gap: spacing.sm }]}
        contentContainerStyle={{ gap: spacing.sm }}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <ClosetClothingCard
            {...item}
            onPress={onItemPress}
            style={{ width: cardWidth }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'flex-start',
  },
});
