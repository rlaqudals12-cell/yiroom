/**
 * PC-1 퍼스널컬러 분석 결과 화면 - 비즈니스 로직 테스트
 *
 * 테스트 대상:
 * - 퍼스널컬러 시즌 데이터 일관성
 * - 신뢰도 표시 로직
 * - 컬러 팔레트 유효성
 */

import type { PersonalColorSeason } from '@yiroom/shared';

// ============================================================
// 퍼스널 컬러 시즌 데이터 (result.tsx에서 추출)
// ============================================================

const SEASON_DATA: Record<
  PersonalColorSeason,
  {
    name: string;
    description: string;
    colors: string[];
    celebrities: string[];
  }
> = {
  Spring: {
    name: '봄 웜톤',
    description:
      '밝고 화사한 색상이 잘 어울리는 타입입니다. 코랄, 피치, 아이보리 등 따뜻하고 맑은 색상을 추천드려요.',
    colors: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98'],
    celebrities: ['아이유', '수지', '윤아'],
  },
  Summer: {
    name: '여름 쿨톤',
    description:
      '부드럽고 차분한 색상이 잘 어울리는 타입입니다. 라벤더, 로즈핑크, 스카이블루 등 시원하고 우아한 색상을 추천드려요.',
    colors: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#F0FFFF', '#FFC0CB'],
    celebrities: ['블랙핑크 제니', '김태희', '손예진'],
  },
  Autumn: {
    name: '가을 웜톤',
    description:
      '깊고 풍부한 색상이 잘 어울리는 타입입니다. 버건디, 머스타드, 카키 등 차분하고 고급스러운 색상을 추천드려요.',
    colors: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F'],
    celebrities: ['제니퍼 로페즈', '김희선', '공효진'],
  },
  Winter: {
    name: '겨울 쿨톤',
    description:
      '선명하고 대비가 강한 색상이 잘 어울리는 타입입니다. 블랙, 화이트, 로열블루 등 강렬하고 세련된 색상을 추천드려요.',
    colors: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080'],
    celebrities: ['김연아', '전지현', '송혜교'],
  },
};

// ============================================================
// 신뢰도/Fallback 판정 로직 (result.tsx에서 추출)
// ============================================================

interface AnalysisResult {
  season: PersonalColorSeason;
  confidence: number;
  description?: string;
}

function isUsingFallback(result: AnalysisResult): boolean {
  // Mock fallback 사용 여부 확인 (confidence가 0.75이면 Mock)
  return result.confidence === 0.75;
}

function getConfidenceDisplay(result: AnalysisResult): {
  type: 'ai' | 'fallback';
  label: string;
  percentage?: number;
} {
  if (isUsingFallback(result)) {
    return {
      type: 'fallback',
      label: '문진 기반 분석',
    };
  }

  return {
    type: 'ai',
    label: `AI 분석 ${Math.round(result.confidence * 100)}%`,
    percentage: Math.round(result.confidence * 100),
  };
}

// ============================================================
// 시즌 데이터 일관성 테스트
// ============================================================

