import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui';
import type { PrivacySettings } from '@/lib/privacy/usePrivacySettings';
import { radii, spacing, typography, useTheme } from '@/lib/theme';

interface PrivacySettingsSectionsProps {
  settings: PrivacySettings;
  isConsentLoading: boolean;
  isConsentSaving: boolean;
  isRevokingBiometric: boolean;
  isDeleting: boolean;
  onConsentToggle: (key: 'analyticsConsent' | 'marketingConsent', value: boolean) => Promise<void>;
  onDownloadData: () => Promise<void>;
  onRevokeBiometricConsent: () => void;
  onDeleteAccount: () => void;
}

export function PrivacySettingsSections({
  settings,
  isConsentLoading,
  isConsentSaving,
  isRevokingBiometric,
  isDeleting,
  onConsentToggle,
  onDownloadData,
  onRevokeBiometricConsent,
  onDeleteAccount,
}: PrivacySettingsSectionsProps): React.JSX.Element {
  const { colors, brand } = useTheme();
  const switchColors = {
    trackColor: { false: colors.border, true: brand.primary },
    thumbColor: Platform.OS === 'android' ? colors.card : undefined,
  };

  return (
    <View testID="privacy-settings-sections">
      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.mutedForeground }]}
        >
          데이터 수집
        </Text>
        <GlassCard shadowSize="md">
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>📊</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  분석 데이터 수집 동의
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  서비스 개선을 위한 이용 기록 수집
                </Text>
              </View>
            </View>
            <Switch
              value={settings.analyticsConsent}
              onValueChange={(value) => void onConsentToggle('analyticsConsent', value)}
              disabled={isConsentLoading || isConsentSaving}
              {...switchColors}
              accessibilityLabel="분석 데이터 수집 동의"
              accessibilityRole="switch"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>📮</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  마케팅 정보 수신
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  이벤트, 할인, 새 기능 소식 알림
                </Text>
              </View>
            </View>
            <Switch
              value={settings.marketingConsent}
              onValueChange={(value) => void onConsentToggle('marketingConsent', value)}
              disabled={isConsentLoading || isConsentSaving}
              {...switchColors}
              accessibilityLabel="마케팅 정보 수신"
              accessibilityRole="switch"
            />
          </View>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.mutedForeground }]}
        >
          공개 및 공유
        </Text>
        <GlassCard shadowSize="md">
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>👤</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  프로필 공개 설정
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  모바일 공개 프로필은 아직 제공하지 않아요
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>🔗</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  분석 결과 공유
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  결과 화면의 공유 버튼을 누른 경우에만 공유돼요
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.mutedForeground }]}
        >
          데이터 관리
        </Text>
        <GlassCard shadowSize="md">
          <Pressable
            style={styles.actionRow}
            onPress={() => void onDownloadData()}
            accessibilityRole="button"
            accessibilityLabel="내 데이터 다운로드"
          >
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>📥</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  내 데이터 다운로드
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  저장된 모든 데이터를 파일로 받아보세요
                </Text>
              </View>
            </View>
            <Text style={[styles.actionArrow, { color: colors.mutedForeground }]}>›</Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.actionRow}
            onPress={onRevokeBiometricConsent}
            disabled={isRevokingBiometric}
            accessibilityRole="button"
            accessibilityLabel="생체정보 동의 철회"
            accessibilityState={{
              disabled: isRevokingBiometric,
              busy: isRevokingBiometric,
            }}
          >
            <View style={styles.settingsRowContent}>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.destructive }]}>
                  생체정보 동의 철회
                </Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  저장된 분석 이미지를 삭제하고 이후 분석 처리를 중단해요
                </Text>
              </View>
            </View>
            <Text style={[styles.actionArrow, { color: colors.mutedForeground }]}>›</Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.actionRow}
            onPress={onDeleteAccount}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="계정 삭제"
            accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
          >
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsIcon}>🗑️</Text>
              <View style={styles.settingsTextContent}>
                <Text style={[styles.settingsLabel, { color: colors.destructive }]}>계정 삭제</Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  모든 데이터가 영구 삭제돼요
                </Text>
              </View>
            </View>
            <Text style={[styles.actionArrow, { color: colors.mutedForeground }]}>›</Text>
          </Pressable>
        </GlassCard>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          개인정보는 안전하게 암호화되어 저장돼요.{'\n'}
          자세한 내용은 개인정보 처리방침을 확인해주세요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: { borderRadius: radii.xl, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingsRowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingsIcon: { fontSize: typography.size['2xl'], marginRight: spacing.smx },
  settingsTextContent: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: typography.weight.medium },
  settingsDesc: { fontSize: typography.size.xs, marginTop: spacing.xxs },
  divider: { height: 1, marginHorizontal: spacing.md },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  actionArrow: { fontSize: typography.size.xl },
  infoSection: { paddingHorizontal: spacing.sm },
  infoText: { fontSize: typography.size.xs, lineHeight: 18, textAlign: 'center' },
});
