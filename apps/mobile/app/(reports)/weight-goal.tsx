/**
 * 체중 목표 관리 화면
 * 체중 기록 + 목표 설정 + 트렌드 표시
 */
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer, DataStateWrapper, GlassCard } from '@/components/ui';

import { TIMING } from '../../lib/animations';
import { useTheme, spacing } from '../../lib/theme';

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

interface WeightGoal {
  targetWeight: number;
  startWeight: number;
  startDate: string;
}

export default function WeightGoalScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [entries] = useState<WeightEntry[]>([]);
  const [goal] = useState<WeightGoal | null>(null);
  const [isLoading] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const fetchData = useCallback(async () => {
    // 체중 저장 API가 생기기 전에는 존재하지 않는 테이블을 조회하지 않는다.
  }, []);

  // 체중 기록
  const handleLogWeight = async (): Promise<void> => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 20 || weight > 300) {
      Alert.alert('오류', '올바른 체중을 입력해주세요 (20~300kg)');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('기능 준비 중', '체중 기록 저장은 현재 지원하지 않아요.');
  };

  // 목표 설정
  const handleSetGoal = async (): Promise<void> => {
    const target = parseFloat(targetWeight);
    if (isNaN(target) || target < 20 || target > 300) {
      Alert.alert('오류', '올바른 목표 체중을 입력해주세요');
      return;
    }

    Alert.alert('기능 준비 중', '체중 목표 저장은 현재 지원하지 않아요.');
  };

  const formatDateKo = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const latestWeight = entries[0]?.weight ?? 0;
  const progressPercent = goal
    ? Math.min(
        Math.round(
          (Math.abs(goal.startWeight - latestWeight) /
            Math.max(Math.abs(goal.startWeight - goal.targetWeight), 0.1)) *
            100
        ),
        100
      )
    : 0;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={spacing.md}
      testID="weight-goal-screen"
      backgroundGradient="records"
      contentContainerStyle={{ gap: spacing.md }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper isLoading={isLoading} isEmpty={false}>
        <GlassCard shadowSize="md" style={{ ...styles.card }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
            }}
          >
            체중 기록 저장은 현재 지원하지 않아요.
          </Text>
        </GlassCard>

        {/* 현재 상태 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.card }}>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.foreground,
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              현재 체중
            </Text>
            {latestWeight > 0 ? (
              <View style={styles.currentWeightRow}>
                <Text
                  style={[
                    styles.bigWeight,
                    {
                      color: brand.primary,
                      fontSize: typography.size['4xl'],
                      fontWeight: typography.weight.bold,
                    },
                  ]}
                >
                  {latestWeight}
                </Text>
                <Text
                  style={[
                    styles.weightUnit,
                    { color: colors.mutedForeground, fontSize: typography.size.lg },
                  ]}
                >
                  kg
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.noData,
                  { color: colors.mutedForeground, fontSize: typography.size.sm },
                ]}
              >
                저장 기능 준비 중이에요
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* 목표 진행 */}
        {goal && (
          <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ ...styles.card }}>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.foreground,
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                목표 진행
              </Text>
              <View style={styles.goalRow}>
                <Text
                  style={[
                    styles.goalLabel,
                    { color: colors.mutedForeground, fontSize: typography.size.sm },
                  ]}
                >
                  시작: {goal.startWeight}kg
                </Text>
                <Text
                  style={[
                    styles.goalLabel,
                    { color: colors.mutedForeground, fontSize: typography.size.sm },
                  ]}
                >
                  목표: {goal.targetWeight}kg
                </Text>
              </View>
              <View
                style={[styles.goalTrack, { backgroundColor: colors.muted, marginTop: spacing.sm }]}
              >
                <View
                  style={[
                    styles.goalFill,
                    {
                      backgroundColor: brand.primary,
                      width: `${progressPercent}%`,
                      borderRadius: radii.full,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.goalPercent,
                  {
                    color: brand.primary,
                    fontWeight: typography.weight.bold,
                    fontSize: typography.size.sm,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                {progressPercent}% 달성
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* 체중 입력 */}
        <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.card }}>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.foreground,
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              오늘 체중 기록
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.weightInput,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderRadius: radii.xl,
                    fontSize: typography.size.xl,
                  },
                ]}
                placeholder="65.0"
                placeholderTextColor={colors.mutedForeground}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                editable={false}
                testID="weight-input"
              />
              <Text
                style={[
                  styles.kgLabel,
                  { color: colors.mutedForeground, fontSize: typography.size.lg },
                ]}
              >
                kg
              </Text>
              <Pressable
                style={[
                  styles.logButton,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: radii.xl,
                  },
                ]}
                onPress={handleLogWeight}
                disabled
                testID="weight-log-button"
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontWeight: typography.weight.bold,
                  }}
                >
                  기록
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 목표 설정 */}
        {!goal && (
          <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ ...styles.card }}>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.foreground,
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                목표 설정
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.weightInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderRadius: radii.xl,
                      fontSize: typography.size.xl,
                    },
                  ]}
                  placeholder="60.0"
                  placeholderTextColor={colors.mutedForeground}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="decimal-pad"
                  editable={false}
                  testID="target-weight-input"
                />
                <Text
                  style={[
                    styles.kgLabel,
                    { color: colors.mutedForeground, fontSize: typography.size.lg },
                  ]}
                >
                  kg
                </Text>
                <Pressable
                  style={[
                    styles.logButton,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: radii.xl,
                    },
                  ]}
                  onPress={handleSetGoal}
                  disabled
                  testID="goal-set-button"
                >
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontWeight: typography.weight.bold,
                    }}
                  >
                    설정
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* 최근 기록 */}
        {entries.length > 0 && (
          <Animated.View entering={FadeInUp.delay(320).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ ...styles.card }}>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.foreground,
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                최근 기록
              </Text>
              {entries.slice(0, 10).map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryRow, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[
                      styles.entryDate,
                      { color: colors.mutedForeground, fontSize: typography.size.sm },
                    ]}
                  >
                    {formatDateKo(entry.date)}
                  </Text>
                  <Text
                    style={[
                      styles.entryWeight,
                      {
                        color: colors.foreground,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                      },
                    ]}
                  >
                    {entry.weight} kg
                  </Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  cardTitle: { marginBottom: spacing.smx },
  currentWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  bigWeight: {},
  weightUnit: {},
  noData: {},
  goalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: {},
  goalTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  goalFill: { height: '100%' },
  goalPercent: { textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weightInput: { flex: 1, padding: spacing.smx, textAlign: 'center' },
  kgLabel: {},
  logButton: { paddingHorizontal: spacing.mlg, paddingVertical: spacing.smx },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.smd,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryDate: {},
  entryWeight: {},
});
