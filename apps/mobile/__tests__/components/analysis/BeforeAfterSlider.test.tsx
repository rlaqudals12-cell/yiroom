/**
 * BeforeAfterSlider 테스트
 *
 * 이전/이후 비교 슬라이더 컴포넌트.
 * Gesture Handler 모킹 필수.
 * useReducedMotion true 시 side-by-side 레이아웃 전환 검증.
 *
 * react-native-reanimated는 jest.config.js moduleNameMapper로
 * __mocks__/react-native-reanimated.js를 사용한다.
 * useReducedMotion은 해당 파일에 jest.fn(() => false)로 정의되어 있다.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// ============================================================
// Mocks
// ============================================================

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown>) => {
    const { View } = require('react-native');
    return <View testID="expo-image" {...props} />;
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Gesture: {
    Pan: () => ({
      onUpdate: () => ({
        onStart: () => ({
          onEnd: () => ({}),
        }),
      }),
    }),
  },
}));

// moduleNameMapper가 __mocks__/react-native-reanimated.js로 대체하므로
// 별도 jest.mock() 불필요. import 후 mockReturnValue로 제어.
import { BeforeAfterSlider } from '../../../components/analysis/BeforeAfterSlider';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReanimatedMock = require('react-native-reanimated');
const mockReducedMotion = ReanimatedMock.useReducedMotion as jest.Mock;

// ============================================================
// 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

const BEFORE_URI = 'file:///before.jpg';
const AFTER_URI = 'file:///after.jpg';

// ============================================================
// 테스트
// ============================================================

describe('BeforeAfterSlider', () => {
  beforeEach(() => {
    // 각 테스트 전에 reducedMotion을 false(슬라이더 모드)로 초기화
    mockReducedMotion.mockReturnValue(false);
  });

  describe('기본 렌더링', () => {
    it('기본 testID로 컨테이너를 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />
      );
      expect(getByTestId('before-after-slider')).toBeTruthy();
    });

    it('커스텀 testID로 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          testID="my-slider"
        />
      );
      expect(getByTestId('my-slider')).toBeTruthy();
    });

    it('이미지가 2개 이상 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />
      );
      const images = getAllByTestId('expo-image');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('기본 라벨', () => {
    it('기본 beforeLabel "이전"을 표시해야 한다', () => {
      const { getAllByText } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />
      );
      expect(getAllByText('이전').length).toBeGreaterThanOrEqual(1);
    });

    it('기본 afterLabel "이후"를 표시해야 한다', () => {
      const { getAllByText } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />
      );
      expect(getAllByText('이후').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('커스텀 라벨', () => {
    it('커스텀 beforeLabel을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="치료 전"
          afterLabel="치료 후"
        />
      );
      expect(getByText('치료 전')).toBeTruthy();
    });

    it('커스텀 afterLabel을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="치료 전"
          afterLabel="치료 후"
        />
      );
      expect(getByText('치료 후')).toBeTruthy();
    });

    it('beforeLabel과 afterLabel이 모두 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="1개월 전"
          afterLabel="현재"
        />
      );
      expect(getByText('1개월 전')).toBeTruthy();
      expect(getByText('현재')).toBeTruthy();
    });
  });

  describe('useReducedMotion — side-by-side 모드', () => {
    it('useReducedMotion true 시 기본 testID로 렌더링되어야 한다', () => {
      mockReducedMotion.mockReturnValue(true);

      const { getByTestId } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
        />
      );
      expect(getByTestId('before-after-slider')).toBeTruthy();
    });

    it('useReducedMotion true 시 beforeLabel을 표시해야 한다', () => {
      mockReducedMotion.mockReturnValue(true);

      const { getAllByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="이전"
          afterLabel="이후"
        />
      );
      // side-by-side: 각 half에 라벨 1개씩
      expect(getAllByText('이전')).toHaveLength(1);
    });

    it('useReducedMotion true 시 afterLabel을 표시해야 한다', () => {
      mockReducedMotion.mockReturnValue(true);

      const { getAllByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="이전"
          afterLabel="이후"
        />
      );
      expect(getAllByText('이후')).toHaveLength(1);
    });

    it('useReducedMotion true 시 커스텀 라벨도 나란히 표시해야 한다', () => {
      mockReducedMotion.mockReturnValue(true);

      const { getByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="시작"
          afterLabel="종료"
        />
      );
      expect(getByText('시작')).toBeTruthy();
      expect(getByText('종료')).toBeTruthy();
    });

    it('useReducedMotion false 시 슬라이더 모드로 렌더링해야 한다', () => {
      mockReducedMotion.mockReturnValue(false);

      const { getByTestId } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />
      );
      expect(getByTestId('before-after-slider')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BeforeAfterSlider beforeUri={BEFORE_URI} afterUri={AFTER_URI} />,
        true
      );
      expect(getByTestId('before-after-slider')).toBeTruthy();
    });

    it('다크 모드 side-by-side에서도 라벨이 표시되어야 한다', () => {
      mockReducedMotion.mockReturnValue(true);

      const { getByText } = renderWithTheme(
        <BeforeAfterSlider
          beforeUri={BEFORE_URI}
          afterUri={AFTER_URI}
          beforeLabel="이전"
          afterLabel="이후"
        />,
        true
      );
      expect(getByText('이전')).toBeTruthy();
      expect(getByText('이후')).toBeTruthy();
    });
  });
});
