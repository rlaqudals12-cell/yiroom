/**
 * useConnectionExposure 훅 테스트
 *
 * CA expose/confirm 플로우, 에러 처리
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({ user: { id: 'test_user_123' }, isLoaded: true })),
  useAuth: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  })),
}));

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  useClerkSupabaseClient: jest.fn(() => ({})),
}));

// Mock connection-awareness
const mockExposeConnection = jest.fn();
const mockConfirmConnection = jest.fn();
jest.mock('../../lib/connection-awareness', () => ({
  exposeConnection: (...args: unknown[]) => mockExposeConnection(...args),
  confirmConnection: (...args: unknown[]) => mockConfirmConnection(...args),
  getExplanationDepth: jest.fn((status: string) => {
    const map: Record<string, string> = {
      exposed: 'full',
      recognized: 'brief',
      internalized: 'minimal',
      independent: 'none',
    };
    return map[status] ?? 'full';
  }),
}));

import { useConnectionExposure } from '../../hooks/useConnectionExposure';
import type { ExposeRequest } from '../../lib/connection-awareness';

// sourceModule은 ConnectionModule 리터럴 유니온이라 ExposeRequest로 명시 (string 추론 방지)
const mockRequest: ExposeRequest = {
  connectionId: 'test::connection_1',
  sourceModule: 'skin',
  targetDomain: 'nutrition',
  connectionRule: '피부 수분 + 수분 섭취',
};

describe('useConnectionExposure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('마운트 시 exposeConnection을 호출해야 한다', async () => {
    mockExposeConnection.mockResolvedValue({
      status: 'exposed',
      exposureCount: 1,
      statusChanged: false,
    });

    renderHook(() => useConnectionExposure(mockRequest));

    await waitFor(() => {
      expect(mockExposeConnection).toHaveBeenCalledTimes(1);
      expect(mockExposeConnection).toHaveBeenCalledWith(
        expect.anything(),
        'test_user_123',
        mockRequest
      );
    });
  });

  it('expose 결과로 status와 exposureCount를 업데이트해야 한다', async () => {
    mockExposeConnection.mockResolvedValue({
      status: 'recognized',
      exposureCount: 3,
      statusChanged: true,
    });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await waitFor(() => {
      expect(result.current.status).toBe('recognized');
      expect(result.current.exposureCount).toBe(3);
      expect(result.current.depth).toBe('brief');
    });
  });

  it('confirm 호출 시 confirmConnection을 실행해야 한다', async () => {
    mockExposeConnection.mockResolvedValue({
      status: 'exposed',
      exposureCount: 1,
      statusChanged: false,
    });
    mockConfirmConnection.mockResolvedValue({
      status: 'recognized',
      confirmedCount: 1,
      statusChanged: true,
    });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await waitFor(() => {
      expect(result.current.status).toBe('exposed');
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockConfirmConnection).toHaveBeenCalledWith(
      expect.anything(),
      'test_user_123',
      'test::connection_1'
    );
    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.status).toBe('recognized');
  });

  it('expose 실패 시 기본값을 유지해야 한다', async () => {
    mockExposeConnection.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await waitFor(() => {
      // 에러 발생 후에도 기본값 유지
      expect(result.current.status).toBe('exposed');
      expect(result.current.depth).toBe('full');
    });
  });

  it('confirm 실패 시 isConfirmed를 false로 유지해야 한다', async () => {
    mockExposeConnection.mockResolvedValue({
      status: 'exposed',
      exposureCount: 1,
      statusChanged: false,
    });
    mockConfirmConnection.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await waitFor(() => {
      expect(result.current.status).toBe('exposed');
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(result.current.isConfirmed).toBe(false);
  });

  it('userId가 없으면 expose를 호출하지 않아야 한다', async () => {
    const { useUser } = require('@clerk/clerk-expo');
    useUser.mockReturnValue({ user: null, isLoaded: true });

    renderHook(() => useConnectionExposure(mockRequest));

    // 약간의 대기 후 expose가 호출되지 않았는지 확인
    await new Promise((r) => setTimeout(r, 50));
    expect(mockExposeConnection).not.toHaveBeenCalled();
  });
});
