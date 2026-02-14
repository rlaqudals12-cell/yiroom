/**
 * N-1 MealSuggestionCard 컴포넌트 테스트
 *
 * "오늘 뭐 먹지?" AI 식단 추천 카드
 * - 초기 상태 (추천 요청 전)
 * - 로딩 상태
 * - 에러 상태
 * - 결과 상태
 * - 컨텍스트 연동 (피부 고민, 체형)
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MealSuggestionCard from '@/components/nutrition/MealSuggestionCard';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 테스트용 추천 결과 데이터
const mockSuggestionResult = {
  mealType: 'lunch' as const,
  suggestions: [
    {
      name: '닭가슴살 샐러드',
      description: '단백질이 풍부한 건강 샐러드',
      calories: 350,
      protein: 30,
      carbs: 20,
      fat: 15,
      trafficLight: 'green' as const,
      reason: '고단백 저칼로리 식사로 체중 관리에 좋아요',
      whereToGet: '편의점, 마트',
      priceRange: '보통' as const,
      cookingTime: '10분',
      tags: ['고단백', '저칼로리'],
    },
    {
      name: '현미밥 + 된장찌개',
      description: '영양 균형 잡힌 한식',
      calories: 480,
      protein: 18,
      carbs: 65,
      fat: 12,
      trafficLight: 'yellow' as const,
      reason: '식이섬유가 풍부한 현미밥으로 포만감 유지',
      whereToGet: '한식당, 구내식당',
      priceRange: '저렴' as const,
      tags: ['한식', '균형식'],
    },
  ],
  contextMessage: '피부 수분 부족 개선을 위해 수분 많은 음식을 추천해요',
  totalCalories: 830,
};

describe('MealSuggestionCard', () => {
  const defaultProps = {
    goal: 'weight_loss' as const,
    consumedCalories: 800,
    targetCalories: 2000,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('초기 상태 (추천 요청 전)', () => {
    it('카드를 렌더링한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('meal-suggestion-card')).toBeInTheDocument();
    });

    it('"오늘 뭐 먹지?" 제목을 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.getByText('오늘 뭐 먹지?')).toBeInTheDocument();
    });

    it('남은 칼로리를 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      // 2000 - 800 = 1,200
      expect(screen.getByText('1,200kcal')).toBeInTheDocument();
    });

    it('AI 추천 받기 버튼을 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.getByText('AI 추천 받기')).toBeInTheDocument();
    });

    it('안내 문구를 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.getByText(/구하기 쉽고 가성비 좋은 음식을 추천해 드려요/)).toBeInTheDocument();
    });
  });

  describe('컨텍스트 연동 표시', () => {
    it('피부 고민이 있으면 "피부 고민 반영" 뱃지를 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} skinConcerns={['수분 부족']} />);

      expect(screen.getByText(/피부 고민 반영/)).toBeInTheDocument();
    });

    it('체형 정보가 있으면 "체형 맞춤" 뱃지를 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} bodyType="X" />);

      expect(screen.getByText(/체형 맞춤/)).toBeInTheDocument();
    });

    it('피부 고민과 체형 모두 있으면 두 뱃지를 모두 표시한다', () => {
      render(<MealSuggestionCard {...defaultProps} skinConcerns={['수분']} bodyType="A" />);

      expect(screen.getByText(/피부 고민 반영/)).toBeInTheDocument();
      expect(screen.getByText(/체형 맞춤/)).toBeInTheDocument();
    });

    it('컨텍스트가 없으면 뱃지를 표시하지 않는다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.queryByText(/피부 고민 반영/)).not.toBeInTheDocument();
      expect(screen.queryByText(/체형 맞춤/)).not.toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('추천 요청 시 로딩 상태를 표시한다', async () => {
      // fetch를 영원히 pending으로 유지
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByTestId('meal-suggestion-loading')).toBeInTheDocument();
      expect(screen.getByText(/맞춤 메뉴를 찾고 있어요/)).toBeInTheDocument();
    });
  });

  describe('에러 상태', () => {
    it('API 실패 시 에러 메시지를 표시한다', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByTestId('meal-suggestion-error')).toBeInTheDocument();
      expect(screen.getByText('추천을 불러오는데 실패했습니다')).toBeInTheDocument();
    });

    it('네트워크 에러 시 에러 메시지를 표시한다', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByTestId('meal-suggestion-error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('에러 상태에서 "다시 시도" 버튼을 표시한다', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    it('"다시 시도" 클릭 시 재요청한다', async () => {
      // 첫 번째: 실패, 두 번째: 성공
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuggestionResult),
      });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('다시 시도')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('다시 시도'));
      });

      expect(screen.getByTestId('meal-suggestion-result')).toBeInTheDocument();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('결과 상태', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuggestionResult),
      });
    });

    it('추천 결과를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByTestId('meal-suggestion-result')).toBeInTheDocument();
    });

    it('식사 시간대 라벨을 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('점심 추천')).toBeInTheDocument();
    });

    it('추천 음식 이름을 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('닭가슴살 샐러드')).toBeInTheDocument();
      expect(screen.getByText('현미밥 + 된장찌개')).toBeInTheDocument();
    });

    it('추천 음식의 칼로리를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('350kcal')).toBeInTheDocument();
      expect(screen.getByText('480kcal')).toBeInTheDocument();
    });

    it('추천 음식의 영양소 정보를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('단백질 30g')).toBeInTheDocument();
      expect(screen.getByText('탄수화물 20g')).toBeInTheDocument();
    });

    it('추천 이유를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('고단백 저칼로리 식사로 체중 관리에 좋아요')).toBeInTheDocument();
    });

    it('구매처 정보를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      // "편의점, 마트"가 구매처와 하단 안내 문구에 모두 나타남
      const locationTexts = screen.getAllByText(/편의점, 마트/);
      expect(locationTexts.length).toBeGreaterThan(0);
    });

    it('가격대를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      // 가격대 표시 확인 (보통은 신호등 라벨에도 있으므로 getAllByText 사용)
      const priceTexts = screen.getAllByText(/저렴/);
      expect(priceTexts.length).toBeGreaterThan(0);
      const priceMiddleTexts = screen.getAllByText(/보통/);
      expect(priceMiddleTexts.length).toBeGreaterThan(0);
    });

    it('조리 시간을 표시한다 (있는 경우)', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText(/조리시간: 10분/)).toBeInTheDocument();
    });

    it('태그를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('#고단백')).toBeInTheDocument();
      expect(screen.getByText('#저칼로리')).toBeInTheDocument();
    });

    it('신호등 라벨을 표시한다 (green=좋음, yellow=보통)', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('좋음')).toBeInTheDocument();
      // "보통"은 신호등 라벨과 가격대 두 곳에 존재
      const normalTexts = screen.getAllByText('보통');
      expect(normalTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('컨텍스트 메시지를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(
        screen.getByText('피부 수분 부족 개선을 위해 수분 많은 음식을 추천해요')
      ).toBeInTheDocument();
    });

    it('총 칼로리를 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('830kcal')).toBeInTheDocument();
    });

    it('"다시 추천" 버튼을 표시한다', async () => {
      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(screen.getByText('다시 추천')).toBeInTheDocument();
    });
  });

  describe('API 요청 파라미터', () => {
    it('올바른 파라미터로 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuggestionResult),
      });

      render(
        <MealSuggestionCard
          {...defaultProps}
          allergies={['seafood']}
          skinConcerns={['수분 부족']}
          bodyType="X"
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/nutrition/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.goal).toBe('weight_loss');
      expect(callBody.remainingCalories).toBe(1200);
      expect(callBody.allergies).toEqual(['seafood']);
      expect(callBody.skinConcerns).toEqual(['수분 부족']);
      expect(callBody.bodyType).toBe('X');
    });
  });

  describe('시간대별 식사 타입 추론', () => {
    // 시간 관련 테스트에서만 fake timer 사용
    afterEach(() => {
      vi.useRealTimers();
    });

    it('오전 9시에는 아침을 추천한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date('2026-01-15T09:00:00'));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...mockSuggestionResult, mealType: 'breakfast' }),
      });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.mealType).toBe('breakfast');
    });

    it('오후 6시에는 저녁을 추천한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date('2026-01-15T18:00:00'));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...mockSuggestionResult, mealType: 'dinner' }),
      });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.mealType).toBe('dinner');
    });

    it('오후 10시에는 간식을 추천한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date('2026-01-15T22:00:00'));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...mockSuggestionResult, mealType: 'snack' }),
      });

      render(<MealSuggestionCard {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByText('AI 추천 받기'));
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.mealType).toBe('snack');
    });
  });

  describe('엣지 케이스', () => {
    it('남은 칼로리가 0 이하일 때도 정상 렌더링한다', () => {
      render(
        <MealSuggestionCard {...defaultProps} consumedCalories={2500} targetCalories={2000} />
      );

      // -500 표시
      expect(screen.getByText('-500kcal')).toBeInTheDocument();
    });

    it('알레르기 없이도 정상 동작한다', () => {
      render(<MealSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('meal-suggestion-card')).toBeInTheDocument();
    });
  });
});
