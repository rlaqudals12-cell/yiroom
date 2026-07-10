/**
 * useBriefing 안정 패턴 검증 (적대적 리뷰 5)
 *
 * getToken 참조가 불안정(매 렌더 새 함수)해도 로드 이펙트가 재실행되지 않아
 * 무한 refetch가 없음을 단언. (getToken을 ref로 잡고 이펙트 deps에서 제외)
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

const mockFetchBriefing = jest.fn();
jest.mock('@/lib/api/briefing', () => ({
  fetchBriefing: (...args: unknown[]) => mockFetchBriefing(...args),
}));

import { useAuth } from '@clerk/clerk-expo';

import { useBriefing } from '../../hooks/useBriefing';

describe('useBriefing — getToken 안정 패턴', () => {
  beforeEach(() => {
    mockFetchBriefing.mockReset();
    mockFetchBriefing.mockResolvedValue({ data: { hasAnalyses: false }, stale: false });
    // 매 렌더 새 getToken 함수를 반환(참조 불안정 시뮬레이션)
    (useAuth as jest.Mock).mockImplementation(() => ({
      getToken: () => Promise.resolve('mock-token'),
    }));
  });

  it('불안정 getToken으로 여러 번 리렌더해도 fetch를 1회만 호출한다', async () => {
    const { rerender } = renderHook(() => useBriefing());

    await waitFor(() => expect(mockFetchBriefing).toHaveBeenCalledTimes(1));

    rerender({});
    rerender({});
    rerender({});
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchBriefing).toHaveBeenCalledTimes(1);
  });
});
