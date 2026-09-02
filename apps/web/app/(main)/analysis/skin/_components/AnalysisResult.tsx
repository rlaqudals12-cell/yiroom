'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { formatDateTime } from '@/lib/utils/date-format';
import { classifyByRange, selectByKey } from '@/lib/utils/conditional-helpers';
import {
  RefreshCw,
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
  ChevronRight,
  Layers,
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
} from '@/lib/mock/skin-analysis';
import Link from 'next/link';
import { recommendMasks, MASK_TYPES } from '@/lib/skincare/mask-recommendation';
import { generateRoutine, detectProductCategory } from '@/lib/skincare';
import type { ProductCategory } from '@/types/skincare-routine';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import { FadeInUp } from '@/components/animations';
import { SectionHeader, RowTable, SpectrumRow, TrustFooter } from '@/components/analysis/report';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
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
import { TwelveZoneSummary } from '@/components/analysis/skin/TwelveZoneSummary';
import { HomeCareBoundary } from '@/components/analysis/skin/HomeCareBoundary';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';

// 분석 근거 타입
interface SkinAnalysisEvidence {
  tZoneOiliness?: 'dry' | 'normal' | 'oily' | 'very_oily';
  poreVisibility?: 'minimal' | 'visible' | 'enlarged' | 'very_enlarged';
}

interface AnalysisResultProps {
  result: SkinAnalysisResult;
  /** 저장 결과 ID. 저장 실패 인라인 폴백은 축+분석시각의 결정적 식별자를 사용한다. */
  reportTargetId?: string;
  onRetry: () => void;
  shareRef?: React.RefObject<HTMLDivElement | null>;
  evidence?: SkinAnalysisEvidence | null;
  skinType?: string;
  /** 분석에 사용된 사진 URL (경쟁사 스타일 UI 표시용) */
  imageUrl?: string | null;
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
  reportTargetId,
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

  // ADR-117: 내 화장대 보유 제품 카테고리 — 데일리 루틴 스텝에 "내 제품 있음" 점 표시용.
  // 1회 조회, 비로그인/실패 시 빈 세트(무표시). 과하지 않게 작은 점만.
  const [ownedCats, setOwnedCats] = useState<Set<ProductCategory>>(new Set());
  useEffect(() => {
    let cancelled = false;
    async function loadShelf() {
      try {
        const res = await fetch('/api/scan/shelf?status=owned&limit=100');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data.items)) return;
        const cats = new Set<ProductCategory>();
        for (const item of data.items as ShelfItem[]) {
          const cat = detectProductCategory(item);
          if (cat) cats.add(cat);
        }
        if (!cancelled) setOwnedCats(cats);
      } catch {
        /* 조회 실패 — 무표시 */
      }
    }
    loadShelf();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // 결론 먼저(ADR-111): 접힌 섹션의 1줄 요약 — 펼치기 전에도 핵심이 보이도록
  const scoreGradeLabel = classifyByRange(overallScore, [
    { max: 41, result: '관리 필요' },
    { min: 41, max: 71, result: '보통 상태' },
    { min: 71, result: '건강한 피부' },
  ]);
  // AI 인사이트 요약 = 첫 문장 (마침표/느낌표/물음표 기준)
  const insightFirstSentence = insight.split(/(?<=[.!?。])\s/)[0] ?? insight;

