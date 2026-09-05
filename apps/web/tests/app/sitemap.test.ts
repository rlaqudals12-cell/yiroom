import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap locale alternates', () => {
  it('실제 URL만 x-default로 선언하고 존재하지 않는 언어 경로를 만들지 않는다', async () => {
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({
        'x-default': entry.url,
      });
    }
  });
});
