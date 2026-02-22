/**
 * Reanimated 애니메이션 프리셋
 *
 * 웹 globals.css 키프레임의 네이티브 대응.
 * Reanimated v4의 Layout Animations API 활용.
 *
 * @example
 * import { ENTERING, EXITING } from '@/lib/animations';
 * <Animated.View entering={ENTERING.fadeInUp} />
 */
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

// 웹 cubic-bezier(0.16, 1, 0.3, 1) ≈ Easing.out(Easing.exp)
const EASE_OUT = Easing.out(Easing.exp);
const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

/** 진입 애니메이션 프리셋 — 웹 @keyframes 1:1 대응 */
export const ENTERING = {
  // fade-in-up: opacity 0→1, translateY 20→0 (0.5s ease-out)
  fadeInUp: FadeInUp.duration(500).easing(EASE_OUT),

  // fade-in-up-stagger: 같지만 30px, 0.6s (순차 등장용)
  fadeInUpStagger: FadeInUp.duration(600).easing(EASE_SPRING),

  // scale-in: opacity 0→1, scale 0.9→1 (0.4s ease-out)
  scaleIn: ZoomIn.duration(400).easing(EASE_OUT),

  // slide-in-right
  slideInRight: SlideInRight.duration(400).easing(EASE_OUT),

  // slide-in-down (모달, 시트용)
  slideInDown: SlideInDown.duration(500).easing(EASE_OUT),

  // 기본 페이드
  fadeIn: FadeIn.duration(300),
  fadeInDown: FadeInDown.duration(400).easing(EASE_OUT),
  fadeInLeft: FadeInLeft.duration(400).easing(EASE_OUT),
  fadeInRight: FadeInRight.duration(400).easing(EASE_OUT),
} as const;

/** 퇴장 애니메이션 프리셋 */
export const EXITING = {
  fadeOut: FadeOut.duration(200),
  fadeOutUp: FadeOutUp.duration(300).easing(EASE_OUT),
  fadeOutDown: FadeOutDown.duration(300).easing(EASE_OUT),
  slideOutRight: SlideOutRight.duration(300).easing(EASE_OUT),
  slideOutDown: SlideOutDown.duration(400).easing(EASE_OUT),
  zoomOut: ZoomOut.duration(300).easing(EASE_OUT),
} as const;

/**
 * 순차 등장 딜레이 생성 (웹 .stagger-N 대응)
 *
 * @param index 아이템 인덱스 (0부터)
 * @param baseDelay 아이템 간 딜레이 (ms). 기본 80ms
 * @returns FadeInUp with delay
 *
 * @example
 * items.map((item, i) => (
 *   <Animated.View key={item.id} entering={staggeredEntry(i)}>
 *     ...
 *   </Animated.View>
 * ))
 */
export function staggeredEntry(index: number, baseDelay = 80): FadeInUp {
  return FadeInUp.delay(index * baseDelay)
    .duration(500)
    .easing(EASE_SPRING);
}

/** 애니메이션 타이밍 상수 */
export const TIMING = {
  /** 빠른 전환 (버튼 press 등) */
  fast: 150,
  /** 기본 전환 */
  normal: 300,
  /** 느린 전환 (페이지 진입 등) */
  slow: 500,
  /** 순차 등장 간격 */
  staggerInterval: 80,
} as const;
