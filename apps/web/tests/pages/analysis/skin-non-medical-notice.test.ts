import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const RESULT_SOURCE = fs.readFileSync(
  path.join(__dirname, '../../../app/(main)/analysis/skin/result/[id]/page.tsx'),
  'utf-8'
);
const INTEGRATED_RESULT_SOURCE = fs.readFileSync(
  path.join(__dirname, '../../../app/(main)/analysis/integrated/result/[sessionId]/page.tsx'),
  'utf-8'
);

const LOCALES = ['ko', 'en', 'ja', 'zh'] as const;
const NOTICE_KEYS = [
  'skinNonMedicalDevice',
  'skinNonMedicalPurpose',
  'skinNonMedicalLimitsTitle',
  'skinNonMedicalLimitsSummary',
  'skinNonMedicalLimits',
] as const;

describe('피부 결과 비의료 3중 고지', () => {
  it('의료기기 아님과 의학적 판단 비대체를 접힘 밖에 항상 노출한다', () => {
    const noticeStart = RESULT_SOURCE.indexOf('data-testid="skin-non-medical-notice"');
    const limitsDisclosure = RESULT_SOURCE.indexOf('<ProgressiveDisclosure', noticeStart);

    expect(noticeStart).toBeGreaterThan(-1);
    expect(limitsDisclosure).toBeGreaterThan(noticeStart);

    const visibleNotice = RESULT_SOURCE.slice(noticeStart, limitsDisclosure);
    expect(visibleNotice).toContain("t('skinNonMedicalDevice')");
    expect(visibleNotice).toContain("t('skinNonMedicalPurpose')");
    expect(visibleNotice).not.toContain("t('skinNonMedicalLimits')");
  });

  it('촬영 조건·정확성 한계 면책만 기존 접힘 안에 둔다', () => {
    const noticeStart = RESULT_SOURCE.indexOf('data-testid="skin-non-medical-notice"');
    const limitsDisclosure = RESULT_SOURCE.indexOf('<ProgressiveDisclosure', noticeStart);
    const limitsEnd = RESULT_SOURCE.indexOf('</ProgressiveDisclosure>', limitsDisclosure);
    const foldedLimits = RESULT_SOURCE.slice(limitsDisclosure, limitsEnd);

    expect(foldedLimits).toContain("t('skinNonMedicalLimitsSummary')");
    expect(foldedLimits).toContain("t('skinNonMedicalLimits')");
  });

  it.each(LOCALES)('%s 카탈로그가 비의료 고지 전체 키를 제공한다', (locale) => {
    const messages = JSON.parse(
      fs.readFileSync(path.join(__dirname, `../../../messages/${locale}.json`), 'utf-8')
    ) as { analysis: Record<string, string> };

    NOTICE_KEYS.forEach((key) => {
      expect(messages.analysis[key]?.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('통합 결과 비의료 3중 고지', () => {
  it('피부 결과의 두 상시 고지 키를 접힘 밖에서 재사용한다', () => {
    const noticeStart = INTEGRATED_RESULT_SOURCE.indexOf(
      'data-testid="integrated-non-medical-notice"'
    );
    const limitsDisclosure = INTEGRATED_RESULT_SOURCE.indexOf(
      '<ProgressiveDisclosure',
      noticeStart
    );

    expect(noticeStart).toBeGreaterThan(-1);
    expect(limitsDisclosure).toBeGreaterThan(noticeStart);

    const visibleNotice = INTEGRATED_RESULT_SOURCE.slice(noticeStart, limitsDisclosure);
    expect(visibleNotice).toContain("tAnalysis('skinNonMedicalDevice')");
    expect(visibleNotice).toContain("tAnalysis('skinNonMedicalPurpose')");
    expect(visibleNotice).not.toContain("tAnalysis('skinNonMedicalLimits')");
  });

  it('촬영 조건·정확성 한계 키만 기본 접힘에 둔다', () => {
    const limitsDisclosure = INTEGRATED_RESULT_SOURCE.indexOf('<ProgressiveDisclosure');
    const limitsEnd = INTEGRATED_RESULT_SOURCE.indexOf(
      '</ProgressiveDisclosure>',
      limitsDisclosure
    );
    const foldedLimits = INTEGRATED_RESULT_SOURCE.slice(limitsDisclosure, limitsEnd);

    expect(foldedLimits).toContain("tAnalysis('skinNonMedicalLimitsSummary')");
    expect(foldedLimits).toContain("tAnalysis('skinNonMedicalLimits')");
  });
});
