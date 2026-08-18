/**
 * 내 옷장 메인 화면 — 카테고리 필터 정규화 테스트
 *
 * 대상: app/(closet)/index.tsx
 * 핵심 계약: 웹에서 등록한 아이템(sub_category = 한글 세부종류)이
 * 영문 대분류 필터 탭에서도 잡혀야 한다 (완전일치면 어느 탭에도 안 나옴)
 */
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// -------------------------------------------------------------------
// Mocks (jest.mock은 호이스팅되므로 import 전에 선언)
// -------------------------------------------------------------------
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(),
    FadeIn: createChainable(),
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/BottomSheet', () => {
  const { View } = require('react-native');
  return { BottomSheet: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

jest.mock('@/components/ui/GlassCard', () => {
  const { View } = require('react-native');
  return {
    GlassCard: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const { View } = require('react-native');
  return { SkeletonText: () => <View />, SkeletonCard: () => <View /> };
});

jest.mock('@/lib/animations', () => ({ staggeredEntry: jest.fn(() => undefined) }));

jest.mock('@/lib/theme', () => {
  const tokens = {
    spacing: { xxs: 2, xs: 4, sm: 8, smd: 12, smx: 12, md: 16, lg: 24, xl: 32 },
    radii: { sm: 4, md: 8, lg: 12, xl: 16, circle: 9999, full: 9999 },
    typography: {
      size: { xs: 12, sm: 14, base: 16, lg: 18 },
      weight: { medium: '500', semibold: '600', bold: '700' },
    },
  };
  return {
    ...tokens,
    useTheme: () => ({
      colors: {
        background: '#fff',
        foreground: '#000',
        card: '#f5f5f5',
        border: '#e0e0e0',
        mutedForeground: '#888',
        muted: '#eee',
        destructive: '#e53935',
        overlayForeground: '#fff',
      },
      module: { body: { dark: '#6366f1' } },
      shadows: { md: {}, lg: {} },
      ...tokens,
    }),
  };
});

// 옷장 훅만 가로채고 정규화·라벨은 실제 구현을 쓴다
// (정규화를 mock하면 이 테스트가 검증하려는 계약 자체가 사라진다)
const mockItems: Record<string, unknown>[] = [];
jest.mock('../../../lib/inventory', () => {
  const actualTypes = jest.requireActual('../../../lib/inventory/types');
  const actualCategory = jest.requireActual('../../../lib/inventory/clothingCategory');
  return {
    CLOTHING_CATEGORY_LABELS: actualTypes.CLOTHING_CATEGORY_LABELS,
    resolveClothingCategory: actualCategory.resolveClothingCategory,
    useCloset: () => ({
      items: mockItems,
      isLoading: false,
      isRefreshing: false,
      error: null,
      toggleFavorite: jest.fn(),
      refetch: jest.fn(),
    }),
  };
});

// SUT (모든 jest.mock 이후에 import)
import ClosetScreen from '../../../app/(closet)/index';

function createItem(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'item',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: '아이템',
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {},
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('ClosetScreen 카테고리 필터', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItems.length = 0;
    mockItems.push(
      // 웹 등록 형상 — sub_category에 한글 세부종류
      createItem({ id: 'ko-top', subCategory: '티셔츠', name: '화이트 티셔츠' }),
      // 앱 등록 형상 — 영문 대분류
      createItem({ id: 'en-bottom', subCategory: 'bottom', name: '청바지' }),
      // 목록 밖 한글 + metadata에 대분류 보존
      createItem({
        id: 'meta-top',
        subCategory: '후드티',
        name: '그레이 후드티',
        metadata: { clothingCategory: 'top' },
      })
    );
  });

  it('한글 sub_category 아이템이 영문 대분류 탭에 잡혀야 한다', () => {
    const { getByLabelText, queryByText } = render(<ClosetScreen />);

    fireEvent.press(getByLabelText('상의 카테고리'));

    expect(queryByText('화이트 티셔츠')).toBeTruthy();
    expect(queryByText('그레이 후드티')).toBeTruthy();
    // 다른 대분류는 걸러진다
    expect(queryByText('청바지')).toBeNull();
  });

  it('영문 대분류 아이템도 그대로 잡혀야 한다 (구 폴백 행 공존)', () => {
    const { getByLabelText, queryByText } = render(<ClosetScreen />);

    fireEvent.press(getByLabelText('하의 카테고리'));

    expect(queryByText('청바지')).toBeTruthy();
    expect(queryByText('화이트 티셔츠')).toBeNull();
  });

  it('전체 탭은 모든 아이템을 보여준다', () => {
    const { queryByText } = render(<ClosetScreen />);

    expect(queryByText('화이트 티셔츠')).toBeTruthy();
    expect(queryByText('청바지')).toBeTruthy();
    expect(queryByText('그레이 후드티')).toBeTruthy();
  });

  it('카테고리 통계는 정규화된 대분류 기준으로 센다', () => {
    // '티셔츠'·'후드티'·'bottom' → top·bottom 2종 (원본 문자열 기준이면 3으로 부풀려진다)
    const { getByText } = render(<ClosetScreen />);

    expect(getByText('2')).toBeTruthy();
  });

  it('저장한 코디 목록으로 이동할 수 있다', () => {
    const { getByTestId } = render(<ClosetScreen />);

    fireEvent.press(getByTestId('closet-outfits-entry'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(closet)/outfits');
  });

  it('코디 조립기로 이동할 수 있다', () => {
    const { getByTestId } = render(<ClosetScreen />);

    fireEvent.press(getByTestId('closet-outfit-builder-entry'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(closet)/outfit-builder');
  });
});
