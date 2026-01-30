'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Eye,
  ClipboardList,
  Lightbulb,
  Sun,
  Droplets,
  Plus,
  X,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { type SkinAnalysisResult, type SkinTypeId, EASY_SKIN_TIPS } from '@/lib/mock/skin-analysis';
import { generateSynergyFromGeminiResult } from '@/lib/analysis/synergy-insight';
import type { SynergyInsight } from '@/types/visual-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { useAnalysisShare, createSkinShareData } from '@/hooks/useAnalysisShare';
import { SkinConsultantCTA } from '@/components/skin/SkinConsultantCTA';
import Link from 'next/link';
import type { SkinType as ProductSkinType, SkinConcern } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisualAnalysisTab, DrapingSimulationTab, SynergyInline } from '@/components/analysis/visual';
import { Palette, Camera, MessageCircle } from 'lucide-react';
import SkinAnalysisEvidenceReport, {
  type SkinAnalysisEvidence,
  type SkinImageQuality,
} from '@/components/analysis/SkinAnalysisEvidenceReport';
import {
  VisualReportCard,
  FaceZoneMap,
  SkinVitalityScore,
  ZoneDetailCard,
  TrendChart,
  CircularProgress,
  ScoreChangeBadge,
  type MetricItem,
  type ZoneStatus,
  type FaceZoneMapProps,
} from '@/components/analysis/visual-report';
import { SkinZoomViewer } from '@/components/analysis/SkinZoomViewer';
import type { ProblemArea } from '@/types/skin-problem-area';
import { MOCK_PROBLEM_AREAS } from '@/lib/mock/skin-problem-areas';
import { useSwipeTab } from '@/hooks/useSwipeTab';
import type { MetricStatus } from '@/lib/mock/skin-analysis';
import {
  PhotoMetricOverlayV2,
  type MetricScore,
  type SkinMetricType,
  FaceLandmarkHeatMap,
  type ZoneScore,
  type FaceZoneType,
} from '@/components/analysis/skin';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { SkinConsultationChat } from '@/components/skin-consultation';
import type { SkinAnalysisSummary } from '@/types/skin-consultation';

// 존 ID 타입 (FaceZoneMapProps에서 추출)
type FaceZoneId = keyof NonNullable<FaceZoneMapProps['zones']>;

// 점수 → 상태 (MetricStatus 타입에 맞게)
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

// DB 데이터 → AnalysisResult props 변환 (Hybrid: DB는 핵심 데이터만, 표시용은 최신 Mock 사용)
function transformDbToResult(dbData: DbSkinAnalysis): SkinAnalysisResult {
  // 메트릭 생성 헬퍼
  const createMetric = (id: string, name: string, value: number) => ({
    id,
    name,
    value,
    status: getStatus(value),
    description: getDescription(name, value),
  });

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용 (코드 업데이트 시 기존 사용자도 혜택)
  const skinType = dbData.skin_type?.toLowerCase() as SkinTypeId | undefined;
  const mockEasySkinTip = skinType ? EASY_SKIN_TIPS[skinType] : undefined;

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('hydration', '수분도', dbData.hydration),
      createMetric('oil', '유분도', dbData.oil_level),
      createMetric('pores', '모공', dbData.pores),
      createMetric('pigmentation', '색소침착', dbData.pigmentation),
      createMetric('wrinkles', '주름', dbData.wrinkles),
      createMetric('sensitivity', '민감도', dbData.sensitivity),
      createMetric('elasticity', '탄력', Math.round((dbData.hydration + dbData.pores) / 2)),
      // 다크서클: 색소침착(60%) + 수분도(40%) 기반 (눈가 피부 상태 반영)
      createMetric(
        'darkCircles',
        '다크서클',
        Math.round(dbData.pigmentation * 0.6 + dbData.hydration * 0.4)
      ),
    ],
    insight: dbData.recommendations?.insight || '피부 관리에 도움이 필요해요!',
    recommendedIngredients: dbData.recommendations?.ingredients || [],
    analyzedAt: new Date(dbData.created_at),
    personalColorSeason: dbData.personal_color_season,
    foundationRecommendation: dbData.foundation_recommendation,
    ingredientWarnings: dbData.ingredient_warnings?.map((w) => ({
      ...w,
      ewgGrade: null, // DB에 없으면 null
    })),
    productRecommendations: dbData.products
      ? {
          routine: (dbData.products.routine || []).map((r) => ({
            ...r,
            tip: '', // 기본값 추가
          })),
          specialCare: [],
          careTips: {
            weeklyCare: dbData.recommendations?.weekly_care || [],
            lifestyleTips: [],
          },
          skincareRoutine: {
            morning: dbData.recommendations?.morning_routine?.join(' → ') || '',
            evening: dbData.recommendations?.evening_routine?.join(' → ') || '',
          },
        }
      : undefined,
    // Hybrid 데이터: 초보자 친화 팁 (최신 Mock 사용)
    easySkinTip: mockEasySkinTip,
  };
}

