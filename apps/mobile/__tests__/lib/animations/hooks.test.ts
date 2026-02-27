/**
 * animations/hooks.ts 테스트
 *
 * useShimmer, usePulse, usePressScale, useCountUp, usePulseGlow 훅 검증.
 */
import { renderHook, act } from '@testing-library/react-native';

import {
  useShimmer,
  usePulse,
  usePressScale,
  useCountUp,
  usePulseGlow,
} from '../../../lib/animations/hooks';

describe('useShimmer', () => {
  it('animated style 객체를 반환해야 한다', () => {
    const { result } = renderHook(() => useShimmer());

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('커스텀 width를 받아야 한다', () => {
    const { result } = renderHook(() => useShimmer(400));

    expect(result.current).toBeDefined();
  });

  it('기본 width 200으로 동작해야 한다', () => {
    const { result } = renderHook(() => useShimmer());

    // mock에서 useAnimatedStyle이 빈 객체 반환
    expect(result.current).toBeDefined();
  });
});

describe('usePulse', () => {
  it('animated style 객체를 반환해야 한다', () => {
    const { result } = renderHook(() => usePulse());

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('커스텀 minScale, maxScale을 받아야 한다', () => {
    const { result } = renderHook(() => usePulse(0.95, 1.1));

    expect(result.current).toBeDefined();
  });

  it('기본 minScale=1, maxScale=1.05로 동작해야 한다', () => {
    const { result } = renderHook(() => usePulse());

    expect(result.current).toBeDefined();
  });
});

describe('usePressScale', () => {
  it('scale, onPressIn, onPressOut, animatedStyle을 반환해야 한다', () => {
    const { result } = renderHook(() => usePressScale());

    expect(result.current.scale).toBeDefined();
    expect(typeof result.current.onPressIn).toBe('function');
    expect(typeof result.current.onPressOut).toBe('function');
    expect(result.current.animatedStyle).toBeDefined();
  });

  it('초기 scale 값이 1이어야 한다', () => {
    const { result } = renderHook(() => usePressScale());

    expect(result.current.scale.value).toBe(1);
  });

  it('onPressIn 호출 시 에러가 발생하지 않아야 한다', () => {
    const { result } = renderHook(() => usePressScale());

    expect(() => {
      act(() => {
        result.current.onPressIn();
      });
    }).not.toThrow();
  });

  it('onPressOut 호출 시 에러가 발생하지 않아야 한다', () => {
    const { result } = renderHook(() => usePressScale());

    expect(() => {
      act(() => {
        result.current.onPressOut();
      });
    }).not.toThrow();
  });

  it('커스텀 pressedScale을 받아야 한다', () => {
    const { result } = renderHook(() => usePressScale(0.9));

    expect(result.current.scale).toBeDefined();
    expect(result.current.scale.value).toBe(1);
  });
});

describe('useCountUp', () => {
  it('SharedValue를 반환해야 한다', () => {
    const { result } = renderHook(() => useCountUp(100));

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('value');
  });

  it('target 값으로 애니메이션되어야 한다', () => {
    const { result } = renderHook(() => useCountUp(85));

    // mock에서 withTiming이 toValue를 즉시 반환하므로 target 값으로 설정됨
    expect(result.current.value).toBe(85);
  });

  it('커스텀 duration을 받아야 한다', () => {
    const { result } = renderHook(() => useCountUp(50, 2000));

    expect(result.current).toBeDefined();
  });

  it('target이 0이어도 동작해야 한다', () => {
    const { result } = renderHook(() => useCountUp(0));

    expect(result.current).toBeDefined();
  });
});

describe('usePulseGlow', () => {
  it('animated style 객체를 반환해야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#F8C8DC'));

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('color 파라미터를 받아야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#60A5FA'));

    expect(result.current).toBeDefined();
  });

  it('커스텀 intensity를 받아야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#F8C8DC', 0.5));

    expect(result.current).toBeDefined();
  });

  it('기본 intensity 0.25로 동작해야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#F8C8DC'));

    expect(result.current).toBeDefined();
  });

  it('다른 색상으로도 에러 없이 동작해야 한다', () => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#F472B6'];

    colors.forEach((color) => {
      const { result } = renderHook(() => usePulseGlow(color));
      expect(result.current).toBeDefined();
    });
  });

  it('intensity 0으로도 동작해야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#F8C8DC', 0));

    expect(result.current).toBeDefined();
  });

  it('높은 intensity 값으로도 동작해야 한다', () => {
    const { result } = renderHook(() => usePulseGlow('#F8C8DC', 1.0));

    expect(result.current).toBeDefined();
  });
});
