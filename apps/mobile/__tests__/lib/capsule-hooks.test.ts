/**
 * 캡슐 훅 테스트
 *
 * 대상: lib/capsule/hooks.ts
 * 검증: useDailyCapsule, useBeautyProfile 동작
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useDailyCapsule, useBeautyProfile } from '../../lib/capsule/hooks';
import type { DailyCapsule, BeautyProfile } from '../../lib/capsule/api';

// =============================================================================
// Clerk 안정 모킹 — jest.setup.js의 useAuth는 render마다 새 jest.fn()을 생성하여
// useCallback([getToken]) 의존성이 매 렌더마다 변경되는 무한 루프를 유발한다.
// "mock" 접두사 변수는 jest.mock() 팩토리에서 참조 허용된다.
// =============================================================================

// jest.mock 팩토리 내에서 공유할 안정적인 getToken 참조
// (변수명이 "mock"으로 시작해야 jest 호이스팅 규칙 통과)
const mockStableGetToken = jest.fn().mockResolvedValue('mock_jwt_token');

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'test_user_123',
    sessionId: 'test_session_123',
    getToken: mockStableGetToken,
    signOut: jest.fn().mockResolvedValue(undefined),
  })),
  useUser: jest.fn(() => ({
    user: { id: 'test_user_123' },
    isLoaded: true,
    isSignedIn: true,
  })),
  ClerkProvider: ({ children }: { children: unknown }) => children,
}));

// =============================================================================
// API 모킹
// =============================================================================

const mockGenerateDailyCapsule = jest.fn();
const mockGetTodayDailyCapsule = jest.fn();
const mockCheckDailyItem = jest.fn();
const mockGetBeautyProfile = jest.fn();

jest.mock('../../lib/capsule/api', () => ({
  generateDailyCapsule: (...args: unknown[]) => mockGenerateDailyCapsule(...args),
  getTodayDailyCapsule: (...args: unknown[]) => mockGetTodayDailyCapsule(...args),
  checkDailyItem: (...args: unknown[]) => mockCheckDailyItem(...args),
  getBeautyProfile: (...args: unknown[]) => mockGetBeautyProfile(...args),
}));

// =============================================================================
// 테스트 데이터
// =============================================================================

const mockCapsule: DailyCapsule = {
  id: 'capsule-1',
  userId: 'user-1',
  date: '2026-03-12',
  items: [
    {
      id: 'item-1',
      moduleCode: 'skin',
      name: '수분 세럼 바르기',
      reason: '피부 수분 부족',
      compatibilityScore: 85,
      isChecked: false,
    },
    {
      id: 'item-2',
      moduleCode: 'nutrition',
      name: '비타민C 섭취',
      reason: '항산화 강화',
      compatibilityScore: 75,
      isChecked: true,
    },
    {
      id: 'item-3',
      moduleCode: 'workout',
      name: '스트레칭 10분',
      reason: '유연성 향상',
      compatibilityScore: 80,
      isChecked: false,
    },
  ],
  totalCcs: 82,
  estimatedMinutes: 25,
  status: 'in_progress',
  completedAt: null,
  createdAt: '2026-03-12T08:00:00Z',
};

const mockProfile: BeautyProfile = {
  userId: 'user-1',
  updatedAt: '2026-03-12T00:00:00Z',
  completedModules: ['skin', 'personal-color'],
  personalizationLevel: 2,
};

// =============================================================================
// useDailyCapsule
// =============================================================================

describe('useDailyCapsule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('초기 상태에서 capsule은 null이어야 한다', () => {
      mockGetTodayDailyCapsule.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      expect(result.current.capsule).toBeNull();
    });

    it('초기 completionRate는 0이어야 한다', () => {
      const { result } = renderHook(() => useDailyCapsule());

      expect(result.current.completionRate).toBe(0);
    });

    it('초기 error는 null이어야 한다', () => {
      const { result } = renderHook(() => useDailyCapsule());

      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchToday', () => {
    it('fetchToday 호출 시 API를 호출하고 캡슐 상태를 설정해야 한다', async () => {
      mockGetTodayDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(mockGetTodayDailyCapsule).toHaveBeenCalledTimes(1);
      expect(result.current.capsule).toEqual(mockCapsule);
      expect(result.current.error).toBeNull();
    });

    it('fetchToday 중 isLoading이 true이어야 한다', async () => {
      let resolvePromise!: (value: unknown) => void;
      mockGetTodayDailyCapsule.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => useDailyCapsule());

      act(() => {
        result.current.fetchToday();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ data: mockCapsule, error: null });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('API 에러 응답 시 error 상태를 설정해야 한다', async () => {
      const apiError = { code: 'AUTH_ERROR', message: '인증이 필요합니다.' };
      mockGetTodayDailyCapsule.mockResolvedValue({ data: null, error: apiError });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.capsule).toBeNull();
      expect(result.current.error).toEqual(apiError);
    });

    it('네트워크 오류 시 UNKNOWN_ERROR를 설정해야 한다', async () => {
      mockGetTodayDailyCapsule.mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.current.error?.message).toContain('불러올 수 없습니다');
    });
  });

  describe('generate', () => {
    it('generate 호출 시 API를 호출하고 캡슐 상태를 설정해야 한다', async () => {
      mockGenerateDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.generate();
      });

      expect(mockGenerateDailyCapsule).toHaveBeenCalledTimes(1);
      expect(result.current.capsule).toEqual(mockCapsule);
    });

    it('generate 중 isGenerating이 true이어야 한다', async () => {
      let resolvePromise!: (value: unknown) => void;
      mockGenerateDailyCapsule.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => useDailyCapsule());

      act(() => {
        result.current.generate();
      });

      expect(result.current.isGenerating).toBe(true);

      await act(async () => {
        resolvePromise({ data: mockCapsule, error: null });
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('generate 에러 시 error 상태를 설정해야 한다', async () => {
      const apiError = { code: 'INTERNAL_ERROR', message: '캡슐 생성에 실패했습니다.' };
      mockGenerateDailyCapsule.mockResolvedValue({ data: null, error: apiError });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.error).toEqual(apiError);
    });

    it('네트워크 오류 시 UNKNOWN_ERROR 메시지를 설정해야 한다', async () => {
      mockGenerateDailyCapsule.mockRejectedValue(new Error('timeout'));

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.current.error?.message).toContain('생성에 실패했습니다');
    });
  });

  describe('checkItem', () => {
    it('checkItem 호출 시 낙관적 업데이트가 즉시 반영되어야 한다', async () => {
      // 캡슐 로드
      mockGetTodayDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });
      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      // 느린 API 응답 설정 (낙관적 업데이트 확인용)
      let resolveCheck!: (value: unknown) => void;
      mockCheckDailyItem.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveCheck = resolve;
        })
      );

      act(() => {
        result.current.checkItem('item-1', true);
      });

      // 낙관적 업데이트: item-1이 isChecked=true로 즉시 변경
      const optimisticItem = result.current.capsule?.items.find((i) => i.id === 'item-1');
      expect(optimisticItem?.isChecked).toBe(true);

      // API 응답 반환 후 최종 상태 확인
      await act(async () => {
        resolveCheck({ data: mockCapsule, error: null });
      });
    });

    it('API 에러 시 낙관적 업데이트가 롤백되어야 한다', async () => {
      mockGetTodayDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });
      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      const apiError = { code: 'NETWORK_ERROR', message: '네트워크 오류' };
      mockCheckDailyItem.mockResolvedValue({ data: null, error: apiError });

      await act(async () => {
        await result.current.checkItem('item-1', true);
      });

      // 롤백: item-1이 원래 isChecked=false로 돌아와야 한다
      const rolledBackItem = result.current.capsule?.items.find((i) => i.id === 'item-1');
      expect(rolledBackItem?.isChecked).toBe(false);
      expect(result.current.error).toEqual(apiError);
    });

    it('throw 발생 시 낙관적 업데이트가 롤백되어야 한다', async () => {
      mockGetTodayDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });
      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      mockCheckDailyItem.mockRejectedValue(new Error('network error'));

      await act(async () => {
        await result.current.checkItem('item-1', true);
      });

      // 롤백 확인
      const rolledBackItem = result.current.capsule?.items.find((i) => i.id === 'item-1');
      expect(rolledBackItem?.isChecked).toBe(false);
      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('capsule이 null일 때 checkItem 호출은 아무것도 하지 않아야 한다', async () => {
      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.checkItem('item-1', true);
      });

      expect(mockCheckDailyItem).not.toHaveBeenCalled();
    });
  });

  describe('completionRate 계산', () => {
    it('아이템이 없을 때 completionRate는 0이어야 한다', () => {
      const { result } = renderHook(() => useDailyCapsule());

      expect(result.current.completionRate).toBe(0);
    });

    it('전부 미완료일 때 completionRate는 0이어야 한다', async () => {
      const allUnchecked: DailyCapsule = {
        ...mockCapsule,
        items: mockCapsule.items.map((item) => ({ ...item, isChecked: false })),
      };
      mockGetTodayDailyCapsule.mockResolvedValue({ data: allUnchecked, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.completionRate).toBe(0);
    });

    it('절반 완료 시 completionRate는 33이어야 한다 (3개 중 1개 체크)', async () => {
      // mockCapsule: item-1=false, item-2=true, item-3=false → 1/3 = 33%
      mockGetTodayDailyCapsule.mockResolvedValue({ data: mockCapsule, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.completionRate).toBe(33);
    });

    it('모두 완료 시 completionRate는 100이어야 한다', async () => {
      const allChecked: DailyCapsule = {
        ...mockCapsule,
        items: mockCapsule.items.map((item) => ({ ...item, isChecked: true })),
      };
      mockGetTodayDailyCapsule.mockResolvedValue({ data: allChecked, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.completionRate).toBe(100);
    });

    it('2개 중 1개 완료 시 completionRate는 50이어야 한다', async () => {
      const halfChecked: DailyCapsule = {
        ...mockCapsule,
        items: [
          { ...mockCapsule.items[0], isChecked: true },
          { ...mockCapsule.items[1], isChecked: false },
        ],
      };
      mockGetTodayDailyCapsule.mockResolvedValue({ data: halfChecked, error: null });

      const { result } = renderHook(() => useDailyCapsule());

      await act(async () => {
        await result.current.fetchToday();
      });

      expect(result.current.completionRate).toBe(50);
    });
  });

  describe('mountedRef 언마운트 보호', () => {
    it('언마운트 후 상태 업데이트를 시도하지 않아야 한다 (에러 없이 처리)', async () => {
      let resolvePromise!: (value: unknown) => void;
      mockGetTodayDailyCapsule.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result, unmount } = renderHook(() => useDailyCapsule());

      act(() => {
        result.current.fetchToday();
      });

      // 응답 전에 언마운트
      unmount();

      // 응답 도착 — 상태 업데이트 시도가 억제되어야 한다
      await act(async () => {
        resolvePromise({ data: mockCapsule, error: null });
      });

      // 테스트 자체가 에러 없이 통과해야 함 (경고/오류 없음)
    });
  });
});

// =============================================================================
// useBeautyProfile
// =============================================================================

describe('useBeautyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // useBeautyProfile은 마운트 시 자동으로 refresh()를 호출한다.
  // waitFor로 비동기 상태 안정화를 기다린다.

  describe('마운트 시 자동 fetch', () => {
    it('마운트 시 자동으로 프로필을 불러와야 한다', async () => {
      mockGetBeautyProfile.mockResolvedValue({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetBeautyProfile).toHaveBeenCalledTimes(1);
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('마운트 시 isLoading이 true로 시작해야 한다', () => {
      // 절대 resolve 되지 않는 Promise로 로딩 상태 유지
      mockGetBeautyProfile.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useBeautyProfile());

      // 동기적으로 isLoading=true 확인 (useBeautyProfile 초기값 true)
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('refresh', () => {
    it('refresh 호출 시 API를 재호출하고 프로필을 갱신해야 한다', async () => {
      // 마운트 자동 호출: 기본 프로필
      mockGetBeautyProfile.mockResolvedValueOnce({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      // 마운트 자동 호출이 완료될 때까지 대기
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedProfile: BeautyProfile = {
        ...mockProfile,
        completedModules: ['skin', 'personal-color', 'workout'],
        personalizationLevel: 3,
      };
      // 수동 refresh: 업데이트된 프로필
      mockGetBeautyProfile.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.profile).toEqual(updatedProfile);
    });

    it('API 에러 시 error 상태를 설정해야 한다', async () => {
      // 마운트 자동 호출: 성공
      mockGetBeautyProfile.mockResolvedValueOnce({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const apiError = { code: 'AUTH_ERROR', message: '인증이 필요합니다.' };
      // 수동 refresh: 에러
      mockGetBeautyProfile.mockResolvedValueOnce({ data: null, error: apiError });

      await act(async () => {
        await result.current.refresh();
      });

      // 에러 시 profile은 이전 값을 유지하고 error만 설정된다
      expect(result.current.error).toEqual(apiError);
    });

    it('네트워크 오류 시 UNKNOWN_ERROR를 설정해야 한다', async () => {
      // 마운트 자동 호출: 성공
      mockGetBeautyProfile.mockResolvedValueOnce({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 수동 refresh: 네트워크 오류 (throw)
      mockGetBeautyProfile.mockRejectedValueOnce(new Error('network error'));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.current.error?.message).toContain('불러올 수 없습니다');
    });
  });

  describe('로딩 상태 관리', () => {
    it('refresh 완료 후 isLoading이 false가 되어야 한다', async () => {
      mockGetBeautyProfile.mockResolvedValue({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      // 마운트 자동 호출 완료 대기
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 수동 refresh 후에도 isLoading=false
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('에러 발생 시에도 isLoading이 false가 되어야 한다', async () => {
      // 마운트 자동 호출: 성공
      mockGetBeautyProfile.mockResolvedValueOnce({ data: mockProfile, error: null });

      const { result } = renderHook(() => useBeautyProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 수동 refresh: 에러
      mockGetBeautyProfile.mockRejectedValueOnce(new Error('error'));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('mountedRef 언마운트 보호', () => {
    it('언마운트 후 상태 업데이트가 억제되어야 한다', async () => {
      let resolvePromise!: (value: unknown) => void;
      mockGetBeautyProfile.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { unmount } = renderHook(() => useBeautyProfile());

      // 응답 전에 언마운트
      unmount();

      // 응답 도착 — 에러 없이 처리되어야 한다
      await act(async () => {
        resolvePromise({ data: mockProfile, error: null });
      });
    });
  });
});
