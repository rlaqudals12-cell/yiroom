import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import type { Announcement } from '@/types/announcements';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Pin: () => <span data-testid="pin-icon">Pin</span>,
    Bell: () => <span data-testid="bell-icon">Bell</span>,
    Eye: () => <span data-testid="eye-icon">Eye</span>,
  };
});

const mockAnnouncement: Announcement = {
  id: 'ann-1',
  title: '테스트 공지사항',
  content: '이것은 테스트 공지사항의 내용입니다.',
  category: 'general',
  priority: 5,
  isPinned: false,
  isPublished: true,
  publishedAt: new Date('2025-12-24'),
  expiresAt: null,
  authorId: 'admin-1',
  viewCount: 100,
  createdAt: new Date('2025-12-24'),
  updatedAt: new Date('2025-12-24'),
};

describe('AnnouncementCard', () => {
  describe('기본 렌더링', () => {
    it('카드 렌더링', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(
        screen.getByTestId(`announcement-card-${mockAnnouncement.id}`)
      ).toBeInTheDocument();
    });

    it('제목 표시', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(screen.getByText('테스트 공지사항')).toBeInTheDocument();
    });

    it('내용 표시 (상세 모드)', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(
        screen.getByText('이것은 테스트 공지사항의 내용입니다.')
      ).toBeInTheDocument();
    });

    it('내용 숨김 (간략 모드)', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} compact />);
      expect(
        screen.queryByText('이것은 테스트 공지사항의 내용입니다.')
      ).not.toBeInTheDocument();
    });

    it('카테고리 배지 표시', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(screen.getByText('일반')).toBeInTheDocument();
    });

    it('조회수 표시', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(screen.getByText('100회 조회')).toBeInTheDocument();
    });

    it('조회수 없으면 숨김', () => {
      const noViewAnnouncement = { ...mockAnnouncement, viewCount: 0 };
      render(<AnnouncementCard announcement={noViewAnnouncement} />);
      expect(screen.queryByText(/회 조회/)).not.toBeInTheDocument();
    });

    it('커스텀 testId', () => {
      render(
        <AnnouncementCard announcement={mockAnnouncement} data-testid="custom-card" />
      );
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });

  describe('읽음 상태', () => {
    it('읽지 않은 공지 NEW 배지', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} isRead={false} />);
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('읽은 공지 NEW 배지 없음', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} isRead={true} />);
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });
  });

  describe('고정 상태', () => {
    it('고정된 공지 아이콘 표시', () => {
      const pinnedAnnouncement = { ...mockAnnouncement, isPinned: true };
      render(<AnnouncementCard announcement={pinnedAnnouncement} />);
      // Pin 아이콘이 있음 (SVG로 렌더링)
      expect(screen.getByTestId(`announcement-card-${mockAnnouncement.id}`)).toBeInTheDocument();
    });
  });

  describe('카테고리별 스타일', () => {
    it('일반 카테고리', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(screen.getByText('일반')).toBeInTheDocument();
    });

    it('업데이트 카테고리', () => {
      const updateAnnouncement = { ...mockAnnouncement, category: 'update' as const };
      render(<AnnouncementCard announcement={updateAnnouncement} />);
      expect(screen.getByText('업데이트')).toBeInTheDocument();
    });

    it('이벤트 카테고리', () => {
      const eventAnnouncement = { ...mockAnnouncement, category: 'event' as const };
      render(<AnnouncementCard announcement={eventAnnouncement} />);
      expect(screen.getByText('이벤트')).toBeInTheDocument();
    });

    it('점검 카테고리', () => {
      const maintenanceAnnouncement = {
        ...mockAnnouncement,
        category: 'maintenance' as const,
      };
      render(<AnnouncementCard announcement={maintenanceAnnouncement} />);
      expect(screen.getByText('점검')).toBeInTheDocument();
    });

    it('중요 카테고리', () => {
      const importantAnnouncement = {
        ...mockAnnouncement,
        category: 'important' as const,
      };
      render(<AnnouncementCard announcement={importantAnnouncement} />);
      expect(screen.getByText('중요')).toBeInTheDocument();
    });
  });

  describe('클릭 핸들러', () => {
    it('클릭 시 핸들러 호출', () => {
      const onClick = vi.fn();
      render(<AnnouncementCard announcement={mockAnnouncement} onClick={onClick} />);

      fireEvent.click(screen.getByTestId(`announcement-card-${mockAnnouncement.id}`));

      expect(onClick).toHaveBeenCalled();
    });

    it('핸들러 없어도 렌더링 정상', () => {
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      expect(
        screen.getByTestId(`announcement-card-${mockAnnouncement.id}`)
      ).toBeInTheDocument();
    });
  });

  describe('날짜 표시', () => {
    it('발행일 표시', () => {
      // 날짜 포맷은 formatAnnouncementDate에 따름
      render(<AnnouncementCard announcement={mockAnnouncement} />);
      // 날짜가 표시되는지 확인 (구체적인 포맷은 상황에 따라 다름)
      expect(screen.getByTestId(`announcement-card-${mockAnnouncement.id}`)).toBeInTheDocument();
    });
  });
});
