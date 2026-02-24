/**
 * ProgressIndicator 공통 컴포넌트
 *
 * V4: 웹과 동일한 미니멀 도트 패턴 (텍스트/바 제거)
 * 웹: h-1.5 inactive dot, w-6 active pill, bg-primary
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';

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
  const { colors, brand } = useTheme();

  return (
    <View testID={testID} style={[styles.container, style]}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;

        return (
          <View
            key={i}
            style={[
              isCurrent ? styles.dotPill : styles.dot,
              {
                backgroundColor:
                  isCurrent || isCompleted ? brand.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPill: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
});
