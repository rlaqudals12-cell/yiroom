/**
 * N-1 BodyInsightCard 컴포넌트 테스트
 * Task 3.9: C-1 체형 연동 칼로리
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BodyInsightCard from '@/components/nutrition/BodyInsightCard';
import type { BodyAnalysisData } from '@/lib/nutrition/bodyInsight';

describe('BodyInsightCard', () => {
  // 테스트용 체형 분석 데이터
  // BodyType: X(균형), A(하체 볼륨), V(상체 볼륨), H(일자), O(라운드), I(마름), Y(어깨넓음), 8(모래시계)
  const createBodyAnalysis = (overrides?: Partial<BodyAnalysisData>): BodyAnalysisData => ({
    bodyType: 'X',
    height: 165,
    weight: 60,
    analyzedAt: new Date('2024-01-01'),
    ...overrides,
  });

  // 날짜 mock 설정
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('렌더링', () => {
    it('기본 카드를 렌더링한다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(<BodyInsightCard bodyAnalysis={bodyAnalysis} />);

      expect(screen.getByTestId('body-insight-card')).toBeInTheDocument();
      expect(screen.getByText('체형 연동 인사이트')).toBeInTheDocument();
    });

    it('로딩 중일 때 스켈레톤을 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(<BodyInsightCard bodyAnalysis={bodyAnalysis} isLoading />);

      expect(screen.getByTestId('body-insight-card-loading')).toBeInTheDocument();
    });

    it('C-1 연동 표시를 보여준다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(<BodyInsightCard bodyAnalysis={bodyAnalysis} />);

      expect(screen.getByText('C-1 연동')).toBeInTheDocument();
    });
  });

  describe('체형 분석 없음', () => {
    it('체형 분석이 없으면 안내 카드를 표시한다', () => {
      render(<BodyInsightCard bodyAnalysis={null} />);

      expect(screen.getByTestId('body-insight-card-empty')).toBeInTheDocument();
      expect(screen.getByText(/C-1 체형 분석을 완료하면/)).toBeInTheDocument();
    });

    it('체형 분석 버튼 클릭 시 핸들러를 호출한다', () => {
      const onNavigate = vi.fn();
      render(
        <BodyInsightCard
          bodyAnalysis={null}
          onNavigateToBodyAnalysis={onNavigate}
        />
      );

      fireEvent.click(screen.getByTestId('navigate-body-analysis'));

      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe('체중 변화 섹션', () => {
    it('현재 체중이 있으면 체중 변화를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={58}
        />
      );

      expect(screen.getByTestId('weight-change-section')).toBeInTheDocument();
      expect(screen.getByText('-2.0kg')).toBeInTheDocument();
    });

    it('체중 감소 시 초록색 트렌드를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={57}
        />
      );

      const section = screen.getByTestId('weight-change-section');
      expect(section).toHaveClass('bg-green-50');
    });

    it('체중 증가 시 빨간색 트렌드를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={63}
        />
      );

      const section = screen.getByTestId('weight-change-section');
      expect(section).toHaveClass('bg-red-50');
    });

    it('경과 일수를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={60}
        />
      );

      expect(screen.getByText('14일 전 분석 대비')).toBeInTheDocument();
    });
  });

  describe('재분석 유도 섹션', () => {
    it('유의미한 체중 변화 시 재분석 버튼을 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={59}
          onReanalysisClick={() => {}}
        />
      );

      expect(screen.getByTestId('reanalysis-prompt-section')).toBeInTheDocument();
      expect(screen.getByTestId('reanalysis-button')).toBeInTheDocument();
    });

    it('재분석 버튼 클릭 시 핸들러를 호출한다', () => {
      const onReanalysis = vi.fn();
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={59}
          onReanalysisClick={onReanalysis}
        />
      );

      fireEvent.click(screen.getByTestId('reanalysis-button'));

      expect(onReanalysis).toHaveBeenCalled();
    });

    it('4주 이상 경과 시 재분석을 유도한다', () => {
      vi.setSystemTime(new Date('2024-02-01')); // 31일 경과
      const bodyAnalysis = createBodyAnalysis();
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={60}
          onReanalysisClick={() => {}}
        />
      );

      expect(screen.getByTestId('reanalysis-prompt-section')).toBeInTheDocument();
      expect(screen.getByText(/4주가 지났어요/)).toBeInTheDocument();
    });
  });

  describe('칼로리 조정 섹션', () => {
    it('체형 맞춤 칼로리를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          baseCalories={2000}
        />
      );

      expect(screen.getByTestId('calorie-adjustment-section')).toBeInTheDocument();
      expect(screen.getByText('체형 맞춤 칼로리')).toBeInTheDocument();
    });

    it('조정된 칼로리를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'A' });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          baseCalories={2000}
        />
      );

      // A자형 체형은 5% 감소 = 1900kcal
      expect(screen.getByText('1,900kcal')).toBeInTheDocument();
    });

    it('체형 특성 메시지를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'A' });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          baseCalories={2000}
        />
      );

      expect(screen.getByText(/하체 관리/)).toBeInTheDocument();
    });
  });

  describe('요약 메시지', () => {
    it('체중 변화가 있어도 체형 기반 요약 메시지를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={59}
        />
      );

      // summaryMessage는 체형 기반, 체중 변화는 WeightChangeSection에서 표시
      expect(screen.getByText(/식단 관리 중/)).toBeInTheDocument();
      // WeightChangeSection에서 성공 메시지 표시
      expect(screen.getByTestId('weight-change-section')).toHaveTextContent(/성공/);
    });

    it('체중 변화가 없으면 기본 메시지를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis();
      render(<BodyInsightCard bodyAnalysis={bodyAnalysis} />);

      expect(screen.getByText(/식단 관리/)).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('아이콘에 aria-hidden이 있다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      render(
        <BodyInsightCard
          bodyAnalysis={bodyAnalysis}
          currentWeight={59}
          onReanalysisClick={() => {}}
        />
      );

      const icons = document.querySelectorAll('[role="img"]');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
