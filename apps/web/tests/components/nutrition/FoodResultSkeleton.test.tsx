/**
 * N-1 FoodResultSkeleton 컴포넌트 테스트
 *
 * 음식 분석 결과 스켈레톤 로딩 UI
 * - 구조 확인 (헤더, 이미지, 영양소, AI 인사이트, 음식 카드, 버튼)
 * - 스켈레톤 요소 존재
 * - 애니메이션 클래스
 * - data-testid
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FoodResultSkeleton } from '@/components/nutrition/FoodResultSkeleton';

// Skeleton 컴포넌트 모킹
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('FoodResultSkeleton', () => {
  describe('기본 렌더링', () => {
    it('스켈레톤 컨테이너를 렌더링한다', () => {
      render(<FoodResultSkeleton />);

      expect(screen.getByTestId('food-result-skeleton')).toBeInTheDocument();
    });

    it('다수의 Skeleton 요소를 렌더링한다', () => {
      render(<FoodResultSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      // 헤더(2) + 이미지(1) + 영양소 요약(9) + AI 인사이트(2)
      // + 음식 카드 제목(1) + 음식 카드 3개(각 5개) + 하단 버튼(2)
      expect(skeletons.length).toBeGreaterThan(15);
    });
  });

  describe('구조 확인', () => {
    it('헤더 영역이 존재한다', () => {
      const { container } = render(<FoodResultSkeleton />);

      // 헤더 영역 (아이콘 + 제목 스켈레톤)
      const headerSkeletons = container.querySelectorAll(
        '.flex.items-center.gap-4 [data-testid="skeleton"]'
      );
      expect(headerSkeletons.length).toBe(2);
    });

    it('이미지 영역 스켈레톤이 존재한다', () => {
      const { container } = render(<FoodResultSkeleton />);

      // aspect-video 클래스를 가진 스켈레톤
      const imageSkeletons = container.querySelectorAll('[data-testid="skeleton"].aspect-video');
      expect(imageSkeletons.length).toBe(1);
    });

    it('영양소 요약 영역이 존재한다', () => {
      const { container } = render(<FoodResultSkeleton />);

      // bg-purple-50 컨테이너
      const nutritionSummary = container.querySelector('.bg-purple-50');
      expect(nutritionSummary).toBeInTheDocument();
    });

    it('AI 인사이트 영역이 존재한다', () => {
      const { container } = render(<FoodResultSkeleton />);

      // bg-blue-50 컨테이너
      const aiInsight = container.querySelector('.bg-blue-50');
      expect(aiInsight).toBeInTheDocument();
    });

    it('음식별 결과 카드 영역이 존재한다 (3개)', () => {
      const { container } = render(<FoodResultSkeleton />);

      // bg-card 클래스를 가진 카드들
      const foodCards = container.querySelectorAll('.bg-card.rounded-xl');
      expect(foodCards.length).toBe(3);
    });

    it('하단 버튼 영역이 존재한다 (2개)', () => {
      const { container } = render(<FoodResultSkeleton />);

      // flex gap-3 pt-4 컨테이너 안의 flex-1 h-12 스켈레톤
      const buttonArea = container.querySelector('.flex.gap-3.pt-4');
      expect(buttonArea).toBeInTheDocument();

      const buttons = buttonArea?.querySelectorAll('[data-testid="skeleton"]');
      expect(buttons?.length).toBe(2);
    });
  });

  describe('스켈레톤 스타일', () => {
    it('영양소 요약에 구분선이 있다', () => {
      const { container } = render(<FoodResultSkeleton />);

      // bg-purple-200 구분선
      const dividers = container.querySelectorAll('.bg-purple-200');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('음식 카드에 rounded-lg 스타일이 적용되어 있다', () => {
      const { container } = render(<FoodResultSkeleton />);

      const roundedSkeletons = container.querySelectorAll('[data-testid="skeleton"].rounded-lg');
      expect(roundedSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('default export', () => {
    it('default export로도 사용할 수 있다', async () => {
      const mod = await import('@/components/nutrition/FoodResultSkeleton');
      expect(mod.default).toBeDefined();
      expect(mod.FoodResultSkeleton).toBeDefined();
    });
  });
});
