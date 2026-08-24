/**
 * 개인정보 설정 화면
 * 데이터 수집, 프로필 공개, 데이터 관리 설정
 */

import { Stack } from 'expo-router';

import { PrivacySettingsSections } from '@/components/settings/PrivacySettingsSections';
import { ScreenContainer } from '@/components/ui';
import { usePrivacyDataActions } from '@/lib/privacy/usePrivacyDataActions';
import { usePrivacySettings } from '@/lib/privacy/usePrivacySettings';

export default function PrivacySettingsScreen(): React.JSX.Element {
  const { settings, isConsentLoading, isConsentSaving, handleConsentToggle } = usePrivacySettings();
  const {
    isRevokingBiometric,
    isDeleting,
    handleDownloadData,
    handleRevokeBiometricConsent,
    handleDeleteAccount,
  } = usePrivacyDataActions();

  return (
    <>
      <Stack.Screen
        options={{
          title: '개인정보 설정',
          headerBackTitle: '설정',
        }}
      />
      <ScreenContainer
        testID="settings-privacy-screen"
        edges={['bottom']}
        backgroundGradient="profile"
      >
        <PrivacySettingsSections
          settings={settings}
          isConsentLoading={isConsentLoading}
          isConsentSaving={isConsentSaving}
          isRevokingBiometric={isRevokingBiometric}
          isDeleting={isDeleting}
          onConsentToggle={handleConsentToggle}
          onDownloadData={handleDownloadData}
          onRevokeBiometricConsent={handleRevokeBiometricConsent}
          onDeleteAccount={handleDeleteAccount}
        />
      </ScreenContainer>
    </>
  );
}
