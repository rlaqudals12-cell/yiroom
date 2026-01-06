'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Eye, Droplet, Sparkles, Sun, Camera, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// 분석 근거 타입
export interface AnalysisEvidence {
  veinColor: 'blue' | 'purple' | 'green' | 'olive' | 'mixed' | 'unknown';
  veinScore: number; // 0-100 쿨톤 확률
  skinUndertone: 'yellow' | 'pink' | 'olive' | 'neutral';
  skinHairContrast: 'low' | 'medium' | 'high' | 'very_high';
  eyeColor: 'light_brown' | 'brown' | 'dark_brown' | 'black';
  lipNaturalColor: 'coral' | 'pink' | 'neutral';
}

// 이미지 품질 타입
export interface ImageQuality {
  lightingCondition: 'natural' | 'artificial' | 'mixed';
  makeupDetected: boolean;
  wristImageProvided: boolean;
  analysisReliability: 'high' | 'medium' | 'low';
}

interface AnalysisEvidenceReportProps {
  evidence: AnalysisEvidence | null;
  imageQuality: ImageQuality | null;
  seasonType: string;
  tone: 'warm' | 'cool';
  className?: string;
}

// 혈관 색상 → 한국어 변환
const VEIN_COLOR_LABELS: Record<string, { label: string; tone: string }> = {
  blue: { label: '파란색', tone: '쿨톤' },
  purple: { label: '보라색', tone: '쿨톤' },
  green: { label: '녹색', tone: '웜톤' },
  olive: { label: '올리브색', tone: '웜톤' },
  mixed: { label: '혼합', tone: '중립' },
  unknown: { label: '확인 어려움', tone: '-' },
};

// 피부 언더톤 → 한국어 변환
const UNDERTONE_LABELS: Record<string, { label: string; description: string }> = {
  yellow: { label: '노란 기', description: '황색 색소가 많은 피부' },
  pink: { label: '핑크 기', description: '붉은 기가 돋보이는 피부' },
  olive: { label: '올리브', description: '녹색 기가 섞인 피부' },
  neutral: { label: '중립', description: '균형 잡힌 색조' },
};

// 피부-머리 대비 → 한국어 변환
const CONTRAST_LABELS: Record<string, { label: string; description: string }> = {
  low: { label: '낮음', description: '부드러운 인상 (여름 쿨톤 특징)' },
  medium: { label: '중간', description: '자연스러운 대비' },
  high: { label: '높음', description: '또렷한 인상' },
  very_high: { label: '매우 높음', description: '강렬한 대비 (겨울 쿨톤 특징)' },
};

// 눈동자 색 → 한국어 변환
const EYE_COLOR_LABELS: Record<string, string> = {
  light_brown: '밝은 갈색',
  brown: '갈색',
  dark_brown: '진한 갈색',
  black: '검정색',
};

