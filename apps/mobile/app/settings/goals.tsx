/**
 * 목표 설정 화면
 * 일일 물, 칼로리, 운동 목표 설정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { settingsLogger } from '../../lib/utils/logger';
import { setGoals as setWidgetGoals } from '../../lib/widgets';

// 목표 설정 타입
interface GoalSettings {
  waterGoal: number; // ml
  caloriesGoal: number; // kcal
  workoutMinutesGoal: number; // 분
  workoutDaysGoal: number; // 주당 일수
}

const DEFAULT_GOALS: GoalSettings = {
  waterGoal: 2000,
  caloriesGoal: 2000,
  workoutMinutesGoal: 30,
  workoutDaysGoal: 5,
};

const STORAGE_KEY = '@yiroom_goal_settings';

// 물 목표 프리셋
const WATER_PRESETS = [1500, 2000, 2500, 3000];

// 칼로리 목표 프리셋
const CALORIE_PRESETS = [1500, 1800, 2000, 2500];

export default function GoalsSettingsScreen() {
  const { colors } = useTheme();

  const [goals, setGoals] = useState<GoalSettings>(DEFAULT_GOALS);
  const [customWater, setCustomWater] = useState('');
  const [customCalories, setCustomCalories] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGoals(parsed);
        setCustomWater(parsed.waterGoal.toString());
        setCustomCalories(parsed.caloriesGoal.toString());
      }
    } catch (error) {
      settingsLogger.error('Failed to load goals:', error);
    }
  };

  const saveGoals = useCallback(async (newGoals: GoalSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
      Haptics.selectionAsync();

      // 위젯 데이터도 업데이트
      await setWidgetGoals(newGoals.waterGoal, newGoals.caloriesGoal);

      settingsLogger.info('Saved goals:', newGoals);
    } catch (error) {
      settingsLogger.error('Failed to save goals:', error);
    }
  }, []);

  const handleWaterPreset = (value: number) => {
    setCustomWater(value.toString());
    saveGoals({ ...goals, waterGoal: value });
  };

  const handleCaloriesPreset = (value: number) => {
    setCustomCalories(value.toString());
    saveGoals({ ...goals, caloriesGoal: value });
  };

  const handleCustomWater = () => {
    const value = parseInt(customWater, 10);
    if (value && value > 0 && value <= 5000) {
      saveGoals({ ...goals, waterGoal: value });
    }
  };

  const handleCustomCalories = () => {
    const value = parseInt(customCalories, 10);
    if (value && value > 0 && value <= 5000) {
      saveGoals({ ...goals, caloriesGoal: value });
    }
  };

  const handleWorkoutMinutes = (value: number) => {
    saveGoals({ ...goals, workoutMinutesGoal: value });
  };

  const handleWorkoutDays = (value: number) => {
    saveGoals({ ...goals, workoutDaysGoal: value });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="settings-goals-screen"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 물 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💧</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>일일 물 목표</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.presetRow}>
              {WATER_PRESETS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetButton,
                    { backgroundColor: colors.muted },
                    goals.waterGoal === value && styles.presetButtonSelected,
                  ]}
                  onPress={() => handleWaterPreset(value)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      { color: colors.foreground },
                      goals.waterGoal === value && styles.presetButtonTextSelected,
                    ]}
                  >
                    {(value / 1000).toFixed(1)}L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.customInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                value={customWater}
                onChangeText={setCustomWater}
                onBlur={handleCustomWater}
                keyboardType="number-pad"
                placeholder="직접 입력"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.customInputUnit, { color: colors.mutedForeground }]}>ml</Text>
            </View>
          </View>
        </View>

        {/* 칼로리 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🍽️</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>일일 칼로리 목표</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.presetRow}>
              {CALORIE_PRESETS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetButton,
                    { backgroundColor: colors.muted },
                    goals.caloriesGoal === value && styles.presetButtonSelected,
                  ]}
                  onPress={() => handleCaloriesPreset(value)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      { color: colors.foreground },
                      goals.caloriesGoal === value && styles.presetButtonTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.customInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                value={customCalories}
                onChangeText={setCustomCalories}
                onBlur={handleCustomCalories}
                keyboardType="number-pad"
                placeholder="직접 입력"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.customInputUnit, { color: colors.mutedForeground }]}>kcal</Text>
            </View>
          </View>
        </View>

        {/* 운동 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏃</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>운동 목표</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* 운동 시간 */}
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.foreground }]}>일일 운동 시간</Text>
              <View style={styles.goalSelector}>
                {[15, 30, 45, 60].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.goalOption,
                      { backgroundColor: colors.muted },
                      goals.workoutMinutesGoal === value && styles.goalOptionSelected,
                    ]}
                    onPress={() => handleWorkoutMinutes(value)}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        { color: colors.foreground },
                        goals.workoutMinutesGoal === value && styles.goalOptionTextSelected,
                      ]}
                    >
                      {value}분
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 주당 운동 횟수 */}
            <View
              style={[styles.goalRow, styles.goalRowBorder, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.goalLabel, { color: colors.foreground }]}>주당 운동 일수</Text>
              <View style={styles.goalSelector}>
                {[3, 4, 5, 6, 7].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.goalOption,
                      { backgroundColor: colors.muted },
                      goals.workoutDaysGoal === value && styles.goalOptionSelected,
                    ]}
                    onPress={() => handleWorkoutDays(value)}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        { color: colors.foreground },
                        goals.workoutDaysGoal === value && styles.goalOptionTextSelected,
                      ]}
                    >
                      {value}일
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 안내 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            목표는 언제든지 변경할 수 있습니다.{'\n'}
            현실적인 목표 설정으로 꾸준히 달성해보세요!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#8b5cf6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    color: '#fff',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  customInputUnit: {
    fontSize: 14,
    width: 40,
  },
  goalRow: {
    marginBottom: 16,
  },
  goalRowBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  goalSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  goalOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  goalOptionSelected: {
    backgroundColor: '#8b5cf6',
  },
  goalOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  goalOptionTextSelected: {
    color: '#fff',
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
