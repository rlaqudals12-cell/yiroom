'use client';

/**
 * 지역 선택 컴포넌트
 * - 드롭다운 또는 버튼 그룹으로 지역 선택
 * - 현재 지역 표시 (국기 + 이름)
 */

import { useState } from 'react';
import { Check, ChevronDown, Globe, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegion } from '@/hooks/useRegion';
import type { SupportedRegion } from '@/lib/region/config';

interface RegionSelectorProps {
  /** 컴팩트 모드 (아이콘만 표시) */
  compact?: boolean;
  /** 초기화 버튼 표시 */
  showReset?: boolean;
  /** 지역 변경 시 콜백 */
  onRegionChange?: (region: SupportedRegion) => void;
  className?: string;
}

export function RegionSelector({
  compact = false,
  showReset = false,
  onRegionChange,
  className,
}: RegionSelectorProps) {
  const { region, regionInfo, supportedRegions, isUserSelected, setRegion, resetRegion } =
    useRegion();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedRegion: SupportedRegion) => {
    setRegion(selectedRegion);
    setIsOpen(false);
    onRegionChange?.(selectedRegion);
  };

  const handleReset = () => {
    resetRegion();
    onRegionChange?.(region);
  };

  return (
    <div data-testid="region-selector" className={cn('relative', className)}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
          compact && 'px-2'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg" role="img" aria-label={regionInfo.nameEn}>
          {regionInfo.flag}
        </span>
        {!compact && (
          <>
            <span className="text-sm font-medium">{regionInfo.name}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          {/* 백드롭 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* 메뉴 */}
          <div
            className={cn(
              'absolute top-full right-0 mt-2 z-50',
              'bg-popover border rounded-xl shadow-lg',
              'min-w-[180px] py-2'
            )}
            role="listbox"
            aria-label="지역 선택"
          >
            {/* 지역 목록 */}
            {supportedRegions.map((r) => {
              const info = getRegionInfoByCode(r);
              const isSelected = r === region;

              return (
                <button
                  key={r}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(r)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    'hover:bg-accent',
                    isSelected && 'bg-accent/50'
                  )}
                >
                  <span className="text-lg">{info.flag}</span>
                  <span className="flex-1 text-sm">{info.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}

            {/* 구분선 + 초기화 버튼 */}
            {showReset && isUserSelected && (
              <>
                <div className="my-2 border-t" />
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    'hover:bg-accent text-muted-foreground'
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">자동 감지로 초기화</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 지역 배지 (읽기 전용)
 */
export function RegionBadge({ className }: { className?: string }) {
  const { regionInfo } = useRegion();

  return (
    <div
      data-testid="region-badge"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
        'bg-secondary/50 text-secondary-foreground text-xs',
        className
      )}
    >
      <Globe className="w-3 h-3" />
      <span>{regionInfo.flag}</span>
      <span>{regionInfo.name}</span>
    </div>
  );
}

// 헬퍼 함수 (모듈 내 import 순환 방지)
import { REGION_CONFIG, type RegionInfo } from '@/lib/region/config';

function getRegionInfoByCode(code: SupportedRegion): RegionInfo {
  return REGION_CONFIG[code];
}