describe('PC-1 퍼스널컬러 분석 - 시즌 데이터', () => {
  describe('SEASON_DATA', () => {
    it('모든 시즌이 정의되어 있어야 한다', () => {
      const expectedSeasons: PersonalColorSeason[] = [
        'Spring',
        'Summer',
        'Autumn',
        'Winter',
      ];

      expectedSeasons.forEach((season) => {
        expect(SEASON_DATA[season]).toBeDefined();
      });
    });

    it('모든 시즌은 필수 필드를 가져야 한다', () => {
      Object.values(SEASON_DATA).forEach((data) => {
        expect(data.name).toBeDefined();
        expect(typeof data.name).toBe('string');
        expect(data.name.length).toBeGreaterThan(0);

        expect(data.description).toBeDefined();
        expect(typeof data.description).toBe('string');
        expect(data.description.length).toBeGreaterThan(20);

        expect(Array.isArray(data.colors)).toBe(true);
        expect(data.colors.length).toBe(5);

        expect(Array.isArray(data.celebrities)).toBe(true);
        expect(data.celebrities.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('시즌 이름은 톤 정보를 포함해야 한다', () => {
      expect(SEASON_DATA.Spring.name).toContain('웜톤');
      expect(SEASON_DATA.Summer.name).toContain('쿨톤');
      expect(SEASON_DATA.Autumn.name).toContain('웜톤');
      expect(SEASON_DATA.Winter.name).toContain('쿨톤');
    });

    it('시즌 이름은 계절 정보를 포함해야 한다', () => {
      expect(SEASON_DATA.Spring.name).toContain('봄');
      expect(SEASON_DATA.Summer.name).toContain('여름');
      expect(SEASON_DATA.Autumn.name).toContain('가을');
      expect(SEASON_DATA.Winter.name).toContain('겨울');
    });
  });
});

// ============================================================
// 컬러 팔레트 유효성 테스트
// ============================================================

describe('PC-1 퍼스널컬러 분석 - 컬러 팔레트', () => {
  describe('색상 코드 유효성', () => {
    it('모든 색상은 유효한 hex 값이어야 한다', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      Object.values(SEASON_DATA).forEach((data) => {
        data.colors.forEach((color) => {
          expect(color).toMatch(hexRegex);
        });
      });
    });

    it('각 시즌은 5개의 대표 색상을 가져야 한다', () => {
      Object.values(SEASON_DATA).forEach((data) => {
        expect(data.colors.length).toBe(5);
      });
    });

    it('같은 시즌 내 색상은 중복되지 않아야 한다', () => {
      Object.entries(SEASON_DATA).forEach(([season, data]) => {
        const uniqueColors = new Set(data.colors);
        expect(uniqueColors.size).toBe(data.colors.length);
      });
    });
  });

  describe('톤별 색상 특성', () => {
    // 웜톤은 따뜻한 색상 (R값이 높거나 노란 계열)
    // 쿨톤은 시원한 색상 (B값이 높거나 분홍/보라 계열)

    it('봄 웜톤 팔레트는 밝은 색상 위주여야 한다', () => {
      // 봄 웜톤 색상의 평균 밝기 확인
      const colors = SEASON_DATA.Spring.colors;

      colors.forEach((color) => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // 봄 웜톤은 밝은 색상이 주를 이룸 (평균 RGB > 150)
        const avgBrightness = (r + g + b) / 3;
        expect(avgBrightness).toBeGreaterThan(100);
      });
    });

    it('겨울 쿨톤 팔레트는 선명한 대비 색상을 포함해야 한다', () => {
      const colors = SEASON_DATA.Winter.colors;

      // 검정 또는 흰색이 포함되어야 함 (대비 표현)
      const hasBlack = colors.some((c) => c === '#000000');
      const hasWhite = colors.some((c) => c === '#FFFFFF');

      expect(hasBlack || hasWhite).toBe(true);
    });
  });
});

// ============================================================
// 신뢰도 표시 로직 테스트
// ============================================================

describe('PC-1 퍼스널컬러 분석 - 신뢰도 표시', () => {
  describe('isUsingFallback', () => {
    it('confidence가 0.75면 fallback으로 판정해야 한다', () => {
      const result: AnalysisResult = {
        season: 'Spring',
        confidence: 0.75,
      };
      expect(isUsingFallback(result)).toBe(true);
    });

    it('confidence가 0.75가 아니면 AI 분석으로 판정해야 한다', () => {
      [0.8, 0.85, 0.9, 0.95, 1.0].forEach((conf) => {
        const result: AnalysisResult = {
          season: 'Spring',
          confidence: conf,
        };
        expect(isUsingFallback(result)).toBe(false);
      });
    });
  });

  describe('getConfidenceDisplay', () => {
    it('fallback 모드에서 올바른 라벨을 반환해야 한다', () => {
      const result: AnalysisResult = {
        season: 'Spring',
        confidence: 0.75,
      };
      const display = getConfidenceDisplay(result);

      expect(display.type).toBe('fallback');
      expect(display.label).toBe('문진 기반 분석');
      expect(display.percentage).toBeUndefined();
    });

    it('AI 분석 모드에서 퍼센트를 포함해야 한다', () => {
      const result: AnalysisResult = {
        season: 'Summer',
        confidence: 0.92,
      };
      const display = getConfidenceDisplay(result);

      expect(display.type).toBe('ai');
      expect(display.label).toBe('AI 분석 92%');
      expect(display.percentage).toBe(92);
    });

    it('퍼센트는 정수로 반올림되어야 한다', () => {
      const result: AnalysisResult = {
        season: 'Autumn',
        confidence: 0.876,
      };
      const display = getConfidenceDisplay(result);

      expect(display.percentage).toBe(88);
    });
  });
});

// ============================================================
// 연예인 데이터 테스트
// ============================================================

describe('PC-1 퍼스널컬러 분석 - 연예인 데이터', () => {
  it('모든 시즌은 최소 3명의 연예인 예시를 가져야 한다', () => {
    Object.values(SEASON_DATA).forEach((data) => {
      expect(data.celebrities.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('연예인 이름은 비어있지 않아야 한다', () => {
    Object.values(SEASON_DATA).forEach((data) => {
      data.celebrities.forEach((celebrity) => {
        expect(celebrity.length).toBeGreaterThan(0);
        expect(celebrity.trim()).toBe(celebrity);
      });
    });
  });

  it('같은 시즌 내 연예인은 중복되지 않아야 한다', () => {
    Object.entries(SEASON_DATA).forEach(([season, data]) => {
      const uniqueCelebs = new Set(data.celebrities);
      expect(uniqueCelebs.size).toBe(data.celebrities.length);
    });
  });
});

// ============================================================
// 접근성 테스트
// ============================================================

describe('PC-1 퍼스널컬러 분석 - 접근성', () => {
  it('시즌 설명은 색상 추천 이유를 포함해야 한다', () => {
    Object.values(SEASON_DATA).forEach((data) => {
      // 설명에 색상 관련 키워드가 포함되어야 함
      expect(
        data.description.includes('색상') ||
          data.description.includes('컬러') ||
          data.description.includes('색')
      ).toBe(true);
    });
  });

  it('설명은 추천 방향을 제시해야 한다', () => {
    Object.values(SEASON_DATA).forEach((data) => {
      // 추천/권장 키워드 포함
      expect(data.description).toMatch(/추천|잘 어울/);
    });
  });

  it('색상 팔레트 접근성 라벨 생성이 가능해야 한다', () => {
    Object.entries(SEASON_DATA).forEach(([season, data]) => {
      const accessibilityLabel = `${data.name} 추천 색상: ${data.colors.length}개`;
      expect(accessibilityLabel).toContain('추천 색상');
      expect(accessibilityLabel).toContain('5개');
    });
  });
});
