'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductSortBy } from '@/types/product';

interface ProductSortProps {
  value: ProductSortBy;
  onValueChange: (value: ProductSortBy) => void;
}

const SORT_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: 'recommended', label: '추천순' },
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'priceAsc', label: '가격 낮은순' },
  { value: 'priceDesc', label: '가격 높은순' },
  { value: 'newest', label: '최신순' },
];

/**
 * 제품 정렬 드롭다운
 */
export function ProductSort({ value, onValueChange }: ProductSortProps) {
  return (
    <Select value={value} onValueChange={(v: string) => onValueChange(v as ProductSortBy)}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="정렬" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
