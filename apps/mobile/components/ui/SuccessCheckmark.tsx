/**
 * SuccessCheckmark — 저장/완료 시 체크마크 드로잉 애니메이션
 *
 * SVG path의 stroke-dashoffset을 애니메이션하여 체크마크를 그리는 효과.
 * 웹 checkmark-draw keyframe의 네이티브 대응.
 *
 * @example
 * <SuccessCheckmark visible={saved} size={60} />
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SuccessCheckmarkProps {
  visible: boolean;
  size?: number;
  /** 완료 후 콜백 */
  onComplete?: () => void;
}

export function SuccessCheckmark({
  visible,
  size = 60,
  onComplete,
}: SuccessCheckmarkProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  // 체크마크 path 길이 (M6 13 L10 17 L18 9 의 근사치)
  const pathLength = 24;
  const circleCircumference = Math.PI * (size - 8);

  const checkProgress = useSharedValue(0);
  const circleProgress = useSharedValue(0);
  const containerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      containerOpacity.value = withTiming(0, { duration: 200 });
      containerScale.value = withTiming(0, { duration: 200 });
      return;
    }

    // 햅틱
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (reducedMotion) {
      containerOpacity.value = 1;
      containerScale.value = 1;
      circleProgress.value = 1;
      checkProgress.value = 1;
      if (onComplete) setTimeout(onComplete, 500);
      return;
    }

    // 컨테이너 스케일인
    containerOpacity.value = withTiming(1, { duration: 150 });
    containerScale.value = withSequence(
      withTiming(1.1, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 150 })
    );

    // 원 그리기 (0.3초)
    circleProgress.value = withDelay(
      100,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
    );

    // 체크마크 그리기 (0.5초, 0.2초 딜레이)
    checkProgress.value = withDelay(
      300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    if (onComplete) {
      setTimeout(onComplete, 1000);
    }

    return () => {
      cancelAnimation(checkProgress);
      cancelAnimation(circleProgress);
      cancelAnimation(containerScale);
      cancelAnimation(containerOpacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - checkProgress.value),
  }));

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circleCircumference * (1 - circleProgress.value),
  }));

  const containerStyle = {
    transform: [{ scale: containerScale }],
    opacity: containerOpacity,
  };

  if (!visible) return null;

  const strokeWidth = size > 50 ? 3 : 2;
  const successColor = '#22C55E';

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        containerStyle,
      ]}
      accessibilityLabel="성공"
      accessibilityRole="image"
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* 배경 원 */}
        <Circle
          cx={12}
          cy={12}
          r={10}
          fill={`${successColor}15`}
          stroke="none"
        />
        {/* 애니메이션 원 */}
        <AnimatedCircle
          cx={12}
          cy={12}
          r={10}
          fill="none"
          stroke={successColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circleCircumference}`}
          animatedProps={circleAnimatedProps}
        />
        {/* 체크마크 */}
        <AnimatedPath
          d="M6 13 L10 17 L18 9"
          fill="none"
          stroke={successColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${pathLength}`}
          animatedProps={checkAnimatedProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
