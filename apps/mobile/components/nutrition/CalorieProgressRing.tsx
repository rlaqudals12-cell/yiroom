/**
 * CalorieProgressRing — 원형 칼로리 진행률 표시
 *
 * 목표 대비 섭취 칼로리를 원형 프로그레스로 시각화.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../lib/theme';

export interface CalorieProgressRingProps {
  /** 섭취 칼로리 */
  consumed: number;
  /** 목표 칼로리 */
  goal: number;
  /** 링 크기 (기본 120) */
  size?: number;
  /** 링 두께 (기본 10) */
  strokeWidth?: number;
  style?: ViewStyle;
}

export const CalorieProgressRing = memo(function CalorieProgressRing({
  consumed,
  goal,
  size = 120,
  strokeWidth = 10,
  style,
}: CalorieProgressRingProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const pct = Math.round(progress * 100);

  // 초과 시 경고색
  const isOver = consumed > goal;
  const ringColor = isOver ? '#EF4444' : module.nutrition.base;

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID="calorie-progress-ring"
      accessibilityLabel={`칼로리 ${consumed}/${goal}kcal, ${pct}% 달성`}
    >
      <Svg width={size} height={size}>
        {/* 배경 링 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행 링 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* 중앙 텍스트 */}
      <View style={styles.center}>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {consumed}
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          {isOver ? '초과' : `남은 ${remaining}`}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
});
