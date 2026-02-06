'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DetailedZoneId, DetailedZoneStatus } from '@/types/skin-zones';

/**
 * 광원 모드 타입
 * - normal: 일반 조명 (육안 관찰)
 * - uv: UV 조명 (색소침착, 자외선 손상)
 * - polarized: 편광 조명 (피부결, 모공)
 */
type LightMode = 'normal' | 'uv' | 'polarized';

/**
 * 광원 모드별 설명
 */
const LIGHT_MODE_INFO: Record<LightMode, { label: string; description: string }> = {
  normal: {
    label: '일반',
    description: '육안으로 관찰되는 피부 상태예요.',
  },
  uv: {
    label: 'UV',
    description: '자외선 조명으로 색소침착과 자외선 손상을 시뮬레이션해요.',
  },
  polarized: {
    label: '편광',
    description: '편광 조명으로 피부결과 모공 상태를 강조해요.',
  },
};

/**
 * 점수에 따른 히트맵 색상 반환
 */
function getHeatmapColor(score: number, lightMode: LightMode): string {
  // UV 모드: 보라색 계열
  if (lightMode === 'uv') {
    if (score >= 71) return 'fill-violet-200 dark:fill-violet-800/40';
    if (score >= 41) return 'fill-violet-400 dark:fill-violet-600/60';
    return 'fill-violet-600 dark:fill-violet-400/80';
  }

  // 편광 모드: 청색 계열
  if (lightMode === 'polarized') {
    if (score >= 71) return 'fill-cyan-200 dark:fill-cyan-800/40';
    if (score >= 41) return 'fill-cyan-400 dark:fill-cyan-600/60';
    return 'fill-cyan-600 dark:fill-cyan-400/80';
  }

  // 일반 모드: 빨강-노랑-초록 히트맵
  if (score >= 71) return 'fill-green-300 dark:fill-green-700/50';
  if (score >= 41) return 'fill-yellow-300 dark:fill-yellow-600/50';
  return 'fill-red-400 dark:fill-red-500/60';
}

/**
 * 존별 SVG 경로 및 위치 정의
 * 해부학적 얼굴 선화 기반 - 12존 시스템 (skin-zones.ts와 일치)
 */
const ZONE_PATHS: Record<DetailedZoneId, { path: string; cx: number; cy: number; label: string }> =
  {
    // 이마 영역 (3)
    forehead_left: {
      path: 'M 45 35 Q 50 25 70 25 Q 75 35 75 50 Q 60 55 45 50 Z',
      cx: 60,
      cy: 40,
      label: '왼쪽 이마',
    },
    forehead_center: {
      path: 'M 75 25 Q 100 20 125 25 Q 125 50 100 55 Q 75 50 75 25 Z',
      cx: 100,
      cy: 38,
      label: '이마 중앙',
    },
    forehead_right: {
      path: 'M 125 25 Q 150 25 155 35 Q 155 50 140 55 Q 125 50 125 25 Z',
      cx: 140,
      cy: 40,
      label: '오른쪽 이마',
    },
    // 눈가 영역 (2)
    eye_left: {
      path: 'M 50 60 Q 70 55 85 60 Q 85 75 70 80 Q 50 75 50 60 Z',
      cx: 68,
      cy: 68,
      label: '왼쪽 눈가',
    },
    eye_right: {
      path: 'M 115 60 Q 130 55 150 60 Q 150 75 130 80 Q 115 75 115 60 Z',
      cx: 132,
      cy: 68,
      label: '오른쪽 눈가',
    },
    // 볼 영역 (2)
    cheek_left: {
      path: 'M 35 80 Q 55 75 75 85 Q 70 120 50 130 Q 30 115 35 80 Z',
      cx: 52,
      cy: 100,
      label: '왼쪽 볼',
    },
    cheek_right: {
      path: 'M 125 85 Q 145 75 165 80 Q 170 115 150 130 Q 130 120 125 85 Z',
      cx: 148,
      cy: 100,
      label: '오른쪽 볼',
    },
    // 코 영역 (2)
    nose_bridge: {
      path: 'M 88 60 Q 100 55 112 60 Q 112 95 100 100 Q 88 95 88 60 Z',
      cx: 100,
      cy: 78,
      label: '콧등',
    },
    nose_tip: {
      path: 'M 85 100 Q 100 95 115 100 Q 118 120 100 130 Q 82 120 85 100 Z',
      cx: 100,
      cy: 115,
      label: '코끝',
    },
    // 턱 영역 (3)
    chin_left: {
      path: 'M 50 130 Q 70 125 85 135 Q 80 160 60 165 Q 40 155 50 130 Z',
      cx: 65,
      cy: 145,
      label: '왼쪽 턱선',
    },
    chin_center: {
      path: 'M 75 160 Q 100 155 125 160 Q 130 185 100 195 Q 70 185 75 160 Z',
      cx: 100,
      cy: 175,
      label: '턱 중앙',
    },
    chin_right: {
      path: 'M 115 135 Q 130 125 150 130 Q 160 155 140 165 Q 120 160 115 135 Z',
      cx: 135,
      cy: 145,
      label: '오른쪽 턱선',
    },
  };

export interface ProfessionalSkinMapProps {
  /** 12존별 상태 데이터 */
  zoneData: Partial<Record<DetailedZoneId, DetailedZoneStatus>>;
  /** 존 클릭 콜백 */
  onZoneClick?: (zoneId: DetailedZoneId) => void;
  /** 현재 선택된 존 */
  selectedZone?: DetailedZoneId | null;
  /** 추가 className */
  className?: string;
}

