import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('검색 URL 및 숨김 모듈 계약', () => {
  it.each([undefined, 'https://owned.example'])(
    'SITE_URL=%s에 맞춰 robots와 sitemap을 만든다',
    async (configured) => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', configured);
      vi.resetModules();
      const { default: robots } = await import('@/app/robots');
      const { default: sitemap } = await import('@/app/sitemap');
      const base = configured || 'https://yiroom.vercel.app';
      expect(robots().sitemap).toBe(`${base}/sitemap.xml`);
      const entries = await sitemap();
      expect(entries.every((entry) => entry.url.startsWith(base))).toBe(true);
      const rules = robots().rules;
      const rule = Array.isArray(rules) ? rules[0] : rules;
      for (const route of ['/workout', '/nutrition', '/record', '/wellness']) {
        expect(rule.allow).not.toContain(`${route}/`);
        expect(entries.some((entry) => new URL(entry.url).pathname === route)).toBe(false);
      }
      expect(entries.some((entry) => new URL(entry.url).pathname === '/methodology')).toBe(false);
    }
  );
});
