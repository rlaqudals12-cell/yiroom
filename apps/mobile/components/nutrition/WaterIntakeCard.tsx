/**
 * 수분 섭취 카드
 *
 * 하루 수분 섭취량 추적. 원형 프로그레스, 현재/목표 ml, 물 한 잔 추가 버튼.
 * 햅틱 피드백 포함.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Droplets, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';

export interface WaterIntakeCardProps {
  current: number;
  target: number;
  onAddGlass?: () => void;
  testID?: string;
}

// 수분 섭취 테마 색상
const WATER_COLOR = '#60A5FA';
const WATER_LIGHT = '#DBEAFE';

export function WaterIntakeCard({
  current,
  target,
  onAddGlass,
  testID = 'water-intake-card',
}: WaterIntakeCardProps): React.ReactElement {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const isComplete = current >= target;

  // 원형 프로그레스 계산 (SVG 없이 단순 원형 표현)
  const circleSize = 96;
  const strokeWidth = 8;
  const innerSize = circleSize - strokeWidth * 2;

  const handleAddGlass = (): void => {
    if (onAddGlass) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddGlass();
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
        accessibilityLabel={`수분 섭취 ${current}ml / ${target}ml, ${pct}% 달성`}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Droplets size={18} color={WATER_COLOR} />
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginLeft: spacing.sm,
              }}
            >
              수분 섭취
            </Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: isComplete ? status.success : colors.mutedForeground,
            }}
          >
            {isComplete ? '목표 달성!' : `${pct}%`}
          </Text>
        </View>

        {/* 원형 프로그레스 + 수치 */}
        <View style={[styles.progressArea, { marginTop: spacing.md }]}>
          {/* 원형 배경 */}
          <View
            style={[
              styles.circleOuter,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                borderWidth: strokeWidth,
                borderColor: WATER_LIGHT,
              },
            ]}
          >
            {/* 내부 원: 채워진 정도를 배경색 높이로 표현 */}
            <View
              style={[
                styles.circleInner,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                  overflow: 'hidden',
                },
              ]}
            >
              {/* 채워진 부분 (아래에서 위로) */}
              <View style={styles.fillContainer}>
                <View
                  style={[
                    styles.fillBar,
                    {
                      height: `${pct}%` as unknown as number,
                      backgroundColor: `${WATER_COLOR}30`,
                    },
                  ]}
                />
              </View>
              {/* 중앙 텍스트 */}
              <View style={styles.centerText}>
                <Droplets size={20} color={WATER_COLOR} />
                <Text
                  style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                    color: colors.foreground,
                    marginTop: spacing.xxs,
                  }}
                >
                  {pct}%
                </Text>
              </View>
            </View>
          </View>

          {/* 수치 */}
          <View style={[styles.valueArea, { marginLeft: spacing.md }]}>
            <Text
              style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              {current}
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.normal,
                  color: colors.mutedForeground,
                }}
              >
                ml
              </Text>
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginTop: spacing.xs,
              }}
            >
              목표 {target}ml
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xs,
              }}
            >
              {target - current > 0 ? `${target - current}ml 남음` : '목표 달성'}
            </Text>
          </View>
        </View>

        {/* 물 한 잔 추가 버튼 */}
        {onAddGlass && (
          <Pressable
            onPress={handleAddGlass}
            style={[
              styles.addButton,
              {
                backgroundColor: WATER_COLOR,
                borderRadius: radii.xl,
                marginTop: spacing.md,
                paddingVertical: spacing.smd,
              },
            ]}
            accessibilityLabel="물 한 잔 (250ml) 추가"
            accessibilityRole="button"
          >
            <Plus size={16} color={colors.overlayForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: colors.overlayForeground,
                marginLeft: spacing.xs,
              }}
            >
              물 한 잔 추가 (250ml)
            </Text>
          </Pressable>
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
  progressArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fillBar: {
    width: '100%',
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueArea: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
