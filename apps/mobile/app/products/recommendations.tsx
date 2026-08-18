/**
 * AI 개인화 제품 추천 화면
 *
 * 사용자의 분석 결과(퍼스널컬러, 피부, 체형 등)를 기반으로
 * 매칭 점수가 높은 제품을 우선 추천.
 *
 * - 분석 결과 요약 카드
 * - 카테고리별 Top 추천
 * - 매칭 점수 시각화
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Sparkles, ChevronRight, Star, ShoppingBag } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useUserAnalyses } from '@/hooks/useUserAnalyses';
import { staggeredEntry, TIMING } from '@/lib/animations';
import {
  calculateMatchScore,
  calculatePersonalMatchPercentage,
  type UserProfile,
} from '@/lib/products/matching';
import {
  getCosmeticsBySkinType,
  getCosmeticsByPersonalColor,
} from '@/lib/products/repositories/cosmetic';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { GlassCard, ScreenContainer } from '../../components/ui';
import { productLogger } from '../../lib/utils/logger';
import type { CosmeticProduct, PersonalColorSeason, SkinType } from '../../types/product';

interface RecommendationSection {
  title: string;
  description: string;
  products: (CosmeticProduct & { matchScore: number })[];
}

export default function RecommendationsScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status } = useTheme();
  const { personalColor, skinAnalysis, isLoading: analysisLoading } = useUserAnalyses();
  const personalColorSeason = normalizeSeason(personalColor?.season ?? '');
  const skinType = normalizeSkinType(skinAnalysis?.skinType);

  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    const result: RecommendationSection[] = [];

    try {
      // 피부 기반 추천 — cosmetic_products.skin_types 매칭
      if (skinType) {
        const skinProducts = await getCosmeticsBySkinType(skinType, undefined, 10);
        const matchedProducts = withVerifiedMatchScore(skinProducts, {
          skinType,
        });
        if (matchedProducts.length > 0) {
          result.push({
            title: '피부 맞춤 추천',
            description: `${getSkinTypeLabel(skinType)}에 좋은 제품`,
            products: matchedProducts,
          });
        }
      }

      // 퍼스널컬러 기반 추천 — cosmetic_products.personal_color_seasons 매칭
      if (personalColorSeason) {
        const colorProducts = await getCosmeticsByPersonalColor(personalColorSeason, 10);
        const matchedProducts = withVerifiedMatchScore(colorProducts, {
          personalColorSeason,
        });
        if (matchedProducts.length > 0) {
          result.push({
            title: '컬러 맞춤 추천',
            description: `${getSeasonLabel(personalColorSeason)}에 어울리는 제품`,
            products: matchedProducts,
          });
        }
      }
    } catch (err) {
      productLogger.error('Recommendation fetch failed:', err);
    } finally {
      setIsLoading(false);
    }

    setSections(result);
  }, [skinType, personalColorSeason]);

  useEffect(() => {
    if (!analysisLoading) {
      fetchRecommendations();
    }
  }, [analysisLoading, fetchRecommendations]);

  const loading = isLoading || analysisLoading;

  // 분석 없음 상태
  const noAnalysis = !personalColorSeason && !skinType && !analysisLoading;

  return (
    <ScreenContainer
      testID="recommendations-screen"
      edges={['bottom']}
      onRefresh={fetchRecommendations}
      backgroundGradient="beauty"
    >
      {/* 헤더 카드 */}
      <Animated.View entering={staggeredEntry(0)} style={{ marginBottom: spacing.lg }}>
        <GlassCard
          shadowSize="lg"
          style={{
            backgroundColor: brand.primary,
            padding: spacing.lg,
          }}
        >
          <View style={styles.heroRow}>
            <Sparkles size={24} color={brand.primaryForeground} />
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
                marginLeft: spacing.sm,
              }}
            >
              AI 맞춤 추천
            </Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: brand.primaryForeground + 'D9',
              marginTop: spacing.xs,
              lineHeight: 20,
            }}
          >
            {noAnalysis
              ? '진단 후 더 정확한 제품 추천을 받을 수 있어요'
              : '분석 결과를 기반으로 가장 잘 맞는 제품을 추천해드려요'}
          </Text>

          {/* 분석 요약 태그 */}
          {(personalColorSeason || skinType) && (
            <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
              {personalColorSeason && (
                <View style={[styles.heroTag, { backgroundColor: brand.primaryForeground + '33' }]}>
                  <Text style={[styles.heroTagText, { color: brand.primaryForeground }]}>
                    {getSeasonLabel(personalColorSeason)}
                  </Text>
                </View>
              )}
              {skinType && (
                <View style={[styles.heroTag, { backgroundColor: brand.primaryForeground + '33' }]}>
                  <Text style={[styles.heroTagText, { color: brand.primaryForeground }]}>
                    {getSkinTypeLabel(skinType)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* 로딩 */}
      {loading && (
        <View style={[styles.center, { paddingVertical: spacing.xxl }]}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text
            style={{
              marginTop: spacing.sm,
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            추천 제품을 찾고 있어요
          </Text>
        </View>
      )}

      {/* 분석 없음 → CTA */}
      {noAnalysis && !loading && (
        <Animated.View entering={staggeredEntry(1)}>
          <GlassCard shadowSize="md" style={{ ...styles.ctaCard, padding: spacing.lg }}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.sm }}>🔬</Text>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                textAlign: 'center',
                marginBottom: spacing.xs,
              }}
            >
              맞춤 추천을 받으려면
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                textAlign: 'center',
                marginBottom: spacing.md,
              }}
            >
              피부 분석이나 퍼스널 컬러 진단을{'\n'}먼저 진행해주세요
            </Text>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: brand.primary, borderRadius: radii.xl }]}
              onPress={() => router.push('/(analysis)/skin')}
            >
              <Text
                style={{
                  color: brand.primaryForeground,
                  fontWeight: typography.weight.semibold,
                  fontSize: typography.size.sm,
                }}
              >
                분석 시작하기
              </Text>
            </Pressable>
          </GlassCard>
        </Animated.View>
      )}

      {/* 추천 섹션 */}
      {sections.map((section, sIdx) => (
        <Animated.View
          key={section.title}
          entering={staggeredEntry(sIdx + 1)}
          style={{ marginBottom: spacing.lg }}
        >
          {/* 섹션 헤더 */}
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                  color: colors.foreground,
                }}
              >
                {section.title}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xxs,
                }}
              >
                {section.description}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/products',
                  params: { category: 'skincare' },
                })
              }
              style={styles.seeAllButton}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: brand.primary,
                  fontWeight: typography.weight.semibold,
                }}
              >
                전체 보기
              </Text>
              <ChevronRight size={14} color={brand.primary} />
            </Pressable>
          </View>

          {/* 제품 카드 */}
          {section.products.slice(0, 5).map((product, pIdx) => (
            <Animated.View
              key={product.id}
              entering={FadeInUp.duration(TIMING.normal).delay(pIdx * TIMING.staggerInterval)}
              style={{ marginBottom: spacing.sm }}
            >
              <GlassCard shadowSize="md" style={styles.productCard}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/products/${product.id}`);
                  }}
                >
                  <View style={styles.productRow}>
                    {/* 순위 뱃지 */}
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor: pIdx < 3 ? brand.primary : colors.secondary,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: typography.size.xs,
                          fontWeight: typography.weight.bold,
                          color: pIdx < 3 ? brand.primaryForeground : colors.mutedForeground,
                        }}
                      >
                        {pIdx + 1}
                      </Text>
                    </View>

                    {/* 제품 정보 */}
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text
                        numberOfLines={1}
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
                    </View>

                    {/* 실제 진단 교집합이 확인된 제품만 매칭 점수를 가진다. */}
                    <View style={styles.matchBadge}>
                      <Star size={12} color={status.success} fill={status.success} />
                      <Text
                        style={{
                          fontSize: typography.size.xs,
                          fontWeight: typography.weight.bold,
                          color: status.success,
                          marginLeft: spacing.xxs,
                        }}
                      >
                        {product.matchScore}%
                      </Text>
                    </View>
                  </View>

                  {/* 가격 */}
                  {product.priceKrw != null && (
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                        marginTop: spacing.xs,
                        marginLeft: 36,
                      }}
                    >
                      {product.priceKrw.toLocaleString()}원
                    </Text>
                  )}
                </Pressable>
              </GlassCard>
            </Animated.View>
          ))}
        </Animated.View>
      ))}

      {/* 결과 없음 (분석 있는데 제품 없음) */}
      {!loading && !noAnalysis && sections.length === 0 && (
        <Animated.View
          entering={staggeredEntry(1)}
          style={[styles.center, { paddingVertical: spacing.xxl }]}
        >
          <ShoppingBag size={48} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginTop: spacing.md,
            }}
          >
            추천 제품이 아직 없어요
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: spacing.xs,
            }}
          >
            제품 DB가 업데이트되면 맞춤 추천을 보여드릴게요
          </Text>
        </Animated.View>
      )}
    </ScreenContainer>
  );
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

function normalizeSkinType(skinType: string | undefined): SkinType | null {
  return (['dry', 'oily', 'combination', 'sensitive', 'normal'] as const).includes(
    skinType as SkinType
  )
    ? (skinType as SkinType)
    : null;
}

/** 실제 진단 축이 제품의 변별력 있는 태그와 일치한 제품만 점수와 함께 반환한다. */
function withVerifiedMatchScore(
  products: CosmeticProduct[],
  profile: UserProfile
): (CosmeticProduct & { matchScore: number })[] {
  return products.flatMap((product) => {
    const result = calculateMatchScore(product, profile);
    const matchScore = calculatePersonalMatchPercentage(result.reasons);
    return matchScore === undefined ? [] : [{ ...product, matchScore }];
  });
}

// 헬퍼
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  };
  return labels[season] || season;
}

function getSkinTypeLabel(skinType: string): string {
  const labels: Record<string, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };
  return labels[skinType] || skinType;
}

const styles = StyleSheet.create({
  heroCard: {},
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroTag: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  heroTagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  center: {
    alignItems: 'center',
  },
  ctaCard: {
    marginBottom: spacing.md,
  },
  ctaButton: {
    paddingVertical: spacing.smx,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.smx,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCard: {
    padding: spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
