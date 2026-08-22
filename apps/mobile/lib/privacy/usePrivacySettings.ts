import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { setAnalyticsConsent } from '@/lib/analytics';
import {
  ConsentPreferencesApiError,
  fetchConsentPreferences,
  updateConsentPreferences,
} from '@/lib/api/consent-preferences';

export interface PrivacySettings {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  profilePublic: boolean;
  shareResults: boolean;
}

type ConsentSettingKey = 'analyticsConsent' | 'marketingConsent';
type LocalSettingKey = 'profilePublic' | 'shareResults';

interface UsePrivacySettingsResult {
  settings: PrivacySettings;
  isConsentLoading: boolean;
  isConsentSaving: boolean;
  handleConsentToggle: (key: ConsentSettingKey, value: boolean) => Promise<void>;
  handleLocalToggle: (key: LocalSettingKey, value: boolean) => void;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  // 서버 동의 조회 전에는 이용기록을 수집하지 않는 fail-closed 기본값이다.
  analyticsConsent: false,
  marketingConsent: false,
  profilePublic: false,
  shareResults: false,
};

export function usePrivacySettings(): UsePrivacySettingsResult {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isConsentLoading, setIsConsentLoading] = useState(true);
  const [isConsentSaving, setIsConsentSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setAnalyticsConsent(null);

    void (async (): Promise<void> => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) return;

        const preferences = await fetchConsentPreferences(clerkToken);
        if (!mounted) return;
        setSettings((current) => ({
          ...current,
          analyticsConsent: preferences.analyticsConsent,
          marketingConsent: preferences.marketingConsent,
        }));
        setAnalyticsConsent(preferences.analyticsConsent);
      } finally {
        if (mounted) setIsConsentLoading(false);
      }
    })().catch(() => {
      // 조회 실패를 동의로 추정하지 않는다. 스위치는 false로 유지하고 사용자가 다시 저장할 수 있다.
      if (mounted) setAnalyticsConsent(null);
    });

    return () => {
      mounted = false;
    };
  }, [getToken]);

  const handleConsentToggle = useCallback(
    async (key: ConsentSettingKey, value: boolean): Promise<void> => {
      Haptics.selectionAsync();
      const isAnalyticsOptOut = key === 'analyticsConsent' && value === false;
      // 철회 의사는 서버 왕복보다 우선한다. 큐·재시도까지 즉시 폐기하고 실패해도 재개하지 않는다.
      if (isAnalyticsOptOut) setAnalyticsConsent(false);
      setIsConsentSaving(true);
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          throw new ConsentPreferencesApiError(
            '로그인 정보가 만료되었어요. 다시 로그인해주세요.',
            401,
            'AUTH_ERROR'
          );
        }

        const preferences = await updateConsentPreferences({ [key]: value }, clerkToken);
        setSettings((current) => ({
          ...current,
          analyticsConsent: preferences.analyticsConsent,
          marketingConsent: preferences.marketingConsent,
        }));
        setAnalyticsConsent(preferences.analyticsConsent);
      } catch (error) {
        Alert.alert(
          '동의 설정을 저장하지 못했어요',
          isAnalyticsOptOut
            ? '이 기기의 이용기록 전송은 중단했지만 서버 설정을 저장하지 못했어요. 네트워크 연결 후 다시 시도해주세요.'
            : error instanceof ConsentPreferencesApiError
              ? error.message
              : '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
        );
      } finally {
        setIsConsentSaving(false);
      }
    },
    [getToken]
  );

  const handleLocalToggle = useCallback((key: LocalSettingKey, value: boolean): void => {
    Haptics.selectionAsync();
    setSettings((previous) => ({ ...previous, [key]: value }));
  }, []);

  return {
    settings,
    isConsentLoading,
    isConsentSaving,
    handleConsentToggle,
    handleLocalToggle,
  };
}
