'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Sparkles,
  Droplet,
  Scissors,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import type { AnalysisCompareResponse, HairAnalysisHistoryItem } from '@/types/analysis-history';

// BeforeAfterViewer 동적 import
const BeforeAfterViewer = dynamic(() => import('@/components/common/BeforeAfterViewer'), {
  ssr: false,
  loading: () => <div className="h-72 bg-muted animate-pulse rounded-xl" />,
});

// 변화 아이템 컴포넌트
function ChangeItem({
  label,
  before,
  after,
  unit = '점',
  positiveIsGood = true,
  icon: Icon,
  iconColor,
}: {
  label: string;
  before: number;
  after: number;
  unit?: string;
  positiveIsGood?: boolean;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  const change = after - before;
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-4 w-4', iconColor)} aria-hidden="true" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {before} → {after}
        </span>
        <span
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isGood ? 'text-green-600' : change === 0 ? 'text-muted-foreground' : 'text-red-600'
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {change > 0 ? '+' : ''}
          {change}
          {unit}
        </span>
      </div>
    </div>
  );
}

function HairCompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const [data, setData] = useState<AnalysisCompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromId || !toId) {
      setError('비교할 분석 기록이 없어요');
      setLoading(false);
      return;
    }

    const fetchCompare = async () => {
      try {
        const res = await fetch(`/api/analysis/compare?type=hair&from=${fromId}&to=${toId}`);
        if (!res.ok) {
          throw new Error('비교 데이터를 불러오지 못했어요');
        }
        const result: AnalysisCompareResponse = await res.json();
        setData(result);
      } catch (err) {
        console.error('[Hair Compare] Error:', err);
        setError('비교 데이터를 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    };

    fetchCompare();
  }, [fromId, toId]);

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: '이룸 - 헤어 변화 비교',
          text: `${data.changes.period} 동안 헤어 점수가 ${data.changes.overall > 0 ? '+' : ''}${data.changes.overall}점 변화했어요!`,
          url: window.location.href,
        });
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const before = data.before as HairAnalysisHistoryItem;
  const after = data.after as HairAnalysisHistoryItem;
  const overallChange = data.changes.overall;

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="hair-compare-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <h1 className="text-lg font-semibold">헤어 비교</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="공유하기">
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 기간 요약 */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            {formatDate(before.date)} → {formatDate(after.date)}
          </p>
          <p className="text-lg font-semibold">{data.changes.period} 간의 변화</p>
        </div>

        {/* Before/After 이미지 비교 */}
        {before.imageUrl && after.imageUrl && (
          <BeforeAfterViewer
            beforeImage={before.imageUrl}
            afterImage={after.imageUrl}
            beforeLabel={formatDate(before.date)}
            afterLabel={formatDate(after.date)}
            mode="slider"
            height={300}
            altPrefix="헤어"
          />
        )}

        {/* 전체 점수 변화 */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
              전체 헤어 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{before.overallScore}</p>
                <p className="text-xs text-muted-foreground">이전</p>
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'text-2xl font-bold',
                    overallChange > 0
                      ? 'text-green-600'
                      : overallChange < 0
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  )}
                >
                  {overallChange > 0 ? '+' : ''}
                  {overallChange}
                </p>
                <p className="text-xs text-muted-foreground">변화</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{after.overallScore}</p>
                <p className="text-xs text-muted-foreground">이후</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 세부 변화 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">세부 항목 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangeItem
              label="두피 건강"
              before={before.details.scalpHealth}
              after={after.details.scalpHealth}
              icon={Droplet}
              iconColor="text-green-500"
            />
            <ChangeItem
              label="모발 밀도"
              before={before.details.hairDensity}
              after={after.details.hairDensity}
              icon={Scissors}
              iconColor="text-purple-500"
            />
            <ChangeItem
              label="모발 굵기"
              before={before.details.hairThickness}
              after={after.details.hairThickness}
              icon={Sparkles}
              iconColor="text-amber-500"
            />
            <ChangeItem
              label="손상도"
              before={before.details.damageLevel}
              after={after.details.damageLevel}
              positiveIsGood={false}
              icon={AlertTriangle}
              iconColor="text-red-500"
            />
          </CardContent>
        </Card>

        {/* 인사이트 */}
        {data.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">💡 헤어 관리 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 새 분석 버튼 */}
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={() => router.push('/analysis/hair')}
        >
          새로운 헤어 분석하기
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function HairComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <HairCompareContent />
    </Suspense>
  );
}
