/**
 * Virtual Try-On 스크린 테스트
 *
 * 대상: app/(closet)/style/virtual-try-on.tsx
 * 의존성: expo-image-picker, useTheme, lucide-react-native, virtual-try-on/types
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import {
  LIP_PRESETS,
  BLUSH_PRESETS,
  HAIR_PRESETS,
  EYESHADOW_PRESETS,
  FOUNDATION_PRESETS,
} from '../../../lib/virtual-try-on/types';

// react-native-safe-area-context mock
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

// expo-file-system mock
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('bW9ja2Jhc2U2NA=='),
}));

// expo-image-picker mock
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// global fetch mock
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    success: true,
    data: { resultBase64: 'data:image/jpeg;base64,mockresult', processingTimeMs: 100 },
  }),
}) as jest.Mock;

import VirtualTryOnScreen from '../../../app/(closet)/style/virtual-try-on';
import * as ImagePicker from 'expo-image-picker';

// --- 테마 헬퍼 ---

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// --- 테스트 ---

describe('VirtualTryOnScreen (가상 시착 스크린)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('초기 렌더링', () => {
    it('testID "virtual-try-on-screen"이 존재해야 한다', () => {
      // Arrange & Act
      const { getByTestId } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert
      expect(getByTestId('virtual-try-on-screen')).toBeTruthy();
    });

    it('이미지 미선택 시 안내 텍스트가 표시되어야 한다', () => {
      // Arrange & Act
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert
      expect(getByText('사진을 선택해주세요')).toBeTruthy();
    });

    it('이미지 미선택 시 가이드 메시지가 표시되어야 한다', () => {
      // Arrange & Act
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert
      expect(
        getByText(/정면 얼굴 사진을 업로드하면/)
      ).toBeTruthy();
    });

    it('"촬영" 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);
      expect(getByText('촬영')).toBeTruthy();
    });

    it('"갤러리" 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);
      expect(getByText('갤러리')).toBeTruthy();
    });
  });

  describe('카테고리 탭 (5카테고리)', () => {
    it('5개의 카테고리 탭이 모두 표시되어야 한다', () => {
      // Arrange & Act
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert
      expect(getByText('립')).toBeTruthy();
      expect(getByText('블러셔')).toBeTruthy();
      expect(getByText('아이섀도')).toBeTruthy();
      expect(getByText('파운데이션')).toBeTruthy();
      expect(getByText('헤어')).toBeTruthy();
    });

    it('기본 활성 탭은 "립"이어야 한다', () => {
      // Arrange & Act
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert: 립 카테고리의 프리셋 라벨이 표시되어야 함
      expect(getByText('립 컬러')).toBeTruthy();
    });

    it('"블러셔" 탭 클릭 시 블러셔 프리셋이 표시되어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('블러셔'));

      // Assert
      expect(getByText('블러셔 컬러')).toBeTruthy();
      // 블러셔 프리셋 이름 확인
      BLUSH_PRESETS.forEach((preset) => {
        expect(getByText(preset.name)).toBeTruthy();
      });
    });

    it('"헤어" 탭 클릭 시 헤어 프리셋이 표시되어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('헤어'));

      // Assert: 섹션 라벨 "헤어 컬러" 표시
      expect(getByText('헤어 컬러')).toBeTruthy();
      // 헤어 프리셋 이름 확인
      HAIR_PRESETS.forEach((preset) => {
        expect(getByText(preset.name)).toBeTruthy();
      });
    });

    it('탭 전환 후 다시 "립" 탭으로 돌아올 수 있어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act: 블러셔 → 립
      fireEvent.press(getByText('블러셔'));
      fireEvent.press(getByText('립'));

      // Assert
      expect(getByText('립 컬러')).toBeTruthy();
    });
  });

  describe('컬러 팔레트 렌더링', () => {
    it('립 모드에서 12개 프리셋 이름이 모두 표시되어야 한다', () => {
      // Arrange & Act
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Assert
      LIP_PRESETS.forEach((preset) => {
        expect(getByText(preset.name)).toBeTruthy();
      });
    });

    it('블러셔 모드에서 6개 프리셋 이름이 모두 표시되어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('블러셔'));

      // Assert
      BLUSH_PRESETS.forEach((preset) => {
        expect(getByText(preset.name)).toBeTruthy();
      });
    });

    it('헤어 모드에서 10개 프리셋 이름이 모두 표시되어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('헤어'));

      // Assert
      HAIR_PRESETS.forEach((preset) => {
        expect(getByText(preset.name)).toBeTruthy();
      });
    });
  });

  describe('컬러 선택 상호작용', () => {
    it('컬러 프리셋 클릭 시 선택 상태가 변경되어야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act: 첫 번째 립 프리셋 선택
      fireEvent.press(getByText(LIP_PRESETS[0].name));

      // Assert: 컬러 프리셋이 여전히 표시됨 (에러 없이 선택 처리)
      expect(getByText(LIP_PRESETS[0].name)).toBeTruthy();
    });

    it('이미지 업로드 후 컬러 선택 시 프로세싱이 시작되어야 한다', async () => {
      // Arrange
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://face.jpg', width: 300, height: 400 }],
      });

      const { getByText, findByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act: 이미지 선택
      fireEvent.press(getByText('갤러리'));
      // 이미지 로드 후 컬러 선택
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      // 컬러 선택
      fireEvent.press(getByText(LIP_PRESETS[0].name));

      // Assert: 시뮬레이션 중 텍스트가 잠시 표시됨
      const processingText = await findByText('시뮬레이션 중...');
      expect(processingText).toBeTruthy();
    });

    it('다른 카테고리로 전환 후 컬러 선택이 작동해야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act: 블러셔로 전환 후 프리셋 선택
      fireEvent.press(getByText('블러셔'));
      fireEvent.press(getByText(BLUSH_PRESETS[0].name));

      // Assert: 에러 없이 처리
      expect(getByText(BLUSH_PRESETS[0].name)).toBeTruthy();
    });
  });

  describe('이미지 업로드', () => {
    it('갤러리 버튼 클릭 시 ImagePicker가 호출되어야 한다', async () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('갤러리'));

      // Assert
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          })
        );
      });
    });

    it('촬영 버튼 클릭 시 카메라가 호출되어야 한다', async () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('촬영'));

      // Assert
      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          })
        );
      });
    });

    it('이미지 선택 후 안내 메시지가 사라져야 한다', async () => {
      // Arrange
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://face.jpg', width: 300, height: 400 }],
      });

      const { getByText, queryByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('갤러리'));

      // Assert
      await waitFor(() => {
        expect(queryByText('사진을 선택해주세요')).toBeNull();
      });
    });

    it('이미지 선택 취소 시 상태가 변경되지 않아야 한다', async () => {
      // Arrange
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const { getByText, queryByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('갤러리'));

      // Assert: 안내 텍스트가 그대로 표시
      await waitFor(() => {
        expect(getByText('사진을 선택해주세요')).toBeTruthy();
      });
    });

    it('권한 거부 시 이미지 선택이 진행되지 않아야 한다', async () => {
      // Arrange
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act
      fireEvent.press(getByText('갤러리'));

      // Assert: ImagePicker.launchImageLibraryAsync가 호출되지 않아야 함
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      // Arrange & Act
      const { getByTestId, getByText } = renderWithTheme(
        <VirtualTryOnScreen />,
        true
      );

      // Assert
      expect(getByTestId('virtual-try-on-screen')).toBeTruthy();
      expect(getByText('립')).toBeTruthy();
      expect(getByText('블러셔')).toBeTruthy();
      expect(getByText('헤어')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('이미지 없이 컬러 선택해도 에러가 발생하지 않아야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act & Assert: 에러 없이 실행
      expect(() => {
        fireEvent.press(getByText(LIP_PRESETS[0].name));
      }).not.toThrow();
    });

    it('같은 컬러를 두 번 선택해도 에러가 발생하지 않아야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);
      const presetName = LIP_PRESETS[0].name;

      // Act & Assert: 두 번 선택
      expect(() => {
        fireEvent.press(getByText(presetName));
        fireEvent.press(getByText(presetName));
      }).not.toThrow();
    });

    it('빠르게 카테고리를 전환해도 에러가 발생하지 않아야 한다', () => {
      // Arrange
      const { getByText } = renderWithTheme(<VirtualTryOnScreen />);

      // Act & Assert: 빠른 탭 전환
      expect(() => {
        fireEvent.press(getByText('블러셔'));
        fireEvent.press(getByText('헤어'));
        fireEvent.press(getByText('립'));
        fireEvent.press(getByText('블러셔'));
      }).not.toThrow();
    });
  });
});
