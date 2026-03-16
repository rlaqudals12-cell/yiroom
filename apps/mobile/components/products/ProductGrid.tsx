/**
 * 제품 그리드 레이아웃
 */

import React from 'react';
import { View, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

interface Product {
  id: string;
  name: string;
  brand: string;
  price?: number;
  imageUrl?: string;
  matchRate?: number;
}

interface ProductGridProps {
  products: Product[];
  numColumns?: number;
  renderItem: (info: ListRenderItemInfo<Product>) => React.ReactElement;
  onEndReached?: () => void;
  ListEmptyComponent?: React.ReactElement;
}

export function ProductGrid({
  products,
  numColumns = 2,
  renderItem,
  onEndReached,
  ListEmptyComponent,
}: ProductGridProps): React.ReactElement {
  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      contentContainerStyle={styles.container}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={ListEmptyComponent}
      testID="product-grid"
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  row: { justifyContent: 'space-between' as const },
});
