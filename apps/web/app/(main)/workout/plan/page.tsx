'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { classifyWorkoutType } from '@/lib/workout/classifyWorkoutType';
import {
  createWeeklyPlanFromInput,
  generatePlanSummary,
} from '@/lib/workout/weeklyPlan';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import {
  WeeklyPlanCard,
  DayExerciseList,
  PlanSummaryCard,
  WorkoutMetricsDashboard,
} from '@/components/workout/plan';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import type { WorkoutPlan, DayPlan, WorkoutType } from '@/types/workout';
import { ArrowLeft, Play, RefreshCw } from 'lucide-react';

export default function PlanPage() {
  const router = useRouter();
  const { getInputData, resetAll } = useWorkoutInputStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [userWeight, setUserWeight] = useState(60);
  const [frequency, setFrequency] = useState('3-4');

  useEffect(() => {
    const inputData = getInputData();

    // 유효성 검증
    const validation = validateAllSteps(inputData);
    if (!validation.isValid) {
      setError('필수 정보가 누락되었습니다. 다시 시작해주세요.');
      setIsLoading(false);
      return;
    }

    // 플랜 생성 시뮬레이션
    const timer = setTimeout(() => {
      try {
        // 운동 타입 분류
        const typeResult = classifyWorkoutType(inputData);
        setWorkoutType(typeResult.type);

        // 주간 플랜 생성
        const weeklyPlan = createWeeklyPlanFromInput(inputData, typeResult.type);
        setPlan(weeklyPlan);

        // 체중 및 빈도 저장
        const weight = inputData.bodyTypeData?.weight || 60;
        setUserWeight(weight);
        setFrequency(inputData.frequency || '3-4');

        // 오늘의 운동 자동 선택
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek];
        const todayPlan = weeklyPlan.days.find((d) => d.day === todayKey);
        if (todayPlan) {
          setSelectedDay(todayPlan);
        }
      } catch (err) {
        console.error('Plan generation error:', err);
        setError('플랜 생성 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [getInputData]);

  // 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // 다시 시작
  const handleRestart = () => {
    resetAll();
    router.push('/workout/onboarding/step1');
  };

  // 운동 시작
  const handleStartWorkout = () => {
    if (selectedDay && !selectedDay.isRestDay) {
      router.push(`/workout/session?day=${selectedDay.day}`);
    }
  };

  // 운동 상세 보기
  const handleExerciseClick = (exerciseId: string) => {
    router.push(`/workout/exercise/${exerciseId}`);
  };

  // 요일 선택
  const handleDayClick = (day: DayPlan) => {
    setSelectedDay(day);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <AnalyzingLoader
        title="주간 플랜 생성 중"
        subtitle="맞춤 운동 플랜을 준비하고 있어요..."
      />
    );
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={handleRestart}
        retryLabel="다시 시작"
      />
    );
  }

  // 플랜 없음
  if (!plan || !workoutType) {
    return null;
  }

  const summary = generatePlanSummary(plan);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">주간 운동 플랜</h1>
        <button
          onClick={handleRestart}
          className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
          title="플랜 재생성"
        >
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* 주간 캘린더 */}
      <WeeklyPlanCard
        days={plan.days}
        workoutType={workoutType}
        weekStartDate={plan.weekStartDate}
        onDayClick={handleDayClick}
        selectedDay={selectedDay?.day}
      />

      {/* 플랜 요약 */}
      <PlanSummaryCard {...summary} />

      {/* 7가지 지표 대시보드 */}
      <WorkoutMetricsDashboard
        plan={plan}
        frequency={frequency}
        userWeight={userWeight}
        completedDays={0}
        currentStreak={0}
      />

      {/* 선택된 날의 운동 리스트 */}
      {selectedDay && (
        <div className="space-y-4">
          <DayExerciseList
            day={selectedDay}
            workoutType={workoutType}
            userWeight={userWeight}
            onExerciseClick={handleExerciseClick}
          />

          {/* 운동 시작 버튼 */}
          {!selectedDay.isRestDay && selectedDay.exercises.length > 0 && (
            <button
              onClick={handleStartWorkout}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {selectedDay.dayLabel} 운동 시작
            </button>
          )}
        </div>
      )}
    </div>
  );
}
