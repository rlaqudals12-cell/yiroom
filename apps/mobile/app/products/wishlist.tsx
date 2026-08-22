/** 인증 웹 API 기반 위시리스트 화면 */
import { router } from 'expo-router';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { WishlistDisplayItem } from '@/components/products/wishlist/useWishlistScreen';
import { useWishlistScreen } from '@/components/products/wishlist/useWishlistScreen';
import { WISHLIST_TYPE_LABELS } from '@/components/products/wishlist/wishlist-screen.constants';
import { WishlistItemCard } from '@/components/products/wishlist/WishlistItemCard';

import { GlassCard, ScreenContainer } from '../../components/ui';
import { brand, radii, spacing, typography, useTheme } from '../../lib/theme';
import type { ProductType } from '../../types/product';

export default function WishlistScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { items, isLoading, error, typeCounts, loadWishlist, removeItem, clearItems } =
    useWishlistScreen();

  const openItem = useCallback((item: WishlistDisplayItem): void => {
    router.push({ pathname: '/products/[id]', params: { id: item.productId } });
  }, []);

  const renderHeader = (): React.JSX.Element => (
    <View style={styles.headerSection}>
      <GlassCard shadowSize="md" style={{ marginBottom: spacing.sm }}>
        <View style={styles.summaryRow}>
          <Heart size={20} color={brand.primary} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            총 {items.length}개 제품
          </Text>
        </View>
        {Object.keys(typeCounts).length > 0 && (
          <View style={styles.typeCountRow}>
            {(Object.entries(typeCounts) as [ProductType, number][]).map(([type, count]) => (
              <Text key={type} style={[styles.typeCountText, { color: colors.muted }]}>
                {WISHLIST_TYPE_LABELS[type]} {count}
              </Text>
            ))}
          </View>
        )}
      </GlassCard>

      {items.length > 0 && (
        <Pressable onPress={clearItems} style={styles.clearButton}>
          <Text style={[styles.clearText, { color: colors.destructive }]}>전체 삭제</Text>
        </Pressable>
      )}
    </View>
  );

  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={48} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {isLoading ? '찜 목록을 불러오고 있어요' : (error ?? '아직 즐겨찾기가 없어요')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.muted }]}>
        {error
          ? '잠시 후 다시 시도해주세요.'
          : '제품 상세에서 찜 버튼을 눌러 마음에 드는 제품을 저장해보세요.'}
      </Text>
      {!isLoading && (
        <Pressable
          style={[styles.primaryButton, { backgroundColor: brand.primary }]}
          onPress={error ? () => void loadWishlist() : () => router.push('/products')}
        >
          <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
            {error ? '다시 시도' : '제품 둘러보기'}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ScreenContainer
      testID="wishlist-screen"
      backgroundGradient="beauty"
      scrollable={false}
      contentPadding={0}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WishlistItemCard item={item} onOpen={openItem} onRemove={removeItem} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerSection: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  typeCountRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  typeCountText: { fontSize: typography.size.sm },
  clearButton: { alignSelf: 'flex-end', marginTop: spacing.sm, paddingVertical: spacing.xs },
  clearText: { fontSize: typography.size.sm },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  primaryButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
