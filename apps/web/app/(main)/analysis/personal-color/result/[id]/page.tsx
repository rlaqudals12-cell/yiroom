'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Palette, Shirt } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
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
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createPersonalColorShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import type { PersonalColorSeason } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrapingSimulationTab } from '@/components/analysis/visual';

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
  image_url?: string;
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
    lipstickRecommendations:
      dbData.makeup_recommendations?.lipstick?.map((l) => ({
        colorName: l.shade,
        hex: l.hex,
        brandExample: l.description,
      })) || [],
    clothingRecommendations: [
      ...(dbData.fashion_recommendations?.tops?.map((item) => ({
        item,
        colorSuggestion: '베스트 컬러 활용',
        reason: '얼굴 근처에 배치하면 좋아요',
      })) || []),
      ...(dbData.fashion_recommendations?.bottoms?.map((item) => ({
        item,
        colorSuggestion: '뉴트럴 컬러',
        reason: '상의와 조화롭게 매치해보세요',
      })) || []),
      ...(dbData.fashion_recommendations?.accessories?.map((item) => ({
        item,
        colorSuggestion: '포인트 컬러',
        reason: '악세서리로 활용해보세요',
      })) || []),
    ],
    styleDescription: {
      imageKeywords: ['화사한', '세련된'],
      makeupStyle: `${info.label}에 어울리는 자연스러운 메이크업`,
      fashionStyle: `${info.description}을 살리는 스타일`,
      accessories:
        dbData.fashion_recommendations?.accessories?.join(', ') || '골드/실버 톤 악세서리',
    },
    insight:
      dbData.image_analysis?.insight ||
      `${info.label} 타입의 특징을 가지고 있어요! ${info.characteristics}`,
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function PersonalColorResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const shareData = useMemo(() => {
    if (!result) return null;
    return createPersonalColorShareData({
      seasonType: result.seasonType,
      seasonLabel: result.seasonLabel,
      bestColors: result.bestColors,
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'personal-color', title: '', subtitle: '' },
    '이룸-퍼스널컬러-결과'
  );

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
      setImageUrl((data as DbPersonalColorAssessment).image_url || null);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-pc-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
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
      {/* 분석 완료 축하 효과 */}
      <CelebrationEffect
        type="analysis_complete"
        trigger={showCelebration}
        message="퍼스널 컬러 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

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

        {/* 탭 기반 결과 */}
        {result && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="basic" className="gap-1">
                <Palette className="w-4 h-4" />
                기본 분석
              </TabsTrigger>
              <TabsTrigger value="draping" className="gap-1">
                <Shirt className="w-4 h-4" />
                드레이핑
              </TabsTrigger>
            </TabsList>

            {/* 기본 분석 탭 */}
            <TabsContent value="basic" className="mt-0">
              <AnalysisResult result={result} onRetry={handleNewAnalysis} />

              {/* 맞춤 추천 제품 */}
              <RecommendedProducts
                analysisType="personal-color"
                analysisResult={{
                  seasonType: (result.seasonType.charAt(0).toUpperCase() +
                    result.seasonType.slice(1)) as PersonalColorSeason,
                }}
                className="mt-8 pb-32"
              />
            </TabsContent>

            {/* 드레이핑 시뮬레이션 탭 (PC-1+) */}
            <TabsContent value="draping" className="mt-0 pb-32">
              {imageUrl ? (
                <DrapingSimulationTab imageUrl={imageUrl} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  드레이핑 시뮬레이션에 필요한 이미지가 없습니다
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 제품 추천 버튼 */}
            <Button
              className="w-full"
              onClick={() => router.push(`/products?season=${result.seasonType}&category=makeup`)}
            >
              <Palette className="w-4 h-4 mr-2" />내 색상에 맞는 제품
            </Button>
            {/* 공유 버튼 */}
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </main>
  );
}
