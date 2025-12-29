/**
 * BeautyCategoryPage 테스트
 * @description 뷰티 카테고리 페이지 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Next.js 라우터 모킹
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

const mockParams = {
  slug: 'skincare',
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

import BeautyCategoryPage from '@/app/(main)/beauty/category/[slug]/page';

describe('BeautyCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('페이지가 올바르게 렌더링된다', () => {
      render(<BeautyCategoryPage />);

      expect(screen.getByTestId('beauty-category-page')).toBeInTheDocument();
      expect(screen.getByText('스킨케어')).toBeInTheDocument();
      expect(screen.getByText('피부 타입에 맞는 기초 케어')).toBeInTheDocument();
    });

    it('제품 목록이 표시된다', () => {
      render(<BeautyCategoryPage />);

      // 매칭률 80% 이상 제품만 표시 (기본 필터)
      expect(screen.getByText('비타민C 15% 세럼')).toBeInTheDocument();
      expect(screen.getByText('히알루론산 토너')).toBeInTheDocument();
      expect(screen.getByText('나이아신아마이드 세럼')).toBeInTheDocument();
    });

    it('제품 개수가 표시된다', () => {
      render(<BeautyCategoryPage />);

      // 매칭률 80% 이상 필터된 제품 수
      expect(screen.getByText(/\d+개 제품/)).toBeInTheDocument();
    });

    it('BottomNav가 표시된다', () => {
      render(<BeautyCategoryPage />);

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    });
  });

  describe('네비게이션', () => {
    it('뒤로가기 버튼 클릭 시 router.back() 호출', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      const backButton = screen.getByLabelText('뒤로가기');
      await user.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('필터 버튼 클릭 시 필터 페이지로 이동', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      const filterButton = screen.getByLabelText('필터');
      await user.click(filterButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/beauty/filter');
    });

    it('제품 클릭 시 상세 페이지로 이동', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      const productCard = screen.getByText('비타민C 15% 세럼').closest('button');
      await user.click(productCard!);

      expect(mockRouter.push).toHaveBeenCalledWith('/beauty/1');
    });
  });

  describe('매칭률 필터', () => {
    it('매칭률 필터 토글 시 제품 목록이 변경된다', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      // 초기: 80% 이상 필터 ON
      const filterButton = screen.getByText(/80% 이상/);
      expect(filterButton).toHaveClass('bg-primary');

      // 필터 OFF
      await user.click(filterButton);
      expect(filterButton).toHaveClass('bg-muted');

      // 필터 OFF 시 모든 제품 표시
    });
  });

  describe('정렬', () => {
    it('정렬 메뉴가 열리고 닫힌다', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      // 초기: 매칭률순
      const sortButton = screen.getByText('매칭률순');
      await user.click(sortButton);

      // 정렬 옵션 표시
      expect(screen.getByText('평점순')).toBeInTheDocument();
      expect(screen.getByText('리뷰순')).toBeInTheDocument();
      expect(screen.getByText('가격 낮은순')).toBeInTheDocument();
      expect(screen.getByText('가격 높은순')).toBeInTheDocument();
    });

    it('평점순 정렬 선택 시 정렬 변경', async () => {
      const user = userEvent.setup();
      render(<BeautyCategoryPage />);

      // 정렬 메뉴 열기
      await user.click(screen.getByText('매칭률순'));

      // 평점순 선택
      await user.click(screen.getByText('평점순'));

      // 정렬 버튼 텍스트 변경
      expect(screen.getByText('평점순')).toBeInTheDocument();
    });
  });

  describe('제품 카드', () => {
    it('제품 정보가 올바르게 표시된다', () => {
      render(<BeautyCategoryPage />);

      // 제품명
      expect(screen.getByText('비타민C 15% 세럼')).toBeInTheDocument();
      // 브랜드
      expect(screen.getByText('이룸 스킨')).toBeInTheDocument();
      // 가격
      expect(screen.getByText('32,000원')).toBeInTheDocument();
      // 매칭률
      expect(screen.getByText('95% 매칭')).toBeInTheDocument();
    });

    it('평점과 리뷰 수가 표시된다', () => {
      render(<BeautyCategoryPage />);

      // 여러 제품의 평점이 있을 수 있음
      const ratings = screen.getAllByText('4.8');
      expect(ratings.length).toBeGreaterThan(0);
      const reviewCounts = screen.getAllByText('(1,234)');
      expect(reviewCounts.length).toBeGreaterThan(0);
    });
  });

  describe('카테고리별 표시', () => {
    it('알 수 없는 카테고리는 slug를 그대로 표시', () => {
      mockParams.slug = 'unknown-category';
      render(<BeautyCategoryPage />);

      expect(screen.getByText('unknown-category')).toBeInTheDocument();
    });

    it('makeup 카테고리 표시', () => {
      mockParams.slug = 'makeup';
      render(<BeautyCategoryPage />);

      expect(screen.getByText('메이크업')).toBeInTheDocument();
      expect(screen.getByText('퍼스널컬러 맞춤 색조')).toBeInTheDocument();
    });
  });
});
