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

// 베스트 컬러가 있는 PC 분석(나의 컬러/오늘의 배색 시각화용)
const analysesWithColors = [
  {
    id: 'pc-9',
    type: 'personal-color',
    createdAt: new Date(),
    summary: '봄 웜톤',
    bestColors: [
      { name: '코랄', hex: '#FF7F50' },
      { name: '골드', hex: '#FFD700' },
      { name: '오렌지', hex: '#FFA500' },
    ],
  },
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

  it('PC 베스트 컬러가 있으면 "나의 컬러" 스와치 행을 렌더하고 PC 결과로 링크한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const section = screen.getByTestId('briefing-my-colors');
    expect(section).toBeInTheDocument();
    // 스와치 개수 = 팔레트 색 수, 각 스와치 title=색이름
    const swatches = screen.getAllByTestId('briefing-color-swatch');
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute('title', '코랄');
    // 행 전체가 PC 결과 페이지로 링크
    expect(section.querySelector('a')).toHaveAttribute(
      'href',
      '/analysis/personal-color/result/pc-9'
    );
  });

  it('PC 베스트 컬러가 없으면 "나의 컬러" 스와치 행을 렌더하지 않는다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.queryByTestId('briefing-my-colors')).not.toBeInTheDocument();
  });

  it('베스트 컬러가 있으면 오늘의 스타일에 배색 블록(상의·하의·신발·가방·포인트) 5개를 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.getByTestId('briefing-outfit-palette')).toBeInTheDocument();
    expect(screen.getAllByTestId('briefing-outfit-block')).toHaveLength(5);
  });

  it('각 배색 블록에 색 이름을 표시한다(상의=원본, 파생=계열명)', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const names = screen.getAllByTestId('briefing-outfit-name');
    expect(names).toHaveLength(5);
    // 상의는 진단된 원본 이름 중 하나(코랄/골드/오렌지), 파생 블록엔 '계열' 표기가 존재
    expect(names.some((n) => /계열/.test(n.textContent ?? ''))).toBe(true);
  });

  it('베스트 컬러가 없으면 배색 블록 없이 오늘의 스타일 카드만 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('briefing-style')).toBeInTheDocument();
    expect(screen.queryByTestId('briefing-outfit-palette')).not.toBeInTheDocument();
  });

  // ADR-117 수리: 라벨 정정 + 색 이름 표시
  it('"나의 퍼스널컬러" 라벨을 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.getByText('나의 퍼스널컬러')).toBeInTheDocument();
  });

  it('베스트 컬러 이름을 스와치 아래에 표시한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const names = screen.getAllByTestId('briefing-color-name');
    expect(names).toHaveLength(3);
    expect(names[0]).toHaveTextContent('코랄');
  });

  it('스와치 이름은 잘림(truncate)이 아니라 온전히 읽히게 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const name = screen.getAllByTestId('briefing-color-name')[0];
    // truncate(한 줄 말줄임) 대신 2줄 허용(line-clamp-2)로 가독 확보
    expect(name.className).not.toContain('truncate');
    expect(name.className).toContain('line-clamp-2');
  });
});
