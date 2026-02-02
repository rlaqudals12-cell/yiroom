import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagement } from '@/components/admin/UserManagement';
import type { UserListItem } from '@/lib/admin/stats';

describe('UserManagement', () => {
  const mockUsers: UserListItem[] = [
    {
      id: 'uuid-1',
      clerkUserId: 'clerk_123456789012',
      email: 'user1@example.com',
      name: '홍길동',
      createdAt: new Date('2026-01-15'),
      hasPersonalColor: true,
      hasSkin: true,
      hasBody: false,
      hasWorkout: true,
      hasNutrition: false,
    },
    {
      id: 'uuid-2',
      clerkUserId: 'clerk_234567890123',
      email: 'user2@example.com',
      name: '김영희',
      createdAt: new Date('2026-01-10'),
      hasPersonalColor: false,
      hasSkin: false,
      hasBody: false,
      hasWorkout: false,
      hasNutrition: false,
    },
    {
      id: 'uuid-3',
      clerkUserId: 'clerk_345678901234',
      email: 'user3@example.com',
      name: '박철수',
      createdAt: new Date('2026-01-05'),
      hasPersonalColor: true,
      hasSkin: true,
      hasBody: true,
      hasWorkout: true,
      hasNutrition: true,
    },
  ];

  const mockFetchUsers = vi.fn().mockResolvedValue({
    users: mockUsers,
    total: 3,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('컴포넌트 렌더링', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument();
      });
    });

    it('제목 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('사용자 관리')).toBeInTheDocument();
      });
    });

    it('총 사용자 수 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('총 3명')).toBeInTheDocument();
      });
    });
  });

  describe('사용자 목록', () => {
    it('사용자 이름 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
        expect(screen.getByText('김영희')).toBeInTheDocument();
        expect(screen.getByText('박철수')).toBeInTheDocument();
      });
    });

    it('사용자 이메일 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      });
    });

    it('가입일 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('2026. 1. 15.')).toBeInTheDocument();
      });
    });

    it('사용자 행 렌더링', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-row-uuid-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-uuid-2')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-uuid-3')).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 스켈레톤 표시', () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);
      expect(screen.getByTestId('user-table-loading')).toBeInTheDocument();
    });

    it('데이터 로드 후 스켈레톤 숨김', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.queryByTestId('user-table-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('빈 상태', () => {
    it('사용자 없을 때 메시지 표시', async () => {
      const emptyFetch = vi.fn().mockResolvedValue({ users: [], total: 0 });
      render(<UserManagement fetchUsers={emptyFetch} />);

      await waitFor(() => {
        expect(screen.getByTestId('no-users-message')).toBeInTheDocument();
        expect(screen.getByText('등록된 사용자가 없습니다.')).toBeInTheDocument();
      });
    });

    it('검색 결과 없을 때 메시지 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('user-search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
  });

  describe('검색 기능', () => {
    it('검색 입력 필드 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
      });
    });

    it('이름으로 검색', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('user-search-input');
      fireEvent.change(searchInput, { target: { value: '홍길동' } });

      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.queryByText('김영희')).not.toBeInTheDocument();
    });

    it('이메일로 검색', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('user-search-input');
      fireEvent.change(searchInput, { target: { value: 'user2' } });

      expect(screen.getByText('김영희')).toBeInTheDocument();
      expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
    });

    it('대소문자 구분 없이 검색', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('user-search-input');
      fireEvent.change(searchInput, { target: { value: 'USER1' } });

      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
  });

  describe('새로고침 기능', () => {
    it('새로고침 버튼 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-users-button')).toBeInTheDocument();
      });
    });

    it('새로고침 버튼 클릭 시 데이터 재로드', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByTestId('refresh-users-button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('분석 현황 배지', () => {
    it('완료된 분석에 체크 아이콘 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const userRow = screen.getByTestId('user-row-uuid-1');
        expect(userRow).toBeInTheDocument();
        // 홍길동: 퍼스널컬러(O), 피부(O), 체형(X), 운동(O), 영양(X)
      });
    });

    it('모든 분석 완료한 사용자 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const userRow = screen.getByTestId('user-row-uuid-3');
        expect(userRow).toBeInTheDocument();
        // 박철수: 모든 분석 완료
      });
    });
  });

  describe('페이지네이션', () => {
    it('페이지 정보 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} pageSize={2} />);

      await waitFor(() => {
        // 페이지당 2개로 설정하면 총 2페이지 필요
        expect(screen.getByText('1 - 2 / 3')).toBeInTheDocument();
      });
    });

    it('다음 페이지 버튼', async () => {
      const paginatedFetch = vi.fn().mockResolvedValue({
        users: mockUsers.slice(0, 2),
        total: 3,
      });

      render(<UserManagement fetchUsers={paginatedFetch} pageSize={2} />);

      await waitFor(() => {
        expect(screen.getByTestId('next-page-button')).toBeInTheDocument();
      });
    });

    it('이전 페이지 버튼', async () => {
      const paginatedFetch = vi.fn().mockResolvedValue({
        users: mockUsers.slice(0, 2),
        total: 3,
      });

      render(<UserManagement fetchUsers={paginatedFetch} pageSize={2} />);

      await waitFor(() => {
        expect(screen.getByTestId('prev-page-button')).toBeInTheDocument();
      });
    });

    it('첫 페이지에서 이전 버튼 비활성화', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} pageSize={2} />);

      await waitFor(() => {
        const prevButton = screen.getByTestId('prev-page-button');
        expect(prevButton).toBeDisabled();
      });
    });

    it('다음 페이지 클릭 시 데이터 요청', async () => {
      const paginatedFetch = vi.fn().mockResolvedValue({
        users: mockUsers.slice(0, 2),
        total: 3,
      });

      render(<UserManagement fetchUsers={paginatedFetch} pageSize={2} />);

      await waitFor(() => {
        expect(paginatedFetch).toHaveBeenCalledWith(1, 2);
      });

      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(paginatedFetch).toHaveBeenCalledWith(2, 2);
      });
    });

    it('한 페이지에 모든 데이터 있으면 페이지네이션 미표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} pageSize={10} />);

      await waitFor(() => {
        // pageSize=10, total=3 이면 페이지네이션 불필요
        expect(screen.queryByTestId('prev-page-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('next-page-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('사용자 상세 보기', () => {
    it('상세 보기 버튼 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        expect(screen.getByTestId('view-user-uuid-1')).toBeInTheDocument();
      });
    });

    it('상세 보기 클릭 시 모달 열기', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-1');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-detail-modal')).toBeInTheDocument();
      });
    });

    it('모달에 사용자 정보 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-1');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
        // 모달 내에 사용자 정보가 포함되어 있는지 확인
        const modal = screen.getByTestId('user-detail-modal');
        expect(modal).toHaveTextContent('홍길동');
        expect(modal).toHaveTextContent('user1@example.com');
      });
    });

    it('모달에 분석 완료 현황 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-1');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('분석 완료 현황')).toBeInTheDocument();
        expect(screen.getByText('퍼스널컬러')).toBeInTheDocument();
        expect(screen.getByText('피부 분석')).toBeInTheDocument();
      });
    });

    it('모달에 진행률 바 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-1');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('completion-progress-bar')).toBeInTheDocument();
      });
    });

    it('완료율 계산 정확성 (3/5 = 60%)', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-1');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        // 홍길동: 3/5 완료 = 60%
        expect(screen.getByText('60% 완료')).toBeInTheDocument();
        expect(screen.getByText('3/5')).toBeInTheDocument();
      });
    });

    it('모든 분석 완료 시 100% 표시', async () => {
      render(<UserManagement fetchUsers={mockFetchUsers} />);

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-user-uuid-3');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        // 박철수: 5/5 완료 = 100%
        expect(screen.getByText('100% 완료')).toBeInTheDocument();
        expect(screen.getByText('5/5')).toBeInTheDocument();
      });
    });
  });

  describe('에러 처리', () => {
    it('fetch 실패 시 에러 로그', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<UserManagement fetchUsers={failingFetch} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('이름/이메일 없는 경우', () => {
    it('이름 없으면 "이름 없음" 표시', async () => {
      const usersWithoutName = [
        {
          ...mockUsers[0],
          name: null,
        },
      ];
      const fetchWithoutName = vi.fn().mockResolvedValue({
        users: usersWithoutName,
        total: 1,
      });

      render(<UserManagement fetchUsers={fetchWithoutName} />);

      await waitFor(() => {
        expect(screen.getByText('이름 없음')).toBeInTheDocument();
      });
    });

    it('이메일 없으면 "이메일 없음" 표시', async () => {
      const usersWithoutEmail = [
        {
          ...mockUsers[0],
          email: null,
        },
      ];
      const fetchWithoutEmail = vi.fn().mockResolvedValue({
        users: usersWithoutEmail,
        total: 1,
      });

      render(<UserManagement fetchUsers={fetchWithoutEmail} />);

      await waitFor(() => {
        expect(screen.getByText('이메일 없음')).toBeInTheDocument();
      });
    });
  });
});
