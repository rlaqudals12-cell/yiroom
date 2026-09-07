import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import RetiredCapsuleLayout from '@/app/(main)/capsule/(retired)/layout';

const redirect = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('redirect');
  })
);
vi.mock('next/navigation', () => ({ redirect }));

describe('캡슐 게이팅 — (retired) 라우트 그룹', () => {
  it('은퇴 페이지 3종(대시보드·gap·[domain])의 레이아웃은 홈으로 돌린다', () => {
    expect(() => RetiredCapsuleLayout()).toThrow('redirect');
    expect(redirect).toHaveBeenCalledWith('/home');
  });

  it('ADR-111 정본 표면 /capsule/daily는 그룹 밖에 살아 있고, 상위 공통 레이아웃은 없다', () => {
    const base = path.join(process.cwd(), 'app', '(main)', 'capsule');
    expect(existsSync(path.join(base, 'daily', 'page.tsx'))).toBe(true);
    expect(existsSync(path.join(base, 'layout.tsx'))).toBe(false);
    expect(existsSync(path.join(base, '(retired)', 'page.tsx'))).toBe(true);
    expect(existsSync(path.join(base, '(retired)', 'gap', 'page.tsx'))).toBe(true);
    expect(existsSync(path.join(base, '(retired)', '[domain]', 'page.tsx'))).toBe(true);
  });
});
