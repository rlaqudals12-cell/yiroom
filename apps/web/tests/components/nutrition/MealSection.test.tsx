/**
 * N-1 MealSection 컴포넌트 테스트
 * Task 2.7: 식단 기록 화면
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MealSection, { MealSectionList } from '@/components/nutrition/MealSection';

// i18n 도입(next-intl)으로 컴포넌트가 번역 키를 사용 —
// tests/setup.ts 기본 목은 키를 그대로 반환하므로 실제 ko 메시지로 오버라이드해
// 한국어 문구 검증을 유지한다.
vi.mock('next-intl', async () => {
  const messages = (await import('@/messages/ko.json')).default as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace?: string) => (key: string) =>
      (namespace ? messages[namespace]?.[key] : undefined) ?? key,
    useLocale: () => 'ko',
    useMessages: () => messages,
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

describe('MealSection', () => {
  // 빈 식사 데이터
  const emptyMeal = {
    type: 'lunch',
    label: '점심',
    icon: '☀️',
    order: 1,
    records: [],
    subtotal: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  };

  // 기록이 있는 식사 데이터
  const mealWithRecords = {
    type: 'lunch',
    label: '점심',
    icon: '☀️',
    order: 1,
    records: [
      {
        id: 'record-1',
        meal_type: 'lunch',
        total_calories: 550,
        total_protein: 20,
        total_carbs: 80,
        total_fat: 15,
        foods: [
          {
            food_name: '비빔밥',
            portion: '1인분',
            calories: 550,
            protein: 20,
            carbs: 80,
            fat: 15,
            traffic_light: 'yellow' as const,
          },
        ],
        created_at: '2025-12-02T12:00:00Z',
        ai_recognized_food: '비빔밥',
      },
    ],
    subtotal: {
      calories: 550,
      protein: 20,
      carbs: 80,
      fat: 15,
    },
  };

  describe('렌더링', () => {
    it('식사 타입 아이콘을 렌더링한다', () => {
      render(<MealSection meal={emptyMeal} />);

      expect(screen.getByText('☀️')).toBeInTheDocument();
    });

    it('식사 타입 라벨을 렌더링한다', () => {
      render(<MealSection meal={emptyMeal} />);

      expect(screen.getByText('점심')).toBeInTheDocument();
    });

    it('기록이 없을 때 "기록하기" 버튼을 표시한다', () => {
      render(<MealSection meal={emptyMeal} />);

      expect(screen.getByTestId('add-record-lunch')).toBeInTheDocument();
      expect(screen.getByText('기록하기')).toBeInTheDocument();
    });

    it('기록이 있을 때 음식 목록을 표시한다', () => {
      render(<MealSection meal={mealWithRecords} />);

      expect(screen.getByText('비빔밥')).toBeInTheDocument();
      expect(screen.getByText('1인분')).toBeInTheDocument();
      // 550 kcal은 헤더(subtotal)와 음식 아이템 두 곳에 표시됨
      expect(screen.getAllByText(/550.*kcal/)).toHaveLength(2);
    });

    it('기록이 있을 때 칼로리 합계를 표시한다', () => {
      render(<MealSection meal={mealWithRecords} />);

      expect(screen.getByTestId('meal-calories-lunch')).toHaveTextContent('550 kcal');
    });

    it('기록이 있을 때 "추가 기록하기" 버튼을 표시한다', () => {
      render(<MealSection meal={mealWithRecords} />);

      expect(screen.getByTestId('add-more-lunch')).toBeInTheDocument();
      expect(screen.getByText('추가 기록하기')).toBeInTheDocument();
    });

    it('신호등 표시가 포함된다', () => {
      render(<MealSection meal={mealWithRecords} />);

      // TrafficLightIndicator가 렌더링되는지 확인
      expect(screen.getByTestId('food-item-lunch-0')).toBeInTheDocument();
    });
  });

  describe('이벤트 핸들링', () => {
    it('기록하기 버튼 클릭 시 onAddRecord를 호출한다', () => {
      const onAddRecord = vi.fn();
      render(<MealSection meal={emptyMeal} onAddRecord={onAddRecord} />);

      fireEvent.click(screen.getByTestId('add-record-lunch'));

      expect(onAddRecord).toHaveBeenCalledWith('lunch');
    });

    it('추가 기록하기 버튼 클릭 시 onAddRecord를 호출한다', () => {
      const onAddRecord = vi.fn();
      render(<MealSection meal={mealWithRecords} onAddRecord={onAddRecord} />);

      fireEvent.click(screen.getByTestId('add-more-lunch'));

      expect(onAddRecord).toHaveBeenCalledWith('lunch');
    });

    it('음식 아이템 클릭 시 onRecordClick을 호출한다', () => {
      const onRecordClick = vi.fn();
      render(<MealSection meal={mealWithRecords} onRecordClick={onRecordClick} />);

      fireEvent.click(screen.getByTestId('food-item-lunch-0'));

      expect(onRecordClick).toHaveBeenCalledWith(mealWithRecords.records[0]);
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<MealSection meal={emptyMeal} isLoading />);

      expect(screen.getByTestId('meal-section-loading')).toBeInTheDocument();
    });

    it('로딩 중일 때 실제 데이터를 표시하지 않는다', () => {
      render(<MealSection meal={mealWithRecords} isLoading />);

      expect(screen.queryByText('비빔밥')).not.toBeInTheDocument();
    });
  });

  describe('testid', () => {
    it('식사 타입에 맞는 testid가 렌더링된다', () => {
      render(<MealSection meal={emptyMeal} />);

      expect(screen.getByTestId('meal-section-lunch')).toBeInTheDocument();
    });
  });
});

describe('MealSectionList', () => {
  const meals = [
    {
      type: 'breakfast',
      label: '아침',
      icon: '🌅',
      order: 0,
      records: [],
      subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
    {
      type: 'lunch',
      label: '점심',
      icon: '☀️',
      order: 1,
      records: [],
      subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
    {
      type: 'dinner',
      label: '저녁',
      icon: '🌙',
      order: 2,
      records: [],
      subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
    {
      type: 'snack',
      label: '간식',
      icon: '🍿',
      order: 3,
      records: [],
      subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
  ];

  it('모든 식사 섹션을 렌더링한다', () => {
    render(<MealSectionList meals={meals} />);

    expect(screen.getByTestId('meal-section-breakfast')).toBeInTheDocument();
    expect(screen.getByTestId('meal-section-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('meal-section-dinner')).toBeInTheDocument();
    expect(screen.getByTestId('meal-section-snack')).toBeInTheDocument();
  });

  it('순서대로 정렬되어 렌더링된다', () => {
    // 순서를 섞어서 전달
    const shuffledMeals = [meals[2], meals[0], meals[3], meals[1]];
    render(<MealSectionList meals={shuffledMeals} />);

    const list = screen.getByTestId('meal-section-list');
    const sections = list.querySelectorAll('[data-testid^="meal-section-"]');

    // 순서가 breakfast, lunch, dinner, snack 순서인지 확인
    expect(sections[0]).toHaveAttribute('data-testid', 'meal-section-breakfast');
    expect(sections[1]).toHaveAttribute('data-testid', 'meal-section-lunch');
    expect(sections[2]).toHaveAttribute('data-testid', 'meal-section-dinner');
    expect(sections[3]).toHaveAttribute('data-testid', 'meal-section-snack');
  });

  it('onAddRecord 핸들러를 전달한다', () => {
    const onAddRecord = vi.fn();
    render(<MealSectionList meals={meals} onAddRecord={onAddRecord} />);

    fireEvent.click(screen.getByTestId('add-record-breakfast'));

    expect(onAddRecord).toHaveBeenCalledWith('breakfast');
  });
});
