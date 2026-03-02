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
import { useEffect, useMemo, useCallback } from 'react';
import {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
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

/**
 * PulseGlow 애니메이션 (웹 pulse-glow keyframe 대응)
 *
 * shadowOpacity를 min ↔ max 반복 (3초 주기).
 * 프리미엄 카드, 높은 점수 카드에 은은한 글로우 효과.
 *
 * @param color 글로우 색상 (iOS shadowColor)
 * @param intensity 최대 글로우 강도 (shadowOpacity). 기본 0.25
 * @returns Animated style (shadowOpacity + elevation 변화)
 */
export function usePulseGlow(
  color: string,
  intensity = 0.25
): ReturnType<typeof useAnimatedStyle> {
  const glow = useSharedValue(intensity * 0.4);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(intensity * 0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(glow);
  }, [glow, intensity]);

  return useAnimatedStyle(() => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glow.value,
    shadowRadius: interpolate(glow.value, [intensity * 0.4, intensity], [8, 20]),
    elevation: interpolate(glow.value, [intensity * 0.4, intensity], [2, 6]),
  }));
}

/**
 * Weave 애니메이션 (웹 @keyframes weave 대응)
 *
 * translateY를 0 → -4px → 0 반복 (1.5s 주기).
 * 로딩 인디케이터, 대기 표시에 사용.
 *
 * @param amplitude 수직 이동량 (px). 기본 4
 * @param duration 한 주기 (ms). 기본 1500
 */
export function useWeave(
  amplitude = 4,
  duration = 1500
): ReturnType<typeof useAnimatedStyle> {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(progress);
  }, [progress, amplitude, duration]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -amplitude]) }],
  }));
}

/**
 * Weave Stagger 애니메이션 (웹 weave-delay-* 대응)
 *
 * 여러 요소가 순차적으로 weave 움직임을 하는 패턴.
 *
 * @param index 아이템 인덱스 (0부터)
 * @param amplitude 수직 이동량 (px). 기본 4
 * @param staggerDelay 아이템 간 딜레이 (ms). 기본 150
 */
export function useWeaveStagger(
  index: number,
  amplitude = 4,
  staggerDelay = 150
): ReturnType<typeof useAnimatedStyle> {
  const progress = useSharedValue(0);
  const delay = index * staggerDelay;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, amplitude]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -amplitude]) }],
  }));
}

/**
 * Sparkle 애니메이션 (웹 @keyframes sparkle 대응)
 *
 * opacity 0→1→0 + scale 0→1→0 반복 (1s 주기).
 * 별/반짝이 아이콘에 사용.
 *
 * @param duration 한 주기 (ms). 기본 1000
 */
export function useSparkle(
  duration = 1000
): ReturnType<typeof useAnimatedStyle> {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(progress);
  }, [progress, duration]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));
}

/**
 * Confetti 애니메이션 (웹 LevelUpModal confetti 대응)
 *
 * 여러 조각이 위에서 아래로 떨어지며 회전+페이드.
 * 레벨업, 뱃지 해금 등 축하 이벤트에 사용.
 *
 * @param count 컨페티 조각 수. 기본 20
 * @param duration 낙하 시간 (ms). 기본 2500
 * @returns { particles, triggerConfetti }
 *   - particles: Array of { translateY, rotate, opacity, delay } SharedValues
 *   - triggerConfetti: 실행 함수
 */
export function useConfetti(
  count = 20,
  duration = 2500
): {
  particles: Array<{
    translateY: SharedValue<number>;
    rotate: SharedValue<number>;
    opacity: SharedValue<number>;
  }>;
  triggerConfetti: () => void;
} {
  // Reanimated useSharedValue in useMemo — 초기화 한 번만 실행, 알려진 패턴
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      // eslint-disable-next-line react-hooks/rules-of-hooks
      translateY: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      rotate: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      opacity: useSharedValue(0),
    }));
    // count는 초기 렌더에만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerConfetti = useCallback(() => {
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const delay = Math.random() * 500;
      const particleDuration = duration + Math.random() * 500;

      // 시작 위치 리셋
      particle.translateY.value = 0;
      particle.rotate.value = 0;
      particle.opacity.value = 0;

      // 실행
      particle.opacity.value = withDelay(delay,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(particleDuration - 400,
            withTiming(0, { duration: 300 })
          )
        )
      );
      particle.translateY.value = withDelay(delay,
        withTiming(800, {
          duration: particleDuration,
          easing: Easing.in(Easing.quad),
        })
      );
      particle.rotate.value = withDelay(delay,
        withTiming(720, {
          duration: particleDuration,
          easing: Easing.linear,
        })
      );
    }
  }, [particles, duration]);

  return { particles, triggerConfetti };
}

/**
 * SuccessBounce 애니메이션 (웹 @keyframes success-bounce 대응)
 *
 * scale 1→1.1→1 한 번 (0.5s). 성공 인디케이터에 사용.
 *
 * @param trigger true가 되면 바운스 실행
 * @param maxScale 최대 스케일. 기본 1.1
 */
export function useSuccessBounce(
  trigger: boolean,
  maxScale = 1.1
): ReturnType<typeof useAnimatedStyle> {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withTiming(maxScale, { duration: 250, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [scale, trigger, maxScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

/**
 * BounceSlow 애니메이션 (웹 @keyframes bounce-slow 대응)
 *
 * scale 1→1.05→1 반복 (2s 주기). 부드러운 존재감 표시.
 *
 * @param minScale 최소 스케일. 기본 1
 * @param maxScale 최대 스케일. 기본 1.05
 */
export function useBounceSlow(
  minScale = 1,
  maxScale = 1.05
): ReturnType<typeof useAnimatedStyle> {
  const scale = useSharedValue(minScale);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: 1000, easing: Easing.inOut(Easing.ease) })
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
 * MedalDrop 애니메이션 (웹 @keyframes medal-drop 대응)
 *
 * 위에서 떨어져 바운스 후 착지. 메달/뱃지 획득 시.
 *
 * @param trigger true가 되면 드롭 실행
 * @param dropHeight 낙하 높이 (px). 기본 300
 */
export function useMedalDrop(
  trigger: boolean,
  dropHeight = 300
): ReturnType<typeof useAnimatedStyle> {
  const translateY = useSharedValue(-dropHeight);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSequence(
        // 70%: 낙하 + 약간 아래로 오버슈트
        withTiming(20, { duration: 700, easing: Easing.out(Easing.quad) }),
        // 85%: 위로 바운스
        withTiming(-10, { duration: 150, easing: Easing.out(Easing.ease) }),
        // 100%: 착지
        withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) })
      );
      rotate.value = withTiming(360, { duration: 1000, easing: Easing.out(Easing.quad) });
    } else {
      translateY.value = -dropHeight;
      rotate.value = 0;
      opacity.value = 0;
    }
  }, [trigger, translateY, rotate, opacity, dropHeight]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));
}

/**
 * ScanLine 애니메이션 (웹 @keyframes scan-line 대응)
 *
 * 수직으로 위→아래 이동하며 페이드인/아웃 반복 (2s 주기).
 * 스캔/분석 진행 시각 효과.
 *
 * @param height 스캔 영역 높이 (px)
 * @param duration 한 주기 (ms). 기본 2000
 */
export function useScanLine(
  height: number,
  duration = 2000
): ReturnType<typeof useAnimatedStyle> {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress, duration]);

  return useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(progress.value, [0, 1], [0, height - 2]),
    }],
    opacity: interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));
}
