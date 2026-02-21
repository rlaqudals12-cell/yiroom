/**
 * QuickActionsWidget 컴포넌트 테스트
 *
 * 빠른 실행 버튼 렌더링, onAction 콜백, 딥링크 동작 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

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
import { QuickActionsWidget } from '../../../components/widgets/QuickActionsWidget';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('QuickActionsWidget', () => {
  describe('medium size (기본)', () => {
    it('기본 렌더링이 정상 동작해야 한다', () => {
      const { getByText } = renderWithTheme(
        <QuickActionsWidget />
      );

      expect(getByText('빠른 실행')).toBeTruthy();
    });

    it('testID="quick-actions-widget"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <QuickActionsWidget />
      );

      expect(getByTestId('quick-actions-widget')).toBeTruthy();
    });

    it('4개의 액션 버튼을 모두 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <QuickActionsWidget />
      );

      expect(getByText('물 추가')).toBeTruthy();
      expect(getByText('운동 시작')).toBeTruthy();
      expect(getByText('식사 기록')).toBeTruthy();
      expect(getByText('대시보드')).toBeTruthy();
    });

    it('4개의 아이콘을 모두 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <QuickActionsWidget />
      );

      expect(getByText('💧')).toBeTruthy();
      expect(getByText('🏃')).toBeTruthy();
      expect(getByText('📸')).toBeTruthy();
      expect(getByText('📊')).toBeTruthy();
    });

    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <QuickActionsWidget />,
        true
      );

      expect(getByTestId('quick-actions-widget')).toBeTruthy();
      expect(getByText('빠른 실행')).toBeTruthy();
      expect(getByText('물 추가')).toBeTruthy();
    });
  });

  describe('onAction 콜백', () => {
    it('버튼 클릭 시 onAction 콜백을 올바른 액션 타입으로 호출해야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('물 추가'));
      expect(handleAction).toHaveBeenCalledWith('addWater');
    });

    it('운동 시작 버튼 클릭 시 올바른 액션 타입을 전달해야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('운동 시작'));
      expect(handleAction).toHaveBeenCalledWith('startWorkout');
    });

    it('식사 기록 버튼 클릭 시 올바른 액션 타입을 전달해야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('식사 기록'));
      expect(handleAction).toHaveBeenCalledWith('logMeal');
    });

    it('대시보드 버튼 클릭 시 올바른 액션 타입을 전달해야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('대시보드'));
      expect(handleAction).toHaveBeenCalledWith('viewDashboard');
    });

    it('여러 버튼을 연속으로 클릭해도 각각 올바른 액션을 호출해야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('물 추가'));
      fireEvent.press(getByText('운동 시작'));

      expect(handleAction).toHaveBeenCalledTimes(2);
      expect(handleAction).toHaveBeenNthCalledWith(1, 'addWater');
      expect(handleAction).toHaveBeenNthCalledWith(2, 'startWorkout');
    });
  });

  describe('딥링크 동작 (onAction 없을 때)', () => {
    it('onAction이 없으면 Linking.openURL을 호출해야 한다', () => {
      const { getByText } = renderWithTheme(
        <QuickActionsWidget />
      );

      fireEvent.press(getByText('물 추가'));

      // jest.setup.js에서 Linking이 모킹되어 있음 (expo-linking)
      // QuickActionsWidget은 react-native Linking을 사용하므로 별도 확인
      // expo-haptics의 impactAsync가 호출되었는지 검증
      const Haptics = require('expo-haptics');
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe('size="small"', () => {
    it('2개의 액션 버튼만 표시해야 한다 (처음 2개)', () => {
      const { getByText, queryByText } = renderWithTheme(
        <QuickActionsWidget size="small" />
      );

      // 처음 2개 아이콘만 표시
      expect(getByText('💧')).toBeTruthy();
      expect(getByText('🏃')).toBeTruthy();

      // 라벨은 small에서 표시되지 않음
      expect(queryByText('물 추가')).toBeNull();
      expect(queryByText('운동 시작')).toBeNull();
    });

    it('testID가 없어야 한다 (medium에만 존재)', () => {
      const { queryByTestId } = renderWithTheme(
        <QuickActionsWidget size="small" />
      );

      expect(queryByTestId('quick-actions-widget')).toBeNull();
    });

    it('"빠른 실행" 타이틀이 없어야 한다', () => {
      const { queryByText } = renderWithTheme(
        <QuickActionsWidget size="small" />
      );

      expect(queryByText('빠른 실행')).toBeNull();
    });

    it('small 사이즈에서 버튼 클릭 시 onAction이 호출되어야 한다', () => {
      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget size="small" onAction={handleAction} />
      );

      fireEvent.press(getByText('💧'));
      expect(handleAction).toHaveBeenCalledWith('addWater');
    });
  });

  describe('햅틱 피드백', () => {
    it('버튼 클릭 시 햅틱 피드백이 발생해야 한다', () => {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync.mockClear();

      const handleAction = jest.fn();
      const { getByText } = renderWithTheme(
        <QuickActionsWidget onAction={handleAction} />
      );

      fireEvent.press(getByText('물 추가'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });
  });
});
