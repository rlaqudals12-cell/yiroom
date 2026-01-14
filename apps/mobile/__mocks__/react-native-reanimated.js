/**
 * react-native-reanimated Mock
 * Jest 테스트용 자체 구현
 */

const View = require('react-native').View;

module.exports = {
  __esModule: true,
  default: {
    call: () => {},
    createAnimatedComponent: (component) => component,
    addWhitelistedNativeProps: () => {},
    addWhitelistedUIProps: () => {},
  },
  useSharedValue: jest.fn((init) => ({ value: init })),
  useAnimatedStyle: jest.fn(() => ({})),
  useDerivedValue: jest.fn((fn) => ({
    value: typeof fn === 'function' ? fn() : fn,
  })),
  useAnimatedGestureHandler: jest.fn(() => ({})),
  useAnimatedScrollHandler: jest.fn(() => ({})),
  useAnimatedRef: jest.fn(() => ({ current: null })),
  useAnimatedReaction: jest.fn(),
  withTiming: jest.fn((toValue) => toValue),
  withSpring: jest.fn((toValue) => toValue),
  withDecay: jest.fn(() => 0),
  withDelay: jest.fn((_, animation) => animation),
  withSequence: jest.fn((...animations) => animations[0]),
  withRepeat: jest.fn((animation) => animation),
  cancelAnimation: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
  createAnimatedComponent: (component) => component,
  FadeIn: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  FadeOut: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  FadeInUp: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  FadeOutDown: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  SlideInRight: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  SlideOutLeft: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
  Layout: { duration: jest.fn(() => ({})) },
  Easing: {
    linear: jest.fn((x) => x),
    ease: jest.fn((x) => x),
    quad: jest.fn((x) => x),
    cubic: jest.fn((x) => x),
    bezier: jest.fn(() => jest.fn((x) => x)),
    in: jest.fn((easing) => easing),
    out: jest.fn((easing) => easing),
    inOut: jest.fn((easing) => easing),
  },
  interpolate: jest.fn((value, inputRange, outputRange) => {
    if (!outputRange || outputRange.length === 0) return 0;
    return outputRange[0];
  }),
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  interpolateColor: jest.fn((value, inputRange, outputRange) => {
    if (!outputRange || outputRange.length === 0) return '#000000';
    return outputRange[0];
  }),
  makeMutable: jest.fn((init) => ({ value: init })),
  measure: jest.fn(() => null),
  scrollTo: jest.fn(),
  setGestureState: jest.fn(),
  Animated: { View, Text: View, Image: View, ScrollView: View },
  Keyframe: class {
    duration() {
      return this;
    }
    delay() {
      return this;
    }
    withCallback() {
      return this;
    }
  },
  useReducedMotion: jest.fn(() => false),
  ReduceMotion: { System: 0, Always: 1, Never: 2 },
};
