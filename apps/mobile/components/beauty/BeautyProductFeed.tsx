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
  onProductPress?: (product: BeautyProduct) => void;
  style?: ViewStyle;
  testID?: string;
}

export function BeautyProductFeed({
  products,
  categoryFilter,
  concernFilter,
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
        description="다른 카테고리나 고민을 선택해보세요"
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
