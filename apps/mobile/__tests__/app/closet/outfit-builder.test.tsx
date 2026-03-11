/**
 * 코디 빌더 화면 렌더링 테스트
 *
 * 대상: app/(closet)/outfit-builder.tsx
 * 테스트 범위: 기본 렌더링, 로딩 상태, 저장 버튼 표시
 */
import React from 'react';

// -------------------------------------------------------------------
// Mocks
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
    FadeInUp: createChainable(), FadeIn: createChainable(), FadeInDown: createChainable(),
    ZoomIn: createChainable(), SlideInRight: createChainable(), SlideInLeft: createChainable(),
    Easing: { out: () => ({}), exp: {}, bezier: () => ({}), linear: {}, ease: {}, in: () => ({}), inOut: () => ({}) },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v, withSpring: (v: unknown) => v, withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), selectionAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

const mockUseCloset = jest.fn();
const mockUseSavedOutfits = jest.fn();

jest.mock('../../../lib/inventory/useInventory', () => ({
  useCloset: (...args: unknown[]) => mockUseCloset(...args),
  useSavedOutfits: (...args: unknown[]) => mockUseSavedOutfits(...args),
}));

jest.mock('../../../lib/inventory/types', () => ({
  CLOTHING_CATEGORY_LABELS: {
    outer: '아우터', top: '상의', bottom: '하의', dress: '원피스',
    shoes: '신발', bag: '가방', accessory: '액세서리',
  },
  SEASON_LABELS: { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' },
  OCCASION_LABELS: {
    casual: '캐주얼', work: '출근', date: '데이트', travel: '여행',
    formal: '포멀', sports: '운동',
  },
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', foreground: '#000', card: '#f5f5f5', border: '#e0e0e0',
      mutedForeground: '#888', muted: '#ccc', secondary: '#f0f0f0',
      overlayForeground: '#fff', destructive: '#ff0000',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    isDark: false,
  }),
  brand: { primary: '#6366f1', primaryForeground: '#fff' },
  typography: {
    size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  },
  spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
}));

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    SuccessCheckmark: () => null,
  };
});

// SUT
import OutfitBuilderScreen from '../../../app/(closet)/outfit-builder';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 기본 mock 설정
// -------------------------------------------------------------------
function setupDefaults(overrides?: { isLoading?: boolean; items?: unknown[] }) {
  const { isLoading = false, items = [] } = overrides ?? {};

  mockUseCloset.mockReturnValue({
    items,
    isLoading,
    error: null,
    addItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    toggleFavorite: jest.fn(),
    clothingItems: items,
    getByCategory: jest.fn(() => []),
    getFavorites: jest.fn(() => []),
    refetch: jest.fn(),
  });

  mockUseSavedOutfits.mockReturnValue({
    outfits: [],
    isLoading: false,
    error: null,
    saveOutfit: jest.fn().mockResolvedValue({ id: 'outfit-1' }),
    deleteOutfit: jest.fn(),
    recordWear: jest.fn(),
    refetch: jest.fn(),
  });
}

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('OutfitBuilderScreen 렌더링', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it('화면이 testID "outfit-builder-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<OutfitBuilderScreen />);
    expect(getByTestId('outfit-builder-screen')).toBeTruthy();
  });

  it('로딩 상태에서 로딩 텍스트가 표시된다', () => {
    setupDefaults({ isLoading: true });
    const { getByText } = renderWithTheme(<OutfitBuilderScreen />);
    expect(getByText('옷장을 불러오고 있어요...')).toBeTruthy();
  });

  it('로딩 완료 시 코디 저장 버튼과 아이템 선택 헤더가 표시된다', () => {
    setupDefaults();
    const { getByText } = renderWithTheme(<OutfitBuilderScreen />);
    expect(getByText('아이템 선택')).toBeTruthy();
    expect(getByText('코디 저장 (0개)')).toBeTruthy();
  });
});
