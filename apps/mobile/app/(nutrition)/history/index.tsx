/**
 * 영양 히스토리 화면
 *
 * 과거 식사 기록과 영양 섭취 추이를 확인한다.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../lib/theme';
import { staggeredEntry } from '../../../lib/animations';

interface DailyRecord {
  date: string;
  dayLabel: string;
  totalCalories: number;
  targetCalories: number;
  meals: { type: string; name: string; calories: number }[];
  macros: { carbs: number; protein: number; fat: number };
}

const MOCK_HISTORY: DailyRecord[] = [
  {
    date: '2026-03-01',
    dayLabel: '오늘',
    totalCalories: 1450,
    targetCalories: 2000,
    meals: [
      { type: '아침', name: '오트밀 + 바나나', calories: 350 },
      { type: '점심', name: '닭가슴살 도시락', calories: 550 },
      { type: '간식', name: '프로틴 바', calories: 200 },
      { type: '저녁', name: '아직 미기록', calories: 350 },
    ],
    macros: { carbs: 180, protein: 85, fat: 42 },
  },
  {
    date: '2026-02-28',
    dayLabel: '어제',
    totalCalories: 1920,
    targetCalories: 2000,
    meals: [
      { type: '아침', name: '그릭 요거트', calories: 280 },
      { type: '점심', name: '비빔밥', calories: 620 },
      { type: '간식', name: '견과류', calories: 150 },
      { type: '저녁', name: '연어 스테이크', calories: 870 },
    ],
    macros: { carbs: 210, protein: 92, fat: 58 },
  },
  {
    date: '2026-02-27',
    dayLabel: '2/27 (목)',
    totalCalories: 2150,
    targetCalories: 2000,
    meals: [
      { type: '아침', name: '토스트 + 계란', calories: 400 },
      { type: '점심', name: '파스타', calories: 750 },
      { type: '간식', name: '과일', calories: 100 },
      { type: '저녁', name: '삼겹살', calories: 900 },
    ],
    macros: { carbs: 250, protein: 78, fat: 85 },
  },
];

export default function NutritionHistoryScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status, module: moduleColors, nutrient: nutrientColors, isDark } = useTheme();
  const [expandedDate, setExpandedDate] = useState<string | null>(MOCK_HISTORY[0]?.date ?? null);

  const getCalorieColor = (current: number, target: number): string => {
    const ratio = current / target;
    if (ratio > 1.1) return status.warning;
    if (ratio >= 0.8) return status.success;
    return status.info;
  };

  return (
    <ScrollView
      testID="nutrition-history-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        영양 히스토리
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        과거 식사 기록을 확인하세요
      </Text>

      {/* 일별 기록 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_HISTORY.map((record, index) => {
          const expanded = expandedDate === record.date;
          const ratio = Math.round((record.totalCalories / record.targetCalories) * 100);
          const calorieColor = getCalorieColor(record.totalCalories, record.targetCalories);

          return (
            <Animated.View key={record.date} entering={staggeredEntry(index)}>
            <Pressable
              accessibilityLabel={`${record.dayLabel} 영양 기록, ${record.totalCalories}kcal`}
              onPress={() => setExpandedDate((prev) => (prev === record.date ? null : record.date))}
              style={[
                {
                  backgroundColor: colors.card,
                  borderRadius: radii.xl,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
                !isDark
                  ? Platform.select({
                      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                      android: { elevation: 2 },
                    }) ?? {}
                  : {},
              ]}
            >
              {/* 요약 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: expanded ? spacing.sm : 0 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                    {record.dayLabel}
                  </Text>
                  <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                    {record.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: calorieColor }}>
                    {record.totalCalories} kcal
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                    목표의 {ratio}%
                  </Text>
                </View>
              </View>

              {/* 프로그레스 바 */}
              <View
                style={{
                  height: 4,
                  backgroundColor: colors.secondary,
                  borderRadius: radii.full,
                  marginBottom: expanded ? spacing.sm : 0,
                }}
              >
                <View
                  style={{
                    height: 4,
                    width: `${Math.min(ratio, 100)}%`,
                    backgroundColor: calorieColor,
                    borderRadius: radii.full,
                  }}
                />
              </View>

              {expanded && (
                <>
                  {/* 식사 목록 */}
                  <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
                    {record.meals.map((meal) => (
                      <View key={meal.type} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xxs }}>
                        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, width: 40 }}>
                          {meal.type}
                        </Text>
                        <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground }}>
                          {meal.name}
                        </Text>
                        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                          {meal.calories}kcal
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 매크로 */}
                  <View style={{ flexDirection: 'row', height: 6, borderRadius: radii.full, overflow: 'hidden', marginBottom: spacing.xs }}>
                    <View style={{ flex: record.macros.carbs, backgroundColor: nutrientColors.carbs }} />
                    <View style={{ flex: record.macros.protein, backgroundColor: nutrientColors.protein }} />
                    <View style={{ flex: record.macros.fat, backgroundColor: nutrientColors.fat }} />
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ flex: 1, fontSize: typography.size.xs, color: nutrientColors.carbs }}>
                      탄 {record.macros.carbs}g
                    </Text>
                    <Text style={{ flex: 1, fontSize: typography.size.xs, color: nutrientColors.protein, textAlign: 'center' }}>
                      단 {record.macros.protein}g
                    </Text>
                    <Text style={{ flex: 1, fontSize: typography.size.xs, color: nutrientColors.fat, textAlign: 'right' }}>
                      지 {record.macros.fat}g
                    </Text>
                  </View>
                </>
              )}
            </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}
