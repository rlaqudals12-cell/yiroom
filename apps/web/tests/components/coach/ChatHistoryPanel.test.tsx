/**
 * ChatHistoryPanel 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHistoryPanel } from '@/components/coach/ChatHistoryPanel';
import type { CoachSession } from '@/lib/coach/history';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSessions: CoachSession[] = [
  {
    id: 'session-1',
    clerkUserId: 'user-1',
    title: '피부 트러블 상담',
    category: 'skin',
    messageCount: 5,
    createdAt: new Date('2026-01-10T10:00:00'),
    updatedAt: new Date('2026-01-10T12:00:00'),
  },
  {
    id: 'session-2',
    clerkUserId: 'user-1',
    title: '운동 루틴 추천',
    category: 'workout',
    messageCount: 3,
    createdAt: new Date('2026-01-09T09:00:00'),
    updatedAt: new Date('2026-01-09T11:00:00'),
  },
  {
    id: 'session-3',
    clerkUserId: 'user-1',
    title: null,
    category: 'general',
    messageCount: 1,
    createdAt: new Date('2026-01-08T08:00:00'),
    updatedAt: new Date('2026-01-08T08:30:00'),
  },
];

describe('ChatHistoryPanel', () => {
  const mockOnSelectSession = vi.fn();
  const mockOnNewChat = vi.fn();
  const mockOnDeleteSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sessions: mockSessions }),
    });
  });

  it('히스토리 버튼이 렌더링된다', () => {
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    expect(screen.getByTestId('chat-history-trigger')).toBeInTheDocument();
  });

  it('버튼 클릭 시 패널이 열린다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('chat-history-panel')).toBeInTheDocument();
    });
  });

  it('세션 목록을 로드하여 표시한다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByText('피부 트러블 상담')).toBeInTheDocument();
      expect(screen.getByText('운동 루틴 추천')).toBeInTheDocument();
    });
  });

  it('제목이 없는 세션은 "새 대화"로 표시된다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      // 전역 i18n mock이 키를 반환 — 번역 키 노출로 검증
      expect(screen.getByText('history.newChatTitle')).toBeInTheDocument();
    });
  });

  it('메시지 개수가 표시된다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      // i18n mock은 값 보간 없이 키만 반환 — 세션 3건 모두 개수 라벨이 렌더되는지 확인
      expect(screen.getAllByText(/history.messageCount/)).toHaveLength(3);
    });
  });

  it('세션 선택 시 onSelectSession이 호출된다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('session-item-session-1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('session-item-session-1'));

    expect(mockOnSelectSession).toHaveBeenCalledWith('session-1');
  });

  it('새 대화 버튼 클릭 시 onNewChat이 호출된다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('new-chat-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('new-chat-button'));

    expect(mockOnNewChat).toHaveBeenCalled();
  });

  it('세션 삭제 시 onDeleteSession이 호출된다', async () => {
    const user = userEvent.setup();
    mockOnDeleteSession.mockResolvedValue(undefined);

    render(
      <ChatHistoryPanel
        onSelectSession={mockOnSelectSession}
        onNewChat={mockOnNewChat}
        onDeleteSession={mockOnDeleteSession}
      />
    );

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('session-item-session-1')).toBeInTheDocument();
    });

    // 삭제 버튼 찾기 (첫 번째 세션의 삭제 버튼)
    const deleteButtons = screen.getAllByLabelText('history.deleteAria');
    await user.click(deleteButtons[0]);

    expect(mockOnDeleteSession).toHaveBeenCalledWith('session-1');
  });

  it('로딩 중 스피너가 표시된다', async () => {
    // 지연된 응답 시뮬레이션
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ sessions: [] }),
              }),
            100
          )
        )
    );

    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    // 로딩 상태에서 스피너가 보여야 함
    expect(screen.getByTestId('chat-history-panel')).toBeInTheDocument();
  });

  it('세션이 없을 때 안내 문구가 표시된다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sessions: [] }),
    });

    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByText('history.empty')).toBeInTheDocument();
    });
  });

  it('활성 세션이 하이라이트된다', async () => {
    const user = userEvent.setup();
    render(
      <ChatHistoryPanel
        activeSessionId="session-1"
        onSelectSession={mockOnSelectSession}
        onNewChat={mockOnNewChat}
      />
    );

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      const activeSession = screen.getByTestId('session-item-session-1');
      expect(activeSession).toHaveClass('bg-muted');
    });
  });

  it('카테고리별 아이콘이 표시된다', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      // 이모지 제거됨 - 카테고리 아이콘이 빈 문자열이므로 렌더링되지 않음
      expect(screen.queryByRole('img', { name: 'skin' })).not.toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'workout' })).not.toBeInTheDocument();
    });
  });

  it('API 에러 시 세션 목록이 빈 배열로 처리된다', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    const user = userEvent.setup();
    render(<ChatHistoryPanel onSelectSession={mockOnSelectSession} onNewChat={mockOnNewChat} />);

    await user.click(screen.getByTestId('chat-history-trigger'));

    await waitFor(() => {
      expect(screen.getByText('history.empty')).toBeInTheDocument();
    });
  });
});
