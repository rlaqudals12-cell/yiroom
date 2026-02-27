/**
 * SuccessCheckmark 체크마크 드로잉 애니메이션 테스트
 *
 * 렌더링, 접근성, 콜백 검증.
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';

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
import { SuccessCheckmark } from '../../../components/ui/SuccessCheckmark';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

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

describe('SuccessCheckmark', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('렌더링', () => {
    it('visible=false일 때 아무것도 렌더링하지 않아야 한다', () => {
      const { queryByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={false} />
      );

      expect(queryByLabelText('성공')).toBeNull();
    });

    it('visible=true일 때 체크마크가 렌더링되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={true} />
      );

      expect(getByLabelText('성공')).toBeTruthy();
    });
  });

  describe('크기', () => {
    it('기본 크기 (60)로 렌더링되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={true} />
      );

      const container = getByLabelText('성공');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 60, height: 60 }),
        ])
      );
    });

    it('커스텀 크기로 렌더링되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={true} size={80} />
      );

      const container = getByLabelText('성공');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 80, height: 80 }),
        ])
      );
    });
  });

  describe('접근성', () => {
    it('accessibilityLabel이 "성공"이어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={true} />
      );

      expect(getByLabelText('성공')).toBeTruthy();
    });

    it('accessibilityRole이 "image"여야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SuccessCheckmark visible={true} />
      );

      const elem = getByLabelText('성공');
      expect(elem.props.accessibilityRole).toBe('image');
    });
  });

  describe('콜백', () => {
    it('onComplete가 애니메이션 완료 후 호출되어야 한다', () => {
      const onComplete = jest.fn();

      renderWithTheme(
        <SuccessCheckmark visible={true} onComplete={onComplete} />
      );

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('햅틱', () => {
    it('visible=true가 되면 success 햅틱이 실행되어야 한다', () => {
      const Haptics = require('expo-haptics');

      renderWithTheme(
        <SuccessCheckmark visible={true} />
      );

      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });
  });
});
