/**
 * 일괄 등록 — 실패 재시도·고아 파일 보상·큐레이션 맥락 (2026-08 외부 리뷰 수리)
 *
 * 실측된 결함:
 * 1) 저장 대상이 status==='ready'뿐이라, 업로드는 됐는데 DB 등록만 실패한 항목은
 *    다시 시도할 방법이 없었다(사진 재선택 외). 업로드 경로도 잃어버려 재업로드가 강제됐다.
 * 2) 그렇게 올라간 사진은 어떤 행도 참조하지 않는 고아로 버킷에 남았다.
 * 3) 통합 큐레이션에서 넘어온 source·session을 등록 화면이 소비하지 않아
 *    등록을 마치면 맥락이 끊겼다(코디 추천으로 돌아갈 길 없음).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

const searchParamsMock = { value: new URLSearchParams() };

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: () => searchParamsMock.value,
}));

vi.mock('lucide-react', () => {
  const Icon = ({ className }: { className?: string }) => <span className={className} />;
  return {
    ArrowLeft: Icon,
    ImagePlus: Icon,
    Loader2: Icon,
    Check: Icon,
    X: Icon,
    AlertTriangle: Icon,
    ChevronDownIcon: Icon,
    ChevronUpIcon: Icon,
    CheckIcon: Icon,
  };
});

vi.mock('@/lib/inventory/imageProcessing', () => ({
  validateImageFile: () => ({ valid: true }),
  resizeImage: async () => new Blob(['img'], { type: 'image/png' }),
  blobToDataUrl: async () => 'data:image/png;base64,AAAA',
  dataUrlToBlob: () => new Blob(['x'], { type: 'image/png' }),
}));

vi.mock('@/lib/image/upload-downscale', () => ({
  prepareUploadBlob: async () => new Blob(['x'], { type: 'image/png' }),
  uploadErrorMessage: (status: number) => `업로드 실패(${status})`,
}));

import BatchAddClothingPage from '@/app/(main)/closet/add/batch/page';

interface FetchCall {
  url: string;
  method: string;
}

/** 분류는 항상 성공, 등록(/api/inventory POST)만 시나리오로 제어한다 */
function setupFetch({ saveFails }: { saveFails: () => boolean }) {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? 'GET' });

    if (url === '/api/inventory/classify') {
      return {
        ok: true,
        json: async () => ({
          suggestedName: '셔츠',
          category: 'top',
          subCategory: '셔츠',
          colors: ['화이트'],
          seasons: ['spring'],
          occasions: ['casual'],
          pattern: 'solid',
          usedFallback: false,
        }),
      } as Response;
    }
    if (url === '/api/inventory/upload' && init?.method === 'POST') {
      return {
        ok: true,
        json: async () => ({ path: 'user-1/closet/item_processed.png' }),
      } as Response;
    }
    if (url.startsWith('/api/inventory/upload') && init?.method === 'DELETE') {
      return { ok: true, json: async () => ({ success: true }) } as Response;
    }
    if (url === '/api/inventory' && init?.method === 'POST') {
      return saveFails()
        ? ({ ok: false, status: 500, json: async () => ({ error: 'boom' }) } as Response)
        : ({ ok: true, json: async () => ({ success: true }) } as Response);
    }
    return { ok: true, json: async () => ({}) } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return { calls, fetchMock };
}

function selectOnePhoto() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
}

const pushMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  searchParamsMock.value = new URLSearchParams();
  (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: pushMock, back: vi.fn() });
});

describe('일괄 등록 — 실패 재시도', () => {
  it('DB 등록만 실패한 항목을 재시도할 수 있고, 사진은 다시 올리지 않는다', async () => {
    let failing = true;
    const { calls } = setupFetch({ saveFails: () => failing });

    render(<BatchAddClothingPage />);
    selectOnePhoto();

    // 1차 저장 → 실패
    const saveButton = await screen.findByText('1벌 한 번에 저장');
    fireEvent.click(saveButton);

    // 실패 항목이 남아 있으면 버튼이 재시도로 바뀐다 (예전엔 대상 0개라 영영 비활성)
    const retryButton = await screen.findByText('1벌 다시 시도');
    expect(retryButton).toBeEnabled();

    const uploadsAfterFirst = calls.filter(
      (c) => c.url === '/api/inventory/upload' && c.method === 'POST'
    ).length;
    expect(uploadsAfterFirst).toBe(1);

    // 2차 저장 → 성공
    failing = false;
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('옷장 보러 가기 (1벌 등록 완료)')).toBeInTheDocument();
    });

    // 재시도는 보존한 업로드 경로를 재사용한다 → 업로드는 여전히 1회
    expect(
      calls.filter((c) => c.url === '/api/inventory/upload' && c.method === 'POST')
    ).toHaveLength(1);
    expect(calls.filter((c) => c.url === '/api/inventory' && c.method === 'POST')).toHaveLength(2);
  });

  it('실패 항목을 목록에서 빼면 올라간 사진의 보상 삭제를 시도한다', async () => {
    const { calls } = setupFetch({ saveFails: () => true });

    render(<BatchAddClothingPage />);
    selectOnePhoto();

    fireEvent.click(await screen.findByText('1벌 한 번에 저장'));
    await screen.findByText('1벌 다시 시도');

    fireEvent.click(screen.getByLabelText('제외'));

    await waitFor(() => {
      const deleteCall = calls.find(
        (c) => c.url.startsWith('/api/inventory/upload') && c.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
    });
  });
});

describe('일괄 등록 — 큐레이션 맥락', () => {
  it('맥락 없이 들어오면 복귀 CTA를 만들지 않는다', async () => {
    setupFetch({ saveFails: () => false });

    render(<BatchAddClothingPage />);
    selectOnePhoto();

    fireEvent.click(await screen.findByText('1벌 한 번에 저장'));
    await screen.findByText('옷장 보러 가기 (1벌 등록 완료)');

    expect(screen.queryByTestId('batch-curation-return-cta')).not.toBeInTheDocument();
  });

  it('통합 큐레이션에서 왔으면 등록 후 세션을 유지한 코디 추천 CTA를 준다', async () => {
    searchParamsMock.value = new URLSearchParams('source=integrated&session=sess-1');
    setupFetch({ saveFails: () => false });

    render(<BatchAddClothingPage />);

    // 단건 등록 경로에도 맥락을 이어붙인다
    fireEvent.click(screen.getByTestId('batch-single-add-link'));
    expect(pushMock).toHaveBeenCalledWith('/closet/add?source=integrated&session=sess-1');

    selectOnePhoto();
    fireEvent.click(await screen.findByText('1벌 한 번에 저장'));

    const cta = await screen.findByTestId('batch-curation-return-cta');
    fireEvent.click(cta);

    expect(pushMock).toHaveBeenCalledWith('/closet/recommend?source=integrated&session=sess-1');
  });
});
