/**
 * GradientProgressBar — 그래디언트 진행률 바
 *
 * LinearGradient + Reanimated width 애니메이션.
 * 목표 대비 진행률 표시에 사용 (운동, 영양, 웰니스 등).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

type ModuleColorKey =
  | 'workout'
  | 'nutrition'
  | 'skin'
  | 'body'
  | 'personalColor'
  | 'face'
  | 'hair'
  | 'makeup'
  | 'posture'
  | 'oralHealth';

interface GradientProgressBarProps {
  /** 현재 값 */
  value: number;
  /** 최대 값 */
  max?: number;
  /** 모듈 색상 키 (그래디언트 색상 결정) */
  moduleColor?: ModuleColorKey;
  /** 애니메이션 적용 여부 */
  animated?: boolean;
  /** 애니메이션 시간 (ms) */
  duration?: number;
  /** 바 높이 */
  height?: number;
  /** 라벨 표시 여부 */
  showLabel?: boolean;
  /** 라벨 포맷 (기본: "72%") */
  labelFormat?: (value: number, max: number) => string;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function GradientProgressBar({
  value,
  max = 100,
  moduleColor,
  animated = true,
  duration = 800,
  height = 8,
  showLabel = false,
  labelFormat,
  style,
  testID = 'gradient-progress-bar',
}: GradientProgressBarProps): React.JSX.Element {
  const { colors, module, radii, typography, spacing } = useTheme();

  // 진행률 0~1 클램프
  const percentage = Math.min(Math.max(value / max, 0), 1);

  // 애니메이션 진행률
  const animatedWidth = useSharedValue(animated ? 0 : percentage);

  useEffect(() => {
    if (animated) {
      animatedWidth.value = withTiming(percentage, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedWidth.value = percentage;
    }
  }, [percentage, animated, duration, animatedWidth]);

  // 그래디언트 색상
  const moduleEntry = moduleColor ? module[moduleColor] : null;
  const gradientColors: [string, string] = moduleEntry
    ? [moduleEntry.light, moduleEntry.base]
    : [colors.ring, colors.ring];

  const widthStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%` as never,
  }));

  const labelText = labelFormat
    ? labelFormat(value, max)
    : `${Math.round(percentage * 100)}%`;

  return (
    <View testID={testID} style={style}>
      {showLabel && (
        <View style={[styles.labelRow, { marginBottom: spacing.xs }]}>
          <Text
            style={[
              styles.labelText,
              {
                color: colors.mutedForeground,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
              },
            ]}
          >
            {labelText}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.muted,
            borderRadius: radii.full,
          },
        ]}
      >
        <AnimatedLinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            { height, borderRadius: radii.full },
            widthStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  labelText: {},
});
