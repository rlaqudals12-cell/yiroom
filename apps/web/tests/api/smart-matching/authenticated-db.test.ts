import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const routeFiles = [
  'barcodes/route.ts',
  'feedback/route.ts',
  'feedback/[id]/route.ts',
  'measurements/route.ts',
  'notifications/route.ts',
  'notifications/[id]/route.ts',
  'preferences/route.ts',
  'price-compare/route.ts',
  'price-watches/route.ts',
  'price-watches/[id]/route.ts',
  'size-history/route.ts',
  'size-history/[id]/route.ts',
  'size-recommend/route.ts',
] as const;

describe('smart-matching API DB 인증 계약', () => {
  it.each(routeFiles)('%s는 Clerk JWT DB 클라이언트를 저장소에 주입한다', (file) => {
    const source = readFileSync(
      join(process.cwd(), 'app', 'api', 'smart-matching', ...file.split('/')),
      'utf8'
    );

    expect(source).toContain('@/lib/supabase/server');
    expect(source).toContain('createClerkSupabaseClient()');
    expect(source).toMatch(/\bdb\b/);
  });
});
