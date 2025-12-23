/**
 * R-2 리포트 목록 페이지
 * Task R-2.5: 리포트 목록 페이지
 *
 * /reports
 * - 주간/월간 리포트 목록 표시
 * - 최근 리포트로 빠른 이동
 */

'use client';

import { useRouter } from 'next/navigation';
import { Calendar, FileBarChart, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const router = useRouter();

  // 현재 주 시작일 계산 (월요일 기준)
  const currentWeekStart = getThisWeekStart(new Date())
    .toISOString()
    .split('T')[0];

  // 현재 월 계산
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 지난 주 시작일
  const lastWeekStart = getPreviousWeekStart(currentWeekStart);

  // 지난 달
  const lastMonth = getPreviousMonth(currentMonth);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="reports-page">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="h-6 w-6" />
          리포트
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          식단과 운동 기록을 분석한 리포트를 확인하세요.
        </p>
      </div>

      {/* 빠른 액세스 */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-medium text-muted-foreground">빠른 액세스</h2>

        {/* 이번 주 리포트 */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push(`/reports/weekly/${currentWeekStart}`)}
          role="button"
          tabIndex={0}
          aria-label="이번 주 리포트 보기"
          onKeyDown={(e) => e.key === 'Enter' && router.push(`/reports/weekly/${currentWeekStart}`)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="font-medium">이번 주 리포트</div>
                <div className="text-xs text-muted-foreground">
                  {formatWeekRange(currentWeekStart)}
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>

        {/* 이번 달 리포트 */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push(`/reports/monthly/${currentMonth}`)}
          role="button"
          tabIndex={0}
          aria-label="이번 달 리포트 보기"
          onKeyDown={(e) => e.key === 'Enter' && router.push(`/reports/monthly/${currentMonth}`)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-orange-500" aria-hidden="true" />
              </div>
              <div>
                <div className="font-medium">이번 달 리포트</div>
                <div className="text-xs text-muted-foreground">
                  {formatMonthTitle(currentMonth)}
                </div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>

      {/* 주간 리포트 섹션 */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-medium text-muted-foreground">주간 리포트</h2>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 주간 리포트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ReportListItem
              title={formatWeekRange(currentWeekStart)}
              subtitle="이번 주"
              onClick={() => router.push(`/reports/weekly/${currentWeekStart}`)}
            />
            <ReportListItem
              title={formatWeekRange(lastWeekStart)}
              subtitle="지난 주"
              onClick={() => router.push(`/reports/weekly/${lastWeekStart}`)}
            />
            <ReportListItem
              title={formatWeekRange(getPreviousWeekStart(lastWeekStart))}
              subtitle="2주 전"
              onClick={() =>
                router.push(`/reports/weekly/${getPreviousWeekStart(lastWeekStart)}`)
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* 월간 리포트 섹션 */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">월간 리포트</h2>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 월간 리포트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ReportListItem
              title={formatMonthTitle(currentMonth)}
              subtitle="이번 달"
              onClick={() => router.push(`/reports/monthly/${currentMonth}`)}
            />
            <ReportListItem
              title={formatMonthTitle(lastMonth)}
              subtitle="지난 달"
              onClick={() => router.push(`/reports/monthly/${lastMonth}`)}
            />
            <ReportListItem
              title={formatMonthTitle(getPreviousMonth(lastMonth))}
              subtitle="2달 전"
              onClick={() =>
                router.push(`/reports/monthly/${getPreviousMonth(lastMonth)}`)
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* 안내 문구 */}
      <p className="text-xs text-center text-muted-foreground mt-8">
        리포트는 기록된 데이터를 기반으로 생성됩니다.
        <br />
        꾸준한 기록으로 더 정확한 분석을 받아보세요!
      </p>
    </div>
  );
}

// 리포트 목록 아이템 컴포넌트
function ReportListItem({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between h-auto py-3"
      onClick={onClick}
    >
      <div className="text-left">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

// 유틸리티 함수
function getThisWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // 월요일 기준
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPreviousWeekStart(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}월 ${startDay}일 - ${endDay}일`;
  }
  return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
}

function formatMonthTitle(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}년 ${parseInt(month, 10)}월`;
}
