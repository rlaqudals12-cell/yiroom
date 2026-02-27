/**
 * PressableCard UI 컴포넌트 테스트
 *
 * 터치 가능 카드의 children 렌더링, onPress 핸들러, disabled 상태 검증.
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { Text } from 'react-native';
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
import { PressableCard } from '../../../components/ui/PressableCard';

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

describe('PressableCard', () => {
  describe('렌더링', () => {
    it('children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <PressableCard>
          <Text>카드 내용</Text>
        </PressableCard>
      );

      expect(getByText('카드 내용')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <PressableCard>
          <Text>첫 번째</Text>
          <Text>두 번째</Text>
        </PressableCard>
      );

      expect(getByText('첫 번째')).toBeTruthy();
      expect(getByText('두 번째')).toBeTruthy();
    });

    it('기본 testID가 pressable-card여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard>
          <Text>내용</Text>
        </PressableCard>
      );

      expect(getByTestId('pressable-card')).toBeTruthy();
    });

    it('커스텀 testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard testID="custom-card">
          <Text>내용</Text>
        </PressableCard>
      );

      expect(getByTestId('custom-card')).toBeTruthy();
    });

    it('접근성 role이 button이어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard>
          <Text>내용</Text>
        </PressableCard>
      );

      const card = getByTestId('pressable-card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('접근성 라벨이 전달되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <PressableCard accessibilityLabel="운동 기록 카드">
          <Text>내용</Text>
        </PressableCard>
      );

      expect(getByLabelText('운동 기록 카드')).toBeTruthy();
    });
  });

  describe('onPress', () => {
    it('클릭 시 onPress 핸들러를 호출해야 한다', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <PressableCard onPress={onPress}>
          <Text>터치</Text>
        </PressableCard>
      );

      fireEvent.press(getByTestId('pressable-card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('여러 번 클릭 시 핸들러가 매번 호출되어야 한다', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <PressableCard onPress={onPress}>
          <Text>터치</Text>
        </PressableCard>
      );

      fireEvent.press(getByTestId('pressable-card'));
      fireEvent.press(getByTestId('pressable-card'));
      fireEvent.press(getByTestId('pressable-card'));
      expect(onPress).toHaveBeenCalledTimes(3);
    });

    it('onPress가 없어도 에러 없이 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard>
          <Text>onPress 없음</Text>
        </PressableCard>
      );

      // onPress 없이 press 해도 에러 발생하지 않아야 함
      fireEvent.press(getByTestId('pressable-card'));
      expect(getByTestId('pressable-card')).toBeTruthy();
    });
  });

  describe('disabled', () => {
    it('disabled 상태에서 onPress가 호출되지 않아야 한다', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <PressableCard onPress={onPress} disabled>
          <Text>비활성</Text>
        </PressableCard>
      );

      fireEvent.press(getByTestId('pressable-card'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('disabled 상태에서 접근성 상태가 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard disabled>
          <Text>비활성</Text>
        </PressableCard>
      );

      const card = getByTestId('pressable-card');
      expect(card.props.accessibilityState).toEqual({ disabled: true });
    });

    it('활성 상태에서 접근성 상태가 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <PressableCard>
          <Text>활성</Text>
        </PressableCard>
      );

      const card = getByTestId('pressable-card');
      expect(card.props.accessibilityState).toEqual({ disabled: false });
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <PressableCard>
          <Text>다크 카드</Text>
        </PressableCard>,
        true
      );

      expect(getByText('다크 카드')).toBeTruthy();
    });

    it('다크 모드에서 onPress가 동작해야 한다', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <PressableCard onPress={onPress}>
          <Text>다크 터치</Text>
        </PressableCard>,
        true
      );

      fireEvent.press(getByTestId('pressable-card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
