/**
 * 피부 다이어리 페이지 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock 설정
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

import SkinDiaryPage from '@/app/(main)/analysis/skin/diary/page';

describe('SkinDiaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 체이닝 설정
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('렌더링', () => {
    it('페이지 제목을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByText('피부 다이어리')).toBeInTheDocument();
      });
    });

    it('기록하기 버튼을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /기록하기/ })).toBeInTheDocument();
      });
    });

    it('탭을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /기록/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /통계/ })).toBeInTheDocument();
      });
    });
  });

  describe('빈 상태', () => {
    it('기록이 없으면 안내 메시지를 표시한다', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByText(/아직 기록이 없어요/)).toBeInTheDocument();
      });
    });

    it('첫 기록 작성하기 버튼을 표시한다', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /첫 기록 작성하기/ })).toBeInTheDocument();
      });
    });
  });

  describe('다이어리 목록', () => {
    it('기존 기록을 표시한다', async () => {
      const mockEntries = [
        {
          id: '1',
          entry_date: '2026-01-09',
          skin_condition: 4,
          condition_notes: '오늘 피부 상태 좋음',
          morning_routine_completed: true,
          evening_routine_completed: false,
          created_at: '2026-01-09T10:00:00Z',
        },
        {
          id: '2',
          entry_date: '2026-01-08',
          skin_condition: 3,
          condition_notes: null,
          morning_routine_completed: true,
          evening_routine_completed: true,
          created_at: '2026-01-08T10:00:00Z',
        },
      ];

      mockLimit.mockResolvedValue({ data: mockEntries, error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByText('오늘 피부 상태 좋음')).toBeInTheDocument();
      });

      // 컨디션 이모지 확인 (4 = 🙂)
      expect(screen.getByText('🙂')).toBeInTheDocument();
    });

    it('루틴 완료 뱃지를 표시한다', async () => {
      const mockEntries = [
        {
          id: '1',
          entry_date: '2026-01-09',
          skin_condition: 4,
          condition_notes: null,
          morning_routine_completed: true,
          evening_routine_completed: true,
          created_at: '2026-01-09T10:00:00Z',
        },
      ];

      mockLimit.mockResolvedValue({ data: mockEntries, error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByText('아침')).toBeInTheDocument();
        expect(screen.getByText('저녁')).toBeInTheDocument();
      });
    });
  });

  describe('새 기록 작성', () => {
    it('기록하기 버튼 클릭 시 엔트리 폼을 표시한다', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /기록하기/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /기록하기/ }));

      await waitFor(() => {
        expect(screen.getByTestId('skin-diary-entry')).toBeInTheDocument();
      });
    });
  });

  describe('통계 탭', () => {
    it('통계 탭이 렌더링된다', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /통계/ })).toBeInTheDocument();
      });

      // 탭이 클릭 가능한 상태인지 확인
      const statsTab = screen.getByRole('tab', { name: /통계/ });
      expect(statsTab).not.toBeDisabled();
    });

    // 참고: 탭 전환 및 통계 데이터 표시는 E2E에서 검증
    // Radix Tabs의 상태 변경은 테스트 환경에서 복잡함
  });

  describe('에러 처리', () => {
    it('에러 발생 시 에러 메시지를 표시한다', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/실패했습니다/);
      });
    });
  });

  describe('접근성', () => {
    it('data-testid가 있다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('skin-diary-page')).toBeInTheDocument();
      });
    });
  });
});

// 참고: 비로그인 상태 테스트는 Clerk Mock 재설정이 복잡하여 E2E에서 검증
// setup.ts의 기본 Clerk Mock은 isSignedIn: false이지만,
// 이 테스트 파일에서는 describe 시작 전에 isSignedIn: true로 오버라이드됨
