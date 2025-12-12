'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ProductCategory } from '@/types/product';
import { PRODUCT_CATEGORIES } from '@/lib/products';

interface CategoryTabsProps {
  value: ProductCategory;
  onValueChange: (value: ProductCategory) => void;
  className?: string;
}

/**
 * 제품 카테고리 탭
 * - 전체/스킨케어/메이크업/영양제/운동기구/건강식품
 */
export function CategoryTabs({
  value,
  onValueChange,
  className,
}: CategoryTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as ProductCategory)}
      className={cn('w-full', className)}
    >
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {PRODUCT_CATEGORIES.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="rounded-full border px-4 py-1.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
