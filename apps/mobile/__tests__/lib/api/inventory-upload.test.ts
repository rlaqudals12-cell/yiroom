/**
 * 인벤토리 이미지 업로드 HTTP 클라이언트 테스트
 *
 * @see lib/api/inventory-upload.ts
 * 핵심 계약: 성공 시 **서버 공개 URL**만 반환하고, 실패하면 반드시 throw한다
 *           (로컬 file:// URI를 성공인 척 돌려주면 사진이 유실된다).
 */

import {
  uploadInventoryImage,
  createUploadItemId,
  InventoryUploadError,
} from '@/lib/api/inventory-upload';

const BASE = 'https://api.test';
const LOCAL_URI = 'file:///data/user/0/com.yiroom.app/cache/photo.jpg';
const PUBLIC_URL = 'https://storage.test/inventory-images/user_1/closet/abc_processed.png';

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}

/**
 * FormData 파트 읽기 — RN 구현(getParts)과 표준 구현(entries/get)이 달라 양쪽을 지원한다.
 */
function formValue(form: FormData, key: string): unknown {
  const rnForm = form as unknown as {
    getParts?: () => { fieldName: string; string?: string; uri?: string }[];
  };
  if (typeof rnForm.getParts === 'function') {
    const part = rnForm.getParts().find((p) => p.fieldName === key);
    return part?.string ?? part;
  }
  return form.get(key);
}

describe('uploadInventoryImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('성공 시 서버가 준 공개 URL을 반환한다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse({ url: PUBLIC_URL, path: 'user_1/closet/abc_processed.png' })
      ) as unknown as typeof fetch;

    const result = await uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE });

    expect(result).toBe(PUBLIC_URL);
    // 로컬 URI가 그대로 새어나가지 않는지 명시 검증
    expect(result).not.toContain('file://');
  });

  it('multipart FormData로 category·itemId·type과 파일 파트를 담아 보낸다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ url: PUBLIC_URL }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await uploadInventoryImage(LOCAL_URI, 'token-abc', {
      baseUrl: BASE,
      itemId: '11111111-2222-4333-8444-555555555555',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`${BASE}/api/inventory/upload`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer token-abc',
        'x-yiroom-client': 'mobile',
      })
    );
    // multipart boundary는 RN이 붙이므로 Content-Type을 직접 지정하면 안 된다
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();

    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(formValue(form, 'category')).toBe('closet');
    expect(formValue(form, 'itemId')).toBe('11111111-2222-4333-8444-555555555555');
    expect(formValue(form, 'type')).toBe('processed');
    expect(formValue(form, 'file')).toBeDefined();
  });

  it('itemId 미지정 시 서버 zod가 받는 uuid 형식을 생성한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ url: PUBLIC_URL }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const itemId = formValue(init.body as FormData, 'itemId');

    expect(String(itemId)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('토큰이 없으면 요청 없이 401로 실패한다', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(uploadInventoryImage(LOCAL_URI, null, { baseUrl: BASE })).rejects.toMatchObject({
      name: 'InventoryUploadError',
      status: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('413(용량 초과)은 원인을 알려주는 안내로 실패한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: () => Promise.reject(new Error('not json')),
    }) as unknown as typeof fetch;

    await expect(uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })).rejects.toThrow(
      '사진 용량이 너무 커요. 다시 촬영하거나 다른 사진을 선택해주세요.'
    );
  });

  it('서버 오류(500) 시 서버 메시지로 실패한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '파일 업로드에 실패했습니다.' }),
    }) as unknown as typeof fetch;

    await expect(uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })).rejects.toThrow(
      '파일 업로드에 실패했습니다.'
    );
  });

  it('검증 실패(400) 중첩 에러 봉투의 userMessage를 사용한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid upload params',
            userMessage: '입력 정보를 확인해주세요.',
          },
        }),
    }) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '입력 정보를 확인해주세요.',
    });
  });

  it('200이지만 URL이 없으면 실패한다 (로컬 URI가 저장되는 경로를 차단)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(okResponse({ path: 'x' })) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toMatchObject({ code: 'UPLOAD_ERROR' });
  });

  it('http(s)가 아닌 URL을 돌려주면 실패한다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(okResponse({ url: LOCAL_URI })) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toBeInstanceOf(InventoryUploadError);
  });

  it('네트워크 실패 시 NETWORK_ERROR로 실패한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('baseUrl 미지정 시 env 또는 프로덕션 웹으로 보낸다 (설정 누락으로 죽지 않는다)', async () => {
    const originalYiroom = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    const originalApi = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;

    const fetchMock = jest.fn().mockResolvedValue(okResponse({ url: PUBLIC_URL }));
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      await uploadInventoryImage(LOCAL_URI, 'token-1');
      expect(fetchMock.mock.calls[0][0]).toBe('https://yiroom.vercel.app/api/inventory/upload');
    } finally {
      if (originalYiroom !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalYiroom;
      if (originalApi !== undefined) process.env.EXPO_PUBLIC_API_URL = originalApi;
    }
  });
});

describe('createUploadItemId', () => {
  it('uuid v4 형식을 만든다', () => {
    expect(createUploadItemId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('호출마다 다른 값을 만든다 (경로 충돌 방지)', () => {
    expect(createUploadItemId()).not.toBe(createUploadItemId());
  });
});
