'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GapItem {
  domainId: string;
  domainName: string;
  currentCount: number;
  optimalCount: number;
  gap: number;
  hasCapsule: boolean;
}

interface GapData {
  gaps: GapItem[];
  totalGap: number;
  completedDomains: number;
  totalDomains: number;
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

/**
 * 갭 분석 페이지
 *
 * 부족한 영역 시각화, 도메인별 추천 + 큐레이션 CTA
 */
export default function CapsuleGapPage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [gapData, setGapData] = useState<GapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curatingDomain, setCuratingDomain] = useState<string | null>(null);

  const fetchGap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/capsule/gap');
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      if (json.success) {
        setGapData(json.data);
      } else {
        setError('갭 분석 데이터를 불러올 수 없어요.');
      }
    } catch {
      setError('갭 분석 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 도메인 큐레이션 실행
  const curateDomain = useCallback(
    async (domainId: string) => {
      setCuratingDomain(domainId);

      try {
        const res = await fetch(`/api/capsule/${domainId}/curate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          // 큐레이션 성공 시 해당 도메인 페이지로 이동
          router.push(`/capsule/${domainId}`);
        } else {
          setError('큐레이션에 실패했어요. 먼저 분석을 완료해주세요.');
        }
      } catch {
        setError('큐레이션에 실패했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setCuratingDomain(null);
      }
    },
    [router]
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchGap();
    }
  }, [isLoaded, isSignedIn, fetchGap]);

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="capsule-gap">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-gap">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">갭 분석을 확인하려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-gap">
      {/* 뒤로 가기 + 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/capsule')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          캡슐 워드로브
        </button>
        <h1 className="text-2xl font-bold">갭 분석</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          부족한 영역을 파악하고 캡슐을 완성해보세요
        </p>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchGap} variant="outline" size="sm">
            다시 시도하기
          </Button>
        </div>
      )}

      {/* 갭 데이터 */}
      {!isLoading && !error && gapData && (
        <>
          {/* 전체 요약 카드 */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold">전체 현황</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {gapData.completedDomains}
                </p>
                <p className="text-xs text-muted-foreground">완성 도메인</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {gapData.totalDomains - gapData.completedDomains}
                </p>
                <p className="text-xs text-muted-foreground">미완성 도메인</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {gapData.totalGap}
                </p>
                <p className="text-xs text-muted-foreground">부족 아이템</p>
              </div>
            </div>
          </Card>

          {/* 도메인별 갭 리스트 */}
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">도메인별 상태</h3>
          <div className="space-y-2">
            {gapData.gaps.map((item) => {
              const domainColor = DOMAIN_COLORS[item.domainId] ?? '#6366F1';
              const fillPercent =
                item.optimalCount > 0
                  ? Math.min(100, (item.currentCount / item.optimalCount) * 100)
                  : 0;
              const isComplete = item.gap === 0 && item.hasCapsule;

              return (
                <Card key={item.domainId} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: domainColor }}
                        />
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${domainColor}30` }}
                        />
                      )}
                      <span className="text-sm font-medium">{item.domainName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.currentCount}/{item.optimalCount}
                    </span>
                  </div>

                  {/* 진행률 바 */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${fillPercent}%`,
                        backgroundColor: domainColor,
                      }}
                    />
                  </div>

                  {/* 갭이 있을 때 큐레이션 버튼 */}
                  {item.gap > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {item.gap}개 아이템을 추가하면 완성돼요
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => curateDomain(item.domainId)}
                        disabled={curatingDomain === item.domainId}
                      >
                        {curatingDomain === item.domainId ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <ShoppingBag className="h-3 w-3 mr-1" />
                        )}
                        큐레이션
                      </Button>
                    </div>
                  )}

                  {/* 완성 + 캡슐 보기 */}
                  {isComplete && (
                    <button
                      onClick={() => router.push(`/capsule/${item.domainId}`)}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                    >
                      캡슐 보기 <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* 빈 상태: 갭 없음 */}
      {!isLoading && !error && gapData && gapData.totalGap === 0 && (
        <Card className="p-6 text-center mt-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
          <h3 className="font-semibold mb-1">모든 캡슐이 완성되었어요!</h3>
          <p className="text-sm text-muted-foreground">훌륭해요. 꾸준히 유지해보세요.</p>
        </Card>
      )}
    </div>
  );
}
