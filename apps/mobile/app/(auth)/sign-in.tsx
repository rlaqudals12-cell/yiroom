/**
 * 로그인 화면
 */
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { TIMING } from '@/lib/animations';
import { brand, useTheme, typography, spacing, radii } from '@/lib/theme';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors, typography } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 추가 인증(이메일 코드) 단계 상태 — Clerk dev 인스턴스는 새 기기/세션에서
  // 비밀번호 검증 후 email_code 확인을 추가로 요구할 수 있어, 그때만 코드 입력 UI로 전환한다.
  // 이 확인이 1차 팩터(needs_first_factor)로 올 수도, 2차 팩터(needs_second_factor)로 올 수도
  // 있어(실기 재현: 비밀번호 후 needs_second_factor + email_code) 어느 단계인지 기억해 둔다.
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationStage, setVerificationStage] = useState<'first' | 'second'>('first');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // 1) 비밀번호만으로 인증 완료 — 바로 메인 탭 진입
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      // 2) 비밀번호는 맞지만 Clerk가 이메일 코드 확인을 추가로 요구하는 경우.
      //    supportedFirstFactors에서 email_code 팩터를 찾아 코드를 발송하고,
      //    코드 입력 화면으로 전환한다. (status가 complete가 아닐 때 무반응이던 버그의 근본 수리)
      if (result.status === 'needs_first_factor') {
        // find는 boolean predicate라 결과가 SignInFirstFactor로만 좁혀진다 →
        // 아래 if에서 strategy를 재확인해 EmailCodeFactor(emailAddressId 보유)로 판별 유니온 narrowing.
        const emailFactor = result.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );

        if (emailFactor && emailFactor.strategy === 'email_code') {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerificationStage('first');
          setPendingVerification(true);
          return;
        }
      }

      // 3) 비밀번호가 1차로 통과되고 이메일 코드가 "2차" 팩터로 요구되는 경우.
      //    (실기 재현: dev 인스턴스 재로그인 시 needs_second_factor +
      //    supportedSecondFactors=[email_code] — 1차만 처리하던 수리의 사각지대)
      if (result.status === 'needs_second_factor') {
        const emailSecondFactor = result.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );

        if (emailSecondFactor) {
          await signIn.prepareSecondFactor({ strategy: 'email_code' });
          setVerificationStage('second');
          setPendingVerification(true);
          return;
        }
      }

      // 4) needs_new_password 등 앱이 아직 지원하지 않는 상태.
      //    무반응(조용한 무시) 대신 정직하게 웹 로그인으로 안내한다.
      Alert.alert(
        '추가 인증 필요',
        '추가 인증이 필요한 계정이에요. 웹(yiroom.vercel.app)에서 로그인해주세요.'
      );
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 코드 확인 — needs_first_factor / needs_second_factor(email_code) 후속 단계
  const handleVerifyCode = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert('알림', '인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 코드 발송을 트리거한 단계(1차/2차)에 맞는 attempt를 호출해야 한다
      const result =
        verificationStage === 'second'
          ? await signIn.attemptSecondFactor({ strategy: 'email_code', code })
          : await signIn.attemptFirstFactor({ strategy: 'email_code', code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      // 코드는 맞았지만 여전히 추가 인증이 남은 경우 — 정직하게 웹 로그인 안내
      Alert.alert(
        '추가 인증 필요',
        '추가 인증이 필요한 계정이에요. 웹(yiroom.vercel.app)에서 로그인해주세요.'
      );
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '인증에 실패했습니다.';
      Alert.alert('인증 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  // 이메일 인증 화면 (needs_first_factor 대응) — sign-up.tsx의 인증 단계 UI/스타일을 그대로 재사용
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        testID="auth-signin-verify-screen"
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
                  testID="signin-code-input"
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
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
            <Pressable
              testID="signin-verify-button"
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
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

  return (
    <KeyboardAvoidingView
      testID="auth-signin-screen"
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenContainer backgroundGradient="home" contentContainerStyle={styles.scrollContent}>
        {/* 로고/타이틀 */}
        <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)} style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>이룸</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            온전한 나를 만나다
          </Text>
        </Animated.View>

        {/* 입력 필드 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>이메일</Text>
              <TextInput
                testID="signin-email-input"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
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
                testID="signin-password-input"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                  },
                ]}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* 버튼 */}
        <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
          <Pressable
            testID="signin-submit-button"
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={brand.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              계정이 없으신가요?
            </Text>
            <Pressable onPress={handleSignUp}>
              <Text style={styles.linkText}>회원가입</Text>
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
});
