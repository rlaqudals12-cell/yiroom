/**
 * 아침 브리핑 로컬 알림 순수 로직 테스트 (ADR-114/118)
 *
 * 스케줄/취소/설정 저장·로드/딥링크 데이터/1회 제안 상태를 검증.
 * expo-notifications는 로컬 mock으로 SchedulableTriggerInputTypes까지 제공(글로벌 mock 보강).
 */

// 글로벌 mock은 SchedulableTriggerInputTypes를 포함하지 않으므로 이 파일 전용으로 오버라이드
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));

import * as Notifications from 'expo-notifications';

import {
  DEFAULT_MORNING_BRIEFING_SETTINGS,
  MORNING_BRIEFING_BODY,
  MORNING_BRIEFING_ROUTE,
  MORNING_BRIEFING_TITLE,
  cancelMorningBriefing,
  formatBriefingTime,
  hasSeenBriefingProposal,
  loadMorningBriefingSettings,
  markBriefingProposalSeen,
  saveMorningBriefingSettings,
  scheduleMorningBriefing,
} from '../../../lib/notifications/morning-briefing';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

describe('morning-briefing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 스케줄마다 고유 ID 반환 → 재스케줄 시 이전 ID 취소를 검증할 수 있게
    let n = 0;
    mockSchedule.mockImplementation(() => Promise.resolve(`sched-${++n}`));
  });

  describe('기본값/포맷', () => {
    it('기본 설정은 꺼짐 + 오전 7:30이어야 한다', () => {
      expect(DEFAULT_MORNING_BRIEFING_SETTINGS.enabled).toBe(false);
      expect(DEFAULT_MORNING_BRIEFING_SETTINGS.hour).toBe(7);
      expect(DEFAULT_MORNING_BRIEFING_SETTINGS.minute).toBe(30);
    });

    it('formatBriefingTime은 HH:MM으로 0 패딩해야 한다', () => {
      expect(formatBriefingTime(7, 30)).toBe('07:30');
      expect(formatBriefingTime(8, 0)).toBe('08:00');
      expect(formatBriefingTime(6, 5)).toBe('06:05');
    });
  });

  describe('설정 저장/로드', () => {
    it('저장한 설정을 그대로 로드해야 한다', async () => {
      await saveMorningBriefingSettings({ enabled: true, hour: 8, minute: 0 });
      const loaded = await loadMorningBriefingSettings();
      expect(loaded).toEqual({ enabled: true, hour: 8, minute: 0 });
    });

    it('저장된 값이 없으면 기본값을 반환해야 한다', async () => {
      const loaded = await loadMorningBriefingSettings();
      expect(loaded).toEqual(DEFAULT_MORNING_BRIEFING_SETTINGS);
    });
  });

  describe('scheduleMorningBriefing', () => {
    it('DAILY 트리거로 스케줄하고 ID를 반환해야 한다', async () => {
      const id = await scheduleMorningBriefing(7, 30);
      expect(id).toBe('sched-1');
      expect(mockSchedule).toHaveBeenCalledTimes(1);

      const arg = mockSchedule.mock.calls[0][0];
      expect(arg.trigger).toEqual({
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 30,
      });
    });

    it('탭 시 [오늘] 탭으로 딥링크되는 route 데이터를 실어야 한다', async () => {
      await scheduleMorningBriefing(7, 30);
      const arg = mockSchedule.mock.calls[0][0];
      expect(arg.content.data).toEqual({
        type: 'morning_briefing',
        route: MORNING_BRIEFING_ROUTE,
      });
      expect(MORNING_BRIEFING_ROUTE).toBe('/(tabs)');
    });

    it('본문에 개인 데이터를 넣지 않아야 한다(제목·일반 안내만)', async () => {
      await scheduleMorningBriefing(7, 30);
      const arg = mockSchedule.mock.calls[0][0];
      expect(arg.content.title).toBe(MORNING_BRIEFING_TITLE);
      expect(arg.content.body).toBe(MORNING_BRIEFING_BODY);
      // 변수 치환 흔적(개인화 플레이스홀더)이 없어야 함
      expect(arg.content.body).not.toContain('{{');
    });

    it('재스케줄 시 이전 알림을 먼저 취소해야 한다(중복 방지)', async () => {
      await scheduleMorningBriefing(7, 30); // sched-1 저장
      await scheduleMorningBriefing(8, 0); // 이전(sched-1) 취소 후 sched-2
      expect(mockCancel).toHaveBeenCalledWith('sched-1');
      expect(mockSchedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelMorningBriefing', () => {
    it('저장된 ID로 예약 알림을 취소해야 한다', async () => {
      await scheduleMorningBriefing(7, 30); // sched-1 저장
      await cancelMorningBriefing();
      expect(mockCancel).toHaveBeenCalledWith('sched-1');
    });

    it('저장된 ID가 없으면 아무것도 취소하지 않아야 한다', async () => {
      await cancelMorningBriefing();
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });

  describe('1회 제안 상태', () => {
    it('처음에는 미열람이어야 한다', async () => {
      expect(await hasSeenBriefingProposal()).toBe(false);
    });

    it('표시 후에는 열람으로 기록되어야 한다', async () => {
      await markBriefingProposalSeen();
      expect(await hasSeenBriefingProposal()).toBe(true);
    });
  });
});
