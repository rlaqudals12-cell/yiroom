/**
 * 스크롤 기반 애니메이션 훅
 *
 * Reanimated useAnimatedScrollHandler로 스크롤 위치를 추적하고,
 * 헤더 축소/확대, 패럴랙스, 오퍼시티 변환 등에 활용.
 *
 * @example
 * const { scrollHandler, headerHeight, headerOpacity } = useScrollAnimation({
 *   maxScroll: 120,
 *   minHeaderHeight: 60,
 *   maxHeaderHeight: 180,
 * });
 *
 * <Animated.ScrollView onScroll={scrollHandler}>
 *   <Animated.View style={{ height: headerHeight, opacity: headerOpacity }}>
 *     <Text>Hero Header</Text>
 *   </Animated.View>
 * </Animated.ScrollView>
 */
import {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

interface ScrollAnimationOptions {
  /** 축소 완료 스크롤 거리 (px). 기본 120 */
  maxScroll?: number;
  /** 축소 후 최소 높이. 기본 0 */
  minHeaderHeight?: number;
  /** 축소 전 최대 높이. 기본 180 */
  maxHeaderHeight?: number;
}

interface ScrollAnimationReturn {
  /** Animated.ScrollView에 연결할 onScroll 핸들러 */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /** 현재 스크롤 오프셋 (SharedValue) */
  scrollY: SharedValue<number>;
  /** 헤더 높이 (SharedValue, minHeaderHeight~maxHeaderHeight) */
  headerHeight: SharedValue<number>;
  /** 헤더 오퍼시티 (SharedValue, 0~1) */
  headerOpacity: SharedValue<number>;
  /** 패럴랙스 translateY (SharedValue, 0 ~ maxScroll/2) */
  parallaxY: SharedValue<number>;
  /** 헤더에 적용할 animated style */
  headerAnimatedStyle: ViewStyle;
  /** 패럴랙스 요소에 적용할 animated style */
  parallaxAnimatedStyle: ViewStyle;
}

export function useScrollAnimation(
  options: ScrollAnimationOptions = {}
): ScrollAnimationReturn {
  const { maxScroll = 120, minHeaderHeight = 0, maxHeaderHeight = 180 } = options;

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerHeight = useDerivedValue(() =>
    interpolate(scrollY.value, [0, maxScroll], [maxHeaderHeight, minHeaderHeight], 'clamp')
  );

  const headerOpacity = useDerivedValue(() =>
    interpolate(scrollY.value, [0, maxScroll * 0.6], [1, 0], 'clamp')
  );

  const parallaxY = useDerivedValue(() =>
    interpolate(scrollY.value, [0, maxScroll], [0, maxScroll * 0.4], 'clamp')
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: headerHeight.value,
    opacity: headerOpacity.value,
    overflow: 'hidden' as const,
  }));

  const parallaxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: parallaxY.value }],
  }));

  return {
    scrollHandler,
    scrollY,
    headerHeight,
    headerOpacity,
    parallaxY,
    headerAnimatedStyle,
    parallaxAnimatedStyle,
  };
}
