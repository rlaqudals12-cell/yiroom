'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import dynamic from 'next/dynamic';
import { ArrowLeft, Share2, Loader2, Palette, Eye, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import type { AnalysisCompareResponse, MakeupAnalysisHistoryItem } from '@/types/analysis-history';

// BeforeAfterViewer 동적 import
const BeforeAfterViewer = dynamic(() => import('@/components/common/BeforeAfterViewer'), {
  ssr: false,
  loading: () => <div className="h-72 bg-muted animate-pulse rounded-xl" />,
});

// 스타일 비교 아이템 컴포넌트
function StyleCompareItem({
  label,
  before,
  after,
  icon: Icon,
  iconColor,
}: {
  label: string;
  before: string;
  after: string;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  const isChanged = before !== after;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-4 w-4', iconColor)} aria-hidden="true" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {before || '-'}
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge
          variant={isChanged ? 'default' : 'outline'}
          className={cn('text-xs', isChanged && 'bg-pink-500')}
        >
          {after || '-'}
        </Badge>
      </div>
    </div>
  );
}

function MakeupCompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const [data, setData] = useState<AnalysisCompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromId || !toId) {
      setError('비교할 분석 정보가 없어요.');
      setLoading(false);
      return;
    }

    const fetchCompare = async () => {
      try {
        const res = await fetch(`/api/analysis/compare?type=makeup&from=${fromId}&to=${toId}`);
        if (!res.ok) {
          throw new Error('비교 결과를 불러올 수 없어요.');
        }
        const result: AnalysisCompareResponse = await res.json();
        setData(result);
      } catch (err) {
        console.error('[Makeup Compare] Error:', err);
        setError('비교 결과를 불러올 수 없어요.');
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
          title: '이룸 - 메이크업 변화 비교',
          text: `${data.changes.period} 간의 메이크업 스타일 변화를 확인해보세요!`,
          url: window.location.href,
        });
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getDateLocale(locale), {
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

  const before = data.before as MakeupAnalysisHistoryItem;
  const after = data.after as MakeupAnalysisHistoryItem;

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="makeup-compare-page">
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
            <h1 className="text-lg font-semibold">메이크업 비교</h1>
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
            altPrefix="메이크업"
          />
        )}

        {/* 스타일 요약 */}
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" aria-hidden="true" />
              스타일 변화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              {data.changes.period} 동안 메이크업 스타일이 어떻게 변화했는지 확인해보세요
            </p>
          </CardContent>
        </Card>

        {/* 스타일 비교 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">스타일 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <StyleCompareItem
              label="언더톤"
              before={before.details.undertone}
              after={after.details.undertone}
              icon={Palette}
              iconColor="text-pink-500"
            />
            <StyleCompareItem
              label="얼굴형"
              before={before.details.faceShape}
              after={after.details.faceShape}
              icon={Heart}
              iconColor="text-red-400"
            />
            {(before.details.eyeShape || after.details.eyeShape) && (
              <StyleCompareItem
                label="눈 모양"
                before={before.details.eyeShape || ''}
                after={after.details.eyeShape || ''}
                icon={Eye}
                iconColor="text-purple-500"
              />
            )}
            {(before.details.lipShape || after.details.lipShape) && (
              <StyleCompareItem
                label="입술 모양"
                before={before.details.lipShape || ''}
                after={after.details.lipShape || ''}
                icon={Heart}
                iconColor="text-rose-500"
              />
            )}
          </CardContent>
        </Card>

        {/* 인사이트 */}
        {data.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">💄 메이크업 팁</CardTitle>
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
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          onClick={() => router.push('/analysis/makeup')}
        >
          새로운 메이크업 분석하기
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function MakeupComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MakeupCompareContent />
    </Suspense>
  );
}
