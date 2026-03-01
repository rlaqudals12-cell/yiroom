/**
 * AnnouncementCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { AnnouncementCard } from '../../../components/announcements/AnnouncementCard';

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

describe('AnnouncementCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="서비스 업데이트" date="2026-03-01" />,
    );
    expect(getByTestId('announcement-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="서비스 업데이트" date="2026-03-01" />,
    );
    expect(getByText('서비스 업데이트')).toBeTruthy();
  });

  it('타입 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnnouncementCard id="1" type="update" title="새 기능" date="2026-03-01" />,
    );
    expect(getByText('업데이트')).toBeTruthy();
  });

  it('날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="제목" date="2026-03-01" />,
    );
    expect(getByText('2026-03-01')).toBeTruthy();
  });

  it('요약을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="제목" summary="이번 업데이트 요약" date="2026-03-01" />,
    );
    expect(getByText('이번 업데이트 요약')).toBeTruthy();
  });

  it('누르면 onPress가 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="제목" date="2026-03-01" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('announcement-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('고정 공지 접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="중요 공지" date="2026-03-01" isPinned />,
    );
    expect(getByLabelText('공지: 중요 공지, 고정됨')).toBeTruthy();
  });

  it('타입별 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnnouncementCard id="1" type="event" title="이벤트" date="2026-03-01" />,
    );
    expect(getByText('🎉')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AnnouncementCard id="1" type="notice" title="제목" date="2026-03-01" />,
      true,
    );
    expect(getByTestId('announcement-card')).toBeTruthy();
  });
});
