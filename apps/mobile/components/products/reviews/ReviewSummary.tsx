/**
 * 리뷰 요약 컴포넌트
 * @description 평점 분포 및 통계 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const { averageRating, totalCount, ratingDistribution } = summary;

  // 가장 높은 평점 개수 (막대 그래프 비율 계산용)
  const maxCount = Math.max(...Object.values(ratingDistribution), 1);

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = (count / maxCount) * 100;

    return (
      <View key={rating} style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>{rating}점</Text>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${percentage}%`, backgroundColor: getRatingColor(rating) },
            ]}
          />
        </View>
        <Text style={styles.countLabel}>{count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container} accessibilityRole="summary">
      {/* 평균 점수 */}
      <View style={styles.averageSection}>
        <Text style={styles.averageScore}>{averageRating.toFixed(1)}</Text>
        <StarRating rating={averageRating} size="medium" showAverage={false} />
        <Text style={styles.totalCount}>
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
  return (
    <View style={styles.container}>
      <View style={styles.averageSection}>
        <View style={[styles.skeleton, { width: 60, height: 48 }]} />
        <View style={[styles.skeleton, { width: 120, height: 24, marginTop: 8 }]} />
        <View style={[styles.skeleton, { width: 80, height: 16, marginTop: 8 }]} />
      </View>
      <View style={styles.distributionSection}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.ratingRow}>
            <View style={[styles.skeleton, { width: 24, height: 16 }]} />
            <View style={[styles.skeleton, { flex: 1, height: 8, marginHorizontal: 8 }]} />
            <View style={[styles.skeleton, { width: 24, height: 16 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 리뷰 배열로부터 요약 데이터 계산
 */
export function calculateReviewSummary(
  reviews: Array<{ rating: number }>
): ReviewSummaryData {
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  averageSection: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  averageScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  distributionSection: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ratingLabel: {
    width: 28,
    fontSize: 12,
    color: '#6B7280',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  countLabel: {
    width: 28,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});
