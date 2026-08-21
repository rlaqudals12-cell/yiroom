/**
 * 바코드 스캔 화면 렌더링 테스트
 *
 * 대상: app/(inventory)/barcode-scan.tsx
 * 의존성: expo-camera, useTheme, useInventory, useClerkSupabaseClient, isValidBarcode
 */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';

// ============================================================
// Mocks
// ============================================================

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
    FadeInDown: createChainable(),
    ZoomIn: createChainable(),
    SlideInRight: createChainable(),
    SlideInLeft: createChainable(),
    Easing: {
      out: () => ({}),
      exp: {},
      bezier: () => ({}),
      linear: {},
      ease: {},
      in: () => ({}),
      inOut: () => ({}),
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

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

jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    DataStateWrapper: ({
      children,
      isLoading,
      isEmpty,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      isEmpty: boolean;
      [key: string]: unknown;
    }) => (isLoading || isEmpty ? <View testID="data-state-wrapper" /> : <View>{children}</View>),
    SectionHeader: ({ title }: { title: string; [key: string]: unknown }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    AnimatedCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    StatCard: ({ label, value }: { label: string; value: string; [key: string]: unknown }) => (
      <View>
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
    ),
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({
    opacity: 1,
    transform: [{ scale: 1 }],
  })),
}));

// expo-camera mock — 권한 부여된 상태
jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    CameraView: View,
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

const mockGetToken = jest.fn().mockResolvedValue('jwt-token');
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

const mockAddItem = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../lib/inventory', () => ({
  useInventory: () => ({
    addItem: mockAddItem,
    items: [],
    isLoading: false,
  }),
}));

const mockAddProductShelfItem = jest.fn();
jest.mock('../../../lib/api/product-shelf', () => ({
  addProductShelfItem: (...args: unknown[]) => mockAddProductShelfItem(...args),
}));

jest.mock('../../../lib/nutrition/barcodeService', () => ({
  isValidBarcode: jest.fn(() => true),
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));

jest.mock('../../../lib/utils/logger', () => ({
  productLogger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import BarcodeScanScreen from '../../../app/(inventory)/barcode-scan';

// ============================================================
// 테스트
// ============================================================

describe('BarcodeScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('jwt-token');
    mockAddProductShelfItem.mockResolvedValue({ id: 'shelf-1' });
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
  });

  it('testID "barcode-scan-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<BarcodeScanScreen />);
    expect(getByTestId('barcode-scan-screen')).toBeTruthy();
  });

  it('카메라 권한이 부여된 상태에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<BarcodeScanScreen />);
    // 권한이 부여되면 카메라 스캔 화면 또는 수동 입력 화면이 렌더링됨
    expect(getByTestId('barcode-scan-screen')).toBeTruthy();
  });

  it('스캔 가이드 텍스트가 표시된다', () => {
    const { getByText } = renderWithTheme(<BarcodeScanScreen />);
    // 카메라 모드 + idle 상태 + 권한 부여 → 카메라 뷰 렌더
    expect(getByText('바코드를 프레임 안에 맞춰주세요')).toBeTruthy();
  });

  it('제품함 CTA는 화장대 쓰기와 분리된 인증 POST만 호출한다', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        name: '수분 크림',
        brand: '이룸랩',
        category: 'skincare',
        image_url: null,
        price: 19000,
        barcode: '8801234567890',
      },
      error: null,
    });
    const { getByLabelText, getByPlaceholderText, getByTestId, getByText } = renderWithTheme(
      <BarcodeScanScreen />
    );

    fireEvent.press(getByLabelText('수동 입력으로 전환'));
    const input = getByPlaceholderText('8~14자리 바코드 숫자');
    fireEvent.changeText(input, '8801234567890');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(getByTestId('add-to-product-shelf')).toBeTruthy());

    fireEvent.press(getByTestId('add-to-product-shelf'));

    await waitFor(() => expect(getByText('제품함에 추가했어요!')).toBeTruthy());
    expect(mockAddProductShelfItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: '수분 크림',
        scanMethod: 'barcode',
        status: 'owned',
      }),
      'jwt-token'
    );
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('제품함 POST 실패를 화장대 성공으로 섞지 않고 단독 실패로 표시한다', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        name: '수분 크림',
        brand: '이룸랩',
        category: 'skincare',
        image_url: null,
        price: 19000,
        barcode: '8801234567890',
      },
      error: null,
    });
    mockAddProductShelfItem.mockRejectedValueOnce(new Error('network'));
    const { getByLabelText, getByPlaceholderText, getByTestId, getByText } = renderWithTheme(
      <BarcodeScanScreen />
    );

    fireEvent.press(getByLabelText('수동 입력으로 전환'));
    const input = getByPlaceholderText('8~14자리 바코드 숫자');
    fireEvent.changeText(input, '8801234567890');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(getByTestId('add-to-product-shelf')).toBeTruthy());
    fireEvent.press(getByTestId('add-to-product-shelf'));

    await waitFor(() => expect(getByText('제품함에 추가하지 못했어요')).toBeTruthy());
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('제품함 추가 중 연속 탭을 한 번의 POST로 제한한다', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        name: '수분 크림',
        brand: '이룸랩',
        category: 'skincare',
        image_url: null,
        price: 19000,
        barcode: '8801234567890',
      },
      error: null,
    });
    let finishRequest: ((value: { id: string }) => void) | undefined;
    mockAddProductShelfItem.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRequest = resolve;
        })
    );
    const { getByLabelText, getByPlaceholderText, getByTestId, getByText } = renderWithTheme(
      <BarcodeScanScreen />
    );

    fireEvent.press(getByLabelText('수동 입력으로 전환'));
    const input = getByPlaceholderText('8~14자리 바코드 숫자');
    fireEvent.changeText(input, '8801234567890');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(getByTestId('add-to-product-shelf')).toBeTruthy());

    fireEvent.press(getByTestId('add-to-product-shelf'));
    fireEvent.press(getByTestId('add-to-product-shelf'));

    await waitFor(() => expect(getByText('제품함에 추가 중')).toBeTruthy());
    expect(mockAddProductShelfItem).toHaveBeenCalledTimes(1);
    finishRequest?.({ id: 'shelf-1' });
    await waitFor(() => expect(getByText('제품함에 추가했어요!')).toBeTruthy());
  });
});
