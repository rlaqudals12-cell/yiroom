import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const E2E_ROOT = path.resolve(process.cwd(), 'e2e');

const TAUTOLOGY_PATTERNS = [
  { name: '`|| true` fallback', pattern: /\|\|\s*true\b/ },
  {
    name: 'literal true expectation',
    pattern: /expect\(\s*true\s*\)\s*\.\s*(?:toBe\(\s*true\s*\)|toBeTruthy\(\s*\))/,
  },
  {
    name: 'non-negative locator count',
    pattern: /\.toBeGreaterThanOrEqual\(\s*0\s*\)/,
  },
  {
    name: 'non-negative comparison expectation',
    pattern: /expect\([^)]*>=\s*0\s*\)\s*\.toBe\(\s*true\s*\)/,
  },
  {
    name: 'boolean type-only expectation',
    pattern: /expect\(\s*typeof\s+[^)]*\)\s*\.toBe\(\s*['"]boolean['"]\s*\)/,
  },
  {
    name: 'boolean definedness expectation',
    pattern: /expect\(\s*(?:has|is)[A-Z]\w*\s*\)\s*\.toBeDefined\(\s*\)/,
  },
  {
    name: 'boolean undefined comparison',
    pattern: /expect\([^)]*!==\s*undefined\s*\)\s*\.toBeTruthy\(\s*\)/,
  },
] as const;

interface Finding {
  file: string;
  line: number;
  kind: string;
}

function findTautologicalAssertions(source: string, file = 'inline'): Finding[] {
  return source.split(/\r?\n/).flatMap((line, index) =>
    TAUTOLOGY_PATTERNS.filter(({ pattern }) => pattern.test(line)).map(({ name }) => ({
      file,
      line: index + 1,
      kind: name,
    }))
  );
}

async function listSpecFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSpecFiles(absolutePath);
      return entry.name.endsWith('.spec.ts') ? [absolutePath] : [];
    })
  );

  return files.flat();
}

describe('E2E assertion quality', () => {
  it('detects a deliberately reintroduced always-true assertion', () => {
    const findings = findTautologicalAssertions('expect(hasCard || true).toBe(true);');

    expect(findings).toEqual([
      {
        file: 'inline',
        line: 1,
        kind: '`|| true` fallback',
      },
    ]);
  });

  it('contains no always-true assertions in Playwright specs', async () => {
    const specFiles = await listSpecFiles(E2E_ROOT);
    const findings = (
      await Promise.all(
        specFiles.map(async (file) => {
          const source = await readFile(file, 'utf8');
          return findTautologicalAssertions(source, path.relative(E2E_ROOT, file));
        })
      )
    ).flat();

    expect(specFiles.length).toBeGreaterThan(0);
    expect(findings).toEqual([]);
  });
});
