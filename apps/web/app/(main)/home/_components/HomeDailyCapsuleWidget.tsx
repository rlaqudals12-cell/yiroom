'use client';

/**
 * 홈 Daily Capsule 위젯
 * 오늘의 추천 루틴을 컴팩트하게 표시
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Palette,
  Droplets,
  Dumbbell,
  Apple,
  Scissors,
  Wand2,
  Smile,
  Shirt,
  Activity,
} from 'lucide-react';
import type { DailyCapsule, DailyItem, ModuleCode } from '@/types/capsule';

// 모듈별 아이콘 매핑
const MODULE_ICONS: Record<ModuleCode, typeof Sparkles> = {
  PC: Palette,
  S: Droplets,
  C: Activity,
  W: Dumbbell,
  N: Apple,
  H: Scissors,
  M: Wand2,
  OH: Smile,
  Fashion: Shirt,
};

export default function HomeDailyCapsuleWidget() {
  const { user } = useUser();
  const [capsule, setCapsule] = useState<DailyCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchCapsule = async () => {
      try {
        const res = await fetch('/api/capsule/daily', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.data) {
          setCapsule(data.data);
        }
      } catch {
        // 캡슐 로드 실패 시 위젯 숨김
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapsule();
  }, [user?.id]);

  // 아이템 체크 토글
  const handleCheck = useCallback(
    async (item: DailyItem) => {
      if (!capsule) return;

      try {
        await fetch(`/api/capsule/${capsule.id}/check`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, isChecked: !item.isChecked }),
        });

        setCapsule((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((i) =>
            i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
          );
          const allChecked = updatedItems.every((i) => i.isChecked);
          return {
            ...prev,
            items: updatedItems,
            status: allChecked ? 'completed' : 'in_progress',
          };
        });
      } catch {
        // 체크 실패 시 무시
      }
    },
    [capsule]
  );

  // 로딩/데이터 없음
  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (!capsule || capsule.items.length === 0) {
    return null;
  }

  const checkedCount = capsule.items.filter((i) => i.isChecked).length;
  const totalCount = capsule.items.length;
  const progress = Math.round((checkedCount / totalCount) * 100);

  return (
    <div
      className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 p-5"
      data-testid="home-daily-capsule"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">오늘의 루틴</h3>
          <span className="text-xs text-muted-foreground">
            {checkedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>약 {capsule.estimatedMinutes}분</span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 아이템 리스트 (최대 5개 표시) */}
      <div className="space-y-1.5">
        {capsule.items.slice(0, 5).map((item) => {
          const Icon = MODULE_ICONS[item.moduleCode] || Sparkles;
          return (
            <button
              key={item.id}
              onClick={() => handleCheck(item)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-left"
            >
              {item.isChecked ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-violet-500 shrink-0" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-muted-foreground/40 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-violet-400 shrink-0" />
              <span
                className={`text-sm flex-1 truncate ${
                  item.isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 더 보기 */}
      {capsule.items.length > 5 && (
        <p className="text-xs text-muted-foreground mt-2 pl-2">+{capsule.items.length - 5}개 더</p>
      )}

      {/* 완료 상태 또는 상세 보기 */}
      {capsule.status === 'completed' ? (
        <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-800/30 text-center">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            오늘 루틴을 모두 완료했어요!
          </p>
        </div>
      ) : (
        <Link
          href="/capsule/daily"
          className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-800/30 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          상세 보기
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
