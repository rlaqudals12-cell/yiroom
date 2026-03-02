/**
 * AnimatedCard — press scale + shadow 축소 애니메이션이 있는 카드
 *
 * 기존 Card 위에 Reanimated press 인터랙션을 추가.
 * onPress가 있을 때만 터치 가능하고, 없으면 일반 Card처럼 동작.
 */
import * as Haptics from 'expo-haptics';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

import { useAppPreferencesStore } from '@/lib/stores';

import { Card } from './Card';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 300 };

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  /** press 시 축소 비율 (기본 0.97) */
  pressedScale?: number;
  /** 진입 애니메이션 — AnimatedList에서 주입 */
  entering?: AnimatedProps<object>['entering'];
  /** 접근성 라벨 */
  accessibilityLabel?: string;
  /** 접근성 힌트 */
  accessibilityHint?: string;
}

export function AnimatedCard({
  children,
  onPress,
  style,
  testID,
  pressedScale = 0.97,
  entering,
  accessibilityLabel,
  accessibilityHint,
}: AnimatedCardProps): React.JSX.Element {
  const { shadows } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    if (reduceMotion) return;
    scale.value = withSpring(pressedScale, SPRING_CONFIG);
  };

  const handlePressOut = (): void => {
    if (reduceMotion) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  // onPress가 없으면 터치 불가능한 일반 카드
  if (!onPress) {
    return (
      <Animated.View entering={entering} style={style}>
        <Card testID={testID} style={shadows.card}>
          {children}
        </Card>
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => {
        if (hapticEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      entering={entering}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Card>{children}</Card>
    </AnimatedPressable>
  );
}
