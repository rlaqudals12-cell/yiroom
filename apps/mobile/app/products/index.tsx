/**
 * 제품 추천 리스트 화면
 * 분석 결과 기반 맞춤 제품 추천 (DB 연동)
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
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

import { GlassCard, ScreenContainer } from '../../components/ui';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { coarseCategoryOf, fineCategoriesFor } from '../../lib/products';
import {
  getCosmeticProducts,
  getCosmeticProductsByCategories,
  getCosmeticsBySkinType,
  getCosmeticsByPersonalColor,
} from '../../lib/products/repositories/cosmetic';
import { getSupplementProducts } from '../../lib/products/repositories/supplement';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { productLogger } from '../../lib/utils/logger';
import type {
  CosmeticProduct,
  PersonalColorSeason,
  SkinType,
  SupplementProduct,
} from '../../types/product';

// 카테고리 — 운동용품(equipment_products 테이블 부재)·패션(DB 부재)은 유령이라 제거.
// 화장품(cosmetic_products 2,821행) + 영양제(supplement_products 200행)만 실배선.
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'haircare', label: '헤어케어' },
  { id: 'supplement', label: '영양제' },
];

// 제품 표시용 통합 인터페이스 (cosmetic·supplement 공통 + matchScore)
interface DisplayProduct {
  id: string;
  name: string;
  brand: string;
  category: string; // 대분류(skincare/makeup/haircare/supplement 등) — 이모지 폴백·필터용
  imageUrl?: string;
  price?: number; // KRW
  rating?: number;
  reviewCount?: number;
  matchScore: number;
  // 매칭 계산용 원본 필드
  skinTypes?: string[];
  personalColorSeasons?: string[];
  concerns?: string[];
}

// 시즌 문자열 정규화: 'spring'/'SPRING' → 'Spring' (cosmetic.personal_color_seasons 값 형식)
function normalizeSeason(season: string): PersonalColorSeason | null {
  const normalized = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
  return (['Spring', 'Summer', 'Autumn', 'Winter'] as const).includes(
    normalized as PersonalColorSeason
  )
    ? (normalized as PersonalColorSeason)
    : null;
}

// 대분류별 이모지 (이미지 로드 실패/부재 시 폴백)
function categoryEmoji(category: string): string {
  switch (category) {
    case 'makeup':
      return '💄';
    case 'haircare':
      return '💇';
    case 'supplement':
      return '💊';
    case 'suncare':
      return '☀️';
    case 'bodycare':
      return '🧴';
    default:
      return '🧴';
  }
}

// cosmetic/supplement → DisplayProduct 변환
function cosmeticToDisplay(p: CosmeticProduct, matchScore: number): DisplayProduct {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: coarseCategoryOf(p.category),
    imageUrl: p.imageUrl,
    price: p.priceKrw,
    rating: p.rating,
    reviewCount: p.reviewCount,
    matchScore,
    skinTypes: p.skinTypes,
    personalColorSeasons: p.personalColorSeasons,
    concerns: p.concerns,
  };
}

function supplementToDisplay(p: SupplementProduct, matchScore: number): DisplayProduct {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: 'supplement',
    imageUrl: p.imageUrl,
    price: p.priceKrw,
    rating: p.rating,
    reviewCount: p.reviewCount,
    matchScore,
  };
}

export default function ProductsScreen() {
  const { colors, brand, status, module: moduleColors, typography } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  // 분석 결과에서 넘어온 쿼리 파라미터
  const {
    skinType,
    concerns,
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
    if (skinType && concerns) {
      setFilterSource('피부 분석 + 고민 기반');
    } else if (skinType) {
      setFilterSource('피부 분석 결과 기반');
    } else if (querySeason) {
      setFilterSource('퍼스널 컬러 분석 기반');
    } else {
      setFilterSource(null);
    }
  }, [skinType, concerns, querySeason]);

  // 매칭 점수 계산 (분석 결과 기반) — cosmetic/supplement 공통 필드 사용
  const calculateMatchScore = useCallback(
    (
      p: Pick<DisplayProduct, 'skinTypes' | 'personalColorSeasons' | 'concerns' | 'rating'>
    ): number => {
      let score = 70; // 기본 점수

      // 피부 타입 매칭 (cosmetic.skin_types — dry/oily/...)
      if (skinType && p.skinTypes?.includes(skinType)) {
        score += 15;
      }

      // 퍼스널 컬러 매칭 (cosmetic.personal_color_seasons — 'Spring' 형식)
      if (querySeason) {
        const target = normalizeSeason(querySeason);
        if (target && p.personalColorSeasons?.includes(target)) {
          score += 15;
        }
      }

      // 피부 고민 매칭
      if (concerns && p.concerns) {
        const userConcerns = concerns.split(',').map((c) => c.trim().toLowerCase());
        const matchedConcerns = p.concerns.filter((sc) => userConcerns.includes(sc.toLowerCase()));
        if (matchedConcerns.length > 0) {
          score += Math.min(matchedConcerns.length * 5, 15);
        }
      }

      // 평점 보너스 (4.5 이상)
      if (p.rating && p.rating >= 4.5) {
        score += 5;
      }

      return Math.min(score, 100);
    },
    [skinType, querySeason, concerns]
  );

  // 제품 목록 조회 (DB 연동) — cosmetic_products(2,821행)·supplement_products(200행)
  const fetchProducts = useCallback(async () => {
    try {
      let display: DisplayProduct[] = [];

      if (selectedCategory === 'supplement') {
        // 영양제 — supplement_products (이미지 전량 null → 이모지 플레이스홀더 정직 유지)
        const supplements = await getSupplementProducts(undefined, 20);
        display = supplements.map((p) => supplementToDisplay(p, calculateMatchScore(p)));
      } else {
        let cosmetics: CosmeticProduct[] = [];

        if (skinType) {
          // 피부 타입 기반 추천 (skin_types overlaps)
          cosmetics = await getCosmeticsBySkinType(skinType as SkinType, undefined, 20);
        } else if (querySeason) {
          // 퍼스널 컬러 기반 추천 (personal_color_seasons overlaps)
          const season = normalizeSeason(querySeason);
          cosmetics = season ? await getCosmeticsByPersonalColor(season, 20) : [];
        } else {
          // 일반 조회 — 대분류→세분류 매핑
          const fine = fineCategoriesFor(selectedCategory);
          cosmetics = fine
            ? await getCosmeticProductsByCategories(fine, 20)
            : await getCosmeticProducts(undefined, 20);
        }

        // 분석 기반 추천 결과에도 대분류 필터 적용
        const filtered =
          selectedCategory !== 'all' && (skinType || querySeason)
            ? cosmetics.filter((p) => coarseCategoryOf(p.category) === selectedCategory)
            : cosmetics;

        display = filtered.map((p) => cosmeticToDisplay(p, calculateMatchScore(p)));
      }

      // 매칭 점수 정렬
      display.sort((a, b) => b.matchScore - a.matchScore);
      setProducts(display);
    } catch (error) {
      productLogger.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, skinType, querySeason, calculateMatchScore]);

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
      backgroundGradient="beauty"
    >
      {/* 맞춤 추천 배너 */}
      {(filterSource || userSeason) && (
        <Animated.View entering={FadeInUp.duration(TIMING.normal)} style={styles.bannerWrapper}>
          <GlassCard shadowSize="md" style={styles.banner}>
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
          </GlassCard>
        </Animated.View>
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
          renderItem={({ item: product, index }) => (
            <Animated.View entering={staggeredEntry(index)} style={{ flex: 1, maxWidth: '50%' }}>
              <GlassCard shadowSize="md" style={styles.productCard}>
                <Pressable onPress={() => handleProductPress(product.id)}>
                  {/* 이미지 — 실이미지 우선, 로드 실패/부재 시 이모지 폴백(뒤에 깔림) */}
                  <View style={styles.productImageContainer}>
                    <View
                      style={[styles.productImagePlaceholder, { backgroundColor: colors.muted }]}
                    >
                      <Text style={styles.placeholderEmoji}>{categoryEmoji(product.category)}</Text>
                      {product.imageUrl && (
                        <Image
                          source={{ uri: product.imageUrl }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                          accessibilityLabel={`${product.name} 제품 이미지`}
                        />
                      )}
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
                    {product.price != null && (
                      <Text style={[styles.productPrice, { color: colors.foreground }]}>
                        {formatPrice(product.price)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </GlassCard>
            </Animated.View>
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
  bannerWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  bannerIcon: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  bannerSubtitle: {
    fontSize: 13,
    marginTop: spacing.xxs,
  },
  categoryScroll: {
    marginTop: spacing.md,
    maxHeight: 44,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    borderRadius: radii.circle,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: typography.size.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productScroll: {
    flex: 1,
    marginTop: spacing.md,
  },
  productGridContent: {
    paddingHorizontal: spacing.smx,
    paddingBottom: spacing.mlg,
  },
  productCard: {
    flex: 1,
    margin: spacing.xs,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImagePlaceholder: {
    aspectRatio: 1,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productBrand: {
    fontSize: typography.size.xs,
  },
  productName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingStar: {
    fontSize: typography.size.xs,
    marginRight: spacing.xs,
  },
  ratingText: {
    fontSize: typography.size.xs,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
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
