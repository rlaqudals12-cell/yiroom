/**
 * ChangeIndicator — 값 증감 표시
 *
 * 이전 대비 현재 값의 변화를 ▲/▼/— 아이콘 + 색상으로 표시.
 * 분석 결과 비교, 주간 리포트 등에 사용.
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

interface ChangeIndicatorProps {
  /** 현재 값 */
  value: number;
  /** 이전 값 */
  previousValue: number;
  /** 값 표시 포맷 (기본: 정수 + %) */
  formatDiff?: (diff: number) => string;
  /** 증가가 긍정적인지 (기본 true). false면 증가=빨강, 감소=초록 */
  positiveIsGood?: boolean;
  /** 변화 없음 임계값 (기본 0.5) */
  threshold?: number;
  /** 크기 (기본 'sm') */
  size?: 'sm' | 'md';
  style?: ViewStyle;
  testID?: string;
}

export function ChangeIndicator({
  value,
  previousValue,
  formatDiff,
  positiveIsGood = true,
  threshold = 0.5,
  size = 'sm',
  style,
  testID,
}: ChangeIndicatorProps): React.JSX.Element {
  const { status, colors, typography } = useTheme();

  const diff = value - previousValue;
  const absDiff = Math.abs(diff);
  const isNeutral = absDiff < threshold;

  // 방향 결정
  const direction = isNeutral ? 'neutral' : diff > 0 ? 'up' : 'down';

  // 색상 결정 (증가가 좋으면 up=green, 아니면 up=red)
  const colorMap = {
    up: positiveIsGood ? status.success : status.error,
    down: positiveIsGood ? status.error : status.success,
    neutral: colors.mutedForeground,
  };
  const textColor = colorMap[direction];

  // 아이콘
  const iconMap = { up: '▲', down: '▼', neutral: '—' };
  const icon = iconMap[direction];

  // 포맷
  const diffText = formatDiff
    ? formatDiff(diff)
    : isNeutral
      ? '변화 없음'
      : `${diff > 0 ? '+' : ''}${absDiff % 1 === 0 ? Math.round(absDiff) : absDiff.toFixed(1)}%`;

  const fontSize = size === 'md' ? typography.size.sm : typography.size.xs;

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel={`${diffText} ${direction === 'up' ? '증가' : direction === 'down' ? '감소' : '변화 없음'}`}
    >
      <Text style={[styles.icon, { color: textColor, fontSize }]}>{icon}</Text>
      <Text
        style={{
          color: textColor,
          fontSize,
          fontWeight: typography.weight.medium,
          marginLeft: 2,
        }}
      >
        {diffText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    lineHeight: 16,
  },
});
