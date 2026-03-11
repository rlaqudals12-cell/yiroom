/**
 * 바코드 스캔 화면 렌더링 테스트
 *
 * 대상: app/(inventory)/barcode-scan.tsx
 * 의존성: expo-camera, useTheme, useInventory, useClerkSupabaseClient, isValidBarcode
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// ============================================================
// Mocks
// ============================================================

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <View {...props} /> }
  );
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown =>
    new Proxy({}, { get: () => createChainable });
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
    GlassCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    DataStateWrapper: ({
      children,
      isLoading,
      isEmpty,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      isEmpty: boolean;
      [key: string]: unknown;
    }) =>
      isLoading || isEmpty ? (
        <View testID="data-state-wrapper" />
      ) : (
        <View>{children}</View>
      ),
    SectionHeader: ({
      title,
    }: {
      title: string;
      [key: string]: unknown;
    }) => (
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
    StatCard: ({
      label,
      value,
    }: {
      label: string;
      value: string;
      [key: string]: unknown;
    }) => (
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

jest.mock('../../../lib/inventory', () => ({
  useInventory: () => ({
    addItem: jest.fn().mockResolvedValue(undefined),
    items: [],
    isLoading: false,
  }),
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
});
