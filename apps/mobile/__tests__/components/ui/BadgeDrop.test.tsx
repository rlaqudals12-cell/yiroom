/**
 * BadgeDrop 뱃지 드롭 애니메이션 테스트
 *
 * 렌더링, dismiss, 접근성, 다크모드 검증.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

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
import { BadgeDrop, type BadgeInfo } from '../../../components/ui/BadgeDrop';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
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

const mockBadge: BadgeInfo = {
  icon: '🏅',
  name: '첫 분석 완료',
  description: '첫 AI 분석을 성공적으로 완료했어요!',
};

describe('BadgeDrop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('렌더링', () => {
    it('visible=false일 때 아무것도 렌더링하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={false} />
      );

      expect(queryByText('첫 분석 완료')).toBeNull();
    });

    it('visible=true일 때 뱃지 정보가 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={true} />
      );

      expect(getByText('🏅')).toBeTruthy();
      expect(getByText('첫 분석 완료')).toBeTruthy();
      expect(getByText('첫 AI 분석을 성공적으로 완료했어요!')).toBeTruthy();
    });
  });

  describe('dismiss', () => {
    it('탭하면 onDismiss가 호출되어야 한다', () => {
      const onDismiss = jest.fn();

      const { getByLabelText } = renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={true} onDismiss={onDismiss} />
      );

      fireEvent.press(getByLabelText('뱃지 닫기'));

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('닫기 버튼에 accessibilityLabel이 있어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={true} />
      );

      expect(getByLabelText('뱃지 닫기')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={true} />,
        true
      );

      expect(getByText('첫 분석 완료')).toBeTruthy();
    });
  });

  describe('다양한 뱃지', () => {
    it('커스텀 뱃지 정보를 올바르게 표시해야 한다', () => {
      const customBadge: BadgeInfo = {
        icon: '🔥',
        name: '7일 연속 운동',
        description: '일주일 동안 매일 운동했어요!',
      };

      const { getByText } = renderWithTheme(
        <BadgeDrop badge={customBadge} visible={true} />
      );

      expect(getByText('🔥')).toBeTruthy();
      expect(getByText('7일 연속 운동')).toBeTruthy();
      expect(getByText('일주일 동안 매일 운동했어요!')).toBeTruthy();
    });
  });

  describe('햅틱', () => {
    it('바운스 시점에 heavy 햅틱이 실행되어야 한다', () => {
      const Haptics = require('expo-haptics');

      renderWithTheme(
        <BadgeDrop badge={mockBadge} visible={true} />
      );

      // 400ms 후 바운스 햅틱
      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });
  });
});
