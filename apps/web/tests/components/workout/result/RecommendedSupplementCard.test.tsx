import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecommendedSupplementCard from '@/components/workout/result/RecommendedSupplementCard';
import type { SupplementProduct } from '@/types/product';

// next/link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// supplement repository 모킹
const mockSupplements: SupplementProduct[] = [
  {
    id: 'supp-1',
    name: 'BCAA 파우더',
    brand: '뉴트리션 랩',
    category: 'protein',
    benefits: ['muscle', 'energy'],
    priceKrw: 32000,
    rating: 4.6,
    reviewCount: 234,
    imageUrl: 'https://example.com/bcaa.jpg',
  },
  {
    id: 'supp-2',
    name: '종합비타민',
    brand: '헬스케어 플러스',
    category: 'vitamin',
    benefits: ['immunity', 'energy'],
    priceKrw: 28000,
    rating: 4.4,
    reviewCount: 567,
  },
];

vi.mock('@/lib/products/repositories/supplement', () => ({
  getRecommendedSupplements: vi.fn(),
}));

import { getRecommendedSupplements } from '@/lib/products/repositories/supplement';
const mockedGetRecommendedSupplements = vi.mocked(getRecommendedSupplements);

describe('RecommendedSupplementCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRecommendedSupplements.mockResolvedValue(mockSupplements);
  });

  describe('기본 렌더링', () => {
    it('카드 컨테이너 렌더링', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByTestId('recommended-supplement-card')).toBeInTheDocument();
      });
    });

    it('헤더에 제목 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });
    });

    it('추천 개수 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('운동 효과를 높여줄 2개')).toBeInTheDocument();
      });
    });
  });

  describe('확장/축소 동작', () => {
    it('기본적으로 축소 상태', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.queryByTestId('supplement-item')).not.toBeInTheDocument();
      });
    });

    it('펼치기 버튼 클릭 시 영양제 목록 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button', { name: /펼치기/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('BCAA 파우더')).toBeInTheDocument();
        expect(screen.getByText('종합비타민')).toBeInTheDocument();
      });
    });

    it('접기 버튼 클릭 시 목록 숨김', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      // 펼치기
      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('BCAA 파우더')).toBeInTheDocument();
      });

      // 접기
      fireEvent.click(screen.getByRole('button', { name: /접기/i }));

      await waitFor(() => {
        expect(screen.queryByText('BCAA 파우더')).not.toBeInTheDocument();
      });
    });
  });

  describe('영양제 아이템 표시', () => {
    it('영양제 이름과 브랜드 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('BCAA 파우더')).toBeInTheDocument();
        expect(screen.getByText('뉴트리션 랩')).toBeInTheDocument();
      });
    });

    it('가격 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('32,000원')).toBeInTheDocument();
      });
    });

    it('평점 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('4.6')).toBeInTheDocument();
      });
    });

    it('상세보기 링크 존재', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        const detailLinks = screen.getAllByText('상세보기');
        expect(detailLinks.length).toBeGreaterThan(0);

        const link = detailLinks[0].closest('a');
        expect(link).toHaveAttribute('href', '/products/supplement/supp-1');
      });
    });

    it('효능 태그 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        // 여러 영양제에서 같은 태그가 나올 수 있음
        expect(screen.getByText('muscle')).toBeInTheDocument();
        expect(screen.getAllByText('energy').length).toBeGreaterThan(0);
      });
    });
  });

  describe('props 전달 및 목표 매핑', () => {
    it('workoutGoals가 muscle_gain이면 muscle, energy 효능으로 요청', async () => {
      render(<RecommendedSupplementCard workoutGoals={['muscle_gain']} />);

      await waitFor(() => {
        expect(mockedGetRecommendedSupplements).toHaveBeenCalledWith(
          undefined,
          ['muscle', 'energy']
        );
      });
    });

    it('workoutGoals가 weight_loss이면 digestion, energy 효능으로 요청', async () => {
      render(<RecommendedSupplementCard workoutGoals={['weight_loss']} />);

      await waitFor(() => {
        expect(mockedGetRecommendedSupplements).toHaveBeenCalledWith(
          undefined,
          ['digestion', 'energy']
        );
      });
    });

    it('concerns prop 전달', async () => {
      render(<RecommendedSupplementCard concerns={['fatigue', 'stress']} />);

      await waitFor(() => {
        expect(mockedGetRecommendedSupplements).toHaveBeenCalledWith(
          ['fatigue', 'stress'],
          undefined
        );
      });
    });

    it('중복 효능 제거', async () => {
      render(<RecommendedSupplementCard workoutGoals={['muscle_gain', 'endurance']} />);

      await waitFor(() => {
        // muscle_gain: muscle, energy / endurance: energy, immunity
        // 중복 energy 제거 → muscle, energy, immunity
        expect(mockedGetRecommendedSupplements).toHaveBeenCalledWith(
          undefined,
          expect.arrayContaining(['muscle', 'energy', 'immunity'])
        );
      });
    });
  });

  describe('빈 상태', () => {
    it('영양제가 없으면 컴포넌트 미렌더링', async () => {
      mockedGetRecommendedSupplements.mockResolvedValue([]);

      const { container } = render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('더보기 링크', () => {
    it('모든 영양제 보기 링크 표시', async () => {
      render(<RecommendedSupplementCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 영양제')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        const allSupplementLink = screen.getByText('모든 영양제 보기');
        expect(allSupplementLink.closest('a')).toHaveAttribute('href', '/products?type=supplement');
      });
    });
  });
});
