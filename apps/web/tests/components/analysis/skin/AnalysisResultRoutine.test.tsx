/**
 * S-1 피부 분석 결과 — 정본 데일리 루틴 렌더 테스트
 *
 * ADR-111 One Canon: 결과 페이지의 루틴이 lib/skincare `generateRoutine`
 * 정본 엔진으로 렌더되는지(홈 오늘의 루틴·케어 탭과 동일 기준) 검증.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import AnalysisResult from '@/app/(main)/analysis/skin/_components/AnalysisResult';
import { generateMockAnalysisResult } from '@/lib/mock/skin-analysis';
import { generateRoutine } from '@/lib/skincare';

describe('AnalysisResult — 정본 데일리 루틴', () => {
  it('generateRoutine 엔진의 아침 스텝이 데일리 루틴 섹션에 렌더된다', () => {
    const result = generateMockAnalysisResult();

    render(<AnalysisResult result={result} skinType="dry" onRetry={vi.fn()} />);

    const section = screen.getByTestId('skin-daily-routine');
    expect(section).toBeInTheDocument();

    // 정본 엔진이 산출하는 아침 필수 스텝(스텝명)이 그대로 노출되는지
    const expected = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'morning',
      includeOptional: false,
    });
    expect(expected.routine.length).toBeGreaterThan(0);

    for (const step of expected.routine.slice(0, 5)) {
      expect(within(section).getAllByText(step.name).length).toBeGreaterThan(0);
    }
  });

  it('"전체 루틴 보기" 링크가 심화 루틴 페이지로 연결된다', () => {
    const result = generateMockAnalysisResult();

    render(<AnalysisResult result={result} skinType="oily" onRetry={vi.fn()} />);

    const link = screen.getByTestId('skin-routine-full-link');
    expect(link).toHaveAttribute('href', '/analysis/skin/routine');
  });
});
