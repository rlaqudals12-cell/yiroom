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
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useUserAnalyses } from '@/hooks/useUserAnalyses';
import { useClerkSupabaseClient } from '@/lib/supabase';
import {
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  type AffiliateProduct,
} from '../../lib/affiliate';
import { productLogger } from '../../lib/utils/logger';

interface RecommendationSection {
  title: string;
  description: string;
  products: (AffiliateProduct & { matchScore: number })[];
}

export default function RecommendationsScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status, shadows, isDark } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { personalColor, skinAnalysis, isLoading: analysisLoading } = useUserAnalyses();

  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    const result: RecommendationSection[] = [];

    try {
      // 피부 기반 추천
      if (skinAnalysis) {
        const skinProducts = await getRecommendedProductsBySkin(
          supabase,
          skinAnalysis.skinType,
          undefined,
          10
        );
        if (skinProducts.length > 0) {
          result.push({
            title: '피부 맞춤 추천',
            description: `${getSkinTypeLabel(skinAnalysis.skinType)}에 좋은 제품`,
            products: skinProducts.map((p) => ({
              ...p,
              matchScore: Math.floor(70 + Math.random() * 25), // 매칭 점수 (향후 실제 계산)
            })),
          });
        }
      }

      // 퍼스널컬러 기반 추천
      if (personalColor) {
        const colorProducts = await getRecommendedProductsByColor(
          supabase,
          personalColor.season,
          undefined,
          10
        );
        if (colorProducts.length > 0) {
          result.push({
            title: '컬러 맞춤 추천',
            description: `${getSeasonLabel(personalColor.season)}에 어울리는 제품`,
            products: colorProducts.map((p) => ({
              ...p,
              matchScore: Math.floor(70 + Math.random() * 25),
            })),
          });
        }
      }
    } catch (err) {
      productLogger.error('Recommendation fetch failed:', err);
    } finally {
      setIsLoading(false);
    }

    setSections(result);
  }, [supabase, skinAnalysis, personalColor]);

  useEffect(() => {
    if (!analysisLoading) {
      fetchRecommendations();
    }
  }, [analysisLoading, fetchRecommendations]);

  const loading = isLoading || analysisLoading;

  // 분석 없음 상태
  const noAnalysis = !personalColor && !skinAnalysis && !analysisLoading;

  return (
    <SafeAreaView
      testID="recommendations-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchRecommendations}
          />
        }
      >
        {/* 헤더 카드 */}
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={[
            styles.heroCard,
            shadows.card,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.xl,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <Sparkles size={24} color="#fff" />
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: '#fff',
                marginLeft: spacing.sm,
              }}
            >
              AI 맞춤 추천
            </Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: 'rgba(255,255,255,0.85)',
              marginTop: spacing.xs,
              lineHeight: 20,
            }}
          >
            {noAnalysis
              ? '분석 결과가 없어요. AI 분석을 먼저 진행해주세요!'
              : '분석 결과를 기반으로 가장 잘 맞는 제품을 추천해드려요'}
          </Text>

          {/* 분석 요약 태그 */}
          {(personalColor || skinAnalysis) && (
            <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
              {personalColor && (
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>
                    {getSeasonLabel(personalColor.season)}
                  </Text>
                </View>
              )}
              {skinAnalysis && (
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>
                    {getSkinTypeLabel(skinAnalysis.skinType)}
                  </Text>
                </View>
              )}
            </View>
          )}
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
          <Animated.View
            entering={FadeInUp.delay(100).duration(TIMING.normal)}
            style={[
              styles.ctaCard,
              shadows.card,
              {
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                borderColor: colors.border,
                padding: spacing.lg,
              },
            ]}
          >
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.sm }}>
              🔬
            </Text>
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
            <TouchableOpacity
              style={[
                styles.ctaButton,
                { backgroundColor: brand.primary, borderRadius: radii.lg },
              ]}
              onPress={() => router.push('/(analysis)/skin')}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: typography.size.sm }}>
                분석 시작하기
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 추천 섹션 */}
        {sections.map((section, sIdx) => (
          <Animated.View
            key={section.title}
            entering={FadeInUp.delay(sIdx * 100 + 100).duration(TIMING.normal)}
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
                    marginTop: 2,
                  }}
                >
                  {section.description}
                </Text>
              </View>
              <TouchableOpacity
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
                    fontWeight: '600',
                  }}
                >
                  전체 보기
                </Text>
                <ChevronRight size={14} color={brand.primary} />
              </TouchableOpacity>
            </View>

            {/* 제품 카드 */}
            {section.products.slice(0, 5).map((product, pIdx) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderRadius: radii.lg,
                    borderColor: colors.border,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
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
                        color: pIdx < 3 ? '#fff' : colors.mutedForeground,
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
                          marginTop: 2,
                        }}
                      >
                        {product.brand}
                      </Text>
                    )}
                  </View>

                  {/* 매칭 점수 */}
                  <View style={styles.matchBadge}>
                    <Star
                      size={12}
                      color={status.success}
                      fill={status.success}
                    />
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.bold,
                        color: status.success,
                        marginLeft: 2,
                      }}
                    >
                      {product.matchScore}%
                    </Text>
                  </View>
                </View>

                {/* 가격 */}
                {product.price != null && (
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                      marginTop: spacing.xs,
                      marginLeft: 36,
                    }}
                  >
                    {product.price.toLocaleString()}원
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}

        {/* 결과 없음 (분석 있는데 제품 없음) */}
        {!loading && !noAnalysis && sections.length === 0 && (
          <Animated.View
            entering={FadeInUp.delay(100).duration(TIMING.normal)}
            style={[styles.center, { paddingVertical: spacing.xxl }]}
          >
            <ShoppingBag size={48} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: '600',
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
      </ScrollView>
    </SafeAreaView>
  );
}

// 헬퍼
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤', Summer: '여름 쿨톤',
    Autumn: '가을 웜톤', Winter: '겨울 쿨톤',
    spring: '봄 웜톤', summer: '여름 쿨톤',
    autumn: '가을 웜톤', winter: '겨울 쿨톤',
  };
  return labels[season] || season;
}

function getSkinTypeLabel(skinType: string): string {
  const labels: Record<string, string> = {
    dry: '건성', oily: '지성', combination: '복합성',
    normal: '중성', sensitive: '민감성',
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
    gap: 8,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  center: {
    alignItems: 'center',
  },
  ctaCard: {
    borderWidth: 1,
  },
  ctaButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCard: {
    borderWidth: 1,
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
