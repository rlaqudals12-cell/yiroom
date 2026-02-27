/**
 * 오프라인 상태 배너
 * 네트워크 연결 끊김 시 표시
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';

import { useNetworkStatus } from '../../lib/offline';
import { useTheme, typography, radii , spacing } from '../../lib/theme';

interface OfflineBannerProps {
  // 동기화 대기 항목 수
  pendingCount?: number;
  // 동기화 버튼 클릭 시
  onSync?: () => void;
  // 동기화 중 여부
  isSyncing?: boolean;
}

export function OfflineBanner({ pendingCount = 0, onSync, isSyncing = false }: OfflineBannerProps) {
  const { colors, brand, status, typography } = useTheme();
  const { isConnected } = useNetworkStatus();

  const slideAnim = useRef(new Animated.Value(-60)).current;
  const isVisible = !isConnected || pendingCount > 0;

  // 애니메이션
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : -60,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [isVisible, slideAnim]);

  const handleSync = () => {
    if (onSync && isConnected && !isSyncing) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSync();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      testID="offline-banner"
      style={[
        styles.container,
        { backgroundColor: isConnected ? status.warning + '20' : status.error + '20' },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isConnected ? '🔄' : '📡'}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isConnected ? '동기화 대기 중' : '오프라인 모드'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {isConnected ? `${pendingCount}개 항목 동기화 필요` : '인터넷 연결을 확인해주세요'}
          </Text>
        </View>
      </View>

      {isConnected && pendingCount > 0 && (
        <Pressable
          style={[styles.syncButton, { backgroundColor: brand.primary }, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Text style={[styles.syncButtonText, { color: brand.primaryForeground }]}>
            {isSyncing ? '동기화 중...' : '동기화'}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: typography.weight.semibold,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginLeft: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
  },
});
