import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Share } from 'react-native';

import { AccountApiError, deleteAccount } from '@/lib/api/account';
import { BiometricConsentApiError, revokeBiometricConsent } from '@/lib/api/biometric-consent';
import { useClerkSupabaseClient } from '@/lib/supabase';

interface UsePrivacyDataActionsResult {
  isRevokingBiometric: boolean;
  isDeleting: boolean;
  handleDownloadData: () => Promise<void>;
  handleRevokeBiometricConsent: () => void;
  handleDeleteAccount: () => void;
}

export function usePrivacyDataActions(): UsePrivacyDataActionsResult {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const userEmail =
    user?.emailAddresses[0]?.emailAddress ?? user?.primaryEmailAddress?.emailAddress ?? null;

  const [, setIsExporting] = useState(false);
  const [isRevokingBiometric, setIsRevokingBiometric] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
          supabase
            .from('personal_color_assessments')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('skin_analyses')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('body_analyses')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('workout_logs')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('meal_records')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('water_records')
            .select('*')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false }),
          supabase.from('user_badges').select('*').eq('clerk_user_id', userId),
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: userRes.data
          ? {
              email: userRes.data.email,
              name: userRes.data.name,
              createdAt: userRes.data.created_at,
            }
          : null,
        analyses: {
          personalColor: pcRes.data
            ? {
                season: pcRes.data.season,
                subtype: pcRes.data.subtype,
                analyzedAt: pcRes.data.created_at,
              }
            : null,
          skin: skinRes.data
            ? {
                skinType: skinRes.data.skin_type,
                concerns: skinRes.data.concerns,
                analyzedAt: skinRes.data.created_at,
              }
            : null,
          body: bodyRes.data
            ? { bodyType: bodyRes.data.body_type, analyzedAt: bodyRes.data.created_at }
            : null,
        },
        records: {
          workoutLogs: (workoutRes.data || []).length,
          mealRecords: (mealRes.data || []).length,
          waterRecords: (waterRes.data || []).length,
        },
        badges: (badgesRes.data || []).map((badge) => ({
          badgeId: badge.badge_id,
          earnedAt: badge.earned_at,
        })),
      };

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

  // 글로벌 처리 동의와 선택 저장 이미지를 웹 정본 API에서 함께 철회·파기한다.
  const handleRevokeBiometricConsent = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '생체정보 동의 철회',
      '생체정보 수집·이용 동의를 철회하고 서버에 선택 저장된 분석 원본 이미지를 즉시 삭제합니다. 텍스트 분석 결과는 유지되며, 다시 분석하려면 생체정보 동의가 필요합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '철회 및 이미지 삭제',
          style: 'destructive',
          onPress: async (): Promise<void> => {
            setIsRevokingBiometric(true);
            try {
              const clerkToken = await getToken();
              if (!clerkToken) {
                throw new BiometricConsentApiError(
                  '로그인 정보가 만료되었어요. 다시 로그인해주세요.',
                  401,
                  'AUTH_ERROR'
                );
              }

              await revokeBiometricConsent(clerkToken);
              Alert.alert(
                '철회 완료',
                '생체정보 동의를 철회하고 서버에 저장된 분석 이미지를 삭제했어요. 텍스트 분석 결과는 유지됩니다.'
              );
            } catch (error) {
              Alert.alert(
                '철회를 완료하지 못했어요',
                error instanceof BiometricConsentApiError
                  ? error.message
                  : '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
              );
            } finally {
              setIsRevokingBiometric(false);
            }
          },
        },
      ]
    );
  }, [getToken]);

  // 계정·DB·비공개 스토리지를 웹 정본 API에서 즉시 파기한다.
  const handleDeleteAccount = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      '계정 삭제',
      '계정과 모든 데이터, 저장된 사진이 즉시 영구 삭제돼요. 삭제 후에는 복구할 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '영구 삭제',
          style: 'destructive',
          onPress: async (): Promise<void> => {
            // 웹은 Clerk 이메일을 재대조한다. 로컬에서 확인값을 만들 수 없으면 요청하지 않는다.
            if (!user?.id || !userEmail) {
              Alert.alert('오류', '로그인 이메일을 확인할 수 없어요. 다시 로그인 후 시도해주세요.');
              return;
            }

            setIsDeleting(true);
            try {
              const clerkToken = await getToken();
              if (!clerkToken) {
                throw new AccountApiError(
                  '로그인 정보가 만료되었어요. 다시 로그인 후 시도해주세요.',
                  401,
                  'AUTH_ERROR'
                );
              }

              await deleteAccount(userEmail, clerkToken);

              // 계정은 이미 서버에서 삭제됐다. 로컬 세션 정리 실패를 삭제 실패로 오인시키지 않는다.
              try {
                await signOut();
              } catch (signOutError) {
                console.warn(
                  '[Privacy] Local sign-out after account deletion failed:',
                  signOutError
                );
              }

              Alert.alert(
                '계정 삭제 완료',
                '계정과 모든 데이터가 영구 삭제되었어요. 이 작업은 되돌릴 수 없어요.',
                [{ text: '확인', onPress: () => router.replace('/(auth)/sign-in') }]
              );
            } catch (error) {
              console.error('[Privacy] Delete account error:', error);
              Alert.alert(
                '오류',
                error instanceof AccountApiError
                  ? error.message
                  : '계정 삭제에 실패했어요. 다시 시도해주세요.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [getToken, signOut, user?.id, userEmail]);

  return {
    isRevokingBiometric,
    isDeleting,
    handleDownloadData,
    handleRevokeBiometricConsent,
    handleDeleteAccount,
  };
}
