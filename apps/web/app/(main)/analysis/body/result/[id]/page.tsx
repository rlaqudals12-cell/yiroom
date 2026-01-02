'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Dumbbell } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import {
  type BodyAnalysisResult,
  type BodyType,
  type BodyType3,
  BODY_TYPES_3,
  mapBodyTypeTo3Type,
} from '@/lib/mock/body-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createBodyShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';

// DB 데이터 타입
interface DbBodyAnalysis {
  id: string;
  clerk_user_id: string;
  body_type: string;
  height: number | null;
  weight: number | null;
  shoulder: number | null;
  waist: number | null;
  hip: number | null;
  ratio: number | null;
  strengths: string[] | null;
  improvements: string[] | null;
  style_recommendations: Array<{
    category: string;
    items: string[];
    tip: string;
  }> | null;
  personal_color_season: string | null;
  color_recommendations: {
    topColors?: string[];
    bottomColors?: string[];
    avoidColors?: string[];
  } | null;
  created_at: string;
}

// 측정값 설명 생성
function getMeasurementDescription(name: string, value: number): string {
  if (value >= 70) return `${name}가 넓은 편이에요`;
  if (value >= 40) return `${name}가 균형 잡힌 편이에요`;
  return `${name}가 좁은 편이에요`;
}

// DB → BodyAnalysisResult 변환 (기존 8타입 → 3타입 매핑)
function transformDbToResult(dbData: DbBodyAnalysis): BodyAnalysisResult {
  const rawBodyType = dbData.body_type as BodyType | BodyType3;

  // 3타입인지 8타입인지 확인하고 매핑
  const isNew3Type = ['S', 'W', 'N'].includes(rawBodyType);
  const bodyType3: BodyType3 = isNew3Type
    ? (rawBodyType as BodyType3)
    : mapBodyTypeTo3Type(rawBodyType as BodyType);

  const info = BODY_TYPES_3[bodyType3];

  // DB의 style_recommendations를 StyleRecommendation[] 형식으로 변환
  const styleRecs =
    dbData.style_recommendations?.flatMap((rec) =>
      rec.items.map((item) => ({
        item,
        reason: rec.tip || `${rec.category}에 어울리는 아이템`,
      }))
    ) ||
    info.recommendations ||
    [];

  // insights 배열을 하나의 문장으로 결합
  const insightText =
    info.insights?.length > 0
      ? info.insights[0]
      : `${info.label} 체형의 특징을 가지고 있어요! ${info.characteristics}`;

  return {
    // 3타입을 BodyType으로 캐스팅 (하위 호환성)
    bodyType: bodyType3 as unknown as BodyType,
    bodyTypeLabel: info.label,
    bodyTypeDescription: info.description,
    measurements: [
      {
        name: '어깨',
        value: dbData.shoulder || 50,
        description: getMeasurementDescription('어깨', dbData.shoulder || 50),
      },
      {
        name: '허리',
        value: dbData.waist || 50,
        description: getMeasurementDescription('허리', dbData.waist || 50),
      },
      {
        name: '골반',
        value: dbData.hip || 50,
        description: getMeasurementDescription('골반', dbData.hip || 50),
      },
    ],
    strengths: dbData.strengths || info.strengths,
    insight: insightText,
    styleRecommendations: styleRecs,
    analyzedAt: new Date(dbData.created_at),
    userInput:
      dbData.height && dbData.weight
        ? {
            height: dbData.height,
            weight: dbData.weight,
          }
        : undefined,
    bmi:
      dbData.height && dbData.weight
        ? Math.round((dbData.weight / (dbData.height / 100) ** 2) * 10) / 10
        : undefined,
    personalColorSeason: dbData.personal_color_season,
    colorRecommendations: dbData.color_recommendations
      ? {
          topColors: dbData.color_recommendations.topColors || [],
          bottomColors: dbData.color_recommendations.bottomColors || [],
          avoidColors: dbData.color_recommendations.avoidColors || [],
          bestCombinations: [],
          accessories: [],
        }
      : null,
  };
}

export default function BodyAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const shareData = useMemo(() => {
    if (!result) return null;
    return createBodyShareData({
      bodyType: result.bodyType,
      bodyTypeLabel: result.bodyTypeLabel,
      strengths: result.strengths,
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'body', title: '', subtitle: '' },
    '이룸-체형분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('body_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const transformedResult = transformDbToResult(data as DbBodyAnalysis);
      setResult(transformedResult);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-body-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[C-1] Fetch error:', err);
      setError(err instanceof Error ? err.message : '결과를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, analysisId, supabase]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAnalysis();
    }
  }, [isLoaded, isSignedIn, fetchAnalysis]);

  // 새로 분석하기
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/body');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 비로그인 상태
  if (!isSignedIn) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">분석 결과를 확인하려면 먼저 로그인해주세요</p>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <Button onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로 분석하기
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* 분석 완료 축하 효과 */}
      <CelebrationEffect
        type="analysis_complete"
        trigger={showCelebration}
        message="체형 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                뒤로
              </Link>
            </Button>
            <h1 className="text-lg font-bold text-foreground">체형 분석 결과</h1>
            <div className="w-16" />
          </header>

          {/* 결과 */}
          {result && <AnalysisResult result={result} onRetry={handleNewAnalysis} />}

          {/* 맞춤 추천 제품 */}
          {result && (
            <RecommendedProducts
              analysisType="body"
              analysisResult={{
                bodyType: result.bodyType,
                recommendedExercises: result.styleRecommendations.slice(0, 3).map((r) => r.item),
              }}
              className="mt-8 pb-32"
            />
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 운동 추천 버튼 */}
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  `/workout/onboarding?bodyType=${result.bodyType}&bmi=${result.bmi || ''}&fromAnalysis=body`
                )
              }
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              나에게 맞는 운동 추천
            </Button>
            {/* 공유 버튼 */}
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
