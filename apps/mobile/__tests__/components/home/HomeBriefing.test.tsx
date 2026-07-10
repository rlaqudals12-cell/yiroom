/**
 * HomeBriefing 아침 브리핑 알림 1회 제안 렌더링 테스트 (ADR-114/118)
 *
 * 초점: 브리핑 조회 후 인라인 제안이 shouldShowProposal에 따라 노출/숨김되고,
 * 수락/닫기 핸들러가 훅으로 위임되는지. 브리핑 문장 조립은 서버(useBriefing) 소관이라 mock.
 */
import React from 'react';
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
import type { BriefingData } from '../../../lib/api/briefing';

// useBriefing mock — 분석 있는 사용자의 최소 브리핑 데이터
const mockBriefingData: BriefingData = {
  date: '2026-07-10',
  timeSlot: 'morning',
  briefing: { greeting: '좋은 아침이에요', advice: [], closing: '오늘도 화이팅' },
  myColors: null,
  todayStyle: { fashionTip: null, outfit: null },
  hasAnalyses: true,
};

const mockUseBriefing = jest.fn(() => ({
  data: mockBriefingData,
  stale: false,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
jest.mock('../../../hooks/useBriefing', () => ({
  useBriefing: () => mockUseBriefing(),
}));

// useMorningBriefing mock — 제안 상태/핸들러 제어
const mockAcceptProposal = jest.fn().mockResolvedValue(true);
const mockDismissProposal = jest.fn().mockResolvedValue(undefined);
let mockMorningState = {
  settings: { enabled: false, hour: 7, minute: 30 },
  isLoading: false,
  enable: jest.fn(),
  disable: jest.fn(),
  setTime: jest.fn(),
  shouldShowProposal: true,
  acceptProposal: mockAcceptProposal,
  dismissProposal: mockDismissProposal,
};
jest.mock('../../../lib/notifications/useMorningBriefing', () => ({
  useMorningBriefing: () => mockMorningState,
}));

import { HomeBriefing } from '../../../components/home/HomeBriefing';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeContext.Provider value={createThemeValue()}>{ui}</ThemeContext.Provider>);
}

describe('HomeBriefing 아침 브리핑 제안', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMorningState = {
      settings: { enabled: false, hour: 7, minute: 30 },
      isLoading: false,
      enable: jest.fn(),
      disable: jest.fn(),
      setTime: jest.fn(),
      shouldShowProposal: true,
      acceptProposal: mockAcceptProposal,
      dismissProposal: mockDismissProposal,
    };
  });

  it('shouldShowProposal=true면 제안을 노출한다', () => {
    const { getByTestId, getByText } = renderWithTheme(<HomeBriefing />);
    expect(getByTestId('home-briefing-proposal')).toBeTruthy();
    expect(getByText('매일 아침 브리핑을 알려드릴까요?')).toBeTruthy();
  });

  it('수락 시 acceptProposal을 호출한다', () => {
    const { getByTestId } = renderWithTheme(<HomeBriefing />);
    fireEvent.press(getByTestId('home-briefing-proposal-accept'));
    expect(mockAcceptProposal).toHaveBeenCalledTimes(1);
  });

  it('닫기 시 dismissProposal을 호출한다', () => {
    const { getByTestId } = renderWithTheme(<HomeBriefing />);
    fireEvent.press(getByTestId('home-briefing-proposal-dismiss'));
    expect(mockDismissProposal).toHaveBeenCalledTimes(1);
  });

  it('shouldShowProposal=false면 제안을 숨긴다(1회성)', () => {
    mockMorningState = { ...mockMorningState, shouldShowProposal: false };
    const { queryByTestId } = renderWithTheme(<HomeBriefing />);
    expect(queryByTestId('home-briefing-proposal')).toBeNull();
  });

  it('브리핑 데이터가 없으면(분석 0건) 아무것도 렌더하지 않는다', () => {
    mockUseBriefing.mockReturnValueOnce({
      data: null as unknown as BriefingData,
      stale: false,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { queryByTestId } = renderWithTheme(<HomeBriefing />);
    expect(queryByTestId('home-briefing')).toBeNull();
    expect(queryByTestId('home-briefing-proposal')).toBeNull();
  });
});
