import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CombinedStreakWidget from '@/app/(main)/dashboard/_components/CombinedStreakWidget';

// Supabase 모킹
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// Clerk 모킹
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
  }),
}));

describe('CombinedStreakWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 모킹 설정 - 데이터 없음
    mockSingle.mockResolvedValue({ data: null });
  });

  it('로딩 상태를 표시한다', () => {
    mockSingle.mockImplementation(() => new Promise(() => {})); // 영원히 대기

    render(<CombinedStreakWidget userId="test-user-id" />);

    expect(screen.getByText('', { selector: '.animate-pulse' })).toBeInTheDocument();
  });

  it('userId가 없으면 아무것도 렌더링하지 않는다', async () => {
    render(<CombinedStreakWidget />);

    await waitFor(() => {
      expect(screen.queryByTestId('combined-streak-widget')).not.toBeInTheDocument();
    });
  });

  it('위젯 타이틀을 표시한다', async () => {
    mockSingle.mockResolvedValue({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('연속 기록')).toBeInTheDocument();
    });
  });

  it('운동 streak을 표시한다', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          current_streak: 5,
          longest_streak: 10,
          last_workout_date: new Date().toISOString(),
          badges_earned: [],
        },
      })
      .mockResolvedValueOnce({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('운동')).toBeInTheDocument();
    });
  });

  it('영양 streak을 표시한다', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({
        data: {
          id: '1',
          user_id: 'test-user-id',
          current_streak: 3,
          longest_streak: 7,
          last_record_date: new Date().toISOString(),
          badges_earned: [],
          premium_rewards_claimed: [],
          updated_at: new Date().toISOString(),
        },
      });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('영양')).toBeInTheDocument();
    });
  });

  it('체크인 버튼을 표시한다', async () => {
    mockSingle.mockResolvedValue({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('오늘의 나 체크인하기')).toBeInTheDocument();
    });
  });

  it('체크인 버튼 클릭 시 체크인 모달을 연다', async () => {
    mockSingle.mockResolvedValue({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('오늘의 나 체크인하기')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('오늘의 나 체크인하기'));

    await waitFor(() => {
      expect(screen.getByTestId('daily-checkin-modal')).toBeInTheDocument();
    });
  });

  it('총 streak 합계를 표시한다', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          current_streak: 5,
          longest_streak: 10,
          last_workout_date: new Date().toISOString(),
          badges_earned: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: '1',
          user_id: 'test-user-id',
          current_streak: 3,
          longest_streak: 7,
          last_record_date: new Date().toISOString(),
          badges_earned: [],
          premium_rewards_claimed: [],
          updated_at: new Date().toISOString(),
        },
      });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      // 5 + 3 = 8
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('streak이 활성화되어 있으면 상태 메시지를 표시한다', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          current_streak: 5,
          longest_streak: 10,
          last_workout_date: new Date().toISOString(),
          badges_earned: [],
        },
      })
      .mockResolvedValueOnce({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('현재 진행 중')).toBeInTheDocument();
    });
  });

  it('streak이 비활성화되어 있으면 시작 메시지를 표시한다', async () => {
    mockSingle.mockResolvedValue({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('새로운 기록을 시작해보세요')).toBeInTheDocument();
    });
  });

  it('마일스톤 임박 알림을 표시한다', async () => {
    // 6일 연속 (7일 마일스톤 1일 전)
    mockSingle
      .mockResolvedValueOnce({
        data: {
          current_streak: 6,
          longest_streak: 6,
          last_workout_date: new Date().toISOString(),
          badges_earned: [],
        },
      })
      .mockResolvedValueOnce({ data: null });

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('내일이면 마일스톤 달성! 🎉')).toBeInTheDocument();
    });
  });

  it('데이터 조회 실패 시 에러를 처리한다', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSingle.mockRejectedValue(new Error('DB Error'));

    render(<CombinedStreakWidget userId="test-user-id" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Streak 조회 실패:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
