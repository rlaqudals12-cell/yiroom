/**
 * 리뷰 요약 컴포넌트
 * @description 평점 분포 및 통계 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography, spacing, radii } from '../../../lib/theme';

import { StarRating, getRatingColor } from './StarRating';

export interface ReviewSummaryData {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewSummaryProps {
  summary: ReviewSummaryData;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const { colors, typography } = useTheme();
  const { averageRating, totalCount, ratingDistribution } = summary;

  // 가장 높은 평점 개수 (막대 그래프 비율 계산용)
  const maxCount = Math.max(...Object.values(ratingDistribution), 1);

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = (count / maxCount) * 100;

    return (
      <View key={rating} style={styles.ratingRow}>
        <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>{rating}점</Text>
        <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.bar,
              {
                width: `${percentage}%`,
                backgroundColor: getRatingColor(rating),
              },
            ]}
          />
        </View>
        <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>{count}</Text>
      </View>
    );
  };

  return (
    <View
      testID="review-summary"
      style={[styles.container, { backgroundColor: colors.card }]}
      accessibilityRole="summary"
    >
      {/* 평균 점수 */}
      <View style={[styles.averageSection, { borderRightColor: colors.border }]}>
        <Text style={[styles.averageScore, { color: colors.foreground }]}>
          {averageRating.toFixed(1)}
        </Text>
        <StarRating rating={averageRating} size="medium" showAverage={false} />
        <Text style={[styles.totalCount, { color: colors.mutedForeground }]}>
          {totalCount.toLocaleString()}개의 리뷰
        </Text>
      </View>

      {/* 평점 분포 */}
      <View style={styles.distributionSection}>
        {[5, 4, 3, 2, 1].map((rating) =>
          renderRatingBar(rating, ratingDistribution[rating as keyof typeof ratingDistribution])
        )}
      </View>
    </View>
  );
}

/**
 * 리뷰 요약 스켈레톤
 */
export function ReviewSummarySkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.averageSection, { borderRightColor: colors.border }]}>
        <View style={[styles.skeleton, { width: 60, height: 48, backgroundColor: colors.border }]} />
        <View style={[styles.skeleton, { width: 120, height: 24, marginTop: spacing.sm, backgroundColor: colors.border }]} />
        <View style={[styles.skeleton, { width: 80, height: 16, marginTop: spacing.sm, backgroundColor: colors.border }]} />
      </View>
      <View style={styles.distributionSection}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.ratingRow}>
            <View style={[styles.skeleton, { width: 24, height: 16, backgroundColor: colors.border }]} />
            <View style={[styles.skeleton, { flex: 1, height: 8, marginHorizontal: spacing.sm, backgroundColor: colors.border }]} />
            <View style={[styles.skeleton, { width: 24, height: 16, backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 리뷰 배열로부터 요약 데이터 계산
 */
export function calculateReviewSummary(reviews: { rating: number }[]): ReviewSummaryData {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach((review) => {
    const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
      totalRating += review.rating;
    }
  });

  return {
    averageRating: totalRating / reviews.length,
    totalCount: reviews.length,
    ratingDistribution: distribution,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.smx,
    padding: spacing.md,
  },
  averageSection: {
    alignItems: 'center',
    paddingRight: spacing.mlg,
    borderRightWidth: 1,
  },
  averageScore: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
  },
  totalCount: {
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  distributionSection: {
    flex: 1,
    paddingLeft: spacing.mlg,
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxs,
  },
  ratingLabel: {
    width: 28,
    fontSize: typography.size.xs,
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  countLabel: {
    width: 28,
    fontSize: typography.size.xs,
    textAlign: 'right',
  },
  skeleton: {
    borderRadius: 4,
  },
});
