/**
 * 애니메이션 커스텀 훅
 *
 * Reanimated useSharedValue/useAnimatedStyle 기반 재사용 훅.
 * 웹의 shimmer, pulse, count-up-pulse 등을 네이티브로.
 *
 * @example
 * const shimmerStyle = useShimmer();
 * <Animated.View style={[styles.skeleton, shimmerStyle]} />
 */
import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Shimmer 애니메이션 (웹 @keyframes shimmer 대응)
 *
 * translateX를 -width → +width 반복하여 반짝이는 효과.
 * Skeleton 컴포넌트에서 사용.
 *
 * @param width shimmer가 이동할 폭 (px). 기본 200
 * @returns Animated style (translateX)
 */
export function useShimmer(width = 200): ReturnType<typeof useAnimatedStyle> {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1, // 무한 반복
      false
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-width, width]) }],
  }));
}

/**
 * Pulse 애니메이션 (웹 count-up-pulse 대응)
 *
 * scale 1 → 1.05 → 1 반복.
 * 점수 카운트업, 로딩 인디케이터에 사용.
 *
 * @param minScale 최소 스케일. 기본 1
 * @param maxScale 최대 스케일. 기본 1.05
 */
export function usePulse(
  minScale = 1,
  maxScale = 1.05
): ReturnType<typeof useAnimatedStyle> {
  const scale = useSharedValue(minScale);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(scale);
  }, [scale, minScale, maxScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

/**
 * Press Scale 애니메이션
 *
 * Pressable 컴포넌트의 press-in/press-out 시 scale 변화.
 * 카드, 버튼 등 터치 가능한 요소에 사용.
 *
 * @param pressedScale press 시 스케일. 기본 0.97
 * @returns { scale, onPressIn, onPressOut, animatedStyle }
 */
export function usePressScale(pressedScale = 0.97): {
  scale: SharedValue<number>;
  onPressIn: () => void;
  onPressOut: () => void;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
} {
  const scale = useSharedValue(1);

  const onPressIn = (): void => {
    scale.value = withTiming(pressedScale, { duration: 100 });
  };

  const onPressOut = (): void => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, onPressIn, onPressOut, animatedStyle };
}

/**
 * 숫자 카운트업 애니메이션
 *
 * 0 → target까지 숫자가 올라가는 효과.
 * 분석 점수 표시에 사용.
 *
 * @param target 목표 숫자
 * @param duration 애니메이션 시간 (ms). 기본 1000
 */
export function useCountUp(
  target: number,
  duration = 1000
): SharedValue<number> {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, target, duration]);

  return value;
}
