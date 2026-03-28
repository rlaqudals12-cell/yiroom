'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useWorkoutInputStore, type PersonalColorSeason } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { BODY_TYPES, type BodyType } from '@/lib/mock/body-analysis';
import { workoutFunnel, durationTrackers } from '@/lib/analytics';
import { useTranslations } from 'next-intl';
import { Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

// body_analyses 테이블 데이터 타입
interface BodyAnalysis {
  id: string;
  body_type: BodyType;
  shoulder: number | null;
  waist: number | null;
  hip: number | null;
  height: number | null;
  weight: number | null;
  strengths: string[] | null;
  created_at: string;
}

// 운동 목표 옵션
const GOAL_IDS = ['weight_loss', 'strength', 'endurance', 'stress', 'posture'];

// 신체 고민 옵션
const CONCERN_IDS = ['belly', 'thigh', 'arm', 'back'];

const MAX_GOALS = 2;
const MAX_CONCERNS = 3;

export default function Step1Page() {
  const t = useTranslations('workoutOnboarding');
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { goals, concerns, setBodyTypeData, setPersonalColor, setGoals, setConcerns, setStep } =
    useWorkoutInputStore();

  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBodyInfo, setShowBodyInfo] = useState(false);

  // 퍼널 트래킹: 온보딩 시작 + 체류 시간 측정
  useEffect(() => {
    workoutFunnel.onboardingStart();
    durationTrackers.workoutOnboarding.start();

    return () => {
      durationTrackers.workoutOnboarding.stop();
    };
  }, []);

  // C-1 및 PC-1 데이터 조회
  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        // C-1 체형 분석 데이터 조회
        const { data: bodyData, error: bodyError } = await supabase
          .from('body_analyses')
          .select('id, body_type, shoulder, waist, hip, height, weight, strengths, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bodyError && bodyError.code !== 'PGRST116') {
          console.error('Error fetching body analysis:', bodyError);
          setError(t('bodyDataError'));
          return;
        }

        if (bodyData) {
          setBodyAnalysis(bodyData);
          // Store에 체형 데이터 저장 (키/체중 포함)
          setBodyTypeData({
            type: bodyData.body_type,
            proportions: {
              shoulder: bodyData.shoulder || 0,
              waist: bodyData.waist || 0,
              hip: bodyData.hip || 0,
            },
            height: bodyData.height || undefined,
            weight: bodyData.weight || undefined,
          });
        }

        // PC-1 퍼스널 컬러 진단 데이터 조회
        const { data: pcData, error: pcError } = await supabase
          .from('personal_color_assessments')
          .select('id, season, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (pcError && pcError.code !== 'PGRST116') {
          console.error('Error fetching personal color:', pcError);
          // PC 데이터 없어도 진행 가능하므로 에러 표시 안함
        }

        if (pcData) {
          // Store에 퍼스널 컬러 저장 (결과 페이지 연동용)
          setPersonalColor(pcData.season as PersonalColorSeason);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(t('unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [isLoaded, isSignedIn, supabase, setBodyTypeData, setPersonalColor]);

  // 목표 선택/해제 처리
  const handleGoalSelect = (goalId: string) => {
    if (goals.includes(goalId)) {
      setGoals(goals.filter((id) => id !== goalId));
    } else {
      if (goals.length >= MAX_GOALS) {
        toast.warning(t('maxGoals', { max: MAX_GOALS }));
        return;
      }
      setGoals([...goals, goalId]);
    }
  };

  // 고민 선택/해제 처리
  const handleConcernSelect = (concernId: string) => {
    if (concerns.includes(concernId)) {
      setConcerns(concerns.filter((id) => id !== concernId));
    } else {
      if (concerns.length >= MAX_CONCERNS) {
        toast.warning(t('maxConcerns', { max: MAX_CONCERNS }));
        return;
      }
      setConcerns([...concerns, concernId]);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    setStep(2);
    router.push('/workout/onboarding/step2');
  };

  // 로그인 필요
  if (isLoaded && !isSignedIn) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t('loginRequired')}</p>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-muted-foreground">{t('loadingBodyInfo')}</p>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const bodyTypeInfo = bodyAnalysis ? BODY_TYPES[bodyAnalysis.body_type] : null;

  // 진행 가능 조건: 체형 데이터 있음 AND 목표 1개 이상 AND 고민 1개 이상
  const canProceed = !!bodyAnalysis && goals.length > 0 && concerns.length > 0;

  return (
    <div className="space-y-6" data-testid="workout-step1-page">
      {/* 진행 표시 - 3단계 중 1단계 */}
      <ProgressIndicator currentStep={1} totalSteps={3} />

      {/* 면책 조항 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-medium">{t('disclaimerTitle')}</span>
          <br />
          <br />
          {t('disclaimerBody')}
        </p>
      </div>

      {/* C-1 데이터 없음: 분석 필요 안내 */}
      {!bodyAnalysis ? (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{t('bodyAnalysisNeeded')}</h3>
          <p className="text-muted-foreground text-sm mb-6">{t('bodyAnalysisNeededDesc')}</p>
          <Link
            href="/analysis/body"
            className="inline-block w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            {t('goToBodyAnalysis')}
          </Link>
        </div>
      ) : (
        <>
          {/* 섹션 1: 내 체형 정보 (접이식) */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setShowBodyInfo(!showBodyInfo)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              aria-label={showBodyInfo ? t('collapseBodyInfo') : t('expandBodyInfo')}
              aria-expanded={showBodyInfo}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {bodyTypeInfo?.label || t('bodyInfoLabel')}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('bodyAnalysisResult')}</p>
                </div>
              </div>
              {showBodyInfo ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* 확장된 체형 정보 */}
            {showBodyInfo && bodyTypeInfo && (
              <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-3">
                <p className="text-sm text-foreground/80">{bodyTypeInfo.characteristics}</p>
                {bodyAnalysis.strengths && bodyAnalysis.strengths.length > 0 && (
                  <ul className="space-y-1">
                    {bodyAnalysis.strengths.slice(0, 3).map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                )}
                {(bodyAnalysis.height || bodyAnalysis.weight) && (
                  <div className="flex gap-4 pt-2 border-t border-border/30">
                    {bodyAnalysis.height && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {bodyAnalysis.height}{' '}
                          <span className="text-sm font-normal text-muted-foreground">cm</span>
                        </p>
                      </div>
                    )}
                    {bodyAnalysis.weight && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {bodyAnalysis.weight}{' '}
                          <span className="text-sm font-normal text-muted-foreground">kg</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 섹션 2: 운동 목표 */}
          <div>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground">{t('step1GoalTitle')}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t('step1GoalDesc', { max: MAX_GOALS })}
              </p>
            </div>
            <div className="space-y-2">
              {GOAL_IDS.map((id) => (
                <SelectionCard
                  key={id}
                  mode="multiple"
                  selected={goals.includes(id)}
                  onSelect={() => handleGoalSelect(id)}
                  title={t(`goal_${id}`)}
                  description={t(`goal_${id}_desc`)}
                />
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border" />

          {/* 섹션 3: 신체 고민 */}
          <div>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground">{t('step1ConcernTitle')}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t('step1ConcernDesc', { max: MAX_CONCERNS })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CONCERN_IDS.map((id) => (
                <SelectionCard
                  key={id}
                  mode="multiple"
                  selected={concerns.includes(id)}
                  onSelect={() => handleConcernSelect(id)}
                  title={t(`concern_${id}`)}
                  description={t(`concern_${id}_desc`)}
                  compact
                />
              ))}
            </div>
          </div>

          {/* 선택 현황 */}
          {(goals.length > 0 || concerns.length > 0) && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-1">
              {goals.length > 0 && (
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {t('summaryGoals', { count: goals.length })}
                </p>
              )}
              {concerns.length > 0 && (
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {t('summaryConcerns', { count: concerns.length })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={true}
        isLastStep={false}
        canProceed={canProceed}
        onPrev={() => {}}
        onNext={handleNext}
      />
    </div>
  );
}
