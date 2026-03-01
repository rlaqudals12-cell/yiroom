/**
 * FoodResultCard — 음식 분석 결과 카드
 *
 * AI 분석 후 음식 인식 결과 + 영양 정보 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, nutrientColors } from '../../lib/theme';

export interface FoodResultCardProps {
  /** 인식된 음식 이름 */
  name: string;
  /** 신뢰도 (0-100) */
  confidence: number;
  /** 칼로리 */
  calories: number;
  /** 1회 제공량 */
  servingSize: string;
  /** 탄수화물 g */
  carbs: number;
  /** 단백질 g */
  protein: number;
  /** 지방 g */
  fat: number;
  /** 건강 평가 */
  healthRating?: 'good' | 'moderate' | 'caution';
  /** 메모 */
  note?: string;
  /** 추가 버튼 */
  onAdd?: () => void;
  style?: ViewStyle;
}

const HEALTH_LABELS: Record<string, { label: string; color: string }> = {
  good: { label: '건강해요', color: '#22C55E' },
  moderate: { label: '보통이에요', color: '#F59E0B' },
  caution: { label: '주의하세요', color: '#EF4444' },
};

export function FoodResultCard({
  name,
  confidence,
  calories,
  servingSize,
  carbs,
  protein,
  fat,
  healthRating,
  note,
  onAdd,
  style,
}: FoodResultCardProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  const health = healthRating ? HEALTH_LABELS[healthRating] : null;

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
      testID="food-result-card"
      accessibilityLabel={`${name} 분석 결과, ${calories}kcal, 신뢰도 ${confidence}%`}
    >
      {/* 음식명 + 신뢰도 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {name}
        </Text>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: module.nutrition.base + '20', borderRadius: radii.full },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              color: module.nutrition.base,
            }}
          >
            {confidence}%
          </Text>
        </View>
      </View>

      {/* 제공량 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
        }}
      >
        {servingSize}
      </Text>

      {/* 칼로리 */}
      <View style={[styles.calRow, { marginTop: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {calories}
        </Text>
        <Text
          style={{
            fontSize: typography.size.base,
            color: colors.mutedForeground,
            marginLeft: spacing.xs,
          }}
        >
          kcal
        </Text>
      </View>

      {/* 영양소 바 */}
      <View style={[styles.macroGrid, { marginTop: spacing.sm }]}>
        <MacroStat label="탄수화물" value={carbs} unit="g" color={nutrientColors.carbs} typography={typography} mutedColor={colors.mutedForeground} />
        <MacroStat label="단백질" value={protein} unit="g" color={nutrientColors.protein} typography={typography} mutedColor={colors.mutedForeground} />
        <MacroStat label="지방" value={fat} unit="g" color={nutrientColors.fat} typography={typography} mutedColor={colors.mutedForeground} />
      </View>

      {/* 건강 평가 */}
      {health && (
        <View style={[styles.healthRow, { marginTop: spacing.sm }]}>
          <View style={[styles.healthDot, { backgroundColor: health.color }]} />
          <Text
            style={{
              fontSize: typography.size.sm,
              color: health.color,
              fontWeight: typography.weight.medium,
            }}
          >
            {health.label}
          </Text>
        </View>
      )}

      {/* 메모 */}
      {note && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginTop: spacing.sm,
            fontStyle: 'italic',
          }}
        >
          {note}
        </Text>
      )}

      {/* 추가 버튼 */}
      {onAdd && (
        <Pressable
          style={[
            styles.addBtn,
            {
              backgroundColor: module.nutrition.base,
              borderRadius: radii.lg,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          onPress={onAdd}
          accessibilityLabel={`${name} 식단에 추가`}
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            식단에 추가
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface MacroStatProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  mutedColor: string;
  typography: ReturnType<typeof useTheme>['typography'];
}

function MacroStat({ label, value, unit, color, mutedColor, typography }: MacroStatProps): React.JSX.Element {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.macroBar, { backgroundColor: color }]} />
      <Text style={{ fontSize: typography.size.xs, color: mutedColor }}>{label}</Text>
      <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color }}>
        {value}{unit}
      </Text>
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
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    gap: 4,
  },
  macroBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addBtn: {},
});
