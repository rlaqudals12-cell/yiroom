'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles, ClipboardList, Palette, Heart } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createMakeupShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import { AIBadge } from '@/components/common/AIBadge';
import { ContextLinkingCard } from '@/components/analysis/ContextLinkingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type UndertoneId,
  type EyeShapeId,
  type LipShapeId,
  type FaceShapeId,
  type MakeupStyleId,
  type MakeupConcernId,
  type ColorRecommendation,
  UNDERTONES,
  EYE_SHAPES,
  LIP_SHAPES,
  FACE_SHAPES,
  MAKEUP_STYLES,
  MAKEUP_CONCERNS,
} from '@/lib/mock/makeup-analysis';

// 점수 -> 상태
function getStatus(value: number): 'good' | 'normal' | 'warning' {
  if (value >= 71) return 'good';
  if (value >= 41) return 'normal';
  return 'warning';
}

// 점수에 따른 설명 생성
function getDescription(name: string, value: number): string {
  if (value >= 71) return `${name}(이)가 좋은 상태입니다`;
  if (value >= 41) return `${name}(이)가 보통 수준입니다`;
  return `${name} 관리가 필요합니다`;
}

// DB 타입 정의
interface DbMakeupAnalysis {
  id: string;
  clerk_user_id: string;
  image_url: string;
  undertone: UndertoneId;
  eye_shape: EyeShapeId;
  lip_shape: LipShapeId;
  face_shape: FaceShapeId;
  skin_texture: number | null;
  skin_tone_uniformity: number | null;
  hydration: number | null;
  pore_visibility: number | null;
  oil_balance: number | null;
  overall_score: number;
  concerns: MakeupConcernId[];
  recommendations: {
    insight?: string;
    styles?: MakeupStyleId[];
    colors?: ColorRecommendation[];
    tips?: Array<{ category: string; tips: string[] }>;
    personalColorConnection?: {
      season: string;
      compatibility: 'high' | 'medium' | 'low';
      note: string;
    };
    analysisReliability?: 'high' | 'medium' | 'low';
  } | null;
  analysis_reliability: 'high' | 'medium' | 'low' | null;
  created_at: string;
}

