'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useWorkoutInputStore, type PersonalColorSeason } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation } from '@/components/workout/common';
import { BODY_TYPES, type BodyType } from '@/lib/mock/body-analysis';
import { Loader2, AlertCircle, CheckCircle2, Palette } from 'lucide-react';

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

export default function Step1Page() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { setBodyTypeData, setPersonalColor, setStep } = useWorkoutInputStore();

  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [pcAssessment, setPcAssessment] = useState<PersonalColorAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError('체형 데이터를 불러오는 중 오류가 발생했습니다.');
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
        setError('예상치 못한 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [isLoaded, isSignedIn, supabase, setBodyTypeData, setPersonalColor]);

  // 다음 단계로 이동
  const handleNext = () => {
    setStep(2);
    router.push('/workout/onboarding/step2');
  };

  // 로그인 필요
  if (isLoaded && !isSignedIn) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500">체형 정보를 불러오는 중...</p>
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

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={1} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">내 체형 정보</h2>
        <p className="text-gray-500 mt-1">
          체형에 맞는 운동을 추천해 드릴게요
        </p>
      </div>

      {/* 면책 조항 (스펙 16.3: 앱 최초 실행 시 표시) */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-medium">서비스 이용 안내</span>
          <br />
          <br />
          본 서비스는 전문 의료 조언을 대체하지 않습니다. 부상이나 통증이 있는 경우 전문가와 상담 후 운동하세요. 임산부, 심장질환자, 고혈압 환자는 의사와 상담 후 운동하세요.
        </p>
      </div>

      {/* C-1 데이터 있음: 체형 카드 */}
      {bodyAnalysis && bodyTypeInfo ? (
        <div className="space-y-4">
          {/* 체형 타입 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
                {bodyTypeInfo.emoji}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {bodyTypeInfo.label}
                </h3>
                <p className="text-gray-500 text-sm">
                  {bodyTypeInfo.description}
                </p>
              </div>
            </div>

            {/* 체형 특징 */}
            <p className="text-gray-600 text-sm mb-4">
              {bodyTypeInfo.characteristics}
            </p>

            {/* 주요 특징 3가지 */}
            {bodyAnalysis.strengths && bodyAnalysis.strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">주요 특징</p>
                <ul className="space-y-2">
                  {bodyAnalysis.strengths.slice(0, 3).map((strength, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 신체 정보 */}
            {(bodyAnalysis.height || bodyAnalysis.weight) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                {bodyAnalysis.height && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {bodyAnalysis.height}
                    </p>
                    <p className="text-xs text-gray-500">cm</p>
                  </div>
                )}
                {bodyAnalysis.weight && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {bodyAnalysis.weight}
                    </p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 퍼스널 컬러 정보 */}
          {pcAssessment && (
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Palette className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">퍼스널 컬러</p>
                  <p className="font-bold text-gray-900">
                    {PC_SEASON_LABELS[pcAssessment.season]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 확인 메시지 */}
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <p className="text-sm text-indigo-700">
              체형 정보를 확인했어요. 다음 단계로 진행해 주세요.
            </p>
          </div>
        </div>
      ) : (
        /* C-1 데이터 없음: 분석 필요 안내 */
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            체형 분석이 필요합니다
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            맞춤 운동 추천을 위해 먼저 체형 분석을 진행해 주세요.
          </p>
          <Link
            href="/analysis/body"
            className="inline-block w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            체형 분석하기
          </Link>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={true}
        isLastStep={false}
        canProceed={!!bodyAnalysis}
        onPrev={() => {}}
        onNext={handleNext}
      />
    </div>
  );
}
