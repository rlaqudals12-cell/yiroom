/**
 * 내 옷장 메인 페이지
 * 옷장 아이템 목록 및 카테고리별 필터
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Plus, Heart } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { useCloset, type ClothingCategory, CLOTHING_CATEGORY_LABELS } from '../../lib/inventory';

type FilterCategory = ClothingCategory | 'all';

const FILTER_OPTIONS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'outer', label: '아우터' },
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'dress', label: '원피스' },
  { key: 'shoes', label: '신발' },
  { key: 'bag', label: '가방' },
  { key: 'accessory', label: '악세서리' },
];

export default function ClosetScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const { items, isLoading, error: _error, toggleFavorite, refetch } = useCloset();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  // 카테고리별 필터링
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.subCategory === selectedCategory);
  }, [items, selectedCategory]);

  // 통계
  const stats = useMemo(() => {
    const favorites = items.filter((item) => item.isFavorite).length;
    const categories = new Set(items.map((item) => item.subCategory)).size;
    return { total: items.length, favorites, categories };
  }, [items]);

  const handleCategoryPress = (category: FilterCategory) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
  };

  const handleItemPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/(closet)/${id}`);
  };

  const handleFavoritePress = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(id);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: 아이템 추가 화면으로 이동
    router.push('/(closet)/recommend');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 통계 헤더 */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>{stats.total}</Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>전체</Text>
        </View>
        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>{stats.favorites}</Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>즐겨찾기</Text>
        </View>
        <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>{stats.categories}</Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>카테고리</Text>
        </View>
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                isDark && styles.filterChipDark,
                selectedCategory === item.key && styles.filterChipSelected,
              ]}
              onPress={() => handleCategoryPress(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark && styles.textMuted,
                  selectedCategory === item.key && styles.filterChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 아이템 목록 */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            {selectedCategory === 'all'
              ? '옷장이 비어있어요'
              : `${FILTER_OPTIONS.find((f) => f.key === selectedCategory)?.label} 아이템이 없어요`}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddPress}>
            <Text style={styles.emptyButtonText}>아이템 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemCard, isDark && styles.itemCardDark]}
              onPress={() => handleItemPress(item.id)}
            >
              <View style={styles.itemImageContainer}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemPlaceholder, isDark && styles.placeholderDark]}>
                    <Text style={styles.placeholderText}>📷</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleFavoritePress(item.id)}
                >
                  <Heart
                    size={18}
                    color={item.isFavorite ? '#ef4444' : '#999'}
                    fill={item.isFavorite ? '#ef4444' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, isDark && styles.textLight]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemCategory, isDark && styles.textMuted]}>
                  {CLOTHING_CATEGORY_LABELS[item.subCategory as ClothingCategory] ||
                    item.subCategory}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 추가 버튼 */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#1a1a1a',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipDark: {
    backgroundColor: '#2a2a2a',
  },
  filterChipSelected: {
    backgroundColor: '#8b5cf6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemCardDark: {
    backgroundColor: '#1a1a1a',
  },
  itemImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#2a2a2a',
  },
  placeholderText: {
    fontSize: 32,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    padding: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
