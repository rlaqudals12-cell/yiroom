/**
 * 인벤토리 이미지 업로드 HTTP 클라이언트 테스트
 *
 * @see lib/api/inventory-upload.ts
 * 핵심 계약: 성공 시 **서버 스토리지 경로**만 반환하고, 실패하면 반드시 throw한다
 *           (로컬 file:// URI를 성공인 척 돌려주면 사진이 유실된다).
 *           경로를 반환하는 이유 = inventory-images가 비공개 버킷이라 영구 공개 URL을
 *           저장하면 안 되기 때문(2026-08-16 보안 수리).
 */

import {
  uploadInventoryImage,
  classifyInventoryImage,
  recordInventoryItemUsage,
  recordInventoryOutfitWear,
  createUploadItemId,
  InventoryUploadError,
} from '@/lib/api/inventory-upload';

const BASE = 'https://api.test';
const LOCAL_URI = 'file:///data/user/0/com.yiroom.app/cache/photo.jpg';
const STORAGE_PATH = 'user_1/closet/11111111-2222-4333-8444-555555555555_processed.png';

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}

/**
 * 코드가 append한 파트를 **원본 그대로** 붙잡아두는 최소 FormData 스텁.
 *
 * 왜 필요한가: RN의 FormData는 파일 파트로 `{uri,name,type}` 객체를 받지만,
 * 테스트 환경(jsdom/노드)의 FormData는 객체를 '[object Object]'로 문자열화해버린다.
 * 그러면 "로컬 URI가 실제로 요청에 실렸는가"를 검증할 수 없고,
 * uri를 빠뜨리는 회귀가 테스트를 그대로 통과한다(=사진 유실이 조용히 배포됨).
 */
class RecordingFormData {
  readonly parts: Array<{ name: string; value: unknown }> = [];

  append(name: string, value: unknown): void {
    this.parts.push({ name, value });
  }

  get(name: string): unknown {
    return this.parts.find((part) => part.name === name)?.value ?? null;
  }
}

const OriginalFormData = global.FormData;

function formValue(form: FormData, key: string): unknown {
  return (form as unknown as RecordingFormData).get(key);
}

describe('uploadInventoryImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.FormData = RecordingFormData as unknown as typeof FormData;
  });

  afterEach(() => {
    global.FormData = OriginalFormData;
  });

  it('성공 시 서버가 준 스토리지 경로를 반환한다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(okResponse({ path: STORAGE_PATH })) as unknown as typeof fetch;

    const result = await uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE });

    expect(result).toBe(STORAGE_PATH);
    // 로컬 URI가 그대로 새어나가지 않는지 명시 검증
    expect(result).not.toContain('file://');
  });

  it('영구 공개 URL을 저장 후보로 돌려주지 않는다 (비공개 버킷)', async () => {
    // 서버가 실수로 url을 함께 보내도 클라이언트는 path만 채택해야 한다
    global.fetch = jest.fn().mockResolvedValue(
      okResponse({
        path: STORAGE_PATH,
        url: 'https://cdn.example/storage/v1/object/public/inventory-images/x.png',
      })
    ) as unknown as typeof fetch;

    const result = await uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE });

    expect(result).toBe(STORAGE_PATH);
    expect(result).not.toMatch(/^https?:\/\//);
  });

  it('multipart FormData로 category·itemId·type과 파일 파트를 담아 보낸다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ path: STORAGE_PATH }));
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
  });

  // 회귀 방지의 본체: 파일 파트가 "존재한다"가 아니라 **선택한 사진의 로컬 URI를 실제로 싣는다**를
  // 검증한다. uri를 빠뜨리거나 다른 값으로 바꾸면 여기서 반드시 깨진다.
  it('파일 파트에 선택한 사진의 로컬 URI를 그대로 싣는다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ path: STORAGE_PATH }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const filePart = formValue(init.body as FormData, 'file');

    expect(filePart).toEqual({
      uri: LOCAL_URI,
      name: 'image.jpg',
      type: 'image/jpeg',
    });
  });

  it('itemId 미지정 시 서버 zod가 받는 uuid 형식을 생성한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ path: STORAGE_PATH }));
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

  it('200이지만 경로가 없으면 실패한다 (로컬 URI가 저장되는 경로를 차단)', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ ok: true })) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toMatchObject({ code: 'UPLOAD_ERROR' });
  });

  it('경로가 아니라 스킴이 붙은 값(file://)을 돌려주면 실패한다', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(okResponse({ path: LOCAL_URI })) as unknown as typeof fetch;

    await expect(
      uploadInventoryImage(LOCAL_URI, 'token-1', { baseUrl: BASE })
    ).rejects.toBeInstanceOf(InventoryUploadError);
  });

  it('baseUrl 미지정 시 env 또는 프로덕션 웹으로 보낸다 (설정 누락으로 죽지 않는다)', async () => {
    const originalYiroom = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    const originalApi = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;

    const fetchMock = jest.fn().mockResolvedValue(okResponse({ path: STORAGE_PATH }));
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

describe('classifyInventoryImage TPO 계약', () => {
  it('웹이 허용한 출근·하객 태그만 보존하고 미지원 값은 버린다', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      okResponse({
        suggestedName: '네이비 재킷',
        category: 'outer',
        colors: ['네이비'],
        seasons: ['autumn'],
        occasions: ['work', 'wedding_guest', 'party', 1],
        usedFallback: false,
      })
    ) as unknown as typeof fetch;

    const result = await classifyInventoryImage('data:image/jpeg;base64,AAAA', 'token-1', BASE);

    expect(result.occasions).toEqual(['work', 'wedding_guest']);
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

describe('inventory wear actions', () => {
  it('단품 착용 기록을 인증된 웹 API로 요청한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await recordInventoryItemUsage('item/1', 'token-1', BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/inventory/item%2F1`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
        body: JSON.stringify({ action: 'recordUsage' }),
      })
    );
  });

  it('코디 착용 기록을 연쇄 갱신 웹 API로 요청한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await recordInventoryOutfitWear('outfit-1', 'token-1', BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/inventory/outfits/outfit-1?action=recordWear`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      })
    );
  });
});
