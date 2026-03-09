'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorkoutInputStore, type PersonalColorSeason } from '@/lib/stores/workoutInputStore';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { convertSkinMetricsToSummary } from '@/lib/nutrition';
import type { MetricStatus } from '@/lib/mock/skin-analysis';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import {
  classifyWorkoutType,
  getRecommendedExercises,
  type WorkoutTypeResult,
} from '@/lib/workout';
import { saveWorkoutAnalysisAction } from '../actions';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import dynamic from 'next/dynamic';
// 메인 결과 카드는 즉시 로드 (above the fold)
import { WorkoutTypeCard } from '@/components/workout/result';

// 하단 카드들은 dynamic import (below the fold, 번들 분할)
const BodyTypeInsight = dynamic(() => import('@/components/workout/result/BodyTypeInsight'), {
  ssr: false,
});
const WorkoutStyleCard = dynamic(() => import('@/components/workout/result/WorkoutStyleCard'), {
  ssr: false,
});
const PostWorkoutSkinCareCard = dynamic(
  () => import('@/components/workout/result/PostWorkoutSkinCareCard'),
  { ssr: false }
);
const PostWorkoutNutritionCard = dynamic(
  () => import('@/components/workout/result/PostWorkoutNutritionCard'),
  { ssr: false }
);
const RecommendedEquipmentCard = dynamic(
  () => import('@/components/workout/result/RecommendedEquipmentCard'),
  { ssr: false }
);
const RecommendedSupplementCard = dynamic(
  () => import('@/components/workout/result/RecommendedSupplementCard'),
  { ssr: false }
);
const RecommendedExerciseList = dynamic(
  () => import('@/components/workout/result/RecommendedExerciseList'),
  { ssr: false }
);
import type { SkinAnalysisSummary, WorkoutType } from '@/lib/workout';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { Exercise, BodyType } from '@/types/workout';
import { Dumbbell, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { FadeInUp, ScaleIn, Confetti } from '@/components/animations';
import { AITransparencyNotice } from '@/components/common/AIBadge';
const ConsultantCTA = dynamic(
  () => import('@/components/coach/ConsultantCTA').then((mod) => ({ default: mod.ConsultantCTA })),
  { ssr: false }
);

export default function ResultPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const { getInputData, resetAll } = useWorkoutInputStore();
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-운동타입-결과');

  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<WorkoutTypeResult | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [location, setLocation] = useState<'home' | 'gym' | 'outdoor'>('home');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [personalColor, setPersonalColor] = useState<PersonalColorSeason | null>(null);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Zustand persist 하이드레이션 대기
  useEffect(() => {
    const unsub = useWorkoutInputStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    // 이미 하이드레이션이 완료된 경우
    if (useWorkoutInputStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => {
      unsub();
    };
  }, []);

  // Server Action을 통해 분석 결과를 DB에 저장하는 함수
  const saveAnalysisToDatabase = useCallback(
    async (inputData: ReturnType<typeof getInputData>) => {
      if (!user?.id) {
        return;
      }

      try {
        const result = await saveWorkoutAnalysisAction(user.id, {
          bodyType: inputData.bodyTypeData?.type,
          goals: inputData.goals || [],
          concerns: inputData.concerns || [],
          frequency: inputData.frequency || '3-4',
          location: inputData.location || 'home',
          equipment: inputData.equipment || [],
          injuries: inputData.injuries || [],
          targetWeight: inputData.targetWeight,
          targetDate: inputData.targetDate,
        });

        if (!result.success) {
          console.error('[W-1] Failed to save analysis:', result.error);
        }
      } catch (err) {
        console.error('[W-1] Error saving analysis to database:', err);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    // 사용자 로드 + Zustand 하이드레이션 대기
    if (!isUserLoaded || !isHydrated) {
      return;
    }

    // 입력 데이터 가져오기
    const inputData = getInputData();

    // 유효성 검증
    const validation = validateAllSteps(inputData);
    if (!validation.isValid) {
      setError('필수 정보가 누락되었어요. 다시 시작해주세요.');
      setIsLoading(false);
      return;
    }

    // 분석 시뮬레이션 (실제로는 AI API 호출)
    const analyzeTimer = setTimeout(async () => {
      try {
        const typeResult = classifyWorkoutType(inputData);
        setResult(typeResult);

        // 추천 운동 가져오기
        const recommendedExercises = getRecommendedExercises(
          typeResult.type,
          inputData.concerns || [],
          12
        );
        setExercises(recommendedExercises);
        setConcerns(inputData.concerns || []);
        setGoals(inputData.goals || []);
        setLocation((inputData.location as 'home' | 'gym' | 'outdoor') || 'home');

        // 운동 빈도 기반 예상 운동 시간 설정
        const frequencyToDuration: Record<string, number> = {
          '1-2': 20,
          '3-4': 30,
          '5+': 45,
        };
        setDurationMinutes(frequencyToDuration[inputData.frequency || '3-4'] || 30);

        // 체형 및 퍼스널 컬러 저장
        const userBodyType = inputData.bodyTypeData?.type as BodyType | undefined;
        const userPC = inputData.personalColor;

        if (userBodyType) {
          setBodyType(userBodyType);
        }
        if (userPC) {
          setPersonalColor(userPC);
        }

        // S-1 피부 분석 데이터 조회
        try {
          const { data: skinData } = await supabase
            .from('skin_analyses')
            .select('metrics')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (skinData?.metrics && Array.isArray(skinData.metrics)) {
            const metricsArray = skinData.metrics as Array<{ id: string; status: MetricStatus }>;
            const summary = convertSkinMetricsToSummary(metricsArray);
            setSkinAnalysis(summary);
          }
        } catch (skinErr) {
          console.warn('[W-1] Skin analysis fetch failed:', skinErr);
          // 피부 분석 실패해도 운동 결과는 계속 표시
        }

        // DB에 분석 결과 저장 (비동기)
        await saveAnalysisToDatabase(inputData);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('분석 중 오류가 발생했어요.');
      } finally {
        setIsLoading(false);
        // 분석 완료 시 축하 효과
        setShowConfetti(true);
      }
    }, 2000); // 2초 로딩 (UX용)

    return () => clearTimeout(analyzeTimer);
  }, [getInputData, isUserLoaded, isHydrated, saveAnalysisToDatabase, supabase]);

  // 다시 시작
  const handleRestart = () => {
    resetAll();
    router.push('/workout/onboarding/step1');
  };

  // 주간 플랜 보기
  const handleViewPlan = () => {
    router.push('/workout/plan');
  };

  // 운동 시작 - 플랜 페이지에서 운동 선택 후 시작
  const handleStartWorkout = () => {
    router.push('/workout/plan');
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <AnalyzingLoader
        title="맞춤 운동을 찾고 있어요"
        subtitle="체형과 목표에 맞는 운동을 분석하고 있어요..."
      />
    );
  }

  // 에러 상태
  if (error) {
    return <ErrorState message={error} onRetry={handleRestart} retryLabel="다시 시작" />;
  }

  // 결과 없음
  if (!result) {
    return null;
  }

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <div ref={shareRef} className="space-y-6" data-testid="workout-result-page">
        {/* 헤더 */}
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-foreground mb-2 text-2xl font-bold">분석 완료!</h1>
            <p className="text-muted-foreground">당신에게 맞는 운동 타입을 찾았어요</p>
          </div>
        </FadeInUp>

        {/* 운동 타입 카드 - 메인 결과로 ScaleIn 강조 */}
        <ScaleIn delay={1}>
          <WorkoutTypeCard type={result.type} reason={result.reason} />
        </ScaleIn>

        {/* 체형 기반 인사이트 */}
        <FadeInUp delay={2}>
          <BodyTypeInsight bodyType={bodyType} workoutType={result.type} concerns={concerns} />
        </FadeInUp>

        {/* PC-1 연동: 운동복 스타일 가이드 */}
        {personalColor ? (
          <FadeInUp delay={3}>
            <WorkoutStyleCard personalColor={personalColor} bodyType={bodyType} />
          </FadeInUp>
        ) : (
          <FadeInUp delay={3}>
            <div className="bg-card border-border/50 rounded-2xl border p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">운동복 스타일 가이드</p>
              <p className="text-sm text-muted-foreground">
                퍼스널 컬러 진단을 받으면 나에게 어울리는 운동복 색상을 추천받을 수 있어요.
              </p>
            </div>
          </FadeInUp>
        )}

        {/* 추천 운동 섹션 */}
        <FadeInUp delay={6}>
          <div className="bg-card border-border/50 rounded-2xl border p-6 shadow-sm">
            <h3 className="text-foreground mb-4 text-lg font-bold">추천 운동</h3>
            {exercises.length > 0 ? (
              <RecommendedExerciseList
                exercises={exercises}
                onExerciseClick={(id) => router.push(`/workout/exercise/${id}`)}
              />
            ) : (
              <div className="text-muted-foreground flex items-center justify-center py-8">
                <div className="text-center">
                  <Dumbbell className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p className="text-sm">추천 운동이 없어요</p>
                </div>
              </div>
            )}
          </div>
        </FadeInUp>

        {/* 액션 버튼 */}
        <FadeInUp delay={7}>
          <div className="space-y-3">
            <button
              onClick={handleViewPlan}
              aria-label="주간 운동 플랜 보기"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 dark:bg-indigo-600 py-4 font-medium text-white transition-colors hover:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              <Calendar className="h-5 w-5" />
              주간 플랜 보기
            </button>
            <button
              onClick={handleStartWorkout}
              aria-label="바로 운동 시작하기"
              className="bg-card flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 py-4 font-medium text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <Dumbbell className="h-5 w-5" />
              바로 운동 시작
            </button>
          </div>
        </FadeInUp>

        {/* 더 알아보기 — 접이식 보조 카드 그룹 (F1/F3 해결) */}
        <DetailCardsSection
          result={result}
          durationMinutes={durationMinutes}
          skinAnalysis={skinAnalysis}
          location={location}
          goals={goals}
          concerns={concerns}
          selectByKey={selectByKey}
        />

        {/* AI 운동 상담 CTA */}
        <FadeInUp delay={8}>
          <div className="p-4 bg-card rounded-xl border border-border">
            <ConsultantCTA
              category="workout"
              params={{ goal: goals[0] || '' }}
              showQuickQuestions
            />
          </div>
        </FadeInUp>

        {/* AI 기술 사용 안내 (K1/K2) */}
        <FadeInUp delay={9}>
          <AITransparencyNotice compact />
        </FadeInUp>

        {/* 다시 분석하기 */}
        <FadeInUp delay={9}>
          <button
            onClick={handleRestart}
            className="text-muted-foreground hover:text-foreground w-full py-3 text-sm transition-colors"
          >
            다시 분석하기
          </button>
        </FadeInUp>
      </div>

      {/* 공유 버튼 - 하단 고정 */}
      <div className="bg-card/80 border-border/50 fixed right-0 bottom-20 left-0 z-10 border-t p-4 backdrop-blur-sm">
        <div className="mx-auto max-w-md">
          <ShareButton onShare={share} loading={shareLoading} variant="outline" />
        </div>
      </div>
    </>
  );
}

