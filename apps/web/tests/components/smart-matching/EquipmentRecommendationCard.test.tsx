/**
 * EquipmentRecommendationCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentRecommendationCard } from '@/components/smart-matching/EquipmentRecommendationCard';
import type { WorkoutEquipmentMatch } from '@/lib/smart-matching/equipment-recommend';

describe('EquipmentRecommendationCard', () => {
  const mockMatch: WorkoutEquipmentMatch = {
    workoutGoal: 'weight_loss',
    fitnessLevel: 'beginner',
    preferredWorkouts: ['burner', 'mover'],
    homeGym: true,
    recommendations: [
      {
        category: 'cardio',
        priority: 'essential',
        items: [
          {
            id: 'eq-1',
            name: '줄넘기',
            category: 'cardio',
            priority: 'essential',
            priceRange: { min: 10000, max: 30000 },
            description: '고강도 유산소',
            reason: '적은 비용으로 높은 효과',
          },
        ],
        reason: '체지방 감량의 핵심인 유산소 운동 장비',
      },
      {
        category: 'resistance',
        priority: 'recommended',
        items: [
          {
            id: 'eq-7',
            name: '저항 밴드 세트',
            category: 'resistance',
            priority: 'essential',
            priceRange: { min: 15000, max: 40000 },
            description: '다양한 강도',
            reason: '공간 효율적',
          },
        ],
        reason: '가정에서 쉽게 할 수 있는 저항 운동 장비',
      },
    ],
  };

  it('추천 카드를 렌더링한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(screen.getByTestId('equipment-recommendation-card')).toBeInTheDocument();
    expect(screen.getByText('추천 운동기구')).toBeInTheDocument();
  });

  it('운동 목표를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(screen.getByText('체중 감량 목표 기준')).toBeInTheDocument();
  });

  it('홈트레이닝 배지를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(screen.getByText('홈트레이닝')).toBeInTheDocument();
  });

  it('헬스장 배지를 표시한다', () => {
    const gymMatch = { ...mockMatch, homeGym: false };
    render(<EquipmentRecommendationCard match={gymMatch} />);

    expect(screen.getByText('헬스장')).toBeInTheDocument();
  });

  it('카테고리별 추천을 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(screen.getByText('유산소')).toBeInTheDocument();
    expect(screen.getByText('저항')).toBeInTheDocument();
  });

  it('우선순위 배지를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(screen.getByText('필수')).toBeInTheDocument();
    expect(screen.getByText('추천')).toBeInTheDocument();
  });

  it('카테고리 클릭 시 상세 목록을 펼친다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    // 초기에는 장비 이름이 안 보임
    expect(screen.queryByText('줄넘기')).not.toBeInTheDocument();

    // 카테고리 클릭
    fireEvent.click(screen.getByText('유산소'));

    // 장비 이름이 보임
    expect(screen.getByText('줄넘기')).toBeInTheDocument();
  });

  it('장비 가격 범위를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    // 카테고리 펼치기
    fireEvent.click(screen.getByText('유산소'));

    expect(screen.getByText('10,000원 ~ 30,000원')).toBeInTheDocument();
  });

  it('장비 선택 콜백을 호출한다', () => {
    const onSelectEquipment = vi.fn();
    render(
      <EquipmentRecommendationCard match={mockMatch} onSelectEquipment={onSelectEquipment} />
    );

    // 카테고리 펼치기
    fireEvent.click(screen.getByText('유산소'));

    // 선택 버튼 클릭
    fireEvent.click(screen.getByText('선택'));

    expect(onSelectEquipment).toHaveBeenCalledWith(mockMatch.recommendations[0].items[0]);
  });

  it('상세 보기 콜백을 호출한다', () => {
    const onViewDetails = vi.fn();
    render(<EquipmentRecommendationCard match={mockMatch} onViewDetails={onViewDetails} />);

    // 카테고리 펼치기
    fireEvent.click(screen.getByText('유산소'));

    // 상세 버튼 클릭
    fireEvent.click(screen.getByText('상세'));

    expect(onViewDetails).toHaveBeenCalledWith(mockMatch.recommendations[0].items[0]);
  });

  it('추천 이유를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    expect(
      screen.getByText('체지방 감량의 핵심인 유산소 운동 장비')
    ).toBeInTheDocument();
  });

  it('추천 개수를 표시한다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    // 각 카테고리별로 추천 개수가 표시됨
    const countTexts = screen.getAllByText('1개 추천');
    expect(countTexts.length).toBe(2);
  });

  it('다른 카테고리를 클릭하면 이전 카테고리가 닫힌다', () => {
    render(<EquipmentRecommendationCard match={mockMatch} />);

    // 유산소 펼치기
    fireEvent.click(screen.getByText('유산소'));
    expect(screen.getByText('줄넘기')).toBeInTheDocument();

    // 저항 펼치기
    fireEvent.click(screen.getByText('저항'));
    expect(screen.queryByText('줄넘기')).not.toBeInTheDocument();
    expect(screen.getByText('저항 밴드 세트')).toBeInTheDocument();
  });
});
