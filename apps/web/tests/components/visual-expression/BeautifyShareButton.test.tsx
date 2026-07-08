/**
 * BeautifyShareButton 테스트 (ADR-113)
 * - 트리거 노출
 * - 보정 성공 시 "AI 보정됨" 라벨 상시 렌더
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BeautifyShareButton } from '@/components/visual-expression/BeautifyShareButton';

describe('BeautifyShareButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('공유 트리거 버튼을 렌더한다', () => {
    render(<BeautifyShareButton />);
    expect(screen.getByTestId('beautify-share-button')).toBeInTheDocument();
  });

  it('보정 성공 시 "AI 보정됨" 라벨을 렌더한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          imageBase64: 'data:image/png;base64,ZZZ',
          aiEdited: true,
          model: 'gemini-2.5-flash-image',
        }),
      })
    );

    render(<BeautifyShareButton />);

    // 모달 열기
    fireEvent.click(screen.getByTestId('beautify-share-button'));

    // 파일 업로드 → 미리보기 생성
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const file = new File(['imagebytes'], 'me.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 보정 버튼 노출 대기 후 클릭
    const beautifyBtn = await screen.findByText('자연 보정하기');
    fireEvent.click(beautifyBtn);

    // AI 보정됨 라벨 확인
    await waitFor(() => {
      expect(screen.getByTestId('ai-edited-label')).toBeInTheDocument();
    });
  });
});
