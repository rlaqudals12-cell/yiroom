/**
 * 뷰티 카테고리 스크린 테스트
 *
 * 대상: app/beauty/category/[slug].tsx
 * 5개 카테고리 + 정렬 옵션 + 제품 그리드
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

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// useLocalSearchParams mock
const { useLocalSearchParams } = require('expo-router');

// 어필리에이트 제품 mock
const mockProducts = [
  { id: 'p1', name: '수분 크림', price: 25000, rating: 4.5, category: 'skincare' },
  { id: 'p2', name: '선크림 SPF50', price: 18000, rating: 4.8, category: 'skincare' },
  { id: 'p3', name: '비타민 세럼', price: 32000, rating: 4.2, category: 'skincare' },
];

const mockUseAffiliateProducts = jest.fn(() => ({
  products: mockProducts,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));

jest.mock('../../../lib/affiliate/useAffiliateProducts', () => ({
  useAffiliateProducts: (...args: unknown[]) => mockUseAffiliateProducts(...args),
}));

import BeautyCategoryScreen from '../../../app/beauty/category/[slug]';

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트
// ============================================================

describe('BeautyCategoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalSearchParams.mockReturnValue({ slug: 'skincare' });
    mockUseAffiliateProducts.mockReturnValue({
      products: mockProducts,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe('기본 렌더링', () => {
    it('카테고리 라벨과 testID가 표시된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByTestId('beauty-category-skincare')).toBeTruthy();
      expect(getByText('스킨케어')).toBeTruthy();
    });

    it('제품 개수가 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('3개 제품')).toBeTruthy();
    });

    it('4개 정렬 옵션이 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('매칭률순')).toBeTruthy();
      expect(getByText('평점순')).toBeTruthy();
      expect(getByText('가격↑')).toBeTruthy();
      expect(getByText('가격↓')).toBeTruthy();
    });
  });

  describe('제품 그리드', () => {
    it('제품 이름이 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('수분 크림')).toBeTruthy();
      expect(getByText('선크림 SPF50')).toBeTruthy();
    });

    it('로딩 중일 때 안내 메시지가 표시된다', () => {
      mockUseAffiliateProducts.mockReturnValue({
        products: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('제품을 불러오는 중...')).toBeTruthy();
    });

    it('제품이 없을 때 빈 상태 메시지가 표시된다', () => {
      mockUseAffiliateProducts.mockReturnValue({
        products: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('해당 카테고리에 제품이 없습니다')).toBeTruthy();
    });
  });

  describe('카테고리별 이모지', () => {
    it('메이크업 카테고리의 이모지와 라벨이 표시된다', () => {
      useLocalSearchParams.mockReturnValue({ slug: 'makeup' });
      const { getByText } = renderWithTheme(<BeautyCategoryScreen />);
      expect(getByText('메이크업')).toBeTruthy();
    });
  });
});
