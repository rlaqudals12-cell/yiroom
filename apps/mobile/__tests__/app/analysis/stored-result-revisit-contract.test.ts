import fs from 'node:fs';
import path from 'node:path';

const RESULT_SCREENS = [
  ['personal-color', 'personal-color/result.tsx', 'requestPersonalColorAnalysis'],
  ['skin', 'skin/result.tsx', 'requestSkinAnalysis'],
  ['body', 'body/result.tsx', 'requestBodyAnalysis'],
  ['hair', 'hair/result.tsx', 'requestHairAnalysis'],
  ['makeup', 'makeup/result.tsx', 'requestMakeupAnalysis'],
] as const;

describe('5축 저장 결과 재방문 계약', () => {
  it.each(RESULT_SCREENS)(
    '%s 결과는 이미지가 있으면 새 분석, 없으면 historyId 또는 최신 저장본을 로드한다',
    (axis, relativePath, requestFunction) => {
      const source = fs.readFileSync(
        path.join(process.cwd(), 'app', '(analysis)', relativePath),
        'utf8'
      );

      expect(source).toContain('historyId?: string');
      expect(source).toContain('Boolean(imageBase64 || imageUri)');
      expect(source).toContain(`loadStoredAnalysisRecord(supabase, '${axis}', historyId)`);
      expect(source).toContain(`${requestFunction}(`);
    }
  );

  it('메이크업 저장 결과의 nullable 점수는 결과 UI에 점수로 노출되지 않는다', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app', '(analysis)', 'makeup/result.tsx'),
      'utf8'
    );
    const renderSource = source.slice(source.indexOf("if (!result)"));

    expect(renderSource).not.toContain('result.scores');
    expect(renderSource).not.toMatch(/점수\s*\{|overall\}점/);
  });
});
