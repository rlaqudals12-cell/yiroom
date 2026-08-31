/** 기존 계정의 최초 1회 생년월일 수집 화면. */
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatBirthdateInput, isMinor, parseBirthDate } from '@/lib/age-verification';
import {
  BirthdateApiError,
  evaluateBirthdateGate,
  fetchBirthdate,
  saveBirthdate,
} from '@/lib/api/birthdate';
import { useNetworkStatus } from '@/lib/offline';
import { useTheme } from '@/lib/theme';

export default function CompleteProfileScreen(): React.JSX.Element {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string | string[] }>();
  const { isConnected } = useNetworkStatus();
  const { brand, colors, radii, typography } = useTheme();
  const [birthdate, setBirthdate] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const unavailableReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const isUnavailable = unavailableReason === 'unavailable';
  const shouldRecheck = isUnavailable && !isConnected;

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/(auth)/sign-in');
  }, [isLoaded, isSignedIn, router]);

  const moveToAgeRestricted = async (): Promise<void> => {
    // 미성년 판정 뒤 인증 세션을 남기면 딥링크로 보호 표면을 다시 열 수 있다.
    await signOut();
    router.replace('/(auth)/age-restricted');
  };

  const handleSubmit = async (): Promise<void> => {
    const gate = evaluateBirthdateGate(false, birthdate);
    if (!gate.ok) {
      if (gate.isMinor) {
        setIsSubmitting(true);
        try {
          await moveToAgeRestricted();
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
      setError(gate.message);
      return;
    }

    if (!ageConfirmed) {
      setError('만 14세 이상임을 확인해주세요.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        await signOut();
        router.replace('/(auth)/sign-in');
        return;
      }

      await saveBirthdate(gate.birthDate ?? birthdate.trim(), token);
      router.replace('/(tabs)');
    } catch (saveError) {
      if (saveError instanceof BirthdateApiError && saveError.isMinor) {
        await moveToAgeRestricted();
        return;
      }
      setError(
        saveError instanceof Error
          ? saveError.message
          : '생년월일을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecheck = async (): Promise<void> => {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        await signOut();
        router.replace('/(auth)/sign-in');
        return;
      }

      const storedBirthdate = await fetchBirthdate(token);
      if (!storedBirthdate.hasBirthDate || !storedBirthdate.birthDate) {
        setError('저장된 생년월일이 없어요. 네트워크 연결 후 직접 입력해주세요.');
        return;
      }

      const parsedBirthdate = parseBirthDate(storedBirthdate.birthDate);
      if (!parsedBirthdate) {
        setError('저장된 생년월일을 확인할 수 없어요. 직접 입력해주세요.');
        return;
      }
      if (isMinor(parsedBirthdate)) {
        await moveToAgeRestricted();
        return;
      }

      router.replace('/(tabs)');
    } catch (fetchError) {
      if (fetchError instanceof BirthdateApiError && fetchError.isMinor) {
        await moveToAgeRestricted();
        return;
      }
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : '연령 확인 정보를 불러오지 못했어요. 네트워크 연결을 확인해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { backgroundColor: colors.background }]}
      testID="complete-profile-screen"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>연령 확인</Text>
        <Text
          style={[styles.title, { color: colors.foreground, fontSize: typography.size['2xl'] }]}
        >
          {isUnavailable ? '연령 확인 정보를 불러오지 못했어요' : '생년월일을 입력해주세요'}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {isUnavailable
            ? '네트워크 연결을 확인한 뒤 다시 확인해주세요. 저장된 성인 정보가 확인되면 바로 이어갈 수 있어요.'
            : '이룸은 만 14세 이상만 이용할 수 있어요. 입력한 생년월일은 연령 확인과 서비스 이용 자격 확인에 사용해요.'}
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>생년월일</Text>
        <TextInput
          accessibilityLabel="생년월일 입력"
          autoCapitalize="none"
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={(value) => setBirthdate(formatBirthdateInput(value))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              borderColor: error ? colors.destructive : colors.border,
              borderRadius: radii.xl,
              color: colors.foreground,
              fontSize: typography.size.base,
            },
          ]}
          testID="complete-profile-birthdate-input"
          value={birthdate}
        />

        <Pressable
          accessibilityLabel="만 14세 이상임을 확인합니다"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ageConfirmed }}
          onPress={() => setAgeConfirmed((current) => !current)}
          style={styles.ageConfirmation}
          testID="complete-profile-age-confirmation"
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: ageConfirmed ? brand.primary : colors.card,
                borderColor: ageConfirmed ? brand.primary : colors.border,
                borderRadius: radii.sm,
              },
            ]}
          >
            {ageConfirmed && (
              <View style={[styles.checkboxMark, { borderColor: brand.primaryForeground }]} />
            )}
          </View>
          <Text style={{ color: colors.foreground, flex: 1, fontSize: typography.size.sm }}>
            만 14세 이상임을 확인합니다
          </Text>
        </Pressable>

        {error && (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: colors.destructive }]}
            testID="complete-profile-error"
          >
            {error}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void (shouldRecheck ? handleRecheck() : handleSubmit())}
          style={[
            styles.submit,
            { backgroundColor: brand.primary, borderRadius: radii.full },
            isSubmitting && styles.disabled,
          ]}
          testID={shouldRecheck ? 'complete-profile-recheck' : 'complete-profile-submit'}
        >
          {isSubmitting ? (
            <ActivityIndicator color={brand.primaryForeground} />
          ) : (
            <Text
              style={{
                color: brand.primaryForeground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
              }}
            >
              {shouldRecheck ? '다시 확인하기' : '확인하고 시작하기'}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={styles.signOut}
          testID="complete-profile-sign-out"
        >
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>
            다른 계정으로 로그인
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ageConfirmation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    minHeight: 44,
  },
  card: {
    borderWidth: 1,
    padding: 24,
    width: '100%',
  },
  checkbox: {
    alignItems: 'center',
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxMark: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    height: 12,
    marginTop: -2,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  eyebrow: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  signOut: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  submit: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
  },
});
