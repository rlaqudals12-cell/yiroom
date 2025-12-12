/**
 * N-1 SkinInsightCard 컴포넌트 테스트
 * Task 3.7: S-1 피부 연동 인사이트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SkinInsightCard from '@/components/nutrition/SkinInsightCard';
import type { SkinAnalysisSummary } from '@/lib/nutrition/skinInsight';

describe('SkinInsightCard', () => {
  // 테스트용 피부 분석 데이터
  const normalSkin: SkinAnalysisSummary = {
    hydration: 'good',
    oil: 'good',
    pores: 'good',
    wrinkles: 'good',
    elasticity: 'good',
    pigmentation: 'good',
    trouble: 'good',
  };

  const warningSkin: SkinAnalysisSummary = {
    hydration: 'warning',
    oil: 'good',
    pores: 'good',
    wrinkles: 'good',
    elasticity: 'warning',
    pigmentation: 'good',
    trouble: 'warning',
  };

  describe('렌더링', () => {
    it('기본 카드를 렌더링한다', () => {
      render(<SkinInsightCard skinAnalysis={normalSkin} />);

      expect(screen.getByTestId('skin-insight-card')).toBeInTheDocument();
      expect(screen.getByText('피부 연동 인사이트')).toBeInTheDocument();
    });

    it('로딩 중일 때 스켈레톤을 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={normalSkin} isLoading />);

      expect(screen.getByTestId('skin-insight-card-loading')).toBeInTheDocument();
    });
  });

  describe('피부 분석 없음', () => {
    it('피부 분석이 없으면 안내 카드를 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={null} />);

      expect(screen.getByTestId('skin-insight-card-empty')).toBeInTheDocument();
      expect(screen.getByText(/S-1 피부 분석을 완료하면/)).toBeInTheDocument();
    });

    it('피부 분석 버튼 클릭 시 핸들러를 호출한다', () => {
      const onNavigate = vi.fn();
      render(
        <SkinInsightCard
          skinAnalysis={null}
          onNavigateToSkinAnalysis={onNavigate}
        />
      );

      fireEvent.click(screen.getByTestId('navigate-skin-analysis'));

      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe('피부 분석 있음 - 정상 상태', () => {
    it('모든 지표가 좋으면 긍정 메시지를 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={normalSkin} />);

      // 요약 메시지에 "피부 상태가 좋아요" 포함 확인
      expect(screen.getByText(/피부 상태가 좋아요/)).toBeInTheDocument();
    });

    it('수분 인사이트 섹션을 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={normalSkin} />);

      expect(screen.getByTestId('hydration-insight')).toBeInTheDocument();
    });
  });

  describe('피부 분석 있음 - 경고 상태', () => {
    it('경고 지표에 대한 음식 추천을 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={warningSkin} />);

      // hydration warning → 수분 보충 식품 추천
      expect(screen.getByTestId('food-recommendation-hydration')).toBeInTheDocument();
    });

    it('트러블 추천을 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={warningSkin} />);

      // trouble warning → 트러블 진정 식품 추천
      expect(screen.getByTestId('food-recommendation-trouble')).toBeInTheDocument();
    });

    it('추천 음식 태그를 표시한다', () => {
      render(<SkinInsightCard skinAnalysis={warningSkin} />);

      // 수박은 hydration 추천에 포함
      expect(screen.getByText('수박')).toBeInTheDocument();
    });

    it('음식 추천 클릭 시 핸들러를 호출한다', () => {
      const onClick = vi.fn();
      render(
        <SkinInsightCard
          skinAnalysis={warningSkin}
          onFoodRecommendationClick={onClick}
        />
      );

      fireEvent.click(screen.getByTestId('food-recommendation-hydration'));

      expect(onClick).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          relatedMetric: 'hydration',
        })
      );
    });
  });

  describe('수분 연동', () => {
    it('현재 수분량과 목표를 표시한다', () => {
      render(
        <SkinInsightCard
          skinAnalysis={normalSkin}
          currentWaterMl={1500}
        />
      );

      expect(screen.getByText('1,500ml')).toBeInTheDocument();
      expect(screen.getByText('2,000ml')).toBeInTheDocument();
    });

    it('수분 진행률 바를 표시한다', () => {
      render(
        <SkinInsightCard
          skinAnalysis={normalSkin}
          currentWaterMl={1000}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('수분 부족 피부일 때 목표가 2500ml로 증가한다', () => {
      render(
        <SkinInsightCard
          skinAnalysis={warningSkin}
          currentWaterMl={1000}
        />
      );

      expect(screen.getByText('2,500ml')).toBeInTheDocument();
    });
  });

  describe('요약 메시지', () => {
    it('경고가 많으면 관리 필요 메시지를 표시한다', () => {
      const manyWarningSkin: SkinAnalysisSummary = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'warning',
        wrinkles: 'warning',
        elasticity: 'good',
        pigmentation: 'good',
        trouble: 'good',
      };

      render(<SkinInsightCard skinAnalysis={manyWarningSkin} />);

      expect(screen.getByText(/피부 관리가 필요해요/)).toBeInTheDocument();
    });

    it('피부 개선 목표일 때 추가 메시지를 표시한다', () => {
      render(
        <SkinInsightCard
          skinAnalysis={warningSkin}
          nutritionGoal="skin_improvement"
        />
      );

      expect(screen.getByText(/피부 개선 목표/)).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('progressbar에 올바른 aria 속성이 있다', () => {
      render(
        <SkinInsightCard
          skinAnalysis={normalSkin}
          currentWaterMl={1500}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label', '수분 섭취 75%');
    });

    it('이모지에 aria-hidden이 있다', () => {
      render(<SkinInsightCard skinAnalysis={warningSkin} />);

      const emojis = document.querySelectorAll('[role="img"]');
      emojis.forEach((emoji) => {
        expect(emoji).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
