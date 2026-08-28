/**
 * AI 코치 채팅 인터페이스 렌더링 테스트
 *
 * 대상: components/coach/ChatInterface.tsx
 * 의존성: useCoach, useNetworkStatus, useTheme, QUICK_QUESTIONS
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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
import type { CoachMessage } from '../../../lib/coach';
import type { NetworkStatus } from '../../../lib/offline/types';

// ============================================
// Platform Mock (ChatInterface에서 Platform.OS 직접 참조)
// ============================================

const platformMock = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
  Version: '17.0',
  isPad: false,
  isTV: false,
  isVision: false,
  isTesting: true,
  constants: {
    osVersion: '17.0',
    interfaceIdiom: 'phone',
    isTesting: true,
    forceTouchAvailable: false,
    reactNativeVersion: { major: 0, minor: 79, patch: 0 },
    systemName: 'iOS',
  },
};

jest.mock('react-native/Libraries/Utilities/Platform.ios', () => ({
  __esModule: true,
  default: platformMock,
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: platformMock,
}));

// ============================================
// Mock 설정
// ============================================

const mockSendMessage = jest.fn();
const mockClearMessages = jest.fn();

// useCoach mock
jest.mock('../../../lib/coach/useCoach', () => ({
  useCoach: jest.fn(() => ({
    messages: [] as CoachMessage[],
    isLoading: false,
    error: null,
    suggestedQuestions: [
      '오늘 운동 뭐하면 좋을까?',
      '건강한 간식 추천해줘',
      '스킨케어 루틴 알려줘',
    ],
    sessions: [],
    currentSessionId: null,
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
    loadSession: jest.fn(),
    startNewSession: jest.fn(),
  })),
  useBeautyTeamCoach: jest.fn(() => ({
    messages: [] as CoachMessage[],
    isLoading: false,
    error: null,
    suggestedQuestions: ['오늘 뭐 입을까요?', '머리 어떻게 자를까요?', '오늘 화장 어떻게 할까요?'],
    sessions: [],
    currentSessionId: null,
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
    loadSession: jest.fn(),
    startNewSession: jest.fn(),
  })),
}));

// useNetworkStatus mock
// status는 online/offline/unknown, connectionType은 string|null을 오가므로 실제 타입 명시
const mockUseNetworkStatus = jest.fn(
  (): {
    status: NetworkStatus;
    isConnected: boolean;
    connectionType: string | null;
    refresh: () => Promise<void>;
  } => ({
    status: 'online',
    isConnected: true,
    connectionType: 'wifi',
    refresh: jest.fn(),
  })
);

jest.mock('../../../lib/offline', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

// expo-router mock — 스캔 버튼 라우팅 검증용(안정적인 push 참조)
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
}));

// logger mock
jest.mock('../../../lib/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  coachLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  offlineLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { ChatInterface } from '../../../components/coach/ChatInterface';
// useCoach를 다시 import하여 mock 제어
const { useBeautyTeamCoach, useCoach } = require('../../../lib/coach/useCoach');

// ============================================
// 테마 헬퍼
// ============================================

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

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

// ============================================
// 테스트용 메시지 팩토리
// ============================================

function createMessage(
  overrides: Partial<CoachMessage> & { role: 'user' | 'assistant'; content: string }
): CoachMessage {
  return {
    id: `msg-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    ...overrides,
  };
}

// ============================================
// 테스트
// ============================================

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 기본 mock 상태 복원
    const legacyCoachResult = {
      messages: [],
      isLoading: false,
      error: null,
      suggestedQuestions: [
        '오늘 운동 뭐하면 좋을까?',
        '건강한 간식 추천해줘',
        '스킨케어 루틴 알려줘',
      ],
      sessions: [],
      currentSessionId: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      loadSession: jest.fn(),
      startNewSession: jest.fn(),
    };
    (useCoach as jest.Mock).mockReturnValue(legacyCoachResult);
    (useBeautyTeamCoach as jest.Mock).mockReturnValue({
      ...legacyCoachResult,
      suggestedQuestions: [
        '오늘 뭐 입을까요?',
        '머리 어떻게 자를까요?',
        '오늘 화장 어떻게 할까요?',
      ],
    });

    mockUseNetworkStatus.mockReturnValue({
      status: 'online',
      isConnected: true,
      connectionType: 'wifi',
      refresh: jest.fn(),
    });
  });

  describe('기본 렌더링', () => {
    it('채팅 인터페이스를 정상적으로 렌더링한다', () => {
      const { getByTestId } = renderWithTheme(<ChatInterface />);
      expect(getByTestId('chat-interface')).toBeTruthy();
    });

    it('AI 웰니스 코치 헤더를 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('AI 웰니스 코치')).toBeTruthy();
    });

    it('안내 문구를 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('운동, 영양, 피부 관리에 대해 물어보세요!')).toBeTruthy();
    });

    it('메시지 입력 필드를 표시한다', () => {
      const { getByPlaceholderText } = renderWithTheme(<ChatInterface />);
      expect(getByPlaceholderText('무엇이든 물어보세요...')).toBeTruthy();
    });

    it('전송 버튼을 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('전송')).toBeTruthy();
    });
  });

  describe('testID 확인', () => {
    it('chat-interface testID가 존재한다', () => {
      const { getByTestId } = renderWithTheme(<ChatInterface />);
      expect(getByTestId('chat-interface')).toBeTruthy();
    });
  });

  describe('성분 스캔 진입 (ADR-114)', () => {
    it('입력창 옆 스캔 버튼을 렌더링한다', () => {
      const { getByTestId } = renderWithTheme(<ChatInterface />);
      expect(getByTestId('chat-scan-button')).toBeTruthy();
    });

    it('스캔 버튼 클릭 시 /(scan)으로 이동한다', () => {
      const { getByTestId } = renderWithTheme(<ChatInterface />);
      fireEvent.press(getByTestId('chat-scan-button'));
      expect(mockRouterPush).toHaveBeenCalledWith('/(scan)');
    });

    it('메시지가 있을 때도 스캔 버튼이 접근 가능하다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [createMessage({ id: 'u1', role: 'user', content: '안녕' })],
        isLoading: false,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByTestId } = renderWithTheme(<ChatInterface />);
      expect(getByTestId('chat-scan-button')).toBeTruthy();
    });
  });

  describe('빠른 질문', () => {
    it('카테고리 탭을 표시한다 (일반, 운동, 영양, 피부)', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      expect(getByText('일반')).toBeTruthy();
      expect(getByText('운동')).toBeTruthy();
      expect(getByText('영양')).toBeTruthy();
      expect(getByText('피부')).toBeTruthy();
    });

    it('일반 카테고리의 빠른 질문을 표시한다 (기본 선택)', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      expect(getByText('오늘 컨디션 체크해줘')).toBeTruthy();
      expect(getByText('스트레스 해소법 알려줘')).toBeTruthy();
      expect(getByText('숙면을 위한 팁 있어?')).toBeTruthy();
    });

    it('운동 카테고리 탭 클릭 시 운동 질문을 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.press(getByText('운동'));

      expect(getByText('오늘 운동 뭐하면 좋을까?')).toBeTruthy();
      expect(getByText('스트레칭 루틴 추천해줘')).toBeTruthy();
      expect(getByText('운동 후 회복에 좋은 음식은?')).toBeTruthy();
    });

    it('영양 카테고리 탭 클릭 시 영양 질문을 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.press(getByText('영양'));

      expect(getByText('건강한 간식 추천해줘')).toBeTruthy();
      expect(getByText('하루에 물 얼마나 마셔야 해?')).toBeTruthy();
      expect(getByText('단백질 보충 어떻게 하면 좋아?')).toBeTruthy();
    });

    it('피부 카테고리 탭 클릭 시 피부 질문을 표시한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.press(getByText('피부'));

      expect(getByText('스킨케어 루틴 알려줘')).toBeTruthy();
      expect(getByText('자외선 차단 팁 있어?')).toBeTruthy();
      expect(getByText('피부에 좋은 음식 추천해줘')).toBeTruthy();
    });

    it('빠른 질문 클릭 시 sendMessage를 호출한다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.press(getByText('오늘 컨디션 체크해줘'));
      expect(mockSendMessage).toHaveBeenCalledWith('오늘 컨디션 체크해줘');
    });
  });

  describe('물어보기 탭 뷰티팀 게이트 (ADR-114)', () => {
    it('뷰티팀 표면은 웰니스 훅 대신 전용 훅만 선택한다', () => {
      renderWithTheme(<ChatInterface surface="beauty-team" />);

      expect(useBeautyTeamCoach).toHaveBeenCalled();
      expect(useCoach).not.toHaveBeenCalled();
    });

    it('뷰티팀 이력에서 전달된 sessionId를 전용 훅으로 로드한다', async () => {
      const loadSession = jest.fn();
      (useBeautyTeamCoach as jest.Mock).mockReturnValue({
        messages: [],
        isLoading: false,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession,
        startNewSession: jest.fn(),
      });

      renderWithTheme(<ChatInterface surface="beauty-team" initialSessionId="legacy-session-1" />);

      await waitFor(() => expect(loadSession).toHaveBeenCalledWith('legacy-session-1'));
    });

    it('웰니스 정체성 대신 전속 뷰티팀 헤더와 입력 문구를 표시한다', () => {
      const { getByText, getByPlaceholderText, queryByText } = renderWithTheme(
        <ChatInterface surface="beauty-team" />
      );

      expect(getByText('전속 뷰티팀에게 물어보세요')).toBeTruthy();
      expect(getByText('피부·퍼스널컬러·헤어·메이크업·스타일을 편하게 물어보세요.')).toBeTruthy();
      expect(getByPlaceholderText('뷰티팀에게 물어보세요...')).toBeTruthy();
      expect(queryByText('AI 웰니스 코치')).toBeNull();
      expect(queryByText('운동, 영양, 피부 관리에 대해 물어보세요!')).toBeNull();
      expect(queryByText('🤖')).toBeNull();
    });

    it('일반·피부·컬러·스타일만 노출하고 운동·영양 탭과 스트레스·숙면 질문을 숨긴다', () => {
      const { getByTestId, getByText, queryByText } = renderWithTheme(
        <ChatInterface surface="beauty-team" />
      );

      expect(getByText('일반')).toBeTruthy();
      expect(getByText('피부')).toBeTruthy();
      expect(getByText('컬러')).toBeTruthy();
      expect(getByText('스타일')).toBeTruthy();
      expect(queryByText('운동')).toBeNull();
      expect(queryByText('영양')).toBeNull();
      expect(queryByText('스트레스 해소법 알려줘')).toBeNull();
      expect(queryByText('숙면을 위한 팁 있어?')).toBeNull();
      expect(getByText('머리 어떻게 자를까요?')).toBeTruthy();
      expect(queryByText('이 제품이 저한테 맞을까요?')).toBeNull();
      expect(getByTestId('chat-scan-button')).toBeTruthy();
    });

    it('컬러와 스타일 탭은 해당 뷰티 질문으로 전환된다', () => {
      const { getByText, queryByText } = renderWithTheme(<ChatInterface surface="beauty-team" />);

      fireEvent.press(getByText('컬러'));
      expect(getByText('내 시즌에 맞는 립 색상 추천해줘')).toBeTruthy();
      expect(queryByText('머리 어떻게 자를까요?')).toBeNull();

      fireEvent.press(getByText('스타일'));
      expect(getByText('체형에 맞는 옷 추천해줘요')).toBeTruthy();
      expect(queryByText('내 시즌에 맞는 립 색상 추천해줘')).toBeNull();
    });

    it('서버가 돌려준 운동·영양 후속 질문도 뷰티팀 표면에서 필터링한다', () => {
      (useBeautyTeamCoach as jest.Mock).mockReturnValue({
        messages: [createMessage({ id: 'assistant-1', role: 'assistant', content: '답변입니다.' })],
        isLoading: false,
        error: null,
        suggestedQuestions: [
          '오늘 운동 뭐하면 좋을까?',
          '단백질 많은 음식 알려줘',
          '내 퍼스널컬러에 어울리는 립은?',
        ],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText, queryByText } = renderWithTheme(<ChatInterface surface="beauty-team" />);

      expect(getByText('내 퍼스널컬러에 어울리는 립은?')).toBeTruthy();
      expect(queryByText('오늘 운동 뭐하면 좋을까?')).toBeNull();
      expect(queryByText('단백질 많은 음식 알려줘')).toBeNull();
    });
  });

  describe('메시지 표시', () => {
    it('사용자 메시지를 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [
          createMessage({
            id: 'user-1',
            role: 'user',
            content: '오늘 운동 추천해줘',
          }),
        ],
        isLoading: false,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('오늘 운동 추천해줘')).toBeTruthy();
    });

    it('AI 응답 메시지를 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [
          createMessage({
            id: 'user-1',
            role: 'user',
            content: '오늘 운동 추천해줘',
          }),
          createMessage({
            id: 'assistant-1',
            role: 'assistant',
            content: '오늘은 가벼운 유산소 운동을 추천해요!',
          }),
        ],
        isLoading: false,
        error: null,
        suggestedQuestions: ['스트레칭도 알려줘'],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('오늘 운동 추천해줘')).toBeTruthy();
      expect(getByText('오늘은 가벼운 유산소 운동을 추천해요!')).toBeTruthy();
    });

    it('메시지가 있으면 빠른 질문 영역 대신 메시지 목록을 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [
          createMessage({
            id: 'user-1',
            role: 'user',
            content: '안녕!',
          }),
        ],
        isLoading: false,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText, queryByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('안녕!')).toBeTruthy();
      // 빠른 질문 헤더는 사라짐
      expect(queryByText('AI 웰니스 코치')).toBeNull();
    });

    it('추천 질문이 있으면 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [
          createMessage({
            id: 'user-1',
            role: 'user',
            content: '안녕',
          }),
          createMessage({
            id: 'assistant-1',
            role: 'assistant',
            content: '안녕하세요!',
          }),
        ],
        isLoading: false,
        error: null,
        suggestedQuestions: ['운동 추천해줘', '식단 관리 팁'],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('운동 추천해줘')).toBeTruthy();
      expect(getByText('식단 관리 팁')).toBeTruthy();
    });
  });

  describe('전송 기능', () => {
    it('메시지 입력 후 전송 버튼 클릭 시 sendMessage를 호출한다', () => {
      const { getByPlaceholderText, getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.changeText(getByPlaceholderText('무엇이든 물어보세요...'), '운동 추천해줘');
      fireEvent.press(getByText('전송'));

      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('빈 입력 시 전송해도 sendMessage가 호출되지 않는다', () => {
      const { getByText } = renderWithTheme(<ChatInterface />);

      // 빈 입력 상태에서 전송 시도
      fireEvent.press(getByText('전송'));
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('공백만 입력 시 전송해도 sendMessage가 호출되지 않는다', () => {
      const { getByPlaceholderText, getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.changeText(getByPlaceholderText('무엇이든 물어보세요...'), '   ');

      fireEvent.press(getByText('전송'));
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 "생각 중..." 텍스트를 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [
          createMessage({
            id: 'user-1',
            role: 'user',
            content: '질문',
          }),
        ],
        isLoading: true,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('생각 중...')).toBeTruthy();
    });

    it('로딩 중일 때 전송해도 sendMessage가 호출되지 않는다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [],
        isLoading: true,
        error: null,
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByPlaceholderText, getByText } = renderWithTheme(<ChatInterface />);

      fireEvent.changeText(getByPlaceholderText('무엇이든 물어보세요...'), '테스트');

      fireEvent.press(getByText('전송'));
      // handleSend에서 isLoading이 true면 early return
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('에러 상태', () => {
    it('에러가 있으면 에러 메시지를 표시한다', () => {
      (useCoach as jest.Mock).mockReturnValue({
        messages: [],
        isLoading: false,
        error: '메시지 전송에 실패했어요. 다시 시도해주세요.',
        suggestedQuestions: [],
        sessions: [],
        currentSessionId: null,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        loadSession: jest.fn(),
        startNewSession: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('메시지 전송에 실패했어요. 다시 시도해주세요.')).toBeTruthy();
    });
  });

  describe('오프라인 상태', () => {
    it('오프라인일 때 오프라인 배너를 표시한다', () => {
      mockUseNetworkStatus.mockReturnValue({
        status: 'offline',
        isConnected: false,
        connectionType: null,
        refresh: jest.fn(),
      });

      const { getByText } = renderWithTheme(<ChatInterface />);
      expect(getByText('오프라인 모드 - 기본 응답만 제공됩니다')).toBeTruthy();
    });

    it('온라인일 때 오프라인 배너를 표시하지 않는다', () => {
      const { queryByText } = renderWithTheme(<ChatInterface />);
      expect(queryByText('오프라인 모드 - 기본 응답만 제공됩니다')).toBeNull();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상적으로 렌더링된다', () => {
      const { getByTestId, getByText, getByPlaceholderText } = renderWithTheme(
        <ChatInterface />,
        true
      );

      expect(getByTestId('chat-interface')).toBeTruthy();
      expect(getByText('AI 웰니스 코치')).toBeTruthy();
      expect(getByPlaceholderText('무엇이든 물어보세요...')).toBeTruthy();
      expect(getByText('전송')).toBeTruthy();
    });

    it('다크 모드에서 배경색이 다크 컬러를 사용한다', () => {
      const { getByTestId } = renderWithTheme(<ChatInterface />, true);
      const container = getByTestId('chat-interface');

      // style이 중첩 배열일 수 있으므로 JSON 직렬화로 색상 포함 여부 확인
      const styleStr = JSON.stringify(container.props.style);
      expect(styleStr).toContain(darkColors.background);
    });
  });

  describe('입력 필드 속성', () => {
    it('multiline이 활성화되어 있다', () => {
      const { getByPlaceholderText } = renderWithTheme(<ChatInterface />);
      const input = getByPlaceholderText('무엇이든 물어보세요...');
      expect(input.props.multiline).toBe(true);
    });

    it('최대 길이가 500자로 제한된다', () => {
      const { getByPlaceholderText } = renderWithTheme(<ChatInterface />);
      const input = getByPlaceholderText('무엇이든 물어보세요...');
      expect(input.props.maxLength).toBe(500);
    });

    it('전송 returnKeyType이 send이다', () => {
      const { getByPlaceholderText } = renderWithTheme(<ChatInterface />);
      const input = getByPlaceholderText('무엇이든 물어보세요...');
      expect(input.props.returnKeyType).toBe('send');
    });
  });
});
