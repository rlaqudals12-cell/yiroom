/**
 * BottomSheet UI 컴포넌트 테스트
 *
 * 모달 표시/숨김, 제목, children, 다크모드 렌더링 검증.
 * react-native-reanimated와 react-native-gesture-handler는 jest.setup.js + __mocks__에서 모킹됨.
 */

import React from 'react';
import { Text } from 'react-native';
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
import { BottomSheet } from '../../../components/ui/BottomSheet';

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

describe('BottomSheet', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('표시/숨김', () => {
    it('isVisible=true일 때 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose}>
          <Text>시트 내용</Text>
        </BottomSheet>
      );

      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('isVisible=false일 때 렌더링하지 않아야 한다', () => {
      const { queryByTestId } = renderWithTheme(
        <BottomSheet isVisible={false} onClose={mockOnClose}>
          <Text>숨겨진 내용</Text>
        </BottomSheet>
      );

      expect(queryByTestId('bottom-sheet')).toBeNull();
    });
  });

  describe('제목', () => {
    it('title이 있으면 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose} title="필터 옵션">
          <Text>옵션 내용</Text>
        </BottomSheet>
      );

      expect(getByTestId('bottom-sheet-title')).toBeTruthy();
    });

    it('title이 없으면 타이틀 영역이 없어야 한다', () => {
      const { queryByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose}>
          <Text>내용만</Text>
        </BottomSheet>
      );

      expect(queryByTestId('bottom-sheet-title')).toBeNull();
    });
  });

  describe('children', () => {
    it('children 콘텐츠가 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose}>
          <Text>바텀 시트 콘텐츠</Text>
        </BottomSheet>
      );

      expect(getByText('바텀 시트 콘텐츠')).toBeTruthy();
    });

    it('여러 children이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose} title="옵션">
          <Text>옵션 1</Text>
          <Text>옵션 2</Text>
          <Text>옵션 3</Text>
        </BottomSheet>
      );

      expect(getByText('옵션 1')).toBeTruthy();
      expect(getByText('옵션 2')).toBeTruthy();
      expect(getByText('옵션 3')).toBeTruthy();
    });
  });

  describe('핸들 인디케이터', () => {
    it('핸들 바가 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose}>
          <Text>내용</Text>
        </BottomSheet>
      );

      expect(getByTestId('bottom-sheet-handle')).toBeTruthy();
    });
  });

  describe('testID', () => {
    it('커스텀 testID가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose} testID="custom-sheet">
          <Text>커스텀</Text>
        </BottomSheet>
      );

      expect(getByTestId('custom-sheet')).toBeTruthy();
      expect(getByTestId('custom-sheet-content')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose} title="다크 시트">
          <Text>다크 모드 콘텐츠</Text>
        </BottomSheet>,
        true
      );

      expect(getByText('다크 모드 콘텐츠')).toBeTruthy();
    });

    it('다크 모드에서 제목이 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet isVisible onClose={mockOnClose} title="다크 제목">
          <Text>내용</Text>
        </BottomSheet>,
        true
      );

      expect(getByTestId('bottom-sheet-title')).toBeTruthy();
    });
  });

  describe('스냅 포인트', () => {
    it('커스텀 스냅 포인트로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <BottomSheet
          isVisible
          onClose={mockOnClose}
          snapPoints={['25%', '50%', '90%']}
          initialSnap={1}
        >
          <Text>다중 스냅</Text>
        </BottomSheet>
      );

      expect(getByTestId('bottom-sheet-content')).toBeTruthy();
    });
  });
});
