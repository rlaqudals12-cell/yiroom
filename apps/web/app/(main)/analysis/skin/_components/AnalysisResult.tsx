'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { formatDateTime } from '@/lib/utils/date-format';
import { classifyByRange, mapToClass, selectByKey } from '@/lib/utils/conditional-helpers';
import {
  RefreshCw,
  Sparkles,
  FlaskConical,
  AlertTriangle,
  ShoppingBag,
  Palette,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Heart,
  Lightbulb,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// zoneId 기반 deterministic 변화값 생성 (Math.random() 대체)
function getDeterministicVariation(zoneId: string, seed: number): number {
  let hash = 0;
  const str = `${zoneId}-${seed}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  // -10 ~ +10 범위의 정수 반환
  return (Math.abs(hash) % 21) - 10;
}
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  type SkinAnalysisResult,
  type SkinTypeId,
  type SkinConcernId,
  getScoreColor,
  getScoreBgColor,
} from '@/lib/mock/skin-analysis';
import Link from 'next/link';
import { recommendMasks, MASK_TYPES } from '@/lib/skincare/mask-recommendation';
import { generateRoutine } from '@/lib/skincare';
import { FadeInUp, ScaleIn, CountUp } from '@/components/animations';
import { SkinEvidenceSummary } from '@/components/analysis/EvidenceSummary';
import { MetricDetailCard } from '@/components/analysis/skin/MetricDetailCard';
import { ZoneDetailCard } from '@/components/analysis/skin/ZoneDetailCard';
import { ProfessionalSkinMap } from '@/components/analysis/skin/ProfessionalSkinMap';
import { MetricBarGaugeList } from '@/components/analysis/skin/MetricBarGauge';
import {
  PhotoMetricOverlay,
  type MetricScore,
  type SkinMetricType,
} from '@/components/analysis/skin';
import type { SkinMetricId } from '@/types/skin-detailed';
import type { DetailedZoneId, DetailedZoneStatus, DetailedStatusLevel } from '@/types/skin-zones';
import { ConcernGrid } from '@/components/analysis/common';
import { mapSkinMetricsToConcernCards } from '@/components/analysis/skin/SkinConcernData';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { TwelveZoneSummary } from '@/components/analysis/skin/TwelveZoneSummary';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';

// 분석 근거 타입
interface SkinAnalysisEvidence {
  tZoneOiliness?: 'dry' | 'normal' | 'oily' | 'very_oily';
  poreVisibility?: 'minimal' | 'visible' | 'enlarged' | 'very_enlarged';
}

interface AnalysisResultProps {
  result: SkinAnalysisResult;
  onRetry: () => void;
  shareRef?: React.RefObject<HTMLDivElement | null>;
  evidence?: SkinAnalysisEvidence | null;
  skinType?: string;
  /** 분석에 사용된 사진 URL (경쟁사 스타일 UI 표시용) */
  imageUrl?: string | null;
}

// 원형 프로그레스 바 컴포넌트
function CircularProgress({
  score,
  size = 140,
  strokeWidth = 10,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (score: number) => {
    if (score >= 71) return '#22c55e'; // green-500
    if (score >= 41) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          <CountUp end={score} duration={1500} />
        </span>
        <span className="text-sm text-muted-foreground">점</span>
      </div>
    </div>
  );
}

// 점수 → 5단계 상태 변환 (12존 맵용)
function getDetailedStatus(score: number): DetailedStatusLevel {
  if (score >= 85) return 'excellent';
  if (score >= 71) return 'good';
  if (score >= 41) return 'normal';
  if (score >= 25) return 'warning';
  return 'critical';
}

// 메트릭 ID → 12존 ID 매핑 (시뮬레이션용)
const METRIC_TO_ZONE_MAP: Record<string, DetailedZoneId[]> = {
  hydration: ['cheek_left', 'cheek_right', 'chin_left', 'chin_right'],
  oil: ['forehead_center', 'nose_bridge', 'nose_tip'],
  pores: ['nose_tip', 'nose_bridge', 'cheek_left', 'cheek_right'],
  wrinkles: ['eye_left', 'eye_right', 'forehead_center'],
  elasticity: ['cheek_left', 'cheek_right', 'chin_center'],
  pigmentation: ['cheek_left', 'cheek_right', 'forehead_left', 'forehead_right'],
  trouble: ['forehead_center', 'chin_center', 'nose_tip'],
};

export default function AnalysisResult({
  result,
  onRetry,
  shareRef,
  evidence,
  skinType,
  imageUrl,
}: AnalysisResultProps) {
  const locale = useLocale();

  // Progressive Disclosure 상태
  const [selectedMetric, setSelectedMetric] = useState<SkinMetricId | null>(null);
  const [selectedZone, setSelectedZone] = useState<DetailedZoneId | null>(null);

  const {
    overallScore,
    metrics,
    insight,
    recommendedIngredients,
    analyzedAt,
    personalColorSeason,
    foundationFormula, // 피부 타입 기반 제형 추천
    ingredientWarnings,
    productRecommendations,
    easySkinTip,
  } = result;

  // 가장 좋은/나쁜 지표 찾기
  const { bestMetric, worstMetric } = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => b.value - a.value);
    return {
      bestMetric: sorted[0],
      worstMetric: sorted[sorted.length - 1],
    };
  }, [metrics]);

  // ConcernCard 데이터 변환 (V4 Concern Card 패턴)
  const concernCards = useMemo(() => mapSkinMetricsToConcernCards(metrics), [metrics]);

  // 정본 데일리 루틴 — /beauty 케어 탭·캡슐 데일리·루틴 페이지와 동일한 generateRoutine 엔진 사용.
  // includeOptional:false = 필수 스텝만 요약(3~5개). 심화(선택 스텝 포함)는 /analysis/skin/routine.
  const dailyRoutine = useMemo(() => {
    const valid: SkinTypeId[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
    const normalized = (skinType?.toLowerCase() ?? '') as SkinTypeId;
    const resolvedSkinType: SkinTypeId = valid.includes(normalized) ? normalized : 'normal';

    // 실측 지표(경고 상태)에서 고민 파생 — 루틴 개인화 노트 강화용
    const CONCERN_MAP: Record<string, SkinConcernId> = {
      hydration: 'dryness',
      oil: 'excess_oil',
      pores: 'pores',
      wrinkles: 'wrinkles',
      pigmentation: 'pigmentation',
      sensitivity: 'sensitivity',
      trouble: 'acne',
    };
    const concerns = metrics
      .filter((m) => m.status === 'warning')
      .map((m) => CONCERN_MAP[m.id])
      .filter((c): c is SkinConcernId => c !== undefined);

    return {
      resolvedSkinType,
      morning: generateRoutine({
        skinType: resolvedSkinType,
        concerns,
        timeOfDay: 'morning',
        includeOptional: false,
      }),
      evening: generateRoutine({
        skinType: resolvedSkinType,
        concerns,
        timeOfDay: 'evening',
        includeOptional: false,
      }),
    };
  }, [skinType, metrics]);

  // PhotoMetricOverlay용 메트릭 변환 (경쟁사 스타일 8개 지표)
  const photoMetrics = useMemo((): MetricScore[] => {
    const getMetricValue = (id: string) => metrics.find((m) => m.id === id)?.value ?? 50;

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
  }, [metrics]);

  // 12존 데이터 시뮬레이션 (메트릭 기반으로 생성)
  const zoneData = useMemo(() => {
    const zones: Partial<Record<DetailedZoneId, DetailedZoneStatus>> = {};
    const allZoneIds: DetailedZoneId[] = [
      'forehead_center',
      'forehead_left',
      'forehead_right',
      'eye_left',
      'eye_right',
      'cheek_left',
      'cheek_right',
      'nose_bridge',
      'nose_tip',
      'chin_center',
      'chin_left',
      'chin_right',
    ];

    // 각 존에 대해 관련 메트릭 점수 평균 계산
    allZoneIds.forEach((zoneId) => {
      const relatedMetrics = metrics.filter((m) => METRIC_TO_ZONE_MAP[m.id]?.includes(zoneId));

      if (relatedMetrics.length > 0) {
        const avgScore = Math.round(
          relatedMetrics.reduce((sum, m) => sum + m.value, 0) / relatedMetrics.length
        );
        // ±10 범위의 deterministic 변화 추가 (zoneId 기반)
        const variation = getDeterministicVariation(zoneId, overallScore);
        const finalScore = Math.max(0, Math.min(100, avgScore + variation));

        zones[zoneId] = {
          zoneId,
          score: finalScore,
          status: getDetailedStatus(finalScore),
          concerns: relatedMetrics.filter((m) => m.status === 'warning').map((m) => m.name),
          recommendations: relatedMetrics.slice(0, 2).map((m) => `${m.name} 관리 필요`),
        };
      } else {
        // 관련 메트릭이 없으면 전체 평균 + deterministic 변화 사용
        const variation = getDeterministicVariation(zoneId, overallScore);
        const finalScore = Math.max(0, Math.min(100, overallScore + variation));
        zones[zoneId] = {
          zoneId,
          score: finalScore,
          status: getDetailedStatus(finalScore),
          concerns: [],
          recommendations: [],
        };
      }
    });

    return zones;
  }, [metrics, overallScore]);

  // 12존 점수/메트릭 변환 (TwelveZoneSummary용)
  const twelveZoneScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const [zoneId, status] of Object.entries(zoneData)) {
      if (status) scores[zoneId] = status.score;
    }
    return scores as Record<DetailedZoneId, number>;
  }, [zoneData]);

  // 기존 메트릭에서 ZoneMetricsV2 시뮬레이션
  const twelveZoneMetrics = useMemo(() => {
    const result: Record<string, ZoneMetricsV2> = {};
    const getVal = (id: string): number => metrics.find((m) => m.id === id)?.value ?? 50;

    for (const zoneId of Object.keys(zoneData)) {
      const zone = zoneData[zoneId as DetailedZoneId];
      if (!zone) continue;

      // 존 위치에 따라 관련 메트릭 가중치 적용
      const isT = zoneId.startsWith('forehead') || zoneId.startsWith('nose');
      const isEye = zoneId.startsWith('eye');
      const variation = getDeterministicVariation(zoneId, overallScore) * 0.5;

      result[zoneId] = {
        hydration: Math.max(0, Math.min(100, getVal('hydration') + variation)),
        oiliness: Math.max(
          0,
          Math.min(100, isT ? getVal('oil') + 10 : getVal('oil') - 5 + variation)
        ),
        pores: Math.max(0, Math.min(100, getVal('pores') + variation)),
        texture: Math.max(0, Math.min(100, getVal('elasticity') + variation)),
        pigmentation: Math.max(0, Math.min(100, getVal('pigmentation') + variation)),
        sensitivity: Math.max(
          0,
          Math.min(100, isEye ? getVal('sensitivity') + 10 : getVal('sensitivity') + variation)
        ),
        elasticity: Math.max(0, Math.min(100, getVal('elasticity') + variation)),
      };
    }
    return result as Record<DetailedZoneId, ZoneMetricsV2>;
  }, [zoneData, metrics, overallScore]);

  // 마스크팩 추천 계산
  const maskRecommendation = useMemo(() => {
    if (!skinType) return null;
    // 피부 고민을 SkinConcernId로 매핑
    const concernMap: Record<string, SkinConcernId> = {
      hydration: 'dehydration',
      pores: 'pores',
      pigmentation: 'pigmentation',
      wrinkles: 'wrinkles',
      sensitivity: 'sensitivity',
      elasticity: 'fine_lines',
      oilBalance: 'excess_oil',
    };
    const concerns: SkinConcernId[] = metrics
      .filter((m) => m.status === 'warning')
      .map((m) => concernMap[m.id])
      .filter((c): c is SkinConcernId => c !== undefined);

    return recommendMasks(skinType as SkinTypeId, concerns);
  }, [skinType, metrics]);

  return (
    <div ref={shareRef} className="space-y-6" role="region" aria-label="피부 분석 결과">
      {/* 전체 점수 카드 - 원형 프로그레스 바 */}
      <ScaleIn>
        <section className="bg-gradient-to-br from-emerald-50 via-card to-teal-50 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground mb-4 text-center">전체 피부 점수</p>
          <div className="flex justify-center mb-4">
            <CircularProgress score={overallScore} />
          </div>
          <div className="flex justify-center">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-medium text-white ${getScoreBgColor(overallScore)}`}
            >
              {classifyByRange(overallScore, [
                { max: 41, result: '관리 필요' },
                { min: 41, max: 71, result: '보통 상태' },
                { min: 71, result: '건강한 피부' },
              ])}
            </span>
          </div>

          {/* 핵심 판정 근거 요약 */}
          {skinType && (
            <SkinEvidenceSummary
              tZoneOiliness={evidence?.tZoneOiliness}
              poreVisibility={evidence?.poreVisibility}
              skinType={skinType}
              className="mt-4"
            />
          )}
        </section>
      </ScaleIn>

      {/* 피부 상태 요약 */}
      <FadeInUp delay={1}>
        <section className="grid grid-cols-2 gap-3">
          {/* 가장 좋은 지표 */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Best</span>
            </div>
            <p className="font-semibold text-foreground">{bestMetric.name}</p>
            <p className="text-2xl font-bold text-green-600">{bestMetric.value}점</p>
          </div>
          {/* 개선 필요 지표 */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Focus</span>
            </div>
            <p className="font-semibold text-foreground">{worstMetric.name}</p>
            <p className="text-2xl font-bold text-amber-600">{worstMetric.value}점</p>
          </div>
        </section>
      </FadeInUp>

      {/* 피부 고민 개요 (Layer 1: CONCERN OVERVIEW) */}
      <FadeInUp delay={2}>
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">피부 고민 한눈에 보기</h2>
          <ConcernGrid
            items={concernCards}
            onCardExpand={(id) => setSelectedMetric(id as SkinMetricId)}
          />
        </section>
      </FadeInUp>

      {/* 피부 분석 시각화 (Layer 1: WHERE) */}
      <FadeInUp delay={2}>
        {imageUrl ? (
          /* 경쟁사 스타일: 실제 사진 + 점수 배지 (룰루랩/퍼펙트코프 스타일) */
          <PhotoMetricOverlay
            imageUrl={imageUrl}
            metrics={photoMetrics}
            showConnectors
            showOverlay
          />
        ) : (
          /* 사진 없을 때: 피부과 측정 장비 스타일 12존 맵 */
          <ProfessionalSkinMap
            zoneData={zoneData}
            selectedZone={selectedZone}
            onZoneClick={(zoneId) => setSelectedZone(zoneId)}
          />
        )}
      </FadeInUp>

      {/* 7가지 지표 (Layer 2: WHAT) - Collapsible 래핑 (기본 접힘) */}
      <FadeInUp delay={3}>
        <Collapsible>
          <CollapsibleTrigger
            data-testid="metric-collapsible-trigger"
            className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
          >
            <span className="text-sm font-semibold text-foreground">상세 수치 보기</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <MetricBarGaugeList
              metrics={
                Object.fromEntries(
                  metrics.map((m) => [m.id, { score: m.value, status: m.status, name: m.name }])
                ) as Record<
                  SkinMetricId,
                  { score: number; status: 'good' | 'normal' | 'warning'; name: string }
                >
              }
              selectedMetric={selectedMetric}
              onMetricClick={(metricId) => setSelectedMetric(metricId)}
              userAge={25}
            />
          </CollapsibleContent>
        </Collapsible>
      </FadeInUp>

      {/* AI 인사이트 (가변 보상) */}
      <FadeInUp delay={3}>
        <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">AI 인사이트</h2>
          </div>
          <p className="text-foreground/80 leading-relaxed">{insight}</p>
        </section>
      </FadeInUp>

      {/* 12존 피부 분석 요약 (T4.5.8) */}
      {Object.keys(twelveZoneScores).length > 0 && (
        <FadeInUp delay={4}>
          <TwelveZoneSummary zoneScores={twelveZoneScores} zoneMetrics={twelveZoneMetrics} />
        </FadeInUp>
      )}

      {/* 초보자 친화 팁 (EASY_SKIN_TIPS) */}
      {easySkinTip && (
        <FadeInUp delay={4}>
          <section className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl border border-teal-200 dark:border-teal-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-foreground">초보자를 위한 가이드</h2>
            </div>

            {/* 요약 */}
            <p className="text-teal-800 dark:text-teal-200 font-medium mb-3">
              {easySkinTip.summary}
            </p>
            <p className="text-sm text-muted-foreground mb-4">{easySkinTip.easyExplanation}</p>

            {/* 제품 팁 & 주의할 점 */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <span className="text-green-600">✓</span>
                <p className="text-xs text-green-800 dark:text-green-200">
                  <span className="font-medium">추천:</span> {easySkinTip.productTip}
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-800 dark:text-red-200">
                  <span className="font-medium">주의할 점:</span> {easySkinTip.avoidTip}
                </p>
              </div>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 정본 데일리 루틴 — generateRoutine 엔진(홈 오늘의 루틴·케어 탭과 동일 기준) */}
      <FadeInUp delay={4}>
        <section
          className="bg-card rounded-xl border p-6"
          data-testid="skin-daily-routine"
          aria-label="나에게 맞는 데일리 루틴"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">나에게 맞는 데일리 루틴</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            홈의 &lsquo;오늘의 루틴&rsquo;과 같은 기준으로 만들어져요. 매일 이 순서대로만 발라도
            충분해요.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 아침 루틴 */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  아침 (세안 후 바르는 순서)
                </span>
              </div>
              <ol className="space-y-2">
                {dailyRoutine.morning.routine.slice(0, 5).map((step, i) => (
                  <li key={`${step.category}-${i}`} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.purpose}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 저녁 루틴 */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                  저녁 (세안 후 바르는 순서)
                </span>
              </div>
              <ol className="space-y-2">
                {dailyRoutine.evening.routine.slice(0, 5).map((step, i) => (
                  <li key={`${step.category}-${i}`} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.purpose}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* 개인화 노트 */}
          <p className="mt-3 text-xs text-muted-foreground">
            {dailyRoutine.morning.personalizationNote}
          </p>

          {/* 전체 루틴 보기 (선택 스텝·제품 추천 포함 심화 페이지) */}
          <Link
            href="/analysis/skin/routine"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-pink-600 dark:text-pink-400 hover:underline"
            data-testid="skin-routine-full-link"
          >
            전체 루틴 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </FadeInUp>

      {/* 추천 성분 (가변 보상) */}
      <FadeInUp delay={4}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 성분</h2>
          </div>
          <div className="space-y-3">
            {recommendedIngredients.map((ingredient, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{ingredient.name}</p>
                  <p className="text-sm text-muted-foreground">{ingredient.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 성분 경고 (화해 스타일) */}
      {ingredientWarnings && ingredientWarnings.length > 0 && (
        <FadeInUp delay={5}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">주의 성분</h2>
            </div>
            <div className="space-y-3">
              {ingredientWarnings.map((warning, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${mapToClass(
                    warning.level,
                    {
                      high: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                      medium:
                        'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                    },
                    'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                  )}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{warning.ingredient}</span>
                      {warning.ingredientEn && (
                        <span className="text-xs text-muted-foreground">
                          ({warning.ingredientEn})
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${mapToClass(
                        warning.level,
                        {
                          high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
                          medium:
                            'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
                        },
                        'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                      )}`}
                    >
                      {selectByKey(warning.level, { high: '높음', medium: '중간' }, '낮음')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{warning.reason}</p>
                  {warning.alternatives && warning.alternatives.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      대안: {warning.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 제품 추천 */}
      {productRecommendations && (
        <FadeInUp delay={6}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-foreground">제품 &amp; 케어 가이드</h2>
            </div>

            {/* 단계별 제품 추천 */}
            {productRecommendations.routine.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/80">추천 제품</p>
                {productRecommendations.routine.slice(0, 5).map((step, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xs font-medium">
                      {step.step}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {(step as { categoryLabel?: string }).categoryLabel || step.category}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.products.join(', ')}</p>
                      {/* 단계별 사용 팁 */}
                      {step.tip && (
                        <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-background/60 rounded-md">
                          <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-700 dark:text-amber-400">{step.tip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 주간 케어 가이드 */}
            {productRecommendations.careTips?.weeklyCare &&
              productRecommendations.careTips.weeklyCare.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-medium text-foreground/80">주간 케어</p>
                  </div>
                  <div className="space-y-1.5">
                    {productRecommendations.careTips.weeklyCare.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* 라이프스타일 팁 */}
            {productRecommendations.careTips?.lifestyleTips &&
              productRecommendations.careTips.lifestyleTips.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <p className="text-sm font-medium text-foreground/80">라이프스타일 팁</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {productRecommendations.careTips.lifestyleTips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg"
                      >
                        <Info className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <p className="text-xs text-rose-800 dark:text-rose-200">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </section>
        </FadeInUp>
      )}

      {/* 마스크팩 추천 */}
      {maskRecommendation && maskRecommendation.recommended.length > 0 && (
        <FadeInUp delay={7}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎭</span>
              <h2 className="text-lg font-semibold text-foreground">맞춤 마스크팩</h2>
            </div>

            {/* 개인화 노트 */}
            <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
              <p className="text-sm text-violet-800 dark:text-violet-200">
                {maskRecommendation.personalizationNote}
              </p>
            </div>

            {/* 추천 마스크 목록 */}
            <div className="space-y-3">
              {maskRecommendation.recommended.map((mask, index) => (
                <div key={mask.type} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{mask.name}</p>
                      <span className="text-xs text-muted-foreground">{mask.frequency}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{mask.description}</p>
                    {/* 주요 성분 태그 */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mask.keyIngredients.slice(0, 3).map((ingredient) => (
                        <span
                          key={ingredient}
                          className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                    {/* 사용법 */}
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{mask.usage}</span>
                    </div>
                    {/* 주의사항 */}
                    {mask.caution && (
                      <div className="flex items-start gap-1.5 mt-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{mask.caution}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 주간 플랜 */}
            {maskRecommendation.weeklyPlan && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  <p className="text-sm font-medium text-foreground">주간 마스크팩 플랜</p>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(
                    [
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ] as const
                  ).map((day) => {
                    const maskType = maskRecommendation.weeklyPlan[day];
                    const dayLabels: Record<string, string> = {
                      monday: '월',
                      tuesday: '화',
                      wednesday: '수',
                      thursday: '목',
                      friday: '금',
                      saturday: '토',
                      sunday: '일',
                    };
                    return (
                      <div
                        key={day}
                        className={`text-center p-2 rounded-lg ${
                          maskType ? 'bg-violet-100 dark:bg-violet-900/50' : 'bg-muted/50'
                        }`}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {dayLabels[day]}
                        </p>
                        {maskType && (
                          <p className="text-[10px] text-violet-700 dark:text-violet-300 mt-1">
                            {MASK_TYPES[maskType].name.replace(' 마스크', '')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </FadeInUp>
      )}

      {/* 피부 타입 기반 파운데이션 제형 추천 */}
      {foundationFormula && (
        <FadeInUp delay={7}>
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-foreground">파운데이션 제형 추천</h2>
              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                피부 타입 기반
              </span>
            </div>

            {/* 3가지 핵심 추천 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">피니쉬</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {foundationFormula.finishLabel}
                </span>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">커버력</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {foundationFormula.coverageLabel}
                </span>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">텍스처</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {foundationFormula.textureLabel}
                </span>
              </div>
            </div>

            {/* 맞춤 팁 */}
            <div className="bg-white/40 dark:bg-black/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">{foundationFormula.tip}</p>
              </div>
              {foundationFormula.avoidTip && (
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{foundationFormula.avoidTip}</p>
                </div>
              )}
            </div>

            {/* PC-1 안내 */}
            {personalColorSeason && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                💡 색상/쉐이드는 퍼스널 컬러 분석({personalColorSeason}) 결과를 참고하세요
              </p>
            )}
          </section>
        </FadeInUp>
      )}

      {/* 분석 시간 */}
      <FadeInUp delay={8}>
        <p className="text-center text-sm text-muted-foreground">
          분석 시간: {formatDateTime(analyzedAt, locale)}
        </p>
      </FadeInUp>

      {/* 다시 분석하기 버튼 */}
      <FadeInUp delay={8}>
        <Button onClick={onRetry} variant="outline" className="w-full h-12 text-base gap-2">
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </Button>
      </FadeInUp>

      {/* 지표 상세 Sheet (Layer 3: WHY + HOW) */}
      <Sheet open={selectedMetric !== null} onOpenChange={() => setSelectedMetric(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <VisuallyHidden>
              <SheetTitle>피부 지표 상세 정보</SheetTitle>
            </VisuallyHidden>
          </SheetHeader>
          {selectedMetric && (
            <MetricDetailCard
              metricId={selectedMetric}
              score={metrics.find((m) => m.id === selectedMetric)?.value ?? 50}
              onClose={() => setSelectedMetric(null)}
              className="border-0 shadow-none"
            />
          )}
        </SheetContent>
      </Sheet>

      {/* 존 상세 Sheet (Layer 3: WHY + HOW) */}
      <Sheet open={selectedZone !== null} onOpenChange={() => setSelectedZone(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <VisuallyHidden>
              <SheetTitle>부위별 상세 정보</SheetTitle>
            </VisuallyHidden>
          </SheetHeader>
          {selectedZone && (
            <ZoneDetailCard
              zoneId={selectedZone}
              score={zoneData[selectedZone]?.score ?? 50}
              onClose={() => setSelectedZone(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
