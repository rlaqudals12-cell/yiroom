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
  ScrollView,
} from 'react-native';

import { brand, useTheme, typography} from '@/lib/theme';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors, typography } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const errorMessage = clerkError.errors?.[0]?.message || '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  return (
    <KeyboardAvoidingView
      testID="auth-signin-screen"
      style={[styles.container, { backgroundColor: colors.card }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>이룸</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            온전한 나를 만나다
          </Text>
        </View>

        <View style={styles.form}>
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

          <View style={styles.inputContainer}>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: brand.primaryForeground,
    fontSize: 16,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    color: brand.primary,
    fontSize: 14,
    fontWeight: typography.weight.semibold,
  },
});
