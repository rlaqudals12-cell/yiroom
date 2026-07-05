/**
 * AxesSummaryCard 컴포넌트 테스트
 *
 * @see app/(main)/analysis/integrated/result/[sessionId]/_components/AxesSummaryCard.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Palette: () => null,
  Sparkles: () => null,
  Shirt: () => null,
  Scissors: () => null,
  Brush: () => null,
}));

import { AxesSummaryCard } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/AxesSummaryCard';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';

const allSuccessAxes: Record<string, AxisDbRecord | null> = {
  personalColor: {
    id: 'pc-1',
    season: 'spring',
    undertone: 'warm',
  } as AxisDbRecord,
  skin: {
    id: 'skin-1',
    skin_type: 'combination',
    overall_score: 78,
  } as AxisDbRecord,
  body: {
    id: 'body-1',
    body_type: 'hourglass',
  } as AxisDbRecord,
  hair: {
    id: 'hair-1',
    face_shape: 'oval',
  } as AxisDbRecord,
  makeup: {
    id: 'makeup-1',
    undertone: 'warm',
  } as AxisDbRecord,
};

describe('AxesSummaryCard', () => {
  it('5축 모두 성공 시 축 라벨과 값이 표시됨', () => {
    render(
      <AxesSummaryCard
        axes={{
          personalColor: allSuccessAxes.personalColor,
          skin: allSuccessAxes.skin,
          body: allSuccessAxes.body,
          hair: allSuccessAxes.hair,
          makeup: allSuccessAxes.makeup,
        }}
      />
    );

    expect(screen.getByText('퍼스널컬러')).toBeInTheDocument();
    expect(screen.getByText('피부')).toBeInTheDocument();
    expect(screen.getByText('체형')).toBeInTheDocument();
    expect(screen.getByText('헤어')).toBeInTheDocument();
    expect(screen.getByText('메이크업')).toBeInTheDocument();

    expect(screen.getByText(/spring/)).toBeInTheDocument();
    expect(screen.getByText(/combination/)).toBeInTheDocument();
    // body_type='hourglass'은 getBodyShapeLabel로 한글화되어 '모래시계형'으로 표시됨
    expect(screen.getByText(/모래시계형/)).toBeInTheDocument();
  });

  it('축이 null이면 "이번 분석 미포함" 표시', () => {
    // "미완료"는 실패 뉘앙스 — 세션 스코프임을 드러내는 "미포함"으로 (2026-07-06)
    render(
      <AxesSummaryCard
        axes={{
          personalColor: allSuccessAxes.personalColor,
          skin: null,
          body: null,
          hair: allSuccessAxes.hair,
          makeup: null,
        }}
      />
    );

    const missingLabels = screen.getAllByText('이번 분석 미포함');
    expect(missingLabels.length).toBe(3); // skin, body, makeup
  });

  it('최상위 컨테이너 data-testid 존재', () => {
    const { container } = render(
      <AxesSummaryCard
        axes={{ personalColor: null, skin: null, body: null, hair: null, makeup: null }}
      />
    );
    expect(container.querySelector('[data-testid="axes-summary-card"]')).toBeTruthy();
  });
});
