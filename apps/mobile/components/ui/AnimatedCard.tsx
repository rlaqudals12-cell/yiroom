/**
 * AnimatedCard — press scale + tint 오버레이 애니메이션이 있는 카드
 *
 * 기존 Card 위에 Reanimated press 인터랙션을 추가.
 * onPress가 있을 때만 터치 가능하고, 없으면 일반 Card처럼 동작.
 * 프레스 시 웹의 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 매칭 틴트.
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';

import { useAppPreferencesStore } from '@/lib/stores';

import { Card } from './Card';
import { useTheme } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// 자연스러운 스프링 릴리즈 — 웹의 transition 패턴과 동기화
const RELEASE_SPRING = { damping: 20, stiffness: 400, mass: 0.8 };

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
  const { shadows, isDark, radii } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const tintOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 웹의 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 매칭 — 프레스 시 배경 틴트
  const tintStyle = useAnimatedStyle(() => ({
    opacity: tintOpacity.value,
  }));

  const handlePressIn = (): void => {
    if (reduceMotion) return;
    scale.value = withTiming(pressedScale, { duration: 150 });
    tintOpacity.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = (): void => {
    scale.value = withSpring(1, RELEASE_SPRING);
    tintOpacity.value = withTiming(0, { duration: 200 });
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
      <Card>
        {children}
        {/* 프레스 틴트 오버레이 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(100,116,139,0.30)' : 'rgba(248,250,252,0.50)',
              borderRadius: radii.xl,
            },
            tintStyle,
          ]}
          pointerEvents="none"
        />
      </Card>
    </AnimatedPressable>
  );
}
