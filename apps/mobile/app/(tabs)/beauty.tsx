/**
 * 뷰티 탭
 * 피부 프로필 + 필터 + 제품 피드 + 분석 모듈 네비게이션
 */
import { useRouter } from 'expo-router';
import {
  Palette,
  Droplets,
  Calendar,
  Scissors,
  Brush,
  SmilePlus,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  SkinProfileCard,
  SkinConcernFilter,
  CategoryFilter,
  IngredientFilter,
  PriceRangeFilter,
  RatingFilter,
  PRICE_RANGE_MAP,
  BeautyProductFeed,
} from '../../components/beauty';
import type { BeautyProduct } from '../../components/beauty';
import { EmptyState } from '../../components/common/EmptyState';
import { CollapsibleSection, MenuCard, GradientBackground, ScreenContainer, SectionHeader, SkeletonCircle, SkeletonText } from '../../components/ui';
import { useUserAnalyses } from '../../hooks/useUserAnalyses';
import { useAffiliateProducts } from '../../lib/affiliate/useAffiliateProducts';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useTheme, typography, radii, ICON_BG_OPACITY, borderGlow } from '../../lib/theme';

export default function BeautyTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, module: moduleColors, typography } = useTheme();
  const { skinAnalysis, isLoading, refetch: refetchAnalyses } = useUserAnalyses();

  // DB에서 제품 조회
  const { products: affiliateProducts, isLoading: productsLoading, refetch: refetchProducts } = useAffiliateProducts({
    sortBy: 'rating',
    limit: 30,
  });

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalyses(), refetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalyses, refetchProducts]);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  // 필터 활성 여부 (초기화 버튼 표시 조건)
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedConcerns.length > 0 ||
    selectedIngredients.length > 0 ||
    selectedPriceRange !== 'all' ||
    selectedRating !== 'all';

  const resetAllFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedConcerns([]);
    setSelectedIngredients([]);
    setSelectedPriceRange('all');
    setSelectedRating('all');
  }, []);

  // AffiliateProduct → BeautyProduct 변환 + 매칭률 계산
  const sortedProducts = useMemo(() => {
    const userConcerns = skinAnalysis?.concerns ?? [];
    return affiliateProducts
      .map((p): BeautyProduct => {
        const productConcerns = (p.skinConcerns as string[] | undefined) ?? [];
        // 사용자 피부 고민 매칭률 (기본 60점 + 매칭 보너스 최대 40점)
        const matchCount = userConcerns.filter((c) => productConcerns.includes(c)).length;
        const matchRate =
          userConcerns.length > 0
            ? Math.round(60 + (matchCount / userConcerns.length) * 40)
            : p.rating
              ? Math.round(p.rating * 16)
              : 70;

        return {
          id: p.id,
          name: p.name,
          brand: p.brand ?? '',
          imageUrl: p.imageUrl,
          matchRate,
          rating: p.rating ?? 0,
          price: p.price,
          category: p.category ?? 'skincare',
          concerns: productConcerns,
          ingredients: (p.tags as string[] | undefined) ?? [],
        };
      })
      .sort((a, b) => b.matchRate - a.matchRate);
  }, [affiliateProducts, skinAnalysis?.concerns]);

  const hasSkinData = skinAnalysis !== null;

  return (
    <ScreenContainer testID="beauty-tab" contentContainerStyle={{ paddingBottom: spacing.xl }} refreshing={refreshing} onRefresh={handleRefresh}>
        {/* 히어로 헤더 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GradientBackground
            variant="personalColor"
            style={{
              borderRadius: radii.xl + spacing.xs,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <SectionHeader
              title="뷰티"
              style={{ marginBottom: spacing.xs }}
              titleStyle={{ color: colors.overlayForeground, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold }}
            />
          </GradientBackground>
        </Animated.View>

        {/* 피부 프로필 카드 */}
        {isLoading ? (
          <View
            testID="skin-profile-skeleton"
            accessibilityLabel="피부 프로필 로딩 중"
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonCircle size={spacing.xl + spacing.xs} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <SkeletonText style={{ width: 80, marginBottom: spacing.xs }} />
                <SkeletonText style={{ width: 60, height: 10 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
              <SkeletonCircle size={spacing.xxl + spacing.xl + spacing.sm} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <SkeletonText style={{ width: 100, height: 18, marginBottom: spacing.xs }} />
                <SkeletonText style={{ width: 70 }} />
              </View>
            </View>
          </View>
        ) : hasSkinData ? (
          <SkinProfileCard
            skinType={skinAnalysis.skinType}
            overallScore={skinAnalysis.overallScore}
            concerns={skinAnalysis.concerns}
            createdAt={skinAnalysis.createdAt}
            style={{ marginBottom: spacing.lg, ...borderGlow.subtle }}
            testID="skin-profile-card"
          />
        ) : (
          <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
            <EmptyState
              icon={<Droplets size={28} color={moduleColors.skin.base} />}
              title="피부 분석을 해보세요"
              description="AI가 피부 상태를 분석하고 맞춤 케어를 추천해줘요"
              actionLabel="피부 분석 시작"
              onAction={() => router.push('/(analysis)/skin')}
              testID="skin-empty-cta"
            />
          </Animated.View>
        )}

        {/* 추천 제품 섹션 */}
        <CollapsibleSection
          title="추천 제품"
          trailing={productsLoading ? '로딩 중...' : `${sortedProducts.length}개`}
          defaultOpen
          style={{ marginBottom: spacing.lg }}
          testID="product-section"
        >
          <CategoryFilter
            selected={selectedCategory}
            onSelectionChange={setSelectedCategory}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="category-filter"
          />
          <SkinConcernFilter
            selected={selectedConcerns}
            onSelectionChange={setSelectedConcerns}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="concern-filter"
          />
          <IngredientFilter
            selected={selectedIngredients}
            onSelectionChange={setSelectedIngredients}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="ingredient-filter"
          />
          <PriceRangeFilter
            selected={selectedPriceRange}
            onSelectionChange={setSelectedPriceRange}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="price-filter"
          />
          <RatingFilter
            selected={selectedRating}
            onSelectionChange={setSelectedRating}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="rating-filter"
          />
          {/* 필터 초기화 버튼 */}
          {hasActiveFilters && (
            <Pressable
              onPress={resetAllFilters}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.sm + spacing.xs,
                paddingVertical: spacing.xs + 2,
                borderRadius: radii.xl,
                backgroundColor: colors.destructive + '15',
                marginBottom: spacing.md,
              }}
              testID="filter-reset-button"
              accessibilityLabel="필터 초기화"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: typography.size.sm - 1,
                  fontWeight: typography.weight.semibold,
                  color: colors.destructive,
                }}
              >
                필터 초기화
              </Text>
            </Pressable>
          )}
          <BeautyProductFeed
            products={sortedProducts}
            categoryFilter={selectedCategory}
            concernFilter={selectedConcerns}
            ingredientFilter={selectedIngredients}
            priceRange={PRICE_RANGE_MAP[selectedPriceRange]}
            minRating={selectedRating !== 'all' ? parseFloat(selectedRating) : 0}
            onProductPress={(p) => router.push(`/products/${p.id}`)}
            testID="product-feed"
          />
        </CollapsibleSection>

        {/* 분석 모듈 네비게이션 */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <SectionHeader title="분석" gradient="personalColor" style={{ marginBottom: spacing.sm + 4 }} />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4 }}>
          <Animated.View entering={staggeredEntry(0)}>
            <MenuCard
              icon={<Droplets size={20} color={moduleColors.skin.dark} />}
              iconBg={moduleColors.skin.light + ICON_BG_OPACITY}
              title="피부 분석"
              description="AI가 피부 상태를 분석하고 맞춤 케어를 추천해요"
              onPress={() => router.push('/(analysis)/skin')}
              testID="menu-skin"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(1)}>
            <MenuCard
              icon={<Calendar size={20} color={moduleColors.skin.base} />}
              iconBg={moduleColors.skin.light + ICON_BG_OPACITY}
              title="스킨케어 루틴"
              description="내 피부에 맞는 아침/저녁 스킨케어 루틴을 확인해요"
              onPress={() => router.push('/(analysis)/skin/routine')}
              testID="menu-routine"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(2)}>
            <MenuCard
              icon={<Palette size={20} color={moduleColors.personalColor.dark} />}
              iconBg={moduleColors.personalColor.light + ICON_BG_OPACITY}
              title="퍼스널 컬러"
              description="나에게 어울리는 색상을 찾아보세요"
              onPress={() => router.push('/(analysis)/personal-color')}
              testID="menu-personal-color"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(3)}>
            <MenuCard
              icon={<Scissors size={20} color={moduleColors.hair.dark} />}
              iconBg={moduleColors.hair.light + ICON_BG_OPACITY}
              title="헤어 분석"
              description="모발 유형과 두피 상태를 분석하고 케어 루틴을 추천해요"
              onPress={() => router.push('/(analysis)/hair')}
              testID="menu-hair"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(4)}>
            <MenuCard
              icon={<Brush size={20} color={moduleColors.makeup.dark} />}
              iconBg={moduleColors.makeup.light + ICON_BG_OPACITY}
              title="메이크업 분석"
              description="얼굴형과 톤에 맞는 메이크업 스타일을 찾아보세요"
              onPress={() => router.push('/(analysis)/makeup')}
              testID="menu-makeup"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(5)}>
            <MenuCard
              icon={<SmilePlus size={20} color={moduleColors.oralHealth.dark} />}
              iconBg={moduleColors.oralHealth.light + ICON_BG_OPACITY}
              title="구강건강 분석"
              description="치아 색상과 잇몸 건강을 체크해요"
              onPress={() => router.push('/(analysis)/oral-health')}
              testID="menu-oral-health"
            />
          </Animated.View>
        </View>
    </ScreenContainer>
  );
}
