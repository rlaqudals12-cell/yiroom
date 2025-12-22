import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DailyCheckin } from '@/components/checkin/DailyCheckin';

// Supabase 모킹
const mockInsert = vi.fn();
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

// toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Clerk 모킹 오버라이드 (테스트용 사용자)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test-user-id',
    isLoaded: true,
  }),
}));

describe('DailyCheckin', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('모달이 열릴 때 첫 번째 단계(기분)를 표시한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    expect(screen.getByTestId('daily-checkin-modal')).toBeInTheDocument();
    expect(screen.getByTestId('step-mood')).toBeInTheDocument();
    expect(screen.getByText('오늘 기분이 어때요?')).toBeInTheDocument();
  });

  it('기분 옵션 3가지를 표시한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    expect(screen.getByText('좋아요')).toBeInTheDocument();
    expect(screen.getByText('보통이에요')).toBeInTheDocument();
    expect(screen.getByText('안 좋아요')).toBeInTheDocument();
  });

  it('기분 선택 후 다음 버튼이 활성화된다', () => {
    render(<DailyCheckin {...defaultProps} />);

    const nextButton = screen.getByRole('button', { name: '다음' });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByText('좋아요'));
    expect(nextButton).not.toBeDisabled();
  });

  it('기분 선택 후 다음 클릭 시 에너지 단계로 이동한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByTestId('step-energy')).toBeInTheDocument();
    expect(screen.getByText('에너지 레벨은요?')).toBeInTheDocument();
  });

  it('에너지 옵션 3가지를 표시한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    // 에너지 단계로 이동
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('활력 넘쳐요')).toBeInTheDocument();
    expect(screen.getByText('적당해요')).toBeInTheDocument();
    expect(screen.getByText('피곤해요')).toBeInTheDocument();
  });

  it('에너지 선택 후 피부 상태 단계로 이동한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    // 기분 선택
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // 에너지 선택
    fireEvent.click(screen.getByText('활력 넘쳐요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByTestId('step-skin')).toBeInTheDocument();
    expect(screen.getByText('피부 상태는 어때요?')).toBeInTheDocument();
  });

  it('피부 상태 옵션 3가지를 표시한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    // 피부 단계로 이동
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('활력 넘쳐요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('촉촉해요')).toBeInTheDocument();
    expect(screen.getByText('괜찮아요')).toBeInTheDocument();
    expect(screen.getByText('건조/트러블')).toBeInTheDocument();
  });

  it('이전 버튼 클릭 시 이전 단계로 돌아간다', () => {
    render(<DailyCheckin {...defaultProps} />);

    // 에너지 단계로 이동
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByTestId('step-energy')).toBeInTheDocument();

    // 이전 버튼 클릭
    fireEvent.click(screen.getByRole('button', { name: '이전' }));

    expect(screen.getByTestId('step-mood')).toBeInTheDocument();
  });

  it('모든 단계 완료 시 체크인을 제출한다', async () => {
    render(<DailyCheckin {...defaultProps} />);

    // 모든 단계 완료
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('활력 넘쳐요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('촉촉해요'));
    fireEvent.click(screen.getByRole('button', { name: '완료' }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: 'test-user-id',
          mood: 'great',
          energy: 'high',
          skin_condition: 'great',
        })
      );
    });
  });

  it('체크인 완료 후 완료 화면을 표시한다', async () => {
    render(<DailyCheckin {...defaultProps} />);

    // 모든 단계 완료
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('활력 넘쳐요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('촉촉해요'));
    fireEvent.click(screen.getByRole('button', { name: '완료' }));

    await waitFor(() => {
      expect(screen.getByText('체크인 완료!')).toBeInTheDocument();
    });
  });

  it('체크인 완료 시 onComplete 콜백을 호출한다', async () => {
    render(<DailyCheckin {...defaultProps} />);

    // 모든 단계 완료
    fireEvent.click(screen.getByText('좋아요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('활력 넘쳐요'));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByText('촉촉해요'));
    fireEvent.click(screen.getByRole('button', { name: '완료' }));

    await waitFor(() => {
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  it('진행 표시기가 현재 단계를 반영한다', () => {
    render(<DailyCheckin {...defaultProps} />);

    const progressBars = screen.getByTestId('daily-checkin-modal').querySelectorAll('.h-1');
    expect(progressBars).toHaveLength(3);
  });

  it('모달이 닫혀 있으면 렌더링하지 않는다', () => {
    render(<DailyCheckin {...defaultProps} open={false} />);

    expect(screen.queryByTestId('daily-checkin-modal')).not.toBeInTheDocument();
  });
});
