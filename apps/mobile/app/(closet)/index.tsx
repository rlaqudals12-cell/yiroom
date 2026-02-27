/**
 * 내 옷장 메인 페이지
 * 옷장 아이템 목록 및 카테고리별 필터
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Plus, Heart } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenContainer } from '@/components/ui';
import { staggeredEntry } from '@/lib/animations';
import { SkeletonText, SkeletonCard } from '@/components/ui/SkeletonLoader';
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
  const { colors, module: moduleTheme, shadows: themeShadows } = useTheme();
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
      <ScreenContainer scrollable={false} testID="closet-screen">
        <View style={styles.loadingContainer}>
          <View style={styles.statsContainer}>
            <SkeletonCard style={{ flex: 1, height: 70 }} />
            <SkeletonCard style={{ flex: 1, height: 70 }} />
            <SkeletonCard style={{ flex: 1, height: 70 }} />
          </View>
          <SkeletonText style={{ width: '90%', height: 36, alignSelf: 'center' }} />
          <View style={styles.gridRow}>
            <SkeletonCard style={{ width: '48%', height: 180, marginTop: 16, marginLeft: 16 }} />
            <SkeletonCard style={{ width: '48%', height: 180, marginTop: 16, marginRight: 16 }} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="closet-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 통계 헤더 */}
      <Animated.View entering={staggeredEntry(0)} style={styles.statsContainer}>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>전체</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.favorites}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>즐겨찾기</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.categories}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>카테고리</Text>
        </GlassCard>
      </Animated.View>

      {/* 카테고리 필터 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: colors.muted },
                selectedCategory === item.key && { backgroundColor: moduleTheme.body.dark },
              ]}
              onPress={() => handleCategoryPress(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.mutedForeground },
                  selectedCategory === item.key && { color: colors.overlayForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 아이템 목록 */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {selectedCategory === 'all'
              ? '옷장이 비어있어요'
              : `${FILTER_OPTIONS.find((f) => f.key === selectedCategory)?.label} 아이템이 없어요`}
          </Text>
          <Pressable style={[styles.emptyButton, { backgroundColor: moduleTheme.body.dark }]} onPress={handleAddPress}>
            <Text style={[styles.emptyButtonText, { color: colors.overlayForeground }]}>아이템 추가하기</Text>
          </Pressable>
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
            <Pressable
              style={[styles.itemCard, { backgroundColor: colors.card }]}
              onPress={() => handleItemPress(item.id)}
            >
              <View style={styles.itemImageContainer}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.itemPlaceholder, { backgroundColor: colors.muted }]}>
                    <Text style={styles.placeholderText}>📷</Text>
                  </View>
                )}
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => handleFavoritePress(item.id)}
                >
                  <Heart
                    size={18}
                    color={item.isFavorite ? colors.destructive : colors.mutedForeground}
                    fill={item.isFavorite ? colors.destructive : 'transparent'}
                  />
                </Pressable>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                  {CLOTHING_CATEGORY_LABELS[item.subCategory as ClothingCategory] ||
                    item.subCategory}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* 추가 버튼 */}
      <Pressable style={[styles.addButton, { backgroundColor: moduleTheme.body.dark, ...themeShadows.lg }]} onPress={handleAddPress}>
        <Plus size={24} color={colors.overlayForeground} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
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
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
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
    borderRadius: 12,
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
