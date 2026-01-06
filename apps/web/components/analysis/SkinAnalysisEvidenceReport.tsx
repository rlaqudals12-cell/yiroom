'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Droplet,
  Sun,
  Activity,
  Camera,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Eye,
  CircleDot,
} from 'lucide-react';

// 분석 근거 타입
export interface SkinAnalysisEvidence {
  tZoneOiliness: 'dry' | 'normal' | 'oily' | 'very_oily';
  uZoneHydration: 'dehydrated' | 'normal' | 'well_hydrated';
  poreVisibility: 'minimal' | 'visible' | 'enlarged' | 'very_enlarged';
  skinTexture: 'smooth' | 'slightly_rough' | 'rough' | 'very_rough';
  rednessLevel: 'none' | 'slight' | 'moderate' | 'severe';
  pigmentationPattern: 'even' | 'slight_spots' | 'moderate_spots' | 'severe_spots';
  wrinkleDepth: 'none' | 'fine_lines' | 'moderate' | 'deep';
  elasticityObservation: 'firm' | 'slightly_loose' | 'loose' | 'very_loose';
}

// 이미지 품질 타입
export interface SkinImageQuality {
  lightingCondition: 'natural' | 'artificial' | 'mixed';
  makeupDetected: boolean;
  analysisReliability: 'high' | 'medium' | 'low';
}

interface SkinAnalysisEvidenceReportProps {
  evidence: SkinAnalysisEvidence | null;
  imageQuality: SkinImageQuality | null;
  skinType: string;
  overallScore?: number | null;
  className?: string;
}

// T존 유분 → 한국어 변환
const TZONE_LABELS: Record<string, { label: string; description: string }> = {
  dry: { label: '건조', description: '유분이 거의 없는 상태' },
  normal: { label: '보통', description: '적당한 유분 상태' },
  oily: { label: '번들거림', description: '유분이 다소 과다' },
  very_oily: { label: '매우 번들거림', description: '유분이 매우 과다' },
};

// U존 수분 → 한국어 변환
const UZONE_LABELS: Record<string, { label: string; description: string }> = {
  dehydrated: { label: '탈수', description: '수분이 부족한 상태' },
  normal: { label: '적정', description: '수분이 적절한 상태' },
  well_hydrated: { label: '촉촉', description: '수분이 충분한 상태' },
};

// 모공 가시성 → 한국어 변환
const PORE_LABELS: Record<string, { label: string; description: string }> = {
  minimal: { label: '미세', description: '모공이 거의 보이지 않음' },
  visible: { label: '보임', description: '모공이 약간 보임' },
  enlarged: { label: '확대', description: '모공이 넓어진 상태' },
  very_enlarged: { label: '매우 확대', description: '모공이 많이 넓어진 상태' },
};

// 피부결 → 한국어 변환
const TEXTURE_LABELS: Record<string, { label: string; description: string }> = {
  smooth: { label: '매끄러움', description: '피부결이 고운 상태' },
  slightly_rough: { label: '약간 거칠음', description: '피부결이 약간 거친 상태' },
  rough: { label: '거칠음', description: '피부결이 거친 상태' },
  very_rough: { label: '매우 거칠음', description: '피부결이 많이 거친 상태' },
};

// 홍조 → 한국어 변환
const REDNESS_LABELS: Record<string, { label: string; description: string }> = {
  none: { label: '없음', description: '붉은기 없음' },
  slight: { label: '약간', description: '약간의 홍조' },
  moderate: { label: '중간', description: '눈에 띄는 홍조' },
  severe: { label: '심함', description: '전체적인 붉은기' },
};

// 색소침착 → 한국어 변환
const PIGMENT_LABELS: Record<string, { label: string; description: string }> = {
  even: { label: '균일', description: '피부톤이 균일함' },
  slight_spots: { label: '약간', description: '약간의 잡티' },
  moderate_spots: { label: '중간', description: '눈에 띄는 잡티' },
  severe_spots: { label: '많음', description: '기미/잡티 많음' },
};

// 주름 → 한국어 변환
const WRINKLE_LABELS: Record<string, { label: string; description: string }> = {
  none: { label: '없음', description: '주름이 없음' },
  fine_lines: { label: '잔주름', description: '가는 잔주름' },
  moderate: { label: '중간', description: '눈에 띄는 주름' },
  deep: { label: '깊음', description: '깊은 주름' },
};

// 탄력 → 한국어 변환
const ELASTICITY_LABELS: Record<string, { label: string; description: string }> = {
  firm: { label: '탄탄', description: '탄력이 좋은 상태' },
  slightly_loose: { label: '약간 처짐', description: '탄력이 약간 떨어짐' },
  loose: { label: '처짐', description: '탄력이 떨어진 상태' },
  very_loose: { label: '많이 처짐', description: '탄력이 많이 떨어진 상태' },
};

