/**
 * 관리자 모듈 통합 export
 */

// 인증
export {
  isAdmin,
  getAdminRole,
  requireAdmin,
  requireAdminOrThrow,
  getAdminInfo,
  isUserAdmin,
  type AdminRole,
} from './auth';

// Feature Flags
export {
  getAllFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  toggleFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag,
  getEnabledFeatures,
  getCachedFeatureFlags,
  invalidateFeatureFlagCache,
  type FeatureFlag,
  type FeatureFlagKey,
} from './feature-flags';

// 통계
export {
  getDashboardStats,
  getUserList,
  getRecentActivities,
  type DashboardStats,
  type UserListItem,
  type RecentActivity,
} from './stats';

// 어필리에이트 통계
export {
  fetchAffiliateStats,
  fetchTodayClicks,
  fetchDashboardStats,
  type StatsPeriod,
  type DashboardStats as AffiliateDashboardStats,
} from './affiliate-stats';
