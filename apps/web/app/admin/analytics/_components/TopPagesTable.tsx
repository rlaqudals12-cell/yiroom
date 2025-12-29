'use client';

/**
 * 인기 페이지 테이블 컴포넌트
 * @description TOP 10 인기 페이지 목록
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TopPage } from '@/types/analytics';

interface TopPagesTableProps {
  pages: TopPage[] | null;
  isLoading?: boolean;
}

// 페이지 경로를 읽기 좋은 이름으로 변환
function getPageName(path: string): string {
  const pageNames: Record<string, string> = {
    '/': '홈',
    '/dashboard': '대시보드',
    '/analysis/personal-color': '퍼스널컬러 분석',
    '/analysis/skin': '피부 분석',
    '/analysis/body': '체형 분석',
    '/workout': '운동',
    '/nutrition': '영양',
    '/products': '제품 추천',
    '/feed': '소셜 피드',
    '/leaderboard': '리더보드',
    '/profile': '프로필',
    '/friends': '친구',
    '/help': '도움말',
  };
  return pageNames[path] || path;
}

export function TopPagesTable({ pages, isLoading }: TopPagesTableProps) {
  if (isLoading) {
    return (
      <Card data-testid="top-pages-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <Card data-testid="top-pages-empty">
        <CardHeader>
          <CardTitle className="text-base">인기 페이지 TOP 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="top-pages-table">
      <CardHeader>
        <CardTitle className="text-base">인기 페이지 TOP 10</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* 헤더 */}
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-5">페이지</div>
            <div className="col-span-2 text-right">조회수</div>
            <div className="col-span-2 text-right">방문자</div>
            <div className="col-span-2 text-right">체류시간</div>
          </div>

          {/* 데이터 */}
          {pages.slice(0, 10).map((page, index) => (
            <div
              key={page.path}
              className="grid grid-cols-12 gap-2 py-2 text-sm border-b border-muted last:border-0"
            >
              <div className="col-span-1 text-muted-foreground">{index + 1}</div>
              <div className="col-span-5 truncate" title={page.path}>
                {getPageName(page.path)}
              </div>
              <div className="col-span-2 text-right font-medium">
                {page.pageViews.toLocaleString()}
              </div>
              <div className="col-span-2 text-right text-muted-foreground">
                {page.uniqueUsers.toLocaleString()}
              </div>
              <div className="col-span-2 text-right text-muted-foreground">
                {Math.floor(page.avgDuration / 60)}분 {page.avgDuration % 60}초
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
