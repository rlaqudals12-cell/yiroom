/**
 * 캡슐 API 클라이언트 테스트
 *
 * 대상: lib/capsule/api.ts
 * 검증: 각 API 함수의 올바른 요청 전송 및 응답 파싱
 */

import {
  generateDailyCapsule,
  getTodayDailyCapsule,
  checkDailyItem,
  getBeautyProfile,
  getDomainCapsule,
  rotateCapsule,
} from '../../lib/capsule/api';

// =============================================================================
// fetch 모킹
// =============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

// 성공 응답 헬퍼
function mockSuccessResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  } as Response);
}

// 에러 응답 헬퍼
function mockErrorResponse(error: { code: string; message: string }, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error }),
  } as Response);
}

// 네트워크 오류 헬퍼
function mockNetworkError() {
  return Promise.reject(new Error('Network request failed'));
}

const AUTH_TOKEN = 'test-auth-token';

const mockCapsule = {
  id: 'capsule-1',
  userId: 'user-1',
  date: '2026-03-12',
  items: [
    {
      id: 'item-1',
      moduleCode: 'skin',
      name: '수분 세럼 바르기',
      reason: '피부 수분 부족',
      compatibilityScore: 85,
      isChecked: false,
    },
  ],
  totalCcs: 82,
  estimatedMinutes: 15,
  status: 'in_progress' as const,
  completedAt: null,
  createdAt: '2026-03-12T08:00:00Z',
};

const mockBeautyProfile = {
  userId: 'user-1',
  updatedAt: '2026-03-12T00:00:00Z',
  completedModules: ['skin', 'personal-color'],
  personalizationLevel: 2,
};

// =============================================================================
// generateDailyCapsule
// =============================================================================

describe('generateDailyCapsule', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('POST /api/capsule/daily 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await generateDailyCapsule(AUTH_TOKEN);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/capsule/daily');
    expect(options.method).toBe('POST');
  });

  it('Authorization Bearer 헤더를 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await generateDailyCapsule(AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers?.Authorization ?? options.headers?.['Authorization']).toBe(
      `Bearer ${AUTH_TOKEN}`
    );
  });

  it('성공 시 캡슐 데이터를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    const result = await generateDailyCapsule(AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockCapsule);
  });

  it('서버 에러 응답 시 error를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' })
    );

    const result = await generateDailyCapsule(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INTERNAL_ERROR');
  });

  it('네트워크 오류 시 NETWORK_ERROR를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockNetworkError());

    const result = await generateDailyCapsule(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toContain('네트워크');
  });
});

// =============================================================================
// getTodayDailyCapsule
// =============================================================================

describe('getTodayDailyCapsule', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('GET /api/capsule/daily 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await getTodayDailyCapsule(AUTH_TOKEN);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/capsule/daily');
    expect(options.method).toBe('GET');
  });

  it('Authorization Bearer 헤더를 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await getTodayDailyCapsule(AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers?.Authorization ?? options.headers?.['Authorization']).toBe(
      `Bearer ${AUTH_TOKEN}`
    );
  });

  it('성공 시 캡슐 데이터를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    const result = await getTodayDailyCapsule(AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockCapsule);
  });

  it('캡슐이 없을 때 null data와 null error를 반환할 수 있어야 한다', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      } as Response)
    );

    const result = await getTodayDailyCapsule(AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('네트워크 오류 시 NETWORK_ERROR를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockNetworkError());

    const result = await getTodayDailyCapsule(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});

// =============================================================================
// checkDailyItem
// =============================================================================

describe('checkDailyItem', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const CAPSULE_ID = 'capsule-123';
  const ITEM_ID = 'item-456';

  it('PATCH /api/capsule/daily/:capsuleId 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await checkDailyItem(CAPSULE_ID, ITEM_ID, true, AUTH_TOKEN);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/api/capsule/daily/${CAPSULE_ID}`);
    expect(options.method).toBe('PATCH');
  });

  it('요청 바디에 itemId와 isChecked를 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await checkDailyItem(CAPSULE_ID, ITEM_ID, true, AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.itemId).toBe(ITEM_ID);
    expect(body.isChecked).toBe(true);
  });

  it('isChecked=false로 체크 해제 요청을 보낼 수 있어야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await checkDailyItem(CAPSULE_ID, ITEM_ID, false, AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.isChecked).toBe(false);
  });

  it('성공 시 업데이트된 캡슐을 반환해야 한다', async () => {
    const updatedCapsule = {
      ...mockCapsule,
      items: [{ ...mockCapsule.items[0], isChecked: true }],
    };
    mockFetch.mockReturnValueOnce(mockSuccessResponse(updatedCapsule));

    const result = await checkDailyItem(CAPSULE_ID, ITEM_ID, true, AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(updatedCapsule);
  });

  it('Authorization Bearer 헤더를 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockCapsule));

    await checkDailyItem(CAPSULE_ID, ITEM_ID, true, AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers?.Authorization ?? options.headers?.['Authorization']).toBe(
      `Bearer ${AUTH_TOKEN}`
    );
  });

  it('에러 응답 시 error를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse({ code: 'NOT_FOUND_ERROR', message: '아이템을 찾을 수 없습니다.' })
    );

    const result = await checkDailyItem(CAPSULE_ID, ITEM_ID, true, AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NOT_FOUND_ERROR');
  });
});

