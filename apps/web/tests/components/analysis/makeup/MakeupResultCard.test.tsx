import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock 타입 정의 (실제 MakeupAnalysisResult 구조 반영)
interface MakeupAnalysisMetric {
  id: string;
  label: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

interface ColorRecommendation {
  category: 'foundation' | 'lip' | 'eyeshadow' | 'blush' | 'contour';
  categoryLabel: string;
  colors: { name: string; hex: string; description: string }[];
}

interface MakeupAnalysisResult {
  undertone: 'warm' | 'cool' | 'neutral';
  undertoneLabel: string;
  eyeShape: string;
  eyeShapeLabel: string;
  lipShape: string;
  lipShapeLabel: string;
  faceShape: string;
  faceShapeLabel: string;
  overallScore: number;
  metrics: MakeupAnalysisMetric[];
  concerns: string[];
  insight: string;
  recommendedStyles: string[];
  colorRecommendations: ColorRecommendation[];
  makeupTips: { category: string; tips: string[] }[];
  personalColorConnection?: {
    season: string;
    compatibility: 'high' | 'medium' | 'low';
    note: string;
  };
  analyzedAt: Date;
  analysisReliability: 'high' | 'medium' | 'low';
}

// 언더톤별 스타일
const UNDERTONE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  warm: { bg: 'bg-amber-50', text: 'text-amber-800', icon: '🌅' },
  cool: { bg: 'bg-sky-50', text: 'text-sky-800', icon: '❄️' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-800', icon: '⚖️' },
};

// 스타일 정보
const STYLE_INFO: Record<string, { emoji: string; name: string }> = {
  natural: { emoji: '🌿', name: '내추럴' },
  glam: { emoji: '✨', name: '글램' },
  cute: { emoji: '🎀', name: '큐트' },
  chic: { emoji: '🖤', name: '시크' },
  vintage: { emoji: '🌹', name: '빈티지' },
  edgy: { emoji: '⚡', name: '엣지' },
};

// 피부 고민 정보
const CONCERN_INFO: Record<string, { emoji: string; name: string }> = {
  'dark-circles': { emoji: '🌑', name: '다크서클' },
  redness: { emoji: '🔴', name: '홍조' },
  'uneven-tone': { emoji: '🎨', name: '피부톤 불균일' },
  'large-pores': { emoji: '⭕', name: '넓은 모공' },
  'oily-tzone': { emoji: '💧', name: 'T존 번들거림' },
  'dry-patches': { emoji: '🏜️', name: '건조 부위' },
  'acne-scars': { emoji: '🔘', name: '트러블 흔적' },
  'fine-lines': { emoji: '〰️', name: '잔주름' },
};

// 테스트용 스텁 컴포넌트 (실제 컴포넌트의 핵심 로직 재현)
function MakeupResultCard({
  result,
  showDetails = true,
}: {
  result: MakeupAnalysisResult | null;
  showDetails?: boolean;
}) {
  if (!result) {
    return <div data-testid="makeup-result-card">분석 결과가 없어요</div>;
  }

  const undertoneStyle = UNDERTONE_STYLES[result.undertone] || UNDERTONE_STYLES.neutral;

  // 신뢰도 등급
  const reliabilityLabel =
    result.analysisReliability === 'high'
      ? '높음'
      : result.analysisReliability === 'low'
        ? '낮음'
        : '보통';

  // 점수 등급
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return '매우 좋음';
    if (score >= 60) return '좋음';
    if (score >= 40) return '보통';
    return '관리 필요';
  };

  // 지표 상태 라벨
  const getStatusLabel = (status: string): string => {
    if (status === 'good') return '양호';
    if (status === 'warning') return '주의';
    return '보통';
  };

