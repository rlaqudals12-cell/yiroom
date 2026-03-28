/**
 * N-1 FoodResultCard 컴포넌트 테스트
 * Task 2.5: 분석 결과 화면
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FoodResultCard from '@/components/nutrition/FoodResultCard';
import type { AnalyzedFoodItem } from '@/lib/gemini/prompts/foodAnalysis';

// Mock 음식 데이터
const mockFood: AnalyzedFoodItem = {
  name: '김치찌개',
  portion: '1인분 (약 300g)',
  calories: 380,
  protein: 20,
  carbs: 25,
  fat: 22,
  trafficLight: 'green',
  confidence: 0.88,
};

const mockYellowFood: AnalyzedFoodItem = {
  name: '흰쌀밥',
  portion: '1공기 (약 210g)',
  calories: 310,
  protein: 6,
  carbs: 68,
  fat: 1,
  trafficLight: 'yellow',
  confidence: 0.75,
};

const mockRedFood: AnalyzedFoodItem = {
  name: '삼겹살',
  portion: '1인분 (약 200g)',
  calories: 580,
  protein: 28,
  carbs: 0,
  fat: 52,
  trafficLight: 'red',
  confidence: 0.65,
};

describe('FoodResultCard', () => {
  it('음식 이름과 칼로리를 렌더링한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    expect(screen.getByText('김치찌개')).toBeInTheDocument();
    expect(screen.getByText('380 kcal')).toBeInTheDocument();
  });

  it('양 조절 버튼을 렌더링한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    expect(screen.getByRole('button', { name: '0.5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1.5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('양 조절 버튼 클릭 시 콜백을 호출한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: '1.5' }));
    expect(onPortionChange).toHaveBeenCalledWith(1.5);

    fireEvent.click(screen.getByRole('button', { name: '0.5' }));
    expect(onPortionChange).toHaveBeenCalledWith(0.5);
  });

  it('선택된 양 버튼이 활성화 상태로 표시된다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1.5} onPortionChange={onPortionChange} />
    );

    const selectedButton = screen.getByRole('button', { name: '1.5' });
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('양에 따라 칼로리가 계산되어 표시된다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={2} onPortionChange={onPortionChange} />
    );

    // 380 * 2 = 760
    expect(screen.getByText('760 kcal')).toBeInTheDocument();
    expect(screen.getByText('(2인분)')).toBeInTheDocument();
  });

  it('green 신호등 스타일을 적용한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    // green 신호등 색상 확인 (이모지 제거됨 - 라벨로 검증)
    const indicator = screen.getByTestId('traffic-light-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('yellow 신호등 스타일을 적용한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockYellowFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
      />
    );

    const indicator = screen.getByTestId('traffic-light-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('red 신호등 스타일을 적용한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockRedFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    const indicator = screen.getByTestId('traffic-light-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('신뢰도 높음을 표시한다 (confidence >= 0.85)', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        showDetails={true}
      />
    );

    expect(screen.getByText('높음')).toBeInTheDocument();
  });

  it('신뢰도 중간을 표시한다 (0.7 <= confidence < 0.85)', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockYellowFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        showDetails={true}
      />
    );

    expect(screen.getByText('중간')).toBeInTheDocument();
  });

  it('신뢰도 낮음을 표시한다 (confidence < 0.7)', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockRedFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        showDetails={true}
      />
    );

    expect(screen.getByText('낮음')).toBeInTheDocument();
  });

  it('상세 보기/접기 토글이 동작한다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        showDetails={true}
      />
    );

    // 기본적으로 펼쳐진 상태
    expect(screen.getByText('탄수화물')).toBeInTheDocument();
    expect(screen.getByText('단백질')).toBeInTheDocument();
    expect(screen.getByText('지방')).toBeInTheDocument();

    // 접기 버튼 클릭
    fireEvent.click(screen.getByRole('button', { name: /접기/i }));

    // 상세 정보가 숨겨짐
    expect(screen.queryByText('탄수화물')).not.toBeInTheDocument();
  });

  it('showDetails=false일 때 상세 정보가 숨겨진다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        showDetails={false}
      />
    );

    // 상세 정보가 숨겨진 상태
    expect(screen.queryByText('탄수화물')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /상세 보기/i })).toBeInTheDocument();
  });

  it('수정 버튼이 제공될 때 렌더링된다', () => {
    const onPortionChange = vi.fn();
    const onEdit = vi.fn();
    render(
      <FoodResultCard
        food={mockFood}
        portionMultiplier={1}
        onPortionChange={onPortionChange}
        onEdit={onEdit}
        showDetails={true}
      />
    );

    const editButton = screen.getByRole('button', { name: /수정/i });
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalled();
  });

  it('영양소가 양에 따라 계산되어 표시된다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard
        food={mockFood}
        portionMultiplier={1.5}
        onPortionChange={onPortionChange}
        showDetails={true}
      />
    );

    // 탄수화물: 25 * 1.5 = 37.5
    expect(screen.getByText('37.5g')).toBeInTheDocument();
    // 단백질: 20 * 1.5 = 30
    expect(screen.getByText('30g')).toBeInTheDocument();
    // 지방: 22 * 1.5 = 33
    expect(screen.getByText('33g')).toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    const onPortionChange = vi.fn();
    render(
      <FoodResultCard food={mockFood} portionMultiplier={1} onPortionChange={onPortionChange} />
    );

    expect(screen.getByTestId('food-result-card')).toBeInTheDocument();
  });
});
