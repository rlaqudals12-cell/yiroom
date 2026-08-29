import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CLIENT_MESSAGE_NAMESPACES, pickClientMessages } from '@/lib/i18n/client-messages';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (target.replaceAll('\\', '/').includes('/app/dev')) return [];
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/u.test(entry.name) ? [target] : [];
  });
}

describe('pickClientMessages', () => {
  it('클라이언트 훅이 실제 소비하는 최상위 네임스페이스를 모두 포함한다', () => {
    const roots = ['app', 'components', 'hooks'].map((directory) =>
      resolve(process.cwd(), directory)
    );
    const consumed = new Set<string>();
    const pattern = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/gu;

    for (const file of roots.flatMap(sourceFiles)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(pattern)) consumed.add(match[1].split('.')[0]);
    }

    expect(
      [...consumed].filter((namespace) => !CLIENT_MESSAGE_NAMESPACES.includes(namespace as never))
    ).toEqual([]);
  });

  it('서버 카탈로그 전체가 아니라 필요한 네임스페이스만 직렬화한다', () => {
    const allMessages = JSON.parse(
      readFileSync(resolve(process.cwd(), 'messages/ko.json'), 'utf8')
    ) as Parameters<typeof pickClientMessages>[0];
    const picked = pickClientMessages(allMessages);

    expect(Object.keys(picked).sort()).toEqual([...CLIENT_MESSAGE_NAMESPACES].sort());
    expect(JSON.stringify(picked).length).toBeLessThan(JSON.stringify(allMessages).length * 0.95);
    expect(picked).not.toHaveProperty('auth');
  });
});
