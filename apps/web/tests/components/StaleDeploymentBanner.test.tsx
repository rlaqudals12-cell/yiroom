import { describe, it, expect } from 'vitest';
import { isStalePreviewHost } from '@/components/StaleDeploymentBanner';

describe('isStalePreviewHost — 옛 프리뷰 URL 감지', () => {
  it('정식 도메인은 프리뷰 아님', () => {
    expect(isStalePreviewHost('yiroom.vercel.app')).toBe(false);
  });

  it('프리뷰 스냅샷 URL은 프리뷰로 감지 (창업자가 갇히던 URL)', () => {
    expect(isStalePreviewHost('yiroom-237qdvwfp-xcs-projects-a437a0dd.vercel.app')).toBe(true);
    expect(isStalePreviewHost('yiroom-abc123-xcs-projects-a437a0dd.vercel.app')).toBe(true);
  });

  it('로컬 개발은 제외', () => {
    expect(isStalePreviewHost('localhost')).toBe(false);
    expect(isStalePreviewHost('127.0.0.1')).toBe(false);
  });

  it('커스텀 도메인(향후 pk_live)은 제외', () => {
    expect(isStalePreviewHost('yiroom.app')).toBe(false);
    expect(isStalePreviewHost('www.yiroom.app')).toBe(false);
  });
});
