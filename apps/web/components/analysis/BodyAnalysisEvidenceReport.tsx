'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Ruler, Activity, Camera, CheckCircle2, AlertCircle, Info, User } from 'lucide-react';

// 분석 근거 타입
export interface BodyAnalysisEvidence {
  shoulderLine: 'angular' | 'rounded' | 'wide' | 'narrow';
  waistDefinition: 'defined' | 'straight' | 'natural';
  hipLine: 'curved' | 'straight' | 'wide';
  boneStructure: 'small' | 'medium' | 'large';
  muscleAttachment: 'easy' | 'moderate' | 'difficult';
  upperLowerBalance: 'upper_dominant' | 'balanced' | 'lower_dominant';
  silhouette: 'I' | 'S' | 'X' | 'H' | 'Y';
}

// 이미지 품질 타입
export interface BodyImageQuality {
  angle: 'front' | 'side' | 'angled';
  poseNatural: boolean;
  clothingFit: 'fitted' | 'loose' | 'oversized';
  analysisReliability: 'high' | 'medium' | 'low';
}

interface BodyAnalysisEvidenceReportProps {
  evidence: BodyAnalysisEvidence | null;
  imageQuality: BodyImageQuality | null;
  bodyType: string;
  confidence?: number | null;
  matchedFeatures?: number | null;
  className?: string;
}

// 어깨 라인 → 한국어 변환
const SHOULDER_LABELS: Record<string, { label: string; description: string }> = {
  angular: { label: '각진', description: '직선적이고 각진 어깨 라인' },
  rounded: { label: '둥근', description: '부드럽고 곡선적인 어깨' },
  wide: { label: '넓은', description: '프레임이 넓은 어깨' },
  narrow: { label: '좁은', description: '프레임이 작은 어깨' },
};

// 허리 정의 → 한국어 변환
const WAIST_LABELS: Record<string, { label: string; description: string }> = {
  defined: { label: '잘록한', description: '허리 라인이 잘록하게 들어감' },
  straight: { label: '직선적', description: '허리 라인이 곧게 떨어짐' },
  natural: { label: '자연스러운', description: '부드럽게 이어지는 허리' },
};

// 골반 라인 → 한국어 변환
const HIP_LABELS: Record<string, { label: string; description: string }> = {
  curved: { label: '곡선적', description: '볼륨감 있는 힙 라인' },
  straight: { label: '직선적', description: '일자로 떨어지는 힙 라인' },
  wide: { label: '넓은', description: '넓은 골반 프레임' },
};

// 뼈대 구조 → 한국어 변환
const BONE_LABELS: Record<string, { label: string; description: string }> = {
  small: { label: '작음', description: '가느다란 뼈대' },
  medium: { label: '중간', description: '균형 잡힌 뼈대' },
  large: { label: '큼', description: '굵고 튼튼한 뼈대' },
};

// 근육 부착 → 한국어 변환 (향후 확장용)
const _MUSCLE_LABELS: Record<string, { label: string; description: string }> = {
  easy: { label: '잘 붙는', description: '근육이 쉽게 붙는 체질' },
  moderate: { label: '보통', description: '평균적인 근육 발달' },
  difficult: { label: '어려움', description: '근육이 잘 안 붙는 체질' },
};

// 상하체 밸런스 → 한국어 변환
const BALANCE_LABELS: Record<string, { label: string; description: string }> = {
  upper_dominant: { label: '상체 우세', description: '상체가 하체보다 발달' },
  balanced: { label: '균형', description: '상하체 균형 잡힘' },
  lower_dominant: { label: '하체 우세', description: '하체가 상체보다 발달' },
};

// 실루엣 → 한국어 변환
const SILHOUETTE_LABELS: Record<string, { label: string; description: string }> = {
  I: { label: 'I자형', description: '직선적이고 일자인 실루엣' },
  S: { label: 'S자형', description: '곡선미가 강조된 실루엣' },
  X: { label: 'X자형', description: '허리가 잘록한 모래시계 실루엣' },
  H: { label: 'H자형', description: '어깨-허리-골반이 일직선인 실루엣' },
  Y: { label: 'Y자형', description: '어깨가 넓고 아래로 좁아지는 실루엣' },
};

