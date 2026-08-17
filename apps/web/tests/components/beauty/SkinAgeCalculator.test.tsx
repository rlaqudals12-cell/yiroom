/**
 * 피부 컨디션 카드(SkinAgeCalculator) 테스트
 *
 * 수리(2026-07-08): 주름/모공/색소침착을 "낮을수록 좋음"으로 뒤집어 계산하던 버그 정정 —
 *   skin_analyses 저장 규약(모든 지표 높을수록 좋음, 결과 페이지 getStatus와 동일)을 따르는지 검증.
 * 수리(2026-08): 합성 "피부나이"·실제나이 비교·A~F 등급 폐지(ADR-120 무채점 + 외모 채점 금지).
 *   실측 컨디션 점수와 근거 지표만 진단지 문법(속성표)으로 렌더하는지 검증.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SkinAgeCalculator,
  type SkinAgeMetrics,
  type SkinConditionResult,
} from '@/components/beauty/SkinAgeCalculator';

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
  let captured: SkinConditionResult | null = null;
  render(
    <SkinAgeCalculator
      skinMetrics={goodMetrics}
      onResultChange={(r) => {
        captured = r;
      }}
      {...props}
    />
  );
  return captured as SkinConditionResult | null;
}

describe('SkinAgeCalculator (피부 컨디션)', () => {
  it('지표 점수가 높을수록(피부 좋음) 컨디션 점수가 높다', () => {
    const good = getResult({ skinMetrics: goodMetrics });
    const bad = getResult({ skinMetrics: badMetrics });
    expect(good).not.toBeNull();
    expect(bad).not.toBeNull();
    expect(good!.score).toBeGreaterThan(bad!.score);
  });

  // 재발 방지: 주름/모공/색소침착 방향을 뒤집어 계산하던 버그(2026-07-08)
  it('주름 점수 방향이 결과 페이지와 일치한다 (주름 90점이 20점보다 좋은 컨디션)', () => {
    const highWrinkleScore = getResult({ skinMetrics: { ...goodMetrics, wrinkles: 90 } });
    const lowWrinkleScore = getResult({ skinMetrics: { ...goodMetrics, wrinkles: 20 } });
    expect(highWrinkleScore!.score).toBeGreaterThan(lowWrinkleScore!.score);
  });

  it('overall_score가 있으면 그것을 컨디션 점수로 그대로 쓴다 (결과 페이지 척도 일치)', () => {
    const result = getResult({ skinMetrics: null, overallScore: 70 });
    expect(result!.score).toBe(70);
    expect(result!.basis).toBe('overall');
    expect(screen.getByTestId('skin-condition-score')).toHaveTextContent('70점');
  });

  it('세부 지표 없이 종합 점수만 있으면 근거 지표 행을 만들지 않는다 (지어내지 않기)', () => {
    render(<SkinAgeCalculator skinMetrics={null} overallScore={70} />);
    expect(screen.getByTestId('skin-age-basis-note')).toHaveTextContent('종합 점수');
    expect(screen.queryByTestId('skin-condition-rows')).not.toBeInTheDocument();
    expect(screen.queryByText('근거 지표')).not.toBeInTheDocument();
  });

  it('세부 지표가 있으면 근거를 속성표(RowTable) 행으로 보여준다', () => {
    render(<SkinAgeCalculator skinMetrics={goodMetrics} overallScore={70} />);
    expect(screen.getByTestId('skin-condition-rows')).toBeInTheDocument();
    expect(screen.getByText('근거 지표')).toBeInTheDocument();
    // 저장된 실측값 그대로 (탄력 없음 → 5행)
    expect(screen.getByText('수분')).toBeInTheDocument();
    expect(screen.getByText('주름')).toBeInTheDocument();
    expect(screen.getByText('유분 밸런스')).toBeInTheDocument();
    expect(screen.getByTestId('skin-condition-rows').querySelectorAll('dt')).toHaveLength(5);
  });

  it('탄력 지표가 있으면 근거 행이 하나 늘어난다', () => {
    render(<SkinAgeCalculator skinMetrics={{ ...goodMetrics, elasticity: 80 }} />);
    expect(screen.getByText('탄력')).toBeInTheDocument();
    expect(screen.getByTestId('skin-condition-rows').querySelectorAll('dt')).toHaveLength(6);
  });

  it('지표도 종합 점수도 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<SkinAgeCalculator skinMetrics={null} overallScore={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  // ADR-120: 케어 탭 그라데이션 벽면 폐지 — 헤더도 솔리드여야 한다
  it('헤더에 그라데이션 배경을 쓰지 않는다', () => {
    const { container } = render(<SkinAgeCalculator skinMetrics={goodMetrics} overallScore={70} />);
    expect(container.querySelectorAll('[class*="bg-gradient"]').length).toBe(0);
  });

  // 재발 방지(2026-08): 합성 외모 나이 채점 표면이 되돌아오지 않게 한다
  describe('외모 채점 표면 부재 (ADR-120 무채점 계약)', () => {
    it('합성 "피부나이"·실제나이 비교 문구를 렌더하지 않는다', () => {
      const { container } = render(
        <SkinAgeCalculator skinMetrics={goodMetrics} overallScore={70} />
      );
      expect(container.textContent).not.toMatch(/피부나이/);
      expect(container.textContent).not.toMatch(/실제나이/);
      // "N살 어려/많아 보여요" 계열 문구 일체 없음
      expect(container.textContent).not.toMatch(/살/);
      expect(container.textContent).not.toMatch(/어려|젊어/);
    });

    it('A~F 등급 배지를 렌더하지 않는다', () => {
      const { container } = render(
        <SkinAgeCalculator skinMetrics={goodMetrics} overallScore={70} />
      );
      expect(container.textContent).not.toMatch(/등급/);
      expect(container.textContent).not.toMatch(/\b[A-F]\b/);
    });

    it('반원 게이지(ScoreGauge) 연출을 쓰지 않는다', () => {
      render(<SkinAgeCalculator skinMetrics={goodMetrics} overallScore={70} />);
      expect(screen.queryByTestId('score-gauge')).not.toBeInTheDocument();
    });

    it('결과 객체에도 합성 나이·등급 필드를 담지 않는다', () => {
      const result = getResult({ skinMetrics: goodMetrics, overallScore: 70 });
      expect(result).not.toHaveProperty('skinAge');
      expect(result).not.toHaveProperty('actualAge');
      expect(result).not.toHaveProperty('difference');
      expect(result).not.toHaveProperty('grade');
    });
  });
});
