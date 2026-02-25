/**
 * BeautyProductFeed — 뷰티 제품 피드
 *
 * FlatList 기반 제품 목록. 카테고리/고민 필터 연동.
 * 빈 상태 + 목록 렌더링.
 */
import { Search } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Text, View, type ViewStyle } from 'react-native';

import { EmptyState } from '../common/EmptyState';
import { ProductMiniCard, type BeautyProduct } from './ProductMiniCard';
import { useTheme } from '../../lib/theme';

interface BeautyProductFeedProps {
  products: BeautyProduct[];
  /** 카테고리 필터 (all이면 전체) */
  categoryFilter: string;
  /** 고민 필터 (빈 배열이면 전체) */
  concernFilter: string[];
  /** 성분 필터 (빈 배열이면 전체) */
  ingredientFilter?: string[];
  /** 가격대 필터 — { min, max } */
  priceRange?: { min: number; max: number };
  /** 최소 평점 필터 (0이면 전체) */
  minRating?: number;
  onProductPress?: (product: BeautyProduct) => void;
  style?: ViewStyle;
  testID?: string;
}

export function BeautyProductFeed({
  products,
  categoryFilter,
  concernFilter,
  ingredientFilter = [],
  priceRange,
  minRating = 0,
  onProductPress,
  style,
  testID,
}: BeautyProductFeedProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  // 필터 적용
  const filtered = products.filter((p) => {
    if (categoryFilter && categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (concernFilter.length > 0 && !concernFilter.some((c) => p.concerns.includes(c))) {
      return false;
    }
    // 성분 필터
    if (ingredientFilter.length > 0) {
      const productIngredients = p.ingredients ?? [];
      if (!ingredientFilter.some((i) => productIngredients.includes(i))) return false;
    }
    // 가격대 필터
    if (priceRange && p.price !== undefined) {
      if (p.price < priceRange.min || p.price > priceRange.max) return false;
    }
    // 평점 필터
    if (minRating > 0 && p.rating < minRating) return false;
    return true;
  });

  const renderItem = useCallback(
    ({ item }: { item: BeautyProduct }) => (
      <ProductMiniCard
        product={item}
        onPress={onProductPress}
        style={{ marginBottom: spacing.sm }}
        testID={testID ? `${testID}-item-${item.id}` : undefined}
      />
    ),
    [onProductPress, spacing.sm, testID]
  );

  const keyExtractor = useCallback((item: BeautyProduct) => item.id, []);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Search size={28} color={colors.mutedForeground} />}
        title="일치하는 제품이 없어요"
        description="필터를 조정하거나 초기화해보세요"
        testID={testID ? `${testID}-empty` : 'product-feed-empty'}
      />
    );
  }

  return (
    <View style={style} testID={testID} accessibilityLabel={`추천 제품 ${filtered.length}개`}>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginBottom: spacing.sm,
        }}
        accessibilityRole="header"
      >
        추천 제품 {filtered.length}개
      </Text>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        testID={testID ? `${testID}-list` : undefined}
      />
    </View>
  );
}
