import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

import { GlassCard } from '../../ui';
import { SizeRecommendation } from '../SizeRecommendation';
import type { ProductDetail } from './product-detail.types';

interface ProductDetailSummaryProps {
  product: ProductDetail;
}

function formatPrice(price: number): string {
  return `₩${price.toLocaleString()}`;
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5 ? '☆' : '';
  return `${'★'.repeat(fullStars)}${halfStar}`;
}

export function ProductDetailSummary({ product }: ProductDetailSummaryProps) {
  const { colors, brand, status } = useTheme();

  return (
    <>
      <View style={[styles.imageSection, { backgroundColor: colors.muted }]}>
        {product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            contentFit="contain"
            transition={150}
            accessibilityLabel={`${product.name} 제품 이미지`}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>
              {product.category === '메이크업' || product.category === 'makeup' ? '💄' : '🧴'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
        <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>

        <View style={styles.ratingRow}>
          {product.reviewCount > 0 && product.rating > 0 ? (
            <>
              <Text style={[styles.ratingStars, { color: status.warning }]}>
                {renderStars(product.rating)}
              </Text>
              <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                {product.rating.toFixed(1)} ({product.reviewCount}개 리뷰)
              </Text>
            </>
          ) : (
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
              아직 리뷰가 없어요
            </Text>
          )}
          <Text
            style={[
              styles.categoryBadge,
              { color: brand.primaryForeground, backgroundColor: `${brand.primary}30` },
            ]}
          >
            {product.category}
          </Text>
        </View>

        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatPrice(product.price)}
        </Text>

        {product.matchScore !== undefined && (
          <Animated.View entering={FadeInUp.duration(TIMING.normal).delay(TIMING.fast)}>
            <GlassCard shadowSize="md" style={styles.matchCard}>
              <Text style={styles.matchIcon}>🎯</Text>
              <View style={styles.matchInfo}>
                <Text style={[styles.matchLabel, { color: colors.mutedForeground }]}>
                  나와의 매칭
                </Text>
                <View style={[styles.matchBarContainer, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.matchBar,
                      { width: `${product.matchScore}%`, backgroundColor: brand.primary },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.matchScore, { color: brand.primaryForeground }]}>
                {product.matchScore}%
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {product.hasSize && product.clothingCategory && (
          <SizeRecommendation
            brandId={product.brandId}
            brandName={product.brand}
            category={product.clothingCategory}
            productId={product.id}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  imageSection: { aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 80 },
  infoSection: { padding: spacing.mlg },
  brand: { fontSize: typography.size.sm, marginBottom: spacing.xs },
  productName: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.smx },
  ratingStars: { fontSize: typography.size.sm, marginRight: 6 },
  ratingText: { fontSize: 13, flex: 1 },
  categoryBadge: {
    fontSize: typography.size.xs,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
  },
  price: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  matchIcon: { fontSize: typography.size['2xl'], marginRight: spacing.smx },
  matchInfo: { flex: 1 },
  matchLabel: { fontSize: 13, marginBottom: 6 },
  matchBarContainer: { height: 6, borderRadius: 3, overflow: 'hidden' },
  matchBar: { height: '100%', borderRadius: 3 },
  matchScore: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.smx,
  },
});
