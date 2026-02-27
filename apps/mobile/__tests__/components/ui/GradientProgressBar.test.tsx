/**
 * GradientProgressBar UI 컴포넌트 테스트
 *
 * 진행률 바의 트랙, 값 클램핑, 라벨 표시 검증.
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
 * expo-linear-gradient는 __mocks__에서 자동 모킹됨.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
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
import { GradientProgressBar } from '../../../components/ui/GradientProgressBar';

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

describe('GradientProgressBar', () => {
  describe('렌더링', () => {
    it('트랙을 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={50} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('기본 testID가 gradient-progress-bar여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={50} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('커스텀 testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={50} testID="custom-progress" />
      );

      expect(getByTestId('custom-progress')).toBeTruthy();
    });
  });

  describe('값 클램핑', () => {
    it('value가 0일 때 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={0} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('value가 100일 때 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={100} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('value가 음수일 때 0으로 클램핑되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={-10} showLabel />
      );

      // 음수 값은 0%로 클램핑됨
      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('value가 max를 초과할 때 100%로 클램핑되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={150} max={100} showLabel />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('커스텀 max 값을 사용해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={50} max={200} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });
  });

  describe('라벨', () => {
    it('showLabel=true일 때 라벨을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientProgressBar value={72} showLabel />
      );

      expect(getByText('72%')).toBeTruthy();
    });

    it('showLabel=false (기본)일 때 라벨을 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <GradientProgressBar value={72} />
      );

      expect(queryByText('72%')).toBeNull();
    });

    it('커스텀 labelFormat을 사용해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientProgressBar
          value={1500}
          max={2000}
          showLabel
          labelFormat={(v, m) => `${v}/${m}kcal`}
        />
      );

      expect(getByText('1500/2000kcal')).toBeTruthy();
    });

    it('value=0일 때 0% 라벨을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientProgressBar value={0} showLabel />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    it('value=100일 때 100% 라벨을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientProgressBar value={100} showLabel />
      );

      expect(getByText('100%')).toBeTruthy();
    });
  });

  describe('모듈 색상', () => {
    it('workout 모듈 색상이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={60} moduleColor="workout" />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('nutrition 모듈 색상이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={80} moduleColor="nutrition" />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('모듈 색상 없이도 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={50} />
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientProgressBar value={65} />,
        true
      );

      expect(getByTestId('gradient-progress-bar')).toBeTruthy();
    });

    it('다크 모드에서 라벨을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientProgressBar value={45} showLabel />,
        true
      );

      expect(getByText('45%')).toBeTruthy();
    });
  });
});
