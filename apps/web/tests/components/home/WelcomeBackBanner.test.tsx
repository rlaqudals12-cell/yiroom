import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock 의존성
const mockSingle = vi.fn();
const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: mockFrom }),
}));

const mockUseAuth = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGenerateWelcomeBackMessage = vi.fn();
const mockIsDismissed = vi.fn();
const mockDismissWelcomeBack = vi.fn();

vi.mock('@/lib/engagement', () => ({
  generateWelcomeBackMessage: (...args: unknown[]) => mockGenerateWelcomeBackMessage(...args),
  isDismissed: () => mockIsDismissed(),
  dismissWelcomeBack: () => mockDismissWelcomeBack(),
}));

import WelcomeBackBanner from '@/app/(main)/home/_components/WelcomeBackBanner';

describe('WelcomeBackBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userId: 'user_123' });
    mockIsDismissed.mockReturnValue(false);
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockGenerateWelcomeBackMessage.mockReturnValue(null);
  });

  it('로그인하지 않은 경우 null을 반환한다', () => {
    mockUseAuth.mockReturnValue({ userId: null });

    const { container } = render(<WelcomeBackBanner />);

    expect(container.innerHTML).toBe('');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('isDismissed()가 true이면 null을 반환한다', () => {
    mockIsDismissed.mockReturnValue(true);

    const { container } = render(<WelcomeBackBanner />);

    expect(container.innerHTML).toBe('');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('환영 메시지가 있으면 배너를 렌더링한다', async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    mockSingle.mockResolvedValue({
      data: { created_at: sevenDaysAgo },
      error: null,
    });
    mockGenerateWelcomeBackMessage.mockReturnValue({
      title: '7일 만에 돌아오셨군요!',
      description: '그동안 새로운 변화가 있었어요. 확인해보세요',
      absentDays: 7,
    });

    render(<WelcomeBackBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('welcome-back-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('7일 만에 돌아오셨군요!')).toBeInTheDocument();
    expect(screen.getByText('그동안 새로운 변화가 있었어요. 확인해보세요')).toBeInTheDocument();
    expect(mockGenerateWelcomeBackMessage).toHaveBeenCalledWith(sevenDaysAgo);
  });

  it('CTA 링크가 있으면 표시한다', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    mockSingle.mockResolvedValue({
      data: { created_at: tenDaysAgo },
      error: null,
    });
    mockGenerateWelcomeBackMessage.mockReturnValue({
      title: '10일 만에 돌아오셨군요!',
      description: '그동안 새로운 변화가 있었어요.',
      absentDays: 10,
      ctaText: '변화 확인하기',
      ctaHref: '/dashboard',
    });

    render(<WelcomeBackBanner />);

    await waitFor(() => {
      expect(screen.getByText('변화 확인하기')).toBeInTheDocument();
    });

    const ctaLink = screen.getByText('변화 확인하기').closest('a');
    expect(ctaLink).toHaveAttribute('href', '/dashboard');
  });

  it('닫기 버튼 클릭 시 dismissWelcomeBack()을 호출하고 배너를 숨긴다', async () => {
    mockSingle.mockResolvedValue({
      data: { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      error: null,
    });
    mockGenerateWelcomeBackMessage.mockReturnValue({
      title: '다시 오셨네요!',
      description: '5일 만이에요.',
      absentDays: 5,
    });

    render(<WelcomeBackBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('welcome-back-banner')).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText('환영 메시지 닫기');
    fireEvent.click(dismissButton);

    expect(mockDismissWelcomeBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('welcome-back-banner')).not.toBeInTheDocument();
  });

  it('접근성 속성이 올바르게 설정되어 있다', async () => {
    mockSingle.mockResolvedValue({
      data: { created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      error: null,
    });
    mockGenerateWelcomeBackMessage.mockReturnValue({
      title: '다시 오셨네요!',
      description: '4일 만이에요.',
      absentDays: 4,
    });

    render(<WelcomeBackBanner />);

    await waitFor(() => {
      const banner = screen.getByTestId('welcome-back-banner');
      expect(banner).toHaveAttribute('role', 'status');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('generateWelcomeBackMessage가 null을 반환하면 배너를 표시하지 않는다', async () => {
    mockSingle.mockResolvedValue({
      data: { created_at: new Date().toISOString() },
      error: null,
    });
    mockGenerateWelcomeBackMessage.mockReturnValue(null);

    const { container } = render(<WelcomeBackBanner />);

    // useEffect 완료 대기
    await waitFor(() => {
      expect(mockGenerateWelcomeBackMessage).toHaveBeenCalled();
    });

    expect(container.querySelector('[data-testid="welcome-back-banner"]')).toBeNull();
  });
});
