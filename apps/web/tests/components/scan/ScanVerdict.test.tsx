/**
 * ScanVerdict 컴포넌트 테스트 — "나와의 적합도" 판정 화면
 * - regulatory / timelines 유무 분기 (하위호환 방어)
 * - 면책 문구 존재
 * - 금지 표현(치료·재생·보장·사라져·안전 등급·나쁨) 부재
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScanVerdict, type ScanVerdictData } from '@/components/scan/ScanVerdict';
import type { ProductIngredient } from '@/types/scan';

// 금지 표현 (ADR-112 §5 / SDD §1)
const FORBIDDEN = ['치료', '재생', '보장', '사라져', '없어져', '안전 등급', '나쁨'];

const ingredients: ProductIngredient[] = [
  { order: 1, inciName: 'Water', nameKo: '정제수' },
  { order: 2, inciName: 'Niacinamide', nameKo: '나이아신아마이드', ewgGrade: 1 },
  { order: 3, inciName: 'Retinol', nameKo: '레티놀', ewgGrade: 4 },
];

function baseVerdict(overrides: Partial<ScanVerdictData> = {}): ScanVerdictData {
  return {
    overallScore: 82,
    skinCompatibility: {
      score: 82,
      goodPoints: [
        {
          title: '지성 피부에 적합',
          description: '나이아신아마이드가 도움이 될 수 있어요',
          basedOn: 'skin_type',
          confidence: 'high',
        },
      ],
      warnings: [],
    },
    ingredientAnalysis: {
      beneficial: [],
      caution: [],
      avoid: [],
      interactions: [],
    },
    hasUserAnalysis: { skinAnalysis: true, personalColor: false },
    ...overrides,
  };
}

describe('ScanVerdict', () => {
  it('규제 정보와 효과 타임라인이 있으면 각각 렌더링하고 면책을 표시한다', () => {
    const verdict = baseVerdict({
      regulatory: [
        {
          ingredient: 'Limonene',
          kind: 'allergen25',
          label: '식약처 지정 알레르기 유발 착향제',
        },
      ],
      timelines: [
        {
          name: '레티놀',
          aliases: ['retinol'],
          effect: '피부 결·잔주름 관리에 도움',
          timeline: '결 2-4주',
          timelineShort: '2-4주',
          sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27050703/',
          sourceLabel: 'PubMed 27050703',
        },
      ],
    });

    render(<ScanVerdict verdict={verdict} ingredients={ingredients} />);

    // 히어로: 적합도 점수 + 라벨
    expect(screen.getByTestId('scan-verdict-hero')).toBeInTheDocument();
    expect(screen.getByText('나와의 적합도')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();

    // 규제 정보 섹션 (label 그대로 인용)
    expect(screen.getByTestId('scan-verdict-regulatory')).toBeInTheDocument();
    expect(screen.getByText('식약처 지정 알레르기 유발 착향제')).toBeInTheDocument();

    // 타임라인 섹션 + 출처 링크
    expect(screen.getByTestId('scan-verdict-timeline')).toBeInTheDocument();
    expect(screen.getByText(/PubMed 27050703/)).toBeInTheDocument();

    // 면책
    expect(screen.getByTestId('scan-verdict-disclaimer')).toBeInTheDocument();
    expect(screen.getByTestId('scan-verdict-disclaimer').textContent).toContain(
      '의학적 조언이 아니'
    );
  });

  it('regulatory/timelines가 없으면(undefined) 해당 섹션을 표시하지 않고 크래시 없이 렌더된다', () => {
    render(<ScanVerdict verdict={baseVerdict()} ingredients={ingredients} />);

    expect(screen.getByTestId('scan-verdict')).toBeInTheDocument();
    expect(screen.queryByTestId('scan-verdict-regulatory')).not.toBeInTheDocument();
    expect(screen.queryByTestId('scan-verdict-timeline')).not.toBeInTheDocument();
    // 면책은 항상 존재
    expect(screen.getByTestId('scan-verdict-disclaimer')).toBeInTheDocument();
  });

  it('피부 프로필이 없으면 점수 대신 분석 CTA를 표시한다 (L1/L4는 유지)', () => {
    const verdict = baseVerdict({
      hasUserAnalysis: { skinAnalysis: false, personalColor: false },
      regulatory: [
        { ingredient: 'Limonene', kind: 'allergen25', label: '식약처 지정 알레르기 유발 착향제' },
      ],
    });

    render(<ScanVerdict verdict={verdict} ingredients={ingredients} />);

    // 점수 히어로 대신 CTA
    expect(screen.queryByTestId('scan-verdict-hero')).not.toBeInTheDocument();
    expect(screen.getByTestId('scan-verdict-cta')).toBeInTheDocument();
    expect(screen.getByText('피부 분석을 하면 내 피부 기준으로 판정해드려요')).toBeInTheDocument();
    // 배치 IA-3: 미분석 첫 진입은 통합분석("첫 미팅")으로 통일 — 개별 축(/analysis/skin) 아님(재발 방지)
    expect(screen.getByRole('link', { name: '피부 분석 시작하기' })).toHaveAttribute(
      'href',
      '/analysis/integrated'
    );
    // 프로필 무관인 규제 정보는 여전히 표시
    expect(screen.getByTestId('scan-verdict-regulatory')).toBeInTheDocument();
  });

  it('금지 표현(치료·재생·보장·안전 등급·나쁨 등)을 렌더하지 않는다', () => {
    const verdict = baseVerdict({
      overallScore: 45,
      ingredientAnalysis: {
        beneficial: [],
        caution: [],
        avoid: [{ ingredient: 'Alcohol', nameKo: '알코올', reason: '민감 피부에 자극' }],
        interactions: [],
      },
      regulatory: [
        { ingredient: 'Limonene', kind: 'allergen25', label: '식약처 지정 알레르기 유발 착향제' },
      ],
      timelines: [
        {
          name: '비타민C',
          aliases: ['vitamin c'],
          effect: '피부 톤 개선에 도움',
          timeline: '톤 8-12주',
          timelineShort: '8-12주',
          sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27050703/',
          sourceLabel: 'PubMed 27050703',
        },
      ],
    });

    const { container } = render(<ScanVerdict verdict={verdict} ingredients={ingredients} />);
    const text = container.textContent ?? '';

    for (const word of FORBIDDEN) {
      expect(text).not.toContain(word);
    }
  });
});