// DB 타입 정의
interface DbSkinAnalysis {
  id: string;
  clerk_user_id: string;
  image_url: string;
  skin_type: string;
  hydration: number;
  oil_level: number;
  pores: number;
  pigmentation: number;
  wrinkles: number;
  sensitivity: number;
  overall_score: number;
  recommendations: {
    insight?: string;
    ingredients?: Array<{ name: string; reason: string }>;
    morning_routine?: string[];
    evening_routine?: string[];
    weekly_care?: string[];
    analysisEvidence?: SkinAnalysisEvidence;
    imageQuality?: SkinImageQuality;
    usedMock?: boolean;  // AI 분석 실패 시 Mock 데이터 사용 여부
  } | null;
  products: {
    routine?: Array<{ step: number; category: string; products: string[] }>;
  } | null;
  ingredient_warnings: Array<{
    ingredient: string;
    ingredientEn?: string;
    level: 'low' | 'medium' | 'high';
    reason: string;
    alternatives?: string[];
  }> | null;
  personal_color_season: string | null;
  foundation_recommendation: string | null;
  problem_areas: ProblemArea[] | null; // Phase E: 문제 영역 좌표
  created_at: string;
}

export default function SkinAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<SkinAnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<SkinImageQuality | null>(null);
  // Phase E: 문제 영역 데이터 (DB 없으면 Mock 사용)
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [selectedZone, setSelectedZone] = useState<FaceZoneId | null>(null);
  // PC-1 연동: 드레이핑 시뮬레이션용 이미지 URL
  const [pcImageUrl, setPcImageUrl] = useState<string | null>(null);
  // PC-1 시즌 정보 (시너지 인사이트용)
  const [pcSeason, setPcSeason] = useState<string | null>(null);
  // S-1 + PC-1 시너지 인사이트
  const [synergyInsight, setSynergyInsight] = useState<SynergyInsight | null>(null);
  // 트렌드 데이터 (과거 분석 기록)
  const [trendData, setTrendData] = useState<Array<{ date: Date; score: number }>>([]);
  // AI Fallback 사용 여부 (AI 분석 실패 시 Mock 데이터 사용)
  const [usedMock, setUsedMock] = useState(false);
  // 하단 FAB 접이식 상태
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  // 이전 분석 비교용
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  // 탭 스와이프 훅
  const { containerRef: swipeContainerRef, handlers: swipeHandlers } = useSwipeTab({
    tabs: ['basic', 'evidence', 'visual', 'draping', 'consultation'],
    activeTab,
    onTabChange: setActiveTab,
  });

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const shareData = useMemo(() => {
    if (!result) return null;
    return createSkinShareData({
      overallScore: result.overallScore,
      metrics: result.metrics.map((m) => ({ name: m.name, value: m.value })),
    });
  }, [result]);

  // 얼굴 존 상태 계산 (메트릭 기반) - FaceZoneMapProps.zones 형식
  const zoneStatuses = useMemo((): FaceZoneMapProps['zones'] => {
    if (!result) return {};

    const getMetricValue = (id: string) => result.metrics.find((m) => m.id === id)?.value ?? 50;

    // 존별 점수 계산 헬퍼
    const calcZone = (name: string, ...metricIds: string[]): ZoneStatus => {
      const avg = Math.round(
        metricIds.reduce((sum, id) => sum + getMetricValue(id), 0) / metricIds.length
      );
      return { score: avg, status: getStatus(avg), label: name };
    };

    // 각 존에 가장 관련된 메트릭으로 점수 계산
    return {
      forehead: calcZone('이마', 'oil', 'pores'),
      tZone: calcZone('T존', 'oil', 'pores'),
      eyes: calcZone('눈가', 'wrinkles', 'pigmentation'),
      cheeks: calcZone('볼', 'hydration', 'sensitivity'),
      uZone: calcZone('U존', 'hydration', 'sensitivity'),
      chin: calcZone('턱', 'pores', 'oil'),
    };
  }, [result]);

  // 피부 활력도 점수 및 요인 계산
  const vitalityData = useMemo(() => {
    if (!result) return { score: 0, factors: { positive: [], negative: [] } };

    // 활력도 = 전체 메트릭의 가중 평균
    const score = result.overallScore;
    const positive: string[] = [];
    const negative: string[] = [];

    result.metrics.forEach((m) => {
      if (m.value >= 71) {
        positive.push(`${m.name} 우수`);
      } else if (m.value <= 40) {
        negative.push(`${m.name} 개선 필요`);
      }
    });

    return { score, factors: { positive, negative } };
  }, [result]);

  // PhotoMetricOverlay용 메트릭 변환 (경쟁사 스타일 8개 지표)
  const photoMetrics = useMemo((): MetricScore[] => {
    if (!result) return [];

    const getMetricValue = (id: string) => result.metrics.find((m) => m.id === id)?.value ?? 50;

    // DB 지표 → 경쟁사 스타일 지표 매핑
    return [
      { type: 'wrinkles' as SkinMetricType, score: getMetricValue('wrinkles') },
      {
        type: 'darkCircles' as SkinMetricType,
        score: Math.round((getMetricValue('pigmentation') + getMetricValue('hydration')) / 2),
      },
      { type: 'texture' as SkinMetricType, score: getMetricValue('elasticity') },
      { type: 'spots' as SkinMetricType, score: getMetricValue('pigmentation') },
      { type: 'redness' as SkinMetricType, score: getMetricValue('sensitivity') },
      { type: 'hydration' as SkinMetricType, score: getMetricValue('hydration') },
      { type: 'oil' as SkinMetricType, score: getMetricValue('oil') },
      { type: 'acne' as SkinMetricType, score: getMetricValue('pores') },
    ];
  }, [result]);

  // FaceLandmarkHeatMap용 존 점수 (face-api.js 68포인트 기반)
  const heatMapZoneScores = useMemo((): ZoneScore[] => {
    if (!result) return [];

    const getMetricValue = (id: string) => result.metrics.find((m) => m.id === id)?.value ?? 50;

    // 얼굴 영역별 점수 매핑 (T존/U존 기반)
    return [
      {
        zone: 'forehead' as FaceZoneType,
        score: Math.round((getMetricValue('oil') + getMetricValue('pores')) / 2),
        label: '이마',
        concerns: getMetricValue('oil') < 50 ? ['유분 과다'] : undefined,
      },
      {
        zone: 'tZone' as FaceZoneType,
        score: Math.round((getMetricValue('oil') + getMetricValue('pores')) / 2),
        label: 'T존',
        concerns: getMetricValue('pores') < 50 ? ['모공 관리 필요'] : undefined,
      },
      {
        zone: 'leftCheek' as FaceZoneType,
        score: Math.round((getMetricValue('hydration') + getMetricValue('sensitivity')) / 2),
        label: '왼쪽 볼',
      },
      {
        zone: 'rightCheek' as FaceZoneType,
        score: Math.round((getMetricValue('hydration') + getMetricValue('sensitivity')) / 2),
        label: '오른쪽 볼',
      },
      {
        zone: 'leftEye' as FaceZoneType,
        score: Math.round((getMetricValue('wrinkles') + getMetricValue('pigmentation')) / 2),
        label: '왼쪽 눈가',
        concerns: getMetricValue('wrinkles') < 50 ? ['잔주름'] : undefined,
      },
      {
        zone: 'rightEye' as FaceZoneType,
        score: Math.round((getMetricValue('wrinkles') + getMetricValue('pigmentation')) / 2),
        label: '오른쪽 눈가',
        concerns: getMetricValue('pigmentation') < 50 ? ['다크서클'] : undefined,
      },
      {
        zone: 'chin' as FaceZoneType,
        score: Math.round((getMetricValue('pores') + getMetricValue('sensitivity')) / 2),
        label: '턱',
      },
    ];
  }, [result]);

  // 히트맵용 선택 영역 상태
  const [selectedHeatMapZone, setSelectedHeatMapZone] = useState<FaceZoneType | null>(null);

  // 선택된 존 상세 정보
  const selectedZoneDetail = useMemo(() => {
    if (!selectedZone || !result || !zoneStatuses) return null;

    const zone = zoneStatuses[selectedZone];
    if (!zone) return null;

    // 존별 관련 문제 및 추천 (메트릭 기반 동적 생성)
    const getZoneConcerns = (zoneId: FaceZoneId): string[] => {
      const concerns: string[] = [];
      const getMetric = (id: string) => result.metrics.find((m) => m.id === id);

      if (zoneId === 'forehead' || zoneId === 'tZone' || zoneId === 'chin') {
        const oil = getMetric('oil');
        const pores = getMetric('pores');
        if (oil && oil.value <= 40) concerns.push('유분이 많은 편이에요');
        if (pores && pores.value <= 40) concerns.push('모공이 눈에 띄어요');
      }
      if (zoneId === 'eyes') {
        const wrinkles = getMetric('wrinkles');
        const pigmentation = getMetric('pigmentation');
        if (wrinkles && wrinkles.value <= 40) concerns.push('잔주름이 보여요');
        if (pigmentation && pigmentation.value <= 40) concerns.push('다크서클이 있어요');
      }
      if (zoneId === 'cheeks' || zoneId === 'uZone') {
        const hydration = getMetric('hydration');
        const sensitivity = getMetric('sensitivity');
        if (hydration && hydration.value <= 40) concerns.push('수분이 부족해요');
        if (sensitivity && sensitivity.value <= 40) concerns.push('민감한 편이에요');
      }
      return concerns;
    };

    const getZoneRecommendations = (zoneId: FaceZoneId): string[] => {
      const recs: string[] = [];
      const getMetric = (id: string) => result.metrics.find((m) => m.id === id);

      if (zoneId === 'forehead' || zoneId === 'tZone' || zoneId === 'chin') {
        const oil = getMetric('oil');
        const pores = getMetric('pores');
        if (oil && oil.value <= 40) recs.push('BHA 성분 토너 사용');
        if (pores && pores.value <= 40) recs.push('주 2회 클레이 마스크');
      }
      if (zoneId === 'eyes') {
        const wrinkles = getMetric('wrinkles');
        if (wrinkles && wrinkles.value <= 40) recs.push('아이크림 사용');
        recs.push('자외선 차단 철저');
      }
      if (zoneId === 'cheeks' || zoneId === 'uZone') {
        const hydration = getMetric('hydration');
        if (hydration && hydration.value <= 40) recs.push('히알루론산 세럼 사용');
        recs.push('수분 마스크 주 2-3회');
      }
      return recs;
    };

    return {
      zoneId: selectedZone,
      zoneName: zone.label,
      score: zone.score,
      status: zone.status as MetricStatus,
      concerns: getZoneConcerns(selectedZone),
      recommendations: getZoneRecommendations(selectedZone),
    };
  }, [selectedZone, result, zoneStatuses]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'skin', title: '', subtitle: '' },
    '이룸-피부분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      // DB 데이터 → 컴포넌트 props 변환
      const dbData = data as DbSkinAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setSkinType(dbData.skin_type);

      // 이미지 URL 처리 (private bucket이므로 API로 signed URL 생성)
      console.log('[S-1] DB image_url:', dbData.image_url);
      if (dbData.image_url && dbData.image_url.length > 0) {
        // 이미 전체 URL인지 확인 (구버전 호환)
        if (dbData.image_url.startsWith('http')) {
          console.log('[S-1] Using direct HTTP URL');
          setImageUrl(dbData.image_url);
        } else {
          // API를 통해 signed URL 생성 (서버에서 service role 사용)
          try {
            console.log('[S-1] Requesting signed URL for:', dbData.image_url);
            const response = await fetch('/api/storage/signed-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bucket: 'skin-images',
                path: dbData.image_url,
                expiresIn: 3600,
              }),
            });

            if (response.ok) {
              const { signedUrl } = await response.json();
              console.log('[S-1] Signed URL 생성 성공');
              setImageUrl(signedUrl);
            } else {
              const errorText = await response.text();
              console.error('[S-1] Signed URL API 실패:', response.status, errorText);
            }
          } catch (urlError) {
            console.error('[S-1] Signed URL 요청 실패:', urlError);
          }
        }
      } else {
        console.warn('[S-1] DB에 image_url이 없습니다');
      }

      // 분석 근거 데이터 추출
      if (dbData.recommendations?.analysisEvidence) {
        setAnalysisEvidence(dbData.recommendations.analysisEvidence);
      }
      if (dbData.recommendations?.imageQuality) {
        setImageQuality(dbData.recommendations.imageQuality);
      }
      // AI Fallback 사용 여부 (AI 분석 실패 시 Mock 데이터 사용)
      if (dbData.recommendations?.usedMock) {
        setUsedMock(true);
      }

      // Phase E: 문제 영역 (DB에 있으면 사용, 없으면 Mock)
      if (dbData.problem_areas && dbData.problem_areas.length > 0) {
        setProblemAreas(dbData.problem_areas);
      } else {
        // MVP: Mock 데이터로 데모 (추후 Gemini 응답에서 추출)
        setProblemAreas(MOCK_PROBLEM_AREAS);
      }

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-skin-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }

      // 트렌드 데이터 조회 (최근 6개)
      const { data: trendRecords } = await supabase
        .from('skin_analyses')
        .select('overall_score, created_at')
        .order('created_at', { ascending: true })
        .limit(6);

      if (trendRecords && trendRecords.length > 0) {
        setTrendData(
          trendRecords.map((r) => ({
            date: new Date(r.created_at),
            score: r.overall_score,
          }))
        );
      }

      // 이전 분석 조회 (현재 분석 이전의 가장 최근 1개)
      const { data: previousAnalysis } = await supabase
        .from('skin_analyses')
        .select('overall_score')
        .lt('created_at', dbData.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (previousAnalysis) {
        setPreviousScore(previousAnalysis.overall_score);
      }

      // PC-1 (퍼스널 컬러) 결과 조회 - 드레이핑 시뮬레이션 + 시너지 인사이트용
      const { data: pcData } = await supabase
        .from('personal_color_assessments')
        .select('face_image_url, season')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pcData?.face_image_url) {
        setPcImageUrl(pcData.face_image_url);
      }
      if (pcData?.season) {
        setPcSeason(pcData.season);
      }

      // S-1 + PC-1 시너지 인사이트 생성 (피부 메트릭 기반)
      const synergyMetrics = [
        { id: 'hydration', value: dbData.hydration },
        { id: 'oiliness', value: dbData.oil_level },
        { id: 'redness', value: dbData.sensitivity }, // sensitivity를 redness로 매핑
      ];
      const insight = generateSynergyFromGeminiResult(synergyMetrics);
      setSynergyInsight(insight);
    } catch (err) {
      console.error('[S-1] Fetch error:', err);
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
    router.push('/analysis/skin?forceNew=true');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
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
        message="피부 분석 완료!"
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
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-foreground">피부 분석 결과</h1>
              <AIBadge variant="small" />
            </div>
            <div className="w-16" /> {/* 균형용 */}
          </header>

          {/* AI 분석 실패 시 Mock 데이터 알림 */}
          {usedMock && (
            <div className="mb-6">
              <MockDataNotice />
            </div>
          )}

          {/* 히어로 섹션: 점수 원형 게이지 + 변화 배지 */}
          {result && (
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <CircularProgress
                  score={result.overallScore}
                  size="lg"
                  animate
                  showScore
                  showGradeIcon
                />
                {/* 이전 분석 대비 변화 배지 */}
                {previousScore !== null && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <ScoreChangeBadge delta={result.overallScore - previousScore} size="sm" />
                  </div>
                )}
              </div>
              {previousScore !== null && (
                <p className="text-xs text-muted-foreground mt-4">
                  지난 분석 대비 {result.overallScore - previousScore > 0 ? '+' : ''}
                  {result.overallScore - previousScore}점
                </p>
              )}
            </div>
          )}

          {/* 탭 기반 결과 (스와이프 지원) */}
          {result && (
            <div ref={swipeContainerRef} {...swipeHandlers} className="touch-pan-y">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4 sticky top-0 z-10 bg-muted">
                  <TabsTrigger value="basic" className="gap-1 text-xs px-1">
                    <Sparkles className="w-3 h-3" />
                    분석
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="gap-1 text-xs px-1">
                    <ClipboardList className="w-3 h-3" />
                    근거
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="gap-1 text-xs px-1">
                    <Eye className="w-3 h-3" />
                    시각화
                  </TabsTrigger>
                  <TabsTrigger value="draping" className="gap-1 text-xs px-1">
                    <Palette className="w-3 h-3" />
                    드레이핑
                  </TabsTrigger>
                  <TabsTrigger value="consultation" className="gap-1 text-xs px-1">
                    <MessageCircle className="w-3 h-3" />
                    상담
                  </TabsTrigger>
                </TabsList>

                {/* 기본 분석 탭 */}
                <TabsContent value="basic" className="mt-0">
                  {/* 비주얼 리포트 카드 */}
                  <VisualReportCard
                    analysisType="skin"
                    overallScore={result.overallScore}
                    skinMetrics={result.metrics.map(
                      (m): MetricItem => ({
                        id: m.id,
                        name: m.name,
                        value: m.value,
                        description: m.description,
                      })
                    )}
                    analyzedAt={result.analyzedAt}
                    className="mb-6"
                  />

                  {/* 피부 활력도 점수 */}
                  <SkinVitalityScore
                    score={vitalityData.score}
                    factors={vitalityData.factors}
                    showDetails
                    className="mb-6"
                  />

                  {/* S-1 + PC-1 시너지 인사이트 */}
                  {synergyInsight && pcSeason && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                          <Palette
                            className="w-5 h-5 text-violet-600 dark:text-violet-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground mb-1">
                            피부 + 퍼스널컬러 시너지
                          </p>
                          <SynergyInline insight={synergyInsight} className="text-xs" />
                          <p className="text-xs text-muted-foreground mt-2">
                            {pcSeason} 시즌과 함께 분석한 결과예요
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PC-1 분석 유도 CTA (퍼스널컬러 미완료 시) */}
                  {synergyInsight && !pcSeason && (
                    <Link href="/analysis/personal-color" className="block mb-6">
                      <div className="p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                            <Palette
                              className="w-5 h-5 text-violet-600 dark:text-violet-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-foreground">
                              퍼스널 컬러와 함께 분석하면?
                            </p>
                            <SynergyInline insight={synergyInsight} className="text-xs mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              더 정확한 컬러 추천을 받을 수 있어요
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* 맞춤 클렌징 가이드 CTA 카드 */}
                  <Link
                    href={`/analysis/skin/solution?skinType=${skinType || ''}`}
                    className="block mb-6"
                  >
                    <div className="p-4 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 rounded-xl border border-sky-100 dark:border-sky-900/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
                          <Droplets
                            className="w-5 h-5 text-sky-600 dark:text-sky-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">
                            맞춤 클렌징 가이드
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {skinType ? `${skinType} 피부에 맞는` : '내 피부 타입에 맞는'} 클렌저와
                            pH 관리법
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>

                  {/* 환경 요인 안내 카드 */}
                  <div
                    data-testid="environment-info-card"
                    className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                        <Lightbulb
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
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
                            <span>조명/메이크업에 따라 결과가 달라질 수 있어요</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <Droplets
                              className="w-3 h-3 mt-0.5 flex-shrink-0 text-sky-500"
                              aria-hidden="true"
                            />
                            <span>메이크업이 있으면 피부 상태 분석 정확도가 낮아져요</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <Sparkles
                              className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500"
                              aria-hidden="true"
                            />
                            <span>노메이크업 상태에서 촬영하면 가장 정확해요</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <AnalysisResult
                    result={result}
                    onRetry={handleNewAnalysis}
                    evidence={analysisEvidence}
                    skinType={skinType || undefined}
                    imageUrl={imageUrl || pcImageUrl}
                  />

                  {/* 분석 근거 리포트 (메인 탭에 직접 표시) */}
                  {(analysisEvidence || imageQuality) && (
                    <SkinAnalysisEvidenceReport
                      evidence={analysisEvidence}
                      imageQuality={imageQuality}
                      skinType={skinType || 'normal'}
                      overallScore={result.overallScore}
                      className="mt-6"
                    />
                  )}

                  {/* 맞춤 추천 제품 */}
                  {skinType && (
                    <RecommendedProducts
                      analysisType="skin"
                      analysisResult={{
                        skinType: skinType as ProductSkinType,
                        skinConcerns: result.metrics
                          .filter((m) => m.status === 'warning')
                          .map((m) => {
                            const concernMap: Record<string, SkinConcern> = {
                              hydration: 'hydration',
                              pores: 'pore',
                              pigmentation: 'whitening',
                              wrinkles: 'aging',
                              sensitivity: 'redness',
                            };
                            return concernMap[m.id];
                          })
                          .filter((c): c is SkinConcern => c !== undefined),
                      }}
                      className="mt-8"
                    />
                  )}

                  {/* AI 투명성 고지 */}
                  <AITransparencyNotice compact className="mt-8" />

                  {/* FAB 여백 */}
                  <div className="pb-40" />
                </TabsContent>

                {/* 분석 근거 탭 */}
                <TabsContent value="evidence" className="mt-0 pb-40">
                  {analysisEvidence || imageQuality ? (
                    <SkinAnalysisEvidenceReport
                      evidence={analysisEvidence}
                      imageQuality={imageQuality}
                      skinType={skinType || 'normal'}
                      overallScore={result.overallScore}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>분석 근거 데이터가 없습니다</p>
                      <p className="text-sm mt-1">새로 분석하면 상세 근거가 제공됩니다</p>
                    </div>
                  )}
                </TabsContent>

                {/* 상세 시각화 탭 (S-1+) */}
                <TabsContent value="visual" className="mt-0 pb-40 space-y-6">
                  {/* 이미지가 없을 때 안내 */}
                  {!imageUrl && !pcImageUrl && (
                    <div className="text-center py-12 px-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-foreground mb-2">얼굴 이미지가 없습니다</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        이미지 저장 동의 후 분석하면
                        <br />
                        AI 시각화 기능을 사용할 수 있어요
                      </p>
                      <button
                        onClick={handleNewAnalysis}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        다시 분석하기
                      </button>
                    </div>
                  )}

                  {/* AI 정밀 피부 분석 (face-api.js 68포인트 랜드마크 기반) */}
                  {(imageUrl || pcImageUrl) && (
                    <FaceLandmarkHeatMap
                      imageUrl={(imageUrl || pcImageUrl)!}
                      zoneScores={heatMapZoneScores}
                      showHeatMap
                      showLabels
                      selectedZone={selectedHeatMapZone}
                      onZoneClick={setSelectedHeatMapZone}
                    />
                  )}

                  {/* 경쟁사 스타일 피부 분석 결과 (face-api.js 68포인트 랜드마크 기반) */}
                  {(imageUrl || pcImageUrl) && (
                    <PhotoMetricOverlayV2
                      imageUrl={(imageUrl || pcImageUrl)!}
                      metrics={photoMetrics}
                      showConnectors
                    />
                  )}

                  {/* 트렌드 차트 (과거 분석 이력) */}
                  <TrendChart data={trendData} metric="overall" showGoal goalScore={80} />

                  {/* Phase E: 문제 영역 확대 뷰어 */}
                  {(imageUrl || pcImageUrl) && problemAreas.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        문제 영역 상세 (마커를 탭하세요)
                      </h3>
                      <SkinZoomViewer
                        imageUrl={(imageUrl || pcImageUrl)!}
                        problemAreas={problemAreas}
                        className="rounded-xl overflow-hidden"
                      />
                    </div>
                  )}

                  {/* 얼굴 존 맵 (도식화) */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      영역별 상태 (탭하여 상세 보기)
                    </h3>
                    <FaceZoneMap
                      zones={zoneStatuses}
                      showLabels
                      showScores
                      size="lg"
                      highlightWorst
                      onZoneClick={(zoneId) => setSelectedZone(zoneId as FaceZoneId)}
                    />
                  </div>

                  {/* 선택된 존 상세 카드 */}
                  {selectedZoneDetail && (
                    <ZoneDetailCard
                      zoneId={selectedZoneDetail.zoneId}
                      zoneName={selectedZoneDetail.zoneName}
                      score={selectedZoneDetail.score}
                      status={selectedZoneDetail.status}
                      concerns={selectedZoneDetail.concerns}
                      recommendations={selectedZoneDetail.recommendations}
                      onClose={() => setSelectedZone(null)}
                    />
                  )}

                  {/* 기존 시각화 (이미지 기반) */}
                  {imageUrl ? (
                    <VisualAnalysisTab imageUrl={imageUrl} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      시각화에 필요한 이미지가 없습니다
                    </div>
                  )}
                </TabsContent>

                {/* 드레이핑 시뮬레이션 탭 (PC-1 연동) */}
                <TabsContent value="draping" className="mt-0 pb-40" data-testid="draping-tab">
                  {pcImageUrl ? (
                    <DrapingSimulationTab imageUrl={pcImageUrl} className="w-full" />
                  ) : (
                    <div className="p-6 bg-card rounded-xl border text-center">
                      <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">드레이핑 시뮬레이션</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        퍼스널 컬러 분석을 먼저 완료하면
                        <br />
                        나에게 어울리는 색상을 미리 볼 수 있어요.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/analysis/personal-color">
                          <Palette className="w-4 h-4 mr-2" />
                          퍼스널 컬러 분석하기
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* AI 피부 상담 탭 (Phase D) */}
                <TabsContent value="consultation" className="mt-0 pb-40" data-testid="consultation-tab">
                  <div className="h-[calc(100vh-280px)] min-h-[400px]">
                    <SkinConsultationChat
                      skinAnalysis={
                        result
                          ? ({
                              skinType: skinType || '복합성',
                              hydration: result.metrics.find((m) => m.id === 'hydration')?.value || 50,
                              oiliness: result.metrics.find((m) => m.id === 'oil')?.value || 50,
                              sensitivity: result.metrics.find((m) => m.id === 'sensitivity')?.value || 50,
                              analyzedAt: result.analyzedAt,
                            } as SkinAnalysisSummary)
                          : null
                      }
                      onProductClick={(productId) => {
                        router.push(`/products/${productId}`);
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>

      {/* 하단 접이식 FAB 메뉴 - 중앙 배치 (UX 최적화) */}
      {result && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]">
          {/* 펼쳐진 메뉴 - 중앙 정렬 */}
          {isActionMenuOpen && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* 클렌징 가이드 */}
              <Button
                size="sm"
                className="shadow-lg whitespace-nowrap bg-sky-500 hover:bg-sky-600"
                onClick={() => {
                  router.push(`/analysis/skin/solution?skinType=${skinType || ''}`);
                  setIsActionMenuOpen(false);
                }}
              >
                <Droplets className="w-4 h-4 mr-2" />
                클렌징 가이드
              </Button>

              {/* 맞춤 제품 */}
              <Button
                size="sm"
                className="shadow-lg whitespace-nowrap"
                onClick={() => {
                  router.push(`/products?skinType=${skinType || ''}&category=skincare`);
                  setIsActionMenuOpen(false);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                맞춤 제품
              </Button>

              {/* AI 피부 상담 */}
              <SkinConsultantCTA
                skinType={skinType || undefined}
                concerns={result.metrics.filter((m) => m.status === 'warning').map((m) => m.name)}
                variant="default"
                className="shadow-lg h-9 px-3 text-sm whitespace-nowrap"
              />

              {/* 다시 분석 */}
              <Button
                variant="outline"
                size="sm"
                className="shadow-lg bg-card whitespace-nowrap"
                onClick={() => {
                  handleNewAnalysis();
                  setIsActionMenuOpen(false);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 분석
              </Button>

              {/* 공유 */}
              <Button
                variant="outline"
                size="sm"
                className="shadow-lg bg-card whitespace-nowrap"
                onClick={() => {
                  share();
                  setIsActionMenuOpen(false);
                }}
                disabled={shareLoading}
              >
                <Share2 className="w-4 h-4 mr-2" />
                공유하기
              </Button>
            </div>
          )}

          {/* FAB 메인 버튼 - 56px (Material Design 권장) */}
          <button
            type="button"
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
              isActionMenuOpen
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            aria-label={isActionMenuOpen ? '메뉴 닫기' : '액션 메뉴 열기'}
          >
            {isActionMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      )}
    </>
  );
}
