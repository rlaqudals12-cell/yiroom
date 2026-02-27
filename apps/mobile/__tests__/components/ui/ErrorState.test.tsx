/**
 * ErrorState UI 컴포넌트 테스트
 *
 * 에러 상태 표시, 커스텀 메시지, 재시도 버튼 렌더링 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
import { ErrorState } from '../../../components/ui/ErrorState';

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

describe('ErrorState', () => {
  describe('렌더링', () => {
    it('기본 메시지를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(<ErrorState />);

      expect(getByText('문제가 발생했어요')).toBeTruthy();
      expect(getByText('데이터를 불러오지 못했어요')).toBeTruthy();
    });

    it('커스텀 메시지를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ErrorState message="네트워크 연결을 확인해주세요" />
      );

      expect(getByText('네트워크 연결을 확인해주세요')).toBeTruthy();
    });

    it('이모지 아이콘을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(<ErrorState />);

      expect(getByText('😥')).toBeTruthy();
    });

    it('testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ErrorState testID="custom-error" />
      );

      expect(getByTestId('custom-error')).toBeTruthy();
    });

    it('기본 testID가 error-state여야 한다', () => {
      const { getByTestId } = renderWithTheme(<ErrorState />);

      expect(getByTestId('error-state')).toBeTruthy();
    });

    it('접근성 role이 alert여야 한다', () => {
      const { getByTestId } = renderWithTheme(<ErrorState />);
      const container = getByTestId('error-state');

      expect(container.props.accessibilityRole).toBe('alert');
    });
  });

  describe('재시도 버튼', () => {
    it('onRetry가 제공되면 재시도 버튼을 표시해야 한다', () => {
      const onRetry = jest.fn();
      const { getByText } = renderWithTheme(
        <ErrorState onRetry={onRetry} />
      );

      expect(getByText('다시 시도')).toBeTruthy();
    });

    it('onRetry가 없으면 재시도 버튼을 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(<ErrorState />);

      expect(queryByText('다시 시도')).toBeNull();
    });

    it('재시도 버튼 클릭 시 onRetry를 호출해야 한다', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = renderWithTheme(
        <ErrorState onRetry={onRetry} />
      );

      fireEvent.press(getByLabelText('다시 시도'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('커스텀 재시도 라벨을 표시해야 한다', () => {
      const onRetry = jest.fn();
      const { getByText } = renderWithTheme(
        <ErrorState onRetry={onRetry} retryLabel="새로고침" />
      );

      expect(getByText('새로고침')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(<ErrorState />, true);

      expect(getByText('문제가 발생했어요')).toBeTruthy();
    });

    it('다크 모드에서 재시도 버튼이 동작해야 한다', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = renderWithTheme(
        <ErrorState onRetry={onRetry} />,
        true
      );

      fireEvent.press(getByLabelText('다시 시도'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