/**
 * 전문가급 피부 분석 맵
 * - 해부학적 얼굴 선화 SVG
 * - 광원 모드 탭 (일반/UV/편광)
 * - 히트맵 오버레이
 * - 존 클릭 시 상세 정보
 */
export function ProfessionalSkinMap({
  zoneData,
  onZoneClick,
  selectedZone,
  className,
}: ProfessionalSkinMapProps) {
  const [lightMode, setLightMode] = useState<LightMode>('normal');
  const [hoveredZone, setHoveredZone] = useState<DetailedZoneId | null>(null);

  // 전체 평균 점수 계산
  const averageScore = useMemo(() => {
    const scores = Object.values(zoneData).map((z) => z?.score || 50);
    if (scores.length === 0) return 50;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [zoneData]);

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="professional-skin-map">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            부위별 피부 상태
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    피부과 측정 장비 방식으로 12개 부위를 분석해요. 각 부위를 클릭하면 상세 정보를
                    확인할 수 있어요.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>

          {/* 광원 모드 탭 */}
          <Tabs value={lightMode} onValueChange={(v) => setLightMode(v as LightMode)}>
            <TabsList className="h-8">
              {(Object.keys(LIGHT_MODE_INFO) as LightMode[]).map((mode) => (
                <TooltipProvider key={mode}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value={mode} className="text-xs px-3 h-7">
                        {LIGHT_MODE_INFO[mode].label}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{LIGHT_MODE_INFO[mode].description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 얼굴 맵 SVG */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <svg
                viewBox="0 0 200 210"
                className="w-full max-w-[280px] h-auto"
                style={{ filter: lightMode === 'uv' ? 'hue-rotate(260deg)' : 'none' }}
              >
                {/* 배경 */}
                <defs>
                  <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* 얼굴 윤곽선 (해부학적 선화) */}
                <ellipse
                  cx="100"
                  cy="110"
                  rx="70"
                  ry="90"
                  fill="url(#faceGradient)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-muted-foreground/50"
                />

                {/* 12존 히트맵 영역 */}
                {(
                  Object.entries(ZONE_PATHS) as [
                    DetailedZoneId,
                    (typeof ZONE_PATHS)[DetailedZoneId],
                  ][]
                ).map(([zoneId, zone]) => {
                  const zoneStatus = zoneData[zoneId];
                  const score = zoneStatus?.score || 50;
                  const isSelected = selectedZone === zoneId;
                  const isHovered = hoveredZone === zoneId;

                  return (
                    <g key={zoneId}>
                      {/* 히트맵 영역 */}
                      <path
                        d={zone.path}
                        className={cn(
                          'transition-all duration-200 cursor-pointer',
                          getHeatmapColor(score, lightMode),
                          isSelected && 'stroke-primary stroke-2',
                          isHovered && 'opacity-80'
                        )}
                        onClick={() => onZoneClick?.(zoneId)}
                        onMouseEnter={() => setHoveredZone(zoneId)}
                        onMouseLeave={() => setHoveredZone(null)}
                      />

                      {/* 점수 표시 (호버 시) */}
                      {(isHovered || isSelected) && (
                        <g>
                          <circle
                            cx={zone.cx}
                            cy={zone.cy}
                            r="12"
                            className="fill-background stroke-foreground/20"
                          />
                          <text
                            x={zone.cx}
                            y={zone.cy}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-foreground text-[10px] font-semibold"
                          >
                            {score}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 얼굴 특징선 (눈, 코, 입 라인) */}
                <g
                  className="text-muted-foreground/30"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  fill="none"
                >
                  {/* 눈썹 */}
                  <path d="M 50 55 Q 68 50 85 55" />
                  <path d="M 115 55 Q 132 50 150 55" />
                  {/* 코 중심선 */}
                  <path d="M 100 60 L 100 125" strokeDasharray="2,2" />
                  {/* 입술 라인 */}
                  <path d="M 80 150 Q 100 155 120 150" />
                </g>
              </svg>

              {/* 호버된 존 라벨 */}
              {hoveredZone && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    {ZONE_PATHS[hoveredZone].label}: {zoneData[hoveredZone]?.score || 50}점
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* 범례 및 설명 */}
          <div className="lg:w-48 space-y-3">
            {/* 현재 광원 모드 설명 */}
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs font-medium mb-1">{LIGHT_MODE_INFO[lightMode].label} 모드</p>
              <p className="text-xs text-muted-foreground">
                {LIGHT_MODE_INFO[lightMode].description}
              </p>
            </div>

            {/* 색상 범례 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">상태 범례</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded',
                      lightMode === 'uv'
                        ? 'bg-violet-200'
                        : lightMode === 'polarized'
                          ? 'bg-cyan-200'
                          : 'bg-green-300'
                    )}
                  />
                  <span className="text-xs">좋음 (71-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded',
                      lightMode === 'uv'
                        ? 'bg-violet-400'
                        : lightMode === 'polarized'
                          ? 'bg-cyan-400'
                          : 'bg-yellow-300'
                    )}
                  />
                  <span className="text-xs">보통 (41-70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded',
                      lightMode === 'uv'
                        ? 'bg-violet-600'
                        : lightMode === 'polarized'
                          ? 'bg-cyan-600'
                          : 'bg-red-400'
                    )}
                  />
                  <span className="text-xs">주의 (0-40)</span>
                </div>
              </div>
            </div>

            {/* 평균 점수 */}
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">전체 평균</p>
              <p className="text-2xl font-bold">
                {averageScore}
                <span className="text-sm font-normal text-muted-foreground">점</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfessionalSkinMap;
