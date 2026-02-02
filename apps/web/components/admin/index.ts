/**
 * 관리자 컴포넌트 모듈
 * Sprint E Day 10: 수익화 준비
 * K-5: 관리자/프로필 페이지 컴포넌트 추가
 */

// 대시보드 & 사용자 관리 (K-5)
export { AdminDashboard } from './AdminDashboard';
export { UserManagement } from './UserManagement';

// 차트 컴포넌트 (정적 import - 직접 사용 시)
export { AffiliateChart } from './AffiliateChart';

// 차트 컴포넌트 (Dynamic Import - 페이지에서 사용 권장)
export { AffiliateChartDynamic } from './dynamic';

// Analytics 컴포넌트
export {
  ActiveUserStatsCard,
  FeatureUsageCard,
  ActiveUserTrendChart,
  FeatureUsageTrendChart,
  ActiveUserTrendChartDynamic,
  FeatureUsageTrendChartDynamic,
} from './analytics';
