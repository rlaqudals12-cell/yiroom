/**
 * 공지사항 페이지 테스트
 * @description AnnouncementsClient 컴포넌트 테스트 (Server Component는 통합 테스트로)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnnouncementsClient } from '@/app/(main)/announcements/AnnouncementsClient';
import type { Announcement } from '@/types/announcements';

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
    announcements: Announcement[];
    readIds: Set<string>;
    onSelect: (announcement: Announcement) => void;
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

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock 데이터
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '이룸 2.0 업데이트 안내',
    content: '새로운 기능이 대거 추가된 이룸 2.0 버전이 출시되었습니다!',
    category: 'update',
    priority: 10,
    isPinned: true,
    isPublished: true,
    publishedAt: new Date('2025-12-24'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 1234,
    createdAt: new Date('2025-12-24'),
    updatedAt: new Date('2025-12-24'),
  },
  {
    id: '2',
    title: '연말 이벤트: 30일 챌린지에 참여하세요!',
    content: '2025년을 건강하게 마무리하세요!',
    category: 'event',
    priority: 5,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-01'),
    expiresAt: new Date('2025-12-31'),
    authorId: 'admin-1',
    viewCount: 567,
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id: '3',
    title: '12월 25일 서버 점검 안내',
    content: '서버 안정화 및 성능 개선을 위해 점검을 진행합니다.',
    category: 'maintenance',
    priority: 8,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-23'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 234,
    createdAt: new Date('2025-12-23'),
    updatedAt: new Date('2025-12-23'),
  },
  {
    id: '4',
    title: '이용약관 개정 안내',
    content: '이룸 서비스 이용약관이 개정됩니다.',
    category: 'important',
    priority: 7,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-20'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 89,
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20'),
  },
];

describe('AnnouncementsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('기본 렌더링', () => {
    it('페이지 렌더링', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByText('공지사항')).toBeInTheDocument();
    });

    it('뒤로가기 버튼 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('대시보드 링크', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('공지사항 목록 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByTestId('announcement-list')).toBeInTheDocument();
    });

    it('빈 목록일 때 안내 메시지 표시', () => {
      render(<AnnouncementsClient announcements={[]} initialReadIds={[]} />);
      expect(screen.getByText('등록된 공지사항이 없습니다.')).toBeInTheDocument();
    });
  });

  describe('공지사항 데이터', () => {
    it('첫 번째 공지사항 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByText('이룸 2.0 업데이트 안내')).toBeInTheDocument();
    });

    it('이벤트 공지사항 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByText('연말 이벤트: 30일 챌린지에 참여하세요!')).toBeInTheDocument();
    });

    it('점검 공지사항 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByText('12월 25일 서버 점검 안내')).toBeInTheDocument();
    });

    it('중요 공지사항 표시', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      expect(screen.getByText('이용약관 개정 안내')).toBeInTheDocument();
    });
  });

  describe('공지사항 선택', () => {
    it('공지사항 클릭 시 상세 시트 열림', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      fireEvent.click(screen.getByTestId('announcement-item-1'));

      expect(screen.getByTestId('announcement-detail-sheet')).toBeInTheDocument();
    });

    it('공지사항 클릭 시 읽음 처리', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      const item = screen.getByTestId('announcement-item-1');

      // 클릭 전: 읽지 않음
      expect(item).toHaveAttribute('data-read', 'false');

      // 클릭
      fireEvent.click(item);

      // 클릭 후: 읽음
      expect(item).toHaveAttribute('data-read', 'true');
    });

    it('공지사항 클릭 시 API 호출', async () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      fireEvent.click(screen.getByTestId('announcement-item-1'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/announcements/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: '1' }),
        });
      });
    });

    it('이미 읽은 공지사항은 API 호출 안함', async () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={['1']} />);
      const item = screen.getByTestId('announcement-item-1');

      // 이미 읽음
      expect(item).toHaveAttribute('data-read', 'true');

      // 클릭해도 API 호출 안함
      fireEvent.click(item);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('여러 공지사항 읽음 처리', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);

      fireEvent.click(screen.getByTestId('announcement-item-1'));
      fireEvent.click(screen.getByTestId('announcement-item-2'));

      expect(screen.getByTestId('announcement-item-1')).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('announcement-item-2')).toHaveAttribute('data-read', 'true');
    });
  });

  describe('초기 읽음 상태', () => {
    it('초기 읽음 ID로 읽음 상태 설정', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={['1', '3']} />);

      expect(screen.getByTestId('announcement-item-1')).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('announcement-item-2')).toHaveAttribute('data-read', 'false');
      expect(screen.getByTestId('announcement-item-3')).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('announcement-item-4')).toHaveAttribute('data-read', 'false');
    });
  });

  describe('레이아웃', () => {
    it('컨테이너 최대 너비', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      const container = screen.getByText('공지사항').closest('div');
      expect(container?.parentElement).toHaveClass('max-w-2xl');
    });

    it('헤더 flex 레이아웃', () => {
      render(<AnnouncementsClient announcements={mockAnnouncements} initialReadIds={[]} />);
      const header = screen.getByText('공지사항').closest('div');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('gap-4');
    });
  });
});
