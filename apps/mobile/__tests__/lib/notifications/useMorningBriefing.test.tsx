/**
 * useMorningBriefing 훅 테스트 (ADR-114/118)
 *
 * enable/disable/setTime 오케스트레이션 + 인라인 1회 제안 상태를 검증.
 * 순수 로직(morning-briefing)과 권한 요청은 mock — 훅의 상태 전이만 본다.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

// 순수 스케줄/설정 함수 mock
const mockLoad = jest.fn();
const mockSave = jest.fn().mockResolvedValue(undefined);
const mockSchedule = jest.fn().mockResolvedValue('sched-id');
const mockCancel = jest.fn().mockResolvedValue(undefined);
const mockHasSeen = jest.fn();
const mockMarkSeen = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/notifications/morning-briefing', () => ({
  DEFAULT_MORNING_BRIEFING_SETTINGS: { enabled: false, hour: 7, minute: 30 },
  loadMorningBriefingSettings: (...a: unknown[]) => mockLoad(...a),
  saveMorningBriefingSettings: (...a: unknown[]) => mockSave(...a),
  scheduleMorningBriefing: (...a: unknown[]) => mockSchedule(...a),
  cancelMorningBriefing: (...a: unknown[]) => mockCancel(...a),
  hasSeenBriefingProposal: (...a: unknown[]) => mockHasSeen(...a),
  markBriefingProposalSeen: (...a: unknown[]) => mockMarkSeen(...a),
}));

// 권한 요청 mock (lib/notifications.ts)
const mockRequestPermission = jest.fn();
jest.mock('../../../lib/notifications', () => ({
  requestNotificationPermission: (...a: unknown[]) => mockRequestPermission(...a),
}));

import { useMorningBriefing } from '../../../lib/notifications/useMorningBriefing';

describe('useMorningBriefing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoad.mockResolvedValue({ enabled: false, hour: 7, minute: 30 });
    mockHasSeen.mockResolvedValue(false);
    mockRequestPermission.mockResolvedValue(true);
  });

  it('로드 후 설정과 제안 노출 여부를 반영해야 한다', async () => {
    const { result } = renderHook(() => useMorningBriefing());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toEqual({ enabled: false, hour: 7, minute: 30 });
    // 미열람 + OFF → 제안 노출
    expect(result.current.shouldShowProposal).toBe(true);
  });

  it('이미 제안을 봤으면 노출하지 않아야 한다', async () => {
    mockHasSeen.mockResolvedValue(true);
    const { result } = renderHook(() => useMorningBriefing());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowProposal).toBe(false);
  });

  it('enable: 권한 허용 시 스케줄 + 저장하고 true 반환', async () => {
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.enable();
    });

    expect(ok).toBe(true);
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith(7, 30);
    expect(mockSave).toHaveBeenCalledWith({ enabled: true, hour: 7, minute: 30 });
    expect(result.current.settings.enabled).toBe(true);
  });

  it('enable: 권한 거부 시 스케줄하지 않고 false 반환', async () => {
    mockRequestPermission.mockResolvedValue(false);
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.enable();
    });

    expect(ok).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(result.current.settings.enabled).toBe(false);
  });

  it('disable: 취소 + 저장', async () => {
    mockLoad.mockResolvedValue({ enabled: true, hour: 7, minute: 30 });
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.disable();
    });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ enabled: false, hour: 7, minute: 30 });
    expect(result.current.settings.enabled).toBe(false);
  });

  it('setTime: 켜져 있으면 새 시각으로 재스케줄', async () => {
    mockLoad.mockResolvedValue({ enabled: true, hour: 7, minute: 30 });
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setTime(8, 0);
    });

    expect(mockSave).toHaveBeenCalledWith({ enabled: true, hour: 8, minute: 0 });
    expect(mockSchedule).toHaveBeenCalledWith(8, 0);
    expect(result.current.settings).toEqual({ enabled: true, hour: 8, minute: 0 });
  });

  it('setTime: 꺼져 있으면 저장만 하고 스케줄하지 않음', async () => {
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setTime(8, 0);
    });

    expect(mockSave).toHaveBeenCalledWith({ enabled: false, hour: 8, minute: 0 });
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('acceptProposal: 열람 표시 + enable, 이후 제안 숨김', async () => {
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shouldShowProposal).toBe(true);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.acceptProposal();
    });

    expect(ok).toBe(true);
    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith(7, 30);
    expect(result.current.shouldShowProposal).toBe(false);
  });

  it('dismissProposal: 열람 표시만 하고 enable 안 함', async () => {
    const { result } = renderHook(() => useMorningBriefing());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.dismissProposal();
    });

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(result.current.shouldShowProposal).toBe(false);
  });
});
