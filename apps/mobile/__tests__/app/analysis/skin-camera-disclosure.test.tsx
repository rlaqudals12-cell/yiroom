import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('expo-camera', () => ({
  CameraView: require('react').forwardRef(function MockCameraView(
    props: { children?: React.ReactNode },
    _ref: React.ForwardedRef<unknown>
  ) {
    const { View: NativeView } = require('react-native');
    return <NativeView testID="skin-camera-view">{props.children}</NativeView>;
  }),
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('react-native-reanimated', () => {
  const { View: NativeView } = require('react-native');
  return {
    __esModule: true,
    default: { View: NativeView },
    FadeIn: { duration: jest.fn(() => undefined) },
  };
});

import SkinCameraScreen from '../../../app/(analysis)/skin/camera';

describe('피부 카메라 개인정보 안내', () => {
  it('서버·Google AI 전송과 비저장 조건을 촬영 전에 정직하게 알린다', () => {
    const screen = renderWithTheme(<SkinCameraScreen />);

    expect(screen.getByText(/이룸 서버를 거쳐 Google AI로 전송돼요/)).toBeTruthy();
    expect(screen.getByText(/동의하지 않으면 분석 후 원본을 보관하지 않아요/)).toBeTruthy();
    expect(screen.queryByText(/기기에서만 처리/)).toBeNull();
  });
});
