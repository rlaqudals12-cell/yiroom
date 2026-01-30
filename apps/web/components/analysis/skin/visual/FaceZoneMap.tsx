/**
 * FaceZoneMap 컴포넌트
 * 6존 얼굴 일러스트 - 인터랙티브 호버/클릭
 *
 * @description Visual Report P1 (VR-1)
 * @see SDD-VISUAL-SKIN-REPORT.md
 */
'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/** 피부 존 타입 */
export type SkinZone =
  | 'forehead'
  | 'nose'
  | 't-zone'
  | 'left-cheek'
  | 'right-cheek'
  | 'chin'
  | 'eye-area'
  | 'lip-area';

/** 존 정보 */
export interface ZoneInfo {
  id: SkinZone;
  label: string;
  description: string;
}

/** 존 점수 */
export interface ZoneScore {
  zone: SkinZone;
  score: number;
  concerns: string[];
}

/** Props 타입 */
export interface FaceZoneMapProps {
  /** 존별 점수 데이터 */
  zoneScores: ZoneScore[];
  /** 선택된 존 */
  selectedZone?: SkinZone | null;
  /** 존 선택 핸들러 */
  onZoneSelect?: (zone: SkinZone) => void;
  /** 추가 클래스 */
  className?: string;
}

/** 존 메타데이터 */
const ZONE_META: Record<SkinZone, ZoneInfo> = {
  forehead: { id: 'forehead', label: '이마', description: 'T존 상단, 피지 분비 활발' },
  nose: { id: 'nose', label: '코', description: 'T존 중심, 블랙헤드 발생 잦음' },
  't-zone': { id: 't-zone', label: 'T존', description: '이마-코-턱 라인' },
  'left-cheek': { id: 'left-cheek', label: '왼쪽 볼', description: 'U존, 건조해지기 쉬움' },
  'right-cheek': { id: 'right-cheek', label: '오른쪽 볼', description: 'U존, 건조해지기 쉬움' },
  chin: { id: 'chin', label: '턱', description: '호르몬 영향 받기 쉬움' },
  'eye-area': { id: 'eye-area', label: '눈가', description: '피부가 얇고 민감' },
  'lip-area': { id: 'lip-area', label: '입술 주변', description: '건조, 잔주름 발생' },
};

/** 점수에 따른 색상 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'fill-emerald-500';
  if (score >= 60) return 'fill-yellow-500';
  if (score >= 40) return 'fill-orange-500';
  return 'fill-red-500';
}

/** 점수에 따른 호버 색상 */
function getHoverColor(score: number): string {
  if (score >= 80) return 'hover:fill-emerald-400';
  if (score >= 60) return 'hover:fill-yellow-400';
  if (score >= 40) return 'hover:fill-orange-400';
  return 'hover:fill-red-400';
}

