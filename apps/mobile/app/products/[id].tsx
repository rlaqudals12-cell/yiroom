/**
 * 제품 상세 화면
 * 제품 정보, 성분, 리뷰, 구매 링크
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

import { EWGAnalysis } from '../../components/products/ingredients/EWGAnalysis';
import { SizeRecommendation } from '../../components/products/SizeRecommendation';
import { GlassCard, ScreenContainer } from '../../components/ui';
import { useAffiliateClick, identifyPartner } from '../../lib/affiliate';
import { lookupIngredients } from '../../lib/ingredients/ewg-database';
import { getCosmeticProductById } from '../../lib/products/repositories/cosmetic';
import type { ClothingCategory } from '../../lib/smart-matching';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { shareLogger } from '../../lib/utils/logger';

interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  category: string;
  clothingCategory?: ClothingCategory;
  price: number;
  rating: number;
  reviewCount: number;
  /** 사용자 분석 기반 매칭률 — 계산된 경우에만 표시 (지어내기 금지) */
  matchScore?: number;
  description: string;
  ingredients: string[];
  benefits: string[];
  howToUse: string;
  images: string[];
  purchaseUrl: string;
  isFavorite: boolean;
  hasSize?: boolean;
}

// 탭 타입
type TabType = 'info' | 'ingredients' | 'reviews';

// 리뷰 타입
interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}

