'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProductInteractionWarning } from '@/types/interaction';
import { ProductWarningBanner } from './InteractionWarning';
import { filterWarningsOnly, filterSynergiesOnly } from '@/lib/products/services/interactions';

interface InteractionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: ProductInteractionWarning[];
}

export function InteractionDetailModal({
  open,
  onOpenChange,
  warnings,
}: InteractionDetailModalProps) {
  const warningsOnly = filterWarningsOnly(warnings);
  const synergiesOnly = filterSynergiesOnly(warnings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>성분 상호작용 분석</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="warnings" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="warnings" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              주의 ({warningsOnly.length})
            </TabsTrigger>
            <TabsTrigger value="synergies" className="gap-2">
              <Sparkles className="h-4 w-4" />
              시너지 ({synergiesOnly.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value="warnings" className="space-y-3 pr-4">
              {warningsOnly.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  주의가 필요한 상호작용이 없습니다.
                </p>
              ) : (
                warningsOnly.map((warning, idx) => (
                  <ProductWarningBanner
                    key={`${warning.productA.id}-${warning.productB.id}-${idx}`}
                    warning={warning}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="synergies" className="space-y-3 pr-4">
              {synergiesOnly.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  시너지 효과가 있는 조합이 없습니다.
                </p>
              ) : (
                synergiesOnly.map((warning, idx) => (
                  <ProductWarningBanner
                    key={`${warning.productA.id}-${warning.productB.id}-${idx}`}
                    warning={warning}
                  />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* 안내 문구 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            이 정보는 참고용이며, 의약품과의 상호작용은 포함되지 않았습니다.
            구체적인 복용 방법은 전문가와 상담하세요.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ================================================
// 빠른 요약 카드 (제품 상세용)
// ================================================

interface QuickInteractionCheckProps {
  productName: string;
  interactions: ProductInteractionWarning[];
  className?: string;
}

export function QuickInteractionCheck({
  productName: _productName,
  interactions,
  className,
}: QuickInteractionCheckProps) {
  if (interactions.length === 0) {
    return null;
  }

  const warningsOnly = filterWarningsOnly(interactions);
  const synergiesOnly = filterSynergiesOnly(interactions);

  const hasHighSeverity = warningsOnly.some((w) =>
    w.interactions.some((i) => i.severity === 'high')
  );

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium">위시리스트 제품과의 상호작용</h4>

      {warningsOnly.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm p-2 rounded',
            hasHighSeverity
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {warningsOnly.length}개 제품과 상호작용 주의
          </span>
        </div>
      )}

      {synergiesOnly.length > 0 && (
        <div className="flex items-center gap-2 text-sm p-2 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            {synergiesOnly.length}개 제품과 시너지 효과
          </span>
        </div>
      )}
    </div>
  );
}
