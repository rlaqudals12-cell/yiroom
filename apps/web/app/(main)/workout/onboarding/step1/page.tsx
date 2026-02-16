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
import { Loader2, AlertCircle, CheckCircle2, Palette, ChevronDown, ChevronUp } from 'lucide-react';

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

// personal_color_assessments 테이블 데이터 타입
interface PersonalColorAssessment {
  id: string;
  season: PersonalColorSeason;
  created_at: string;
}

// PC 시즌 한글 레이블
const PC_SEASON_LABELS: Record<PersonalColorSeason, string> = {
  Spring: '봄 웜톤',
  Summer: '여름 쿨톤',
  Autumn: '가을 웜톤',
  Winter: '겨울 쿨톤',
};

// 운동 목표 옵션 (Step 2에서 통합)
const GOALS = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '건강하게 살 빼기' },
  { id: 'strength', icon: '💪', title: '근력 강화', desc: '근육량 늘리기' },
  { id: 'endurance', icon: '🏃', title: '체력 향상', desc: '지구력 키우기' },
  { id: 'stress', icon: '😌', title: '스트레스 해소', desc: '마음 건강 챙기기' },
  { id: 'posture', icon: '🧘', title: '체형 교정', desc: '바른 자세 만들기' },
];

// 신체 고민 옵션 (Step 3에서 통합 - 상위 4개만)
const CONCERNS = [
  { id: 'belly', icon: '🫃', title: '뱃살', desc: '복부 지방 감소' },
  { id: 'thigh', icon: '🦵', title: '허벅지', desc: '하체 라인 정리' },
  { id: 'arm', icon: '💪', title: '팔뚝', desc: '팔 라인 탄력' },
  { id: 'back', icon: '🔙', title: '등살', desc: '등 라인 정리' },
];

const MAX_GOALS = 2;
const MAX_CONCERNS = 3;

export default function Step1Page() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { goals, concerns, setBodyTypeData, setPersonalColor, setGoals, setConcerns, setStep } =
    useWorkoutInputStore();

  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [pcAssessment, setPcAssessment] = useState<PersonalColorAssessment | null>(null);
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
          setError('체형 데이터를 불러오는 중 오류가 발생했어요.');
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
          setPcAssessment(pcData);
          // Store에 퍼스널 컬러 저장
          setPersonalColor(pcData.season as PersonalColorSeason);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('예상치 못한 오류가 발생했어요.');
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
        toast.warning(`최대 ${MAX_GOALS}개까지 선택할 수 있어요`);
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
        toast.warning(`최대 ${MAX_CONCERNS}개까지 선택할 수 있어요`);
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
        <p className="text-muted-foreground">로그인이 필요해요.</p>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-muted-foreground">체형 정보를 불러오는 중...</p>
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
    <div className="space-y-6">
      {/* 진행 표시 - 3단계 중 1단계 */}
      <ProgressIndicator currentStep={1} totalSteps={3} />

      {/* 면책 조항 (스펙 16.3: 앱 최초 실행 시 표시) */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-medium">서비스 이용 안내</span>
          <br />
          <br />본 서비스는 전문 의료 조언을 대체하지 않아요. 부상이나 통증이 있는 경우 전문가와
          상담 후 운동하세요.
        </p>
      </div>

      {/* C-1 데이터 없음: 분석 필요 안내 */}
      {!bodyAnalysis ? (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">체형 분석이 필요해요</h3>
          <p className="text-muted-foreground text-sm mb-6">
            맞춤 운동 추천을 위해 먼저 체형 분석을 진행해 주세요.
          </p>
          <Link
            href="/analysis/body"
            className="inline-block w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            체형 분석하기
          </Link>
        </div>
      ) : (
        <>
          {/* 섹션 1: 내 체형 정보 (접이식) */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setShowBodyInfo(!showBodyInfo)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              aria-label={showBodyInfo ? '체형 정보 접기' : '체형 정보 펼치기'}
              aria-expanded={showBodyInfo}
            >
              <div className="flex items-center gap-3">
                {bodyTypeInfo && <span className="text-2xl">{bodyTypeInfo.emoji}</span>}
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {bodyTypeInfo?.label || '체형 정보'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {pcAssessment && (
                      <>
                        <Palette className="w-3 h-3" />
                        <span>{PC_SEASON_LABELS[pcAssessment.season]}</span>
                      </>
                    )}
                  </div>
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
                        <p className="text-lg font-bold text-foreground">{bodyAnalysis.height}</p>
                        <p className="text-xs text-muted-foreground">cm</p>
                      </div>
                    )}
                    {bodyAnalysis.weight && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{bodyAnalysis.weight}</p>
                        <p className="text-xs text-muted-foreground">kg</p>
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
              <h2 className="text-lg font-bold text-foreground">운동 목표</h2>
              <p className="text-muted-foreground text-sm mt-1">
                원하는 목표를 선택해 주세요 (최대 {MAX_GOALS}개)
              </p>
            </div>
            <div className="space-y-2">
              {GOALS.map((goal) => (
                <SelectionCard
                  key={goal.id}
                  mode="multiple"
                  selected={goals.includes(goal.id)}
                  onSelect={() => handleGoalSelect(goal.id)}
                  icon={<span>{goal.icon}</span>}
                  title={goal.title}
                  description={goal.desc}
                />
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border" />

          {/* 섹션 3: 신체 고민 */}
          <div>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground">개선하고 싶은 부위</h2>
              <p className="text-muted-foreground text-sm mt-1">
                집중하고 싶은 부위를 선택해 주세요 (최대 {MAX_CONCERNS}개)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CONCERNS.map((concern) => (
                <SelectionCard
                  key={concern.id}
                  mode="multiple"
                  selected={concerns.includes(concern.id)}
                  onSelect={() => handleConcernSelect(concern.id)}
                  icon={<span className="text-xl">{concern.icon}</span>}
                  title={concern.title}
                  description={concern.desc}
                  compact
                />
              ))}
            </div>
          </div>

          {/* 선택 현황 */}
          {(goals.length > 0 || concerns.length > 0) && (
            <div className="bg-indigo-50 rounded-xl p-4 space-y-1">
              {goals.length > 0 && (
                <p className="text-sm text-indigo-700">
                  목표: <span className="font-medium">{goals.length}개</span> 선택됨
                </p>
              )}
              {concerns.length > 0 && (
                <p className="text-sm text-indigo-700">
                  부위: <span className="font-medium">{concerns.length}개</span> 선택됨
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
