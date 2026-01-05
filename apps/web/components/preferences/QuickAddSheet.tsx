'use client';

import { useState } from 'react';
import { Plus, Heart, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  type PreferenceDomain,
  type PreferenceItemType,
  type AvoidLevel,
} from '@/types/preferences';
import {
  getAvoidLevelLabel,
  AVOID_LEVEL_COLORS,
  type SupportedLocale,
} from '@/lib/preferences/labels';

interface QuickAddSheetProps {
  /** 기본 도메인 */
  defaultDomain?: PreferenceDomain;
  /** 선호도 타입 (true=좋아함, false=기피) */
  isFavorite?: boolean;
  /** 추가 완료 콜백 */
  onAdd?: (data: {
    domain: PreferenceDomain;
    itemType: PreferenceItemType;
    itemName: string;
    isFavorite: boolean;
    avoidLevel?: AvoidLevel;
  }) => Promise<void>;
  /** 지역 설정 */
  locale?: SupportedLocale;
  /** 추가 className */
  className?: string;
}

const DOMAIN_OPTIONS: { value: PreferenceDomain; label: string }[] = [
  { value: 'beauty', label: '화장품 성분' },
  { value: 'style', label: '패션 소재' },
  { value: 'nutrition', label: '음식/영양' },
  { value: 'workout', label: '운동' },
  { value: 'color', label: '색상' },
];

const ITEM_TYPE_BY_DOMAIN: Record<
  PreferenceDomain,
  { value: PreferenceItemType; label: string }[]
> = {
  beauty: [{ value: 'ingredient', label: '화장품 성분' }],
  style: [
    { value: 'material', label: '소재' },
    { value: 'fashion_style', label: '스타일' },
    { value: 'fit', label: '핏' },
  ],
  nutrition: [
    { value: 'food', label: '음식' },
    { value: 'food_category', label: '음식 카테고리' },
    { value: 'allergen', label: '알레르겐' },
    { value: 'diet_restriction', label: '식이 제한' },
    { value: 'nutrient', label: '영양소' },
  ],
  workout: [
    { value: 'exercise', label: '운동' },
    { value: 'exercise_style', label: '운동 스타일' },
    { value: 'equipment', label: '운동 장비' },
    { value: 'body_part', label: '신체 부위' },
  ],
  color: [
    { value: 'color', label: '색상' },
    { value: 'color_tone', label: '색조' },
    { value: 'pattern', label: '패턴' },
  ],
};

const AVOID_LEVELS: AvoidLevel[] = ['dislike', 'avoid', 'cannot', 'danger'];

/**
 * 선호/기피 항목 빠른 추가 시트
 * - 도메인, 항목 타입, 이름 입력
 * - 기피 수준 선택 (라디오)
 * - 자동 완료 콜백
 */
export function QuickAddSheet({
  defaultDomain = 'beauty',
  isFavorite = false,
  onAdd,
  locale = 'ko',
  className,
}: QuickAddSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 폼 상태
  const [domain, setDomain] = useState<PreferenceDomain>(defaultDomain);
  const [itemType, setItemType] = useState<PreferenceItemType>(
    ITEM_TYPE_BY_DOMAIN[defaultDomain][0]?.value || 'ingredient'
  );
  const [itemName, setItemName] = useState('');
  const [favoriteType, setFavoriteType] = useState<'favorite' | 'avoid'>(
    isFavorite ? 'favorite' : 'avoid'
  );
  const [avoidLevel, setAvoidLevel] = useState<AvoidLevel>('avoid');

  // 도메인 변경 시 아이템 타입 초기화
  const handleDomainChange = (newDomain: PreferenceDomain) => {
    setDomain(newDomain);
    setItemType(ITEM_TYPE_BY_DOMAIN[newDomain][0]?.value || 'ingredient');
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!itemName.trim()) {
      alert('항목 이름을 입력해주세요');
      return;
    }

    try {
      setIsLoading(true);

      await onAdd?.({
        domain,
        itemType,
        itemName: itemName.trim(),
        isFavorite: favoriteType === 'favorite',
        avoidLevel: favoriteType === 'avoid' ? avoidLevel : undefined,
      });

      // 폼 리셋
      setItemName('');
      setFavoriteType(isFavorite ? 'favorite' : 'avoid');
      setAvoidLevel('avoid');
      setIsOpen(false);
    } catch (error) {
      console.error('[QuickAddSheet] Submit error:', error);
      alert('추가 실패. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableItemTypes = ITEM_TYPE_BY_DOMAIN[domain] || [];

  return (
    <div className={cn('', className)} data-testid="quick-add-sheet">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="sm" className="gap-2" aria-label="선호/기피 항목 추가">
            <Plus className="h-4 w-4" aria-hidden="true" />
            추가
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-auto rounded-t-lg">
          <SheetHeader className="pb-4">
            <SheetTitle>선호/기피 항목 추가</SheetTitle>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
            data-testid="quick-add-form"
          >
            {/* 도메인 선택 */}
            <div className="space-y-2">
              <Label htmlFor="domain-select" className="font-medium">
                도메인 선택
              </Label>
              <Select value={domain} onValueChange={handleDomainChange}>
                <SelectTrigger id="domain-select" aria-label="도메인 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 아이템 타입 선택 */}
            <div className="space-y-2">
              <Label htmlFor="item-type-select" className="font-medium">
                항목 타입
              </Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as PreferenceItemType)}>
                <SelectTrigger id="item-type-select" aria-label="항목 타입 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableItemTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 항목 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="item-name" className="font-medium">
                항목 이름
              </Label>
              <Input
                id="item-name"
                placeholder="예: 히알루론산"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                disabled={isLoading}
                aria-label="항목 이름 입력"
              />
            </div>

            {/* 선호/기피 타입 선택 */}
            <div className="space-y-3">
              <Label className="font-medium">유형</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={favoriteType === 'favorite' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFavoriteType('favorite')}
                  className="flex-1 gap-2"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  좋아해요
                </Button>
                <Button
                  type="button"
                  variant={favoriteType === 'avoid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFavoriteType('avoid')}
                  className="flex-1 gap-2"
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  기피해요
                </Button>
              </div>
            </div>

            {/* 기피 수준 선택 (기피 타입일 때만) */}
            {favoriteType === 'avoid' && (
              <div className="space-y-3">
                <Label className="font-medium">기피 수준</Label>
                <div className="space-y-2">
                  {AVOID_LEVELS.map((level) => {
                    const colors = AVOID_LEVEL_COLORS[level];
                    const label = getAvoidLevelLabel(level, locale);
                    const isSelected = avoidLevel === level;

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setAvoidLevel(level)}
                        className={cn(
                          'w-full flex items-center gap-2 p-3 rounded-lg border transition-all',
                          colors.bg,
                          colors.border,
                          colors.text,
                          isSelected && 'ring-2 ring-offset-2 ring-current',
                          'hover:opacity-80'
                        )}
                        aria-pressed={isSelected}
                        aria-label={`기피 수준: ${label}`}
                      >
                        <span>{colors.icon}</span>
                        <span className="font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <SheetFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={!itemName.trim() || isLoading} className="flex-1">
                {isLoading ? '추가 중...' : '추가하기'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default QuickAddSheet;
