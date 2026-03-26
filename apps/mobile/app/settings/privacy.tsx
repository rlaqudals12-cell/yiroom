/**
 * 개인정보 설정 화면
 * 데이터 수집, 프로필 공개, 데이터 관리 설정
 */

import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, Platform } from 'react-native';

import { useClerkSupabaseClient } from '../../lib/supabase';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { ScreenContainer, GlassCard } from '../../components/ui';

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

// GDPR 유예기간 (일)
const GRACE_PERIOD_DAYS = 30;

export default function PrivacySettingsScreen(): React.JSX.Element {
  const { colors, brand } = useTheme();
  const { signOut } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = (key: keyof PrivacySettings, value: boolean): void => {
    Haptics.selectionAsync();
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);

  // 내 데이터 내보내기 (JSON 파일 공유)
  const handleDownloadData = useCallback(async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!user?.id) {
      Alert.alert('오류', '로그인이 필요해요.');
      return;
    }

    setIsExporting(true);
    try {
      const userId = user.id;

      // 병렬로 모든 데이터 조회
      const [userRes, pcRes, skinRes, bodyRes, workoutRes, mealRes, waterRes, badgesRes] =
        await Promise.all([
          supabase.from('users').select('*').eq('clerk_user_id', userId).single(),
          supabase.from('personal_color_assessments').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('skin_analyses').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('body_analyses').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('workout_logs').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
          supabase.from('meal_records').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
          supabase.from('water_records').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
          supabase.from('user_badges').select('*').eq('clerk_user_id', userId),
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: userRes.data ? { email: userRes.data.email, name: userRes.data.name, createdAt: userRes.data.created_at } : null,
        analyses: {
          personalColor: pcRes.data ? { season: pcRes.data.season, subtype: pcRes.data.subtype, analyzedAt: pcRes.data.created_at } : null,
          skin: skinRes.data ? { skinType: skinRes.data.skin_type, concerns: skinRes.data.concerns, analyzedAt: skinRes.data.created_at } : null,
          body: bodyRes.data ? { bodyType: bodyRes.data.body_type, analyzedAt: bodyRes.data.created_at } : null,
        },
        records: {
          workoutLogs: (workoutRes.data || []).length,
          mealRecords: (mealRes.data || []).length,
          waterRecords: (waterRes.data || []).length,
        },
        badges: (badgesRes.data || []).map((b) => ({ badgeId: b.badge_id, earnedAt: b.earned_at })),
      };

      // React Native Share API 사용 (네이티브 모듈 불필요)
      const { Share } = require('react-native');
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: '이룸 데이터 내보내기',
      });
    } catch (error) {
      console.error('[Privacy] Export data error:', error);
      Alert.alert('오류', '데이터 내보내기에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  }, [user?.id, supabase]);

  // 계정 삭제 요청 (30일 유예기간 후 삭제)
  const handleDeleteAccount = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '계정 삭제',
      `정말 계정을 삭제하시겠어요?\n\n• ${GRACE_PERIOD_DAYS}일 후 모든 데이터가 영구 삭제돼요\n• ${GRACE_PERIOD_DAYS}일 이내에 다시 로그인하면 삭제를 취소할 수 있어요\n• 삭제 후에는 복구할 수 없어요`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제 요청',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Supabase에 삭제 요청 기록
              const now = new Date();
              const scheduledAt = new Date(now);
              scheduledAt.setDate(scheduledAt.getDate() + GRACE_PERIOD_DAYS);

              const { error } = await supabase.rpc('request_account_deletion', {
                grace_period_days: GRACE_PERIOD_DAYS,
              });

              if (error) {
                // RPC가 없으면 직접 업데이트 시도
                const { error: updateError } = await supabase
                  .from('users')
                  .update({
                    deletion_requested_at: now.toISOString(),
                    deletion_scheduled_at: scheduledAt.toISOString(),
                  })
                  .eq('clerk_user_id', (await supabase.auth.getUser()).data.user?.id ?? '');

                if (updateError) {
                  throw updateError;
                }
              }

              // 로그아웃 처리
              await signOut();

              Alert.alert(
                '삭제 요청 완료',
                `계정 삭제가 예약되었어요.\n${scheduledAt.toLocaleDateString('ko-KR')}에 삭제될 예정이에요.\n그 전에 다시 로그인하면 취소할 수 있어요.`,
                [{ text: '확인', onPress: () => router.replace('/(auth)/sign-in') }]
              );
            } catch (error) {
              console.error('[Privacy] Delete account error:', error);
              Alert.alert('오류', '계정 삭제 요청에 실패했어요. 다시 시도해주세요.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [supabase, signOut]);

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
        backgroundGradient="profile"
      >
        {/* 데이터 수집 */}
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
          </GlassCard>
        </View>

        {/* 프로필 공개 */}
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            프로필 공개
          </Text>
          <GlassCard shadowSize="md">
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
          </GlassCard>
        </View>

        {/* 데이터 관리 */}
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
          </GlassCard>
        </View>

        {/* 안내 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            개인정보는 안전하게 암호화되어 저장돼요.{'\n'}
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
