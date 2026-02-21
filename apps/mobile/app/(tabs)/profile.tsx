/**
 * 프로필 화면 (Clerk 인증 연동)
 * 분석 완료 상태 표시 + 네비게이션
 */
import { useUser, useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserAnalyses, useWorkoutData, useNutritionData } from '../../hooks';
import { useTheme, brand, statusColors, shadows } from '../../lib/theme';
import { profileLogger } from '../../lib/utils/logger';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // 데이터 훅
  const { personalColor, skinAnalysis, bodyAnalysis } = useUserAnalyses();
  const { analysis: workoutAnalysis, streak: workoutStreak } = useWorkoutData();
  const { streak: nutritionStreak } = useNutritionData();

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      profileLogger.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileHeader, { backgroundColor: colors.card }, shadows.card]}>
          {isSignedIn && user ? (
            <>
              {user.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                    {user.firstName?.[0] ||
                      user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                      '?'}
                  </Text>
                </View>
              )}
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {user.fullName || user.emailAddresses[0]?.emailAddress || '사용자'}
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.mutedForeground }]}
                onPress={handleSignOut}
              >
                <Text style={styles.actionButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>?</Text>
              </View>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                로그인이 필요합니다
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: brand.primary }]}
                onPress={handleSignIn}
              >
                <Text style={[styles.actionButtonText, { color: brand.primaryForeground }]}>
                  로그인
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>
            분석 결과
          </Text>
          <MenuItem
            title="퍼스널 컬러"
            colors={colors}
            completed={!!personalColor}
            subtitle={personalColor?.season ? `${personalColor.season}` : undefined}
            onPress={() => router.push('/(analysis)/personal-color')}
          />
          <MenuItem
            title="피부 분석"
            colors={colors}
            completed={!!skinAnalysis}
            subtitle={skinAnalysis?.skinType || undefined}
            onPress={() => router.push('/(analysis)/skin')}
          />
          <MenuItem
            title="체형 분석"
            colors={colors}
            completed={!!bodyAnalysis}
            subtitle={bodyAnalysis?.bodyType || undefined}
            onPress={() => router.push('/(analysis)/body')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>기록</Text>
          <MenuItem
            title="운동 기록"
            colors={colors}
            completed={!!workoutAnalysis}
            subtitle={
              workoutStreak?.currentStreak ? `🔥 ${workoutStreak.currentStreak}일 연속` : undefined
            }
            onPress={() => router.push('/(tabs)/records')}
          />
          <MenuItem
            title="식단 기록"
            colors={colors}
            completed={!!nutritionStreak}
            subtitle={
              nutritionStreak?.currentStreak
                ? `🔥 ${nutritionStreak.currentStreak}일 연속`
                : undefined
            }
            onPress={() => router.push('/(tabs)/records')}
          />
          <MenuItem title="주간 리포트" colors={colors} onPress={() => router.push('/reports')} />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>설정</Text>
          <MenuItem
            title="알림 설정"
            colors={colors}
            subtitle="물, 운동, 식사 알림"
            onPress={() => router.push('/settings/notifications')}
          />
          <MenuItem
            title="목표 설정"
            colors={colors}
            subtitle="물, 칼로리, 운동 목표"
            onPress={() => router.push('/settings/goals')}
          />
          <MenuItem
            title="위젯 설정"
            colors={colors}
            subtitle="홈 화면 위젯"
            onPress={() => router.push('/settings/widgets')}
          />
          <MenuItem title="전체 설정" colors={colors} onPress={() => router.push('/settings')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemColors {
  card: string;
  foreground: string;
  mutedForeground: string;
}

function MenuItem({
  title,
  colors,
  completed,
  subtitle,
  onPress,
}: {
  title: string;
  colors: MenuItemColors;
  completed?: boolean;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card }, shadows.sm]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemTitleRow}>
          <Text style={[styles.menuItemText, { color: colors.foreground }]}>{title}</Text>
          {completed && (
            <Text style={[styles.menuItemCheck, { color: statusColors.success }]}>✓</Text>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.menuItemArrow, { color: colors.mutedForeground }]}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 13,
    marginBottom: 8,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 15,
  },
  menuItemCheck: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 16,
  },
});
