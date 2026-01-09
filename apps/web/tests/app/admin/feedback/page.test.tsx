import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminFeedbackPage from '@/app/admin/feedback/page';

// scrollIntoView 모킹
Element.prototype.scrollIntoView = vi.fn();

// Mock feedback data
const mockFeedbacks = [
  {
    id: '1',
    type: 'bug',
    category: 'auth',
    title: '로그인 시 에러 발생',
    content: '구글 로그인 버튼 클릭 시 에러가 발생합니다.',
    status: 'pending',
    priority: 'high',
    userEmail: 'test1@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'feature',
    category: 'ui',
    title: '다크 모드 지원 요청',
    content: '다크 모드 기능을 추가해주세요.',
    status: 'in_progress',
    priority: 'medium',
    userEmail: 'test2@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'question',
    category: 'billing',
    title: '프리미엄 구독 문의',
    content: '프리미엄 구독 혜택이 무엇인가요?',
    status: 'resolved',
    priority: 'low',
    userEmail: 'test3@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock global fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ feedbacks: mockFeedbacks }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    MessageSquare: () => <span data-testid="message-icon">MessageSquare</span>,
    Filter: () => <span data-testid="filter-icon">Filter</span>,
    RefreshCw: () => <span data-testid="refresh-icon">RefreshCw</span>,
    ChevronDown: () => <span data-testid="chevron-icon">ChevronDown</span>,
  };
});

describe('AdminFeedbackPage', () => {
  describe('기본 렌더링', () => {
    it('페이지 렌더링', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-feedback-page')).toBeInTheDocument();
      });
    });

    it('제목 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('피드백 관리')).toBeInTheDocument();
      });
    });

    it('설명 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('사용자 피드백을 확인하고 처리합니다.')).toBeInTheDocument();
      });
    });

    it('새로고침 버튼 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('새로고침')).toBeInTheDocument();
      });
    });
  });

  describe('통계 카드', () => {
    it('전체 통계 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('전체')).toBeInTheDocument();
      });
    });

    it('대기 중 통계 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('대기 중')).toBeInTheDocument();
      });
    });

    it('처리 중 통계 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('처리 중')).toBeInTheDocument();
      });
    });

    it('해결됨 통계 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('해결됨')).toBeInTheDocument();
      });
    });
  });

  describe('필터', () => {
    it('필터 영역 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByTestId('feedback-filters')).toBeInTheDocument();
      });
    });
  });

  describe('피드백 목록', () => {
    it('피드백 목록 영역 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByTestId('feedback-list')).toBeInTheDocument();
      });
    });

    it('로딩 후 피드백 표시', async () => {
      render(<AdminFeedbackPage />);

      // 로딩 완료 후 목 데이터 표시
      await waitFor(
        () => {
          expect(screen.getByText('로그인 시 에러 발생')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('다크 모드 제안 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(
        () => {
          expect(screen.getByText('다크 모드 지원 요청')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('프리미엄 문의 표시', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(
        () => {
          expect(screen.getByText('프리미엄 구독 문의')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('피드백 확장', () => {
    it('피드백 클릭 시 내용 표시', async () => {
      render(<AdminFeedbackPage />);

      // 로딩 완료 대기
      await waitFor(
        () => {
          expect(screen.getByText('로그인 시 에러 발생')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 피드백 카드 클릭
      fireEvent.click(screen.getByText('로그인 시 에러 발생'));

      // 내용 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/구글 로그인 버튼 클릭 시/)).toBeInTheDocument();
      });
    });
  });

  describe('새로고침', () => {
    it('새로고침 버튼 클릭', async () => {
      render(<AdminFeedbackPage />);

      await waitFor(() => {
        expect(screen.getByText('새로고침')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('새로고침'));

      // 로딩 후 다시 데이터 표시
      await waitFor(
        () => {
          expect(screen.getByText('로그인 시 에러 발생')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
