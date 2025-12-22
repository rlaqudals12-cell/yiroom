/**
 * N-1 FoodResultPage 테스트
 * Task 2.5: 분석 결과 화면
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FoodResultPage from '@/app/(main)/nutrition/food-result/page';

// next/navigation 모킹
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// next/image 모킹
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
     
    <img src={src} alt={alt} />
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock 분석 결과 데이터
const mockAnalysisResult = {
  result: {
    foods: [
      {
        name: '김치찌개',
        portion: '1인분 (약 300g)',
        calories: 380,
        protein: 20,
        carbs: 25,
        fat: 22,
        trafficLight: 'green',
        confidence: 0.88,
      },
      {
        name: '흰쌀밥',
        portion: '1공기 (약 210g)',
        calories: 310,
        protein: 6,
        carbs: 68,
        fat: 1,
        trafficLight: 'yellow',
        confidence: 0.82,
      },
    ],
    totalCalories: 690,
    totalProtein: 26,
    totalCarbs: 93,
    totalFat: 23,
    insight: '균형 잡힌 식사입니다.',
  },
  mealType: 'lunch',
  usedMock: false,
  imageBase64: 'mockBase64ImageData',
};

describe('FoodResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // sessionStorage 초기화
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('분석 결과가 없을 때 안내 메시지를 표시한다', async () => {
    render(<FoodResultPage />);

    // 로딩 후 데이터 없음 메시지 표시
    await waitFor(() => {
      expect(screen.getByText('분석 결과가 없어요')).toBeInTheDocument();
    });
    expect(screen.getByText('음식 사진을 먼저 촬영해주세요.')).toBeInTheDocument();
  });

  it('음식 촬영하기 버튼이 동작한다', async () => {
    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '음식 촬영하기' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '음식 촬영하기' }));
    expect(mockPush).toHaveBeenCalledWith('/nutrition/food-capture');
  });

  it('sessionStorage에서 분석 결과를 로드하여 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('점심 분석 결과')).toBeInTheDocument();
    });
    expect(screen.getByText('김치찌개')).toBeInTheDocument();
    expect(screen.getByText('흰쌀밥')).toBeInTheDocument();
  });

  it('총 영양소 요약을 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('690')).toBeInTheDocument(); // 총 칼로리
    });
    expect(screen.getByText('총 영양소')).toBeInTheDocument();
  });

  it('AI 인사이트를 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText(/균형 잡힌 식사입니다/)).toBeInTheDocument();
    });
  });

  it('인식된 음식 개수를 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText(/인식된 음식 \(2개\)/)).toBeInTheDocument();
    });
  });

  it('다시 촬영 버튼이 동작한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '다시 촬영' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '다시 촬영' }));
    expect(mockPush).toHaveBeenCalledWith('/nutrition/food-capture');
    expect(sessionStorage.getItem('foodAnalysisResult')).toBeNull();
  });

  it('저장하기 버튼이 API를 호출한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, record: { id: 'test-id' } }),
    });

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /저장하기/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /저장하기/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/nutrition/meals', expect.any(Object));
    });
  });

  it('저장 성공 시 영양 페이지로 이동한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, record: { id: 'test-id' } }),
    });

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /저장하기/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /저장하기/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/nutrition');
    });
  });

  it('저장 실패 시 에러 메시지를 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '저장에 실패했습니다.' }),
    });

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /저장하기/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /저장하기/i }));

    await waitFor(() => {
      expect(screen.getByText('저장에 실패했습니다.')).toBeInTheDocument();
    });
  });

  it('뒤로가기 버튼이 동작한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(mockBack).toHaveBeenCalled();
  });

  it('Mock 데이터 사용 시 알림을 표시한다', async () => {
    const mockDataWithMock = {
      ...mockAnalysisResult,
      usedMock: true,
    };
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockDataWithMock));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText(/AI 분석이 일시적으로 사용 불가/)).toBeInTheDocument();
    });
  });

  it('양 조절 시 총 칼로리가 업데이트된다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('김치찌개')).toBeInTheDocument();
    });

    // 첫 번째 음식의 양을 2로 변경
    // FoodResultCard 내부의 양 조절 버튼 클릭
    const portionButtons = screen.getAllByRole('button', { name: '2' });
    fireEvent.click(portionButtons[0]); // 첫 번째 카드의 2 버튼

    // 총 칼로리 업데이트 확인: 380*2 + 310*1 = 1070
    await waitFor(() => {
      expect(screen.getByText('1070')).toBeInTheDocument();
    });
  });

  it('data-testid가 설정되어 있다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('food-result-page')).toBeInTheDocument();
    });
  });

  it('촬영된 사진을 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      const img = screen.getByAltText('촬영된 음식 사진');
      expect(img).toBeInTheDocument();
    });
  });

  it('식사 타입 라벨이 올바르게 표시된다', async () => {
    const breakfastResult = {
      ...mockAnalysisResult,
      mealType: 'breakfast',
    };
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(breakfastResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('아침 분석 결과')).toBeInTheDocument();
    });
  });

  it('수정 버튼 클릭 시 준비 중 알림을 표시한다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('김치찌개')).toBeInTheDocument();
    });

    // 수정 버튼 클릭 (첫 번째 카드의 상세 보기가 펼쳐져 있어야 수정 버튼이 보임)
    const editButtons = screen.getAllByRole('button', { name: /수정/i });
    fireEvent.click(editButtons[0]);

    // 준비 중 알림 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/"김치찌개" 수정 기능은 준비 중입니다./)).toBeInTheDocument();
    });
  });

  it('각 음식 카드에 수정 버튼이 표시된다', async () => {
    sessionStorage.setItem('foodAnalysisResult', JSON.stringify(mockAnalysisResult));

    render(<FoodResultPage />);

    await waitFor(() => {
      expect(screen.getByText('김치찌개')).toBeInTheDocument();
    });

    // 두 번째 카드 펼치기
    const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]); // 두 번째 카드 펼치기
    }

    // 수정 버튼들이 표시되는지 확인
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /수정/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
