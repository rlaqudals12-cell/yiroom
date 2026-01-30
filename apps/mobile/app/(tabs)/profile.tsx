/**
 * 프로필 화면 (Clerk 인증 연동)
 * 분석 완료 상태 표시 + 네비게이션
 */
import { useUser, useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserAnalyses, useWorkoutData, useNutritionData } from '../../hooks';
import { profileLogger } from '../../lib/utils/logger';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileHeader, isDark && styles.cardDark]}>
          {isSignedIn && user ? (
            <>
              {user.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.firstName?.[0] ||
                      user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                      '?'}
                  </Text>
                </View>
              )}
              <Text style={[styles.profileName, isDark && styles.textLight]}>
                {user.fullName ||
                  user.emailAddresses[0]?.emailAddress ||
                  '사용자'}
              </Text>
              <TouchableOpacity
                style={[styles.loginButton, styles.logoutButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.loginButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>?</Text>
              </View>
              <Text style={[styles.profileName, isDark && styles.textLight]}>
                로그인이 필요합니다
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignIn}
              >
                <Text style={styles.loginButtonText}>로그인</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, isDark && styles.textMuted]}>
            분석 결과
          </Text>
          <MenuItem
            title="퍼스널 컬러"
            isDark={isDark}
            completed={!!personalColor}
            subtitle={
              personalColor?.season ? `${personalColor.season}` : undefined
            }
            onPress={() => router.push('/(analysis)/personal-color')}
          />
          <MenuItem
            title="피부 분석"
            isDark={isDark}
            completed={!!skinAnalysis}
            subtitle={skinAnalysis?.skinType || undefined}
            onPress={() => router.push('/(analysis)/skin')}
          />
          <MenuItem
            title="체형 분석"
            isDark={isDark}
            completed={!!bodyAnalysis}
            subtitle={bodyAnalysis?.bodyType || undefined}
            onPress={() => router.push('/(analysis)/body')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, isDark && styles.textMuted]}>
            기록
          </Text>
          <MenuItem
            title="운동 기록"
            isDark={isDark}
            completed={!!workoutAnalysis}
            subtitle={
              workoutStreak?.currentStreak
                ? `🔥 ${workoutStreak.currentStreak}일 연속`
                : undefined
            }
            onPress={() => router.push('/(tabs)/records')}
          />
          <MenuItem
            title="식단 기록"
            isDark={isDark}
            completed={!!nutritionStreak}
            subtitle={
              nutritionStreak?.currentStreak
                ? `🔥 ${nutritionStreak.currentStreak}일 연속`
                : undefined
            }
            onPress={() => router.push('/(tabs)/records')}
          />
          <MenuItem
            title="주간 리포트"
            isDark={isDark}
            onPress={() => router.push('/reports')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, isDark && styles.textMuted]}>
            설정
          </Text>
          <MenuItem
            title="알림 설정"
            isDark={isDark}
            subtitle="물, 운동, 식사 알림"
            onPress={() => router.push('/settings/notifications')}
          />
          <MenuItem
            title="목표 설정"
            isDark={isDark}
            subtitle="물, 칼로리, 운동 목표"
            onPress={() => router.push('/settings/goals')}
          />
          <MenuItem
            title="위젯 설정"
            isDark={isDark}
            subtitle="홈 화면 위젯"
            onPress={() => router.push('/settings/widgets')}
          />
          <MenuItem
            title="전체 설정"
            isDark={isDark}
            onPress={() => router.push('/settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  title,
  isDark,
  completed,
  subtitle,
  onPress,
}: {
  title: string;
  isDark: boolean;
  completed?: boolean;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isDark && styles.menuItemDark]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemTitleRow}>
          <Text style={[styles.menuItemText, isDark && styles.textLight]}>
            {title}
          </Text>
          {completed && <Text style={styles.menuItemCheck}>✓</Text>}
        </View>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, isDark && styles.textMuted]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.menuItemArrow, isDark && styles.textMuted]}>→</Text>
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
    padding: 20,
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: '#999',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#2e5afa',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemDark: {
    backgroundColor: '#1a1a1a',
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
    color: '#111',
  },
  menuItemCheck: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 16,
    color: '#999',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
