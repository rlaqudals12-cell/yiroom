/**
 * FeedCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FeedCard } from '../../../components/social/FeedCard';

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

const defaultProps = {
  id: '1',
  userName: '김민수',
  content: '오늘 운동 완료!',
  timeAgo: '5분 전',
  likeCount: 10,
  commentCount: 3,
};

describe('FeedCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FeedCard {...defaultProps} />);
    expect(getByTestId('feed-card')).toBeTruthy();
  });

  it('사용자 이름과 내용을 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedCard {...defaultProps} />);
    expect(getByText('김민수')).toBeTruthy();
    expect(getByText('오늘 운동 완료!')).toBeTruthy();
  });

  it('좋아요 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedCard {...defaultProps} />);
    expect(getByText('10')).toBeTruthy();
  });

  it('댓글 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<FeedCard {...defaultProps} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('좋아요 전 빈 하트가 표시된다', () => {
    const { getByText } = renderWithTheme(<FeedCard {...defaultProps} isLiked={false} />);
    expect(getByText('🤍')).toBeTruthy();
  });

  it('좋아요 후 빨간 하트가 표시된다', () => {
    const { getByText } = renderWithTheme(<FeedCard {...defaultProps} isLiked />);
    expect(getByText('❤️')).toBeTruthy();
  });

  it('onLike 콜백이 호출된다', () => {
    const onLike = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FeedCard {...defaultProps} onLike={onLike} />,
    );
    fireEvent.press(getByLabelText('좋아요 10개'));
    expect(onLike).toHaveBeenCalledWith('1');
  });

  it('onComment 콜백이 호출된다', () => {
    const onComment = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FeedCard {...defaultProps} onComment={onComment} />,
    );
    fireEvent.press(getByLabelText('댓글 3개'));
    expect(onComment).toHaveBeenCalledWith('1');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FeedCard {...defaultProps} />);
    expect(getByLabelText('김민수님의 게시물: 오늘 운동 완료!')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FeedCard {...defaultProps} />, true);
    expect(getByTestId('feed-card')).toBeTruthy();
  });
});
