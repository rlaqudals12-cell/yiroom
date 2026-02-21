/**
 * OfflineBanner 컴포넌트 테스트
 *
 * 네트워크 상태에 따른 배너 표시, 동기화 버튼 동작 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
import { OfflineBanner } from '../../../components/common/OfflineBanner';

// useNetworkStatus 모킹
const mockUseNetworkStatus = jest.fn(() => ({ isConnected: true }));
jest.mock('../../../lib/offline', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
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

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본값: 온라인 상태
    mockUseNetworkStatus.mockReturnValue({ isConnected: true });
  });

  describe('온라인 + 동기화 대기 없음', () => {
    it('배너가 렌더링되지 않아야 한다 (null 반환)', () => {
      const { queryByTestId } = renderWithTheme(
        <OfflineBanner pendingCount={0} />
      );

      expect(queryByTestId('offline-banner')).toBeNull();
    });

    it('pendingCount 미지정 시에도 배너가 렌더링되지 않아야 한다', () => {
      const { queryByTestId } = renderWithTheme(<OfflineBanner />);

      expect(queryByTestId('offline-banner')).toBeNull();
    });
  });

  describe('오프라인 상태', () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({ isConnected: false });
    });

    it('오프라인 배너가 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<OfflineBanner />);

      expect(getByTestId('offline-banner')).toBeTruthy();
    });

    it('"오프라인 모드" 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<OfflineBanner />);

      expect(getByText('오프라인 모드')).toBeTruthy();
    });

    it('"인터넷 연결을 확인해주세요" 안내 메시지가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<OfflineBanner />);

      expect(getByText('인터넷 연결을 확인해주세요')).toBeTruthy();
    });

    it('오프라인 상태에서는 동기화 버튼이 표시되지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={jest.fn()} />
      );

      expect(queryByText('동기화')).toBeNull();
    });
  });

  describe('온라인 + 동기화 대기 있음', () => {
    it('"동기화 대기 중" 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={5} />
      );

      expect(getByText('동기화 대기 중')).toBeTruthy();
    });

    it('동기화 필요 항목 수가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={5} />
      );

      expect(getByText('5개 항목 동기화 필요')).toBeTruthy();
    });

    it('동기화 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={jest.fn()} />
      );

      expect(getByText('동기화')).toBeTruthy();
    });

    it('동기화 버튼 클릭 시 onSync 콜백이 호출되어야 한다', () => {
      const onSync = jest.fn();
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={onSync} />
      );

      fireEvent.press(getByText('동기화'));

      expect(onSync).toHaveBeenCalledTimes(1);
    });

    it('동기화 버튼 클릭 시 Haptics가 호출되어야 한다', () => {
      const Haptics = require('expo-haptics');
      const onSync = jest.fn();
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={onSync} />
      );

      fireEvent.press(getByText('동기화'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('testID="offline-banner"가 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <OfflineBanner pendingCount={2} />
      );

      expect(getByTestId('offline-banner')).toBeTruthy();
    });
  });

  describe('동기화 중 상태', () => {
    it('isSyncing=true이면 "동기화 중..." 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={jest.fn()} isSyncing={true} />
      );

      expect(getByText('동기화 중...')).toBeTruthy();
    });

    it('isSyncing=true이면 동기화 버튼이 비활성화되어야 한다', () => {
      const onSync = jest.fn();
      const { getByText } = renderWithTheme(
        <OfflineBanner pendingCount={3} onSync={onSync} isSyncing={true} />
      );

      // disabled 상태에서 press 시 onSync가 호출되지 않아야 함
      fireEvent.press(getByText('동기화 중...'));
      expect(onSync).not.toHaveBeenCalled();
    });
  });

  describe('다크 모드', () => {
    it('오프라인 상태에서 다크 모드 배너가 렌더링되어야 한다', () => {
      mockUseNetworkStatus.mockReturnValue({ isConnected: false });

      const { getByText, getByTestId } = renderWithTheme(
        <OfflineBanner />,
        true
      );

      expect(getByTestId('offline-banner')).toBeTruthy();
      expect(getByText('오프라인 모드')).toBeTruthy();
    });
  });
});
