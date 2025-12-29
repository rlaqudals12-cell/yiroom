'use client';

import { useState } from 'react';
import { Sun, Moon, Edit2, Plus, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RoutineItem } from '@/types/hybrid';

// 스킨케어 카테고리
const SKINCARE_CATEGORIES = [
  { value: 'cleanser', label: '클렌저', emoji: '🧴' },
  { value: 'toner', label: '토너', emoji: '💧' },
  { value: 'serum', label: '세럼', emoji: '✨' },
  { value: 'moisturizer', label: '보습제', emoji: '🧊' },
  { value: 'sunscreen', label: '선크림', emoji: '☀️' },
  { value: 'mask', label: '마스크팩', emoji: '🎭' },
  { value: 'eyecream', label: '아이크림', emoji: '👁️' },
  { value: 'oilserum', label: '오일/앰플', emoji: '💎' },
];

export interface SkincareRoutineCardProps {
  /** 아침 루틴 */
  morningRoutine: RoutineItem[];
  /** 저녁 루틴 */
  eveningRoutine: RoutineItem[];
  /** 루틴 수정 콜백 */
  onEditStep?: (step: RoutineItem, timing: 'morning' | 'evening') => void;
  /** 루틴 추가 콜백 */
  onAddStep?: (timing: 'morning' | 'evening') => void;
  /** 수정 모드 */
  editable?: boolean;
  /** 추가 className */
  className?: string;
}

/**
 * 스킨케어 루틴 카드 (Beauty 도메인)
 * - 아침/저녁 루틴 시각화
 * - 단계별 제품 표시
 * - 드래그 앤 드롭 (미구현)
 */
export function SkincareRoutineCard({
  morningRoutine,
  eveningRoutine,
  onEditStep,
  onAddStep,
  editable = false,
  className,
}: SkincareRoutineCardProps) {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  const currentRoutine = activeTab === 'morning' ? morningRoutine : eveningRoutine;

  // 카테고리 라벨 가져오기
  const getCategoryInfo = (category: string) => {
    return SKINCARE_CATEGORIES.find((c) => c.value === category) || { label: category, emoji: '📦' };
  };

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="skincare-routine-card">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">스킨케어 루틴</CardTitle>

          {/* 아침/저녁 탭 */}
          <div className="flex bg-white/50 dark:bg-black/20 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('morning')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'morning'
                  ? 'bg-amber-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              아침
            </button>
            <button
              onClick={() => setActiveTab('evening')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'evening'
                  ? 'bg-indigo-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              저녁
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {currentRoutine.length > 0 ? (
          <div className="space-y-3">
            {currentRoutine
              .sort((a, b) => a.order - b.order)
              .map((step, index) => {
                const categoryInfo = getCategoryInfo(step.category);
                return (
                  <div
                    key={`${step.category}-${index}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl group"
                  >
                    {/* 순서 및 드래그 핸들 */}
                    <div className="flex items-center gap-2">
                      {editable && (
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center">
                        {step.order}
                      </div>
                    </div>

                    {/* 카테고리 아이콘 */}
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">
                      {categoryInfo.emoji}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{categoryInfo.label}</p>
                      {step.productName ? (
                        <p className="text-xs text-muted-foreground truncate">{step.productName}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">제품 미설정</p>
                      )}
                    </div>

                    {/* 소요 시간 */}
                    {step.duration && (
                      <Badge variant="outline" className="text-xs">
                        {step.duration}
                      </Badge>
                    )}

                    {/* 수정 버튼 */}
                    {editable && onEditStep && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEditStep(step, activeTab)}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {activeTab === 'morning' ? '아침' : '저녁'} 루틴이 없습니다
            </p>
            <p className="text-xs mt-1">루틴을 추가해보세요</p>
          </div>
        )}

        {/* 추가 버튼 */}
        {editable && onAddStep && (
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={() => onAddStep(activeTab)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            단계 추가
          </Button>
        )}

        {/* 루틴 요약 */}
        {currentRoutine.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {currentRoutine.length}단계</span>
            <span>
              예상 소요 시간:{' '}
              {currentRoutine.reduce((acc, step) => {
                const minutes = parseInt(step.duration || '0');
                return acc + (isNaN(minutes) ? 0 : minutes);
              }, 0)}
              분
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SkincareRoutineCard;
