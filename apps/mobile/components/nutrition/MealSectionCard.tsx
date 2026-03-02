/**
 * 식사 구간 카드
 *
 * 식사 유형별 음식 목록을 그룹화하여 표시.
 * 아침/점심/저녁/간식 아이콘, 음식 리스트, 합계, 추가 버튼.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sun, Coffee, UtensilsCrossed, Moon, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';

export interface MealSectionCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: { name: string; calories: number; time?: string }[];
  totalCalories: number;
  onAddPress?: () => void;
  testID?: string;
}

const MEAL_CONFIG: Record<
  string,
  { label: string; icon: typeof Sun }
> = {
  breakfast: { label: '아침', icon: Coffee },
  lunch: { label: '점심', icon: Sun },
  dinner: { label: '저녁', icon: Moon },
  snack: { label: '간식', icon: UtensilsCrossed },
};

export function MealSectionCard({
  mealType,
  foods,
  totalCalories,
  onAddPress,
  testID = 'meal-section-card',
}: MealSectionCardProps): React.ReactElement {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  const config = MEAL_CONFIG[mealType];
  const IconComponent = config.icon;
  const accentColor = module.nutrition.base;

  const handleAddPress = (): void => {
    if (onAddPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAddPress();
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID={testID}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md,
            ...shadows.card,
          },
        ]}
        accessibilityLabel={`${config.label} ${foods.length}개 음식, ${totalCalories}kcal`}
      >
        {/* 헤더: 아이콘 + 식사 유형 + 추가 버튼 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${accentColor}20`,
                  borderRadius: 9999,
                },
              ]}
            >
              <IconComponent size={16} color={accentColor} />
            </View>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginLeft: spacing.sm,
              }}
            >
              {config.label}
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginLeft: spacing.sm,
              }}
            >
              {totalCalories}kcal
            </Text>
          </View>

          {onAddPress && (
            <Pressable
              onPress={handleAddPress}
              style={[
                styles.addButton,
                {
                  backgroundColor: `${accentColor}20`,
                  borderRadius: radii.full,
                },
              ]}
              accessibilityLabel={`${config.label} 음식 추가`}
              accessibilityRole="button"
            >
              <Plus size={16} color={accentColor} />
            </Pressable>
          )}
        </View>

        {/* 음식 리스트 */}
        {foods.length > 0 ? (
          foods.map((food, index) => (
            <View
              key={`${food.name}-${index}`}
              style={[
                styles.foodRow,
                {
                  marginTop: spacing.sm,
                  paddingTop: index > 0 ? spacing.xs : 0,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.foodInfo}>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    color: colors.foreground,
                  }}
                >
                  {food.name}
                </Text>
                {food.time && (
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {food.time}
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
                {food.calories}kcal
              </Text>
            </View>
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

        {/* 합계 */}
        {foods.length > 0 && (
          <View
            style={[
              styles.totalRow,
              {
                marginTop: spacing.sm,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              합계
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: accentColor,
              }}
            >
              {totalCalories}kcal
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
