'use client';

/**
 * 드래그 가능한 위젯 리스트
 * - @dnd-kit 기반 수직 정렬
 * - 편집 모드 토글 (GripVertical 핸들)
 * - 순서 변경 시 localStorage에 자동 저장
 */

import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings2, RotateCcw } from 'lucide-react';
import { FEATURE_FLAGS } from '@yiroom/shared';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { announce } from '@/lib/a11y';
import type { WidgetId } from '@/hooks/useWidgetOrder';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  isEditing: boolean;
}

function SortableItem({ id, children, isEditing }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-80 scale-[1.02]',
        isEditing && 'ring-1 ring-violet-200 dark:ring-violet-800 rounded-2xl'
      )}
    >
      {/* 드래그 핸들 (편집 모드에서만 표시) */}
      {isEditing && (
        <button
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-violet-200 dark:border-violet-700 cursor-grab active:cursor-grabbing"
          aria-label="위젯 순서 변경"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-violet-400" />
        </button>
      )}
      {children}
    </div>
  );
}

interface SortableWidgetListProps {
  order: WidgetId[];
  onOrderChange: (newOrder: WidgetId[]) => void;
  onReset: () => void;
  isCustomized: boolean;
  widgets: Record<WidgetId, ReactNode>;
}

export default function SortableWidgetList({
  order,
  onOrderChange,
  onReset,
  isCustomized,
  widgets,
}: SortableWidgetListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations('home');

  // 실제 렌더되는(위젯 존재) 항목만 — 스크린리더 순번을 보이는 항목 수와 일치시킴
  const visibleOrder = useMemo(() => order.filter((id) => widgets[id] != null), [order, widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 드래그 시작 시 스크린 리더 알림 (보이는 순번 기준)
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const idx = visibleOrder.indexOf(event.active.id as WidgetId);
      announce(`위젯 이동 시작, 현재 ${idx + 1}번째`, 'assertive');
    },
    [visibleOrder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        // 영속 order(숨김 위젯 포함)는 전체 인덱스로 이동, 안내는 보이는 순번으로
        const oldIndex = order.indexOf(active.id as WidgetId);
        const newIndex = order.indexOf(over.id as WidgetId);
        onOrderChange(arrayMove(order, oldIndex, newIndex));
        const visIdx = visibleOrder.indexOf(over.id as WidgetId);
        announce(`위젯을 ${visIdx + 1}번째로 이동했어요`, 'assertive');
      }
    },
    [order, visibleOrder, onOrderChange]
  );

  return (
    <div data-testid="sortable-widget-list">
      {/* 편집 토글 버튼 — WIDGET_REORDER 게이팅 (기능 과잉 정리 2026-07-06, 코드·저장 순서는 유지) */}
      {FEATURE_FLAGS.WIDGET_REORDER && (
        <div className="flex items-center justify-end gap-2 mb-2">
          {isEditing && isCustomized && (
            <button
              onClick={() => {
                onReset();
                setIsEditing(false);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={t('resetWidgetOrder')}
            >
              <RotateCcw className="w-3 h-3" />
              {t('resetOrder')}
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
              isEditing
                ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label={isEditing ? t('doneEditing') : t('editWidgetOrder')}
            aria-pressed={isEditing}
          >
            <Settings2 className="w-3 h-3" />
            {isEditing ? t('done') : t('editOrder')}
          </button>
        </div>
      )}

      {/* 드래그 영역 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
          <div className={cn('space-y-5', isEditing && 'pl-4')}>
            {visibleOrder.map((widgetId) => (
              <SortableItem key={widgetId} id={widgetId} isEditing={isEditing}>
                {widgets[widgetId]}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
