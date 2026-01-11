/**
 * 지역 선택 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegionSelector, RegionBadge } from '@/components/common/RegionSelector';

// useRegion 훅 mock
vi.mock('@/hooks/useRegion', () => ({
  useRegion: () => ({
    region: 'KR',
    regionInfo: {
      code: 'KR',
      name: '한국',
      nameEn: 'South Korea',
      currency: 'KRW',
      currencySymbol: '₩',
      language: 'ko',
      flag: '🇰🇷',
      affiliateSupport: true,
      affiliatePartners: ['coupang', 'iherb'],
    },
    isUserSelected: false,
    supportedRegions: ['KR', 'US', 'JP', 'CN', 'SEA', 'EU', 'OTHER'],
    affiliateRegions: ['KR', 'US', 'JP', 'EU'],
    partners: ['coupang', 'iherb'],
    setRegion: vi.fn(),
    resetRegion: vi.fn(),
    getProductLinks: vi.fn(() => []),
  }),
}));

// lucide-react mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Check: () => <span data-testid="check-icon">Check</span>,
    ChevronDown: () => <span data-testid="chevron-icon">Chevron</span>,
    Globe: () => <span data-testid="globe-icon">Globe</span>,
    RotateCcw: () => <span data-testid="reset-icon">Reset</span>,
  };
});

describe('RegionSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('기본 렌더링', () => {
      render(<RegionSelector />);

      expect(screen.getByTestId('region-selector')).toBeInTheDocument();
      expect(screen.getByText('한국')).toBeInTheDocument();
      expect(screen.getByText('🇰🇷')).toBeInTheDocument();
    });

    it('컴팩트 모드에서는 국기만 표시', () => {
      render(<RegionSelector compact />);

      expect(screen.getByText('🇰🇷')).toBeInTheDocument();
      expect(screen.queryByText('한국')).not.toBeInTheDocument();
    });
  });

  describe('드롭다운 동작', () => {
    it('클릭하면 드롭다운 열림', () => {
      render(<RegionSelector />);

      const trigger = screen.getByRole('button', { expanded: false });
      fireEvent.click(trigger);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('지역 목록이 표시됨', () => {
      render(<RegionSelector />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('option', { name: /한국/i })).toBeInTheDocument();
    });

    it('백드롭 클릭하면 닫힘', () => {
      render(<RegionSelector />);

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // 백드롭 클릭
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('aria-expanded 속성이 올바르게 설정됨', () => {
      render(<RegionSelector />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('aria-haspopup 속성이 있음', () => {
      render(<RegionSelector />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('listbox에 aria-label이 있음', () => {
      render(<RegionSelector />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', '지역 선택');
    });
  });
});

describe('RegionBadge', () => {
  it('지역 배지 렌더링', () => {
    render(<RegionBadge />);

    expect(screen.getByTestId('region-badge')).toBeInTheDocument();
    expect(screen.getByText('🇰🇷')).toBeInTheDocument();
    expect(screen.getByText('한국')).toBeInTheDocument();
  });

  it('Globe 아이콘이 표시됨', () => {
    render(<RegionBadge />);

    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });
});
