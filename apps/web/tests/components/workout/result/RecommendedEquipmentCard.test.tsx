import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecommendedEquipmentCard from '@/components/workout/result/RecommendedEquipmentCard';
import type { WorkoutEquipment } from '@/types/product';

// next/link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// equipment repository 모킹
const mockEquipment: WorkoutEquipment[] = [
  {
    id: 'equip-1',
    name: '덤벨 10kg 세트',
    brand: '홈짐 프로',
    category: 'dumbbell',
    targetMuscles: ['arms', 'shoulders'],
    skillLevel: 'beginner',
    priceKrw: 45000,
    rating: 4.5,
    reviewCount: 123,
    imageUrl: 'https://example.com/dumbbell.jpg',
  },
  {
    id: 'equip-2',
    name: '풀업바',
    brand: '피트니스 킹',
    category: 'pull_up_bar',
    targetMuscles: ['back', 'arms'],
    skillLevel: 'intermediate',
    priceKrw: 35000,
    rating: 4.3,
    reviewCount: 89,
  },
];

vi.mock('@/lib/products/repositories/equipment', () => ({
  getRecommendedEquipment: vi.fn(),
}));

import { getRecommendedEquipment } from '@/lib/products/repositories/equipment';
const mockedGetRecommendedEquipment = vi.mocked(getRecommendedEquipment);

describe('RecommendedEquipmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRecommendedEquipment.mockResolvedValue(mockEquipment);
  });

  describe('기본 렌더링', () => {
    it('카드 컨테이너 렌더링', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByTestId('recommended-equipment-card')).toBeInTheDocument();
      });
    });

    it('헤더에 제목 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });
    });

    it('추천 개수 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('2개 추천')).toBeInTheDocument();
      });
    });
  });

  describe('확장/축소 동작', () => {
    it('기본적으로 축소 상태', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.queryByTestId('equipment-item')).not.toBeInTheDocument();
      });
    });

    it('펼치기 버튼 클릭 시 장비 목록 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button', { name: /펼치기/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('덤벨 10kg 세트')).toBeInTheDocument();
        expect(screen.getByText('풀업바')).toBeInTheDocument();
      });
    });

    it('접기 버튼 클릭 시 목록 숨김', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      // 펼치기
      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('덤벨 10kg 세트')).toBeInTheDocument();
      });

      // 접기
      fireEvent.click(screen.getByRole('button', { name: /접기/i }));

      await waitFor(() => {
        expect(screen.queryByText('덤벨 10kg 세트')).not.toBeInTheDocument();
      });
    });
  });

  describe('장비 아이템 표시', () => {
    it('장비 이름과 브랜드 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('덤벨 10kg 세트')).toBeInTheDocument();
        expect(screen.getByText('홈짐 프로')).toBeInTheDocument();
      });
    });

    it('가격 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('45,000원')).toBeInTheDocument();
      });
    });

    it('평점 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
      });
    });

    it('상세보기 링크 존재', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        const detailLinks = screen.getAllByText('상세보기');
        expect(detailLinks.length).toBeGreaterThan(0);

        const link = detailLinks[0].closest('a');
        expect(link).toHaveAttribute('href', '/products/equipment/equip-1');
      });
    });

    it('타겟 근육 태그 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        // 여러 장비에서 같은 태그가 나올 수 있음
        expect(screen.getAllByText('arms').length).toBeGreaterThan(0);
        expect(screen.getByText('shoulders')).toBeInTheDocument();
      });
    });
  });

  describe('props 전달', () => {
    it('targetMuscles prop으로 필터링 요청', async () => {
      render(<RecommendedEquipmentCard targetMuscles={['chest', 'back']} />);

      await waitFor(() => {
        expect(mockedGetRecommendedEquipment).toHaveBeenCalledWith(
          ['chest', 'back'],
          undefined,
          undefined,
          undefined
        );
      });
    });

    it('skillLevel prop 전달', async () => {
      render(<RecommendedEquipmentCard skillLevel="beginner" />);

      await waitFor(() => {
        expect(mockedGetRecommendedEquipment).toHaveBeenCalledWith(
          undefined,
          undefined,
          'beginner',
          undefined
        );
      });
    });

    it('useLocation prop 전달', async () => {
      render(<RecommendedEquipmentCard useLocation="home" />);

      await waitFor(() => {
        expect(mockedGetRecommendedEquipment).toHaveBeenCalledWith(
          undefined,
          undefined,
          undefined,
          'home'
        );
      });
    });
  });

  describe('빈 상태', () => {
    it('장비가 없으면 컴포넌트 미렌더링', async () => {
      mockedGetRecommendedEquipment.mockResolvedValue([]);

      const { container } = render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('더보기 링크', () => {
    it('모든 운동 기구 보기 링크 표시', async () => {
      render(<RecommendedEquipmentCard />);

      await waitFor(() => {
        expect(screen.getByText('추천 운동 기구')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));

      await waitFor(() => {
        const allEquipmentLink = screen.getByText('모든 운동 기구 보기');
        expect(allEquipmentLink.closest('a')).toHaveAttribute('href', '/products?type=equipment');
      });
    });
  });
});
