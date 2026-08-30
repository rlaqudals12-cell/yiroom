import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const FIVE_AXIS_REPORT_SURFACES = [
  'app/(main)/analysis/personal-color/_components/AnalysisResult.tsx',
  'app/(main)/analysis/skin/_components/AnalysisResult.tsx',
  'app/(main)/analysis/body/result/[id]/page.tsx',
  'app/(main)/analysis/hair/_components/HairReportSheet.tsx',
  'app/(main)/analysis/makeup/_components/MakeupAnalysisResultView.tsx',
] as const;

const RESULT_ID_HOSTS = [
  ['app/(main)/analysis/personal-color/result/[id]/page.tsx', 'reportTargetId={analysisId}'],
  ['app/(main)/analysis/skin/result/[id]/page.tsx', 'reportTargetId={analysisId}'],
  [
    'app/(main)/analysis/skin/page.tsx',
    'reportTargetId={`skin:${result.analyzedAt.toISOString()}`}',
  ],
  ['app/(main)/analysis/hair/result/[id]/page.tsx', 'reportTargetId={analysisId}'],
  [
    'app/(main)/analysis/hair/page.tsx',
    'reportTargetId={`hair:${result.analyzedAt.toISOString()}`}',
  ],
  ['app/(main)/analysis/makeup/result/[id]/page.tsx', 'reportTargetId={analysisId}'],
  ['app/(main)/analysis/makeup/page.tsx', 'reportTargetId={resultId}'],
  ['app/(main)/analysis/body/result/[id]/page.tsx', 'reportTargetId={analysisId}'],
  [
    'app/(main)/analysis/body/page.tsx',
    'reportTargetId={resultId ?? `body:${result.analyzedAt.toISOString()}`}',
  ],
] as const;

describe('5축 결과 공통 신고 진입점 배선', () => {
  it.each(FIVE_AXIS_REPORT_SURFACES)('%s가 신고 진입점을 포함한 TrustFooter를 사용한다', (file) => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    expect(source).toContain('<TrustFooter');
  });

  it.each(RESULT_ID_HOSTS)('%s가 저장 결과 또는 결정적 폴백 ID를 전달한다', (file, wiring) => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    expect(source).toContain(wiring);
  });
});
