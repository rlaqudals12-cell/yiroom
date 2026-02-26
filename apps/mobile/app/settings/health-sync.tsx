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

import { useHealthData } from '@/hooks/useHealthData';
import { useTheme } from '@/lib/theme';

export default function HealthSyncScreen() {
  const { colors } = useTheme();

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
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
        testID="settings-health-sync-screen"
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* 플랫폼 체크 */}
          {!isAvailable && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.warningText, { color: colors.foreground }]}>
                ⚠️ {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}를 사용할 수 없습니다.
                {'\n'}시뮬레이터에서는 Mock 데이터로 테스트됩니다.
              </Text>
            </View>
          )}

          {/* 연동 토글 */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {info.icon} {info.name} 연동
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
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
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📊 연동 데이터</Text>
              <View style={styles.dataList}>
                <DataItem label="걸음수" emoji="👟" />
                <DataItem label="활동 칼로리" emoji="🔥" />
                <DataItem label="심박수" emoji="❤️" />
                <DataItem label="수면" emoji="😴" />
              </View>
            </View>
          )}

          {/* 오늘의 데이터 */}
          {isEnabled && todayData && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📈 오늘의 데이터</Text>
              <View style={styles.statsGrid}>
                <StatItem label="걸음" value={todayData.steps.toLocaleString()} />
                <StatItem
                  label="칼로리"
                  value={`${todayData.activeCalories}kcal`}
                />
                <StatItem
                  label="심박"
                  value={todayData.heartRate ? `${todayData.heartRate.average}bpm` : '-'}
                />
                <StatItem
                  label="수면"
                  value={
                    todayData.sleep
                      ? `${Math.round(todayData.sleep.totalSleepMinutes / 60)}시간`
                      : '-'
                  }
                />
              </View>
            </View>
          )}

          {/* 동기화 상태 */}
          {isEnabled && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.syncRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    🔄 마지막 동기화
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
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
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              🔒 건강 데이터는 안전하게 암호화되어 저장됩니다.
              {'\n'}설정 {'>'} 개인정보 보호에서 권한을 관리할 수 있습니다.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function DataItem({ label, emoji }: { label: string; emoji: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataEmoji}>{emoji}</Text>
      <Text style={[styles.dataLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={styles.checkmark}>✓</Text>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  warningText: {
    fontSize: 14,
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
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
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
    textAlign: 'center',
    lineHeight: 18,
  },
});
