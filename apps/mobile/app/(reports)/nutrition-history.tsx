/**
 * 영양 이력 화면
 * 30일간 영양 기록을 타임라인 형태로 표시
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DataStateWrapper } from '@/components/ui';

import { useClerkSupabaseClient } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { getNutrientStatus, getNutrientStatusColor } from '../../hooks/useNutritionData';

interface NutritionRecord {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number;
  mealCount: number;
}

export default function NutritionHistoryScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, status } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [records, setRecords] = useState<NutritionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieGoal] = useState(2000); // 기본값, 추후 settings에서 로드

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 29);

      const { data } = await supabase
        .from('daily_nutrition_summary')
        .select('date, total_calories, total_protein, total_carbs, total_fat, water_intake, meal_count')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (data) {
        setRecords(
          data.map((row) => ({
            date: row.date,
            totalCalories: row.total_calories || 0,
            totalProtein: row.total_protein || 0,
            totalCarbs: row.total_carbs || 0,
            totalFat: row.total_fat || 0,
            waterIntake: row.water_intake || 0,
            mealCount: row.meal_count || 0,
          }))
        );
      }
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDateKo = (dateStr: string): string => {
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  };

  const renderRecord = ({ item }: { item: NutritionRecord }): React.JSX.Element => {
    const calStatus = getNutrientStatus(item.totalCalories, calorieGoal);
    const statusColor = getNutrientStatusColor(calStatus);
    const calPercent = Math.min(Math.round((item.totalCalories / calorieGoal) * 100), 150);

    return (
      <View style={[styles.recordCard, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
        <View style={styles.recordHeader}>
          <Text style={[styles.recordDate, { color: colors.foreground, fontSize: typography.size.base, fontWeight: typography.weight.semibold }]}>
            {formatDateKo(item.date)}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        {/* 칼로리 바 */}
        <View style={styles.calRow}>
          <Text style={[styles.calLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
            칼로리
          </Text>
          <View style={[styles.calTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.calFill,
                {
                  backgroundColor: statusColor,
                  width: `${Math.min(calPercent, 100)}%`,
                  borderRadius: radii.full,
                },
              ]}
            />
          </View>
          <Text style={[styles.calValue, { color: colors.foreground, fontSize: typography.size.sm, fontWeight: typography.weight.bold }]}>
            {item.totalCalories}
          </Text>
        </View>

        {/* 매크로 */}
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>단백질</Text>
            <Text style={[styles.macroValue, { color: status.error, fontSize: typography.size.sm }]}>{item.totalProtein}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>탄수화물</Text>
            <Text style={[styles.macroValue, { color: status.warning, fontSize: typography.size.sm }]}>{item.totalCarbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>지방</Text>
            <Text style={[styles.macroValue, { color: status.info, fontSize: typography.size.sm }]}>{item.totalFat}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>수분</Text>
            <Text style={[styles.macroValue, { color: status.info, fontSize: typography.size.sm }]}>{item.waterIntake}ml</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="nutrition-history-screen"
    >
      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={records.length === 0}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>🥗</Text>,
          title: '아직 영양 기록이 없어요',
          description: '식사를 기록해보세요!',
        }}
      >
        <FlatList
          data={records}
          keyExtractor={(item) => item.date}
          renderItem={renderRecord}
          contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: spacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      </DataStateWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  recordCard: { padding: 16 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recordDate: {},
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  calLabel: { width: 40 },
  calTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  calFill: { height: '100%' },
  calValue: { width: 50, textAlign: 'right' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroLabel: { marginBottom: 2 },
  macroValue: {},
});
