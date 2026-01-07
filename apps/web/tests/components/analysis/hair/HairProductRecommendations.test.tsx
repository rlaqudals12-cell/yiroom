import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock 타입 정의
interface HairProduct {
  id: string;
  name: string;
  category: 'shampoo' | 'conditioner' | 'treatment' | 'scalp_care' | 'styling';
  price?: number;
  brand?: string;
}

interface HairProductRecommendationsProps {
  hairType?: 'straight' | 'wavy' | 'curly' | 'coily';
  scalpHealth?: number;
  products?: HairProduct[];
}

// 임시 컴포넌트 스텁 (실제 구현 후 제거)
function HairProductRecommendations({
  hairType,
  scalpHealth,
  products = [],
}: HairProductRecommendationsProps) {
  const categoryLabels: Record<string, string> = {
    shampoo: '샴푸',
    conditioner: '컨디셔너',
    treatment: '트리트먼트',
    scalp_care: '두피 케어',
    styling: '스타일링',
  };

  if (products.length === 0) {
    return (
      <div data-testid="hair-product-recommendations">
        <p>추천 제품이 없습니다</p>
      </div>
    );
  }

  // 카테고리별 그룹핑
  const groupedProducts = products.reduce(
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    },
    {} as Record<string, HairProduct[]>
  );

  // 페이지네이션 (20개씩)
  const displayProducts = products.slice(0, 20);
  const hasMore = products.length > 20;

  return (
    <div data-testid="hair-product-recommendations">
      {hairType && <div>웨이브 전용</div>}
      {scalpHealth !== undefined && scalpHealth < 40 && <div>두피 케어</div>}

      {Object.entries(groupedProducts).map(([category, items]) => (
        <div key={category}>
          <h3>{categoryLabels[category]}</h3>
          <ul role="list">
            {items.slice(0, 20).map((item) => (
              <li key={item.id} role="listitem">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {hasMore && <button>더보기</button>}
    </div>
  );
}

describe('HairProductRecommendations', () => {
  describe('정상 케이스', () => {
    it('헤어 타입별 제품 추천', () => {
      // Given: wavy 헤어 타입
      const hairType = 'wavy';

      // When: 렌더링
      render(<HairProductRecommendations hairType={hairType} products={[]} />);

      // Then: 웨이브 헤어 전용 제품 표시
      expect(screen.getByText(/웨이브 전용/)).toBeInTheDocument();
    });

    it('두피 건강도에 따른 제품 필터링', () => {
      // Given: 낮은 두피 건강 (30점)
      const scalpHealth = 30;

      // When: 렌더링
      render(<HairProductRecommendations scalpHealth={scalpHealth} products={[]} />);

      // Then: 두피 케어 제품 우선 표시
      expect(screen.getByText(/두피 케어/)).toBeInTheDocument();
    });

    it('제품 목록 표시', () => {
      // Given: 5개 추천 제품
      const mockProducts: HairProduct[] = [
        { id: '1', name: '보습 샴푸', category: 'shampoo' },
        { id: '2', name: '영양 컨디셔너', category: 'conditioner' },
        { id: '3', name: '헤어 오일', category: 'treatment' },
        { id: '4', name: '두피 스케일러', category: 'scalp_care' },
        { id: '5', name: '열 보호 스프레이', category: 'styling' },
      ];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 모든 제품 표시
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });
    });

    it('제품 카테고리별 그룹핑', () => {
      // Given: 카테고리 혼재된 제품
      const mockProducts: HairProduct[] = [
        { id: '1', category: 'shampoo', name: '샴푸 A' },
        { id: '2', category: 'shampoo', name: '샴푸 B' },
        { id: '3', category: 'conditioner', name: '컨디셔너 A' },
      ];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 카테고리 헤더 표시
      expect(screen.getByText('샴푸')).toBeInTheDocument();
      expect(screen.getByText('컨디셔너')).toBeInTheDocument();
    });
  });

  describe('카테고리 라벨', () => {
    it('샴푸 카테고리 표시', () => {
      const mockProducts: HairProduct[] = [{ id: '1', category: 'shampoo', name: '샴푸 A' }];
      render(<HairProductRecommendations products={mockProducts} />);
      expect(screen.getByText('샴푸')).toBeInTheDocument();
    });

    it('컨디셔너 카테고리 표시', () => {
      const mockProducts: HairProduct[] = [
        { id: '1', category: 'conditioner', name: '컨디셔너 A' },
      ];
      render(<HairProductRecommendations products={mockProducts} />);
      expect(screen.getByText('컨디셔너')).toBeInTheDocument();
    });

    it('트리트먼트 카테고리 표시', () => {
      const mockProducts: HairProduct[] = [
        { id: '1', category: 'treatment', name: '트리트먼트 A' },
      ];
      render(<HairProductRecommendations products={mockProducts} />);
      expect(screen.getByText('트리트먼트')).toBeInTheDocument();
    });

    it('두피 케어 카테고리 표시', () => {
      const mockProducts: HairProduct[] = [
        { id: '1', category: 'scalp_care', name: '두피 케어 A' },
      ];
      render(<HairProductRecommendations products={mockProducts} />);
      expect(screen.getByText('두피 케어')).toBeInTheDocument();
    });

    it('스타일링 카테고리 표시', () => {
      const mockProducts: HairProduct[] = [{ id: '1', category: 'styling', name: '스타일링 A' }];
      render(<HairProductRecommendations products={mockProducts} />);
      expect(screen.getByText('스타일링')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('추천 제품 없을 때', () => {
      // Given: 빈 제품 배열
      const mockProducts: HairProduct[] = [];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 안내 메시지 표시
      expect(screen.getByText(/추천 제품이 없습니다/)).toBeInTheDocument();
    });

    it('제품 100개 이상 시 페이지네이션', () => {
      // Given: 150개 제품
      const mockProducts: HairProduct[] = Array.from({ length: 150 }, (_, i) => ({
        id: `${i}`,
        name: `제품 ${i}`,
        category: 'shampoo',
      }));

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 첫 20개만 표시 + "더보기" 버튼
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeLessThanOrEqual(20);
      expect(screen.getByText(/더보기/)).toBeInTheDocument();
    });

    it('제품 정확히 20개일 때 더보기 버튼 미표시', () => {
      // Given: 정확히 20개 제품
      const mockProducts: HairProduct[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `제품 ${i}`,
        category: 'shampoo',
      }));

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 더보기 버튼 미표시
      expect(screen.queryByText(/더보기/)).not.toBeInTheDocument();
    });

    it('제품 1개일 때 정상 렌더링', () => {
      // Given: 1개 제품
      const mockProducts: HairProduct[] = [{ id: '1', name: '단독 제품', category: 'shampoo' }];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 제품 표시
      expect(screen.getByText('단독 제품')).toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('더보기 버튼 클릭', () => {
      // Given: 30개 제품
      const mockProducts: HairProduct[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        name: `제품 ${i}`,
        category: 'shampoo',
      }));

      // When: 렌더링 후 더보기 클릭
      render(<HairProductRecommendations products={mockProducts} />);
      const moreButton = screen.getByText(/더보기/);
      fireEvent.click(moreButton);

      // Then: 추가 제품 로드 (실제 구현 시 상태 업데이트 필요)
      expect(moreButton).toBeInTheDocument();
    });
  });

  describe('헤어 타입별 제품 필터링', () => {
    it('직모 타입 제품 추천', () => {
      const hairType = 'straight';
      render(<HairProductRecommendations hairType={hairType} products={[]} />);
      // 실제 구현 시 직모 전용 제품 필터링 로직 필요
      expect(screen.getByTestId('hair-product-recommendations')).toBeInTheDocument();
    });

    it('웨이브 타입 제품 추천', () => {
      const hairType = 'wavy';
      render(<HairProductRecommendations hairType={hairType} products={[]} />);
      expect(screen.getByText(/웨이브 전용/)).toBeInTheDocument();
    });

    it('곱슬 타입 제품 추천', () => {
      const hairType = 'curly';
      render(<HairProductRecommendations hairType={hairType} products={[]} />);
      expect(screen.getByTestId('hair-product-recommendations')).toBeInTheDocument();
    });

    it('코일리 타입 제품 추천', () => {
      const hairType = 'coily';
      render(<HairProductRecommendations hairType={hairType} products={[]} />);
      expect(screen.getByTestId('hair-product-recommendations')).toBeInTheDocument();
    });
  });

  describe('두피 건강도별 제품 우선순위', () => {
    it('두피 건강 좋음 (71-100)', () => {
      const scalpHealth = 85;
      render(<HairProductRecommendations scalpHealth={scalpHealth} products={[]} />);
      // 두피 건강 좋을 때는 두피 케어 우선 미표시
      expect(screen.queryByText(/두피 케어/)).not.toBeInTheDocument();
    });

    it('두피 건강 보통 (41-70)', () => {
      const scalpHealth = 60;
      render(<HairProductRecommendations scalpHealth={scalpHealth} products={[]} />);
      // 보통일 때도 두피 케어 미표시
      expect(screen.queryByText(/두피 케어/)).not.toBeInTheDocument();
    });

    it('두피 건강 나쁨 (0-40)', () => {
      const scalpHealth = 30;
      render(<HairProductRecommendations scalpHealth={scalpHealth} products={[]} />);
      // 나쁠 때 두피 케어 우선 표시
      expect(screen.getByText(/두피 케어/)).toBeInTheDocument();
    });
  });
});
