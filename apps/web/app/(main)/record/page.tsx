'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Dumbbell,
  Utensils,
  Camera,
  Plus,
  Droplets,
  Timer,
  ChevronRight,
  Flame,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 기록 탭 - 운동 + 영양 통합
 * - 세그먼트 토글 (운동/영양)
 * - 주간 요약
 * - 오늘 기록
 * - 오늘 뭐 먹지? AI 추천
 * - 수분 섭취
 * - 간헐적 단식 타이머
 */

type Segment = 'workout' | 'nutrition';

interface WeekSummary {
  avgCalories: number;
  workoutCount: number;
  targetWorkout: number;
  avgWater: number;
}

interface TodayMeal {
  type: string;
  label: string;
  calories: number;
  recorded: boolean;
}

interface RecentWorkout {
  date: string;
  type: string;
  duration: number;
  calories: number;
}

// 날짜 유틸리티
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const month = now.getMonth() + 1;
  const weekOfMonth = Math.ceil(now.getDate() / 7);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    label: `${month}월 ${weekOfMonth}주차 요약`,
  };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 기본 식사 슬롯 (DB에 기록이 없어도 표시)
const MEAL_SLOTS = [
  { type: 'breakfast', label: '아침' },
  { type: 'lunch', label: '점심' },
  { type: 'dinner', label: '저녁' },
  { type: 'snack', label: '간식' },
];

