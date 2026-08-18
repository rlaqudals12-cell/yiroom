/**
 * NewUserHero 디자인 계약 테스트 (ADR-120)
 * 신규 사용자에게 가짜 결과를 예고하지 않고, 통합 분석 1개를 주인공으로 제시한다.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      newUserGuide: '신규 사용자 안내',
      heroTitle: '나에게 어울리는 색, 피부, 스타일을\n한 번에 알아보세요',
      socialProof: '5가지 시각 정체성 분석 완전 무료',
      personalColor: '퍼스널 컬러 (나에게 어울리는 색)',
      skinAnalysis: '피부 분석',
      bodyAnalysis: '체형 분석 (나에게 맞는 옷 스타일)',
      hairAnalysis: '헤어',
      makeupAnalysis: '메이크업',
      previewSpringWarm: '봄 웜톤',
      previewSkinScore: '피부 점수',
      previewNatural: '내추럴',
      synergyTitle: '6개 분석이 하나로 연결돼요',
      surveyAltLabel: '부담 없이 시작하고 싶다면',
      surveyAltAction: '사진 한 장으로 시작하기',
    };

    return messages[key] ?? key;
  },
}));

import NewUserHero from '@/app/(main)/home/_components/NewUserHero';

const individualAnalyses = [
  ['퍼스널 컬러 (나에게 어울리는 색)', '/analysis/personal-color'],
  ['피부 분석', '/analysis/skin'],
  ['체형 분석 (나에게 맞는 옷 스타일)', '/analysis/body'],
  ['헤어', '/analysis/hair'],
  ['메이크업', '/analysis/makeup'],
] as const;

describe('NewUserHero', () => {
  it('세리프 제목 하나만 신규 사용자 표면의 히어로로 둔다', () => {
    render(<NewUserHero />);

    const hero = screen.getByRole('region', { name: '신규 사용자 안내' });
    const headings = within(hero).getAllByRole('heading');

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveClass('font-serif');
    expect(headings[0]).toHaveTextContent('나에게 어울리는 색, 피부, 스타일을 한 번에 알아보세요');
  });

  it('통합 분석을 유일한 핵심 CTA로 제공한다', () => {
    render(<NewUserHero />);

    const hero = screen.getByTestId('home-new-hero');
    const integratedLinks = within(hero)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/analysis/integrated');

    expect(integratedLinks).toHaveLength(1);
    expect(integratedLinks[0]).toBe(screen.getByTestId('home-hero-integrated-cta'));
    expect(integratedLinks[0]).toHaveTextContent('내 정체성 5가지 알아보기');
    expect(integratedLinks[0]).toHaveTextContent('색 · 피부 · 체형 · 헤어 · 메이크업');
  });

  it.each(individualAnalyses)('%s 개별 분석 잉크 링크를 유지한다', (name, href) => {
    render(<NewUserHero />);

    const link = screen.getByRole('link', { name });

    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveClass('hover:text-foreground');
    expect(link).not.toHaveClass('text-primary');
    expect(link).not.toHaveClass('bg-primary');
  });

  it('가짜 결과 미리보기와 점수를 노출하지 않는다', () => {
    render(<NewUserHero />);

    expect(screen.queryByTestId('hero-analysis-preview')).not.toBeInTheDocument();
    expect(screen.queryByText('봄 웜톤')).not.toBeInTheDocument();
    expect(screen.queryByText('85')).not.toBeInTheDocument();
    expect(screen.queryByText('내추럴')).not.toBeInTheDocument();
  });

  it('시너지 카드와 중복 설문 CTA를 노출하지 않는다', () => {
    render(<NewUserHero />);

    expect(screen.queryByTestId('hero-synergy-chain')).not.toBeInTheDocument();
    expect(screen.queryByText('6개 분석이 하나로 연결돼요')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-new-survey-alt')).not.toBeInTheDocument();
    expect(screen.queryByText('부담 없이 시작하고 싶다면')).not.toBeInTheDocument();
    expect(screen.queryByText('사진 한 장으로 시작하기')).not.toBeInTheDocument();
  });
});
