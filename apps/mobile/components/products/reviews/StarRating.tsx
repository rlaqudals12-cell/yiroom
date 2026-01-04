/**
 * 별점 컴포넌트
 * @description 별점 표시 및 입력 지원
 */

import React from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  AccessibilityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppPreferencesStore } from '@/lib/stores';

interface StarRatingProps extends AccessibilityProps {
  /** 현재 별점 (1-5) */
  rating: number;
  /** 별점 변경 핸들러 (설정 시 편집 가능) */
  onRatingChange?: (rating: number) => void;
  /** 별 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 별 색상 */
  color?: string;
  /** 리뷰 개수 표시 */
  reviewCount?: number;
  /** 평균 점수 표시 */
  showAverage?: boolean;
}

const SIZES = {
  small: 16,
  medium: 24,
  large: 32,
};

const STAR_COUNT = 5;

export function StarRating({
  rating,
  onRatingChange,
  size = 'medium',
  color = '#FFD700',
  reviewCount,
  showAverage = false,
  ...accessibilityProps
}: StarRatingProps) {
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const isEditable = !!onRatingChange;
  const starSize = SIZES[size];

  const handlePress = (index: number) => {
    if (!onRatingChange) return;

    const newRating = index + 1;
    onRatingChange(newRating);

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderStar = (index: number) => {
    const filled = index < rating;
    const halfFilled = !filled && index < rating + 0.5;

    const StarContent = (
      <Text
        style={[
          styles.star,
          { fontSize: starSize, color: filled || halfFilled ? color : '#E0E0E0' },
        ]}
      >
        {filled ? '★' : halfFilled ? '☆' : '☆'}
      </Text>
    );

    if (isEditable) {
      return (
        <Pressable
          key={index}
          onPress={() => handlePress(index)}
          style={({ pressed }) => [
            styles.starButton,
            pressed && styles.starButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${index + 1}점`}
          accessibilityHint="탭하여 별점 선택"
        >
          {StarContent}
        </Pressable>
      );
    }

    return (
      <View key={index} style={styles.starButton}>
        {StarContent}
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="adjustable"
      accessibilityLabel={`별점 ${rating}점`}
      {...accessibilityProps}
    >
      <View style={styles.starsContainer}>
        {Array.from({ length: STAR_COUNT }, (_, i) => renderStar(i))}
      </View>

      {(showAverage || reviewCount !== undefined) && (
        <View style={styles.infoContainer}>
          {showAverage && (
            <Text style={[styles.averageText, { fontSize: starSize * 0.6 }]}>
              {rating.toFixed(1)}
            </Text>
          )}
          {reviewCount !== undefined && (
            <Text style={[styles.countText, { fontSize: starSize * 0.5 }]}>
              ({reviewCount.toLocaleString()})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * 별점 텍스트 반환
 */
export function getRatingText(rating: number): string {
  if (rating >= 5) return '최고예요';
  if (rating >= 4) return '좋아요';
  if (rating >= 3) return '보통이에요';
  if (rating >= 2) return '별로예요';
  return '최악이에요';
}

/**
 * 별점 색상 반환
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4) return '#22C55E'; // green
  if (rating >= 3) return '#F59E0B'; // amber
  if (rating >= 2) return '#F97316'; // orange
  return '#EF4444'; // red
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 2,
  },
  starButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 1.1 }],
  },
  star: {
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  averageText: {
    fontWeight: '600',
    color: '#374151',
  },
  countText: {
    color: '#6B7280',
    marginLeft: 4,
  },
});
