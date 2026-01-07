import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CompactActivityWidget from '@/app/(main)/dashboard/_components/CompactActivityWidget';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

describe('CompactActivityWidget', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
  });

  it('로딩 상태가 표시된다', () => {
    render(<CompactActivityWidget userId={userId} />);

    // 로딩 중에는 스켈레톤이 표시됨
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('로딩 완료 후 섹션이 렌더링된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByTestId('compact-activity-widget')).toBeInTheDocument();
    });
  });

  it('오늘 기록 헤더가 표시된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByText('오늘 기록')).toBeInTheDocument();
    });
  });

  it('상세보기 링크가 표시된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByText('상세보기')).toBeInTheDocument();
    });
  });

  it('칼로리 항목이 표시된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-calories')).toBeInTheDocument();
      expect(screen.getByText('칼로리')).toBeInTheDocument();
    });
  });

  it('운동 항목이 표시된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-exercise')).toBeInTheDocument();
      expect(screen.getByText('운동')).toBeInTheDocument();
    });
  });

  it('수분 항목이 표시된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-water')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
    });
  });

  it('기본값으로 렌더링된다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      // 기본 목표값 확인 (2000 칼로리, 60분, 8잔)
      expect(screen.getByText(/2,000/)).toBeInTheDocument();
    });
  });

  it('각 항목이 올바른 링크를 가진다', async () => {
    render(<CompactActivityWidget userId={userId} />);

    await waitFor(() => {
      const caloriesItem = screen.getByTestId('activity-calories');
      expect(caloriesItem).toHaveAttribute('href', '/nutrition');

      const exerciseItem = screen.getByTestId('activity-exercise');
      expect(exerciseItem).toHaveAttribute('href', '/workout');

      const waterItem = screen.getByTestId('activity-water');
      expect(waterItem).toHaveAttribute('href', '/nutrition');
    });
  });

  it('userId가 없으면 로딩 완료 후에도 기본 위젯이 표시된다', async () => {
    render(<CompactActivityWidget userId="" />);

    // userId가 빈 문자열이면 데이터 요청 없이 로딩 완료
    await waitFor(
      () => {
        expect(screen.getByTestId('compact-activity-widget')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
