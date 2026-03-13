'use client';

/**
 * 코호트 리텐션 분석 카드
 * @description 주별 가입 코호트의 7/14/30일 리텐션율 표시
 */

import { UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CohortRetentionData } from '@/lib/admin/user-activity-stats';
import { cn } from '@/lib/utils';

interface CohortRetentionCardProps {
  data: CohortRetentionData[] | null;
  isLoading?: boolean;
}

// 리텐션율에 따른 색상 (높을수록 진한 초록)
function getRetentionColor(rate: number): string {
  if (rate < 0) return 'text-muted-foreground bg-muted/30'; // 아직 미도래
  if (rate >= 50) return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  if (rate >= 30) return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
  if (rate >= 10) return 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
  return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function CohortRetentionCard({ data, isLoading }: CohortRetentionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-primary" />
            코호트 리텐션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">리텐션 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="cohort-retention-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5 text-primary" />
          코호트 리텐션 (주별)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          가입 주 기준 7일/14일/30일 후 활성 사용자 비율
        </p>
      </CardHeader>
      <CardContent>
        {/* 테이블 형태 리텐션 매트릭스 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">가입 주</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">가입자</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">D7</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">D14</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">D30</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cohort) => (
                <tr key={cohort.cohortWeek} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-medium">{formatWeekLabel(cohort.cohortWeek)}~</td>
                  <td className="py-2 px-3 text-right tabular-nums">{cohort.cohortSize}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block min-w-[3rem] px-2 py-0.5 rounded text-xs font-medium tabular-nums',
                        getRetentionColor(cohort.day7)
                      )}
                    >
                      {cohort.day7 < 0 ? '-' : `${cohort.day7}%`}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block min-w-[3rem] px-2 py-0.5 rounded text-xs font-medium tabular-nums',
                        getRetentionColor(cohort.day14)
                      )}
                    >
                      {cohort.day14 < 0 ? '-' : `${cohort.day14}%`}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={cn(
                        'inline-block min-w-[3rem] px-2 py-0.5 rounded text-xs font-medium tabular-nums',
                        getRetentionColor(cohort.day30)
                      )}
                    >
                      {cohort.day30 < 0 ? '-' : `${cohort.day30}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
