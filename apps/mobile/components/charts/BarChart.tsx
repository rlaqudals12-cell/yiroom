/**
 * BarChart — 가로/세로 바 차트
 *
 * 점수 비교, 비율 표시 등에 사용.
 * - Reanimated로 바 높이/너비 애니메이션
 * - 테마 토큰 자동 적용
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { useTheme } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

export interface BarDataItem {
  label: string;
  value: number;
  /** 최대값 (기본 100) */
  maxValue?: number;
  /** 바 색상 (미지정 시 기본색 사용) */
  color?: string;
}

interface BarChartProps {
  data: BarDataItem[];
  /** 방향 (기본 horizontal) */
  direction?: 'horizontal' | 'vertical';
  /** 바 높이/너비 (기본 horizontal일 때 높이 24, vertical일 때 너비 32) */
  barSize?: number;
  /** 바 사이 간격 (기본 12) */
  gap?: number;
  /** 기본 바 색상 (기본 brand.primary) */
  barColor?: string;
  /** 값 텍스트 표시 여부 (기본 true) */
  showValues?: boolean;
  /** 라벨 표시 여부 (기본 true) */
  showLabels?: boolean;
  /** 진입 애니메이션 (기본 true) */
  animated?: boolean;
  /** 차트 최대 너비/높이 (미지정 시 부모 기준) */
  maxLength?: number;
  style?: ViewStyle;
  testID?: string;
}

export function BarChart({
  data,
  direction = 'horizontal',
  barSize,
  gap = 12,
  barColor,
  showValues = true,
  showLabels = true,
  animated = true,
  maxLength,
  style,
  testID,
}: BarChartProps): React.JSX.Element {
  const { colors, typography, radii } = useTheme();
  const defaultBarColor = barColor ?? brand.primary;
  const isHorizontal = direction === 'horizontal';
  const size = barSize ?? (isHorizontal ? 24 : 32);

  // 최대값 기준으로 비율 계산
  const globalMax = useMemo(
    () => Math.max(...data.map((d) => d.maxValue ?? 100)),
    [data]
  );

  return (
    <View
      style={[isHorizontal ? styles.horizontalContainer : styles.verticalContainer, style]}
      testID={testID}
    >
      {data.map((item, index) =>
        isHorizontal ? (
          <HorizontalBar
            key={item.label}
            item={item}
            index={index}
            barHeight={size}
            gap={gap}
            globalMax={globalMax}
            barColor={item.color ?? defaultBarColor}
            showValues={showValues}
            showLabels={showLabels}
            animated={animated}
            colors={colors}
            typography={typography}
            radii={radii}
          />
        ) : (
          <VerticalBar
            key={item.label}
            item={item}
            index={index}
            barWidth={size}
            gap={gap}
            globalMax={globalMax}
            maxHeight={maxLength ?? 160}
            barColor={item.color ?? defaultBarColor}
            showValues={showValues}
            showLabels={showLabels}
            animated={animated}
            colors={colors}
            typography={typography}
            radii={radii}
          />
        )
      )}
    </View>
  );
}

// --- HorizontalBar ---

interface HorizontalBarProps {
  item: BarDataItem;
  index: number;
  barHeight: number;
  gap: number;
  globalMax: number;
  barColor: string;
  showValues: boolean;
  showLabels: boolean;
  animated: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  radii: ReturnType<typeof useTheme>['radii'];
}

function HorizontalBar({
  item,
  index,
  barHeight,
  gap,
  globalMax,
  barColor,
  showValues,
  showLabels,
  animated,
  colors,
  typography,
  radii,
}: HorizontalBarProps): React.JSX.Element {
  const maxVal = item.maxValue ?? globalMax;
  const ratio = Math.min(item.value / maxVal, 1);
  const widthPct = useSharedValue(animated ? 0 : ratio * 100);

  useEffect(() => {
    if (animated) {
      widthPct.value = withDelay(index * 80, withTiming(ratio * 100, { duration: 600 }));
    }
  }, [animated, index, ratio, widthPct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%` as unknown as number,
  }));

  return (
    <View style={[styles.horizontalRow, index > 0 && { marginTop: gap }]}>
      {showLabels && (
        <Text
          style={[
            styles.horizontalLabel,
            { color: colors.foreground, fontSize: typography.size.xs },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      )}
      <View style={[styles.horizontalTrack, { height: barHeight, backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.horizontalFill,
            { backgroundColor: barColor, borderRadius: radii.sm },
            barStyle,
          ]}
        />
      </View>
      {showValues && (
        <Text
          style={[
            styles.horizontalValue,
            {
              color: colors.foreground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {Math.round(item.value)}
        </Text>
      )}
    </View>
  );
}

// --- VerticalBar ---

interface VerticalBarProps {
  item: BarDataItem;
  index: number;
  barWidth: number;
  gap: number;
  globalMax: number;
  maxHeight: number;
  barColor: string;
  showValues: boolean;
  showLabels: boolean;
  animated: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  radii: ReturnType<typeof useTheme>['radii'];
}

function VerticalBar({
  item,
  index,
  barWidth,
  gap,
  globalMax,
  maxHeight,
  barColor,
  showValues,
  showLabels,
  animated,
  colors,
  typography,
  radii,
}: VerticalBarProps): React.JSX.Element {
  const maxVal = item.maxValue ?? globalMax;
  const ratio = Math.min(item.value / maxVal, 1);
  const height = useSharedValue(animated ? 0 : ratio * maxHeight);

  useEffect(() => {
    if (animated) {
      height.value = withDelay(index * 80, withTiming(ratio * maxHeight, { duration: 600 }));
    }
  }, [animated, index, ratio, maxHeight, height]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <View style={[styles.verticalColumn, index > 0 && { marginLeft: gap }]}>
      {showValues && (
        <Text
          style={[
            styles.verticalValue,
            {
              color: colors.foreground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {Math.round(item.value)}
        </Text>
      )}
      <View style={[styles.verticalTrack, { width: barWidth, height: maxHeight }]}>
        <Animated.View
          style={[
            styles.verticalFill,
            {
              width: barWidth,
              backgroundColor: barColor,
              borderRadius: radii.sm,
            },
            barStyle,
          ]}
        />
      </View>
      {showLabels && (
        <Text
          style={[
            styles.verticalLabel,
            { color: colors.mutedForeground, fontSize: typography.size.xs },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal
  horizontalContainer: {},
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalLabel: {
    width: 56,
    marginRight: 8,
  },
  horizontalTrack: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  horizontalFill: {
    height: '100%',
  },
  horizontalValue: {
    width: 36,
    textAlign: 'right',
    marginLeft: 8,
  },
  // Vertical
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  verticalColumn: {
    alignItems: 'center',
  },
  verticalTrack: {
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  verticalFill: {
    position: 'absolute',
    bottom: 0,
  },
  verticalValue: {
    marginBottom: 4,
  },
  verticalLabel: {
    marginTop: 6,
    textAlign: 'center',
  },
});
