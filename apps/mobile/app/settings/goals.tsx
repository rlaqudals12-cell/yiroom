/**
 * 목표 설정 화면
 * 일일 물, 칼로리, 운동 목표 설정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      console.error('[Goals] Failed to load goals:', error);
    }
  };

  const saveGoals = useCallback(async (newGoals: GoalSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
      Haptics.selectionAsync();

      // 위젯 데이터도 업데이트
      await setWidgetGoals(newGoals.waterGoal, newGoals.caloriesGoal);

      console.log('[Goals] Saved goals:', newGoals);
    } catch (error) {
      console.error('[Goals] Failed to save goals:', error);
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
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 물 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💧</Text>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              일일 물 목표
            </Text>
          </View>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.presetRow}>
              {WATER_PRESETS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetButton,
                    isDark && styles.presetButtonDark,
                    goals.waterGoal === value && styles.presetButtonSelected,
                  ]}
                  onPress={() => handleWaterPreset(value)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      isDark && styles.textMuted,
                      goals.waterGoal === value &&
                        styles.presetButtonTextSelected,
                    ]}
                  >
                    {(value / 1000).toFixed(1)}L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.customInput, isDark && styles.customInputDark]}
                value={customWater}
                onChangeText={setCustomWater}
                onBlur={handleCustomWater}
                keyboardType="number-pad"
                placeholder="직접 입력"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
              <Text
                style={[styles.customInputUnit, isDark && styles.textMuted]}
              >
                ml
              </Text>
            </View>
          </View>
        </View>

        {/* 칼로리 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🍽️</Text>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              일일 칼로리 목표
            </Text>
          </View>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.presetRow}>
              {CALORIE_PRESETS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetButton,
                    isDark && styles.presetButtonDark,
                    goals.caloriesGoal === value && styles.presetButtonSelected,
                  ]}
                  onPress={() => handleCaloriesPreset(value)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      isDark && styles.textMuted,
                      goals.caloriesGoal === value &&
                        styles.presetButtonTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.customInput, isDark && styles.customInputDark]}
                value={customCalories}
                onChangeText={setCustomCalories}
                onBlur={handleCustomCalories}
                keyboardType="number-pad"
                placeholder="직접 입력"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
              <Text
                style={[styles.customInputUnit, isDark && styles.textMuted]}
              >
                kcal
              </Text>
            </View>
          </View>
        </View>

        {/* 운동 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏃</Text>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              운동 목표
            </Text>
          </View>
          <View style={[styles.card, isDark && styles.cardDark]}>
            {/* 운동 시간 */}
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, isDark && styles.textLight]}>
                일일 운동 시간
              </Text>
              <View style={styles.goalSelector}>
                {[15, 30, 45, 60].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.goalOption,
                      isDark && styles.goalOptionDark,
                      goals.workoutMinutesGoal === value &&
                        styles.goalOptionSelected,
                    ]}
                    onPress={() => handleWorkoutMinutes(value)}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        isDark && styles.textMuted,
                        goals.workoutMinutesGoal === value &&
                          styles.goalOptionTextSelected,
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
              style={[
                styles.goalRow,
                styles.goalRowBorder,
                isDark && styles.goalRowBorderDark,
              ]}
            >
              <Text style={[styles.goalLabel, isDark && styles.textLight]}>
                주당 운동 일수
              </Text>
              <View style={styles.goalSelector}>
                {[3, 4, 5, 6, 7].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.goalOption,
                      isDark && styles.goalOptionDark,
                      goals.workoutDaysGoal === value &&
                        styles.goalOptionSelected,
                    ]}
                    onPress={() => handleWorkoutDays(value)}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        isDark && styles.textMuted,
                        goals.workoutDaysGoal === value &&
                          styles.goalOptionTextSelected,
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
          <Text style={[styles.infoText, isDark && styles.textMuted]}>
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
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
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
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  presetButtonSelected: {
    backgroundColor: '#8b5cf6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111',
  },
  customInputDark: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  customInputUnit: {
    fontSize: 14,
    color: '#666',
    width: 40,
  },
  goalRow: {
    marginBottom: 16,
  },
  goalRowBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  goalRowBorderDark: {
    borderTopColor: '#333',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 10,
  },
  goalSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  goalOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  goalOptionDark: {
    backgroundColor: '#2a2a2a',
  },
  goalOptionSelected: {
    backgroundColor: '#8b5cf6',
  },
  goalOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  goalOptionTextSelected: {
    color: '#fff',
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
