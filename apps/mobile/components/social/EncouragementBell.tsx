/**
 * EncouragementBell — 응원 벨
 *
 * 친구에게 응원을 보내는 인터랙티브 버튼. 탭하면 카운트 증가.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface EncouragementBellProps {
  count: number;
  isRung?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function EncouragementBell({
  count,
  isRung = false,
  onPress,
  style,
}: EncouragementBellProps): React.JSX.Element {
  const { colors, spacing, typography, radii, brand } = useTheme();

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isRung ? brand.primary : colors.secondary,
          borderRadius: radii.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID="encouragement-bell"
      accessibilityLabel={`응원하기${isRung ? ', 응원함' : ''}, ${count}명 응원`}
      accessibilityRole="button"
    >
      <Text style={{ fontSize: typography.size.base }}>
        {isRung ? '🔔' : '🔕'}
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: isRung ? brand.primaryForeground : colors.foreground,
          marginLeft: spacing.xs,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
