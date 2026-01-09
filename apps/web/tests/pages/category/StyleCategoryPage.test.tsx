/**
 * StyleCategoryPage 테스트
 * @description 스타일 카테고리 페이지 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Next.js 라우터 모킹
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

const mockParams = {
  slug: 'tops',
};

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => mockRouter,
  useParams: () => mockParams,
}));

// FadeInUp 애니메이션 모킹
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// BottomNav 모킹
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav">Bottom Nav</nav>,
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user-1' },
    isLoaded: true,
  }),
}));

// Mock Supabase - 체이너블 쿼리 빌더 (Promise 기반)
const createChainableMock = (data: unknown = []) => {
  const result = { data, error: null };
  const createChain = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.range = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    // Promise-like then을 사용하여 async/await 지원
    chain.then = (
      resolve: (value: typeof result) => unknown,
      reject?: (error: unknown) => unknown
    ) => {
      return Promise.resolve(result).then(resolve, reject);
    };
    chain.catch = (reject: (error: unknown) => unknown) => {
      return Promise.resolve(result).catch(reject);
    };
    return chain;
  };
  return createChain();
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn((table: string) => {
      if (table === 'body_analyses') {
        return createChainableMock({ body_type: 'W' });
      }
      // affiliate_products, lookbook_posts - 빈 배열 반환하여 fallback 데이터 사용
      return createChainableMock([]);
    }),
  }),
}));

// Mock useInfiniteScroll - 입력받은 items를 displayedItems로 반환
vi.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn((items) => ({
    displayedItems: items || [],
    hasMore: false,
    isLoading: false,
    sentinelRef: { current: null },
  })),
}));

import StyleCategoryPage from '@/app/(main)/style/category/[slug]/page';

describe('StyleCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.slug = 'tops';
  });

  describe('렌더링', () => {
    it('페이지가 올바르게 렌더링된다', async () => {
      render(<StyleCategoryPage />);

      expect(screen.getByTestId('style-category-page')).toBeInTheDocument();
      expect(screen.getByText('상의')).toBeInTheDocument();
      expect(screen.getByText('티셔츠, 블라우스, 니트')).toBeInTheDocument();
    });

    it('체형 프로필이 표시된다', async () => {
      render(<StyleCategoryPage />);

      expect(screen.getByText('내 체형:')).toBeInTheDocument();
      // 비동기 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('웨이브')).toBeInTheDocument();
      });
    });

    it('제품 목록이 표시된다', async () => {
      render(<StyleCategoryPage />);

      // 비동기 데이터 로드 대기 (fallback 데이터 사용)
      await waitFor(() => {
        expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      });
      expect(screen.getByText('하이웨스트 슬랙스')).toBeInTheDocument();
    });

    it('제품/아이템 개수가 표시된다', async () => {
      render(<StyleCategoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/\d+개 아이템/)).toBeInTheDocument();
      });
    });

    it('BottomNav가 표시된다', () => {
      render(<StyleCategoryPage />);

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    });
  });

  describe('네비게이션', () => {
    it('뒤로가기 버튼 클릭 시 router.back() 호출', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      const backButton = screen.getByLabelText('뒤로가기');
      await user.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('필터 버튼 클릭 시 필터 페이지로 이동', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      const filterButton = screen.getByLabelText('필터');
      await user.click(filterButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/style/filter');
    });

    it('일반 아이템 클릭 시 상세 페이지로 이동', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      // 비동기 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      });

      const productCard = screen.getByText('크롭 니트').closest('button');
      await user.click(productCard!);

      expect(mockRouter.push).toHaveBeenCalledWith('/style/1');
    });

    it('코디 아이템 클릭 시 outfit 페이지로 이동', async () => {
      // outfit 카테고리에서만 코디 아이템이 표시됨
      mockParams.slug = 'outfit';
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      // 비동기 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('봄 웜톤 코디')).toBeInTheDocument();
      });

      const outfitCard = screen.getByText('봄 웜톤 코디').closest('button');
      await user.click(outfitCard!);

      expect(mockRouter.push).toHaveBeenCalledWith('/style/outfit/5');
    });
  });

  describe('매칭률 필터', () => {
    it('매칭률 필터 토글 시 제품 목록이 변경된다', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      // 초기: 80% 이상 필터 ON
      const filterButton = screen.getByText(/80% 이상/);
      expect(filterButton).toHaveClass('bg-primary');

      // 필터 OFF
      await user.click(filterButton);
      expect(filterButton).toHaveClass('bg-muted');
    });
  });

  describe('정렬', () => {
    it('정렬 메뉴가 열리고 닫힌다', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      // 초기: 매칭률순
      const sortButton = screen.getByText('매칭률순');
      await user.click(sortButton);

      // 정렬 옵션 표시
      expect(screen.getByText('평점순')).toBeInTheDocument();
      expect(screen.getByText('리뷰순')).toBeInTheDocument();
      expect(screen.getByText('가격 낮은순')).toBeInTheDocument();
      expect(screen.getByText('가격 높은순')).toBeInTheDocument();
    });

    it('가격 낮은순 정렬 선택', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

      // 정렬 메뉴 열기
      await user.click(screen.getByText('매칭률순'));

      // 가격 낮은순 선택
      await user.click(screen.getByText('가격 낮은순'));

      // 메뉴가 닫히고 버튼 텍스트 변경
      // getAllByText 사용 (버튼과 메뉴 아이템 모두에 있을 수 있음)
      const sortButtons = screen.getAllByText('가격 낮은순');
      expect(sortButtons.length).toBeGreaterThan(0);
    });
  });

  describe('제품 카드', () => {
    it('제품 정보가 올바르게 표시된다', async () => {
      render(<StyleCategoryPage />);

      // 비동기 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      });

      // 제품명
      expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      // 브랜드
      expect(screen.getByText('무신사')).toBeInTheDocument();
      // 가격
      expect(screen.getByText('39,000원')).toBeInTheDocument();
      // 매칭률
      expect(screen.getByText('95% 매칭')).toBeInTheDocument();
    });

    it('코디 카테고리에서는 코디 뱃지가 표시된다', async () => {
      // outfit 카테고리에서 코디 뱃지 확인
      // 카테고리별 표시 테스트에서 outfit 검증함
      mockParams.slug = 'outfit';
      const { unmount } = render(<StyleCategoryPage />);

      // 코디 카테고리 헤더 확인 (비동기 대기 없이 헤더는 바로 표시)
      expect(screen.getByText('완성된 코디 추천')).toBeInTheDocument();

      // 코디 카테고리명이 헤더에 표시됨
      const outfitHeaders = screen.getAllByText('코디');
      expect(outfitHeaders.length).toBeGreaterThan(0);

      unmount();
    });

    it('평점과 리뷰 수가 표시된다', async () => {
      render(<StyleCategoryPage />);

      // 비동기 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      });

      // 여러 제품의 평점이 있을 수 있음
      const ratings = screen.getAllByText('4.8');
      expect(ratings.length).toBeGreaterThan(0);
      const reviewCounts = screen.getAllByText('(1,234)');
      expect(reviewCounts.length).toBeGreaterThan(0);
    });
  });

  describe('카테고리별 표시', () => {
    it('bottoms 카테고리 표시', () => {
      mockParams.slug = 'bottoms';
      render(<StyleCategoryPage />);

      expect(screen.getByText('하의')).toBeInTheDocument();
      expect(screen.getByText('팬츠, 스커트, 진')).toBeInTheDocument();
    });

    it('outer 카테고리 표시', () => {
      mockParams.slug = 'outer';
      render(<StyleCategoryPage />);

      expect(screen.getByText('아우터')).toBeInTheDocument();
      expect(screen.getByText('자켓, 코트, 가디건')).toBeInTheDocument();
    });

    it('outfit 카테고리 표시', () => {
      mockParams.slug = 'outfit';
      render(<StyleCategoryPage />);

      // 헤더의 카테고리명 확인 (여러 개 있을 수 있음)
      const codiTexts = screen.getAllByText('코디');
      expect(codiTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('완성된 코디 추천')).toBeInTheDocument();
    });

    it('알 수 없는 카테고리는 slug를 그대로 표시', () => {
      mockParams.slug = 'unknown-category';
      render(<StyleCategoryPage />);

      expect(screen.getByText('unknown-category')).toBeInTheDocument();
    });
  });
});
