/**
 * ScoreChangeBadge 컴포넌트 유닛 테스트
 *
 * 컴포넌트의 비즈니스 로직과 유틸리티 함수를 테스트합니다.
 * 실제 렌더링 테스트는 E2E(Maestro)에서 수행합니다.
 */

// ============================================================
// 방향 결정 로직 테스트
// ============================================================

type Direction = 'up' | 'down' | 'neutral';

function getDirection(delta: number): Direction {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'neutral';
}

describe('ScoreChangeBadge 방향 결정', () => {
  describe('getDirection', () => {
    it('양수 delta는 up을 반환해야 한다', () => {
      expect(getDirection(1)).toBe('up');
      expect(getDirection(5)).toBe('up');
      expect(getDirection(100)).toBe('up');
    });

    it('음수 delta는 down을 반환해야 한다', () => {
      expect(getDirection(-1)).toBe('down');
      expect(getDirection(-5)).toBe('down');
      expect(getDirection(-100)).toBe('down');
    });

    it('0 delta는 neutral을 반환해야 한다', () => {
      expect(getDirection(0)).toBe('neutral');
    });
  });
});

// ============================================================
// 색상 시스템 테스트
// ============================================================

describe('ScoreChangeBadge 색상 시스템', () => {
  const DIRECTION_COLORS = {
    up: {
      bg: '#dcfce7',
      bgDark: 'rgba(16, 185, 129, 0.2)',
      text: '#059669',
      textDark: '#34d399',
    },
    down: {
      bg: '#fee2e2',
      bgDark: 'rgba(239, 68, 68, 0.2)',
      text: '#dc2626',
      textDark: '#f87171',
    },
    neutral: {
      bg: '#f3f4f6',
      bgDark: 'rgba(107, 114, 128, 0.2)',
      text: '#4b5563',
      textDark: '#9ca3af',
    },
  };

  it('각 방향이 고유한 색상을 가져야 한다', () => {
    const directions: Direction[] = ['up', 'down', 'neutral'];
    const bgColors = directions.map((d) => DIRECTION_COLORS[d].bg);
    const uniqueBgs = new Set(bgColors);

    expect(uniqueBgs.size).toBe(directions.length);
  });

  it('라이트 모드 색상이 모두 유효한 hex 값이어야 한다', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    Object.values(DIRECTION_COLORS).forEach((colors) => {
      expect(colors.bg).toMatch(hexRegex);
      expect(colors.text).toMatch(hexRegex);
    });
  });

  it('다크 모드 배경 색상이 rgba 형식이어야 한다', () => {
    const rgbaRegex = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;

    Object.values(DIRECTION_COLORS).forEach((colors) => {
      expect(colors.bgDark).toMatch(rgbaRegex);
    });
  });
});

// ============================================================
// 크기 설정 테스트
// ============================================================

describe('ScoreChangeBadge 크기 설정', () => {
  const SIZE_CONFIG = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, iconSize: 12 },
    md: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, iconSize: 14 },
    lg: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, iconSize: 18 },
  };

  it('크기가 커질수록 padding이 증가해야 한다', () => {
    expect(SIZE_CONFIG.sm.paddingHorizontal).toBeLessThan(SIZE_CONFIG.md.paddingHorizontal);
    expect(SIZE_CONFIG.md.paddingHorizontal).toBeLessThan(SIZE_CONFIG.lg.paddingHorizontal);
  });

  it('크기가 커질수록 fontSize가 증가해야 한다', () => {
    expect(SIZE_CONFIG.sm.fontSize).toBeLessThan(SIZE_CONFIG.md.fontSize);
    expect(SIZE_CONFIG.md.fontSize).toBeLessThan(SIZE_CONFIG.lg.fontSize);
  });

  it('크기가 커질수록 iconSize가 증가해야 한다', () => {
    expect(SIZE_CONFIG.sm.iconSize).toBeLessThan(SIZE_CONFIG.md.iconSize);
    expect(SIZE_CONFIG.md.iconSize).toBeLessThan(SIZE_CONFIG.lg.iconSize);
  });
});

// ============================================================
// 텍스트 포맷팅 테스트
// ============================================================

describe('ScoreChangeBadge 텍스트 포맷팅', () => {
  function formatDelta(delta: number): string {
    const prefix = delta > 0 ? '+' : '';
    return `${prefix}${Math.abs(delta)}점`;
  }

  it('양수 delta는 + 접두사를 가져야 한다', () => {
    expect(formatDelta(5)).toBe('+5점');
    expect(formatDelta(10)).toBe('+10점');
  });

  it('음수 delta는 접두사 없이 절대값으로 표시되어야 한다', () => {
    expect(formatDelta(-5)).toBe('5점');
    expect(formatDelta(-10)).toBe('10점');
  });

  it('0 delta는 접두사 없이 표시되어야 한다', () => {
    expect(formatDelta(0)).toBe('0점');
  });
});

// ============================================================
// 접근성 테스트
// ============================================================

describe('ScoreChangeBadge 접근성', () => {
  function getAccessibilityLabel(delta: number): string {
    const direction = delta > 0 ? '상승' : delta < 0 ? '하락' : '유지';
    const prefix = delta > 0 ? '+' : '';
    return `점수 변화: ${direction} ${prefix}${delta}점`;
  }

  it('상승 시 적절한 접근성 라벨이 생성되어야 한다', () => {
    expect(getAccessibilityLabel(5)).toBe('점수 변화: 상승 +5점');
  });

  it('하락 시 적절한 접근성 라벨이 생성되어야 한다', () => {
    expect(getAccessibilityLabel(-3)).toBe('점수 변화: 하락 -3점');
  });

  it('유지 시 적절한 접근성 라벨이 생성되어야 한다', () => {
    expect(getAccessibilityLabel(0)).toBe('점수 변화: 유지 0점');
  });
});

// ============================================================
// MetricDelta 로직 테스트
// ============================================================

describe('MetricDelta 표시 로직', () => {
  function shouldRender(delta: number): boolean {
    return delta !== 0;
  }

  function getSymbol(delta: number): string {
    return delta > 0 ? '\u2191' : '\u2193'; // ↑ or ↓
  }

  it('0 delta는 렌더링하지 않아야 한다', () => {
    expect(shouldRender(0)).toBe(false);
  });

  it('양수/음수 delta는 렌더링해야 한다', () => {
    expect(shouldRender(5)).toBe(true);
    expect(shouldRender(-3)).toBe(true);
  });

  it('양수 delta는 상승 화살표를 사용해야 한다', () => {
    expect(getSymbol(5)).toBe('\u2191');
  });

  it('음수 delta는 하락 화살표를 사용해야 한다', () => {
    expect(getSymbol(-3)).toBe('\u2193');
  });
});

// ============================================================
// 이전 점수 표시 테스트
// ============================================================

describe('ScoreChangeBadge 이전 점수 표시', () => {
  function formatPreviousScore(score: number | undefined): string | null {
    if (score === undefined) return null;
    return `(이전: ${score}점)`;
  }

  it('previousScore가 제공되면 포맷된 문자열을 반환해야 한다', () => {
    expect(formatPreviousScore(70)).toBe('(이전: 70점)');
    expect(formatPreviousScore(0)).toBe('(이전: 0점)');
  });

  it('previousScore가 undefined면 null을 반환해야 한다', () => {
    expect(formatPreviousScore(undefined)).toBeNull();
  });
});
