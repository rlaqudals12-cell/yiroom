/** 제품 상세 화면: 조회와 사용자 액션만 조율한다. */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  ProductDetail,
  ProductReview,
} from '@/components/products/detail/product-detail.types';
import { ProductDetailActionBar } from '@/components/products/detail/ProductDetailActionBar';
import { ProductDetailSummary } from '@/components/products/detail/ProductDetailSummary';
import { ProductDetailTabs } from '@/components/products/detail/ProductDetailTabs';
import { ScreenContainer } from '@/components/ui';
import { useAffiliateClick, identifyPartner } from '@/lib/affiliate';
import { getCosmeticProductById } from '@/lib/products/repositories/cosmetic';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { shareLogger } from '@/lib/utils/logger';
import { useProductWishlist } from '@/lib/wishlist/useProductWishlist';

export default function ProductDetailScreen() {
  const { colors, brand, typography, radii } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useClerkSupabaseClient();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    isWishlisted: isFavorite,
    isUpdating: isFavoriteBusy,
    toggle: toggleFavorite,
  } = useProductWishlist(id, 'cosmetic');

  const { handleClick: affiliateClick } = useAffiliateClick({
    productId: id || '',
    productUrl: product?.purchaseUrl || '',
    partner: product?.purchaseUrl ? identifyPartner(product.purchaseUrl) || 'coupang' : 'coupang',
    sourcePage: 'product-detail',
    sourceComponent: 'purchase-button',
    recommendationType: 'general',
  });

  // 제품 상세 조회 — cosmetic_products 실데이터만. 실패/부재 시 정직한 빈 상태를 쓴다.
  const fetchProduct = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const dbProduct = await getCosmeticProductById(id);
      if (!dbProduct) {
        setProduct(null);
        return;
      }

      setProduct({
        id: dbProduct.id,
        name: dbProduct.name,
        brand: dbProduct.brand ?? '',
        brandId: (dbProduct.brand ?? '').toLowerCase().replace(/\s/g, '-'),
        category: dbProduct.category ?? '',
        price: dbProduct.priceKrw ?? 0,
        rating: dbProduct.rating ?? 0,
        reviewCount: dbProduct.reviewCount ?? 0,
        // 사용자 분석 기반 계산이 없는 화면에서 매칭률을 지어내지 않는다.
        description: '',
        ingredients: dbProduct.keyIngredients ?? [],
        benefits: [],
        howToUse: '',
        images: dbProduct.imageUrl ? [dbProduct.imageUrl] : [],
        purchaseUrl: dbProduct.purchaseUrl ?? '',
        isFavorite: false,
      });

      const { data: dbReviews } = await supabase
        .from('product_reviews')
        .select('id, user_name, rating, created_at, content, helpful_count')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbReviews && dbReviews.length > 0) {
        setReviews(
          dbReviews.map((review) => ({
            id: review.id,
            userName: review.user_name || '익명',
            rating: review.rating,
            date: review.created_at?.split('T')[0] || '',
            content: review.content || '',
            helpful: review.helpful_count || 0,
          }))
        );
      }
    } catch {
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleFavoriteToggle = async (): Promise<void> => {
    if (!product) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite();
  };

  const handleShare = async (): Promise<void> => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.brand} ${product.name} - ₩${product.price.toLocaleString()}\n${product.purchaseUrl}`,
      });
    } catch (error) {
      shareLogger.error('Share error:', error);
    }
  };

  const handlePurchase = async (): Promise<void> => {
    if (!product?.purchaseUrl) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await affiliateClick();
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']} backgroundGradient="beauty">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer
        testID="product-detail-not-found"
        scrollable={false}
        edges={['bottom']}
        backgroundGradient="beauty"
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundIcon}>🔍</Text>
          <Text
            style={[
              styles.notFoundTitle,
              { color: colors.foreground, fontWeight: typography.weight.semibold },
            ]}
          >
            제품을 찾을 수 없어요
          </Text>
          <Text style={[styles.notFoundDescription, { color: colors.mutedForeground }]}>
            제품이 삭제되었거나 일시적인 오류일 수 있어요.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { borderRadius: radii.full, backgroundColor: brand.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 돌아가기"
          >
            <Text
              style={{ color: brand.primaryForeground, fontWeight: typography.weight.semibold }}
            >
              돌아가기
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="product-detail-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="beauty"
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProductDetailSummary product={product} />
        <ProductDetailTabs product={product} reviews={reviews} />
      </ScrollView>
      <ProductDetailActionBar
        isFavorite={isFavorite}
        isFavoriteBusy={isFavoriteBusy}
        onFavorite={() => void handleFavoriteToggle()}
        onShare={() => void handleShare()}
        onPurchase={() => void handlePurchase()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  notFoundIcon: { fontSize: 40, marginBottom: 8 },
  notFoundTitle: { fontSize: 18, marginBottom: 4 },
  notFoundDescription: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  backButton: { paddingHorizontal: 24, paddingVertical: 8 },
});
