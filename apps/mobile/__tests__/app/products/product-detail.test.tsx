/**
 * 제품 상세 화면 테스트
 *
 * 대상: app/products/[id].tsx
 * 재발 방지 핵심: 과거 이 화면은 비로그인·조회실패 시 지어낸 Mock 제품
 * ("아이오페 수분 크림 리치"+가짜 리뷰+matchScore 85 하드코딩)으로 폴백했다.
 * → 실데이터만 표시하고, 부재 시 정직한 "찾을 수 없음" 상태여야 한다.
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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

const { useLocalSearchParams } = require('expo-router');

const mockGetToken = jest.fn().mockResolvedValue('jwt-token');
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
  useUser: () => ({ user: { id: 'user-1' } }),
}));

const mockIsInWishlist = jest.fn();
const mockAddToWishlist = jest.fn();
const mockRemoveFromWishlist = jest.fn();
jest.mock('../../../lib/wishlist', () => ({
  isInWishlist: (...args: unknown[]) => mockIsInWishlist(...args),
  addToWishlist: (...args: unknown[]) => mockAddToWishlist(...args),
  removeFromWishlist: (...args: unknown[]) => mockRemoveFromWishlist(...args),
}));

// cosmetic 레포 mock — 이 화면의 유일한 제품 데이터 소스여야 한다
const mockGetCosmeticProductById = jest.fn();
jest.mock('../../../lib/products/repositories/cosmetic', () => ({
  getCosmeticProductById: (...args: unknown[]) =>
    (mockGetCosmeticProductById as jest.Mock)(...args),
}));

// 리뷰 쿼리용 supabase mock (리뷰 0건 반환)
jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

import ProductDetailScreen from '../../../app/products/[id]';

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

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeContext.Provider value={createThemeValue()}>{ui}</ThemeContext.Provider>);
}

const REAL_PRODUCT = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: '글로시 립 틴트',
  brand: '콰티',
  category: 'makeup',
  priceKrw: 12900,
  rating: 0,
  reviewCount: 0,
  keyIngredients: ['글리세린'],
  imageUrl: 'https://shopping-phinf.pstatic.net/test.jpg',
  purchaseUrl: 'https://www.coupang.com/vp/products/123',
};

describe('ProductDetailScreen — 정직성 (Mock 폴백 재발 방지)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalSearchParams.mockReturnValue({ id: REAL_PRODUCT.id });
    mockGetToken.mockResolvedValue('jwt-token');
    mockIsInWishlist.mockResolvedValue(false);
    mockAddToWishlist.mockResolvedValue(true);
    mockRemoveFromWishlist.mockResolvedValue(true);
  });

  it('DB 제품이 있으면 실제 제품 정보를 표시한다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(REAL_PRODUCT);
    const { getByText, queryByText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByText('글로시 립 틴트')).toBeTruthy();
    });
    expect(getByText('콰티')).toBeTruthy();
    // 과거 Mock 유령 제품이 절대 나오면 안 된다
    expect(queryByText(/아이오페/)).toBeNull();
    expect(queryByText(/수분 크림 리치/)).toBeNull();
  });

  it('제품 부재 시 가짜 제품 대신 "찾을 수 없음" 상태를 표시한다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(null);
    const { getByTestId, getByText, queryByText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('product-detail-not-found')).toBeTruthy();
    });
    expect(getByText('제품을 찾을 수 없어요')).toBeTruthy();
    expect(queryByText(/아이오페/)).toBeNull();
  });

  it('조회 에러 시에도 Mock으로 폴백하지 않는다', async () => {
    mockGetCosmeticProductById.mockRejectedValue(new Error('network'));
    const { getByTestId, queryByText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('product-detail-not-found')).toBeTruthy();
    });
    expect(queryByText(/수분 크림 리치/)).toBeNull();
  });

  it('리뷰 0건이면 별점 0.0을 지어내지 않고 "아직 리뷰가 없어요"를 표시한다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(REAL_PRODUCT);
    const { getByText, queryByText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => {
      expect(getByText('아직 리뷰가 없어요')).toBeTruthy();
    });
    expect(queryByText(/0\.0/)).toBeNull();
    // matchScore 하드코딩 제거 — 매칭 게이지가 지어낸 85%로 뜨면 안 된다
    expect(queryByText('85%')).toBeNull();
    expect(queryByText('나와의 매칭')).toBeNull();
  });

  it('찜 버튼은 인증 API가 성공한 뒤에만 선택 상태를 바꾼다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(REAL_PRODUCT);
    const { getByTestId, getByLabelText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => expect(getByTestId('product-favorite-button')).toBeTruthy());
    fireEvent.press(getByTestId('product-favorite-button'));

    await waitFor(() =>
      expect(mockAddToWishlist).toHaveBeenCalledWith('jwt-token', {
        productType: 'cosmetic',
        productId: REAL_PRODUCT.id,
      })
    );
    expect(getByLabelText('제품 찜 해제')).toBeTruthy();
  });

  it('초기 찜 상태 조회가 끝나기 전에는 쓰기를 막아 늦은 GET이 토글을 덮지 않는다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(REAL_PRODUCT);
    let resolveStatus!: (value: boolean) => void;
    mockIsInWishlist.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveStatus = resolve;
        })
    );
    const { getByTestId } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => expect(getByTestId('product-favorite-button')).toBeTruthy());
    const button = getByTestId('product-favorite-button');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    fireEvent.press(button);
    expect(mockAddToWishlist).not.toHaveBeenCalled();

    resolveStatus(false);
    await waitFor(() =>
      expect(getByTestId('product-favorite-button').props.accessibilityState).toMatchObject({
        disabled: false,
        busy: false,
      })
    );
    fireEvent.press(getByTestId('product-favorite-button'));
    await waitFor(() => expect(mockAddToWishlist).toHaveBeenCalledTimes(1));
  });

  it('찜 API 실패를 로컬 성공으로 위장하지 않는다', async () => {
    mockGetCosmeticProductById.mockResolvedValue(REAL_PRODUCT);
    mockAddToWishlist.mockRejectedValue(new Error('network'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId, getByLabelText } = renderWithTheme(<ProductDetailScreen />);

    await waitFor(() => expect(getByTestId('product-favorite-button')).toBeTruthy());
    fireEvent.press(getByTestId('product-favorite-button'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        '저장하지 못했어요',
        '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
      )
    );
    expect(getByLabelText('제품 찜하기')).toBeTruthy();
  });
});
