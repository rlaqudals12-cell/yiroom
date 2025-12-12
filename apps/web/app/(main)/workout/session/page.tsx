'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { useWorkoutSessionStore } from '@/lib/stores/workoutSessionStore';
import { classifyWorkoutType } from '@/lib/workout/classifyWorkoutType';
import { createWeeklyPlanFromInput } from '@/lib/workout/weeklyPlan';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import { saveWorkoutLogAction, getWorkoutStreakAction } from './actions';
import type { ExerciseLog, SetLog } from '@/lib/api/workout';
import {
  RestTimer,
  ExerciseSessionCard,
  WorkoutSessionHeader,
  SessionCompletionCard,
} from '@/components/workout/session';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { useShare } from '@/hooks/useShare';
import type { DayPlan, ExerciseSessionRecord, WorkoutType } from '@/types/workout';

/**
 * ExerciseSessionRecord[] → ExerciseLog[] 변환
 * 세션 데이터를 DB 저장 형식으로 변환
 */
function convertToExerciseLogs(records: ExerciseSessionRecord[]): ExerciseLog[] {
  return records.map((record) => ({
    exercise_id: record.exerciseId,
    exercise_name: record.exerciseName,
    sets: record.sets.map((set): SetLog => ({
      reps: set.actualReps ?? set.targetReps ?? 0,
      weight: set.actualWeight,
      completed: set.status === 'completed',
    })),
    difficulty: record.difficulty,
  }));
}

/**
 * 운동 세션 페이지
 * - 실시간 운동 진행
 * - 세트 완료 체크
 * - 휴식 타이머
 * - 완료 통계
 * - DB 저장 및 스트릭 업데이트
 */
