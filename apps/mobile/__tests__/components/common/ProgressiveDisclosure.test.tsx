/**
 * ProgressiveDisclosure 컴포넌트 테스트
 *
 * 점진적 공개 (더 보기/접기) 패턴
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
import { ProgressiveDisclosure } from '../../../components/common/ProgressiveDisclosure';

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

describe('ProgressiveDisclosure', () => {
  const summary = <Text>요약 내용</Text>;
  const detail = <Text>상세 내용</Text>;

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    expect(getByTestId('progressive-disclosure')).toBeTruthy();
  });

  it('요약 내용이 항상 보인다', () => {
    const { getByText } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    expect(getByText('요약 내용')).toBeTruthy();
  });

  it('초기 상태에서 상세 내용이 숨겨져 있다', () => {
    const { queryByText } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    expect(queryByText('상세 내용')).toBeNull();
  });

  it('토글 버튼에 기본 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    expect(getByText('자세히 보기')).toBeTruthy();
  });

  it('토글 클릭 시 상세가 보인다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    fireEvent.press(getByTestId('progressive-disclosure-toggle'));
    expect(getByText('상세 내용')).toBeTruthy();
    expect(getByText('접기')).toBeTruthy();
  });

  it('두 번 토글하면 상세가 다시 숨겨진다', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
    );
    const toggle = getByTestId('progressive-disclosure-toggle');
    fireEvent.press(toggle);
    fireEvent.press(toggle);
    expect(queryByText('상세 내용')).toBeNull();
  });

  it('onToggle 콜백이 호출된다', () => {
    const onToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ProgressiveDisclosure
        summary={summary}
        detail={detail}
        onToggle={onToggle}
      />,
    );
    fireEvent.press(getByTestId('progressive-disclosure-toggle'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('defaultExpanded=true면 상세가 바로 보인다', () => {
    const { getByText } = renderWithTheme(
      <ProgressiveDisclosure
        summary={summary}
        detail={detail}
        defaultExpanded
      />,
    );
    expect(getByText('상세 내용')).toBeTruthy();
    expect(getByText('접기')).toBeTruthy();
  });

  it('커스텀 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <ProgressiveDisclosure
        summary={summary}
        detail={detail}
        expandLabel="더 보기"
        collapseLabel="닫기"
      />,
    );
    expect(getByText('더 보기')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProgressiveDisclosure summary={summary} detail={detail} />,
      true,
    );
    expect(getByTestId('progressive-disclosure')).toBeTruthy();
  });
});
