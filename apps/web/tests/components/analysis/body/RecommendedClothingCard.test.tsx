import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendedClothingCard from '@/components/analysis/body/RecommendedClothingCard';
import type { ColorRecommendations } from '@/lib/mock/body-analysis';

// window.open mock
vi.stubGlobal('open', vi.fn());

describe('RecommendedClothingCard', () => {
  const defaultProps = {
    bodyType: 'X' as const,
    styleRecommendations: [
      { item: '핏한 상의', reason: '허리 강조' },
      { item: 'A라인 스커트', reason: '균형잡힌 실루엣' },
    ],
  };

  const mockColorRecommendations: ColorRecommendations = {
    topColors: ['아이보리', '베이지'],
    bottomColors: ['네이비', '차콜'],
    avoidColors: ['형광색'],
    bestCombinations: [{ top: '아이보리', bottom: '네이비' }],
    accessories: ['골드 악세서리'],
  };

  it('renders correctly with collapsed state', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    expect(screen.getByTestId('recommended-clothing-card')).toBeInTheDocument();
    expect(screen.getByText('맞춤 의류 추천')).toBeInTheDocument();
    expect(screen.getByText(/체형에 맞는.*아이템/)).toBeInTheDocument();
  });

  it('expands when clicking the toggle button', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    // Initially collapsed - no clothing items visible
    expect(screen.queryByTestId('clothing-item')).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByRole('button', { name: '펼치기' });
    fireEvent.click(expandButton);

    // Now clothing items should be visible
    expect(screen.getAllByTestId('clothing-item').length).toBeGreaterThan(0);
  });

  it('shows shopping links when expanded', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    // Expand the card
    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    // Check for shopping links
    const musinsaLinks = screen.getAllByTestId('musinsa-link');
    const coupangLinks = screen.getAllByTestId('coupang-link');

    expect(musinsaLinks.length).toBeGreaterThan(0);
    expect(coupangLinks.length).toBeGreaterThan(0);

    // Check link attributes
    expect(musinsaLinks[0]).toHaveAttribute('target', '_blank');
    expect(musinsaLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(coupangLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('shows musinsa link with correct URL format', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    const musinsaLinks = screen.getAllByTestId('musinsa-link');
    expect(musinsaLinks[0].getAttribute('href')).toContain('musinsa.com/search');
  });

  it('shows coupang link with correct URL format', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    const coupangLinks = screen.getAllByTestId('coupang-link');
    expect(coupangLinks[0].getAttribute('href')).toContain('coupang.com/np/search');
  });

  it('displays personal color season badge when provided', () => {
    render(<RecommendedClothingCard {...defaultProps} personalColorSeason="웜톤 봄" />);

    expect(screen.getByText('웜톤 봄톤')).toBeInTheDocument();
  });

  it('shows color recommendation notice when colorRecommendations provided', () => {
    render(
      <RecommendedClothingCard {...defaultProps} colorRecommendations={mockColorRecommendations} />
    );

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    expect(screen.getByText('퍼스널컬러 기반 색상이 반영된 추천이에요')).toBeInTheDocument();
  });

  it('shows recommended color for clothing items when colorRecommendations provided', () => {
    render(
      <RecommendedClothingCard {...defaultProps} colorRecommendations={mockColorRecommendations} />
    );

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    // Should show recommended colors from colorRecommendations (상의에 적용됨)
    expect(screen.getAllByText('아이보리 추천').length).toBeGreaterThan(0);
  });

  it('collapses when clicking toggle button again', () => {
    render(<RecommendedClothingCard {...defaultProps} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));
    expect(screen.getAllByTestId('clothing-item').length).toBeGreaterThan(0);

    // Collapse
    fireEvent.click(screen.getByRole('button', { name: '접기' }));
    expect(screen.queryByTestId('clothing-item')).not.toBeInTheDocument();
  });

  describe('body type specific items', () => {
    it('shows X body type items (mapped to S/스트레이트)', () => {
      render(<RecommendedClothingCard {...defaultProps} bodyType="X" />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      // X타입은 S(스트레이트)로 매핑됨
      expect(screen.getByText('슬림핏 티셔츠')).toBeInTheDocument();
      expect(screen.getByText('스트레이트 슬랙스')).toBeInTheDocument();
    });

    it('shows A body type items (mapped to W/웨이브)', () => {
      render(<RecommendedClothingCard {...defaultProps} bodyType="A" />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      // A타입은 W(웨이브)로 매핑됨
      expect(screen.getByText('페플럼 블라우스')).toBeInTheDocument();
      expect(screen.getByText('하이웨이스트 팬츠')).toBeInTheDocument();
    });

    it('shows V body type items (mapped to S/스트레이트)', () => {
      render(<RecommendedClothingCard {...defaultProps} bodyType="V" />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      // V타입은 S(스트레이트)로 매핑됨
      expect(screen.getByText('슬림핏 티셔츠')).toBeInTheDocument();
      expect(screen.getByText('스트레이트 슬랙스')).toBeInTheDocument();
    });

    it('shows 8 body type items (mapped to W/웨이브)', () => {
      render(<RecommendedClothingCard {...defaultProps} bodyType="8" />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      // 8타입은 W(웨이브)로 매핑됨
      expect(screen.getByText('페플럼 블라우스')).toBeInTheDocument();
      expect(screen.getByText('하이웨이스트 팬츠')).toBeInTheDocument();
    });
  });

  describe('category badges', () => {
    it('shows category badges for items', () => {
      render(<RecommendedClothingCard {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      // X body type has 상의, 하의, 악세서리 categories
      expect(screen.getAllByText('상의').length).toBeGreaterThan(0);
      expect(screen.getAllByText('하의').length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has accessible button labels', () => {
      render(<RecommendedClothingCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: '펼치기' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
    });

    it('shopping links have proper rel attributes for security', () => {
      render(<RecommendedClothingCard {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

      const links = [
        ...screen.getAllByTestId('musinsa-link'),
        ...screen.getAllByTestId('coupang-link'),
      ];

      links.forEach((link) => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });
});
