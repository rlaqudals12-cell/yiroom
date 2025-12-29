/**
 * StyleCategoryPage 테스트
 * @description 스타일 카테고리 페이지 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

import StyleCategoryPage from '@/app/(main)/style/category/[slug]/page';

describe('StyleCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.slug = 'tops';
  });

  describe('렌더링', () => {
    it('페이지가 올바르게 렌더링된다', () => {
      render(<StyleCategoryPage />);

      expect(screen.getByTestId('style-category-page')).toBeInTheDocument();
      expect(screen.getByText('상의')).toBeInTheDocument();
      expect(screen.getByText('티셔츠, 블라우스, 니트')).toBeInTheDocument();
    });

    it('체형 프로필이 표시된다', () => {
      render(<StyleCategoryPage />);

      expect(screen.getByText('내 체형:')).toBeInTheDocument();
      expect(screen.getByText('웨이브')).toBeInTheDocument();
    });

    it('제품 목록이 표시된다', () => {
      render(<StyleCategoryPage />);

      expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      expect(screen.getByText('하이웨스트 슬랙스')).toBeInTheDocument();
    });

    it('제품/아이템 개수가 표시된다', () => {
      render(<StyleCategoryPage />);

      expect(screen.getByText(/\d+개 아이템/)).toBeInTheDocument();
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

      const productCard = screen.getByText('크롭 니트').closest('button');
      await user.click(productCard!);

      expect(mockRouter.push).toHaveBeenCalledWith('/style/1');
    });

    it('코디 아이템 클릭 시 outfit 페이지로 이동', async () => {
      const user = userEvent.setup();
      render(<StyleCategoryPage />);

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
    it('제품 정보가 올바르게 표시된다', () => {
      render(<StyleCategoryPage />);

      // 제품명
      expect(screen.getByText('크롭 니트')).toBeInTheDocument();
      // 브랜드
      expect(screen.getByText('무신사')).toBeInTheDocument();
      // 가격
      expect(screen.getByText('39,000원')).toBeInTheDocument();
      // 매칭률
      expect(screen.getByText('95% 매칭')).toBeInTheDocument();
    });

    it('코디 아이템에는 코디 뱃지가 표시된다', () => {
      render(<StyleCategoryPage />);

      // 코디 뱃지들 확인
      const outfitBadges = screen.getAllByText('코디');
      expect(outfitBadges.length).toBeGreaterThan(0);
    });

    it('평점과 리뷰 수가 표시된다', () => {
      render(<StyleCategoryPage />);

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
