/**
 * Phase J P2: AccessoryStyling 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccessoryStyling, {
  MetalToneCard,
  AccessoryCard,
} from '@/components/styling/AccessoryStyling';
import type { AccessoryRecommendation, AccessoryItem } from '@/types/styling';

// Mock 금속 톤 추천
const mockMetalToneRecommended: AccessoryRecommendation = {
  metalTone: 'gold',
  isRecommended: true,
  description: '옐로우 골드가 가장 잘 어울립니다',
};

const mockMetalToneNotRecommended: AccessoryRecommendation = {
  metalTone: 'silver',
  isRecommended: false,
  description: '차가운 실버는 피하는 것이 좋습니다',
};

// Mock 악세서리 아이템
const mockAccessoryWithGemstone: AccessoryItem = {
  type: 'earring',
  name: '코랄 드롭',
  metalTone: 'gold',
  gemstone: { name: '코랄', hex: '#FF7F7F' },
  tip: '작은 사이즈가 더 화사해 보입니다',
};

const mockAccessoryWithoutGemstone: AccessoryItem = {
  type: 'ring',
  name: '골드 밴드',
  metalTone: 'gold',
  tip: '심플한 골드 링이 세련된 느낌',
};

describe('MetalToneCard', () => {
  it('renders recommended metal tone with badge', () => {
    render(<MetalToneCard recommendation={mockMetalToneRecommended} />);

    expect(screen.getByTestId('metal-tone-card')).toBeInTheDocument();
    expect(screen.getByText('골드')).toBeInTheDocument();
    // 추천 배지와 추천 라벨 둘 다 있음
    expect(screen.getAllByText('추천')).toHaveLength(2);
  });

  it('renders not recommended metal tone without badge', () => {
    render(<MetalToneCard recommendation={mockMetalToneNotRecommended} />);

    expect(screen.getByText('실버')).toBeInTheDocument();
    expect(screen.getByText('비추천')).toBeInTheDocument();
  });

  it('shows description', () => {
    render(<MetalToneCard recommendation={mockMetalToneRecommended} />);

    expect(screen.getByText(/옐로우 골드가 가장 잘 어울립니다/)).toBeInTheDocument();
  });
});

describe('AccessoryCard', () => {
  it('renders accessory with gemstone', () => {
    render(<AccessoryCard item={mockAccessoryWithGemstone} />);

    expect(screen.getByTestId('accessory-card')).toBeInTheDocument();
    expect(screen.getByText('코랄 드롭')).toBeInTheDocument();
    expect(screen.getByText('귀걸이')).toBeInTheDocument();
    expect(screen.getByText('코랄')).toBeInTheDocument();
  });

  it('renders accessory without gemstone', () => {
    render(<AccessoryCard item={mockAccessoryWithoutGemstone} />);

    expect(screen.getByText('골드 밴드')).toBeInTheDocument();
    expect(screen.getByText('반지')).toBeInTheDocument();
  });

  it('shows tip when provided', () => {
    render(<AccessoryCard item={mockAccessoryWithGemstone} />);

    expect(screen.getByText('작은 사이즈가 더 화사해 보입니다')).toBeInTheDocument();
  });

  it('shows metal tone label', () => {
    render(<AccessoryCard item={mockAccessoryWithGemstone} />);

    expect(screen.getByText('골드')).toBeInTheDocument();
  });
});

describe('AccessoryStyling', () => {
  it('renders null when styling not found', () => {
    // @ts-expect-error - intentionally testing invalid season type
    const { container } = render(<AccessoryStyling seasonType="invalid" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders accessory styling for spring', () => {
    render(<AccessoryStyling seasonType="spring" />);

    expect(screen.getByTestId('accessory-styling')).toBeInTheDocument();
    expect(screen.getByText('악세서리 추천')).toBeInTheDocument();
    expect(screen.getByText('금속 톤 가이드')).toBeInTheDocument();
  });

  it('renders metal tone cards for all seasons', () => {
    render(<AccessoryStyling seasonType="spring" />);

    const metalToneCards = screen.getAllByTestId('metal-tone-card');
    expect(metalToneCards).toHaveLength(4); // gold, silver, rose_gold, bronze
  });

  it('renders accessory items', () => {
    render(<AccessoryStyling seasonType="spring" />);

    const accessoryCards = screen.getAllByTestId('accessory-card');
    expect(accessoryCards.length).toBeGreaterThan(0);
  });

  it('shows general tip', () => {
    render(<AccessoryStyling seasonType="spring" />);

    expect(screen.getByText(/봄 웜톤은 옐로우 골드와 따뜻한 색상의 원석이/)).toBeInTheDocument();
  });

  it('renders different content for winter season', () => {
    render(<AccessoryStyling seasonType="winter" />);

    expect(screen.getByText(/겨울 쿨톤은 실버와 선명한 색상의 보석이/)).toBeInTheDocument();
  });
});