export default function SessionPage() {
  return (
    <Suspense fallback={<AnalyzingLoader title="운동 준비 중" subtitle="오늘의 운동을 준비하고 있어요..." />}>
      <SessionPageContent />
    </Suspense>
  );
}

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get('day');
  const { user } = useUser();

  const { getInputData } = useWorkoutInputStore();
  const {
    planId,
    dayPlan,
    workoutDate,
    status,
    currentExerciseIndex,
    currentSetIndex,
    exerciseRecords,
    isResting,
    restTimeRemaining,
    elapsedTime,
    estimatedCalories,
    initSession,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
    startExercise,
    completeSet,
    skipSet,
    skipExercise,
    moveToNextExercise,
    skipRest,
    getCompletionStats,
    updateElapsedTime,
  } = useWorkoutSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // P3-5.2: 운동 타입 (영양 추천용)
  const [workoutType, setWorkoutType] = useState<WorkoutType>('builder');

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const saveAttemptedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRY_COUNT = 3;

  // 공유 기능
  const { share: handleShare, loading: isSharing } = useShare('이룸-운동기록');

  // 세션 초기화
  useEffect(() => {
    const inputData = getInputData();

    // 유효성 검증
    const validation = validateAllSteps(inputData);
    if (!validation.isValid) {
      setError('운동 데이터가 없습니다. 다시 시작해주세요.');
      setIsLoading(false);
      return;
    }

    // 플랜 생성
    const typeResult = classifyWorkoutType(inputData);

    const weeklyPlan = createWeeklyPlanFromInput(inputData, typeResult.type);

    // 오늘 또는 지정된 날의 플랜 찾기
    let targetDay: DayPlan | undefined;

    if (dayParam) {
      targetDay = weeklyPlan.days.find((d) => d.day === dayParam);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek];
      targetDay = weeklyPlan.days.find((d) => d.day === todayKey);
    }

    if (!targetDay || targetDay.isRestDay || targetDay.exercises.length === 0) {
      setError('오늘은 휴식일이거나 운동이 없습니다.');
      setIsLoading(false);
      return;
    }

    // 세션 초기화 (userId는 DB 저장 시 사용)
    const userId = user?.id || 'anonymous';
    setWorkoutType(typeResult.type); // P3-5.2: 영양 추천용
    initSession(weeklyPlan.id, targetDay, userId, typeResult.type);
    setIsLoading(false);
  }, [getInputData, dayParam, initSession, user?.id]);

  // 경과 시간 추적
  useEffect(() => {
    if (status !== 'in_progress' && status !== 'resting') return;

    const interval = setInterval(() => {
      updateElapsedTime(elapsedTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, elapsedTime, updateElapsedTime]);

  // 세션 저장 함수 (재시도 로직 포함)
  const saveSession = useCallback(async (isRetry = false) => {
    // 익명 사용자는 저장하지 않음
    if (!user?.id) return;

    // 재시도가 아니고 이미 저장 시도했으면 스킵
    if (!isRetry && saveAttemptedRef.current) return;

    // 재시도 횟수 초과
    if (isRetry && retryCountRef.current >= MAX_RETRY_COUNT) {
      setSaveError('저장에 실패했습니다. 나중에 다시 시도해 주세요.');
      return;
    }

    saveAttemptedRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      // ExerciseLog 형식으로 변환
      const exerciseLogs = convertToExerciseLogs(exerciseRecords);

      // DB 저장 (streak 자동 업데이트 포함)
      const result = await saveWorkoutLogAction(user.id, planId || null, workoutDate, exerciseLogs, {
        actualDuration: Math.floor(elapsedTime / 60), // 분 단위
        actualCalories: Math.round(estimatedCalories),
      });

      if (!result) {
        throw new Error('운동 기록 저장에 실패했습니다.');
      }

      // 최신 streak 조회
      const streak = await getWorkoutStreakAction(user.id);
      if (streak) {
        setCurrentStreak(streak.current_streak);
      }

      setIsSaved(true);
      retryCountRef.current = 0; // 성공 시 리셋
    } catch (err) {
      console.error('Failed to save workout log:', err);
      retryCountRef.current += 1;

      // 자동 재시도 (지수 백오프)
      if (retryCountRef.current < MAX_RETRY_COUNT) {
        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2초, 4초, 8초
        setTimeout(() => saveSession(true), delay);
      } else {
        setSaveError('운동 기록 저장에 실패했습니다. 재시도 버튼을 눌러주세요.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, exerciseRecords, planId, workoutDate, elapsedTime, estimatedCalories]);

  // 수동 재시도
  const handleRetrySave = useCallback(() => {
    retryCountRef.current = 0;
    saveAttemptedRef.current = false;
    saveSession(true);
  }, [saveSession]);

  // 세션 완료 시 DB 저장
  useEffect(() => {
    // 완료 상태가 아니면 스킵
    if (status !== 'completed') return;

    saveSession();
  }, [status, saveSession]);

  // 운동 상세 보기
  const handleViewDetail = useCallback((exerciseId: string) => {
    router.push(`/workout/exercise/${exerciseId}`);
  }, [router]);

  // 종료 확인
  const handleExitConfirm = () => {
    setShowExitConfirm(true);
    pauseSession();
  };

  // 종료 취소
  const handleExitCancel = () => {
    setShowExitConfirm(false);
    resumeSession();
  };

  // 종료 확정
  const handleExit = () => {
    resetSession();
    router.push('/workout/plan');
  };

  // 홈으로
  const handleGoHome = () => {
    resetSession();
    router.push('/workout/plan');
  };

  // 휴식 완료 핸들러
  const handleRestComplete = useCallback(() => {
    skipRest();
    // 현재 운동이 완료되었으면 다음 운동으로
    const currentRecord = exerciseRecords[currentExerciseIndex];
    if (currentRecord?.isCompleted) {
      moveToNextExercise();
    }
  }, [skipRest, exerciseRecords, currentExerciseIndex, moveToNextExercise]);

  // 세트 완료 핸들러
  const handleCompleteSet = useCallback(() => {
    completeSet();
  }, [completeSet]);

  // 운동 건너뛰기 핸들러
  const handleSkipExercise = useCallback(() => {
    skipExercise();
    moveToNextExercise();
  }, [skipExercise, moveToNextExercise]);

  // 통계 계산
  const stats = getCompletionStats();

  // 로딩
  if (isLoading) {
    return (
      <AnalyzingLoader
        title="운동 준비 중"
        subtitle="오늘의 운동을 준비하고 있어요..."
      />
    );
  }

  // 에러
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => router.push('/workout/plan')}
        retryLabel="플랜으로 돌아가기"
      />
    );
  }

  // 세션 완료
  if (status === 'completed') {
    // 저장 중일 때 로딩 표시
    if (isSaving) {
      return (
        <AnalyzingLoader
          title="운동 기록 저장 중"
          subtitle="오늘의 운동을 기록하고 있어요..."
        />
      );
    }

    const totalVolume = exerciseRecords.reduce((sum, record) => {
      return sum + record.sets
        .filter((s) => s.status === 'completed')
        .reduce((setSum, s) => setSum + (s.actualReps || 0) * (s.actualWeight || 0), 0);
    }, 0);

    // 저장 실패 시 에러 UI와 완료 카드 함께 표시
    return (
      <>
        {saveError && (
          <div
            className="fixed top-4 left-4 right-4 z-[60] bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between"
            role="alert"
            data-testid="save-error-alert"
          >
            <span className="text-sm font-medium">{saveError}</span>
            <button
              onClick={handleRetrySave}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              data-testid="save-retry-button"
            >
              재시도
            </button>
          </div>
        )}
        <SessionCompletionCard
          totalExercises={stats.totalExercises}
          completedExercises={stats.completedExercises}
          totalSets={stats.totalSets}
          completedSets={stats.completedSets}
          totalTime={elapsedTime}
          caloriesBurned={estimatedCalories}
          totalVolume={totalVolume}
          currentStreak={isSaved ? currentStreak : 0}
          workoutType={workoutType}
          onGoHome={handleGoHome}
          onShare={handleShare}
        />
      </>
    );
  }

  // 휴식 타이머
  if (isResting && restTimeRemaining !== undefined && restTimeRemaining > 0) {
    // 현재 운동의 기본 휴식 시간
    const currentRestSeconds = exerciseRecords[currentExerciseIndex]?.restSeconds ?? 60;
    return (
      <RestTimer
        initialSeconds={restTimeRemaining}
        defaultSeconds={currentRestSeconds}
        onComplete={handleRestComplete}
        onSkip={skipRest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <WorkoutSessionHeader
        dayLabel={dayPlan.dayLabel}
        totalExercises={stats.totalExercises}
        completedExercises={stats.completedExercises}
        totalSets={stats.totalSets}
        completedSets={stats.completedSets}
        estimatedCalories={estimatedCalories}
        elapsedTime={elapsedTime}
        isPaused={status === 'paused'}
        onPause={pauseSession}
        onResume={resumeSession}
        onExit={handleExitConfirm}
      />

      {/* 운동 시작 안내 (시작 전) */}
      {status === 'not_started' && (
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              오늘의 운동을 시작할까요?
            </h2>
            <p className="text-gray-600 mb-6">
              {dayPlan.exercises.length}개 운동 / 약 {dayPlan.estimatedMinutes}분
            </p>
            <button
              onClick={startSession}
              className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
            >
              운동 시작하기
            </button>

            {/* 면책 조항 (스펙 16.3: 운동 시작 전 표시) */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-600">안내</span>
                <br />
                본 서비스는 전문 의료 조언을 대체하지 않습니다.
                <br />
                <br />
                • 부상이나 통증이 있는 경우 전문가와 상담 후 운동하세요.
                <br />
                • 운동 중 통증이 발생하면 즉시 중단하세요.
                <br />
                • 무게와 강도는 점진적으로 늘려주세요.
                <br />
                • 임산부, 심장질환자, 고혈압 환자는 의사와 상담 후 운동하세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 운동 리스트 */}
      {(status === 'in_progress' || status === 'resting') && (
        <div className="p-4 space-y-3">
          {exerciseRecords.map((record, index) => (
            <ExerciseSessionCard
              key={record.exerciseId}
              record={record}
              exerciseIndex={index}
              currentExerciseIndex={currentExerciseIndex}
              currentSetIndex={currentSetIndex}
              onStartExercise={() => startExercise(index)}
              onCompleteSet={handleCompleteSet}
              onSkipSet={skipSet}
              onSkipExercise={handleSkipExercise}
              onViewDetail={() => handleViewDetail(record.exerciseId)}
            />
          ))}

          {/* 다음 운동 버튼 (현재 운동 완료 시) */}
          {exerciseRecords[currentExerciseIndex]?.isCompleted && (
            <div className="pt-4">
              {currentExerciseIndex < exerciseRecords.length - 1 ? (
                <button
                  onClick={moveToNextExercise}
                  className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
                >
                  다음 운동으로
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                >
                  운동 완료하기
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 종료 확인 모달 */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 id="exit-dialog-title" className="text-lg font-bold text-gray-900 mb-2">
              운동을 종료할까요?
            </h3>
            <p className="text-gray-600 mb-6">
              진행 중인 운동 기록이 저장되지 않습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExitCancel}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                계속하기
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
