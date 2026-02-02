import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import type { DashboardStats, RecentActivity } from '@/lib/admin/stats';

describe('AdminDashboard', () => {
  const mockStats: DashboardStats = {
    users: {
      total: 1000,
      today: 50,
      thisWeek: 200,
      thisMonth: 800,
    },
    analyses: {
      personalColor: 500,
      skin: 400,
      body: 300,
      workout: 250,
      nutrition: 200,
    },
    products: {
      cosmetics: 100,
      supplements: 80,
      equipment: 50,
      healthFoods: 60,
    },
    activity: {
      workoutLogs: 3000,
      mealRecords: 5000,
      wishlists: 1500,
    },
  };

  const mockActivities: RecentActivity[] = [
    {
      type: 'workout',
      userId: 'user_123456789012',
      description: '운동 완료: 스쿼트',
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
    },
    {
      type: 'meal',
      userId: 'user_234567890123',
      description: '식사 기록: 점심',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
    },
    {
      type: 'wishlist',
      userId: 'user_345678901234',
      description: '위시리스트 추가: 화장품',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    },
  ];

  const mockFetchStats = vi.fn().mockResolvedValue(mockStats);
  const mockFetchActivities = vi.fn().mockResolvedValue(mockActivities);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('초기 데이터로 대시보드 렌더링', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    it('제목이 표시됨', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('관리자 대시보드')).toBeInTheDocument();
    });

    it('부제목이 표시됨', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('서비스 현황 및 사용자 활동')).toBeInTheDocument();
    });
  });

  describe('사용자 통계 섹션', () => {
    it('사용자 현황 섹션 렌더링', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByTestId('user-stats-section')).toBeInTheDocument();
    });

    it('전체 사용자 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('오늘 가입자 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      // 사용자 통계 섹션 내에서 오늘 가입자 수 확인
      const userStatsSection = screen.getByTestId('user-stats-section');
      expect(userStatsSection).toHaveTextContent('50');
    });

    it('이번 주 가입자 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      // 200이 이번 주 가입자 수
      const userStatsSection = screen.getByTestId('user-stats-section');
      expect(userStatsSection).toHaveTextContent('200');
    });

    it('이번 달 가입자 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('800')).toBeInTheDocument();
    });
  });

  describe('분석 통계 섹션', () => {
    it('분석 현황 섹션 렌더링', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByTestId('analysis-stats-section')).toBeInTheDocument();
    });

    it('퍼스널컬러 분석 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      const analysisSection = screen.getByTestId('analysis-stats-section');
      expect(analysisSection).toHaveTextContent('500');
    });

    it('피부 분석 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      const analysisSection = screen.getByTestId('analysis-stats-section');
      expect(analysisSection).toHaveTextContent('400');
    });

    it('체형 분석 수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      const analysisSection = screen.getByTestId('analysis-stats-section');
      expect(analysisSection).toHaveTextContent('300');
    });
  });

  describe('제품 통계 섹션', () => {
    it('제품 DB 현황 섹션 렌더링', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByTestId('product-stats-section')).toBeInTheDocument();
    });

    it('화장품 개수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      const productSection = screen.getByTestId('product-stats-section');
      expect(productSection).toHaveTextContent('100');
    });

    it('영양제 개수 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      const productSection = screen.getByTestId('product-stats-section');
      expect(productSection).toHaveTextContent('80');
    });
  });

  describe('최근 활동 섹션', () => {
    it('최근 활동 섹션 렌더링', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByTestId('recent-activities-section')).toBeInTheDocument();
    });

    it('운동 활동 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText(/스쿼트/)).toBeInTheDocument();
    });

    it('식사 기록 활동 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText(/점심/)).toBeInTheDocument();
    });

    it('활동 없을 때 빈 상태 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={[]} />);
      expect(screen.getByTestId('recent-activities-empty')).toBeInTheDocument();
      expect(screen.getByText('최근 활동이 없습니다.')).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('초기 데이터 없이 로딩 상태 표시', async () => {
      render(
        <AdminDashboard
          fetchStats={mockFetchStats}
          fetchActivities={mockFetchActivities}
        />
      );

      // 로딩 스켈레톤이 표시되는지 확인
      expect(screen.getByTestId('user-stats-loading')).toBeInTheDocument();
    });

    it('데이터 로드 후 로딩 상태 해제', async () => {
      render(
        <AdminDashboard
          fetchStats={mockFetchStats}
          fetchActivities={mockFetchActivities}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('user-stats-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('새로고침 기능', () => {
    it('새로고침 버튼 표시', () => {
      render(
        <AdminDashboard
          initialStats={mockStats}
          initialActivities={mockActivities}
          fetchStats={mockFetchStats}
          fetchActivities={mockFetchActivities}
        />
      );
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    it('새로고침 버튼 클릭 시 데이터 재로드', async () => {
      render(
        <AdminDashboard
          initialStats={mockStats}
          initialActivities={mockActivities}
          fetchStats={mockFetchStats}
          fetchActivities={mockFetchActivities}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetchStats).toHaveBeenCalled();
        expect(mockFetchActivities).toHaveBeenCalled();
      });
    });

    it('fetchStats/fetchActivities 없으면 새로고침 버튼 미표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.queryByTestId('refresh-button')).not.toBeInTheDocument();
    });
  });

  describe('활동 요약 카드', () => {
    it('운동 기록 카드 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('운동 기록')).toBeInTheDocument();
      expect(screen.getByText('3,000')).toBeInTheDocument();
    });

    it('식사 기록 카드 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      expect(screen.getByText('식사 기록')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('위시리스트 카드 표시', () => {
      render(<AdminDashboard initialStats={mockStats} initialActivities={mockActivities} />);
      // 위시리스트 통계 카드 (stat-card)에서 확인
      const wishlistCard = screen.getByTestId('stat-card-위시리스트');
      expect(wishlistCard).toHaveTextContent('위시리스트');
      expect(wishlistCard).toHaveTextContent('1,500');
    });
  });

  describe('시간 포맷팅', () => {
    it('5분 전 활동 표시', () => {
      const recentActivity: RecentActivity = {
        type: 'workout',
        userId: 'user_test',
        description: '운동 완료',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
      };

      render(
        <AdminDashboard initialStats={mockStats} initialActivities={[recentActivity]} />
      );
      expect(screen.getByText('5분 전')).toBeInTheDocument();
    });

    it('2시간 전 활동 표시', () => {
      const recentActivity: RecentActivity = {
        type: 'meal',
        userId: 'user_test',
        description: '식사 기록',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };

      render(
        <AdminDashboard initialStats={mockStats} initialActivities={[recentActivity]} />
      );
      expect(screen.getByText('2시간 전')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('fetch 실패 시 에러 로그', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <AdminDashboard
          fetchStats={failingFetch}
          fetchActivities={mockFetchActivities}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
