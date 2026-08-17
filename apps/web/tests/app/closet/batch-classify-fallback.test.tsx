/**
 * 옷 일괄 등록 — AI 자동 분류 폴백 정직 처리 테스트
 *
 * 배경: /api/inventory/classify 는 AI 미가용·파싱 실패 시 자리표시자
 * ('티셔츠/화이트/캐주얼 티셔츠')를 200으로 돌려줬고, 배치 등록은 그것을
 * 진짜 판정처럼 채택해 옷장에 지어낸 분류를 영구 저장했다.
 * 이제 응답의 usedFallback 표식을 보고 기존 '정직 실패 경로'(빈 metadata + 배지)로 합류한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
  useSearchParams: () => new URLSearchParams(),
}));

// 이미지 처리 유틸을 제어 가능하게 mock (jsdom엔 createImageBitmap이 없음)
vi.mock('@/lib/inventory/imageProcessing', () => ({
  validateImageFile: () => ({ valid: true }),
  resizeImage: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
  blobToDataUrl: () => Promise.resolve('data:image/png;base64,AAAA'),
  dataUrlToBlob: () => new Blob(['x'], { type: 'image/png' }),
}));

// 업로드 축소 유틸 — 네트워크·canvas 의존 제거
vi.mock('@/lib/image/upload-downscale', () => ({
  prepareUploadBlob: () => Promise.resolve(new Blob(['x'], { type: 'image/png' })),
  uploadErrorMessage: (status: number) => `업로드 실패 (${status})`,
}));

import BatchAddClothingPage from '@/app/(main)/closet/add/batch/page';

/** classify 응답만 시나리오별로 바꾸는 fetch mock */
function mockFetch(classifyResponse: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/inventory/classify') {
      return { ok: true, json: async () => classifyResponse } as Response;
    }
    if (url === '/api/inventory/upload') {
      return { ok: true, json: async () => ({ url: 'https://example.com/a.png' }) } as Response;
    }
    return { ok: true, json: async () => ({ success: true }) } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** 서버 폴백 자리표시자 (route.ts generateMockClassification과 동일 형상) */
const FALLBACK_RESPONSE = {
  category: 'top',
  subCategory: '티셔츠',
  suggestedName: '캐주얼 티셔츠',
  colors: ['화이트'],
  pattern: 'solid',
  seasons: [],
  occasions: [],
  confidence: 0.5,
  usedFallback: true,
};

const REAL_RESPONSE = {
  category: 'bottom',
  subCategory: '청바지',
  suggestedName: '연청 데님',
  colors: ['블루'],
  pattern: 'solid',
  seasons: ['spring'],
  occasions: ['casual'],
  confidence: 0.9,
  usedFallback: false,
};

function selectOneFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
}

describe('BatchAddClothingPage — 분류 폴백 정직 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('폴백 응답은 채택하지 않고 실패 배지를 띄운다', async () => {
    mockFetch(FALLBACK_RESPONSE);

    render(<BatchAddClothingPage />);
    selectOneFile();

    await waitFor(() => {
      expect(screen.getByTestId('batch-classify-failed')).toBeInTheDocument();
    });
    expect(screen.getByTestId('batch-classify-failed')).toHaveTextContent('자동 분류 실패');

    // 지어낸 이름·색상을 폼에 채우지 않는다 (중립 기본값만)
    expect(screen.getByPlaceholderText('이름')).toHaveValue('의류');
    expect(screen.queryByText('캐주얼 티셔츠')).not.toBeInTheDocument();
    expect(screen.queryByText('화이트')).not.toBeInTheDocument();
  });

  it('폴백 상태로 저장하면 지어낸 분류 대신 빈 metadata를 보낸다', async () => {
    const fetchMock = mockFetch(FALLBACK_RESPONSE);

    render(<BatchAddClothingPage />);
    selectOneFile();

    await waitFor(() => {
      expect(screen.getByTestId('batch-classify-failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1벌 한 번에 저장'));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/inventory')).toBe(true);
    });

    const saveCall = fetchMock.mock.calls.find(([url]) => String(url) === '/api/inventory');
    const body = JSON.parse(String((saveCall?.[1] as RequestInit | undefined)?.body)) as {
      name: string;
      subCategory: string;
      metadata: { color: string[]; season: string[]; occasion: string[] };
    };

    // 수리 전에는 '티셔츠'/'화이트'가 그대로 옷장에 영구 저장됐다
    expect(body.subCategory).toBe('top');
    expect(body.name).toBe('의류');
    expect(body.metadata.color).toEqual([]);
    expect(body.metadata.season).toEqual([]);
    expect(body.metadata.occasion).toEqual([]);
  });

  it('실제 AI 판정은 그대로 채택하고 실패 배지를 띄우지 않는다', async () => {
    const fetchMock = mockFetch(REAL_RESPONSE);

    render(<BatchAddClothingPage />);
    selectOneFile();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('이름')).toHaveValue('연청 데님');
    });
    expect(screen.queryByTestId('batch-classify-failed')).not.toBeInTheDocument();
    expect(screen.getByText('블루 · 1계절')).toBeInTheDocument();

    fireEvent.click(screen.getByText('1벌 한 번에 저장'));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url) === '/api/inventory')).toBe(true);
    });

    const saveCall = fetchMock.mock.calls.find(([url]) => String(url) === '/api/inventory');
    const body = JSON.parse(String((saveCall?.[1] as RequestInit | undefined)?.body)) as {
      subCategory: string;
      metadata: { color: string[] };
    };
    expect(body.subCategory).toBe('청바지');
    expect(body.metadata.color).toEqual(['블루']);
  });
});
