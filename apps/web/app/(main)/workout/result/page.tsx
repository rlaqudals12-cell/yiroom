'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorkoutInputStore, type PersonalColorSeason } from '@/lib/stores/workoutInputStore';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { convertSkinMetricsToSummary } from '@/lib/nutrition/skinInsight';
import type { MetricStatus } from '@/lib/mock/skin-analysis';
import { classifyWorkoutType, WorkoutTypeResult } from '@/lib/workout/classifyWorkoutType';
import { saveWorkoutAnalysisAction } from '../actions';
import { getRecommendedExercises } from '@/lib/workout/exercises';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import {
  WorkoutTypeCard,
  RecommendedExerciseList,
  BodyTypeInsight,
  WorkoutStyleCard,
  PostWorkoutSkinCareCard,
  PostWorkoutNutritionCard,
  RecommendedEquipmentCard,
  RecommendedSupplementCard,
} from '@/components/workout/result';
import type { SkinAnalysisSummary } from '@/lib/workout/skinTips';
import type { WorkoutType } from '@/lib/workout/nutritionTips';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { Exercise, BodyType } from '@/types/workout';
import { Dumbbell, Calendar } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { FadeInUp, ScaleIn, Confetti } from '@/components/animations';

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
    // 사용자 로드 대기
    if (!isUserLoaded) {
      return;
    }

    // 입력 데이터 가져오기
    const inputData = getInputData();

    // 유효성 검증
    const validation = validateAllSteps(inputData);
    if (!validation.isValid) {
      setError('필수 정보가 누락되었습니다. 다시 시작해주세요.');
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
        setError('분석 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        // 분석 완료 시 축하 효과
        setShowConfetti(true);
      }
    }, 2000); // 2초 로딩 (UX용)

    return () => clearTimeout(analyzeTimer);
  }, [getInputData, isUserLoaded, saveAnalysisToDatabase, supabase]);

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
      <AnalyzingLoader title="AI가 분석 중입니다" subtitle="당신에게 맞는 운동을 찾고 있어요..." />
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

      <div ref={shareRef} className="space-y-6">
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
        {personalColor && (
          <FadeInUp delay={3}>
            <WorkoutStyleCard personalColor={personalColor} bodyType={bodyType} />
          </FadeInUp>
        )}

        {/* S-1 연동: 운동 후 피부 관리 팁 */}
        {result && (
          <FadeInUp delay={4}>
            <PostWorkoutSkinCareCard
              workoutType={result.type}
              durationMinutes={durationMinutes}
              skinAnalysis={skinAnalysis}
            />
          </FadeInUp>
        )}

        {/* N-1 연동 준비: 운동 후 영양 가이드 */}
        {result && (
          <FadeInUp delay={5}>
            <PostWorkoutNutritionCard
              workoutType={result.type as WorkoutType}
              durationMinutes={durationMinutes}
            />
          </FadeInUp>
        )}

        {/* 운동 기구 추천 */}
        <FadeInUp delay={6}>
          <RecommendedEquipmentCard
            skillLevel="beginner"
            useLocation={location === 'gym' ? 'gym' : location === 'outdoor' ? 'outdoor' : 'home'}
          />
        </FadeInUp>

        {/* 영양제 추천 */}
        <FadeInUp delay={7}>
          <RecommendedSupplementCard workoutGoals={goals} concerns={concerns} />
        </FadeInUp>

        {/* 추천 운동 섹션 */}
        <FadeInUp delay={8}>
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
                  <p className="text-sm">추천 운동이 없습니다</p>
                </div>
              </div>
            )}
          </div>
        </FadeInUp>

        {/* 액션 버튼 */}
        <FadeInUp delay={9}>
          <div className="space-y-3">
            <button
              onClick={handleViewPlan}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-4 font-medium text-white transition-colors hover:bg-indigo-600"
            >
              <Calendar className="h-5 w-5" />
              주간 플랜 보기
            </button>
            <button
              onClick={handleStartWorkout}
              className="bg-card flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 py-4 font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Dumbbell className="h-5 w-5" />
              바로 운동 시작
            </button>
          </div>
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