  return (
    // text-pretty: 짧은 꼬리 줄 방지 점진 향상 (Tailwind v4 내장 유틸)
    <div ref={shareRef} className="space-y-6 text-pretty" role="region" aria-label="피부 분석 결과">
      {/* 피부 고민 한눈에 (시그니처 판정 시각물) — 펼침 유지 (결론 먼저) */}
      <FadeInUp>
        <section>
          {/* 러닝넘버 섹션 헤더 — 진단지의 목차 리듬 (ADR-120) */}
          <div className="mb-3">
            <SectionHeader no={1} title="피부 고민 한눈에 보기" />
          </div>
          <ConcernGrid
            items={concernCards}
            onCardExpand={(id) => setSelectedMetric(id as SkinMetricId)}
          />
        </section>
      </FadeInUp>

      {/* 정본 데일리 루틴 — generateRoutine 엔진(홈 오늘의 루틴·케어 탭과 동일 기준) — 펼침 유지([결정]의 본체) */}
      <FadeInUp delay={1}>
        <section
          className="bg-card rounded-xl border p-6"
          data-testid="skin-daily-routine"
          aria-label="나에게 맞는 데일리 루틴"
        >
          <SectionHeader no={2} title="나에게 맞는 데일리 루틴" />
          <p className="mt-2 text-xs text-muted-foreground mb-4">
            홈의 &lsquo;오늘의 루틴&rsquo;과 같은 기준으로 만들어져요. 매일 이 순서대로만 발라도
            충분해요.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 아침 루틴 */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-1.5 mb-3">
                <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-sm font-medium text-foreground">
                  아침 (세안 후 바르는 순서)
                </span>
              </div>
              <ol className="space-y-2">
                {dailyRoutine.morning.routine.slice(0, 5).map((step, i) => (
                  <li key={`${step.category}-${i}`} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.name}
                        {ownedCats.has(step.category) && (
                          <span
                            className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle"
                            title="내 제품 있음"
                            aria-label="내 제품 있음"
                            data-testid="skin-routine-owned-dot"
                          />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.purpose}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 저녁 루틴 */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-1.5 mb-3">
                <Moon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-sm font-medium text-foreground">
                  저녁 (세안 후 바르는 순서)
                </span>
              </div>
              <ol className="space-y-2">
                {dailyRoutine.evening.routine.slice(0, 5).map((step, i) => (
                  <li key={`${step.category}-${i}`} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.name}
                        {ownedCats.has(step.category) && (
                          <span
                            className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle"
                            title="내 제품 있음"
                            aria-label="내 제품 있음"
                            data-testid="skin-routine-owned-dot"
                          />
                        )}
                      </p>
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
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            data-testid="skin-routine-full-link"
          >
            전체 루틴 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </FadeInUp>

      <FadeInUp delay={2}>
        <HomeCareBoundary boundary={result.homeCareBoundary} />
      </FadeInUp>

      {/* ─── 이하 상세는 접기 (결론 먼저, 근거는 접기 — ADR-111) ─── */}

      {/* 전체 피부 점수 (히어로에 점수가 이미 있어 접힘 — 제목에 점수 요약) */}
      <ProgressiveDisclosure
        title="전체 피부 점수"
        summary={`${overallScore}점 · ${scoreGradeLabel}`}
      >
        {/* 채점 게이지·색 필 소거 — 컨디션은 속성표 행 + 뮤트 마커로만 (ADR-120) */}
        <section className="bg-card rounded-xl border p-6">
          <RowTable testId="skin-overall-condition">
            <SpectrumRow
              label="컨디션"
              pos={overallScore / 100}
              status={`${overallScore}점 · ${scoreGradeLabel}`}
              testId="skin-overall-spectrum"
            />
          </RowTable>
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
      </ProgressiveDisclosure>

      {/* 강점·집중 지표 */}
      <ProgressiveDisclosure
        title="강점·집중 지표"
        summary={`강점 ${bestMetric.name} · 집중 ${worstMetric.name}`}
      >
        {/* 신호등 색 카드 소거 — 강점/집중은 뮤트 스펙트럼 행으로 (ADR-120) */}
        <section className="bg-card rounded-xl border p-6">
          <RowTable testId="skin-best-worst">
            <SpectrumRow
              icon={TrendingUp}
              label={`강점 · ${bestMetric.name}`}
              pos={bestMetric.value / 100}
              status={`${bestMetric.value}점`}
              testId="skin-best-spectrum"
            />
            <SpectrumRow
              icon={TrendingDown}
              label={`집중 · ${worstMetric.name}`}
              pos={worstMetric.value / 100}
              status={`${worstMetric.value}점`}
              testId="skin-worst-spectrum"
            />
          </RowTable>
        </section>
      </ProgressiveDisclosure>

      {/* 얼굴 부위별 시각화 (Layer 1: WHERE) */}
      <ProgressiveDisclosure
        title="얼굴 부위별 시각화"
        summary="사진 위 지표 또는 12존 맵으로 자세히 보기"
      >
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
      </ProgressiveDisclosure>

      {/* 7가지 지표 (Layer 2: WHAT) */}
      <ProgressiveDisclosure title="상세 수치 보기" summary="7가지 지표 점수 자세히 보기">
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
      </ProgressiveDisclosure>

      {/* AI 인사이트 (가변 보상) — 요약은 첫 문장. 그라데 박스 대신 세리프 인용 노트 (PC 문법) */}
      <ProgressiveDisclosure title="AI 인사이트" summary={insightFirstSentence}>
        <section className="border-l-2 border-primary/50 pl-4">
          <p className="break-keep font-serif text-sm italic leading-relaxed text-foreground/80">
            {insight}
          </p>
        </section>
      </ProgressiveDisclosure>

      {/* 12존 피부 분석 요약 (T4.5.8) */}
      {Object.keys(twelveZoneScores).length > 0 && (
        <ProgressiveDisclosure title="12존 상세 요약" summary="이마·코·볼·턱 부위별 세부 점수">
          <TwelveZoneSummary zoneScores={twelveZoneScores} zoneMetrics={twelveZoneMetrics} />
        </ProgressiveDisclosure>
      )}

      {/* 초보자 친화 팁 (EASY_SKIN_TIPS) */}
      {easySkinTip && (
        <ProgressiveDisclosure
          title="초보자를 위한 가이드"
          summary={easySkinTip.summary}
          icon={<Lightbulb className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
        >
          <section className="bg-card rounded-xl border p-6">
            <p className="text-sm text-muted-foreground mb-4">{easySkinTip.easyExplanation}</p>

            {/* 제품 팁 & 주의할 점 — 신호등 색 대신 텍스트 라벨로 상태를 말한다 */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-lg">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/80">
                  <span className="font-medium">추천:</span> {easySkinTip.productTip}
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/80">
                  <span className="font-medium">주의할 점:</span> {easySkinTip.avoidTip}
                </p>
              </div>
            </div>
          </section>
        </ProgressiveDisclosure>
      )}

      {/* 추천 성분 (가변 보상) */}
      <ProgressiveDisclosure
        title="추천 성분"
        summary={
          recommendedIngredients.length > 0
            ? `${recommendedIngredients[0].name} 등 ${recommendedIngredients.length}가지`
            : '추천 성분 보기'
        }
        icon={<FlaskConical className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
      >
        <div className="space-y-3">
          {recommendedIngredients.map((ingredient, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              {/* 항목 번호 — 러닝넘버보다 낮은 위계의 세리프 회조 (PC 리스트 문법) */}
              <span className="mt-[1px] shrink-0 font-serif text-xs italic tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-medium text-foreground">{ingredient.name}</p>
                <p className="text-sm text-muted-foreground">{ingredient.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </ProgressiveDisclosure>

      {/* 성분 경고 (화해 스타일) — 접기 */}
      {ingredientWarnings && ingredientWarnings.length > 0 && (
        <ProgressiveDisclosure
          title="주의 성분"
          summary={`${ingredientWarnings[0].ingredient} 등 ${ingredientWarnings.length}가지 주의`}
          icon={<AlertTriangle className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
        >
          <section className="bg-card rounded-xl border p-6">
            <div className="space-y-3">
              {ingredientWarnings.map((warning, index) => (
                // 경고 단계는 색이 아니라 텍스트 칩("높음/중간/낮음")으로 말한다 (ADR-120)
                <div key={index} className="p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{warning.ingredient}</span>
                      {warning.ingredientEn && (
                        <span className="text-xs text-muted-foreground">
                          ({warning.ingredientEn})
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      주의 {selectByKey(warning.level, { high: '높음', medium: '중간' }, '낮음')}
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
        </ProgressiveDisclosure>
      )}

      {/* 제품 추천 — 접기 */}
      {productRecommendations && (
        <ProgressiveDisclosure
          title="제품 & 케어 가이드"
          summary="단계별 추천 제품과 주간 케어 가이드"
          icon={<ShoppingBag className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
        >
          <section className="bg-card rounded-xl border p-6">
            {/* 단계별 제품 추천 */}
            {productRecommendations.routine.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/80">추천 제품</p>
                {productRecommendations.routine.slice(0, 5).map((step, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <span className="mt-[1px] shrink-0 font-serif text-xs italic tabular-nums text-muted-foreground">
                      {String(step.step).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {(step as { categoryLabel?: string }).categoryLabel || step.category}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.products.join(', ')}</p>
                      {/* 단계별 사용 팁 */}
                      {step.tip && (
                        <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-background/60 rounded-md">
                          <Lightbulb className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">{step.tip}</p>
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
                    <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    <p className="text-sm font-medium text-foreground/80">주간 케어</p>
                  </div>
                  <div className="space-y-1.5">
                    {productRecommendations.careTips.weeklyCare.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-lg"
                      >
                        <span className="mt-[1px] shrink-0 font-serif text-xs italic tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className="text-sm text-foreground/80">{tip}</p>
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
                    <Heart className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    <p className="text-sm font-medium text-foreground/80">라이프스타일 팁</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {productRecommendations.careTips.lifestyleTips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg"
                      >
                        <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-foreground/80">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </section>
        </ProgressiveDisclosure>
      )}

      {/* 마스크팩 추천 — 접기 */}
      {maskRecommendation && maskRecommendation.recommended.length > 0 && (
        <ProgressiveDisclosure
          title="맞춤 마스크팩"
          summary="추천 마스크와 주간 마스크팩 플랜"
          icon={<Layers className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
        >
          <section className="bg-card rounded-xl border p-6">
            {/* 개인화 노트 */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground/80">{maskRecommendation.personalizationNote}</p>
            </div>

            {/* 추천 마스크 목록 */}
            <div className="space-y-3">
              {maskRecommendation.recommended.map((mask, index) => (
                <div key={mask.type} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="mt-[1px] shrink-0 font-serif text-xs italic tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
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
                          className="text-xs px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground"
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
                      <div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground">
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
                  <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
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
                          maskType ? 'border border-border bg-card' : 'bg-muted/50'
                        }`}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {dayLabels[day]}
                        </p>
                        {maskType && (
                          <p className="text-[10px] text-foreground/80 mt-1">
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
        </ProgressiveDisclosure>
      )}

      {/* 피부 타입 기반 파운데이션 제형 추천 — 접기 */}
      {foundationFormula && (
        <ProgressiveDisclosure
          title="파운데이션 제형 추천"
          summary={`${foundationFormula.finishLabel} · ${foundationFormula.coverageLabel} · 피부 타입 기반`}
          icon={<Palette className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />}
        >
          <section className="bg-card rounded-xl border p-6">
            {/* 3가지 핵심 추천 — 속성표 리듬의 뮤트 셀 (ADR-120) */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">피니쉬</span>
                <span className="font-semibold text-foreground">
                  {foundationFormula.finishLabel}
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">커버력</span>
                <span className="font-semibold text-foreground">
                  {foundationFormula.coverageLabel}
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground block mb-1">텍스처</span>
                <span className="font-semibold text-foreground">
                  {foundationFormula.textureLabel}
                </span>
              </div>
            </div>

            {/* 맞춤 팁 */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb
                  className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0"
                  strokeWidth={1.75}
                />
                <p className="text-sm text-foreground/80">{foundationFormula.tip}</p>
              </div>
              {foundationFormula.avoidTip && (
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
                  <AlertTriangle
                    className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                  <p className="text-sm text-muted-foreground">{foundationFormula.avoidTip}</p>
                </div>
              )}
            </div>

            {/* PC-1 안내 */}
            {personalColorSeason && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                색상/쉐이드는 퍼스널 컬러 분석({personalColorSeason}) 결과를 참고하세요
              </p>
            )}
          </section>
        </ProgressiveDisclosure>
      )}

      {/* 신뢰 푸터 — 진단서의 직인 (ADR-120). 피부는 저장된 신뢰도 수치가 없어
          위장 수치 없이 분석 시간만 정직하게 표기 */}
      <FadeInUp delay={8}>
        <TrustFooter reportTargetId={reportTargetId} testId="skin-trust-footer">
          <p>
            분석 시간:{' '}
            {formatDateTime(analyzedAt, locale, { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </TrustFooter>
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
