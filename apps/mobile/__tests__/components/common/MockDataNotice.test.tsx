/**
 * MockDataNotice 컴포넌트 테스트
 *
 * AI 분석 실패 시 fallback Mock 데이터 고지
 */

import React from 'react';
import { render } from '@testing-library/react-native';

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
import { MockDataNotice } from '../../../components/common/MockDataNotice';

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
    </ThemeContext.Provider>
  );
}

describe('MockDataNotice', () => {
  describe('full 모드 (기본)', () => {
    it('제목을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<MockDataNotice />);
      expect(getByText('임시 데이터 표시 중')).toBeTruthy();
    });

    it('상세 설명을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<MockDataNotice />);
      expect(getByText(/샘플 결과를 표시합니다/)).toBeTruthy();
    });

    it('testID가 mock-data-notice여야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice />);
      expect(getByTestId('mock-data-notice')).toBeTruthy();
    });

    it('accessibilityRole이 alert여야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice />);
      const notice = getByTestId('mock-data-notice');
      expect(notice.props.accessibilityRole).toBe('alert');
    });

    it('접근성 라벨이 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice />);
      const notice = getByTestId('mock-data-notice');
      expect(notice.props.accessibilityLabel).toContain('임시 데이터 표시 중');
    });

    it('아이콘 원형 영역이 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice />);
      const notice = getByTestId('mock-data-notice');
      // View (container) → View (iconCircle) + View (textContainer)
      expect(notice.children.length).toBe(2);
    });

    it('다크모드에서 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice />, true);
      expect(getByTestId('mock-data-notice')).toBeTruthy();
    });
  });

  describe('compact 모드', () => {
    it('샘플 결과 라벨을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<MockDataNotice compact />);
      expect(getByText('샘플 결과')).toBeTruthy();
    });

    it('testID가 mock-data-notice-compact여야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice compact />);
      expect(getByTestId('mock-data-notice-compact')).toBeTruthy();
    });

    it('accessibilityRole이 alert여야 한다', () => {
      const { getByTestId } = renderWithTheme(<MockDataNotice compact />);
      const notice = getByTestId('mock-data-notice-compact');
      expect(notice.props.accessibilityRole).toBe('alert');
    });

    it('다크모드에서 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <MockDataNotice compact />,
        true
      );
      expect(getByTestId('mock-data-notice-compact')).toBeTruthy();
    });
  });
});
