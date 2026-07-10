import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalysisStatus, invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';

// Mock dependencies
const mockUser = { id: 'test-user-id' };
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({ user: mockUser, isLoaded: true })),
}));

// 테이블별 응답 제어 — postgrest는 실패 시 throw 대신 { data: null, error }를 반환하므로
// 오류 시나리오도 resolve로 모킹한다 (실제 동작과 동일).
interface QueryResult {
  data: Array<Record<string, unknown>> | null;
  error: { message: string } | null;
}
const tableResults = new Map<string, QueryResult>();
let defaultResult: QueryResult = { data: [], error: null };

function setTableResult(table: string, result: QueryResult): void {
  tableResults.set(table, result);
}

function setAllTables(result: QueryResult): void {
  defaultResult = result;
  tableResults.clear();
}

const mockFrom = vi.fn((table: string) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn(() => Promise.resolve(tableResults.get(table) ?? defaultResult)),
}));

// 훅의 useEffect deps에 들어가므로 렌더 간 참조가 안정적이어야 한다
const mockClient = { from: mockFrom };

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockClient,
}));

// PC 분석 행 (buildPersonalColorSummary 입력 형태)
const PC_ROW = {
  id: 'pc-1',
  season: 'Spring',
  created_at: '2026-07-10T00:00:00Z',
  best_colors: [],
  image_analysis: null,
};

describe('useAnalysisStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 모듈 레벨 5분 캐시가 테스트 간 새지 않도록 초기화
    invalidateAnalysisCache();
    setAllTables({ data: [], error: null });
  });

  it('초기 로딩 상태를 반환한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    // 처음에는 로딩 상태
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('분석 데이터가 없으면 isNewUser가 true', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isNewUser).toBe(true);
    expect(result.current.analysisCount).toBe(0);
    expect(result.current.analyses).toHaveLength(0);
  });

  it('hasPersonalColor 플래그가 정확히 설정된다', async () => {
    // 퍼스널 컬러가 없는 경우
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPersonalColor).toBe(false);
  });

  it('hasSkin, hasBody, hasHair, hasMakeup 플래그가 존재한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toHaveProperty('hasSkin');
    expect(result.current).toHaveProperty('hasBody');
    expect(result.current).toHaveProperty('hasHair');
    expect(result.current).toHaveProperty('hasMakeup');
  });

  it('analysisCount가 analyses 배열 길이와 일치한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysisCount).toBe(result.current.analyses.length);
  });

  it('사용자 상태 판단 플래그가 정확하다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 분석 0개 → isNewUser = true
    expect(result.current.isNewUser).toBe(true);
    expect(result.current.isGrowingUser).toBe(false);
    expect(result.current.isActiveUser).toBe(false);
  });

  // ── 재발 방지: 오류는 신규 회원으로 위장되지 않는다 ──────────────────────
  describe('오류 정직성 (오류 ≠ 분석 0개)', () => {
    it('쿼리 오류 시 hasError가 true — 오류를 "분석 0개"로 위장하지 않는다', async () => {
      // postgrest 실패는 throw가 아니라 { data: null, error } resolve
      setAllTables({ data: null, error: { message: 'connection refused' } });

      const { result } = renderHook(() => useAnalysisStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 핵심 계약: hasError=true → HomeStateRouter가 NewUserHero 대신 에러 UI를 렌더
      expect(result.current.hasError).toBe(true);
    });

    it('일부 테이블만 오류여도 hasError가 true (부분 결과를 전체로 위장하지 않음)', async () => {
      setTableResult('personal_color_assessments', { data: [PC_ROW], error: null });
      setTableResult('skin_analyses', { data: null, error: { message: 'timeout' } });

      const { result } = renderHook(() => useAnalysisStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasError).toBe(true);
    });

    it('오류 결과는 캐시에 기록되지 않는다 — 다음 마운트가 재조회한다', async () => {
      setAllTables({ data: null, error: { message: 'db down' } });

      const first = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(first.result.current.isLoading).toBe(false);
      });
      expect(first.result.current.hasError).toBe(true);
      first.unmount();

      // 복구 후 재마운트 — 오류가 캐시됐다면 빈 결과가 5분간 남아 아래가 실패한다
      setAllTables({ data: [], error: null });
      setTableResult('personal_color_assessments', { data: [PC_ROW], error: null });

      const second = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(second.result.current.isLoading).toBe(false);
      });
      expect(second.result.current.hasError).toBe(false);
      expect(second.result.current.hasPersonalColor).toBe(true);
      second.unmount();
    });
  });

  // ── 재발 방지: refetch는 재조회한다 (영구 스켈레톤 금지) ─────────────────
  describe('refetch', () => {
    it('refetch 호출 시 실제로 재조회한다 — 로딩이 끝나고 새 데이터가 반영된다', async () => {
      const { result } = renderHook(() => useAnalysisStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.analysisCount).toBe(0);

      // 새 분석이 생긴 상황
      setTableResult('personal_color_assessments', { data: [PC_ROW], error: null });

      act(() => {
        result.current.refetch();
      });

      // refetch가 fetch를 다시 돌리지 않으면 isLoading=true로 영구 스켈레톤에 갇힌다
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.hasPersonalColor).toBe(true);
      expect(result.current.analysisCount).toBe(1);
    });

    it('오류 후 refetch로 복구된다 (에러 UI의 "다시 시도" 경로)', async () => {
      setAllTables({ data: null, error: { message: 'boom' } });

      const { result } = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      setAllTables({ data: [], error: null });
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.hasError).toBe(false);
    });
  });

  // ── 재발 방지: 분석 완료 후 캐시 무효화 ─────────────────────────────────
  describe('invalidateAnalysisCache', () => {
    it('무효화 없이는 5분 캐시가 유지되고, 무효화하면 재조회한다', async () => {
      // 1차 마운트: 분석 0개가 캐시된다
      const first = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(first.result.current.isLoading).toBe(false);
      });
      expect(first.result.current.analysisCount).toBe(0);
      first.unmount();

      // 분석 완료로 DB에 새 행이 생김
      setTableResult('personal_color_assessments', { data: [PC_ROW], error: null });

      // 무효화 없이 재마운트 → 여전히 캐시된 0개 (5분 TTL)
      const stale = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(stale.result.current.isLoading).toBe(false);
      });
      expect(stale.result.current.analysisCount).toBe(0);
      stale.unmount();

      // 분석 완료 경로가 호출하는 무효화 → 재마운트가 새 데이터를 본다
      invalidateAnalysisCache();

      const fresh = renderHook(() => useAnalysisStatus());
      await waitFor(() => {
        expect(fresh.result.current.isLoading).toBe(false);
      });
      expect(fresh.result.current.analysisCount).toBe(1);
      expect(fresh.result.current.hasPersonalColor).toBe(true);
      fresh.unmount();
    });
  });
});