/**
 * 접이식 보조 카드 섹션 — 피부 관리, 영양 가이드, 운동 기구, 영양제
 * F1(정보 밀도 ≤7) + F3(스크롤 깊이) 해결
 */
function DetailCardsSection({
  result,
  durationMinutes,
  skinAnalysis,
  location,
  goals,
  concerns,
  selectByKey: selectByKeyFn,
}: {
  result: WorkoutTypeResult;
  durationMinutes: number;
  skinAnalysis: SkinAnalysisSummary | null;
  location: 'home' | 'gym' | 'outdoor';
  goals: string[];
  concerns: string[];
  selectByKey: typeof selectByKey;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <FadeInUp delay={8}>
      <div className="bg-card border-border/50 rounded-2xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '상세 가이드 접기' : '상세 가이드 펼치기'}
        >
          <div className="text-left">
            <p className="font-medium text-foreground">운동 후 관리 & 추천 제품</p>
            <p className="text-sm text-muted-foreground">
              피부 관리, 영양 가이드, 운동 기구, 영양제
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
            {/* S-1 연동: 운동 후 피부 관리 팁 */}
            <PostWorkoutSkinCareCard
              workoutType={result.type}
              durationMinutes={durationMinutes}
              skinAnalysis={skinAnalysis}
            />

            {/* N-1 연동: 운동 후 영양 가이드 */}
            <PostWorkoutNutritionCard
              workoutType={result.type as WorkoutType}
              durationMinutes={durationMinutes}
            />

            {/* 운동 기구 추천 */}
            <RecommendedEquipmentCard
              skillLevel="beginner"
              useLocation={
                selectByKeyFn(
                  location,
                  { gym: 'gym' as const, outdoor: 'outdoor' as const },
                  'home' as const
                )!
              }
            />

            {/* 영양제 추천 */}
            <RecommendedSupplementCard workoutGoals={goals} concerns={concerns} />
          </div>
        )}
      </div>
    </FadeInUp>
  );
}
