/**
 * ProfileCardGrid 테스트 (ADR-109 Phase 1)
 * 프로필 카드: 완성도 미터 · 완료 칸(개별 결과 링크) · 빈 칸(CTA) · 통합 진입.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileCardGrid from '@/app/(main)/home/_components/ProfileCardGrid';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

function summary(
  type: AnalysisSummary['type'],
  over: Partial<AnalysisSummary> = {}
): AnalysisSummary {
  return { id: `${type}-1`, type, createdAt: new Date(), summary: `${type}-값`, ...over };
}

describe('ProfileCardGrid', () => {
  it('완료 2축이면 완성도 40% + 완료 카드 + 빈 칸 + 통합 CTA', () => {
    render(<ProfileCardGrid analyses={[summary('personal-color'), summary('skin')]} />);

    expect(screen.getByTestId('profile-card-grid')).toBeInTheDocument();
    expect(screen.getByText(/나를 40% 알아냈어요/)).toBeInTheDocument();
    // 완료 칸 → 개별 결과 링크
    const pc = screen.getByTestId('profile-card-personal-color');
    expect(pc).toHaveAttribute('href', '/analysis/personal-color/result/personal-color-1');
    // 빈 칸(체형) → 분석 CTA
    expect(screen.getByTestId('profile-card-empty-body')).toHaveAttribute('href', '/analysis/body');
    // 미완성 → 통합 채우기 CTA 노출
    expect(screen.getByTestId('profile-card-integrated-cta')).toBeInTheDocument();
  });

  it('5축 완료면 "완성" + 통합 CTA 숨김', () => {
    const all: AnalysisSummary[] = [
      summary('personal-color'),
      summary('skin'),
      summary('body'),
      summary('hair'),
      summary('makeup'),
    ];
    render(<ProfileCardGrid analyses={all} />);
    expect(screen.getByText('완성')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-card-integrated-cta')).not.toBeInTheDocument();
  });

  it('분석 0개면 5칸 모두 빈 칸 CTA', () => {
    render(<ProfileCardGrid analyses={[]} />);
    expect(screen.getByText(/나를 0% 알아냈어요/)).toBeInTheDocument();
    expect(screen.getAllByTestId(/profile-card-empty-/)).toHaveLength(5);
  });

  it('페르소나 한 줄이 있으면 상단 노출, 없으면 미노출', () => {
    const { rerender } = render(<ProfileCardGrid analyses={[summary('skin')]} />);
    expect(screen.queryByTestId('profile-persona-line')).not.toBeInTheDocument();

    rerender(
      <ProfileCardGrid analyses={[summary('skin')]} personaOneLine="봄볕에 피는 꽃 같은 사람" />
    );
    expect(screen.getByTestId('profile-persona-line')).toHaveTextContent(
      '봄볕에 피는 꽃 같은 사람'
    );
  });
});
