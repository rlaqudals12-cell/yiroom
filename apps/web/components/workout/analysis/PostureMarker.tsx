'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { PostureIssue } from '@/types/workout-posture';
import { POSTURE_MARKER_COLORS, POSTURE_TYPE_LABELS } from '@/types/workout-posture';

interface PostureMarkerProps {
  issue: PostureIssue;
  onClick: () => void;
  isSelected?: boolean;
  showLabel?: boolean;
}

/**
 * 운동 자세 문제 영역 마커
 * - 위치에 원형 마커 표시
 * - 클릭 시 피드백 패널 열림
 * - 심각도별 색상 구분
 */
export const PostureMarker = memo(function PostureMarker({
  issue,
  onClick,
  isSelected = false,
  showLabel = true,
}: PostureMarkerProps) {
  const color = POSTURE_MARKER_COLORS[issue.severity];
  const label = POSTURE_TYPE_LABELS[issue.type];

  // 최소 터치 타겟 크기 보장 (44px)
  const markerSize = Math.max(issue.location.radius * 2, 44);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2',
        'flex flex-col items-center gap-1',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
      )}
      style={{
        left: `${issue.location.x}%`,
        top: `${issue.location.y}%`,
        zIndex: isSelected ? 20 : 10,
      }}
      aria-label={`${label} - ${issue.description}`}
      data-testid={`posture-marker-${issue.id}`}
    >
      {/* 마커 원 */}
      <div
        className={cn(
          'rounded-full border-2 border-white shadow-lg',
          'flex items-center justify-center',
          'transition-transform duration-200',
          isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
        )}
        style={{
          width: markerSize,
          height: markerSize,
          backgroundColor: `${color}CC`, // 80% 불투명도
        }}
      >
        {/* 펄스 애니메이션 (경고/위험일 때만) */}
        {!isSelected && issue.severity !== 'good' && (
          <span
            className="absolute rounded-full animate-ping"
            style={{
              width: markerSize * 0.8,
              height: markerSize * 0.8,
              backgroundColor: `${color}40`, // 25% 불투명도
            }}
          />
        )}

        {/* 중앙 아이콘 */}
        <span
          className="rounded-full bg-white"
          style={{
            width: markerSize * 0.3,
            height: markerSize * 0.3,
          }}
        />
      </div>

      {/* 라벨 */}
      {showLabel && (
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            'bg-white/90 shadow-sm whitespace-nowrap',
            'transition-opacity duration-200'
          )}
          style={{ color }}
        >
          {label}
        </span>
      )}
    </button>
  );
});
