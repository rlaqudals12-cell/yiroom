/**
 * 체중 목표 관리 화면
 * 체중 기록 + 목표 설정 + 트렌드 표시
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClerkSupabaseClient } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

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
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // 최근 30일 체중 기록
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('id, date, weight')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (weightData) {
        setEntries(
          weightData.map((w) => ({
            id: w.id,
            date: w.date,
            weight: w.weight,
          }))
        );
      }

      // 목표 조회
      const { data: goalData } = await supabase
        .from('weight_goals')
        .select('target_weight, start_weight, start_date')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalData) {
        setGoal({
          targetWeight: goalData.target_weight,
          startWeight: goalData.start_weight,
          startDate: goalData.start_date,
        });
        setTargetWeight(String(goalData.target_weight));
      }
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 체중 기록
  const handleLogWeight = async (): Promise<void> => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 20 || weight > 300 || !user?.id) {
      Alert.alert('오류', '올바른 체중을 입력해주세요 (20~300kg)');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 오늘 기록이 있으면 업데이트, 없으면 생성
      const { data: existing } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('weight_logs')
          .update({ weight })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('weight_logs')
          .insert({ clerk_user_id: user.id, date: today, weight });
      }

      Alert.alert('완료', '체중이 기록되었어요!');
      setNewWeight('');
      fetchData();
    } catch {
      Alert.alert('오류', '체중 기록에 실패했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 목표 설정
  const handleSetGoal = async (): Promise<void> => {
    const target = parseFloat(targetWeight);
    if (isNaN(target) || target < 20 || target > 300 || !user?.id) {
      Alert.alert('오류', '올바른 목표 체중을 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentWeight = entries[0]?.weight ?? 0;

      await supabase.from('weight_goals').insert({
        clerk_user_id: user.id,
        target_weight: target,
        start_weight: currentWeight,
        start_date: today,
      });

      Alert.alert('완료', '목표가 설정되었어요!');
      fetchData();
    } catch {
      Alert.alert('오류', '목표 설정에 실패했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateKo = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.center} testID="weight-goal-loading">
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="weight-goal-screen"
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg }}>
        {/* 현재 상태 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            현재 체중
          </Text>
          {latestWeight > 0 ? (
            <View style={styles.currentWeightRow}>
              <Text style={[styles.bigWeight, { color: brand.primary, fontSize: 36, fontWeight: typography.weight.bold }]}>
                {latestWeight}
              </Text>
              <Text style={[styles.weightUnit, { color: colors.mutedForeground, fontSize: typography.size.lg }]}>kg</Text>
            </View>
          ) : (
            <Text style={[styles.noData, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
              아직 체중 기록이 없어요
            </Text>
          )}
        </View>

        {/* 목표 진행 */}
        {goal && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
              목표 진행
            </Text>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                시작: {goal.startWeight}kg
              </Text>
              <Text style={[styles.goalLabel, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                목표: {goal.targetWeight}kg
              </Text>
            </View>
            <View style={[styles.goalTrack, { backgroundColor: colors.muted, marginTop: spacing.sm }]}>
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
            <Text style={[styles.goalPercent, { color: brand.primary, fontWeight: typography.weight.bold, fontSize: typography.size.sm, marginTop: spacing.xs }]}>
              {progressPercent}% 달성
            </Text>
          </View>
        )}

        {/* 체중 입력 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            오늘 체중 기록
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.weightInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderRadius: radii.lg,
                  fontSize: typography.size.xl,
                },
              ]}
              placeholder="65.0"
              placeholderTextColor={colors.mutedForeground}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              testID="weight-input"
            />
            <Text style={[styles.kgLabel, { color: colors.mutedForeground, fontSize: typography.size.lg }]}>kg</Text>
            <Pressable
              style={[
                styles.logButton,
                {
                  backgroundColor: newWeight.trim() ? brand.primary : colors.muted,
                  borderRadius: radii.lg,
                },
              ]}
              onPress={handleLogWeight}
              disabled={!newWeight.trim() || isSaving}
              testID="weight-log-button"
            >
              <Text style={{ color: newWeight.trim() ? brand.primaryForeground : colors.mutedForeground, fontWeight: typography.weight.bold }}>
                기록
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 목표 설정 */}
        {!goal && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
              목표 설정
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.weightInput,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderRadius: radii.lg,
                    fontSize: typography.size.xl,
                  },
                ]}
                placeholder="60.0"
                placeholderTextColor={colors.mutedForeground}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                testID="target-weight-input"
              />
              <Text style={[styles.kgLabel, { color: colors.mutedForeground, fontSize: typography.size.lg }]}>kg</Text>
              <Pressable
                style={[
                  styles.logButton,
                  {
                    backgroundColor: targetWeight.trim() ? brand.primary : colors.muted,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={handleSetGoal}
                disabled={!targetWeight.trim() || isSaving}
                testID="goal-set-button"
              >
                <Text style={{ color: targetWeight.trim() ? brand.primaryForeground : colors.mutedForeground, fontWeight: typography.weight.bold }}>
                  설정
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 최근 기록 */}
        {entries.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
              최근 기록
            </Text>
            {entries.slice(0, 10).map((entry) => (
              <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.entryDate, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                  {formatDateKo(entry.date)}
                </Text>
                <Text style={[styles.entryWeight, { color: colors.foreground, fontSize: typography.size.base, fontWeight: typography.weight.semibold }]}>
                  {entry.weight} kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16 },
  cardTitle: { marginBottom: 12 },
  currentWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bigWeight: {},
  weightUnit: {},
  noData: {},
  goalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: {},
  goalTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  goalFill: { height: '100%' },
  goalPercent: { textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightInput: { flex: 1, padding: 12, textAlign: 'center' },
  kgLabel: {},
  logButton: { paddingHorizontal: 20, paddingVertical: 12 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  entryDate: {},
  entryWeight: {},
});
