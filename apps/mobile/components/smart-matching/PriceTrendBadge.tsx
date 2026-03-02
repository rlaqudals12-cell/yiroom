/**
 * PriceTrendBadge -- 가격 추세 뱃지
 *
 * 제품의 가격 추세(상승/하락/유지)를 화살표 아이콘과
 * 퍼센티지로 간결하게 표시하는 소형 뱃지.
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography, statusColors } from '../../lib/theme';

export type PriceTrend = 'up' | 'down' | 'stable';

interface PriceTrendBadgeProps {
  trend: PriceTrend;
  percentage: number;
  style?: ViewStyle;
}

// 추세별 색상/아이콘/라벨 매핑
const TREND_CONFIG: Record<
  PriceTrend,
  { color: string; arrow: string; label: string }
> = {
  up: { color: statusColors.error, arrow: '↑', label: '상승' },
  down: { color: statusColors.success, arrow: '↓', label: '하락' },
  stable: { color: statusColors.info, arrow: '→', label: '유지' },
};

export function PriceTrendBadge({
  trend,
  percentage,
  style,
}: PriceTrendBadgeProps): React.JSX.Element {
  const config = TREND_CONFIG[trend];

  // 유지 상태는 0%로 표시
  const displayPercentage = trend === 'stable' ? 0 : Math.abs(percentage);
  const percentageText =
    trend === 'stable' ? '변동없음' : `${displayPercentage.toFixed(1)}%`;

  return (
    <View
      testID="price-trend-badge"
      style={[
        styles.badge,
        {
          backgroundColor: `${config.color}18`,
          borderRadius: radii.sm,
        },
        style,
      ]}
      accessibilityLabel={`가격 ${config.label} ${percentageText}`}
      accessibilityRole="text"
    >
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.bold,
          color: config.color,
        }}
      >
        {config.arrow}
      </Text>
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
          color: config.color,
          marginLeft: spacing.xxs,
        }}
      >
        {percentageText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignSelf: 'flex-start',
  },
});
