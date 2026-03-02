/**
 * MealSuggestionCard — 식사 추천 카드
 *
 * AI 기반 식사 추천 + 영양 정보 + 이유 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing} from '../../lib/theme';

export interface MealSuggestionCardProps {
  /** 추천 식사명 */
  name: string;
  /** 추천 이유 */
  reason: string;
  /** 칼로리 */
  calories: number;
  /** 식사 구간 */
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  /** 매칭률 (0-100) */
  matchRate?: number;
  /** 태그 */
  tags?: string[];
  /** 선택 콜백 */
  onSelect?: () => void;
  style?: ViewStyle;
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export function MealSuggestionCard({
  name,
  reason,
  calories,
  mealType,
  matchRate,
  tags,
  onSelect,
  style,
}: MealSuggestionCardProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

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
      onPress={onSelect}
      testID="meal-suggestion-card"
      accessibilityLabel={`추천: ${name}, ${calories}kcal${matchRate ? `, 매칭 ${matchRate}%` : ''}`}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.xl }}>
          {MEAL_EMOJIS[mealType]}
        </Text>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            {calories}kcal
          </Text>
        </View>
        {matchRate !== undefined && (
          <View
            style={[
              styles.matchBadge,
              {
                backgroundColor: module.nutrition.base + '20',
                borderRadius: radii.full,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: module.nutrition.base,
              }}
            >
              {matchRate}%
            </Text>
          </View>
        )}
      </View>

      {/* 이유 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.sm,
          lineHeight: typography.size.sm * typography.lineHeight.relaxed,
        }}
      >
        {reason}
      </Text>

      {/* 태그 */}
      {tags && tags.length > 0 && (
        <View style={[styles.tagRow, { marginTop: spacing.sm }]}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 선택 버튼 */}
      {onSelect && (
        <View
          style={[
            styles.selectBtn,
            {
              borderTopWidth: 1,
              borderTopColor: colors.border,
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: module.nutrition.base,
              textAlign: 'center',
            }}
          >
            이 식사 선택
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectBtn: {},
});
