/**
 * 옷장 아이템 추가 화면 렌더링 테스트
 *
 * 대상: app/(closet)/add.tsx
 * 테스트 범위: 기본 렌더링, 폼 섹션 표시, 저장 버튼 상태
 */
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

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

const mockAddItem = jest.fn();
jest.mock('../../../lib/inventory', () => ({
  useCloset: jest.fn(() => ({
    addItem: mockAddItem,
    items: [],
    isLoading: false,
  })),
  // 실제 구현과 동일한 형태(단수 키)로 통과시킨다 — 매핑 자체는 closetMetadata.test.ts가 검증
  buildClosetMetadata: jest.fn((input: Record<string, unknown>) => input),
}));

// 사진 업로드 경로 — 기기 로컬 URI가 저장되지 않는지 검증하기 위해 mock으로 가로챈다
const mockUploadInventoryImage = jest.fn();
jest.mock('../../../lib/api', () => {
  // 에러 클래스는 팩토리 안에서 정의한다 (모듈 본문 상수는 팩토리 실행 시점에 TDZ)
  class InventoryUploadError extends Error {
    status: number;
    code: string | undefined;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = 'InventoryUploadError';
      this.status = status;
      this.code = code;
    }
  }
  return {
    uploadInventoryImage: (...args: unknown[]) => mockUploadInventoryImage(...args),
    InventoryUploadError,
  };
});

const mockDownscaleToUri = jest.fn();
jest.mock('../../../lib/image/downscale', () => ({
  downscaleToUri: (...args: unknown[]) => mockDownscaleToUri(...args),
}));

jest.mock('../../../lib/stores', () => ({
  useAppPreferencesStore: jest.fn((selector: (state: { hapticEnabled: boolean }) => boolean) =>
    selector({ hapticEnabled: false })
  ),
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      foreground: '#000',
      card: '#f5f5f5',
      border: '#e0e0e0',
      mutedForeground: '#888',
      secondary: '#f0f0f0',
      overlayForeground: '#fff',
      destructive: '#ff0000',
      muted: '#ccc',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    isDark: false,
  }),
  typography: {
    size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  },
  spacing: { xxs: 2, xs: 4, sm: 8, smd: 10, smx: 12, md: 16, mlg: 20, lg: 24, xl: 32, xxl: 48 },
  radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
}));

jest.mock('../../../lib/utils/logger', () => ({
  closetLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    SuccessCheckmark: () => null,
  };
});

// SUT
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import ClosetAddScreen from '../../../app/(closet)/add';
import { InventoryUploadError } from '../../../lib/api';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('ClosetAddScreen 렌더링', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('화면이 testID "closet-add-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ClosetAddScreen />);
    expect(getByTestId('closet-add-screen')).toBeTruthy();
  });

  it('폼 섹션 제목들이 표시된다 (기본 정보, 카테고리, 색상, 시즌)', () => {
    const { getByText } = renderWithTheme(<ClosetAddScreen />);

    expect(getByText('기본 정보')).toBeTruthy();
    expect(getByText('카테고리 *')).toBeTruthy();
    expect(getByText('색상 * (복수 선택)')).toBeTruthy();
    expect(getByText('시즌 * (복수 선택)')).toBeTruthy();
  });

  it('저장 버튼 "옷장에 추가"가 표시된다', () => {
    const { getByText } = renderWithTheme(<ClosetAddScreen />);
    expect(getByText('옷장에 추가')).toBeTruthy();
  });
});

// -------------------------------------------------------------------
// 사진 저장 경로 (기기 로컬 URI 유실 결함 회귀 방지)
// -------------------------------------------------------------------
describe('ClosetAddScreen 사진 업로드', () => {
  const LOCAL_URI = 'file:///cache/picked.jpg';
  const SMALL_URI = 'file:///cache/picked-small.jpg';
  const PUBLIC_URL = 'https://storage.test/inventory-images/u1/closet/x_processed.png';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddItem.mockResolvedValue({ id: 'new-item' });
    mockDownscaleToUri.mockResolvedValue(SMALL_URI);
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: LOCAL_URI, width: 1200, height: 1600 }],
    });
  });

  /** 필수 항목(사진·이름·카테고리·색상·시즌)을 채우고 저장을 누른다 */
  async function fillFormAndSubmit(utils: ReturnType<typeof renderWithTheme>): Promise<void> {
    const { getByText, getByPlaceholderText } = utils;

    fireEvent.press(getByText('🖼️ 앨범'));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('예: 화이트 셔츠'), '화이트 셔츠');
    fireEvent.press(getByText('상의'));
    fireEvent.press(getByText('블랙'));
    fireEvent.press(getByText('봄'));
    fireEvent.press(getByText('옷장에 추가'));
  }

  it('업로드 성공 시 서버 공개 URL로 저장한다 (로컬 file:// 저장 금지)', async () => {
    mockUploadInventoryImage.mockResolvedValue(PUBLIC_URL);

    const utils = renderWithTheme(<ClosetAddScreen />);
    await fillFormAndSubmit(utils);

    await waitFor(() => expect(mockAddItem).toHaveBeenCalled());

    // 전송 전 축소본이 업로드된다
    expect(mockDownscaleToUri).toHaveBeenCalledWith(LOCAL_URI);
    expect(mockUploadInventoryImage).toHaveBeenCalledWith(SMALL_URI, expect.any(String), {
      category: 'closet',
    });

    const saved = mockAddItem.mock.calls[0][0] as {
      imageUrl: string;
      originalImageUrl: string;
    };
    expect(saved.imageUrl).toBe(PUBLIC_URL);
    expect(saved.originalImageUrl).toBe(PUBLIC_URL);
    expect(saved.imageUrl).not.toContain('file://');
  });

  it('업로드 실패 시 저장하지 않고 원인을 안내한다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUploadInventoryImage.mockRejectedValue(
      new InventoryUploadError('사진 용량이 너무 커요.', 413)
    );

    const utils = renderWithTheme(<ClosetAddScreen />);
    await fillFormAndSubmit(utils);

    await waitFor(() => expect(mockUploadInventoryImage).toHaveBeenCalled());

    // 로컬 URI가 몰래 저장되면 안 된다 — 등록 자체가 실패해야 한다
    expect(mockAddItem).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('사진 업로드 실패', '사진 용량이 너무 커요.')
    );

    alertSpy.mockRestore();
  });
});
