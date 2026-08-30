import fs from 'node:fs';
import path from 'node:path';

const mobileRoot = path.resolve(__dirname, '../../..');

function source(relativePath: string): string {
  return fs.readFileSync(path.join(mobileRoot, relativePath), 'utf8');
}

describe('AI 생성 콘텐츠 신고 배선 계약', () => {
  it.each([
    ['body', 'analysis'],
    ['personal-color', 'result'],
    ['hair', 'result'],
    ['makeup', 'result'],
  ] as const)(
    '%s 결과가 historyId 또는 실제 저장 analysisId를 공통 신고 레이아웃에 전달한다',
    (axis, resultVariable) => {
      const code = source(`app/(analysis)/${axis}/result.tsx`);
      expect(code).toContain('<ReportResultLayout');
      expect(code).toContain('historyId ??');
      expect(code).toContain(`!${resultVariable}.dbSaveFailed ? ${resultVariable}.analysisId`);
      expect(code).toContain(`unsaved:${axis}:\${${resultVariable}.analyzedAt`);
      expect(code).toContain("analysisId: typeof row.id === 'string' ? row.id : undefined");
    }
  );

  it('피부 결과도 저장 row·fresh analysis id를 상태에 보존해 전달한다', () => {
    const code = source('app/(analysis)/skin/result.tsx');
    expect(code).toContain("historyId ?? (typeof row.id === 'string' ? row.id");
    expect(code).toContain('analysisResult.analysisId');
    expect(code).toContain('analysisResult.analyzedAt');
    expect(code).toContain('reportTargetId={reportTargetId');
  });

  it.each(['body', 'personalColor', 'hair', 'makeup', 'skin'] as const)(
    '%s thin client가 웹 응답의 실제 저장 row id를 버리지 않는다',
    (apiFile) => {
      const code = source(`lib/api/${apiFile}.ts`);
      expect(code).toContain("analysisId: typeof data.id === 'string' ? data.id : undefined");
    }
  );

  it('트윈 신고는 외부 mailto가 아니라 공통 인앱 엔드포인트를 사용한다', () => {
    const code = source('app/(twin)/index.tsx');
    expect(code).toContain('<ContentReportModal');
    expect(code).toContain('onPress={() => setReportVisible(true)}');
    expect(code).toContain('targetId={twin?.id');
    expect(code).toContain('targetType="twin_result"');
    expect(code).toContain('visible={reportVisible && twin !== null}');
    expect(code).not.toContain('mailto:');
    expect(code).not.toContain('Linking.openURL');
  });
});
