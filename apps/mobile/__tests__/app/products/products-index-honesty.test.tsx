/** 제품 목록 개인화 점수 정직성 회귀 테스트. */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

const { useLocalSearchParams } = require('expo-router');

const mockGetCosmeticProducts = jest.fn();
const mockGetCosmeticProductsByCategories = jest.fn();
const mockGetCosmeticsBySkinType = jest.fn();
const mockGetCosmeticsByPersonalColor = jest.fn();

jest.mock('../../../lib/products/repositories/cosmetic', () => ({
  getCosmeticProducts: (...args: unknown[]) => mockGetCosmeticProducts(...args),
  getCosmeticProductsByCategories: (...args: unknown[]) =>
    mockGetCosmeticProductsByCategories(...args),
  getCosmeticsBySkinType: (...args: unknown[]) => mockGetCosmeticsBySkinType(...args),
  getCosmeticsByPersonalColor: (...args: unknown[]) => mockGetCosmeticsByPersonalColor(...args),
}));

jest.mock('../../../lib/products/repositories/supplement', () => ({
  getSupplementProducts: jest.fn().mockResolvedValue([]),
}));

const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({ single: mockSingle }),
        }),
      }),
    }),
  }),
}));

jest.mock('../../../components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GlassCard: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    ScreenContainer: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

import ProductsScreen from '../../../app/products';

const PRODUCT = {
  id: 'cosmetic-1',
  name: '정직한 테스트 제품',
  brand: '테스트 브랜드',
  category: 'serum',
  priceRange: 'premium' as const,
  rating: 4.8,
  reviewCount: 100,
};

const themeValue: ThemeContextValue = {
  colors: lightColors,
  brand,
  module: moduleColors,
  status: statusColors,
  spacing,
  radii,
  shadows,
  typography,
  isDark: false,
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: jest.fn(),
  grade: gradeColors,
  nutrient: nutrientColors,
  score: scoreColors,
  trust: trustColors,
};

function renderScreen() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <ProductsScreen />
    </ThemeContext.Provider>
  );
}

describe('ProductsScreen 개인화 점수 정직성', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalSearchParams.mockReturnValue({});
    mockGetCosmeticProducts.mockResolvedValue([PRODUCT]);
    mockGetCosmeticProductsByCategories.mockResolvedValue([PRODUCT]);
    mockGetCosmeticsBySkinType.mockResolvedValue([PRODUCT]);
    mockGetCosmeticsByPersonalColor.mockResolvedValue([PRODUCT]);
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  it('진단이 없으면 제품은 보여도 70점 배지를 숨기고 정직한 안내를 표시한다', async () => {
    const { getByText, queryByText } = renderScreen();

    await waitFor(() => expect(getByText(PRODUCT.name)).toBeTruthy());

    expect(queryByText('70%')).toBeNull();
    expect(queryByText('75%')).toBeNull();
    expect(getByText('진단 후 더 정확해져요')).toBeTruthy();
  });

  it('실제 진단과 변별력 있는 제품 태그가 일치할 때만 점수를 표시한다', async () => {
    useLocalSearchParams.mockReturnValue({ skinType: 'dry' });
    mockGetCosmeticsBySkinType.mockResolvedValue([{ ...PRODUCT, skinTypes: ['dry'] }]);

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => expect(getByText(PRODUCT.name)).toBeTruthy());
    expect(getByText('100%')).toBeTruthy();
    // 공용 총점의 기본 20 + 피부 30 + 리뷰 3 + 평점 10을 그대로 쓰면 63%가 된다.
    expect(queryByText('63%')).toBeNull();
  });

  it('모든 피부 타입이 붙은 블랭킷 태그는 점수로 표시하지 않는다', async () => {
    useLocalSearchParams.mockReturnValue({ skinType: 'dry' });
    mockGetCosmeticsBySkinType.mockResolvedValue([
      {
        ...PRODUCT,
        skinTypes: ['dry', 'oily', 'combination', 'sensitive', 'normal'],
      },
    ]);

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => expect(getByText(PRODUCT.name)).toBeTruthy());
    expect(queryByText(/\d+%/)).toBeNull();
  });
});