interface MakeupMetric {
  id: string;
  name: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

interface MakeupAnalysisResultView {
  overallScore: number;
  metrics: MakeupMetric[];
  undertone: UndertoneId;
  undertoneLabel: string;
  eyeShape: EyeShapeId;
  eyeShapeLabel: string;
  lipShape: LipShapeId;
  lipShapeLabel: string;
  faceShape: FaceShapeId;
  faceShapeLabel: string;
  concerns: MakeupConcernId[];
  insight: string;
  recommendedStyles: MakeupStyleId[];
  colorRecommendations: ColorRecommendation[];
  makeupTips: Array<{ category: string; tips: string[] }>;
  personalColorConnection?: {
    season: string;
    compatibility: 'high' | 'medium' | 'low';
    note: string;
  };
  analyzedAt: Date;
}

// DB 데이터 -> 뷰 데이터 변환
function transformDbToResult(dbData: DbMakeupAnalysis): MakeupAnalysisResultView {
  const createMetric = (id: string, name: string, value: number | null) => ({
    id,
    name,
    value: value ?? 50,
    status: getStatus(value ?? 50),
    description: getDescription(name, value ?? 50),
  });

  const undertoneLabel =
    UNDERTONES.find((t) => t.id === dbData.undertone)?.label || dbData.undertone;
  const eyeShapeLabel =
    EYE_SHAPES.find((t) => t.id === dbData.eye_shape)?.label || dbData.eye_shape;
  const lipShapeLabel =
    LIP_SHAPES.find((t) => t.id === dbData.lip_shape)?.label || dbData.lip_shape;
  const faceShapeLabel =
    FACE_SHAPES.find((t) => t.id === dbData.face_shape)?.label || dbData.face_shape;

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('skinTexture', '피부 결', dbData.skin_texture),
      createMetric('skinTone', '피부톤 균일도', dbData.skin_tone_uniformity),
      createMetric('hydration', '수분감', dbData.hydration),
      createMetric('poreVisibility', '모공 상태', dbData.pore_visibility),
      createMetric('oilBalance', '유수분 밸런스', dbData.oil_balance),
    ],
    undertone: dbData.undertone,
    undertoneLabel,
    eyeShape: dbData.eye_shape,
    eyeShapeLabel,
    lipShape: dbData.lip_shape,
    lipShapeLabel,
    faceShape: dbData.face_shape,
    faceShapeLabel,
    concerns: dbData.concerns || [],
    insight: dbData.recommendations?.insight || '메이크업 분석이 완료되었어요!',
    recommendedStyles: dbData.recommendations?.styles || [],
    colorRecommendations: dbData.recommendations?.colors || [],
    makeupTips: dbData.recommendations?.tips || [],
    personalColorConnection: dbData.recommendations?.personalColorConnection,
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function MakeupAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<MakeupAnalysisResultView | null>(null);
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
    return createMakeupShareData({
      overallScore: result.overallScore,
      undertoneLabel: result.undertoneLabel,
      styleLabel: result.recommendedStyles[0]
        ? MAKEUP_STYLES.find((s) => s.id === result.recommendedStyles[0])?.label
        : undefined,
      metrics: result.metrics.map((m) => ({ name: m.name, value: m.value })),
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'makeup', title: '', subtitle: '' },
    '이룸-메이크업분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('makeup_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const dbData = data as DbMakeupAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setImageUrl(dbData.image_url);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-makeup-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[M-1] Fetch error:', err);
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
    router.push('/analysis/makeup');
  }, [router]);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-amber-600 bg-amber-100';
    }
  };

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
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
        message="메이크업 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="makeup-result-page">
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
              <h1 className="text-lg font-bold text-foreground">메이크업 분석 결과</h1>
              <AIBadge variant="small" />
            </div>
            <div className="w-16" />
          </header>

          {/* 탭 기반 결과 */}
          {result && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10 bg-muted">
                <TabsTrigger value="basic" className="gap-1 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4" />
                  분석
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1 text-xs sm:text-sm">
                  <Palette className="w-4 h-4" />
                  컬러
                </TabsTrigger>
                <TabsTrigger value="tips" className="gap-1 text-xs sm:text-sm">
                  <ClipboardList className="w-4 h-4" />팁
                </TabsTrigger>
              </TabsList>

              {/* 기본 분석 탭 */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                {/* 언더톤/얼굴형 요약 */}
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-rose-600">{result.overallScore}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {result.undertoneLabel} · {result.faceShapeLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.eyeShapeLabel} · {result.lipShapeLabel}
                  </p>
                </div>

                {/* 인사이트 */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">분석 인사이트</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
                </div>

                {/* 추천 스타일 */}
                {result.recommendedStyles.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">추천 스타일</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedStyles.map((styleId) => {
                        const style = MAKEUP_STYLES.find((s) => s.id === styleId);
                        return (
                          <Badge key={styleId} variant="secondary" className="text-sm px-3 py-1">
                            {style?.emoji} {style?.label || styleId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 상세 지표 */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">피부 상태</h3>
                  <div className="space-y-4">
                    {result.metrics.map((metric) => (
                      <div key={metric.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{metric.name}</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              getStatusColor(metric.status)
                            )}
                          >
                            {metric.value}점
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              metric.status === 'good'
                                ? 'bg-green-500'
                                : metric.status === 'warning'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                            )}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 고민 태그 */}
                {result.concerns.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">관리 포인트</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.concerns.map((concern) => {
                        const concernData = MAKEUP_CONCERNS.find((c) => c.id === concern);
                        return (
                          <Badge key={concern} variant="secondary" className="text-sm">
                            {concernData?.emoji} {concernData?.label || concern}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 컬러 추천 탭 */}
              <TabsContent value="colors" className="mt-0 space-y-6">
                {result.colorRecommendations.length > 0 ? (
                  result.colorRecommendations.map((colorRec) => (
                    <div key={colorRec.category} className="bg-card rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold mb-4">{colorRec.categoryLabel}</h3>
                      <div className="space-y-3">
                        {colorRec.colors.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full shadow-md border-2 border-white"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{color.name}</p>
                              <p className="text-xs text-muted-foreground">{color.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-card rounded-xl p-6 shadow-sm text-center">
                    <p className="text-muted-foreground">컬러 추천 정보가 없습니다</p>
                  </div>
                )}

                {/* 퍼스널 컬러 연결 */}
                {result.personalColorConnection && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold">퍼스널 컬러 연동</h3>
                    </div>
                    <p className="text-sm font-medium text-purple-700 mb-2">
                      추정 시즌: {result.personalColorConnection.season}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.personalColorConnection.note}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* 메이크업 팁 탭 */}
              <TabsContent value="tips" className="mt-0 space-y-6 pb-32">
                {result.makeupTips.length > 0 ? (
                  result.makeupTips.map((tipGroup) => (
                    <div key={tipGroup.category} className="bg-card rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold mb-3">{tipGroup.category}</h3>
                      <ul className="space-y-2">
                        {tipGroup.tips.map((tip, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-rose-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="bg-card rounded-xl p-6 shadow-sm text-center">
                    <p className="text-muted-foreground">메이크업 팁 정보가 없습니다</p>
                  </div>
                )}

                {/* 분석 이미지 */}
                {imageUrl && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">분석 이미지</h3>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/makeup-images/${imageUrl}`}
                        alt="분석된 메이크업 이미지"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* 다음 분석 추천 */}
          <ContextLinkingCard currentModule="makeup" />
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 제품 추천 버튼 */}
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/products?undertone=${result.undertone || ''}&category=cosmetics`)
              }
            >
              <Sparkles className="w-4 h-4 mr-2" />
              맞춤 화장품 보기
            </Button>
            {/* 공유 버튼 */}
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
