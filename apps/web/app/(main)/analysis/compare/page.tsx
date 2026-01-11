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
  Activity,
  Sparkles,
  Heart,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import type {
  AnalysisType,
  AnalysisCompareResponse,
  AnalysisHistoryItem,
  AnalysisHistoryResponse,
} from '@/types/analysis-history';

// BeforeAfterViewer 동적 import
const BeforeAfterViewer = dynamic(() => import('@/components/common/BeforeAfterViewer'), {
  ssr: false,
  loading: () => <div className="h-72 bg-muted animate-pulse rounded-xl" />,
});

// TimelineChart 동적 import
const TimelineChart = dynamic(() => import('@/components/common/TimelineChart'), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl" />,
});

// 분석 타입 라벨
const TYPE_LABELS: Record<AnalysisType, string> = {
  skin: '피부',
  body: '체형',
  'personal-color': '퍼스널 컬러',
  hair: '헤어',
  makeup: '메이크업',
};

// 분석 타입 아이콘
const TYPE_ICONS: Record<AnalysisType, React.ElementType> = {
  skin: Sparkles,
  body: Activity,
  'personal-color': Heart,
  hair: Scissors,
  makeup: Sparkles,
};

// 분석 타입별 색상
const TYPE_COLORS: Record<AnalysisType, string> = {
  skin: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  body: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  'personal-color': 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
  hair: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
  makeup: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
};

// 변화 아이템 컴포넌트
function ChangeItem({
  label,
  before,
  after,
  unit = '점',
  positiveIsGood = true,
}: {
  label: string;
  before: number;
  after: number;
  unit?: string;
  positiveIsGood?: boolean;
}) {
  const change = after - before;
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
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
          <Icon className="h-3 w-3" aria-hidden="true" />
          {change > 0 ? '+' : ''}
          {change}
          {unit}
        </span>
      </div>
    </div>
  );
}

