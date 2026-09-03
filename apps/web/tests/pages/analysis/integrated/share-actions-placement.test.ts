import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'app/(main)/analysis/integrated/result/[sessionId]/page.tsx'),
  'utf8'
);

describe('통합 결과 공유 액션 위치', () => {
  it('결론의 출처 고지 직후이자 상세 근거 전에 한 번만 노출한다', () => {
    const verdict = source.indexOf('<PersonaNarrativeCard');
    const share = source.indexOf('<ShareReportButton');
    const partialNotice = source.indexOf('<PartialSuccessBanner');
    const fallbackNotice = source.indexOf('<AxisFallbackNotice');
    const profileNotice = source.indexOf('data-testid="profile-fallback-notice"');
    const details = source.indexOf('<PersonaShareSection');

    expect(verdict).toBeGreaterThan(-1);
    expect(share).toBeGreaterThan(partialNotice);
    expect(share).toBeGreaterThan(fallbackNotice);
    expect(share).toBeGreaterThan(profileNotice);
    expect(share).toBeLessThan(details);
    expect(source.match(/<ShareReportButton/g)).toHaveLength(1);
  });
});
