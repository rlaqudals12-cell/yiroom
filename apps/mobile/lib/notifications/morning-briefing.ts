/**
 * 아침 브리핑 로컬 알림 (ADR-114/118 모바일)
 *
 * 서버 인프라 없이 expo-notifications 로컬 스케줄로 매일 아침 "브리핑 도착" 알림을 보낸다.
 * 탭 시 [오늘] 탭(/(tabs))으로 딥링크된다(useNotificationResponse가 data.route를 push).
 *
 * 프라이버시: 알림 본문에 개인 데이터를 넣지 않는다 — 제목·일반 안내만(잠금화면 노출 대비).
 * 실제 브리핑 내용은 앱을 열어야 확인된다.
 *
 * 훅 의존성 없이 순수 함수로 두어 테스트 가능하게 한다(React 상태는 useMorningBriefing에서).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { pushLogger } from '../utils/logger';

// Expo Go에서는 로컬 알림 스케줄 미지원 (SDK 53+) — useNotifications와 동일 가드
const IS_EXPO_GO = Constants.appOwnership === 'expo';

/** 스케줄된 아침 브리핑 알림 ID (재스케줄 시 이전 알림을 취소해 중복 방지) */
const BRIEFING_ID_KEY = 'yiroom_morning_briefing_id';
/** 아침 브리핑 설정(켜짐/시각) 저장 키 */
const BRIEFING_SETTINGS_KEY = 'yiroom_morning_briefing_settings';
/** 인라인 1회 제안 노출 여부(수락/거부 무관하게 1회만) 저장 키 */
export const BRIEFING_PROPOSAL_SEEN_KEY = 'yiroom_morning_briefing_proposal_seen';

/** 탭 시 이동할 라우트 = [오늘] 탭 */
export const MORNING_BRIEFING_ROUTE = '/(tabs)';
/** 알림 제목 — 제목만으로 무엇인지 알 수 있게(개인 데이터 없음) */
export const MORNING_BRIEFING_TITLE = '오늘의 브리핑이 도착했어요 ☀️';
/** 알림 본문 — 개인 데이터 없음(제목만 노출, 실제 내용은 열어서 확인) */
export const MORNING_BRIEFING_BODY = '전속 뷰티팀이 오늘의 조언을 준비했어요. 탭해서 확인해요.';

export interface MorningBriefingSettings {
  enabled: boolean;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

/** 기본값: 꺼짐(강제 아님), 오전 7:30 */
export const DEFAULT_MORNING_BRIEFING_SETTINGS: MorningBriefingSettings = {
  enabled: false,
  hour: 7,
  minute: 30,
};

/** HH:MM 표기 (설정 UI·라벨용) */
export function formatBriefingTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** 설정 로드 (AsyncStorage, 없으면 기본값) */
export async function loadMorningBriefingSettings(): Promise<MorningBriefingSettings> {
  try {
    const raw = await AsyncStorage.getItem(BRIEFING_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_MORNING_BRIEFING_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<MorningBriefingSettings>;
    // 이전 버전 호환: 누락 필드는 기본값 병합
    return { ...DEFAULT_MORNING_BRIEFING_SETTINGS, ...parsed };
  } catch (error) {
    pushLogger.error('loadMorningBriefingSettings error:', error);
    return { ...DEFAULT_MORNING_BRIEFING_SETTINGS };
  }
}

/** 설정 저장 */
export async function saveMorningBriefingSettings(
  settings: MorningBriefingSettings
): Promise<void> {
  try {
    await AsyncStorage.setItem(BRIEFING_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    pushLogger.error('saveMorningBriefingSettings error:', error);
  }
}

/** 기존 아침 브리핑 스케줄 취소 (저장된 ID 기준) */
export async function cancelMorningBriefing(): Promise<void> {
  if (IS_EXPO_GO) return;
  try {
    const id = await AsyncStorage.getItem(BRIEFING_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(BRIEFING_ID_KEY);
    }
  } catch (error) {
    pushLogger.error('cancelMorningBriefing error:', error);
  }
}

/**
 * 매일 아침 브리핑 알림 스케줄 (기존 것 취소 후 재스케줄 — 중복 방지).
 *
 * @returns 스케줄된 알림 ID. Expo Go이거나 실패 시 null.
 */
export async function scheduleMorningBriefing(
  hour: number,
  minute: number
): Promise<string | null> {
  if (IS_EXPO_GO) return null;

  // 이전 스케줄 취소 후 새로 등록(하루 1건 유지)
  await cancelMorningBriefing();

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: MORNING_BRIEFING_TITLE,
        body: MORNING_BRIEFING_BODY,
        // route는 탭 시 useNotificationResponse가 읽어 [오늘] 탭으로 딥링크
        data: { type: 'morning_briefing', route: MORNING_BRIEFING_ROUTE },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    await AsyncStorage.setItem(BRIEFING_ID_KEY, id);
    return id;
  } catch (error) {
    pushLogger.error('scheduleMorningBriefing error:', error);
    return null;
  }
}

/** 인라인 1회 제안을 이미 노출했는지 */
export async function hasSeenBriefingProposal(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BRIEFING_PROPOSAL_SEEN_KEY)) === 'true';
  } catch (error) {
    pushLogger.error('hasSeenBriefingProposal error:', error);
    // 오류 시 재노출하지 않음(과다 노출 방지)
    return true;
  }
}

/** 인라인 1회 제안을 노출했다고 표시 (수락/거부 공통) */
export async function markBriefingProposalSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(BRIEFING_PROPOSAL_SEEN_KEY, 'true');
  } catch (error) {
    pushLogger.error('markBriefingProposalSeen error:', error);
  }
}
