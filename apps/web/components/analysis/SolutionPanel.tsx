'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProblemArea } from '@/types/skin-problem-area';
import {
  MARKER_COLORS,
  PROBLEM_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '@/types/skin-problem-area';

interface SolutionPanelProps {
  area: ProblemArea | null;
  onClose: () => void;
  onProductClick?: (ingredient: string) => void;
}

/**
 * 피부 문제 솔루션 패널
 * - 슬라이드업 패널
 * - 문제 설명 + 심각도
 * - 추천 성분/제품
 */
export const SolutionPanel = memo(function SolutionPanel({
  area,
  onClose,
  onProductClick,
}: SolutionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && area) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [area, onClose]);

  // 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && area) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [area, onClose]);

  const handleIngredientClick = useCallback(
    (ingredient: string) => {
      onProductClick?.(ingredient);
    },
    [onProductClick]
  );

  if (!area) return null;

  const color = MARKER_COLORS[area.type];
  const typeLabel = PROBLEM_TYPE_LABELS[area.type];
  const severityLabel = SEVERITY_LABELS[area.severity];
  const severityColors = SEVERITY_COLORS[area.severity];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" data-testid="solution-panel-overlay">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널 */}
      <div
        ref={panelRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 pointer-events-auto',
          'bg-background rounded-t-2xl shadow-2xl',
          'animate-in slide-in-from-bottom duration-300',
          'max-h-[70vh] overflow-hidden'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-panel-title"
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* 헤더 */}
        <div className="px-4 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 문제 유형 아이콘 */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              {area.severity === 'severe' ? (
                <AlertTriangle className="w-6 h-6" style={{ color }} />
              ) : (
                <Info className="w-6 h-6" style={{ color }} />
              )}
            </div>

            <div>
              <h2 id="solution-panel-title" className="font-bold text-lg flex items-center gap-2">
                {typeLabel}
                <Badge variant="secondary" className={cn('text-xs', severityColors)}>
                  {severityLabel}
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                {area.type === 'pores' ? 'T존' : '해당 부위'} 케어 필요
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
            aria-label="패널 닫기"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 컨텐츠 */}
        <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[50vh]">
          {/* 문제 설명 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm leading-relaxed">{area.description}</p>
          </div>

          {/* 추천 성분/제품 */}
          <div>
            <h3 className="font-medium text-sm mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              추천 케어 성분
            </h3>
            <div className="flex flex-wrap gap-2">
              {area.recommendations.map((rec, index) => (
                <button
                  key={index}
                  onClick={() => handleIngredientClick(rec)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium',
                    'bg-primary/10 text-primary',
                    'hover:bg-primary/20 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  )}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 안내 */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            추천 성분을 탭하면 관련 제품을 확인할 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
});
