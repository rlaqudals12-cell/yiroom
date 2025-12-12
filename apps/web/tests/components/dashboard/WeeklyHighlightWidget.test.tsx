import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WeeklyHighlightWidget from '@/app/(main)/dashboard/_components/WeeklyHighlightWidget';

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WeeklyHighlightWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 상태를 표시한다', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // 영원히 대기

    render(<WeeklyHighlightWidget />);

    expect(screen.getByTestId('weekly-highlight-loading')).toBeInTheDocument();
  });

  it('데이터가 없을 때 빈 상태를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          nutrition: {
            summary: {
              daysWithRecords: 0,
              avgCaloriesPerDay: 0,
              avgWaterPerDay: 0,
            },
          },
          workout: {
            summary: { totalSessions: 0 },
          },
          streak: {
            nutrition: { current: 0 },
            workout: { current: 0 },
          },
        },
      }),
    });

    render(<WeeklyHighlightWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('weekly-highlight-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('이번 주 기록이 아직 없습니다')).toBeInTheDocument();
    expect(screen.getByText(/식단 기록 시작하기/)).toBeInTheDocument();
  });

  it('주간 데이터를 올바르게 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          nutrition: {
            summary: {
              daysWithRecords: 5,
              avgCaloriesPerDay: 1850,
              avgWaterPerDay: 1500,
            },
          },
          workout: {
            summary: { totalSessions: 3 },
          },
          streak: {
            nutrition: { current: 7 },
            workout: { current: 3 },
          },
        },
      }),
    });

    render(<WeeklyHighlightWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('weekly-highlight-widget')).toBeInTheDocument();
    });

    // 평균 칼로리
    expect(screen.getByText('1,850')).toBeInTheDocument();
    expect(screen.getByText('평균 칼로리')).toBeInTheDocument();

    // 평균 수분 (1500ml = 1.5L)
    expect(screen.getByText('1.5L')).toBeInTheDocument();
    expect(screen.getByText('평균 수분')).toBeInTheDocument();

    // 운동 횟수
    expect(screen.getByText('3회')).toBeInTheDocument();
    expect(screen.getByText('운동 횟수')).toBeInTheDocument();
  });

  it('스트릭 정보를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          nutrition: {
            summary: {
              daysWithRecords: 7,
              avgCaloriesPerDay: 2000,
              avgWaterPerDay: 2000,
            },
          },
          workout: {
            summary: { totalSessions: 5 },
          },
          streak: {
            nutrition: { current: 14 },
            workout: { current: 7 },
          },
        },
      }),
    });

    render(<WeeklyHighlightWidget />);

    await waitFor(() => {
      expect(screen.getByText(/식단 14일 연속/)).toBeInTheDocument();
    });

    expect(screen.getByText(/운동 7일 연속/)).toBeInTheDocument();
  });

  it('상세보기 링크를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          nutrition: {
            summary: {
              daysWithRecords: 3,
              avgCaloriesPerDay: 1800,
              avgWaterPerDay: 1200,
            },
          },
          workout: {
            summary: { totalSessions: 2 },
          },
          streak: {
            nutrition: { current: 0 },
            workout: { current: 0 },
          },
        },
      }),
    });

    render(<WeeklyHighlightWidget />);

    await waitFor(() => {
      expect(screen.getByText('상세보기')).toBeInTheDocument();
    });

    const link = screen.getByText('상세보기').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('/reports/weekly/'));
  });

  it('API 에러 시 빈 상태를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<WeeklyHighlightWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('weekly-highlight-empty')).toBeInTheDocument();
    });
  });
});
