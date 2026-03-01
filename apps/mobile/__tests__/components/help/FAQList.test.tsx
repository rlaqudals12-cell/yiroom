/**
 * FAQList 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FAQList } from '../../../components/help/FAQList';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

const mockFAQs = [
  { id: '1', question: '퍼스널컬러 분석은 어떻게 하나요?', answer: '카메라로 얼굴을 촬영하면 AI가 분석합니다.', category: '분석' },
  { id: '2', question: '결과를 공유할 수 있나요?', answer: '분석 결과 화면에서 공유 버튼을 누르세요.' },
];

describe('FAQList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(getByTestId('faq-list')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(getByText('자주 묻는 질문')).toBeTruthy();
  });

  it('질문을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(getByText('퍼스널컬러 분석은 어떻게 하나요?')).toBeTruthy();
    expect(getByText('결과를 공유할 수 있나요?')).toBeTruthy();
  });

  it('질문을 누르면 답변이 표시된다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(queryByText('카메라로 얼굴을 촬영하면 AI가 분석합니다.')).toBeNull();
    fireEvent.press(getByText('퍼스널컬러 분석은 어떻게 하나요?'));
    expect(getByText('카메라로 얼굴을 촬영하면 AI가 분석합니다.')).toBeTruthy();
  });

  it('카테고리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(getByText('분석')).toBeTruthy();
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FAQList items={[]} />,
    );
    expect(getByText('등록된 FAQ가 없습니다')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <FAQList items={mockFAQs} />,
    );
    expect(getByLabelText('자주 묻는 질문 2개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FAQList items={mockFAQs} />,
      true,
    );
    expect(getByTestId('faq-list')).toBeTruthy();
  });
});
