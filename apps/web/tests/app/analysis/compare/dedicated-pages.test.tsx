import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchParams, backMock, pushMock } = vi.hoisted(() => ({
  searchParams: new URLSearchParams('from=before-id&to=after-id'),
  backMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
  useSearchParams: () => searchParams,
}));

vi.mock('next-intl', () => ({ useLocale: () => 'ko' }));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="before-after-viewer" />,
}));

vi.mock('@/components/analysis/consent/AnalysisCompareImageNotice', () => ({
  AnalysisCompareImageNotice: ({
    analysisType,
    testId,
  }: {
    analysisType: string;
    testId: string;
  }) => <div data-analysis-type={analysisType} data-testid={testId} />,
}));

import BodyComparePage from '@/app/(main)/analysis/body/compare/page';
import HairComparePage from '@/app/(main)/analysis/hair/compare/page';
import MakeupComparePage from '@/app/(main)/analysis/makeup/compare/page';
import SkinComparePage from '@/app/(main)/analysis/skin/compare/page';

const detailsByType = {
  skin: {
    skinType: 'dry',
    hydration: 70,
    oilLevel: 30,
    pores: 60,
    pigmentation: 50,
    wrinkles: 40,
    sensitivity: 30,
  },
  body: { bodyType: 'straight', shoulder: 90, waist: 70, hip: 92, weight: 55 },
  hair: {
    hairType: 'straight',
    scalpHealth: 70,
    hairDensity: 65,
    hairThickness: 60,
    damageLevel: 25,
  },
  makeup: {
    undertone: 'cool',
    faceShape: 'oval',
    eyeShape: 'round',
    lipShape: 'full',
  },
} as const;

function createCompareResult(type: keyof typeof detailsByType) {
  return {
    before: {
      id: 'before-id',
      type,
      date: '2026-08-01T00:00:00.000Z',
      overallScore: 70,
      details: detailsByType[type],
    },
    after: {
      id: 'after-id',
      type,
      date: '2026-08-02T00:00:00.000Z',
      overallScore: 72,
      details: detailsByType[type],
    },
    changes: { overall: 2, period: '하루', details: {} },
    insights: [],
  };
}

describe('축별 비교 화면 이미지 저장 안내 배선', () => {
  beforeEach(() => {
    backMock.mockReset();
    pushMock.mockReset();
  });

  it.each([
    ['skin', SkinComparePage],
    ['body', BodyComparePage],
    ['hair', HairComparePage],
    ['makeup', MakeupComparePage],
  ] as const)('%s 비교 화면이 축별 동의 안내를 마운트한다', async (type, Page) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(createCompareResult(type)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    render(<Page />);

    const notice = await screen.findByTestId(`${type}-compare-image-storage-notice`);
    expect(notice).toHaveAttribute('data-analysis-type', type);
  });
});
