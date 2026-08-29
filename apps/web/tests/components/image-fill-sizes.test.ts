import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.next' || entry.name === 'node_modules' || entry.name === 'tests')
      return [];
    const target = join(directory, entry.name);
    if (target.replaceAll('\\', '/').includes('/app/dev')) return [];
    if (entry.isDirectory()) return sourceFiles(target);
    return entry.name.endsWith('.tsx') ? [target] : [];
  });
}

describe('next/image fill sizes contract', () => {
  it('모든 next/image fill 소비처가 실제 렌더 폭을 sizes로 명시한다', () => {
    const missing: string[] = [];

    for (const file of sourceFiles(resolve(process.cwd()))) {
      const source = readFileSync(file, 'utf8');
      if (!/from ['"]next\/image['"]/u.test(source)) continue;

      for (const match of source.matchAll(/<Image\b[\s\S]*?\/>/gu)) {
        if (/\bfill\b/u.test(match[0]) && !/\bsizes\s*=/u.test(match[0])) {
          const line = source.slice(0, match.index).split(/\r?\n/u).length;
          missing.push(`${file}:${line}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('피드의 단일·그리드 이미지는 실제 열 너비에 맞는 조건부 sizes를 사용한다', () => {
    const paths = ['app/(main)/feed/post/[id]/page.tsx', 'components/feed/FeedCard.tsx'];

    for (const path of paths) {
      const source = readFileSync(resolve(process.cwd(), path), 'utf8');
      expect(source, path).toContain("? '(max-width: 768px) 100vw, 640px'");
      expect(source, path).toContain(": '(max-width: 768px) 50vw, 320px'");
    }
  });
});
