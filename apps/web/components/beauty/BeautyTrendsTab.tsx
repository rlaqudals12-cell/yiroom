'use client';

import { FadeInUp } from '@/components/animations';
import { BeautyFeed } from '@/components/beauty/BeautyFeed';

// 트렌드 탭 — 뷰티 피드
// (타임딜 섹션은 가상 할인·재고·마감 타이머라는 전자상거래법상 다크패턴이라 2026-07 제거)
export default function BeautyTrendsTab() {
  return (
    <div className="space-y-4 p-4" data-testid="beauty-trends-tab">
      {/* SNS형 뷰티 피드 */}
      <FadeInUp delay={1}>
        <BeautyFeed limit={6} />
      </FadeInUp>
    </div>
  );
}
