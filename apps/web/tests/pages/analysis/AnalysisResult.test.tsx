/**
 * AnalysisResult 컴포넌트 테스트
 * @description PC-1 퍼스널 컬러 분석 결과 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisResult from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
import type { PersonalColorResult } from '@/lib/mock/personal-color';

// lucide-react mock은 setup.ts에서 글로벌로 제공됨

describe('AnalysisResult', () => {
  const mockResult: PersonalColorResult = {
    seasonType: 'spring',
    seasonLabel: '봄 웜톤',
    seasonDescription: '밝고 따뜻한 느낌의 색상이 잘 어울려요',
    tone: 'warm',
    depth: 'light',
    confidence: 85,
    bestColors: [
      { name: '코랄', hex: '#FF7F50' },
      { name: '피치', hex: '#FFDAB9' },
      { name: '살구색', hex: '#FBCEB1' },
      { name: '아이보리', hex: '#FFFFF0' },
      { name: '연두', hex: '#98FB98' },
    ],
    worstColors: [
      { name: '블랙', hex: '#000000' },
      { name: '네이비', hex: '#000080' },
      { name: '와인', hex: '#722F37' },
    ],
    lipstickRecommendations: [
      { colorName: '코랄 핑크', hex: '#FF6F61', brandExample: 'MAC Coral Bliss' },
      { colorName: '피치 누드', hex: '#FFCBA4', brandExample: 'Charlotte Tilbury Pillow Talk' },
    ],
    clothingRecommendations: [
      { item: '블라우스', colorSuggestion: '아이보리', reason: '얼굴이 환하게 보여요' },
      { item: '니트', colorSuggestion: '코랄', reason: '혈색이 좋아 보여요' },
    ],
    styleDescription: {
      imageKeywords: ['화사한', '생기있는', '밝은', '청순한', '발랄한'],
      makeupStyle: '코랄, 피치 계열의 따뜻한 컬러 메이크업이 잘 어울립니다.',
      fashionStyle: '아이보리, 크림색, 연한 오렌지 톤의 밝고 따뜻한 색상이 어울립니다.',
      accessories: '골드 주얼리, 베이지톤 가방이 잘 어울립니다.',
    },
    insight:
      '당신은 밝고 따뜻한 색상이 잘 어울리는 봄 웜톤입니다. 코랄, 피치 계열의 색상으로 스타일링하면 더욱 화사해 보여요!',
    analyzedAt: new Date('2025-12-09T10:00:00'),
  };

  const mockOnRetry = vi.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  describe('퍼스널 컬러 타입 표시', () => {
    it('시즌 타입 레이블을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
    });

    it('시즌 설명을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('밝고 따뜻한 느낌의 색상이 잘 어울려요')).toBeInTheDocument();
    });

    it('신뢰도를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('신뢰도 85%')).toBeInTheDocument();
    });
  });

  describe('베스트/워스트 컬러', () => {
    it('베스트 컬러 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 베스트 컬러가 여러 곳에 나타날 수 있음
      const bestColorElements = screen.getAllByText('베스트 컬러');
      expect(bestColorElements.length).toBeGreaterThanOrEqual(1);
    });

    it('베스트 컬러 이름을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 컬러 이름이 여러 곳에 나타날 수 있으므로 getAllByText 사용
      expect(screen.getAllByText('피치').length).toBeGreaterThan(0);
      expect(screen.getAllByText('살구색').length).toBeGreaterThan(0);
    });

    it('워스트 컬러 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 나머지 주의 컬러 섹션 (worstColors[1:] 표시)
      expect(screen.getByText('나머지 주의 컬러 (참고용)')).toBeInTheDocument();
    });

    it('워스트 컬러 이름을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('블랙')).toBeInTheDocument();
      expect(screen.getByText('네이비')).toBeInTheDocument();
    });
  });

  describe('스타일 인사이트', () => {
    it('스타일 인사이트 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('스타일 인사이트')).toBeInTheDocument();
    });

    it('인사이트 내용을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/밝고 따뜻한 색상이 잘 어울리는/)).toBeInTheDocument();
    });
  });

  describe('스타일 가이드', () => {
    it('스타일 키워드 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('나의 스타일 키워드')).toBeInTheDocument();
    });

    it('스타일 키워드를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('화사한')).toBeInTheDocument();
      expect(screen.getByText('생기있는')).toBeInTheDocument();
    });

    it('스타일 가이드 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('스타일 가이드')).toBeInTheDocument();
    });

    it('메이크업 스타일을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/코랄, 피치 계열의 따뜻한 컬러 메이크업/)).toBeInTheDocument();
    });
  });

  describe('립스틱 추천', () => {
    it('추천 립스틱 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('추천 립스틱')).toBeInTheDocument();
    });

    it('립스틱 컬러명을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
      expect(screen.getByText('피치 누드')).toBeInTheDocument();
    });

    it('브랜드 예시를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('MAC Coral Bliss')).toBeInTheDocument();
    });
  });

  describe('의류 추천', () => {
    it('추천 스타일링 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('추천 스타일링')).toBeInTheDocument();
    });

    it('의류 아이템과 색상을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/블라우스/)).toBeInTheDocument();
      // 아이보리가 베스트 컬러와 의류 추천 모두에 나타남
      expect(screen.getAllByText(/아이보리/).length).toBeGreaterThan(0);
    });

    it('추천 이유를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('얼굴이 환하게 보여요')).toBeInTheDocument();
    });
  });

  describe('다시 분석하기', () => {
    it('다시 분석하기 버튼을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByRole('button', { name: /다시 분석하기/ })).toBeInTheDocument();
    });

    it('버튼 클릭 시 onRetry를 호출한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const button = screen.getByRole('button', { name: /다시 분석하기/ });
      fireEvent.click(button);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('다른 시즌 타입', () => {
    it('여름 쿨톤을 표시한다', () => {
      const summerResult: PersonalColorResult = {
        ...mockResult,
        seasonType: 'summer',
        seasonLabel: '여름 쿨톤',
        seasonDescription: '부드럽고 차분한 색상이 어울려요',
      };

      render(<AnalysisResult result={summerResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
    });

    it('가을 웜톤을 표시한다', () => {
      const autumnResult: PersonalColorResult = {
        ...mockResult,
        seasonType: 'autumn',
        seasonLabel: '가을 웜톤',
        seasonDescription: '깊고 따뜻한 색상이 어울려요',
      };

      render(<AnalysisResult result={autumnResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('가을 웜톤')).toBeInTheDocument();
    });

    it('겨울 쿨톤을 표시한다', () => {
      const winterResult: PersonalColorResult = {
        ...mockResult,
        seasonType: 'winter',
        seasonLabel: '겨울 쿨톤',
        seasonDescription: '선명하고 차가운 색상이 어울려요',
      };

      render(<AnalysisResult result={winterResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('겨울 쿨톤')).toBeInTheDocument();
    });
  });
});
