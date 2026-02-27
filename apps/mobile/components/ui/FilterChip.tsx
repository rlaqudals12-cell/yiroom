/**
 * FilterChip — 선택 가능한 필터 칩
 *
 * 카테고리/태그 필터에 사용. 선택 시 배경 + 텍스트 색상 전환.
 * press scale 애니메이션 포함.
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 선택 시 사용할 색상 (기본 brand.primary) */
  activeColor?: string;
  /** 아이콘 (선택) */
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function FilterChip({
  label,
  selected = false,
  onPress,
  activeColor,
  icon,
  style,
  testID,
}: FilterChipProps): React.JSX.Element {
  const { colors, brand, radii, typography, spacing } = useTheme();
  const scale = useSharedValue(1);
  const color = activeColor ?? brand.primary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = (): void => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = (): void => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <AnimatedPressable
      testID={testID}
      style={[
        animatedStyle,
        styles.chip,
        {
          backgroundColor: selected ? color + '18' : colors.secondary,
          borderColor: selected ? color : colors.border,
          borderRadius: radii.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
        },
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} 필터${selected ? ' 선택됨' : ''}`}
    >
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: selected ? color : colors.mutedForeground,
            fontSize: typography.size.sm,
            fontWeight: selected ? typography.weight.semibold : typography.weight.medium,
            marginLeft: icon ? 6 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    lineHeight: 20,
  },
});
