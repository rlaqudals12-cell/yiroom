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
  RefreshCw,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DailyItem {
  id: string;
  label: string;
  domainId: string;
  category?: string;
  completed?: boolean;
}

interface DailyCapsule {
  id: string;
  date: string;
  items: DailyItem[];
}

// 도메인 색상 매핑
const DOMAIN_COLORS: Record<string, string> = {
  skin: '#60A5FA',
  fashion: '#F472B6',
  nutrition: '#4ADE80',
  workout: '#4ADE80',
  hair: '#D4A24E',
  makeup: '#D45ABF',
  'personal-color': '#F472B6',
  oral: '#4ABF7A',
  body: '#A78BFA',
};

const DOMAIN_NAMES: Record<string, string> = {
  skin: '스킨케어',
  fashion: '패션',
  nutrition: '영양',
  workout: '운동',
  hair: '헤어',
  makeup: '메이크업',
  'personal-color': '퍼스널 컬러',
  oral: '구강 건강',
  body: '체형',
};

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
        // 이미 완료된 아이템 반영
        const completed = new Set<string>();
        for (const item of json.data.items ?? []) {
          if (item.completed) completed.add(item.id);
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
        await fetch(`/api/capsule/daily/${daily.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, completed: !checkedItems.has(itemId) }),
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
        <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm" onClick={generateDaily} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1.5">새로 만들기</span>
          </Button>
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

          {/* 아이템 목록 */}
          <div className="space-y-2">
            {daily.items.map((item) => {
              const isChecked = checkedItems.has(item.id);
              const domainColor = DOMAIN_COLORS[item.domainId] ?? '#6366F1';
              const domainName = DOMAIN_NAMES[item.domainId] ?? item.domainId;

              return (
                <Card
                  key={item.id}
                  className={`p-3 cursor-pointer transition-all ${
                    isChecked ? 'bg-slate-50 dark:bg-slate-800/50 opacity-75' : 'hover:shadow-sm'
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
                        {item.label}
                      </p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${domainColor}20`,
                          color: domainColor,
                        }}
                      >
                        {domainName}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
