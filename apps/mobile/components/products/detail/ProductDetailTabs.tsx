import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { lookupIngredients } from '@/lib/ingredients/ewg-database';
import { useTheme, typography, spacing } from '@/lib/theme';

import type { ProductDetail, ProductReview } from './product-detail.types';
import { GlassCard } from '../../ui';
import { EWGAnalysis } from '../ingredients/EWGAnalysis';

type TabType = 'info' | 'ingredients' | 'reviews';

interface ProductDetailTabsProps {
  product: ProductDetail;
  reviews: ProductReview[];
}

export function ProductDetailTabs({ product, reviews }: ProductDetailTabsProps) {
  const { colors, brand } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  return (
    <>
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

      <View style={styles.tabContent}>
        {activeTab === 'info' && <ProductInfo product={product} />}
        {activeTab === 'ingredients' && (
          <EWGAnalysis ingredients={lookupIngredients(product.ingredients)} />
        )}
        {activeTab === 'reviews' && <ProductReviews reviews={reviews} />}
      </View>
    </>
  );
}

function ProductInfo({ product }: { product: ProductDetail }) {
  const { colors, status } = useTheme();
  const isEmpty = !product.description && product.benefits.length === 0 && !product.howToUse;

  return (
    <>
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
      {isEmpty && (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          상세 설명이 아직 준비되지 않았어요. 성분 탭에서 성분 정보를 확인할 수 있어요.
        </Text>
      )}
    </>
  );
}

function ProductReviews({ reviews }: { reviews: ProductReview[] }) {
  const { colors, status } = useTheme();
  return (
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
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: typography.size.sm },
  tabContent: { padding: spacing.mlg },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
    marginTop: spacing.sm,
  },
  description: { fontSize: typography.size.sm, lineHeight: 22, marginBottom: spacing.mlg },
  benefitsList: { marginBottom: spacing.mlg },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  benefitDot: { fontSize: typography.size.sm, marginRight: spacing.sm },
  benefitText: { fontSize: typography.size.sm },
  reviewCard: { padding: spacing.md, marginBottom: spacing.smx },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  reviewUser: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  reviewRating: { fontSize: typography.size.xs },
  reviewDate: { fontSize: typography.size.xs, marginBottom: spacing.sm },
  reviewContent: { fontSize: typography.size.sm, lineHeight: 20, marginBottom: spacing.sm },
  reviewHelpful: { fontSize: typography.size.xs },
});
