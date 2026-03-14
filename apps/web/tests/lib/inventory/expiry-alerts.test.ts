/**
 * 유통기한 알림 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  getExpiryStatus,
  getDaysRemaining,
  getExpiryMessage,
  generateExpiryAlerts,
  getExpiringItems,
  getExpirySummary,
} from '@/lib/inventory/expiry-alerts';
import type { InventoryItem } from '@/types/inventory';

// 테스트 기준일
const NOW = new Date('2026-03-14T00:00:00Z');

// 헬퍼: 가짜 인벤토리 아이템
function mockItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'beauty',
    name: '테스트 제품',
    imageUrl: null,
    tags: [],
    isFavorite: false,
    expiryDate: null,
    metadata: {},
    usageCount: 0,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as InventoryItem;
}

describe('expiry-alerts', () => {
  // ============================================
  // getExpiryStatus
  // ============================================
  describe('getExpiryStatus', () => {
    it('null → unknown', () => {
      expect(getExpiryStatus(null, NOW)).toBe('unknown');
    });

    it('잘못된 날짜 → unknown', () => {
      expect(getExpiryStatus('invalid', NOW)).toBe('unknown');
    });

    it('이미 만료된 날짜 → expired', () => {
      expect(getExpiryStatus('2026-03-01', NOW)).toBe('expired');
    });

    it('3일 후 만료 → urgent', () => {
      expect(getExpiryStatus('2026-03-17', NOW)).toBe('urgent');
    });

    it('7일 후 만료 → urgent (경계)', () => {
      expect(getExpiryStatus('2026-03-21', NOW)).toBe('urgent');
    });

    it('20일 후 만료 → warning', () => {
      expect(getExpiryStatus('2026-04-03', NOW)).toBe('warning');
    });

    it('30일 후 만료 → warning (경계)', () => {
      expect(getExpiryStatus('2026-04-13', NOW)).toBe('warning');
    });

    it('60일 후 만료 → safe', () => {
      expect(getExpiryStatus('2026-05-13', NOW)).toBe('safe');
    });

    it('오늘 만료 → expired (0일)', () => {
      // 당일 → diffDays = 0 → < 0 아님 → urgent가 아닌 expired가 아닌 확인
      const status = getExpiryStatus('2026-03-14', NOW);
      // 0일 남음: 0 < 0은 false, 0 <= 7은 true → urgent
      expect(status).toBe('urgent');
    });
  });

  // ============================================
  // getDaysRemaining
  // ============================================
  describe('getDaysRemaining', () => {
    it('null → null', () => {
      expect(getDaysRemaining(null, NOW)).toBeNull();
    });

    it('잘못된 날짜 → null', () => {
      expect(getDaysRemaining('nope', NOW)).toBeNull();
    });

    it('10일 후 → 10', () => {
      expect(getDaysRemaining('2026-03-24', NOW)).toBe(10);
    });

    it('3일 전 → -3', () => {
      expect(getDaysRemaining('2026-03-11', NOW)).toBe(-3);
    });

    it('오늘 → 0', () => {
      expect(getDaysRemaining('2026-03-14', NOW)).toBe(0);
    });
  });

  // ============================================
  // getExpiryMessage
  // ============================================
  describe('getExpiryMessage', () => {
    it('expired 메시지 포함 "만료"', () => {
      const msg = getExpiryMessage('expired', -5);
      expect(msg).toContain('만료');
      expect(msg).toContain('5일');
    });

    it('urgent 메시지 포함 "만료 예정"', () => {
      const msg = getExpiryMessage('urgent', 3);
      expect(msg).toContain('3일');
      expect(msg).toContain('만료 예정');
    });

    it('warning 메시지', () => {
      const msg = getExpiryMessage('warning', 20);
      expect(msg).toContain('20일');
    });

    it('safe 메시지', () => {
      expect(getExpiryMessage('safe', 60)).toContain('충분');
    });

    it('unknown 메시지', () => {
      expect(getExpiryMessage('unknown', null)).toContain('정보가 없어요');
    });
  });

  // ============================================
  // generateExpiryAlerts
  // ============================================
  describe('generateExpiryAlerts', () => {
    it('빈 배열 → 빈 결과', () => {
      expect(generateExpiryAlerts([], NOW)).toHaveLength(0);
    });

    it('모든 아이템에 알림 생성', () => {
      const items = [
        mockItem({ id: '1', expiryDate: '2026-03-01' }),
        mockItem({ id: '2', expiryDate: '2026-05-01' }),
        mockItem({ id: '3' }), // expiryDate null
      ];
      const alerts = generateExpiryAlerts(items, NOW);
      expect(alerts).toHaveLength(3);
      expect(alerts[0].status).toBe('expired');
      expect(alerts[1].status).toBe('safe');
      expect(alerts[2].status).toBe('unknown');
    });
  });

  // ============================================
  // getExpiringItems
  // ============================================
  describe('getExpiringItems', () => {
    it('만료/임박/경고만 필터링', () => {
      const items = [
        mockItem({ id: '1', expiryDate: '2026-03-01' }), // expired
        mockItem({ id: '2', expiryDate: '2026-03-16' }), // urgent
        mockItem({ id: '3', expiryDate: '2026-04-01' }), // warning
        mockItem({ id: '4', expiryDate: '2026-06-01' }), // safe
        mockItem({ id: '5' }), // unknown
      ];
      const expiring = getExpiringItems(items, NOW);
      expect(expiring).toHaveLength(3);
      expect(expiring.map((a) => a.item.id)).toEqual(['1', '2', '3']);
    });

    it('모두 안전하면 빈 배열', () => {
      const items = [
        mockItem({ id: '1', expiryDate: '2026-12-01' }),
        mockItem({ id: '2', expiryDate: '2027-01-01' }),
      ];
      expect(getExpiringItems(items, NOW)).toHaveLength(0);
    });
  });

  // ============================================
  // getExpirySummary
  // ============================================
  describe('getExpirySummary', () => {
    it('통계 정확히 계산', () => {
      const items = [
        mockItem({ id: '1', expiryDate: '2026-03-01' }), // expired
        mockItem({ id: '2', expiryDate: '2026-03-16' }), // urgent
        mockItem({ id: '3', expiryDate: '2026-04-01' }), // warning
        mockItem({ id: '4', expiryDate: '2026-06-01' }), // safe
        mockItem({ id: '5' }), // unknown
      ];
      const summary = getExpirySummary(items, NOW);

      expect(summary.expired).toBe(1);
      expect(summary.urgent).toBe(1);
      expect(summary.warning).toBe(1);
      expect(summary.safe).toBe(1);
      expect(summary.unknown).toBe(1);
      expect(summary.total).toBe(5);
      // alerts는 expired/urgent/warning만 (3개), safe/unknown 제외
      expect(summary.alerts).toHaveLength(3);
    });

    it('alerts가 위험도 순 정렬', () => {
      const items = [
        mockItem({ id: '1', expiryDate: '2026-04-01' }), // warning
        mockItem({ id: '2', expiryDate: '2026-03-01' }), // expired
        mockItem({ id: '3', expiryDate: '2026-03-16' }), // urgent
      ];
      const summary = getExpirySummary(items, NOW);
      expect(summary.alerts[0].status).toBe('expired');
      expect(summary.alerts[1].status).toBe('urgent');
      expect(summary.alerts[2].status).toBe('warning');
    });

    it('빈 배열 → 0 통계', () => {
      const summary = getExpirySummary([], NOW);
      expect(summary.total).toBe(0);
      expect(summary.alerts).toHaveLength(0);
    });
  });
});
