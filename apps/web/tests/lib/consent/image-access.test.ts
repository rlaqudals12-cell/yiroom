import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasActiveAnalysisImageAccess,
  resolveConsentedAnalysisImageUrl,
  signConsentedAnalysisImageUrls,
} from '@/lib/consent/image-access';

type QueryResult = { data: unknown; error: unknown };

function createClient(options?: {
  imageConsent?: QueryResult;
  agreement?: QueryResult;
  signedUrl?: string;
}) {
  const imageConsent =
    options?.imageConsent ??
    ({
      data: {
        consent_given: true,
        consent_version: 'v1.0',
        retention_until: '2999-01-01T00:00:00.000Z',
      },
      error: null,
    } satisfies QueryResult);
  const agreement =
    options?.agreement ?? ({ data: { biometric_agreed: true }, error: null } satisfies QueryResult);
  const eq = vi.fn();
  const queries: Record<string, { select: ReturnType<typeof vi.fn> }> = {};

  const from = vi.fn((table: string) => {
    const result = table === 'image_consents' ? imageConsent : agreement;
    const chain: {
      eq: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue(result),
    };
    chain.eq.mockImplementation((...args: unknown[]) => {
      eq(...args);
      return chain;
    });
    const query = { select: vi.fn().mockReturnValue(chain) };
    queries[table] = query;
    return query;
  });
  const createSignedUrls = vi.fn().mockResolvedValue({
    data: [{ path: 'user_1/photo.jpg', signedUrl: options?.signedUrl ?? 'https://signed/photo' }],
    error: null,
  });
  const storageFrom = vi.fn().mockReturnValue({ createSignedUrls });
  const client = {
    from,
    storage: { from: storageFrom },
  } as unknown as SupabaseClient;

  return { client, from, eq, queries, storageFrom, createSignedUrls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('analysis image access consent boundary', () => {
  it('축별 최신·미만료 저장 동의와 전역 생체정보 동의가 모두 있을 때만 연다', async () => {
    const { client, eq } = createClient();

    await expect(hasActiveAnalysisImageAccess(client, 'hair', 'user_1')).resolves.toBe(true);
    expect(eq).toHaveBeenCalledWith('analysis_type', 'hair');
    expect(eq).toHaveBeenCalledWith('clerk_user_id', 'user_1');
  });

  it.each([
    {
      label: '축별 동의 철회',
      imageConsent: {
        data: {
          consent_given: false,
          consent_version: 'v1.0',
          retention_until: '2999-01-01T00:00:00.000Z',
        },
        error: null,
      },
    },
    {
      label: '축별 동의 만료',
      imageConsent: {
        data: {
          consent_given: true,
          consent_version: 'v1.0',
          retention_until: '2000-01-01T00:00:00.000Z',
        },
        error: null,
      },
    },
    {
      label: '구버전 동의',
      imageConsent: {
        data: {
          consent_given: true,
          consent_version: 'v0.9',
          retention_until: '2999-01-01T00:00:00.000Z',
        },
        error: null,
      },
    },
    {
      label: '축별 동의 조회 오류',
      imageConsent: { data: null, error: { message: 'unavailable' } },
    },
  ])('$label이면 닫는다', async ({ imageConsent }) => {
    const { client } = createClient({ imageConsent });

    await expect(hasActiveAnalysisImageAccess(client, 'skin', 'user_1')).resolves.toBe(false);
  });

  it.each([
    {
      label: '전역 생체정보 미동의',
      agreement: { data: { biometric_agreed: false }, error: null },
    },
    { label: '전역 동의 조회 오류', agreement: { data: null, error: { message: 'unavailable' } } },
  ])('$label이면 닫는다', async ({ agreement }) => {
    const { client } = createClient({ agreement });

    await expect(hasActiveAnalysisImageAccess(client, 'makeup', 'user_1')).resolves.toBe(false);
  });

  it('비활성 동의면 서버 응답의 모든 이미지 값을 null로 만들고 서명하지 않는다', async () => {
    const { client, storageFrom } = createClient({
      agreement: { data: { biometric_agreed: false }, error: null },
    });

    await expect(
      signConsentedAnalysisImageUrls(client, 'user_1', 'personal-color', [
        'user_1/photo.jpg',
        'https://external.example/photo.jpg',
      ])
    ).resolves.toEqual([null, null]);
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it('활성 동의면 비공개 경로를 1시간 URL로 일괄 서명한다', async () => {
    const { client, storageFrom, createSignedUrls } = createClient();

    await expect(
      signConsentedAnalysisImageUrls(client, 'user_1', 'hair', ['user_1/photo.jpg'])
    ).resolves.toEqual(['https://signed/photo']);
    expect(storageFrom).toHaveBeenCalledWith('hair-images');
    expect(createSignedUrls).toHaveBeenCalledWith(['user_1/photo.jpg'], 3600);
  });

  it('클라이언트 경계도 비활성 동의면 외부 URL을 우회 통과시키지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { client } = createClient({
      agreement: { data: { biometric_agreed: false }, error: null },
    });

    await expect(
      resolveConsentedAnalysisImageUrl(client, 'skin', 'https://external.example/photo.jpg')
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