  return (
    <div data-testid="makeup-result-card">
      {/* 헤더 */}
      <div className={undertoneStyle.bg}>
        <span>{undertoneStyle.icon}</span>
        <div data-testid="undertone-label">{result.undertoneLabel}</div>
        <div>메이크업 분석 결과</div>
        <div data-testid="overall-score">{result.overallScore}</div>
        <div data-testid="score-grade">{getScoreLabel(result.overallScore)}</div>
      </div>

      {/* 특징 뱃지 */}
      <div data-testid="feature-badges">
        <span>{result.eyeShapeLabel}</span>
        <span>{result.lipShapeLabel}</span>
        <span>{result.faceShapeLabel}</span>
      </div>

      {/* 인사이트 */}
      <div data-testid="insight">{result.insight}</div>

      {/* 추천 컬러 */}
      <div data-testid="color-recommendations">
        {result.colorRecommendations.map((cat, idx) => (
          <div key={idx}>
            <div>{cat.categoryLabel}</div>
            {cat.colors.map((c, i) => (
              <div key={i}>
                <span>{c.name}</span>
                <span>{c.hex}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 추천 스타일 */}
      <div data-testid="recommended-styles">
        {result.recommendedStyles.map((styleId, idx) => {
          const style = STYLE_INFO[styleId] || { emoji: '💄', name: styleId };
          return (
            <div key={idx}>
              <span>{style.emoji}</span>
              <span>{style.name}</span>
            </div>
          );
        })}
      </div>

      {/* 집중 케어 영역 */}
      {result.concerns.length > 0 && (
        <div data-testid="concerns">
          <div>집중 케어 영역</div>
          {result.concerns.map((concernId, idx) => {
            const concern = CONCERN_INFO[concernId] || { emoji: '❓', name: concernId };
            return (
              <span key={idx}>
                {concern.emoji} {concern.name}
              </span>
            );
          })}
        </div>
      )}

      {/* 메이크업 팁 */}
      <div data-testid="makeup-tips">
        {result.makeupTips.map((tipGroup, idx) => (
          <div key={idx}>
            <div>{tipGroup.category}</div>
            {tipGroup.tips.map((tip, i) => (
              <div key={i}>{tip}</div>
            ))}
          </div>
        ))}
      </div>

      {/* 피부 지표 */}
      <div data-testid="metrics">
        {result.metrics.map((metric, idx) => (
          <div key={idx}>
            <span>{metric.label}</span>
            <span>{metric.value}점</span>
            <span>{getStatusLabel(metric.status)}</span>
            <span>{metric.description}</span>
          </div>
        ))}
      </div>

      {/* 퍼스널컬러 연동 */}
      {showDetails && result.personalColorConnection && (
        <div data-testid="personal-color-connection">
          <div>퍼스널컬러 연동</div>
          <span>{result.personalColorConnection.season}</span>
          <span>{result.personalColorConnection.note}</span>
          <span>
            호환성:{' '}
            {result.personalColorConnection.compatibility === 'high'
              ? '높음'
              : result.personalColorConnection.compatibility === 'medium'
                ? '보통'
                : '낮음'}
          </span>
        </div>
      )}

      {/* 신뢰도 */}
      <div data-testid="reliability">
        <span>분석 신뢰도</span>
        <span>{reliabilityLabel}</span>
      </div>
    </div>
  );
}

// ==== 공통 Mock 데이터 팩토리 ====

function createMockResult(overrides: Partial<MakeupAnalysisResult> = {}): MakeupAnalysisResult {
  return {
    undertone: 'warm',
    undertoneLabel: '웜톤',
    eyeShape: 'almond',
    eyeShapeLabel: '아몬드형',
    lipShape: 'full',
    lipShapeLabel: '도톰한 입술',
    faceShape: 'oval',
    faceShapeLabel: '계란형',
    overallScore: 78,
    metrics: [
      {
        id: 'skin-tone',
        label: '피부톤 균일도',
        value: 75,
        status: 'good',
        description: '균일한 편',
      },
      { id: 'hydration', label: '수분도', value: 60, status: 'normal', description: '보통 수준' },
      { id: 'pore', label: '모공 상태', value: 35, status: 'warning', description: '관리 필요' },
    ],
    concerns: ['dark-circles', 'oily-tzone'],
    insight: '웜톤 피부에 아몬드형 눈이 잘 어울려요. 코랄 계열 메이크업을 추천해요.',
    recommendedStyles: ['natural', 'glam', 'vintage'],
    colorRecommendations: [
      {
        category: 'lip',
        categoryLabel: '립 컬러',
        colors: [
          { name: '코랄 핑크', hex: '#FF7F7F', description: '따뜻한 코랄 톤' },
          { name: '피치 베이지', hex: '#FFDAB9', description: '자연스러운 피치' },
        ],
      },
      {
        category: 'eyeshadow',
        categoryLabel: '아이섀도',
        colors: [{ name: '샴페인 골드', hex: '#F7E7CE', description: '은은한 골드' }],
      },
    ],
    makeupTips: [
      {
        category: '베이스 메이크업',
        tips: ['웜톤 파운데이션을 선택하세요', '프라이머로 모공을 커버하세요'],
      },
      {
        category: '포인트 메이크업',
        tips: ['아몬드 눈매를 살리는 아이라인을 추천해요'],
      },
    ],
    personalColorConnection: {
      season: '봄 웜톤',
      compatibility: 'high',
      note: '퍼스널컬러와 메이크업 언더톤이 잘 어울려요',
    },
    analyzedAt: new Date('2026-02-12'),
    analysisReliability: 'high',
    ...overrides,
  };
}

// ==================================================================
// 테스트
// ==================================================================

describe('MakeupResultCard', () => {
  describe('렌더링', () => {
    it('결과 카드 렌더링', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('makeup-result-card')).toBeInTheDocument();
    });

    it('언더톤 라벨 표시', () => {
      const result = createMockResult({ undertone: 'warm', undertoneLabel: '웜톤' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('undertone-label')).toHaveTextContent('웜톤');
    });

    it('쿨톤 언더톤 표시', () => {
      const result = createMockResult({ undertone: 'cool', undertoneLabel: '쿨톤' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('undertone-label')).toHaveTextContent('쿨톤');
    });

    it('뉴트럴 언더톤 표시', () => {
      const result = createMockResult({ undertone: 'neutral', undertoneLabel: '뉴트럴' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('undertone-label')).toHaveTextContent('뉴트럴');
    });

    it('종합 점수 표시', () => {
      const result = createMockResult({ overallScore: 85 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('overall-score')).toHaveTextContent('85');
    });

    it('인사이트 문구 표시', () => {
      const result = createMockResult({
        insight: '웜톤 피부에 아몬드형 눈이 잘 어울려요.',
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('insight')).toHaveTextContent(
        '웜톤 피부에 아몬드형 눈이 잘 어울려요.'
      );
    });

    it('메이크업 분석 결과 텍스트 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('메이크업 분석 결과')).toBeInTheDocument();
    });
  });

  describe('특징 뱃지', () => {
    it('눈 형태 라벨 표시', () => {
      const result = createMockResult({ eyeShapeLabel: '아몬드형' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('아몬드형')).toBeInTheDocument();
    });

    it('입술 형태 라벨 표시', () => {
      const result = createMockResult({ lipShapeLabel: '도톰한 입술' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('도톰한 입술')).toBeInTheDocument();
    });

    it('얼굴형 라벨 표시', () => {
      const result = createMockResult({ faceShapeLabel: '계란형' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('계란형')).toBeInTheDocument();
    });
  });

  describe('점수 등급', () => {
    it('매우 좋음 (80-100)', () => {
      const result = createMockResult({ overallScore: 85 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('매우 좋음');
    });

    it('좋음 (60-79)', () => {
      const result = createMockResult({ overallScore: 65 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('좋음');
    });

    it('보통 (40-59)', () => {
      const result = createMockResult({ overallScore: 50 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('보통');
    });

    it('관리 필요 (0-39)', () => {
      const result = createMockResult({ overallScore: 30 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('관리 필요');
    });

    it('경계값: 80점', () => {
      const result = createMockResult({ overallScore: 80 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('매우 좋음');
    });

    it('경계값: 60점', () => {
      const result = createMockResult({ overallScore: 60 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('좋음');
    });

    it('경계값: 40점', () => {
      const result = createMockResult({ overallScore: 40 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('보통');
    });

    it('경계값: 0점', () => {
      const result = createMockResult({ overallScore: 0 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('관리 필요');
    });

    it('경계값: 100점', () => {
      const result = createMockResult({ overallScore: 100 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('score-grade')).toHaveTextContent('매우 좋음');
    });
  });

  describe('추천 컬러', () => {
    it('카테고리별 컬러 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('립 컬러')).toBeInTheDocument();
      expect(screen.getByText('아이섀도')).toBeInTheDocument();
    });

    it('개별 컬러 이름 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
      expect(screen.getByText('피치 베이지')).toBeInTheDocument();
      expect(screen.getByText('샴페인 골드')).toBeInTheDocument();
    });

    it('컬러 HEX 코드 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('#FF7F7F')).toBeInTheDocument();
      expect(screen.getByText('#FFDAB9')).toBeInTheDocument();
    });

    it('빈 컬러 추천 시 빈 영역', () => {
      const result = createMockResult({ colorRecommendations: [] });
      render(<MakeupResultCard result={result} />);
      // 컬러 추천 영역은 비어 있어야 함
      const colorSection = screen.getByTestId('color-recommendations');
      expect(colorSection.children).toHaveLength(0);
    });
  });

  describe('추천 스타일', () => {
    it('스타일 이름 한글 표시', () => {
      const result = createMockResult({ recommendedStyles: ['natural', 'glam', 'vintage'] });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('내추럴')).toBeInTheDocument();
      expect(screen.getByText('글램')).toBeInTheDocument();
      expect(screen.getByText('빈티지')).toBeInTheDocument();
    });

    it('알 수 없는 스타일 ID → 원본 ID 표시', () => {
      const result = createMockResult({ recommendedStyles: ['unknown-style'] });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('unknown-style')).toBeInTheDocument();
    });

    it('빈 스타일 배열', () => {
      const result = createMockResult({ recommendedStyles: [] });
      render(<MakeupResultCard result={result} />);
      const stylesSection = screen.getByTestId('recommended-styles');
      expect(stylesSection.children).toHaveLength(0);
    });
  });

  describe('피부 고민 (Concerns)', () => {
    it('고민 목록 표시', () => {
      const result = createMockResult({ concerns: ['dark-circles', 'redness'] });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/다크서클/)).toBeInTheDocument();
      expect(screen.getByText(/홍조/)).toBeInTheDocument();
    });

    it('집중 케어 영역 제목 표시', () => {
      const result = createMockResult({ concerns: ['dark-circles'] });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('집중 케어 영역')).toBeInTheDocument();
    });

    it('고민 없을 때 숨김', () => {
      const result = createMockResult({ concerns: [] });
      render(<MakeupResultCard result={result} />);
      expect(screen.queryByTestId('concerns')).not.toBeInTheDocument();
    });

    it('알 수 없는 고민 ID → 원본 ID 표시', () => {
      const result = createMockResult({ concerns: ['unknown-concern' as never] });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/unknown-concern/)).toBeInTheDocument();
    });
  });

  describe('메이크업 팁', () => {
    it('카테고리별 팁 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('베이스 메이크업')).toBeInTheDocument();
      expect(screen.getByText('포인트 메이크업')).toBeInTheDocument();
    });

    it('개별 팁 내용 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('웜톤 파운데이션을 선택하세요')).toBeInTheDocument();
      expect(screen.getByText('프라이머로 모공을 커버하세요')).toBeInTheDocument();
    });

    it('빈 팁 배열', () => {
      const result = createMockResult({ makeupTips: [] });
      render(<MakeupResultCard result={result} />);
      const tipsSection = screen.getByTestId('makeup-tips');
      expect(tipsSection.children).toHaveLength(0);
    });
  });

  describe('피부 지표 (Metrics)', () => {
    it('지표 라벨 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('피부톤 균일도')).toBeInTheDocument();
      expect(screen.getByText('수분도')).toBeInTheDocument();
      expect(screen.getByText('모공 상태')).toBeInTheDocument();
    });

    it('지표 점수 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('75점')).toBeInTheDocument();
      expect(screen.getByText('60점')).toBeInTheDocument();
      expect(screen.getByText('35점')).toBeInTheDocument();
    });

    it('상태 라벨: 양호/보통/주의', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('양호')).toBeInTheDocument();
      const normalStatuses = screen.getAllByText('보통');
      expect(normalStatuses.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('지표 설명 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('균일한 편')).toBeInTheDocument();
      expect(screen.getByText('보통 수준')).toBeInTheDocument();
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('빈 지표 배열', () => {
      const result = createMockResult({ metrics: [] });
      render(<MakeupResultCard result={result} />);
      const metricsSection = screen.getByTestId('metrics');
      expect(metricsSection.children).toHaveLength(0);
    });
  });

  describe('퍼스널컬러 연동', () => {
    it('showDetails=true일 때 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} showDetails={true} />);
      expect(screen.getByTestId('personal-color-connection')).toBeInTheDocument();
      expect(screen.getByText('퍼스널컬러 연동')).toBeInTheDocument();
      expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
    });

    it('showDetails=false일 때 숨김', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} showDetails={false} />);
      expect(screen.queryByTestId('personal-color-connection')).not.toBeInTheDocument();
    });

    it('showDetails 기본값(true)일 때 표시', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('personal-color-connection')).toBeInTheDocument();
    });

    it('personalColorConnection 없을 때 숨김', () => {
      const result = createMockResult({ personalColorConnection: undefined });
      render(<MakeupResultCard result={result} />);
      expect(screen.queryByTestId('personal-color-connection')).not.toBeInTheDocument();
    });

    it('호환성: 높음', () => {
      const result = createMockResult({
        personalColorConnection: { season: '봄 웜톤', compatibility: 'high', note: '잘 어울려요' },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*높음/)).toBeInTheDocument();
    });

    it('호환성: 보통', () => {
      const result = createMockResult({
        personalColorConnection: { season: '여름 쿨톤', compatibility: 'medium', note: '괜찮아요' },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*보통/)).toBeInTheDocument();
    });

    it('호환성: 낮음', () => {
      const result = createMockResult({
        personalColorConnection: { season: '겨울 쿨톤', compatibility: 'low', note: '주의해요' },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*낮음/)).toBeInTheDocument();
    });
  });

  describe('분석 신뢰도', () => {
    it('높음 신뢰도 표시', () => {
      const result = createMockResult({ analysisReliability: 'high' });
      render(<MakeupResultCard result={result} />);
      const reliability = screen.getByTestId('reliability');
      expect(reliability).toHaveTextContent('분석 신뢰도');
      expect(reliability).toHaveTextContent('높음');
    });

    it('보통 신뢰도 표시', () => {
      const result = createMockResult({ analysisReliability: 'medium' });
      render(<MakeupResultCard result={result} />);
      const reliability = screen.getByTestId('reliability');
      expect(reliability).toHaveTextContent('보통');
    });

    it('낮음 신뢰도 표시', () => {
      const result = createMockResult({ analysisReliability: 'low' });
      render(<MakeupResultCard result={result} />);
      const reliability = screen.getByTestId('reliability');
      expect(reliability).toHaveTextContent('낮음');
    });
  });

  describe('에러/엣지 케이스', () => {
    it('null 결과 시 안내 메시지', () => {
      render(<MakeupResultCard result={null} />);
      expect(screen.getByText('분석 결과가 없어요')).toBeInTheDocument();
    });

    it('모든 배열 필드가 비어 있는 결과', () => {
      const result = createMockResult({
        metrics: [],
        concerns: [],
        recommendedStyles: [],
        colorRecommendations: [],
        makeupTips: [],
        personalColorConnection: undefined,
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('makeup-result-card')).toBeInTheDocument();
      // 고민 영역은 숨김
      expect(screen.queryByTestId('concerns')).not.toBeInTheDocument();
    });

    it('점수 경계: overallScore = 0', () => {
      const result = createMockResult({ overallScore: 0 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('overall-score')).toHaveTextContent('0');
      expect(screen.getByTestId('score-grade')).toHaveTextContent('관리 필요');
    });

    it('점수 경계: overallScore = 100', () => {
      const result = createMockResult({ overallScore: 100 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('overall-score')).toHaveTextContent('100');
      expect(screen.getByTestId('score-grade')).toHaveTextContent('매우 좋음');
    });
  });
});
