/**
 * StylingPrinciplesCard 테스트 — ADR-098 C-1 3섹션 구조 ①
 *
 * 검증 포인트:
 * - 체형별(S/W/N) 원칙 데이터가 제대로 노출되는가
 * - 각 원칙이 title + rationale + application 3요소를 모두 렌더링하는가
 * - body type 라벨이 헤더에 표시되는가
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StylingPrinciplesCard } from '@/components/analysis/body/StylingPrinciplesCard';
import { STYLING_PRINCIPLES } from '@/lib/styling-principles';

describe('StylingPrinciplesCard', () => {
  it('스트레이트(S) 체형 원칙을 모두 렌더링한다', () => {
    render(<StylingPrinciplesCard bodyType="S" bodyTypeLabel="스트레이트" />);

    const card = screen.getByTestId('styling-principles-card');
    expect(card).toBeInTheDocument();

    // 헤더
    expect(screen.getByText('스타일링 원칙')).toBeInTheDocument();
    expect(screen.getByText(/스트레이트 체형이 가진 기준/)).toBeInTheDocument();

    // 각 원칙 블록이 렌더링되는지 (testId 단위로 내부 텍스트 확인)
    STYLING_PRINCIPLES.S.forEach((principle, idx) => {
      const block = screen.getByTestId(`styling-principle-${idx}`);
      expect(block).toBeInTheDocument();
      expect(block).toHaveTextContent(principle.title);
      expect(block).toHaveTextContent(principle.rationale);
      expect(block).toHaveTextContent(principle.application);
    });
  });

  it('웨이브(W) 체형 원칙을 렌더링한다', () => {
    render(<StylingPrinciplesCard bodyType="W" bodyTypeLabel="웨이브" />);

    expect(screen.getByTestId('styling-principles-card')).toBeInTheDocument();
    expect(screen.getByText(/웨이브 체형이 가진 기준/)).toBeInTheDocument();
    expect(screen.getByTestId('styling-principle-0')).toHaveTextContent(
      STYLING_PRINCIPLES.W[0].title
    );
  });

  it('내추럴(N) 체형 원칙을 렌더링한다', () => {
    render(<StylingPrinciplesCard bodyType="N" bodyTypeLabel="내추럴" />);

    expect(screen.getByTestId('styling-principles-card')).toBeInTheDocument();
    expect(screen.getByText(/내추럴 체형이 가진 기준/)).toBeInTheDocument();
    expect(screen.getByTestId('styling-principle-0')).toHaveTextContent(
      STYLING_PRINCIPLES.N[0].title
    );
  });

  it('bodyTypeLabel이 없어도 기본 문구로 fallback한다', () => {
    render(<StylingPrinciplesCard bodyType="S" />);

    expect(screen.getByText(/이 체형이 가진 기준/)).toBeInTheDocument();
  });

  it('모든 체형에 3개 이상의 원칙이 정의되어 있다 (ADR-098 §C-1)', () => {
    (['S', 'W', 'N'] as const).forEach((type) => {
      expect(STYLING_PRINCIPLES[type].length).toBeGreaterThanOrEqual(3);
    });
  });
});
