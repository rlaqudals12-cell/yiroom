/**
 * MealSection — 식사 구간 카드
 *
 * 아침/점심/저녁/간식 구간별 음식 목록 + 소계.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  amount?: string;
}

export interface MealSectionProps {
  /** 식사 구간 */
  type: MealType;
  /** 음식 목록 */
  items: MealItem[];
  /** 추가 버튼 콜백 */
  onAddPress?: () => void;
  /** 음식 항목 클릭 */
  onItemPress?: (id: string) => void;
  style?: ViewStyle;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

export function MealSection({
  type,
  items,
  onAddPress,
  onItemPress,
  style,
}: MealSectionProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View
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
      testID="meal-section"
      accessibilityLabel={`${MEAL_LABELS[type]} ${items.length}개 음식, ${totalCalories}kcal`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={{ fontSize: typography.size.lg }}>
            {MEAL_ICONS[type]}
          </Text>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginLeft: spacing.xs,
            }}
          >
            {MEAL_LABELS[type]}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginLeft: spacing.xs,
            }}
          >
            {totalCalories}kcal
          </Text>
        </View>
        {onAddPress && (
          <Pressable
            onPress={onAddPress}
            accessibilityLabel={`${MEAL_LABELS[type]} 음식 추가`}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: module.nutrition.base,
                fontWeight: typography.weight.semibold,
              }}
            >
              + 추가
            </Text>
          </Pressable>
        )}
      </View>

      {/* 음식 목록 */}
      {items.length > 0 ? (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.itemRow, { marginTop: spacing.sm }]}
            onPress={() => onItemPress?.(item.id)}
            accessibilityLabel={`${item.name} ${item.calories}kcal`}
          >
            <View style={styles.itemLeft}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                }}
              >
                {item.name}
              </Text>
              {item.amount && (
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                  }}
                >
                  {item.amount}
                </Text>
              )}
            </View>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                fontWeight: typography.weight.medium,
              }}
            >
              {item.calories}kcal
            </Text>
          </Pressable>
        ))
      ) : (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.sm,
            paddingVertical: spacing.sm,
          }}
        >
          기록된 음식이 없어요
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
  },
});
