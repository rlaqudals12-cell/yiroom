/**
 * TrafficLight — 신호등 영양 등급 표시
 *
 * 영국식 신호등 라벨: 녹/황/적으로 영양 등급 시각화.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export type TrafficLightLevel = 'green' | 'amber' | 'red';

export interface TrafficLightItem {
  /** 영양소 이름 */
  name: string;
  /** 등급 */
  level: TrafficLightLevel;
  /** 값 */
  value: string;
  /** 1회 제공량 기준 */
  perServing?: string;
}

export interface TrafficLightProps {
  /** 영양소 목록 */
  items: TrafficLightItem[];
  /** 제품명 */
  productName?: string;
  style?: ViewStyle;
}

const LEVEL_LABELS: Record<TrafficLightLevel, string> = {
  green: '양호',
  amber: '보통',
  red: '주의',
};

export function TrafficLight({
  items,
  productName,
  style,
}: TrafficLightProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  // status 토큰을 사용하기 위해 컴포넌트 내부에서 색상 맵 정의
  const LEVEL_COLORS: Record<TrafficLightLevel, string> = {
    green: status.success,
    amber: status.warning,
    red: status.error,
  };

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
      testID="traffic-light"
      accessibilityLabel={`${productName ? `${productName} ` : ''}영양 신호등, ${items.length}개 항목`}
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
          🚦 영양 신호등
        </Text>
        {productName && (
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            {productName}
          </Text>
        )}
      </View>

      {/* 항목 */}
      <View style={[styles.itemsGrid, { marginTop: spacing.sm }]}>
        {items.map((item) => {
          const levelColor = LEVEL_COLORS[item.level];
          return (
            <View
              key={item.name}
              style={[
                styles.item,
                {
                  backgroundColor: levelColor + '15',
                  borderRadius: radii.lg,
                  padding: spacing.sm,
                },
              ]}
              accessibilityLabel={`${item.name}: ${LEVEL_LABELS[item.level]}, ${item.value}`}
            >
              <View style={[styles.indicator, { backgroundColor: levelColor }]} />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xs,
                }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: colors.foreground,
                  marginTop: 2,
                }}
              >
                {item.value}
              </Text>
              {item.perServing && (
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                >
                  {item.perServing}
                </Text>
              )}
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color: levelColor,
                  marginTop: spacing.xs,
                }}
              >
                {LEVEL_LABELS[item.level]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {},
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  indicator: {
    width: spacing.smx,
    height: spacing.smx,
    borderRadius: radii.sm,
  },
});
