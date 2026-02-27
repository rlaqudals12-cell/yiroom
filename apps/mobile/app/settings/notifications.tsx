/**
 * 알림 설정 화면
 * 물, 운동, 식사, 스트릭, 성취 알림 설정
 */

import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useTheme, typography, radii , spacing } from '@/lib/theme';
import { ScreenContainer } from '../../components/ui';

import {
  useNotificationPermission,
  useNotificationSettings,
  useNotificationScheduler,
} from '../../lib/notifications/useNotifications';

export default function NotificationsSettingsScreen() {
  const { colors, status, module: mod, typography } = useTheme();

  const {
    hasPermission,
    isLoading: permissionLoading,
    requestPermission,
  } = useNotificationPermission();
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    applySettings,
  } = useNotificationSettings();
  const { sendNow } = useNotificationScheduler();

  const [testSent, setTestSent] = useState(false);

  // 설정 변경 시 알림 스케줄 업데이트
  useEffect(() => {
    if (!settingsLoading && hasPermission) {
      applySettings();
    }
  }, [settings, hasPermission, settingsLoading, applySettings]);

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.', [{ text: '확인' }]);
    } else {
      await updateSettings({ enabled: true });
    }
  };

  const handleMasterToggle = async (value: boolean) => {
    Haptics.selectionAsync();
    if (value && !hasPermission) {
      await handleRequestPermission();
    } else {
      await updateSettings({ enabled: value });
    }
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    Haptics.selectionAsync();
    await updateSettings({ [key]: value });
  };

  const handleIntervalChange = async (interval: number) => {
    Haptics.selectionAsync();
    await updateSettings({ waterReminderInterval: interval });
  };

  const handleTestNotification = async () => {
    if (testSent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendNow('test');
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  if (permissionLoading || settingsLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mod.body.dark} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="settings-notifications-screen"
      edges={['bottom']}
    >
        {/* 권한 안내 */}
        {hasPermission === false && (
          <Pressable
            style={[styles.permissionBanner, { backgroundColor: status.warning + '20' }]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.bannerIcon}>🔔</Text>
            <View style={styles.bannerContent}>
              <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                알림 권한이 필요합니다
              </Text>
              <Text style={[styles.bannerSubtitle, { color: colors.mutedForeground }]}>
                탭하여 권한을 허용해주세요
              </Text>
            </View>
          </Pressable>
        )}

        {/* 마스터 토글 */}
        <View style={styles.section}>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>🔔</Text>
                <View style={styles.settingsTextContent}>
                  <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                    알림 사용
                  </Text>
                  <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                    모든 알림 켜기/끄기
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleMasterToggle}
                trackColor={{ false: colors.border, true: mod.body.dark }}
                thumbColor={Platform.OS === 'android' ? colors.card : undefined}
              />
            </View>
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* 물 알림 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>영양</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>💧</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        수분 섭취 알림
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        정해진 간격으로 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.waterReminder}
                    onValueChange={(value) => handleToggle('waterReminder', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>

                {settings.waterReminder && (
                  <View style={[styles.intervalSelector, { borderTopColor: colors.border }]}>
                    <Text style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
                      알림 간격
                    </Text>
                    <View style={styles.intervalOptions}>
                      {[1, 2, 3, 4].map((hours) => (
                        <Pressable
                          key={hours}
                          style={[
                            styles.intervalOption,
                            { backgroundColor: colors.muted },
                            settings.waterReminderInterval === hours && {
                              backgroundColor: mod.body.dark,
                            },
                          ]}
                          onPress={() => handleIntervalChange(hours)}
                        >
                          <Text
                            style={[
                              styles.intervalOptionText,
                              { color: colors.mutedForeground },
                              settings.waterReminderInterval === hours && {
                                color: colors.card,
                              },
                            ]}
                          >
                            {hours}시간
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🍽️</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        식사 기록 알림
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        아침/점심/저녁 기록 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.nutritionReminder}
                    onValueChange={(value) => handleToggle('nutritionReminder', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 운동 알림 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>운동</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🏃</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        운동 리마인더
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        매일 아침 운동 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.workoutReminder}
                    onValueChange={(value) => handleToggle('workoutReminder', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🔥</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        스트릭 경고
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        연속 기록이 끊기기 전 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.streakWarning}
                    onValueChange={(value) => handleToggle('streakWarning', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 소셜 & 성취 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                소셜 & 성취
              </Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>👥</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        소셜 알림
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        친구 요청, 챌린지 초대
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.socialNotifications}
                    onValueChange={(value) => handleToggle('socialNotifications', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🏆</Text>
                    <View style={styles.settingsTextContent}>
                      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                        성취 알림
                      </Text>
                      <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                        레벨업, 뱃지 획득
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.achievementNotifications}
                    onValueChange={(value) => handleToggle('achievementNotifications', value)}
                    trackColor={{ false: colors.border, true: mod.body.dark }}
                    thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 테스트 알림 */}
            <View style={styles.section}>
              <Pressable
                style={[
                  styles.testButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: mod.body.dark,
                  },
                  testSent && {
                    backgroundColor: mod.body.dark + '20',
                    borderColor: status.success,
                  },
                ]}
                onPress={handleTestNotification}
                disabled={testSent}
              >
                <Text style={[styles.testButtonText, { color: mod.body.dark }]}>
                  {testSent ? '✓ 테스트 알림 전송됨' : '테스트 알림 보내기'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* 안내 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            알림은 앱이 백그라운드에 있을 때도 동작합니다.{'\n'}
            방해 금지 모드에서는 알림이 표시되지 않을 수 있습니다.
          </Text>
        </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    fontSize: typography.size['2xl'],
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
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
    borderRadius: 12,
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
    marginRight: 12,
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
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  intervalSelector: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
  intervalLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  intervalOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  intervalOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  testButton: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
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
