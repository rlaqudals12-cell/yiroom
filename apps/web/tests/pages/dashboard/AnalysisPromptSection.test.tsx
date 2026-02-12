import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisPromptSection from '@/app/(main)/dashboard/_components/AnalysisPromptSection';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AnalysisPromptSection', () => {
  it('섹션이 올바른 data-testid로 렌더링된다', () => {
    render(<AnalysisPromptSection />);
    expect(screen.getByTestId('analysis-prompt-section')).toBeInTheDocument();
  });

  it('헤더 텍스트가 표시된다', () => {
    render(<AnalysisPromptSection />);
    expect(screen.getByText('나를 알아보는 여정을 시작해볼까요?')).toBeInTheDocument();
  });

  it('6개의 분석 카드가 렌더링된다', () => {
    render(<AnalysisPromptSection />);

    expect(screen.getByTestId('analysis-card-personal-color')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-card-skin')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-card-body')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-card-hair')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-card-makeup')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-card-oral-health')).toBeInTheDocument();
  });

  it('퍼스널 컬러에 추천 배지가 표시된다', () => {
    render(<AnalysisPromptSection />);
    expect(screen.getByText('추천')).toBeInTheDocument();
  });

  it('각 분석 카드 타이틀이 표시된다', () => {
    render(<AnalysisPromptSection />);

    expect(screen.getByText('퍼스널 컬러')).toBeInTheDocument();
    expect(screen.getByText('피부 분석')).toBeInTheDocument();
    expect(screen.getByText('체형 분석')).toBeInTheDocument();
    expect(screen.getByText('헤어 분석')).toBeInTheDocument();
    expect(screen.getByText('메이크업')).toBeInTheDocument();
    expect(screen.getByText('구강건강')).toBeInTheDocument();
  });

  it('퍼스널 컬러 분석 링크가 올바른 href를 가진다', () => {
    render(<AnalysisPromptSection />);

    const personalColorCard = screen.getByTestId('analysis-card-personal-color');
    expect(personalColorCard).toHaveAttribute('href', '/analysis/personal-color');
  });

  it('팁 메시지가 표시된다', () => {
    render(<AnalysisPromptSection />);
    expect(screen.getByText('퍼스널 컬러 분석부터 시작하면')).toBeInTheDocument();
    expect(screen.getByText(/다른 분석의 정확도가 올라가고/)).toBeInTheDocument();
  });

  it('서브 텍스트가 표시된다', () => {
    render(<AnalysisPromptSection />);
    expect(screen.getByText('AI가 당신만의 스타일을 분석해드려요')).toBeInTheDocument();
  });

  it('각 카드에 설명이 표시된다', () => {
    render(<AnalysisPromptSection />);

    expect(screen.getByText('나에게 어울리는 색상')).toBeInTheDocument();
    expect(screen.getByText('AI 피부 상태 진단')).toBeInTheDocument();
    expect(screen.getByText('맞춤 스타일 추천')).toBeInTheDocument();
    expect(screen.getByText('두피/모발 건강 체크')).toBeInTheDocument();
    expect(screen.getByText('나만의 뷰티 스타일')).toBeInTheDocument();
    expect(screen.getByText('치아·잇몸 건강 체크')).toBeInTheDocument();
  });
});