export function FaceZoneMap({
  zoneScores,
  selectedZone,
  onZoneSelect,
  className,
}: FaceZoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<SkinZone | null>(null);

  // 존 점수 찾기
  const getZoneScore = useCallback(
    (zone: SkinZone): number => {
      const found = zoneScores.find((z) => z.zone === zone);
      return found?.score ?? 50;
    },
    [zoneScores]
  );

  // 존 클릭 핸들러
  const handleZoneClick = useCallback(
    (zone: SkinZone) => {
      onZoneSelect?.(zone);
    },
    [onZoneSelect]
  );

  // 활성 존 (호버 또는 선택)
  const activeZone = hoveredZone || selectedZone;
  const activeZoneMeta = activeZone ? ZONE_META[activeZone] : null;
  const activeZoneScore = activeZone ? getZoneScore(activeZone) : null;

  return (
    <div className={cn('relative', className)} data-testid="face-zone-map">
      {/* SVG 얼굴 일러스트 */}
      <svg
        viewBox="0 0 200 280"
        className="w-full max-w-[280px] mx-auto"
        aria-label="피부 존 지도"
      >
        {/* 얼굴 윤곽 */}
        <ellipse
          cx="100"
          cy="140"
          rx="75"
          ry="95"
          className="fill-gray-100 stroke-gray-300"
          strokeWidth="2"
        />

        {/* 이마 */}
        <path
          d="M 40 80 Q 100 30 160 80 L 160 110 Q 100 100 40 110 Z"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('forehead')),
            getHoverColor(getZoneScore('forehead')),
            selectedZone === 'forehead' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('forehead')}
          onMouseEnter={() => setHoveredZone('forehead')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="이마 영역"
        />

        {/* 코 */}
        <path
          d="M 90 115 L 90 175 Q 100 185 110 175 L 110 115 Q 100 110 90 115"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('nose')),
            getHoverColor(getZoneScore('nose')),
            selectedZone === 'nose' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('nose')}
          onMouseEnter={() => setHoveredZone('nose')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="코 영역"
        />

        {/* 왼쪽 볼 */}
        <ellipse
          cx="55"
          cy="155"
          rx="25"
          ry="30"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('left-cheek')),
            getHoverColor(getZoneScore('left-cheek')),
            selectedZone === 'left-cheek' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('left-cheek')}
          onMouseEnter={() => setHoveredZone('left-cheek')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="왼쪽 볼 영역"
        />

        {/* 오른쪽 볼 */}
        <ellipse
          cx="145"
          cy="155"
          rx="25"
          ry="30"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('right-cheek')),
            getHoverColor(getZoneScore('right-cheek')),
            selectedZone === 'right-cheek' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('right-cheek')}
          onMouseEnter={() => setHoveredZone('right-cheek')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="오른쪽 볼 영역"
        />

        {/* 턱 */}
        <ellipse
          cx="100"
          cy="215"
          rx="30"
          ry="20"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('chin')),
            getHoverColor(getZoneScore('chin')),
            selectedZone === 'chin' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('chin')}
          onMouseEnter={() => setHoveredZone('chin')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="턱 영역"
        />

        {/* 눈가 (왼쪽) */}
        <ellipse
          cx="65"
          cy="115"
          rx="18"
          ry="10"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('eye-area')),
            getHoverColor(getZoneScore('eye-area')),
            selectedZone === 'eye-area' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('eye-area')}
          onMouseEnter={() => setHoveredZone('eye-area')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="눈가 영역"
        />

        {/* 눈가 (오른쪽) */}
        <ellipse
          cx="135"
          cy="115"
          rx="18"
          ry="10"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('eye-area')),
            getHoverColor(getZoneScore('eye-area')),
            selectedZone === 'eye-area' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('eye-area')}
          onMouseEnter={() => setHoveredZone('eye-area')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="눈가 영역"
        />

        {/* 입술 주변 */}
        <ellipse
          cx="100"
          cy="190"
          rx="20"
          ry="12"
          className={cn(
            'cursor-pointer transition-colors opacity-60',
            getScoreColor(getZoneScore('lip-area')),
            getHoverColor(getZoneScore('lip-area')),
            selectedZone === 'lip-area' && 'opacity-80 stroke-2 stroke-blue-500'
          )}
          onClick={() => handleZoneClick('lip-area')}
          onMouseEnter={() => setHoveredZone('lip-area')}
          onMouseLeave={() => setHoveredZone(null)}
          aria-label="입술 주변 영역"
        />
      </svg>

      {/* 호버/선택 시 정보 표시 */}
      {activeZoneMeta && (
        <div
          className="mt-4 p-3 bg-gray-50 rounded-lg text-center"
          aria-live="polite"
        >
          <p className="font-medium text-gray-900">{activeZoneMeta.label}</p>
          <p className="text-sm text-gray-600">{activeZoneMeta.description}</p>
          {activeZoneScore !== null && (
            <p className="mt-1 text-sm">
              점수:{' '}
              <span
                className={cn(
                  'font-bold',
                  activeZoneScore >= 80 && 'text-emerald-600',
                  activeZoneScore >= 60 && activeZoneScore < 80 && 'text-yellow-600',
                  activeZoneScore >= 40 && activeZoneScore < 60 && 'text-orange-600',
                  activeZoneScore < 40 && 'text-red-600'
                )}
              >
                {activeZoneScore}점
              </span>
            </p>
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          80+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          60-79
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          40-59
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          0-39
        </span>
      </div>
    </div>
  );
}

export default FaceZoneMap;
