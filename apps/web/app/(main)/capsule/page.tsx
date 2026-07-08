'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Droplets,
  Shirt,
  Scissors,
  Palette,
  Sparkles,
  PersonStanding,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 시각 정체성 도메인 정의 (ADR-098: 영양/운동/구강 제외 — 5축+패션)
const DOMAINS = [
  { id: 'skin', name: '스킨케어', icon: Droplets, color: '#60A5FA' },
  { id: 'fashion', name: '패션', icon: Shirt, color: '#F472B6' },
  { id: 'hair', name: '헤어', icon: Scissors, color: '#D4A24E' },
  { id: 'makeup', name: '메이크업', icon: Palette, color: '#D45ABF' },
  { id: 'personal-color', name: '퍼스널 컬러', icon: Sparkles, color: '#F472B6' },
  { id: 'body', name: '체형', icon: PersonStanding, color: '#A78BFA' },
] as const;

// API(/api/capsule/daily) 실제 응답 계약 — types/capsule.ts DailyItem 형태.
// 기존엔 completed를 읽어 통계가 항상 0이던 버그 (실필드 isChecked, 2026-07-08 감사 수리)
interface DailyItem {
  id: string;
  name?: string;
  moduleCode?: string;
  isChecked?: boolean;
}

interface DailyCapsule {
  id: string;
  date: string;
  items: DailyItem[];
}

interface GapData {
  gaps: Array<{
    domainId: string;
    domainName: string;
    currentCount: number;
    optimalCount: number;
    gap: number;
    hasCapsule: boolean;
  }>;
  totalGap: number;
  completedDomains: number;
  totalDomains: number;
}

/**
 * 캡슐 워드로브 대시보드
 *
 * 시각 정체성 도메인 그리드 + Daily Capsule 요약 + 갭 분석 CTA
 */
export default function CapsuleDashboardPage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [daily, setDaily] = useState<DailyCapsule | null>(null);
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dailyRes, gapRes] = await Promise.all([
        fetch('/api/capsule/daily'),
        fetch('/api/capsule/gap'),
      ]);

      if (dailyRes.ok) {
        const dailyJson = await dailyRes.json();
        if (dailyJson.success) {
          setDaily(dailyJson.data);
        }
      }

      if (gapRes.ok) {
        const gapJson = await gapRes.json();
        if (gapJson.success) {
          setGapData(gapJson.data);
        }
      }
    } catch {
      setError('캡슐 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, fetchData]);

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-testid="capsule-dashboard"
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-dashboard">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">
          캡슐 워드로브를 이용하려면 먼저 로그인해주세요.
        </p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  // 데이터 로딩
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6" data-testid="capsule-dashboard">
        <div className="mb-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
        </div>
        {/* 도메인 그리드와 동일한 6칸 (5축 + 패션) */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-dashboard">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold mb-2">문제가 발생했어요</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          다시 시도하기
        </Button>
      </div>
    );
  }

  const completedCount = daily?.items.filter((i) => i.isChecked).length ?? 0;
  const totalCount = daily?.items.length ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-dashboard">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">캡슐 워드로브</h1>
        <p className="mt-1 text-muted-foreground">나에게 꼭 맞는 뷰티·스타일 캡슐을 관리해요</p>
      </div>

      {/* Daily Capsule 요약 카드 */}
      {daily && totalCount > 0 && (
        <Card
          className="p-4 mb-6 cursor-pointer hover:shadow-md transition-shadow border-indigo-200 dark:border-indigo-800"
          onClick={() => router.push('/capsule/daily')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                <CalendarCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">오늘의 캡슐</h3>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{totalCount} 완료
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 진행률 바 */}
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>
      )}

      {/* 시각 정체성 도메인 그리드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          // 갭 데이터에서 해당 도메인 찾기
          const gapItem = gapData?.gaps.find((g) => g.domainId === domain.id);
          const hasItems = gapItem ? gapItem.currentCount > 0 : false;

          return (
            <Card
              key={domain.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] text-center"
              onClick={() => router.push(`/capsule/${domain.id}`)}
            >
              <div
                className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: `${domain.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: domain.color }} />
              </div>
              <p className="text-xs font-medium truncate">{domain.name}</p>
              {gapItem && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {hasItems ? `${gapItem.currentCount}/${gapItem.optimalCount}` : '시작하기'}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* 갭 분석 CTA */}
      {gapData && gapData.totalGap > 0 && (
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800"
          onClick={() => router.push('/capsule/gap')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">부족한 영역이 있어요</h3>
                <p className="text-xs text-muted-foreground">
                  {gapData.completedDomains}/{gapData.totalDomains} 도메인 완성 · {gapData.totalGap}
                  개 아이템 추가 필요
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Card>
      )}

      {/* 전체 완성 시 */}
      {gapData && gapData.totalGap === 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">캡슐이 완성되었어요!</h3>
              <p className="text-xs text-muted-foreground">모든 도메인의 캡슐이 최적 상태예요.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
