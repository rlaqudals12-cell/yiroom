/**
 * 영양소 분석 카드
 *
 * 탄수화물/단백질/지방/식이섬유의 현재 섭취량 대비 목표를 프로그레스 바로 표시.
 * 각 영양소별 색상 코딩 적용.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

interface NutrientValue {
  current: number;
  target: number;
}

export interface NutrientBreakdownCardProps {
  protein: NutrientValue;
  carbs: NutrientValue;
  fat: NutrientValue;
  fiber?: NutrientValue;
  testID?: string;
}

interface NutrientConfig {
  label: string;
  unit: string;
  color: string;
}

// 영양소별 설정: nutrientColors 토큰 + 식이섬유 보충
const NUTRIENT_CONFIG: Record<string, NutrientConfig> = {
  carbs: { label: '탄수화물', unit: 'g', color: '#60A5FA' },
  protein: { label: '단백질', unit: 'g', color: '#34D399' },
  fat: { label: '지방', unit: 'g', color: '#FBBF24' },
  fiber: { label: '식이섬유', unit: 'g', color: '#A78BFA' },
};

function NutrientRow({
  config,
  value,
}: {
  config: NutrientConfig;
  value: NutrientValue;
}): React.ReactElement {
  const { colors, spacing, typography, radii } = useTheme();
  const pct = value.target > 0 ? Math.min((value.current / value.target) * 100, 100) : 0;
  const pctText = Math.round(pct);

  return (
    <View style={{ marginTop: spacing.sm }}>
      {/* 라벨 행 */}
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: config.color },
            ]}
          />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
              color: colors.foreground,
              marginLeft: spacing.xs,
            }}
          >
            {config.label}
          </Text>
        </View>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          {value.current}{config.unit} / {value.target}{config.unit} ({pctText}%)
        </Text>
      </View>

      {/* 프로그레스 바 */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginTop: spacing.xs,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: config.color,
              borderRadius: radii.full,
              width: `${pct}%` as unknown as number,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function NutrientBreakdownCard({
  protein,
  carbs,
  fat,
  fiber,
  testID = 'nutrient-breakdown-card',
}: NutrientBreakdownCardProps): React.ReactElement {
  const { colors, spacing, typography, radii, shadows } = useTheme();

  // 전체 칼로리 계산 (탄4 + 단4 + 지9)
  const totalCalories =
    carbs.current * 4 + protein.current * 4 + fat.current * 9;
  const targetCalories =
    carbs.target * 4 + protein.target * 4 + fat.target * 9;

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
        accessibilityLabel={`영양소 분석: 탄수화물 ${carbs.current}g, 단백질 ${protein.current}g, 지방 ${fat.current}g`}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            영양소 분석
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            {totalCalories} / {targetCalories}kcal
          </Text>
        </View>

        {/* 영양소 행들 */}
        <NutrientRow config={NUTRIENT_CONFIG.carbs} value={carbs} />
        <NutrientRow config={NUTRIENT_CONFIG.protein} value={protein} />
        <NutrientRow config={NUTRIENT_CONFIG.fat} value={fat} />
        {fiber && <NutrientRow config={NUTRIENT_CONFIG.fiber} value={fiber} />}
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
  },
});
