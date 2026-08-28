import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer } from '@/components/ui';
import {
  fetchImageStorageConsent,
  ImageStorageConsentApiError,
  saveImageStorageConsent,
} from '@/lib/api/image-storage-consent';
import { spacing, typography, useTheme } from '@/lib/theme';

type StorageGateStatus = 'checking' | 'allowed' | 'needs-consent' | 'check-failed';

interface TwinStorageConsentGateProps {
  children: ReactNode;
}

/** AI 아바타는 생성 결과 저장이 기능 자체이므로, 명시 저장 동의 전에는 업로드 UI를 열지 않는다. */
export function TwinStorageConsentGate({
  children,
}: TwinStorageConsentGateProps): React.JSX.Element {
  const { getToken, userId } = useAuth();
  const { colors } = useTheme();
  const [status, setStatus] = useState<StorageGateStatus>('checking');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkConsent = async (): Promise<void> => {
    setStatus('checking');
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) {
        setStatus('check-failed');
        setMessage('로그인 정보를 확인할 수 없어요. 다시 로그인해주세요.');
        return;
      }
      const active = await fetchImageStorageConsent('twin', token);
      setStatus(active ? 'allowed' : 'needs-consent');
    } catch {
      setStatus('check-failed');
      setMessage('저장 동의 상태를 확인하지 못했어요. 네트워크 연결 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    void checkConsent();
    // 계정이 바뀌면 이전 계정의 저장 동의를 재사용하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const agree = async (): Promise<void> => {
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) {
        setMessage('로그인 정보가 만료됐어요. 다시 로그인해주세요.');
        return;
      }
      await saveImageStorageConsent('twin', token);
      setStatus('allowed');
    } catch (error) {
      setMessage(
        error instanceof ImageStorageConsentApiError
          ? error.message
          : '저장 동의를 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (status === 'allowed') return <>{children}</>;

  if (status === 'checking') {
    return (
      <View
        accessibilityLabel="AI 아바타 저장 동의 확인 중"
        style={styles.loading}
        testID="twin-storage-consent-loading"
      >
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <ScreenContainer testID="twin-storage-consent-gate">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>AI 아바타 저장 동의</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          셀카와 선택한 전신 사진은 아바타 생성을 위해 이룸 서버를 거쳐 Google AI로 전송되며, 원본
          사진은 저장하지 않아요. 생성된 AI 아바타는 동의일로부터 최대 1년간 암호화된 비공개
          저장소에 보관하고 개인정보 설정에서 언제든 삭제할 수 있어요.
        </Text>

        {message ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>
            {message}
          </Text>
        ) : null}

        {status === 'needs-consent' ? (
          <Button
            isLoading={saving}
            onPress={() => void agree()}
            testID="twin-storage-consent-agree"
          >
            동의하고 계속
          </Button>
        ) : (
          <Button
            isLoading={saving}
            onPress={() => void checkConsent()}
            testID="twin-storage-consent-retry"
            variant="outline"
          >
            다시 확인
          </Button>
        )}
        <Button
          disabled={saving}
          onPress={() => router.back()}
          testID="twin-storage-consent-cancel"
          variant="ghost"
        >
          지금은 만들지 않기
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  error: {
    fontSize: typography.size.sm,
  },
});
