/**
 * CelebrationEffect 축하 효과 테스트
 *
 * 5가지 축하 타입 렌더링, dismiss, 접근성, 다크모드 검증.
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
import { CelebrationEffect } from '../../../components/ui/CelebrationEffect';

// expo-haptics mock
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

describe('CelebrationEffect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('렌더링', () => {
    it('visible=false일 때 아무것도 렌더링하지 않아야 한다', () => {
      const { queryByLabelText } = renderWithTheme(
        <CelebrationEffect type="analysis_complete" visible={false} />
      );

      expect(queryByLabelText('축하 효과 닫기')).toBeNull();
    });

    it('visible=true일 때 축하 효과가 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <CelebrationEffect type="analysis_complete" visible={true} />
      );

      expect(getByText('분석 완료!')).toBeTruthy();
      expect(getByText('✨')).toBeTruthy();
    });
  });

  describe('축하 타입별 텍스트', () => {
    const testCases = [
      { type: 'workout_complete' as const, icon: '✅', title: '운동 완료!' },
      { type: 'goal_achieved' as const, icon: '🎯', title: '목표 달성!' },
      { type: 'streak' as const, icon: '🔥', title: '연속 기록!' },
      { type: 'analysis_complete' as const, icon: '✨', title: '분석 완료!' },
      { type: 'badge_earned' as const, icon: '🏅', title: '뱃지 획득!' },
    ];

    testCases.forEach(({ type, icon, title }) => {
      it(`${type} 타입에 올바른 아이콘과 제목이 표시되어야 한다`, () => {
        const { getByText } = renderWithTheme(
          <CelebrationEffect type={type} visible={true} />
        );

        expect(getByText(icon)).toBeTruthy();
        expect(getByText(title)).toBeTruthy();
      });
    });
  });

  describe('dismiss', () => {
    it('탭하면 onComplete가 호출되어야 한다', () => {
      const onComplete = jest.fn();

      const { getByLabelText } = renderWithTheme(
        <CelebrationEffect
          type="analysis_complete"
          visible={true}
          onComplete={onComplete}
        />
      );

      fireEvent.press(getByLabelText('축하 효과 닫기'));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('닫기 버튼에 accessibilityLabel이 있어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <CelebrationEffect type="analysis_complete" visible={true} />
      );

      expect(getByLabelText('축하 효과 닫기')).toBeTruthy();
    });

    it('닫기 버튼의 accessibilityRole이 button이어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <CelebrationEffect type="analysis_complete" visible={true} />
      );

      const button = getByLabelText('축하 효과 닫기');
      expect(button.props.accessibilityRole).toBe('button');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <CelebrationEffect type="badge_earned" visible={true} />,
        true
      );

      expect(getByText('뱃지 획득!')).toBeTruthy();
    });
  });

  describe('햅틱', () => {
    it('visible=true가 되면 햅틱 피드백이 실행되어야 한다', () => {
      const Haptics = require('expo-haptics');

      renderWithTheme(
        <CelebrationEffect type="analysis_complete" visible={true} />
      );

      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });
  });
});
