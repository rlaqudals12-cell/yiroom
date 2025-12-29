/**
 * SizeRecommendationCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SizeRecommendationCard } from '@/components/smart-matching/SizeRecommendationCard';
import type { SizeRecommendation } from '@/types/smart-matching';

describe('SizeRecommendationCard', () => {
  const mockRecommendation: SizeRecommendation = {
    recommendedSize: 'M',
    confidence: 85,
    basis: 'history',
    alternatives: [
      { size: 'S', note: '타이트한 핏을 원하시면' },
      { size: 'L', note: '여유로운 핏을 원하시면' },
    ],
    brandInfo: {
      fitStyle: 'regular',
      sizeNote: '3번의 구매 기록 기반',
    },
  };

  it('추천 사이즈를 표시한다', () => {
    render(<SizeRecommendationCard recommendation={mockRecommendation} />);

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('추천 사이즈')).toBeInTheDocument();
  });

  it('신뢰도를 표시한다', () => {
    render(<SizeRecommendationCard recommendation={mockRecommendation} />);

    expect(screen.getByText(/매우 정확/)).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('브랜드 정보를 표시한다', () => {
    render(<SizeRecommendationCard recommendation={mockRecommendation} />);

    expect(screen.getByText('3번의 구매 기록 기반')).toBeInTheDocument();
    expect(screen.getByText('레귤러핏')).toBeInTheDocument();
  });

  it('사이즈 선택 시 콜백을 호출한다', () => {
    const onSelectSize = vi.fn();
    render(
      <SizeRecommendationCard
        recommendation={mockRecommendation}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.click(screen.getByText('M'));

    expect(onSelectSize).toHaveBeenCalledWith('M');
  });

  it('선택된 사이즈를 강조 표시한다', () => {
    render(
      <SizeRecommendationCard
        recommendation={mockRecommendation}
        selectedSize="M"
      />
    );

    const sizeButton = screen.getByText('M').closest('button');
    expect(sizeButton).toHaveClass('border-primary');
  });

  it('대안 사이즈를 펼쳐서 볼 수 있다', () => {
    render(<SizeRecommendationCard recommendation={mockRecommendation} />);

    // 처음에는 대안이 보이지 않음
    expect(screen.queryByText('S')).not.toBeInTheDocument();

    // "다른 사이즈 보기" 클릭
    fireEvent.click(screen.getByText('다른 사이즈 보기'));

    // 대안 사이즈가 보임
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('피드백 버튼을 표시한다', () => {
    const onFeedbackClick = vi.fn();
    render(
      <SizeRecommendationCard
        recommendation={mockRecommendation}
        onFeedbackClick={onFeedbackClick}
      />
    );

    const feedbackButton = screen.getByText('사이즈 피드백 남기기');
    fireEvent.click(feedbackButton);

    expect(onFeedbackClick).toHaveBeenCalled();
  });

  it('showFeedback=false면 피드백 버튼을 숨긴다', () => {
    render(
      <SizeRecommendationCard
        recommendation={mockRecommendation}
        showFeedback={false}
      />
    );

    expect(screen.queryByText('사이즈 피드백 남기기')).not.toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    render(<SizeRecommendationCard recommendation={mockRecommendation} />);

    expect(screen.getByTestId('size-recommendation-card')).toBeInTheDocument();
  });
});
