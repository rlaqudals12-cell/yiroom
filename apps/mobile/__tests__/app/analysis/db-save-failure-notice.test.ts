import fs from 'node:fs';
import path from 'node:path';

const RESULT_SCREENS = [
  'personal-color/result.tsx',
  'skin/result.tsx',
  'body/result.tsx',
  'hair/result.tsx',
  'makeup/result.tsx',
] as const;

describe('단독 분석 결과 저장 실패 고지 배선', () => {
  it.each(RESULT_SCREENS)('%s가 dbSaveFailed를 실제 고지 UI에 연결한다', (relativePath) => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app', '(analysis)', relativePath),
      'utf8'
    );

    expect(source).toContain('AnalysisSaveFailureNotice');
    expect(source).toMatch(/dbSaveFailed\s*&&\s*\(/);
  });
});
