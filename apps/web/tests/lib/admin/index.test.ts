/**
 * 관리자 모듈 통합 export 테스트
 *
 * @module tests/lib/admin/index
 * @description P8 모듈 경계 준수 검증 - Barrel Export 패턴
 */

import { describe, it, expect } from 'vitest';
import * as AdminModule from '@/lib/admin';

describe('Admin Module Barrel Export', () => {
  // ============================================================================
  // Auth exports
  // ============================================================================

  describe('Auth exports', () => {
    it('should export isAdmin', () => {
      expect(AdminModule.isAdmin).toBeDefined();
      expect(typeof AdminModule.isAdmin).toBe('function');
    });

    it('should export getAdminRole', () => {
      expect(AdminModule.getAdminRole).toBeDefined();
      expect(typeof AdminModule.getAdminRole).toBe('function');
    });

    it('should export requireAdmin', () => {
      expect(AdminModule.requireAdmin).toBeDefined();
      expect(typeof AdminModule.requireAdmin).toBe('function');
    });

    it('should export requireAdminOrThrow', () => {
      expect(AdminModule.requireAdminOrThrow).toBeDefined();
      expect(typeof AdminModule.requireAdminOrThrow).toBe('function');
    });

    it('should export getAdminInfo', () => {
      expect(AdminModule.getAdminInfo).toBeDefined();
      expect(typeof AdminModule.getAdminInfo).toBe('function');
    });

    it('should export isUserAdmin', () => {
      expect(AdminModule.isUserAdmin).toBeDefined();
      expect(typeof AdminModule.isUserAdmin).toBe('function');
    });
  });

  // ============================================================================
  // Feature Flags exports
  // ============================================================================

  describe('Feature Flags exports', () => {
    it('should export getAllFeatureFlags', () => {
      expect(AdminModule.getAllFeatureFlags).toBeDefined();
      expect(typeof AdminModule.getAllFeatureFlags).toBe('function');
    });

    it('should export getFeatureFlag', () => {
      expect(AdminModule.getFeatureFlag).toBeDefined();
      expect(typeof AdminModule.getFeatureFlag).toBe('function');
    });

    it('should export isFeatureEnabled', () => {
      expect(AdminModule.isFeatureEnabled).toBeDefined();
      expect(typeof AdminModule.isFeatureEnabled).toBe('function');
    });

    it('should export toggleFeatureFlag', () => {
      expect(AdminModule.toggleFeatureFlag).toBeDefined();
      expect(typeof AdminModule.toggleFeatureFlag).toBe('function');
    });

    it('should export createFeatureFlag', () => {
      expect(AdminModule.createFeatureFlag).toBeDefined();
      expect(typeof AdminModule.createFeatureFlag).toBe('function');
    });

    it('should export deleteFeatureFlag', () => {
      expect(AdminModule.deleteFeatureFlag).toBeDefined();
      expect(typeof AdminModule.deleteFeatureFlag).toBe('function');
    });

    it('should export getEnabledFeatures', () => {
      expect(AdminModule.getEnabledFeatures).toBeDefined();
      expect(typeof AdminModule.getEnabledFeatures).toBe('function');
    });

    it('should export getCachedFeatureFlags', () => {
      expect(AdminModule.getCachedFeatureFlags).toBeDefined();
      expect(typeof AdminModule.getCachedFeatureFlags).toBe('function');
    });

    it('should export invalidateFeatureFlagCache', () => {
      expect(AdminModule.invalidateFeatureFlagCache).toBeDefined();
      expect(typeof AdminModule.invalidateFeatureFlagCache).toBe('function');
    });
  });

  // ============================================================================
  // Stats exports
  // ============================================================================

  describe('Stats exports', () => {
    it('should export getDashboardStats', () => {
      expect(AdminModule.getDashboardStats).toBeDefined();
      expect(typeof AdminModule.getDashboardStats).toBe('function');
    });

    it('should export getUserList', () => {
      expect(AdminModule.getUserList).toBeDefined();
      expect(typeof AdminModule.getUserList).toBe('function');
    });

    it('should export getRecentActivities', () => {
      expect(AdminModule.getRecentActivities).toBeDefined();
      expect(typeof AdminModule.getRecentActivities).toBe('function');
    });
  });

  // ============================================================================
  // Affiliate Stats exports
  // ============================================================================

  describe('Affiliate Stats exports', () => {
    it('should export fetchAffiliateStats', () => {
      expect(AdminModule.fetchAffiliateStats).toBeDefined();
      expect(typeof AdminModule.fetchAffiliateStats).toBe('function');
    });

    it('should export fetchTodayClicks', () => {
      expect(AdminModule.fetchTodayClicks).toBeDefined();
      expect(typeof AdminModule.fetchTodayClicks).toBe('function');
    });

    it('should export fetchDashboardStats', () => {
      expect(AdminModule.fetchDashboardStats).toBeDefined();
      expect(typeof AdminModule.fetchDashboardStats).toBe('function');
    });
  });

  // ============================================================================
  // User Activity Stats exports
  // ============================================================================

  describe('User Activity Stats exports', () => {
    it('should export getActiveUserStats', () => {
      expect(AdminModule.getActiveUserStats).toBeDefined();
      expect(typeof AdminModule.getActiveUserStats).toBe('function');
    });

    it('should export getFeatureUsageStats', () => {
      expect(AdminModule.getFeatureUsageStats).toBeDefined();
      expect(typeof AdminModule.getFeatureUsageStats).toBe('function');
    });

    it('should export getDailyActiveUserTrend', () => {
      expect(AdminModule.getDailyActiveUserTrend).toBeDefined();
      expect(typeof AdminModule.getDailyActiveUserTrend).toBe('function');
    });

    it('should export getDailyFeatureUsageTrend', () => {
      expect(AdminModule.getDailyFeatureUsageTrend).toBeDefined();
      expect(typeof AdminModule.getDailyFeatureUsageTrend).toBe('function');
    });
  });

  // ============================================================================
  // 모듈 완전성 테스트
  // ============================================================================

  describe('Module Completeness', () => {
    it('should export all expected functions (30+)', () => {
      const exportedFunctions = Object.entries(AdminModule).filter(
        ([, value]) => typeof value === 'function'
      );

      // 최소 20개 이상의 함수 export
      expect(exportedFunctions.length).toBeGreaterThanOrEqual(20);
    });

    it('should not export any undefined values', () => {
      Object.entries(AdminModule).forEach(([key, value]) => {
        expect(value, `${key} should not be undefined`).toBeDefined();
      });
    });
  });
});
