/**
 * M-1 메이크업 인라인 결과 뷰 테스트 (W2 창업자 피드백)
 * - 얼굴 도식 마커 위치 (부위별 매핑)
 * - 전문 용어 쉬운 풀이
 * - 상황별(데일리/풀) 탭
 * - 보유 화장품 배지
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MakeupAnalysisResultView } from '@/app/(main)/analysis/makeup/_components/MakeupAnalysisResultView';
import { generateKnownUndertoneResult } from '@/lib/mock/makeup-analysis';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const result = generateKnownUndertoneResult('warm', []);

function mockFetch(items: Array<{ productName: string }>) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items }),
  }) as unknown as typeof fetch;
}

describe('MakeupAnalysisResultView', () => {
  beforeEach(() => {
    mockFetch([]); // 기본: 보유 제품 없음
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('폴백 정직성 고지', () => {
    it('폴백 결과에는 샘플 고지를 표시하고 신뢰도 퍼센트를 숨긴다', () => {
      render(<MakeupAnalysisResultView result={result} usedMock onRetry={() => {}} />);

      expect(screen.getByTestId('mock-data-notice')).toBeInTheDocument();
      expect(screen.queryByText(/분석 신뢰도 \d+%/)).not.toBeInTheDocument();
    });

    it('실분석 결과에는 기존 신뢰도 표기를 유지한다', () => {
      render(<MakeupAnalysisResultView result={result} usedMock={false} onRetry={() => {}} />);

      expect(screen.queryByTestId('mock-data-notice')).not.toBeInTheDocument();
      expect(screen.getByText(/분석 신뢰도 \d+%/)).toBeInTheDocument();
    });
  });

  describe('얼굴 도식 마커 위치', () => {
    it('아이섀도는 눈, 립은 입술 위치에 배치된다 (아이섀도가 립보다 위)', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      const eye = screen.getByTestId('makeup-facemarker-eyeshadow');
      const lip = screen.getByTestId('makeup-facemarker-lip');
      const eyeTop = parseFloat(eye.getAttribute('data-top')!);
      const lipTop = parseFloat(lip.getAttribute('data-top')!);
      expect(eyeTop).toBeLessThan(lipTop); // 눈이 입술보다 위(작은 %)
    });

    it('마커가 부위 순서대로 세로 정렬된다 (아이섀도<블러셔<립)', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      const top = (cat: string) =>
        parseFloat(screen.getByTestId(`makeup-facemarker-${cat}`).getAttribute('data-top')!);
      expect(top('eyeshadow')).toBeLessThan(top('blush'));
      expect(top('blush')).toBeLessThan(top('lip'));
    });
  });

  describe('전문 용어 쉬운 풀이', () => {
    it('웜톤 요약에 대한 쉬운 풀이가 노출된다', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      const glossary = screen.getByTestId('makeup-glossary');
      expect(glossary).toBeInTheDocument();
      expect(glossary.textContent).toContain('웜톤');
    });
  });

  describe('상황별(데일리/풀) 탭', () => {
    it('탭이 렌더되고 풀메이크업 전환 시 커버 안내가 보인다', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      expect(screen.getByTestId('makeup-situational-tabs')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('makeup-situation-full'));
      expect(screen.getByTestId('makeup-situational-tabs').textContent).toContain('커버');
    });

    it('데일리 탭은 립 중심 안내를 보여준다', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      expect(screen.getByTestId('makeup-situational-tabs').textContent).toContain('립');
    });
  });

  // prod 형상 회귀: 소비처가 SpectrumRow를 progressbar로 감싸면 children이 presentational로
  // 접혀 "NN점 · 상태" 텍스트가 보조기기에서 사라진다 (ADR-120 취지 역행)
  describe('피부 상태 지표 접근성', () => {
    const STATUS_TEXT: Record<'good' | 'normal' | 'warning', string> = {
      good: '양호',
      normal: '보통',
      warning: '집중 케어',
    };

    it('지표마다 progressbar 이름에 점수와 상태어가 함께 실린다', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);

      for (const metric of result.metrics) {
        const bar = screen.getByRole('progressbar', {
          name: `${metric.label}: ${metric.value}점 · ${STATUS_TEXT[metric.status]}`,
        });
        expect(bar).toHaveAttribute('aria-valuenow', String(metric.value));
      }
    });

    it('상태 텍스트는 progressbar 서브트리 밖에 남는다', () => {
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);

      const statuses = screen.getAllByText(/^\d+점 · (양호|보통|집중 케어)$/);
      expect(statuses.length).toBeGreaterThanOrEqual(result.metrics.length);
      for (const status of statuses) {
        expect(status.closest('[role="progressbar"]')).toBeNull();
      }
    });
  });

  describe('보유 화장품 배지', () => {
    it('제품함에 립 제품이 있으면 "내 립 활용" 배지가 표시된다', async () => {
      mockFetch([{ productName: '롬앤 쥬시래스팅 틴트' }]);
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      await waitFor(() => {
        expect(screen.getByTestId('makeup-shelf-badge-lip')).toBeInTheDocument();
      });
    });

    it('보유 제품이 없으면 배지가 표시되지 않는다', async () => {
      mockFetch([]);
      render(<MakeupAnalysisResultView result={result} onRetry={() => {}} />);
      await waitFor(() => {
        expect(screen.getByTestId('makeup-situational-tabs')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('makeup-shelf-badge-lip')).not.toBeInTheDocument();
    });
  });

  it('저장된 퍼스널컬러의 브랜드 호수와 올리브영 대안을 함께 표시한다', () => {
    render(
      <MakeupAnalysisResultView
        result={{
          ...result,
          foundationRecommendations: [
            {
              shadeName: '21호 웜 베이지',
              undertone: 'warm',
              brandExample: '에스티로더 더블웨어 2W1',
              easyDescription: '노란 기가 도는 밝은 베이지 (피치빛)',
              oliveyoungAlt: '클리오 킬커버 파운웨어 03 린넨',
            },
          ],
        }}
        onRetry={() => {}}
      />
    );

    expect(screen.getByText('추천 파운데이션')).toBeInTheDocument();
    expect(screen.getByText('에스티로더 더블웨어 2W1')).toBeInTheDocument();
    expect(screen.getByText(/올리브영: 클리오 킬커버 파운웨어 03 린넨/)).toBeInTheDocument();
  });
});
