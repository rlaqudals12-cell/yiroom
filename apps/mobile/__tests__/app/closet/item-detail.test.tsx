import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

const mockRecordUsage = jest.fn();
let mockUseCount = 0;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const entry = { delay: () => entry, duration: () => entry };
  return { __esModule: true, default: { View }, FadeInUp: entry };
});

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const { View } = require('react-native');
  return { SkeletonCard: () => <View /> };
});

jest.mock('@/components/visual-expression', () => {
  const { View } = require('react-native');
  return { TwinTryonButton: () => <View /> };
});

jest.mock('@/lib/animations', () => ({ TIMING: { normal: 200 } }));

jest.mock('@/lib/theme', () => {
  const spacing = { xs: 4, sm: 8, smx: 12, md: 16, lg: 24, xl: 32 };
  const radii = { xl: 16 };
  const typography = {
    size: { sm: 14, lg: 18, xl: 20 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  };
  return {
    spacing,
    radii,
    typography,
    useTheme: () => ({
      colors: {
        foreground: '#111',
        mutedForeground: '#777',
        border: '#ddd',
        card: '#fff',
        muted: '#eee',
        destructive: '#c00',
        overlayForeground: '#fff',
        secondary: '#eee',
      },
      status: { info: '#06c', success: '#080' },
      module: { body: { dark: '#333' } },
      spacing,
      radii,
    }),
  };
});

jest.mock('../../../lib/inventory', () => ({
  CLOTHING_CATEGORY_LABELS: { top: '상의' },
  SEASON_LABELS: {},
  OCCASION_LABELS: {},
  useCloset: () => ({
    items: [
      {
        id: 'item-1',
        name: '셔츠',
        subCategory: 'top',
        imageUrl: '',
        brand: null,
        tags: [],
        isFavorite: false,
        useCount: mockUseCount,
        metadata: {},
      },
    ],
    isLoading: false,
    toggleFavorite: jest.fn(),
    deleteItem: jest.fn(),
    recordUsage: (...args: unknown[]) => mockRecordUsage(...args),
    refetch: jest.fn(),
  }),
}));

import ItemDetailScreen from '../../../app/(closet)/[id]';

describe('ItemDetailScreen 착용 기록', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCount = 0;
    mockRecordUsage.mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('0회인 옷은 죽은 숫자 대신 아직 착용 기록이 없다고 안내한다', () => {
    const screen = render(<ItemDetailScreen />);

    expect(screen.getByText('아직 착용 기록 없음')).toBeTruthy();
    expect(screen.queryByText('0회')).toBeNull();
  });

  it('착용 기록 API 실패를 무음으로 삼키지 않고 안내한다', async () => {
    mockRecordUsage.mockResolvedValue(false);
    const screen = render(<ItemDetailScreen />);

    fireEvent.press(screen.getByTestId('closet-record-usage-button'));

    await waitFor(() => {
      expect(mockRecordUsage).toHaveBeenCalledWith('item-1');
      expect(Alert.alert).toHaveBeenCalledWith(
        '착용 기록 실패',
        '착용 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
      );
    });
  });
});
