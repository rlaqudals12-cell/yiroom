'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Dumbbell,
  Play,
  History,
  BarChart3,
  Flame,
  Trophy,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { getLatestWorkoutAnalysisAction, getWorkoutStreakAction } from './actions';
import type { WorkoutAnalysis, WorkoutStreak } from '@/lib/api/workout';
import { WORKOUT_TYPE_INFO } from '@/lib/workout/classifyWorkoutType';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * 운동 메인 페이지
 * - 분석 완료 전: 온보딩 유도
 * - 분석 완료 후: 대시보드 UI
 */
export default function WorkoutPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!isLoaded || !user?.id) {
      if (isLoaded) setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        console.log('[W-1 Page] Loading data for user:', user.id);
        const [analysisData, streakData] = await Promise.all([
          getLatestWorkoutAnalysisAction(user.id),
          getWorkoutStreakAction(user.id),
        ]);
        console.log('[W-1 Page] Analysis data:', analysisData);
        console.log('[W-1 Page] Streak data:', streakData);
        setAnalysis(analysisData);
        setStreak(streakData);
      } catch (error) {
        console.error('[W-1 Page] Failed to load workout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isLoaded, user?.id]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 분석 데이터가 없으면 온보딩 유도
  if (!analysis) {
    return <OnboardingPrompt />;
  }

  // 분석 완료 후: 대시보드 UI
  const typeInfo = WORKOUT_TYPE_INFO[analysis.workout_type];

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="h-6 w-6" />
          내 운동
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          오늘도 건강한 하루를 시작해보세요!
        </p>
      </div>

      {/* 운동 타입 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${typeInfo.bgColor}`}
            >
              {typeInfo.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">내 운동 타입</p>
              <p className={`text-xl font-bold ${typeInfo.color}`}>
                {typeInfo.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {typeInfo.description.slice(0, 30)}...
              </p>
            </div>
            <Link href="/workout/result">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 오늘의 운동 - 바로 시작 */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">오늘의 운동</p>
              <p className="text-xl font-bold mt-1">준비되셨나요?</p>
              <p className="text-indigo-100 text-sm mt-1">
                운동을 시작하고 기록을 남겨보세요
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="bg-card text-indigo-600 hover:bg-muted"
              onClick={() => router.push('/workout/session')}
            >
              <Play className="h-5 w-5 mr-1" />
              시작
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 스트릭 카드 */}
      {streak && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              연속 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-500">
                  {streak.current_streak}
                  <span className="text-lg text-muted-foreground">일</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  현재 연속 기록
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span>최장 {streak.longest_streak}일</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빠른 액션 */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">바로가기</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={<Play className="h-5 w-5" />}
            label="운동 시작"
            href="/workout/session"
          />
          <QuickActionCard
            icon={<History className="h-5 w-5" />}
            label="운동 기록"
            href="/workout/history"
          />
          <QuickActionCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="분석 결과"
            href="/workout/result"
          />
          <QuickActionCard
            icon={<Dumbbell className="h-5 w-5" />}
            label="주간 플랜"
            href="/workout/plan"
          />
        </div>
      </div>

      {/* 새 분석 시작 */}
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/workout/onboarding/step1')}
        >
          새로운 분석 시작하기
        </Button>
      </div>
    </div>
  );
}

// 온보딩 유도 컴포넌트
function OnboardingPrompt() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
          <Dumbbell className="h-10 w-10 text-indigo-500" />
        </div>

        {/* 텍스트 */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            나만의 운동 플랜
          </h2>
          <p className="text-muted-foreground">
            체형에 맞는 맞춤 운동을 추천해드려요
          </p>
        </div>

        {/* 시작 버튼 */}
        <Link
          href="/workout/onboarding/step1"
          className="block w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-center font-medium rounded-xl transition-colors"
        >
          운동 추천 시작하기
        </Link>

        {/* 설명 */}
        <div className="text-left bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground font-medium mb-2">이런 분석을 받게 돼요:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ 내 체형에 맞는 운동 타입 분석</li>
            <li>✓ 목표에 맞는 주간 운동 플랜</li>
            <li>✓ 맞춤 운동 동작 추천</li>
            <li>✓ 운동 기록 및 진행 추적</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 빠른 액션 카드 컴포넌트
function QuickActionCard({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
    >
      <div className="text-indigo-500">{icon}</div>
      <span className="font-medium text-foreground">{label}</span>
    </Link>
  );
}