// 입술 색 → 한국어 변환
const LIP_COLOR_LABELS: Record<string, { label: string; tone: string }> = {
  coral: { label: '코랄', tone: '웜톤 경향' },
  pink: { label: '핑크', tone: '쿨톤 경향' },
  neutral: { label: '중립', tone: '양쪽 모두 가능' },
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

/**
 * PC-1 분석 근거 리포트 컴포넌트
 * - 손목 혈관 분석 결과
 * - 피부-머리 대비
 * - 피부 언더톤
 * - 이미지 품질 평가
 */
export default function AnalysisEvidenceReport({
  evidence,
  imageQuality,
  seasonType,
  tone,
  className,
}: AnalysisEvidenceReportProps) {
  // 데이터가 없으면 렌더링하지 않음
  if (!evidence && !imageQuality) {
    return null;
  }

  const isCool = tone === 'cool';
  const reliabilityStyle = imageQuality?.analysisReliability
    ? RELIABILITY_STYLES[imageQuality.analysisReliability]
    : RELIABILITY_STYLES.medium;
  const ReliabilityIcon = reliabilityStyle.icon;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="analysis-evidence-report">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4" />
          분석 근거 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 신뢰도 배지 */}
        {imageQuality && (
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', reliabilityStyle.bg)}>
            <ReliabilityIcon className={cn('w-4 h-4', reliabilityStyle.text)} />
            <span className={cn('text-sm font-medium', reliabilityStyle.text)}>
              분석 신뢰도:{' '}
              {imageQuality.analysisReliability === 'high'
                ? '높음'
                : imageQuality.analysisReliability === 'medium'
                  ? '중간'
                  : '낮음'}
            </span>
          </div>
        )}

        {/* 핵심 판정 근거 - 손목 혈관 */}
        {evidence && evidence.veinColor !== 'unknown' && (
          <div
            className={cn(
              'p-4 rounded-xl border-2',
              isCool
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isCool ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'
                )}
              >
                <Droplet className={cn('w-5 h-5', isCool ? 'text-blue-600' : 'text-orange-600')} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">
                  손목 혈관 분석
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (핵심 판정 기준)
                  </span>
                </h4>
                <p className="text-sm">
                  혈관 색상: <strong>{VEIN_COLOR_LABELS[evidence.veinColor]?.label}</strong>
                  {' → '}
                  <span className={cn('font-bold', isCool ? 'text-blue-600' : 'text-orange-600')}>
                    {VEIN_COLOR_LABELS[evidence.veinColor]?.tone}
                  </span>
                </p>
                {evidence.veinScore > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>웜톤</span>
                      <span>쿨톤</span>
                    </div>
                    <div className="h-2 bg-gradient-to-r from-orange-300 to-blue-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/20"
                        style={{ marginLeft: `${evidence.veinScore}%`, width: '2px' }}
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                      쿨톤 확률: {evidence.veinScore}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 세부 분석 항목 */}
        {evidence && (
          <div className="grid grid-cols-2 gap-3">
            {/* 피부 언더톤 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-medium">피부 언더톤</span>
              </div>
              <p className="text-sm font-semibold">
                {UNDERTONE_LABELS[evidence.skinUndertone]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {UNDERTONE_LABELS[evidence.skinUndertone]?.description}
              </p>
            </div>

            {/* 피부-머리 대비 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium">피부-머리 대비</span>
              </div>
              <p className="text-sm font-semibold">
                {CONTRAST_LABELS[evidence.skinHairContrast]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {CONTRAST_LABELS[evidence.skinHairContrast]?.description}
              </p>
            </div>

            {/* 눈동자 색 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium">눈동자 색</span>
              </div>
              <p className="text-sm font-semibold">{EYE_COLOR_LABELS[evidence.eyeColor]}</p>
            </div>

            {/* 입술 색 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium">입술 자연색</span>
              </div>
              <p className="text-sm font-semibold">
                {LIP_COLOR_LABELS[evidence.lipNaturalColor]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {LIP_COLOR_LABELS[evidence.lipNaturalColor]?.tone}
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
              {/* 손목 이미지 */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                  imageQuality.wristImageProvided
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-muted'
                )}
              >
                {imageQuality.wristImageProvided ? '✓ 손목 이미지 분석' : '손목 이미지 없음'}
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
        <div
          className={cn(
            'p-3 rounded-xl text-sm',
            isCool ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-orange-50 dark:bg-orange-950/30'
          )}
        >
          <p className="text-center">
            {evidence?.veinColor && evidence.veinColor !== 'unknown' ? (
              <>
                손목 혈관이 <strong>{VEIN_COLOR_LABELS[evidence.veinColor]?.label}</strong>으로
                확인되어{' '}
                <span className={cn('font-bold', isCool ? 'text-blue-600' : 'text-orange-600')}>
                  {tone === 'cool' ? '쿨톤' : '웜톤'}
                </span>
                으로 판정되었습니다.
                {evidence.skinHairContrast && (
                  <>
                    {' '}
                    피부-머리 대비가{' '}
                    <strong>{CONTRAST_LABELS[evidence.skinHairContrast]?.label}</strong>으로{' '}
                    <span className="font-semibold">
                      {seasonType === 'summer'
                        ? '여름'
                        : seasonType === 'winter'
                          ? '겨울'
                          : seasonType === 'spring'
                            ? '봄'
                            : '가을'}
                    </span>{' '}
                    타입으로 분류되었습니다.
                  </>
                )}
              </>
            ) : (
              <>
                피부 톤과 색소 분석을 통해{' '}
                <span className={cn('font-bold', isCool ? 'text-blue-600' : 'text-orange-600')}>
                  {tone === 'cool' ? '쿨톤' : '웜톤'}
                </span>
                으로 판정되었습니다.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
