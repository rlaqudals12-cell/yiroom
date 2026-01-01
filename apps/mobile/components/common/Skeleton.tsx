/**
 * 스켈레톤 로딩 컴포넌트
 * 콘텐츠 로딩 시 플레이스홀더 표시
 */

import { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  useColorScheme,
} from 'react-native';

type DimensionValue = number | `${number}%` | 'auto';

interface SkeletonProps {
  // 너비 (숫자 또는 퍼센트)
  width?: DimensionValue;
  // 높이
  height?: number;
  // 테두리 둥글기
  borderRadius?: number;
  // 원형 여부
  circle?: boolean;
  // 추가 스타일
  style?: ViewStyle;
}

/**
 * 기본 스켈레톤 컴포넌트
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  circle = false,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // 펄스 애니메이션
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const size = circle ? height : undefined;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        isDark && styles.skeletonDark,
        {
          width: size || width,
          height,
          borderRadius: circle ? height / 2 : borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * 텍스트 라인 스켈레톤
 */
export function SkeletonText({
  lines = 1,
  spacing = 8,
  lastLineWidth = '60%' as DimensionValue,
  style,
}: {
  lines?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={
            index === lines - 1 && lines > 1
              ? lastLineWidth
              : ('100%' as DimensionValue)
          }
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
}

/**
 * 카드 스켈레톤
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, isDark && styles.cardDark, style]}>
      <View style={styles.cardHeader}>
        <Skeleton circle height={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton height={14} width={120} />
          <Skeleton height={12} width={80} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonText lines={3} style={{ marginTop: 12 }} />
    </View>
  );
}

/**
 * 리스트 아이템 스켈레톤
 */
export function SkeletonListItem({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.listItem, isDark && styles.listItemDark, style]}>
      <Skeleton circle height={48} />
      <View style={styles.listItemContent}>
        <Skeleton height={16} width="70%" />
        <Skeleton height={12} width="50%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * 운동 카드 스켈레톤
 */
export function SkeletonWorkoutCard({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.workoutCard, isDark && styles.cardDark, style]}>
      <Skeleton height={120} borderRadius={12} style={{ marginBottom: 12 }} />
      <Skeleton height={18} width="80%" />
      <Skeleton height={14} width="60%" style={{ marginTop: 8 }} />
      <View style={styles.workoutStats}>
        <Skeleton height={12} width={60} />
        <Skeleton height={12} width={60} />
        <Skeleton height={12} width={60} />
      </View>
    </View>
  );
}

/**
 * 영양 요약 스켈레톤
 */
export function SkeletonNutritionSummary({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.nutritionCard, isDark && styles.cardDark, style]}>
      <View style={styles.nutritionHeader}>
        <Skeleton height={16} width={100} />
        <Skeleton height={24} width={60} />
      </View>
      <Skeleton height={8} borderRadius={4} style={{ marginTop: 12 }} />
      <View style={styles.nutritionStats}>
        <View style={styles.nutritionStat}>
          <Skeleton circle height={40} />
          <Skeleton height={12} width={40} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.nutritionStat}>
          <Skeleton circle height={40} />
          <Skeleton height={12} width={40} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.nutritionStat}>
          <Skeleton circle height={40} />
          <Skeleton height={12} width={40} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * 제품 카드 스켈레톤
 */
export function SkeletonProductCard({ style }: { style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.productCard, isDark && styles.cardDark, style]}>
      <Skeleton height={160} borderRadius={12} />
      <View style={styles.productContent}>
        <Skeleton height={12} width={60} style={{ marginTop: 12 }} />
        <Skeleton height={16} width="90%" style={{ marginTop: 8 }} />
        <View style={styles.productPrice}>
          <Skeleton height={18} width={80} />
          <Skeleton height={14} width={40} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
  },
  skeletonDark: {
    backgroundColor: '#374151',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  listItemDark: {
    backgroundColor: '#1f2937',
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  nutritionStat: {
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  productContent: {
    padding: 12,
  },
  productPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});
