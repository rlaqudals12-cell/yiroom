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
});
