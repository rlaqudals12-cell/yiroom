/**
 * AV-5: BodyAvatarSection 테스트 — 폴백/토글 분기
 * (3D 캔버스 자체는 WebGL 필요 — jsdom에서는 dynamic 로딩 상태로 남아 분기 로직만 검증)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BodyAvatarSection } from '@/components/avatar/BodyAvatarSection';
import type { BodyRowForAvatar } from '@/lib/avatar';

// next/dynamic — jsdom에서 3D 청크 로드 없이 null 렌더
vi.mock('next/dynamic', () => ({
  default: () => {
    const Noop = (): null => null;
    return Noop;
  },
}));

const ROW: BodyRowForAvatar = {
  body_type: 'W',
  ratio: 1.15,
  shoulder: null,
  waist: null,
  hip: null,
};

describe('BodyAvatarSection', () => {
  it('row가 없으면 2D 실루엣 폴백을 렌더한다', () => {
    render(<BodyAvatarSection row={null} bodyType="S" label="스트레이트" />);
    expect(screen.getByTestId('body-avatar-section')).toBeInTheDocument();
    expect(screen.getByTestId('anonymous-body-template')).toBeInTheDocument();
    expect(screen.getByText('스트레이트')).toBeInTheDocument();
  });

  it('row가 있으면 3D 컨테이너 + 라벨을 렌더한다', () => {
    render(<BodyAvatarSection row={ROW} bodyType="W" label="웨이브" />);
    expect(screen.getByTestId('body-avatar-section')).toBeInTheDocument();
    expect(screen.queryByTestId('anonymous-body-template')).not.toBeInTheDocument();
    expect(screen.getByText('웨이브')).toBeInTheDocument();
  });

  it('직전 분석이 없으면 비교 토글을 노출하지 않는다', () => {
    render(<BodyAvatarSection row={ROW} bodyType="W" />);
    expect(screen.queryByTestId('body-avatar-compare-toggle')).not.toBeInTheDocument();
  });

  it('직전 분석이 있으면 비교 토글이 노출되고 aria-pressed가 토글된다', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    render(<BodyAvatarSection row={ROW} previousRow={{ ...ROW, ratio: 1.05 }} bodyType="W" />);

    const toggle = screen.getByTestId('body-avatar-compare-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('직전 실루엣 표시 중');
  });
});