// 체형별 테마 색상
const BODY_TYPE_THEMES: Record<string, { primary: string; bg: string }> = {
  S: { primary: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  W: { primary: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  N: { primary: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
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
 * C-1 체형 분석 근거 리포트 컴포넌트
 */
export default function BodyAnalysisEvidenceReport({
  evidence,
  imageQuality,
  bodyType,
  confidence,
  matchedFeatures,
  className,
}: BodyAnalysisEvidenceReportProps) {
  if (!evidence && !imageQuality) {
    return null;
  }

  const theme = BODY_TYPE_THEMES[bodyType] || BODY_TYPE_THEMES.S;
  const reliabilityStyle = imageQuality?.analysisReliability
    ? RELIABILITY_STYLES[imageQuality.analysisReliability]
    : RELIABILITY_STYLES.medium;
  const ReliabilityIcon = reliabilityStyle.icon;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="body-analysis-evidence-report">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4" />
          분석 근거 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 신뢰도 및 특징 일치도 */}
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
          {matchedFeatures && (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', theme.bg)}>
              <CheckCircle2 className={cn('w-4 h-4', theme.primary)} />
              <span className={cn('text-sm font-medium', theme.primary)}>
                특징 일치: {matchedFeatures}/5
              </span>
            </div>
          )}
        </div>

        {/* 핵심 판정 근거 */}
        {evidence && (
          <div className={cn('p-4 rounded-xl border', theme.bg)}>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-white dark:bg-gray-800'
                )}
              >
                <User className={cn('w-5 h-5', theme.primary)} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-2">체형 구조 분석</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">실루엣: </span>
                    <strong>{SILHOUETTE_LABELS[evidence.silhouette]?.label}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">밸런스: </span>
                    <strong>{BALANCE_LABELS[evidence.upperLowerBalance]?.label}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 세부 분석 항목 */}
        {evidence && (
          <div className="grid grid-cols-2 gap-3">
            {/* 어깨 라인 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">어깨 라인</span>
              </div>
              <p className="text-sm font-semibold">
                {SHOULDER_LABELS[evidence.shoulderLine]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {SHOULDER_LABELS[evidence.shoulderLine]?.description}
              </p>
            </div>

            {/* 허리 정의 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-medium">허리 라인</span>
              </div>
              <p className="text-sm font-semibold">
                {WAIST_LABELS[evidence.waistDefinition]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {WAIST_LABELS[evidence.waistDefinition]?.description}
              </p>
            </div>

            {/* 골반 라인 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium">골반 라인</span>
              </div>
              <p className="text-sm font-semibold">{HIP_LABELS[evidence.hipLine]?.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {HIP_LABELS[evidence.hipLine]?.description}
              </p>
            </div>

            {/* 뼈대 구조 */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">뼈대 구조</span>
              </div>
              <p className="text-sm font-semibold">{BONE_LABELS[evidence.boneStructure]?.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {BONE_LABELS[evidence.boneStructure]?.description}
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
              {/* 촬영 각도 */}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                {imageQuality.angle === 'front'
                  ? '정면'
                  : imageQuality.angle === 'side'
                    ? '측면'
                    : '비스듬'}
              </span>
              {/* 자세 */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                  imageQuality.poseNatural
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                )}
              >
                {imageQuality.poseNatural ? '자연스러운 포즈' : '비자연스러운 포즈'}
              </span>
              {/* 의류 핏 */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                  imageQuality.clothingFit === 'fitted'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-muted'
                )}
              >
                {imageQuality.clothingFit === 'fitted'
                  ? '핏한 의류'
                  : imageQuality.clothingFit === 'loose'
                    ? '루즈핏'
                    : '오버사이즈'}
              </span>
            </div>
          </div>
        )}

        {/* 분석 결론 */}
        {confidence && (
          <div className={cn('p-3 rounded-xl text-sm', theme.bg)}>
            <p className="text-center">
              {matchedFeatures ? (
                <>
                  5개 핵심 특징 중 <strong>{matchedFeatures}개</strong>가 일치하여{' '}
                  <span className={cn('font-bold', theme.primary)}>
                    {bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'}
                  </span>{' '}
                  체형으로 판정되었습니다. (신뢰도: {confidence}%)
                </>
              ) : (
                <>
                  체형 분석 결과{' '}
                  <span className={cn('font-bold', theme.primary)}>
                    {bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'}
                  </span>{' '}
                  타입으로 판정되었습니다.
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
