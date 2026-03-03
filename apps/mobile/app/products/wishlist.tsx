/**
 * 위시리스트 (즐겨찾기) 화면
 * 로컬 AsyncStorage 기반 즐겨찾기 제품 목록
 */
import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, Trash2, ShoppingBag } from 'lucide-react-native';

import { useTheme, brand, typography, spacing, radii } from '../../lib/theme';
import {
  useFavoritesStore,
  type FavoriteItem,
  type FavoriteProductType,
} from '../../lib/stores/favoritesStore';

const TYPE_LABELS: Record<FavoriteProductType, string> = {
  cosmetic: '화장품',
  supplement: '건강보조',
  equipment: '운동기구',
  healthfood: '건강식품',
};

const TYPE_EMOJIS: Record<FavoriteProductType, string> = {
  cosmetic: '💄',
  supplement: '💊',
  equipment: '🏋️',
  healthfood: '🥗',
};

export default function WishlistScreen(): React.JSX.Element {
  const { colors, isDark, typography, spacing} = useTheme();
  const items = useFavoritesStore((s) => s.items);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const clearAll = useFavoritesStore((s) => s.clearAll);

  const handleRemove = useCallback(
    (item: FavoriteItem): void => {
      Alert.alert(
        '즐겨찾기 삭제',
        `"${item.name}"을(를) 즐겨찾기에서 삭제할까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => removeFavorite(item.productId),
          },
        ],
      );
    },
    [removeFavorite],
  );

  const handleClearAll = useCallback((): void => {
    if (items.length === 0) return;
    Alert.alert(
      '전체 삭제',
      '모든 즐겨찾기를 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: clearAll },
      ],
    );
  }, [items.length, clearAll]);

  const handlePress = useCallback((item: FavoriteItem): void => {
    router.push({
      pathname: '/products/[id]',
      params: { id: item.productId },
    });
  }, []);

  // 타입별 그룹 카운트
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<FavoriteProductType, number>> = {};
    items.forEach((item) => {
      counts[item.productType] = (counts[item.productType] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const renderItem = ({ item }: { item: FavoriteItem }): React.JSX.Element => (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => handlePress(item)}
      testID="wishlist-item"
    >
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemBrand, { color: colors.muted }]} numberOfLines={1}>
            {item.brand}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeChip,
                { backgroundColor: isDark ? colors.card : colors.muted + '20' },
              ]}
            >
              <Text style={[styles.typeText, { color: colors.foreground }]}>
                {TYPE_EMOJIS[item.productType]} {TYPE_LABELS[item.productType]}
              </Text>
            </View>
            {item.priceKrw != null && (
              <Text style={[styles.priceText, { color: colors.foreground }]}>
                {item.priceKrw.toLocaleString()}원
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => handleRemove(item)}
          hitSlop={8}
          testID="remove-wishlist-btn"
        >
          <Trash2 size={18} color={colors.muted} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderHeader = (): React.JSX.Element => (
    <View style={styles.headerSection}>
      {/* 요약 */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <Heart size={20} color={brand.primary} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            총 {items.length}개 제품
          </Text>
        </View>
        {Object.keys(typeCounts).length > 0 && (
          <View style={styles.typeCountRow}>
            {(Object.entries(typeCounts) as [FavoriteProductType, number][]).map(
              ([type, count]) => (
                <Text key={type} style={[styles.typeCountText, { color: colors.muted }]}>
                  {TYPE_EMOJIS[type]} {count}
                </Text>
              ),
            )}
          </View>
        )}
      </View>

      {/* 전체 삭제 */}
      {items.length > 0 && (
        <Pressable onPress={handleClearAll} style={styles.clearBtn}>
          <Text style={[styles.clearText, { color: colors.destructive }]}>
            전체 삭제
          </Text>
        </Pressable>
      )}
    </View>
  );

  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={48} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        아직 즐겨찾기가 없어요
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.muted }]}>
        제품 상세에서 ❤️ 버튼을 눌러{'\n'}마음에 드는 제품을 저장해보세요
      </Text>
      <Pressable
        style={[styles.browseBtn, { backgroundColor: brand.primary }]}
        onPress={() => router.push('/products')}
      >
        <Text style={[styles.browseBtnText, { color: brand.primaryForeground }]}>
          제품 둘러보기
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="wishlist-screen"
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  // 헤더
  headerSection: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  typeCountRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  typeCountText: {
    fontSize: typography.size.sm,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearText: {
    fontSize: typography.size.sm,
  },
  // 카드
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  itemBrand: {
    fontSize: typography.size.sm,
    marginTop: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  typeText: {
    fontSize: typography.size.xs,
  },
  priceText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  browseBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  browseBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
