'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  ArrowLeft,
  RefreshCw,
  Dumbbell,
  BarChart3,
  Shirt,
  ClipboardList,
  Lightbulb,
  Sun,
  Sparkles,
} from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type BodyAnalysisResult,
  type BodyType,
  type BodyType3,
  BODY_TYPES_3,
  EASY_BODY_TIPS,
  mapBodyTypeTo3Type,
} from '@/lib/mock/body-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { ShareButtons } from '@/components/common/ShareButtons';
import { useAnalysisShare, createBodyShareData } from '@/hooks/useAnalysisShare';
import { BodyStylingTab } from '@/components/analysis/visual';
import BodyAnalysisEvidenceReport, {
  type BodyAnalysisEvidence,
  type BodyImageQuality,
} from '@/components/analysis/BodyAnalysisEvidenceReport';
import { VisualReportCard } from '@/components/analysis/visual-report';
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
  style_recommendations:
    | {
        items?: Array<{ item: string; reason: string }>;
        insight?: string;
        colorTips?: string[];
        analysisEvidence?: BodyAnalysisEvidence;
        imageQuality?: BodyImageQuality;
        confidence?: number;
        matchedFeatures?: number;
      }
    | Array<{
        category: string;
        items: string[];
        tip: string;
      }>
    | null;
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

// DB 데이터 → BodyAnalysisResult 변환 (Hybrid: DB는 핵심 데이터만, 표시용은 최신 Mock 사용)
function transformDbToResult(dbData: DbBodyAnalysis): BodyAnalysisResult {
  const rawBodyType = dbData.body_type as BodyType | BodyType3;

  // 3타입인지 8타입인지 확인하고 매핑
  const isNew3Type = ['S', 'W', 'N'].includes(rawBodyType);
  const bodyType3: BodyType3 = isNew3Type
    ? (rawBodyType as BodyType3)
    : mapBodyTypeTo3Type(rawBodyType as BodyType);

  const info = BODY_TYPES_3[bodyType3];

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용 (코드 업데이트 시 기존 사용자도 혜택)
  const mockEasyBodyTip = EASY_BODY_TIPS[bodyType3];

  // DB의 style_recommendations를 StyleRecommendation[] 형식으로 변환
  let styleRecs: Array<{ item: string; reason: string }> = [];
  if (dbData.style_recommendations) {
    if (Array.isArray(dbData.style_recommendations)) {
      // 레거시 배열 형식: { category, items, tip }[]
      styleRecs = dbData.style_recommendations.flatMap((rec) =>
        rec.items.map((item: string) => ({
          item,
          reason: rec.tip || `${rec.category}에 어울리는 아이템`,
        }))
      );
    } else if (dbData.style_recommendations.items) {
      // 새 객체 형식: { items: { item, reason }[] }
      styleRecs = dbData.style_recommendations.items;
    }
  }
  if (styleRecs.length === 0) {
    styleRecs = info.recommendations || [];
  }

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
    // Hybrid 데이터: 초보자 친화 팁 (최신 Mock 사용)
    easyBodyTip: mockEasyBodyTip,
  };
}

