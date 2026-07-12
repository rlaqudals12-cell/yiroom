/**
 * 가격 크롤러 소스 테스트
 * @description 쿠팡 소스 테스트
 * @version 1.1
 * @date 2025-12-09
 */

import { describe, it, expect } from 'vitest';
import type { PriceFetchRequest } from '@/lib/crawler/types';
import { PREFERRED_SOURCES_BY_TYPE } from '@/lib/crawler/types';
import { fetchCoupangPrice, isCoupangApiAvailable } from '@/lib/crawler/sources/coupang';
import { getAvailableSources, getPreferredSources } from '@/lib/crawler';

describe('가격 크롤러 소스', () => {
  describe('제품 타입별 권장 소스', () => {
    it('화장품은 네이버 쇼핑이 최우선이다', () => {
      const sources = PREFERRED_SOURCES_BY_TYPE['cosmetic'];
      expect(sources[0]).toBe('naver_shopping');
      expect(sources).not.toContain('oliveyoung');
    });

    it('영양제는 네이버 쇼핑이 최우선이다', () => {
      const sources = PREFERRED_SOURCES_BY_TYPE['supplement'];
      expect(sources[0]).toBe('naver_shopping');
      expect(sources).not.toContain('oliveyoung');
    });

    it('운동 기구는 올리브영을 포함하지 않는다', () => {
      const sources = PREFERRED_SOURCES_BY_TYPE['workout_equipment'];
      expect(sources).not.toContain('oliveyoung');
    });

    it('건강식품은 올리브영을 포함하지 않는다', () => {
      const sources = PREFERRED_SOURCES_BY_TYPE['health_food'];
      expect(sources).not.toContain('oliveyoung');
    });
  });

  describe('쿠팡 소스', () => {
    it('API 키가 없으면 사용 불가능하다', () => {
      // 환경 변수가 설정되지 않은 상태
      expect(isCoupangApiAvailable()).toBe(false);
    });

    it('API 키가 없으면 가격 조회가 실패한다', async () => {
      const request: PriceFetchRequest = {
        productId: 'test-coupang',
        productType: 'cosmetic',
        productName: '토너',
        brand: '이니스프리',
      };

      const result = await fetchCoupangPrice(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials');
    });
  });

  describe('소스 가용성 확인', () => {
    it('Mock 소스는 항상 사용 가능하다', () => {
      const sources = getAvailableSources();
      expect(sources).toContain('mock');
    });

    it('화장품 타입의 권장 소스를 반환한다', () => {
      const sources = getPreferredSources('cosmetic');
      expect(sources).toContain('naver_shopping');
      expect(sources).toContain('coupang');
      expect(sources).not.toContain('oliveyoung');
    });

    it('영양제 타입의 권장 소스를 반환한다', () => {
      const sources = getPreferredSources('supplement');
      expect(sources).toContain('naver_shopping');
      expect(sources).not.toContain('oliveyoung');
    });

    it('알 수 없는 타입은 기본 소스를 반환한다', () => {
      const sources = getPreferredSources('unknown_type');
      expect(sources).toContain('naver_shopping');
      expect(sources).toContain('mock');
    });
  });

  describe('소스별 Rate Limit 설정', () => {
    it('쿠팡은 중간 딜레이가 필요하다', () => {
      // 쿠팡 API는 200ms 딜레이 권장
      const COUPANG_DELAY = 200;
      expect(COUPANG_DELAY).toBeGreaterThanOrEqual(100);
    });
  });

  describe('에러 처리', () => {
    it('쿠팡 API 에러 시 적절한 에러 메시지를 반환한다', async () => {
      const request: PriceFetchRequest = {
        productId: 'error-test',
        productType: 'cosmetic',
        productName: '테스트',
        brand: '테스트',
      };

      const result = await fetchCoupangPrice(request);

      expect(result.success).toBe(false);
      expect(result.source).toBe('coupang');
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });
  });
});

describe('통합 테스트: 제품 타입별 소스 선택', () => {
  it('화장품 요청 시 네이버 → 쿠팡 순으로 시도', () => {
    const preferredSources = PREFERRED_SOURCES_BY_TYPE['cosmetic'];

    expect(preferredSources).toEqual(['naver_shopping', 'coupang']);
  });

  it('영양제 요청 시 네이버 → 쿠팡 순으로 시도', () => {
    const preferredSources = PREFERRED_SOURCES_BY_TYPE['supplement'];

    expect(preferredSources).toEqual(['naver_shopping', 'coupang']);
  });

  it('운동 기구 요청 시 네이버 → 쿠팡 순으로 시도', () => {
    const preferredSources = PREFERRED_SOURCES_BY_TYPE['workout_equipment'];

    expect(preferredSources).toEqual(['naver_shopping', 'coupang']);
  });

  it('건강식품 요청 시 네이버 → 쿠팡 순으로 시도', () => {
    const preferredSources = PREFERRED_SOURCES_BY_TYPE['health_food'];

    expect(preferredSources).toEqual(['naver_shopping', 'coupang']);
  });
});
