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
  ScrollView,
  useColorScheme,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useNotificationPermission,
  useNotificationSettings,
  useNotificationScheduler,
} from '../../lib/notifications/useNotifications';

export default function NotificationsSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { hasPermission, isLoading: permissionLoading, requestPermission } =
    useNotificationPermission();
  const { settings, isLoading: settingsLoading, updateSettings, applySettings } =
    useNotificationSettings();
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
      Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.', [
        { text: '확인' },
      ]);
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

  const handleToggle = async (
    key: keyof typeof settings,
    value: boolean
  ) => {
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
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 권한 안내 */}
        {hasPermission === false && (
          <TouchableOpacity
            style={[styles.permissionBanner, isDark && styles.bannerDark]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.bannerIcon}>🔔</Text>
            <View style={styles.bannerContent}>
              <Text style={[styles.bannerTitle, isDark && styles.textLight]}>
                알림 권한이 필요합니다
              </Text>
              <Text style={[styles.bannerSubtitle, isDark && styles.textMuted]}>
                탭하여 권한을 허용해주세요
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 마스터 토글 */}
        <View style={styles.section}>
          <View style={[styles.settingsCard, isDark && styles.cardDark]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>🔔</Text>
                <View style={styles.settingsTextContent}>
                  <Text
                    style={[styles.settingsLabel, isDark && styles.textLight]}
                  >
                    알림 사용
                  </Text>
                  <Text
                    style={[styles.settingsDesc, isDark && styles.textMuted]}
                  >
                    모든 알림 켜기/끄기
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleMasterToggle}
                trackColor={{ false: '#767577', true: '#8b5cf6' }}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              />
            </View>
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* 물 알림 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
                영양
              </Text>
              <View style={[styles.settingsCard, isDark && styles.cardDark]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>💧</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        수분 섭취 알림
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        정해진 간격으로 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.waterReminder}
                    onValueChange={(value) => handleToggle('waterReminder', value)}
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                {settings.waterReminder && (
                  <View style={[styles.intervalSelector, isDark && styles.intervalSelectorDark]}>
                    <Text
                      style={[styles.intervalLabel, isDark && styles.textMuted]}
                    >
                      알림 간격
                    </Text>
                    <View style={styles.intervalOptions}>
                      {[1, 2, 3, 4].map((hours) => (
                        <TouchableOpacity
                          key={hours}
                          style={[
                            styles.intervalOption,
                            isDark && styles.intervalOptionDark,
                            settings.waterReminderInterval === hours &&
                              styles.intervalOptionSelected,
                          ]}
                          onPress={() => handleIntervalChange(hours)}
                        >
                          <Text
                            style={[
                              styles.intervalOptionText,
                              isDark && styles.textMuted,
                              settings.waterReminderInterval === hours &&
                                styles.intervalOptionTextSelected,
                            ]}
                          >
                            {hours}시간
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.divider, isDark && styles.dividerDark]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🍽️</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        식사 기록 알림
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        아침/점심/저녁 기록 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.nutritionReminder}
                    onValueChange={(value) =>
                      handleToggle('nutritionReminder', value)
                    }
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 운동 알림 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
                운동
              </Text>
              <View style={[styles.settingsCard, isDark && styles.cardDark]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🏃</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        운동 리마인더
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        매일 아침 운동 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.workoutReminder}
                    onValueChange={(value) =>
                      handleToggle('workoutReminder', value)
                    }
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                <View style={[styles.divider, isDark && styles.dividerDark]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🔥</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        스트릭 경고
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        연속 기록이 끊기기 전 알림
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.streakWarning}
                    onValueChange={(value) => handleToggle('streakWarning', value)}
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 소셜 & 성취 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
                소셜 & 성취
              </Text>
              <View style={[styles.settingsCard, isDark && styles.cardDark]}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>👥</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        소셜 알림
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        친구 요청, 챌린지 초대
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.socialNotifications}
                    onValueChange={(value) =>
                      handleToggle('socialNotifications', value)
                    }
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                <View style={[styles.divider, isDark && styles.dividerDark]} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsIcon}>🏆</Text>
                    <View style={styles.settingsTextContent}>
                      <Text
                        style={[styles.settingsLabel, isDark && styles.textLight]}
                      >
                        성취 알림
                      </Text>
                      <Text
                        style={[styles.settingsDesc, isDark && styles.textMuted]}
                      >
                        레벨업, 뱃지 획득
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.achievementNotifications}
                    onValueChange={(value) =>
                      handleToggle('achievementNotifications', value)
                    }
                    trackColor={{ false: '#767577', true: '#8b5cf6' }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>
              </View>
            </View>

            {/* 테스트 알림 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.testButton,
                  isDark && styles.testButtonDark,
                  testSent && styles.testButtonSent,
                ]}
                onPress={handleTestNotification}
                disabled={testSent}
              >
                <Text style={styles.testButtonText}>
                  {testSent ? '✓ 테스트 알림 전송됨' : '테스트 알림 보내기'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 안내 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, isDark && styles.textMuted]}>
            알림은 앱이 백그라운드에 있을 때도 동작합니다.{'\n'}
            방해 금지 모드에서는 알림이 표시되지 않을 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bannerDark: {
    backgroundColor: '#3a3a1a',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingsTextContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  settingsDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  dividerDark: {
    backgroundColor: '#2a2a2a',
  },
  intervalSelector: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  intervalSelectorDark: {
    borderTopColor: '#2a2a2a',
  },
  intervalLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  intervalOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  intervalOptionDark: {
    backgroundColor: '#2a2a2a',
  },
  intervalOptionSelected: {
    backgroundColor: '#8b5cf6',
  },
  intervalOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  intervalOptionTextSelected: {
    color: '#fff',
  },
  testButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  testButtonDark: {
    backgroundColor: '#1a1a1a',
  },
  testButtonSent: {
    backgroundColor: '#8b5cf620',
    borderColor: '#22c55e',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
