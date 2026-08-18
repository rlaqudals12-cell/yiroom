/**
 * 제품함(선반) 목록 스크린 테스트
 *
 * 대상: app/(inventory)/shelf.tsx
 * 웹 제품함 API + 실제 status 필터 + 오류 복구
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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

const mockGetToken = jest.fn().mockResolvedValue('jwt-token');

// Clerk mock
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

const MOCK_SHELF_DATA = [
  {
    id: '1',
    productName: '아이소이 수분 크림',
    productBrand: '아이소이',
    productIngredients: [],
    scanMethod: 'ocr',
    status: 'owned',
    expiresAt: '2026-08-01T00:00:00.000Z',
    scannedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: '2',
    productName: '라운드랩 자작나무 토너',
    productBrand: '라운드랩',
    productIngredients: [],
    scanMethod: 'barcode',
    status: 'owned',
    scannedAt: '2026-02-28T00:00:00.000Z',
  },
  {
    id: '3',
    productName: '달바 선크림',
    productBrand: '달바',
    productIngredients: [],
    scanMethod: 'ocr',
    status: 'wishlist',
    scannedAt: '2026-02-27T00:00:00.000Z',
  },
  {
    id: '4',
    productName: '이니스프리 그린티 세럼',
    productBrand: '이니스프리',
    productIngredients: [],
    scanMethod: 'ocr',
    status: 'used_up',
    scannedAt: '2026-02-26T00:00:00.000Z',
  },
];

const mockGetProductShelf = jest.fn();
jest.mock('../../../lib/api/product-shelf', () => ({
  getProductShelf: (...args: unknown[]) => mockGetProductShelf(...args),
}));

import ShelfScreen from '../../../app/(inventory)/shelf';

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

// ============================================================
// 테스트
// ============================================================

describe('ShelfScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('jwt-token');
    mockGetProductShelf.mockResolvedValue({ items: MOCK_SHELF_DATA, total: 4 });
  });

  describe('기본 렌더링', () => {
    it('testID가 존재한다', () => {
      const { getByTestId } = renderWithTheme(<ShelfScreen />);
      expect(getByTestId('shelf-screen')).toBeTruthy();
    });

    it('4개 상태 필터 탭이 표시된다', () => {
      const { getAllByText, getByText } = renderWithTheme(<ShelfScreen />);
      expect(getByText('전체')).toBeTruthy();
      expect(getAllByText('보유중').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('관심').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('다 씀').length).toBeGreaterThanOrEqual(1);
    });

    it('Supabase에서 조회한 제품 4개가 모두 표시된다', async () => {
      const { getByText } = renderWithTheme(<ShelfScreen />);
      await waitFor(() => {
        expect(getByText('아이소이 수분 크림')).toBeTruthy();
      });
      expect(getByText('라운드랩 자작나무 토너')).toBeTruthy();
      expect(getByText('달바 선크림')).toBeTruthy();
      expect(getByText('이니스프리 그린티 세럼')).toBeTruthy();
    });
  });

  describe('제품 정보 표시', () => {
    it('브랜드 이름이 표시된다', async () => {
      const { getByText } = renderWithTheme(<ShelfScreen />);
      await waitFor(() => {
        expect(getByText('아이소이')).toBeTruthy();
      });
      expect(getByText('라운드랩')).toBeTruthy();
    });

    it('사용기한과 미등록 상태를 정직하게 표시한다', async () => {
      const { getByText, getAllByText } = renderWithTheme(<ShelfScreen />);
      await waitFor(() => {
        expect(getByText(/사용기한: 2026/)).toBeTruthy();
      });
      expect(getAllByText('사용기한: 미등록').length).toBeGreaterThan(0);
    });

    it('상태 뱃지가 표시된다', async () => {
      const { getAllByText } = renderWithTheme(<ShelfScreen />);
      await waitFor(() => {
        const owned = getAllByText('보유중');
        expect(owned.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('필터 동작', () => {
    it('관심 필터 선택 시 해당 제품만 표시된다', async () => {
      const { getAllByText, getByText, queryByText } = renderWithTheme(<ShelfScreen />);
      // 데이터 로드 대기
      await waitFor(() => {
        expect(getByText('달바 선크림')).toBeTruthy();
      });
      fireEvent.press(getAllByText('관심')[0]);
      expect(getByText('달바 선크림')).toBeTruthy();
      expect(queryByText('아이소이 수분 크림')).toBeNull();
      expect(queryByText('이니스프리 그린티 세럼')).toBeNull();
    });
  });

  describe('오류 복구', () => {
    it('API 실패를 빈 제품함으로 위장하지 않고 재시도한다', async () => {
      mockGetProductShelf
        .mockRejectedValueOnce(new Error('제품함을 불러오지 못했어요.'))
        .mockResolvedValueOnce({ items: MOCK_SHELF_DATA, total: 4 });

      const { getByTestId, getByText } = renderWithTheme(<ShelfScreen />);
      await waitFor(() => expect(getByText('제품함을 불러오지 못했어요.')).toBeTruthy());

      fireEvent.press(getByTestId('shelf-retry'));

      await waitFor(() => expect(getByText('아이소이 수분 크림')).toBeTruthy());
      expect(mockGetProductShelf).toHaveBeenCalledTimes(2);
    });
  });

  it('빈 제품함에서 아직 연결되지 않은 모바일 스캔 동선을 약속하지 않는다', async () => {
    mockGetProductShelf.mockResolvedValueOnce({ items: [], total: 0 });

    const { getByText, queryByText } = renderWithTheme(<ShelfScreen />);

    await waitFor(() => expect(getByText('아직 저장한 제품이 없어요.')).toBeTruthy());
    expect(queryByText('바코드 스캔으로 제품을 추가해보세요')).toBeNull();
  });
});
