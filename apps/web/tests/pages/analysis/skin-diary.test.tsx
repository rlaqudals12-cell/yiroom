/**
 * 피부 다이어리 페이지 테스트
 *
 * 참고: 탭 전환 및 복잡한 상호작용은 Radix Tabs의 테스트 환경 제한으로 E2E에서 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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

// Mock 데이터를 저장할 변수
let mockEntriesData: unknown[] | null = [];
let mockEntriesError: unknown = null;

// Supabase 체이닝을 지원하는 mock builder
// 실제 코드에서 .select().gte().lte().order() 같은 체이닝이 사용되므로
// 모든 메서드가 자기 자신을 반환해야 함
function createChainableQueryBuilder() {
  const builder: Record<string, unknown> = {};

  // 모든 체이닝 메서드는 자기 자신을 반환
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  builder.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));

  // Promise-like behavior: await 시 현재 mockEntriesData/Error 반환
  builder.then = (resolve: (value: { data: unknown[] | null; error: unknown }) => void) =>
    resolve({ data: mockEntriesData, error: mockEntriesError });

  return builder;
}

// 안정적인 builder 인스턴스 생성 (한 번만 생성)
const stableBuilder = createChainableQueryBuilder();

// 안정적인 from 함수 (참조 동일성 유지)
const stableFrom = vi.fn(() => stableBuilder);

// 안정적인 supabase 객체 (참조 동일성 유지)
const stableSupabase = {
  from: stableFrom,
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableSupabase,
}));

import SkinDiaryPage from '@/app/(main)/analysis/skin/diary/page';

describe('SkinDiaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본값: 빈 배열, 에러 없음
    mockEntriesData = [];
    mockEntriesError = null;
  });

  describe('렌더링', () => {
    it('페이지 제목을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByText('피부 다이어리')).toBeInTheDocument();
      });
    });

    it('리포트 버튼을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /리포트/ })).toBeInTheDocument();
      });
    });

    it('탭을 표시한다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /캘린더/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /인사이트/ })).toBeInTheDocument();
      });
    });

    it('캘린더 탭이 기본으로 선택되어 있다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        const calendarTab = screen.getByRole('tab', { name: /캘린더/ });
        expect(calendarTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('인사이트 탭이 클릭 가능한 상태이다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        const insightsTab = screen.getByRole('tab', { name: /인사이트/ });
        expect(insightsTab).not.toBeDisabled();
      });
    });
  });

  describe('에러 처리', () => {
    it('에러 발생 시 에러 메시지를 표시한다', async () => {
      mockEntriesData = null;
      mockEntriesError = { message: 'Database error' };

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

    it('tablist 역할이 있다', async () => {
      render(<SkinDiaryPage />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });
  });
});

// 참고사항:
// - 빈 상태/기록 목록 테스트는 Radix Tabs의 TabsContent 렌더링이 테스트 환경에서 복잡하여 E2E에서 검증
// - 탭 전환 후 내용 확인은 E2E에서 검증
// - 비로그인 상태 테스트는 Clerk Mock 재설정이 복잡하여 E2E에서 검증
