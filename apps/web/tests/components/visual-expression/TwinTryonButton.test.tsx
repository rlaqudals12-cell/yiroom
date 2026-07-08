/**
 * TwinTryonButton 테스트 (ADR-115)
 * - 착장 결과에 "AI 생성 이미지" 라벨 상시
 * - 429(상한) 응답 시 결과 미노출 + 안내(toast)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TwinTryonButton } from '@/components/visual-expression/TwinTryonButton';

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn(), info: vi.fn() },
}));

describe('TwinTryonButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('입혀보기 성공 시 결과 이미지에 "AI 생성 이미지" 라벨을 노출한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ imageUrl: 'https://x/outfit.jpg', aiGenerated: true }),
      })
    );

    render(<TwinTryonButton twinId="twin-1" garmentImageUrl="https://x/g.jpg" />);

    fireEvent.click(screen.getByTestId('twin-tryon-button'));
    const composeBtn = await screen.findByText('입혀보기');
    fireEvent.click(composeBtn);

    await waitFor(() => expect(screen.getByTestId('ai-generated-label')).toBeInTheDocument());
  });

  it('429(상한) 응답 시 결과를 노출하지 않고 안내한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: '오늘은 더 만들 수 없어요. 내일 다시 시도해 주세요.' }),
      })
    );

    render(<TwinTryonButton twinId="twin-1" garmentImageUrl="https://x/g.jpg" />);

    fireEvent.click(screen.getByTestId('twin-tryon-button'));
    fireEvent.click(await screen.findByText('입혀보기'));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(screen.queryByTestId('ai-generated-label')).toBeNull();
  });
});
