/**
 * 표현 레이어 — 트윈 오케스트레이션(생성/결합) 테스트 (ADR-115)
 *
 * store(Supabase)와 gemini(이미지)를 모킹해 오케스트레이션 로직만 검증.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/visual-expression/twin/internal/gemini', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/visual-expression/twin/internal/gemini')
  >('@/lib/visual-expression/twin/internal/gemini');
  return {
    ...actual,
    generateTwinImage: vi.fn(),
    composeTwinImage: vi.fn(),
    isMockMode: vi.fn(() => false),
  };
});

vi.mock('@/lib/visual-expression/twin/internal/store', () => ({
  insertTwin: vi.fn(),
  getTwinRowById: vi.fn(),
  downloadTwinImage: vi.fn(),
}));

import {
  generateTwin,
  composeOnTwin,
  TwinNotFoundError,
  TwinNotApprovedError,
  TwinGenerationError,
} from '@/lib/visual-expression/twin';
import {
  generateTwinImage,
  composeTwinImage,
  isMockMode,
} from '@/lib/visual-expression/twin/internal/gemini';
import {
  insertTwin,
  getTwinRowById,
  downloadTwinImage,
} from '@/lib/visual-expression/twin/internal/store';

const PENDING_RECORD = {
  id: 't-1',
  imageUrl: 'https://signed/t-1',
  status: 'pending' as const,
  aiGenerated: true as const,
};

describe('generateTwin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMockMode).mockReturnValue(false);
  });

  it('이미지 생성 실패(null)면 TwinGenerationError를 던진다(가짜 트윈 금지)', async () => {
    vi.mocked(generateTwinImage).mockResolvedValue(null);
    await expect(
      generateTwin('user-1', { faceImageBase64: 'data:image/png;base64,AA' })
    ).rejects.toBeInstanceOf(TwinGenerationError);
    expect(insertTwin).not.toHaveBeenCalled();
  });

  it('이미지 생성 성공 시 promptVersion을 담아 저장하고 pending 레코드를 반환한다', async () => {
    vi.mocked(generateTwinImage).mockResolvedValue({ data: 'IMG', mimeType: 'image/png' });
    vi.mocked(insertTwin).mockResolvedValue(PENDING_RECORD);

    const result = await generateTwin('user-1', {
      faceImageBase64: 'data:image/png;base64,AA',
      bodyConstraint: { bodyTypeLabel: '웨이브' },
    });

    expect(result.status).toBe('pending');
    expect(result.aiGenerated).toBe(true);
    const arg = vi.mocked(insertTwin).mock.calls[0][0];
    expect(arg.userId).toBe('user-1');
    expect(arg.imageBase64).toBe('IMG');
    expect(arg.sourceMeta.promptVersion).toBeDefined();
    expect(arg.sourceMeta.bodyType).toBe('웨이브');
  });
});

describe('composeOnTwin — approved만 허용', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMockMode).mockReturnValue(false);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const LAYER = { kind: 'outfit' as const, garmentImageUrl: 'https://ex.com/g.jpg' };

  it('트윈이 없으면 TwinNotFoundError를 던진다', async () => {
    vi.mocked(getTwinRowById).mockResolvedValue(null);
    await expect(composeOnTwin('user-1', 't-x', LAYER)).rejects.toBeInstanceOf(TwinNotFoundError);
    expect(composeTwinImage).not.toHaveBeenCalled();
  });

  it('승인되지 않은(pending) 트윈이면 TwinNotApprovedError를 던진다', async () => {
    vi.mocked(getTwinRowById).mockResolvedValue({
      id: 't-1',
      clerk_user_id: 'user-1',
      image_path: 'user-1/t-1.png',
      status: 'pending',
      source_meta: null,
      created_at: '2026-07-10',
    });
    await expect(composeOnTwin('user-1', 't-1', LAYER)).rejects.toBeInstanceOf(
      TwinNotApprovedError
    );
    expect(composeTwinImage).not.toHaveBeenCalled();
  });

  it('승인된 트윈이면 원본을 재주입해 착장 이미지를 반환한다(저장 안 함)', async () => {
    vi.mocked(getTwinRowById).mockResolvedValue({
      id: 't-1',
      clerk_user_id: 'user-1',
      image_path: 'user-1/t-1.png',
      status: 'approved',
      source_meta: null,
      created_at: '2026-07-10',
    });
    vi.mocked(downloadTwinImage).mockResolvedValue({ data: 'TWIN', mimeType: 'image/png' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: async () => new ArrayBuffer(4),
      }))
    );
    vi.mocked(composeTwinImage).mockResolvedValue('data:image/png;base64,OUT');

    const result = await composeOnTwin('user-1', 't-1', LAYER);
    expect(result.aiGenerated).toBe(true);
    expect(result.imageUrl).toBe('data:image/png;base64,OUT');
    expect(downloadTwinImage).toHaveBeenCalledWith('user-1/t-1.png');
  });

  it('승인 + FORCE_MOCK_AI면 다운로드/의류 fetch 없이 플레이스홀더를 반환한다', async () => {
    vi.mocked(getTwinRowById).mockResolvedValue({
      id: 't-1',
      clerk_user_id: 'user-1',
      image_path: 'user-1/t-1.png',
      status: 'approved',
      source_meta: null,
      created_at: '2026-07-10',
    });
    vi.mocked(isMockMode).mockReturnValue(true);

    const result = await composeOnTwin('user-1', 't-1', LAYER);
    expect(result.aiGenerated).toBe(true);
    expect(downloadTwinImage).not.toHaveBeenCalled();
    expect(composeTwinImage).not.toHaveBeenCalled();
  });
});
