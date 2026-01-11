/**
 * Phase J P2: MakeupStyling 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MakeupStyling, { ColorSwatch, PaletteCard } from '@/components/styling/MakeupStyling';
import type { MakeupColor, MakeupPalette } from '@/types/styling';

// Mock 메이크업 색상
const mockColorWithFinish: MakeupColor = {
  name: '코랄 핑크',
  hex: '#FF7F7F',
  finish: 'glossy',
};

const mockColorWithoutFinish: MakeupColor = {
  name: '코랄',
  hex: '#FF7F7F',
};

// Mock 팔레트
const mockLipstickPalette: MakeupPalette = {
  category: 'lipstick',
  colors: [
    { name: '코랄 핑크', hex: '#FF7F7F', finish: 'glossy' },
    { name: '피치', hex: '#FFDAB9', finish: 'satin' },
  ],
  tip: '따뜻한 톤의 립이 얼굴을 화사하게 밝혀줍니다',
};

const mockBlusherPalette: MakeupPalette = {
  category: 'blusher',
  colors: [
    { name: '코랄', hex: '#FF7F7F' },
    { name: '피치', hex: '#FFDAB9' },
  ],
  tip: '자연스러운 혈색 표현',
};

describe('ColorSwatch', () => {
  it('renders color with correct hex', () => {
    render(<ColorSwatch color={mockColorWithFinish} />);

    const swatch = screen.getByTestId('makeup-color-swatch');
    expect(swatch).toBeInTheDocument();
    expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
  });

  it('shows finish when provided and showFinish is true', () => {
    render(<ColorSwatch color={mockColorWithFinish} showFinish />);

    expect(screen.getByText('글로시')).toBeInTheDocument();
  });

  it('hides finish when showFinish is false', () => {
    render(<ColorSwatch color={mockColorWithFinish} showFinish={false} />);

    expect(screen.queryByText('글로시')).not.toBeInTheDocument();
  });

  it('does not show finish when color has no finish', () => {
    render(<ColorSwatch color={mockColorWithoutFinish} showFinish />);

    expect(screen.queryByText('글로시')).not.toBeInTheDocument();
    expect(screen.queryByText('매트')).not.toBeInTheDocument();
  });
});

describe('PaletteCard', () => {
  it('renders lipstick palette with category label', () => {
    render(<PaletteCard palette={mockLipstickPalette} />);

    expect(screen.getByTestId('palette-card')).toBeInTheDocument();
    expect(screen.getByText('립스틱')).toBeInTheDocument();
    expect(screen.getByText('💄')).toBeInTheDocument();
  });

  it('renders blusher palette', () => {
    render(<PaletteCard palette={mockBlusherPalette} />);

    expect(screen.getByText('블러셔')).toBeInTheDocument();
    expect(screen.getByText('🌸')).toBeInTheDocument();
  });

  it('shows all colors in palette', () => {
    render(<PaletteCard palette={mockLipstickPalette} />);

    expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
    expect(screen.getByText('피치')).toBeInTheDocument();
  });

  it('shows tip', () => {
    render(<PaletteCard palette={mockLipstickPalette} />);

    expect(screen.getByText(/따뜻한 톤의 립이 얼굴을 화사하게/)).toBeInTheDocument();
  });
});

describe('MakeupStyling', () => {
  it('renders null when styling not found', () => {
    // @ts-expect-error - intentionally testing invalid season type
    const { container } = render(<MakeupStyling seasonType="invalid" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders makeup styling for spring', () => {
    render(<MakeupStyling seasonType="spring" />);

    expect(screen.getByTestId('makeup-styling')).toBeInTheDocument();
    expect(screen.getByText(/메이크업 추천/)).toBeInTheDocument();
  });

  it('renders three palette cards (lipstick, eyeshadow, blusher)', () => {
    render(<MakeupStyling seasonType="spring" />);

    const paletteCards = screen.getAllByTestId('palette-card');
    expect(paletteCards).toHaveLength(3);
  });

  it('renders lipstick palette', () => {
    render(<MakeupStyling seasonType="spring" />);

    expect(screen.getByText('립스틱')).toBeInTheDocument();
  });

  it('renders eyeshadow palette', () => {
    render(<MakeupStyling seasonType="spring" />);

    expect(screen.getByText('아이섀도')).toBeInTheDocument();
  });

  it('renders blusher palette', () => {
    render(<MakeupStyling seasonType="spring" />);

    expect(screen.getByText('블러셔')).toBeInTheDocument();
  });

  it('shows general tip', () => {
    render(<MakeupStyling seasonType="spring" />);

    expect(screen.getByText(/봄 웜톤은 화사하고 밝은 메이크업이/)).toBeInTheDocument();
  });

  it('renders different content for winter season', () => {
    render(<MakeupStyling seasonType="winter" />);

    expect(screen.getByText(/겨울 쿨톤은 선명하고 대비가 강한 메이크업이/)).toBeInTheDocument();
  });

  it('renders summer content correctly', () => {
    render(<MakeupStyling seasonType="summer" />);

    expect(screen.getByText(/여름 쿨톤은 부드럽고 시원한 메이크업이/)).toBeInTheDocument();
  });

  it('renders autumn content correctly', () => {
    render(<MakeupStyling seasonType="autumn" />);

    expect(screen.getByText(/가을 웜톤은 깊이있고 풍부한 메이크업이/)).toBeInTheDocument();
  });
});
