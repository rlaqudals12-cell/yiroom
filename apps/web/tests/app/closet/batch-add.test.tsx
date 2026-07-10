/**
 * 옷 일괄 등록 — 파일 인테이크 표면화 테스트
 *
 * 배경: 사진을 골랐는데 지원하지 않는 형식·디코딩 실패로 전부 걸러지면
 * 조용히 return 하여 "아무 반응 없음(무반응)"으로 오해되던 버그가 있었다.
 * 이제는 이유를 반드시 표면화한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// 아이콘은 가벼운 스텁으로 대체 (shadcn ui/select 내부 아이콘 포함)
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

// 이미지 처리 유틸을 제어 가능하게 mock (jsdom엔 createImageBitmap이 없음)
const mockValidate = vi.fn();
const mockResize = vi.fn();
const mockBlobToDataUrl = vi.fn();
vi.mock('@/lib/inventory/imageProcessing', () => ({
  validateImageFile: (f: File) => mockValidate(f),
  resizeImage: (...args: unknown[]) => mockResize(...args),
  blobToDataUrl: (...args: unknown[]) => mockBlobToDataUrl(...args),
  dataUrlToBlob: () => new Blob(['x'], { type: 'image/png' }),
}));

import BatchAddClothingPage from '@/app/(main)/closet/add/batch/page';

function selectFiles(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  fireEvent.change(input, { target: { files } });
}

describe('BatchAddClothingPage — 파일 인테이크 표면화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: vi.fn(), back: vi.fn() });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestedName: '셔츠', category: 'top', colors: [] }),
    }) as unknown as typeof fetch;
    mockResize.mockResolvedValue(new Blob(['img'], { type: 'image/png' }));
    mockBlobToDataUrl.mockResolvedValue('data:image/png;base64,AAAA');
  });

  it('선택한 파일이 전부 미지원 형식이면 조용히 끝내지 않고 안내를 표면화한다', async () => {
    mockValidate.mockReturnValue({ valid: false, error: '지원하지 않는 형식' });

    render(<BatchAddClothingPage />);
    selectFiles([new File(['x'], 'a.heic', { type: 'image/heic' })]);

    await waitFor(() => {
      expect(screen.getByTestId('batch-intake-notice')).toBeInTheDocument();
    });
    // 무반응이 아님: 카드가 생기지 않고 안내 문구가 뜬다
    expect(screen.queryByTestId('batch-item-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('batch-intake-notice').textContent).toMatch(/열지 못했어요/);
  });

  it('디코딩 실패 파일은 개수를 집계해 "건너뛰었어요"로 알린다', async () => {
    mockValidate.mockReturnValue({ valid: true });
    // 첫 장 디코딩 실패, 둘째 장 성공
    mockResize.mockRejectedValueOnce(new Error('decode fail'));

    render(<BatchAddClothingPage />);
    selectFiles([
      new File(['x'], 'a.png', { type: 'image/png' }),
      new File(['y'], 'b.png', { type: 'image/png' }),
    ]);

    await waitFor(() => {
      expect(screen.getByTestId('batch-item-card')).toBeInTheDocument();
    });
    expect(screen.getByTestId('batch-intake-notice').textContent).toMatch(/건너뛰었어요/);
  });

  it('정상 파일만 선택하면 안내 없이 아이템 카드가 생성된다', async () => {
    mockValidate.mockReturnValue({ valid: true });

    render(<BatchAddClothingPage />);
    selectFiles([new File(['x'], 'a.png', { type: 'image/png' })]);

    await waitFor(() => {
      expect(screen.getByTestId('batch-item-card')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('batch-intake-notice')).not.toBeInTheDocument();
  });
});
