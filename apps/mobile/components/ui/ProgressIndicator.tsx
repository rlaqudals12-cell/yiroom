/**
 * ProgressIndicator 공통 컴포넌트
 *
 * 온보딩 등 단계형 플로우의 진행 표시.
 * current/total 기반 진행 바 + 단계 텍스트.
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  style?: ViewStyle;
  testID?: string;
}

export function ProgressIndicator({
  current,
  total,
  style,
  testID,
}: ProgressIndicatorProps): React.JSX.Element {
  const { colors, brand, radii, typography } = useTheme();

  const progress = Math.min(current / total, 1);

  return (
    <View testID={testID} style={[styles.container, style]}>
      {/* 단계 텍스트 */}
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: typography.size.xs,
          fontWeight: typography.weight.medium,
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {current} / {total}
      </Text>

      {/* 진행 바 */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.full,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      {/* 단계 도트 */}
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i + 1 <= current ? brand.primary : colors.border,
                width: i + 1 === current ? 10 : 6,
                height: 6,
                borderRadius: radii.full,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  track: {
    width: '60%',
    height: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {},
});
