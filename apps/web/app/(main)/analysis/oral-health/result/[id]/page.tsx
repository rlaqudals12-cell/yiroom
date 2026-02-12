'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AIBadge } from '@/components/common/AIBadge';
import { ContextLinkingCard } from '@/components/analysis/ContextLinkingCard';
import { OralHealthResultCard } from '@/components/analysis/oral-health';
import type { OralHealthAssessment } from '@/types/oral-health';

// DB 행 → OralHealthAssessment 변환
interface DbOralHealthRow {
  id: string;
  clerk_user_id: string;
  overall_score: number;
  tooth_color: OralHealthAssessment['toothColor'] | null;
  gum_health: OralHealthAssessment['gumHealth'] | null;
  whitening_goal: OralHealthAssessment['whiteningGoal'] | null;
  recommendations: string[] | null;
  used_fallback: boolean;
  created_at: string;
}

function transformDbToAssessment(row: DbOralHealthRow): OralHealthAssessment {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    createdAt: row.created_at,
    usedFallback: row.used_fallback ?? false,
    toothColor: row.tooth_color ?? undefined,
    gumHealth: row.gum_health ?? undefined,
    whiteningGoal: row.whitening_goal ?? undefined,
    overallScore: row.overall_score,
    recommendations: row.recommendations ?? [],
  };
}

export default function OralHealthResultPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [assessment, setAssessment] = useState<OralHealthAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const rawId = params.id;
  const analysisId = Array.isArray(rawId) ? rawId[0] : rawId;

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('oral_health_assessments')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없어요');
      }

      const transformed = transformDbToAssessment(data as DbOralHealthRow);
      setAssessment(transformed);
      fetchedRef.current = true;
    } catch (err) {
      console.error('[OH-1] Fetch error:', err);
      setError('결과를 불러오는 데 문제가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, analysisId, supabase]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAnalysis();
    }
  }, [isLoaded, isSignedIn, fetchAnalysis]);

  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/oral-health?forceNew=true');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
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
          <h2 className="text-xl font-semibold text-foreground mb-2">로그인이 필요해요</h2>
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
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="oral-health-result-page">
      <div className="max-w-lg mx-auto px-4 py-8 pb-32">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-1" />
              뒤로
            </Link>
          </Button>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-lg font-bold text-foreground">구강건강 분석 결과</h1>
            <AIBadge variant="small" />
          </div>
          <div className="w-16" />
        </header>

        {/* 종합 점수 */}
        {assessment && (
          <>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-cyan-600">{assessment.overallScore}</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">구강건강 점수</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {assessment.overallScore >= 80
                  ? '전반적으로 건강한 상태예요'
                  : assessment.overallScore >= 60
                    ? '괜찮지만 관리가 필요한 부분이 있어요'
                    : '적극적인 관리가 필요해요'}
              </p>
            </div>

            {/* 상세 결과 카드 */}
            <OralHealthResultCard assessment={assessment} className="mb-6" />

            {/* 다음 분석 추천 */}
            <ContextLinkingCard currentModule="oral-health" />
          </>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      {assessment && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto">
            <Button variant="outline" className="w-full" onClick={handleNewAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 분석하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
