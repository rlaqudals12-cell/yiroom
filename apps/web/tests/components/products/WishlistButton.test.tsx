import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WishlistButton } from '@/components/products/WishlistButton';

// sonner / Clerk / Supabase / wishlist repo 모킹
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1' }, isLoaded: true }),
}));
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({}),
}));
vi.mock('@/lib/wishlist', () => ({
  toggleWishlist: vi.fn(),
  checkWishlistStatus: vi.fn().mockResolvedValue(false),
}));

describe('WishlistButton (아이콘 변형)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // IA-2: 제품 상세 헤더에서 '제품함 담기'와 인접해 초보가 구분하기 어려우므로
  // 찜(위시리스트) 아이콘은 반드시 식별 가능한 aria-label을 가져야 한다.
  it('아이콘 버튼에 찜을 식별하는 aria-label이 있다', async () => {
    render(<WishlistButton productType="cosmetic" productId="p1" variant="icon" />);
    const btn = await screen.findByLabelText('위시리스트에 추가');
    expect(btn).toBeInTheDocument();
  });
});
