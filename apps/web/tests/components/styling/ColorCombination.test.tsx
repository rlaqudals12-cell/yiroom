/**
 * Phase J: ColorCombination 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorCombination, {
  ColorSwatch,
  OutfitPreview,
  CombinationCard,
} from '@/components/styling/ColorCombination';
import type { ColorCombination as ColorCombinationType } from '@/types/styling';

// Mock 색상 조합 데이터
const mockCombination: ColorCombinationType = {
  id: 'test-combo-1',
  name: '코랄 + 베이지',
  description: '따뜻하고 부드러운 인상',
  colors: {
    top: { name: '코랄 핑크', hex: '#FF7F7F' },
    bottom: { name: '웜 베이지', hex: '#F5DEB3' },
  },
  style: 'casual',
  occasions: ['daily', 'shopping'],
  seasonTypes: ['spring'],
  tip: '밝은 산호색 상의는 얼굴을 화사하게 밝혀줍니다',
};

const mockCombinationWithAccent: ColorCombinationType = {
  ...mockCombination,
  id: 'test-combo-2',
  colors: {
    ...mockCombination.colors,
    accent: { name: '골드', hex: '#FFD700' },
  },
};

describe('ColorSwatch', () => {
  it('renders color with correct hex', () => {
    render(<ColorSwatch color={mockCombination.colors.top} />);
    const swatch = screen.getByTestId('color-swatch');
    expect(swatch).toHaveStyle({ backgroundColor: '#FF7F7F' });
  });

  it('shows color name when showName is true', () => {
    render(<ColorSwatch color={mockCombination.colors.top} showName />);
    expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
  });

  it('hides color name when showName is false', () => {
    render(<ColorSwatch color={mockCombination.colors.top} showName={false} />);
    expect(screen.queryByText('코랄 핑크')).not.toBeInTheDocument();
  });
});

describe('OutfitPreview', () => {
  it('renders top and bottom colors', () => {
    render(
      <OutfitPreview top={mockCombination.colors.top} bottom={mockCombination.colors.bottom} />
    );
    const preview = screen.getByTestId('outfit-preview');
    expect(preview).toBeInTheDocument();
    expect(screen.getByText('상의')).toBeInTheDocument();
    expect(screen.getByText('하의')).toBeInTheDocument();
  });

  it('renders accent color when provided', () => {
    render(
      <OutfitPreview
        top={mockCombinationWithAccent.colors.top}
        bottom={mockCombinationWithAccent.colors.bottom}
        accent={mockCombinationWithAccent.colors.accent}
      />
    );
    expect(screen.getByText('악센트')).toBeInTheDocument();
  });
});

describe('CombinationCard', () => {
  it('renders combination name and description', () => {
    render(<CombinationCard combination={mockCombination} />);
    expect(screen.getByText('코랄 + 베이지')).toBeInTheDocument();
    expect(screen.getByText('따뜻하고 부드러운 인상')).toBeInTheDocument();
  });

  it('shows styling tip when provided', () => {
    render(<CombinationCard combination={mockCombination} />);
    expect(screen.getByText(/밝은 산호색 상의는/)).toBeInTheDocument();
  });

  it('shows style badge', () => {
    render(<CombinationCard combination={mockCombination} />);
    expect(screen.getByText('캐주얼')).toBeInTheDocument();
  });

  it('calls onProductClick when product button clicked', () => {
    const handleClick = vi.fn();
    render(
      <CombinationCard combination={mockCombination} showProducts onProductClick={handleClick} />
    );

    const productButton = screen.getByText('제품 보기');
    fireEvent.click(productButton);

    expect(handleClick).toHaveBeenCalledWith('test-combo-1');
  });

  it('calls onSave when save button clicked', () => {
    const handleSave = vi.fn();
    render(<CombinationCard combination={mockCombination} onSave={handleSave} />);

    // Bookmark 아이콘 버튼 클릭 (name이 'Bookmark'로 렌더링됨)
    const saveButton = screen.getByRole('button', { name: 'Bookmark' });
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith('test-combo-1');
  });
});

describe('ColorCombination', () => {
  const mockCombinations = [mockCombination, mockCombinationWithAccent];

  it('renders null when no combinations', () => {
    const { container } = render(<ColorCombination combinations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and combinations', () => {
    render(<ColorCombination combinations={mockCombinations} title="테스트 코디" />);
    expect(screen.getByTestId('color-combination')).toBeInTheDocument();
    expect(screen.getByText('테스트 코디')).toBeInTheDocument();
  });

  it('renders multiple combination cards', () => {
    render(<ColorCombination combinations={mockCombinations} />);
    const cards = screen.getAllByTestId('combination-card');
    expect(cards).toHaveLength(2);
  });

  it('uses default title when not provided', () => {
    render(<ColorCombination combinations={mockCombinations} />);
    expect(screen.getByText('추천 코디 조합')).toBeInTheDocument();
  });

  it('passes showProducts to cards', () => {
    render(<ColorCombination combinations={mockCombinations} showProducts />);
    const productButtons = screen.getAllByText('제품 보기');
    expect(productButtons).toHaveLength(2);
  });
});