// =============================================================================
// getBeautyProfile
// =============================================================================

describe('getBeautyProfile', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('GET /api/capsule/profile 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockBeautyProfile));

    await getBeautyProfile(AUTH_TOKEN);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/capsule/profile');
    expect(options.method).toBe('GET');
  });

  it('Authorization Bearer 헤더를 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockBeautyProfile));

    await getBeautyProfile(AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers?.Authorization ?? options.headers?.['Authorization']).toBe(
      `Bearer ${AUTH_TOKEN}`
    );
  });

  it('성공 시 BeautyProfile 데이터를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockBeautyProfile));

    const result = await getBeautyProfile(AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockBeautyProfile);
  });

  it('네트워크 오류 시 NETWORK_ERROR를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockNetworkError());

    const result = await getBeautyProfile(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});

// =============================================================================
// getDomainCapsule
// =============================================================================

describe('getDomainCapsule', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const DOMAIN_ID = 'skin';
  const mockOverview = {
    domainId: 'skin',
    domainName: '스킨케어',
    itemCount: 5,
    optimalN: 7,
    ccs: 78,
    status: 'active',
  };

  it('GET /api/capsule/:domainId 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockOverview));

    await getDomainCapsule(DOMAIN_ID, AUTH_TOKEN);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/api/capsule/${DOMAIN_ID}`);
    expect(options.method).toBe('GET');
  });

  it('성공 시 CapsuleOverview 데이터를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockOverview));

    const result = await getDomainCapsule(DOMAIN_ID, AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockOverview);
  });
});

// =============================================================================
// rotateCapsule
// =============================================================================

describe('rotateCapsule', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const DOMAIN_ID = 'skin';
  const mockRotationResult = {
    removedCount: 2,
    addedCount: 2,
    compatibilityBefore: 65,
    compatibilityAfter: 80,
  };

  it('POST /api/capsule/rotate 요청을 전송해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockRotationResult));

    await rotateCapsule(DOMAIN_ID, AUTH_TOKEN);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/capsule/rotate');
    expect(options.method).toBe('POST');
  });

  it('요청 바디에 domainId와 reason을 포함해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockRotationResult));

    await rotateCapsule(DOMAIN_ID, AUTH_TOKEN, 'user-requested');

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.domainId).toBe(DOMAIN_ID);
    expect(body.reason).toBe('user-requested');
  });

  it('reason 기본값은 user-requested이어야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockRotationResult));

    await rotateCapsule(DOMAIN_ID, AUTH_TOKEN);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.reason).toBe('user-requested');
  });

  it('성공 시 RotationResult 데이터를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockSuccessResponse(mockRotationResult));

    const result = await rotateCapsule(DOMAIN_ID, AUTH_TOKEN);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockRotationResult);
  });

  it('네트워크 오류 시 NETWORK_ERROR를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(mockNetworkError());

    const result = await rotateCapsule(DOMAIN_ID, AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});

// =============================================================================
// apiRequest 공통 동작 (success=false 처리)
// =============================================================================

describe('API 공통 에러 처리', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('ok=true 이지만 success=false인 경우 에러로 처리해야 한다', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 요청입니다.' },
          }),
      } as Response)
    );

    const result = await getTodayDailyCapsule(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('에러 정보가 없는 에러 응답 시 UNKNOWN_ERROR를 반환해야 한다', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false }),
      } as Response)
    );

    const result = await getTodayDailyCapsule(AUTH_TOKEN);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('UNKNOWN_ERROR');
  });
});
