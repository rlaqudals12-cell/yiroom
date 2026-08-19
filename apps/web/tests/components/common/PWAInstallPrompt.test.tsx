import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('설치 보조 동선을 핑크 대신 뉴트럴 잉크로 표시한다', async () => {
    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    });

    render(<PWAInstallPrompt />);
    act(() => window.dispatchEvent(event));

    const prompt = await screen.findByTestId('pwa-install-prompt');
    const icon = screen.getByTestId('pwa-install-icon');
    const installButton = screen.getByRole('button', { name: /설치$/ });

    expect(prompt).toBeInTheDocument();
    expect(icon).toHaveClass('bg-muted');
    expect(icon).not.toHaveClass('bg-primary/10');
    expect(installButton).toHaveClass('border', 'text-foreground');
    expect(installButton).not.toHaveClass('bg-primary');
  });
});
