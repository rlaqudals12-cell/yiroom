/**
 * AnalysisResult 컴포넌트 테스트
 * @description PC-1 퍼스널 컬러 분석 결과 컴포넌트 테스트
 * @version 2.0
 * @date 2026-03-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AnalysisResult, {
  getAvoidStrokeColor,
  buildNamedHexMap,
  resolveNamedHex,
} from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
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

  describe('퍼스널 컬러 타입 표시 (진단지 히어로)', () => {
    it('시즌 타입 레이블을 표시한다 (히어로 진단명 + 속성표 계절 행)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 진단지 문법: 히어로 세리프 진단명과 01 진단 속성표의 계절 행이 함께 존재
      expect(screen.getAllByText('봄 웜톤').length).toBeGreaterThanOrEqual(1);
    });

    it('시즌 설명을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('밝고 따뜻한 느낌의 색상이 잘 어울려요')).toBeInTheDocument();
    });

    it('신뢰도를 푸터 신뢰 블록에 텍스트 라인으로 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('분석 신뢰도 85%')).toBeInTheDocument();
    });

    it('진단지 아이브로우를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('PERSONAL COLOR REPORT')).toBeInTheDocument();
    });

    it('계절 인장 스탬프를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const seal = screen.getByTestId('pc-season-seal');
      expect(seal).toBeInTheDocument();
      expect(seal).toHaveTextContent('Spring');
    });

    it('히어로 풀블리드 팔레트 스트립을 렌더한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByTestId('pc-hero-strip')).toBeInTheDocument();
    });

    it('진단 속성표를 렌더한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByTestId('pc-report-attrs')).toBeInTheDocument();
      expect(screen.getByText('계절')).toBeInTheDocument();
      expect(screen.getByText('언더톤')).toBeInTheDocument();
    });

    it('퍼스널 대비 실측값이 있으면 속성표 행 + 풀이 한 줄을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} contrastLevel="low" />);

      expect(screen.getByText('대비')).toBeInTheDocument();
      expect(screen.getByText('낮은 대비')).toBeInTheDocument();
      expect(screen.getByTestId('pc-contrast-note')).toBeInTheDocument();
    });

    it('퍼스널 대비 실측값이 없으면 대비 행을 렌더하지 않는다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.queryByText('대비')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pc-contrast-note')).not.toBeInTheDocument();
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

    it('베스트 컬러는 제공된 색이름을 우선 표시한다 (없을 때만 hex 근사 명명)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 저장/큐레이션 이름이 있으면 그대로(정직) — 픽스처 name '피치'가 hex 근사명 대신 노출
      expect(screen.getAllByText('코랄').length).toBeGreaterThan(0);
      expect(screen.getAllByText('피치').length).toBeGreaterThan(0);
    });

    it('피하면 좋은 색을 취소선 칩으로 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 구 "컬러 비교" 아코디언은 03 컬러 팔레트의 회피 칩 그룹으로 흡수됨 (접힘 없이 노출)
      expect(screen.getByText('피하면 좋은 색')).toBeInTheDocument();
      expect(screen.getByTestId('pc-avoid-chips')).toBeInTheDocument();
    });

    it('워스트 컬러도 제공된 색이름을 우선 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 픽스처 worstColors의 저장 이름이 회피 칩 캡션으로 직접 노출
      expect(screen.getByTestId('pc-avoid-chips')).toHaveTextContent('블랙');
    });

    it('피하는 이유 한 줄(avoidNote)을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByTestId('pc-avoid-note')).toBeInTheDocument();
    });

    it('포인트 컬러·액세서리 금속 큐레이션을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // getCardPalette 톤 표준 큐레이션 (공유카드와 동일 소스)
      expect(screen.getByText('포인트 컬러')).toBeInTheDocument();
      expect(screen.getByText('액세서리 금속')).toBeInTheDocument();
      expect(screen.getByTestId('pc-accent-chips')).toBeInTheDocument();
      expect(screen.getByTestId('pc-metal-chips')).toBeInTheDocument();
    });
  });

  describe('컨설턴트 TIP (구 스타일 인사이트)', () => {
    it('컨설턴트 TIP 밴드를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText('컨설턴트 TIP')).toBeInTheDocument();
      expect(screen.getByTestId('pc-insight-note')).toBeInTheDocument();
    });

    it('insight 텍스트를 표시한다 (easyInsight가 없을 때)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // easyInsight가 없으므로 insight 필드의 텍스트가 표시됨
      expect(screen.getByText(/밝고 따뜻한 색상이 잘 어울리는/)).toBeInTheDocument();
    });
  });

  describe('스타일 가이드', () => {
    it('스타일 키워드 카드를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 구 아코디언 → 04 스타일 가이드의 2열 미니카드로 흡수 (접힘 없이 노출)
      expect(screen.getByText('스타일 키워드')).toBeInTheDocument();
    });

    it('스타일 키워드를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // female 성별이므로 getGenderAdaptiveTerm이 원래 값을 그대로 반환
      expect(screen.getByText('화사한')).toBeInTheDocument();
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

    it('추천 이유를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 05 추천 스타일링은 번호 섹션 — 접힘 없이 이유까지 노출
      expect(screen.getByText('얼굴이 환하게 보여요')).toBeInTheDocument();
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

      expect(screen.getAllByText('여름 쿨톤').length).toBeGreaterThanOrEqual(1);
    });

    it('가을 웜톤을 표시한다', () => {
      const autumnResult: PersonalColorResult = {
        ...mockResult,
        seasonType: 'autumn',
        seasonLabel: '가을 웜톤',
        seasonDescription: '깊고 따뜻한 색상이 어울려요',
      };

      render(<AnalysisResult result={autumnResult} onRetry={mockOnRetry} />);

      expect(screen.getAllByText('가을 웜톤').length).toBeGreaterThanOrEqual(1);
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

      expect(screen.getAllByText('겨울 쿨톤').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('사진 앵커 (A1)', () => {
    it('photoUrl이 있으면 히어로에 원본 사진을 렌더한다', () => {
      render(
        <AnalysisResult
          result={mockResult}
          onRetry={mockOnRetry}
          photoUrl="https://example.com/face.jpg"
        />
      );

      const photo = screen.getByTestId('pc-hero-photo');
      expect(photo).toBeInTheDocument();
      expect(photo).toHaveAttribute('alt', '분석에 사용한 내 사진');
      expect(photo).toHaveAttribute('src', 'https://example.com/face.jpg');
    });

    it('photoUrl이 없으면 사진 없이 현 레이아웃을 유지한다 (데모·구 데이터 폴백)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.queryByTestId('pc-hero-photo')).not.toBeInTheDocument();
      expect(screen.getByTestId('pc-hero-title')).toBeInTheDocument();
    });

    it('사진 로드 실패 시 무사진 히어로로 폴백한다', () => {
      render(
        <AnalysisResult
          result={mockResult}
          onRetry={mockOnRetry}
          photoUrl="https://example.com/broken.jpg"
        />
      );

      fireEvent.error(screen.getByTestId('pc-hero-photo'));
      expect(screen.queryByTestId('pc-hero-photo')).not.toBeInTheDocument();
      // 폴백 후에도 진단명은 유지
      expect(screen.getByTestId('pc-hero-title')).toBeInTheDocument();
    });
  });

  describe('회피색 취소선 명도 적응 (A5)', () => {
    it('어두운 칩은 흰색 스트로크를 쓴다', () => {
      // 블랙·네이비·와인 — 검정 취소선이 식별 불가한 저명도 색들
      expect(getAvoidStrokeColor('#000000')).toBe('rgba(255,255,255,0.6)');
      expect(getAvoidStrokeColor('#000080')).toBe('rgba(255,255,255,0.6)');
      expect(getAvoidStrokeColor('#722F37')).toBe('rgba(255,255,255,0.6)');
    });

    it('밝은 칩은 검정 스트로크를 유지한다', () => {
      expect(getAvoidStrokeColor('#FFFFF0')).toBe('rgba(0,0,0,0.45)');
      expect(getAvoidStrokeColor('#FFDAB9')).toBe('rgba(0,0,0,0.45)');
    });

    it('회피 칩 DOM에 명도 적응 스트로크가 배선된다 (어두운 픽스처 → 흰색)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 픽스처 worstColors 첫 칩 = #000000 → 흰 스트로크가 gradient 문자열에 포함
      const chips = screen.getByTestId('pc-avoid-chips');
      const firstChip = chips.querySelector<HTMLElement>('[aria-hidden="true"]');
      expect(firstChip).not.toBeNull();
      expect(firstChip?.style.backgroundImage).toContain('rgba(255,255,255,0.6)');
    });
  });

  describe('12톤 속성표 확장 (A3)', () => {
    it('paletteToneKey가 12톤 키면 명도·채도 정의 행을 렌더한다', () => {
      render(
        <AnalysisResult
          result={{ ...mockResult, paletteToneKey: 'true-spring' }}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('명도')).toBeInTheDocument();
      expect(screen.getByText('채도')).toBeInTheDocument();
      // 트루 = 중간 명도·중간 채도 (12톤 정의 서술)
      expect(screen.getByText('중간 명도')).toBeInTheDocument();
      expect(screen.getByText('중간 채도')).toBeInTheDocument();
    });

    it('서브타입 미저장(시즌 키) 건은 명도·채도 행을 렌더하지 않는다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.queryByText('명도')).not.toBeInTheDocument();
      expect(screen.queryByText('채도')).not.toBeInTheDocument();
    });

    it('특성 문단을 결론 라벨 블록으로 승격한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const conclusion = screen.getByTestId('pc-attrs-conclusion');
      expect(within(conclusion).getByText('결론')).toBeInTheDocument();
    });
  });

  describe('시즌 인장 보강 (A4)', () => {
    it('인장에 영문 시즌 + 한국어 타입명을 병기한다 (점수 없음)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const seal = screen.getByTestId('pc-season-seal');
      expect(within(seal).getByText('Spring')).toBeInTheDocument();
      expect(within(seal).getByText('봄 웜톤')).toBeInTheDocument();
      // 점수·퍼센트 문자열이 인장 안에 없어야 한다
      expect(seal.textContent).not.toMatch(/\d+%|점/);
    });
  });

  describe('톤 팔레트 총람 (A7)', () => {
    it('paletteToneKey가 12톤 키면 총람 소섹션을 렌더한다', () => {
      render(
        <AnalysisResult
          result={{ ...mockResult, paletteToneKey: 'true-spring' }}
          onRetry={mockOnRetry}
        />
      );

      const overview = screen.getByTestId('pc-tone-palette-overview');
      expect(overview).toBeInTheDocument();
      // 사용처 행 라벨 3종 (립·아이섀도·블러셔) — v2 정적 정의 데이터
      expect(within(overview).getByText('립')).toBeInTheDocument();
      expect(within(overview).getByText('아이섀도')).toBeInTheDocument();
      expect(within(overview).getByText('블러셔')).toBeInTheDocument();
    });

    it('paletteToneKey가 없거나 시즌 키면 총람을 렌더하지 않는다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.queryByTestId('pc-tone-palette-overview')).not.toBeInTheDocument();
    });
  });

  describe('색명에 색 동행 (R1)', () => {
    it('buildNamedHexMap은 이름 있는 색만 등록하고 같은 이름은 먼저 온 소스가 이긴다', () => {
      const map = buildNamedHexMap([
        [{ name: '코랄', hex: '#FF7F50' }],
        [{ name: '코랄', hex: '#000000' }, { hex: '#123456' }],
      ]);

      expect(map.get('코랄')).toBe('#FF7F50');
      expect(map.size).toBe(1);
    });

    it('resolveNamedHex는 정확 일치를 우선하고, 없으면 포함된 가장 긴 등록 색명으로 폴백한다', () => {
      const map = buildNamedHexMap([
        [
          { name: '피치', hex: '#FFDAB9' },
          { name: '피치 베이지', hex: '#EED9C4' },
        ],
      ]);

      // 정확 일치 (공백 무시)
      expect(resolveNamedHex(map, '피치 베이지')).toBe('#EED9C4');
      // 부분 폴백 — '피치 핑크'는 등록된 '피치'를 포함
      expect(resolveNamedHex(map, '피치 핑크')).toBe('#FFDAB9');
      // 매핑 없는 색명은 undefined — 스와치 없이 텍스트만(지어내기 금지)
      expect(resolveNamedHex(map, '무지개색')).toBeUndefined();
    });

    it('스타일링 색 제안에 결과 데이터의 실색 스와치를 전치한다 (아이보리=베스트 컬러)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 픽스처: 블라우스—아이보리, 아이보리는 bestColors에 #FFFFF0으로 존재
      const list = screen.getByTestId('pc-clothing-list');
      const dots = list.querySelectorAll<HTMLElement>('[aria-hidden="true"]');
      expect(dots.length).toBeGreaterThan(0);
      const hexes = Array.from(dots).map((d) => d.style.backgroundColor);
      expect(hexes).toContain('rgb(255, 255, 240)');
    });

    it('패션 색명 칩은 매핑되는 색만 스와치를 갖고, 매핑 없는 색명은 텍스트만 유지한다', () => {
      const withFashion: PersonalColorResult = {
        ...mockResult,
        styleDescription: {
          ...mockResult.styleDescription,
          easyFashion: {
            colors: ['코랄', '무지개색'],
            avoid: ['블랙'],
            style: '밝고 부드러운 느낌',
            tip: '밝은 색 위주로 입어보세요',
          },
        },
      };
      render(<AnalysisResult result={withFashion} onRetry={mockOnRetry} />);

      const chips = screen.getByTestId('pc-fashion-color-chips');
      // '코랄'은 bestColors #FF7F50 매핑 → 스와치 존재
      const coralChip = within(chips).getByText('코랄');
      expect(coralChip.querySelector('[aria-hidden="true"]')).not.toBeNull();
      // '무지개색'은 결과 데이터에 없음 → 스와치 없음
      const unknownChip = within(chips).getByText('무지개색');
      expect(unknownChip.querySelector('[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('시즌 인장 오브젝트 승격 (R2)', () => {
    it('인장은 라이트 시즌색 채움 + 다크 전경 텍스트를 쓴다 (백색 텍스트 금지)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const seal = screen.getByTestId('pc-season-seal');
      // spring 도장 잉크 — 라이트 채움 #F9E4D4
      expect(seal.style.backgroundColor).toBe('rgb(249, 228, 212)');
      const label = within(seal).getByText('Spring');
      // 다크 전경 #8A4B2B — 백색 아님
      expect(label.style.color).toBe('rgb(138, 75, 43)');
    });

    it('베스트 컬러가 있으면 인장은 히어로가 아닌 스트립 오버랩 위치에 렌더된다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const seal = screen.getByTestId('pc-season-seal');
      const strip = screen.getByTestId('pc-hero-strip');
      // 같은 relative 래퍼 안에 스트립과 인장이 형제로 존재 (지면 위 도장)
      expect(seal.parentElement).toBe(strip.parentElement);
    });
  });

  describe('드레이핑 색면 스택 폴백 (R3)', () => {
    it('photoUrl이 없으면 같은 자리에 드레이핑 색면 스택을 렌더한다 (인물 배제 정본)', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      const draping = screen.getByTestId('pc-hero-draping');
      expect(draping).toBeInTheDocument();
      // 베스트 컬러 상위 5색의 색면
      expect(draping.querySelectorAll('span').length).toBe(5);
    });

    it('photoUrl이 있으면 드레이핑 스택 대신 사진 앵커를 렌더한다', () => {
      render(
        <AnalysisResult
          result={mockResult}
          onRetry={mockOnRetry}
          photoUrl="https://example.com/face.jpg"
        />
      );

      expect(screen.getByTestId('pc-hero-photo')).toBeInTheDocument();
      expect(screen.queryByTestId('pc-hero-draping')).not.toBeInTheDocument();
    });

    it('사진 로드 실패 시 드레이핑 스택으로 폴백한다', () => {
      render(
        <AnalysisResult
          result={mockResult}
          onRetry={mockOnRetry}
          photoUrl="https://example.com/broken.jpg"
        />
      );

      fireEvent.error(screen.getByTestId('pc-hero-photo'));
      expect(screen.queryByTestId('pc-hero-photo')).not.toBeInTheDocument();
      expect(screen.getByTestId('pc-hero-draping')).toBeInTheDocument();
    });
  });

  describe('톤 팔레트 총람 질감 스와치 (R4)', () => {
    it('총람 3행을 발색 질감으로 렌더한다 (립→lip, 아이섀도·블러셔→powder)', () => {
      render(
        <AnalysisResult
          result={{ ...mockResult, paletteToneKey: 'true-spring' }}
          onRetry={mockOnRetry}
        />
      );

      const overview = screen.getByTestId('pc-tone-palette-overview');
      // 립 행은 lip 질감 — 포인트 컬러(pc-accent-chips)의 lip과 별개로 총람 안에도 존재
      expect(within(overview).getAllByTestId('texture-swatch-lip').length).toBeGreaterThan(0);
      // 아이섀도·블러셔 행은 powder 질감
      expect(within(overview).getAllByTestId('texture-swatch-powder').length).toBeGreaterThan(0);
    });
  });

  describe('통계 및 메타 정보 (푸터 신뢰 블록)', () => {
    it('통계 정보를 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      // 구 "통계" 아코디언 → 푸터 신뢰 블록 텍스트 라인으로 통합
      expect(screen.getByText(/봄 웜톤이에요/)).toBeInTheDocument();
    });

    it('분석 시간을 표시한다', () => {
      render(<AnalysisResult result={mockResult} onRetry={mockOnRetry} />);

      expect(screen.getByText(/분석 시간:/)).toBeInTheDocument();
    });
  });
});
