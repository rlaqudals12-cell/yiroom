/**
 * AffiliateDisclosure 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AffiliateDisclosure,
  AffiliatePageBanner,
  AffiliateCardDisclosure,
  AffiliateTooltip,
} from '@/components/affiliate/AffiliateDisclosure';

describe('AffiliateDisclosure', () => {
  describe('inline variant', () => {
    it('인라인 형태로 렌더링한다', () => {
      render(<AffiliateDisclosure variant="inline" />);

      expect(screen.getByTestId('affiliate-disclosure')).toBeInTheDocument();
      expect(screen.getByText(/수수료를 제공받습니다/)).toBeInTheDocument();
    });

    it('기본값이 inline이다', () => {
      render(<AffiliateDisclosure />);

      expect(screen.getByTestId('affiliate-disclosure')).toHaveClass('text-xs');
    });
  });

  describe('banner variant', () => {
    it('배너 형태로 렌더링한다', () => {
      render(<AffiliateDisclosure variant="banner" />);

      expect(screen.getByTestId('affiliate-disclosure')).toHaveClass('bg-amber-50');
    });

    it('상세 설명을 표시할 수 있다', () => {
      render(<AffiliateDisclosure variant="banner" detailed={true} />);

      expect(screen.getByText(/추가 비용은 발생하지 않으며/)).toBeInTheDocument();
    });
  });

  describe('tooltip variant', () => {
    it('툴팁 형태로 렌더링한다', () => {
      render(<AffiliateDisclosure variant="tooltip" />);

      expect(screen.getByTestId('affiliate-disclosure')).toBeInTheDocument();
      expect(screen.getByText('제휴 링크')).toBeInTheDocument();
    });

    it('title 속성에 상세 설명이 포함된다', () => {
      render(<AffiliateDisclosure variant="tooltip" />);

      const element = screen.getByTestId('affiliate-disclosure');
      expect(element).toHaveAttribute('title');
      expect(element.getAttribute('title')).toContain('쿠팡 파트너스');
    });
  });

  describe('footer variant', () => {
    it('푸터 형태로 렌더링한다', () => {
      render(<AffiliateDisclosure variant="footer" />);

      expect(screen.getByTestId('affiliate-disclosure').tagName).toBe('FOOTER');
    });

    it('상세 모드에서 추가 문구를 표시한다', () => {
      render(<AffiliateDisclosure variant="footer" detailed={true} />);

      expect(screen.getByText(/독립적인 판단/)).toBeInTheDocument();
    });

    it('통신판매중개자 지위 고지를 상시 표시한다 (전자상거래법 §20)', () => {
      render(<AffiliateDisclosure variant="footer" />);

      expect(screen.getByText(/통신판매중개자/)).toBeInTheDocument();
      expect(screen.getByText(/통신판매의 당사자가 아니며/)).toBeInTheDocument();
    });
  });
});

describe('AffiliatePageBanner', () => {
  it('페이지 배너를 렌더링한다', () => {
    render(<AffiliatePageBanner />);

    expect(screen.getByTestId('affiliate-disclosure')).toHaveClass('bg-amber-50');
    expect(screen.getByText(/추가 비용은 발생하지 않으며/)).toBeInTheDocument();
  });
});

describe('AffiliateCardDisclosure', () => {
  it('카드 고지를 렌더링한다', () => {
    render(<AffiliateCardDisclosure />);

    expect(screen.getByTestId('affiliate-disclosure')).toBeInTheDocument();
    expect(screen.getByText(/수수료를 제공받습니다/)).toBeInTheDocument();
  });
});

describe('AffiliateTooltip', () => {
  it('툴팁을 렌더링한다', () => {
    render(<AffiliateTooltip />);

    expect(screen.getByText('제휴 링크')).toBeInTheDocument();
  });
});
