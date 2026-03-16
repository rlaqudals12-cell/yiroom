/**
 * 제품 비교 컴포넌트
 * 2개 제품을 좌우로 나란히 비교
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Product {
  id: string;
  name: string;
  brand: string;
  price?: number;
  rating?: number;
  matchRate?: number;
  keyIngredients?: string[];
  imageUrl?: string;
}

interface ProductCompareProps {
  productA: Product;
  productB: Product;
}

export function ProductCompare({ productA, productB }: ProductCompareProps): React.ReactElement {
  return (
    <ScrollView style={styles.container} testID="product-compare">
      <Text style={styles.title}>제품 비교</Text>

      {/* 제품명 */}
      <CompareRow label="제품명" valueA={productA.name} valueB={productB.name} />
      <CompareRow label="브랜드" valueA={productA.brand} valueB={productB.brand} />

      {/* 가격 */}
      <CompareRow
        label="가격"
        valueA={productA.price ? `${productA.price.toLocaleString()}원` : '-'}
        valueB={productB.price ? `${productB.price.toLocaleString()}원` : '-'}
        highlightLower
        numA={productA.price}
        numB={productB.price}
      />

      {/* 평점 */}
      <CompareRow
        label="평점"
        valueA={productA.rating ? `${productA.rating}점` : '-'}
        valueB={productB.rating ? `${productB.rating}점` : '-'}
        highlightHigher
        numA={productA.rating}
        numB={productB.rating}
      />

      {/* 매칭률 */}
      <CompareRow
        label="매칭률"
        valueA={productA.matchRate ? `${productA.matchRate}%` : '-'}
        valueB={productB.matchRate ? `${productB.matchRate}%` : '-'}
        highlightHigher
        numA={productA.matchRate}
        numB={productB.matchRate}
      />

      {/* 주요 성분 */}
      <View style={styles.row}>
        <Text style={styles.label}>주요 성분</Text>
        <View style={styles.values}>
          <Text style={[styles.value, styles.valueLeft]}>
            {productA.keyIngredients?.join(', ') || '-'}
          </Text>
          <Text style={[styles.value, styles.valueRight]}>
            {productB.keyIngredients?.join(', ') || '-'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function CompareRow({
  label,
  valueA,
  valueB,
  highlightHigher,
  highlightLower,
  numA,
  numB,
}: {
  label: string;
  valueA: string;
  valueB: string;
  highlightHigher?: boolean;
  highlightLower?: boolean;
  numA?: number;
  numB?: number;
}): React.ReactElement {
  const aWins =
    numA !== undefined &&
    numB !== undefined &&
    ((highlightHigher && numA > numB) || (highlightLower && numA < numB));
  const bWins =
    numA !== undefined &&
    numB !== undefined &&
    ((highlightHigher && numB > numA) || (highlightLower && numB < numA));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.values}>
        <Text style={[styles.value, styles.valueLeft, aWins && styles.highlighted]}>{valueA}</Text>
        <Text style={[styles.value, styles.valueRight, bWins && styles.highlighted]}>{valueB}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16, textAlign: 'center' as const },
  row: { marginBottom: 12 },
  label: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  values: { flexDirection: 'row' as const },
  value: { flex: 1, fontSize: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#1f2937' },
  valueLeft: { marginRight: 4 },
  valueRight: { marginLeft: 4 },
  highlighted: { color: '#ec4899', fontWeight: '600' as const },
});
