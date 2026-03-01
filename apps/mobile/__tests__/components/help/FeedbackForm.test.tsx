/**
 * FeedbackForm 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FeedbackForm } from '../../../components/help/FeedbackForm';

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

describe('FeedbackForm', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FeedbackForm />);
    expect(getByTestId('feedback-form')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedbackForm />);
    expect(getByText('피드백 보내기')).toBeTruthy();
  });

  it('카테고리를 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedbackForm />);
    expect(getByText('버그 신고')).toBeTruthy();
    expect(getByText('기능 요청')).toBeTruthy();
    expect(getByText('개선 제안')).toBeTruthy();
    expect(getByText('기타')).toBeTruthy();
  });

  it('입력 필드가 있다', () => {
    const { getByTestId } = renderWithTheme(<FeedbackForm />);
    expect(getByTestId('feedback-title-input')).toBeTruthy();
    expect(getByTestId('feedback-content-input')).toBeTruthy();
  });

  it('제출 버튼을 누르면 onSubmit이 호출된다', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderWithTheme(<FeedbackForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('feedback-title-input'), '테스트 제목');
    fireEvent.changeText(getByTestId('feedback-content-input'), '테스트 내용입니다');
    fireEvent.press(getByTestId('feedback-submit-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      category: 'improvement',
      title: '테스트 제목',
      content: '테스트 내용입니다',
    });
  });

  it('제출 중 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedbackForm isSubmitting />);
    expect(getByText('보내는 중...')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(<FeedbackForm />);
    expect(getByLabelText('피드백 작성')).toBeTruthy();
    expect(getByLabelText('피드백 제목')).toBeTruthy();
    expect(getByLabelText('피드백 내용')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FeedbackForm />, true);
    expect(getByTestId('feedback-form')).toBeTruthy();
  });
});
