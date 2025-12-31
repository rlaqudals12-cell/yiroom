'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { calculateAll } from '@/lib/nutrition/calculateBMR';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { Check, ChevronRight, Utensils, Flame, Activity, Target } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { FadeInUp, ScaleIn, Confetti } from '@/components/animations';
import { SupplementRecommendationCardDynamic } from '@/components/nutrition/dynamic';
import type { NutritionGoal } from '@/types/nutrition';

// 목표 레이블
const GOAL_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  weight_loss: { label: '체중 감량', icon: '🔥', color: 'text-orange-600' },
  maintain: { label: '체중 유지', icon: '⚖️', color: 'text-blue-600' },
  muscle: { label: '근육 증가', icon: '💪', color: 'text-purple-600' },
  skin: { label: '피부 개선', icon: '✨', color: 'text-pink-600' },
  health: { label: '건강 관리', icon: '❤️', color: 'text-red-600' },
};

/**
 * N-1 온보딩 결과 페이지
 * - BMR/TDEE 계산 결과 표시
 * - 영양소 목표 표시
 * - 설정 저장 및 대시보드 이동
 */
export default function NutritionResultPage() {
  const router = useRouter();
  const { getInputData, setDailyCalorieTarget, setMacroTargets, setBMR, setTDEE, resetAll } =
    useNutritionInputStore();
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-영양목표-결과');

  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    bmr: number;
    tdee: number;
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
  } | null>(null);

  useEffect(() => {
    const inputData = getInputData();

    // 필수 데이터 검증
    if (
      !inputData.goal ||
      !inputData.gender ||
      !inputData.birthDate ||
      !inputData.height ||
      !inputData.weight ||
      !inputData.activityLevel
    ) {
      setError('필수 정보가 누락되었습니다. 다시 시작해주세요.');
      setIsLoading(false);
      return;
    }

    // BMR/TDEE 계산
    const calcResult = calculateAll(
      inputData.gender,
      inputData.weight,
      inputData.height,
      inputData.birthDate,
      inputData.activityLevel,
      inputData.goal
    );

    // Store 업데이트
    setBMR(calcResult.bmr);
    setTDEE(calcResult.tdee);
    setDailyCalorieTarget(calcResult.dailyCalorieTarget);
    setMacroTargets(calcResult.proteinTarget, calcResult.carbsTarget, calcResult.fatTarget);

    setResult(calcResult);

    // 로딩 시뮬레이션 (UX용)
    const timer = setTimeout(() => {
      setIsLoading(false);
      // 분석 완료 시 축하 효과
      setShowConfetti(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [getInputData, setBMR, setTDEE, setDailyCalorieTarget, setMacroTargets]);

  // 설정 저장 및 대시보드 이동
  const handleSaveAndContinue = async () => {
    const inputData = getInputData();

    if (!result) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/nutrition/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: inputData.goal,
          bmr: result.bmr,
          tdee: result.tdee,
          dailyCalorieTarget: result.dailyCalorieTarget,
          activityLevel: inputData.activityLevel,
          mealStyle: inputData.mealStyle,
          cookingSkill: inputData.cookingSkill,
          budget: inputData.budget,
          allergies: inputData.allergies,
          dislikedFoods: inputData.dislikedFoods,
          mealCount: inputData.mealCount,
          proteinTarget: result.proteinTarget,
          carbsTarget: result.carbsTarget,
          fatTarget: result.fatTarget,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // 성공 시 대시보드로 이동 (영양 섹션 포함)
      router.push('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 다시 시작
  const handleRestart = () => {
    resetAll();
    router.push('/nutrition/onboarding/step1');
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <AnalyzingLoader title="칼로리 계산 중" subtitle="맞춤 영양 목표를 설정하고 있어요..." />
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

  const inputData = getInputData();
  const goalInfo = inputData.goal ? GOAL_LABELS[inputData.goal] : null;

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti
        trigger={showConfetti}
        colors={['#22c55e', '#16a34a', '#15803d', '#10b981', '#6366f1']}
      />

      <div ref={shareRef} className="space-y-6">
        {/* 헤더 */}
        <FadeInUp>
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">설정 완료!</h1>
            <p className="text-muted-foreground">맞춤 영양 목표가 준비되었어요</p>
          </div>
        </FadeInUp>

        {/* 목표 표시 */}
        {goalInfo && (
          <FadeInUp delay={1}>
            <div className="bg-card border-border/50 rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{goalInfo.icon}</span>
                <div>
                  <p className="text-muted-foreground text-sm">나의 목표</p>
                  <p className={`text-xl font-bold ${goalInfo.color}`}>{goalInfo.label}</p>
                </div>
              </div>
            </div>
          </FadeInUp>
        )}

        {/* 칼로리 계산 결과 - 메인 결과로 ScaleIn 강조 */}
        <ScaleIn delay={2}>
          <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h2 className="font-bold">일일 목표 칼로리</h2>
            </div>
            <p className="mb-2 text-5xl font-bold">
              {result.dailyCalorieTarget.toLocaleString()}
              <span className="ml-1 text-2xl font-normal">kcal</span>
            </p>
            <div className="mt-4 flex gap-4 border-t border-green-400/30 pt-4">
              <div className="flex-1">
                <p className="mb-1 text-xs text-green-100">기초대사량</p>
                <p className="font-semibold">{result.bmr.toLocaleString()} kcal</p>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs text-green-100">활동대사량</p>
                <p className="font-semibold">{result.tdee.toLocaleString()} kcal</p>
              </div>
            </div>
          </div>
        </ScaleIn>

        {/* 영양소 목표 */}
        <FadeInUp delay={3}>
          <div className="bg-card border-border/50 rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Utensils className="text-muted-foreground h-5 w-5" />
              <h2 className="text-foreground font-bold">일일 영양소 목표</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* 탄수화물 */}
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="mb-1 text-xs text-amber-600">탄수화물</p>
                <p className="text-2xl font-bold text-amber-700">
                  {result.carbsTarget}
                  <span className="text-sm font-normal">g</span>
                </p>
              </div>
              {/* 단백질 */}
              <div className="rounded-xl bg-red-50 p-3 text-center">
                <p className="mb-1 text-xs text-red-600">단백질</p>
                <p className="text-2xl font-bold text-red-700">
                  {result.proteinTarget}
                  <span className="text-sm font-normal">g</span>
                </p>
              </div>
              {/* 지방 */}
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <p className="mb-1 text-xs text-blue-600">지방</p>
                <p className="text-2xl font-bold text-blue-700">
                  {result.fatTarget}
                  <span className="text-sm font-normal">g</span>
                </p>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* 한 끼당 칼로리 */}
        {inputData.mealCount > 0 && (
          <FadeInUp delay={4}>
            <div className="bg-card border-border/50 rounded-2xl border p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-foreground font-bold">한 끼당 권장 칼로리</h2>
              </div>
              <p className="text-muted-foreground">
                하루 <span className="font-bold">{inputData.mealCount}끼</span> 기준
              </p>
              <p className="mt-2 text-3xl font-bold text-orange-600">
                ~{Math.round(result.dailyCalorieTarget / inputData.mealCount).toLocaleString()}
                <span className="ml-1 text-lg font-normal">kcal</span>
              </p>
            </div>
          </FadeInUp>
        )}

        {/* 활동 수준 */}
        <FadeInUp delay={5}>
          <div className="bg-card border-border/50 rounded-2xl border p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              <h2 className="text-foreground font-bold">활동 수준 반영</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              선택하신 활동 수준을 기반으로 일일 에너지 소비량(TDEE)을 계산했어요. 운동량이 변하면
              설정에서 수정할 수 있어요.
            </p>
          </div>
        </FadeInUp>

        {/* 영양제 추천 (목표 기반) */}
        {inputData.goal && (
          <FadeInUp delay={6}>
            <SupplementRecommendationCardDynamic
              goal={inputData.goal as NutritionGoal}
              defaultExpanded={false}
            />
          </FadeInUp>
        )}

        {/* 액션 버튼 */}
        <FadeInUp delay={7}>
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 font-medium text-white transition-colors hover:bg-green-600 disabled:bg-green-300"
            >
              {isSaving ? (
                '저장 중...'
              ) : (
                <>
                  시작하기
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
            <button
              onClick={handleRestart}
              className="text-muted-foreground hover:text-foreground w-full py-3 text-sm transition-colors"
            >
              다시 분석하기
            </button>
          </div>
        </FadeInUp>

        {/* 안내 */}
        <p className="text-muted-foreground pb-4 text-center text-xs">
          계산된 값은 참고용이며, 개인의 건강 상태에 따라 다를 수 있습니다.
        </p>
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
