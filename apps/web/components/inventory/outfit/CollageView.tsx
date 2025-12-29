'use client';

/**
 * 코디 콜라주 뷰 컴포넌트
 * - 선택된 아이템들을 콜라주 형태로 표시
 * - 다양한 레이아웃 지원
 */

import { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { InventoryItem, ClothingCategory } from '@/types/inventory';

type CollageLayout = 'stack' | 'grid' | 'mannequin';

interface CollageViewProps {
  items: InventoryItem[];
  layout?: CollageLayout;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

// 카테고리별 정렬 순서 (위에서 아래로)
const CATEGORY_ORDER: ClothingCategory[] = [
  'accessory',
  'outer',
  'top',
  'bottom',
  'shoes',
  'bag',
];

export function CollageView({
  items,
  layout = 'stack',
  size = 'md',
  className,
  onClick,
}: CollageViewProps) {
  // 카테고리별 정렬
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.subCategory as ClothingCategory);
      const bIndex = CATEGORY_ORDER.indexOf(b.subCategory as ClothingCategory);
      return (
        (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      );
    });
  }, [items]);

  // 사이즈별 클래스
  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-40 h-52',
    lg: 'w-56 h-72',
  };

  // 빈 상태
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-xl',
          sizeClasses[size],
          className
        )}
      >
        <span className="text-xs text-muted-foreground">코디 없음</span>
      </div>
    );
  }

  // 스택 레이아웃 (겹쳐서 표시)
  if (layout === 'stack') {
    return (
      <div
        data-testid="collage-view"
        onClick={onClick}
        className={cn(
          'relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl overflow-hidden',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:ring-2 ring-primary transition-all',
          className
        )}
      >
        {sortedItems.slice(0, 4).map((item, index) => {
          const positions = getStackPositions(sortedItems.length, index, size);
          return (
            <div
              key={item.id}
              className="absolute transition-transform"
              style={positions}
            >
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={size === 'sm' ? 60 : size === 'md' ? 80 : 100}
                height={size === 'sm' ? 60 : size === 'md' ? 80 : 100}
                className="object-contain drop-shadow-md"
              />
            </div>
          );
        })}

        {/* 추가 아이템 수 표시 */}
        {items.length > 4 && (
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            +{items.length - 4}
          </div>
        )}
      </div>
    );
  }

  // 그리드 레이아웃
  if (layout === 'grid') {
    const gridCols = items.length <= 2 ? 2 : items.length <= 4 ? 2 : 3;
    return (
      <div
        data-testid="collage-view"
        onClick={onClick}
        className={cn(
          'bg-muted rounded-xl overflow-hidden p-2',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:ring-2 ring-primary transition-all',
          className
        )}
      >
        <div
          className={cn('grid gap-1 h-full', {
            'grid-cols-2': gridCols === 2,
            'grid-cols-3': gridCols === 3,
          })}
        >
          {sortedItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-md overflow-hidden"
            >
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-contain p-1"
                sizes="50px"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 마네킹 레이아웃 (상의-하의-신발 세로 정렬)
  if (layout === 'mannequin') {
    const top = sortedItems.find(
      (i) => i.subCategory === 'top' || i.subCategory === 'outer'
    );
    const bottom = sortedItems.find((i) => i.subCategory === 'bottom');
    const shoes = sortedItems.find((i) => i.subCategory === 'shoes');
    const accessories = sortedItems.filter(
      (i) =>
        i.subCategory === 'accessory' ||
        i.subCategory === 'bag'
    );

    return (
      <div
        data-testid="collage-view"
        onClick={onClick}
        className={cn(
          'flex flex-col items-center justify-between bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-3',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:ring-2 ring-primary transition-all',
          className
        )}
      >
        {/* 상의 */}
        {top && (
          <div className="relative w-3/4 flex-1 max-h-[40%]">
            <Image
              src={top.imageUrl}
              alt={top.name}
              fill
              className="object-contain"
              sizes="100px"
            />
          </div>
        )}

        {/* 하의 */}
        {bottom && (
          <div className="relative w-2/3 flex-1 max-h-[35%]">
            <Image
              src={bottom.imageUrl}
              alt={bottom.name}
              fill
              className="object-contain"
              sizes="80px"
            />
          </div>
        )}

        {/* 신발 */}
        {shoes && (
          <div className="relative w-1/2 h-[20%]">
            <Image
              src={shoes.imageUrl}
              alt={shoes.name}
              fill
              className="object-contain"
              sizes="60px"
            />
          </div>
        )}

        {/* 액세서리 */}
        {accessories.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {accessories.slice(0, 2).map((acc) => (
              <div key={acc.id} className="w-6 h-6 relative">
                <Image
                  src={acc.imageUrl}
                  alt={acc.name}
                  fill
                  className="object-contain"
                  sizes="24px"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// 스택 레이아웃에서 각 아이템의 위치 계산
function getStackPositions(
  total: number,
  index: number,
  size: 'sm' | 'md' | 'lg'
): React.CSSProperties {
  const _baseSize = size === 'sm' ? 20 : size === 'md' ? 30 : 40;

  // 2개 이하: 위아래 배치
  if (total <= 2) {
    return {
      left: '50%',
      top: index === 0 ? '15%' : '45%',
      transform: 'translateX(-50%)',
    };
  }

  // 3개: 삼각형 배치
  if (total === 3) {
    const positions = [
      { left: '50%', top: '10%', transform: 'translateX(-50%)' },
      { left: '20%', top: '45%' },
      { left: '55%', top: '50%' },
    ];
    return positions[index] || {};
  }

  // 4개 이상: 사각형 배치
  const positions = [
    { left: '10%', top: '5%' },
    { left: '50%', top: '10%' },
    { left: '15%', top: '45%' },
    { left: '55%', top: '50%' },
  ];
  return positions[index] || {};
}
