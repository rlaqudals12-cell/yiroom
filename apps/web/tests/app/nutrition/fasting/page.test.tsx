/**
 * N-1 간헐적 단식 설정 화면 테스트
 * Task 2.16: 간헐적 단식 설정 UI (app/(main)/nutrition/fasting/page.tsx)
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

import FastingSettingsPage from '@/app/(main)/nutrition/fasting/page';

// Mock 단식 설정 데이터 (API 응답 형식: snake_case + wrapper)
const mockFastingSettings = {
  success: true,
  data: {
    fasting_enabled: true,
    fasting_type: '16:8',
    fasting_start_time: '20:00',
    eating_window_hours: 8,
  },
  hasSettings: true,
};

const mockDisabledSettings = {
  success: true,
  data: {
    fasting_enabled: false,
    fasting_type: null,
    fasting_start_time: null,
    eating_window_hours: null,
  },
  hasSettings: true,
};

describe('FastingSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFastingSettings),
    });
  });

  describe('페이지 렌더링', () => {
    it('간헐적 단식 설정 페이지가 렌더링된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fasting-settings-page')).toBeInTheDocument();
      });
    });

    it('페이지 제목이 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        // h1 제목 확인 (role="heading"으로 특정)
        expect(screen.getByRole('heading', { name: '간헐적 단식' })).toBeInTheDocument();
      });
    });

    it('뒤로가기 버튼이 있다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
      });
    });
  });

  describe('단식 활성화 토글', () => {
    it('단식 활성화 토글이 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fasting-toggle')).toBeInTheDocument();
      });
    });

    it('토글 클릭 시 단식 활성화 상태가 변경된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDisabledSettings),
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fasting-toggle')).toBeInTheDocument();
      });

      const toggle = screen.getByTestId('fasting-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        // 활성화되면 단식 타입 선택이 표시됨
        expect(screen.getByText('단식 유형')).toBeInTheDocument();
      });
    });
  });

  describe('단식 유형 선택', () => {
    it('활성화 시 단식 유형 옵션이 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('16:8')).toBeInTheDocument();
        expect(screen.getByText('18:6')).toBeInTheDocument();
        expect(screen.getByText('20:4')).toBeInTheDocument();
        expect(screen.getByText('커스텀')).toBeInTheDocument();
      });
    });

    it('단식 유형을 선택할 수 있다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('18:6')).toBeInTheDocument();
      });

      const option = screen.getByText('18:6');
      fireEvent.click(option);

      await waitFor(() => {
        // 선택된 상태 확인 (시각적 피드백)
        const optionButton = option.closest('button');
        expect(optionButton).toHaveClass('border-green-500');
      });
    });

    it('각 유형에 대한 설명이 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/16시간 단식/)).toBeInTheDocument();
        expect(screen.getByText(/8시간 식사/)).toBeInTheDocument();
      });
    });
  });

  describe('단식 시작 시간 설정', () => {
    it('단식 시작 시간 입력 필드가 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('단식 시작 시간')).toBeInTheDocument();
      });
    });

    it('시간을 선택할 수 있다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('단식 시작 시간')).toBeInTheDocument();
      });

      const timeInput = screen.getByLabelText('단식 시작 시간');
      fireEvent.change(timeInput, { target: { value: '21:00' } });

      expect(timeInput).toHaveValue('21:00');
    });
  });

  describe('커스텀 단식 설정', () => {
    it('커스텀 선택 시 식사 창 시간 입력이 표시된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              ...mockFastingSettings.data,
              fasting_type: 'custom',
              eating_window_hours: 6,
            },
            hasSettings: true,
          }),
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('커스텀')).toBeInTheDocument();
      });

      // 커스텀 선택
      const customOption = screen.getByText('커스텀');
      fireEvent.click(customOption);

      await waitFor(() => {
        expect(screen.getByLabelText('식사 가능 시간')).toBeInTheDocument();
      });
    });

    it('식사 가능 시간을 설정할 수 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              ...mockFastingSettings.data,
              fasting_type: 'custom',
            },
            hasSettings: true,
          }),
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('커스텀')).toBeInTheDocument();
      });

      const customOption = screen.getByText('커스텀');
      fireEvent.click(customOption);

      await waitFor(() => {
        const hoursInput = screen.getByLabelText('식사 가능 시간');
        fireEvent.change(hoursInput, { target: { value: '6' } });
        expect(hoursInput).toHaveValue(6);
      });
    });
  });

  describe('식사 가능 시간 표시', () => {
    it('계산된 식사 가능 시간대가 표시된다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        // 20:00 시작, 8시간 식사 = 12:00 ~ 20:00
        expect(screen.getByText(/12:00.*20:00/)).toBeInTheDocument();
      });
    });
  });

  describe('저장 기능', () => {
    it('저장 버튼이 있다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('저장')).toBeInTheDocument();
      });
    });

    it('저장 버튼 클릭 시 API를 호출한다', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFastingSettings),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('저장')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('저장');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/nutrition/settings',
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로딩 중 로딩 표시가 나타난다', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // 무한 대기

      render(<FastingSettingsPage />);

      expect(screen.getByTestId('fasting-loading')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지가 표시된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/오류/)).toBeInTheDocument();
      });
    });

    it('에러 시 다시 시도 버튼이 있다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
      });
    });
  });

  describe('네비게이션', () => {
    it('뒤로가기 버튼 클릭 시 이전 페이지로 이동한다', async () => {
      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('뒤로가기');
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('비활성화 상태', () => {
    it('단식 비활성화 시 설정 옵션이 숨겨진다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDisabledSettings),
      });

      render(<FastingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fasting-toggle')).toBeInTheDocument();
      });

      // 비활성화 상태에서는 단식 유형 옵션이 보이지 않음
      expect(screen.queryByText('단식 유형')).not.toBeInTheDocument();
    });
  });
});
