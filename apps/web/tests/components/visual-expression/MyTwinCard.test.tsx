/**
 * MyTwinCard 테스트 (ADR-115)
 * - 승인된 트윈: 썸네일 + "AI 생성" 라벨 + 삭제 버튼
 * - pending 트윈: 프로필에 미노출(핵심 정책) → 만들기 CTA만
 * - 트윈 없음: 만들기 CTA
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MyTwinCard } from '@/components/visual-expression/MyTwinCard';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

function mockTwinGet(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      json: async () => body,
    })
  );
}

describe('MyTwinCard', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('승인된 트윈이 있으면 썸네일 + "AI 생성" 라벨 + 삭제 버튼을 노출한다', async () => {
    mockTwinGet({
      id: 'twin-1',
      imageUrl: 'https://x/twin.jpg',
      status: 'approved',
      aiGenerated: true,
    });

    render(<MyTwinCard />);

    await waitFor(() => expect(screen.getByTestId('twin-approved')).toBeInTheDocument());
    expect(screen.getByTestId('ai-generated-label')).toBeInTheDocument();
    expect(screen.getByTestId('twin-delete-button')).toBeInTheDocument();
    // 만들기 CTA는 없어야 함
    expect(screen.queryByTestId('create-twin-cta')).toBeNull();
  });

  it('pending 트윈은 프로필에 노출하지 않는다(만들기 CTA만)', async () => {
    mockTwinGet({
      id: 'twin-1',
      imageUrl: 'https://x/twin.jpg',
      status: 'pending',
      aiGenerated: true,
    });

    render(<MyTwinCard />);

    await waitFor(() => expect(screen.getByTestId('twin-empty')).toBeInTheDocument());
    expect(screen.getByTestId('create-twin-cta')).toBeInTheDocument();
    // pending 트윈 이미지/라벨은 절대 노출되지 않음
    expect(screen.queryByTestId('twin-approved')).toBeNull();
    expect(screen.queryByTestId('ai-generated-label')).toBeNull();
  });

  it('트윈이 없으면 만들기 CTA를 노출한다', async () => {
    mockTwinGet({}, false);

    render(<MyTwinCard />);

    await waitFor(() => expect(screen.getByTestId('create-twin-cta')).toBeInTheDocument());
    expect(screen.queryByTestId('twin-approved')).toBeNull();
  });
});
