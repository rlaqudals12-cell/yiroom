/**
 * FoodCard — 음식 카드
 *
 * 음식 이름, 칼로리, 영양 정보 표시.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, nutrientColors } from '../../lib/theme';

export interface FoodCardProps {
  /** 음식 ID */
  id: string;
  /** 음식 이름 */
  name: string;
  /** 칼로리 (kcal) */
  calories: number;
  /** 1회 제공량 */
  servingSize?: string;
  /** 탄수화물 g */
  carbs?: number;
  /** 단백질 g */
  protein?: number;
  /** 지방 g */
  fat?: number;
  /** 카테고리 */
  category?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 클릭 콜백 */
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export const FoodCard = memo(function FoodCard({
  id,
  name,
  calories,
  servingSize,
  carbs,
  protein,
  fat,
  category,
  compact = false,
  onPress,
  style,
}: FoodCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compact,
          {
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            padding: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          },
          style,
        ]}
        onPress={() => onPress?.(id)}
        testID="food-card"
        accessibilityLabel={`${name} ${calories}kcal`}
      >
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.medium,
            color: colors.foreground,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
          }}
        >
          {calories}kcal
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      onPress={() => onPress?.(id)}
      testID="food-card"
      accessibilityLabel={`${name} ${calories}kcal${servingSize ? `, ${servingSize}` : ''}`}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {name}
          </Text>
          {category && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              {category}
            </Text>
          )}
        </View>
        <View style={styles.calBadge}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {calories}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
          >
            kcal
          </Text>
        </View>
      </View>

      {/* 제공량 */}
      {servingSize && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginTop: spacing.xs,
          }}
        >
          1회 제공량: {servingSize}
        </Text>
      )}

      {/* 영양소 */}
      {(carbs !== undefined || protein !== undefined || fat !== undefined) && (
        <View style={[styles.macroRow, { marginTop: spacing.sm }]}>
          {carbs !== undefined && (
            <NutrientPill label="탄" value={carbs} color={nutrientColors.carbs} typography={typography} />
          )}
          {protein !== undefined && (
            <NutrientPill label="단" value={protein} color={nutrientColors.protein} typography={typography} />
          )}
          {fat !== undefined && (
            <NutrientPill label="지" value={fat} color={nutrientColors.fat} typography={typography} />
          )}
        </View>
      )}
    </Pressable>
  );
});

interface NutrientPillProps {
  label: string;
  value: number;
  color: string;
  typography: ReturnType<typeof useTheme>['typography'];
}

function NutrientPill({ label, value, color, typography }: NutrientPillProps): React.JSX.Element {
  return (
    <View style={[styles.pill, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color }}>
        {label} {value}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  calBadge: {
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
