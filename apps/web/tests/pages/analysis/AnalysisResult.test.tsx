/**
 * AnalysisResult 컴포넌트 테스트
 * @description PC-1 퍼스널 컬러 분석 결과 컴포넌트 테스트
 * @version 2.0
 * @date 2026-03-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisResult from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
import type { PersonalColorResult } from '@/lib/mock/personal-color';

// 접힘 섹션(ProgressiveDisclosure)을 제목 트리거 클릭으로 펼친다
// (Radix Collapsible은 닫힘 상태에서 content를 언마운트하므로, DOM 단언 전 펼침 필요)
function openSection(title: string): void {
  const trigger = screen.getByText(title).closest('button');
  if (trigger) fireEvent.click(trigger);
}

// lucide-react mock은 setup.ts에서 글로벌로 제공됨 (PartyPopper 포함)

// sonner mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// useUserProfile mock - 성별에 따른 키워드 변환 테스트용
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { gender: 'female', heightCm: null, weightKg: null, allergies: [] },
    isLoading: false,
    error: null,
    updateGender: vi.fn().mockResolvedValue(true),
    updateProfile: vi.fn().mockResolvedValue(true),
    refetch: vi.fn(),
  }),
}));

// PersonalColorEvidenceSummary mock — 외부 의존성 최소화
vi.mock('@/components/analysis/EvidenceSummary', () => ({
  PersonalColorEvidenceSummary: () => null,
}));

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
    // clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
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

    it('축하 메시지를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('나에게 어울리는 색을 찾았어요!')).toBeInTheDocument();
    });

    it('시즌별 celebration 메시지를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(
        screen.getByText('따뜻한 봄빛처럼 생기 넘치는 컬러가 어울리는 당신!')
      ).toBeInTheDocument();
    });
  });

  describe('결론 먼저 (TopActionsCard)', () => {
    it('"그래서, 이렇게 하세요" 결론 카드를 렌더한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByTestId('top-actions-card')).toBeInTheDocument();
      // ① 베스트 컬러 액션은 데이터가 있으면 항상 노출
      expect(screen.getByText('베스트 컬러 3가지부터 활용해보세요')).toBeInTheDocument();
    });

    it('여성 프로필에서 첫 립 추천을 결론 액션으로 노출한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // ② 립스틱 추천 첫 항목이 명령형 액션으로 조립됨
      expect(screen.getByText('코랄 핑크 립부터 발라보세요')).toBeInTheDocument();
    });
  });

  describe('베스트/워스트 컬러', () => {
    it('베스트 컬러 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 베스트 컬러 헤더
      const bestColorElements = screen.getAllByText('베스트 컬러');
      expect(bestColorElements.length).toBeGreaterThanOrEqual(1);
    });

    it('베스트 컬러를 getKoreanColorName으로 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 컴포넌트는 color.name이 아닌 getKoreanColorName(hex)로 표시
      // #FF7F50 → "코랄", #FFDAB9 → "라이트 코랄", #FFFFF0 → "라이트 옐로"
      expect(screen.getAllByText('코랄').length).toBeGreaterThan(0);
      expect(screen.getAllByText('라이트 코랄').length).toBeGreaterThan(0);
    });

    it('컬러 비교 섹션 제목을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // "컬러가 주는 인상 차이"는 details summary 안에 있음
      expect(screen.getByText('컬러가 주는 인상 차이')).toBeInTheDocument();
    });

    it('나머지 주의 컬러 섹션을 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // "컬러가 주는 인상 차이"는 접힘 — 펼쳐야 내부 콘텐츠가 DOM에 존재
      openSection('컬러가 주는 인상 차이');
      await waitFor(() => {
        expect(screen.getByText('나머지 주의 컬러 (참고용)')).toBeInTheDocument();
      });
    });

    it('워스트 컬러를 getKoreanColorName으로 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // #000000 → "차콜" (무채색, l<=0.3). 접힌 비교 섹션을 펼친 뒤 확인
      openSection('컬러가 주는 인상 차이');
      await waitFor(() => {
        expect(screen.getAllByText('차콜').length).toBeGreaterThan(0);
      });
    });
  });

  describe('스타일 인사이트', () => {
    it('스타일 인사이트 섹션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('스타일 인사이트')).toBeInTheDocument();
    });

    it('insight 텍스트를 표시한다 (easyInsight가 없을 때)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // easyInsight가 없으므로 insight 필드의 텍스트가 표시됨
      expect(screen.getByText(/밝고 따뜻한 색상이 잘 어울리는/)).toBeInTheDocument();
    });
  });

  describe('스타일 가이드', () => {
    it('스타일 키워드 섹션 제목을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // <details> summary 안에 존재
      expect(screen.getByText('나의 스타일 키워드')).toBeInTheDocument();
    });

    it('스타일 키워드를 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 키워드 섹션은 접힘 — 펼친 뒤 개별 키워드 확인
      // female 성별이므로 getGenderAdaptiveTerm이 원래 값을 그대로 반환
      openSection('나의 스타일 키워드');
      await waitFor(() => {
        expect(screen.getByText('화사한')).toBeInTheDocument();
      });
      expect(screen.getByText('생기있는')).toBeInTheDocument();
    });

    it('스타일 가이드 섹션 제목을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('스타일 가이드')).toBeInTheDocument();
    });

    it('메이크업 스타일을 표시한다 (여성 프로필)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 여성: makeupStyle fallback 텍스트 (easyMakeup이 없을 때)
      expect(screen.getByText(/코랄, 피치 계열의 따뜻한 컬러 메이크업/)).toBeInTheDocument();
    });
  });

  describe('립스틱 추천', () => {
    it('추천 립스틱 섹션 제목을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // <details> summary 안에 존재 (여성 프로필)
      expect(screen.getByText('추천 립스틱')).toBeInTheDocument();
    });

    it('립스틱 컬러명을 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 립스틱 추천 섹션은 접힘 — 펼친 뒤 전체 목록 확인
      openSection('추천 립스틱');
      await waitFor(() => {
        expect(screen.getByText('피치 누드')).toBeInTheDocument();
      });
      expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
    });

    it('브랜드 예시를 표시한다 (결론 카드)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 첫 립 추천 브랜드는 "그래서, 이렇게 하세요" 결론 카드에 노출됨
      expect(screen.getByText('MAC Coral Bliss')).toBeInTheDocument();
    });
  });

  describe('의류 추천', () => {
    it('추천 스타일링 섹션 제목을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // <details> summary 안에 존재
      expect(screen.getByText('추천 스타일링')).toBeInTheDocument();
    });

    it('의류 아이템과 색상을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/블라우스/)).toBeInTheDocument();
      expect(screen.getAllByText(/아이보리/).length).toBeGreaterThan(0);
    });

    it('추천 이유를 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 추천 스타일링 섹션은 접힘 — 펼친 뒤 이유 확인
      openSection('추천 스타일링');
      await waitFor(() => {
        expect(screen.getByText('얼굴이 환하게 보여요')).toBeInTheDocument();
      });
    });
  });

  describe('다른 시즌 타입', () => {
    it('여름 쿨톤을 표시한다', () => {
      const summerResult: PersonalColorResult = {
        ...mockResult,
        seasonType: 'summer',
        seasonLabel: '여름 쿨톤',
        seasonDescription: '부드럽고 차분한 색상이 어울려요',
        tone: 'cool',
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
        tone: 'cool',
      };

      render(<AnalysisResult result={winterResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('겨울 쿨톤')).toBeInTheDocument();
    });
  });

  describe('통계 및 메타 정보', () => {
    it('통계 정보를 표시한다 (펼침 후)', async () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 통계 섹션은 접힘 — 펼친 뒤 전체 문장 확인
      openSection('통계');
      await waitFor(() => {
        expect(screen.getByText(/봄 웜톤이에요/)).toBeInTheDocument();
      });
    });

    it('분석 시간을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/분석 시간:/)).toBeInTheDocument();
    });
  });
});
