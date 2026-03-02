/**
 * InfoTooltip 공통 컴포넌트 테스트
 *
 * 도움말 툴팁: children 옆 (i) 아이콘을 누르면 말풍선 토글.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { Text } from 'react-native';
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
import { InfoTooltip } from '../../../components/common/InfoTooltip';

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트
// ============================================================

describe('InfoTooltip', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <InfoTooltip text="도움말 내용입니다.">
        <Text>라벨</Text>
      </InfoTooltip>,
    );

    expect(getByTestId('info-tooltip')).toBeTruthy();
  });

  it('children을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <InfoTooltip text="도움말 내용입니다.">
        <Text>수분 지수</Text>
      </InfoTooltip>,
    );

    expect(getByText('수분 지수')).toBeTruthy();
  });

  it('도움말 아이콘이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <InfoTooltip text="도움말 내용입니다.">
        <Text>라벨</Text>
      </InfoTooltip>,
    );

    expect(getByLabelText('도움말 보기')).toBeTruthy();
  });

  it('아이콘 클릭시 툴팁이 표시된다', () => {
    const { getByLabelText, getByText, queryByText } = renderWithTheme(
      <InfoTooltip text="이 점수는 피부 수분량을 나타내요.">
        <Text>수분 지수</Text>
      </InfoTooltip>,
    );

    // 초기 상태: 툴팁 텍스트 미표시
    expect(queryByText('이 점수는 피부 수분량을 나타내요.')).toBeNull();

    // 아이콘 클릭
    fireEvent.press(getByLabelText('도움말 보기'));

    // 툴팁 텍스트 표시
    expect(getByText('이 점수는 피부 수분량을 나타내요.')).toBeTruthy();
  });

  it('다시 클릭시 툴팁이 사라진다', () => {
    const { getByLabelText, queryByText } = renderWithTheme(
      <InfoTooltip text="이 점수는 피부 수분량을 나타내요.">
        <Text>수분 지수</Text>
      </InfoTooltip>,
    );

    const iconButton = getByLabelText('도움말 보기');

    // 첫 번째 클릭: 표시
    fireEvent.press(iconButton);
    expect(queryByText('이 점수는 피부 수분량을 나타내요.')).toBeTruthy();

    // 두 번째 클릭: 숨김
    fireEvent.press(iconButton);
    expect(queryByText('이 점수는 피부 수분량을 나타내요.')).toBeNull();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <InfoTooltip text="다크모드 도움말">
        <Text>다크모드 라벨</Text>
      </InfoTooltip>,
      true,
    );

    expect(getByTestId('info-tooltip')).toBeTruthy();
    expect(getByText('다크모드 라벨')).toBeTruthy();
  });
});
