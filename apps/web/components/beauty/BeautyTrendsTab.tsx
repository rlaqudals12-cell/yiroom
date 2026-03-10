'use client';

import { FadeInUp } from '@/components/animations';
import { TimeDealSection } from '@/components/beauty/TimeDealSection';
import { BeautyFeed } from '@/components/beauty/BeautyFeed';

// 트렌드 탭 — 타임딜 + 뷰티 피드
export default function BeautyTrendsTab() {
  return (
    <div className="space-y-4 p-4" data-testid="beauty-trends-tab">
      {/* 타임딜 */}
      <FadeInUp delay={1}>
        <TimeDealSection />
      </FadeInUp>

      {/* SNS형 뷰티 피드 */}
      <FadeInUp delay={2}>
        <BeautyFeed limit={6} />
      </FadeInUp>
    </div>
  );
}
