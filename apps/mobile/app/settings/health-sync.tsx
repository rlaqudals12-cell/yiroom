/**
 * 건강 데이터 연동 설정 화면
 * Apple Health (iOS) + Google Fit (Android) 지원
 */

import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';

import { useHealthData } from '@/hooks/useHealthData';

export default function HealthSyncScreen() {
  const { colors, isDark } = useTheme();

  const {
    isAvailable,
    isEnabled,
    isLoading,
    isSyncing,
    lastSyncTime,
    todayData,
    platform,
    enable,
    disable,
    refresh: _refresh,
    sync,
  } = useHealthData();

  // 플랫폼별 제목과 아이콘
  const platformInfo = {
    apple: { title: 'Apple Health 연동', icon: '❤️', name: 'Apple Health' },
    google: { title: 'Google Fit 연동', icon: '💚', name: 'Google Fit' },
    null: { title: '건강 데이터 연동', icon: '📊', name: '건강 앱' },
  };
  const info = platformInfo[platform ?? 'null'];

  const handleToggle = async (value: boolean) => {
    Haptics.selectionAsync();
    if (value) {
      await enable();
    } else {
      await disable();
    }
  };

  const handleSync = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sync();
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '없음';
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: info.title,
          headerBackTitle: '설정',
        }}
      />
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 플랫폼 체크 */}
          {!isAvailable && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.warningText, isDark && styles.textLight]}>
                ⚠️ {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}를 사용할 수 없습니다.
                {'\n'}시뮬레이터에서는 Mock 데이터로 테스트됩니다.
              </Text>
            </View>
          )}

          {/* 연동 토글 */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.cardTitle, isDark && styles.textLight]}>
                  {info.icon} {info.name} 연동
                </Text>
                <Text style={[styles.cardSubtitle, isDark && styles.textMuted]}>
                  걸음수, 심박수, 수면 데이터 동기화
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                disabled={isLoading}
                trackColor={{
                  false: '#767577',
                  true: platform === 'google' ? '#34A853' : '#4CD964',
                }}
              />
            </View>
          </View>

          {/* 연동 데이터 설명 */}
          {isEnabled && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>📊 연동 데이터</Text>
              <View style={styles.dataList}>
                <DataItem label="걸음수" emoji="👟" isDark={isDark} />
                <DataItem label="활동 칼로리" emoji="🔥" isDark={isDark} />
                <DataItem label="심박수" emoji="❤️" isDark={isDark} />
                <DataItem label="수면" emoji="😴" isDark={isDark} />
              </View>
            </View>
          )}

          {/* 오늘의 데이터 */}
          {isEnabled && todayData && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>📈 오늘의 데이터</Text>
              <View style={styles.statsGrid}>
                <StatItem label="걸음" value={todayData.steps.toLocaleString()} isDark={isDark} />
                <StatItem
                  label="칼로리"
                  value={`${todayData.activeCalories}kcal`}
                  isDark={isDark}
                />
                <StatItem
                  label="심박"
                  value={todayData.heartRate ? `${todayData.heartRate.average}bpm` : '-'}
                  isDark={isDark}
                />
                <StatItem
                  label="수면"
                  value={
                    todayData.sleep
                      ? `${Math.round(todayData.sleep.totalSleepMinutes / 60)}시간`
                      : '-'
                  }
                  isDark={isDark}
                />
              </View>
            </View>
          )}

          {/* 동기화 상태 */}
          {isEnabled && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.syncRow}>
                <View>
                  <Text style={[styles.cardTitle, isDark && styles.textLight]}>
                    🔄 마지막 동기화
                  </Text>
                  <Text style={[styles.cardSubtitle, isDark && styles.textMuted]}>
                    {formatTime(lastSyncTime)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
                  onPress={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.syncButtonText}>동기화</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 개인정보 안내 */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.textMuted]}>
              🔒 건강 데이터는 안전하게 암호화되어 저장됩니다.
              {'\n'}설정 {'>'} 개인정보 보호에서 권한을 관리할 수 있습니다.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function DataItem({ label, emoji, isDark }: { label: string; emoji: string; isDark: boolean }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataEmoji}>{emoji}</Text>
      <Text style={[styles.dataLabel, isDark && styles.textLight]}>{label}</Text>
      <Text style={styles.checkmark}>✓</Text>
    </View>
  );
}

function StatItem({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, isDark && styles.textLight]}>{value}</Text>
      <Text style={[styles.statLabel, isDark && styles.textMuted]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#888',
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataList: {
    marginTop: 12,
    gap: 8,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataEmoji: {
    fontSize: 20,
  },
  dataLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CD964',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
