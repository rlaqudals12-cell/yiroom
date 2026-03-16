/**
 * 제품 캐러셀 컴포넌트
 */

import React from 'react';
import { View, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

interface Product {
  id: string;
  name: string;
  brand: string;
  price?: number;
  imageUrl?: string;
}

interface ProductCarouselProps {
  products: Product[];
  renderItem: (info: ListRenderItemInfo<Product>) => React.ReactElement;
  itemWidth?: number;
}

export function ProductCarousel({
  products,
  renderItem,
  itemWidth = 160,
}: ProductCarouselProps): React.ReactElement {
  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      snapToInterval={itemWidth + 12}
      decelerationRate="fast"
      testID="product-carousel"
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
});
