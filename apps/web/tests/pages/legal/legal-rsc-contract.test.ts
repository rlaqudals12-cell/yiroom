import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), 'app', ...segments), 'utf8');
}

describe('법무 페이지 RSC 계약', () => {
  it('약관과 개인정보 본문이 클라이언트 훅 없이 서버에서 렌더링된다', () => {
    const termsPage = readAppFile('(main)', 'terms', 'page.tsx');
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    for (const [name, source] of [
      ['terms/page.tsx', termsPage],
      ['privacy/PrivacyContent.tsx', privacyContent],
    ] as const) {
      expect(source, name).not.toMatch(/^['"]use client['"];?/m);
      expect(source, name).not.toContain('useState');
      expect(source, name).not.toContain('useSearchParams');
      expect(source, name).not.toContain('onClick=');
    }
  });

  it('언어 전환은 클라이언트 상태 대신 URL 링크를 사용한다', () => {
    const termsPage = readAppFile('(main)', 'terms', 'page.tsx');
    const privacyContent = readAppFile('privacy', 'PrivacyContent.tsx');

    expect(termsPage).toContain('href="?lang=ko"');
    expect(termsPage).toContain('href="?lang=en"');
    expect(privacyContent).toContain('href="?lang=ko"');
    expect(privacyContent).toContain('href="?lang=en"');
    expect(termsPage.match(/prefetch=\{false\}/g)).toHaveLength(2);
    expect(privacyContent.match(/prefetch=\{false\}/g)).toHaveLength(2);
  });
});
