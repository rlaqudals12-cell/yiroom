/**
 * agreement 타입 및 유틸리티 테스트
 * SDD-TERMS-AGREEMENT.md §8.2
 */

import { describe, it, expect } from 'vitest';
import {
  AGREEMENT_ITEMS,
  REQUIRED_AGREEMENT_IDS,
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  mapDbAgreementToFrontend,
} from '@/components/agreement/types';

describe('AGREEMENT_ITEMS', () => {
  it('3개의 동의 항목이 정의되어 있다', () => {
    expect(AGREEMENT_ITEMS).toHaveLength(3);
  });

  it('이용약관 항목이 포함되어 있다', () => {
    const terms = AGREEMENT_ITEMS.find((item) => item.id === 'terms');
    expect(terms).toBeDefined();
    expect(terms?.label).toBe('이용약관 동의');
    expect(terms?.required).toBe(true);
    expect(terms?.detailUrl).toBe('/terms');
  });

  it('개인정보 항목이 포함되어 있다', () => {
    const privacy = AGREEMENT_ITEMS.find((item) => item.id === 'privacy');
    expect(privacy).toBeDefined();
    expect(privacy?.label).toBe('개인정보 수집 및 이용 동의');
    expect(privacy?.required).toBe(true);
    expect(privacy?.detailUrl).toBe('/privacy');
  });

  it('마케팅 항목이 포함되어 있다', () => {
    const marketing = AGREEMENT_ITEMS.find((item) => item.id === 'marketing');
    expect(marketing).toBeDefined();
    expect(marketing?.label).toBe('마케팅 정보 수신 동의');
    expect(marketing?.required).toBe(false);
    expect(marketing?.description).toBe('프로모션, 이벤트, 신기능 알림을 받습니다');
    expect(marketing?.detailUrl).toBe('/help/marketing');
  });
});

describe('REQUIRED_AGREEMENT_IDS', () => {
  it('필수 동의 항목 ID가 올바르게 추출된다', () => {
    expect(REQUIRED_AGREEMENT_IDS).toContain('terms');
    expect(REQUIRED_AGREEMENT_IDS).toContain('privacy');
    expect(REQUIRED_AGREEMENT_IDS).not.toContain('marketing');
  });

  it('2개의 필수 항목이 있다', () => {
    expect(REQUIRED_AGREEMENT_IDS).toHaveLength(2);
  });
});

describe('버전 상수', () => {
  it('이용약관 버전이 정의되어 있다', () => {
    expect(CURRENT_TERMS_VERSION).toBe('1.0');
  });

  it('개인정보처리방침 버전이 정의되어 있다', () => {
    expect(CURRENT_PRIVACY_VERSION).toBe('1.0');
  });
});

describe('mapDbAgreementToFrontend', () => {
  it('DB 응답을 프론트엔드 타입으로 변환한다', () => {
    const dbData = {
      id: 'uuid-123',
      clerk_user_id: 'user_abc',
      terms_agreed: true,
      privacy_agreed: true,
      marketing_agreed: false,
      terms_version: '1.0',
      privacy_version: '1.0',
      terms_agreed_at: '2026-01-08T00:00:00Z',
      privacy_agreed_at: '2026-01-08T00:00:00Z',
      marketing_agreed_at: null,
      marketing_withdrawn_at: null,
      created_at: '2026-01-08T00:00:00Z',
      updated_at: '2026-01-08T00:00:00Z',
    };

    const result = mapDbAgreementToFrontend(dbData);

    expect(result.id).toBe('uuid-123');
    expect(result.clerkUserId).toBe('user_abc');
    expect(result.termsAgreed).toBe(true);
    expect(result.privacyAgreed).toBe(true);
    expect(result.marketingAgreed).toBe(false);
    expect(result.termsVersion).toBe('1.0');
    expect(result.privacyVersion).toBe('1.0');
    expect(result.termsAgreedAt).toBe('2026-01-08T00:00:00Z');
    expect(result.privacyAgreedAt).toBe('2026-01-08T00:00:00Z');
    expect(result.marketingAgreedAt).toBeNull();
    expect(result.marketingWithdrawnAt).toBeNull();
    expect(result.createdAt).toBe('2026-01-08T00:00:00Z');
    expect(result.updatedAt).toBe('2026-01-08T00:00:00Z');
  });

  it('snake_case를 camelCase로 변환한다', () => {
    const dbData = {
      id: 'test',
      clerk_user_id: 'user_test',
      terms_agreed: true,
      privacy_agreed: true,
      marketing_agreed: true,
      terms_version: '1.0',
      privacy_version: '1.0',
      terms_agreed_at: null,
      privacy_agreed_at: null,
      marketing_agreed_at: null,
      marketing_withdrawn_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const result = mapDbAgreementToFrontend(dbData);

    // 프론트엔드 타입은 camelCase
    expect(result).toHaveProperty('clerkUserId');
    expect(result).toHaveProperty('termsAgreed');
    expect(result).toHaveProperty('privacyAgreed');
    expect(result).toHaveProperty('marketingAgreed');
    expect(result).toHaveProperty('termsAgreedAt');
    expect(result).toHaveProperty('privacyAgreedAt');
    expect(result).toHaveProperty('marketingAgreedAt');
    expect(result).toHaveProperty('marketingWithdrawnAt');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });
});
