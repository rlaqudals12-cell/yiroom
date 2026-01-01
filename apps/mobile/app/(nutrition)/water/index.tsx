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
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClerkSupabaseClient } from '../../../lib/supabase';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      const total = (data || []).reduce(
        (sum, record) => sum + record.amount_ml,
        0
      );
      setTotalIntake(total);
    } catch (error) {
      console.error('[Mobile] Failed to fetch water records:', error);
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
      console.error('[Mobile] Failed to add water record:', error);
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
            const { error } = await supabase
              .from('water_records')
              .delete()
              .eq('id', recordId);

            if (error) throw error;
            await fetchTodayRecords();
          } catch (error) {
            console.error('[Mobile] Failed to delete water record:', error);
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 진행 상황 */}
        <View style={styles.progressSection}>
          <Text style={styles.progressIcon}>💧</Text>
          <Text style={[styles.progressValue, isDark && styles.textLight]}>
            {totalIntake.toLocaleString()} ml
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={[styles.progressLabel, isDark && styles.textMuted]}>
            목표: {goalAmount.toLocaleString()} ml ({Math.round(progress)}%)
          </Text>
        </View>

        {/* 음료 타입 선택 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            음료 종류
          </Text>
          <View style={styles.drinkTypeGrid}>
            {DRINK_TYPES.map((drink) => (
              <TouchableOpacity
                key={drink.id}
                style={[
                  styles.drinkTypeChip,
                  isDark && styles.drinkTypeChipDark,
                  selectedDrinkType === drink.id &&
                    styles.drinkTypeChipSelected,
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
                    isDark && styles.textLight,
                    selectedDrinkType === drink.id &&
                      styles.drinkTypeLabelSelected,
                  ]}
                >
                  {drink.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 빠른 추가 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            빠른 추가
          </Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.quickAddButton,
                  isDark && styles.quickAddButtonDark,
                ]}
                onPress={() => handleAddWater(option.amount)}
                disabled={isAdding}
              >
                <Text style={styles.quickAddText}>{option.label}</Text>
                <Text style={[styles.quickAddUnit, isDark && styles.textMuted]}>
                  ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 오늘 기록 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            오늘 기록
          </Text>
          {todayRecords.length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>
                아직 기록이 없어요
              </Text>
            </View>
          ) : (
            <View
              style={[styles.recordsCard, isDark && styles.recordsCardDark]}
            >
              {todayRecords.map((record, index) => (
                <TouchableOpacity
                  key={record.id}
                  style={[
                    styles.recordItem,
                    index < todayRecords.length - 1 && styles.recordItemBorder,
                    isDark && styles.recordItemBorderDark,
                  ]}
                  onLongPress={() => handleDeleteRecord(record.id)}
                >
                  <Text style={styles.recordIcon}>
                    {getDrinkIcon(record.drink_type)}
                  </Text>
                  <Text style={[styles.recordTime, isDark && styles.textMuted]}>
                    {formatTime(record.record_time)}
                  </Text>
                  <Text
                    style={[styles.recordAmount, isDark && styles.textLight]}
                  >
                    {record.amount_ml}ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {todayRecords.length > 0 && (
            <Text style={[styles.deleteHint, isDark && styles.textMuted]}>
              길게 눌러서 삭제
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  drinkTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  drinkTypeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  drinkTypeChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  drinkTypeChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  drinkTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  drinkTypeLabel: {
    fontSize: 12,
    color: '#333',
  },
  drinkTypeLabelSelected: {
    color: '#fff',
  },
  quickAddGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  quickAddButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  quickAddText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  quickAddUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyCardDark: {
    backgroundColor: '#1a1a1a',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  recordsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recordsCardDark: {
    backgroundColor: '#1a1a1a',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recordItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordItemBorderDark: {
    borderBottomColor: '#333',
  },
  recordIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recordTime: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  deleteHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
