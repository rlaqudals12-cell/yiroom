/**
 * 어필리에이트 파트너 Repository 테스트
 * @description lib/affiliate/partners.ts의 파트너 CRUD 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과를 저장하는 변수
let terminalResult: { data: unknown; error: unknown } = { data: null, error: null };

// Supabase 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockChain,
}));

vi.mock('@/lib/utils/logger', () => ({
  affiliateLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  getAffiliatePartners,
  getAffiliatePartnerByName,
  getAffiliatePartnerById,
  updatePartnerSyncStatus,
} from '@/lib/affiliate/partners';

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockPartnerRow = {
  id: 'partner_001',
  name: 'coupang',
  display_name: '쿠팡',
  logo_url: 'https://example.com/logo.png',
  api_type: 'rest',
  api_endpoint: 'https://api.coupang.com',
  commission_rate_min: 3,
  commission_rate_max: 10,
  cookie_duration_days: 24,
  sync_frequency_hours: 6,
  last_synced_at: '2026-01-15T10:00:00Z',
  sync_status: 'success',
  sync_error_message: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

// ============================================================================
// 테스트
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

describe('getAffiliatePartners', () => {
  it('활성 파트너 목록을 반환한다', async () => {
    terminalResult = { data: [mockPartnerRow], error: null };

    const result = await getAffiliatePartners();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('partner_001');
    expect(result[0].name).toBe('coupang');
    expect(result[0].displayName).toBe('쿠팡');
    expect(result[0].isActive).toBe(true);
    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await getAffiliatePartners();

    expect(result).toEqual([]);
  });

  it('null 필드를 undefined로 매핑한다', async () => {
    const rowWithNulls = {
      ...mockPartnerRow,
      logo_url: null,
      api_endpoint: null,
      commission_rate_min: null,
      commission_rate_max: null,
      cookie_duration_days: null,
      last_synced_at: null,
      sync_error_message: null,
    };
    terminalResult = { data: [rowWithNulls], error: null };

    const result = await getAffiliatePartners();

    expect(result[0].logoUrl).toBeUndefined();
    expect(result[0].apiEndpoint).toBeUndefined();
    expect(result[0].commissionRateMin).toBeUndefined();
    expect(result[0].commissionRateMax).toBeUndefined();
    expect(result[0].cookieDurationDays).toBeUndefined();
    expect(result[0].lastSyncedAt).toBeUndefined();
    expect(result[0].syncErrorMessage).toBeUndefined();
  });

  it('날짜 필드를 Date 객체로 변환한다', async () => {
    terminalResult = { data: [mockPartnerRow], error: null };

    const result = await getAffiliatePartners();

    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].updatedAt).toBeInstanceOf(Date);
    expect(result[0].lastSyncedAt).toBeInstanceOf(Date);
  });
});

describe('getAffiliatePartnerByName', () => {
  it('파트너 이름으로 조회한다', async () => {
    terminalResult = { data: mockPartnerRow, error: null };

    const result = await getAffiliatePartnerByName('coupang');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('coupang');
    expect(mockChain.eq).toHaveBeenCalledWith('name', 'coupang');
  });

  it('존재하지 않는 파트너는 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Not found' } };

    const result = await getAffiliatePartnerByName('coupang');

    expect(result).toBeNull();
  });

  it('비활성 파트너는 조회되지 않는다', async () => {
    terminalResult = { data: mockPartnerRow, error: null };

    await getAffiliatePartnerByName('coupang');

    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
  });
});

describe('getAffiliatePartnerById', () => {
  it('파트너 ID로 조회한다', async () => {
    terminalResult = { data: mockPartnerRow, error: null };

    const result = await getAffiliatePartnerById('partner_001');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('partner_001');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'partner_001');
  });

  it('DB 에러 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getAffiliatePartnerById('invalid_id');

    expect(result).toBeNull();
  });

  it('data가 null이면 null을 반환한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await getAffiliatePartnerById('nonexistent');

    expect(result).toBeNull();
  });
});

describe('updatePartnerSyncStatus', () => {
  it('동기화 성공 시 last_synced_at을 설정한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await updatePartnerSyncStatus('partner_001', 'success');

    expect(result).toBe(true);
    expect(mockChain.update).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'partner_001');
  });

  it('동기화 에러 시 에러 메시지를 저장한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await updatePartnerSyncStatus('partner_001', 'error', 'API timeout');

    expect(result).toBe(true);
    expect(mockChain.update).toHaveBeenCalled();
  });

  it('DB 에러 시 false를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await updatePartnerSyncStatus('partner_001', 'success');

    expect(result).toBe(false);
  });

  it('에러 메시지 없이 호출하면 null로 설정한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await updatePartnerSyncStatus('partner_001', 'pending');

    expect(result).toBe(true);
  });
});