// 피부 타입별 테마 색상
const SKIN_TYPE_THEMES: Record<string, { primary: string; bg: string }> = {
  dry: { primary: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  normal: { primary: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  oily: { primary: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  combination: { primary: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  sensitive: { primary: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
};

// 조명 조건 → 한국어 변환
const LIGHTING_LABELS: Record<string, { label: string; icon: string }> = {
  natural: { label: '자연광', icon: '☀️' },
  artificial: { label: '실내 조명', icon: '💡' },
  mixed: { label: '혼합 조명', icon: '🔆' },
};

// 신뢰도 배지 색상
const RELIABILITY_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> =
  {
    high: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: CheckCircle2,
    },
    medium: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: AlertCircle,
    },
    low: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      icon: AlertCircle,
    },
  };

// 피부 타입 한국어 변환
const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  normal: '중성',
  oily: '지성',
  combination: '복합성',
  sensitive: '민감성',
};

/**
 * S-1 피부 분석 근거 리포트 컴포넌트
 */
export default function SkinAnalysisEvidenceReport({
  evidence,
  imageQuality,
  skinType,
  overallScore,
  className,
}: SkinAnalysisEvidenceReportProps) {
  if (!evidence && !imageQuality) {
    return null;
  }

  const theme = SKIN_TYPE_THEMES[skinType] || SKIN_TYPE_THEMES.normal;
  const reliabilityStyle = imageQuality?.analysisReliability
    ? RELIABILITY_STYLES[imageQuality.analysisReliability]
    : RELIABILITY_STYLES.medium;
  const ReliabilityIcon = reliabilityStyle.icon;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="skin-analysis-evidence-report">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4" />
          분석 근거 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 신뢰도 및 종합 점수 */}
        <div className="flex gap-2">
          {imageQuality && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg flex-1',
                reliabilityStyle.bg
              )}
            >
              <ReliabilityIcon className={cn('w-4 h-4', reliabilityStyle.text)} />
              <span className={cn('text-sm font-medium', reliabilityStyle.text)}>
                신뢰도:{' '}
                {imageQuality.analysisReliability === 'high'
                  ? '높음'
                  : imageQuality.analysisReliability === 'medium'
                    ? '중간'
                    : '낮음'}
              </span>
            </div>
          )}
          {overallScore && (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', theme.bg)}>
              <Sparkles className={cn('w-4 h-4', theme.primary)} />
              <span className={cn('text-sm font-medium', theme.primary)}>
                종합 점수: {overallScore}점
              </span>
            </div>
          )}
        </div>

        {/* 핵심 판정 근거 - T존/U존 */}
        {evidence && (
          <div className={cn('p-4 rounded-xl border', theme.bg)}>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-white dark:bg-gray-800'
                )}
              >
                <Droplet className={cn('w-5 h-5', theme.primary)} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-2">유수분 밸런스 분석</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">T존 유분: </span>
                    <strong>{TZONE_LABELS[evidence.tZoneOiliness]?.label}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">U존 수분: </span>
                    <strong>{UZONE_LABELS[evidence.uZoneHydration]?.label}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 세부 분석 항목 */}
        {evidence && (
          <div className="grid grid-cols-2 gap-3">
            {/* 모공 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <CircleDot className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">모공</span>
              </div>
              <p className="text-sm font-semibold">{PORE_LABELS[evidence.poreVisibility]?.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PORE_LABELS[evidence.poreVisibility]?.description}
              </p>
            </div>

            {/* 피부결 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium">피부결</span>
              </div>
              <p className="text-sm font-semibold">{TEXTURE_LABELS[evidence.skinTexture]?.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {TEXTURE_LABELS[evidence.skinTexture]?.description}
              </p>
            </div>

            {/* 홍조 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-medium">홍조/발적</span>
              </div>
              <p className="text-sm font-semibold">
                {REDNESS_LABELS[evidence.rednessLevel]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {REDNESS_LABELS[evidence.rednessLevel]?.description}
              </p>
            </div>

            {/* 색소침착 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">색소침착</span>
              </div>
              <p className="text-sm font-semibold">
                {PIGMENT_LABELS[evidence.pigmentationPattern]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PIGMENT_LABELS[evidence.pigmentationPattern]?.description}
              </p>
            </div>

            {/* 주름 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium">주름</span>
              </div>
              <p className="text-sm font-semibold">
                {WRINKLE_LABELS[evidence.wrinkleDepth]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {WRINKLE_LABELS[evidence.wrinkleDepth]?.description}
              </p>
            </div>

            {/* 탄력 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-medium">탄력</span>
              </div>
              <p className="text-sm font-semibold">
                {ELASTICITY_LABELS[evidence.elasticityObservation]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ELASTICITY_LABELS[evidence.elasticityObservation]?.description}
              </p>
            </div>
          </div>
        )}

        {/* 이미지 품질 정보 */}
        {imageQuality && (
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              분석 조건
            </h4>
            <div className="flex flex-wrap gap-2">
              {/* 조명 */}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                {LIGHTING_LABELS[imageQuality.lightingCondition]?.icon}
                {LIGHTING_LABELS[imageQuality.lightingCondition]?.label}
              </span>
              {/* 메이크업 */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                  !imageQuality.makeupDetected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                )}
              >
                {imageQuality.makeupDetected ? '메이크업 감지됨' : '노메이크업'}
              </span>
            </div>
          </div>
        )}

        {/* 분석 결론 */}
        {evidence && (
          <div className={cn('p-3 rounded-xl text-sm', theme.bg)}>
            <p className="text-center">
              T존 유분이 <strong>{TZONE_LABELS[evidence.tZoneOiliness]?.label}</strong>, U존 수분이{' '}
              <strong>{UZONE_LABELS[evidence.uZoneHydration]?.label}</strong> 상태로 확인되어{' '}
              <span className={cn('font-bold', theme.primary)}>
                {SKIN_TYPE_LABELS[skinType] || skinType}
              </span>{' '}
              피부로 판정되었습니다.
              {overallScore && <> (종합 점수: {overallScore}점)</>}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