// 세부 변화 렌더링
function DetailChanges({
  type,
  before,
  after,
}: {
  type: AnalysisType;
  before: AnalysisHistoryItem;
  after: AnalysisHistoryItem;
}) {
  if (type === 'skin' && 'details' in before && 'details' in after) {
    const beforeDetails = (before as { details: Record<string, number> }).details;
    const afterDetails = (after as { details: Record<string, number> }).details;

    return (
      <>
        <ChangeItem label="수분" before={beforeDetails.hydration} after={afterDetails.hydration} />
        <ChangeItem
          label="유분"
          before={beforeDetails.oilLevel}
          after={afterDetails.oilLevel}
          positiveIsGood={false}
        />
        <ChangeItem label="모공" before={beforeDetails.pores} after={afterDetails.pores} />
        <ChangeItem
          label="색소침착"
          before={beforeDetails.pigmentation}
          after={afterDetails.pigmentation}
        />
        <ChangeItem label="주름" before={beforeDetails.wrinkles} after={afterDetails.wrinkles} />
        <ChangeItem
          label="민감도"
          before={beforeDetails.sensitivity}
          after={afterDetails.sensitivity}
          positiveIsGood={false}
        />
      </>
    );
  }

  if (type === 'body' && 'details' in before && 'details' in after) {
    const beforeDetails = (before as { details: Record<string, number | undefined> }).details;
    const afterDetails = (after as { details: Record<string, number | undefined> }).details;

    return (
      <>
        <ChangeItem
          label="어깨"
          before={beforeDetails.shoulder || 0}
          after={afterDetails.shoulder || 0}
        />
        <ChangeItem
          label="허리"
          before={beforeDetails.waist || 0}
          after={afterDetails.waist || 0}
        />
        <ChangeItem label="힙" before={beforeDetails.hip || 0} after={afterDetails.hip || 0} />
        {beforeDetails.weight && afterDetails.weight && (
          <ChangeItem
            label="체중"
            before={beforeDetails.weight}
            after={afterDetails.weight}
            unit="kg"
            positiveIsGood={false}
          />
        )}
      </>
    );
  }

  if (type === 'hair' && 'details' in before && 'details' in after) {
    const beforeDetails = (before as { details: Record<string, number> }).details;
    const afterDetails = (after as { details: Record<string, number> }).details;

    return (
      <>
        <ChangeItem
          label="두피 건강"
          before={beforeDetails.scalpHealth}
          after={afterDetails.scalpHealth}
        />
        <ChangeItem
          label="모발 밀도"
          before={beforeDetails.hairDensity}
          after={afterDetails.hairDensity}
        />
        <ChangeItem
          label="모발 두께"
          before={beforeDetails.hairThickness}
          after={afterDetails.hairThickness}
        />
        <ChangeItem
          label="손상도"
          before={beforeDetails.damageLevel}
          after={afterDetails.damageLevel}
          positiveIsGood={false}
        />
      </>
    );
  }

  return null;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터
  const typeParam = (searchParams.get('type') as AnalysisType) || 'skin';
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  // 상태
  const [activeType, setActiveType] = useState<AnalysisType>(typeParam);
  const [compareData, setCompareData] = useState<AnalysisCompareResponse | null>(null);
  const [historyData, setHistoryData] = useState<AnalysisHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지원하는 분석 타입 (personal-color 제외)
  const supportedTypes: AnalysisType[] = ['skin', 'body', 'hair'];

  // 비교 데이터 로드
  useEffect(() => {
    if (!fromId || !toId) {
      setError('비교할 분석 정보가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 비교 데이터 조회
        const compareRes = await fetch(
          `/api/analysis/compare?type=${activeType}&from=${fromId}&to=${toId}`
        );
        if (!compareRes.ok) {
          throw new Error('비교 데이터를 불러오지 못했습니다.');
        }
        const compareResult: AnalysisCompareResponse = await compareRes.json();
        setCompareData(compareResult);

        // 이력 데이터 조회 (타임라인 차트용)
        const historyRes = await fetch(
          `/api/analysis/history?type=${activeType}&period=6m&limit=20`
        );
        if (historyRes.ok) {
          const historyResult: AnalysisHistoryResponse = await historyRes.json();
          setHistoryData(historyResult);
        }
      } catch (err) {
        console.error('[Compare] Error:', err);
        setError('비교 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeType, fromId, toId]);

  // 공유 핸들러
  const handleShare = async () => {
    if (navigator.share && compareData) {
      try {
        await navigator.share({
          title: `이룸 - ${TYPE_LABELS[activeType]} 변화 비교`,
          text: `${compareData.changes.period} 동안 ${TYPE_LABELS[activeType]} 점수가 ${compareData.changes.overall > 0 ? '+' : ''}${compareData.changes.overall}점 변화했어요!`,
          url: window.location.href,
        });
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 타입 변경 시 URL 업데이트 (선택사항)
  const handleTypeChange = (type: AnalysisType) => {
    setActiveType(type);
    // URL 파라미터 유지하면서 type만 변경
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`/analysis/compare?${params.toString()}`);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 에러 상태
  if (error || !compareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const before = compareData.before;
  const after = compareData.after;
  const overallChange = compareData.changes.overall;
  const TypeIcon = TYPE_ICONS[activeType];

  // 타임라인 데이터 변환
  const timelineData =
    historyData?.analyses.map((a) => ({
      date: a.date,
      score: a.overallScore,
      label: TYPE_LABELS[activeType],
      hasData: true,
    })) || [];

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="analysis-compare-page">
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
            <h1 className="text-lg font-semibold">분석 비교</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="공유하기">
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* 분석 타입 탭 */}
        <Tabs
          value={activeType}
          onValueChange={(v) => handleTypeChange(v as AnalysisType)}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3">
            {supportedTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 기간 요약 */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            {formatDate(before.date)} → {formatDate(after.date)}
          </p>
          <p className="text-lg font-semibold">{compareData.changes.period} 간의 변화</p>
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
            altPrefix={TYPE_LABELS[activeType]}
          />
        )}

        {/* 전체 점수 변화 */}
        <Card className={cn('bg-gradient-to-r', TYPE_COLORS[activeType])}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TypeIcon className="h-4 w-4" aria-hidden="true" />
              전체 {TYPE_LABELS[activeType]} 점수
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

        {/* 타임라인 차트 */}
        {timelineData.length > 1 && (
          <TimelineChart
            title="점수 변화 추이"
            data={timelineData.reverse()}
            variant={activeType === 'skin' ? 'skin' : activeType === 'body' ? 'body' : 'hair'}
            trend={historyData?.trend || 'stable'}
            height={180}
            unit="점"
          />
        )}

        {/* 세부 변화 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">세부 항목 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailChanges type={activeType} before={before} after={after} />
          </CardContent>
        </Card>

        {/* 인사이트 */}
        {compareData.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {compareData.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 새 분석 버튼 */}
        <Button className={cn('w-full')} onClick={() => router.push(`/analysis/${activeType}`)}>
          새로운 {TYPE_LABELS[activeType]} 분석하기
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

export default function AnalysisComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
