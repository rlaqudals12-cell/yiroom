/**
 * LayeringGuide 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayeringGuide } from '@/components/style/LayeringGuide';

// lucide-react 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Thermometer: () => <span data-testid="icon-thermometer">🌡</span>,
  };
});

describe('LayeringGuide', () => {
  it('renders with data-testid', () => {
    render(<LayeringGuide feelsLike={15} />);
    expect(screen.getByTestId('layering-guide')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(<LayeringGuide feelsLike={15} />);
    expect(screen.getByText('레이어링 가이드')).toBeInTheDocument();
  });

  it('displays feels like temperature', () => {
    render(<LayeringGuide feelsLike={15} />);
    expect(screen.getByText('15°C')).toBeInTheDocument();
    expect(screen.getByText('체감온도')).toBeInTheDocument();
  });

  describe('temperature ranges', () => {
    it('shows 한파 for extreme cold (-10°C)', () => {
      render(<LayeringGuide feelsLike={-10} />);
      expect(screen.getByText('한파')).toBeInTheDocument();
    });

    it('shows 매우 추움 for very cold (0°C)', () => {
      render(<LayeringGuide feelsLike={0} />);
      expect(screen.getByText('매우 추움')).toBeInTheDocument();
    });

    it('shows 추움 for cold (8°C)', () => {
      render(<LayeringGuide feelsLike={8} />);
      expect(screen.getByText('추움')).toBeInTheDocument();
    });

    it('shows 쌀쌀함 for cool (15°C)', () => {
      render(<LayeringGuide feelsLike={15} />);
      expect(screen.getByText('쌀쌀함')).toBeInTheDocument();
    });

    it('shows 선선함 for mild (20°C)', () => {
      render(<LayeringGuide feelsLike={20} />);
      expect(screen.getByText('선선함')).toBeInTheDocument();
    });

    it('shows 따뜻함 for warm (25°C)', () => {
      render(<LayeringGuide feelsLike={25} />);
      expect(screen.getByText('따뜻함')).toBeInTheDocument();
    });

    it('shows 더움 for hot (30°C)', () => {
      render(<LayeringGuide feelsLike={30} />);
      expect(screen.getByText('더움')).toBeInTheDocument();
    });
  });

  describe('layer descriptions', () => {
    it('shows 패딩+니트+내의 for extreme cold', () => {
      render(<LayeringGuide feelsLike={-10} />);
      expect(screen.getByText('패딩+니트+내의')).toBeInTheDocument();
    });

    it('shows 코트+맨투맨+셔츠 for very cold', () => {
      render(<LayeringGuide feelsLike={0} />);
      expect(screen.getByText('코트+맨투맨+셔츠')).toBeInTheDocument();
    });

    it('shows 가디건+셔츠 for cold', () => {
      render(<LayeringGuide feelsLike={8} />);
      expect(screen.getByText('가디건+셔츠')).toBeInTheDocument();
    });

    it('shows 가벼운 아우터 for cool', () => {
      render(<LayeringGuide feelsLike={15} />);
      expect(screen.getByText('가벼운 아우터')).toBeInTheDocument();
    });

    it('shows 긴팔 또는 반팔 for mild', () => {
      render(<LayeringGuide feelsLike={20} />);
      expect(screen.getByText('긴팔 또는 반팔')).toBeInTheDocument();
    });

    it('shows 반팔+반바지 for warm', () => {
      render(<LayeringGuide feelsLike={25} />);
      expect(screen.getByText('반팔+반바지')).toBeInTheDocument();
    });

    it('shows 민소매/린넨 for hot', () => {
      render(<LayeringGuide feelsLike={30} />);
      expect(screen.getByText('민소매/린넨')).toBeInTheDocument();
    });
  });

  it('displays layer count', () => {
    render(<LayeringGuide feelsLike={0} />);
    expect(screen.getByText('레이어 수')).toBeInTheDocument();
    expect(screen.getByText('3겹')).toBeInTheDocument();
  });

  it('displays minimum for hot weather', () => {
    render(<LayeringGuide feelsLike={30} />);
    expect(screen.getByText('최소')).toBeInTheDocument();
  });

  it('displays temperature guide legend', () => {
    render(<LayeringGuide feelsLike={15} />);

    expect(screen.getByText(/❄️ -5°C 이하/)).toBeInTheDocument();
    expect(screen.getByText(/🧥 5~12°C/)).toBeInTheDocument();
    expect(screen.getByText(/☀️ 23°C\+/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LayeringGuide feelsLike={15} className="custom-class" />);
    const card = screen.getByTestId('layering-guide');
    expect(card.className).toContain('custom-class');
  });
});
