/**
 * C-1 체형 결과 — W4 수리 검증 (라벨 풀이 / 목표 몸무게 제거 / BMI 완화)
 * apps/web/app/(main)/analysis/body/_components/AnalysisResult.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { BodyAnalysisResult } from '@/lib/mock/body-analysis';

vi.mock('@/components/analysis/body', () => ({
  RecommendedClothingCard: () => <div data-testid="recommended-clothing-card" />,
  BodyStyleImage: () => <div data-testid="body-style-image" />,
}));

vi.mock('@/components/analysis/EvidenceSummary', () => ({
  BodyEvidenceSummary: () => <div data-testid="body-evidence-summary" />,
}));

vi.mock('@/lib/color-recommendations', () => ({
  getOutfitExamples: () => [],
}));

import AnalysisResult from '@/app/(main)/analysis/body/_components/AnalysisResult';

const baseResult: BodyAnalysisResult = {
  bodyType: 'N',
  bodyTypeLabel: '내추럴',
  bodyTypeDescription: '자연스럽고 골격감 있는 실루엣',
  measurements: [{ name: '어깨', value: 60, description: '어깨 비율' }],
  strengths: ['어떤 옷이든 소화해요'],
  insight: '자연스럽고 편안한 스타일이 잘 어울려요',
  styleRecommendations: [{ item: '오버사이즈 셔츠', reason: '자연스러운 느낌' }],
  analyzedAt: new Date('2026-07-10T10:00:00'),
  personalColorSeason: null,
  colorTips: [],
  userInput: { height: 170, weight: 70 },
  bmi: 24.2,
  bmiCategory: '과체중',
};

// ProgressiveDisclosure(Radix Collapsible)는 닫힘 상태에서 content 언마운트 → 트리거 클릭으로 펼침
function openSection(title: string): void {
  const trigger = screen.getByText(title).closest('button');
  if (trigger) fireEvent.click(trigger);
}

const onRetry = vi.fn();

describe('체형 AnalysisResult — W4 수리', () => {
  it('#1 라벨에 짧은 풀이가 상시 병기된다 (내추럴 — 골격감이 자연스러운 타입)', () => {
    render(<AnalysisResult result={baseResult} onRetry={onRetry} />);

    const gloss = screen.getByTestId('body-type-gloss');
    expect(gloss).toHaveTextContent('내추럴 — 골격감이 자연스러운 타입');
  });

  it('#5 BMI 완화 — 비만/과체중 낙인 라벨 없이 근육량 안내만 노출 (펼침 후)', async () => {
    render(<AnalysisResult result={baseResult} onRetry={onRetry} />);

    openSection('분석 상세 더 보기');

    await waitFor(() => {
      expect(screen.getByTestId('bmi-caveat')).toBeInTheDocument();
    });
    expect(screen.getByText('BMI는 근육량에 따라 실제와 다를 수 있어요')).toBeInTheDocument();
    // '과체중' / '비만' 낙인 라벨은 결과에 노출되지 않음
    expect(screen.queryByText('과체중')).not.toBeInTheDocument();
    expect(screen.queryByText('비만')).not.toBeInTheDocument();
  });

  it('#4 목표 몸무게는 결과 어디에도 노출되지 않는다 (펼침 후에도)', async () => {
    render(<AnalysisResult result={baseResult} onRetry={onRetry} />);

    openSection('분석 상세 더 보기');

    await waitFor(() => {
      expect(screen.getByTestId('bmi-caveat')).toBeInTheDocument();
    });
    expect(screen.queryByText(/목표 몸무게/)).not.toBeInTheDocument();
  });
});
