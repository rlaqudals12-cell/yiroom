/**
 * Wellness 모듈 Dynamic Import
 * 초기 로드 불필요한 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: recharts 번들 분리 (~100KB 감소)
 */

import dynamic from 'next/dynamic';

// 트렌드 차트 (recharts 사용으로 지연 로딩 필수)
export const WellnessTrendChartDynamic = dynamic(
  () => import('./WellnessTrendChart').then((mod) => ({ default: mod.WellnessTrendChart })),
  {
    ssr: false,
    loading: () => null,
  }
);

// 인사이트 (스크롤 아래에 위치)
export const WellnessInsightDynamic = dynamic(
  () => import('./WellnessInsight').then((mod) => ({ default: mod.WellnessInsight })),
  {
    ssr: false,
    loading: () => null,
  }
);

// 영역별 상세 점수 (선택적 표시)
export const WellnessBreakdownDynamic = dynamic(
  () => import('./WellnessBreakdown').then((mod) => ({ default: mod.WellnessBreakdown })),
  {
    ssr: false,
    loading: () => null,
  }
);
