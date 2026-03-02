/**
 * 변화 추적기 (비포/애프터 비교)
 *
 * 점수 변화를 시각적으로 표시하는 카드
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface ChangeTrackerItem {
  label: string;
  before: number;
  after: number;
  unit?: string;
  /** 높은 게 좋은지 낮은 게 좋은지 */
  higherIsBetter?: boolean;
}

export interface ChangeTrackerProps {
  title: string;
  items: ChangeTrackerItem[];
  beforeLabel?: string;
  afterLabel?: string;
  /** 변형: beauty(피부/뷰티), fitness(운동/체형) */
  variant?: 'beauty' | 'fitness' | 'default';
}

export function ChangeTracker({
  title,
  items,
  beforeLabel = '이전',
  afterLabel = '현재',
  variant = 'default',
}: ChangeTrackerProps): React.ReactElement {
  const { colors, brand, status, typography } = useTheme();

  const accentColor =
    variant === 'beauty'
      ? brand.primary
      : variant === 'fitness'
        ? status.success
        : brand.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="summary"
      accessibilityLabel={`${title} 변화 추적`}
      testID="change-tracker"
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground, fontSize: typography.size.lg }]}>
        {title}
      </Text>

      {/* 헤더 */}
      <View style={styles.headerRow}>
        <View style={styles.labelCol} />
        <Text style={[styles.headerText, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {beforeLabel}
        </Text>
        <Text style={[styles.headerText, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {afterLabel}
        </Text>
        <Text style={[styles.headerText, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          변화
        </Text>
      </View>

      {/* 항목 */}
      {items.map((item, index) => {
        const diff = item.after - item.before;
        const higherIsBetter = item.higherIsBetter ?? true;
        const isPositive = higherIsBetter ? diff > 0 : diff < 0;
        const isNegative = higherIsBetter ? diff < 0 : diff > 0;
        const changeColor = isPositive
          ? status.success
          : isNegative
            ? colors.destructive
            : colors.mutedForeground;
        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
        const unit = item.unit ?? '점';

        return (
          <View
            key={item.label}
            style={[
              styles.itemRow,
              index < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
            ]}
            accessibilityLabel={`${item.label}: ${item.before}${unit}에서 ${item.after}${unit}으로 ${Math.abs(diff)}${unit} ${diff > 0 ? '증가' : diff < 0 ? '감소' : '유지'}`}
          >
            <Text
              style={[styles.itemLabel, { color: colors.foreground, fontSize: typography.size.sm }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <Text style={[styles.itemValue, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
              {item.before}{unit}
            </Text>
            <Text style={[styles.itemValue, { color: accentColor, fontSize: typography.size.sm, fontWeight: '600' }]}>
              {item.after}{unit}
            </Text>
            <Text style={[styles.itemChange, { color: changeColor, fontSize: typography.size.sm, fontWeight: '600' }]}>
              {arrow}{Math.abs(diff)}{unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.smx,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.smx,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
  },
  labelCol: {
    flex: 2,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemLabel: {
    flex: 2,
  },
  itemValue: {
    flex: 1,
    textAlign: 'center',
  },
  itemChange: {
    flex: 1,
    textAlign: 'center',
  },
});
