/**
 * OutfitRecommendation 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutfitRecommendation } from '@/components/style/OutfitRecommendation';
import type { OutfitRecommendation as OutfitRecommendationType } from '@/types/weather';

// lucide-react 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Shirt: () => <span data-testid="icon-shirt">👔</span>,
    Footprints: () => <span data-testid="icon-footprints">👟</span>,
    Umbrella: () => <span data-testid="icon-umbrella">☂</span>,
    Palette: () => <span data-testid="icon-palette">🎨</span>,
    Lightbulb: () => <span data-testid="icon-lightbulb">💡</span>,
    Sparkles: () => <span data-testid="icon-sparkles">✨</span>,
  };
});

// Mock 추천 데이터
const mockRecommendation: OutfitRecommendationType = {
  layers: [
    { type: 'outer', name: '트렌치코트', reason: '13°C 체감온도에 적합' },
    { type: 'top', name: '니트', reason: '레이어링하기 좋은 아이템' },
    { type: 'bottom', name: '슬랙스', reason: '스트레이트 체형에 어울리는 핏' },
    { type: 'shoes', name: '로퍼', reason: '13°C에 적합한 신발' },
  ],
  accessories: ['우산', '선글라스'],
  colors: ['네이비', '베이지', '카멜'],
  materials: ['울 블렌드', '면'],
  tips: ['오후에 기온이 올라갈 예정이에요.', 'UV 지수가 높으니 선글라스 챙기세요.'],
  weatherSummary: '서울 맑음, 15°C (체감 13°C)',
};

describe('OutfitRecommendation', () => {
  it('renders with data-testid', () => {
    render(<OutfitRecommendation recommendation={mockRecommendation} />);
    expect(screen.getByTestId('outfit-recommendation')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(<OutfitRecommendation recommendation={mockRecommendation} />);
    expect(screen.getByText('오늘의 코디 추천')).toBeInTheDocument();
  });

  it('displays weather summary', () => {
    render(<OutfitRecommendation recommendation={mockRecommendation} />);
    expect(screen.getByText(mockRecommendation.weatherSummary)).toBeInTheDocument();
  });

  describe('layers', () => {
    it('displays all layer items', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText('트렌치코트')).toBeInTheDocument();
      expect(screen.getByText('니트')).toBeInTheDocument();
      expect(screen.getByText('슬랙스')).toBeInTheDocument();
      expect(screen.getByText('로퍼')).toBeInTheDocument();
    });

    it('displays layer labels', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText('아우터')).toBeInTheDocument();
      expect(screen.getByText('상의')).toBeInTheDocument();
      expect(screen.getByText('하의')).toBeInTheDocument();
      expect(screen.getByText('신발')).toBeInTheDocument();
    });

    it('displays layer reasons', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText('13°C 체감온도에 적합')).toBeInTheDocument();
      expect(screen.getByText('레이어링하기 좋은 아이템')).toBeInTheDocument();
    });
  });

  describe('accessories', () => {
    it('displays accessories section', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);
      expect(screen.getByText('오늘 필요한 아이템')).toBeInTheDocument();
    });

    it('displays all accessories', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText('우산')).toBeInTheDocument();
      expect(screen.getByText('선글라스')).toBeInTheDocument();
    });

    it('does not show accessories section when empty', () => {
      const noAccessories = { ...mockRecommendation, accessories: [] };
      render(<OutfitRecommendation recommendation={noAccessories} />);

      expect(screen.queryByText('오늘 필요한 아이템')).not.toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('displays colors section', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);
      expect(screen.getByText('추천 색상')).toBeInTheDocument();
    });

    it('displays all colors', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText('네이비')).toBeInTheDocument();
      expect(screen.getByText('베이지')).toBeInTheDocument();
      expect(screen.getByText('카멜')).toBeInTheDocument();
    });
  });

  describe('materials', () => {
    it('displays materials', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText(/울 블렌드/)).toBeInTheDocument();
      expect(screen.getByText(/면/)).toBeInTheDocument();
    });
  });

  describe('tips', () => {
    it('displays tips section', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);
      expect(screen.getByText('스타일 팁')).toBeInTheDocument();
    });

    it('displays all tips', () => {
      render(<OutfitRecommendation recommendation={mockRecommendation} />);

      expect(screen.getByText(/오후에 기온이 올라갈/)).toBeInTheDocument();
      expect(screen.getByText(/UV 지수가 높으니/)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onProductClick when layer is clicked', () => {
      const handleClick = vi.fn();
      render(
        <OutfitRecommendation
          recommendation={mockRecommendation}
          onProductClick={handleClick}
        />
      );

      // 첫 번째 레이어 클릭
      const outerLayer = screen.getByText('트렌치코트').closest('div');
      fireEvent.click(outerLayer!);

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'outer',
          name: '트렌치코트',
        })
      );
    });
  });

  it('applies custom className', () => {
    render(
      <OutfitRecommendation
        recommendation={mockRecommendation}
        className="custom-class"
      />
    );
    const card = screen.getByTestId('outfit-recommendation');
    expect(card.className).toContain('custom-class');
  });
});
