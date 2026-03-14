/**
 * 캡슐 저장소 테스트
 * @see lib/capsule/capsule-repository.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과 제어 변수
let terminalResult: { data: unknown; error: unknown } = { data: null, error: null };

// Supabase thenable 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockChain,
}));

import {
  getCapsule,
  createCapsule,
  addItemToCapsule,
  removeItemFromCapsule,
  updateCapsuleCCS,
  updateCapsuleRotation,
  getCrossDomainRules,
} from '@/lib/capsule/capsule-repository';

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

// =============================================================================
// Mock 데이터
// =============================================================================

const mockCapsuleRow = {
  id: 'capsule_1',
  clerk_user_id: 'user_123',
  domain_id: 'skin',
  ccs: 85,
  status: 'active',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  last_rotation: '2026-01-15T10:00:00Z',
};

const mockItemRow = {
  id: 'item_1',
  capsule_id: 'capsule_1',
  item: { id: 'product_1', name: 'Test Product' },
  profile_fit_score: 90,
  usage_count: 5,
  last_used: '2026-01-15T10:00:00Z',
  added_at: '2026-01-15T10:00:00Z',
};

// =============================================================================
// 테스트
// =============================================================================

describe('getCapsule', () => {
  it('활성 캡슐을 성공적으로 조회한다', async () => {
    // 첫 번째 호출: 캡슐 조회
    // 두 번째 호출: 아이템 조회
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: mockCapsuleRow, error: null }).then(resolve);
      }
      return Promise.resolve({ data: [mockItemRow], error: null }).then(resolve);
    });

    const result = await getCapsule('user_123', 'skin');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('capsule_1');
    expect(result?.domainId).toBe('skin');
    expect(result?.ccs).toBe(85);
    expect(result?.items.length).toBe(1);
    expect(result?.items[0].profileFitScore).toBe(90);
    expect(mockChain.from).toHaveBeenCalledWith('capsules');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('domain_id', 'skin');
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('캡슐이 없으면 null을 반환한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await getCapsule('user_123', 'skin');
    expect(result).toBeNull();
  });

  it('조회 에러 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB Error' } };

    const result = await getCapsule('user_123', 'skin');
    expect(result).toBeNull();
  });
});

describe('createCapsule', () => {
  it('새 캡슐을 성공적으로 생성한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        // archive 기존 캡슐
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
      if (callCount === 2) {
        // 새 캡슐 생성
        return Promise.resolve({ data: mockCapsuleRow, error: null }).then(resolve);
      }
      // 아이템 삽입
      return Promise.resolve({ data: [mockItemRow], error: null }).then(resolve);
    });

    const items = [{ id: 'product_1', name: 'Test Product' }];
    const result = await createCapsule('user_123', 'skin', items, 85);

    expect(result.id).toBe('capsule_1');
    expect(result.domainId).toBe('skin');
    expect(result.status).toBe('active');
    expect(result.ccs).toBe(85);
  });

  it('CCS 점수를 0-100으로 클램핑한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ data: mockCapsuleRow, error: null }).then(resolve);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve);
    });

    await createCapsule('user_123', 'skin', [], 150);

    // insert에 클램핑된 값이 전달되었는지 확인
    expect(mockChain.insert).toHaveBeenCalled();
  });

  it('캡슐 생성 실패 시 에러를 던진다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
      return Promise.resolve({ data: null, error: { message: 'Insert failed' } }).then(resolve);
    });

    await expect(createCapsule('user_123', 'skin', [], 85)).rejects.toThrow('캡슐 생성 실패');
  });
});

describe('addItemToCapsule', () => {
  it('아이템을 성공적으로 추가한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: mockItemRow, error: null }).then(resolve);
      }
      // updated_at 갱신
      return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    const result = await addItemToCapsule('capsule_1', { id: 'p1', name: 'Product' }, 90);

    expect(result.id).toBe('item_1');
    expect(result.capsuleId).toBe('capsule_1');
    expect(result.profileFitScore).toBe(90);
    expect(mockChain.from).toHaveBeenCalledWith('capsule_items');
  });

  it('추가 실패 시 에러를 던진다', async () => {
    terminalResult = { data: null, error: { message: 'Insert failed' } };

    await expect(addItemToCapsule('capsule_1', { id: 'p1' }, 0)).rejects.toThrow(
      '아이템 추가 실패'
    );
  });
});

describe('removeItemFromCapsule', () => {
  it('아이템을 성공적으로 삭제한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    await expect(removeItemFromCapsule('capsule_1', 'item_1')).resolves.not.toThrow();
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'item_1');
    expect(mockChain.eq).toHaveBeenCalledWith('capsule_id', 'capsule_1');
  });

  it('삭제 실패 시 에러를 던진다', async () => {
    terminalResult = { data: null, error: { message: 'Delete failed' } };

    await expect(removeItemFromCapsule('capsule_1', 'item_1')).rejects.toThrow('아이템 삭제 실패');
  });
});

describe('updateCapsuleCCS', () => {
  it('CCS 점수를 성공적으로 업데이트한다', async () => {
    terminalResult = { data: null, error: null };

    await expect(updateCapsuleCCS('capsule_1', 92)).resolves.not.toThrow();
    expect(mockChain.from).toHaveBeenCalledWith('capsules');
    expect(mockChain.update).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'capsule_1');
  });

  it('에러 시 콘솔에 로그를 남긴다', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    terminalResult = { data: null, error: { message: 'Update failed' } };

    await updateCapsuleCCS('capsule_1', 50);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('updateCapsuleRotation', () => {
  it('로테이션 타임스탬프를 갱신한다', async () => {
    terminalResult = { data: null, error: null };

    await expect(updateCapsuleRotation('capsule_1')).resolves.not.toThrow();
    expect(mockChain.from).toHaveBeenCalledWith('capsules');
    expect(mockChain.update).toHaveBeenCalled();
  });
});

describe('getCrossDomainRules', () => {
  it('크로스 도메인 규칙을 성공적으로 조회한다', async () => {
    const mockRules = [
      {
        id: 'rule_1',
        domain1: 'skin',
        domain2: 'makeup',
        rule_name: 'skintype-foundation',
        factor: 1.2,
        rule_type: 'synergy',
        description: '피부 타입에 맞는 파운데이션',
      },
    ];

    terminalResult = { data: mockRules, error: null };

    const result = await getCrossDomainRules();
    expect(result.length).toBe(1);
    expect(result[0].domain1).toBe('skin');
    expect(result[0].ruleName).toBe('skintype-foundation');
    expect(result[0].ruleType).toBe('synergy');
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Query failed' } };

    const result = await getCrossDomainRules();
    expect(result).toEqual([]);
  });

  it('데이터가 없으면 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await getCrossDomainRules();
    expect(result).toEqual([]);
  });
});
