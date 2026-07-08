/**
 * SkinAgeCalculator 테스트
 * 수리(2026-07-08): 주름/모공/색소침착을 "낮을수록 좋음"으로 뒤집어 계산하던 버그 정정 —
 * skin_analyses 저장 규약(모든 지표 높을수록 좋음, 결과 페이지 getStatus와 동일)을 따르는지 검증.
 * overall_score(분석 종합 점수) 기반 계산 경로도 검증.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkinAgeCalculator, type SkinAgeMetrics } from '@/components/beauty/SkinAgeCalculator';
import type { SkinAgeResult } from '@/types/hybrid';

const goodMetrics: SkinAgeMetrics = {
  hydration: 85,
  oil: 50,
  wrinkles: 90, // 높을수록 좋음 (주름 적음)
  pores: 88,
  pigmentation: 85,
};

const badMetrics: SkinAgeMetrics = {
  hydration: 30,
  oil: 50,
  wrinkles: 20, // 낮음 = 주름 많음 = 나쁨
  pores: 25,
  pigmentation: 20,
};

function getResult(props: Partial<React.ComponentProps<typeof SkinAgeCalculator>>) {
  let captured: SkinAgeResult | null = null;
  render(
    <SkinAgeCalculator
      actualAge={30}
      skinMetrics={goodMetrics}
      onResultChange={(r) => {
        captured = r;
      }}
      {...props}
    />
  );
  return captured as SkinAgeResult | null;
}

describe('SkinAgeCalculator', () => {
  it('지표 점수가 높을수록(피부 좋음) 피부나이가 실제나이보다 어리다', () => {
    const result = getResult({ skinMetrics: goodMetrics });
    expect(result).not.toBeNull();
    expect(result!.skinAge).toBeLessThan(30);
  });

  it('지표 점수가 낮을수록(피부 나쁨) 피부나이가 실제나이보다 많다', () => {
    const result = getResult({ skinMetrics: badMetrics });
    expect(result).not.toBeNull();
    expect(result!.skinAge).toBeGreaterThan(30);
  });

  it('주름 점수 방향이 결과 페이지와 일치한다 (90점 주름 = positive 요인)', () => {
    const result = getResult({ skinMetrics: goodMetrics });
    const wrinkleFactor = result!.factors.find((f) => f.name === '주름');
    expect(wrinkleFactor?.impact).toBe('positive');

    const badResult = getResult({ skinMetrics: badMetrics });
    const badWrinkle = badResult!.factors.find((f) => f.name === '주름');
    expect(badWrinkle?.impact).toBe('negative');
  });

  it('overall_score가 있으면 그것을 기준 점수로 사용한다 (결과 페이지 척도 일치)', () => {
    // overall 70, 실제나이 30 → scoreDiff 20 → ageDiff 6 → 피부나이 24
    const result = getResult({ skinMetrics: null, overallScore: 70 });
    expect(result!.score).toBe(70);
    expect(result!.skinAge).toBe(24);
    expect(result!.grade).toBe('B');
  });

  it('세부 지표 없이 종합 점수만 있으면 "종합 점수 기반 추정"을 표기한다', () => {
    render(<SkinAgeCalculator actualAge={30} skinMetrics={null} overallScore={70} />);
    expect(screen.getByTestId('skin-age-basis-note')).toHaveTextContent(
      '종합 점수(70점) 기반 추정'
    );
    // 영향 요인 그리드는 지표가 없으므로 표시하지 않음 (지어내지 않기)
    expect(screen.queryByText('영향 요인')).not.toBeInTheDocument();
  });

  it('세부 지표와 종합 점수가 둘 다 있으면 종합 점수 기준 + 영향 요인 표시', () => {
    render(<SkinAgeCalculator actualAge={30} skinMetrics={goodMetrics} overallScore={70} />);
    expect(screen.getByTestId('skin-age-basis-note')).toHaveTextContent('종합 점수(70점) 기준');
    expect(screen.getByText('영향 요인')).toBeInTheDocument();
  });

  it('지표도 종합 점수도 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <SkinAgeCalculator actualAge={30} skinMetrics={null} overallScore={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
