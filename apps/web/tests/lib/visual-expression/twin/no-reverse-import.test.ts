/**
 * 표현 레이어 — 트윈 역류 import 금지 검증 (ADR-115 / ADR-113 상속)
 *
 * 트윈(표현)은 분석 진실값(lib/analysis, 분석 gemini, app/api/analyze)을 참조하지 않는다.
 * 표현→진실 단방향만 허용.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TWIN_DIR = join(process.cwd(), 'lib', 'visual-expression', 'twin');

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (full.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

// 분석 진실값 경로 — 역참조 금지 대상.
// 실제 import 구문(from '...' 또는 import('...'))만 매칭 — 문서 주석의 경로 언급은 제외.
const FORBIDDEN = [
  /(?:from|import\()\s*['"]@\/lib\/analysis/,
  // 분석용 gemini 클라이언트(트윈은 @google/genai SDK를 직접 사용)
  /(?:from|import\()\s*['"]@\/lib\/gemini/,
  /(?:from|import\()\s*['"][^'"]*app\/api\/analyze/,
];

describe('트윈 모듈 — 분석 파이프라인 역류 import 0', () => {
  const files = collectTsFiles(TWIN_DIR);

  it('트윈 소스 파일이 존재한다', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each([['모든 파일']])('%s 이 금지 경로를 import하지 않는다', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(content)) {
          violations.push(`${file} → ${pattern}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
