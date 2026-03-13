'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { useMemo } from 'react';
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Calendar,
  Target,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { FadeInUp } from '@/components/animations';
import { EquipmentRecommendationCard } from '@/components/smart-matching';
import { getEquipmentRecommendations } from '@/lib/smart-matching/equipment-recommend';
import type { WorkoutLog } from '@/lib/api/workout';
import Link from 'next/link';

/**
 * 운동 기록 상세 페이지
 * - 해당 날짜의 운동 기록 상세 정보 표시
 * - 운동별 세트/렙/무게 정보
 * - 메모 및 컨디션 정보
 */
export default function WorkoutHistoryDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logId = params.id as string;

  // 운동기구 추천 (early return 이전에 hook 호출 필수)
  const equipmentMatch = useMemo(() => {
    return getEquipmentRecommendations('health', 'intermediate', true);
  }, []);

  useEffect(() => {
    const loadLog = async () => {
      if (!isLoaded || !user?.id || !logId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('id', logId)
          .single();

        if (dbError) {
          throw new Error(dbError.message);
        }

        if (!data) {
          throw new Error('운동 기록을 찾을 수 없어요');
        }

        setLog(data as WorkoutLog);
      } catch (err) {
        console.error('[Workout History] Load error:', err);
        setError('기록을 불러올 수 없어요. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLog();
  }, [isLoaded, user?.id, logId, supabase]);

  if (!isLoaded || isLoading) {
    return <AnalyzingLoader title="기록 불러오는 중" subtitle="운동 기록을 가져오고 있어요..." />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">로그인이 필요해요</h2>
          <p className="text-muted-foreground">운동 기록을 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <ErrorState message={error || '기록을 찾을 수 없어요'} onRetry={() => router.refresh()} />
    );
  }

  // 날짜 포맷팅
  const workoutDate = new Date(log.workout_date);
  const formattedDate = workoutDate.toLocaleDateString(getDateLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 기분 이모지
  const moodEmoji: Record<string, string> = {
    great: '😄',
    good: '🙂',
    okay: '😐',
    tired: '😓',
    bad: '😞',
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="workout-history-detail">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workout/history">
              <ArrowLeft className="h-4 w-4 mr-1" />
              뒤로
            </Link>
          </Button>
          <h1 className="text-lg font-bold">운동 기록</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {/* 날짜 및 요약 */}
        <FadeInUp>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">{formattedDate}</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {/* 운동 시간 */}
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{log.actual_duration || 0}</p>
                <p className="text-xs text-muted-foreground">분</p>
              </div>

              {/* 칼로리 */}
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Flame className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{log.actual_calories || 0}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>

              {/* 총 볼륨 */}
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{log.total_volume?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
            </div>

            {/* 기분 */}
            {log.mood && (
              <div className="mt-4 pt-4 border-t text-center">
                <span className="text-2xl">{moodEmoji[log.mood] || '🙂'}</span>
                <p className="text-sm text-muted-foreground mt-1">오늘의 컨디션</p>
              </div>
            )}
          </section>
        </FadeInUp>

        {/* 운동 목록 */}
        {log.exercise_logs && log.exercise_logs.length > 0 && (
          <FadeInUp delay={1}>
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">운동 목록</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {log.exercise_logs.length}개
                </span>
              </div>

              <div className="space-y-4">
                {log.exercise_logs.map((exercise, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">{exercise.exercise_name}</h3>
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>세트 {setIndex + 1}</span>
                          <span>
                            {set.weight ? `${set.weight}kg × ` : ''}
                            {set.reps}회
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </FadeInUp>
        )}

        {/* 메모 */}
        {log.notes && (
          <FadeInUp delay={2}>
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold">메모</h2>
              </div>
              <p className="text-foreground/80 leading-relaxed">{log.notes}</p>
            </section>
          </FadeInUp>
        )}

        {/* 운동 노력도 */}
        {log.perceived_effort && (
          <FadeInUp delay={3}>
            <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
                체감 노력도
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    style={{ width: `${log.perceived_effort * 10}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {log.perceived_effort}/10
                </span>
              </div>
            </section>
          </FadeInUp>
        )}

        {/* 운동기구 추천 */}
        {equipmentMatch.recommendations.length > 0 && (
          <FadeInUp delay={4}>
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">추천 장비</h2>
              </div>
              <EquipmentRecommendationCard match={equipmentMatch} />
            </section>
          </FadeInUp>
        )}
      </div>
    </div>
  );
}
