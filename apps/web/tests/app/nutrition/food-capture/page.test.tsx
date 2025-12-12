/**
 * N-1 음식 촬영 페이지 테스트
 * Task 2.4: 카메라 촬영 UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FoodCapturePage from '@/app/(main)/nutrition/food-capture/page';

// Next.js router mock
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// sessionStorage mock
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => mockSessionStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockSessionStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockSessionStorage[key];
  },
  clear: () => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  },
});

// fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FoodCapturePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  });

  describe('렌더링', () => {
    it('페이지 제목을 렌더링한다', () => {
      render(<FoodCapturePage />);
      expect(screen.getByText('음식 사진 촬영')).toBeInTheDocument();
    });

    it('뒤로 가기 버튼을 렌더링한다', () => {
      render(<FoodCapturePage />);
      const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
      expect(backButton).toBeInTheDocument();
    });

    it('식사 타입 선택 버튼들을 렌더링한다', () => {
      render(<FoodCapturePage />);

      expect(screen.getByText('아침')).toBeInTheDocument();
      expect(screen.getByText('점심')).toBeInTheDocument();
      expect(screen.getByText('저녁')).toBeInTheDocument();
      expect(screen.getByText('간식')).toBeInTheDocument();
    });

    it('사진 촬영 UI를 렌더링한다', () => {
      render(<FoodCapturePage />);

      expect(screen.getByRole('button', { name: /카메라로 사진 촬영하기/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /갤러리에서 사진 선택하기/i })).toBeInTheDocument();
    });

    it('안내 문구를 표시한다', () => {
      render(<FoodCapturePage />);
      expect(
        screen.getByText('AI가 음식을 인식하여 칼로리와 영양 정보를 분석해요')
      ).toBeInTheDocument();
    });
  });

  describe('식사 타입 선택', () => {
    it('기본값으로 점심이 선택되어 있다', () => {
      render(<FoodCapturePage />);

      const lunchButton = screen.getByText('점심').closest('button');
      expect(lunchButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('다른 식사 타입을 선택할 수 있다', () => {
      render(<FoodCapturePage />);

      const dinnerButton = screen.getByText('저녁').closest('button');
      fireEvent.click(dinnerButton!);

      expect(dinnerButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('뒤로 가기', () => {
    it('뒤로 가기 버튼 클릭 시 router.back을 호출한다', () => {
      render(<FoodCapturePage />);

      const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('사진 분석', () => {
    it('사진 선택 시 분석 API를 호출한다', async () => {
      const mockResult = {
        success: true,
        result: {
          foods: [
            {
              name: '비빔밥',
              portion: '1인분',
              calories: 550,
              protein: 20,
              carbs: 80,
              fat: 15,
              trafficLight: 'yellow',
              confidence: 0.9,
            },
          ],
          totalCalories: 550,
          mealType: 'lunch',
        },
        usedMock: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      render(<FoodCapturePage />);

      // 파일 선택 시뮬레이션
      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/nutrition/foods/analyze',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('분석 성공 시 결과 페이지로 이동한다', async () => {
      const mockResult = {
        success: true,
        result: {
          foods: [
            {
              name: '비빔밥',
              portion: '1인분',
              calories: 550,
              protein: 20,
              carbs: 80,
              fat: 15,
              trafficLight: 'yellow',
              confidence: 0.9,
            },
          ],
          totalCalories: 550,
          mealType: 'lunch',
        },
        usedMock: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/nutrition/food-result');
      });
    });

    it('분석 결과를 sessionStorage에 저장한다', async () => {
      const mockResult = {
        success: true,
        result: {
          foods: [
            {
              name: '비빔밥',
              portion: '1인분',
              calories: 550,
              protein: 20,
              carbs: 80,
              fat: 15,
              trafficLight: 'yellow',
              confidence: 0.9,
            },
          ],
          totalCalories: 550,
          mealType: 'lunch',
        },
        usedMock: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockSessionStorage['foodAnalysisResult']).toBeDefined();
        const stored = JSON.parse(mockSessionStorage['foodAnalysisResult']);
        expect(stored.result.foods[0].name).toBe('비빔밥');
      });
    });

    it('API 에러 시 에러 상태를 표시한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '서버 오류' }),
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('분석 실패')).toBeInTheDocument();
        expect(screen.getByText('서버 오류')).toBeInTheDocument();
      });
    });

    it('음식 미인식 시 에러 상태를 표시한다', async () => {
      const mockResult = {
        success: true,
        result: {
          foods: [],
          totalCalories: 0,
          mealType: 'lunch',
        },
        warning: 'No food detected in the image',
        usedMock: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('분석 실패')).toBeInTheDocument();
        expect(
          screen.getByText('음식을 인식하지 못했습니다. 다시 촬영해주세요.')
        ).toBeInTheDocument();
      });
    });

    it('에러 상태에서 다시 촬영하기 버튼을 클릭하면 캡처 상태로 돌아간다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '서버 오류' }),
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('분석 실패')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('다시 촬영하기');
      fireEvent.click(retryButton);

      expect(screen.getByText('음식 사진 촬영')).toBeInTheDocument();
    });

    it('분석 중 취소 버튼을 클릭하면 캡처 상태로 돌아간다', async () => {
      // fetch를 지연시켜 분석 중 상태 유지
      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    success: true,
                    result: { foods: [], totalCalories: 0, mealType: 'lunch' },
                  }),
              }),
            5000
          )
        )
      );

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // 분석 중 상태 확인
      await waitFor(() => {
        expect(screen.getByText('음식 분석 중')).toBeInTheDocument();
      });

      // 취소 버튼 확인 및 클릭
      const cancelButton = screen.getByText('취소');
      expect(cancelButton).toBeInTheDocument();
      fireEvent.click(cancelButton);

      // 캡처 상태로 돌아감
      await waitFor(() => {
        expect(screen.getByText('음식 사진 촬영')).toBeInTheDocument();
      });
    });

    it('분석 중 촬영된 사진이 표시된다', async () => {
      // fetch를 지연시켜 분석 중 상태 유지
      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    success: true,
                    result: { foods: [], totalCalories: 0, mealType: 'lunch' },
                  }),
              }),
            5000
          )
        )
      );

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // 분석 중 상태 확인 및 이미지 표시 확인
      await waitFor(() => {
        expect(screen.getByText('음식 분석 중')).toBeInTheDocument();
        expect(screen.getByAltText('촬영된 음식 사진')).toBeInTheDocument();
      });
    });

    it('취소 시 AbortError는 에러 상태로 표시되지 않는다', async () => {
      // AbortError를 발생시키는 fetch mock
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      render(<FoodCapturePage />);

      const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
      const file = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // AbortError 발생 후 에러 상태가 표시되지 않아야 함
      await waitFor(() => {
        expect(screen.queryByText('분석 실패')).not.toBeInTheDocument();
      });
    });
  });
});
