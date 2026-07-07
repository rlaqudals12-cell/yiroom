/**
 * Phase J P3-D: 코디 공유 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutfitShareCard from '@/components/styling/OutfitShareCard';
import OutfitShareModal from '@/components/styling/OutfitShareModal';
import type { FullOutfit } from '@/types/styling';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

// Mock outfit 데이터
const mockFullOutfit: FullOutfit = {
  id: 'test-outfit-1',
  seasonType: 'spring',
  occasion: 'daily',
  clothing: {
    id: 'test-clothing',
    name: '봄 코디',
    description: '밝고 화사한 봄 스타일',
    colors: {
      top: { name: '코랄 핑크', hex: '#FF7F7F' },
      bottom: { name: '웜 베이지', hex: '#F5DEB3' },
    },
    style: 'casual',
    occasions: ['daily'],
    seasonTypes: ['spring'],
  },
  accessory: {
    metalTone: 'gold',
    items: [
      {
        type: 'necklace',
        name: '골드 체인 목걸이',
        metalTone: 'gold',
        gemstone: { name: '시트린', hex: '#FFD700' },
      },
    ],
  },
  makeup: {
    lipstick: { name: '코랄 핑크', hex: '#FF7F7F' },
    eyeshadow: [{ name: '골드 베이지', hex: '#DAA520' }],
    blusher: { name: '피치 핑크', hex: '#FFDAB9' },
  },
  tip: '코랄 톤으로 통일감 있게 연출하세요',
};

describe('OutfitShareCard', () => {
  it('renders share card with outfit info', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    expect(screen.getByTestId('outfit-share-card')).toBeInTheDocument();
    expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
    expect(screen.getByText('데일리 코디')).toBeInTheDocument();
  });

  it('displays clothing colors', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    // 이모지 정리: 섹션 제목에서 이모지 접두사 제거됨
    expect(screen.getByText('의상 조합')).toBeInTheDocument();
    expect(screen.getByText('상의')).toBeInTheDocument();
    expect(screen.getByText('하의')).toBeInTheDocument();
    expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
    expect(screen.getByText('웜 베이지')).toBeInTheDocument();
  });

  it('displays accessory info', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    // 이모지 정리: 섹션 제목에서 이모지 접두사 제거됨
    expect(screen.getByText('악세서리')).toBeInTheDocument();
    expect(screen.getByText('골드')).toBeInTheDocument();
  });

  it('displays makeup info', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    // 이모지 정리: 섹션 제목에서 이모지 접두사 제거됨
    expect(screen.getByText('메이크업')).toBeInTheDocument();
    expect(screen.getByText('립')).toBeInTheDocument();
    expect(screen.getByText('블러셔')).toBeInTheDocument();
  });

  it('displays tip', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    expect(screen.getByText(/코랄 톤으로 통일감 있게/)).toBeInTheDocument();
  });

  it('displays footer branding', () => {
    render(<OutfitShareCard outfit={mockFullOutfit} seasonType="spring" />);

    expect(screen.getByText('이룸 - 나를 위한 AI 스타일링')).toBeInTheDocument();
  });
});

describe('OutfitShareModal', () => {
  it('renders modal when open', () => {
    render(
      <OutfitShareModal
        open={true}
        onOpenChange={vi.fn()}
        outfit={mockFullOutfit}
        seasonType="spring"
      />
    );

    expect(screen.getByTestId('outfit-share-modal')).toBeInTheDocument();
    expect(screen.getByText('코디 공유')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <OutfitShareModal
        open={false}
        onOpenChange={vi.fn()}
        outfit={mockFullOutfit}
        seasonType="spring"
      />
    );

    expect(screen.queryByTestId('outfit-share-modal')).not.toBeInTheDocument();
  });

  it('shows download button', () => {
    render(
      <OutfitShareModal
        open={true}
        onOpenChange={vi.fn()}
        outfit={mockFullOutfit}
        seasonType="spring"
      />
    );

    expect(screen.getByText('저장')).toBeInTheDocument();
  });

  it('shows copy button', () => {
    render(
      <OutfitShareModal
        open={true}
        onOpenChange={vi.fn()}
        outfit={mockFullOutfit}
        seasonType="spring"
      />
    );

    expect(screen.getByText('복사')).toBeInTheDocument();
  });

  it('returns null when outfit is null', () => {
    const { container } = render(
      <OutfitShareModal open={true} onOpenChange={vi.fn()} outfit={null} seasonType="spring" />
    );

    expect(container.firstChild).toBeNull();
  });
});
