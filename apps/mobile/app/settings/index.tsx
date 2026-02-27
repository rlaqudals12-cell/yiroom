/**
 * 설정 메인 화면
 * 알림, 목표, 위젯, 앱 정보 등
 */

import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ScreenContainer } from '../../components/ui';
import { BottomSheet } from '../../components/ui/BottomSheet';

export default function SettingsScreen() {
  const { colors, isDark, brand, spacing, radii, typography } = useTheme();
  const { signOut } = useAuth();

  const appVersion = Constants.expoConfig?.version || '0.1.0';
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const handlePress = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as never);
  };

  const handleLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
  };

  const handleOpenAccountSheet = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAccountSheetOpen(true);
  }, []);

  const handleCloseAccountSheet = useCallback((): void => {
    setIsAccountSheetOpen(false);
  }, []);

  // 로그아웃 확인 후 실행
  const handleLogout = useCallback((): void => {
    setIsAccountSheetOpen(false);
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch {
              Alert.alert('오류', '로그아웃에 실패했어요. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  return (
    <ScreenContainer
      testID="settings-screen"
      edges={['bottom']}
    >
        {/* 알림 및 목표 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>알림 및 목표</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>위젯</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>앱 정보</Text>
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
            icon="❓"
            title="도움말/FAQ"
            colors={colors}
            onPress={() => handlePress('/help')}
          />
          <SettingsItem
            icon="💬"
            title="피드백 보내기"
            colors={colors}
            onPress={() => handleLink('mailto:support@yiroom.app')}
          />
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>계정</Text>
          <SettingsItem
            icon="👤"
            title="계정 관리"
            subtitle="로그아웃, 데이터 관리"
            colors={colors}
            onPress={handleOpenAccountSheet}
          />
        </View>

        {/* 계정 바텀 시트 */}
        <BottomSheet
          isVisible={isAccountSheetOpen}
          onClose={handleCloseAccountSheet}
          snapPoints={['30%']}
          title="계정 관리"
          testID="settings-account-sheet"
        >
          <Pressable
            style={[styles.accountOption, { backgroundColor: colors.muted, borderRadius: radii.lg }]}
            onPress={handleLogout}
            testID="settings-logout-button"
          >
            <Text style={[styles.accountOptionText, { color: colors.destructive }]}>
              로그아웃
            </Text>
          </Pressable>
          <Pressable
            style={[styles.accountOption, { backgroundColor: colors.muted, borderRadius: radii.lg }]}
            onPress={handleCloseAccountSheet}
            testID="settings-account-cancel"
          >
            <Text style={[styles.accountOptionText, { color: colors.foreground }]}>
              취소
            </Text>
          </Pressable>
        </BottomSheet>

        {/* 버전 정보 */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionLabel, { color: colors.foreground }]}>이룸</Text>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            버전 {appVersion}
          </Text>
        </View>
    </ScreenContainer>
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
    <Pressable
      style={[styles.settingsItem, { backgroundColor: colors.card }]}
      onPress={onPress}

    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.settingsArrow, { color: colors.mutedForeground }]}>›</Text>
    </Pressable>
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
  accountOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  accountOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
