/**
 * 단식 트래커 화면
 *
 * 간헐적 단식(IF) 타이머 및 기록.
 * - 단식 시작/종료 타이머
 * - 단식 패턴 선택 (16:8, 18:6, 20:4, OMAD)
 * - 최근 단식 기록
 */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Clock, Play, Square, History, Utensils, Timer } from 'lucide-react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer, DataStateWrapper, GlassCard } from '@/components/ui';
import { staggeredEntry } from '@/lib/animations';
import { completeFastingSession, getFastingSessions, startFastingSession } from '@/lib/api/fasting';
import { useTheme, typography, spacing } from '@/lib/theme';

import { nutritionLogger } from '../../../lib/utils/logger';

interface FastingPattern {
  id: string;
  label: string;
  fastHours: number;
  eatHours: number;
  description: string;
}

const FASTING_PATTERNS: FastingPattern[] = [
  { id: '16-8', label: '16:8', fastHours: 16, eatHours: 8, description: '가장 일반적인 패턴' },
  { id: '18-6', label: '18:6', fastHours: 18, eatHours: 6, description: '중급자 추천' },
  { id: '20-4', label: '20:4', fastHours: 20, eatHours: 4, description: '상급자 패턴' },
  { id: 'omad', label: 'OMAD', fastHours: 23, eatHours: 1, description: '하루 한 끼' },
];

interface FastingLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  pattern: string;
  durationMinutes: number | null;
  completed: boolean;
}

type FastingState = 'idle' | 'fasting' | 'loading';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

