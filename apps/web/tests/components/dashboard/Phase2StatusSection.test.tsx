/**
 * Phase2StatusSection 컴포넌트 테스트
 * - 로딩 상태
 * - 운동/영양 완료 상태
 * - 운동/영양 미완료 상태
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Phase2StatusSection from '@/app/(main)/dashboard/_components/Phase2StatusSection';

// Supabase 클라이언트 모킹
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockSelect = vi.fn(() => ({
  order: mockOrder,
  single: mockSingle,
}));
const mockFrom = vi.fn((table: string) => {
  // workout_analyses는 order -> limit -> single 체인
  // nutrition_settings는 select -> single 체인
  if (table === 'workout_analyses') {
    return { select: mockSelect };
  }
  return { select: mockSelect };
});

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// Next.js Link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href.replace(/\//g, '-')}`}>
      {children}
    </a>
  ),
}));

describe('Phase2StatusSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 중 상태 표시', () => {
    // 데이터 로드 지연
    mockSingle.mockReturnValue(new Promise(() => {}));

    render(<Phase2StatusSection />);

    expect(screen.getByTestId('phase2-status-loading')).toBeInTheDocument();
    expect(screen.getByText('웰니스 관리')).toBeInTheDocument();
  });

  it('운동/영양 모두 완료 상태', async () => {
    // 첫 번째 호출: workout_analyses (order -> limit -> single 체인)
    mockSingle
      .mockResolvedValueOnce({ data: { workout_type: 'builder' } })
      // 두 번째 호출: nutrition_settings (select -> single 체인)
      .mockResolvedValueOnce({ data: { goal: 'muscle_gain' } });

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    // 운동 카드
    expect(screen.getByTestId('status-card-운동')).toBeInTheDocument();
    expect(screen.getByText('빌더 타입')).toBeInTheDocument();

    // 영양 카드
    expect(screen.getByTestId('status-card-영양')).toBeInTheDocument();
    expect(screen.getByText('목표: 근육 증가')).toBeInTheDocument();
  });

  it('운동/영양 모두 미완료 상태', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    expect(screen.getByText('운동 분석 시작하기')).toBeInTheDocument();
    expect(screen.getByText('영양 설정 시작하기')).toBeInTheDocument();
  });

  it('운동만 완료 상태', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { workout_type: 'toner' } })
      .mockResolvedValueOnce({ data: null });

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    expect(screen.getByText('토너 타입')).toBeInTheDocument();
    expect(screen.getByText('영양 설정 시작하기')).toBeInTheDocument();
  });

  it('영양만 완료 상태', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { goal: 'weight_loss' } });

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    expect(screen.getByText('운동 분석 시작하기')).toBeInTheDocument();
    expect(screen.getByText('목표: 체중 감량')).toBeInTheDocument();
  });

  it('링크가 올바른 경로로 연결됨', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { workout_type: 'builder' } })
      .mockResolvedValueOnce({ data: { goal: 'health' } });

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('link--workout')).toHaveAttribute('href', '/workout');
    expect(screen.getByTestId('link--nutrition')).toHaveAttribute('href', '/nutrition');
  });

  it('API 오류 시 미완료 상태로 표시', async () => {
    mockSingle.mockRejectedValue(new Error('Network error'));

    render(<Phase2StatusSection />);

    await waitFor(() => {
      expect(screen.getByTestId('phase2-status-section')).toBeInTheDocument();
    });

    expect(screen.getByText('운동 분석 시작하기')).toBeInTheDocument();
    expect(screen.getByText('영양 설정 시작하기')).toBeInTheDocument();
  });
});
