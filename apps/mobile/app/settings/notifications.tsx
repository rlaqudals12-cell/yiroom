/**
 * 알림 설정 화면
 * 물, 운동, 식사 알림 설정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 알림 설정 타입
interface NotificationSettings {
  waterReminder: boolean;
  waterInterval: number; // 시간 단위
  workoutReminder: boolean;
  workoutTime: string; // HH:MM
  mealReminder: boolean;
  mealTimes: string[]; // HH:MM[]
}

const DEFAULT_SETTINGS: NotificationSettings = {
  waterReminder: true,
  waterInterval: 2,
  workoutReminder: true,
  workoutTime: '09:00',
  mealReminder: true,
  mealTimes: ['08:00', '12:00', '18:00'],
};

const STORAGE_KEY = '@yiroom_notification_settings';

export default function NotificationsSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 권한 확인
  useEffect(() => {
    checkPermission();
    loadSettings();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.', [
        { text: '확인' },
      ]);
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[Settings] Failed to load notification settings:', error);
    }
  };

  const saveSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        Haptics.selectionAsync();

        // 알림 스케줄 업데이트
        await scheduleNotifications(newSettings);
      } catch (error) {
        console.error(
          '[Settings] Failed to save notification settings:',
          error
        );
      }
    },
    []
  );

  const scheduleNotifications = async (newSettings: NotificationSettings) => {
    // 기존 알림 취소
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!hasPermission) return;

    // 물 알림 스케줄
    if (newSettings.waterReminder) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 물 마실 시간!',
          body: '건강을 위해 물 한 잔 어떠세요?',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: newSettings.waterInterval * 60 * 60,
          repeats: true,
        },
      });
    }

    console.log('[Notifications] Scheduled notifications:', newSettings);
  };

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    saveSettings({ ...settings, [key]: value });
  };

  const handleIntervalChange = (interval: number) => {
    saveSettings({ ...settings, waterInterval: interval });
  };

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
            onPress={requestPermission}
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

        {/* 물 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            물 알림
          </Text>
          <View style={[styles.settingsCard, isDark && styles.cardDark]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsIcon}>💧</Text>
                <View style={styles.settingsTextContent}>
                  <Text
                    style={[styles.settingsLabel, isDark && styles.textLight]}
                  >
                    물 알림
                  </Text>
                  <Text
                    style={[styles.settingsDesc, isDark && styles.textMuted]}
                  >
                    정해진 시간마다 알림
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
              <View style={styles.intervalSelector}>
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
                        settings.waterInterval === hours &&
                          styles.intervalOptionSelected,
                      ]}
                      onPress={() => handleIntervalChange(hours)}
                    >
                      <Text
                        style={[
                          styles.intervalOptionText,
                          isDark && styles.textMuted,
                          settings.waterInterval === hours &&
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
          </View>
        </View>

        {/* 운동 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            운동 알림
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
          </View>
        </View>

        {/* 식사 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            식사 알림
          </Text>
          <View style={[styles.settingsCard, isDark && styles.cardDark]}>
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
                    아침, 점심, 저녁 기록 알림
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.mealReminder}
                onValueChange={(value) => handleToggle('mealReminder', value)}
                trackColor={{ false: '#767577', true: '#8b5cf6' }}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              />
            </View>
          </View>
        </View>

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
  intervalSelector: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
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
