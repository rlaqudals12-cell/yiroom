/**
 * 뷰티 카테고리별 제품 그리드
 * 5개 카테고리(skincare/makeup/hair/body/suncare) + 매칭률 정렬
 */
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer, GlassCard } from '@/components/ui';
import { useBeautyProducts } from '@/hooks/useBeautyProducts';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  skincare: { label: '스킨케어', emoji: '💧' },
  makeup: { label: '메이크업', emoji: '💄' },
  hair: { label: '헤어케어', emoji: '✨' },
  body: { label: '바디케어', emoji: '🧴' },
  suncare: { label: '선케어', emoji: '☀️' },
};

const SORT_OPTIONS = [
  { id: 'match', label: '매칭률순' },
  { id: 'rating', label: '평점순' },
  { id: 'price_low', label: '가격↑' },
  { id: 'price_high', label: '가격↓' },
];

export default function BeautyCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const [sortBy, setSortBy] = useState('match');

  const category = CATEGORIES[slug ?? ''] ?? { label: '카테고리', emoji: '💎' };

  // cosmetic_products(실데이터) 기반 — slug(대분류) → 세분류 매핑으로 조회
  const { products, isLoading, refetch } = useBeautyProducts({
    category: slug ?? 'all',
    limit: 50,
  });

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const sorted = [...products];
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => (a.priceKrw ?? 0) - (b.priceKrw ?? 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.priceKrw ?? 0) - (a.priceKrw ?? 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={0}
      testID={`beauty-category-${slug}`}
      backgroundGradient="beauty"
    >
      {/* 헤더 + 정렬 필터 */}
      <Animated.View
        entering={FadeInUp.duration(TIMING.normal)}
        style={{ margin: spacing.md, marginBottom: spacing.sm }}
      >
        <GlassCard shadowSize="md">
          <View style={[styles.header]}>
            <Text style={{ fontSize: 32 }}>{category.emoji}</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{category.label}</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {sortedProducts.length}개 제품
            </Text>
          </View>
          <View style={[styles.sortRow]}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === opt.id ? colors.foreground : colors.secondary,
                    borderColor: colors.border,
                    borderWidth: sortBy === opt.id ? 0 : 1,
                  },
                ]}
                onPress={() => setSortBy(opt.id)}
              >
                <Text
                  style={[
                    styles.sortLabel,
                    { color: sortBy === opt.id ? colors.background : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      {/* 제품 그리드 */}
      <FlatList
        data={sortedProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.mlg, paddingBottom: spacing.xl }}
        columnWrapperStyle={{ gap: spacing.sm }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <View
            style={[
              styles.productCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            {/* 실제 제품 이미지 (없으면 카테고리 이모지 폴백 — 지어내지 않는 정직 폴백) */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`${item.name} 제품 이미지`}
              />
            ) : (
              <View style={[styles.productImage, { backgroundColor: colors.muted }]}>
                <Text style={{ fontSize: 28 }}>{category.emoji}</Text>
              </View>
            )}
            <View style={{ padding: spacing.sm }}>
              <Text numberOfLines={2} style={[styles.productName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              {item.priceKrw != null && (
                <Text style={[styles.productPrice, { color: colors.foreground }]}>
                  {item.priceKrw.toLocaleString()}원
                </Text>
              )}
              {item.rating != null && (
                <Text style={[styles.productRating, { color: colors.mutedForeground }]}>
                  ⭐ {item.rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isLoading ? '제품을 불러오는 중...' : '해당 카테고리에 제품이 없습니다'}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  count: {
    fontSize: typography.size.sm,
    marginLeft: 'auto',
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sortChip: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  sortLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  productCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xxs,
  },
  productPrice: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  productRating: {
    fontSize: typography.size.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.base,
  },
});
