/**
 * AnalysisCard 컴포넌트 테스트
 * @description 대시보드 분석 결과 카드 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisCard from '@/app/(main)/dashboard/_components/AnalysisCard';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

describe('AnalysisCard', () => {
  describe('퍼스널 컬러 카드', () => {
    it('퍼스널 컬러 분석 카드를 렌더링한다', () => {
      const analysis = {
        id: 'pc-1',
        type: 'personal-color' as const,
        createdAt: new Date(),
        summary: '봄 웜톤 🌸',
        seasonType: 'Spring',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('퍼스널 컬러')).toBeInTheDocument();
      expect(screen.getByText('봄 웜톤 🌸')).toBeInTheDocument();
    });

    it('퍼스널 컬러 페이지로 링크된다', () => {
      const analysis = {
        id: 'pc-1',
        type: 'personal-color' as const,
        createdAt: new Date(),
        summary: '여름 쿨톤 🌊',
      };

      render(<AnalysisCard analysis={analysis} />);

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', '/analysis/personal-color');
    });
  });

  describe('피부 분석 카드', () => {
    it('피부 분석 카드를 렌더링한다', () => {
      const analysis = {
        id: 'skin-1',
        type: 'skin' as const,
        createdAt: new Date(),
        summary: '피부 점수 75점',
        skinScore: 75,
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('피부 분석')).toBeInTheDocument();
      expect(screen.getByText('피부 점수 75점')).toBeInTheDocument();
    });

    it('피부 분석 페이지로 링크된다', () => {
      const analysis = {
        id: 'skin-1',
        type: 'skin' as const,
        createdAt: new Date(),
        summary: '피부 점수 80점',
      };

      render(<AnalysisCard analysis={analysis} />);

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', '/analysis/skin');
    });
  });

  describe('체형 분석 카드', () => {
    it('체형 분석 카드를 렌더링한다', () => {
      const analysis = {
        id: 'body-1',
        type: 'body' as const,
        createdAt: new Date(),
        summary: '모래시계형',
        bodyType: 'hourglass',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('체형 분석')).toBeInTheDocument();
      expect(screen.getByText('모래시계형')).toBeInTheDocument();
    });

    it('체형 분석 페이지로 링크된다', () => {
      const analysis = {
        id: 'body-1',
        type: 'body' as const,
        createdAt: new Date(),
        summary: '직사각형',
      };

      render(<AnalysisCard analysis={analysis} />);

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', '/analysis/body');
    });
  });

  describe('헤어 분석 카드', () => {
    it('헤어 분석 카드를 렌더링한다', () => {
      const analysis = {
        id: 'hair-1',
        type: 'hair' as const,
        createdAt: new Date(),
        summary: '웨이브 · 85점',
        hairScore: 85,
        hairType: 'wavy',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('헤어 분석')).toBeInTheDocument();
      expect(screen.getByText('웨이브 · 85점')).toBeInTheDocument();
    });

    it('헤어 분석 페이지로 링크된다', () => {
      const analysis = {
        id: 'hair-1',
        type: 'hair' as const,
        createdAt: new Date(),
        summary: '직모 · 90점',
      };

      render(<AnalysisCard analysis={analysis} />);

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', '/analysis/hair');
    });
  });

  describe('메이크업 분석 카드', () => {
    it('메이크업 분석 카드를 렌더링한다', () => {
      const analysis = {
        id: 'makeup-1',
        type: 'makeup' as const,
        createdAt: new Date(),
        summary: '웜톤 · 78점',
        undertone: 'warm',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('메이크업 분석')).toBeInTheDocument();
      expect(screen.getByText('웜톤 · 78점')).toBeInTheDocument();
    });

    it('메이크업 분석 페이지로 링크된다', () => {
      const analysis = {
        id: 'makeup-1',
        type: 'makeup' as const,
        createdAt: new Date(),
        summary: '쿨톤 · 82점',
      };

      render(<AnalysisCard analysis={analysis} />);

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', '/analysis/makeup');
    });
  });

  describe('상대 시간 표시', () => {
    it('방금 전을 표시한다', () => {
      const analysis = {
        id: 'test-1',
        type: 'personal-color' as const,
        createdAt: new Date(),
        summary: '테스트',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('방금 전')).toBeInTheDocument();
    });

    it('분 단위를 표시한다', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const analysis = {
        id: 'test-1',
        type: 'skin' as const,
        createdAt: thirtyMinutesAgo,
        summary: '테스트',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('30분 전')).toBeInTheDocument();
    });

    it('시간 단위를 표시한다', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const analysis = {
        id: 'test-1',
        type: 'body' as const,
        createdAt: fiveHoursAgo,
        summary: '테스트',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('5시간 전')).toBeInTheDocument();
    });

    it('일 단위를 표시한다', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const analysis = {
        id: 'test-1',
        type: 'personal-color' as const,
        createdAt: threeDaysAgo,
        summary: '테스트',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('3일 전')).toBeInTheDocument();
    });

    it('주 단위를 표시한다', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const analysis = {
        id: 'test-1',
        type: 'skin' as const,
        createdAt: twoWeeksAgo,
        summary: '테스트',
      };

      render(<AnalysisCard analysis={analysis} />);

      expect(screen.getByText('2주 전')).toBeInTheDocument();
    });
  });
});
