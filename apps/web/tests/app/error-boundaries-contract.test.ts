import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function findErrorBoundaries(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findErrorBoundaries(target);
    return entry.name === 'error.tsx' ? [target] : [];
  });
}

describe('(main) error boundary 계약', () => {
  it('모든 하위 error.tsx가 공용 ErrorState를 사용한다', () => {
    const files = findErrorBoundaries(path.join(process.cwd(), 'app', '(main)'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).toContain("from '@/components/common/ErrorState'");
      expect(source, file).toContain('<ErrorState');
    }
  });
});
