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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// useBriefing mock — 분석 있는 사용자의 최소 브리핑 데이터
const mockBriefingData: BriefingData = {
  date: '2026-07-10',
  timeSlot: 'morning',
  briefing: { greeting: '좋은 아침이에요', advice: [], closing: '오늘도 화이팅' },
  myColors: null,
  todayStyle: { fashionTip: null, outfit: null },
  hasAnalyses: true,
};

const mockBriefingState = {
  data: mockBriefingData,
  stale: false,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};

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
    const { getByTestId, getByText } = renderWithTheme(
      <HomeBriefing briefingState={mockBriefingState} />
    );
    expect(getByTestId('home-briefing-proposal')).toBeTruthy();
    expect(getByText('매일 아침 브리핑을 알려드릴까요?')).toBeTruthy();
  });

  it('수락 시 acceptProposal을 호출한다', () => {
    const { getByTestId } = renderWithTheme(<HomeBriefing briefingState={mockBriefingState} />);
    fireEvent.press(getByTestId('home-briefing-proposal-accept'));
    expect(mockAcceptProposal).toHaveBeenCalledTimes(1);
  });

  it('닫기 시 dismissProposal을 호출한다', () => {
    const { getByTestId } = renderWithTheme(<HomeBriefing briefingState={mockBriefingState} />);
    fireEvent.press(getByTestId('home-briefing-proposal-dismiss'));
    expect(mockDismissProposal).toHaveBeenCalledTimes(1);
  });

  it('shouldShowProposal=false면 제안을 숨긴다(1회성)', () => {
    mockMorningState = { ...mockMorningState, shouldShowProposal: false };
    const { queryByTestId } = renderWithTheme(<HomeBriefing briefingState={mockBriefingState} />);
    expect(queryByTestId('home-briefing-proposal')).toBeNull();
  });

  it('브리핑 데이터가 없으면(분석 0건) 아무것도 렌더하지 않는다', () => {
    const { queryByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data: null }} />
    );
    expect(queryByTestId('home-briefing')).toBeNull();
    expect(queryByTestId('home-briefing-proposal')).toBeNull();
  });

  it('퍼스널컬러 밴드 전체를 해당 저장 결과로 연결한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      myColors: {
        analysisId: 'pc-history-1',
        colors: [
          { name: '모브', hex: '#A78B9B' },
          { name: '라이트 핑크', hex: '#F8C8DC' },
        ],
      },
    };
    const { getByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    fireEvent.press(getByTestId('home-briefing-my-colors-link'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(analysis)/personal-color/result',
      params: { historyId: 'pc-history-1' },
    });
  });

  it('저장 결과 ID가 없으면 밴드의 이동 어포던스를 제거한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      myColors: {
        analysisId: '',
        colors: [{ name: '모브', hex: '#A78B9B' }],
      },
    };
    const { getByTestId, queryByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    expect(getByTestId('home-briefing-my-colors-static')).toBeTruthy();
    expect(queryByTestId('home-briefing-my-colors-link')).toBeNull();
  });

  it('서버가 보유 의류 코디를 주면 내 옷 사진 4장을 표시하고 코디 화면으로 이동한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      todayStyle: {
        fashionTip: null,
        outfit: null,
        closetItemCount: 4,
        closetOutfit: {
          items: ['상의', '하의', '신발', '가방'].map((role, index) => ({
            id: `item-${index}`,
            name: `내 옷 ${index + 1}`,
            imageUrl: `https://signed.example/item-${index}.jpg?token=private`,
            role,
          })),
          warnings: [],
        },
      },
    };
    const { getByTestId, getAllByTestId, queryByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    expect(getAllByTestId('home-briefing-closet-outfit-image')).toHaveLength(4);
    expect(queryByTestId('home-briefing-outfit')).toBeNull();
    fireEvent.press(getByTestId('home-briefing-style-link'));
    expect(mockPush).toHaveBeenCalledWith('/(closet)/recommend');
  });

  it('실제 빈 옷장은 기존 팔레트와 등록 유도 한 줄을 유지하고 등록 화면으로 이동한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      todayStyle: {
        fashionTip: null,
        outfit: {
          baseName: '모브 상의 + 라이트 핑크 하의',
          colors: [
            { role: '상의', name: '모브', hex: '#A78B9B' },
            { role: '하의', name: '라이트 핑크', hex: '#F8C8DC' },
          ],
        },
        closetItemCount: 0,
        closetOutfit: null,
      },
    };
    const { getByTestId, getByText } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    expect(getByTestId('home-briefing-outfit')).toBeTruthy();
    expect(getByText('옷을 등록하면 내 옷으로 오늘의 코디를 준비해드려요.')).toBeTruthy();
    fireEvent.press(getByTestId('home-briefing-style-link'));
    expect(mockPush).toHaveBeenCalledWith('/(closet)/add');
  });

  it('옷이 3장보다 적으면 팔레트를 유지하고 옷 등록 화면으로 연결한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      todayStyle: {
        fashionTip: null,
        outfit: {
          baseName: '모브 상의 + 라이트 핑크 하의',
          colors: [
            { role: '상의', name: '모브', hex: '#A78B9B' },
            { role: '하의', name: '라이트 핑크', hex: '#F8C8DC' },
          ],
        },
        closetItemCount: 2,
        closetOutfit: null,
        closetNeedsMoreItems: true,
      },
    };
    const { getByLabelText, getByTestId, queryByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    expect(queryByTestId('home-briefing-closet-outfit')).toBeNull();
    expect(getByTestId('home-briefing-outfit')).toBeTruthy();
    expect(getByTestId('home-briefing-closet-incomplete')).toHaveTextContent(
      '오늘의 코디를 완성하려면 옷을 조금 더 등록해주세요.'
    );
    fireEvent.press(getByLabelText('옷 등록하기'));
    expect(mockPush).toHaveBeenCalledWith('/(closet)/add');
  });

  it('서명 이미지가 하나라도 실패하면 사진 코디를 숨기고 팔레트로 대체한다', () => {
    const data: BriefingData = {
      ...mockBriefingData,
      todayStyle: {
        fashionTip: null,
        outfit: {
          baseName: '모브 상의 + 라이트 핑크 하의',
          colors: [
            { role: '상의', name: '모브', hex: '#A78B9B' },
            { role: '하의', name: '라이트 핑크', hex: '#F8C8DC' },
          ],
        },
        closetItemCount: 3,
        closetOutfit: {
          items: ['상의', '하의', '신발'].map((role, index) => ({
            id: `item-${index}`,
            name: `내 옷 ${index + 1}`,
            imageUrl: `https://signed.example/item-${index}.jpg?token=private`,
            role,
          })),
          warnings: [],
        },
      },
    };
    const { getAllByTestId, getByTestId, queryByTestId } = renderWithTheme(
      <HomeBriefing briefingState={{ ...mockBriefingState, data }} />
    );

    fireEvent(getAllByTestId('home-briefing-closet-outfit-image')[0], 'error');

    expect(queryByTestId('home-briefing-closet-outfit')).toBeNull();
    expect(getByTestId('home-briefing-outfit')).toBeTruthy();
    expect(getByTestId('home-briefing-closet-image-unavailable')).toHaveTextContent(
      '옷 사진을 불러오지 못해 오늘의 배색으로 보여드려요.'
    );
  });
});
