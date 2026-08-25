/**
 * 뷰티 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/beauty.tsx (BeautyTab)
 * 의존성: useRouter, useTheme, MenuCard, lucide-react-native 아이콘
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
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

const mockUseBeautyProducts = jest.fn();
jest.mock('../../../hooks/useBeautyProducts', () => ({
  useBeautyProducts: (...args: unknown[]) => mockUseBeautyProducts(...args),
}));

const mockUseUserAnalyses = jest.fn();
jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: (...args: unknown[]) => mockUseUserAnalyses(...args),
}));

const mockGetMatchedProducts = jest.fn();

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

// 뷰티 탭이 새로 사용하는 공용 personalMatched 계약만 고정해 네트워크 조회를 막는다.
jest.mock('../../../hooks/useUserMatching', () => ({
  useUserMatching: () => ({
    getMatchedProducts: (...args: unknown[]) => mockGetMatchedProducts(...args),
  }),
}));

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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('BeautyTab', () => {
  beforeEach(() => {
    mockUseBeautyProducts.mockReturnValue({
      products: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    mockUseUserAnalyses.mockReturnValue({
      skinAnalysis: null,
      isLoading: false,
      refetch: jest.fn(),
    });
    mockGetMatchedProducts.mockImplementation((products: Array<Record<string, unknown>>) =>
      products.map((product) => ({
        product,
        matchScore: 50,
        matchReasons: [],
        personalMatched: false,
      }))
    );
  });

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

    it('피부 진단 전에는 가짜 점수 대신 진단 안내를 표시한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<BeautyTab />);

      expect(getByTestId('product-match-guidance')).toBeTruthy();
      expect(getByText('피부 진단 후 제품별 개인 적합도를 확인할 수 있어요.')).toBeTruthy();
    });

    it('성분 스캔 진입 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<BeautyTab />);
      expect(getByTestId('menu-scan')).toBeTruthy();
    });

    it('메뉴 카드의 설명 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<BeautyTab />);
      expect(getByText('AI가 피부 상태를 분석하고 맞춤 케어를 추천해요')).toBeTruthy();
      expect(getByText('나에게 어울리는 색상을 찾아보세요')).toBeTruthy();
    });
  });

  describe('개인 적합도 정직성', () => {
    it('평점·리뷰·브랜드가 올린 종합 점수 대신 실제 개인 축 일치 비율만 표시한다', () => {
      const product = {
        id: 'mixed-score-product',
        name: '혼합 근거 제품',
        brand: '인기 브랜드',
        category: 'cleanser',
        priceRange: 'budget',
        priceKrw: 12000,
        rating: 4.9,
        reviewCount: 2000,
        concerns: [],
        keyIngredients: [],
      };
      mockUseBeautyProducts.mockReturnValue({
        products: [product],
        isLoading: false,
        refetch: jest.fn(),
      });
      mockUseUserAnalyses.mockReturnValue({
        skinAnalysis: {
          skinType: 'dry',
          overallScore: 72,
          concerns: [],
          createdAt: new Date('2026-08-25T00:00:00.000Z'),
          usedFallback: false,
        },
        isLoading: false,
        refetch: jest.fn(),
      });
      mockGetMatchedProducts.mockReturnValue([
        {
          product,
          matchScore: 95,
          matchReasons: [
            { type: 'skinType', label: '건성 피부', matched: true },
            { type: 'undertone', label: '웜 언더톤', matched: false },
            { type: 'brand', label: '선호 브랜드', matched: true },
            { type: 'popularity', label: '리뷰 인기', matched: true },
          ],
          personalMatched: true,
        },
      ]);

      const { getByText, queryByText } = renderWithTheme(<BeautyTab />);

      expect(getByText('개인 적합도 50%')).toBeTruthy();
      expect(queryByText('개인 적합도 95%')).toBeNull();
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
