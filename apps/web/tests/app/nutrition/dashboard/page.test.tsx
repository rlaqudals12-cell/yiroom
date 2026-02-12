/**
 * N-1 영양 대시보드 페이지 테스트
 * Task 3.1: 영양 대시보드 페이지
 *
 * 테스트 범위:
 * - 페이지 렌더링
 * - 영양소별 진행률 표시
 * - 음식 신호등 현황
 * - 수분 섭취 현황
 * - 데이터 로딩/에러 상태
 * - 네비게이션
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

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

import NutritionDashboardPage from '@/app/(main)/nutrition/dashboard/page';

// Mock 데이터: 오늘의 식단
const mockMealsData = {
  date: '2025-12-02',
  summary: {
    totalCalories: 1200,
    totalProtein: 45,
    totalCarbs: 150,
    totalFat: 40,
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
          id: '1',
          meal_type: 'breakfast',
          total_calories: 400,
          total_protein: 15,
          total_carbs: 50,
          total_fat: 15,
          foods: [
            {
              food_name: '계란후라이',
              calories: 150,
              protein: 10,
              carbs: 2,
              fat: 12,
              traffic_light: 'green',
            },
          ],
          created_at: '2025-12-02T08:00:00Z',
        },
      ],
      subtotal: { calories: 400, protein: 15, carbs: 50, fat: 15 },
    },
  ],
  trafficLightSummary: {
    green: 4,
    yellow: 3,
    red: 1,
    total: 8,
  },
};

// Mock 데이터: 수분 섭취
const mockWaterData = {
  date: '2025-12-02',
  totalAmountMl: 1600,
  totalEffectiveMl: 1600,
  goalMl: 2000,
  records: [],
};

// Mock 데이터: 영양 설정
const mockSettingsData = {
  success: true,
  data: {
    daily_calorie_target: 1800,
    protein_target: 80,
    carbs_target: 250,
    fat_target: 50,
  },
  hasSettings: true,
};

describe('NutritionDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 API 응답 설정
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/nutrition/meals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMealsData),
        });
      }
      if (url.includes('/api/nutrition/water')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWaterData),
        });
      }
      if (url.includes('/api/nutrition/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSettingsData),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      });
    });
  });

  describe('페이지 렌더링', () => {
    it('대시보드 페이지가 렌더링된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-dashboard')).toBeInTheDocument();
      });
    });

    it('페이지 제목이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        // 헤더의 h1 태그에 있는 제목 확인
        expect(
          screen.getByRole('heading', { level: 1, name: '영양 대시보드' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('영양소 진행률', () => {
    it('칼로리 진행률이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('calorie-progress')).toBeInTheDocument();
      });
    });

    it('탄수화물 진행률이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('carbs-progress')).toBeInTheDocument();
      });
    });

    it('단백질 진행률이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('protein-progress')).toBeInTheDocument();
      });
    });

    it('지방 진행률이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fat-progress')).toBeInTheDocument();
      });
    });

    it('각 영양소의 현재값과 목표값이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        // 칼로리 진행률 컴포넌트에서 값 확인
        const calorieProgress = screen.getByTestId('calorie-progress');
        // 1200kcal / 1800kcal 형식으로 표시됨
        expect(calorieProgress).toHaveTextContent('1200');
        expect(calorieProgress).toHaveTextContent('1800');
      });
    });

    it('단백질 부족 시 AI 인사이트 메시지가 표시된다', async () => {
      // mockMealsData의 단백질: 45g, mockSettingsData의 protein_target: 80g
      // 45/80 = 56.25% < 60% 이므로 인사이트 표시
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/단백질이 부족해요/)).toBeInTheDocument();
      });
    });
  });

  describe('음식 신호등 현황', () => {
    it('신호등 현황 섹션이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('traffic-light-summary')).toBeInTheDocument();
      });
    });

    it('초록/노랑/빨강 비율이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        // 신호등 섹션에서 초록 4개 확인
        const trafficSection = screen.getByTestId('traffic-light-summary');
        expect(trafficSection).toHaveTextContent('초록 4개');
        expect(trafficSection).toHaveTextContent('노랑 3개');
        expect(trafficSection).toHaveTextContent('빨강 1개');
      });
    });
  });

  describe('수분 섭취 현황', () => {
    it('수분 섭취 섹션이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('water-intake-section')).toBeInTheDocument();
      });
    });

    it('수분 섭취량이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        // 1600ml / 2000ml
        expect(screen.getByText(/1,?600/)).toBeInTheDocument();
      });
    });

    it('수분 빠른 추가 버튼이 표시된다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('water-quick-add')).toBeInTheDocument();
      });

      // 버튼들 확인
      expect(screen.getByText(/물 1컵/)).toBeInTheDocument();
      expect(screen.getByText(/물 1병/)).toBeInTheDocument();
      expect(screen.getByText(/커피 1잔/)).toBeInTheDocument();
      expect(screen.getByText(/직접 입력/)).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로딩 중 로딩 표시가 나타난다', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // 무한 대기

      render(<NutritionDashboardPage />);

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지가 표시된다', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      render(<NutritionDashboardPage />);

      await waitFor(() => {
        // 에러 상태의 h2 제목 확인
        expect(
          screen.getByRole('heading', { level: 2, name: /불러오지 못했어요/ })
        ).toBeInTheDocument();
      });
    });
  });

  describe('네비게이션', () => {
    it('식단 기록 페이지로 이동할 수 있다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-dashboard')).toBeInTheDocument();
      });

      // 식단 기록 버튼 클릭
      const recordButton = screen.getByText(/식단 기록하기/);
      fireEvent.click(recordButton);

      expect(mockPush).toHaveBeenCalledWith('/nutrition');
    });

    it('뒤로가기 버튼이 동작한다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-dashboard')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('뒤로가기');
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('직접 입력 버튼 클릭 시 수분 입력 페이지로 이동한다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('water-quick-add')).toBeInTheDocument();
      });

      const directInputButton = screen.getByText(/직접 입력/);
      fireEvent.click(directInputButton);

      expect(mockPush).toHaveBeenCalledWith('/nutrition/water');
    });
  });

  describe('새로고침', () => {
    it('새로고침 버튼 클릭 시 데이터를 다시 로드한다', async () => {
      render(<NutritionDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-dashboard')).toBeInTheDocument();
      });

      // 초기 로드 시 API 호출 횟수 확인
      const initialCallCount = mockFetch.mock.calls.length;

      // 새로고침 버튼 클릭
      const refreshButton = screen.getByLabelText('새로고침');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        // API가 다시 호출되었는지 확인
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});
