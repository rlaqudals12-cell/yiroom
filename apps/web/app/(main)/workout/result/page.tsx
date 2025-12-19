'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorkoutInputStore, type PersonalColorSeason } from '@/lib/stores/workoutInputStore';
import {
  classifyWorkoutType,
  WorkoutTypeResult,
} from '@/lib/workout/classifyWorkoutType';
import { saveWorkoutAnalysisAction } from '../actions';
import { getRecommendedExercises } from '@/lib/workout/exercises';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import { matchCelebrityRoutines } from '@/lib/celebrityMatching';
import {
  WorkoutTypeCard,
  RecommendedExerciseList,
  BodyTypeInsight,
  CelebrityRoutineCard,
  WorkoutStyleCard,
  PostWorkoutSkinCareCard,
  PostWorkoutNutritionCard,
} from '@/components/workout/result';
import type { SkinAnalysisSummary } from '@/lib/workout/skinTips';
import type { WorkoutType } from '@/lib/workout/nutritionTips';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { Exercise, BodyType, CelebrityMatchResult } from '@/types/workout';
import { Dumbbell, Calendar } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { FadeInUp, ScaleIn, Confetti } from '@/components/animations';

export default function ResultPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getInputData, resetAll } = useWorkoutInputStore();
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-운동타입-결과');

  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<WorkoutTypeResult | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [personalColor, setPersonalColor] = useState<PersonalColorSeason | null>(null);
  const [celebrityMatches, setCelebrityMatches] = useState<CelebrityMatchResult[]>([]);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Server Action을 통해 분석 결과를 DB에 저장하는 함수
  const saveAnalysisToDatabase = useCallback(async (inputData: ReturnType<typeof getInputData>) => {
    if (!user?.id) {
      console.log('[W-1] User not logged in, skipping DB save');
      return;
    }

    try {
      console.log('[W-1] Saving analysis via Server Action...');
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

      if (result.success && result.data) {
        console.log('[W-1] Analysis saved to database successfully:', result.data.id);
      } else {
        console.error('[W-1] Failed to save analysis:', result.error);
      }
    } catch (err) {
      console.error('[W-1] Error saving analysis to database:', err);
    }
  }, [user?.id]);

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

        // 체형 및 퍼스널 컬러 저장
        const userBodyType = inputData.bodyTypeData?.type as BodyType | undefined;
        const userPC = inputData.personalColor;

        if (userBodyType) {
          setBodyType(userBodyType);
        }
        if (userPC) {
          setPersonalColor(userPC);
        }

        // 연예인 루틴 매칭 (체형과 PC가 있을 때만)
        if (userBodyType && userPC) {
          const matches = matchCelebrityRoutines(userBodyType, userPC, { limit: 3 });
          setCelebrityMatches(matches);
        }

        // S-1 피부 분석 데이터 (실제로는 DB에서 가져옴)
        // TODO: 실제 S-1 분석 데이터 연동 (Sprint 4)
        // 여기서는 Mock 데이터로 시연
        const mockSkinAnalysis: SkinAnalysisSummary = {
          hydration: 'normal',
          oil: 'warning',
          pores: 'normal',
          wrinkles: 'good',
          elasticity: 'good',
          pigmentation: 'normal',
          trouble: 'warning',
        };
        setSkinAnalysis(mockSkinAnalysis);

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
  }, [getInputData, isUserLoaded, saveAnalysisToDatabase]);

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
        title="AI가 분석 중입니다"
        subtitle="당신에게 맞는 운동을 찾고 있어요..."
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
            <h1 className="text-2xl font-bold text-foreground mb-2">
              분석 완료!
            </h1>
            <p className="text-muted-foreground">
              당신에게 맞는 운동 타입을 찾았어요
            </p>
          </div>
        </FadeInUp>

        {/* 운동 타입 카드 - 메인 결과로 ScaleIn 강조 */}
        <ScaleIn delay={1}>
          <WorkoutTypeCard type={result.type} reason={result.reason} />
        </ScaleIn>

        {/* 체형 기반 인사이트 */}
        <FadeInUp delay={2}>
          <BodyTypeInsight
            bodyType={bodyType}
            workoutType={result.type}
            concerns={concerns}
          />
        </FadeInUp>

        {/* 연예인 루틴 매칭 */}
        {bodyType && personalColor && (
          <FadeInUp delay={3}>
            <CelebrityRoutineCard
              matchResults={celebrityMatches}
              bodyType={bodyType}
              personalColor={personalColor}
              onFollowClick={() => {
                // 주간 플랜에서 운동 진행
                router.push('/workout/plan');
              }}
            />
          </FadeInUp>
        )}

        {/* PC-1 연동: 운동복 스타일 가이드 */}
        {personalColor && (
          <FadeInUp delay={4}>
            <WorkoutStyleCard
              personalColor={personalColor}
              bodyType={bodyType}
            />
          </FadeInUp>
        )}

        {/* S-1 연동: 운동 후 피부 관리 팁 */}
        {result && (
          <FadeInUp delay={5}>
            <PostWorkoutSkinCareCard
              workoutType={result.type}
              durationMinutes={30} // TODO: 실제 운동 시간으로 교체
              skinAnalysis={skinAnalysis}
            />
          </FadeInUp>
        )}

        {/* N-1 연동 준비: 운동 후 영양 가이드 */}
        {result && (
          <FadeInUp delay={6}>
            <PostWorkoutNutritionCard
              workoutType={result.type as WorkoutType}
              durationMinutes={30} // TODO: 실제 운동 시간으로 교체
            />
          </FadeInUp>
        )}

        {/* 추천 운동 섹션 */}
        <FadeInUp delay={7}>
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-4">
              추천 운동
            </h3>
            {exercises.length > 0 ? (
              <RecommendedExerciseList
                exercises={exercises}
                onExerciseClick={(id) => router.push(`/workout/exercise/${id}`)}
              />
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">추천 운동이 없습니다</p>
                </div>
              </div>
            )}
          </div>
        </FadeInUp>

        {/* 액션 버튼 */}
        <FadeInUp delay={8}>
          <div className="space-y-3">
            <button
              onClick={handleViewPlan}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              주간 플랜 보기
            </button>
            <button
              onClick={handleStartWorkout}
              className="w-full py-4 bg-card border-2 border-indigo-500 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <Dumbbell className="w-5 h-5" />
              바로 운동 시작
            </button>
          </div>
        </FadeInUp>

        {/* 다시 분석하기 */}
        <FadeInUp delay={8}>
          <button
            onClick={handleRestart}
            className="w-full py-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            다시 분석하기
          </button>
        </FadeInUp>
      </div>

      {/* 공유 버튼 - 하단 고정 */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
        <div className="max-w-md mx-auto">
          <ShareButton
            onShare={share}
            loading={shareLoading}
            variant="outline"
          />
        </div>
      </div>
    </>
  );
}
