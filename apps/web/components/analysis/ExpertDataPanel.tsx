'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatDateTime } from '@/lib/utils/date-format';
import { cn } from '@/lib/utils';
import { FlaskConical, Gauge, Clock, AlertTriangle, ImageIcon, Info } from 'lucide-react';

/** 전문가 패널에 표시할 데이터 */
export interface ExpertPanelData {
  /** 분석 신뢰도 (0-100) */
  confidence?: number | null;
  /** AI Mock/Fallback 사용 여부 */
  usedMock?: boolean;
  /** 분석 일시 (ISO string 또는 Date) */
  analyzedAt?: string | Date | null;
  /** 이미지 품질 평가 */
  imageQuality?: {
    angle?: string;
    lighting?: string;
    facePosition?: string;
    poseNatural?: boolean;
    clothingFit?: string;
    analysisReliability?: string;
  } | null;
  /** 분석 근거 요약 (모듈별 자유 형식) */
  evidenceSummary?: Record<string, string | number | boolean> | null;
  /** 분석 모듈명 */
  moduleName?: string;
}

interface ExpertDataPanelProps {
  data: ExpertPanelData;
  className?: string;
}

// 원시 영문 값 → 한국어 매핑 (필드별) — 여러 분석이 공유하는 패널이라 전 분석에 전파.
// 미지 값은 원문 유지(지어내기 금지). straight/wide 처럼 필드마다 뜻이 달라 필드 키로 구분.
const EXPERT_VALUE_LABELS: Record<string, Record<string, string>> = {
  angle: { front: '정면 촬영', side: '측면 촬영', angled: '비스듬한 각도' },
  lighting: {
    natural: '자연광',
    bright: '밝은 조명',
    dim: '어두운 조명',
    even: '고른 조명',
    uneven: '불균일한 조명',
    warm: '따뜻한 조명',
    cool: '차가운 조명',
    mixed: '혼합 조명',
  },
  facePosition: {
    front: '정면',
    centered: '중앙 정렬',
    tilted: '기울어짐',
    off_center: '중앙에서 벗어남',
  },
  clothingFit: { fitted: '몸에 맞는 옷', loose: '헐렁한 옷', oversized: '오버사이즈' },
  analysisReliability: { high: '높음', medium: '중간', low: '낮음' },
  shoulderLine: {
    angular: '각진 어깨선',
    rounded: '둥근 어깨선',
    wide: '넓은 어깨',
    narrow: '좁은 어깨',
  },
  waistDefinition: { defined: '잘록한 허리', straight: '직선 허리', natural: '자연스러운 허리' },
  hipLine: { curved: '곡선 힙라인', straight: '직선 힙라인', wide: '넓은 골반' },
  boneStructure: { small: '작은 골격', medium: '중간 골격', large: '큰 골격' },
  silhouette: { I: 'I자형', S: 'S자형', X: 'X자형', H: 'H자형', Y: 'Y자형' },
  upperLowerBalance: { upper_dominant: '상체 우세', balanced: '균형', lower_dominant: '하체 우세' },
};

// 값 자체가 필드와 무관하게 일반적인 경우의 폴백
const EXPERT_GENERIC_VALUE_LABELS: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  true: '예',
  false: '아니오',
};

// 근거 요약 키(영문) → 한국어 라벨
const EXPERT_KEY_LABELS: Record<string, string> = {
  shoulderLine: '어깨선',
  waistDefinition: '허리',
  hipLine: '골반',
  boneStructure: '골격',
  silhouette: '실루엣',
  upperLowerBalance: '상하 밸런스',
  muscleAttachment: '근육 부착',
};

/** 원시 값 → 한국어 (필드별 우선, 없으면 일반 폴백, 그래도 없으면 원문 유지) */
function translateExpertValue(fieldKey: string, value: string | number | boolean): string {
  const raw = String(value);
  return EXPERT_VALUE_LABELS[fieldKey]?.[raw] ?? EXPERT_GENERIC_VALUE_LABELS[raw] ?? raw;
}

/** 근거 요약 키 → 한국어 (없으면 원문 유지) */
function translateExpertKey(key: string): string {
  return EXPERT_KEY_LABELS[key] ?? key;
}

// 신뢰도 게이지 색상
function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getConfidenceBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

/** 전문가 모드 데이터 패널 — 분석 결과 페이지에서 토글 시 표시 */
export function ExpertDataPanel({ data, className }: ExpertDataPanelProps) {
  const t = useTranslations('analysis');
  const locale = useLocale();

  const { confidence, usedMock, analyzedAt, imageQuality, evidenceSummary } = data;

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-primary/40 bg-primary/5 dark:bg-primary/10 p-4 space-y-4',
        className
      )}
      role="region"
      aria-label={t('expertPanel')}
      data-testid="expert-data-panel"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <FlaskConical className="w-4 h-4" />
        {t('expertPanel')}
      </div>

      {/* 신뢰도 */}
      {confidence != null && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="w-3.5 h-3.5" />
            {t('confidence')}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getConfidenceBarColor(confidence)
                )}
                style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
              />
            </div>
            <span className={cn('text-sm font-mono font-bold', getConfidenceColor(confidence))}>
              {confidence}%
            </span>
          </div>
        </div>
      )}

      {/* Mock/Fallback 경고 */}
      {usedMock && (
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{t('expertMockWarning')}</span>
        </div>
      )}

      {/* 분석 일시 */}
      {analyzedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {t('expertAnalyzedAt')}{' '}
            {formatDateTime(analyzedAt, locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* 이미지 품질 */}
      {imageQuality && Object.keys(imageQuality).length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="w-3.5 h-3.5" />
            {t('expertImageQuality')}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {imageQuality.angle && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertAngle')}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue('angle', imageQuality.angle)}
                </span>
              </div>
            )}
            {imageQuality.lighting && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertLighting')}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue('lighting', imageQuality.lighting)}
                </span>
              </div>
            )}
            {imageQuality.analysisReliability && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertReliability')}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue('analysisReliability', imageQuality.analysisReliability)}
                </span>
              </div>
            )}
            {imageQuality.facePosition && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertFacePosition')}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue('facePosition', imageQuality.facePosition)}
                </span>
              </div>
            )}
            {imageQuality.clothingFit && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertClothingFit')}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue('clothingFit', imageQuality.clothingFit)}
                </span>
              </div>
            )}
            {imageQuality.poseNatural != null && (
              <div className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{t('expertPose')}: </span>
                <span className="text-foreground font-medium">
                  {imageQuality.poseNatural ? t('expertPoseNatural') : t('expertPoseUnnatural')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 분석 근거 요약 */}
      {evidenceSummary && Object.keys(evidenceSummary).length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            {t('expertEvidence')}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {Object.entries(evidenceSummary).map(([key, value]) => (
              <div key={key} className="bg-card rounded px-2 py-1">
                <span className="text-muted-foreground">{translateExpertKey(key)}: </span>
                <span className="text-foreground font-medium">
                  {translateExpertValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
