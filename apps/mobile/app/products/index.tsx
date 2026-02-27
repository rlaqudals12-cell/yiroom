/**
 * 제품 추천 리스트 화면
 * 분석 결과 기반 맞춤 제품 추천 (DB 연동)
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/lib/theme';

import { ScreenContainer } from '../../components/ui';

import {
  getAffiliateProducts,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  type AffiliateProduct,
  type AffiliateProductFilter,
} from '../../lib/affiliate';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { productLogger } from '../../lib/utils/logger';

// 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'haircare', label: '헤어케어' },
  { id: 'supplement', label: '영양제' },
  { id: 'equipment', label: '운동용품' },
  { id: 'fashion', label: '패션' },
];

// 제품 표시용 인터페이스 (AffiliateProduct + matchScore)
interface DisplayProduct extends AffiliateProduct {
  matchScore: number;
}

export default function ProductsScreen() {
  const { colors, brand, status, module: moduleColors } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  // 분석 결과에서 넘어온 쿼리 파라미터
  const {
    skinType,
    concerns: _concerns, // TODO: 향후 고민 기반 필터링에 사용
    season: querySeason,
    category: initialCategory,
  } = useLocalSearchParams<{
    skinType?: string;
    concerns?: string;
    season?: string;
    category?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSeason, setUserSeason] = useState<string | null>(null);
  // 쿼리에서 온 필터 정보 표시용
  const [filterSource, setFilterSource] = useState<string | null>(null);

  // 사용자 분석 결과 조회
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 퍼스널 컬러 조회
      const { data: colorData } = await supabase
        .from('personal_color_assessments')
        .select('season')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (colorData) {
        setUserSeason(colorData.season);
      }
    } catch (error) {
      productLogger.error('Failed to fetch user data:', error);
    }
  }, [user?.id, supabase]);

  // 쿼리 파라미터 기반 필터 소스 설정
  useEffect(() => {
    if (skinType) {
      setFilterSource('피부 분석 결과 기반');
    } else if (querySeason) {
      setFilterSource('퍼스널 컬러 분석 기반');
    } else {
      setFilterSource(null);
    }
  }, [skinType, querySeason]);

  // 매칭 점수 계산 (분석 결과 기반)
  const calculateMatchScore = useCallback(
    (product: AffiliateProduct): number => {
      let score = 70; // 기본 점수

      // 피부 타입 매칭
      if (
        skinType &&
        product.skinTypes &&
        product.skinTypes.includes(
          skinType as 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
        )
      ) {
        score += 15;
      }

      // 퍼스널 컬러 매칭
      if (querySeason) {
        const seasonMap: Record<
          string,
          'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool'
        > = {
          Spring: 'spring_warm',
          Summer: 'summer_cool',
          Autumn: 'autumn_warm',
          Winter: 'winter_cool',
        };
        const colorKey = seasonMap[querySeason];
        if (colorKey && product.personalColors && product.personalColors.includes(colorKey)) {
          score += 15;
        }
      }

      // 평점 보너스 (4.5 이상)
      if (product.rating && product.rating >= 4.5) {
        score += 5;
      }

      return Math.min(score, 100);
    },
    [skinType, querySeason]
  );

  // 제품 목록 조회 (DB 연동)
  const fetchProducts = useCallback(async () => {
    try {
      let rawProducts: AffiliateProduct[] = [];

      // 피부 타입 기반 추천
      if (skinType) {
        rawProducts = await getRecommendedProductsBySkin(supabase, skinType, undefined, 20);
      }
      // 퍼스널 컬러 기반 추천
      else if (querySeason) {
        const seasonMap: Record<string, string> = {
          Spring: 'spring_warm',
          Summer: 'summer_cool',
          Autumn: 'autumn_warm',
          Winter: 'winter_cool',
        };
        const colorKey = seasonMap[querySeason];
        if (colorKey) {
          rawProducts = await getRecommendedProductsByColor(supabase, colorKey, undefined, 20);
        }
      }
      // 일반 조회
      else {
        const filter: AffiliateProductFilter = {
          inStockOnly: true,
        };
        if (selectedCategory !== 'all') {
          filter.category = selectedCategory;
        }
        rawProducts = await getAffiliateProducts(supabase, filter, 'rating', 20, 0);
      }

      // 카테고리 필터링 (추천 결과에도 적용)
      if (selectedCategory !== 'all') {
        rawProducts = rawProducts.filter((p) => p.category === selectedCategory);
      }

      // 매칭 점수 계산 및 정렬
      const displayProducts: DisplayProduct[] = rawProducts
        .map((product) => ({
          ...product,
          matchScore: calculateMatchScore(product),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      setProducts(displayProducts);
    } catch (error) {
      productLogger.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, selectedCategory, skinType, querySeason, calculateMatchScore]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts();
  };

  const handleProductPress = (productId: string) => {
    Haptics.selectionAsync();
    router.push(`/products/${productId}`);
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  // 시즌 라벨
  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      Spring: '봄 웜톤',
      Summer: '여름 쿨톤',
      Autumn: '가을 웜톤',
      Winter: '겨울 쿨톤',
    };
    return labels[season] || season;
  };

  return (
    <ScreenContainer
      testID="products-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 맞춤 추천 배너 */}
      {(filterSource || userSeason) && (
        <View style={[styles.banner, { backgroundColor: brand.primary + '10' }]}>
          <Text style={styles.bannerIcon}>{filterSource ? '🎯' : '✨'}</Text>
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              {filterSource ? '맞춤 제품 추천' : '나를 위한 추천'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.mutedForeground }]}>
              {filterSource
                ? filterSource
                : `${getSeasonLabel(userSeason!)}에 맞는 제품을 추천해드려요`}
            </Text>
          </View>
        </View>
      )}

      {/* 카테고리 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? brand.primary : colors.card,
                  borderColor: isSelected ? brand.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(category.id);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? brand.primaryForeground : colors.mutedForeground,
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 제품 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={styles.productScroll}
          contentContainerStyle={styles.productGridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.foreground}
            />
          }
          renderItem={({ item: product }) => (
            <Pressable
              style={styles.productCard}
              onPress={() => handleProductPress(product.id)}
            >
              {/* 이미지 플레이스홀더 */}
              <View style={styles.productImageContainer}>
                <View style={[styles.productImagePlaceholder, { backgroundColor: colors.muted }]}>
                  <Text style={styles.placeholderEmoji}>
                    {product.category === 'skincare'
                      ? '🧴'
                      : product.category === 'makeup'
                        ? '💄'
                        : product.category === 'haircare'
                          ? '💇'
                          : product.category === 'supplement'
                            ? '💊'
                            : product.category === 'fashion'
                              ? '👗'
                              : '🏋️'}
                  </Text>
                </View>
                {/* 매칭 점수 배지 */}
                <View style={[styles.matchBadge, { backgroundColor: brand.primary }]}>
                  <Text style={[styles.matchBadgeText, { color: brand.primaryForeground }]}>
                    {product.matchScore}%
                  </Text>
                </View>
              </View>

              {/* 제품 정보 */}
              <View style={styles.productInfo}>
                <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>
                  {product.brand}
                </Text>
                <Text
                  style={[styles.productName, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {product.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingStar, { color: status.warning }]}>★</Text>
                  <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                    {(product.rating ?? 0).toFixed(1)} ({product.reviewCount ?? 0})
                  </Text>
                </View>
                <Text style={[styles.productPrice, { color: colors.foreground }]}>
                  {formatPrice(product.price)}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                추천할 제품이 없어요
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  bannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryScroll: {
    marginTop: 16,
    maxHeight: 44,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productScroll: {
    flex: 1,
    marginTop: 16,
  },
  productGridContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    padding: 4,
    maxWidth: '50%',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImagePlaceholder: {
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    padding: 8,
  },
  productBrand: {
    fontSize: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
  },
});
