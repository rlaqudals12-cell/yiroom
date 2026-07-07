/**
 * Phase J P3: FullOutfit 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FullOutfit, {
  ClothingSection,
  AccessorySection,
  MakeupSection,
  OutfitPreviewCard,
} from '@/components/styling/FullOutfit';
import type { FullOutfit as FullOutfitType } from '@/types/styling';

// Mock 전체 코디 데이터
const mockFullOutfit: FullOutfitType = {
  id: 'test-outfit-1',
  seasonType: 'spring',
  occasion: 'daily',
  clothing: {
    id: 'test-clothing',
    name: '코랄 + 베이지',
    description: '따뜻하고 부드러운 인상',
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
        type: 'earring',
        name: '코랄 드롭',
        metalTone: 'gold',
        gemstone: { name: '코랄', hex: '#FF7F7F' },
      },
      {
        type: 'necklace',
        name: '피치 펜던트',
        metalTone: 'gold',
        gemstone: { name: '피치 문스톤', hex: '#FFDAB9' },
      },
    ],
  },
  makeup: {
    lipstick: { name: '코랄 핑크', hex: '#FF7F7F', finish: 'glossy' },
    eyeshadow: [
      { name: '베이지', hex: '#F5F5DC', finish: 'matte' },
      { name: '피치', hex: '#FFDAB9', finish: 'shimmer' },
    ],
    blusher: { name: '코랄', hex: '#FF7F7F' },
  },
  tip: '코랄 톤으로 통일감 있게 연출하세요',
};

describe('ClothingSection', () => {
  it('renders clothing with top and bottom', () => {
    render(<ClothingSection outfit={mockFullOutfit} />);

    expect(screen.getByTestId('clothing-section')).toBeInTheDocument();
    expect(screen.getByText('👕 의상')).toBeInTheDocument();
    expect(screen.getByText('상의')).toBeInTheDocument();
    expect(screen.getByText('하의')).toBeInTheDocument();
    expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
    expect(screen.getByText('웜 베이지')).toBeInTheDocument();
  });
});

describe('AccessorySection', () => {
  it('renders accessory items with metal tone', () => {
    render(<AccessorySection outfit={mockFullOutfit} />);

    expect(screen.getByTestId('accessory-section')).toBeInTheDocument();
    expect(screen.getByText('💎 악세서리')).toBeInTheDocument();
    expect(screen.getByText('골드')).toBeInTheDocument();
    expect(screen.getByText('코랄 드롭')).toBeInTheDocument();
    expect(screen.getByText('피치 펜던트')).toBeInTheDocument();
  });
});

describe('MakeupSection', () => {
  it('renders makeup with lipstick, eyeshadow, and blusher', () => {
    render(<MakeupSection outfit={mockFullOutfit} />);

    expect(screen.getByTestId('makeup-section')).toBeInTheDocument();
    expect(screen.getByText('💄 메이크업')).toBeInTheDocument();
    expect(screen.getByText('립')).toBeInTheDocument();
    expect(screen.getByText('아이')).toBeInTheDocument();
    expect(screen.getByText('블러셔')).toBeInTheDocument();
  });
});

describe('OutfitPreviewCard', () => {
  it('renders outfit preview with all sections', () => {
    render(<OutfitPreviewCard outfit={mockFullOutfit} occasion="daily" />);

    expect(screen.getByTestId('outfit-preview-card')).toBeInTheDocument();
    expect(screen.getByTestId('clothing-section')).toBeInTheDocument();
    expect(screen.getByTestId('accessory-section')).toBeInTheDocument();
    expect(screen.getByTestId('makeup-section')).toBeInTheDocument();
  });

  it('shows tip', () => {
    render(<OutfitPreviewCard outfit={mockFullOutfit} occasion="daily" />);

    expect(screen.getByText('코랄 톤으로 통일감 있게 연출하세요')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', () => {
    const handleSave = vi.fn();
    render(<OutfitPreviewCard outfit={mockFullOutfit} occasion="daily" onSave={handleSave} />);

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith(mockFullOutfit, 'daily');
  });

  it('calls onShare when share button clicked', () => {
    const handleShare = vi.fn();
    render(<OutfitPreviewCard outfit={mockFullOutfit} occasion="daily" onShare={handleShare} />);

    const shareButton = screen.getByText('공유');
    fireEvent.click(shareButton);

    expect(handleShare).toHaveBeenCalledWith(mockFullOutfit);
  });

  it('shows saved state when isSaved is true', () => {
    render(<OutfitPreviewCard outfit={mockFullOutfit} occasion="daily" isSaved />);

    expect(screen.getByText('저장됨')).toBeInTheDocument();
  });
});

describe('FullOutfit', () => {
  it('renders null when no presets found', () => {
    // @ts-expect-error - intentionally testing invalid season type
    const { container } = render(<FullOutfit seasonType="invalid" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders full outfit for spring', () => {
    render(<FullOutfit seasonType="spring" />);

    expect(screen.getByTestId('full-outfit')).toBeInTheDocument();
    // i18n 도입으로 제목은 번역 키로 렌더링됨 (테스트 목이 키 반환, ko: '👗 전체 코디 추천')
    expect(screen.getByText('fullOutfit9')).toBeInTheDocument();
  });

  it('renders occasion tabs', () => {
    render(<FullOutfit seasonType="spring" />);

    expect(screen.getByText('데일리')).toBeInTheDocument();
    expect(screen.getByText('출근')).toBeInTheDocument();
    expect(screen.getByText('데이트')).toBeInTheDocument();
    expect(screen.getByText('파티')).toBeInTheDocument();
  });

  it('shows daily preset by default', () => {
    render(<FullOutfit seasonType="spring" />);

    expect(screen.getByText('화사한 봄 데일리')).toBeInTheDocument();
    expect(screen.getByText('따뜻하고 밝은 일상 스타일')).toBeInTheDocument();
  });

  it('has clickable occasion tabs', () => {
    render(<FullOutfit seasonType="spring" />);

    // 탭이 클릭 가능한지 확인
    const workTab = screen.getByRole('tab', { name: /출근/ });
    expect(workTab).toBeInTheDocument();
    expect(workTab).not.toBeDisabled();
  });

  it('renders outfit preview card', () => {
    render(<FullOutfit seasonType="spring" />);

    expect(screen.getByTestId('outfit-preview-card')).toBeInTheDocument();
  });
});
