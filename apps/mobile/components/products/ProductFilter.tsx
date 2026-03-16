/**
 * 제품 필터 컴포넌트
 * 카테고리, 가격, 성분별 필터링
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

export interface FilterOption {
  key: string;
  label: string;
  isActive: boolean;
}

interface ProductFilterProps {
  categories: FilterOption[];
  onToggle: (key: string) => void;
  onReset: () => void;
}

export function ProductFilter({ categories, onToggle, onReset }: ProductFilterProps): React.ReactElement {
  const hasActive = categories.some((c) => c.isActive);

  return (
    <View style={styles.container} testID="product-filter">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {hasActive && (
          <Pressable style={styles.resetChip} onPress={onReset} testID="filter-reset">
            <Text style={styles.resetText}>초기화</Text>
          </Pressable>
        )}
        {categories.map((cat) => (
          <Pressable
            key={cat.key}
            style={[styles.chip, cat.isActive && styles.activeChip]}
            onPress={() => onToggle(cat.key)}
            testID={`filter-${cat.key}`}
          >
            <Text style={[styles.chipText, cat.isActive && styles.activeChipText]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f2937', marginRight: 8 },
  activeChip: { backgroundColor: '#ec4899' },
  chipText: { fontSize: 13, color: '#9ca3af' },
  activeChipText: { color: '#fff', fontWeight: '600' as const },
  resetChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#6b7280', marginRight: 8 },
  resetText: { fontSize: 13, color: '#6b7280' },
});