export default function BodyAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<BodyAnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<BodyImageQuality | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [matchedFeatures, setMatchedFeatures] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
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

      const dbData = data as DbBodyAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);

      // 분석 근거 데이터 추출 (새 구조에서)
      const styleRecs = dbData.style_recommendations;
      if (styleRecs && !Array.isArray(styleRecs)) {
        if (styleRecs.analysisEvidence) {
          setAnalysisEvidence(styleRecs.analysisEvidence);
        }
        if (styleRecs.imageQuality) {
          setImageQuality(styleRecs.imageQuality);
        }
        if (styleRecs.confidence) {
          setConfidence(styleRecs.confidence);
        }
        if (styleRecs.matchedFeatures) {
          setMatchedFeatures(styleRecs.matchedFeatures);
        }
      }

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

  // 새로 분석하기 (forceNew 파라미터로 자동 리디렉트 방지)
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/body?forceNew=true');
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

          {/* 탭 기반 결과 */}
          {result && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10 bg-muted">
                <TabsTrigger value="basic" className="gap-1">
                  <BarChart3 className="w-4 h-4" />
                  기본 분석
                </TabsTrigger>
                <TabsTrigger value="evidence" className="gap-1">
                  <ClipboardList className="w-4 h-4" />
                  분석 근거
                </TabsTrigger>
                <TabsTrigger value="styling" className="gap-1">
                  <Shirt className="w-4 h-4" />
                  스타일 가이드
                </TabsTrigger>
              </TabsList>

              {/* 기본 분석 탭 */}
              <TabsContent value="basic" className="mt-0">
                {/* 비주얼 리포트 카드 */}
                <VisualReportCard
                  analysisType="body"
                  overallScore={confidence || 70}
                  bodyType={result.bodyType as 'S' | 'W' | 'N'}
                  bodyTypeLabel={result.bodyTypeLabel}
                  bodyStrengths={result.strengths}
                  bodyMeasurements={result.measurements}
                  analyzedAt={result.analyzedAt}
                  className="mb-6"
                />

                {/* 환경 요인 안내 카드 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                      <Lightbulb
                        className="w-4 h-4 text-violet-600 dark:text-violet-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">알아두세요</p>
                      <ul className="text-xs text-muted-foreground mt-1.5 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <Sun
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500"
                            aria-hidden="true"
                          />
                          <span>조명에 따라 실루엣 인식이 달라질 수 있어요</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Shirt
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500"
                            aria-hidden="true"
                          />
                          <span>오버핏 의류는 분석 정확도에 영향을 줄 수 있어요</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Sparkles
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500"
                            aria-hidden="true"
                          />
                          <span>타이트한 옷에서 촬영하면 더 정확해요</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <AnalysisResult
                  result={result}
                  onRetry={handleNewAnalysis}
                  evidence={analysisEvidence}
                />

                {/* 분석 근거 리포트 (메인 탭에 직접 표시) */}
                {(analysisEvidence || imageQuality) && (
                  <BodyAnalysisEvidenceReport
                    evidence={analysisEvidence}
                    imageQuality={imageQuality}
                    bodyType={result.bodyType}
                    confidence={confidence}
                    matchedFeatures={matchedFeatures}
                    className="mt-6"
                  />
                )}

                {/* 맞춤 추천 제품 */}
                <RecommendedProducts
                  analysisType="body"
                  analysisResult={{
                    bodyType: result.bodyType,
                    recommendedExercises: result.styleRecommendations
                      .slice(0, 3)
                      .map((r) => r.item),
                  }}
                  className="mt-8 pb-32"
                />
              </TabsContent>

              {/* 분석 근거 탭 */}
              <TabsContent value="evidence" className="mt-0 pb-32">
                {analysisEvidence || imageQuality ? (
                  <BodyAnalysisEvidenceReport
                    evidence={analysisEvidence}
                    imageQuality={imageQuality}
                    bodyType={result.bodyType}
                    confidence={confidence}
                    matchedFeatures={matchedFeatures}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>분석 근거 데이터가 없습니다</p>
                    <p className="text-sm mt-1">새로 분석하면 상세 근거가 제공됩니다</p>
                  </div>
                )}
              </TabsContent>

              {/* 스타일 가이드 탭 (C-1+) */}
              <TabsContent value="styling" className="mt-0 pb-32">
                <BodyStylingTab
                  bodyType={result.bodyType as BodyType3}
                  measurements={result.measurements}
                  personalColorSeason={result.personalColorSeason}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 z-10">
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
            {/* 다시 분석하기 + 공유 */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 분석하기
              </Button>
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
            </div>
            {/* 소셜 공유 버튼 */}
            <div className="flex justify-center">
              <ShareButtons
                content={{
                  title: `나의 체형은 ${result.bodyTypeLabel} 타입!`,
                  description: '이룸에서 AI 체형 분석 받아보세요',
                  url: typeof window !== 'undefined' ? window.location.href : '',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
