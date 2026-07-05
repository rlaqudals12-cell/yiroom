'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Check,
  Circle,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// API(/api/capsule/daily) 실제 응답 계약 — types/capsule.ts DailyItem과 동일 형태.
// 기존엔 label/domainId/completed를 기대해 아이템 이름이 전부 빈 카드로 렌더되던 버그.
interface DailyItem {
  id: string;
  moduleCode: string;
  name: string;
  reason?: string;
  isChecked?: boolean;
  timeOfDay?: 'morning' | 'evening' | 'anytime';
}

interface DailyCapsule {
  id: string;
  date: string;
  items: DailyItem[];
}

// 모듈 코드 색상 매핑
const MODULE_COLORS: Record<string, string> = {
  S: '#60A5FA',
  Fashion: '#F472B6',
  N: '#4ADE80',
  W: '#4ADE80',
  H: '#D4A24E',
  M: '#D45ABF',
  PC: '#F472B6',
  OH: '#4ABF7A',
  C: '#A78BFA',
};

const MODULE_NAMES: Record<string, string> = {
  S: '스킨케어',
  Fashion: '코디',
  H: '헤어',
  M: '메이크업',
  PC: '퍼스널 컬러',
  C: '체형',
};

// 시간대 그룹 — 사용자 멘탈 모델(아침 루틴/저녁 루틴)에 맞춘 표시 순서
const TIME_GROUPS: Array<{ key: 'morning' | 'evening' | 'anytime'; label: string }> = [
  { key: 'morning', label: '☀️ 아침' },
  { key: 'evening', label: '🌙 저녁' },
  { key: 'anytime', label: '🌤 언제든' },
];

/**
 * Daily Capsule 상세 페이지
 *
 * 오늘의 캡슐 아이템 목록, 체크 기능, 진행률 바
 */
export default function DailyCapsulePage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [daily, setDaily] = useState<DailyCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 체크 상태를 로컬로 관리 (낙관적 UI)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const fetchDaily = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/capsule/daily');
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      if (json.success && json.data) {
        setDaily(json.data);
        // 이미 완료된 아이템 반영 (API 필드명 = isChecked)
        const completed = new Set<string>();
        for (const item of json.data.items ?? []) {
          if (item.isChecked) completed.add(item.id);
        }
        setCheckedItems(completed);
      } else {
        // 오늘 캡슐이 없으면 null
        setDaily(null);
      }
    } catch {
      setError('오늘의 캡슐을 불러올 수 없어요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Daily Capsule 생성
  const generateDaily = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/capsule/daily', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate');

      const json = await res.json();
      if (json.success && json.data) {
        setDaily(json.data);
        setCheckedItems(new Set());
      }
    } catch {
      setError('캡슐 생성에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 아이템 체크 토글
  const toggleItem = useCallback(
    async (itemId: string) => {
      if (!daily) return;

      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });

      // 서버에 체크 상태 전송 (있으면)
      try {
        // API 스키마 = { itemId, isChecked } — 기존 completed 키는 400으로 조용히 실패했음
        await fetch(`/api/capsule/daily/${daily.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, isChecked: !checkedItems.has(itemId) }),
        });
      } catch {
        // 낙관적 UI이므로 실패해도 로컬 상태 유지
      }
    },
    [daily, checkedItems]
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDaily();
    }
  }, [isLoaded, isSignedIn, fetchDaily]);

  const completedCount = checkedItems.size;
  const totalCount = daily?.items.length ?? 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="capsule-daily">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-daily">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">오늘의 캡슐을 확인하려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-daily">
      {/* 뒤로 가기 + 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/capsule')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          캡슐 워드로브
        </button>
        {/* "새로 만들기" 버튼 제거 (2026-07-06, P0): 캡슐은 (사용자,날짜) 캐시라
            눌러도 같은 캡슐이 반환되던 거짓 버튼 — 루틴의 가치는 일관성이라 재생성 개념 자체가 불필요 */}
        <div>
          <h1 className="text-2xl font-bold">오늘의 캡슐</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {daily?.date
              ? new Date(daily.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
          </p>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDaily} variant="outline" size="sm">
            다시 시도하기
          </Button>
        </div>
      )}

      {/* 빈 상태: 오늘 캡슐 없음 */}
      {!isLoading && !error && !daily && (
        <div className="text-center py-12">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="font-semibold mb-2">아직 오늘의 캡슐이 없어요</h3>
          <p className="text-sm text-muted-foreground mb-4">
            버튼을 눌러 오늘의 뷰티·웰니스 루틴을 만들어보세요.
          </p>
          <Button onClick={generateDaily} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                생성 중...
              </>
            ) : (
              '오늘의 캡슐 만들기'
            )}
          </Button>
        </div>
      )}

      {/* 진행률 바 */}
      {!isLoading && daily && totalCount > 0 && (
        <>
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                진행률 {completedCount}/{totalCount}
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Card>

          {/* 아이템 목록 — 아침/저녁/언제든 시간대 그룹 (18개 평면 목록의 부담 해소) */}
          <div className="space-y-5">
            {TIME_GROUPS.map((group) => {
              const groupItems = daily.items.filter(
                (item) => (item.timeOfDay ?? 'anytime') === group.key
              );
              if (groupItems.length === 0) return null;
              const groupDone = groupItems.filter((i) => checkedItems.has(i.id)).length;

              return (
                <section key={group.key} aria-label={group.label}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold">{group.label}</h2>
                    <span className="text-xs text-muted-foreground">
                      {groupDone}/{groupItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupItems.map((item) => {
                      const isChecked = checkedItems.has(item.id);
                      const moduleColor = MODULE_COLORS[item.moduleCode] ?? '#6366F1';
                      const moduleName = MODULE_NAMES[item.moduleCode] ?? item.moduleCode;

                      return (
                        <Card
                          key={item.id}
                          className={`p-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-slate-50 dark:bg-slate-800/50 opacity-75'
                              : 'hover:shadow-sm'
                          }`}
                          onClick={() => toggleItem(item.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* 체크 아이콘 */}
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isChecked
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isChecked ? (
                                <Check className="h-3.5 w-3.5 text-white" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-transparent" />
                              )}
                            </div>

                            {/* 아이템 정보 */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  isChecked ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {item.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${moduleColor}20`,
                                    color: moduleColor,
                                  }}
                                >
                                  {moduleName}
                                </span>
                                {item.reason && (
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {item.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
