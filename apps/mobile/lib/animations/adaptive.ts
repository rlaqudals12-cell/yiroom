/**
 * 적응형 애니메이션 — 시스템 접근성 설정 기반 애니메이션 속도 조절
 *
 * useReducedMotion()으로 접근성 설정 감지 후
 * shouldAnimate=false면 entering 애니메이션 생략.
 *
 * @module lib/animations/adaptive
 */
import { useReducedMotion } from 'react-native-reanimated';

/** 애니메이션 속도 단계 */
export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'none';

export interface AdaptiveAnimationResult {
  /** 현재 애니메이션 속도 */
  speed: AnimationSpeed;
  /** base duration을 현재 속도에 맞게 변환 */
  duration: (base: number) => number;
  /** base delay를 현재 속도에 맞게 변환 */
  delay: (base: number) => number;
  /** 애니메이션 실행 여부 (reducedMotion이면 false) */
  shouldAnimate: boolean;
}

// 속도별 duration 배수
const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  slow: 1.5,
  normal: 1.0,
  fast: 0.6,
  none: 0,
};

/**
 * 적응형 애니메이션 훅
 *
 * 시스템의 "동작 줄이기" 설정을 감지하여 애니메이션을 비활성화하거나
 * 속도를 조절한다. 접근성 설정이 켜져 있으면 모든 애니메이션을 건너뛴다.
 *
 * @example
 * const { shouldAnimate, duration } = useAdaptiveAnimation();
 * <Animated.View entering={shouldAnimate ? FadeInUp.duration(duration(500)) : undefined} />
 */
export function useAdaptiveAnimation(): AdaptiveAnimationResult {
  const reducedMotion = useReducedMotion();

  // 접근성: 동작 줄이기가 켜져 있으면 애니메이션 비활성화
  if (reducedMotion) {
    return {
      speed: 'none',
      duration: () => 0,
      delay: () => 0,
      shouldAnimate: false,
    };
  }

  // 기본 속도
  const speed: AnimationSpeed = 'normal';
  const multiplier = SPEED_MULTIPLIERS[speed];

  return {
    speed,
    duration: (base: number) => Math.round(base * multiplier),
    delay: (base: number) => Math.round(base * multiplier),
    shouldAnimate: true,
  };
}
