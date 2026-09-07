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
import { getClerkErrorKey, useTranslation } from '@/lib/i18n';
import { brand, useTheme, typography, spacing, radii } from '@/lib/theme';

const RESEND_COOLDOWN_SECONDS = 60;

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken, signOut } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

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
      Alert.alert(t('auth.mobileSignUp.alertTitle'), t('auth.mobileSignUp.credentialsRequired'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.mobileSignUp.alertTitle'), t('auth.mobileSignUp.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('auth.mobileSignUp.alertTitle'), t('auth.mobileSignUp.passwordTooShort'));
      return;
    }

    const birthdateGate = evaluateBirthdateGate(false, birthdate);
    if (!birthdateGate.ok) {
      const birthdateErrorKey =
        birthdate.trim() === ''
          ? 'auth.mobileAgeVerification.birthdateRequired'
          : birthdateGate.isMinor
            ? 'auth.mobileAgeVerification.ageRestrictedMessage'
            : 'auth.mobileAgeVerification.birthdateInvalid';
      Alert.alert(t('auth.mobileSignUp.ageCheckTitle'), t(birthdateErrorKey));
      return;
    }

    if (!ageConfirmed) {
      Alert.alert(
        t('auth.mobileSignUp.ageCheckTitle'),
        t('auth.mobileSignUp.ageConfirmationRequired')
      );
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
      const errorMessage = t(getClerkErrorKey(error, 'auth.mobileSignUp.signUpFailure'));
      Alert.alert(t('auth.mobileSignUp.signUpFailureTitle'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 처리
  const handleVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert(t('auth.mobileSignUp.alertTitle'), t('auth.mobileSignUp.codeRequired'));
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
          if (!token) throw new Error(t('auth.mobileSignUp.missingSession'));
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
            t('auth.mobileSignUp.birthdateSaveTitle'),
            t('auth.mobileSignUp.birthdateSaveFailure')
          );
        }
        // 가입=첫 미팅(ADR-114): 신규 회원은 통합분석으로 이동 (웹 ?onboarding=1과 동일 의도)
        router.replace('/(analysis)/integrated?onboarding=1');
      }
    } catch (error: unknown) {
      const errorMessage = t(getClerkErrorKey(error, 'auth.mobileSignUp.verificationFailure'));
      Alert.alert(t('auth.mobileSignUp.verificationFailureTitle'), errorMessage);
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
      setResendNotice(t('auth.mobileSignUp.resendNotice', { email }));
    } catch (error: unknown) {
      const errorMessage = t(getClerkErrorKey(error, 'auth.mobileSignUp.resendFailure'));
      Alert.alert(t('auth.mobileSignUp.resendFailureTitle'), errorMessage);
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
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('auth.mobileSignUp.verificationTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t('auth.mobileSignUp.verificationDescription', { email })}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('auth.mobileSignUp.verificationCodeLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.muted,
                    },
                  ]}
                  placeholder={t('auth.mobileSignUp.verificationCodePlaceholder')}
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
                    {resendCooldown > 0
                      ? t('auth.mobileSignUp.resendAfter', { seconds: resendCooldown })
                      : t('auth.mobileSignUp.resendCode')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole={'button'}
                  disabled={isLoading}
                  onPress={handleChangeEmail}
                  style={[styles.verificationAction, isLoading && styles.buttonDisabled]}
                  testID={'signup-change-email-button'}
                >
                  <Text style={styles.linkText}>{t('auth.mobileSignUp.changeEmail')}</Text>
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
                <Text style={styles.buttonText}>{t('auth.mobileSignUp.verificationComplete')}</Text>
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
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('auth.mobileSignUp.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('auth.mobileSignUp.tagline')}
          </Text>
        </Animated.View>

        {/* 입력 필드 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('auth.mobileSignUp.emailLabel')}
              </Text>
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
                placeholder={t('auth.mobileSignUp.emailPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('auth.mobileSignUp.passwordLabel')}
              </Text>
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
                placeholder={t('auth.mobileSignUp.passwordPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('auth.mobileSignUp.confirmPasswordLabel')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                placeholder={t('auth.mobileSignUp.confirmPasswordPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('auth.mobileSignUp.birthdateLabel')}
              </Text>
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
                placeholder={t('auth.mobileSignUp.birthdatePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                value={birthdate}
                onChangeText={(value) => setBirthdate(formatBirthdateInput(value))}
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={10}
              />
              <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                {t('auth.mobileSignUp.birthdateHelp')}
              </Text>
            </View>

            <Pressable
              testID="signup-age-confirmation"
              style={styles.ageConfirmation}
              onPress={() => setAgeConfirmed((current) => !current)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageConfirmed }}
              accessibilityLabel={t('auth.mobileSignUp.ageConfirmation')}
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
                {t('auth.mobileSignUp.ageConfirmation')}
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
              <Text style={styles.buttonText}>{t('auth.mobileSignUp.signUpButton')}</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t('auth.mobileSignUp.existingAccount')}
            </Text>
            <Pressable onPress={handleSignIn}>
              <Text style={styles.linkText}>{t('auth.mobileSignUp.signIn')}</Text>
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
