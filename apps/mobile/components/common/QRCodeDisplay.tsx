/**
 * QR 코드 표시 컴포넌트
 *
 * QR 데이터를 표시하고 공유 기능 제공
 * (실제 QR 렌더링은 react-native-qrcode-svg 등 추가 필요)
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Share, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface QRCodeDisplayProps {
  /** QR에 인코딩할 데이터 (URL) */
  value: string;
  /** QR 코드 크기 */
  size?: number;
  /** 제목 */
  title?: string;
  /** 설명 */
  description?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 상태 */
  error?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  title,
  description,
  isLoading = false,
  error,
}: QRCodeDisplayProps): React.ReactElement {
  const { colors, brand, status, typography } = useTheme();

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: value,
        title: title ?? 'QR 코드 공유',
      });
    } catch {
      // 공유 취소
    }
  }, [value, title]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="qr-code-display"
      accessibilityLabel={`QR 코드: ${title ?? value}`}
    >
      {/* 제목 */}
      {title && (
        <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.lg }]}>
          {title}
        </Text>
      )}

      {/* QR 영역 */}
      <View style={[styles.qrArea, { width: size, height: size }]}>
        {isLoading ? (
          <ActivityIndicator size="large" color={brand.primary} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { color: colors.destructive, fontSize: typography.size.sm }]}>
              {error}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.qrPlaceholder,
              {
                width: size - 16,
                height: size - 16,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            accessibilityLabel="QR 코드 이미지"
          >
            {/* QR 라이브러리 설치 시 실제 QR 렌더링으로 교체 */}
            <Text style={[styles.qrPlaceholderText, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              QR
            </Text>
            <Text
              style={[styles.qrUrl, { color: brand.primary, fontSize: typography.size.xs }]}
              numberOfLines={2}
            >
              {value}
            </Text>
          </View>
        )}
      </View>

      {/* 설명 */}
      {description && (
        <Text style={[styles.description, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
          {description}
        </Text>
      )}

      {/* 공유 버튼 */}
      {!isLoading && !error && (
        <Pressable
          onPress={handleShare}
          style={[styles.shareButton, { backgroundColor: brand.primary }]}
          accessibilityRole="button"
          accessibilityLabel="QR 코드 링크 공유"
          testID="qr-share-button"
        >
          <Text style={[styles.shareText, { color: colors.overlayForeground, fontSize: typography.size.sm }]}>
            링크 공유
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  qrArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  qrPlaceholderText: {
    fontWeight: '700',
    marginBottom: 4,
  },
  qrUrl: {
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
  },
  shareButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shareText: {
    fontWeight: '600',
  },
});
