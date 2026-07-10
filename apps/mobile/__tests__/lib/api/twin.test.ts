/**
 * 모바일 AI 트윈 HTTP 클라이언트 테스트 (ADR-115 / ADR-118)
 *
 * @see lib/api/twin.ts
 * 핵심 검증: 승인 게이트(approvedOnly — pending/rejected 미노출), 방어적 파싱,
 * 요청 헤더(Bearer + x-yiroom-client), 상한 초과(429) 코드, 착장 파싱.
 */

import {
  fetchMyTwin,
  generateTwin,
  setTwinStatus,
  deleteTwin,
  composeOnTwin,
  parseTwinRecord,
  approvedOnly,
  TwinApiError,
  TWIN_BUDGET_EXCEEDED,
  type TwinRecord,
} from '@/lib/api/twin';

const BASE = 'https://api.test';

const approvedRecord = {
  id: 'twin-1',
  imageUrl: 'https://cdn.test/twin-1.png',
  status: 'approved' as const,
  aiGenerated: true,
};
const pendingRecord = { ...approvedRecord, id: 'twin-2', status: 'pending' as const };

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────── 승인 게이트 (핵심) ───────────────────────────────

describe('approvedOnly (승인 게이트)', () => {
  it('approved 트윈만 통과시킨다', () => {
    expect(approvedOnly(approvedRecord)).toEqual(approvedRecord);
  });

  it('pending 트윈은 노출하지 않는다(null)', () => {
    expect(approvedOnly(pendingRecord)).toBeNull();
  });

  it('rejected 트윈은 노출하지 않는다(null)', () => {
    expect(approvedOnly({ ...approvedRecord, status: 'rejected' })).toBeNull();
  });

  it('null은 그대로 null', () => {
    expect(approvedOnly(null)).toBeNull();
  });
});

describe('parseTwinRecord', () => {
  it('{ twin } 래핑을 파싱한다', () => {
    expect(parseTwinRecord({ twin: approvedRecord })).toEqual({
      id: 'twin-1',
      imageUrl: 'https://cdn.test/twin-1.png',
      status: 'approved',
      aiGenerated: true,
    });
  });

  it('평문 레코드를 파싱한다', () => {
    expect(parseTwinRecord(pendingRecord)?.status).toBe('pending');
  });

  it('{ twin: null }(트윈 없음)은 null', () => {
    expect(parseTwinRecord({ twin: null })).toBeNull();
  });

  it('형식 불충족은 null', () => {
    expect(parseTwinRecord({ id: 'x' })).toBeNull();
    expect(parseTwinRecord(null)).toBeNull();
    expect(parseTwinRecord({ twin: { id: 'x', imageUrl: 'u', status: 'weird' } })).toBeNull();
  });
});

// ─────────────────────────────── fetchMyTwin ───────────────────────────────

describe('fetchMyTwin', () => {
  it('GET으로 조회하고 Bearer + x-yiroom-client 헤더를 담는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { twin: approvedRecord }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const rec = await fetchMyTwin('tok', BASE);
    expect(rec?.status).toBe('approved');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/visual/twin`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('트윈 없음({ twin: null })은 null 반환', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { twin: null })) as unknown as typeof fetch;
    expect(await fetchMyTwin('tok', BASE)).toBeNull();
  });

  it('서버 오류는 TwinApiError를 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(500, { error: { message: '서버 오류', code: 'INTERNAL_ERROR' } })
      ) as unknown as typeof fetch;
    await expect(fetchMyTwin('tok', BASE)).rejects.toBeInstanceOf(TwinApiError);
  });

  it('네트워크 실패는 NETWORK_ERROR', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(fetchMyTwin('tok', BASE)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('baseUrl 없으면 CONFIG_ERROR', async () => {
    const prev = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(fetchMyTwin('tok')).rejects.toMatchObject({ code: 'CONFIG_ERROR' });
    } finally {
      if (prev !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = prev;
    }
  });
});

// ─────────────────────────────── generateTwin ───────────────────────────────

describe('generateTwin', () => {
  it('POST로 생성하고 pending 레코드를 반환한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, pendingRecord));
    global.fetch = fetchMock as unknown as typeof fetch;

    const rec = await generateTwin({ faceImageBase64: 'data:image/jpeg;base64,abc' }, 'tok', BASE);
    expect(rec.status).toBe('pending');
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe(`${BASE}/api/visual/twin`);
    expect(call[1].method).toBe('POST');
    expect(JSON.parse(call[1].body).faceImageBase64).toContain('base64');
  });

  it('전신 사진이 있으면 bodyImageBase64를 담는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, pendingRecord));
    global.fetch = fetchMock as unknown as typeof fetch;

    await generateTwin(
      {
        faceImageBase64: 'data:image/jpeg;base64,face',
        bodyImageBase64: 'data:image/jpeg;base64,body',
      },
      'tok',
      BASE
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).bodyImageBase64).toContain('body');
  });

  it('상한 초과(429)는 VISUAL_BUDGET_EXCEEDED 코드로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(429, { error: '오늘의 횟수를 모두 사용했어요', code: TWIN_BUDGET_EXCEEDED })
      ) as unknown as typeof fetch;

    await expect(
      generateTwin({ faceImageBase64: 'data:image/jpeg;base64,abc' }, 'tok', BASE)
    ).rejects.toMatchObject({ status: 429, code: TWIN_BUDGET_EXCEEDED });
  });
});

// ─────────────────────────────── setTwinStatus / deleteTwin ───────────────────────────────

describe('setTwinStatus', () => {
  it('approve는 PATCH { action: approve }를 보낸다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, approvedRecord));
    global.fetch = fetchMock as unknown as typeof fetch;

    const rec = await setTwinStatus('twin-1', 'approve', 'tok', BASE);
    expect(rec.status).toBe('approved');
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe(`${BASE}/api/visual/twin/twin-1`);
    expect(call[1].method).toBe('PATCH');
    expect(JSON.parse(call[1].body)).toEqual({ action: 'approve' });
  });
});

describe('deleteTwin', () => {
  it('DELETE 요청을 보낸다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await deleteTwin('twin-1', 'tok', BASE);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/visual/twin/twin-1`);
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('실패는 TwinApiError를 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(404, { error: { message: '없음', code: 'NOT_FOUND' } })
      ) as unknown as typeof fetch;
    await expect(deleteTwin('twin-x', 'tok', BASE)).rejects.toBeInstanceOf(TwinApiError);
  });
});

// ─────────────────────────────── composeOnTwin ───────────────────────────────

describe('composeOnTwin', () => {
  it('착장 이미지를 반환한다', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { imageUrl: 'data:image/png;base64,zzz', aiGenerated: true })
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const out = await composeOnTwin('twin-1', 'https://cdn.test/shirt.png', 'tok', BASE);
    expect(out.imageUrl).toContain('base64');
    expect(out.aiGenerated).toBe(true);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe(`${BASE}/api/visual/twin/compose`);
    expect(JSON.parse(call[1].body)).toEqual({
      twinId: 'twin-1',
      garmentImageUrl: 'https://cdn.test/shirt.png',
    });
  });

  it('미승인(403)은 정직하게 에러 메시지를 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(403, { error: { message: '승인된 트윈이 아니에요', code: 'FORBIDDEN' } })
      ) as unknown as typeof fetch;
    await expect(
      composeOnTwin('twin-1', 'https://cdn.test/shirt.png', 'tok', BASE)
    ).rejects.toBeInstanceOf(TwinApiError);
  });
});

// 타입 참조(미사용 경고 방지 겸 계약 확인)
const _typeCheck: TwinRecord = approvedRecord;
void _typeCheck;
