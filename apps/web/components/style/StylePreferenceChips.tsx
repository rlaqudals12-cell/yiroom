'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STYLE_PREFERENCE_OPTIONS } from '@/lib/style';

/**
 * 선호 스타일 칩 (Style 도메인 - 취향 선택)
 *
 * - 캐주얼/미니멀/스트릿/클래식/러블리/스포티/포멀 다중선택
 * - user_preferences(domain='style', itemType='fashion_style')에 저장
 * - 저장/복원만 수행. 현재 스타일 추천 로직이 이 태그를 소비하지 않으므로
 *   "추천에 반영된다"는 문구는 쓰지 않는다(유령 방지).
 */

export interface StylePreferenceChipsProps {
  className?: string;
}

export function StylePreferenceChips({ className }: StylePreferenceChipsProps) {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  // value(영문) → 저장된 preference id
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  // 기존 선호 스타일 복원
  const fetchPreferences = useCallback(async () => {
    if (!isLoaded || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/preferences?domain=style&itemType=fashion_style');
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const rows = (json.data ?? []) as Array<{
        id: string;
        itemName: string;
        itemNameEn?: string;
        isFavorite: boolean;
      }>;

      const next: Record<string, string> = {};
      for (const row of rows) {
        if (!row.isFavorite) continue;
        // 영문값 우선, 없으면 한글명으로 옵션 매핑
        const opt = STYLE_PREFERENCE_OPTIONS.find(
          (o) => o.value === row.itemNameEn || o.label === row.itemName
        );
        if (opt) next[opt.value] = row.id;
      }
      setSelected(next);
    } catch (err) {
      console.error('[StylePreferenceChips] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const toggle = useCallback(
    async (value: string, label: string) => {
      if (!userId || pending) return;
      setPending(value);

      const existingId = selected[value];

      try {
        if (existingId) {
          // 해제 → 삭제
          const res = await fetch(`/api/preferences/${existingId}`, { method: 'DELETE' });
          if (res.ok) {
            setSelected((prev) => {
              const next = { ...prev };
              delete next[value];
              return next;
            });
          }
        } else {
          // 선택 → 추가
          const res = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: 'style',
              itemType: 'fashion_style',
              itemName: label,
              itemNameEn: value,
              isFavorite: true,
              priority: 3,
              source: 'user',
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const newId = json.data?.id as string | undefined;
            if (newId) {
              setSelected((prev) => ({ ...prev, [value]: newId }));
            }
          }
        }
      } catch (err) {
        console.error('[StylePreferenceChips] toggle error:', err);
      } finally {
        setPending(null);
      }
    },
    [userId, pending, selected]
  );

  const selectedCount = Object.keys(selected).length;

  return (
    <div className={cn('', className)} data-testid="style-preference-chips">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
        <span className="text-sm font-medium">선호 스타일</span>
        {selectedCount > 0 && (
          <span className="text-xs text-muted-foreground">{selectedCount}개 선택됨</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        좋아하는 스타일을 골라두면 내 프로필에 저장돼요
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="선호 스타일 선택">
        {STYLE_PREFERENCE_OPTIONS.map((opt) => {
          const isSelected = !!selected[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value, opt.label)}
              disabled={isLoading || pending === opt.value}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60',
                isSelected
                  ? 'bg-violet-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StylePreferenceChips;
