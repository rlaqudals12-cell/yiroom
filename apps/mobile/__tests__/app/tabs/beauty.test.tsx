/**
 * 뷰티 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/beauty.tsx (BeautyTab)
 * 의존성: useRouter, useTheme, MenuCard, lucide-react-native 아이콘
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
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

// lucide-react-native 아이콘 mock (Proxy로 모든 아이콘 자동 처리)
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target: Record<string, unknown>, prop: string) => {
        // Symbol이나 내부 프로퍼티는 무시
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
});

import BeautyTab from '../../../app/(tabs)/beauty';

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

describe('BeautyTab', () => {
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('beauty-tab')).toBeTruthy();
    });

    it('섹션 제목 "뷰티"가 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyTab />);
      expect(getByText('뷰티')).toBeTruthy();
    });
  });

  describe('메뉴 카드 표시', () => {
    it('피부 분석 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('menu-skin')).toBeTruthy();
    });

    it('스킨케어 루틴 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('menu-routine')).toBeTruthy();
    });

    it('퍼스널 컬러 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('menu-personal-color')).toBeTruthy();
    });

    it('추천 제품 섹션이 표시된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('product-section')).toBeTruthy();
    });

    it('메뉴 카드의 설명 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyTab />);
      expect(getByText('AI가 피부 상태를 분석하고 맞춤 케어를 추천해요')).toBeTruthy();
      expect(getByText('나에게 어울리는 색상을 찾아보세요')).toBeTruthy();
    });
  });

  describe('네비게이션', () => {
    it('피부 분석 메뉴 클릭 시 라우터를 호출한다', () => {
      const mockPush = jest.fn();
      const { useRouter } = require('expo-router');
      useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
        canGoBack: jest.fn(() => true),
      });

      const { getByTestId } = renderWithTheme(<BeautyTab />);
      fireEvent.press(getByTestId('menu-skin'));
      expect(mockPush).toHaveBeenCalledWith('/(analysis)/skin');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />, true);
      expect(getByTestId('beauty-tab')).toBeTruthy();
    });

    it('다크 모드에서 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyTab />, true);
      expect(getByText('뷰티')).toBeTruthy();
    });
  });
});
