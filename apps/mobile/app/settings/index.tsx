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
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();

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
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 알림 및 목표 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            알림 및 목표
          </Text>
          <SettingsItem
            icon="🔔"
            title="알림 설정"
            subtitle="물, 운동, 식사 알림"
            colors={colors}
            onPress={() => handlePress('/settings/notifications')}
          />
          <SettingsItem
            icon="🎯"
            title="목표 설정"
            subtitle="일일 물, 칼로리 목표"
            colors={colors}
            onPress={() => handlePress('/settings/goals')}
          />
        </View>

        {/* 위젯 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            위젯
          </Text>
          <SettingsItem
            icon="📱"
            title="위젯 설정"
            subtitle="홈 화면 위젯 미리보기"
            colors={colors}
            onPress={() => handlePress('/settings/widgets')}
          />
        </View>

        {/* 앱 정보 — 네이티브 페이지로 이동 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            앱 정보
          </Text>
          <SettingsItem
            icon="📖"
            title="이용약관"
            colors={colors}
            onPress={() => handlePress('/terms')}
          />
          <SettingsItem
            icon="🔒"
            title="개인정보 처리방침"
            colors={colors}
            onPress={() => handlePress('/privacy-policy')}
          />
          <SettingsItem
            icon="💬"
            title="피드백 보내기"
            colors={colors}
            onPress={() => handleLink('mailto:support@yiroom.app')}
          />
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionLabel, { color: colors.foreground }]}>
            이룸
          </Text>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            버전 {appVersion}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsItemColors {
  card: string;
  foreground: string;
  mutedForeground: string;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  colors: SettingsItemColors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.settingsArrow, { color: colors.mutedForeground }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
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
  },
  settingsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 20,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 13,
  },
});
