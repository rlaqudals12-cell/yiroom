/**
 * 의류 아이템 편집 화면 — 저장 페이로드 테스트
 *
 * 대상: app/(closet)/[id]/edit.tsx
 * 핵심 계약: 카테고리 변경이 metadata.clothingCategory(정규화 1순위 키)까지 반영되어야
 * 코디 슬롯·필터가 옛 대분류를 따라가지 않는다.
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: (...args: unknown[]) => mockBack(...args), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'item-1' }),
}));

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

jest.mock('@/lib/animations', () => ({ TIMING: { fast: 200, normal: 300, slow: 500 } }));

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      foreground: '#000',
      card: '#f5f5f5',
      border: '#e0e0e0',
      mutedForeground: '#888',
      secondary: '#f0f0f0',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    typography: {
      size: { xs: 12, sm: 14, base: 16, lg: 18 },
      weight: { medium: '500', semibold: '600', bold: '700' },
    },
  }),
}));

// 인벤토리 모듈 — 정규화·라벨은 실제 구현을 그대로 쓰고 훅만 가로챈다
// (정규화까지 mock하면 이 테스트가 검증하려는 계약 자체가 사라진다)
const mockUpdateItem = jest.fn();
const mockItems: Record<string, unknown>[] = [];
jest.mock('@/lib/inventory', () => {
  const actualTypes = jest.requireActual('../../../lib/inventory/types');
  const actualCategory = jest.requireActual('../../../lib/inventory/clothingCategory');
  return {
    CLOTHING_CATEGORY_LABELS: actualTypes.CLOTHING_CATEGORY_LABELS,
    OCCASION_LABELS: actualTypes.OCCASION_LABELS,
    SEASON_LABELS: actualTypes.SEASON_LABELS,
    resolveClothingCategory: actualCategory.resolveClothingCategory,
    useCloset: () => ({ items: mockItems, updateItem: mockUpdateItem }),
  };
});

// SUT (모든 jest.mock 이후에 import)
import EditClosetItemScreen from '../../../app/(closet)/[id]/edit';

interface MockItemOverrides {
  subCategory?: string | null;
  metadata?: Record<string, unknown>;
}

function setItem(overrides: MockItemOverrides = {}): void {
  mockItems.length = 0;
  mockItems.push({
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: overrides.subCategory ?? '티셔츠',
    name: '화이트 티셔츠',
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: overrides.metadata ?? {
      color: ['화이트'],
      season: ['spring'],
      occasion: ['casual'],
      clothingCategory: 'top',
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  });
}

describe('EditClosetItemScreen 저장 페이로드', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateItem.mockResolvedValue(true);
    setItem();
  });

  it('조립기가 모르는 "기타" 카테고리는 선택지에 없어야 한다', () => {
    const { queryByLabelText } = render(<EditClosetItemScreen />);

    expect(queryByLabelText('기타')).toBeNull();
    // 등록 화면과 같은 7종 계약
    expect(queryByLabelText('상의')).toBeTruthy();
    expect(queryByLabelText('원피스')).toBeTruthy();
    // 라벨은 정본 상수 재사용 — '악세서리'가 아니라 '액세서리'
    expect(queryByLabelText('액세서리')).toBeTruthy();
    expect(queryByLabelText('악세서리')).toBeNull();
  });

  it('카테고리를 바꾸면 sub_category와 metadata.clothingCategory가 함께 갱신된다', async () => {
    const { getByLabelText } = render(<EditClosetItemScreen />);

    fireEvent.press(getByLabelText('하의'));
    fireEvent.press(getByLabelText('저장'));

    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledTimes(1));

    const [id, payload] = mockUpdateItem.mock.calls[0];
    expect(id).toBe('item-1');
    expect(payload.subCategory).toBe('bottom');
    // 정규화 1순위 키가 함께 바뀌지 않으면 코디 슬롯이 계속 '상의'로 잡힌다
    expect(payload.metadata.clothingCategory).toBe('bottom');
  });

  it('카테고리를 안 바꾸면 사용자 어휘(한글 sub_category)를 보존한다', async () => {
    const { getByLabelText } = render(<EditClosetItemScreen />);

    fireEvent.press(getByLabelText('저장'));

    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledTimes(1));

    const [, payload] = mockUpdateItem.mock.calls[0];
    expect(payload.subCategory).toBe('티셔츠');
    expect(payload.metadata.clothingCategory).toBe('top');
  });

  it('대분류를 알 수 없는 아이템은 무효값을 심지 않고 폴백을 남긴다', async () => {
    // 목록 밖 한글 + metadata 부재 — 추측해서 잘못된 대분류를 박으면 어느 슬롯에도 안 잡힌다
    setItem({
      subCategory: '후드티',
      metadata: { color: ['그레이'], season: ['spring'], occasion: [] },
    });

    const { getByLabelText } = render(<EditClosetItemScreen />);
    fireEvent.press(getByLabelText('저장'));

    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledTimes(1));

    const [, payload] = mockUpdateItem.mock.calls[0];
    expect(payload.subCategory).toBe('후드티');
    expect(payload.metadata.clothingCategory).toBeUndefined();
  });
});
