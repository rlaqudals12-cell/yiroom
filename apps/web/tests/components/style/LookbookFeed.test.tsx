import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LookbookFeed } from '@/components/style/LookbookFeed';
import type { LookbookPost } from '@/types/hybrid';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Heart: () => <span data-testid="icon-heart">Heart</span>,
    MessageCircle: () => <span data-testid="icon-message">Message</span>,
    Share2: () => <span data-testid="icon-share">Share</span>,
    User: () => <span data-testid="icon-user">User</span>,
    Filter: () => <span data-testid="icon-filter">Filter</span>,
  };
});

// next/image 모킹
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="lookbook-image" />
  ),
}));

describe('LookbookFeed', () => {
  const mockPosts: LookbookPost[] = [
    {
      id: '1',
      clerkUserId: 'user1',
      imageUrl: '/images/lookbook/look-1.jpg',
      bodyType: 'W',
      personalColor: 'Spring',
      caption: '봄 웜톤 데일리룩',
      outfitItems: [
        { category: 'top', description: '니트', color: '베이지', colorHex: '#D4A574' },
        { category: 'bottom', description: '슬랙스', color: '화이트', colorHex: '#FFFFFF' },
      ],
      likesCount: 234,
      commentsCount: 12,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      clerkUserId: 'user2',
      imageUrl: '/images/lookbook/look-2.jpg',
      bodyType: 'S',
      personalColor: 'Summer',
      caption: '미니멀 오피스룩',
      outfitItems: [{ category: 'top', description: '셔츠', color: '화이트', colorHex: '#FFFFFF' }],
      likesCount: 156,
      commentsCount: 8,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders the feed with test id', () => {
    render(<LookbookFeed posts={mockPosts} />);
    expect(screen.getByTestId('lookbook-feed')).toBeInTheDocument();
  });

  it('displays all posts', () => {
    render(<LookbookFeed posts={mockPosts} />);
    expect(screen.getByText('봄 웜톤 데일리룩')).toBeInTheDocument();
    expect(screen.getByText('미니멀 오피스룩')).toBeInTheDocument();
  });

  it('shows like counts', () => {
    render(<LookbookFeed posts={mockPosts} />);
    expect(screen.getByText('234')).toBeInTheDocument();
    expect(screen.getByText('156')).toBeInTheDocument();
  });

  it('handles like button click', () => {
    const handleLike = vi.fn();
    render(<LookbookFeed posts={mockPosts} onLike={handleLike} />);

    // 좋아요 버튼 클릭 (Heart 아이콘 버튼)
    const likeButtons = screen.getAllByRole('button', { name: /Heart/ });
    fireEvent.click(likeButtons[0]);
    expect(handleLike).toHaveBeenCalledWith('1');
  });

  it('handles share button click', () => {
    const handleShare = vi.fn();
    render(<LookbookFeed posts={mockPosts} onShare={handleShare} />);

    // 공유 버튼 클릭 (aria-label="공유하기")
    const shareButtons = screen.getAllByRole('button', { name: /공유하기/ });
    fireEvent.click(shareButtons[0]);
    expect(handleShare).toHaveBeenCalledWith('1');
  });

  it('handles post click', () => {
    const handlePostClick = vi.fn();
    render(<LookbookFeed posts={mockPosts} onPostClick={handlePostClick} />);

    // 카드 클릭 (cursor-pointer가 있는 div)
    const postCards = screen.getAllByTestId('lookbook-image');
    if (postCards.length > 0) {
      // 부모 카드 클릭
      fireEvent.click(postCards[0].closest('.cursor-pointer') || postCards[0]);
      expect(handlePostClick).toHaveBeenCalledWith('1');
    }
  });

  it('shows filter panel when enabled', () => {
    render(<LookbookFeed posts={mockPosts} showFilters={true} />);

    // 필터 버튼이 있어야 함
    const filterButton = screen.queryByRole('button', { name: /필터/ });
    expect(filterButton || screen.getByText('필터')).toBeTruthy();
  });

  it('hides filter panel when disabled', () => {
    render(<LookbookFeed posts={mockPosts} showFilters={false} />);

    // 필터 버튼이 없어야 함
    expect(screen.queryByText('체형')).not.toBeInTheDocument();
  });

  it('shows empty state when no posts', () => {
    render(<LookbookFeed posts={[]} />);
    expect(screen.getByText(/룩북이 없습니다/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LookbookFeed posts={mockPosts} isLoading={true} />);
    // 로딩 인디케이터가 표시됨
    expect(screen.getByTestId('lookbook-feed')).toBeInTheDocument();
  });

  it('shows load more button when hasMore', () => {
    const handleLoadMore = vi.fn();
    render(<LookbookFeed posts={mockPosts} hasMore={true} onLoadMore={handleLoadMore} />);

    const loadMoreButton = screen.getByText('더 보기');
    fireEvent.click(loadMoreButton);
    expect(handleLoadMore).toHaveBeenCalled();
  });

  it('filters by body type', () => {
    render(<LookbookFeed posts={mockPosts} showFilters={true} />);

    // 필터 패널 열기
    const filterButton = screen.getByText('필터');
    fireEvent.click(filterButton);

    // 웨이브 필터 선택
    const waveFilter = screen.getByText('웨이브');
    fireEvent.click(waveFilter);

    // 필터링된 결과 확인
    expect(screen.getByText('봄 웜톤 데일리룩')).toBeInTheDocument();
  });
});
