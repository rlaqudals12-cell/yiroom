/**
 * AITransparencyNotice 컴포넌트 테스트
 *
 * AI 기본법 제31조 준수 — AI 기술 사용 고지
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
import { AITransparencyNotice } from '../../../components/common/AITransparencyNotice';

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

describe('AITransparencyNotice', () => {
  describe('full 모드 (기본)', () => {
    it('제목을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<AITransparencyNotice />);
      expect(getByText('AI 기술 사용 안내')).toBeTruthy();
    });

    it('상세 설명을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<AITransparencyNotice />);
      expect(getByText(/Google Gemini AI/)).toBeTruthy();
      expect(getByText(/전문가 상담을 권장/)).toBeTruthy();
    });

    it('testID가 ai-transparency-notice여야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice />);
      expect(getByTestId('ai-transparency-notice')).toBeTruthy();
    });

    it('접근성 라벨이 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice />);
      const notice = getByTestId('ai-transparency-notice');
      expect(notice.props.accessibilityLabel).toContain('AI 기술 사용 안내');
    });

    it('아이콘 원형 영역이 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice />);
      const notice = getByTestId('ai-transparency-notice');
      // View (container) → View (iconCircle) + View (textContainer)
      expect(notice.children.length).toBe(2);
    });

    it('다크모드에서 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice />, true);
      expect(getByTestId('ai-transparency-notice')).toBeTruthy();
    });
  });

  describe('compact 모드', () => {
    it('짧은 메시지를 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(<AITransparencyNotice compact />);
      expect(getByText(/AI 기술을 사용하여 분석 결과를 제공/)).toBeTruthy();
    });

    it('testID가 ai-transparency-notice-compact여야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice compact />);
      expect(getByTestId('ai-transparency-notice-compact')).toBeTruthy();
    });

    it('접근성 라벨이 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<AITransparencyNotice compact />);
      const notice = getByTestId('ai-transparency-notice-compact');
      expect(notice.props.accessibilityLabel).toContain('AI 기술 사용 안내');
    });

    it('다크모드에서 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AITransparencyNotice compact />,
        true
      );
      expect(getByTestId('ai-transparency-notice-compact')).toBeTruthy();
    });
  });
});
