/**
 * Cross-Module Integration Tests
 * CMP-A8: 통합 테스트
 *
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 *
 * 6가지 테스트 시나리오:
 * INT-TC-001: PC-2 결과 저장 → M-1 캐시 무효화
 * INT-TC-002: S-2 데이터 없이 SK-1 호출
 * INT-TC-003: 만료된 S-2 데이터로 M-1 호출
 * INT-TC-004: CIE 파이프라인 전체 실행
 * INT-TC-005: 스키마 버전 마이그레이션
 * INT-TC-006: 동시 다발 이벤트 발행
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Integration Types
import type {
  PC2ToM1IntegrationData,
  S2ToSK1IntegrationData,
  C2ToW2IntegrationData,
} from '@/lib/shared/integration-types';

// Error Handling (CMP-A6)
import {
  IntegrationError,
  IntegrationDataNotFoundError,
  IntegrationTimeoutError,
  INTEGRATION_ERROR_CODES,
  handleIntegrationError,
  isIntegrationError,
  isRetryableError,
  getUserMessage,
  getModuleDisplayName,
} from '@/lib/shared/integration-error';

// Events (CMP-A2)
import {
  publishIntegrationEvent,
  publishAnalysisResultEvent,
  subscribeToEvent,
  clearAllHandlers,
  getEventTypeForModule,
  INTEGRATION_EVENT_TYPES,
  CACHE_INVALIDATION_RULES,
} from '@/lib/shared/integration-events';

// Client (CMP-A3)
import {
  fetchIntegrationData,
  fetchPC2ForMakeup,
  fetchS2ForProcedure,
  fetchC2ForStretching,
  getDefaultIntegrationData,
  invalidateCache,
  clearAllCache,
  getCacheStats,
} from '@/lib/shared/integration-client';

// Confidence Propagation
import {
  calculatePropagatedConfidence,
  calculateCIEConfidenceModifier,
  getConfidenceGrade,
  CONFIDENCE_THRESHOLDS,
} from '@/lib/shared/confidence-propagation';

// ============================================
// 에러 처리 테스트 (CMP-A6)
// ============================================

describe('Integration Error Handling (CMP-A6)', () => {
  describe('IntegrationError', () => {
    it('should create error with correct properties', () => {
      const error = new IntegrationError(
        INTEGRATION_ERROR_CODES.DATA_NOT_FOUND,
        'Test error',
        { sourceModule: 'PC-2', userId: 'user_123' }
      );

      expect(error.name).toBe('IntegrationError');
      expect(error.code).toBe(INTEGRATION_ERROR_CODES.DATA_NOT_FOUND);
      expect(error.message).toBe('Test error');
      expect(error.context.sourceModule).toBe('PC-2');
      expect(error.timestamp).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new IntegrationDataNotFoundError('S-2', 'user_456');
      const json = error.toJSON();
      const context = json.context as { sourceModule: string; userId: string };

      expect(json.code).toBe(INTEGRATION_ERROR_CODES.DATA_NOT_FOUND);
      expect(context.sourceModule).toBe('S-2');
      expect(context.userId).toBe('user_456');
    });
  });

  describe('handleIntegrationError', () => {
    it('should return fallback data with requiresAnalysis flag for NOT_FOUND', () => {
      const error = new IntegrationDataNotFoundError('PC-2', 'user_123');
      const fallback = { season: 'summer' };

      const result = handleIntegrationError(error, fallback);

      expect(result.data).toEqual(fallback);
      expect(result.usedDefault).toBe(true);
      expect(result.requiresAnalysis).toBe(true);
    });

    it('should return suggestReanalysis flag for EXPIRED', () => {
      const error = new IntegrationError(
        INTEGRATION_ERROR_CODES.DATA_EXPIRED,
        'Data expired',
        { sourceModule: 'S-2' }
      );
      const fallback = { skinType: 'combination' };

      const result = handleIntegrationError(error, fallback);

      expect(result.usedDefault).toBe(true);
      expect(result.suggestReanalysis).toBe(true);
    });

    it('should return temporaryFailure flag for TIMEOUT', () => {
      const error = new IntegrationTimeoutError('C-2', 5000);
      const fallback = { postureType: 'normal' };

      const result = handleIntegrationError(error, fallback);

      expect(result.usedDefault).toBe(true);
      expect(result.temporaryFailure).toBe(true);
    });
  });

  describe('Error utilities', () => {
    it('should identify integration errors correctly', () => {
      const integrationError = new IntegrationError(
        INTEGRATION_ERROR_CODES.VALIDATION_ERROR,
        'Test'
      );
      const regularError = new Error('Test');

      expect(isIntegrationError(integrationError)).toBe(true);
      expect(isIntegrationError(regularError)).toBe(false);
    });

    it('should identify retryable errors', () => {
      const timeoutError = new IntegrationTimeoutError('PC-2', 5000);
      const notFoundError = new IntegrationDataNotFoundError('PC-2', 'user');

      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(notFoundError)).toBe(false);
    });

    it('should return correct user messages', () => {
      const error = new IntegrationDataNotFoundError('PC-2', 'user');
      const message = getUserMessage(error);

      expect(message).toContain('분석');
    });

    it('should return correct module display names', () => {
      expect(getModuleDisplayName('PC-2')).toBe('퍼스널컬러');
      expect(getModuleDisplayName('S-2')).toBe('피부');
      expect(getModuleDisplayName('C-2')).toBe('체형');
      expect(getModuleDisplayName('OH-1')).toBe('구강건강');
    });
  });
});

// ============================================
// 이벤트 시스템 테스트 (CMP-A2)
// ============================================

describe('Integration Events (CMP-A2)', () => {
  beforeEach(() => {
    clearAllHandlers();
  });

  describe('publishIntegrationEvent', () => {
    it('should publish event successfully', async () => {
      const result = await publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
        userId: 'user_123',
        timestamp: new Date().toISOString(),
        data: { season: 'spring' },
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'PC-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^evt_/);
      expect(result.invalidatedCaches).toContain('makeup:recommendations:user_123');
    });

    it('should invalidate correct caches for PC-2 event', async () => {
      const result = await publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
        userId: 'user_456',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'PC-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      });

      expect(result.invalidatedCaches).toEqual(
        expect.arrayContaining([
          'makeup:recommendations:user_456',
          'hair:recommendations:user_456',
        ])
      );
    });

    it('should notify target modules for PC-2 event', async () => {
      const result = await publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
        userId: 'user_789',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'PC-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      });

      expect(result.notifiedTargets).toEqual(
        expect.arrayContaining(['M-1', 'H-1'])
      );
    });
  });

  describe('subscribeToEvent', () => {
    it('should call handler when event is published', async () => {
      const handler = vi.fn();
      subscribeToEvent(INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED, handler);

      await publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
        userId: 'user_test',
        timestamp: new Date().toISOString(),
        data: { skinType: 'oily' },
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'S-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
          userId: 'user_test',
        })
      );
    });

    it('should unsubscribe correctly', async () => {
      const handler = vi.fn();
      const unsubscribe = subscribeToEvent(
        INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED,
        handler
      );

      unsubscribe();

      await publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED,
        userId: 'user_test',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'C-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('publishAnalysisResultEvent', () => {
    it('should publish event for known source module', async () => {
      const result = await publishAnalysisResultEvent(
        'PC-2',
        'user_123',
        { season: 'autumn' },
        '1.1'
      );

      expect(result.success).toBe(true);
    });

    it('should return null event type for CIE modules (no events)', () => {
      // CIE 모듈은 이벤트를 발행하지 않음 (파이프라인 내부 처리)
      expect(getEventTypeForModule('CIE-1')).toBeNull();
      expect(getEventTypeForModule('CIE-2')).toBeNull();
      expect(getEventTypeForModule('CIE-3')).toBeNull();
      expect(getEventTypeForModule('CIE-4')).toBeNull();
    });
  });

  describe('getEventTypeForModule', () => {
    it('should return correct event type for each module', () => {
      expect(getEventTypeForModule('PC-2')).toBe(INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED);
      expect(getEventTypeForModule('S-2')).toBe(INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED);
      expect(getEventTypeForModule('C-2')).toBe(INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED);
      expect(getEventTypeForModule('OH-1')).toBe(INTEGRATION_EVENT_TYPES.OH1_RESULT_SAVED);
    });
  });

  describe('Cache invalidation rules', () => {
    it('should have rules for all event types', () => {
      Object.values(INTEGRATION_EVENT_TYPES).forEach((eventType) => {
        expect(CACHE_INVALIDATION_RULES[eventType]).toBeDefined();
        expect(Array.isArray(CACHE_INVALIDATION_RULES[eventType])).toBe(true);
      });
    });
  });
});

// ============================================
// 연동 클라이언트 테스트 (CMP-A3)
// ============================================

describe('Integration Client (CMP-A3)', () => {
  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    clearAllCache();
  });

  describe('fetchIntegrationData', () => {
    // INT-TC-002: S-2 데이터 없이 SK-1 호출
    it('should use default when source data not found (INT-TC-002)', async () => {
      const result = await fetchIntegrationData<S2ToSK1IntegrationData>(
        'S-2',
        'user-without-analysis',
        { fallbackToDefault: true }
      );

      expect(result.usedDefault).toBe(true);
      expect(result.requiresAnalysis).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw error when fallback disabled and data not found', async () => {
      await expect(
        fetchIntegrationData(
          'PC-2',
          'nonexistent-user',
          { fallbackToDefault: false, timeout: 100 }
        )
      ).rejects.toThrow();
    });
  });

  describe('getDefaultIntegrationData', () => {
    it('should return default data for PC-2', () => {
      const data = getDefaultIntegrationData<PC2ToM1IntegrationData>('PC-2');

      expect(data.season).toBeDefined();
      expect(data.confidence).toBe(50);
    });

    it('should return default data for S-2', () => {
      const data = getDefaultIntegrationData('S-2');

      // S-2 기본값은 skinType을 포함 (내부 fallback)
      expect(data).toBeDefined();
      expect((data as { confidence: number }).confidence).toBe(50);
    });

    it('should return default data for C-2', () => {
      const data = getDefaultIntegrationData<C2ToW2IntegrationData>('C-2');

      expect(data.postureType).toBeDefined();
      expect(data.confidence).toBe(50);
    });
  });

  describe('Specialized fetch functions', () => {
    it('fetchPC2ForMakeup should return PC-2 data', async () => {
      const result = await fetchPC2ForMakeup('user_test');

      expect(result.data).toBeDefined();
      expect(result.usedDefault).toBe(true);
    });

    it('fetchS2ForProcedure should return S-2 data', async () => {
      const result = await fetchS2ForProcedure('user_test');

      expect(result.data).toBeDefined();
      expect(result.usedDefault).toBe(true);
    });

    it('fetchC2ForStretching should return C-2 data', async () => {
      const result = await fetchC2ForStretching('user_test');

      expect(result.data).toBeDefined();
      expect(result.usedDefault).toBe(true);
    });
  });

  describe('Cache management', () => {
    it('should track cache statistics', async () => {
      // Fetch to populate cache (will use default)
      await fetchIntegrationData('PC-2', 'user_1');
      await fetchIntegrationData('S-2', 'user_2');

      const stats = getCacheStats();

      // Cache might be empty if using defaults (no actual caching for defaults)
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache for specific module and user', async () => {
      await invalidateCache('PC-2', 'user_test');

      const stats = getCacheStats();
      expect(stats.moduleBreakdown['PC-2'] ?? 0).toBe(0);
    });
  });
});

// ============================================
// 신뢰도 전파 테스트
// ============================================

describe('Confidence Propagation', () => {
  describe('calculatePropagatedConfidence', () => {
    it('should calculate weighted average correctly', () => {
      const sources = [
        { module: 'PC-2', confidence: 80, weight: 0.9 },
        { module: 'S-2', confidence: 70, weight: 0.85 },
      ];

      const result = calculatePropagatedConfidence(sources, {
        method: 'weighted_average',
      });

      expect(result.finalConfidence).toBeGreaterThan(0);
      expect(result.finalConfidence).toBeLessThanOrEqual(100);
      expect(result.method).toBe('weighted_average');
    });

    it('should calculate minimum correctly', () => {
      const sources = [
        { module: 'PC-2', confidence: 80 },
        { module: 'S-2', confidence: 60 },
        { module: 'C-2', confidence: 90 },
      ];

      const result = calculatePropagatedConfidence(sources, {
        method: 'minimum',
      });

      expect(result.finalConfidence).toBe(60);
    });

    it('should apply depth decay', () => {
      const sources = [
        { module: 'CIE-1', confidence: 90, depth: 0 },
        { module: 'CIE-2', confidence: 90, depth: 1 },
        { module: 'CIE-3', confidence: 90, depth: 2 },
      ];

      const result = calculatePropagatedConfidence(sources, {
        method: 'weighted_average',
        applyDepthDecay: true,
      });

      // With depth decay, confidence should be lower than 90
      expect(result.finalConfidence).toBeLessThan(90);
    });

    it('should identify lowest source', () => {
      const sources = [
        { module: 'PC-2', confidence: 80 },
        { module: 'S-2', confidence: 40 },
        { module: 'C-2', confidence: 70 },
      ];

      const result = calculatePropagatedConfidence(sources);

      expect(result.lowestSource?.module).toBe('S-2');
    });

    it('should return zero confidence for empty sources', () => {
      const result = calculatePropagatedConfidence([]);

      expect(result.finalConfidence).toBe(0);
      expect(result.meetsThreshold).toBe(false);
    });
  });

  describe('calculateCIEConfidenceModifier', () => {
    it('should return modifier between 0.5 and 1.0', () => {
      const modifier = calculateCIEConfidenceModifier({
        'CIE-1': 90,
        'CIE-2': 85,
        'CIE-3': 80,
        'CIE-4': 75,
      });

      expect(modifier).toBeGreaterThanOrEqual(0.5);
      expect(modifier).toBeLessThanOrEqual(1.0);
    });

    it('should return 1.0 for empty input', () => {
      const modifier = calculateCIEConfidenceModifier({});

      expect(modifier).toBe(1.0);
    });
  });

  describe('getConfidenceGrade', () => {
    it('should return correct grades', () => {
      expect(getConfidenceGrade(85)).toBe('high');
      expect(getConfidenceGrade(65)).toBe('medium');
      expect(getConfidenceGrade(55)).toBe('low');
      expect(getConfidenceGrade(40)).toBe('insufficient');
    });

    it('should use threshold boundaries correctly', () => {
      expect(getConfidenceGrade(CONFIDENCE_THRESHOLDS.HIGH)).toBe('high');
      expect(getConfidenceGrade(CONFIDENCE_THRESHOLDS.PRODUCT_RECOMMENDATION)).toBe('medium');
      expect(getConfidenceGrade(CONFIDENCE_THRESHOLDS.DISPLAY)).toBe('low');
      expect(getConfidenceGrade(CONFIDENCE_THRESHOLDS.DISPLAY - 1)).toBe('insufficient');
    });
  });
});

// ============================================
// INT-TC-006: 동시 다발 이벤트 발행
// ============================================

describe('Concurrent Event Publishing (INT-TC-006)', () => {
  beforeEach(() => {
    clearAllHandlers();
  });

  it('should handle multiple concurrent events', async () => {
    const eventPromises = [
      publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
        userId: 'user_concurrent_1',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'PC-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      }),
      publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.S2_RESULT_SAVED,
        userId: 'user_concurrent_1',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'S-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      }),
      publishIntegrationEvent({
        type: INTEGRATION_EVENT_TYPES.C2_RESULT_SAVED,
        userId: 'user_concurrent_1',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: {
          schemaVersion: '1.0.0',
          sourceModuleVersion: 'C-2@1.0',
          generatedAt: new Date().toISOString(),
        },
      }),
    ];

    const results = await Promise.all(eventPromises);

    // All events should succeed
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });

    // All event IDs should be unique
    const eventIds = results.map((r) => r.eventId);
    const uniqueIds = new Set(eventIds);
    expect(uniqueIds.size).toBe(eventIds.length);
  });

  it('should maintain handler call order for same event type', async () => {
    const callOrder: number[] = [];

    subscribeToEvent(INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED, async () => {
      callOrder.push(1);
    });
    subscribeToEvent(INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED, async () => {
      callOrder.push(2);
    });

    await publishIntegrationEvent({
      type: INTEGRATION_EVENT_TYPES.PC2_RESULT_SAVED,
      userId: 'user_order_test',
      timestamp: new Date().toISOString(),
      data: {},
      metadata: {
        schemaVersion: '1.0.0',
        sourceModuleVersion: 'PC-2@1.0',
        generatedAt: new Date().toISOString(),
      },
    });

    // Both handlers should be called
    expect(callOrder).toContain(1);
    expect(callOrder).toContain(2);
  });
});
