/**
 * W-1 운동 세션 화면 (타이머 포함)
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// 샘플 운동 데이터
const SAMPLE_EXERCISES = [
  { id: 1, name: '스쿼트', sets: 3, reps: 15, restTime: 60 },
  { id: 2, name: '푸쉬업', sets: 3, reps: 12, restTime: 45 },
  { id: 3, name: '런지', sets: 3, reps: 12, restTime: 60 },
  { id: 4, name: '플랭크', sets: 3, reps: 30, restTime: 30 },
];

type SessionState = 'ready' | 'exercising' | 'resting' | 'completed';

export default function WorkoutSessionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = SAMPLE_EXERCISES[currentExerciseIndex];

  // 타이머 효과
  useEffect(() => {
    if (sessionState === 'exercising' || sessionState === 'resting') {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (sessionState === 'resting' && prev <= 1) {
            // 휴식 끝
            handleRestEnd();
            return 0;
          }
          return sessionState === 'resting' ? prev - 1 : prev + 1;
        });
        setTotalTime((prev) => prev + 1);
        // 칼로리 계산 (MET 기반 단순화)
        setCaloriesBurned((prev) => prev + 0.1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionState]);

  const handleRestEnd = () => {
    if (currentSet < currentExercise.sets) {
      setCurrentSet((prev) => prev + 1);
      setSessionState('exercising');
    } else if (currentExerciseIndex < SAMPLE_EXERCISES.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setSessionState('exercising');
    } else {
      setSessionState('completed');
    }
    setTimer(0);
  };

  const handleStartSession = () => {
    setSessionState('exercising');
    setTimer(0);
  };

  const handleCompleteSet = () => {
    if (currentSet < currentExercise.sets) {
      // 다음 세트로, 휴식 시작
      setSessionState('resting');
      setTimer(currentExercise.restTime);
    } else if (currentExerciseIndex < SAMPLE_EXERCISES.length - 1) {
      // 다음 운동으로, 휴식 시작
      setSessionState('resting');
      setTimer(currentExercise.restTime);
    } else {
      // 운동 완료
      setSessionState('completed');
    }
  };

  const handleSkipRest = () => {
    handleRestEnd();
  };

  const handleEndSession = () => {
    Alert.alert(
      '운동 종료',
      '운동을 종료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/records'),
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 준비 화면
  if (sessionState === 'ready') {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.readyContent}>
          <Text style={[styles.readyTitle, isDark && styles.textLight]}>
            운동 준비
          </Text>
          <Text style={[styles.readySubtitle, isDark && styles.textMuted]}>
            {SAMPLE_EXERCISES.length}개의 운동이 준비되어 있어요
          </Text>

          <View style={styles.exercisePreview}>
            {SAMPLE_EXERCISES.map((ex, index) => (
              <View key={ex.id} style={[styles.previewItem, isDark && styles.previewItemDark]}>
                <Text style={[styles.previewNumber, isDark && styles.textMuted]}>
                  {index + 1}
                </Text>
                <Text style={[styles.previewName, isDark && styles.textLight]}>
                  {ex.name}
                </Text>
                <Text style={[styles.previewSets, isDark && styles.textMuted]}>
                  {ex.sets}세트 x {ex.reps}회
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartSession}>
            <Text style={styles.startButtonText}>운동 시작</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 완료 화면
  if (sessionState === 'completed') {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.completedContent}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={[styles.completedTitle, isDark && styles.textLight]}>
            운동 완료!
          </Text>
          <Text style={[styles.completedSubtitle, isDark && styles.textMuted]}>
            오늘도 열심히 했어요
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {formatTime(totalTime)}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>총 시간</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {Math.round(caloriesBurned)}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>칼로리</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {SAMPLE_EXERCISES.length}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>운동 수</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => router.replace('/(tabs)/records')}
          >
            <Text style={styles.finishButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 운동 중 / 휴식 중 화면
  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* 상단 정보 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndSession}>
          <Text style={[styles.endText, isDark && styles.textMuted]}>종료</Text>
        </TouchableOpacity>
        <Text style={[styles.totalTimeText, isDark && styles.textMuted]}>
          {formatTime(totalTime)}
        </Text>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.mainContent}>
        {sessionState === 'resting' ? (
          <>
            <Text style={[styles.stateLabel, isDark && styles.textMuted]}>휴식 중</Text>
            <Text style={[styles.timerText, isDark && styles.textLight]}>
              {formatTime(timer)}
            </Text>
            <Text style={[styles.nextExerciseText, isDark && styles.textMuted]}>
              다음: {currentSet < currentExercise.sets
                ? `${currentExercise.name} ${currentSet + 1}세트`
                : currentExerciseIndex < SAMPLE_EXERCISES.length - 1
                  ? SAMPLE_EXERCISES[currentExerciseIndex + 1].name
                  : '마지막 운동 완료!'
              }
            </Text>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipRest}>
              <Text style={styles.skipButtonText}>휴식 건너뛰기</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.exerciseName, isDark && styles.textLight]}>
              {currentExercise.name}
            </Text>
            <Text style={[styles.setInfo, isDark && styles.textMuted]}>
              {currentSet} / {currentExercise.sets} 세트
            </Text>
            <Text style={[styles.repsText, isDark && styles.textLight]}>
              {currentExercise.reps}회
            </Text>
            <Text style={[styles.timerSmall, isDark && styles.textMuted]}>
              {formatTime(timer)}
            </Text>
          </>
        )}
      </View>

      {/* 하단 버튼 */}
      {sessionState === 'exercising' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSet}>
            <Text style={styles.completeButtonText}>세트 완료</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 진행 표시 */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentExerciseIndex * 3 + currentSet) / (SAMPLE_EXERCISES.length * 3)) * 100}%`,
            },
          ]}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  endText: {
    fontSize: 16,
    color: '#666',
  },
  totalTimeText: {
    fontSize: 16,
    color: '#666',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  stateLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 16,
  },
  timerSmall: {
    fontSize: 24,
    color: '#666',
    marginTop: 24,
  },
  nextExerciseText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  exerciseName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  setInfo: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  repsText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#ef4444',
  },
  footer: {
    padding: 20,
  },
  completeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  // Ready screen
  readyContent: {
    flex: 1,
    padding: 20,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  exercisePreview: {
    gap: 12,
    marginBottom: 32,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  previewItemDark: {
    backgroundColor: '#1a1a1a',
  },
  previewNumber: {
    width: 32,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  previewName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  previewSets: {
    fontSize: 14,
    color: '#666',
  },
  startButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Completed screen
  completedContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 48,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  finishButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
