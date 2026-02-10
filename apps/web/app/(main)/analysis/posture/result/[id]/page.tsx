'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Dumbbell } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import {
  type PostureAnalysisResult,
  type PostureType,
  type PostureMeasurement,
  type StretchingRecommendation,
  POSTURE_TYPES,
  STRETCHING_DATABASE,
} from '@/lib/mock/posture-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { ShareButton } from '@/components/share';
import { useShare } from '@/hooks/useShare';
import Link from 'next/link';
import { AIBadge } from '@/components/common/AIBadge';

// DB 데이터 타입
interface DbPostureAnalysis {
  id: string;
  clerk_user_id: string;
  front_image_url: string;
  side_image_url: string | null;
  posture_type: string;
  overall_score: number;
  confidence: number;
  front_analysis: {
    shoulderSymmetry: PostureMeasurement;
    pelvisSymmetry: PostureMeasurement;
    kneeAlignment: PostureMeasurement;
    footAngle: PostureMeasurement;
  };
  side_analysis: {
    headForwardAngle: PostureMeasurement;
    thoracicKyphosis: PostureMeasurement;
    lumbarLordosis: PostureMeasurement;
    pelvicTilt: PostureMeasurement;
  };
  concerns: string[];
  stretching_recommendations: StretchingRecommendation[];
  insight: string;
  analysis_evidence: Record<string, unknown> | null;
  image_quality: Record<string, unknown> | null;
  body_type: string | null;
  body_type_correlation: {
    bodyType: string;
    correlationNote: string;
    riskFactors: string[];
  } | null;
  created_at: string;
}

// DB → PostureAnalysisResult 변환
function transformDbToResult(dbData: DbPostureAnalysis): PostureAnalysisResult {
  const postureType = dbData.posture_type as PostureType;
  const typeInfo = POSTURE_TYPES[postureType];

  return {
    postureType,
    postureTypeLabel: typeInfo?.label || postureType,
    postureTypeDescription: typeInfo?.description || '',
    overallScore: dbData.overall_score,
    confidence: dbData.confidence,
    frontAnalysis: dbData.front_analysis,
    sideAnalysis: dbData.side_analysis,
    concerns: dbData.concerns || [],
    stretchingRecommendations:
      dbData.stretching_recommendations || STRETCHING_DATABASE[postureType] || [],
    insight: dbData.insight || typeInfo?.recommendations.join(' ') || '',
    analyzedAt: new Date(dbData.created_at),
    bodyTypeCorrelation: dbData.body_type_correlation || undefined,
  };
}

export default function PostureAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<PostureAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 훅
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-자세분석-결과');

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('posture_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const dbData = data as DbPostureAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-posture-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[A-1] Fetch error:', err);

      // Fallback: sessionStorage에서 캐시된 데이터 복원
      try {
        const cached = sessionStorage.getItem(`posture-result-${analysisId}`);
        if (cached) {
          const { dbData } = JSON.parse(cached);
          if (dbData) {
            const transformedResult = transformDbToResult(dbData as DbPostureAnalysis);
            setResult(transformedResult);
            // 새 분석이므로 축하 효과 표시
            const celebrationKey = `celebration-posture-${analysisId}`;
            if (!sessionStorage.getItem(celebrationKey)) {
              sessionStorage.setItem(celebrationKey, 'shown');
              setShowCelebration(true);
            }
            sessionStorage.removeItem(`posture-result-${analysisId}`);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* sessionStorage 복원 실패 무시 */
      }

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
    router.push('/analysis/posture');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 비로그인 상태
  if (!isSignedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">분석 결과를 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted">
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
      </div>
    );
  }

  return (
    <>
      {/* 분석 완료 축하 효과 */}
      <CelebrationEffect
        type="analysis_complete"
        trigger={showCelebration}
        message="자세 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="posture-analysis-result-page">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                뒤로
              </Link>
            </Button>
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-foreground">자세 분석 결과</h1>
              <AIBadge variant="small" />
            </div>
            <div className="w-16" />
          </header>

          {/* 결과 표시 */}
          {result && (
            <AnalysisResult result={result} onRetry={handleNewAnalysis} shareRef={shareRef} />
          )}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 운동 추천 버튼 (체형 연동이 있는 경우) */}
            {result.bodyTypeCorrelation && (
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/workout/onboarding?bodyType=${result.bodyTypeCorrelation?.bodyType}&fromAnalysis=posture`
                  )
                }
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                나에게 맞는 운동 추천
              </Button>
            )}
            {/* 공유 버튼 */}
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
