import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionDir = join(process.cwd(), 'supabase', 'functions', 'cleanup-expired-consents');
const source = readFileSync(join(functionDir, 'index.ts'), 'utf8');
const config = readFileSync(join(functionDir, 'config.toml'), 'utf8');

describe('폐기된 cleanup-expired-consents Edge Function', () => {
  it('모든 호출에 410 Gone 계약만 남긴다', () => {
    expect(source).toContain('Deno.serve');
    expect(source).toContain('status: 410');
    expect(source).toContain("code: 'LEGACY_FUNCTION_GONE'");
    expect(source).toContain("'Cache-Control': 'no-store'");
  });

  it('환경변수와 데이터 저장소에 접근하는 부작용이 없다', () => {
    expect(source).not.toContain('Deno.env');
    expect(source).not.toContain('SUPABASE_URL');
    expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).not.toMatch(/\.from\s*\(/);
    expect(source).not.toMatch(/\.storage\b/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('Supabase 또는 service-role 클라이언트를 import하거나 생성하지 않는다', () => {
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toContain('@supabase/supabase-js');
    expect(source).not.toContain('createClient');
    expect(source).not.toContain('service-role');
  });

  it('실수로 재배포돼도 JWT 검증을 끄지 않는다', () => {
    expect(config).toMatch(/verify_jwt\s*=\s*true/);
    expect(config).not.toMatch(/verify_jwt\s*=\s*false/);
  });
});
