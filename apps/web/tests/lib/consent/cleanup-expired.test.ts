/**
 * cleanup-expired-consents Edge Function 유닛 테스트
 * Edge Function 로직 검증 (실제 Deno 환경 아닌 로직 테스트)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Edge Function과 동일한 로직을 테스트용으로 추출
const ANALYSIS_STORAGE_BUCKETS: Record<string, string> = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
};

interface ExpiredConsent {
  id: string;
  clerk_user_id: string;
  analysis_type: string;
  retention_until: string;
}

// 만료 여부 확인 로직
function isExpired(retentionUntil: string): boolean {
  return new Date(retentionUntil) < new Date();
}

// 버킷 매핑 로직
function getBucketName(analysisType: string): string | undefined {
  return ANALYSIS_STORAGE_BUCKETS[analysisType];
}

describe('cleanup-expired-consents 로직', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isExpired', () => {
    it('retention_until이 과거면 true', () => {
      expect(isExpired('2026-01-07T00:00:00Z')).toBe(true);
      expect(isExpired('2025-12-01T00:00:00Z')).toBe(true);
    });

    it('retention_until이 미래면 false', () => {
      expect(isExpired('2026-01-09T00:00:00Z')).toBe(false);
      expect(isExpired('2027-01-01T00:00:00Z')).toBe(false);
    });

    it('retention_until이 현재 시간과 같으면 false', () => {
      expect(isExpired('2026-01-08T12:00:00Z')).toBe(false);
    });
  });

  describe('getBucketName', () => {
    it('skin → skin-images', () => {
      expect(getBucketName('skin')).toBe('skin-images');
    });

    it('body → body-images', () => {
      expect(getBucketName('body')).toBe('body-images');
    });

    it('personal-color → personal-color-images', () => {
      expect(getBucketName('personal-color')).toBe('personal-color-images');
    });

    it('잘못된 타입 → undefined', () => {
      expect(getBucketName('invalid')).toBeUndefined();
      expect(getBucketName('')).toBeUndefined();
    });
  });

  describe('만료 처리 시나리오', () => {
    it('만료된 동의는 삭제 대상', () => {
      const consents: ExpiredConsent[] = [
        {
          id: '1',
          clerk_user_id: 'user_123',
          analysis_type: 'skin',
          retention_until: '2026-01-01T00:00:00Z', // 과거
        },
        {
          id: '2',
          clerk_user_id: 'user_456',
          analysis_type: 'body',
          retention_until: '2026-01-15T00:00:00Z', // 미래
        },
      ];

      const expiredList = consents.filter((c) => isExpired(c.retention_until));
      expect(expiredList).toHaveLength(1);
      expect(expiredList[0].id).toBe('1');
    });

    it('모든 동의가 만료되지 않은 경우 빈 배열', () => {
      const consents: ExpiredConsent[] = [
        {
          id: '1',
          clerk_user_id: 'user_123',
          analysis_type: 'skin',
          retention_until: '2027-01-01T00:00:00Z',
        },
      ];

      const expiredList = consents.filter((c) => isExpired(c.retention_until));
      expect(expiredList).toHaveLength(0);
    });

    it('분석 타입별로 올바른 버킷에서 삭제', () => {
      const consent: ExpiredConsent = {
        id: '1',
        clerk_user_id: 'user_123',
        analysis_type: 'skin',
        retention_until: '2026-01-01T00:00:00Z',
      };

      const bucket = getBucketName(consent.analysis_type);
      expect(bucket).toBe('skin-images');
    });
  });

  describe('배치 처리', () => {
    it('100개 제한 배치 처리', () => {
      const BATCH_LIMIT = 100;

      // 150개 만료된 동의 생성
      const consents: ExpiredConsent[] = Array.from({ length: 150 }, (_, i) => ({
        id: String(i),
        clerk_user_id: `user_${i}`,
        analysis_type: 'skin',
        retention_until: '2026-01-01T00:00:00Z',
      }));

      // 배치 처리 시뮬레이션
      const batch = consents.slice(0, BATCH_LIMIT);
      expect(batch).toHaveLength(100);

      // 남은 건은 다음 실행에서 처리
      const remaining = consents.slice(BATCH_LIMIT);
      expect(remaining).toHaveLength(50);
    });
  });
});
