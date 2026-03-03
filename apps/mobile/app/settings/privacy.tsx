/**
 * 개인정보 설정 화면
 * 데이터 수집, 프로필 공개, 데이터 관리 설정
 */

import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  Platform,
} from 'react-native';

import { useTheme, typography, radii, spacing } from '@/lib/theme';
import { ScreenContainer } from '../../components/ui';

interface PrivacySettings {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  profilePublic: boolean;
  shareResults: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  analyticsConsent: true,
  marketingConsent: false,
  profilePublic: false,
  shareResults: false,
};

export default function PrivacySettingsScreen(): React.JSX.Element {
  const { colors, brand, status, typography, spacing, radii } = useTheme();

  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);

  const handleToggle = (key: keyof PrivacySettings, value: boolean): void => {
    Haptics.selectionAsync();
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownloadData = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '데이터 다운로드',
      '내 데이터를 다운로드할 준비가 되면 이메일로 알려드릴게요. 최대 24시간이 소요될 수 있어요.',
      [{ text: '확인' }]
    );
  };

  const handleDeleteAccount = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '계정 삭제',
      '정말 계정을 삭제하시겠어요? 모든 데이터가 영구적으로 삭제되며 복구할 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            // 계정 삭제 로직 (추후 구현)
            Alert.alert('안내', '계정 삭제 요청이 접수되었어요.');
          },
        },
      ]
    );
  };

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
      >
        {/* 데이터 수집 */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            데이터 수집
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>📊</Text>
                <View style={styles.settingsTextContent}>
                  <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                    분석 데이터 수집 동의
                  </Text>
                  <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                    서비스 개선을 위한 익명 데이터 수집
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.analyticsConsent}
                onValueChange={(value) => handleToggle('analyticsConsent', value)}
                trackColor={{ false: colors.border, true: brand.primary }}
                thumbColor={Platform.OS === 'android' ? colors.card : undefined}
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
                onValueChange={(value) => handleToggle('marketingConsent', value)}
                trackColor={{ false: colors.border, true: brand.primary }}
                thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                accessibilityLabel="마케팅 정보 수신"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </View>

        {/* 프로필 공개 */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            프로필 공개
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>👤</Text>
                <View style={styles.settingsTextContent}>
                  <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                    프로필 공개
                  </Text>
                  <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                    다른 사용자가 내 프로필을 볼 수 있어요
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.profilePublic}
                onValueChange={(value) => handleToggle('profilePublic', value)}
                trackColor={{ false: colors.border, true: brand.primary }}
                thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                accessibilityLabel="프로필 공개"
                accessibilityRole="switch"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>🔗</Text>
                <View style={styles.settingsTextContent}>
                  <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                    분석 결과 공유 허용
                  </Text>
                  <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                    분석 결과를 친구와 공유할 수 있어요
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.shareResults}
                onValueChange={(value) => handleToggle('shareResults', value)}
                trackColor={{ false: colors.border, true: brand.primary }}
                thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                accessibilityLabel="분석 결과 공유 허용"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </View>

        {/* 데이터 관리 */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            데이터 관리
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <Pressable
              style={styles.actionRow}
              onPress={handleDownloadData}
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
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="계정 삭제"
            >
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>🗑️</Text>
                <View style={styles.settingsTextContent}>
                  <Text style={[styles.settingsLabel, { color: colors.destructive }]}>
                    계정 삭제
                  </Text>
                  <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                    모든 데이터가 영구 삭제돼요
                  </Text>
                </View>
              </View>
              <Text style={[styles.actionArrow, { color: colors.mutedForeground }]}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 안내 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            개인정보는 안전하게 암호화되어 저장됩니다.{'\n'}
            자세한 내용은 개인정보 처리방침을 확인해주세요.
          </Text>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingsRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  settingsTextContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
  },
  settingsDesc: {
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  actionArrow: {
    fontSize: typography.size.xl,
  },
  infoSection: {
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
});