export default function RecordPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [segment, setSegment] = useState<Segment>('nutrition');

  // 데이터 상태
  const [isLoading, setIsLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState<WeekSummary>({
    avgCalories: 0,
    workoutCount: 0,
    targetWorkout: 5,
    avgWater: 0,
  });
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>(
    MEAL_SLOTS.map((s) => ({ ...s, calories: 0, recorded: false }))
  );
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [waterCount, setWaterCount] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2000);

  const targetWater = 8;
  const consumedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);

  // DB에서 데이터 가져오기
  const fetchRecordData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const today = getToday();
    const week = getWeekRange();

    try {
      const [mealsRes, workoutsRes, weekNutritionRes, weekWorkoutsRes, settingsRes] =
        await Promise.all([
          // 오늘 식사 기록
          supabase
            .from('meal_records')
            .select('meal_type, total_calories')
            .eq('clerk_user_id', user.id)
            .eq('meal_date', today),

          // 최근 운동 기록 (5개)
          supabase
            .from('workout_logs')
            .select('workout_date, actual_duration, actual_calories, exercise_logs')
            .eq('user_id', user.id)
            .order('workout_date', { ascending: false })
            .limit(5),

          // 이번 주 영양 요약
          supabase
            .from('daily_nutrition_summary')
            .select('total_calories, water_intake')
            .eq('clerk_user_id', user.id)
            .gte('date', week.start)
            .lte('date', week.end),

          // 이번 주 운동 횟수
          supabase
            .from('workout_logs')
            .select('id')
            .eq('user_id', user.id)
            .gte('workout_date', week.start)
            .lte('workout_date', week.end),

          // 영양 설정 (목표 칼로리)
          supabase
            .from('nutrition_settings')
            .select('target_calories')
            .eq('clerk_user_id', user.id)
            .maybeSingle(),
        ]);

      // 오늘 식사 매핑
      const mealMap = new Map<string, number>();
      if (mealsRes.data) {
        for (const meal of mealsRes.data) {
          const existing = mealMap.get(meal.meal_type) ?? 0;
          mealMap.set(meal.meal_type, existing + (meal.total_calories ?? 0));
        }
      }
      setTodayMeals(
        MEAL_SLOTS.map((slot) => ({
          type: slot.type,
          label: slot.label,
          calories: mealMap.get(slot.type) ?? 0,
          recorded: mealMap.has(slot.type),
        }))
      );

      // 최근 운동 매핑
      if (workoutsRes.data) {
        setRecentWorkouts(
          workoutsRes.data.map((w) => {
            // exercise_logs에서 운동 유형 추출
            const logs = w.exercise_logs as Array<{ name?: string }> | null;
            const workoutType = logs?.[0]?.name ?? '운동';
            return {
              date: formatShortDate(w.workout_date),
              type: workoutType,
              duration: w.actual_duration ?? 0,
              calories: w.actual_calories ?? 0,
            };
          })
        );
      }

      // 주간 요약 계산
      const nutritionData = weekNutritionRes.data ?? [];
      const daysWithData = nutritionData.length || 1;
      const totalCalories = nutritionData.reduce((sum, d) => sum + (d.total_calories ?? 0), 0);
      const totalWater = nutritionData.reduce((sum, d) => sum + (d.water_intake ?? 0), 0);

      setWeekSummary({
        avgCalories: Math.round(totalCalories / daysWithData),
        workoutCount: weekWorkoutsRes.data?.length ?? 0,
        targetWorkout: 5,
        avgWater: Math.round(totalWater / daysWithData),
      });

      // 오늘 수분 섭취
      const todayNutrition = nutritionData.find(() => true); // 가장 최근
      if (todayNutrition) {
        setWaterCount(todayNutrition.water_intake ?? 0);
      }

      // 목표 칼로리
      if (settingsRes.data?.target_calories) {
        setTargetCalories(settingsRes.data.target_calories);
      }
    } catch (err) {
      console.error('[Record] Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchRecordData();
    }
  }, [isLoaded, user?.id, fetchRecordData]);

  // 수분 섭취 업데이트 (optimistic + DB 저장)
  const handleAddWater = useCallback(async () => {
    if (!user?.id) return;
    const newCount = Math.min(waterCount + 1, targetWater);
    setWaterCount(newCount);

    try {
      const today = getToday();
      await supabase.from('daily_nutrition_summary').upsert(
        {
          clerk_user_id: user.id,
          date: today,
          water_intake: newCount,
        },
        { onConflict: 'clerk_user_id,date' }
      );
    } catch (err) {
      console.error('[Record] Water update failed:', err);
    }
  }, [user?.id, supabase, waterCount, targetWater]);

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="record-page">
      {/* 페이지 제목 (스크린리더용) */}
      <h1 className="sr-only">기록 - 운동 및 영양 관리</h1>

      {/* 세그먼트 토글 */}
      <nav className="sticky top-0 z-40 bg-background border-b" aria-label="기록 유형 선택">
        <div className="flex" role="tablist" aria-label="운동/영양 탭">
          <button
            onClick={() => setSegment('workout')}
            role="tab"
            aria-selected={segment === 'workout'}
            aria-controls="workout-panel"
            className={cn(
              'flex-1 py-4 text-center font-medium transition-colors border-b-2',
              segment === 'workout'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Dumbbell className="w-5 h-5" aria-hidden="true" />
              운동
            </div>
          </button>
          <button
            onClick={() => setSegment('nutrition')}
            role="tab"
            aria-selected={segment === 'nutrition'}
            aria-controls="nutrition-panel"
            className={cn(
              'flex-1 py-4 text-center font-medium transition-colors border-b-2',
              segment === 'nutrition'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Utensils className="w-5 h-5" aria-hidden="true" />
              영양
            </div>
          </button>
        </div>
      </nav>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      <div className={cn('px-4 py-4 space-y-4', isLoading && 'opacity-50 pointer-events-none')}>
        {/* 주간 요약 */}
        <FadeInUp>
          <section className="bg-card rounded-2xl border p-4" aria-label="주간 요약">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">
                <span aria-hidden="true">📅 </span>
                {getWeekRange().label}
              </h2>
              <button
                onClick={() => router.push('/record/report')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                상세 리포트
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">🔥 평균 칼로리</p>
                <p className="text-lg font-bold">{weekSummary.avgCalories} kcal/일</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">💪 운동</p>
                <p className="text-lg font-bold">
                  {weekSummary.workoutCount}회
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {weekSummary.targetWorkout}회
                  </span>
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">💧 평균 수분</p>
                <p className="text-lg font-bold">{weekSummary.avgWater}잔/일</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">🎯 목표 칼로리</p>
                <p className="text-lg font-bold">{targetCalories} kcal</p>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 영양 세그먼트 */}
        {segment === 'nutrition' && (
          <>
            {/* 오늘 기록 */}
            <FadeInUp delay={1}>
              <section className="bg-card rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">오늘 기록</h2>
                  <span className="text-sm text-muted-foreground">
                    {consumedCalories} / {targetCalories} kcal
                  </span>
                </div>
                <div className="space-y-2">
                  {todayMeals.map((meal) => (
                    <button
                      key={meal.type}
                      onClick={() => router.push(`/record/nutrition/add?meal=${meal.type}`)}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {selectByKey(
                            meal.type,
                            {
                              breakfast: '🍳',
                              lunch: '🍱',
                              dinner: '🍽️',
                            },
                            '🍪'
                          )}
                        </span>
                        <span className="font-medium">{meal.label}</span>
                      </div>
                      {meal.recorded ? (
                        <span className="text-sm text-foreground">{meal.calories} kcal</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">(미입력)</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => router.push('/record/nutrition/add')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">식사 추가</span>
                  </button>
                  <button
                    onClick={() => router.push('/record/nutrition/camera')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-medium">사진으로 기록</span>
                  </button>
                </div>
              </section>
            </FadeInUp>

            {/* 오늘 뭐 먹지? */}
            <FadeInUp delay={2}>
              <section className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4">
                <h2 className="font-semibold mb-2 flex items-center gap-2">🍽️ 오늘 뭐 먹지?</h2>
                <p className="text-sm text-muted-foreground">피부 + 체형 + 목표 맞춤 AI 추천</p>
                <button
                  onClick={() => router.push('/nutrition/suggest')}
                  className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  추천 받기
                </button>
              </section>
            </FadeInUp>

            {/* 수분 섭취 */}
            <FadeInUp delay={3}>
              <section className="bg-card rounded-2xl border p-4" aria-label="수분 섭취 기록">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" aria-hidden="true" />
                    수분 섭취
                  </h2>
                  <span
                    className="text-sm text-muted-foreground"
                    aria-label={`${targetWater}잔 중 ${waterCount}잔 섭취`}
                  >
                    {waterCount} / {targetWater}잔
                  </span>
                </div>
                <div
                  className="flex gap-2 mb-3"
                  role="progressbar"
                  aria-valuenow={waterCount}
                  aria-valuemin={0}
                  aria-valuemax={targetWater}
                  aria-label={`수분 섭취 ${waterCount}/${targetWater}잔`}
                >
                  {Array.from({ length: targetWater }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-8 rounded-full transition-colors',
                        i < waterCount ? 'bg-blue-400' : 'bg-muted'
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddWater}
                  disabled={waterCount >= targetWater}
                  className="w-full py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                  aria-label="물 1잔 추가"
                >
                  {waterCount >= targetWater ? '목표 달성!' : '+ 1잔'}
                </button>
              </section>
            </FadeInUp>

            {/* 간헐적 단식 */}
            <FadeInUp delay={4}>
              <section className="bg-card rounded-2xl border p-4" aria-label="간헐적 단식 상태">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-purple-500" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-foreground">간헐적 단식</p>
                      <p className="text-sm text-muted-foreground">타이머를 설정해보세요</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/record/fasting')}
                    className="text-sm text-primary hover:underline"
                    aria-label="간헐적 단식 설정 열기"
                  >
                    설정
                  </button>
                </div>
              </section>
            </FadeInUp>
          </>
        )}

        {/* 운동 세그먼트 */}
        {segment === 'workout' && (
          <>
            {/* 이번 주 운동 */}
            <FadeInUp delay={1}>
              <section className="bg-card rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">📅 이번 주 운동</h2>
                  <span className="text-sm text-muted-foreground">
                    {weekSummary.workoutCount} / {weekSummary.targetWorkout}회
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(weekSummary.workoutCount / weekSummary.targetWorkout) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  목표까지 {weekSummary.targetWorkout - weekSummary.workoutCount}회 남았어요!
                </p>
              </section>
            </FadeInUp>

            {/* 오늘의 운동 계획 */}
            <FadeInUp delay={2}>
              <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">💪 오늘의 운동</h2>
                {weekSummary.workoutCount > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    이번 주 {weekSummary.workoutCount}회 운동했어요!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">아직 이번 주 운동 기록이 없어요</p>
                )}
                <button
                  onClick={() => router.push('/workout/session/start')}
                  className="mt-3 w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  운동 시작하기
                </button>
              </section>
            </FadeInUp>

            {/* 최근 운동 기록 */}
            <FadeInUp delay={3}>
              <section className="bg-card rounded-2xl border p-4">
                <h2 className="font-semibold mb-3 text-foreground">최근 운동 기록</h2>
                {recentWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {recentWorkouts.map((workout, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{workout.date}</span>
                          <span className="font-medium">{workout.type}</span>
                          <span className="text-sm text-muted-foreground">
                            {workout.duration}분
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-medium">{workout.calories}kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">아직 운동 기록이 없어요</p>
                    <p className="text-xs text-muted-foreground mt-1">첫 운동을 기록해보세요!</p>
                  </div>
                )}
                <button
                  onClick={() => router.push('/workout/history')}
                  className="mt-3 w-full text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  전체 기록 보기
                </button>
              </section>
            </FadeInUp>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
