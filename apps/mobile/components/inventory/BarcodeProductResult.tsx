import { Package, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import type { BeautyProduct } from './barcode-scan.types';

interface BarcodeProductResultProps {
  product: BeautyProduct;
  isAddingToShelf: boolean;
  onAddToShelf: () => void;
  onAddToInventory: () => void;
}

export function BarcodeProductResult({
  product,
  isAddingToShelf,
  onAddToShelf,
  onAddToInventory,
}: BarcodeProductResultProps) {
  const { colors, brand, status, shadows, typography, spacing, radii } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      style={[
        styles.resultCard,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: status.success + '40',
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.productRow}>
        <View
          style={[
            styles.productIcon,
            { backgroundColor: brand.primary + '15', borderRadius: radii.xl },
          ]}
        >
          <Package size={24} color={brand.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            {product.name}
          </Text>
          {product.brand && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
            >
              {product.brand}
            </Text>
          )}
          {product.price != null && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
            >
              {product.price.toLocaleString()}원
            </Text>
          )}
        </View>
      </View>

      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: brand.primary, borderRadius: radii.xl, marginTop: spacing.md },
        ]}
        onPress={onAddToShelf}
        disabled={isAddingToShelf}
        accessibilityState={{ disabled: isAddingToShelf, busy: isAddingToShelf }}
        testID="add-to-product-shelf"
      >
        <Plus size={18} color={brand.primaryForeground} />
        <Text
          style={{
            color: brand.primaryForeground,
            fontWeight: typography.weight.semibold,
            fontSize: typography.size.sm,
            marginLeft: spacing.xs,
          }}
        >
          {isAddingToShelf ? '제품함에 추가 중' : '내 제품함에 추가'}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: colors.secondary, borderRadius: radii.xl, marginTop: spacing.sm },
        ]}
        onPress={onAddToInventory}
        testID="add-to-beauty-inventory"
      >
        <Plus size={18} color={colors.foreground} />
        <Text
          style={{
            color: colors.foreground,
            fontWeight: typography.weight.semibold,
            fontSize: typography.size.sm,
            marginLeft: spacing.xs,
          }}
        >
          내 화장대에 추가
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  resultCard: { borderWidth: 1 },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productIcon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
