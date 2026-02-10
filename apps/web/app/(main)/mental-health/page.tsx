'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { CheckinForm, type CheckinData } from '@/components/mental-health';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, Flame } from 'lucide-react';

interface TodayData {
  hasCheckin: boolean;
  streak: number;
  log: {
    moodScore: number | null;
    stressLevel: number | null;
    sleepHours: number | null;
    sleepQuality: number | null;
    energyLevel: number | null;
    notes: string | null;
  } | null;
}

interface TrendData {
  period: string;
  avgMoodScore: number;
  avgStressLevel: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgEnergyLevel: number;
  totalLogs: number;
}

export default function MentalHealthPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [weekTrend, setWeekTrend] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checkin');

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const [todayRes, trendRes] = await Promise.all([
          fetch('/api/mental-health'),
          fetch('/api/mental-health?period=week'),
        ]);

        if (todayRes.ok) {
          const data = await todayRes.json();
          setTodayData(data);
        }

        if (trendRes.ok) {
          const data = await trendRes.json();
          setWeekTrend(data);
        }
      } catch (error) {
        console.error('[M-1] Load error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isLoaded, isSignedIn]);

  // 체크인 제출
  const handleSubmit = async (data: CheckinData) => {
    const res = await fetch('/api/mental-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to save checkin');
    }

    // 데이터 새로고침
    const [todayRes, trendRes] = await Promise.all([
      fetch('/api/mental-health'),
      fetch('/api/mental-health?period=week'),
    ]);

    if (todayRes.ok) setTodayData(await todayRes.json());
    if (trendRes.ok) setWeekTrend(await trendRes.json());
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="mental-health-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">마음 체크인</h1>
          <p className="text-muted-foreground mt-1">오늘의 컨디션을 기록해보세요</p>
        </header>

        {/* 연속 체크인 배지 */}
        {todayData && todayData.streak > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">{todayData.streak}일 연속 체크인!</p>
              <p className="text-xs text-muted-foreground">꾸준함이 건강의 시작이에요</p>
            </div>
          </div>
        )}

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              오늘
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              트렌드
            </TabsTrigger>
          </TabsList>

          {/* 체크인 탭 */}
          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {todayData?.hasCheckin ? '오늘 체크인 완료!' : '오늘의 체크인'}
                </CardTitle>
                <CardDescription>
                  {todayData?.hasCheckin
                    ? '수정하고 싶다면 다시 입력해주세요'
                    : '하루 한 번, 나의 상태를 기록해보세요'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CheckinForm
                  onSubmit={handleSubmit}
                  initialData={
                    todayData?.log
                      ? {
                          moodScore: todayData.log.moodScore ?? undefined,
                          stressLevel: todayData.log.stressLevel ?? 5,
                          sleepHours: todayData.log.sleepHours ?? 7,
                          sleepQuality: todayData.log.sleepQuality ?? 3,
                          energyLevel: todayData.log.energyLevel ?? 3,
                          notes: todayData.log.notes ?? undefined,
                        }
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 트렌드 탭 */}
          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">주간 트렌드</CardTitle>
                <CardDescription>최근 7일간의 평균 데이터</CardDescription>
              </CardHeader>
              <CardContent>
                {weekTrend && weekTrend.totalLogs > 0 ? (
                  <div className="space-y-4">
                    <TrendItem
                      label="평균 기분"
                      value={weekTrend.avgMoodScore}
                      max={5}
                      suffix="/5"
                    />
                    <TrendItem
                      label="평균 스트레스"
                      value={weekTrend.avgStressLevel}
                      max={10}
                      suffix="/10"
                      inverse
                    />
                    <TrendItem
                      label="평균 수면"
                      value={weekTrend.avgSleepHours}
                      max={12}
                      suffix="시간"
                    />
                    <TrendItem
                      label="평균 수면 품질"
                      value={weekTrend.avgSleepQuality}
                      max={5}
                      suffix="/5"
                    />
                    <TrendItem
                      label="평균 에너지"
                      value={weekTrend.avgEnergyLevel}
                      max={5}
                      suffix="/5"
                    />
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      총 {weekTrend.totalLogs}일 기록
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    아직 기록이 없어요.
                    <br />
                    오늘부터 시작해보세요!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 면책 조항 */}
        <p className="text-xs text-muted-foreground text-center mt-6 px-4">
          ⚠️ 이 기능은 자가 기록 용도이며, 의료 진단이나 치료를 대체하지 않습니다.
          <br />
          심각한 정신건강 문제가 있다면 전문가와 상담하세요.
        </p>
      </div>
    </div>
  );
}

// 트렌드 아이템 컴포넌트
function TrendItem({
  label,
  value,
  max,
  suffix,
  inverse = false,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
  inverse?: boolean;
}) {
  const percentage = (value / max) * 100;
  // 역방향이면 낮을수록 좋음 (스트레스)
  const color = inverse
    ? percentage < 40
      ? 'bg-green-500'
      : percentage < 70
        ? 'bg-yellow-500'
        : 'bg-red-500'
    : percentage > 60
      ? 'bg-green-500'
      : percentage > 40
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
