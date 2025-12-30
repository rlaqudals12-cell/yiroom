'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, GitCompare, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useProductCompareStore, type CompareItem } from '@/lib/stores/productCompareStore';
import { productTypeToPath } from '@/lib/products';
import { trackCustomEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/**
 * 제품 비교 플로팅 버튼 + 비교 시트
 */
export function ProductCompare() {
  const { items, isOpen, removeItem, clearAll, setOpen } = useProductCompareStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (items.length === 0) return null;

  const handleOpenCompare = () => {
    trackCustomEvent('feature_use', 'Product Compare Opened', {
      itemCount: items.length,
      productType: items[0]?.productType,
    });
    setOpen(true);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={handleOpenCompare}
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <div className="relative">
            <GitCompare className="h-6 w-6" />
            <Badge
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
              variant="secondary"
            >
              {items.length}
            </Badge>
          </div>
        </Button>
      </div>

      {/* 비교 시트 */}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-hidden">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                제품 비교 ({items.length}/3)
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                전체 삭제
              </Button>
            </div>
          </SheetHeader>

          <div className="overflow-x-auto overflow-y-auto h-[calc(85vh-80px)]">
            <CompareTable items={items} onRemove={removeItem} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CompareTable({
  items,
  onRemove,
}: {
  items: CompareItem[];
  onRemove: (id: string) => void;
}) {
  const isCosmetic = items[0]?.productType === 'cosmetic';
  const isSupplement = items[0]?.productType === 'supplement';

  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr>
          <th className="w-24 p-2 text-left text-sm font-medium text-muted-foreground">
            항목
          </th>
          {items.map((item) => (
            <th key={item.productId} className="p-2 text-center">
              <div className="relative">
                <button
                  onClick={() => onRemove(item.productId)}
                  className="absolute -right-1 -top-1 rounded-full bg-muted p-1 hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="제거"
                >
                  <X className="h-3 w-3" />
                </button>
                <Link
                  href={`/products/${productTypeToPath(item.productType)}/${item.productId}`}
                  className="block"
                >
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-lg bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* 제품명 */}
        <CompareRow label="제품명">
          {items.map((item) => (
            <td key={item.productId} className="p-2 text-center">
              <p className="text-xs text-muted-foreground">{item.brand}</p>
              <p className="font-medium text-sm">{item.name}</p>
            </td>
          ))}
        </CompareRow>

        {/* 가격 */}
        <CompareRow label="가격" highlight>
          {items.map((item) => (
            <td key={item.productId} className="p-2 text-center">
              <p className="font-semibold text-primary">
                {item.priceKrw ? `${item.priceKrw.toLocaleString()}원` : '-'}
              </p>
            </td>
          ))}
        </CompareRow>

        {/* 평점 */}
        <CompareRow label="평점">
          {items.map((item) => (
            <td key={item.productId} className="p-2 text-center">
              {item.rating ? (
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{item.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </td>
          ))}
        </CompareRow>

        {/* 화장품: 피부타입 */}
        {isCosmetic && (
          <CompareRow label="피부타입">
            {items.map((item) => (
              <td key={item.productId} className="p-2 text-center">
                <div className="flex flex-wrap justify-center gap-1">
                  {item.skinTypes?.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  )) || <span className="text-muted-foreground">-</span>}
                </div>
              </td>
            ))}
          </CompareRow>
        )}

        {/* 화장품: 피부고민 */}
        {isCosmetic && (
          <CompareRow label="피부고민">
            {items.map((item) => (
              <td key={item.productId} className="p-2 text-center">
                <div className="flex flex-wrap justify-center gap-1">
                  {item.concerns?.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  )) || <span className="text-muted-foreground">-</span>}
                </div>
              </td>
            ))}
          </CompareRow>
        )}

        {/* 화장품: 주요성분 */}
        {isCosmetic && (
          <CompareRow label="주요성분">
            {items.map((item) => (
              <td key={item.productId} className="p-2 text-center text-sm">
                {item.keyIngredients?.slice(0, 3).join(', ') || '-'}
              </td>
            ))}
          </CompareRow>
        )}

        {/* 영양제: 효능 */}
        {isSupplement && (
          <CompareRow label="효능">
            {items.map((item) => (
              <td key={item.productId} className="p-2 text-center">
                <div className="flex flex-wrap justify-center gap-1">
                  {item.benefits?.slice(0, 3).map((b) => (
                    <Badge key={b} variant="secondary" className="text-xs">
                      {b}
                    </Badge>
                  )) || <span className="text-muted-foreground">-</span>}
                </div>
              </td>
            ))}
          </CompareRow>
        )}

        {/* 영양제: 주요성분 */}
        {isSupplement && (
          <CompareRow label="주요성분">
            {items.map((item) => (
              <td key={item.productId} className="p-2 text-center text-sm">
                {item.mainIngredients
                  ?.slice(0, 3)
                  .map((i) => `${i.name} ${i.amount}${i.unit}`)
                  .join(', ') || '-'}
              </td>
            ))}
          </CompareRow>
        )}
      </tbody>
    </table>
  );
}

function CompareRow({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr className={cn(highlight && 'bg-muted/50')}>
      <td className="p-2 text-sm font-medium text-muted-foreground border-r">
        {label}
      </td>
      {children}
    </tr>
  );
}

export default ProductCompare;
