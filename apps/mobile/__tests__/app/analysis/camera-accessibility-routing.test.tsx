import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';

const mockTakePictureAsync = jest.fn().mockResolvedValue({
  uri: 'file:///original-camera.jpg',
  base64: 'ORIGINAL_MUST_NOT_BE_ROUTED',
});
const mockUseCameraPermissions = jest.fn(() => [{ granted: true }, jest.fn()]);

jest.mock('expo-camera', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    CameraView: ReactModule.forwardRef(function MockCameraView(
      props: { children?: React.ReactNode },
      ref: React.ForwardedRef<unknown>
    ) {
      ReactModule.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePictureAsync }));
      return <View testID="camera-view">{props.children}</View>;
    }),
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({ answers: '{}' }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    FadeIn: { duration: jest.fn(() => undefined) },
  };
});

import { router } from 'expo-router';
import HairCameraScreen from '../../../app/(analysis)/hair/camera';
import MakeupCameraScreen from '../../../app/(analysis)/makeup/camera';
import PersonalColorCameraScreen from '../../../app/(analysis)/personal-color/camera';
import SkinCameraScreen from '../../../app/(analysis)/skin/camera';

const CAMERAS = [
  ['퍼스널 컬러', PersonalColorCameraScreen, '/(analysis)/personal-color/result'],
  ['피부', SkinCameraScreen, '/(analysis)/skin/result'],
  ['헤어', HairCameraScreen, '/(analysis)/hair/result'],
  ['메이크업', MakeupCameraScreen, '/(analysis)/makeup/result'],
] as const;

describe('공개 분석 카메라 접근성·라우팅', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockTakePictureAsync.mockResolvedValue({
      uri: 'file:///original-camera.jpg',
      base64: 'ORIGINAL_MUST_NOT_BE_ROUTED',
    });
  });

  it.each(CAMERAS)('%s 촬영 버튼은 상태를 읽고 URI만 결과로 넘긴다', async (_, Screen, path) => {
    const screen = renderWithTheme(<Screen />);
    const capture = screen.getByLabelText('사진 촬영하기');

    expect(capture.props.accessibilityRole).toBe('button');
    expect(capture.props.accessibilityState).toEqual({ disabled: false, busy: false });
    fireEvent.press(capture);

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
    expect(mockTakePictureAsync).toHaveBeenCalledWith({ quality: 0.8 });
    const destination = (router.replace as jest.Mock).mock.calls[0][0] as {
      pathname: string;
      params: Record<string, string>;
    };
    expect(destination.pathname).toBe(path);
    expect(destination.params.imageUri).toBe('file:///original-camera.jpg');
    expect(destination.params).not.toHaveProperty('imageBase64');
  });

  it.each([
    [PersonalColorCameraScreen, '퍼스널 컬러 진단을 위해 얼굴 사진이 필요해요.'],
    [HairCameraScreen, '헤어 분석을 위해 사진이 필요해요.'],
    [MakeupCameraScreen, '메이크업 분석을 위해 얼굴 사진이 필요해요.'],
  ] as const)('권한 안내는 피부 화면과 같은 해요체를 쓴다', (Screen, message) => {
    mockUseCameraPermissions.mockReturnValueOnce([{ granted: false }, jest.fn()]);

    const screen = renderWithTheme(<Screen />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByLabelText('카메라 권한 허용하기')).toBeTruthy();
  });
});
