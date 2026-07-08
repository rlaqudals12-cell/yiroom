/**
 * TryonButton 표면 게이팅 테스트 (ADR-113)
 * - 키 없을 때(available:false) 버튼 비노출
 * - available:true면 "입어보기" 노출
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TryonButton } from '@/components/visual-expression/TryonButton';

describe('TryonButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  function mockAvailability(available: boolean) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available }),
      })
    );
  }

  it('키가 없으면(available:false) 버튼을 렌더하지 않는다', async () => {
    mockAvailability(false);
    render(<TryonButton garmentImageUrl="https://x/g.jpg" category="tops" />);
    // 마운트 후 fetch 해소되어도 계속 비노출
    await waitFor(() => {
      expect(screen.queryByTestId('tryon-button')).toBeNull();
    });
  });

  it('available:true면 입어보기 버튼을 노출한다', async () => {
    mockAvailability(true);
    render(<TryonButton garmentImageUrl="https://x/g.jpg" category="tops" />);
    await waitFor(() => {
      expect(screen.getByTestId('tryon-button')).toBeInTheDocument();
    });
  });
});
