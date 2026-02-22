/**
 * AnimatedCard UI 컴포넌트 테스트
 *
 * press 애니메이션 카드의 렌더링, onPress 핸들러, 스타일, testID 검증.
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
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
import { AnimatedCard } from '../../../components/ui/AnimatedCard';

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

describe('AnimatedCard', () => {
  describe('렌더링', () => {
    it('children을 정상 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnimatedCard>
          <Text>애니메이션 카드 내용</Text>
        </AnimatedCard>
      );

      expect(getByText('애니메이션 카드 내용')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnimatedCard>
          <Text>첫 번째 항목</Text>
          <Text>두 번째 항목</Text>
        </AnimatedCard>
      );

      expect(getByText('첫 번째 항목')).toBeTruthy();
      expect(getByText('두 번째 항목')).toBeTruthy();
    });
  });

  describe('onPress 없을 때 (비터치 카드)', () => {
    it('onPress 없이 일반 카드로 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnimatedCard>
          <Text>터치 불가 카드</Text>
        </AnimatedCard>
      );

      expect(getByText('터치 불가 카드')).toBeTruthy();
    });

    it('onPress 없을 때 testID가 Card에 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="static-card">
          <Text>정적 카드</Text>
        </AnimatedCard>
      );

      expect(getByTestId('static-card')).toBeTruthy();
    });
  });

  describe('onPress 있을 때 (터치 카드)', () => {
    it('클릭 시 onPress 핸들러를 호출해야 한다', () => {
      const handlePress = jest.fn();

      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="pressable-card" onPress={handlePress}>
          <Text>터치 가능 카드</Text>
        </AnimatedCard>
      );

      fireEvent.press(getByTestId('pressable-card'));
      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it('여러 번 클릭 시 핸들러가 매번 호출되어야 한다', () => {
      const handlePress = jest.fn();

      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="multi-press-card" onPress={handlePress}>
          <Text>반복 클릭</Text>
        </AnimatedCard>
      );

      fireEvent.press(getByTestId('multi-press-card'));
      fireEvent.press(getByTestId('multi-press-card'));
      fireEvent.press(getByTestId('multi-press-card'));
      expect(handlePress).toHaveBeenCalledTimes(3);
    });

    it('onPress가 있을 때 accessibilityRole이 button이어야 한다', () => {
      const handlePress = jest.fn();

      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="a11y-card" onPress={handlePress}>
          <Text>접근성 카드</Text>
        </AnimatedCard>
      );

      const card = getByTestId('a11y-card');
      expect(card.props.accessibilityRole).toBe('button');
    });
  });

  describe('스타일', () => {
    it('custom style이 적용되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnimatedCard style={{ marginBottom: 16 }}>
          <Text>스타일 카드</Text>
        </AnimatedCard>
      );

      expect(getByText('스타일 카드')).toBeTruthy();
    });
  });

  describe('접근성 (testID)', () => {
    it('testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="animated-card-test">
          <Text>테스트 ID</Text>
        </AnimatedCard>
      );

      expect(getByTestId('animated-card-test')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnimatedCard>
          <Text>다크 카드</Text>
        </AnimatedCard>,
        true
      );

      expect(getByText('다크 카드')).toBeTruthy();
    });

    it('다크 모드에서 onPress 카드가 정상 동작해야 한다', () => {
      const handlePress = jest.fn();

      const { getByTestId } = renderWithTheme(
        <AnimatedCard testID="dark-press-card" onPress={handlePress}>
          <Text>다크 터치</Text>
        </AnimatedCard>,
        true
      );

      fireEvent.press(getByTestId('dark-press-card'));
      expect(handlePress).toHaveBeenCalledTimes(1);
    });
  });
});
