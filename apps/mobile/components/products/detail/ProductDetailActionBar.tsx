import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

interface ProductDetailActionBarProps {
  isFavorite: boolean;
  isFavoriteBusy: boolean;
  onFavorite: () => void;
  onShare: () => void;
  onPurchase: () => void;
}

export function ProductDetailActionBar({
  isFavorite,
  isFavoriteBusy,
  onFavorite,
  onShare,
  onPurchase,
}: ProductDetailActionBarProps) {
  const { colors, brand } = useTheme();

  return (
    <View
      style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
    >
      <Pressable
        style={[styles.actionButton, { backgroundColor: colors.muted }]}
        onPress={onFavorite}
        disabled={isFavoriteBusy}
        accessibilityState={{ disabled: isFavoriteBusy, busy: isFavoriteBusy }}
        accessibilityLabel={isFavorite ? '제품 찜 해제' : '제품 찜하기'}
        testID="product-favorite-button"
      >
        <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
      </Pressable>
      <Pressable style={[styles.actionButton, { backgroundColor: colors.muted }]} onPress={onShare}>
        <Text style={styles.actionIcon}>📤</Text>
      </Pressable>
      <Pressable
        style={[styles.purchaseButton, { backgroundColor: brand.primary }]}
        onPress={onPurchase}
      >
        <Text style={[styles.purchaseButtonText, { color: brand.primaryForeground }]}>
          구매하러 가기
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.smx,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: { fontSize: typography.size.xl },
  purchaseButton: {
    flex: 1,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  purchaseButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
