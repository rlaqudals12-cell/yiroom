/**
 * 회원가입 화면
 */
import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { formatBirthdateInput } from '@/lib/age-verification';
import { TIMING } from '@/lib/animations';
import { BirthdateApiError, evaluateBirthdateGate, saveBirthdate } from '@/lib/api/birthdate';
import { brand, useTheme, typography, spacing, radii } from '@/lib/theme';

const RESEND_COOLDOWN_SECONDS = 60;

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken, signOut } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingVerification || resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [pendingVerification, resendCooldown]);

  // 회원가입 처리
  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('알림', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    const birthdateGate = evaluateBirthdateGate(false, birthdate);
    if (!birthdateGate.ok) {
      Alert.alert('가입 연령 확인', birthdateGate.message);
      return;
    }

    if (!ageConfirmed) {
      Alert.alert('가입 연령 확인', '만 14세 이상임을 확인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // 이메일 인증 요청
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 처리
  const handleVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert('알림', '인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // 가입 단계에서 확인한 생년월일을 서버 정본(users.birth_date)에 저장한다.
        // 세션 전환 직후 토큰이 늦게 준비되면 통합 분석의 기존 fail-closed 게이트가 다시 받는다.
        try {
          const token = await getToken();
          if (!token) throw new Error('로그인 정보를 확인하지 못했습니다.');
          await saveBirthdate(birthdate.trim(), token);
        } catch (saveError) {
          // 서버가 만 14세 미만으로 판정한 경우(기기 시계 조작으로 클라 게이트를 통과) —
          // 진행하지 않고 세션을 폐기한다. fail-open 금지.
          if (saveError instanceof BirthdateApiError && saveError.isMinor) {
            await signOut();
            router.replace('/(auth)/age-restricted');
            return;
          }
          Alert.alert(
            '생년월일 저장 안내',
            '가입은 완료됐지만 생년월일을 저장하지 못했어요. 첫 분석 전에 다시 확인해주세요.'
          );
        }
        // 가입=첫 미팅(ADR-114): 신규 회원은 통합분석으로 이동 (웹 ?onboarding=1과 동일 의도)
        router.replace('/(analysis)/integrated?onboarding=1');
      }
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '인증에 실패했습니다.';
      Alert.alert('인증 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (!isLoaded || isLoading || resendCooldown > 0) return;

    setIsLoading(true);
    setResendNotice(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setResendNotice(`${email}로 새 코드를 보냈어요`);
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '인증 코드를 다시 보내지 못했어요.';
      Alert.alert('인증 코드 재전송 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = (): void => {
    setPendingVerification(false);
    setCode('');
    setResendCooldown(0);
    setResendNotice(null);
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  // 이메일 인증 화면
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenContainer backgroundGradient="home" contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)} style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>이메일 인증</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {email}로 전송된 인증 코드를 입력해주세요
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.foreground }]}>인증 코드</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.muted,
                    },
                  ]}
                  placeholder="6자리 코드 입력"
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {resendNotice && (
                <Text
                  accessibilityLiveRegion={'polite'}
                  style={[styles.resendNotice, { color: colors.mutedForeground }]}
                  testID={'signup-resend-code-notice'}
                >
                  {resendNotice}
                </Text>
              )}

              <View style={styles.verificationActions}>
                <Pressable
                  accessibilityRole={'button'}
                  accessibilityState={{ disabled: isLoading || resendCooldown > 0 }}
                  disabled={isLoading || resendCooldown > 0}
                  onPress={() => void handleResendCode()}
                  style={[
                    styles.verificationAction,
                    (isLoading || resendCooldown > 0) && styles.buttonDisabled,
                  ]}
                  testID={'signup-resend-code-button'}
                >
                  <Text
                    style={[
                      styles.linkText,
                      {
                        color:
                          isLoading || resendCooldown > 0 ? colors.mutedForeground : brand.primary,
                      },
                    ]}
                  >
                    {resendCooldown > 0 ? `${resendCooldown}초 후 다시 받기` : '코드 다시 받기'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole={'button'}
                  disabled={isLoading}
                  onPress={handleChangeEmail}
                  style={[styles.verificationAction, isLoading && styles.buttonDisabled]}
                  testID={'signup-change-email-button'}
                >
                  <Text style={styles.linkText}>이메일 바꾸기</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={brand.primaryForeground} />
              ) : (
                <Text style={styles.buttonText}>인증 완료</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScreenContainer>
      </KeyboardAvoidingView>
    );
  }

  // 회원가입 폼
  return (
    <KeyboardAvoidingView
      testID="auth-signup-screen"
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenContainer backgroundGradient="home" contentContainerStyle={styles.scrollContent}>
        {/* 로고/타이틀 */}
        <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)} style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>회원가입</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            이룸과 함께 시작하세요
          </Text>
        </Animated.View>

        {/* 입력 필드 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>이메일</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                testID="signup-email-input"
                placeholder="이메일을 입력하세요"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>비밀번호</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                testID="signup-password-input"
                placeholder="8자 이상 입력하세요"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>비밀번호 확인</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>생년월일</Text>
              <TextInput
                testID="signup-birthdate-input"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={birthdate}
                onChangeText={(value) => setBirthdate(formatBirthdateInput(value))}
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={10}
              />
              <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                만 14세 이상 확인과 서비스 이용 자격 확인에 사용해요.
              </Text>
            </View>

            <Pressable
              testID="signup-age-confirmation"
              style={styles.ageConfirmation}
              onPress={() => setAgeConfirmed((current) => !current)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageConfirmed }}
              accessibilityLabel="만 14세 이상임을 확인합니다"
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: ageConfirmed ? brand.primary : colors.border,
                    backgroundColor: ageConfirmed ? brand.primary : colors.card,
                  },
                ]}
              >
                {ageConfirmed && <View style={styles.checkboxMark} />}
              </View>
              <Text style={[styles.ageConfirmationText, { color: colors.foreground }]}>
                만 14세 이상임을 확인합니다
              </Text>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* 버튼 */}
        <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
          <Pressable
            testID="signup-submit-button"
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={brand.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>회원가입</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              이미 계정이 있으신가요?
            </Text>
            <Pressable onPress={handleSignIn}>
              <Text style={styles.linkText}>로그인</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  helpText: {
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  ageConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 44,
  },
  ageConfirmationText: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    width: 8,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: brand.primaryForeground,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    fontSize: typography.size.base,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: radii.full,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: brand.primaryForeground,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footerText: {
    fontSize: typography.size.sm,
  },
  linkText: {
    color: brand.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  resendNotice: {
    fontSize: typography.size.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  verificationAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  verificationActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
