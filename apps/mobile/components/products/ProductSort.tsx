/**
 * 제품 정렬 컴포넌트
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'match_rate' | 'newest';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'match_rate', label: '매칭률순' },
  { key: 'popular', label: '인기순' },
  { key: 'price_asc', label: '가격 낮은순' },
  { key: 'price_desc', label: '가격 높은순' },
  { key: 'newest', label: '최신순' },
];

interface ProductSortProps {
  selected: SortOption;
  onSelect: (option: SortOption) => void;
}

export function ProductSort({ selected, onSelect }: ProductSortProps): React.ReactElement {
  return (
    <View style={styles.container} testID="product-sort">
      {SORT_OPTIONS.map((opt) => (
        <Pressable
          key={opt.key}
          style={[styles.option, selected === opt.key && styles.selectedOption]}
          onPress={() => onSelect(opt.key)}
          testID={`sort-${opt.key}`}
        >
          <Text style={[styles.optionText, selected === opt.key && styles.selectedText]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row' as const, paddingHorizontal: 16, paddingVertical: 8, flexWrap: 'wrap' as const },
  option: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, marginBottom: 4 },
  selectedOption: { borderBottomWidth: 2, borderBottomColor: '#ec4899' },
  optionText: { fontSize: 13, color: '#9ca3af' },
  selectedText: { color: '#ec4899', fontWeight: '600' as const },
});
