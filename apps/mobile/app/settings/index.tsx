/**
 * 설정 메인 화면
 * 알림, 목표, 위젯, 앱 정보 등
 */

import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const appVersion = Constants.expoConfig?.version || '0.1.0';

  const handlePress = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as never);
  };

  const handleLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
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
        {/* 알림 및 목표 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            알림 및 목표
          </Text>
          <SettingsItem
            icon="🔔"
            title="알림 설정"
            subtitle="물, 운동, 식사 알림"
            isDark={isDark}
            onPress={() => handlePress('/settings/notifications')}
          />
          <SettingsItem
            icon="🎯"
            title="목표 설정"
            subtitle="일일 물, 칼로리 목표"
            isDark={isDark}
            onPress={() => handlePress('/settings/goals')}
          />
        </View>

        {/* 위젯 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            위젯
          </Text>
          <SettingsItem
            icon="📱"
            title="위젯 설정"
            subtitle="홈 화면 위젯 미리보기"
            isDark={isDark}
            onPress={() => handlePress('/settings/widgets')}
          />
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textMuted]}>
            앱 정보
          </Text>
          <SettingsItem
            icon="📖"
            title="이용약관"
            isDark={isDark}
            onPress={() => handleLink('https://yiroom.app/terms')}
          />
          <SettingsItem
            icon="🔒"
            title="개인정보 처리방침"
            isDark={isDark}
            onPress={() => handleLink('https://yiroom.app/privacy')}
          />
          <SettingsItem
            icon="💬"
            title="피드백 보내기"
            isDark={isDark}
            onPress={() => handleLink('mailto:support@yiroom.app')}
          />
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionLabel, isDark && styles.textMuted]}>
            이룸
          </Text>
          <Text style={[styles.versionText, isDark && styles.textMuted]}>
            버전 {appVersion}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  isDark,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, isDark && styles.settingsItemDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, isDark && styles.textLight]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, isDark && styles.textMuted]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.settingsArrow, isDark && styles.textMuted]}>›</Text>
    </TouchableOpacity>
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemDark: {
    backgroundColor: '#1a1a1a',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  settingsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 20,
    color: '#999',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 13,
    color: '#666',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
