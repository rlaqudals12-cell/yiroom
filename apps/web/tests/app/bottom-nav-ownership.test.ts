import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATED_PAGE_PATHS = [
  'analysis/body/compare/page.tsx',
  'analysis/body/history/page.tsx',
  'analysis/compare/page.tsx',
  'analysis/hair/compare/page.tsx',
  'analysis/hair/history/page.tsx',
  'analysis/makeup/compare/page.tsx',
  'analysis/makeup/history/page.tsx',
  'analysis/personal-color/history/page.tsx',
  'analysis/skin/compare/page.tsx',
  'analysis/skin/history/page.tsx',
  'beauty/page.tsx',
  'home/page.tsx',
  'home/loading.tsx',
  'profile/page.tsx',
  'record/page.tsx',
  'search/page.tsx',
  'style/category/[slug]/page.tsx',
  'style/gallery/page.tsx',
  'style/page.tsx',
] as const;

function findPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPages(target);
    return entry.name === 'page.tsx' ? [target] : [];
  });
}

describe('BottomNav 소유권', () => {
  it('루트 앱 셸만 BottomNav를 렌더하고 (main) 페이지는 직접 소유하지 않는다', () => {
    const rootLayout = readFileSync(path.join(process.cwd(), 'app', 'layout.tsx'), 'utf8');
    expect(rootLayout).toContain("import { BottomNav } from '@/components/BottomNav'");
    expect(rootLayout).toContain('{showBottomNav && <BottomNav />}');

    const pages = findPages(path.join(process.cwd(), 'app', '(main)'));
    for (const page of pages) {
      expect(readFileSync(page, 'utf8'), page).not.toContain('BottomNav');
    }
  });

  it('이관된 페이지·로딩 화면은 셸의 하단 안전영역 위에 pb-20을 중복 적용하지 않는다', () => {
    const mainDirectory = path.join(process.cwd(), 'app', '(main)');

    for (const relativePath of MIGRATED_PAGE_PATHS) {
      const page = path.join(mainDirectory, ...relativePath.split('/'));
      expect(readFileSync(page, 'utf8'), relativePath).not.toMatch(/\bpb-20\b/);
    }
  });
});
