/**
 * 비밀번호 재설정 화면
 *
 * Clerk의 이메일 코드 팩터를 로그인 화면과 같은 카드·입력 문법으로 처리한다.
 */
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { brand, radii, spacing, typography, useTheme } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pendingCode, setPendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!isLoaded) return;
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setPendingCode(true);
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      Alert.alert(
        '재설정 실패',
        clerkError.errors?.[0]?.message || '인증 코드를 보내지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;
    if (!code || !password) {
      Alert.alert('알림', '인증 코드와 새 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
        return;
      }
      Alert.alert('재설정 실패', '비밀번호를 재설정하지 못했습니다. 다시 시도해주세요.');
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      Alert.alert(
        '재설정 실패',
        clerkError.errors?.[0]?.message || '비밀번호를 재설정하지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    borderColor: colors.border,
    color: colors.foreground,
    backgroundColor: colors.muted,
  };

  return (
    <KeyboardAvoidingView
      testID={pendingCode ? 'auth-forgot-password-verify-screen' : 'auth-forgot-password-screen'}
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenContainer backgroundGradient="home" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>비밀번호 재설정</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {pendingCode
              ? `${email.trim()}로 전송된 인증 코드를 입력해주세요`
              : '가입한 이메일로 인증 코드를 보내드려요'}
          </Text>
        </View>

        <GlassCard shadowSize="md" style={styles.card}>
          {!pendingCode ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>이메일</Text>
              <TextInput
                testID="forgot-password-email-input"
                style={[styles.input, inputStyle]}
                placeholder="이메일을 입력하세요"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>인증 코드</Text>
                <TextInput
                  testID="forgot-password-code-input"
                  style={[styles.input, inputStyle]}
                  placeholder="6자리 코드 입력"
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={[styles.inputGroup, styles.passwordGroup]}>
                <Text style={[styles.label, { color: colors.foreground }]}>새 비밀번호</Text>
                <TextInput
                  testID="forgot-password-new-password-input"
                  style={[styles.input, inputStyle]}
                  placeholder="새 비밀번호를 입력하세요"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}
        </GlassCard>

        <Pressable
          testID={pendingCode ? 'forgot-password-submit-button' : 'forgot-password-request-button'}
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={pendingCode ? handleResetPassword : handleRequestCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={brand.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>
              {pendingCode ? '비밀번호 재설정' : '인증 코드 받기'}
            </Text>
          )}
        </Pressable>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: typography.size.base, textAlign: 'center' },
  card: { padding: spacing.md, marginBottom: spacing.md },
  inputGroup: { gap: spacing.sm },
  passwordGroup: { marginTop: spacing.md },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: brand.primaryForeground,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
