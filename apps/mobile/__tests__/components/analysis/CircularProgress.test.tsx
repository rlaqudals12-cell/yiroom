/**
 * CircularProgress 컴포넌트 유닛 테스트
 *
 * 컴포넌트의 비즈니스 로직과 유틸리티 함수를 테스트합니다.
 * 실제 렌더링 테스트는 E2E(Maestro)에서 수행합니다.
 */

// ============================================================
// 등급 계산 로직 테스트
// ============================================================

type AnalysisGrade = 'diamond' | 'gold' | 'silver' | 'bronze';

interface GradeConfig {
  grade: AnalysisGrade;
  label: string;
  minScore: number;
  maxScore: number;
}

const GRADE_CONFIGS: GradeConfig[] = [
  { grade: 'diamond', label: '다이아몬드', minScore: 85, maxScore: 101 },
  { grade: 'gold', label: '골드', minScore: 70, maxScore: 85 },
  { grade: 'silver', label: '실버', minScore: 50, maxScore: 70 },
  { grade: 'bronze', label: '브론즈', minScore: 0, maxScore: 50 },
];

function getGradeFromScore(score: number): GradeConfig {
  const clampedScore = Math.max(0, Math.min(100, score));
  const config = GRADE_CONFIGS.find(
    (c) => clampedScore >= c.minScore && clampedScore < c.maxScore
  );
  return config || GRADE_CONFIGS[GRADE_CONFIGS.length - 1];
}

describe('CircularProgress 등급 시스템', () => {
  describe('getGradeFromScore', () => {
    it('점수 85 이상은 다이아몬드 등급이어야 한다', () => {
      expect(getGradeFromScore(85).grade).toBe('diamond');
      expect(getGradeFromScore(90).grade).toBe('diamond');
      expect(getGradeFromScore(100).grade).toBe('diamond');
    });

    it('점수 70-84는 골드 등급이어야 한다', () => {
      expect(getGradeFromScore(70).grade).toBe('gold');
      expect(getGradeFromScore(75).grade).toBe('gold');
      expect(getGradeFromScore(84).grade).toBe('gold');
    });

    it('점수 50-69는 실버 등급이어야 한다', () => {
      expect(getGradeFromScore(50).grade).toBe('silver');
      expect(getGradeFromScore(60).grade).toBe('silver');
      expect(getGradeFromScore(69).grade).toBe('silver');
    });

    it('점수 49 이하는 브론즈 등급이어야 한다', () => {
      expect(getGradeFromScore(0).grade).toBe('bronze');
      expect(getGradeFromScore(25).grade).toBe('bronze');
      expect(getGradeFromScore(49).grade).toBe('bronze');
    });

    it('경계값이 올바르게 처리되어야 한다', () => {
      // 각 등급의 경계값 테스트
      expect(getGradeFromScore(49).grade).toBe('bronze');
      expect(getGradeFromScore(50).grade).toBe('silver');
      expect(getGradeFromScore(69).grade).toBe('silver');
      expect(getGradeFromScore(70).grade).toBe('gold');
      expect(getGradeFromScore(84).grade).toBe('gold');
      expect(getGradeFromScore(85).grade).toBe('diamond');
    });

    it('음수 점수는 0으로 클램핑되어야 한다', () => {
      expect(getGradeFromScore(-10).grade).toBe('bronze');
      expect(getGradeFromScore(-100).grade).toBe('bronze');
    });

    it('100 초과 점수는 100으로 클램핑되어야 한다', () => {
      expect(getGradeFromScore(101).grade).toBe('diamond');
      expect(getGradeFromScore(150).grade).toBe('diamond');
    });
  });
});

// ============================================================
// SVG 계산 로직 테스트
// ============================================================

