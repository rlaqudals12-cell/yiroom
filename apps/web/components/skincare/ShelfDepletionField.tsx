'use client';

/**
 * 개봉일 입력 + 소진 예상 (ADR-117 루틴 v2)
 *
 * - 개봉일(openedAt) 날짜 입력 → 기존 update API 재사용(PUT /api/scan/shelf/[id])
 * - 입력되면 estimateShelfDepletion으로 "약 N일 후 소진 예상" (null이면 미표시)
 * - 30일 이내면 "재구매 준비" 칩 → /beauty
 */
import { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import { estimateShelfDepletion } from './routine-v2-contract';

interface ShelfDepletionFieldProps {
  item: ShelfItem;
}

/** Date | undefined → 'YYYY-MM-DD' (input[type=date] 값) */
function toDateInputValue(d?: Date): string {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

export function ShelfDepletionField({ item }: ShelfDepletionFieldProps) {
  const [openedAt, setOpenedAt] = useState<string>(toDateInputValue(item.openedAt));
  const [saving, setSaving] = useState(false);

  // 소진 예상은 현재 입력된 개봉일 기준으로 계산 (입력 없으면 null → 미표시)
  const merged: ShelfItem = {
    ...item,
    openedAt: openedAt ? new Date(openedAt) : undefined,
  };
  const depletion = openedAt ? estimateShelfDepletion(merged) : null;

  async function handleChange(value: string): Promise<void> {
    setOpenedAt(value);
    setSaving(true);
    try {
      await fetch(`/api/scan/shelf/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openedAt: value || undefined }),
      });
    } catch {
      /* 저장 실패 — 입력값은 화면에 유지, 다음 방문 시 재저장 가능 */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card data-testid="shelf-depletion-field">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-5 w-5" />
          개봉일
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          type="date"
          value={openedAt}
          max={toDateInputValue(new Date())}
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          aria-label="개봉일"
          data-testid="opened-at-input"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        {depletion && (
          <p className="text-sm text-muted-foreground" data-testid="depletion-estimate">
            약 {depletion.daysRemaining}일 후 소진 예상
          </p>
        )}
        {depletion && depletion.daysRemaining <= 30 && (
          <Link
            href="/beauty"
            data-testid="depletion-repurchase"
            className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            재구매 준비
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