export default function FastingTrackerScreen(): React.JSX.Element {
  const { colors, radii, status, shadows, isDark, module: moduleColors } = useTheme();
  const nutritionColor = moduleColors.nutrition.base;
  const { getToken } = useAuth();

  const [selectedPattern, setSelectedPattern] = useState<FastingPattern>(FASTING_PATTERNS[0]);
  const [fastingState, setFastingState] = useState<FastingState>('loading');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<FastingLog[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 진행 중인 단식 및 이전 기록 로드
  const loadData = useCallback(async () => {
    setFastingState('loading');
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const { activeSession: active, history } = await getFastingSessions(token);

      if (active) {
        setActiveSessionId(active.id);
        setStartTime(new Date(active.start_time));
        const pattern =
          FASTING_PATTERNS.find((p) => p.fastHours === active.target_hours) ?? FASTING_PATTERNS[0];
        setSelectedPattern(pattern);
        setFastingState('fasting');
      } else {
        setActiveSessionId(null);
        setStartTime(null);
        setFastingState('idle');
      }

      setLogs(
        history
          .filter((item) => item.end_time)
          .map((item) => ({
            id: item.id,
            startedAt: item.start_time,
            endedAt: item.end_time,
            pattern:
              FASTING_PATTERNS.find((pattern) => pattern.fastHours === item.target_hours)?.id ??
              `${item.target_hours}h`,
            durationMinutes: item.actual_hours == null ? null : Math.round(item.actual_hours * 60),
            completed: item.is_completed,
          }))
      );
    } catch (err) {
      nutritionLogger.error('Fasting data load failed:', err);
      setFastingState('idle');
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 타이머 인터벌
  useEffect(() => {
    if (fastingState === 'fasting' && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsed(diff);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fastingState, startTime]);

  const handleStartFasting = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const session = await startFastingSession(token, selectedPattern.fastHours);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveSessionId(session.id);
      setStartTime(new Date(session.start_time));
      setElapsed(0);
      setFastingState('fasting');
    } catch (err) {
      nutritionLogger.error('Start fasting failed:', err);
      Alert.alert('저장 실패', '단식을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }, [getToken, selectedPattern]);

  const handleStopFasting = useCallback(async () => {
    if (!startTime || !activeSessionId) return;
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const targetMinutes = selectedPattern.fastHours * 60;
    const completed = durationMinutes >= targetMinutes;

    Haptics.notificationAsync(
      completed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      await completeFastingSession(token, activeSessionId);

      setFastingState('idle');
      setActiveSessionId(null);
      setStartTime(null);
      setElapsed(0);
      await loadData();
    } catch (err) {
      nutritionLogger.error('Stop fasting failed:', err);
      Alert.alert('저장 실패', '단식 종료를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }, [startTime, activeSessionId, selectedPattern, getToken, loadData]);

  const targetSeconds = selectedPattern.fastHours * 3600;
  const progress = fastingState === 'fasting' ? Math.min(elapsed / targetSeconds, 1) : 0;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return (
    <ScreenContainer
      testID="fasting-tracker-screen"
      edges={['bottom']}
      contentPadding={spacing.md}
      backgroundGradient="nutrition"
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper isLoading={fastingState === 'loading'} isEmpty={false}>
        {/* 타이머 카드 */}
        <Animated.View
          entering={staggeredEntry(0)}
          style={[
            shadows.card,
            {
              backgroundColor: fastingState === 'fasting' ? nutritionColor : colors.card,
              borderRadius: radii.xl,
              padding: spacing.xl,
              marginBottom: spacing.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: fastingState === 'fasting' ? nutritionColor : colors.border,
            },
          ]}
        >
          <Timer
            size={32}
            color={fastingState === 'fasting' ? colors.overlayForeground : nutritionColor}
          />
          <Text
            style={{
              fontSize: 48,
              fontWeight: typography.weight.bold,
              color: fastingState === 'fasting' ? colors.overlayForeground : colors.foreground,
              marginTop: spacing.md,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatDuration(elapsed)}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color:
                fastingState === 'fasting'
                  ? `${colors.overlayForeground}CC`
                  : colors.mutedForeground,
              marginTop: spacing.xs,
            }}
          >
            {fastingState === 'fasting'
              ? `목표 ${selectedPattern.fastHours}시간 중 ${Math.floor(elapsed / 3600)}시간 ${Math.floor((elapsed % 3600) / 60)}분`
              : '단식을 시작해보세요'}
          </Text>

          {/* 프로그레스 바 */}
          {fastingState === 'fasting' && (
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: `${colors.overlayForeground}33`,
                  borderRadius: radii.sm,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.overlayForeground,
                    borderRadius: radii.sm,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
          )}

          {/* 시작/종료 버튼 */}
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  fastingState === 'fasting' ? `${colors.overlayForeground}40` : nutritionColor,
                borderRadius: radii.full,
                marginTop: spacing.lg,
              },
              fastingState !== 'fasting' && !isDark
                ? (Platform.select({
                    ios: {
                      shadowColor: nutritionColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                    },
                    android: { elevation: 4 },
                  }) ?? {})
                : {},
            ]}
            onPress={fastingState === 'fasting' ? handleStopFasting : handleStartFasting}
          >
            {fastingState === 'fasting' ? (
              <>
                <Square size={18} color={colors.overlayForeground} />
                <Text
                  style={[
                    styles.actionText,
                    { color: colors.overlayForeground, marginLeft: spacing.xs },
                  ]}
                >
                  단식 종료
                </Text>
              </>
            ) : (
              <>
                <Play size={18} color={colors.overlayForeground} />
                <Text
                  style={[
                    styles.actionText,
                    { color: colors.overlayForeground, marginLeft: spacing.xs },
                  ]}
                >
                  단식 시작
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* 패턴 선택 (단식 중이 아닐 때만) */}
        {fastingState === 'idle' && (
          <Animated.View entering={staggeredEntry(1)}>
            <GlassCard shadowSize="md" style={{ marginBottom: spacing.md }}>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                  color: colors.foreground,
                  marginBottom: spacing.sm,
                }}
              >
                단식 패턴 선택
              </Text>
            </GlassCard>
            <View style={[styles.patternGrid, { gap: spacing.sm }]}>
              {FASTING_PATTERNS.map((pattern) => {
                const isSelected = pattern.id === selectedPattern.id;
                return (
                  <Pressable
                    key={pattern.id}
                    style={[
                      styles.patternCard,
                      shadows.card,
                      {
                        backgroundColor: isSelected ? nutritionColor : colors.card,
                        borderRadius: radii.xl,
                        borderWidth: 1,
                        borderColor: isSelected ? nutritionColor : colors.border,
                        padding: spacing.md,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedPattern(pattern);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.bold,
                        color: isSelected ? colors.overlayForeground : colors.foreground,
                      }}
                    >
                      {pattern.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: isSelected
                          ? `${colors.overlayForeground}CC`
                          : colors.mutedForeground,
                        marginTop: spacing.xxs,
                      }}
                    >
                      {pattern.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* 최근 기록 */}
        {logs.length > 0 && (
          <Animated.View entering={staggeredEntry(2)} style={{ marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <History size={16} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                  color: colors.foreground,
                  marginLeft: spacing.xs,
                }}
              >
                최근 기록
              </Text>
            </View>
            {logs.map((log) => {
              const pattern = FASTING_PATTERNS.find((p) => p.id === log.pattern);
              const hours = log.durationMinutes != null ? Math.floor(log.durationMinutes / 60) : 0;
              const mins = log.durationMinutes != null ? log.durationMinutes % 60 : 0;

              return (
                <View
                  key={log.id}
                  style={[
                    shadows.card,
                    {
                      backgroundColor: colors.card,
                      borderRadius: radii.xl,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.logIcon,
                      {
                        backgroundColor: log.completed
                          ? status.success + '20'
                          : status.warning + '20',
                        borderRadius: radii.xl,
                      },
                    ]}
                  >
                    {log.completed ? (
                      <Utensils size={16} color={status.success} />
                    ) : (
                      <Clock size={16} color={status.warning} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: typography.size.sm,
                          fontWeight: typography.weight.semibold,
                          color: colors.foreground,
                        }}
                      >
                        {pattern?.label ?? log.pattern}
                      </Text>
                      {log.completed && (
                        <View
                          style={[
                            styles.completeBadge,
                            {
                              backgroundColor: status.success + '20',
                              borderRadius: radii.sm,
                              marginLeft: spacing.xs,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: status.success,
                              fontWeight: typography.weight.semibold,
                            }}
                          >
                            완료
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                        marginTop: spacing.xxs,
                      }}
                    >
                      {formatRelativeDate(log.startedAt)} · {hours}시간 {mins}분
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* 빈 상태 */}
        {logs.length === 0 && fastingState === 'idle' && (
          <Animated.View
            entering={staggeredEntry(2)}
            style={[styles.center, { paddingVertical: spacing.xxl }]}
          >
            <Clock size={48} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginTop: spacing.md,
              }}
            >
              아직 단식 기록이 없어요
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginTop: spacing.xs,
                textAlign: 'center',
              }}
            >
              패턴을 선택하고 단식을 시작해보세요
            </Text>
          </Animated.View>
        )}
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  progressFill: {
    height: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  actionText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patternCard: {
    width: '48%',
  },
  logIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBadge: {
    paddingHorizontal: 6,
    paddingVertical: spacing.xxs,
  },
});
