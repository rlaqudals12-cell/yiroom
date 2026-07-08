/**
 * C-1 체형 결과 컴포넌트 — 결론 먼저(ADR-111) 재배치 검증
 * apps/web/app/(main)/analysis/body/_components/AnalysisResult.tsx
 *
 * - 체형 타입 카드 → 결론 액션 카드(TopActionsCard) → 초보자 가이드가 펼쳐진 상태로 노출
 * - 상세(비율/강점/추천 아이템 등)는 ProgressiveDisclosure로 접힘 (정보 삭제 없이 접기만)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { BodyAnalysisResult } from '@/lib/mock/body-analysis';

// AnalysisResult 하위 컴포넌트 mock (외부 의존성 최소화)
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

const mockResult: BodyAnalysisResult = {
  bodyType: 'S',
  bodyTypeLabel: '스트레이트형',
  bodyTypeDescription: '탄탄하고 입체적인 실루엣',
  measurements: [{ name: '어깨', value: 60, description: '어깨 비율' }],
  strengths: ['상체가 탄탄해요'],
  insight: '심플하고 베이직한 스타일이 잘 어울려요',
  styleRecommendations: [{ item: '테일러드 재킷', reason: '어깨 라인이 살아요' }],
  analyzedAt: new Date('2026-07-09T10:00:00'),
  personalColorSeason: null,
  colorTips: [],
  easyBodyTip: {
    summary: '딱 맞는 사이즈가 최고!',
    easyExplanation: '깔끔한 스타일이 잘 어울려요.',
    doList: ['테일러드 재킷', 'V넥 니트'],
    dontList: ['프릴 많은 옷', '오버핏 전체'],
    styleTip: '심플 이즈 베스트! 핏이 좋은 기본 아이템으로 코디해보세요',
  },
};

describe('체형 AnalysisResult — 결론 먼저 재배치', () => {
  const onRetry = vi.fn();

  it('결론 액션 카드(TopActionsCard)가 노출된다', () => {
    render(<AnalysisResult result={mockResult} onRetry={onRetry} />);

    expect(screen.getByTestId('top-actions-card')).toBeInTheDocument();
  });

  it('핵심 팁이 첫 번째 행동으로 조립된다', () => {
    render(<AnalysisResult result={mockResult} onRetry={onRetry} />);

    // 카드 범위 안에서 styleTip 확인 (동일 문구가 초보자 가이드에도 있어 within으로 스코프)
    const card = screen.getByTestId('top-actions-card');
    expect(
      within(card).getByText('심플 이즈 베스트! 핏이 좋은 기본 아이템으로 코디해보세요')
    ).toBeInTheDocument();
  });

  it('추천 아이템과 피해야 할 스타일이 결론 액션에 반영된다', () => {
    render(<AnalysisResult result={mockResult} onRetry={onRetry} />);

    const card = screen.getByTestId('top-actions-card');
    // styleRecommendations[0].item
    expect(within(card).getByText('테일러드 재킷')).toBeInTheDocument();
    // dontList[0] → "이건 피하세요 — …" (전체 문구는 카드에만 존재)
    expect(screen.getByText('이건 피하세요 — 프릴 많은 옷')).toBeInTheDocument();
  });

  it('체형 타입과 초보자 가이드는 펼쳐진 상태로 노출된다', () => {
    render(<AnalysisResult result={mockResult} onRetry={onRetry} />);

    // BODY_TYPES_3['S'].label = '스트레이트'
    expect(screen.getByText('스트레이트')).toBeInTheDocument();
    expect(screen.getByText('초보자를 위한 스타일 가이드')).toBeInTheDocument();
  });

  it('상세 분석은 접힘 상태(ProgressiveDisclosure)로 제공된다', () => {
    render(<AnalysisResult result={mockResult} onRetry={onRetry} />);

    // 접힘 트리거 자체는 존재 (정보 삭제 없이 접기만)
    expect(screen.getByText('분석 상세 더 보기')).toBeInTheDocument();
    // 접힌 콘텐츠(비율 분석 헤더)는 초기 렌더 시 DOM에 없음
    expect(screen.queryByText('비율 분석')).not.toBeInTheDocument();
  });
});
