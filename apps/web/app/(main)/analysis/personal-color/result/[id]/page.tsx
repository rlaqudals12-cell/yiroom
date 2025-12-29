'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type PersonalColorResult,
  type SeasonType,
  type ToneType,
  type DepthType,
  SEASON_INFO,
  BEST_COLORS,
  WORST_COLORS,
} from '@/lib/mock/personal-color';
import AnalysisResult from '../../_components/AnalysisResult';
import Link from 'next/link';

// DB 데이터 타입
interface DbPersonalColorAssessment {
  id: string;
  clerk_user_id: string;
  season: string;
  undertone: string | null;
  confidence: number | null;
  best_colors: Array<{ name: string; hex: string }> | null;
  worst_colors: Array<{ name: string; hex: string }> | null;
  makeup_recommendations: {
    lipstick?: Array<{ shade: string; hex: string; description?: string }>;
  } | null;
  fashion_recommendations: {
    tops?: string[];
    bottoms?: string[];
    accessories?: string[];
  } | null;
  image_analysis: {
    insight?: string;
  } | null;
  created_at: string;
}

// 시즌별 톤/깊이 결정
function getSeasonToneDepth(seasonType: SeasonType): { tone: ToneType; depth: DepthType } {
  switch (seasonType) {
    case 'spring':
      return { tone: 'warm', depth: 'light' };
    case 'summer':
      return { tone: 'cool', depth: 'light' };
    case 'autumn':
      return { tone: 'warm', depth: 'deep' };
    case 'winter':
      return { tone: 'cool', depth: 'deep' };
  }
}

// DB → PersonalColorResult 변환
function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;
  const info = SEASON_INFO[seasonType] || SEASON_INFO.spring;
  const { tone, depth } = getSeasonToneDepth(seasonType);
  const defaultBestColors = BEST_COLORS[seasonType] || [];
  const defaultWorstColors = WORST_COLORS[seasonType] || [];

  return {
    seasonType,
    seasonLabel: info.label,
    seasonDescription: info.description,
    tone,
    depth,
    confidence: dbData.confidence || 85,
    bestColors: dbData.best_colors || defaultBestColors,
    worstColors: dbData.worst_colors || defaultWorstColors,
    lipstickRecommendations: dbData.makeup_recommendations?.lipstick?.map(l => ({
      colorName: l.shade,
      hex: l.hex,
      brandExample: l.description,
    })) || [],
    clothingRecommendations: [
      ...(dbData.fashion_recommendations?.tops?.map(item => ({
        item,
        colorSuggestion: '베스트 컬러 활용',
        reason: '얼굴 근처에 배치하면 좋아요',
      })) || []),
      ...(dbData.fashion_recommendations?.bottoms?.map(item => ({
        item,
        colorSuggestion: '뉴트럴 컬러',
        reason: '상의와 조화롭게 매치해보세요',
      })) || []),
      ...(dbData.fashion_recommendations?.accessories?.map(item => ({
        item,
        colorSuggestion: '포인트 컬러',
        reason: '악세서리로 활용해보세요',
      })) || []),
    ],
    styleDescription: {
      imageKeywords: ['화사한', '세련된'],
      makeupStyle: `${info.label}에 어울리는 자연스러운 메이크업`,
      fashionStyle: `${info.description}을 살리는 스타일`,
      accessories: dbData.fashion_recommendations?.accessories?.join(', ') || '골드/실버 톤 악세서리',
    },
    insight: dbData.image_analysis?.insight || `${info.label} 타입의 특징을 가지고 있어요! ${info.characteristics}`,
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function PersonalColorResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('personal_color_assessments')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const transformedResult = transformDbToResult(data as DbPersonalColorAssessment);
      setResult(transformedResult);
    } catch (err) {
      console.error('[PC-1] Fetch error:', err);
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
    router.push('/analysis/personal-color');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
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
          <h1 className="text-lg font-bold text-foreground">퍼스널 컬러 결과</h1>
          <div className="w-16" />
        </header>

        {/* 결과 */}
        {result && (
          <AnalysisResult
            result={result}
            onRetry={handleNewAnalysis}
          />
        )}
      </div>
    </main>
  );
}
