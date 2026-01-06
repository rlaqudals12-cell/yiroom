'use client';

import { Info, Eye, Droplet, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// 퍼스널 컬러 분석 근거 요약
export interface PersonalColorEvidenceSummaryProps {
  veinColor?: 'blue' | 'purple' | 'green' | 'olive' | 'mixed' | 'unknown';
  skinUndertone?: 'yellow' | 'pink' | 'olive' | 'neutral';
  tone: 'warm' | 'cool';
  className?: string;
}

// 혈관 색상 라벨
const VEIN_LABELS: Record<string, { label: string; isCool: boolean }> = {
  blue: { label: '파란색', isCool: true },
  purple: { label: '보라색', isCool: true },
  green: { label: '녹색', isCool: false },
  olive: { label: '올리브색', isCool: false },
  mixed: { label: '혼합', isCool: false },
  unknown: { label: '확인 어려움', isCool: false },
};

// 언더톤 라벨
const UNDERTONE_LABELS: Record<string, { label: string; isCool: boolean }> = {
  pink: { label: '핑크빛', isCool: true },
  yellow: { label: '노란빛', isCool: false },
  olive: { label: '올리브', isCool: false },
  neutral: { label: '중립', isCool: false },
};

export function PersonalColorEvidenceSummary({
  veinColor,
  skinUndertone,
  tone,
  className,
}: PersonalColorEvidenceSummaryProps) {
  const isCool = tone === 'cool';

  // 표시할 근거가 없으면 기본 톤 정보만 표시
  const showVein = veinColor && veinColor !== 'mixed' && veinColor !== 'unknown';
  const showUndertone = skinUndertone && skinUndertone !== 'neutral';

  if (!showVein && !showUndertone) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm',
          className
        )}
      >
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {isCool ? '쿨톤' : '웜톤'} 특성이 분석되었습니다
        </span>
      </div>
    );
  }

  const veinInfo = veinColor ? VEIN_LABELS[veinColor] : null;
  const undertoneInfo = skinUndertone ? UNDERTONE_LABELS[skinUndertone] : null;

  return (
    <div className={cn('p-3 rounded-lg bg-muted/50 border border-border/50', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">판정 근거</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {showVein && veinInfo && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              veinInfo.isCool
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            )}
          >
            <Droplet className="w-3 h-3" />
            손목 혈관: {veinInfo.label} → {veinInfo.isCool ? '쿨톤' : '웜톤'}
          </div>
        )}
        {showUndertone && undertoneInfo && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              undertoneInfo.isCool
                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            )}
          >
            <Eye className="w-3 h-3" />
            피부 언더톤: {undertoneInfo.label}
          </div>
        )}
      </div>
    </div>
  );
}

// 피부 분석 근거 요약
export interface SkinEvidenceSummaryProps {
  tZoneOiliness?: 'dry' | 'normal' | 'oily' | 'very_oily';
  poreVisibility?: 'minimal' | 'visible' | 'enlarged' | 'very_enlarged';
  skinType: string;
  className?: string;
}

const T_ZONE_LABELS: Record<string, string> = {
  dry: '건조',
  normal: '보통',
  oily: '유분기',
  very_oily: '많은 유분기',
};

const PORE_LABELS: Record<string, string> = {
  minimal: '거의 안 보임',
  visible: '살짝 보임',
  enlarged: '확대됨',
  very_enlarged: '매우 확대됨',
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  oily: '지성',
  dry: '건성',
  combination: '복합성',
  sensitive: '민감성',
  normal: '중성',
};

export function SkinEvidenceSummary({
  tZoneOiliness,
  poreVisibility,
  skinType,
  className,
}: SkinEvidenceSummaryProps) {
  const skinTypeLabel = SKIN_TYPE_LABELS[skinType] || skinType;

  if (!tZoneOiliness && !poreVisibility) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm',
          className
        )}
      >
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{skinTypeLabel} 피부로 분석되었습니다</span>
      </div>
    );
  }

  return (
    <div className={cn('p-3 rounded-lg bg-muted/50 border border-border/50', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">판정 근거</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tZoneOiliness && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              tZoneOiliness === 'oily' || tZoneOiliness === 'very_oily'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : tZoneOiliness === 'dry'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            )}
          >
            <Droplet className="w-3 h-3" />
            T존 유분: {T_ZONE_LABELS[tZoneOiliness]}
          </div>
        )}
        {poreVisibility && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              poreVisibility === 'enlarged' || poreVisibility === 'very_enlarged'
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            )}
          >
            <Eye className="w-3 h-3" />
            모공: {PORE_LABELS[poreVisibility]}
          </div>
        )}
      </div>
    </div>
  );
}

// 체형 분석 근거 요약
export interface BodyEvidenceSummaryProps {
  silhouette?: 'I' | 'S' | 'X' | 'H' | 'Y';
  upperLowerBalance?: 'upper_dominant' | 'balanced' | 'lower_dominant';
  bodyType: string;
  className?: string;
}

const SILHOUETTE_LABELS: Record<string, string> = {
  I: 'I자형 (직선)',
  S: 'S자형 (곡선)',
  X: 'X자형 (모래시계)',
  H: 'H자형 (균형)',
  Y: 'Y자형 (상체 강조)',
};

const BALANCE_LABELS: Record<string, string> = {
  upper_dominant: '상체 우세',
  balanced: '균형',
  lower_dominant: '하체 우세',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

export function BodyEvidenceSummary({
  silhouette,
  upperLowerBalance,
  bodyType,
  className,
}: BodyEvidenceSummaryProps) {
  const bodyTypeLabel = BODY_TYPE_LABELS[bodyType] || bodyType;

  if (!silhouette && !upperLowerBalance) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm',
          className
        )}
      >
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{bodyTypeLabel} 체형으로 분석되었습니다</span>
      </div>
    );
  }

  // 체형별 테마 색상
  const themeColor =
    bodyType === 'S'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : bodyType === 'W'
        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  return (
    <div className={cn('p-3 rounded-lg bg-muted/50 border border-border/50', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">판정 근거</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {silhouette && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              themeColor
            )}
          >
            <Activity className="w-3 h-3" />
            실루엣: {SILHOUETTE_LABELS[silhouette]}
          </div>
        )}
        {upperLowerBalance && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              themeColor
            )}
          >
            <Activity className="w-3 h-3" />
            밸런스: {BALANCE_LABELS[upperLowerBalance]}
          </div>
        )}
      </div>
    </div>
  );
}
