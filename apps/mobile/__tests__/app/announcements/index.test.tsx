import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  gradeColors,
  lightColors,
  moduleColors,
  nutrientColors,
  radii,
  scoreColors,
  shadows,
  spacing,
  statusColors,
  trustColors,
  typography,
} from '../../../lib/theme/tokens';

const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: mockLimit }),
        }),
      }),
    }),
  }),
}));

import AnnouncementsScreen from '../../../app/announcements';

const themeValue: ThemeContextValue = {
  colors: lightColors,
  brand,
  module: moduleColors,
  status: statusColors,
  spacing,
  radii,
  shadows,
  typography,
  isDark: false,
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: jest.fn(),
  grade: gradeColors,
  nutrient: nutrientColors,
  score: scoreColors,
  trust: trustColors,
};

describe('AnnouncementsScreen 출시 폴백 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  it('DB가 비었을 때 실제 뷰티 기능만 소개한다', async () => {
    const screen = render(
      <ThemeContext.Provider value={themeValue}>
        <AnnouncementsScreen />
      </ThemeContext.Provider>
    );

    await waitFor(() => expect(screen.getByText('이룸에 오신 것을 환영해요!')).toBeTruthy());
    fireEvent.press(screen.getByText('이룸에 오신 것을 환영해요!'));

    expect(screen.getByText(/AI 뷰티 분석 서비스/)).toBeTruthy();
    expect(screen.getByText(/헤어, 메이크업 분석/)).toBeTruthy();
    expect(screen.queryByText(/통합 웰니스 플랫폼/)).toBeNull();
    expect(screen.queryByText(/맞춤 운동·영양 플랜/)).toBeNull();
  });
});
