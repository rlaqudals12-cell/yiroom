/**
 * 제품 추천 리스트 화면
 * 분석 결과 기반 맞춤 제품 추천 (DB 연동)
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  calculateMatchScore as calculateProductMatchScore,
  calculatePersonalMatchPercentage,
  type UserProfile,
} from '../../lib/products/matching';
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
  SkinConcern,
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
  matchScore?: number;
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
function cosmeticToDisplay(p: CosmeticProduct, matchScore?: number): DisplayProduct {
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

function supplementToDisplay(p: SupplementProduct, matchScore?: number): DisplayProduct {
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

const SKIN_TYPES: readonly SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
const SKIN_CONCERNS: readonly SkinConcern[] = [
  'acne',
  'aging',
  'whitening',
  'hydration',
  'pore',
  'redness',
];

function normalizeSkinType(value: string | undefined): SkinType | undefined {
  return SKIN_TYPES.includes(value as SkinType) ? (value as SkinType) : undefined;
}

function normalizeConcerns(value: string | undefined): SkinConcern[] {
  if (!value) return [];
  return value
    .split(',')
    .map((concern) => concern.trim().toLowerCase())
    .filter((concern): concern is SkinConcern => SKIN_CONCERNS.includes(concern as SkinConcern));
}

/** 개인 진단과 실제 제품 메타데이터가 일치할 때만 표시용 점수를 돌려준다. */
function getDisplayMatchScore(
  product: CosmeticProduct | SupplementProduct,
  profile: UserProfile
): number | undefined {
  const result = calculateProductMatchScore(product, profile);
  return calculatePersonalMatchPercentage(result.reasons);
}

export default function ProductsScreen() {
  const { colors, brand, status } = useTheme();
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

  const normalizedSkinType = useMemo(() => normalizeSkinType(skinType), [skinType]);
  const normalizedConcerns = useMemo(() => normalizeConcerns(concerns), [concerns]);
  const activeSeason = useMemo(
    () => normalizeSeason(querySeason ?? userSeason ?? ''),
    [querySeason, userSeason]
  );
  const matchProfile = useMemo<UserProfile>(
    () => ({
      skinType: normalizedSkinType,
      skinConcerns: normalizedConcerns.length > 0 ? normalizedConcerns : undefined,
      personalColorSeason: activeSeason ?? undefined,
    }),
    [normalizedSkinType, normalizedConcerns, activeSeason]
  );
  const hasDiagnosticProfile = Boolean(
    matchProfile.skinType || matchProfile.skinConcerns?.length || matchProfile.personalColorSeason
  );

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
    if (normalizedSkinType && normalizedConcerns.length > 0) {
      setFilterSource('피부 분석 + 고민 기반');
    } else if (normalizedSkinType) {
      setFilterSource('피부 분석 결과 기반');
    } else if (normalizedConcerns.length > 0) {
      setFilterSource('피부 고민 분석 결과 기반');
    } else if (activeSeason) {
      setFilterSource('퍼스널 컬러 분석 기반');
    } else {
      setFilterSource(null);
    }
  }, [normalizedSkinType, normalizedConcerns, activeSeason]);

  // 제품 목록 조회 (DB 연동) — cosmetic_products(2,821행)·supplement_products(200행)
  const fetchProducts = useCallback(async () => {
    try {
      let display: DisplayProduct[] = [];

      if (selectedCategory === 'supplement') {
        // 영양제 — supplement_products (이미지 전량 null → 이모지 플레이스홀더 정직 유지)
        const supplements = await getSupplementProducts(undefined, 20);
        display = supplements.map((product) =>
          supplementToDisplay(product, getDisplayMatchScore(product, matchProfile))
        );
      } else {
        let cosmetics: CosmeticProduct[] = [];

        if (normalizedSkinType) {
          // 피부 타입 기반 추천 (skin_types overlaps)
          cosmetics = await getCosmeticsBySkinType(
            normalizedSkinType,
            normalizedConcerns.length > 0 ? normalizedConcerns : undefined,
            20
          );
        } else if (activeSeason) {
          // 퍼스널 컬러 기반 추천 (personal_color_seasons overlaps)
          cosmetics = await getCosmeticsByPersonalColor(activeSeason, 20);
        } else {
          // 일반 조회 — 대분류→세분류 매핑
          const fine = fineCategoriesFor(selectedCategory);
          cosmetics = fine
            ? await getCosmeticProductsByCategories(fine, 20)
            : await getCosmeticProducts(undefined, 20);
        }

        // 분석 기반 추천 결과에도 대분류 필터 적용
        const filtered =
          selectedCategory !== 'all' && (normalizedSkinType || activeSeason)
            ? cosmetics.filter((p) => coarseCategoryOf(p.category) === selectedCategory)
            : cosmetics;

        display = filtered.map((product) =>
          cosmeticToDisplay(product, getDisplayMatchScore(product, matchProfile))
        );
      }

      // 실제 개인화 점수가 있는 제품만 우선하고, 근거 없는 제품끼리는 조회 순서를 보존한다.
      display.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
      setProducts(display);
    } catch (error) {
      productLogger.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, normalizedSkinType, normalizedConcerns, activeSeason, matchProfile]);

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

  return (
    <ScreenContainer
      testID="products-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="beauty"
    >
      {/* 맞춤 추천 배너 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)} style={styles.bannerWrapper}>
        <GlassCard shadowSize="md" style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              {hasDiagnosticProfile ? '맞춤 제품 추천' : '진단 후 더 정확해져요'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.mutedForeground }]}>
              {hasDiagnosticProfile
                ? filterSource || '진단 결과 기반'
                : '분석 결과가 생기면 제품별 맞춤 점수와 근거를 보여드려요'}
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

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
                    {product.matchScore !== undefined && (
                      <View style={[styles.matchBadge, { backgroundColor: brand.primary }]}>
                        <Text style={[styles.matchBadgeText, { color: brand.primaryForeground }]}>
                          {product.matchScore}%
                        </Text>
                      </View>
                    )}
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
