'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// 최근 본 제품 - lazy loading (비필수 콘텐츠)
const RecentlyViewed = dynamic(
  () => import('@/components/products/RecentlyViewed').then((mod) => ({ default: mod.RecentlyViewed })),
  {
    ssr: false,
    loading: () => <RecentlyViewedSkeleton />,
  }
);

// 스켈레톤 - 최근 본 제품
function RecentlyViewedSkeleton() {
  return (
    <div>
      <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-28 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2"
          >
            <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 홈 최근 본 제품 - Client Component
 * lazy loading으로 비필수 콘텐츠 지연 로딩
 */
export default function HomeRecentlyViewed() {
  return (
    <section className="animate-fade-in-up animation-delay-400">
      <Suspense fallback={<RecentlyViewedSkeleton />}>
        <RecentlyViewed limit={6} />
      </Suspense>
    </section>
  );
}
