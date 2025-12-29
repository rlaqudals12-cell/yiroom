'use client';

/**
 * 코디 빌더 컴포넌트
 * - 아이템 선택/해제
 * - 카테고리별 슬롯
 * - 콜라주 미리보기
 */

import { useState, useCallback } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { InventoryGrid, CategoryFilter } from '@/components/inventory/common';
import type { InventoryItem, ClothingCategory } from '@/types/inventory';

// 코디 슬롯 정의
interface OutfitSlot {
  category: ClothingCategory;
  label: string;
  item: InventoryItem | null;
}

const OUTFIT_SLOTS: { category: ClothingCategory; label: string }[] = [
  { category: 'outer', label: '아우터' },
  { category: 'top', label: '상의' },
  { category: 'bottom', label: '하의' },
  { category: 'shoes', label: '신발' },
  { category: 'bag', label: '가방' },
  { category: 'accessory', label: '액세서리' },
];

interface OutfitBuilderProps {
  items: InventoryItem[];
  initialSelection?: InventoryItem[];
  onComplete: (selectedItems: InventoryItem[]) => void;
  onCancel?: () => void;
}

export function OutfitBuilder({
  items,
  initialSelection = [],
  onComplete,
  onCancel,
}: OutfitBuilderProps) {
  // 슬롯별 선택된 아이템
  const [slots, setSlots] = useState<OutfitSlot[]>(() =>
    OUTFIT_SLOTS.map((slot) => ({
      ...slot,
      item:
        initialSelection.find(
          (item) =>
            item.subCategory === slot.category ||
            (item.metadata as { subCategory?: string })?.subCategory ===
              slot.category
        ) || null,
    }))
  );

  // 아이템 선택 시트
  const [activeSlot, setActiveSlot] = useState<ClothingCategory | null>(null);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);

  // 슬롯에 아이템 추가
  const addToSlot = useCallback(
    (category: ClothingCategory, item: InventoryItem) => {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.category === category ? { ...slot, item } : slot
        )
      );
      setActiveSlot(null);
    },
    []
  );

  // 슬롯에서 아이템 제거
  const removeFromSlot = useCallback((category: ClothingCategory) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.category === category ? { ...slot, item: null } : slot
      )
    );
  }, []);

  // 선택된 아이템 목록
  const selectedItems = slots.filter((s) => s.item).map((s) => s.item!);

  // 해당 카테고리의 아이템 필터링
  const getItemsForCategory = (category: ClothingCategory) => {
    return items.filter(
      (item) =>
        item.subCategory === category ||
        (item.metadata as { subCategory?: string })?.subCategory === category
    );
  };

  // 완료 처리
  const handleComplete = () => {
    if (selectedItems.length > 0) {
      onComplete(selectedItems);
    }
  };

  return (
    <div data-testid="outfit-builder" className="space-y-4">
      {/* 슬롯 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot) => (
          <div key={slot.category} className="space-y-1">
            <span className="text-xs text-muted-foreground">{slot.label}</span>
            <button
              type="button"
              onClick={() =>
                slot.item
                  ? removeFromSlot(slot.category)
                  : setActiveSlot(slot.category)
              }
              className={cn(
                'relative w-full aspect-square rounded-xl border-2 border-dashed',
                'flex items-center justify-center transition-all',
                slot.item
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/30 hover:border-primary/50'
              )}
            >
              {slot.item ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.item.imageUrl}
                    alt={slot.item.name}
                    className="w-full h-full object-contain rounded-lg p-1"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromSlot(slot.category);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <Plus className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* 선택 요약 */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedItems.length}개 아이템 선택됨
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            취소
          </Button>
        )}
        <Button
          onClick={handleComplete}
          disabled={selectedItems.length === 0}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          완료 ({selectedItems.length})
        </Button>
      </div>

      {/* 아이템 선택 시트 */}
      <Sheet
        open={activeSlot !== null}
        onOpenChange={(open) => !open && setActiveSlot(null)}
      >
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {activeSlot &&
                OUTFIT_SLOTS.find((s) => s.category === activeSlot)?.label}{' '}
              선택
            </SheetTitle>
            <VisuallyHidden asChild>
              <SheetDescription>코디에 추가할 아이템 선택</SheetDescription>
            </VisuallyHidden>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-auto h-[calc(100%-80px)]">
            {/* 카테고리 필터 */}
            {activeSlot && (
              <>
                <CategoryFilter
                  type="custom"
                  options={
                    items
                      .filter(
                        (item) =>
                          item.subCategory === activeSlot ||
                          item.category === 'closet'
                      )
                      .reduce((acc, item) => {
                        const sub = item.subCategory || '';
                        if (!acc.find((o) => o.value === sub)) {
                          acc.push({ value: sub, label: sub });
                        }
                        return acc;
                      }, [] as { value: string; label: string }[])
                  }
                  selected={filterCategory}
                  onChange={setFilterCategory}
                />

                {/* 아이템 그리드 */}
                <InventoryGrid
                  items={getItemsForCategory(activeSlot)}
                  onItemSelect={(item) => addToSlot(activeSlot, item)}
                  selectable
                  selectedIds={
                    slots.find((s) => s.category === activeSlot)?.item
                      ? [
                          slots.find((s) => s.category === activeSlot)!.item!
                            .id,
                        ]
                      : []
                  }
                  columns={3}
                  emptyMessage="해당 카테고리의 옷이 없어요"
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
