/**
 * ErrorBoundary 컴포넌트 테스트
 *
 * 에러 발생 시 fallback UI 표시, 리트라이, 커스텀 fallback 동작 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

// SafeAreaView를 일반 View로 대체 (테스트 환경)
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// errorLogger 모킹 (에러 로그 noise 방지)
jest.mock('../../../lib/utils/logger', () => ({
  errorLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// 의도적으로 에러를 발생시키는 컴포넌트
function ThrowError({ message = 'Test error' }: { message?: string }) {
  throw new Error(message);
  // eslint-disable-next-line no-unreachable
  return null;
}

describe('ErrorBoundary', () => {
  // React의 에러 바운더리 테스트 시 콘솔 에러 출력 억제
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('정상 케이스', () => {
    it('에러가 없을 때 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <Text>정상 컨텐츠</Text>
        </ErrorBoundary>
      );

      expect(getByText('정상 컨텐츠')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <Text>첫 번째</Text>
          <Text>두 번째</Text>
        </ErrorBoundary>
      );

      expect(getByText('첫 번째')).toBeTruthy();
      expect(getByText('두 번째')).toBeTruthy();
    });
  });

  describe('에러 발생 시', () => {
    it('기본 fallback UI를 표시해야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByTestId('error-boundary')).toBeTruthy();
      expect(getByText('문제가 발생했어요')).toBeTruthy();
    });

    it('"다시 시도" 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('다시 시도')).toBeTruthy();
    });

    it('onError 콜백이 호출되어야 한다', () => {
      const onError = jest.fn();

      renderWithTheme(
        <ErrorBoundary onError={onError}>
          <ThrowError message="콜백 테스트 에러" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: '콜백 테스트 에러' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('커스텀 fallback', () => {
    it('커스텀 fallback 컴포넌트를 렌더링해야 한다', () => {
      const CustomFallback = <Text>커스텀 에러 화면</Text>;

      const { getByText, queryByText } = renderWithTheme(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('커스텀 에러 화면')).toBeTruthy();
      // 기본 fallback은 표시되지 않아야 함
      expect(queryByText('문제가 발생했어요')).toBeNull();
    });
  });

  describe('리트라이 동작', () => {
    it('"다시 시도" 버튼 클릭 시 에러 상태가 리셋되어야 한다', () => {
      // 첫 번째 렌더에서 에러, 두 번째에서 정상을 위해 카운터 사용
      let shouldThrow = true;

      function ConditionalError() {
        if (shouldThrow) {
          throw new Error('조건부 에러');
        }
        return <Text>복구 성공</Text>;
      }

      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      // 에러 상태 확인
      expect(getByText('문제가 발생했어요')).toBeTruthy();

      // 에러 조건 해제 후 리트라이
      shouldThrow = false;
      fireEvent.press(getByText('다시 시도'));

      // 복구 확인
      expect(getByText('복구 성공')).toBeTruthy();
    });

    it('"다시 시도" 버튼 클릭 시 Haptics가 호출되어야 한다', () => {
      const Haptics = require('expo-haptics');

      const { getByText } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.press(getByText('다시 시도'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 fallback UI가 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
        true
      );

      expect(getByTestId('error-boundary')).toBeTruthy();
      expect(getByText('문제가 발생했어요')).toBeTruthy();
    });
  });
});
