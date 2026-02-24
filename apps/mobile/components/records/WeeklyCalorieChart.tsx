/**
 * WeeklyCalorieChart — 7일 칼로리 막대차트
 *
 * 목표 대비 일별 칼로리 섭취를 세로 바 차트로 표시.
 * 기존 BarChart 컴포넌트를 활용.
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BarChart, type BarDataItem } from '../charts/BarChart';
import { useTheme } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

export interface DayCalorie {
  /** 요일 라벨 (예: "월") */
  label: string;
  /** 섭취 칼로리 */
  calories: number;
}

interface WeeklyCalorieChartProps {
  data: DayCalorie[];
  /** 일일 칼로리 목표 */
  goal: number;
  style?: ViewStyle;
  testID?: string;
}

export function WeeklyCalorieChart({
  data,
  goal,
  style,
  testID,
}: WeeklyCalorieChartProps): React.JSX.Element {
  const { colors, brand, spacing, typography, status } = useTheme();

  // BarChart 데이터 변환 — 목표 대비 색상 설정
  const barData: BarDataItem[] = data.map((d) => ({
    label: d.label,
    value: d.calories,
    maxValue: Math.max(goal * 1.3, ...data.map((dd) => dd.calories)),
    color: d.calories > goal * 1.1 ? status.error : d.calories > goal * 0.8 ? brand.primary : status.warning,
  }));

  const avgCalories = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length)
    : 0;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      style={style}
      testID={testID}
      accessibilityLabel={`주간 칼로리 차트, 평균 ${avgCalories}kcal, 목표 ${goal}kcal`}
    >
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          주간 칼로리
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          평균 {avgCalories}kcal / 목표 {goal}kcal
        </Text>
      </View>
      <BarChart
        data={barData}
        direction="vertical"
        barSize={28}
        gap={8}
        maxLength={120}
        animated
        testID={testID ? `${testID}-bars` : undefined}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
