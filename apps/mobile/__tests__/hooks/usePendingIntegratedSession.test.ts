import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockMaybeSingle = jest.fn();
const mockAbortSignal = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

interface MockQuery {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  abortSignal: jest.Mock;
  maybeSingle: jest.Mock;
}

const mockQuery = {} as MockQuery;
mockQuery.select = jest.fn(() => mockQuery);
mockQuery.eq = mockEq.mockImplementation(() => mockQuery);
mockQuery.order = jest.fn(() => mockQuery);
mockQuery.limit = jest.fn(() => mockQuery);
mockQuery.abortSignal = mockAbortSignal.mockImplementation(() => mockQuery);
mockQuery.maybeSingle = mockMaybeSingle;
const mockSupabaseClient = { from: mockFrom.mockImplementation(() => mockQuery) };

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

import {
  PENDING_POLL_MAX_MS,
  usePendingIntegratedSession,
} from '@/hooks/usePendingIntegratedSession';

const REQUEST_ID = '11111111-2222-4333-8444-555555555555';

async function flushFakeTimerEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('usePendingIntegratedSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('서버 60초 상한 전에는 pending을 stalled로 오판하지 않고 90초 상한 뒤 멈춘다', async () => {
    jest.useFakeTimers();
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'session-pending', status: 'pending' },
      error: null,
    });

    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await flushFakeTimerEffects();
    expect(result.current.recoveryState).toBe('pending');

    act(() => {
      jest.advanceTimersByTime(59_000);
    });
    expect(result.current.recoveryState).not.toBe('stalled');

    act(() => {
      jest.advanceTimersByTime(PENDING_POLL_MAX_MS - 59_000 + 1);
    });
    expect(result.current.recoveryState).toBe('stalled');
  });

  it('completed/partial 세션은 정확한 clientRequestId 조회로 복구한다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'session-completed', status: 'partial' },
      error: null,
    });

    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await waitFor(() => expect(result.current.recoveryState).toBe('completed'));
    expect(result.current.session).toEqual({ id: 'session-completed', status: 'partial' });
    expect(mockEq).toHaveBeenCalledWith('questionnaire->>_clientRequestId', REQUEST_ID);
  });

  it('단일 DB 조회가 멎어도 90초 hard deadline에서 abort하고 stalled로 끝낸다', async () => {
    jest.useFakeTimers();
    mockMaybeSingle.mockImplementation(() => new Promise(() => undefined));
    const captured: { signal?: AbortSignal } = {};
    mockAbortSignal.mockImplementation((signal: AbortSignal) => {
      captured.signal = signal;
      return mockQuery;
    });

    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await flushFakeTimerEffects();
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    act(() => {
      jest.advanceTimersByTime(PENDING_POLL_MAX_MS + 1);
    });

    expect(result.current.recoveryState).toBe('stalled');
    expect(captured.signal).toBeDefined();
    expect(captured.signal?.aborted).toBe(true);
  });
});
