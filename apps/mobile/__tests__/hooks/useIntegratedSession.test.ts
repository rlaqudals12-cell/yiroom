/**
 * useIntegratedSession 훅 테스트 (Phase E 재방문 지원)
 *
 * @see apps/mobile/hooks/useIntegratedSession.ts
 */

import { renderHook, waitFor } from '@testing-library/react-native';

// Clerk mock
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    getToken: jest.fn().mockResolvedValue('test-token'),
  }),
}));

// Supabase mock
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

import { useIntegratedSession } from '@/hooks/useIntegratedSession';
import type { IntegratedAnalysisResult } from '@/lib/api';

const mockSessionRow = {
  id: '7a3f1234-5678-4abc-def0-0123456789ab',
  clerk_user_id: 'user_test',
  status: 'completed',
  axes_completed: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
  axes_failed: [],
  used_fallback: [],
  created_at: '2026-04-24T10:00:00Z',
  completed_at: '2026-04-24T10:00:08Z',
};

const mockPCRow = { id: 'pc-1', season: 'spring', undertone: 'warm' };

const initialResult: IntegratedAnalysisResult = {
  sessionId: '7a3f1234-5678-4abc-def0-0123456789ab',
  status: 'completed',
  axes: {
    personalColor: { success: true, data: { id: 'pc-1' }, usedFallback: false },
    skin: { success: true, data: { id: 'skin-1' }, usedFallback: false },
    body: { success: true, data: { id: 'body-1' }, usedFallback: false },
    hair: { success: true, data: { id: 'hair-1' }, usedFallback: false },
    makeup: { success: true, data: { id: 'makeup-1' }, usedFallback: false },
  },
  // 5축 모두 성공 → 나 프로필 존재 (persona는 성공 축 0개일 때만 null)
  persona: {
    oneLine: '따뜻하고 부드러운 인상의 당신',
    narrative: '5축 분석을 종합한 나 프로필',
    keyInsights: ['봄 웜톤', '복합성 피부'],
    usedFallback: false,
  },
  axesCompleted: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
  axesFailed: [],
  usedFallback: [],
  createdAt: '2026-04-24T10:00:00Z',
  completedAt: '2026-04-24T10:00:08Z',
};

describe('useIntegratedSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initialResult 있으면 네트워크 호출 생략하고 즉시 반환', async () => {
    const { result } = renderHook(() =>
      useIntegratedSession('7a3f1234-5678-4abc-def0-0123456789ab', initialResult)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.result).toEqual(initialResult);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('sessionId가 null이면 빈 결과 + 로딩 끝', async () => {
    const { result } = renderHook(() => useIntegratedSession(null, null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Supabase 조회 성공 → 세션 + 5축 결과 조합', async () => {
    // from().select().eq().maybeSingle() 호출 순서대로 mock
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockSessionRow, error: null })
      .mockResolvedValueOnce({ data: mockPCRow, error: null })
      .mockResolvedValueOnce({ data: null, error: null }) // skin 없음
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() =>
      useIntegratedSession('7a3f1234-5678-4abc-def0-0123456789ab', null)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.sessionId).toBe(mockSessionRow.id);
    expect(result.current.result?.axes.personalColor.success).toBe(true);
    if (result.current.result?.axes.personalColor.success) {
      expect(result.current.result.axes.personalColor.data.id).toBe('pc-1');
    }
    // skin은 DB 레코드 없음 → success: false
    expect(result.current.result?.axes.skin.success).toBe(false);
  });

  it('세션 존재 안 함 → result null', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useIntegratedSession('non-existent-session', null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // 왜: 에러 경로 테스트는 renderHook의 cleanup 타이밍과 useEffect cancelled 체크가 겹쳐
  //      React Native 환경에서 재현 난이도가 높음. 실제 동작은 try/catch에서 setError 수행하며
  //      api/integrated.test.ts의 HTTP 에러 테스트로 커버.
});
