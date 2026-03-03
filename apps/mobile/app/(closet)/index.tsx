/**
 * 내 옷장 메인 페이지
 * 옷장 아이템 목록 및 카테고리별 필터
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Plus, Heart, SlidersHorizontal } from 'lucide-react-native';
import React, { useState, useMemo, useCallback } from 'react';
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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { staggeredEntry } from '@/lib/animations';
import { SkeletonText, SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useTheme, typography, radii , spacing } from '@/lib/theme';

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
  const { colors, module: moduleTheme, shadows: themeShadows, typography, spacing} = useTheme();
  const router = useRouter();

  const { items, isLoading, error: _error, toggleFavorite, refetch } = useCloset();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  const handleOpenSortSheet = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSortSheetOpen(true);
  }, []);

  const handleCloseSortSheet = useCallback((): void => {
    setIsSortSheetOpen(false);
  }, []);

  const handleSortSelect = useCallback((order: 'newest' | 'oldest' | 'name'): void => {
    Haptics.selectionAsync();
    setSortOrder(order);
    setIsSortSheetOpen(false);
  }, []);

  // 카테고리별 필터링 + 정렬
  const filteredItems = useMemo(() => {
    let result = selectedCategory === 'all'
      ? [...items]
      : items.filter((item) => item.subCategory === selectedCategory);

    // 정렬 적용
    if (sortOrder === 'name') {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'oldest') {
      result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // 'newest'는 기본 순서 (최신순)

    return result;
  }, [items, selectedCategory, sortOrder]);

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
            <SkeletonCard style={{ width: '48%', height: 180, marginTop: spacing.md, marginLeft: spacing.md }} />
            <SkeletonCard style={{ width: '48%', height: 180, marginTop: spacing.md, marginRight: spacing.md }} />
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
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} 카테고리`}
              accessibilityState={{ selected: selectedCategory === item.key }}
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
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${CLOTHING_CATEGORY_LABELS[item.subCategory as ClothingCategory] || item.subCategory}`}
              accessibilityHint="아이템 상세 보기"
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
                  accessibilityRole="button"
                  accessibilityLabel={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
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

      {/* 정렬 버튼 */}
      <Pressable
        style={[styles.sortButton, { backgroundColor: colors.card, ...themeShadows.md }]}
        onPress={handleOpenSortSheet}
        testID="closet-sort-button"
        accessibilityRole="button"
        accessibilityLabel="정렬 옵션"
      >
        <SlidersHorizontal size={20} color={colors.foreground} />
      </Pressable>

      {/* 추가 버튼 */}
      <Pressable
        style={[styles.addButton, { backgroundColor: moduleTheme.body.dark, ...themeShadows.lg }]}
        onPress={handleAddPress}
        accessibilityRole="button"
        accessibilityLabel="아이템 추가"
      >
        <Plus size={24} color={colors.overlayForeground} />
      </Pressable>

      {/* 정렬 바텀 시트 */}
      <BottomSheet
        isVisible={isSortSheetOpen}
        onClose={handleCloseSortSheet}
        snapPoints={['35%']}
        title="정렬"
        testID="closet-sort-sheet"
      >
        {(['newest', 'oldest', 'name'] as const).map((order) => {
          const labels = { newest: '최신순', oldest: '오래된순', name: '이름순' };
          const isActive = sortOrder === order;
          return (
            <Pressable
              key={order}
              style={[
                styles.sortOption,
                { backgroundColor: isActive ? moduleTheme.body.dark : colors.muted },
              ]}
              onPress={() => handleSortSelect(order)}
              testID={`sort-option-${order}`}
              accessibilityRole="radio"
              accessibilityLabel={labels[order]}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: isActive ? colors.overlayForeground : colors.foreground },
                ]}
              >
                {labels[order]}
              </Text>
            </Pressable>
          );
        })}
      </BottomSheet>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    gap: spacing.smd,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  filterContainer: {
    paddingVertical: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
    marginRight: spacing.sm,
  },
  filterChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  gridContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.smx,
  },
  itemCard: {
    width: '48%',
    borderRadius: radii.xl,
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
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    padding: spacing.smd,
  },
  itemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  itemCategory: {
    fontSize: typography.size.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
    borderRadius: radii.xl,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  sortButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  sortOption: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
});
