/**
 * DailyBriefing 렌더 테스트 (ADR-114)
 * 브리핑 레터 + 오늘의 실행 3개 + 물어보기 인풋을 렌더하고,
 * 질문 제출 시 /coach?q= 로 이동한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1', firstName: '지민', username: null } }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
// 날씨/인사이트는 부작용 훅 — 비어있는 결과로 stub (레터 문장은 분석 데이터로 생성)
vi.mock('@/lib/weather', () => ({
  getCurrentWeather: vi.fn().mockResolvedValue(null),
  generateEnvironmentAdvice: vi.fn().mockReturnValue({ skin: [], fashion: [] }),
}));
vi.mock('@/lib/insights', () => ({
  generateInsights: () => ({ insights: [] }),
  analysisToDataBundle: () => ({}),
}));
vi.mock('@/app/(main)/home/_components/HomeDailyCapsuleWidget', () => ({
  default: () => <div data-testid="home-daily-capsule" />,
}));
vi.mock('@/app/(main)/home/_components/IntegratedSessionPromptCard', () => ({
  IntegratedSessionPromptCard: () => <div data-testid="integrated-session-prompt-card" />,
}));

import DailyBriefing from '@/app/(main)/home/_components/DailyBriefing';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

const analyses = [
  {
    id: '1',
    type: 'skin',
    createdAt: new Date(),
    summary: '80점',
    skinScore: 80,
    skinDelta: 2,
    skinTrend: 'up',
  },
  { id: '2', type: 'personal-color', createdAt: new Date(), summary: '봄 웜톤' },
] as AnalysisSummary[];

describe('DailyBriefing', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('브리핑 레터와 인사말을 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('home-daily-briefing')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-letter')).toBeInTheDocument();
    expect(screen.getByText(/지민님/)).toBeInTheDocument();
  });

  it('오늘의 실행 3개(루틴·스타일·내 상태)를 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('briefing-routine')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-style')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-status')).toBeInTheDocument();
    expect(screen.getByTestId('home-daily-capsule')).toBeInTheDocument();
  });

  it('피부 추이 칩을 표시한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('skin-trend-chip')).toBeInTheDocument();
  });

  it('질문을 입력해 제출하면 /coach?q= 로 이동한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    const input = screen.getByTestId('briefing-ask-input');
    fireEvent.change(input, { target: { value: '뭐 입지?' } });
    fireEvent.submit(input.closest('form')!);
    expect(pushMock).toHaveBeenCalledWith(`/coach?q=${encodeURIComponent('뭐 입지?')}`);
  });

  it('빈 질문이면 /coach 로 이동한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    fireEvent.submit(screen.getByTestId('briefing-ask-input').closest('form')!);
    expect(pushMock).toHaveBeenCalledWith('/coach');
  });

  it('최신 통합 결과 링크(IntegratedSessionPromptCard)를 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('integrated-session-prompt-card')).toBeInTheDocument();
  });
});
