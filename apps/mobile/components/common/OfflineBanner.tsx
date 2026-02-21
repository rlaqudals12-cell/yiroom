/**
 * 오프라인 상태 배너
 * 네트워크 연결 끊김 시 표시
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, useColorScheme } from 'react-native';

import { useNetworkStatus } from '../../lib/offline';

interface OfflineBannerProps {
  // 동기화 대기 항목 수
  pendingCount?: number;
  // 동기화 버튼 클릭 시
  onSync?: () => void;
  // 동기화 중 여부
  isSyncing?: boolean;
}

export function OfflineBanner({ pendingCount = 0, onSync, isSyncing = false }: OfflineBannerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      style={[
        styles.container,
        isDark && styles.containerDark,
        !isConnected && styles.containerOffline,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isConnected ? '🔄' : '📡'}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDark && styles.textLight]}>
            {isConnected ? '동기화 대기 중' : '오프라인 모드'}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            {isConnected ? `${pendingCount}개 항목 동기화 필요` : '인터넷 연결을 확인해주세요'}
          </Text>
        </View>
      </View>

      {isConnected && pendingCount > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>{isSyncing ? '동기화 중...' : '동기화'}</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
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
  containerDark: {
    backgroundColor: '#3a3a1a',
  },
  containerOffline: {
    backgroundColor: '#fee2e2',
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
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#F8C8DC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
