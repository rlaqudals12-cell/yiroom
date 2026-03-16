/**
 * 유사 제품 추천 컴포넌트
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface SimilarProduct {
  id: string;
  name: string;
  brand: string;
  price?: number;
  matchRate?: number;
}

interface SimilarProductsProps {
  products: SimilarProduct[];
  onPress: (productId: string) => void;
}

export function SimilarProducts({ products, onPress }: SimilarProductsProps): React.ReactElement {
  if (products.length === 0) return <View />;

  return (
    <View style={styles.container} testID="similar-products">
      <Text style={styles.title}>비슷한 제품</Text>
      {products.map((product) => (
        <Pressable
          key={product.id}
          style={styles.item}
          onPress={() => onPress(product.id)}
          testID={`similar-${product.id}`}
        >
          <View style={styles.info}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          </View>
          <View style={styles.right}>
            {product.matchRate && (
              <Text style={styles.matchRate}>{product.matchRate}%</Text>
            )}
            {product.price && (
              <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 16, fontWeight: '600' as const, marginBottom: 12 },
  item: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 12, borderRadius: 8, backgroundColor: '#1f2937', marginBottom: 8 },
  info: { flex: 1 },
  brand: { fontSize: 11, color: '#9ca3af' },
  name: { fontSize: 14, marginTop: 2 },
  right: { alignItems: 'flex-end' as const },
  matchRate: { fontSize: 14, fontWeight: '600' as const, color: '#ec4899' },
  price: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
