'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

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

// 임시 데이터
const weekSummary = {
  avgCalories: 1850,
  workoutCount: 4,
  targetWorkout: 5,
  avgWater: 7,
  weightChange: -0.5,
};

const todayMeals = [
  { type: 'breakfast', label: '아침', calories: 420, recorded: true },
  { type: 'lunch', label: '점심', calories: 650, recorded: true },
  { type: 'dinner', label: '저녁', calories: 0, recorded: false },
  { type: 'snack', label: '간식', calories: 150, recorded: true },
];

const recentWorkouts = [
  { date: '12/26', type: '하체 운동', duration: 45, calories: 320 },
  { date: '12/25', type: '유산소', duration: 30, calories: 250 },
  { date: '12/24', type: '상체 운동', duration: 40, calories: 280 },
];

export default function RecordPage() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('nutrition');
  const [waterCount, setWaterCount] = useState(6);

  const targetWater = 8;
  const targetCalories = 2000;
  const consumedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);

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

      <main className="px-4 py-4 space-y-4">
        {/* 주간 요약 */}
        <FadeInUp>
          <section className="bg-card rounded-2xl border p-4" aria-label="주간 요약">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">
                <span aria-hidden="true">📅 </span>12월 4주차 요약
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
                <p className="text-xs text-muted-foreground">📈 체중 변화</p>
                <p className="text-lg font-bold text-green-600">
                  {weekSummary.weightChange}kg
                </p>
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
                      onClick={() =>
                        router.push(`/record/nutrition/add?meal=${meal.type}`)
                      }
                      className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {meal.type === 'breakfast'
                            ? '🍳'
                            : meal.type === 'lunch'
                              ? '🍱'
                              : meal.type === 'dinner'
                                ? '🍽️'
                                : '🍪'}
                        </span>
                        <span className="font-medium">{meal.label}</span>
                      </div>
                      {meal.recorded ? (
                        <span className="text-sm text-foreground">
                          {meal.calories} kcal
                        </span>
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
                <h2 className="font-semibold mb-2 flex items-center gap-2">
                  🍽️ 오늘 뭐 먹지?
                </h2>
                <p className="text-sm text-muted-foreground">
                  피부 + 체형 + 목표 맞춤 AI 추천
                </p>
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
                  <span className="text-sm text-muted-foreground" aria-label={`${targetWater}잔 중 ${waterCount}잔 섭취`}>
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
                  onClick={() => setWaterCount(Math.min(waterCount + 1, targetWater))}
                  className="w-full py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                  aria-label="물 1잔 추가"
                >
                  + 1잔
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
                      <p className="text-sm text-muted-foreground">
                        단식 중 (12시간 32분 남음)
                      </p>
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
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  💪 오늘의 운동 계획
                </h2>
                <div className="bg-white/50 rounded-xl p-4">
                  <p className="font-medium text-foreground">상체 운동 (30분)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    푸시업, 덤벨 프레스, 숄더 프레스
                  </p>
                </div>
                <button
                  onClick={() => router.push('/workout/session/start')}
                  className="mt-3 w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  시작하기
                </button>
              </section>
            </FadeInUp>

            {/* 최근 운동 기록 */}
            <FadeInUp delay={3}>
              <section className="bg-card rounded-2xl border p-4">
                <h2 className="font-semibold mb-3 text-foreground">최근 운동 기록</h2>
                <div className="space-y-2">
                  {recentWorkouts.map((workout, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {workout.date}
                        </span>
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
      </main>

      <BottomNav />
    </div>
  );
}
