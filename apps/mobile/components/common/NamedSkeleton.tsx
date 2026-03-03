/**
 * 도메인별 스켈레톤 변형
 *
 * 분석 결과, 제품 카드, 프로필 등 도메인 특화 스켈레톤
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';
import { Skeleton } from './Skeleton';

export type SkeletonVariant =
  | 'analysis-result'
  | 'product-card'
  | 'profile'
  | 'workout-card'
  | 'nutrition-summary'
  | 'ranking'
  | 'timeline';

export interface NamedSkeletonProps {
  variant: SkeletonVariant;
  /** 반복 횟수 */
  count?: number;
}

export function NamedSkeleton({
  variant,
  count = 1,
}: NamedSkeletonProps): React.ReactElement {
  const { colors } = useTheme();

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View testID="named-skeleton" accessibilityLabel="로딩 중">
      {items.map((i) => (
        <View key={i} style={i > 0 ? { marginTop: spacing.smx } : undefined}>
          {renderVariant(variant, colors)}
        </View>
      ))}
    </View>
  );
}

function renderVariant(
  variant: SkeletonVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): React.ReactElement {
  switch (variant) {
    case 'analysis-result':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* 점수 원형 */}
          <View style={styles.analysisHeader}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={styles.analysisMeta}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} />
            </View>
          </View>
          {/* 세부 항목 */}
          <Skeleton width="100%" height={12} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="60%" height={12} />
        </View>
      );

    case 'product-card':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Skeleton width="100%" height={120} borderRadius={8} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="30%" height={16} />
        </View>
      );

    case 'profile':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <View style={styles.profileInfo}>
              <Skeleton width={100} height={16} />
              <Skeleton width={60} height={12} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <Skeleton width={60} height={40} />
            <Skeleton width={60} height={40} />
            <Skeleton width={60} height={40} />
          </View>
        </View>
      );

    case 'workout-card':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Skeleton width={48} height={48} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: spacing.smx }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
          <Skeleton width="100%" height={8} borderRadius={4} />
        </View>
      );

    case 'nutrition-summary':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Skeleton width={120} height={16} />
          <View style={styles.nutritionBars}>
            <Skeleton width="100%" height={24} borderRadius={4} />
            <Skeleton width="100%" height={24} borderRadius={4} />
            <Skeleton width="100%" height={24} borderRadius={4} />
          </View>
          <Skeleton width="50%" height={12} />
        </View>
      );

    case 'ranking':
      return (
        <View style={[styles.rankingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Skeleton width={80} height={14} />
          </View>
          <Skeleton width={50} height={14} />
        </View>
      );

    case 'timeline':
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Skeleton width={100} height={14} />
          <View style={styles.timelineBars}>
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} width={20} height={40 + Math.random() * 60} borderRadius={4} />
            ))}
          </View>
        </View>
      );

    default:
      return <Skeleton width="100%" height={80} />;
  }
}

const styles = StyleSheet.create({
  gap: {
    marginTop: spacing.smx,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  analysisMeta: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionBars: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.smx,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  timelineBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    height: 100,
  },
});
