import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

import type { WishlistDisplayItem } from './useWishlistScreen';
import { WISHLIST_TYPE_LABELS } from './wishlist-screen.constants';

interface WishlistItemCardProps {
  item: WishlistDisplayItem;
  onOpen: (item: WishlistDisplayItem) => void;
  onRemove: (item: WishlistDisplayItem) => void;
}

export function WishlistItemCard({
  item,
  onOpen,
  onRemove,
}: WishlistItemCardProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const canOpen = item.productType === 'cosmetic';
  const content = (
    <View style={styles.cardContent}>
      <View style={styles.cardInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name ?? '제품 정보를 불러올 수 없어요'}
        </Text>
        <Text style={[styles.itemBrand, { color: colors.muted }]} numberOfLines={1}>
          {item.brand ?? `제품 ID ${item.productId.slice(0, 8)}`}
        </Text>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.typeChip,
              { backgroundColor: isDark ? colors.card : colors.muted + '20' },
            ]}
          >
            <Text style={[styles.typeText, { color: colors.foreground }]}>
              {WISHLIST_TYPE_LABELS[item.productType]}
            </Text>
          </View>
          {item.priceKrw != null && (
            <Text style={[styles.priceText, { color: colors.foreground }]}>
              {item.priceKrw.toLocaleString()}원
            </Text>
          )}
        </View>
        {!canOpen && (
          <Text style={[styles.unsupportedText, { color: colors.mutedForeground }]}>
            이 유형의 모바일 상세 보기는 아직 지원하지 않아요.
          </Text>
        )}
      </View>
      <Pressable
        accessibilityLabel="찜 목록에서 삭제"
        accessibilityRole="button"
        onPress={() => onRemove(item)}
        hitSlop={8}
        testID="remove-wishlist-btn"
      >
        <Trash2 size={18} color={colors.muted} />
      </Pressable>
    </View>
  );

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  if (!canOpen) {
    return (
      <View style={cardStyle} testID="wishlist-item-unavailable">
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name ?? '화장품'} 상세 보기`}
      style={cardStyle}
      onPress={() => onOpen(item)}
      testID="wishlist-item"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginRight: spacing.sm },
  itemName: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  itemBrand: { fontSize: typography.size.sm, marginTop: spacing.xxs },
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
  typeText: { fontSize: typography.size.xs },
  priceText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  unsupportedText: { fontSize: typography.size.xs, marginTop: spacing.xs },
});
