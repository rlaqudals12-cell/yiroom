/**
 * N-1 식단 히스토리 화면 테스트
 * Task 2.13: 식단 히스토리 화면 (app/(main)/nutrition/history/page.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock useRouter
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import NutritionHistoryPage from '@/app/(main)/nutrition/history/page';

// Mock 데이터
const mockHistoryData = {
  date: '2025-12-01',
  summary: {
    totalCalories: 1650,
    totalProtein: 75,
    totalCarbs: 200,
    totalFat: 55,
    mealCount: 3,
  },
  meals: [
    {
      type: 'breakfast',
      label: '아침',
      icon: '🌅',
      order: 1,
      records: [
        {
          id: 'record-1',
          meal_type: 'breakfast',
          total_calories: 350,
          total_protein: 20,
          total_carbs: 45,
          total_fat: 12,
          foods: [
            {
              food_name: '계란후라이',
              calories: 150,
              protein: 12,
              carbs: 2,
              fat: 10,
              traffic_light: 'green',
            },
            {
              food_name: '밥 반공기',
              calories: 200,
              protein: 8,
              carbs: 43,
              fat: 2,
              traffic_light: 'yellow',
            },
          ],
          created_at: '2025-12-01T08:30:00Z',
        },
      ],
      subtotal: {
        calories: 350,
        protein: 20,
        carbs: 45,
        fat: 12,
      },
    },
    {
      type: 'lunch',
      label: '점심',
      icon: '🌞',
      order: 2,
      records: [
        {
          id: 'record-2',
          meal_type: 'lunch',
          total_calories: 650,
          total_protein: 30,
          total_carbs: 80,
          total_fat: 22,
          foods: [
            {
              food_name: '비빔밥',
              calories: 550,
              protein: 20,
              carbs: 70,
              fat: 18,
              traffic_light: 'yellow',
            },
          ],
          created_at: '2025-12-01T12:30:00Z',
        },
      ],
      subtotal: {
        calories: 650,
        protein: 30,
        carbs: 80,
        fat: 22,
      },
    },
    {
      type: 'dinner',
      label: '저녁',
      icon: '🌙',
      order: 3,
      records: [
        {
          id: 'record-3',
          meal_type: 'dinner',
          total_calories: 650,
          total_protein: 25,
          total_carbs: 75,
          total_fat: 21,
          foods: [
            {
              food_name: '김치찌개',
              calories: 350,
              protein: 15,
              carbs: 25,
              fat: 18,
              traffic_light: 'yellow',
            },
          ],
          created_at: '2025-12-01T19:00:00Z',
        },
      ],
      subtotal: {
        calories: 650,
        protein: 25,
        carbs: 75,
        fat: 21,
      },
    },
    {
      type: 'snack',
      label: '간식',
      icon: '🍎',
      order: 4,
      records: [],
      subtotal: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    },
  ],
};

const mockEmptyData = {
  date: '2025-12-02',
  summary: {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
  },
  meals: [
    { type: 'breakfast', label: '아침', icon: '🌅', order: 1, records: [], subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
    { type: 'lunch', label: '점심', icon: '🌞', order: 2, records: [], subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
    { type: 'dinner', label: '저녁', icon: '🌙', order: 3, records: [], subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
    { type: 'snack', label: '간식', icon: '🍎', order: 4, records: [], subtotal: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  ],
};

describe('NutritionHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHistoryData),
    });
  });

  describe('페이지 렌더링', () => {
    it('히스토리 페이지가 렌더링된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-history-page')).toBeInTheDocument();
      });
    });

    it('페이지 제목이 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('식단 히스토리')).toBeInTheDocument();
      });
    });

    it('뒤로가기 버튼이 있다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
      });
    });
  });

  describe('날짜 네비게이션', () => {
    it('선택된 날짜가 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toBeInTheDocument();
      });
    });

    it('이전 날짜로 이동할 수 있다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('이전 날짜')).toBeInTheDocument();
      });

      const initialCallCount = mockFetch.mock.calls.length;
      const prevButton = screen.getByLabelText('이전 날짜');
      fireEvent.click(prevButton);

      // API가 새 날짜로 호출됨 (초기 호출 이후 추가 호출 발생)
      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('다음 날짜로 이동할 수 있다', async () => {
      // 어제 날짜로 시작해야 다음 버튼 클릭 가능
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...mockHistoryData, date: yesterdayStr }),
      });

      render(<NutritionHistoryPage />);

      // 먼저 이전 날짜로 이동 (오늘에서 시작하면 다음 버튼이 비활성화)
      await waitFor(() => {
        expect(screen.getByLabelText('이전 날짜')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText('이전 날짜');
      fireEvent.click(prevButton);

      await waitFor(() => {
        // 이전 날짜로 이동 후 다음 버튼이 활성화
        const nextButton = screen.getByLabelText('다음 날짜');
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('오늘 날짜에는 다음 버튼이 비활성화된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        const nextButton = screen.getByLabelText('다음 날짜');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('일일 요약 표시', () => {
    it('일일 칼로리 합계가 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/1,650/)).toBeInTheDocument();
      });
    });

    it('영양소 합계가 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        // 탄수화물, 단백질, 지방 표시
        expect(screen.getByText(/탄수화물/)).toBeInTheDocument();
        expect(screen.getByText(/단백질/)).toBeInTheDocument();
        expect(screen.getByText(/지방/)).toBeInTheDocument();
      });
    });

    it('식사 횟수가 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/3끼/)).toBeInTheDocument();
      });
    });
  });

  describe('식사별 기록 표시', () => {
    it('식사 타입별로 기록이 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('아침')).toBeInTheDocument();
        expect(screen.getByText('점심')).toBeInTheDocument();
        expect(screen.getByText('저녁')).toBeInTheDocument();
      });
    });

    it('각 식사의 음식 목록이 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('계란후라이')).toBeInTheDocument();
        expect(screen.getByText('비빔밥')).toBeInTheDocument();
        expect(screen.getByText('김치찌개')).toBeInTheDocument();
      });
    });

    it('각 음식의 칼로리가 표시된다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/150.*kcal/i)).toBeInTheDocument(); // 계란후라이
        expect(screen.getByText(/550.*kcal/i)).toBeInTheDocument(); // 비빔밥
      });
    });
  });

  describe('빈 상태 처리', () => {
    it('기록이 없는 날에는 빈 상태 메시지가 표시된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyData),
      });

      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/기록이 없습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로딩 중 로딩 표시가 나타난다', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // 무한 대기

      render(<NutritionHistoryPage />);

      expect(screen.getByTestId('history-loading')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지가 표시된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/오류/)).toBeInTheDocument();
      });
    });

    it('에러 시 다시 시도 버튼이 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
      });
    });
  });

  describe('네비게이션', () => {
    it('뒤로가기 버튼 클릭 시 이전 페이지로 이동한다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('뒤로가기');
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('API 호출', () => {
    it('초기 로드 시 API를 호출한다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/nutrition\/meals\?date=/)
        );
      });
    });

    it('날짜 변경 시 해당 날짜로 API를 호출한다', async () => {
      render(<NutritionHistoryPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('이전 날짜')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText('이전 날짜');
      fireEvent.click(prevButton);

      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        expect(calls.length).toBeGreaterThan(1);
      });
    });
  });
});
