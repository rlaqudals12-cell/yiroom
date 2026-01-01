/**
 * W-1 운동 기록 화면
 * 3탭 완료 플로우: 운동 선택 → 시간/강도 → 저장
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useClerkSupabaseClient } from '../../../lib/supabase';
import * as Haptics from 'expo-haptics';

// 추천 운동 목록
const RECOMMENDED_EXERCISES = [
  { id: 'squat', name: '스쿼트', category: 'legs' },
  { id: 'pushup', name: '푸시업', category: 'chest' },
  { id: 'lunge', name: '런지', category: 'legs' },
  { id: 'plank', name: '플랭크', category: 'core' },
  { id: 'crunch', name: '크런치', category: 'core' },
  { id: 'burpee', name: '버피', category: 'cardio' },
  { id: 'jumping_jack', name: '점핑잭', category: 'cardio' },
  { id: 'mountain_climber', name: '마운틴클라이머', category: 'cardio' },
];

// 운동 강도 옵션
const INTENSITY_OPTIONS = [
  { id: 'light', label: '가볍게', value: 1 },
  { id: 'moderate', label: '보통', value: 2 },
  { id: 'intense', label: '격렬하게', value: 3 },
];

// 운동 시간 옵션 (분)
const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export default function WorkoutLogScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<string>('moderate');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 칼로리 예상 계산 (MET 기반 단순화)
  const estimatedCalories = useMemo(() => {
    const intensityMultiplier = intensity === 'light' ? 4 : intensity === 'moderate' ? 6 : 8;
    // 체중 70kg 가정, MET 기반 칼로리 = MET * 체중(kg) * 시간(h)
    return Math.round(intensityMultiplier * 70 * (duration / 60));
  }, [duration, intensity]);

  const handleExerciseToggle = (exerciseId: string) => {
    Haptics.selectionAsync();
    setSelectedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleDurationSelect = (mins: number) => {
    Haptics.selectionAsync();
    setDuration(mins);
  };

  const handleIntensitySelect = (intensityId: string) => {
    Haptics.selectionAsync();
    setIntensity(intensityId);
  };

  const handleSave = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('알림', '최소 하나의 운동을 선택해주세요.');
      return;
    }

    if (!user?.id) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 운동별 기록 데이터 구성
      const exerciseLogs = selectedExercises.map((exerciseId) => {
        const exercise = RECOMMENDED_EXERCISES.find((e) => e.id === exerciseId);
        return {
          exercise_id: exerciseId,
          exercise_name: exercise?.name || exerciseId,
          sets: [{ reps: 0, completed: true }],
          difficulty: INTENSITY_OPTIONS.find((i) => i.id === intensity)?.value || 2,
        };
      });

      // workout_logs 테이블에 저장
      const { error } = await supabase.from('workout_logs').insert({
        workout_date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
        actual_duration: duration,
        actual_calories: estimatedCalories,
        exercise_logs: exerciseLogs,
        perceived_effort: INTENSITY_OPTIONS.find((i) => i.id === intensity)?.value || 2,
        notes: notes || null,
        mood: intensity === 'light' ? 'relaxed' : intensity === 'intense' ? 'energetic' : 'normal',
      });

      if (error) throw error;

      // 스트릭 업데이트
      await updateStreak();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('완료', '운동이 기록되었습니다!', [
        { text: '확인', onPress: () => router.replace('/(tabs)/records') },
      ]);
    } catch (error) {
      console.error('[Mobile] Failed to save workout log:', error);
      Alert.alert('오류', '운동 기록 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 스트릭 업데이트 함수
  const updateStreak = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 기존 스트릭 조회
      const { data: streakData } = await supabase
        .from('workout_streaks')
        .select('*')
        .single();

      if (streakData) {
        const lastDate = streakData.last_workout_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = streakData.current_streak;

        // 오늘 이미 기록했으면 변경 없음
        if (lastDate === today) {
          return;
        }

        // 어제 기록했으면 스트릭 +1
        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else {
          // 그 외에는 스트릭 리셋
          newStreak = 1;
        }

        await supabase
          .from('workout_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streakData.longest_streak),
            last_workout_date: today,
          })
          .eq('id', streakData.id);
      } else {
        // 스트릭 레코드 없으면 생성
        await supabase.from('workout_streaks').insert({
          current_streak: 1,
          longest_streak: 1,
          last_workout_date: today,
          streak_start_date: today,
        });
      }
    } catch (error) {
      console.error('[Mobile] Failed to update streak:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 운동 선택 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            오늘 어떤 운동을 했나요?
          </Text>
          <View style={styles.exerciseGrid}>
            {RECOMMENDED_EXERCISES.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseChip,
                  isDark && styles.exerciseChipDark,
                  selectedExercises.includes(exercise.id) && styles.exerciseChipSelected,
                ]}
                onPress={() => handleExerciseToggle(exercise.id)}
              >
                <Text
                  style={[
                    styles.exerciseChipText,
                    isDark && styles.textLight,
                    selectedExercises.includes(exercise.id) && styles.exerciseChipTextSelected,
                  ]}
                >
                  {exercise.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 운동 시간 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            운동 시간
          </Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationChip,
                  isDark && styles.durationChipDark,
                  duration === mins && styles.durationChipSelected,
                ]}
                onPress={() => handleDurationSelect(mins)}
              >
                <Text
                  style={[
                    styles.durationText,
                    isDark && styles.textLight,
                    duration === mins && styles.durationTextSelected,
                  ]}
                >
                  {mins}분
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 운동 강도 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            강도
          </Text>
          <View style={styles.intensityGrid}>
            {INTENSITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.intensityChip,
                  isDark && styles.intensityChipDark,
                  intensity === option.id && styles.intensityChipSelected,
                ]}
                onPress={() => handleIntensitySelect(option.id)}
              >
                <Text
                  style={[
                    styles.intensityText,
                    isDark && styles.textLight,
                    intensity === option.id && styles.intensityTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 메모 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            메모 (선택)
          </Text>
          <TextInput
            style={[styles.notesInput, isDark && styles.notesInputDark]}
            placeholder="오늘의 운동은 어땠나요?"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 예상 칼로리 */}
        <View style={[styles.calorieCard, isDark && styles.calorieCardDark]}>
          <Text style={[styles.calorieLabel, isDark && styles.textMuted]}>예상 소모 칼로리</Text>
          <Text style={styles.calorieValue}>{estimatedCalories} kcal</Text>
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>운동 기록하기</Text>
          )}
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  exerciseChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  exerciseChipSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  exerciseChipText: {
    fontSize: 14,
    color: '#333',
  },
  exerciseChipTextSelected: {
    color: '#fff',
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  durationChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  durationChipSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  durationTextSelected: {
    color: '#fff',
  },
  intensityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityChip: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  intensityChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  intensityChipSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  intensityTextSelected: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 14,
    fontSize: 14,
    color: '#111',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInputDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    color: '#fff',
  },
  calorieCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieCardDark: {
    backgroundColor: '#1a1a1a',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  saveButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
