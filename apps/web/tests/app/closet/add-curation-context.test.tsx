/**
 * 옷 단건 등록 — 통합 큐레이션 맥락 유지 (2026-08 외부 리뷰 수리)
 *
 * 배경: 통합 분석 결과의 "옷을 넣어야 코디를 받을 수 있어요"가 넘겨준 source·session을
 * 등록 화면이 소비하지 않았다. 등록을 마치면 무조건 /closet으로 튕겨,
 * 사용자가 보던 코디 추천으로 돌아갈 길이 없었다.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { UploadResult } from '@/components/inventory';

const pushMock = vi.fn();
const searchParamsMock = { value: new URLSearchParams() };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useSearchParams: () => searchParamsMock.value,
}));

vi.mock('@/components/inventory', () => ({
  ItemUploader: ({ onUploadComplete }: { onUploadComplete: (r: UploadResult) => void }) =>
    React.createElement(
      'button',
      {
        'data-testid': 'stub-upload',
        onClick: () =>
          onUploadComplete({
            originalUrl: 'data:image/png;base64,orig',
            processedUrl: 'data:image/png;base64,proc',
            classification: {
              suggestedName: '화이트 셔츠',
              category: 'top',
              subCategory: '셔츠',
              colors: ['화이트'],
              seasons: ['spring'],
              occasions: ['casual'],
              pattern: 'solid',
              confidence: 0.9,
              usedFallback: false,
            },
          } as UploadResult),
      },
      '업로드'
    ),
}));

vi.mock('@/lib/image/upload-downscale', () => ({
  prepareUploadBlob: async () => new Blob(['x'], { type: 'image/png' }),
  uploadErrorMessage: (status: number) => `업로드 실패(${status})`,
}));

import AddClothingPage from '@/app/(main)/closet/add/page';

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === '/api/inventory/upload') {
      return {
        ok: true,
        json: async () => ({ path: 'user-1/closet/x_processed.png' }),
      } as Response;
    }
    return { ok: true, json: async () => ({ success: true }) } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** 업로드 → 상세 폼 → 저장 */
async function uploadAndSave() {
  fireEvent.click(screen.getByTestId('stub-upload'));
  await waitFor(() => expect(screen.getByTestId('category-select')).toBeInTheDocument());
  fireEvent.click(screen.getByText('저장하기'));
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParamsMock.value = new URLSearchParams();
  mockFetch();
});

describe('옷 단건 등록 — 큐레이션 맥락', () => {
  it('맥락이 없으면 기존대로 옷장으로 이동한다', async () => {
    render(<AddClothingPage />);

    await uploadAndSave();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/closet'));
    expect(screen.queryByTestId('curation-saved-panel')).not.toBeInTheDocument();
  });

  it('일괄 등록 링크에 source·session을 이어붙인다', () => {
    searchParamsMock.value = new URLSearchParams('source=integrated&session=sess-1');
    render(<AddClothingPage />);

    fireEvent.click(screen.getByText('여러 벌 한 번에 등록하기'));

    expect(pushMock).toHaveBeenCalledWith('/closet/add/batch?source=integrated&session=sess-1');
  });

  it('큐레이션에서 왔으면 저장 후 튕기지 않고 복귀 CTA를 준다', async () => {
    searchParamsMock.value = new URLSearchParams('source=integrated&session=sess-1');
    render(<AddClothingPage />);

    await uploadAndSave();

    // 강제 이동 없음 — 어디로 갈지는 사용자가 고른다
    await waitFor(() => expect(screen.getByTestId('curation-saved-panel')).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalledWith('/closet');

    fireEvent.click(screen.getByTestId('curation-return-cta'));
    expect(pushMock).toHaveBeenCalledWith('/closet/recommend?source=integrated&session=sess-1');
  });

  it('"옷 더 등록하기"는 폼을 비우고 업로드 단계로 되돌린다', async () => {
    searchParamsMock.value = new URLSearchParams('source=integrated');
    render(<AddClothingPage />);

    await uploadAndSave();
    await waitFor(() => expect(screen.getByTestId('curation-saved-panel')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('curation-add-more-cta'));

    expect(screen.queryByTestId('curation-saved-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('stub-upload')).toBeInTheDocument();
  });
});
