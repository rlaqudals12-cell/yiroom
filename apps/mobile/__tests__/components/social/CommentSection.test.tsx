/**
 * CommentSection 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { CommentSection, type Comment } from '../../../components/social/CommentSection';

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

const mockComments: Comment[] = [
  { id: '1', userName: '김민수', content: '대단해요!', timeAgo: '5분 전' },
  { id: '2', userName: '이지은', content: '화이팅!', timeAgo: '10분 전' },
];

describe('CommentSection', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CommentSection comments={mockComments} />);
    expect(getByTestId('comment-section')).toBeTruthy();
  });

  it('댓글 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<CommentSection comments={mockComments} />);
    expect(getByText('댓글 2')).toBeTruthy();
  });

  it('댓글 내용을 표시한다', () => {
    const { getByText } = renderWithTheme(<CommentSection comments={mockComments} />);
    expect(getByText('대단해요!')).toBeTruthy();
    expect(getByText('화이팅!')).toBeTruthy();
  });

  it('입력 필드가 있다', () => {
    const { getByTestId } = renderWithTheme(
      <CommentSection comments={mockComments} onSubmit={jest.fn()} />,
    );
    expect(getByTestId('comment-input')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<CommentSection comments={mockComments} />);
    expect(getByLabelText('댓글 2개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CommentSection comments={mockComments} />, true);
    expect(getByTestId('comment-section')).toBeTruthy();
  });
});
