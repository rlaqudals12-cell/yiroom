/**
 * N-1 물 섭취 트래킹 화면
 * 원탭 물 추가 + 오늘 기록 히스토리
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';

import { ScreenContainer, DataStateWrapper } from '@/components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

import { useClerkSupabaseClient } from '../../../lib/supabase';
import { waterLogger } from '../../../lib/utils/logger';

// 빠른 추가 옵션 (ml)
const QUICK_ADD_OPTIONS = [
  { amount: 100, label: '+100' },
  { amount: 200, label: '+200' },
  { amount: 300, label: '+300' },
  { amount: 500, label: '+500' },
];

// 음료 타입
const DRINK_TYPES = [
  { id: 'water', label: '물', icon: '💧', factor: 1.0 },
  { id: 'tea', label: '차', icon: '🍵', factor: 0.9 },
  { id: 'coffee', label: '커피', icon: '☕', factor: 0.8 },
  { id: 'juice', label: '주스', icon: '🧃', factor: 0.7 },
];

interface WaterRecord {
  id: string;
  record_time: string;
  amount_ml: number;
  drink_type: string;
}

export default function WaterTrackingScreen() {
  const { colors, status, typography, spacing, radii} = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [todayRecords, setTodayRecords] = useState<WaterRecord[]>([]);
  const [totalIntake, setTotalIntake] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDrinkType, setSelectedDrinkType] = useState('water');

  // 목표량 (ml)
  const goalAmount = 2000;

  // 진행률 계산
  const progress = Math.min((totalIntake / goalAmount) * 100, 100);

  // 오늘 기록 조회
  const fetchTodayRecords = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('water_records')
        .select('id, record_time, amount_ml, drink_type')
        .eq('record_date', today)
        .order('record_time', { ascending: false });

      if (error) throw error;

      setTodayRecords(data || []);
      const total = (data || []).reduce((sum, record) => sum + record.amount_ml, 0);
      setTotalIntake(total);
    } catch (error) {
      waterLogger.error('Failed to fetch water records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchTodayRecords();
  }, [fetchTodayRecords]);

  // 물 추가
  const handleAddWater = async (amount: number) => {
    if (!user?.id) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setIsAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const drinkInfo = DRINK_TYPES.find((d) => d.id === selectedDrinkType);
      const effectiveMl = Math.round(amount * (drinkInfo?.factor || 1.0));

      const { error } = await supabase.from('water_records').insert({
        clerk_user_id: user.id,
        record_date: new Date().toISOString().split('T')[0],
        record_time: new Date().toTimeString().split(' ')[0],
        amount_ml: amount,
        drink_type: selectedDrinkType,
        hydration_factor: drinkInfo?.factor || 1.0,
        effective_ml: effectiveMl,
      });

      if (error) throw error;

      // 목표 달성 시 축하 햅틱
      if (totalIntake < goalAmount && totalIntake + amount >= goalAmount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('축하합니다! 🎉', '오늘의 수분 섭취 목표를 달성했어요!');
      }

      await fetchTodayRecords();
    } catch (error) {
      waterLogger.error('Failed to add water record:', error);
      Alert.alert('오류', '물 기록 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 기록 삭제
  const handleDeleteRecord = (recordId: string) => {
    Alert.alert('삭제', '이 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('water_records').delete().eq('id', recordId);

            if (error) throw error;
            await fetchTodayRecords();
          } catch (error) {
            waterLogger.error('Failed to delete water record:', error);
          }
        },
      },
    ]);
  };

  // 시간 포맷
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  // 음료 아이콘 가져오기
  const getDrinkIcon = (drinkType: string) => {
    return DRINK_TYPES.find((d) => d.id === drinkType)?.icon || '💧';
  };

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTodayRecords();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTodayRecords]);

  return (
    <ScreenContainer
      testID="nutrition-water-screen"
      edges={['bottom']}
      contentPadding={20}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={false}
      >
        {/* 진행 상황 */}
        <View style={styles.progressSection}>
          <Text style={styles.progressIcon}>💧</Text>
          <Text style={[styles.progressValue, { color: colors.foreground }]}>
            {totalIntake.toLocaleString()} ml
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressBar, { width: `${progress}%`, backgroundColor: status.info }]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            목표: {goalAmount.toLocaleString()} ml ({Math.round(progress)}%)
          </Text>
        </View>

        {/* 음료 타입 선택 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>음료 종류</Text>
          <View style={styles.drinkTypeGrid}>
            {DRINK_TYPES.map((drink) => (
              <Pressable
                key={drink.id}
                style={[
                  styles.drinkTypeChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedDrinkType === drink.id && [
                    styles.drinkTypeChipSelected,
                    { backgroundColor: status.info, borderColor: status.info },
                  ],
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDrinkType(drink.id);
                }}
              >
                <Text style={styles.drinkTypeIcon}>{drink.icon}</Text>
                <Text
                  style={[
                    styles.drinkTypeLabel,
                    { color: selectedDrinkType === drink.id ? colors.overlayForeground : colors.foreground },
                  ]}
                >
                  {drink.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 빠른 추가 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>빠른 추가</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_OPTIONS.map((option) => (
              <Pressable
                key={option.amount}
                style={[
                  styles.quickAddButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleAddWater(option.amount)}
                disabled={isAdding}
              >
                <Text style={[styles.quickAddText, { color: status.info }]}>{option.label}</Text>
                <Text style={[styles.quickAddUnit, { color: colors.mutedForeground }]}>ml</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 오늘 기록 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>오늘 기록</Text>
          {todayRecords.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                아직 기록이 없어요
              </Text>
            </View>
          ) : (
            <View style={[styles.recordsCard, { backgroundColor: colors.card }]}>
              {todayRecords.map((record, index) => (
                <Pressable
                  key={record.id}
                  style={[
                    styles.recordItem,
                    index < todayRecords.length - 1 && [
                      styles.recordItemBorder,
                      { borderBottomColor: colors.border },
                    ],
                  ]}
                  onLongPress={() => handleDeleteRecord(record.id)}
                >
                  <Text style={styles.recordIcon}>{getDrinkIcon(record.drink_type)}</Text>
                  <Text style={[styles.recordTime, { color: colors.mutedForeground }]}>
                    {formatTime(record.record_time)}
                  </Text>
                  <Text style={[styles.recordAmount, { color: colors.foreground }]}>
                    {record.amount_ml}ml
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {todayRecords.length > 0 && (
            <Text style={[styles.deleteHint, { color: colors.mutedForeground }]}>
              길게 눌러서 삭제
            </Text>
          )}
        </View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  progressValue: {
    fontSize: 42,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: typography.size.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  drinkTypeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  drinkTypeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.smx,
    borderRadius: radii.smx,
    borderWidth: 1,
  },
  drinkTypeChipSelected: {
    // backgroundColor and borderColor set inline
  },
  drinkTypeIcon: {
    fontSize: typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  drinkTypeLabel: {
    fontSize: typography.size.xs,
  },
  quickAddGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.smx,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  quickAddUnit: {
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  emptyCard: {
    borderRadius: radii.smx,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
  },
  recordsCard: {
    borderRadius: radii.smx,
    overflow: 'hidden',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recordItemBorder: {
    borderBottomWidth: 1,
  },
  recordIcon: {
    fontSize: typography.size.xl,
    marginRight: spacing.smx,
  },
  recordTime: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  recordAmount: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  deleteHint: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
