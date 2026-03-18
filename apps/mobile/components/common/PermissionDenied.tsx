/**
 * 카메라 권한 거부 시 사용자 안내 컴포넌트
 *
 * 권한 재요청, 시스템 설정 열기, 갤러리 대안을 제공하여
 * 사용자가 분석을 이어갈 수 있도록 안내한다.
 */
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, typography, radii, spacing } from '@/lib/theme';

interface PermissionDeniedProps {
  /** 분석 유형 설명 (예: "퍼스널 컬러 진단", "피부 분석") */
  analysisLabel: string;
  /** 카메라 권한 재요청 콜백 */
  onRequestPermission: () => void;
  /** 갤러리 선택 콜백 */
  onPickFromGallery: () => void;
  /** 권한을 다시 요청할 수 있는지 여부 (canAskAgain) — 없으면 true 가정 */
  canAskAgain?: boolean;
}

export function PermissionDenied({
  analysisLabel,
  onRequestPermission,
  onPickFromGallery,
  canAskAgain = true,
}: PermissionDeniedProps): React.JSX.Element {
  const { colors, brand, isDark } = useTheme();

  // 시스템 앱 설정 열기
  function openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  return (
    <View
      testID="permission-denied"
      accessibilityLabel="카메라 권한이 필요합니다"
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* GlassCard */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          },
        ]}
      >
        {/* 아이콘 */}
        <View
          style={[styles.iconCircle, { backgroundColor: `${brand.primary}20` }]}
          accessibilityElementsHidden
        >
          <Text style={styles.iconEmoji}>📷</Text>
        </View>

        {/* 제목 */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          카메라 권한이 필요해요
        </Text>

        {/* 설명 */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          정확한 {analysisLabel}을 위해 카메라가{'\n'}필요해요.{' '}
          {canAskAgain ? '아래 버튼으로 허용해주세요.' : '설정에서 허용해주세요.'}
        </Text>

        {/* 버튼 영역 */}
        <View style={styles.buttonRow}>
          {canAskAgain ? (
            <Pressable
              testID="permission-request-button"
              accessibilityLabel="카메라 권한 허용하기"
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: brand.primary }]}
              onPress={onRequestPermission}
            >
              <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
                권한 허용하기
              </Text>
            </Pressable>
          ) : (
            <Pressable
              testID="permission-settings-button"
              accessibilityLabel="시스템 설정 열기"
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: brand.primary }]}
              onPress={openAppSettings}
            >
              <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
                설정 열기
              </Text>
            </Pressable>
          )}

          <Pressable
            testID="permission-gallery-button"
            accessibilityLabel="갤러리에서 사진 선택하기"
            accessibilityRole="button"
            style={[
              styles.secondaryButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border,
              },
            ]}
            onPress={onPickFromGallery}
          >
            <Text style={[styles.secondaryButtonText, { color: brand.primary }]}>
              갤러리에서 선택
            </Text>
          </Pressable>
        </View>

        {/* 하단 안내 */}
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          나중에 설정 {'>'} 앱 {'>'} 이룸에서도 변경할 수 있어요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.mlg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    width: '100%',
    gap: spacing.smx,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  hint: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