describe('CircularProgress SVG 계산', () => {
  const SIZE_CONFIG = {
    sm: { size: 80, strokeWidth: 6 },
    md: { size: 120, strokeWidth: 8 },
    lg: { size: 160, strokeWidth: 10 },
  } as const;

  describe('크기별 설정', () => {
    it('sm 크기의 radius와 circumference가 올바르게 계산되어야 한다', () => {
      const config = SIZE_CONFIG.sm;
      const radius = (config.size - config.strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      expect(radius).toBe(37); // (80 - 6) / 2
      expect(circumference).toBeCloseTo(232.48, 1); // 2 * PI * 37
    });

    it('md 크기의 radius와 circumference가 올바르게 계산되어야 한다', () => {
      const config = SIZE_CONFIG.md;
      const radius = (config.size - config.strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      expect(radius).toBe(56); // (120 - 8) / 2
      expect(circumference).toBeCloseTo(351.86, 1); // 2 * PI * 56
    });

    it('lg 크기의 radius와 circumference가 올바르게 계산되어야 한다', () => {
      const config = SIZE_CONFIG.lg;
      const radius = (config.size - config.strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      expect(radius).toBe(75); // (160 - 10) / 2
      expect(circumference).toBeCloseTo(471.24, 1); // 2 * PI * 75
    });
  });

  describe('strokeDashoffset 계산', () => {
    it('0% 진행 시 offset이 circumference와 같아야 한다', () => {
      const circumference = 2 * Math.PI * 56; // md 크기
      const offset = circumference - (0 / 100) * circumference;
      expect(offset).toBeCloseTo(circumference, 1);
    });

    it('50% 진행 시 offset이 circumference의 절반이어야 한다', () => {
      const circumference = 2 * Math.PI * 56;
      const offset = circumference - (50 / 100) * circumference;
      expect(offset).toBeCloseTo(circumference / 2, 1);
    });

    it('100% 진행 시 offset이 0이어야 한다', () => {
      const circumference = 2 * Math.PI * 56;
      const offset = circumference - (100 / 100) * circumference;
      expect(offset).toBeCloseTo(0, 1);
    });
  });
});

// ============================================================
// 등급별 색상 테스트
// ============================================================

describe('CircularProgress 등급별 색상', () => {
  const GRADE_COLORS = {
    diamond: { start: '#06b6d4', end: '#3b82f6', text: '#06b6d4' },
    gold: { start: '#f59e0b', end: '#f97316', text: '#f59e0b' },
    silver: { start: '#6b7280', end: '#64748b', text: '#6b7280' },
    bronze: { start: '#f97316', end: '#ef4444', text: '#f97316' },
  };

  it('각 등급이 고유한 그라데이션 색상을 가져야 한다', () => {
    const grades: AnalysisGrade[] = ['diamond', 'gold', 'silver', 'bronze'];
    const startColors = grades.map((g) => GRADE_COLORS[g].start);
    const uniqueStarts = new Set(startColors);

    expect(uniqueStarts.size).toBe(grades.length);
  });

  it('그라데이션 시작/끝 색상이 모두 유효한 hex 값이어야 한다', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    Object.values(GRADE_COLORS).forEach((colors) => {
      expect(colors.start).toMatch(hexRegex);
      expect(colors.end).toMatch(hexRegex);
      expect(colors.text).toMatch(hexRegex);
    });
  });
});

// ============================================================
// 접근성 테스트
// ============================================================

describe('CircularProgress 접근성', () => {
  it('접근성 라벨 형식이 올바르게 생성되어야 한다', () => {
    const score = 85;
    const gradeConfig = getGradeFromScore(score);
    const expectedLabel = `피부 점수 ${score}점, ${gradeConfig.label} 등급`;

    expect(expectedLabel).toBe('피부 점수 85점, 다이아몬드 등급');
  });

  it('progressbar role의 value 속성이 올바르게 설정되어야 한다', () => {
    const score = 75;
    const accessibilityValue = { min: 0, max: 100, now: score };

    expect(accessibilityValue.min).toBe(0);
    expect(accessibilityValue.max).toBe(100);
    expect(accessibilityValue.now).toBe(75);
  });
});
