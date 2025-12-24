import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminAffiliatePage from '@/app/admin/affiliate/page';

// scrollIntoView 모킹
Element.prototype.scrollIntoView = vi.fn();

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    TrendingUp: () => <span data-testid="trending-up">TrendingUp</span>,
    TrendingDown: () => <span data-testid="trending-down">TrendingDown</span>,
    MousePointerClick: () => <span data-testid="click-icon">Click</span>,
    Users: () => <span data-testid="users-icon">Users</span>,
    Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
    RefreshCw: () => <span data-testid="refresh-icon">RefreshCw</span>,
  };
});

// recharts 모킹
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('AdminAffiliatePage', () => {
  describe('기본 렌더링', () => {
    it('페이지 렌더링', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-affiliate-page')).toBeInTheDocument();
      });
    });

    it('제목 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('어필리에이트 대시보드')).toBeInTheDocument();
      });
    });

    it('설명 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('제품 클릭 통계를 확인합니다.')).toBeInTheDocument();
      });
    });
  });

  describe('통계 카드', () => {
    it('오늘 클릭 카드 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('오늘 클릭')).toBeInTheDocument();
      });
    });

    it('주간 클릭 카드 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('주간 클릭')).toBeInTheDocument();
      });
    });

    it('월간 클릭 카드 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('월간 클릭')).toBeInTheDocument();
      });
    });

    it('고유 사용자 카드 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('고유 사용자')).toBeInTheDocument();
      });
    });
  });

  describe('데이터 로딩', () => {
    it('로딩 후 통계 표시', async () => {
      render(<AdminAffiliatePage />);

      // 로딩 완료 후 Mock 데이터 표시
      await waitFor(
        () => {
          expect(screen.getByText('42')).toBeInTheDocument(); // 오늘 클릭
        },
        { timeout: 1000 }
      );
    });

    it('주간 클릭 수 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(
        () => {
          expect(screen.getByText('287')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('월간 클릭 수 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(
        () => {
          // 숫자 포맷은 로케일에 따라 다를 수 있음
          expect(screen.getByText(/1,?234/)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('제품별 순위', () => {
    it('순위 테이블 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(
        () => {
          expect(screen.getByTestId('product-ranking')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('제품별 클릭 순위 제목', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(
        () => {
          expect(screen.getByText('제품별 클릭 순위')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('제품 데이터 표시', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(
        () => {
          expect(screen.getByText('피부 진정 세럼')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('기간 필터', () => {
    it('기본값 주간', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByText('최근 7일')).toBeInTheDocument();
      });
    });
  });

  describe('새로고침', () => {
    it('새로고침 버튼 존재', async () => {
      render(<AdminAffiliatePage />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      });
    });
  });
});
