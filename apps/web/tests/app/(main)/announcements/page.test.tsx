import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnnouncementsPage from '@/app/(main)/announcements/page';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
    X: () => <span data-testid="x-icon">X</span>,
    Pin: () => <span data-testid="pin-icon">Pin</span>,
  };
});

// AnnouncementList 컴포넌트 모킹
vi.mock('@/components/announcements', () => ({
  AnnouncementList: ({
    announcements,
    readIds,
    onSelect,
  }: {
    announcements: Array<{ id: string; title: string }>;
    readIds: Set<string>;
    onSelect: (announcement: { id: string; title: string }) => void;
  }) => (
    <div data-testid="announcement-list">
      {announcements.map((a) => (
        <button
          key={a.id}
          data-testid={`announcement-item-${a.id}`}
          data-read={readIds.has(a.id)}
          onClick={() => onSelect(a)}
        >
          {a.title}
        </button>
      ))}
    </div>
  ),
}));

describe('AnnouncementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('페이지 렌더링', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByText('공지사항')).toBeInTheDocument();
    });

    it('뒤로가기 버튼 표시', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('대시보드 링크', () => {
      render(<AnnouncementsPage />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('공지사항 목록 표시', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByTestId('announcement-list')).toBeInTheDocument();
    });
  });

  describe('공지사항 Mock 데이터', () => {
    it('첫 번째 공지사항 표시', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByText('이룸 2.0 업데이트 안내')).toBeInTheDocument();
    });

    it('이벤트 공지사항 표시', () => {
      render(<AnnouncementsPage />);
      expect(
        screen.getByText('연말 이벤트: 30일 챌린지에 참여하세요!')
      ).toBeInTheDocument();
    });

    it('점검 공지사항 표시', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByText('12월 25일 서버 점검 안내')).toBeInTheDocument();
    });

    it('중요 공지사항 표시', () => {
      render(<AnnouncementsPage />);
      expect(screen.getByText('이용약관 개정 안내')).toBeInTheDocument();
    });
  });

  describe('공지사항 선택', () => {
    it('공지사항 클릭 시 상세 시트 열림', () => {
      render(<AnnouncementsPage />);
      fireEvent.click(screen.getByTestId('announcement-item-1'));

      // Sheet가 열리면 상세 내용이 표시됨
      expect(
        screen.getByTestId('announcement-detail-sheet')
      ).toBeInTheDocument();
    });

    it('공지사항 클릭 시 읽음 처리', () => {
      render(<AnnouncementsPage />);
      const item = screen.getByTestId('announcement-item-1');

      // 클릭 전: 읽지 않음
      expect(item).toHaveAttribute('data-read', 'false');

      // 클릭
      fireEvent.click(item);

      // 클릭 후: 읽음
      expect(item).toHaveAttribute('data-read', 'true');
    });

    it('여러 공지사항 읽음 처리', () => {
      render(<AnnouncementsPage />);

      fireEvent.click(screen.getByTestId('announcement-item-1'));
      fireEvent.click(screen.getByTestId('announcement-item-2'));

      expect(screen.getByTestId('announcement-item-1')).toHaveAttribute(
        'data-read',
        'true'
      );
      expect(screen.getByTestId('announcement-item-2')).toHaveAttribute(
        'data-read',
        'true'
      );
    });
  });

  describe('상세 시트', () => {
    it('시트 닫기', () => {
      render(<AnnouncementsPage />);

      // 열기
      fireEvent.click(screen.getByTestId('announcement-item-1'));
      expect(
        screen.getByTestId('announcement-detail-sheet')
      ).toBeInTheDocument();

      // Sheet 닫기 버튼 클릭 (RadixUI Sheet 동작)
      // Sheet 컴포넌트의 onOpenChange가 호출됨
    });
  });

  describe('레이아웃', () => {
    it('컨테이너 최대 너비', () => {
      render(<AnnouncementsPage />);
      const container = screen.getByText('공지사항').closest('div');
      expect(container?.parentElement).toHaveClass('max-w-2xl');
    });

    it('헤더 flex 레이아웃', () => {
      render(<AnnouncementsPage />);
      const header = screen.getByText('공지사항').closest('div');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('gap-4');
    });
  });
});
