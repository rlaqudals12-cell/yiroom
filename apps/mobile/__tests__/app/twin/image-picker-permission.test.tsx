import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRequestMediaLibraryPermission = jest.fn();
const mockLaunchImageLibrary = jest.fn();
const mockShouldBypassMediaLibraryPermissionGate = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue('clerk-token') }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermission(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibrary(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('../../../components/reporting', () => ({
  ContentReportModal: () => null,
}));

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    GlassCard: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    ScreenContainer: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock('../../../lib/api/twin', () => {
  class TwinApiError extends Error {}
  return {
    TwinApiError,
    generateTwin: jest.fn(),
    notifyTwinChanged: jest.fn(),
    setTwinStatus: jest.fn(),
  };
});

jest.mock('../../../lib/image/camera-fallback', () => ({
  shouldBypassMediaLibraryPermissionGate: () => mockShouldBypassMediaLibraryPermissionGate(),
}));

jest.mock('../../../lib/image/downscale', () => ({
  downscaleToDataUrl: jest.fn(),
}));

jest.mock('../../../lib/theme', () => ({
  radii: { sm: 4, md: 8, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  typography: {
    lineHeight: { normal: 1.5 },
    size: { xs: 12, sm: 14, base: 16, lg: 18, '2xl': 24 },
  },
  useTheme: () => ({
    colors: {
      border: '#ddd',
      foreground: '#222',
      mutedForeground: '#777',
    },
  }),
}));

import TwinStudioScreen from '../../../app/(twin)/index';

describe('TwinStudioScreen 사진 권한 우회', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldBypassMediaLibraryPermissionGate.mockReturnValue(true);
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: [] });
  });

  it('Android API 29~32 계약에서는 권한 API를 호출하지 않고 앨범을 연다', async () => {
    const screen = render(<TwinStudioScreen />);
    fireEvent.press(screen.getByTestId('twin-intro-continue'));

    fireEvent.press(screen.getByTestId('twin-face-tile'));

    await waitFor(() => expect(mockLaunchImageLibrary).toHaveBeenCalledTimes(1));
    expect(mockRequestMediaLibraryPermission).not.toHaveBeenCalled();
  });
});
