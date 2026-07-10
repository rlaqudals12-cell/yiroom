/**
 * 아침 브리핑 로컬 알림 훅 (ADR-114/118 모바일)
 *
 * morning-briefing.ts의 순수 스케줄/설정 함수를 React 상태로 감싼다.
 * - enable(): 최초 ON 시도 시에만 권한 요청 → 스케줄. 권한 거부 시 false 반환(UI가 안내).
 * - disable(): 스케줄 취소.
 * - setTime(): 시각 변경, 켜져 있으면 새 시각으로 재스케줄.
 * - 인라인 1회 제안(shouldShowProposal): 아직 안 보여줬고 + 아직 OFF일 때만 노출.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { requestNotificationPermission } from '../notifications';
import {
  type MorningBriefingSettings,
  DEFAULT_MORNING_BRIEFING_SETTINGS,
  cancelMorningBriefing,
  hasSeenBriefingProposal,
  loadMorningBriefingSettings,
  markBriefingProposalSeen,
  saveMorningBriefingSettings,
  scheduleMorningBriefing,
} from './morning-briefing';

export interface UseMorningBriefingResult {
  settings: MorningBriefingSettings;
  isLoading: boolean;
  /** ON 시도 — 권한 요청(최초만) → 스케줄. 권한 거부 시 false */
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  setTime: (hour: number, minute: number) => Promise<void>;
  /** 인라인 1회 제안 노출 여부 (미열람 + 아직 OFF일 때만 true) */
  shouldShowProposal: boolean;
  /** 제안 수락 → enable, 결과 반환(권한 거부 시 false) */
  acceptProposal: () => Promise<boolean>;
  /** 제안 닫기 (다시 안 보임) */
  dismissProposal: () => Promise<void>;
}

export function useMorningBriefing(): UseMorningBriefingResult {
  const [settings, setSettings] = useState<MorningBriefingSettings>(
    DEFAULT_MORNING_BRIEFING_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);
  // 로드 전에는 제안을 숨겨 깜빡임(flash)을 막는다
  const [proposalSeen, setProposalSeen] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;
    (async () => {
      const [loaded, seen] = await Promise.all([
        loadMorningBriefingSettings(),
        hasSeenBriefingProposal(),
      ]);
      if (cancelled) return;
      setSettings(loaded);
      setProposalSeen(seen);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    // 최초 ON 시도 시에만 권한 요청(가입 직후 강제 요청 아님)
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleMorningBriefing(settings.hour, settings.minute);
    const next = { ...settings, enabled: true };
    setSettings(next);
    await saveMorningBriefingSettings(next);
    return true;
  }, [settings]);

  const disable = useCallback(async (): Promise<void> => {
    await cancelMorningBriefing();
    const next = { ...settings, enabled: false };
    setSettings(next);
    await saveMorningBriefingSettings(next);
  }, [settings]);

  const setTime = useCallback(
    async (hour: number, minute: number): Promise<void> => {
      const next = { ...settings, hour, minute };
      setSettings(next);
      await saveMorningBriefingSettings(next);
      // 켜져 있으면 새 시각으로 재스케줄
      if (next.enabled) await scheduleMorningBriefing(hour, minute);
    },
    [settings]
  );

  const dismissProposal = useCallback(async (): Promise<void> => {
    setProposalSeen(true);
    await markBriefingProposalSeen();
  }, []);

  const acceptProposal = useCallback(async (): Promise<boolean> => {
    setProposalSeen(true);
    await markBriefingProposalSeen();
    return enable();
  }, [enable]);

  const shouldShowProposal = !isLoading && !proposalSeen && !settings.enabled;

  return {
    settings,
    isLoading,
    enable,
    disable,
    setTime,
    shouldShowProposal,
    acceptProposal,
    dismissProposal,
  };
}