export default function ProductDetailScreen() {
  const { colors, brand, status, typography, spacing, radii } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isFavorite, setIsFavorite] = useState(false);

  const { handleClick: affiliateClick } = useAffiliateClick({
    productId: id || '',
    productUrl: product?.purchaseUrl || '',
    partner: product?.purchaseUrl ? identifyPartner(product.purchaseUrl) || 'coupang' : 'coupang',
    sourcePage: 'product-detail',
    sourceComponent: 'purchase-button',
    recommendationType: 'general',
  });

  const [reviews, setReviews] = useState<Review[]>([]);

  // 제품 상세 조회 — cosmetic_products 실데이터만. 실패/부재 시 정직한 "찾을 수 없음" 상태.
  // (과거: 비로그인·조회실패 시 지어낸 Mock 제품+가짜 리뷰로 폴백 → 정직성 위반이라 제거)
  const fetchProduct = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      // anon 레포 함수 사용 — 목록과 동일 경로라 비로그인에서도 조회된다
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
        // matchScore 미설정 — 사용자 분석 기반 계산이 없는 화면에서 매칭률을 지어내지 않는다
        description: '',
        ingredients: dbProduct.keyIngredients ?? [],
        benefits: [],
        howToUse: '',
        images: dbProduct.imageUrl ? [dbProduct.imageUrl] : [],
        purchaseUrl: dbProduct.purchaseUrl ?? '',
        isFavorite: false,
      });

      // 리뷰는 DB에 있는 것만 — 없으면 빈 상태 (가짜 리뷰 금지)
      const { data: dbReviews } = await supabase
        .from('product_reviews')
        .select('id, user_name, rating, created_at, content, helpful_count')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbReviews && dbReviews.length > 0) {
        setReviews(
          dbReviews.map((r) => ({
            id: r.id,
            userName: r.user_name || '익명',
            rating: r.rating,
            date: r.created_at?.split('T')[0] || '',
            content: r.content || '',
            helpful: r.helpful_count || 0,
          }))
        );
      }
    } catch {
      // 조회 실패 → 아래 "제품을 찾을 수 없어요" 상태로 정직하게 표시
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // 찜하기 토글 (DB 저장 시도)
  const handleFavoriteToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    if (user?.id && product) {
      try {
        if (newValue) {
          await supabase.from('product_wishlist').upsert({
            clerk_user_id: user.id,
            product_id: product.id,
          });
        } else {
          await supabase
            .from('product_wishlist')
            .delete()
            .eq('clerk_user_id', user.id)
            .eq('product_id', product.id);
        }
      } catch {
        // DB 저장 실패 시 로컬 상태만 유지
      }
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `${product.brand} ${product.name} - ₩${product.price.toLocaleString()}\n${product.purchaseUrl}`,
      });
    } catch (error) {
      shareLogger.error('Share error:', error);
    }
  };

  // 구매하기 (어필리에이트 클릭 훅 사용)
  const handlePurchase = async () => {
    if (!product?.purchaseUrl) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 어필리에이트 훅으로 클릭 트래킹 + 딥링크 열기
    await affiliateClick();
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }

    return stars.join('');
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

  // 조회 실패/부재 — 가짜 제품으로 대체하지 않고 정직하게 알린다
  if (!product) {
    return (
      <ScreenContainer
        testID="product-detail-not-found"
        scrollable={false}
        edges={['bottom']}
        backgroundGradient="beauty"
      >
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🔍</Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.lg,
              fontWeight: typography.weight.semibold,
              marginBottom: spacing.xs,
            }}
          >
            제품을 찾을 수 없어요
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              textAlign: 'center',
              marginBottom: spacing.md,
            }}
          >
            제품이 삭제되었거나 일시적인 오류일 수 있어요.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: brand.primary,
            }}
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
        {/* 이미지 영역 — 실제 제품 이미지 우선, 없으면 이모지 폴백(지어내지 않는 정직 폴백) */}
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

        {/* 제품 정보 */}
        <View style={styles.infoSection}>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>

          {/* 평점 — 실제 리뷰가 있을 때만 별점 표시 (0.0 지어내기 금지) */}
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

          {/* 가격 */}
          <Text style={[styles.price, { color: colors.foreground }]}>
            {formatPrice(product.price)}
          </Text>

          {/* 매칭 점수 — 사용자 분석 기반으로 실제 계산된 경우에만 표시 (하드코딩 85% 지어내기 제거) */}
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

          {/* 사이즈 추천 (의류 제품만) */}
          {product.hasSize && product.clothingCategory && (
            <SizeRecommendation
              brandId={product.brandId}
              brandName={product.brand}
              category={product.clothingCategory}
              productId={product.id}
            />
          )}
        </View>

        {/* 탭 */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(['info', 'ingredients', 'reviews'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.tabActive, { borderBottomColor: brand.primary }],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedForeground },
                  activeTab === tab && {
                    color: brand.primaryForeground,
                    fontWeight: typography.weight.semibold,
                  },
                ]}
              >
                {tab === 'info'
                  ? '제품 정보'
                  : tab === 'ingredients'
                    ? '성분'
                    : `리뷰 ${product.reviewCount}`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 탭 컨텐츠 */}
        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <>
              {/* 카탈로그에 없는 정보는 빈 섹션 대신 정직하게 안내 */}
              {product.description ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>제품 설명</Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>
                    {product.description}
                  </Text>
                </>
              ) : null}

              {product.benefits.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>효과</Text>
                  <View style={styles.benefitsList}>
                    {product.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Text style={[styles.benefitDot, { color: status.success }]}>✓</Text>
                        <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {product.howToUse ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>사용 방법</Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>
                    {product.howToUse}
                  </Text>
                </>
              ) : null}

              {!product.description && product.benefits.length === 0 && !product.howToUse && (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  상세 설명이 아직 준비되지 않았어요. 성분 탭에서 성분 정보를 확인할 수 있어요.
                </Text>
              )}
            </>
          )}

          {activeTab === 'ingredients' && (
            <EWGAnalysis ingredients={lookupIngredients(product.ingredients)} />
          )}

          {activeTab === 'reviews' && (
            <>
              {reviews.length === 0 && (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  아직 작성된 리뷰가 없어요.
                </Text>
              )}
              {reviews.map((review, index) => (
                <Animated.View
                  key={review.id}
                  entering={FadeInUp.duration(TIMING.normal).delay(index * TIMING.staggerInterval)}
                >
                  <GlassCard shadowSize="md" style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewUser, { color: colors.foreground }]}>
                        {review.userName}
                      </Text>
                      <Text style={[styles.reviewRating, { color: status.warning }]}>
                        {'★'.repeat(review.rating)}
                      </Text>
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                      {review.date}
                    </Text>
                    <Text style={[styles.reviewContent, { color: colors.mutedForeground }]}>
                      {review.content}
                    </Text>
                    <Text style={[styles.reviewHelpful, { color: colors.mutedForeground }]}>
                      👍 {review.helpful}명에게 도움이 됨
                    </Text>
                  </GlassCard>
                </Animated.View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* 하단 액션 바 */}
      <View
        style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={handleFavoriteToggle}
        >
          <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={handleShare}
        >
          <Text style={styles.actionIcon}>📤</Text>
        </Pressable>
        <Pressable
          style={[styles.purchaseButton, { backgroundColor: brand.primary }]}
          onPress={handlePurchase}
        >
          <Text style={[styles.purchaseButtonText, { color: brand.primaryForeground }]}>
            구매하러 가기
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  infoSection: {
    padding: spacing.mlg,
  },
  brand: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  ratingStars: {
    fontSize: typography.size.sm,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 13,
    flex: 1,
  },
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
  matchIcon: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  matchInfo: {
    flex: 1,
  },
  matchLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  matchBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchBar: {
    height: '100%',
    borderRadius: 3,
  },
  matchScore: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.smx,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: typography.size.sm,
  },
  tabContent: {
    padding: spacing.mlg,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
    marginTop: spacing.sm,
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: spacing.mlg,
  },
  benefitsList: {
    marginBottom: spacing.mlg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitDot: {
    fontSize: typography.size.sm,
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: typography.size.sm,
  },
  reviewCard: {
    padding: spacing.md,
    marginBottom: spacing.smx,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewUser: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  reviewRating: {
    fontSize: typography.size.xs,
  },
  reviewDate: {
    fontSize: typography.size.xs,
    marginBottom: spacing.sm,
  },
  reviewContent: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reviewHelpful: {
    fontSize: typography.size.xs,
  },
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
  actionIcon: {
    fontSize: typography.size.xl,
  },
  purchaseButton: {
    flex: 1,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
