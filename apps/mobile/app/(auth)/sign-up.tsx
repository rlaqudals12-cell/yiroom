/**
 * 회원가입 화면
 */
import { useSignUp } from '@clerk/clerk-expo';
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
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { brand, useTheme, typography, spacing, radii } from '@/lib/theme';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { colors, typography } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        // 신규 회원은 온보딩으로 이동
        router.replace('/(onboarding)/step1');
      }
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '인증에 실패했습니다.';
      Alert.alert('인증 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  // 이메일 인증 화면
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.card }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(0).duration(300)} style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>이메일 인증</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {email}로 전송된 인증 코드를 입력해주세요
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
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
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 회원가입 폼
  return (
    <KeyboardAvoidingView
      testID="auth-signup-screen"
      style={[styles.container, { backgroundColor: colors.card }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 로고/타이틀 */}
        <Animated.View entering={FadeInDown.delay(0).duration(300)} style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>회원가입</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            이룸과 함께 시작하세요
          </Text>
        </Animated.View>

        <View style={styles.form}>
          {/* 입력 필드 */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
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
          </Animated.View>

          {/* 버튼 */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
  form: {
    gap: spacing.md,
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
    borderRadius: radii.smx,
    padding: spacing.md,
    fontSize: typography.size.base,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: radii.smx,
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
