/**
 * QRCodeDisplay 컴포넌트 테스트
 *
 * QR 코드 표시 + 공유 기능
 */

import React from 'react';
import { Share } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
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
import { QRCodeDisplay } from '../../../components/common/QRCodeDisplay';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>,
  );
}

describe('QRCodeDisplay', () => {
  const defaultUrl = 'https://yiroom.app/share/abc123';

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} />,
    );
    expect(getByTestId('qr-code-display')).toBeTruthy();
  });

  it('URL이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} />,
    );
    expect(getByText(defaultUrl)).toBeTruthy();
  });

  it('타이틀이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} title="공유 QR" />,
    );
    expect(getByText('공유 QR')).toBeTruthy();
  });

  it('설명이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} description="친구에게 공유하세요" />,
    );
    expect(getByText('친구에게 공유하세요')).toBeTruthy();
  });

  it('로딩 상태에서 ActivityIndicator가 표시된다', () => {
    const { queryByTestId, queryByText } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} isLoading />,
    );
    // 로딩 중에는 공유 버튼이 없음
    expect(queryByTestId('qr-share-button')).toBeNull();
    // URL 표시도 없음
    expect(queryByText(defaultUrl)).toBeNull();
  });

  it('에러 상태에서 에러 메시지가 표시된다', () => {
    const { getByText, queryByTestId } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} error="QR 생성 실패" />,
    );
    expect(getByText('QR 생성 실패')).toBeTruthy();
    // 에러 시 공유 버튼 없음
    expect(queryByTestId('qr-share-button')).toBeNull();
  });

  it('공유 버튼이 표시된다', () => {
    const { getByTestId } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} />,
    );
    expect(getByTestId('qr-share-button')).toBeTruthy();
  });

  it('공유 버튼 클릭 시 Share.share가 호출된다', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);

    const { getByTestId } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} title="테스트 QR" />,
    );
    fireEvent.press(getByTestId('qr-share-button'));

    expect(shareSpy).toHaveBeenCalledWith({
      message: defaultUrl,
      title: '테스트 QR',
    });

    shareSpy.mockRestore();
  });

  it('접근성 라벨이 올바르다', () => {
    const { getByLabelText } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} title="내 QR" />,
    );
    expect(getByLabelText('QR 코드: 내 QR')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <QRCodeDisplay value={defaultUrl} />,
      true,
    );
    expect(getByTestId('qr-code-display')).toBeTruthy();
  });
});
