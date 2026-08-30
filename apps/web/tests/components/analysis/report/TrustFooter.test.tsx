/**
 * TrustFooter 테스트 — 푸터 신뢰 블록 프리미티브
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustFooter, getConfidenceGrade } from '@/components/analysis/report';

describe('TrustFooter', () => {
  it('신뢰도 라인과 등급 힌트를 렌더한다', () => {
    render(<TrustFooter confidence={85} reportTargetId="skin-result-1" testId="trust" />);

    expect(screen.getByText('분석 신뢰도 85%')).toBeInTheDocument();
    expect(screen.getByText('높음 — 신뢰할 수 있는 결과예요')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-result-report-trigger')).toHaveTextContent('이 결과 신고');
  });

  it('실제 결과 ID가 없는 공개 예시에는 신고 진입점을 위장하지 않는다', () => {
    render(<TrustFooter confidence={85} testId="trust" />);

    expect(screen.queryByTestId('analysis-result-report-trigger')).not.toBeInTheDocument();
  });

  it('신뢰도가 0이면 신뢰도 라인을 렌더하지 않는다 (위장 수치 금지)', () => {
    render(<TrustFooter confidence={0} testId="trust" />);

    expect(screen.queryByText(/분석 신뢰도/)).not.toBeInTheDocument();
  });

  it('신뢰도 미제공이어도 추가 라인은 렌더한다', () => {
    render(
      <TrustFooter testId="trust">
        <p>분석 시간: 2026-07-25</p>
      </TrustFooter>
    );

    expect(screen.queryByText(/분석 신뢰도/)).not.toBeInTheDocument();
    expect(screen.getByText('분석 시간: 2026-07-25')).toBeInTheDocument();
  });

  it('hint를 넘기면 등급 문구 대신 사용한다', () => {
    render(<TrustFooter confidence={92} hint="정면 사진 기준이에요" testId="trust" />);

    expect(screen.getByText('정면 사진 기준이에요')).toBeInTheDocument();
    expect(screen.queryByText(/매우 높음/)).not.toBeInTheDocument();
  });

  it('badge가 있을 때만 재현성 배지를 렌더한다', () => {
    const { rerender } = render(<TrustFooter confidence={80} testId="trust" />);
    expect(screen.queryByText('동일 조건 재분석으로 검증')).not.toBeInTheDocument();

    rerender(<TrustFooter confidence={80} badge="동일 조건 재분석으로 검증" testId="trust" />);
    expect(screen.getByText('동일 조건 재분석으로 검증')).toBeInTheDocument();
  });
});

describe('getConfidenceGrade', () => {
  it('경계값 등급을 정확히 매핑한다', () => {
    expect(getConfidenceGrade(90)).toMatch(/매우 높음/);
    expect(getConfidenceGrade(75)).toMatch(/^높음/);
    expect(getConfidenceGrade(60)).toMatch(/^보통/);
    expect(getConfidenceGrade(59)).toMatch(/재분석 권장/);
  });
});
