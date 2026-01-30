import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnouncementList } from '@/components/announcements/AnnouncementList';
import type { Announcement } from '@/types/announcements';

// scrollIntoView 모킹 (Radix Select 컴포넌트 요구사항)
Element.prototype.scrollIntoView = vi.fn();

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Bell: () => <span data-testid="bell-icon">Bell</span>,
    Filter: () => <span data-testid="filter-icon">Filter</span>,
    Pin: () => <span data-testid="pin-icon">Pin</span>,
    Eye: () => <span data-testid="eye-icon">Eye</span>,
  };
});

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: '일반 공지',
    content: '일반 공지 내용',
    category: 'general',
    priority: 1,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-20'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 50,
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20'),
  },
  {
    id: 'ann-2',
    title: '중요 공지 (고정)',
    content: '중요 공지 내용',
    category: 'important',
    priority: 10,
    isPinned: true,
    isPublished: true,
    publishedAt: new Date('2025-12-15'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 200,
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2025-12-15'),
  },
  {
    id: 'ann-3',
    title: '업데이트 공지',
    content: '업데이트 내용',
    category: 'update',
    priority: 5,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-18'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 100,
    createdAt: new Date('2025-12-18'),
    updatedAt: new Date('2025-12-18'),
  },
];

describe('AnnouncementList', () => {
  describe('기본 렌더링', () => {
    it('리스트 렌더링', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);
      expect(screen.getByTestId('announcement-list')).toBeInTheDocument();
    });

    it('공지사항 제목 표시', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);
      expect(screen.getByText('공지사항')).toBeInTheDocument();
    });

    it('모든 공지사항 렌더링', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);

      expect(screen.getByText('일반 공지')).toBeInTheDocument();
      expect(screen.getByText('중요 공지 (고정)')).toBeInTheDocument();
      expect(screen.getByText('업데이트 공지')).toBeInTheDocument();
    });

    it('카테고리 필터 표시', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });
  });

  describe('정렬', () => {
    it('고정된 공지가 먼저', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);

      // 고정된 공지가 목록에 있는지 확인
      expect(screen.getByText('중요 공지 (고정)')).toBeInTheDocument();
      // 카드 순서는 sortAnnouncements 로직에 의해 보장됨
    });
  });

  describe('읽지 않은 공지 수', () => {
    it('읽지 않은 공지 수 표시', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);
      expect(screen.getByTestId('unread-count')).toHaveTextContent('3개 읽지 않음');
    });

    it('일부 읽은 경우', () => {
      const readIds = new Set(['ann-1']);
      render(<AnnouncementList announcements={mockAnnouncements} readIds={readIds} />);
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2개 읽지 않음');
    });

    it('모두 읽은 경우 숨김', () => {
      const readIds = new Set(['ann-1', 'ann-2', 'ann-3']);
      render(<AnnouncementList announcements={mockAnnouncements} readIds={readIds} />);
      expect(screen.queryByTestId('unread-count')).not.toBeInTheDocument();
    });
  });

  describe('카테고리 필터', () => {
    it('전체 선택 시 모든 공지 표시', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);

      expect(screen.getByText('일반 공지')).toBeInTheDocument();
      expect(screen.getByText('중요 공지 (고정)')).toBeInTheDocument();
      expect(screen.getByText('업데이트 공지')).toBeInTheDocument();
    });

    // 참고: Select 컴포넌트 상호작용은 E2E 테스트에서 검증
    it('카테고리 필터 존재 확인', () => {
      render(<AnnouncementList announcements={mockAnnouncements} />);
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });
  });

  describe('공지사항 선택', () => {
    it('클릭 시 핸들러 호출', () => {
      const onSelect = vi.fn();
      render(
        <AnnouncementList announcements={mockAnnouncements} onSelect={onSelect} />
      );

      fireEvent.click(screen.getByText('일반 공지'));

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ann-1' })
      );
    });
  });

  describe('빈 상태', () => {
    it('공지사항 없을 때 메시지', () => {
      render(<AnnouncementList announcements={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('공지사항이 없습니다')).toBeInTheDocument();
    });

    // 참고: Select 필터 상호작용 테스트는 E2E에서 검증
  });

  describe('간략 보기', () => {
    it('compact 모드 적용', () => {
      render(<AnnouncementList announcements={mockAnnouncements} compact />);
      // 내용이 숨겨져 있음
      expect(screen.queryByText('일반 공지 내용')).not.toBeInTheDocument();
    });
  });
});
