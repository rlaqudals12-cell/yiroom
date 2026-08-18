import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockGetProductShelfItem = jest.fn();
const mockUpdateProductShelfItem = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('jwt-token');

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'shelf-1' }),
}));

jest.mock('../../../lib/api/product-shelf', () => ({
  getProductShelfItem: (...args: unknown[]) => mockGetProductShelfItem(...args),
  updateProductShelfItem: (...args: unknown[]) => mockUpdateProductShelfItem(...args),
}));

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ErrorState: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
      <View>
        <Text>{message}</Text>
        <Pressable testID="detail-retry" onPress={onRetry} />
      </View>
    ),
  };
});

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    colors: {
      foreground: '#111',
      mutedForeground: '#666',
      muted: '#eee',
      card: '#fff',
      border: '#ddd',
      background: '#fff',
    },
    isDark: false,
  }),
  typography: {
    size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  },
  spacing: { xs: 4, sm: 8, smx: 12, md: 16, mlg: 20, lg: 24, xl: 32 },
  radii: { full: 999, xl: 16 },
}));

import ShelfDetailScreen from '../../../app/(inventory)/shelf-detail/[id]';

const ITEM = {
  id: 'shelf-1',
  productName: '수분 크림',
  productBrand: '이룸랩',
  productIngredients: [{ order: 1, inciName: 'Hyaluronic Acid', nameKo: '히알루론산' }],
  scanMethod: 'ocr',
  status: 'owned',
  expiresAt: '2027-01-01T00:00:00.000Z',
  scannedAt: '2026-08-18T00:00:00.000Z',
  analysisResult: {
    ingredientAnalysis: {
      beneficial: [],
      caution: [{ ingredient: '향료', inciName: 'Fragrance', note: '민감 피부는 주의하세요.' }],
      avoid: [],
      interactions: [],
    },
  },
};

describe('제품함 상세', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('jwt-token');
    mockGetProductShelfItem.mockResolvedValue(ITEM);
    mockUpdateProductShelfItem.mockResolvedValue({ ...ITEM, status: 'used_up' });
  });

  it('웹 API의 실제 제품·성분·주의 정보를 표시한다', async () => {
    const screen = render(<ShelfDetailScreen />);

    await waitFor(() => expect(screen.getByText('수분 크림')).toBeTruthy());
    expect(screen.getByText('이룸랩')).toBeTruthy();
    expect(screen.getByText('히알루론산')).toBeTruthy();
    expect(screen.getByText('민감 피부는 주의하세요.')).toBeTruthy();
    expect(mockGetProductShelfItem).toHaveBeenCalledWith('shelf-1', 'jwt-token');
  });

  it('상태 변경을 로컬 표시로 끝내지 않고 웹 API에 저장한다', async () => {
    const screen = render(<ShelfDetailScreen />);
    await waitFor(() => expect(screen.getByText('수분 크림')).toBeTruthy());

    fireEvent.press(screen.getByText('다 씀'));

    await waitFor(() =>
      expect(mockUpdateProductShelfItem).toHaveBeenCalledWith(
        'shelf-1',
        { status: 'used_up' },
        'jwt-token'
      )
    );
  });
});
