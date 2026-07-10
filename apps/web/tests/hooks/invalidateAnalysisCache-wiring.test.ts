/**
 * 재발 방지 — 분석 완료 경로의 캐시 무효화 배선 검증
 *
 * useAnalysisStatus의 5분 전역 캐시는 분석 완료 직후 invalidateAnalysisCache()로
 * 무효화해야 한다. 안 하면 방금 분석을 마친 사용자가 홈/[나] 탭에서 5분간
 * 이전 상태("분석 0개" = 신규 회원 화면 등)를 본다.
 *
 * 이 테스트는 6개 분석 완료 표면(통합 + 개별 5축)이 실제로
 * invalidateAnalysisCache를 호출하는지 소스 레벨에서 고정한다.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ANALYSIS_DIR = join(process.cwd(), 'app', '(main)', 'analysis');

// 분석 완료가 일어나는 페이지 전부 — 새 분석 표면 추가 시 여기에도 추가할 것
const COMPLETION_PAGES = [
  ['통합분석', join(ANALYSIS_DIR, 'integrated', 'page.tsx')],
  ['퍼스널컬러', join(ANALYSIS_DIR, 'personal-color', 'page.tsx')],
  ['피부', join(ANALYSIS_DIR, 'skin', 'page.tsx')],
  ['체형', join(ANALYSIS_DIR, 'body', 'page.tsx')],
  ['헤어', join(ANALYSIS_DIR, 'hair', 'page.tsx')],
  ['메이크업', join(ANALYSIS_DIR, 'makeup', 'page.tsx')],
] as const;

describe('분석 완료 → invalidateAnalysisCache 배선', () => {
  it.each(COMPLETION_PAGES)('%s 페이지가 완료 시 캐시를 무효화한다', (_label, filePath) => {
    const source = readFileSync(filePath, 'utf-8');
    // import + 실제 호출 둘 다 있어야 배선으로 인정
    expect(source).toMatch(
      /import\s*\{[^}]*invalidateAnalysisCache[^}]*\}\s*from\s*['"]@\/hooks\/useAnalysisStatus['"]/
    );
    expect(source).toMatch(/invalidateAnalysisCache\(\)/);
  });
});
