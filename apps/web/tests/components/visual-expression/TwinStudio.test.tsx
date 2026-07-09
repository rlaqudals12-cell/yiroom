/**
 * TwinStudio 테스트 (ADR-115)
 * - 안내 → 업로드 → 생성 → 승인 게이트 플로우
 * - 승인 게이트 3버튼(네 저예요 / 다시 만들기 / 그만두기)
 * - 생성 트윈에 "AI 생성" 라벨 상시
 * - 429(일 상한) 응답 시 정직한 안내 문구
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TwinStudio } from '@/components/visual-expression/TwinStudio';

// 이미지 압축은 jsdom canvas 의존 → 고정 base64로 대체
vi.mock('@/lib/utils/image-compression', () => ({
  compressFileToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,FACE'),
}));

// sonner toast 스텁
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
    info: vi.fn(),
  },
}));

const APPROVED_HANDLER = vi.fn();

function uploadFaceAndGenerate() {
  // intro → 시작하기
  fireEvent.click(screen.getByTestId('twin-intro-continue'));
  // 얼굴 파일 업로드 (첫 번째 file input)
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const faceInput = fileInputs[0] as HTMLInputElement;
  const file = new File(['x'], 'me.jpg', { type: 'image/jpeg' });
  fireEvent.change(faceInput, { target: { files: [file] } });
}

describe('TwinStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('생성 성공 시 승인 게이트 3버튼과 "AI 생성" 라벨을 노출한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'twin-1',
          imageUrl: 'https://x/twin.jpg',
          status: 'pending',
          aiGenerated: true,
        }),
      })
    );

    render(<TwinStudio open onOpenChange={() => {}} onApproved={APPROVED_HANDLER} />);
    uploadFaceAndGenerate();

    // 트윈 만들기 버튼 활성화 대기 후 클릭
    const genBtn = await screen.findByTestId('twin-generate-button');
    await waitFor(() => expect(genBtn).not.toBeDisabled());
    fireEvent.click(genBtn);

    // 승인 게이트 도달
    await waitFor(() => expect(screen.getByTestId('twin-review')).toBeInTheDocument());
    expect(screen.getByTestId('ai-generated-label')).toBeInTheDocument();
    expect(screen.getByTestId('twin-approve-button')).toBeInTheDocument();
    expect(screen.getByTestId('twin-regenerate-button')).toBeInTheDocument();
    expect(screen.getByTestId('twin-discard-button')).toBeInTheDocument();
  });

  it('승인 클릭 시 PATCH approve 호출 + onApproved 콜백', async () => {
    const fetchMock = vi
      .fn()
      // POST 생성
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'twin-1',
          imageUrl: 'https://x/twin.jpg',
          status: 'pending',
          aiGenerated: true,
        }),
      })
      // PATCH approve
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    render(<TwinStudio open onOpenChange={() => {}} onApproved={APPROVED_HANDLER} />);
    uploadFaceAndGenerate();
    fireEvent.click(await screen.findByTestId('twin-generate-button'));

    const approveBtn = await screen.findByTestId('twin-approve-button');
    fireEvent.click(approveBtn);

    await waitFor(() => expect(APPROVED_HANDLER).toHaveBeenCalled());
    const patchCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'PATCH'
    );
    expect(patchCall).toBeTruthy();
    expect(String((patchCall?.[1] as RequestInit).body)).toContain('approve');
  });

  it('사용자 대면 라벨은 "트윈"이 아니라 "AI 아바타"를 쓴다', () => {
    render(<TwinStudio open onOpenChange={() => {}} />);

    // 안내(intro) 화면: 상한 고지 문구가 "AI 아바타" 표현
    expect(screen.getByText(/AI 아바타 만들기는 하루에 5번/)).toBeInTheDocument();
    expect(screen.queryByText(/트윈을 만들 수 없어요/)).toBeNull();
  });

  it('429(일 상한) 응답 시 안내 문구를 노출한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: '오늘은 트윈을 더 만들 수 없어요. 내일 다시 시도해 주세요.' }),
      })
    );

    render(<TwinStudio open onOpenChange={() => {}} />);
    uploadFaceAndGenerate();
    fireEvent.click(await screen.findByTestId('twin-generate-button'));

    await waitFor(() => expect(screen.getByTestId('twin-error')).toBeInTheDocument());
    expect(screen.getByText(/오늘은 트윈을 더 만들 수 없어요/)).toBeInTheDocument();
  });
});
