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
import { getClerkErrorKey, useTranslation } from '@/lib/i18n';
import { brand, radii, spacing, typography, useTheme } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pendingCode, setPendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!isLoaded) return;
    if (!email.trim()) {
      Alert.alert(
        t('auth.mobileForgotPassword.alertTitle'),
        t('auth.mobileForgotPassword.emailRequired')
      );
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
      Alert.alert(
        t('auth.mobileForgotPassword.resetFailureTitle'),
        t(getClerkErrorKey(error, 'auth.mobileForgotPassword.requestFailure'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;
    if (!code || !password) {
      Alert.alert(
        t('auth.mobileForgotPassword.alertTitle'),
        t('auth.mobileForgotPassword.fieldsRequired')
      );
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
      Alert.alert(
        t('auth.mobileForgotPassword.resetFailureTitle'),
        t('auth.mobileForgotPassword.resetFailureRetry')
      );
    } catch (error: unknown) {
      Alert.alert(
        t('auth.mobileForgotPassword.resetFailureTitle'),
        t(getClerkErrorKey(error, 'auth.mobileForgotPassword.resetFailure'))
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
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('auth.mobileForgotPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {pendingCode
              ? t('auth.mobileForgotPassword.verifyDescription', { email: email.trim() })
              : t('auth.mobileForgotPassword.requestDescription')}
          </Text>
        </View>

        <GlassCard shadowSize="md" style={styles.card}>
          {!pendingCode ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('auth.mobileForgotPassword.emailLabel')}
              </Text>
              <TextInput
                testID="forgot-password-email-input"
                style={[styles.input, inputStyle]}
                placeholder={t('auth.mobileForgotPassword.emailPlaceholder')}
                accessibilityLabel={t('auth.mobileForgotPassword.emailLabel')}
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
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('auth.mobileForgotPassword.codeLabel')}
                </Text>
                <TextInput
                  testID="forgot-password-code-input"
                  style={[styles.input, inputStyle]}
                  placeholder={t('auth.mobileForgotPassword.codePlaceholder')}
                  accessibilityLabel={t('auth.mobileForgotPassword.codeLabel')}
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={[styles.inputGroup, styles.passwordGroup]}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('auth.mobileForgotPassword.newPasswordLabel')}
                </Text>
                <TextInput
                  testID="forgot-password-new-password-input"
                  style={[styles.input, inputStyle]}
                  placeholder={t('auth.mobileForgotPassword.newPasswordPlaceholder')}
                  accessibilityLabel={t('auth.mobileForgotPassword.newPasswordLabel')}
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
          accessibilityRole="button"
          accessibilityLabel={
            pendingCode
              ? t('auth.mobileForgotPassword.resetPassword')
              : t('auth.mobileForgotPassword.requestCode')
          }
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={brand.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>
              {pendingCode
                ? t('auth.mobileForgotPassword.resetPassword')
                : t('auth.mobileForgotPassword.requestCode')}
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
